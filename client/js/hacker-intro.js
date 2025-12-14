export function initHackerIntro() {
    const introContainer = document.getElementById('hacker-intro');
    if (!introContainer) return;

    // 清空并重建 DOM
    introContainer.innerHTML = `
        <canvas id="matrix-canvas"></canvas>
        <div class="crt-overlay"></div>
        <div class="scanlines"></div>
        <div id="terminal-wrapper">
            <div class="terminal-header">
                <div>NodeCrypt OS v4.0 [SECURE]</div>
                <div id="status-text">INITIALIZING...</div>
            </div>
            <div id="terminal-content"></div>
            <div class="progress-area">
                <div class="progress-label">decrypting_assets...</div>
                <div class="hacker-progress">
                    <div class="hacker-progress-bar" id="load-bar"></div>
                </div>
            </div>
        </div>
    `;

    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    const terminal = document.getElementById('terminal-content');
    const loadBar = document.getElementById('load-bar');
    const statusText = document.getElementById('status-text');

    // --- 终极代码雨引擎 ---
    let width, height;
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // 字符集：片假名 + 拉丁 + 数字
    const chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    // 我们创建多层雨，每层有不同的属性
    // Layer: { fontSize, speed, color_alpha, columns[] }
    // column: { y, chars[], headChar }
    const layers = [
        { fontSize: 32, speed: 6, alpha: 0.15, blur: 4 },  // 远景（大而淡，模糊）-> 实际上如果要制造景深，远的应该小，近的大。反过来：小的在后面
        { fontSize: 16, speed: 3, alpha: 0.3, blur: 2 },   // 中景
        { fontSize: 24, speed: 7, alpha: 0.95, blur: 0 }   // 近景（大字，清晰，快速）
    ];
    // 修正策略：不管3D了，我们做那种满屏覆盖的密集感。
    // 方案：单一强大的图层，但每列有独立速度。

    const columns = [];
    const fontSize = 16;
    let colCount = 0;

    function initMatrix() {
        colCount = Math.floor(width / fontSize);
        for (let i = 0; i < colCount; i++) {
            columns[i] = {
                x: i * fontSize,
                y: Math.random() * -height, // 随机初始高度
                speed: 2 + Math.random() * 5, // 随机速度
                chars: [], // 存储这一列的尾迹字符
                trailLen: 15 + Math.floor(Math.random() * 20), // 随机尾迹长度
                changeRate: Math.random() * 0.1 // 字符变换概率
            };
        }
    }
    initMatrix();

    function drawMatrix() {
        // 拖尾效果：绘制半透明黑色矩形覆盖上一帧
        ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
        ctx.fillRect(0, 0, width, height);

        ctx.font = "bold " + fontSize + "px 'Courier New'";

        for (let i = 0; i < colCount; i++) {
            const col = columns[i];

            // 产生新的头部字符
            const char = chars[Math.floor(Math.random() * chars.length)];

            // 绘制头部（高亮白）
            ctx.fillStyle = "#fff";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#fff";
            ctx.fillText(char, col.x, col.y);

            // 绘制尾迹（绿色渐变）
            // 这里我们不存储复杂的尾迹数组，而是用简单的重绘技巧：
            // 刚才的 rgba(0,0,0,0.08) 已经在帮我们做尾迹渐隐了。
            // 我们只需要在头部后面补一刀绿色的，让它看起来不像头部那么白

            // 为了让效果更好，我们还是得手动画几个上一帧的位置？
            // 还是简单的：黑色蒙版法已经足够经典。
            // 增强：每列不仅仅是画头，有概率重绘上面的字符成绿色，防止头部一直是白色拖尾

            ctx.shadowBlur = 0;
            ctx.fillStyle = "#0f0";
            // 在当前头部的上方一点点重绘成绿色，模拟"冷却"
            ctx.fillText(chars[Math.floor(Math.random() * chars.length)], col.x, col.y - fontSize * 2);

            // 移动
            col.y += col.speed;

            // 循环
            if (col.y > height && Math.random() > 0.98) {
                col.y = -fontSize;
                col.speed = 2 + Math.random() * 5;
            }
        }
    }

    // 60FPS 循环
    let animationId;
    function loop() {
        drawMatrix();
        animationId = requestAnimationFrame(loop);
    }
    loop();


    // --- 2. System Boot Logs ---
    const logs = [
        { msg: "Wake up, Neo...", type: 'log-system', delay: 1000 }, // 致敬
        { msg: "The Matrix has you...", delay: 1000 },
        { msg: "Follow the white rabbit.", delay: 1000 },
        { msg: "Knock, knock, Neo.", delay: 800 },
        { msg: "Initializing NodeCrypt Kernel...", type: 'log-info', delay: 50 }, // 回到正题
        { msg: "Loading decentralized ledger...", delay: 50 },
        { msg: "Bypassing corporate firewalls...", delay: 50 },
        { msg: "Mounting secure volumes...", delay: 50 },
        { msg: "Injecting payload: client_bundle.js", delay: 100 },
        { msg: "Establishing secure handshake...", delay: 100 },
        { msg: "Access Granted. Level 9 Authorization.", type: 'log-success', delay: 200 },
        { msg: "Loading 3D Environment...", delay: 100 },
        { msg: "System Ready.", type: 'log-success', delay: 500 }
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

        // 时间戳
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        div.innerHTML = `<span class="log-time">[${time}]</span><span class="log-message">${log.msg}</span>`;
        terminal.appendChild(div);

        // 保持只显示最后 12 行
        if (terminal.children.length > 12) {
            terminal.removeChild(terminal.children[0]);
        }

        // 进度条
        const pct = Math.floor(((logIndex + 1) / logs.length) * 100);
        loadBar.style.width = pct + "%";

        // 更新状态文字
        statusText.innerText = `LOADING... ${pct}%`;

        logIndex++;

        // 只有前几行（黑客帝国台词）慢一点，后面飞快
        let realDelay = log.delay;
        if (logIndex > 4) realDelay = 30 + Math.random() * 50; // 极速刷屏

        setTimeout(addLog, realDelay);
    }

    setTimeout(addLog, 1000); // 1秒后开始出字


    // --- 3. Finish ---
    function finishBoot() {
        statusText.innerText = "SYSTEM READY";
        statusText.style.color = "#0f0";
        statusText.style.textShadow = "0 0 10px #0f0";

        loadBar.style.width = "100%";
        loadBar.style.background = "#fff";
        loadBar.style.boxShadow = "0 0 15px #fff";

        setTimeout(() => {
            // 爆炸式淡出
            introContainer.classList.add('fade-out');
            document.body.classList.add('intro-finished');

            // 2秒后彻底销毁，释放内存
            setTimeout(() => {
                cancelAnimationFrame(animationId);
                introContainer.remove();
            }, 2000);

        }, 800);
    }
}
