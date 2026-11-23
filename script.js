/* =========================================================
   Latar bergerak: bunga, kelopak, love, dan kilauan (canvas)
   ========================================================= */
(function () {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const TAU = Math.PI * 2;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, dpr = 1;
    let particles = [];
    let bursts = [];

    const rand = (a, b) => a + Math.random() * (b - a);

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const target = W < 600 ? 24 : 42;
        while (particles.length < target) particles.push(makeParticle(true));
        if (particles.length > target) particles.length = target;
    }

    function pickType() {
        const r = Math.random();
        if (r < 0.30) return 'flower';
        if (r < 0.55) return 'petal';
        if (r < 0.80) return 'heart';
        return 'sparkle';
    }

    function makeParticle(anywhere) {
        const type = pickType();
        const small = W < 600;
        const size = type === 'sparkle' ? rand(6, 14) : (small ? rand(9, 22) : rand(11, 30));
        const p = {
            type,
            size,
            x: rand(0, W),
            y: anywhere ? rand(0, H) : (type === 'heart' ? H + size : -size),
            vy: type === 'heart' ? -rand(0.3, 0.75) : (type === 'sparkle' ? rand(-0.1, 0.1) : rand(0.35, 1.0)),
            sway: rand(0.15, 0.6),
            phase: rand(0, TAU),
            ps: rand(0.01, 0.025),
            rot: rand(0, TAU),
            rv: rand(-0.012, 0.012),
            alpha: rand(0.16, 0.5),
            filled: Math.random() < 0.4
        };
        return p;
    }

    function recycle(p) {
        const fresh = makeParticle(false);
        Object.assign(p, fresh);
    }

    /* ---------- bentuk ---------- */
    function heart(s) {
        ctx.beginPath();
        ctx.moveTo(0, s * 0.4);
        ctx.bezierCurveTo(-s * 0.95, -s * 0.15, -s * 0.5, -s * 0.85, 0, -s * 0.35);
        ctx.bezierCurveTo(s * 0.5, -s * 0.85, s * 0.95, -s * 0.15, 0, s * 0.4);
        ctx.closePath();
    }

    function flower(s, filled) {
        for (let i = 0; i < 5; i++) {
            ctx.save();
            ctx.rotate((i * TAU) / 5);
            ctx.beginPath();
            ctx.ellipse(0, -s * 0.5, s * 0.24, s * 0.46, 0, 0, TAU);
            if (filled) ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.14, 0, TAU);
        ctx.stroke();
    }

    function petal(s) {
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.6);
        ctx.bezierCurveTo(s * 0.55, -s * 0.3, s * 0.4, s * 0.4, 0, s * 0.6);
        ctx.bezierCurveTo(-s * 0.4, s * 0.4, -s * 0.55, -s * 0.3, 0, -s * 0.6);
        ctx.closePath();
    }

    function sparkle(s) {
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(0, 0, s, 0);
        ctx.quadraticCurveTo(0, 0, 0, s);
        ctx.quadraticCurveTo(0, 0, -s, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s);
        ctx.closePath();
    }

    function drawShape(p, alpha) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.type === 'sparkle' ? 0 : p.rot);
        ctx.strokeStyle = 'rgba(255,255,255,' + alpha + ')';
        ctx.fillStyle = 'rgba(255,255,255,' + (alpha * 0.4) + ')';
        ctx.lineWidth = 1.3;
        ctx.lineJoin = 'round';

        switch (p.type) {
            case 'flower':
                flower(p.size, p.filled);
                break;
            case 'petal':
                petal(p.size);
                if (p.filled) ctx.fill();
                ctx.stroke();
                break;
            case 'heart':
                heart(p.size);
                if (p.filled) {
                    ctx.fillStyle = 'rgba(255,255,255,' + (alpha * 0.55) + ')';
                    ctx.fill();
                }
                ctx.stroke();
                break;
            case 'sparkle':
                sparkle(p.size);
                ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
                ctx.fill();
                break;
        }
        ctx.restore();
    }

    /* ---------- ledakan kecil saat layar disentuh ---------- */
    function spawnBurst(x, y) {
        const types = ['heart', 'flower', 'sparkle', 'heart'];
        for (let i = 0; i < 8; i++) {
            const type = types[i % types.length];
            const ang = rand(-Math.PI * 0.95, -Math.PI * 0.05);
            const sp = rand(1.6, 4.2);
            bursts.push({
                type,
                size: type === 'sparkle' ? rand(6, 11) : rand(10, 20),
                x, y,
                vx: Math.cos(ang) * sp,
                vy: Math.sin(ang) * sp,
                rot: rand(0, TAU),
                rv: rand(-0.08, 0.08),
                life: 1,
                decay: rand(0.012, 0.022),
                filled: Math.random() < 0.5
            });
        }
    }

    function frame() {
        ctx.clearRect(0, 0, W, H);

        for (const p of particles) {
            p.phase += p.ps;
            p.x += Math.sin(p.phase) * p.sway;
            p.y += p.vy;
            p.rot += p.rv;

            const off = p.size * 2;
            if (p.vy > 0.15 && p.y > H + off) recycle(p);
            else if (p.vy < -0.15 && p.y < -off) recycle(p);
            if (p.x < -off) p.x = W + off;
            if (p.x > W + off) p.x = -off;

            let a = p.alpha;
            if (p.type === 'sparkle') a *= 0.35 + 0.65 * Math.abs(Math.sin(p.phase * 2));
            drawShape(p, a);
        }

        for (let i = bursts.length - 1; i >= 0; i--) {
            const b = bursts[i];
            b.vy += 0.06;
            b.x += b.vx;
            b.y += b.vy;
            b.vx *= 0.99;
            b.rot += b.rv;
            b.life -= b.decay;
            if (b.life <= 0) {
                bursts.splice(i, 1);
                continue;
            }
            drawShape(b, Math.min(1, b.life) * 0.9);
        }

        requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    resize();

    if (reduceMotion) {
        // Tanpa animasi: gambar satu kali saja
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => drawShape(p, p.alpha));
    } else {
        requestAnimationFrame(frame);
        document.addEventListener('pointerdown', (e) => spawnBurst(e.clientX, e.clientY));
    }
})();

/* =========================================================
   Musik
   ========================================================= */
const musicBtn = document.getElementById('music-btn');
const bgMusic = document.getElementById('bg-music');
const musicLabel = musicBtn.querySelector('.music-label');
let isPlaying = false;

function setPlaying(state) {
    isPlaying = state;
    musicLabel.textContent = state ? 'Pause' : 'Play';
    musicBtn.classList.toggle('playing', state);
    musicBtn.setAttribute('aria-label', state ? 'Jeda Musik' : 'Putar Musik');
}

musicBtn.addEventListener('click', () => {
    if (isPlaying) {
        bgMusic.pause();
        setPlaying(false);
    } else {
        const result = bgMusic.play();
        if (result && typeof result.then === 'function') {
            result.then(() => setPlaying(true)).catch(() => setPlaying(false));
        } else {
            setPlaying(true);
        }
    }
});

/* =========================================================
   Kalimat "i Made this website just for you" muncul pelan-pelan
   ========================================================= */
const forYouEl = document.getElementById('for-you-text');

if (forYouEl) {
    const rawText = forYouEl.textContent.trim();
    const words = rawText.split(/\s+/);
    forYouEl.textContent = '';

    words.forEach((word, index) => {
        const span = document.createElement('span');
        span.className = 'word-piece';
        span.textContent = word;
        forYouEl.appendChild(span);

        setTimeout(() => {
            span.classList.add('shown');
        }, 450 + index * 190);
    });
}

/* =========================================================
   Card interaktif ("awal kita kenalan", "nama kamu", "pengakuan")
   ========================================================= */
const expandCards = document.querySelectorAll('.expand-card');

expandCards.forEach(card => {
    const tapHint = card.querySelector('.tap-hint');

    function toggleCard() {
        const isOpen = card.classList.toggle('open');
        card.setAttribute('aria-expanded', isOpen);
        if (tapHint) {
            tapHint.textContent = isOpen
                ? 'Klik lagi untuk menutup'
                : 'Klik card ini untuk membuka ceritanya';
        }
    }

    card.addEventListener('click', toggleCard);
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCard();
        }
    });
});

/* =========================================================
   Pop-up bingkai foto (klik lagi untuk kembali)
   ========================================================= */
const cuteFrames = document.querySelectorAll('.cute-frame');
const photoModal = document.getElementById('photo-modal');
const photoModalFrame = document.getElementById('photo-modal-frame');
const photoModalBackdrop = document.getElementById('photo-modal-backdrop');

function openPhotoModal(frameEl) {
    if (!photoModal || !photoModalFrame) return;
    const clone = frameEl.cloneNode(true);
    clone.classList.remove('reveal', 'active');
    clone.removeAttribute('role');
    clone.removeAttribute('tabindex');
    clone.addEventListener('click', closePhotoModal);

    photoModalFrame.innerHTML = '';
    photoModalFrame.appendChild(clone);

    photoModal.classList.add('show');
    photoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closePhotoModal() {
    if (!photoModal) return;
    photoModal.classList.remove('show');
    photoModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

cuteFrames.forEach(frame => {
    frame.addEventListener('click', () => openPhotoModal(frame));
    frame.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPhotoModal(frame);
        }
    });
});

if (photoModalBackdrop) {
    photoModalBackdrop.addEventListener('click', closePhotoModal);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && photoModal && photoModal.classList.contains('show')) {
        closePhotoModal();
    }
});

/* =========================================================
   Surat: efek ketikan satu per satu
   ========================================================= */
const letterSection = document.getElementById('surat-untuk-mu');
const letterTargets = letterSection
    ? Array.from(letterSection.querySelectorAll('.letter-greeting, .letter-paragraph, .letter-closing, .letter-signature'))
    : [];

const letterTexts = letterTargets.map(el => el.textContent.trim());
let hasTypedLetter = false;

letterTargets.forEach(el => {
    el.textContent = '';
});

function typeElementText(el, text, speed, callback) {
    let i = 0;
    el.classList.add('typing-cursor');

    function typeNextChar() {
        if (i < text.length) {
            el.textContent += text.charAt(i);
            i++;
            const currentChar = text.charAt(i - 1);
            const delay = (currentChar === '.' || currentChar === ',' || currentChar === '\n')
                ? speed * 4
                : speed;
            setTimeout(typeNextChar, delay);
        } else {
            el.classList.remove('typing-cursor');
            if (callback) callback();
        }
    }

    typeNextChar();
}

function startLetterTyping() {
    if (hasTypedLetter || letterTargets.length === 0) return;
    hasTypedLetter = true;

    function runSequence(index) {
        if (index >= letterTargets.length) return;
        typeElementText(letterTargets[index], letterTexts[index], 35, () => {
            setTimeout(() => runSequence(index + 1), 220);
        });
    }

    runSequence(0);
}

/* =========================================================
   Muncul saat scroll
   ========================================================= */
const reveals = document.querySelectorAll('.reveal');

function checkScroll() {
    const triggerBottom = window.innerHeight * 0.85;

    reveals.forEach(item => {
        const itemTop = item.getBoundingClientRect().top;
        if (itemTop < triggerBottom) {
            item.classList.add('active');
        }
    });

    if (letterSection && !hasTypedLetter) {
        const letterTop = letterSection.getBoundingClientRect().top;
        if (letterTop < window.innerHeight * 0.78) {
            startLetterTyping();
        }
    }
}

window.addEventListener('scroll', checkScroll);
checkScroll();
