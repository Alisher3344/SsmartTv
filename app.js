(function () {
    const video = document.getElementById('video');
    const splash = document.getElementById('splash');
    const guide = document.getElementById('guide');
    const guideList = document.getElementById('guide-list');
    const topInfo = document.getElementById('top-info');
    const channelNum = document.getElementById('channel-num');
    const channelNameTop = document.getElementById('channel-name-top');
    const clock = document.getElementById('clock');
    const zapBanner = document.getElementById('zap-banner');
    const zapNum = document.getElementById('zap-num');
    const zapName = document.getElementById('zap-name');
    const zapCat = document.getElementById('zap-cat');
    const spinner = document.getElementById('spinner');
    const catTabsEl = document.getElementById('category-tabs');
    const catTabs = Array.from(catTabsEl.querySelectorAll('.cat-tab'));

    let hls = null;
    let activeIndex = -1;            // index in `channels` of currently playing
    let currentFilter = 'all';
    let filtered = channels.slice();

    // Focus state — what the d-pad is on
    // mode: 'guide' (in channel list) | 'tabs' (in categories) | 'player' (no overlay)
    let focusMode = 'player';
    let guideFocusIndex = 0;          // index in `filtered`
    let tabFocusIndex = 0;

    let guideOpen = false;
    let topInfoTimer = null;
    let zapTimer = null;
    let numberBuffer = '';
    let numberTimer = null;

    /* ---------- Clock ---------- */
    function updateClock() {
        const d = new Date();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        clock.textContent = `${hh}:${mm}`;
    }
    updateClock();
    setInterval(updateClock, 30000);

    /* ---------- Rendering ---------- */
    function applyFilter() {
        filtered = currentFilter === 'all'
            ? channels.slice()
            : channels.filter(c => c.category === currentFilter);

        if (guideFocusIndex >= filtered.length) guideFocusIndex = Math.max(0, filtered.length - 1);
        renderGuide();
    }

    function renderGuide() {
        guideList.innerHTML = '';
        filtered.forEach((ch, i) => {
            const realIndex = channels.indexOf(ch);
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
        if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /* ---------- Player ---------- */
    function playChannel(idx) {
        if (idx < 0 || idx >= channels.length) return;
        const ch = channels[idx];
        activeIndex = idx;

        splash.classList.add('hidden');
        spinner.classList.add('active');

        channelNum.textContent = String(idx + 1).padStart(2, '0');
        channelNameTop.textContent = ch.name;
        showTopInfo();
        showZap(ch, idx);

        if (hls) { hls.destroy(); hls = null; }

        if (Hls.isSupported()) {
            hls = new Hls({
                lowLatencyMode: true,
                enableWorker: true,
                maxBufferLength: 30
            });
            hls.loadSource(ch.url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.muted = false;
                video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
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
            video.src = ch.url;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(() => {});
                spinner.classList.remove('active');
            }, { once: true });
        }

        renderGuide();
    }

    function nextChannel(delta) {
        if (channels.length === 0) return;
        let next;
        if (activeIndex < 0) {
            next = 0;
        } else {
            next = (activeIndex + delta + channels.length) % channels.length;
        }
        playChannel(next);
    }

    /* ---------- UI overlays ---------- */
    function showTopInfo() {
        topInfo.classList.remove('hidden');
        clearTimeout(topInfoTimer);
        topInfoTimer = setTimeout(() => topInfo.classList.add('hidden'), 4000);
    }

    function showZap(ch, idx) {
        zapNum.textContent = String(idx + 1).padStart(2, '0');
        zapName.textContent = ch.name;
        zapCat.textContent = ch.categoryLabel;
        zapBanner.classList.add('show');
        clearTimeout(zapTimer);
        zapTimer = setTimeout(() => zapBanner.classList.remove('show'), 3000);
    }

    function openGuide() {
        guideOpen = true;
        guide.classList.add('open');
        focusMode = 'guide';
        // Snap focus to currently playing channel if visible
        if (activeIndex >= 0) {
            const i = filtered.indexOf(channels[activeIndex]);
            if (i >= 0) guideFocusIndex = i;
        }
        updateFocusVisuals();
    }

    function closeGuide() {
        guideOpen = false;
        guide.classList.remove('open');
        focusMode = 'player';
        updateFocusVisuals();
    }

    function toggleGuide() {
        if (guideOpen) closeGuide();
        else openGuide();
    }

    function switchCategory(delta) {
        tabFocusIndex = (tabFocusIndex + delta + catTabs.length) % catTabs.length;
        currentFilter = catTabs[tabFocusIndex].dataset.cat;
        guideFocusIndex = 0;
        applyFilter();
        updateTabsVisual();
    }

    /* ---------- Number input (multi-digit channel) ---------- */
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
            if (n >= 1 && n <= channels.length) {
                playChannel(n - 1);
            } else {
                zapBanner.classList.remove('show');
            }
        }, 1200);
    }

    /* ---------- Keyboard / d-pad ---------- */
    document.addEventListener('keydown', (e) => {
        const key = e.key;

        // Number keys 0-9
        if (/^[0-9]$/.test(key)) {
            e.preventDefault();
            handleNumber(key);
            return;
        }

        if (guideOpen) {
            switch (key) {
                case 'ArrowUp':
                    e.preventDefault();
                    guideFocusIndex = (guideFocusIndex - 1 + filtered.length) % filtered.length;
                    updateFocusVisuals();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    guideFocusIndex = (guideFocusIndex + 1) % filtered.length;
                    updateFocusVisuals();
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
                        playChannel(channels.indexOf(filtered[guideFocusIndex]));
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
            // Player mode
            switch (key) {
                case 'ArrowUp':
                    e.preventDefault();
                    nextChannel(-1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    nextChannel(1);
                    break;
                case 'Enter':
                case ' ':
                case 'ContextMenu':
                    e.preventDefault();
                    openGuide();
                    break;
                case 'PageUp':
                    e.preventDefault();
                    nextChannel(-1);
                    break;
                case 'PageDown':
                    e.preventDefault();
                    nextChannel(1);
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

    /* ---------- Loading state ---------- */
    video.addEventListener('waiting', () => spinner.classList.add('active'));
    video.addEventListener('playing', () => spinner.classList.remove('active'));
    video.addEventListener('canplay', () => spinner.classList.remove('active'));

    // Click on video toggles guide (for touch/mouse fallback)
    video.addEventListener('click', () => toggleGuide());
    splash.addEventListener('click', () => openGuide());

    /* ---------- Init ---------- */
    applyFilter();
    updateTabsVisual();
})();
