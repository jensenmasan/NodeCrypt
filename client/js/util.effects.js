
import { startFireworks } from './fireworks.js';

let canvas = null;
let ctx = null;
let animationFrameId = null;
let particles = [];
let width, height;

// --- Starry Sky Effect (Warm) ---
let stars = [];
const STAR_COUNT = 150;

function initStarrySky() {
    if (document.getElementById('starry-sky-canvas')) return;

    canvas = document.createElement('canvas');
    canvas.id = 'starry-sky-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0'; // Behind everything? Or overlay with opacity?
    // User wants "Starry Sky ... warm". Usually this means background.
    // But since it's an "Effect", maybe an overlay is better, or we modify the theme background.
    // Let's make it a background overlay.
    // Actually, "Day/Night" mode usually sets background. 
    // The "Start Starry Sky" effect might mean a temporary spectacular animation, OR just enforcing the night theme.
    // BUT, the user also said "Chat input box ... add auto send ... Starry Sky". This implies an effect sent to others.
    // So let's make it a beautiful full-screen overlay that fades in/out or stays for a while.
    canvas.style.zIndex = '99998'; // Below fireworks but above content? No, needs to be see-through.
    // If it's "Starry Sky" sent to everyone, it should probably be a temporary "Meteor Shower" or "Galaxy" effect.
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    ctx = canvas.getContext('2d');
    resize();

    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2,
            blinkSpeed: 0.02 + Math.random() * 0.05,
            opacity: Math.random(),
            dir: 1
        });
    }

    // Meteors
    let meteors = [];

    function loop() {
        animationFrameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);

        // Draw Stars
        ctx.fillStyle = 'white';
        stars.forEach(s => {
            s.opacity += s.blinkSpeed * s.dir;
            if (s.opacity > 1) { s.opacity = 1; s.dir = -1; }
            if (s.opacity < 0.2) { s.opacity = 0.2; s.dir = 1; }

            ctx.globalAlpha = s.opacity;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Meteors (Shooting Stars)
        if (Math.random() < 0.02) {
            meteors.push({
                x: Math.random() * width,
                y: Math.random() * height / 2,
                vx: -4 - Math.random() * 4,
                vy: 2 + Math.random() * 4,
                len: 0
            });
        }

        ctx.strokeStyle = 'rgba(255, 255, 200, 0.8)';
        ctx.lineWidth = 2;
        for (let i = meteors.length - 1; i >= 0; i--) {
            let m = meteors[i];
            m.x += m.vx;
            m.y += m.vy;
            m.len += 1;

            ctx.globalAlpha = 1 - (m.len / 50); // Fade out
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(m.x - m.vx * 5, m.y - m.vy * 5); // Trail
            ctx.stroke();

            if (m.x < 0 || m.y > height || m.len > 50) meteors.splice(i, 1);
        }
        ctx.globalAlpha = 1;
    }

    loop();

    // Auto remove after 10 seconds? Or keep it?
    // "Auto send ... Starry Sky". Let's last 10 seconds.
    setTimeout(() => {
        cancelAnimationFrame(animationFrameId);
        canvas.remove();
    }, 10000);
}

// --- Confetti / Salute Effect ---
function initConfetti() {
    if (document.getElementById('confetti-canvas')) return;

    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '99999';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    ctx = canvas.getContext('2d');
    resize();

    const confettiCount = 300;
    const confettis = [];
    const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f', '#fff'];

    for (let i = 0; i < confettiCount; i++) {
        confettis.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            r: Math.random() * 6 + 4,
            d: Math.random() * confettiCount,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
            tiltAngle: 0
        });
    }

    function loop() {
        animationFrameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);

        confettis.forEach((p, i) => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
            p.tilt = Math.sin(p.tiltAngle - i / 3) * 15;

            ctx.beginPath();
            ctx.lineWidth = p.r / 2;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
            ctx.stroke();

            // Refund at top
            if (p.y > height) {
                // confettis.splice(i, 1); // Remove
                // Or loop? Let's remove to end it naturally
                confettis[i] = {
                    x: Math.random() * width,
                    y: -10,
                    r: p.r,
                    d: p.d,
                    color: p.color,
                    tilt: p.tilt,
                    tiltAngleIncremental: p.tiltAngleIncremental,
                    tiltAngle: p.tiltAngle
                };
                // Stop re-adding after some time
                if (Date.now() - startTime > 5000) {
                    confettis.splice(i, 1);
                }
            }
        });

        if (confettis.length === 0) {
            cancelAnimationFrame(animationFrameId);
            canvas.remove();
        }
    }

    const startTime = Date.now();
    loop();
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    if (canvas) {
        canvas.width = width;
        canvas.height = height;
    }
}

window.addEventListener('resize', resize);

export const Effects = {
    startFireworks: startFireworks,
    startStarrySky: initStarrySky,
    startConfetti: initConfetti
};
