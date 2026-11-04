// ==============================
// FREEBIE "DAUER-ALARM" — ActiveCampaign (Formular 53) + GA4
// ==============================
(function() {
    var FORM_ID = '53';
    var NEXT_URL = 'dauer-alarm-postfach.html';

    var form = document.getElementById('_form_' + FORM_ID + '_');
    if (!form) return;
    var BUTTON_HTML = form.querySelector('button[type="submit"]').innerHTML;
    var PLACEMENT = form.getAttribute('data-placement') || 'unbekannt';

    var started = false;
    form.addEventListener('focusin', function() {
        if (started) return;
        started = true;
        gtag('event', 'da_form_start', { form_name: 'freebie_dauer_alarm', placement: PLACEMENT });
    });

    function showError(message) {
        var old = form.querySelector('.da-form-error');
        if (old) old.parentNode.removeChild(old);
        var err = document.createElement('div');
        err.className = 'mc-form-error da-form-error';
        err.innerHTML = message;
        var button = form.querySelector('button[type="submit"]');
        button.parentNode.insertBefore(err, button);
        button.disabled = false;
        button.innerHTML = BUTTON_HTML;
    }

    function goNext() {
        window.location.href = NEXT_URL;
    }

    // AC-JSONP-Callbacks: dieses Formular -> Postfach-Seite, andere Formulare wie bisher (main.js)
    var origThankYou = window._show_thank_you;
    window._show_thank_you = function(id, message) {
        if (String(id) === FORM_ID) return goNext();
        if (origThankYou) origThankYou(id, message);
    };
    var origError = window._show_error;
    window._show_error = function(id, message) {
        if (String(id) === FORM_ID) return showError(message);
        if (origError) origError(id, message);
    };

    function serialize(f) {
        var q = [];
        for (var i = 0; i < f.elements.length; i++) {
            var el = f.elements[i];
            if (!el.name || el.disabled) continue;
            if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) continue;
            if (el.nodeName === 'BUTTON') continue;
            q.push(el.name + '=' + encodeURIComponent(el.value));
        }
        return q.join('&');
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var firstname = form.querySelector('input[name="firstname"]');
        var email = form.querySelector('input[name="email"]');

        if (!firstname.value.trim()) return showError('Bitte gib deinen Vornamen ein.');
        if (!email.value.trim().match(/^[\+_a-z0-9-'&=]+(\.[\+_a-z0-9-']+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,})$/i)) {
            return showError('Bitte gib eine gültige E-Mail-Adresse ein.');
        }

        gtag('event', 'da_form_submit', { form_name: 'freebie_dauer_alarm', placement: PLACEMENT });
        gtag('event', 'generate_lead', { lead_source: 'freebie_dauer_alarm', placement: PLACEMENT });

        var button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = 'Wird gesendet …';

        try { sessionStorage.setItem('daFirstname', firstname.value.trim()); } catch (err) {}

        var script = document.createElement('script');
        script.charset = 'utf-8';
        script.src = 'https://michael-geiregger.activehosted.com/proc.php?' + serialize(form).replace(/%0A/g, '\\n') + '&jsonp=true';
        script.onerror = function() { showError('Übermittlung fehlgeschlagen. Bitte versuche es erneut.'); };
        document.head.appendChild(script);
    });
})();
    
