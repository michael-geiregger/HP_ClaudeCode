// ==============================
// COOKIE-EINWILLIGUNG (Google Analytics 4)
// ==============================
// Google Analytics wird erst geladen, wenn die Besucherin / der Besucher zustimmt.
// Bis dahin sammelt gtag() Ereignisse nur lokal im dataLayer (keine Cookies,
// keine Übertragung an Google). Ohne Zustimmung wird gtag.js nie geladen.
// Die Entscheidung wird im localStorage gespeichert (kein Cookie).
// Einstellungen erneut öffnen: Link mit [data-cookie-settings] oder window.mgCookieSettings().
(function() {
    var GA_ID = 'G-8Q32GSGRR7';
    var KEY = 'mg_consent_v1';
    var loaded = false;

    function getChoice() {
        try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }

    function setChoice(value) {
        try { localStorage.setItem(KEY, value); } catch (e) {}
    }

    function loadAnalytics() {
        if (loaded) return;
        loaded = true;
        gtag('consent', 'update', { analytics_storage: 'granted' });
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);
    }

    function deleteGaCookies() {
        document.cookie.split(';').forEach(function(c) {
            var name = c.split('=')[0].trim();
            if (/^_ga/.test(name)) {
                var host = location.hostname.replace(/^www\./, '');
                ['', '; domain=' + host, '; domain=.' + host].forEach(function(d) {
                    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
                });
            }
        });
    }

    var css = '' +
        '.mg-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:440px;margin:0 auto;' +
        'padding:22px 22px 18px;border-radius:22px;background:rgba(30,38,48,.94);color:#f5f2ec;' +
        '-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.12);' +
        'box-shadow:0 24px 60px -12px rgba(0,0,0,.45);font:15px/1.55 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;' +
        'transform:translateY(24px);opacity:0;transition:transform .5s cubic-bezier(.22,1,.36,1),opacity .5s ease}' +
        '.mg-cc.show{transform:none;opacity:1}' +
        '.mg-cc h2{font-size:16px;font-weight:700;margin:0 0 6px;letter-spacing:-.01em;color:#fff}' +
        '.mg-cc p{margin:0 0 16px;font-size:13.5px;color:rgba(245,242,236,.75)}' +
        '.mg-cc a{color:#E8B860;text-decoration:underline}' +
        '.mg-cc-btns{display:flex;gap:10px}' +
        '.mg-cc button{flex:1;padding:12px 14px;border-radius:999px;font-family:inherit;font-weight:600;font-size:14px;line-height:1.2;cursor:pointer;' +
        'transition:transform .3s cubic-bezier(.34,1.56,.64,1),background .2s ease;-webkit-tap-highlight-color:transparent}' +
        '.mg-cc button:active{transform:scale(.96)}' +
        '.mg-cc .mg-yes{background:#fff;color:#14181e;border:0}' +
        '.mg-cc .mg-no{background:transparent;color:#f5f2ec;border:1px solid rgba(255,255,255,.35)}' +
        '.mg-cc .mg-no:hover{background:rgba(255,255,255,.08)}' +
        '@media (min-width:760px){.mg-cc{left:24px;right:auto;bottom:24px;margin:0}}' +
        '@media (prefers-reduced-motion:reduce){.mg-cc{transition:none}}';

    function showBanner() {
        if (document.getElementById('mgCookie')) return;
        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        var privacy = (location.pathname.indexOf('/termin/') !== -1 ? '../' : '') + 'datenschutz.html';
        var box = document.createElement('div');
        box.className = 'mg-cc';
        box.id = 'mgCookie';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-live', 'polite');
        box.setAttribute('aria-label', 'Cookie-Einstellungen');
        box.innerHTML =
            '<h2>Darf ich messen, was hilft?</h2>' +
            '<p>Mit deiner Zustimmung nutze ich Google Analytics, um zu verstehen, welche Inhalte dich wirklich weiterbringen. ' +
            'Dabei werden Cookies gesetzt und Daten an Google übertragen. Ohne Zustimmung funktioniert die Seite genauso. ' +
            'Mehr in der <a href="' + privacy + '#analytics">Datenschutzerklärung</a>.</p>' +
            '<div class="mg-cc-btns">' +
            '<button type="button" class="mg-no">Nur notwendige</button>' +
            '<button type="button" class="mg-yes">Akzeptieren</button>' +
            '</div>';
        document.body.appendChild(box);
        requestAnimationFrame(function() { requestAnimationFrame(function() { box.classList.add('show'); }); });

        function close() {
            box.classList.remove('show');
            setTimeout(function() { if (box.parentNode) box.parentNode.removeChild(box); }, 500);
        }

        box.querySelector('.mg-yes').addEventListener('click', function() {
            setChoice('granted');
            loadAnalytics();
            close();
        });
        box.querySelector('.mg-no').addEventListener('click', function() {
            var wasGranted = getChoice() === 'granted';
            setChoice('denied');
            gtag('consent', 'update', { analytics_storage: 'denied' });
            deleteGaCookies();
            close();
            // GA ist bereits geladen: Seite neu laden, damit es nicht weiterläuft
            if (wasGranted && loaded) location.reload();
        });
    }

    window.mgCookieSettings = function() {
        var old = document.getElementById('mgCookie');
        if (old) old.parentNode.removeChild(old);
        showBanner();
    };

    function wireSettingsLinks() {
        document.addEventListener('click', function(e) {
            var link = e.target.closest && e.target.closest('[data-cookie-settings]');
            if (!link) return;
            e.preventDefault();
            window.mgCookieSettings();
        });

        // Link "Cookie-Einstellungen" automatisch im Footer ergänzen
        var target = document.querySelector('.footer-bottom') || document.querySelector('footer nav');
        if (target && !target.querySelector('[data-cookie-settings]')) {
            var a = document.createElement('a');
            a.href = '#';
            a.setAttribute('data-cookie-settings', '');
            a.textContent = 'Cookie-Einstellungen';
            a.style.cursor = 'pointer';
            target.appendChild(a);
        }
    }

    function init() {
        wireSettingsLinks();
        var choice = getChoice();
        if (choice === 'granted') loadAnalytics();
        else if (choice !== 'denied') showBanner();
    }

    if (typeof window.gtag !== 'function') {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { dataLayer.push(arguments); };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
