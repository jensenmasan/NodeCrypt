
import { startFireworks } from './fireworks.js';

let width, height;

function createOverlayCanvas(id) {
    if (document.getElementById(id)) return null;
    const canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '100000'; // Higher than modals
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    // Handle Resize
    const resizeObserver = new ResizeObserver(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        width = canvas.width;
        height = canvas.height;
    });
    resizeObserver.observe(document.body);

    // Initial size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;

    return canvas;
}

function removeCanvas(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// 2. Starry Sky (Galaxy)
function startStarrySky() {
    const id = 'starry-sky-canvas';
    const canvas = createOverlayCanvas(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2,
            alpha: Math.random(),
            fadeDir: Math.random() < 0.5 ? 1 : -1
        });
    }

    let frameId;
    const duration = 8000;
    const startTime = Date.now();

    function loop() {
        if (Date.now() - startTime > duration) {
            cancelAnimationFrame(frameId);
            canvas.remove();
            return;
        }
        frameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);

        // Darken bg slightly for effect? No, overlay only. 
        // Or maybe a slight radial gradient for "space" feel?
        // Let's keep it transparent but draw bright stars.

        ctx.fillStyle = '#ffffff';
        stars.forEach(s => {
            s.alpha += 0.01 * s.fadeDir;
            if (s.alpha > 1) { s.alpha = 1; s.fadeDir = -1; }
            if (s.alpha < 0) { s.alpha = 0; s.fadeDir = 1; }
            ctx.globalAlpha = s.alpha;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Shooting stars?
        if (Math.random() < 0.05) {
            drawShootingStar(ctx);
        }
    }
    loop();
}
function drawShootingStar(ctx) {
    // Simple line
    const x = Math.random() * width;
    const y = Math.random() * height * 0.5;
    const len = 100 + Math.random() * 100;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - len, y + len * 0.5);
    ctx.stroke();
}

// 3. Confetti
function startConfetti() {
    const id = 'confetti-canvas';
    const canvas = createOverlayCanvas(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const confettis = [];
    const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f', '#fff'];

    for (let i = 0; i < 300; i++) {
        confettis.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 10 + 5,
            speed: Math.random() * 5 + 2,
            drift: Math.random() * 2 - 1,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5
        });
    }

    let frameId;
    const duration = 6000;
    const startTime = Date.now();

    function loop() {
        if (Date.now() - startTime > duration) {
            cancelAnimationFrame(frameId);
            canvas.remove();
            return;
        }
        frameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);

        confettis.forEach(p => {
            p.y += p.speed;
            p.x += p.drift;
            p.rotation += p.rotationSpeed;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();

            if (p.y > height) p.y = -20;
        });
    }
    loop();
}

// 4. Hearts (Love)
function startHearts() {
    const id = 'hearts-canvas';
    const canvas = createOverlayCanvas(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const hearts = [];

    for (let i = 0; i < 50; i++) {
        hearts.push({
            x: Math.random() * width,
            y: height + Math.random() * 100,
            size: Math.random() * 20 + 10,
            speed: Math.random() * 3 + 1,
            wobble: Math.random() * Math.PI * 2,
            color: `hsl(${330 + Math.random() * 30}, 100%, 70%)` // Pink/Red
        });
    }

    let frameId;
    const duration = 6000;
    const startTime = Date.now();

    function loop() {
        if (Date.now() - startTime > duration) {
            cancelAnimationFrame(frameId);
            canvas.remove();
            return;
        }
        frameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);

        hearts.forEach(h => {
            h.y -= h.speed;
            h.wobble += 0.05;
            h.x += Math.sin(h.wobble) * 1;

            ctx.fillStyle = h.color;
            ctx.font = `${h.size}px serif`;
            ctx.fillText('❤', h.x, h.y);

            if (h.y < -50) h.y = height + 50;
        });
    }
    loop();
}

// 5. Bubbles
function startBubbles() {
    const id = 'bubbles-canvas';
    const canvas = createOverlayCanvas(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const bubbles = [];
    for (let i = 0; i < 40; i++) {
        bubbles.push({
            x: Math.random() * width,
            y: height + Math.random() * 200,
            r: Math.random() * 15 + 5,
            speed: Math.random() * 2 + 1,
            wobble: Math.random() * Math.PI * 2
        });
    }

    let frameId;
    const duration = 8000;
    const startTime = Date.now();

    function loop() {
        if (Date.now() - startTime > duration) {
            cancelAnimationFrame(frameId);
            canvas.remove();
            return;
        }
        frameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';

        bubbles.forEach(b => {
            b.y -= b.speed;
            b.wobble += 0.03;
            b.x += Math.sin(b.wobble) * 0.5;

            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Shinies
            ctx.beginPath();
            ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fill();

            if (b.y < -50) b.y = height + 50;
        });
    }
    loop();
}

// 6. Snow (Realistic)
function startSnow() {
    const id = 'snow-canvas';
    const canvas = createOverlayCanvas(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const particles = [];
    const count = 300; // More snow

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 2 + 1, // Size
            speed: Math.random() * 1 + 0.5, // Falling speed
            drift: Math.random(), // Drifting offset
            driftSpeed: Math.random() * 0.02 + 0.01,
            opacity: Math.random() * 0.5 + 0.5
        });
    }

    let frameId;
    const duration = 15000; // Longer duration
    const startTime = Date.now();
    let tick = 0;

    function loop() {
        if (Date.now() - startTime > duration) {
            cancelAnimationFrame(frameId);
            canvas.remove();
            return;
        }
        frameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);
        tick += 0.01;

        ctx.fillStyle = '#fff';

        particles.forEach(p => {
            // Swaying motion
            p.x += Math.sin(tick + p.drift) * 0.5;
            p.y += p.speed;

            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();

            // Wrap around
            if (p.y > height) {
                p.y = -5;
                p.x = Math.random() * width;
            }
            if (p.x > width) p.x = 0;
            if (p.x < 0) p.x = width;
        });
        ctx.globalAlpha = 1;
    }
    loop();
}

// 7. Rain
function startRain() {
    const id = 'rain-canvas';
    const canvas = createOverlayCanvas(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const drops = [];
    for (let i = 0; i < 400; i++) {
        drops.push({
            x: Math.random() * width,
            y: Math.random() * height,
            len: Math.random() * 15 + 5,
            speed: Math.random() * 10 + 5
        });
    }

    let frameId;
    const duration = 6000;
    const startTime = Date.now();

    function loop() {
        if (Date.now() - startTime > duration) {
            cancelAnimationFrame(frameId);
            canvas.remove();
            return;
        }
        frameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        drops.forEach(d => {
            d.y += d.speed;
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x, d.y + d.len);

            if (d.y > height) {
                d.y = -20;
                d.x = Math.random() * width;
            }
        });
        ctx.stroke();
    }
    loop();
}

// 8. Sakura (Cherry Blossom)
function startSakura() {
    const id = 'sakura-canvas';
    const canvas = createOverlayCanvas(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const petals = [];

    for (let i = 0; i < 100; i++) {
        petals.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            size: Math.random() * 10 + 5,
            speed: Math.random() * 2 + 1,
            spin: Math.random() * 360,
            spinSpeed: Math.random() * 2 - 1,
            wobble: 0
        });
    }

    let frameId;
    const duration = 8000;
    const startTime = Date.now();

    function loop() {
        if (Date.now() - startTime > duration) {
            cancelAnimationFrame(frameId);
            canvas.remove();
            return;
        }
        frameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);

        petals.forEach(p => {
            p.y += p.speed;
            p.x += Math.sin(p.y * 0.01 + p.wobble) * 2;
            p.spin += p.spinSpeed;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.spin * Math.PI / 180);

            // Draw petal shape
            ctx.fillStyle = '#ffc0cb';
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            if (p.y > height) {
                p.y = -10;
                p.x = Math.random() * width;
            }
        });
    }
    loop();
}

// 9. Lightning (Realistic Recursive)
function startLightning() {
    const id = 'lightning-canvas';
    const canvas = createOverlayCanvas(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let frameId;
    const duration = 3000; // Short bursts
    const startTime = Date.now();
    let bolts = [];

    // Create a lightning bolt with branches
    function createBolt(x, y, length, angle) {
        let segments = [];
        let currentX = x;
        let currentY = y;
        let leftLength = length;

        while (leftLength > 0 && currentY < height) {
            const segmentLen = Math.random() * 20 + 10;
            const angleVar = (Math.random() - 0.5) * 1; // Jitter
            const newAngle = angle + angleVar;

            const nextX = currentX + Math.cos(newAngle) * segmentLen;
            const nextY = currentY + Math.sin(newAngle) * segmentLen; // Mostly down

            segments.push({ x1: currentX, y1: currentY, x2: nextX, y2: nextY });

            // Branch change
            if (Math.random() < 0.2 && length > 50) {
                // Recursively create smaller bolt
                bolts.push({
                    segments: createBolt(currentX, currentY, length * 0.5, newAngle + (Math.random() > 0.5 ? 0.5 : -0.5)).segments,
                    alpha: 1,
                    life: 10
                });
            }

            currentX = nextX;
            currentY = nextY;
            leftLength -= segmentLen;
        }
        return { segments, alpha: 1, life: 10 + Math.random() * 10 };
    }

    function loop() {
        if (Date.now() - startTime > duration) {
            cancelAnimationFrame(frameId);
            canvas.remove();
            return;
        }
        frameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);

        // Randomly spawn main bolts
        if (Math.random() < 0.05) {
            const startX = Math.random() * width;
            bolts.push(createBolt(startX, 0, height, Math.PI / 2));
            // Flash screen
            ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
            ctx.fillRect(0, 0, width, height);
        }

        // Draw and update bolts
        for (let i = bolts.length - 1; i >= 0; i--) {
            const bolt = bolts[i];
            bolt.alpha -= 0.05;
            bolt.life--;

            if (bolt.life <= 0 || bolt.alpha <= 0) {
                bolts.splice(i, 1);
                continue;
            }

            ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.alpha})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fff';

            ctx.beginPath();
            bolt.segments.forEach(seg => {
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
            });
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
    loop();
}

// 10. Matrix (Green Code Rain)
function startMatrix() {
    const id = 'matrix-canvas';
    const canvas = createOverlayCanvas(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Setup columns
    const columns = Math.floor(width / 20);
    const drops = [];
    for (let i = 0; i < columns; i++) drops[i] = 1;

    const chars = "MATRIXNODECRYPT01";

    let frameId;
    const duration = 6000;
    const startTime = Date.now();
    let lastDraw = 0;

    function loop() {
        if (Date.now() - startTime > duration) {
            cancelAnimationFrame(frameId);
            canvas.remove();
            return;
        }
        frameId = requestAnimationFrame(loop);

        if (Date.now() - lastDraw < 50) return; // Limit speed
        lastDraw = Date.now();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#0F0';
        ctx.font = '15px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * 20, drops[i] * 20);

            if (drops[i] * 20 > height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    loop();
}

// 11. Stress Relief (Explosive Shockwaves)
function startStressRelief() {
    const id = 'stress-relief-canvas';
    const canvas = createOverlayCanvas(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.style.pointerEvents = 'auto'; // Block clicks to capture them for explosion

    const explosions = [];

    canvas.addEventListener('mousedown', (e) => {
        createExplosion(e.clientX, e.clientY);
        // Add screen shake
        document.body.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
        setTimeout(() => document.body.style.transform = '', 50);
    });

    // Auto remove after 20s
    let frameId;
    const duration = 20000;
    const startTime = Date.now();

    // Add visual hint
    const hint = document.createElement('div');
    hint.textContent = "CLICK TO DESTROY!";
    hint.style.position = 'fixed';
    hint.style.top = '20%';
    hint.style.left = '50%';
    hint.style.transform = 'translate(-50%, -50%)';
    hint.style.color = '#ff0000';
    hint.style.fontSize = '3rem';
    hint.style.fontWeight = 'bold';
    hint.style.pointerEvents = 'none';
    hint.style.zIndex = '100001';
    hint.style.fontFamily = 'Impact, sans-serif';
    hint.style.textShadow = '0 0 10px #000';
    document.body.appendChild(hint);
    setTimeout(() => hint.remove(), 2000);

    function createExplosion(x, y) {
        explosions.push({
            x: x, y: y, radius: 0, opacity: 1, type: 'shockwave'
        });
        // Particles
        for (let i = 0; i < 20; i++) {
            explosions.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
                life: 1, type: 'particle', color: `hsl(${Math.random() * 60}, 100%, 50%)`
            });
        }
    }

    function loop() {
        if (Date.now() - startTime > duration) {
            cancelAnimationFrame(frameId);
            canvas.remove();
            return;
        }
        frameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);

        for (let i = explosions.length - 1; i >= 0; i--) {
            let e = explosions[i];
            if (e.type === 'shockwave') {
                e.radius += 15; // Expand fast
                e.opacity -= 0.05;
                if (e.opacity <= 0) {
                    explosions.splice(i, 1);
                    continue;
                }
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 50, 50, ${e.opacity})`;
                ctx.lineWidth = 5;
                ctx.stroke();
            } else {
                // Particle
                e.x += e.vx;
                e.y += e.vy;
                e.life -= 0.05;
                if (e.life <= 0) {
                    explosions.splice(i, 1);
                    continue;
                }
                ctx.fillStyle = e.color;
                ctx.globalAlpha = e.life;
                ctx.beginPath();
                ctx.arc(e.x, e.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
    }
    loop();
}

// 12. Happy New Year 2025
function startNewYear() {
    startFireworks(); // Base fireworks

    const id = 'new-year-canvas';
    const canvas = createOverlayCanvas(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let frameId;
    const duration = 12000;
    const startTime = Date.now();

    // Text properties
    const text = "HAPPY NEW YEAR";
    const subText = "2025"; // Or "2024"? User said "Happy New Year", usually implies upcoming. Let's start with generic or 2025. 2025 is next.
    // Use "祝大家新年快乐" as requested by user actually: "再加一个祝大家新年快乐特效"
    const cnText = "祝大家新年快乐";

    let scale = 0;

    function loop() {
        if (Date.now() - startTime > duration) {
            cancelAnimationFrame(frameId);
            canvas.remove();
            return;
        }
        frameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);

        const elapsed = Date.now() - startTime;
        if (elapsed < 1000) scale = elapsed / 1000;
        else scale = 1 + Math.sin(elapsed * 0.002) * 0.05;

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Glow
        ctx.shadowBlur = 20 + Math.abs(Math.sin(elapsed * 0.005)) * 20;
        ctx.shadowColor = '#FFD700'; // Gold

        // Main Text
        ctx.font = 'bold 8vmin "Microsoft YaHei", sans-serif';
        const hue = (elapsed * 0.1) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.fillText(cnText, 0, -50);

        // Sub Text
        ctx.font = 'bold 15vmin "Arial", sans-serif';
        ctx.fillStyle = '#ff4d4d'; // Red
        ctx.shadowColor = '#ff0000';
        ctx.fillText("2025", 0, 80);

        ctx.restore();
    }
    loop();
}

export const Effects = {
    startFireworks,
    startStarrySky,
    startConfetti,
    startHearts,
    startBubbles,
    startSnow,
    startRain,
    startSakura,
    startLightning,
    startMatrix,
    startStressRelief,
    startNewYear
};
