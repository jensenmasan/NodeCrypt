
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

// 6. Snow
function startSnow() {
    const id = 'snow-canvas';
    const canvas = createOverlayCanvas(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const particles = [];
    for (let i = 0; i < 200; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 3 + 1,
            speed: Math.random() * 2 + 0.5,
            drift: Math.random() * 0.5
        });
    }

    let frameId;
    const duration = 10000;
    const startTime = Date.now();

    function loop() {
        if (Date.now() - startTime > duration) {
            cancelAnimationFrame(frameId);
            canvas.remove();
            return;
        }
        frameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = '#fff';
        particles.forEach(p => {
            p.y += p.speed;
            p.x += Math.sin(p.y * 0.01) + p.drift;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();

            if (p.y > height) {
                p.y = -5;
                p.x = Math.random() * width;
            }
        });
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
    const petalImg = new Image();
    // Simple drawing fallback or use image? Let's simply draw shapes.

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

// 9. Lightning
function startLightning() {
    const id = 'lightning-canvas';
    const canvas = createOverlayCanvas(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let flash = 0;

    let frameId;
    const duration = 2000;
    const startTime = Date.now();

    function drawBolt(x, y) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);

        let currX = x;
        let currY = y;
        while (currY < height) {
            currY += Math.random() * 50;
            currX += (Math.random() - 0.5) * 50;
            ctx.lineTo(currX, currY);
        }
        ctx.stroke();
    }

    function loop() {
        if (Date.now() - startTime > duration) {
            cancelAnimationFrame(frameId);
            canvas.remove();
            return;
        }
        frameId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, width, height);

        // Random Flash
        if (Math.random() < 0.05) {
            flash = 20;
            drawBolt(Math.random() * width, 0);
        }

        if (flash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flash / 40})`;
            ctx.fillRect(0, 0, width, height);
            flash--;
        }
    }
    loop();
}

// 10. Cube (Geometrical shapes) - Replaced "Spiral" with something cooler: 3D Cubes/Matrix?
// Let's do "Matrix" (Green Code Rain)
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
    startMatrix
};
