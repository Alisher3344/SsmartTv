(function () {
    const video = document.getElementById('video');
    const splash = document.getElementById('splash');
    const ctaBtn = document.getElementById('cta-start');
    const guide = document.getElementById('guide');
    const guideList = document.getElementById('guide-list');
    const guideCount = document.getElementById('guide-count');
    const topInfo = document.getElementById('top-info');
    const channelNum = document.getElementById('channel-num');
    const channelNameTop = document.getElementById('channel-name-top');
    const clock = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    const zapBanner = document.getElementById('zap-banner');
    const zapNum = document.getElementById('zap-num');
    const zapName = document.getElementById('zap-name');
    const zapCat = document.getElementById('zap-cat');
    const spinner = document.getElementById('spinner');
    const catTabsEl = document.getElementById('category-tabs');
    const catTabs = Array.from(catTabsEl.querySelectorAll('.cat-tab'));

    // Use the local fallback list synchronously; replaced by the live
    // iptv-org-backed list as soon as /api/channels resolves.
    let channelList = (typeof channels !== 'undefined') ? channels.slice() : [];

    let hls = null;
    let activeIndex = -1;
    let currentFilter = 'all';
    let filtered = channelList.slice();
    let focusMode = 'splash';   // splash | guide | tabs | player
    let guideFocusIndex = 0;
    let tabFocusIndex = 0;
    let guideOpen = false;
    let topInfoTimer = null;
    let zapTimer = null;
    let numberBuffer = '';
    let numberTimer = null;

    /* ---------- Clock & Date ---------- */
    const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
    const days = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];

    function updateClock() {
        const d = new Date();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        clock.textContent = `${hh}:${mm}`;
        dateEl.textContent = `${days[d.getDay()]} • ${d.getDate()} ${months[d.getMonth()]}`;
    }
    updateClock();
    setInterval(updateClock, 30000);

    /* ---------- Filtering ---------- */
    function applyFilter() {
        filtered = currentFilter === 'all'
            ? channelList.slice()
            : channelList.filter(c => c.category === currentFilter);
        if (guideFocusIndex >= filtered.length) guideFocusIndex = Math.max(0, filtered.length - 1);
        guideCount.textContent = filtered.length;
        renderGuide();
    }

    function renderGuide() {
        guideList.innerHTML = '';
        if (filtered.length === 0) {
            guideList.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-muted)">Kanal topilmadi</div>';
            return;
        }
        filtered.forEach((ch, i) => {
            const realIndex = channelList.indexOf(ch);
            const item = document.createElement('div');
            item.className = 'guide-item';
            if (i === guideFocusIndex && focusMode === 'guide') item.classList.add('focused');
            if (realIndex === activeIndex) item.classList.add('playing');
            item.dataset.index = i;

            const num = String(realIndex + 1).padStart(2, '0');
            const logoHtml = ch.logo
                ? `<img src="${ch.logo}" alt="" onerror="this.outerHTML='<span class=\\'guide-logo-text\\'>${ch.initials}</span>'">`
                : `<span class="guide-logo-text">${ch.initials}</span>`;

            item.innerHTML = `
                <div class="guide-num">${num}</div>
                <div class="guide-logo">${logoHtml}</div>
                <div class="guide-meta">
                    <div class="guide-name">${ch.name}</div>
                    <div class="guide-cat">${ch.categoryLabel}</div>
                </div>
            `;

            item.addEventListener('click', () => {
                guideFocusIndex = i;
                playChannel(realIndex);
                closeGuide();
            });
            item.addEventListener('mouseenter', () => {
                if (focusMode === 'guide') {
                    guideFocusIndex = i;
                    updateFocusVisuals();
                }
            });

            guideList.appendChild(item);
        });
        scrollFocusedIntoView();
    }

    function updateTabsVisual() {
        catTabs.forEach((t, i) => {
            t.classList.toggle('focused', focusMode === 'tabs' && i === tabFocusIndex);
            t.classList.toggle('active', t.dataset.cat === currentFilter);
        });
    }

    function updateFocusVisuals() {
        Array.from(guideList.children).forEach((el, i) => {
            el.classList.toggle('focused', focusMode === 'guide' && i === guideFocusIndex);
        });
        updateTabsVisual();
        scrollFocusedIntoView();
    }

    function scrollFocusedIntoView() {
        const el = guideList.children[guideFocusIndex];
        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    /* ---------- Player ---------- */
    function playChannel(idx) {
        if (idx < 0 || idx >= channelList.length) return;
        const ch = channelList[idx];
        activeIndex = idx;

        hideSplash();
        spinner.classList.add('active');

        channelNum.textContent = String(idx + 1).padStart(2, '0');
        channelNameTop.textContent = ch.name;
        showTopInfo();
        showZap(ch, idx);

        if (hls) { hls.destroy(); hls = null; }

        // Route streams through our backend proxy. Most Uzbek CDNs
        // (cinerama.uz, biztv.media, my5.media) reject browser Origin
        // headers and redirect to /blocked/. The server fetches the
        // stream Origin-less and re-streams it with open CORS.
        const streamUrl = '/proxy?url=' + encodeURIComponent(ch.url);

        if (Hls.isSupported()) {
            hls = new Hls({
                lowLatencyMode: true,
                enableWorker: true,
                maxBufferLength: 30
            });
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.muted = false;
                video.play().catch(() => {
                    video.muted = true;
                    video.play().catch(() => {});
                });
                spinner.classList.remove('active');
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    spinner.classList.remove('active');
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
                    else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(() => {});
                spinner.classList.remove('active');
            }, { once: true });
        }

        renderGuide();
    }

    function nextChannel(delta) {
        if (channelList.length === 0) return;
        let next = activeIndex < 0
            ? 0
            : (activeIndex + delta + channelList.length) % channelList.length;
        playChannel(next);
    }

    /* ---------- Overlays ---------- */
    function showTopInfo() {
        topInfo.classList.remove('hidden');
        clearTimeout(topInfoTimer);
        topInfoTimer = setTimeout(() => topInfo.classList.add('hidden'), 5000);
    }

    function showZap(ch, idx) {
        zapNum.textContent = String(idx + 1).padStart(2, '0');
        zapName.textContent = ch.name;
        zapCat.textContent = ch.categoryLabel;
        zapBanner.classList.add('show');
        clearTimeout(zapTimer);
        zapTimer = setTimeout(() => zapBanner.classList.remove('show'), 3500);
    }

    function hideSplash() {
        if (!splash.classList.contains('hidden')) {
            splash.classList.add('hidden');
            if (focusMode === 'splash') focusMode = 'player';
        }
    }

    function openGuide() {
        guideOpen = true;
        guide.classList.add('open');
        focusMode = 'guide';
        if (activeIndex >= 0) {
            const i = filtered.indexOf(channelList[activeIndex]);
            if (i >= 0) guideFocusIndex = i;
        }
        updateFocusVisuals();
    }

    function closeGuide() {
        guideOpen = false;
        guide.classList.remove('open');
        focusMode = activeIndex >= 0 ? 'player' : 'splash';
        if (focusMode === 'splash') splash.classList.remove('hidden');
        updateFocusVisuals();
    }

    function switchCategory(delta) {
        tabFocusIndex = (tabFocusIndex + delta + catTabs.length) % catTabs.length;
        currentFilter = catTabs[tabFocusIndex].dataset.cat;
        guideFocusIndex = 0;
        applyFilter();
        updateTabsVisual();
    }

    /* ---------- Number input ---------- */
    function handleNumber(digit) {
        numberBuffer += digit;
        zapNum.textContent = numberBuffer.padStart(2, '0');
        zapName.textContent = 'Kanal raqami...';
        zapCat.textContent = '';
        zapBanner.classList.add('show');

        clearTimeout(numberTimer);
        numberTimer = setTimeout(() => {
            const n = parseInt(numberBuffer, 10);
            numberBuffer = '';
            if (n >= 1 && n <= channelList.length) {
                playChannel(n - 1);
            } else {
                zapBanner.classList.remove('show');
            }
        }, 1200);
    }

    /* ---------- CTA button ---------- */
    function startWatching() {
        if (activeIndex < 0) {
            playChannel(0);
        } else {
            hideSplash();
        }
    }

    ctaBtn.addEventListener('click', startWatching);

    /* ---------- Keyboard ---------- */
    document.addEventListener('keydown', (e) => {
        const key = e.key;

        if (/^[0-9]$/.test(key)) {
            e.preventDefault();
            hideSplash();
            handleNumber(key);
            return;
        }

        if (focusMode === 'splash') {
            if (key === 'Enter' || key === ' ') {
                e.preventDefault();
                startWatching();
            } else if (key === 'ArrowDown' || key === 'ArrowUp') {
                e.preventDefault();
                startWatching();
            }
            return;
        }

        if (guideOpen) {
            switch (key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (filtered.length) {
                        guideFocusIndex = (guideFocusIndex - 1 + filtered.length) % filtered.length;
                        updateFocusVisuals();
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (filtered.length) {
                        guideFocusIndex = (guideFocusIndex + 1) % filtered.length;
                        updateFocusVisuals();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    switchCategory(-1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    switchCategory(1);
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (filtered[guideFocusIndex]) {
                        playChannel(channelList.indexOf(filtered[guideFocusIndex]));
                        closeGuide();
                    }
                    break;
                case 'Escape':
                case 'Backspace':
                case 'BrowserBack':
                    e.preventDefault();
                    closeGuide();
                    break;
            }
        } else {
            switch (key) {
                case 'ArrowUp':
                case 'PageUp':
                    e.preventDefault();
                    nextChannel(-1);
                    break;
                case 'ArrowDown':
                case 'PageDown':
                    e.preventDefault();
                    nextChannel(1);
                    break;
                case 'Enter':
                case ' ':
                case 'ContextMenu':
                    e.preventDefault();
                    openGuide();
                    break;
                case 'm':
                case 'M':
                    video.muted = !video.muted;
                    break;
                case 'f':
                case 'F':
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen?.();
                    } else {
                        document.exitFullscreen?.();
                    }
                    break;
                case 'i':
                case 'I':
                    showTopInfo();
                    break;
            }
        }
    });

    video.addEventListener('waiting', () => spinner.classList.add('active'));
    video.addEventListener('playing', () => spinner.classList.remove('active'));
    video.addEventListener('canplay', () => spinner.classList.remove('active'));

    video.addEventListener('click', () => { if (!guideOpen) openGuide(); });
    splash.addEventListener('click', (e) => {
        if (e.target === splash) startWatching();
    });

    applyFilter();
    updateTabsVisual();

    /* ---------- Live channel list from server ---------- */
    // Backend pulls from iptv-org's UZ playlist (refreshed hourly).
    // Frontend just consumes JSON; the embedded channels.js stays as
    // an offline fallback if the API is unreachable.
    fetch('/api/channels')
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                channelList = data;
                applyFilter();
                console.log(`[ssmarttv] loaded ${data.length} channels from /api/channels`);
            }
        })
        .catch(err => console.warn('[ssmarttv] /api/channels failed, using fallback:', err));
})();
