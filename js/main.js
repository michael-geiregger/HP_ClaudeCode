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
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const btn = this.querySelector('.newsletter-btn');
        const fields = this.querySelector('.newsletter-fields');
        const note = this.closest('.newsletter-content').querySelector('.newsletter-note');
        const successDiv = this.querySelector('.newsletter-success');

        btn.disabled = true;
        btn.textContent = 'Wird gesendet...';

        const formData = new FormData(this);
        const serialized = new URLSearchParams(formData).toString();

        const script = document.createElement('script');
        script.src = 'https://michael-geiregger.activehosted.com/proc.php?' + serialized + '&jsonp=true';
        script.onerror = function() {
            btn.disabled = false;
            btn.textContent = 'Ja, will ich haben!';
        };
        document.head.appendChild(script);

        // Show success after short delay (JSONP doesn't give reliable callbacks)
        setTimeout(function() {
            fields.style.display = 'none';
            btn.style.display = 'none';
            if (note) note.style.display = 'none';
            successDiv.style.display = 'block';
        }, 1500);
    });
}
