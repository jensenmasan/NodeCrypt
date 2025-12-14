export function initHackerIntro() {
    const introContainer = document.getElementById('hacker-intro');
    if (!introContainer) return;

    // 清空并重建 DOM - 适配新的蓝色 HUD 风格
    introContainer.innerHTML = `
        <canvas id="warp-canvas"></canvas>
        <div class="crt-overlay"></div>
        <div class="scanlines"></div>
        <div id="terminal-wrapper">
            <div class="terminal-header">
                <div>HYPERSPACE LINK</div>
                <div id="status-text">CALIBRATING...</div>
            </div>
            <div id="terminal-content"></div>
            <div class="progress-area">
                <div class="progress-label"><span>SYSTEM_INTEGRITY</span><span id="pct-num">0%</span></div>
                <div class="hacker-progress">
                    <div class="hacker-progress-bar" id="load-bar"></div>
                </div>
            </div>
        </div>
    `;

    const canvas = document.getElementById('warp-canvas');
    const ctx = canvas.getContext('2d');
    const terminal = document.getElementById('terminal-content');
    const loadBar = document.getElementById('load-bar');
    const statusText = document.getElementById('status-text');
    const pctNum = document.getElementById('pct-num');

    // --- Hyperspace Warp Engine ---
    let width, height;
    let stars = [];
    const STAR_COUNT = 1000;
    let speed = 2; // 初始速度
    let warpState = 'normal'; // normal -> acc -> warp -> stop

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // 初始化星星
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: (Math.random() - 0.5) * width,
            y: (Math.random() - 0.5) * height,
            z: Math.random() * width // 深度
        });
    }

    function drawWarp() {
        // 残影效果：不用全清，而是覆盖半透明黑
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; // 稍微拖一点尾巴，不需要太长
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;

        ctx.fillStyle = "#fff";

        for (let i = 0; i < STAR_COUNT; i++) {
            const star = stars[i];

            // 移动星星 z 轴
            star.z -= speed;

            // 复位：如果星星跑到背后去了，就从远处重新放回来
            if (star.z <= 0) {
                star.z = width;
                star.x = (Math.random() - 0.5) * width;
                star.y = (Math.random() - 0.5) * height;
            }

            // 投影到 2D
            // size = (focalLength / z)
            // x2d = x * size + cx

            const k = 250 / star.z; // 投影系数
            const px = star.x * k + cx;
            const py = star.y * k + cy;

            // 只有当点在屏幕内才绘制
            if (px >= 0 && px <= width && py >= 0 && py <= height) {
                // 大小随距离变化
                const size = (1 - star.z / width) * 3;

                // 颜色变化：Warp 状态下变蓝
                let g = 255;
                let b = 255;
                if (warpState === 'warp') {
                    // 它是条线
                    const oldPx = star.x * (250 / (star.z + speed * 2)) + cx;
                    const oldPy = star.y * (250 / (star.z + speed * 2)) + cy;

                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(100, 200, 255, ${1 - star.z / width})`;
                    ctx.lineWidth = size * 0.5;
                    ctx.moveTo(px, py);
                    ctx.lineTo(oldPx, oldPy);
                    ctx.stroke();
                } else {
                    // 它是点
                    const shade = Math.floor((1 - star.z / width) * 255);
                    ctx.fillStyle = `rgb(${shade}, ${shade}, 255)`; // 稍带蓝色
                    ctx.fillRect(px, py, size, size);
                }
            }
        }
    }

    let animationId;
    function loop() {
        drawWarp();

        // 速度控制
        if (warpState === 'acc') {
            speed *= 1.05;
            if (speed > 80) {
                speed = 80;
                warpState = 'warp';
            }
        }

        animationId = requestAnimationFrame(loop);
    }
    loop();


    // --- 2. System Boot Logs (Simplified & Sci-Fi) ---
    const logs = [
        { msg: "Initializing kernel...", delay: 200 },
        { msg: "Loading quantum modules...", delay: 100 },
        { msg: "Decrypting neural networks...", delay: 100 },
        { msg: "Establishing secure uplink...", delay: 100 },
        { msg: "Verifying user biometrics...", type: 'log-info', delay: 300 },
        { msg: "Identity confirmed: ACCESS GRANTED", type: 'log-success', delay: 200 },
        { msg: "Engaging hyper-drive...", type: 'log-warn', delay: 50 }, // 触发加速
        { msg: "Warp speed initialized.", delay: 50 },
        { msg: "Approaching destination...", delay: 1000 }, // 保持飞行一会儿
        { msg: "Dropping from hyperspace.", type: 'log-success', delay: 500 } // 结束
    ];

    let logIndex = 0;

    function addLog() {
        if (logIndex >= logs.length) {
            finishBoot();
            return;
        }

        const log = logs[logIndex];
        const div = document.createElement('div');
        div.className = `log-line ${log.type || ''}`;

        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

        div.innerHTML = `<span class="log-time">${time}</span><span class="log-message">${log.msg}</span>`;
        terminal.appendChild(div);

        if (terminal.children.length > 8) {
            terminal.removeChild(terminal.children[0]);
        }

        // 更新进度条
        const pct = Math.floor(((logIndex + 1) / logs.length) * 100);
        loadBar.style.width = pct + "%";
        pctNum.innerText = pct + "%";

        // 触发逻辑：当显示 "Engaging hyper-drive" 时，canvas 加速
        if (log.msg.includes("Engaging")) {
            warpState = 'acc'; // 开始加速
            statusText.innerText = "ACCELERATING";
            statusText.style.color = "#00d9ff";
        }

        logIndex++;
        setTimeout(addLog, log.delay);
    }

    setTimeout(addLog, 500);


    // --- 3. Finish ---
    function finishBoot() {
        statusText.innerText = "ARRIVAL COMPLETE";
        statusText.style.color = "#00ffaa";

        loadBar.style.width = "100%";
        pctNum.innerText = "100%";

        setTimeout(() => {
            // 结束动画
            introContainer.classList.add('fade-out'); // 这个CSS类会让容器变大并透明，像穿过去一样
            document.body.classList.add('intro-finished');

            setTimeout(() => {
                cancelAnimationFrame(animationId);
                introContainer.remove();
            }, 1000);

        }, 500);
    }
}
