// ==============================
// PAGE LOADER
// ==============================
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.add('loaded');
    }, 1400);
});

// ==============================
// SCROLL REVEAL (Intersection Observer)
// ==============================
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

window.revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    revealObserver.observe(el);
});

// ==============================
// NAVBAR SCROLL EFFECT
// ==============================
const nav = document.getElementById('mainNav');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    if (scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }

    lastScrollY = scrollY;

    // Scroll progress bar
    const scrollProgress = document.getElementById('scrollProgress');
    if (scrollProgress) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = scrollY / docHeight;
        scrollProgress.style.transform = `scaleX(${scrollPercent})`;
    }
});

// ==============================
// MOBILE MENU
// ==============================
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });
}

// ==============================
// PARTICLE CANVAS (Hero - only on pages with canvas)
// ==============================
const canvas = document.getElementById('heroParticles');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        const hero = document.querySelector('.hero');
        if (hero) {
            canvas.width = hero.offsetWidth;
            canvas.height = hero.offsetHeight;
        }
    }

    function createParticles() {
        particles = [];
        const count = Math.min(60, Math.floor(canvas.width * canvas.height / 15000));

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.3 + 0.05,
                color: ['180,140,60', '160,145,120', '140,130,110'][Math.floor(Math.random() * 3)]
            });
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const dx = p.x - particles[j].x;
                const dy = p.y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.04 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });

        requestAnimationFrame(drawParticles);
    }

    resizeCanvas();
    createParticles();
    drawParticles();

    window.addEventListener('resize', () => {
        resizeCanvas();
        createParticles();
    });
}

// ==============================
// CURSOR GLOW (Desktop)
// ==============================
if (window.matchMedia('(pointer: fine)').matches) {
    const cursorGlow = document.getElementById('cursorGlow');
    if (cursorGlow) {
        cursorGlow.style.display = 'block';
        document.addEventListener('mousemove', (e) => {
            cursorGlow.style.left = e.clientX + 'px';
            cursorGlow.style.top = e.clientY + 'px';
        });
    }
}

// ==============================
// SMOOTH SCROLL for anchor links
// ==============================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==============================
// PARALLAX on scroll (subtle, hero only)
// ==============================
const heroOrbs = document.querySelectorAll('.hero-orb');
if (heroOrbs.length) {
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        heroOrbs.forEach((orb, i) => {
            const speed = 0.05 * (i + 1);
            orb.style.transform = `translateY(${scrollY * speed}px)`;
        });
    });
}

// ==============================
// NEWSLETTER — ActiveCampaign
// ==============================
window.cfields = [];
window._show_thank_you = function(id, message) {
    var form = document.getElementById('_form_' + id + '_');
    if (!form) return;
    var thank_you = form.querySelector('._form-thank-you');
    form.querySelector('._form-content').style.display = 'none';
    var note = form.closest('.newsletter-content');
    if (note) {
        var noteEl = note.querySelector('.newsletter-note');
        if (noteEl) noteEl.style.display = 'none';
    }
    thank_you.innerHTML = '<p style="color: var(--color-golden); font-size: 1.05rem; font-weight: 500;">Danke! Bitte überprüfe dein Postfach zur Bestätigung.</p>';
    thank_you.style.display = 'block';
};
window._show_error = function(id, message) {
    var form = document.getElementById('_form_' + id + '_');
    if (!form) return;
    var button = form.querySelector('button[type="submit"]');
    var old_error = form.querySelector('._form_error');
    if (old_error) old_error.parentNode.removeChild(old_error);
    var err = document.createElement('div');
    err.innerHTML = message;
    err.className = '_form_error';
    err.style.cssText = 'color: #ff6b6b; font-size: 0.9rem; margin-bottom: 12px; text-align: center;';
    button.parentNode.insertBefore(err, button);
    button.disabled = false;
    button.classList.remove('processing');
};
window._load_script = function(url, callback, isSubmit) {
    var script = document.createElement('script');
    script.charset = 'utf-8';
    script.src = url;
    if (callback) {
        script.onload = script.onreadystatechange = function() {
            if (!this.readyState || this.readyState === 'complete') { callback(); }
        };
    }
    script.onerror = function() {
        if (isSubmit) {
            _show_error("43", "Übermittlung fehlgeschlagen. Bitte versuche es erneut.");
        }
    };
    document.head.appendChild(script);
};
(function() {
    var form_to_submit = document.getElementById('_form_43_');
    if (!form_to_submit) return;

    var _form_serialize = function(form) {
        if (!form || form.nodeName !== "FORM") return;
        var i, q = [];
        for (i = 0; i < form.elements.length; i++) {
            if (form.elements[i].name === "") continue;
            switch (form.elements[i].nodeName) {
                case "INPUT":
                    switch (form.elements[i].type) {
                        case "text": case "hidden": case "password": case "button": case "reset": case "submit":
                            q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
                            break;
                        case "checkbox": case "radio":
                            if (form.elements[i].checked) q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
                            break;
                    }
                    break;
                case "TEXTAREA":
                    q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
                    break;
                case "SELECT":
                    q.push(form.elements[i].name + "=" + encodeURIComponent(form.elements[i].value));
                    break;
            }
        }
        return q.join("&");
    };

    form_to_submit.addEventListener('submit', function(e) {
        e.preventDefault();
        var emailInput = form_to_submit.querySelector('input[name="email"]');
        if (!emailInput || !emailInput.value || !emailInput.value.match(/^[\+_a-z0-9-'&=]+(\.[\+_a-z0-9-']+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,})$/i)) {
            _show_error("43", "Bitte gib eine gültige E-Mail-Adresse ein.");
            return false;
        }
        var submitButton = form_to_submit.querySelector('#_form_43_submit');
        submitButton.disabled = true;
        submitButton.textContent = 'Wird gesendet...';
        var serialized = _form_serialize(form_to_submit).replace(/%0A/g, '\\n');
        _load_script('https://michael-geiregger.activehosted.com/proc.php?' + serialized + '&jsonp=true', null, true);
    });
})();
