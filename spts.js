(function() {
    'use strict';

    const CONFIG = {
        email: 'af02cbe99149c37059b8327b329a776c',
        developerName: 'SP Team Studio',
        shortName: 'SPTS',
        triggerText: '@dev_sp',
        tickerBaseText: '✦ Digital tools and systems available engineered for excellence contact Spts today brought to you by vibe skill community',
        tickerSpeed: 22,
        analytics: true,
        debugMode: false,
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
        deviceType: 'desktop',
        lastFooterBg: null,
        footerWatchTimer: null,
        widgetHideTimer: null,
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
        stripRow.style.borderRadius = '10px';
        stripRow.style.padding = '6px 12px';
        stripRow.style.boxSizing = 'border-box';
        stripRow.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.25)';

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
                position: fixed !important;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                inset: 0;
                width: 100%;
                height: 100%;
                background: rgba(4, 2, 12, 0.94);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 2147483647;
                isolation: isolate;
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
                box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7), 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 50px rgba(56, 189, 248, 0.08);
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
                padding: 4px 14px;
                border-radius: 20px;
                letter-spacing: 0.03em;
                background: rgba(56, 189, 248, 0.08);
            }
            .spts-modal-card .spts-toggles {
                margin-top: 18px;
                padding-top: 16px;
            }
            .spts-modal-card .spts-toggle-row {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 7px 0;
                cursor: pointer;
                user-select: none;
            }
            .spts-modal-card .spts-toggle-row--child {
                margin-left: 25px;
                padding-left: 13px;
                transition: box-shadow 0.2s ease;
            }
            .spts-modal-card .spts-toggle-row input[type="checkbox"] {
                appearance: none;
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                flex-shrink: 0;
                margin-top: 1px;
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.06);
                cursor: pointer;
                position: relative;
                transition: all 0.2s ease;
            }
            .spts-modal-card .spts-toggle-row input[type="checkbox"]:checked {
                background: #38bdf8;
            }
            .spts-modal-card .spts-toggle-row input[type="checkbox"]:checked::after {
                content: '✓';
                position: absolute;
                top: -2px;
                left: 2px;
                font-size: 0.75rem;
                color: #0a0818;
            }
            .spts-modal-card .spts-toggle-row input[type="checkbox"]:disabled {
                cursor: not-allowed;
                opacity: 0.4;
            }
            .spts-modal-card .spts-toggle-row input[type="checkbox"]:focus-visible {
                box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
            }
            .spts-modal-card .spts-toggle-row label {
                display: flex;
                flex-direction: column;
                gap: 2px;
                cursor: pointer;
            }
            .spts-modal-card .spts-toggle-title {
                font-size: 0.78rem;
                color: #b0aee0;
                font-weight: 600;
                letter-spacing: 0.02em;
            }
            .spts-modal-card .spts-toggle-desc {
                font-size: 0.66rem;
                color: #6a5aa0;
                line-height: 1.4;
            }
            .spts-modal-card .spts-toggle-row.spts-disabled,
            .spts-modal-card .spts-toggle-row.spts-disabled label {
                cursor: not-allowed;
            }
            .spts-modal-card .spts-toggle-row.spts-disabled .spts-toggle-title,
            .spts-modal-card .spts-toggle-row.spts-disabled .spts-toggle-desc {
                opacity: 0.45;
            }
            .spts-modal-card .spts-toggle-hint {
                margin: 10px 0 0;
                padding: 9px 11px;
                font-size: 0.64rem;
                line-height: 1.5;
                color: #7a6ab0;
                background: rgba(56, 189, 248, 0.06);
                border-radius: 8px;
                transition: all 0.2s ease;
            }
            .spts-modal-card .spts-visit-link {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                margin-top: 14px;
                font-size: 0.72rem;
                font-weight: 600;
                color: #38bdf8;
                text-decoration: none;
                letter-spacing: 0.02em;
                border-bottom: 1px dotted rgba(56, 189, 248, 0.5);
                padding-bottom: 1px;
                transition: all 0.2s ease;
            }
            .spts-modal-card .spts-visit-link:hover {
                color: #7dd3fc;
                border-bottom-color: #7dd3fc;
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
                background: rgba(255, 255, 255, 0.04);
                color: #8a86b8;
                letter-spacing: 0.02em;
            }
            .spts-modal-card .spts-action-btn:hover {
                color: #38bdf8;
                background: rgba(56, 189, 248, 0.08);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(56, 189, 248, 0.12);
            }
            .spts-modal-card .spts-action-btn.primary {
                color: #38bdf8;
                background: rgba(56, 189, 248, 0.10);
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
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                transition: all 0.2s ease;
                outline: none;
                box-sizing: border-box;
                line-height: 1.4;
                box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.1);
            }
            .spts-modal-card .spts-form-group input:focus,
            .spts-modal-card .spts-form-group textarea:focus {
                background: rgba(56, 189, 248, 0.06);
                box-shadow: inset 0 -2px 0 #38bdf8, 0 0 0 4px rgba(56, 189, 248, 0.08);
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
            .spts-strip-row.spts-minimized {
                position: fixed !important;
                left: auto;
                top: auto;
                right: 18px;
                bottom: 18px;
                width: auto !important;
                max-width: calc(100vw - 36px);
                z-index: 2147483000;
                display: block !important;
                padding: 0 !important;
                background: transparent !important;
                pointer-events: none;
            }
            .spts-strip-row.spts-minimized .spts-trigger {
                pointer-events: auto;
                padding: 7px 10px;
                border-radius: 999px;
                background: rgba(10, 8, 24, 0.82);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                box-shadow: 0 6px 24px rgba(0,0,0,0.28), 0 0 0 1px rgba(56, 189, 248, 0.12) inset;
                cursor: grab;
            }
            .spts-strip-row.spts-minimized .spts-trigger:active { cursor: grabbing; }
            .spts-strip-row.spts-minimized .spts-ticker-wrap { display: none !important; }
            .spts-minimized-hide {
                display: none;
                position: absolute;
                top: -7px;
                right: -7px;
                width: 18px;
                height: 18px;
                padding: 0;
                border-radius: 50%;
                background: #0a0818;
                box-shadow: 0 0 0 1px rgba(255,255,255,0.14) inset;
                color: #8a86b8;
                font: 12px/16px 'Courier New', monospace;
                cursor: pointer;
                pointer-events: auto;
            }
            .spts-strip-row.spts-minimized .spts-minimized-hide { display: block; }
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

        const minimizedHide = document.createElement('button');
        minimizedHide.className = 'spts-minimized-hide';
        minimizedHide.type = 'button';
        minimizedHide.textContent = '×';
        minimizedHide.setAttribute('aria-label', 'Hide developer widget for this session');
        minimizedHide.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideMinimizedForSession();
        });
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
        stripRow.appendChild(minimizedHide);
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
                    <div class="spts-toggles" id="sptsToggles">
                        <div class="spts-toggle-row" id="sptsWidgetToggleRow">
                            <input type="checkbox" id="sptsWidgetToggle" checked>
                            <label for="sptsWidgetToggle">
                                <span class="spts-toggle-title">Developer widget</span>
                                <span class="spts-toggle-desc">Keep this helper visible on the site</span>
                            </label>
                        </div>
                        <div class="spts-toggle-row spts-toggle-row--child" id="sptsStripToggleRow">
                            <input type="checkbox" id="sptsStripToggle" checked>
                            <label for="sptsStripToggle">
                                <span class="spts-toggle-title">Promo strip</span>
                                <span class="spts-toggle-desc">Show the scrolling offer inside the widget</span>
                            </label>
                        </div>
                        <p class="spts-toggle-hint" id="sptsToggleHint" role="status"></p>
                    </div>
                    <a class="spts-visit-link" id="sptsVisitLink" href="https://sp-team-studio-website.vercel.app/#services" target="_blank" rel="noopener noreferrer">
                        ↗ Visit SP Team Studio
                    </a>
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

    // ===== Scroll lock: freezes the background page while the modal is open =====
    // Pinning <body> with position:fixed (the old approach) rewrites the page's
    // layout context, breaks any fixed/sticky elements the host page has, and
    // can jump the page on close. Instead we just hide overflow on <html> and
    // pad the right edge by the scrollbar's width so nothing shifts sideways.
    let sptsScrollLocked = false;
    let sptsBodyPaddingRight = '';

    function getScrollbarWidth() {
        return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    }

    function lockBodyScroll() {
        if (sptsScrollLocked) return;
        sptsScrollLocked = true;
        const scrollbarWidth = getScrollbarWidth();
        sptsBodyPaddingRight = document.body.style.paddingRight || '';
        document.documentElement.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
            const current = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
            document.body.style.paddingRight = (current + scrollbarWidth) + 'px';
        }
    }

    function unlockBodyScroll() {
        if (!sptsScrollLocked) return;
        sptsScrollLocked = false;
        document.documentElement.style.overflow = '';
        document.body.style.paddingRight = sptsBodyPaddingRight;
    }

    function openModal(e) {
        if (e) e.preventDefault();
        if (isWidgetHidden() || isMinimizedSessionHidden()) return;
        if (!overlayRef) return;
        state.isOpen = true;
        overlayRef.classList.add('active');
        lockBodyScroll();
        showWelcome();
        if (typeof overlayRef.refreshToggles === 'function') overlayRef.refreshToggles();
        if (CONFIG.analytics) trackEvent('modal_open', {});
    }

    function closeModal() {
        state.isOpen = false;
        if (overlayRef) {
            overlayRef.classList.remove('active');
            unlockBodyScroll();
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

    const STRIP_HIDE_KEY = 'sptsStripHidden';
    const WIDGET_HIDE_UNTIL_KEY = 'sptsWidgetHideUntil';
    const WIDGET_HIDE_FOREVER_KEY = 'sptsWidgetHideForever';
    const WIDGET_MINIMIZE_KEY = 'sptsWidgetMinimized';
    const WIDGET_MINIMIZE_SESSION_HIDE_KEY = 'sptsWidgetMinimizedSessionHidden';
    const WIDGET_POSITION_KEY = 'sptsWidgetPosition';

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

    function getWidgetHideUntil() {
        try {
            const value = Number(localStorage.getItem(WIDGET_HIDE_UNTIL_KEY) || 0);
            return Number.isFinite(value) ? value : 0;
        } catch { return 0; }
    }

    function isWidgetHidden() {
        try {
            if (localStorage.getItem(WIDGET_HIDE_FOREVER_KEY) === '1') return true;
            const until = getWidgetHideUntil();
            if (until > Date.now()) return true;
            if (until) localStorage.removeItem(WIDGET_HIDE_UNTIL_KEY);
        } catch {}
        return false;
    }

    function setWidgetHiddenUntil(timestamp) {
        if (state.widgetHideTimer) {
            clearTimeout(state.widgetHideTimer);
            state.widgetHideTimer = null;
        }
        try {
            localStorage.removeItem(WIDGET_HIDE_FOREVER_KEY);
            if (timestamp > Date.now()) localStorage.setItem(WIDGET_HIDE_UNTIL_KEY, String(timestamp));
            else localStorage.removeItem(WIDGET_HIDE_UNTIL_KEY);
        } catch {}
        applyWidgetVisibility();
        if (timestamp > Date.now()) {
            state.widgetHideTimer = setTimeout(function() {
                state.widgetHideTimer = null;
                clearWidgetHide();
            }, Math.min(timestamp - Date.now() + 50, 2147483647));
        }
    }

    function setWidgetHiddenForever(hidden) {
        try {
            if (hidden) {
                localStorage.setItem(WIDGET_HIDE_FOREVER_KEY, '1');
                localStorage.removeItem(WIDGET_HIDE_UNTIL_KEY);
            } else {
                localStorage.removeItem(WIDGET_HIDE_FOREVER_KEY);
            }
        } catch {}
        applyWidgetVisibility();
    }

    function clearWidgetHide() {
        try {
            localStorage.removeItem(WIDGET_HIDE_FOREVER_KEY);
            localStorage.removeItem(WIDGET_HIDE_UNTIL_KEY);
        } catch {}
        applyWidgetVisibility();
    }

    function isMinimized() {
        try { return localStorage.getItem(WIDGET_MINIMIZE_KEY) === '1'; } catch { return false; }
    }

    function isMinimizedSessionHidden() {
        try { return sessionStorage.getItem(WIDGET_MINIMIZE_SESSION_HIDE_KEY) === '1'; } catch { return false; }
    }

    function setMinimized(minimized) {
        try {
            if (minimized) localStorage.setItem(WIDGET_MINIMIZE_KEY, '1');
            else localStorage.removeItem(WIDGET_MINIMIZE_KEY);
        } catch {}
        applyWidgetVisibility();
    }

    function applyWidgetVisibility() {
        const stripRow = document.getElementById('sptsStripRow');
        const trigger = stripRow?.querySelector('.spts-trigger');
        const ticker = document.getElementById('sptsTickerWrap');
        if (!stripRow) return;

        const hidden = isWidgetHidden();
        const minimized = !hidden && isMinimized() && !isMinimizedSessionHidden();
        stripRow.classList.toggle('spts-hidden', hidden || isMinimizedSessionHidden());
        stripRow.classList.toggle('spts-minimized', minimized);
        if (ticker) ticker.style.display = minimized ? 'none' : '';
        if (trigger) trigger.setAttribute('aria-label', minimized ? CONFIG.triggerText + ' — open developer widget' : CONFIG.triggerText + ' — open contact form');

        if (hidden || isMinimizedSessionHidden()) {
            if (overlayRef) {
                overlayRef.classList.remove('active');
                overlayRef.setAttribute('aria-hidden', 'true');
            }
            state.isOpen = false;
            unlockBodyScroll();
        } else if (overlayRef) {
            overlayRef.removeAttribute('aria-hidden');
        }

        if (minimized) applyWidgetPosition();
    }

    function applyWidgetPosition() {
        const stripRow = document.getElementById('sptsStripRow');
        if (!stripRow) return;
        try {
            const saved = JSON.parse(localStorage.getItem(WIDGET_POSITION_KEY) || 'null');
            if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
                const maxLeft = Math.max(0, window.innerWidth - stripRow.offsetWidth - 8);
                const maxTop = Math.max(0, window.innerHeight - stripRow.offsetHeight - 8);
                stripRow.style.left = Math.min(Math.max(8, saved.left), maxLeft) + 'px';
                stripRow.style.top = Math.min(Math.max(8, saved.top), maxTop) + 'px';
                stripRow.style.right = 'auto';
                stripRow.style.bottom = 'auto';
            }
        } catch {}
    }

    function hideMinimizedForSession() {
        try { sessionStorage.setItem(WIDGET_MINIMIZE_SESSION_HIDE_KEY, '1'); } catch {}
        applyWidgetVisibility();
    }

    function chooseWidgetMinimize() {
        clearWidgetHide();
        setMinimized(true);
        if (CONFIG.analytics) trackEvent('widget_minimized', {});
        closeModal();
    }

    function wireWidgetDrag() {
        const stripRow = document.getElementById('sptsStripRow');
        const trigger = stripRow?.querySelector('.spts-trigger');
        if (!stripRow || !trigger) return;
        let dragging = false;
        let moved = false;
        let offsetX = 0;
        let offsetY = 0;

        trigger.addEventListener('pointerdown', function(e) {
            if (!stripRow.classList.contains('spts-minimized')) return;
            dragging = true;
            moved = false;
            const rect = stripRow.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            trigger.setPointerCapture?.(e.pointerId);
        });
        trigger.addEventListener('pointermove', function(e) {
            if (!dragging) return;
            moved = true;
            const left = Math.min(Math.max(8, e.clientX - offsetX), Math.max(8, window.innerWidth - stripRow.offsetWidth - 8));
            const top = Math.min(Math.max(8, e.clientY - offsetY), Math.max(8, window.innerHeight - stripRow.offsetHeight - 8));
            stripRow.style.left = left + 'px';
            stripRow.style.top = top + 'px';
            stripRow.style.right = 'auto';
            stripRow.style.bottom = 'auto';
        });
        trigger.addEventListener('pointerup', function() {
            if (!dragging) return;
            dragging = false;
            if (moved) {
                const rect = stripRow.getBoundingClientRect();
                try { localStorage.setItem(WIDGET_POSITION_KEY, JSON.stringify({ left: rect.left, top: rect.top })); } catch {}
                trigger.dataset.sptsDragged = '1';
                setTimeout(() => delete trigger.dataset.sptsDragged, 0);
            }
        });
        trigger.addEventListener('click', function(e) {
            if (trigger.dataset.sptsDragged === '1') {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, true);
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

        applyWidgetVisibility();
        const existingHideUntil = getWidgetHideUntil();
        if (existingHideUntil > Date.now()) {
            state.widgetHideTimer = setTimeout(function() {
                state.widgetHideTimer = null;
                clearWidgetHide();
            }, Math.min(existingHideUntil - Date.now() + 50, 2147483647));
        }
        wireWidgetDrag();

        renderTicker(CONFIG.tickerBaseText);
        setupEventListeners(overlay);

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
        const stripToggleRow = overlay.querySelector('#sptsStripToggleRow');
        const widgetToggle = overlay.querySelector('#sptsWidgetToggle');
        const toggleHint = overlay.querySelector('#sptsToggleHint');

        // The promo strip only makes sense while the developer widget itself
        // is on — keep the checkbox state and copy honest about that at all times.
        function refreshToggleAvailability() {
            if (!toggle || !widgetToggle) return;
            const widgetOn = widgetToggle.checked;
            if (widgetOn) {
                toggle.disabled = false;
                if (stripToggleRow) stripToggleRow.classList.remove('spts-disabled');
                toggle.checked = !isStripHidden();
                if (toggleHint) {
                    toggleHint.textContent = toggle.checked
                        ? 'Promo strip is showing.'
                        : 'promo strip is hidden.';
                }
            } else {
                toggle.disabled = true;
                if (stripToggleRow) stripToggleRow.classList.add('spts-disabled');
                toggle.checked = false;
                if (toggleHint) {
                    toggleHint.textContent = 'Promo strip unavailable.';
                }
            }
        }

        if (toggle) {
            toggle.addEventListener('change', function(e) {
                if (toggle.disabled) return;
                setStripHidden(!e.target.checked);
                if (CONFIG.analytics) trackEvent('strip_toggle', { hidden: !e.target.checked });
                refreshToggleAvailability();
            });
        }

        if (widgetToggle) {
            widgetToggle.checked = !isMinimized();
            widgetToggle.addEventListener('change', function(e) {
                const show = e.target.checked;
                if (show) {
                    clearWidgetHide();
                    setMinimized(false);
                    if (CONFIG.analytics) trackEvent('widget_show', {});
                } else {
                    chooseWidgetMinimize();
                }
                refreshToggleAvailability();
            });
        }

        refreshToggleAvailability();
        overlay.refreshToggles = refreshToggleAvailability;

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
 
