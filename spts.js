(function() {
    'use strict';

    const CONFIG = {
        email: 'af02cbe99149c37059b8327b329a776c',
        developerName: 'SP Team Studio',
        shortName: 'SPTS',
        triggerText: '@dev_sp',
        tickerBaseText: '✦ Slow website? ✦ No leads? ✦ Outdated design? ✦ We fix it fast ✦ KSH 1000/month',
        stripFile: 'strip.txt',
        tickerDwellMs: 4000,
        tickerSpeed: 22,
        analytics: true,
        debugMode: false,
        cacheBusting: true,
        footerWatchInterval: 3000,
    };

    const HACKER = {
        bg: '#0a0818',
        fg: '#e0e0e0',
        accent: '#38bdf8',
        isDark: true,
    };

    const state = {
        isOpen: false,
        isFormVisible: false,
        stripLoaded: false,
        dwellTimer: null,
        deviceType: 'desktop',
        lastFooterBg: null,
        footerWatchTimer: null,
    };

    function parseColor(color) {
        if (!color) return null;
        const match = color.match(/rgba?\(([^)]+)\)/);
        if (!match) return null;
        const parts = match[1].split(',').map(Number);
        return parts.length >= 3 ? parts : null;
    }

    function luminance(rgb) {
        if (!rgb) return 0;
        const [r, g, b] = rgb.map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function isColorDark(rgb) {
        return luminance(rgb) < 0.5;
    }

    function detectFooterBg() {
        const selectors = [
            'footer', '.footer', '[role="contentinfo"]',
            '.site-footer', '#footer', '.page-footer',
            '.main-footer', 'body > *:last-child'
        ];
        let footer = null;
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) { footer = el; break; }
        }
        if (!footer) return null;

        try {
            const styles = getComputedStyle(footer);
            let bg = styles.backgroundColor;

            if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
                let parent = footer.parentElement;
                while (parent) {
                    const pStyles = getComputedStyle(parent);
                    const pBg = pStyles.backgroundColor;
                    if (pBg && pBg !== 'transparent' && pBg !== 'rgba(0, 0, 0, 0)') {
                        bg = pBg;
                        break;
                    }
                    parent = parent.parentElement;
                }
            }

            const rgb = parseColor(bg);
            if (!rgb) return null;

            return {
                bg: bg,
                isDark: isColorDark(rgb),
            };
        } catch (_) {
            return null;
        }
    }

    // ===== MAIN FIX: Apply strip with subtle footer illusion =====
    function applyStripTheme(footerBg) {
        const stripRow = document.getElementById('sptsStripRow');
        if (!stripRow) return;

        // Start with hacker dark background
        let finalBg = HACKER.bg;

        // If footer exists, blend it subtly (15% footer, 85% hacker)
        if (footerBg) {
            const rgb = parseColor(footerBg.bg);
            if (rgb) {
                const [r, g, b] = rgb;
                // Blend: 85% hacker dark (10,8,24) + 15% footer color
                const blendR = Math.round(10 + (r - 10) * 0.15);
                const blendG = Math.round(8 + (g - 8) * 0.15);
                const blendB = Math.round(24 + (b - 24) * 0.15);
                finalBg = `rgb(${blendR}, ${blendG}, ${blendB})`;
            }
        }

        // Hacker colors (never change)
        const fg = HACKER.fg; // '#e0e0e0'
        const accent = HACKER.accent; // '#38bdf8'

        // Apply to strip
        stripRow.style.setProperty('--spts-fg', fg);
        stripRow.style.setProperty('--spts-accent', accent);
        stripRow.style.background = finalBg;
        stripRow.style.border = '1px solid #2a2354';
        stripRow.style.borderRadius = '6px';
        stripRow.style.padding = '6px 12px';
        stripRow.style.boxSizing = 'border-box';

        // Ticker wrap
        const tickerWrap = document.getElementById('sptsTickerWrap');
        if (tickerWrap) {
            tickerWrap.style.background = 'rgba(255,255,255,0.06)';
            tickerWrap.style.borderRadius = '4px';
        }
    }

    // ===== Watch for footer changes =====
    function startFooterWatcher() {
        const initial = detectFooterBg();
        state.lastFooterBg = initial ? initial.bg : null;
        applyStripTheme(initial);

        if (state.footerWatchTimer) clearInterval(state.footerWatchTimer);
        state.footerWatchTimer = setInterval(() => {
            const current = detectFooterBg();
            const currentBg = current ? current.bg : null;
            if (currentBg !== state.lastFooterBg) {
                state.lastFooterBg = currentBg;
                applyStripTheme(current);
            }
        }, CONFIG.footerWatchInterval);
    }

    function buildStyles() {
        return `
            .spts-strip-row {
                --spts-fg: #e0e0e0;
                --spts-accent: #38bdf8;
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                box-sizing: border-box;
                flex-wrap: nowrap;
                font-family: 'Courier New', 'Fira Code', monospace;
                font-size: 0.75rem;
                transition: background 0.3s;
            }
            .spts-strip-row .spts-trigger {
                display: inline-flex;
                align-items: center;
                flex-shrink: 0;
                white-space: nowrap;
                font-size: 0.7rem;
                font-weight: 500;
                letter-spacing: 0.03em;
                color: var(--spts-fg);
                text-decoration: underline;
                text-decoration-style: dotted;
                text-decoration-color: color-mix(in srgb, var(--spts-fg) 45%, transparent);
                text-underline-offset: 4px;
                opacity: 0.85;
                cursor: pointer;
                transition: all 0.25s ease;
                background: none;
                border: none;
                padding: 2px 6px;
            }
            .spts-strip-row .spts-trigger:hover {
                color: var(--spts-accent);
                opacity: 1;
                text-decoration-color: var(--spts-accent);
            }
            .spts-strip-row .spts-ticker-wrap {
                display: block;
                flex: 1 1 auto;
                min-width: 0;
                overflow: hidden;
                white-space: nowrap;
                padding: 2px 10px;
                margin: 0;
                position: relative;
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.3s;
            }
            .spts-strip-row .spts-ticker-wrap:hover {
                background: rgba(255,255,255,0.12) !important;
            }
            .spts-strip-row .spts-ticker-track {
                display: inline-flex;
                white-space: nowrap;
                will-change: transform;
                animation: sptsTickerScroll 30s linear infinite;
            }
            .spts-strip-row .spts-ticker-content {
                display: inline-block;
                padding-right: 30px;
                font-size: 0.65rem;
                letter-spacing: 0.02em;
                color: var(--spts-fg);
                opacity: 0.95;
            }
            .spts-strip-row .spts-ticker-content .spts-ticker-price {
                color: var(--spts-accent);
                font-weight: 600;
            }
            .spts-strip-row .spts-ticker-sep {
                color: color-mix(in srgb, var(--spts-fg) 45%, transparent);
                padding: 0 8px;
            }
            @keyframes sptsTickerScroll {
                from { transform: translateX(0); }
                to { transform: translateX(-50%); }
            }

            /* ===== typing + cursor animations (visual only) ===== */
            .spts-strip-row .spts-type-cursor {
                display: inline-block;
                width: 6px;
                height: 0.95em;
                background: var(--spts-accent);
                margin-left: 2px;
                vertical-align: text-bottom;
                animation: sptsCursorBlink 1s step-end infinite;
            }
            @keyframes sptsCursorBlink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
            }
            .spts-strip-row .spts-trigger .spts-type-text {
                white-space: pre;
            }
            .spts-strip-row .spts-ticker-wrap {
                clip-path: inset(0 100% 0 0);
                transition: clip-path 1.1s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .spts-strip-row .spts-ticker-wrap.spts-revealed {
                clip-path: inset(0 0 0 0);
            }
            @media (prefers-reduced-motion: reduce) {
                .spts-strip-row .spts-type-cursor { animation: none !important; }
                .spts-strip-row .spts-ticker-wrap { transition: none !important; clip-path: inset(0 0 0 0) !important; }
            }

            .spts-modal-overlay {
                position: fixed;
                inset: 0;
                width: 100%;
                height: 100%;
                background: rgba(4, 2, 12, 0.94);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: 'Courier New', 'Fira Code', monospace;
                padding: 20px;
                box-sizing: border-box;
                animation: sptsFadeIn 0.3s ease;
            }
            .spts-modal-overlay.active {
                display: flex;
            }
            .spts-modal-card {
                background: #0a0818;
                max-width: 520px;
                width: 100%;
                border-radius: 16px;
                padding: 40px 32px 32px;
                border: 1px solid #2a2354;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(56, 189, 248, 0.05);
                position: relative;
                transform: scale(0.95) translateY(10px);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
                opacity: 0;
                max-height: 90vh;
                overflow-y: auto;
            }
            .spts-modal-overlay.active .spts-modal-card {
                transform: scale(1) translateY(0);
                opacity: 1;
            }
            .spts-modal-card::before {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(135deg, rgba(56, 189, 248, 0.04), rgba(168, 85, 247, 0.04));
                border-radius: 16px;
                pointer-events: none;
            }
            .spts-modal-card .spts-welcome {
                position: relative;
                z-index: 2;
                margin-bottom: 24px;
                padding-bottom: 20px;
                border-bottom: 1px solid #2a2354;
            }
            .spts-modal-card .spts-welcome .spts-prompt {
                color: #4a3f80;
                font-size: 0.65rem;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                margin-bottom: 8px;
                font-weight: 600;
            }
            .spts-modal-card .spts-welcome .spts-prompt::before {
                content: '◆ ';
                color: #38bdf8;
            }
            .spts-modal-card .spts-welcome h2 {
                font-size: 1.4rem;
                font-weight: 600;
                color: #b0aee0;
                margin: 0 0 8px 0;
                letter-spacing: -0.02em;
            }
            .spts-modal-card .spts-welcome h2 .highlight {
                color: #38bdf8;
                position: relative;
            }
            .spts-modal-card .spts-welcome p {
                font-size: 0.85rem;
                color: #8a86b8;
                line-height: 1.6;
                margin: 0;
                font-weight: 400;
            }
            .spts-modal-card .spts-tagline {
                margin-top: 14px;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            .spts-modal-card .spts-tagline span {
                font-size: 0.6rem;
                color: #7a6ab0;
                border: 1px solid #2a2354;
                padding: 4px 14px;
                border-radius: 20px;
                letter-spacing: 0.03em;
                background: rgba(56, 189, 248, 0.04);
            }
            .spts-modal-card .spts-strip-toggle {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 16px;
                cursor: pointer;
                user-select: none;
            }
            .spts-modal-card .spts-strip-toggle input[type="checkbox"] {
                appearance: none;
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                flex-shrink: 0;
                border: 2px solid #2a2354;
                border-radius: 6px;
                background: #08061a;
                cursor: pointer;
                position: relative;
                transition: all 0.2s ease;
            }
            .spts-modal-card .spts-strip-toggle input[type="checkbox"]:checked {
                border-color: #38bdf8;
                background: #38bdf8;
            }
            .spts-modal-card .spts-strip-toggle input[type="checkbox"]:checked::after {
                content: '✓';
                position: absolute;
                top: -2px;
                left: 2px;
                font-size: 0.75rem;
                color: #0a0818;
            }
            .spts-modal-card .spts-strip-toggle label {
                font-size: 0.75rem;
                color: #8a86b8;
                cursor: pointer;
            }
            .spts-modal-card .spts-actions {
                display: flex;
                gap: 12px;
                margin: 20px 0 18px;
                position: relative;
                z-index: 2;
            }
            .spts-modal-card .spts-action-btn {
                flex: 1;
                padding: 14px 20px;
                border: 2px solid #2a2354;
                border-radius: 12px;
                font-family: inherit;
                font-size: 0.8rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                text-decoration: none;
                background: transparent;
                color: #8a86b8;
                letter-spacing: 0.02em;
            }
            .spts-modal-card .spts-action-btn:hover {
                border-color: #38bdf8;
                color: #38bdf8;
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(56, 189, 248, 0.12);
            }
            .spts-modal-card .spts-action-btn.primary {
                border-color: #38bdf8;
                color: #38bdf8;
                background: rgba(56, 189, 248, 0.04);
            }
            .spts-modal-card .spts-action-btn.primary:hover {
                background: rgba(56, 189, 248, 0.10);
            }
            .spts-modal-card .spts-form-container {
                display: none;
                position: relative;
                z-index: 2;
                margin-top: 4px;
                animation: sptsSlideUp 0.3s ease;
            }
            .spts-modal-card .spts-form-container.active {
                display: block;
            }
            @keyframes sptsSlideUp {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .spts-modal-card .spts-form-group {
                margin-bottom: 16px;
            }
            .spts-modal-card .spts-form-group label {
                display: block;
                font-size: 0.65rem;
                font-weight: 600;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: #6a5aa0;
                margin-bottom: 6px;
            }
            .spts-modal-card .spts-form-group input,
            .spts-modal-card .spts-form-group textarea {
                width: 100%;
                padding: 12px 16px;
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 400;
                color: #b0aee0;
                background: #08061a;
                border: 2px solid #2a2354;
                border-radius: 10px;
                transition: all 0.2s ease;
                outline: none;
                box-sizing: border-box;
                line-height: 1.4;
            }
            .spts-modal-card .spts-form-group input:focus,
            .spts-modal-card .spts-form-group textarea:focus {
                border-color: #38bdf8;
                box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.08);
            }
            .spts-modal-card .spts-form-group textarea {
                min-height: 80px;
                resize: vertical;
            }
            .spts-modal-card .spts-form-row {
                display: flex;
                gap: 12px;
            }
            .spts-modal-card .spts-form-row .spts-form-group {
                flex: 1;
            }
            .spts-modal-card .spts-submit-btn {
                width: 100%;
                padding: 14px;
                background: #38bdf8;
                border: none;
                border-radius: 12px;
                color: #0a0818;
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-top: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                letter-spacing: 0.02em;
            }
            .spts-modal-card .spts-submit-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 30px rgba(56, 189, 248, 0.25);
            }
            .spts-modal-card .spts-submit-btn:active {
                transform: translateY(0);
            }
            .spts-modal-card .spts-submit-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none !important;
            }
            .spts-modal-card .spts-close-btn {
                position: absolute;
                top: 12px;
                right: 16px;
                background: none;
                border: none;
                font-size: 1.2rem;
                color: #4a3f80;
                cursor: pointer;
                z-index: 5;
                padding: 8px;
                border-radius: 8px;
                transition: 0.2s;
                font-family: inherit;
                line-height: 1;
            }
            .spts-modal-card .spts-close-btn:hover {
                color: #38bdf8;
                background: rgba(56, 189, 248, 0.06);
            }
            .spts-modal-card .spts-back-link {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                margin-top: 14px;
                font-size: 0.75rem;
                color: #6a5aa0;
                cursor: pointer;
                background: none;
                border: none;
                font-family: inherit;
                padding: 6px 0;
                transition: 0.2s;
                letter-spacing: 0.02em;
            }
            .spts-modal-card .spts-back-link:hover {
                color: #38bdf8;
            }

            @media (max-width: 640px) {
                .spts-modal-card {
                    padding: 28px 20px 24px;
                    max-width: 100%;
                    margin: 10px;
                }
                .spts-modal-card .spts-actions {
                    flex-direction: column;
                }
                .spts-modal-card .spts-form-row {
                    flex-direction: column;
                    gap: 0;
                }
                .spts-modal-card .spts-welcome h2 {
                    font-size: 1.2rem;
                }
                .spts-strip-row {
                    flex-direction: row;
                    gap: 6px;
                    padding: 6px 8px !important;
                }
   .spts-strip-row .spts-ticker-wrap {
                    padding: 2px 8px;
                }
                .spts-strip-row .spts-trigger {
                    font-size: 0.65rem;
                }
                .spts-strip-row .spts-ticker-content {
                    font-size: 0.6rem;
                }
            }

            .spts-modal-card::-webkit-scrollbar {
                width: 4px;
            }
            .spts-modal-card::-webkit-scrollbar-track {
                background: transparent;
            }
            .spts-modal-card::-webkit-scrollbar-thumb {
                background: #2a2354;
                border-radius: 4px;
            }
            .spts-modal-card::-webkit-scrollbar-thumb:hover {
                background: #38bdf8;
            }

            @keyframes sptsFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .spts-hidden {
                display: none !important;
            }
        `;
    }

    let overlayRef = null;

    function buildUI() {
        const style = document.createElement('style');
        style.textContent = buildStyles();
        document.head.appendChild(style);

        const stripRow = createStripRow();
        insertStripRow(stripRow);

        const overlay = createModal();
        document.body.appendChild(overlay);
        overlayRef = overlay;

        const initialBg = detectFooterBg();
        applyStripTheme(initialBg);
        state.lastFooterBg = initialBg ? initialBg.bg : null;

        return { stripRow, overlay };
    }

    // ===== Visual-only typewriter helper (no effect on logic/state) =====
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function typeText(el, text, speed) {
        if (!el) return;
        if (prefersReducedMotion) { el.textContent = text; return; }
        speed = speed || 65;
        let i = 0;
        el.textContent = '';
        (function step() {
            el.textContent = text.slice(0, i);
            i++;
            if (i <= text.length) setTimeout(step, speed);
        })();
    }

    function createStripRow() {
        const stripRow = document.createElement('div');
        stripRow.className = 'spts-strip-row';
        stripRow.id = 'sptsStripRow';

        const trigger = document.createElement('button');
        trigger.className = 'spts-trigger';
        trigger.addEventListener('click', openModal);

        const triggerText = document.createElement('span');
        triggerText.className = 'spts-type-text';
        const triggerCursor = document.createElement('span');
        triggerCursor.className = 'spts-type-cursor';
        triggerCursor.setAttribute('aria-hidden', 'true');
        trigger.appendChild(triggerText);
        trigger.appendChild(triggerCursor);
        trigger.setAttribute('aria-label', CONFIG.triggerText + ' — open contact form');
        typeText(triggerText, CONFIG.triggerText, 65);

        const tickerWrap = document.createElement('div');
        tickerWrap.className = 'spts-ticker-wrap';
        tickerWrap.id = 'sptsTickerWrap';
        tickerWrap.setAttribute('role', 'button');
        tickerWrap.setAttribute('tabindex', '0');
        tickerWrap.setAttribute('aria-label', 'Open contact form');
        tickerWrap.innerHTML = `
            <div class="spts-ticker-track" id="sptsTickerTrack">
                <span class="spts-ticker-content" id="sptsTickerContentA"></span>
                <span class="spts-ticker-content" id="sptsTickerContentB"></span>
            </div>
        `;

        stripRow.appendChild(trigger);
        stripRow.appendChild(tickerWrap);
        return stripRow;
    }

    function insertStripRow(stripRow) {
        const footer = document.querySelector('footer, .footer, [role="contentinfo"]');
        if (footer) {
            footer.parentNode.insertBefore(stripRow, footer.nextSibling);
        } else {
            const mount = document.getElementById('widgetMountPoint');
            if (mount) mount.appendChild(stripRow);
            else document.body.appendChild(stripRow);
        }
    }

    function createModal() {
        const overlay = document.createElement('div');
        overlay.className = 'spts-modal-overlay';
        overlay.id = 'sptsModalOverlay';
        overlay.innerHTML = `
            <div class="spts-modal-card">
                <button class="spts-close-btn" id="sptsCloseModal" aria-label="Close form">✕</button>
                <div class="spts-welcome" id="sptsWelcome">
                    <div class="spts-prompt">${CONFIG.shortName} :: TERMINAL</div>
                    <h2><span class="highlight">${CONFIG.developerName}</span></h2>
                    <p>Professional Websites &amp; Digital Tools</p>
                    <p style="margin-top:6px; font-size:0.8rem; opacity:0.7;">
                        Modern, high-quality websites that build credibility and grow online.
                    </p>
                    <div class="spts-tagline">
                        <span>SEO Efficiency</span>
                        <span>Digital Tools</span>
                        <span>Hosting</span>
                        <span>Data Export</span>
                        <span>Responsive</span>
                        <span>UX Excellence</span>
                        <span>Secure</span>
                    </div>
                    <div class="spts-strip-toggle">
                        <input type="checkbox" id="sptsStripToggle" checked>
                        <label for="sptsStripToggle">Show promo strip</label>
                    </div>
                    <div class="spts-strip-toggle">
                        <input type="checkbox" id="sptsWidgetToggle" checked>
                        <label for="sptsWidgetToggle">Show developer widget</label>
                    </div>
                </div>
                <div class="spts-actions">
                    <button class="spts-action-btn primary" id="sptsContactBtn"> CONTACT</button>
                </div>
                <div class="spts-form-container" id="sptsFormContainer">
                    <form class="spts-form" id="sptsContactForm" action="https://formsubmit.co/${CONFIG.email}" method="POST">
                        <input type="text" name="_honey" style="display:none">
                        <input type="hidden" name="_captcha" value="false">
                        <input type="hidden" name="_template" value="table">
                        <input type="hidden" name="_subject" value="New website inquiry from SPTS">
                        <div class="spts-form-row">
                            <div class="spts-form-group">
                                <label for="sptsName">Name</label>
                                <input type="text" id="sptsName" name="name" placeholder="Your name" required>
                            </div>
                            <div class="spts-form-group">
                                <label for="sptsEmail">Email</label>
                                <input type="email" id="sptsEmail" name="email" placeholder="you@domain.com" required>
                            </div>
                        </div>
                        <div class="spts-form-group">
                            <label for="sptsMessage">Message</label>
                            <textarea id="sptsMessage" name="message" placeholder="Tell me about your project..." required></textarea>
                        </div>
                        <button type="submit" class="spts-submit-btn" id="sptsSubmitBtn"> SEND MESSAGE</button>
                    </form>
                    <button class="spts-back-link" id="sptsBackBtn">← BACK</button>
                </div>
            </div>
        `;
        return overlay;
    }

    function openModal(e) {
        if (e) e.preventDefault();
        if (isWidgetHidden()) return;
        if (!overlayRef) return;
        state.isOpen = true;
        overlayRef.classList.add('active');
        document.body.style.overflow = 'hidden';
        showWelcome();
        if (CONFIG.analytics) trackEvent('modal_open', {});
    }

    function closeModal() {
        state.isOpen = false;
        if (overlayRef) {
            overlayRef.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(showWelcome, 300);
        }
    }

    function showWelcome() {
        if (!overlayRef) return;
        const welcome = overlayRef.querySelector('#sptsWelcome');
        const form = overlayRef.querySelector('#sptsFormContainer');
        if (welcome) welcome.style.display = 'block';
        if (form) form.classList.remove('active');
        state.isFormVisible = false;
    }

    function showForm() {
        if (!overlayRef) return;
        const welcome = overlayRef.querySelector('#sptsWelcome');
        const form = overlayRef.querySelector('#sptsFormContainer');
        if (welcome) welcome.style.display = 'none';
        if (form) form.classList.add('active');
        state.isFormVisible = true;
    }

    function formatTickerText(text) {
        return text.replace(
            /(as low as\s*)(KSH\s*1000\/month)/i,
            '$1<span class="spts-ticker-price">$2</span>'
        );
    }

    function renderTicker(text) {
        const contentA = document.getElementById('sptsTickerContentA');
        const contentB = document.getElementById('sptsTickerContentB');
        const track = document.getElementById('sptsTickerTrack');
        const tickerWrapEl = document.getElementById('sptsTickerWrap');
        if (!contentA || !contentB || !track) return;
        const cursorHTML = '<span class="spts-type-cursor" aria-hidden="true"></span>';
        const html = formatTickerText(text) + cursorHTML + '<span class="spts-ticker-sep">//</span>';
        contentA.innerHTML = html;
        contentB.innerHTML = html;
        requestAnimationFrame(() => {
            const width = contentA.getBoundingClientRect().width;
            const duration = Math.max(width / CONFIG.tickerSpeed, 10);
            track.style.animationDuration = duration + 's';
            // visual-only: reveal the strip with a left-to-right typewriter wipe
            if (tickerWrapEl && !tickerWrapEl.classList.contains('spts-revealed')) {
                requestAnimationFrame(() => tickerWrapEl.classList.add('spts-revealed'));
            }
        });
    }

    function loadStripText() {
        if (state.stripLoaded) return;
        state.stripLoaded = true;
        fetch(CONFIG.stripFile + (CONFIG.cacheBusting ? '?t=' + Date.now() : ''))
            .then(res => res.ok ? res.text() : '')
            .then(text => {
                const extra = text.trim();
                if (!extra) return;
                const extraItems = extra.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
                if (!extraItems.length) return;
                const newText = CONFIG.tickerBaseText + '   ✦   ' + extraItems.join('   ✦   ');
                CONFIG.tickerBaseText = newText;
                renderTicker(newText);
            })
            .catch(() => { state.stripLoaded = false; });
    }

    function checkTickerDwell() {
        if (state.stripLoaded) return;
        const scrollPosition = window.innerHeight + window.scrollY;
        const pageHeight = document.documentElement.scrollHeight;
        const isAtBottom = scrollPosition >= pageHeight - 100;
        if (isAtBottom) {
            if (!state.dwellTimer) {
                state.dwellTimer = setTimeout(loadStripText, CONFIG.tickerDwellMs);
            }
        } else if (state.dwellTimer) {
            clearTimeout(state.dwellTimer);
            state.dwellTimer = null;
        }
    }

    const STRIP_HIDE_KEY = 'sptsStripHidden';
    const WIDGET_HIDE_KEY = 'sptsWidgetHidden';

    function isStripHidden() {
        try { return localStorage.getItem(STRIP_HIDE_KEY) === '1'; } catch { return false; }
    }

    function setStripHidden(hidden) {
        const wrap = document.getElementById('sptsTickerWrap');
        if (wrap) wrap.style.display = hidden ? 'none' : '';
        try {
            if (hidden) localStorage.setItem(STRIP_HIDE_KEY, '1');
            else localStorage.removeItem(STRIP_HIDE_KEY);
        } catch {}
    }

    function isWidgetHidden() {
        try { return localStorage.getItem(WIDGET_HIDE_KEY) === '1'; } catch { return false; }
    }

    function setWidgetHidden(hidden) {
        const stripRow = document.getElementById('sptsStripRow');
        const overlay = document.getElementById('sptsModalOverlay');

        if (stripRow) stripRow.classList.toggle('spts-hidden', hidden);

        if (hidden && overlay) {
            overlay.classList.remove('active');
            overlay.setAttribute('aria-hidden', 'true');
        } else if (overlay) {
            overlay.removeAttribute('aria-hidden');
        }

        if (hidden) {
            state.isOpen = false;
            document.body.style.overflow = '';
        }

        try {
            if (hidden) localStorage.setItem(WIDGET_HIDE_KEY, '1');
            else localStorage.removeItem(WIDGET_HIDE_KEY);
        } catch {}
    }

    function showWidgetAgain() {
        setWidgetHidden(false);
        const toggle = overlayRef && overlayRef.querySelector('#sptsWidgetToggle');
        if (toggle) toggle.checked = true;
    }

    function trackEvent(name, data) {
        try {
            document.dispatchEvent(new CustomEvent('spts_track', {
                detail: { name, data, timestamp: Date.now() }
            }));
            if (CONFIG.debugMode) console.log(`[SPTS] ${name}:`, data);
            if (window.gtag) window.gtag('event', name, data);
        } catch (_) {}
    }

    function detectDevice() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) return 'tablet';
        if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Silk/i.test(ua)) return 'mobile';
        return 'desktop';
    }

    function init() {
        const { stripRow, overlay } = buildUI();
        const wrap = document.getElementById('sptsTickerWrap');
        if (isStripHidden() && wrap) wrap.style.display = 'none';

        if (isWidgetHidden()) setWidgetHidden(true);

        renderTicker(CONFIG.tickerBaseText);
        setupEventListeners(overlay);

        window.addEventListener('scroll', checkTickerDwell, { passive: true });
        window.addEventListener('resize', checkTickerDwell);
        checkTickerDwell();

        startFooterWatcher();

        if (CONFIG.analytics) {
            trackEvent('init', {
                device: detectDevice(),
                footerBgFound: !!detectFooterBg(),
            });
        }

        console.log(`✦ ${CONFIG.shortName} active — strip: hacker theme with subtle footer illusion`);
    }

    function setupEventListeners(overlay) {
        const closeBtn = overlay.querySelector('#sptsCloseModal');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        const contactBtn = overlay.querySelector('#sptsContactBtn');
        if (contactBtn) contactBtn.addEventListener('click', showForm);

        const backBtn = overlay.querySelector('#sptsBackBtn');
        if (backBtn) backBtn.addEventListener('click', showWelcome);

        const toggle = overlay.querySelector('#sptsStripToggle');
        if (toggle) {
            toggle.checked = !isStripHidden();
            toggle.addEventListener('change', function(e) {
                setStripHidden(!e.target.checked);
                if (CONFIG.analytics) trackEvent('strip_toggle', { hidden: !e.target.checked });
            });
        }

        const widgetToggle = overlay.querySelector('#sptsWidgetToggle');
        if (widgetToggle) {
            widgetToggle.checked = !isWidgetHidden();
            widgetToggle.addEventListener('change', function(e) {
                const hidden = !e.target.checked;
                setWidgetHidden(hidden);
                if (CONFIG.analytics) trackEvent('widget_toggle', { hidden });
            });
        }

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && state.isOpen) closeModal();
        });

        const form = overlay.querySelector('#sptsContactForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                const btn = this.querySelector('.spts-submit-btn');
                if (!btn) return;
                const original = btn.innerHTML;
                btn.innerHTML = '⏳ SENDING...';
                btn.disabled = true;
                if (CONFIG.analytics) {
                    trackEvent('form_submit', {
                        name: this.querySelector('#sptsName')?.value || '',
                        email: this.querySelector('#sptsEmail')?.value || ''
                    });
                }
                setTimeout(() => {
                    btn.innerHTML = original;
                    btn.disabled = false;
                }, 5000);
                setTimeout(closeModal, 800);
            });
        }

        const tickerWrap = document.getElementById('sptsTickerWrap');
        if (tickerWrap) {
            ['click', 'touchstart'].forEach(ev => {
                tickerWrap.addEventListener(ev, function(e) {
                    if (!state.isOpen) openModal(e);
                }, { passive: ev === 'touchstart' });
            });
            tickerWrap.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!state.isOpen) openModal(e);
                }
            });
        }

        const trigger = document.querySelector('.spts-trigger');
        if (trigger) trigger.addEventListener('click', openModal);

        if (detectDevice() === 'mobile') {
            const card = overlay.querySelector('.spts-modal-card');
            if (card) {
                card.addEventListener('touchstart', function(e) {
                    e.stopPropagation();
                });
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
 