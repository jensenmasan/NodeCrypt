export function initHackerIntro() {
    const introContainer = document.getElementById('hacker-intro');
    // 如果没有找到容器，说明没有加载对应HTML结构
    if (!introContainer) return;

    // 清空现有的简单内容，构建新的 DOM 结构
    introContainer.innerHTML = `
        <canvas id="matrix-canvas"></canvas>
        <div id="screen-container">
            <div class="scanlines"></div>
            <div class="noise-overlay"></div>
            <div id="terminal-wrapper">
                <div class="terminal-header">
                    <div class="header-left">
                        <span>NODECRYPT OS v3.0.1</span>
                        <span>KERNEL: SECURE</span>
                    </div>
                    <div class="header-right">System Initializing...</div>
                </div>
                <div id="terminal-content"></div>
                <div class="progress-area">
                    <div class="progress-label">decrypting_core_assets...</div>
                    <div class="hacker-progress">
                        <div class="hacker-progress-bar" id="load-bar"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const terminal = document.getElementById('terminal-content');
    const loadBar = document.getElementById('load-bar');
    const headerStatus = document.querySelector('.header-right');
    const progressLabel = document.querySelector('.progress-label');

    // --- 1. Matrix Rain Effect ---
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');

    // 自适应 Canvas 大小
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*ﾂdｸ";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;

    let matrixInterval;

    function drawMatrix() {
        // 半透明黑色背景，形成拖尾效果
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#0F0"; // 矩阵雨绿色
        ctx.font = fontSize + "px 'Courier New'";

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975)
                drops[i] = 0;

            drops[i]++;
        }
    }

    // 启动矩阵雨
    matrixInterval = setInterval(drawMatrix, 33);


    // --- 2. System Logs ---
    const logs = [
        { msg: "Booting NodeCrypt Kernel...", type: 'log-system', delay: 200 },
        { msg: "Mounting virtual file system...", delay: 50 },
        { msg: "Loading security protocol: AES-256-GCM", delay: 80 },
        { msg: "Loading security protocol: ECDH-P521", delay: 80 },
        { msg: "Verifying integrity of local modules...", delay: 200 },
        { msg: "[OK] Core integrity check passed.", type: 'log-success', delay: 50 },
        { msg: "Initializing decentralized network interface...", type: 'log-info', delay: 150 },
        { msg: "Scanning for nearby nodes...", delay: 100 },
        { msg: "Found 0 peer(s)... switching to standalone mode.", type: 'log-warn', delay: 100 },
        { msg: "Allocating 3D graphics memory (VRAM)...", delay: 120 },
        { msg: "Compiling shaders for particle engine...", delay: 150 },
        { msg: "Activating neural interface bridge...", delay: 100 },
        { msg: "Calibrating 3D gesture sensors...", delay: 100 },
        { msg: "Establishing secure tunnel to nowhere...", delay: 100 },
        { msg: "Bypassing mainstream surveillance...", type: 'log-success', delay: 200 },
        { msg: "System Ready. Welcome, User.", type: 'log-system', delay: 600 }
    ];

    let logIndex = 0;

    // 生成带时间戳的行
    function createLogLine(log) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`;

        const line = document.createElement('div');
        line.className = `log-line ${log.type || ''}`;
        line.innerHTML = `<span class="log-time">[${timeStr}]</span><span class="log-message">${log.msg}</span>`;
        return line;
    }

    function processLog() {
        if (logIndex >= logs.length) {
            completeBoot();
            return;
        }

        const log = logs[logIndex];
        const lineElement = createLogLine(log);
        terminal.appendChild(lineElement);

        // 自动滚动
        // 保持只显示最近几行，模拟真实终端刷新，防止DOM过多（虽然后面会销毁）
        if (terminal.children.length > 15) {
            terminal.removeChild(terminal.children[0]);
        }

        // 更新进度条
        const progress = Math.min(100, Math.floor(((logIndex + 1) / logs.length) * 100));
        loadBar.style.width = `${progress}%`;
        progressLabel.innerText = `LOADING SYSTEM MODULES... ${progress}%`;

        // 随机停顿增加真实感
        const randomDelay = log.delay + (Math.random() * 50 - 25);

        logIndex++;
        setTimeout(processLog, randomDelay);
    }

    // --- 3. Completion & Transition ---
    function completeBoot() {
        headerStatus.innerText = "SYSTEM ONLINE";
        headerStatus.style.color = "#0f0";
        headerStatus.style.animation = "none";
        loadBar.style.boxShadow = "0 0 20px #fff"; // 亮一下
        loadBar.style.background = "#fff";

        setTimeout(() => {
            // 开始淡出
            introContainer.classList.add('fade-out');

            // 通知 CSS 3D 粒子系统淡入
            document.body.classList.add('intro-finished');

            // 停止矩阵雨以节省性能
            setTimeout(() => {
                clearInterval(matrixInterval);
                introContainer.style.display = 'none';
                /*
                 * 注意：这里我们移除了 DOM 元素，所以之后无法再次播放
                 * 如果需要重新播放，可能需要 reload 页面
                 */
                introContainer.innerHTML = '';
            }, 1500); // 等待淡出动画结束

        }, 800);
    }

    // Start Sequence
    setTimeout(processLog, 500);
}
