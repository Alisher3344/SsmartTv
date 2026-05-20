#!/usr/bin/env python3
"""SmartTV UZ — static file + HLS proxy server.

Why a proxy?
  cinerama.uz (and similar Uzbek IPTV CDNs) reject requests where the
  Origin header points outside their whitelisted domains by redirecting
  to /blocked/index.m3u8 (a "you are blocked" placeholder).
  Browsers always send Origin on cross-origin XHR/fetch, so direct
  playback fails. This server fetches the stream server-to-server with
  no Origin header and re-streams it to the browser with CORS open.

Endpoints:
  /                static files from ./
  /proxy?url=...   proxied HLS playlist or TS segment
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import urllib.error
import os
import sys
import re
import json
import time
import threading

PORT = 8765
ROOT = os.path.dirname(os.path.abspath(__file__))
USER_AGENT = ("Mozilla/5.0 (SmartTV) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")

# We pull from TWO public sources and merge by URL:
#   1) iptv-org maintains the canonical UZ playlist with health checks.
#   2) smolnp/IPTVru is a Russian aggregator that happens to include
#      ~23 extra international channels hosted on the same Uzbek CDNs
#      (Nat Geo, Euronews, Duck TV, Dom Kino, etc.) which iptv-org omits.
PLAYLIST_SOURCES = [
    "https://iptv-org.github.io/iptv/countries/uz.m3u",
    "https://raw.githubusercontent.com/smolnp/IPTVru/master/IPTVru.m3u",
]

# When pulling from a multi-country playlist, only keep streams whose
# URL is hosted on a known Uzbek CDN.
UZ_CDN_MARKERS = (
    'cinerama.uz',
    'biztv.media',
    'biztv.uz',
    'my5.media',
    'uzdigital',
    'stream8',
    'stream.uz',
)

CHANNELS_CACHE_TTL = 3600  # 1 hour
_channels_cache = {'data': None, 'ts': 0}
_channels_lock = threading.Lock()

# Heuristic name-based categorizer (English/Uzbek/Russian keywords →
# our 4 UI categories). The label is shown in the channel guide.
KEYWORDS = [
    ('news',          'Yangiliklar',  ('news', '24', 'uzreport', 'euronews', 'новост', 'информ')),
    ('kids',          'Bolalar',      ('bolajon', 'kids', 'baby', 'мульт', 'duck tv', 'детск', 'cartoon', 'рыжий', 'капитан')),
    ('music',         'Musiqa',       ('music', 'мuzika', 'navo', 'ftv', 'муз', 'music')),
    ('entertainment', 'Kino',         ('cinema', 'kino', 'movie', 'hollywood', 'дом кино', 'film')),
    ('entertainment', 'Hujjatli',     ('nat geo', 'national geographic', 'insight', 'discovery', 'animal', 'животн', 'планета', 'охот', 'рыбалк', 'усадьб', 'наша сибирь', 'космич', 'auto', 'авто', 'техно')),
    ('entertainment', 'Sport',        ('sport', 'спорт', 'futbol', 'goal')),
]

# Map iptv-org's English group-title values to our Uzbek categories
# (used when the channel comes from a properly-tagged source).
GROUP_TO_CATEGORY = {
    'News':          ('news', 'Yangiliklar'),
    'General':       ('entertainment', 'Umumiy'),
    'Entertainment': ('entertainment', "Ko'ngilochar"),
    'Movies':        ('entertainment', 'Kino'),
    'Kids':          ('kids', 'Bolalar'),
    'Music':         ('music', 'Musiqa'),
    'Religious':     ('entertainment', 'Diniy'),
    'Culture':       ('entertainment', 'Madaniyat'),
    'Education':     ('news', 'Talim'),
    'Lifestyle':     ('entertainment', 'Hayot tarzi'),
    'Documentary':   ('entertainment', 'Hujjatli'),
    'Sports':        ('entertainment', 'Sport'),
    'Undefined':     ('entertainment', 'Boshqa'),
}


def categorize(name: str, group: str):
    """Pick a (category, label) for a channel based on its tags + name."""
    if group and group in GROUP_TO_CATEGORY:
        return GROUP_TO_CATEGORY[group]
    n = name.lower()
    for cat, label, keywords in KEYWORDS:
        if any(kw in n for kw in keywords):
            return (cat, label)
    return ('entertainment', 'Boshqa')


def parse_m3u(text: str, uz_only: bool = False):
    """Parse an extended M3U playlist into channel dicts.

    uz_only=True keeps only entries whose stream URL is hosted on a
    known Uzbek CDN (used when pulling from multi-country playlists).
    """
    channels = []
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line.startswith('#EXTINF'):
            i += 1
            continue

        attrs = dict(re.findall(r'([\w-]+)="([^"]*)"', line))
        name_match = re.search(r',(.+)$', line)
        name = name_match.group(1).strip() if name_match else 'Unknown'
        display_name = re.sub(r'\s*\((?:\d+[pi]|HD|SD|FHD|UHD|4K)\)\s*$', '', name).strip()

        # Walk forward to the first non-comment line — that's the URL.
        url = None
        j = i + 1
        while j < len(lines):
            cand = lines[j].strip()
            if cand and not cand.startswith('#'):
                url = cand
                break
            j += 1

        if url and (not uz_only or any(m in url for m in UZ_CDN_MARKERS)):
            group = attrs.get('group-title', '')
            category, category_label = categorize(display_name, group)
            tvg_id = attrs.get('tvg-id', '') or display_name
            slug = re.sub(r'[^a-zA-Z0-9]+', '-', tvg_id).strip('-').lower() or 'ch'
            initials = ''.join(w[0] for w in re.findall(r'\w+', display_name))[:4].upper() or 'TV'

            channels.append({
                'id': slug,
                'name': display_name,
                'category': category,
                'categoryLabel': category_label,
                'logo': attrs.get('tvg-logo', ''),
                'url': url,
                'initials': initials,
            })
        i = j + 1 if url else i + 1
    return channels


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode('utf-8', errors='replace')


def get_channels(force=False):
    """Fetch + merge + cache the parsed channel list."""
    now = time.time()
    with _channels_lock:
        if (not force
                and _channels_cache['data']
                and (now - _channels_cache['ts']) < CHANNELS_CACHE_TTL):
            return _channels_cache['data']

        merged = []
        seen_urls = set()
        for idx, src in enumerate(PLAYLIST_SOURCES):
            try:
                text = fetch_text(src)
                # First source is the canonical UZ list — trust everything.
                # Subsequent sources are multi-country — UZ-CDN filter.
                parsed = parse_m3u(text, uz_only=(idx > 0))
                added = 0
                for ch in parsed:
                    if ch['url'] in seen_urls:
                        continue
                    seen_urls.add(ch['url'])
                    merged.append(ch)
                    added += 1
                print(f"[smarttv] {src.split('/')[-1]}: +{added} kanal")
            except Exception as e:
                print(f"[smarttv] fetch failed for {src}: {e}")

        if merged:
            merged.sort(key=lambda c: (c['category'], c['name'].lower()))
            _channels_cache['data'] = merged
            _channels_cache['ts'] = now
            print(f"[smarttv] jami: {len(merged)} kanal")
            return merged

        return _channels_cache['data'] or []


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        if self.path.startswith('/proxy'):
            self.handle_proxy()
        elif self.path.startswith('/api/channels'):
            self.handle_channels()
        else:
            super().do_GET()

    def handle_channels(self):
        force = 'refresh' in self.path
        channels = get_channels(force=force)
        body = json.dumps(channels, ensure_ascii=False).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'public, max-age=300')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_HEAD(self):
        if self.path.startswith('/proxy'):
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
        else:
            super().do_HEAD()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def handle_proxy(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        target = params.get('url', [None])[0]
        if not target:
            self.send_error(400, "Missing 'url' query parameter")
            return

        upstream_host = urllib.parse.urlparse(target).netloc
        headers = {
            'User-Agent': USER_AGENT,
            'Accept': '*/*',
            'Referer': f'https://{upstream_host}/',
        }
        # Forward Range header (TS segments may use byte-range requests)
        if 'Range' in self.headers:
            headers['Range'] = self.headers['Range']

        try:
            req = urllib.request.Request(target, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as upstream:
                status = upstream.status
                content_type = upstream.headers.get('Content-Type', 'application/octet-stream')
                final_url = upstream.geturl()

                is_playlist = (
                    target.lower().endswith('.m3u8')
                    or 'mpegurl' in content_type.lower()
                    or 'm3u' in content_type.lower()
                )

                if is_playlist:
                    raw = upstream.read().decode('utf-8', errors='replace')
                    rewritten = self.rewrite_m3u8(raw, final_url)
                    body = rewritten.encode('utf-8')
                    self.send_response(status)
                    self.send_header('Content-Type', 'application/vnd.apple.mpegurl')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Cache-Control', 'no-cache')
                    self.send_header('Content-Length', str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                    return

                # Non-playlist (TS segment, key, etc.) — stream binary through.
                self.send_response(status)
                self.send_header('Content-Type', content_type)
                self.send_header('Access-Control-Allow-Origin', '*')
                for h in ('Content-Length', 'Content-Range', 'Accept-Ranges'):
                    val = upstream.headers.get(h)
                    if val:
                        self.send_header(h, val)
                self.end_headers()

                while True:
                    chunk = upstream.read(64 * 1024)
                    if not chunk:
                        break
                    try:
                        self.wfile.write(chunk)
                    except (BrokenPipeError, ConnectionResetError):
                        return

        except urllib.error.HTTPError as e:
            self.send_error(e.code, f"Upstream HTTP {e.code}: {e.reason}")
        except Exception as e:
            self.send_error(502, f"Upstream error: {e}")

    def rewrite_m3u8(self, content: str, base_url: str) -> str:
        """Rewrite every URL reference inside an HLS playlist so it
        also flows through /proxy. Handles relative + absolute URLs,
        and URI="..." attributes (EXT-X-KEY, EXT-X-MAP, etc.).
        """
        base = base_url.rsplit('/', 1)[0] + '/'

        def to_proxy(url: str) -> str:
            if not (url.startswith('http://') or url.startswith('https://')):
                url = urllib.parse.urljoin(base, url)
            return '/proxy?url=' + urllib.parse.quote(url, safe='')

        out_lines = []
        uri_re = re.compile(r'URI="([^"]+)"')

        for line in content.splitlines():
            stripped = line.strip()
            if not stripped:
                out_lines.append(line)
                continue
            if stripped.startswith('#'):
                # Rewrite URI="..." attributes (used by EXT-X-KEY, EXT-X-MAP, EXT-X-MEDIA)
                rewritten = uri_re.sub(lambda m: f'URI="{to_proxy(m.group(1))}"', line)
                out_lines.append(rewritten)
            else:
                out_lines.append(to_proxy(stripped))

        return '\n'.join(out_lines) + '\n'

    def log_message(self, fmt, *args):
        sys.stderr.write(f"[smarttv] {self.address_string()} - {fmt % args}\n")


class ThreadedServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == '__main__':
    with ThreadedServer(('', PORT), ProxyHandler) as httpd:
        print(f"SmartTV server: http://localhost:{PORT}/")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nTo'xtatildi.")
