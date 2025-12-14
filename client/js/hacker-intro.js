export function initHackerIntro() {
    const terminal = document.getElementById('terminal-content');
    const introOverlay = document.getElementById('hacker-intro');

    // 如果还没加载在这个容器里，就不执行
    if (!terminal || !introOverlay) return;

    const logs = [
        { text: "Initializing NodeCrypt Core Kernel v2.5.0...", type: 'log-system', delay: 100 },
        { text: "Loading security modules...", delay: 50 },
        { text: "> modprobe crypto_aes_256", delay: 30 },
        { text: "> modprobe net_anonymizer", delay: 30 },
        { text: "> modprobe gesture_recognition_3d", delay: 30 },
        { text: "Verifying integrity check...", delay: 200 },
        { text: "[OK] Core files verified.", type: 'log-success', delay: 50 },
        { text: "Establishing secure decentralized connection...", type: 'log-info', delay: 100 },
        { text: "Connecting to swarm nodes [127.0.0.1:443]...", delay: 100 },
        { text: "Handshake verified. 2048-bit RSA key exchange complete.", delay: 50 },
        { text: "Encrypting memory buffers...", delay: 80 },
        { text: "Allocating 3D visual processing unit...", delay: 60 },
        { text: "Loading particle physics engine...", delay: 60 },
        { text: "Bypassing firewall rules...", type: 'log-warn', delay: 150 },
        { text: "Access granted.", type: 'log-success', delay: 50 },
        { text: "Initializing Neural Network interface...", delay: 50 },
        { text: "Calibrating 3D spatial sensors...", delay: 50 },
        { text: "System Ready.", type: 'log-system', delay: 500 }
    ];

    let lineIndex = 0;

    // 随机字符生成器
    function randomString(length) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // 快速滚动乱码装饰
    function addMatrixRain() {
        const line = document.createElement('div');
        line.style.opacity = Math.random();
        line.innerText = randomString(Math.floor(Math.random() * 80));
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
    }

    // 逐行打印
    function printLog() {
        if (lineIndex >= logs.length) {
            finishIntro();
            return;
        }

        const log = logs[lineIndex];
        const p = document.createElement('div');
        p.className = log.type || '';

        // 打字机效果
        let charIndex = 0;
        const text = log.text;
        p.textContent = "> "; // 提示符
        terminal.appendChild(p);

        // 如果是最后一行，光标停留
        if (lineIndex === logs.length - 1) {
            const cursor = document.createElement('span');
            cursor.className = 'cursor';
            terminal.appendChild(cursor);
        }

        const typeInterval = setInterval(() => {
            p.textContent += text.charAt(charIndex);
            charIndex++;
            terminal.scrollTop = terminal.scrollHeight;

            if (charIndex >= text.length) {
                clearInterval(typeInterval);
                lineIndex++;
                setTimeout(printLog, log.delay);
            }
        }, 10); // 打字速度
    }

    function finishIntro() {
        setTimeout(() => {
            // 开始淡出
            introOverlay.style.opacity = '0';
            // introOverlay.style.filter = 'blur(10px)'; // 性能消耗大，去掉

            // 通知 CSS 3D 粒子可以淡入了
            document.body.classList.add('intro-finished');

            // 彻底移除 DOM 避免遮挡
            setTimeout(() => {
                introOverlay.style.display = 'none';
            }, 2000); // 必须跟CSS里的 transition 时间匹配 (2s)

        }, 800);
    }

    // 启动
    // 先搞点乱码铺垫
    let noiseCount = 0;
    const noiseInterval = setInterval(() => {
        addMatrixRain();
        noiseCount++;
        if (noiseCount > 10) {
            clearInterval(noiseInterval);
            terminal.innerHTML = ""; // 清屏
            printLog();
        }
    }, 50);
}
