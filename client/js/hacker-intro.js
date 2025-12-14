export function initHackerIntro() {
    const introContainer = document.getElementById('hacker-intro');
    if (!introContainer) return;

    // 清空并重建 DOM - 适配绿色 HUD 风格
    introContainer.innerHTML = `
        <canvas id="matrix-canvas"></canvas>
        <div class="crt-overlay"></div>
        <div class="scanlines"></div>
        <div id="terminal-wrapper">
            <div class="terminal-header">
                <div>MATRIX CONNECTION</div>
                <div id="status-text">DECYPHERING...</div>
            </div>
            <div id="terminal-content"></div>
            <div class="progress-area">
                <div class="progress-label"><span>SYSTEM_LOAD</span><span id="pct-num">0%</span></div>
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
    const pctNum = document.getElementById('pct-num');

    // --- Ultimate Matrix Rain Engine ---
    let width, height;

    // 灵魂字符集：片假名 + 数字 + 少量大写字母
    const katakana = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
    const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const alphabet = katakana + latin + nums;

    const fontSize = 16;
    let columns;
    let drops = []; // 存储每一列当前的 y 坐标（以行数计）

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        columns = Math.ceil(width / fontSize);

        // 初始化 drops
        drops = [];
        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -height / fontSize; // 随机起始高度，有些在屏幕外
        }
    }
    resize();
    window.addEventListener('resize', resize);


    function drawMatrix() {
        // 半透明黑色遮罩，制造尾迹渐隐效果
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, width, height);

        ctx.font = "bold " + fontSize + "px 'Share Tech Mono', monospace";

        for (let i = 0; i < drops.length; i++) {
            // 随机字符
            const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));

            const x = i * fontSize;
            const y = drops[i] * fontSize;

            // 绘制逻辑：
            // 1. 头部高亮（亮白色）
            ctx.fillStyle = "#fff";
            ctx.shadowColor = "#fff";
            ctx.shadowBlur = 8;
            ctx.fillText(text, x, y);

            // 2. 尾巴（绿色）- 重新绘制上一个位置的字符为绿色，覆盖掉之前的白色头部
            // 技巧：我们不需要显式存上一个字符，因为下一帧遮罩会把它变暗，
            // 但为了消除白色的残留，我们可以手动补一刀绿色的

            // 更好的做法：只画白色的头，让遮罩层自然把它变暗。
            // 但为了经典效果，我们希望头部之上的字符是鲜绿色的

            if (drops[i] > 1) {
                // 读取或随机生成一个字符覆盖在头部的上方
                const tailText = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                ctx.fillStyle = "#0f0";
                ctx.shadowColor = "#0f0";
                ctx.shadowBlur = 0; // 尾巴不发光或少发光
                ctx.fillText(tailText, x, y - fontSize);
            }

            // 移动
            drops[i]++;

            // 循环：如果超出屏幕且随机重置
            if (y > height && Math.random() > 0.975) {
                drops[i] = 0;
            }
        }
    }

    let animationId;
    function loop() {
        drawMatrix();
        animationId = requestAnimationFrame(loop);
    }
    loop();


    // --- 2. System Boot Logs (Hacker Style) ---
    const logs = [
        { msg: "Wake up, Neo...", type: 'log-root', delay: 1500 },
        { msg: "The Matrix has you...", type: 'log-info', delay: 1000 },
        { msg: "Follow the white rabbit.", delay: 1000 },
        { msg: "Knock, knock.", delay: 800 },
        { msg: "Connecting to Zion Mainframe...", delay: 200 },
        { msg: "Bypassing sentinel firewalls...", delay: 100 },
        { msg: "Decrypting NodeCrypt protocols...", type: 'log-info', delay: 100 },
        { msg: "Uploading consciousness...", delay: 100 },
        { msg: "System checks: OPTIMAL", type: 'log-root', delay: 200 },
        { msg: "Accessing deep web nodes...", delay: 100 },
        { msg: "Welcome to the real world.", type: 'log-root', delay: 500 }
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
        const time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

        div.innerHTML = `<span class="log-time">[${time}]</span><span class="log-message">${log.msg}</span>`;
        terminal.appendChild(div);

        // 保持只显示最后几行
        if (terminal.children.length > 8) {
            terminal.removeChild(terminal.children[0]);
        }

        // 进度条
        const pct = Math.floor(((logIndex + 1) / logs.length) * 100);
        loadBar.style.width = pct + "%";
        pctNum.innerText = pct + "%";

        // 随机乱码状态
        statusText.innerText = Math.random().toString(36).substring(2, 10).toUpperCase();

        logIndex++;

        // 动态调整速度：台词慢，日志快
        let realDelay = log.delay;
        if (logIndex > 4) realDelay = 50 + Math.random() * 50;

        setTimeout(addLog, realDelay);
    }

    setTimeout(addLog, 1000);


    // --- 3. Finish ---
    function finishBoot() {
        statusText.innerText = "ACCESS GRANTED";
        statusText.style.color = "#fff";
        statusText.style.textShadow = "0 0 10px #fff";

        loadBar.style.width = "100%";
        loadBar.style.background = "#fff";
        loadBar.style.boxShadow = "0 0 20px #fff";

        setTimeout(() => {
            // 经典 CRT 关机效果（这里只是淡出）
            introContainer.classList.add('fade-out');
            document.body.classList.add('intro-finished');

            // 确保停止动画
            setTimeout(() => {
                cancelAnimationFrame(animationId);
                introContainer.remove();
            }, 1000);

        }, 800);
    }
}
