// 3D 粒子手势交互系统 - 高级版
// 3D Particle Gesture Interaction System - Premium Edition

// --- 1. 全局变量与初始化 ---
let scene, camera, renderer;
let particles, stars, connections;
let geometry, starGeometry, lineGeometry;
const particleCount = 8000; // 粒子总数 (增加)
const particleData = []; // 存储每个粒子的物理状态
let animationFrameId = null; // 用于取消动画循环

// 目标形状的点集
let targetPositions = [];



// 字体加载器
let font;

// 交互状态
let currentGesture = 0; // 0=无, 1=Gest1, 2=Gest2, 3=Gest3
let handSpread = 0; // 0 到 1，控制扩散
let currentText = "NODECRYPT"; // 当前文字（改为默认显示NODECRYPT）

// 新增功能变量
// 新增功能变量
let fingerTrail = []; // 手指轨迹
const TRAIL_LENGTH = 70;
let lastHandTime = Date.now();
let isAutoMode = true;
let autoTimer = 0;
const AUTO_SWITCH_INTERVAL = 300;
// 终极自动轮播内容： 文字 -> 数学几何 -> 祝福
const autoTexts = ["NODECRYPT", "SPHERE", "DNA", "TECH", "MOBIUS", "ART", "HEART", "HAPPY", "NEW", "YEAR", "2025",
    "ARIES", "TAURUS", "GEMINI", "CANCER", "LEO", "VIRGO", "LIBRA", "SCORPIO", "SAGITTARIUS", "CAPRICORN", "AQUARIUS", "PISCES"
];
let autoTextIndex = 0;

// 交互与物理引擎变量
let mouse = new THREE.Vector2(-9999, -9999); // 鼠标位置
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let interactionForce = 0; // 交互力场强度 (-1: 吸入, 0: 无, 1: 排斥)
let forceRadius = 100; // 力场半径
let shockwave = 0; // 冲击波强度
let colorCycle = 0; // 颜色循环


let uiHideTimer = null; // 控制面板自动隐藏计时器
const UI_HIDE_DELAY = 3000; // 3秒无操作隐藏
let isMouseDown = false; // 鼠标是否按下
let lastMouseMoveTime = 0; // 最后一次鼠标移动时间



// 粒子颜色配置 (扩充)
const colorPalette = {
    1: { primary: new THREE.Color(0x00d9ff), secondary: new THREE.Color(0x0088ff), glow: new THREE.Color(0x00ffff) }, // 青
    2: { primary: new THREE.Color(0xff00ff), secondary: new THREE.Color(0xff0088), glow: new THREE.Color(0xff88ff) }, // 紫
    3: { primary: new THREE.Color(0xffaa00), secondary: new THREE.Color(0xffdd00), glow: new THREE.Color(0xffff00) }, // 橙
    0: { primary: new THREE.Color(0x88ccff), secondary: new THREE.Color(0xaaddff), glow: new THREE.Color(0xffffff) }, // 蓝
    4: { primary: new THREE.Color(0xff0033), secondary: new THREE.Color(0xff6666), glow: new THREE.Color(0xffaaaa) }, // 红
    5: { primary: new THREE.Color(0xffbb00), secondary: new THREE.Color(0xffee88), glow: new THREE.Color(0xffffff) }, // 金
    6: { primary: new THREE.Color(0x00ff88), secondary: new THREE.Color(0xccffcc), glow: new THREE.Color(0xaaffaa) }  // 绿(DNA)
};

// ... (init3DGestureSystem 等函数保持不变，直到 updateTextShape) ...

// --- 3. 字体生成逻辑 (升级版：支持心形) ---
function updateTextShape(text) {
    currentText = text;

    if (text === "HEART") {
        // 生成 3D 爱心形状
        for (let i = 0; i < particleCount; i++) {
            // 使用参数方程生成心形
            // t 范围 0 到 2PI
            // 为了生成 3D 效果，我们在不同层生成不同大小的心
            const t = Math.random() * Math.PI * 2;
            const yOffset = (Math.random() - 0.5) * 20; // 厚度

            // 基础心形方程 (二维)
            // x = 16 * sin(t)^3
            // y = 13 * cos(t) - 5 * cos(2t) - 2 * cos(3t) - cos(4t)

            const scale = 3.5; // 缩放系数
            const x = 16 * Math.pow(Math.sin(t), 3) * scale;
            const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
            const z = (Math.random() - 0.5) * 30; // 随机厚度并带有体积感

            // 稍微随机化一点位置，填满内部
            const randomScale = Math.random();

            targetPositions[i] = new THREE.Vector3(x * randomScale, y * randomScale, z * randomScale);
        }
    } else if (text === "FLOWER") {
        // 🌸 花朵形状 (3D 玫瑰/莲花)
        for (let i = 0; i < particleCount; i++) {
            const t = Math.random() * Math.PI * 2;
            const p = (Math.random() - 0.5) * Math.PI; // latitude

            // 玫瑰曲线方程 r = cos(k*theta)
            const k = 4; // 4 petals
            const r = Math.cos(k * t) * 20 + 10; // radius variation

            // 转换为3D坐标
            // 使用球坐标系变体
            const x = r * Math.cos(t) * Math.cos(p);
            const y = r * Math.sin(p) * 0.5 + Math.cos(r * 0.1) * 5; // 给一点高度变化
            const z = r * Math.sin(t) * Math.cos(p);

            targetPositions[i] = new THREE.Vector3(x, y, z);
        }
    } else if (text === "SATURN") {
        // 🪐 土星形状
        const ringParticleCount = Math.floor(particleCount * 0.7);
        const planetParticleCount = particleCount - ringParticleCount;

        for (let i = 0; i < particleCount; i++) {
            if (i < planetParticleCount) {
                // 星球主体 (球体)
                const r = 15;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);

                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.sin(phi) * Math.sin(theta);
                const z = r * Math.cos(phi);
                targetPositions[i] = new THREE.Vector3(x, y, z);
            } else {
                // 土星环 (圆环)
                const minR = 25;
                const maxR = 40;
                const r = minR + Math.random() * (maxR - minR);
                const theta = Math.random() * Math.PI * 2;

                const x = r * Math.cos(theta);
                const z = r * Math.sin(theta);
                const y = (Math.random() - 0.5) * 1; // 环很薄

                // 倾斜环
                const tilt = Math.PI / 6; // 30 degrees
                const tiltedX = x * Math.cos(tilt) - y * Math.sin(tilt);
                const tiltedY = x * Math.sin(tilt) + y * Math.cos(tilt);

                targetPositions[i] = new THREE.Vector3(tiltedX, tiltedY, z);
            }
        }
    } else if (text === "BUDDHA") {
        // 🧘 简易佛像/冥想坐姿 (堆叠球体)
        const headStart = 0;
        const headEnd = Math.floor(particleCount * 0.15);
        const bodyStart = headEnd;
        const bodyEnd = Math.floor(particleCount * 0.5);
        const legsStart = bodyEnd;

        for (let i = 0; i < particleCount; i++) {
            let x, y, z;
            if (i < headEnd) { // 头部
                const r = 8;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                x = r * Math.sin(phi) * Math.cos(theta);
                y = r * Math.sin(phi) * Math.sin(theta) + 20; // 抬高
                z = r * Math.cos(phi);
            } else if (i < bodyEnd) { // 身体 (椭球)
                const r = 14;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                x = r * Math.sin(phi) * Math.cos(theta) * 1.2; // 宽一点
                y = r * Math.sin(phi) * Math.sin(theta);
                z = r * Math.cos(phi) * 0.8;
            } else { // 盘腿/底座 (扁椭球)
                const r = 22;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random()); // 上半球
                x = r * Math.sin(phi) * Math.cos(theta) * 1.5;
                y = -r * Math.cos(phi) * 0.5 - 10;
                z = r * Math.sin(phi) * Math.sin(theta) * 1.2;
            }
            targetPositions[i] = new THREE.Vector3(x, y, z);
        }
    } else if (text === "FIREWORKS") {
        // 🎆 烟花爆炸 (射线球)
        for (let i = 0; i < particleCount; i++) {
            // 随机方向
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);

            // 随机半径，集中在中心，有长尾巴
            // 使用幂函数让粒子集中在核心，少数射出很远
            const r = Math.pow(Math.random(), 2) * 60;

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            targetPositions[i] = new THREE.Vector3(x, y, z);
        }
    } else if (["ARIES", "TAURUS", "GEMINI", "CANCER", "LEO", "VIRGO", "LIBRA", "SCORPIO", "SAGITTARIUS", "CAPRICORN", "AQUARIUS", "PISCES"].includes(text)) {
        // 🌌 12 星座生成逻辑
        // 为了简化，我们使用程序化生成的"星座风格"连线图
        // 每个星座有独特的特征点数量和分布

        // 1. 生成几颗亮星 (主恒星)
        const mainStarCount = 12 + Math.floor(Math.random() * 8); // 12-20颗主星
        const stars = [];
        for (let j = 0; j < mainStarCount; j++) {
            stars.push(new THREE.Vector3(
                (Math.random() - 0.5) * 120,
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 40
            ));
        }

        // 2. 将粒子分配给星星或连线
        for (let i = 0; i < particleCount; i++) {
            if (i < 200) {
                // 200个粒子作为高亮主星 (光晕)
                const starIdx = i % mainStarCount;
                const star = stars[starIdx];
                // 在星星周围随机抖动
                targetPositions[i] = new THREE.Vector3(
                    star.x + (Math.random() - 0.5) * 4,
                    star.y + (Math.random() - 0.5) * 4,
                    star.z + (Math.random() - 0.5) * 4
                );
            } else {
                // 其他粒子构成星云或连线
                // 随机选择两个星星，在它们之间连线
                const starA = stars[Math.floor(Math.random() * mainStarCount)];
                const starB = stars[Math.floor(Math.random() * mainStarCount)];
                const t = Math.random(); // 插值系数

                // 增加一些由于"重力"或"能量"导致的弯曲
                const curve = Math.sin(t * Math.PI) * 20;

                targetPositions[i] = new THREE.Vector3(
                    starA.x * (1 - t) + starB.x * t,
                    starA.y * (1 - t) + starB.y * t + curve,
                    starA.z * (1 - t) + starB.z * t
                );
            }
        }
    } else {
        if (!font) return;

        // 默认文字处理逻辑
        const textGeo = new THREE.TextGeometry(text, {
            font: font,
            size: 20,
            height: 4, // 增加文字厚度
            curveSegments: 12, // 更圆滑
            bevelEnabled: true, // 开启倒角
            bevelThickness: 1,
            bevelSize: 0.5,
            bevelSegments: 3
        });

        textGeo.center(); // 居中

        const textPoints = textGeo.attributes.position.array;
        const pointCount = textPoints.length / 3;

        // 更新目标位置
        for (let i = 0; i < particleCount; i++) {
            const targetIndex = i % pointCount;
            const tx = textPoints[targetIndex * 3];
            const ty = textPoints[targetIndex * 3 + 1];
            const tz = textPoints[targetIndex * 3 + 2];

            // 增加一点随机偏移，让文字看起来更蓬松
            const jitter = 0.5;
            targetPositions[i] = new THREE.Vector3(
                tx + (Math.random() - 0.5) * jitter,
                ty + (Math.random() - 0.5) * jitter,
                tz + (Math.random() - 0.5) * jitter
            );
        }
        textGeo.dispose();
    }
}
// 用于跟踪是否已初始化
let isInitialized = false;

export function init3DGestureSystem() {
    if (isInitialized) return;
    isInitialized = true;

    initThree();
    initMediaPipe();

    initUIControls(); // 初始化UI事件
    initAutoHideUI(); // 初始化自动隐藏逻辑
    animate();
}

// 新增：UI自动隐藏逻辑
function initAutoHideUI() {
    const controlPanel = document.getElementById('main-control-panel');
    if (!controlPanel) return;

    function showUI() {
        controlPanel.classList.remove('hidden');
        resetHideTimer();
    }

    function hideUI() {
        // 如果有按钮被hover，也不隐藏
        if (controlPanel.matches(':hover')) return;

        controlPanel.classList.add('hidden');
    }

    function resetHideTimer() {
        if (uiHideTimer) clearTimeout(uiHideTimer);
        uiHideTimer = setTimeout(hideUI, UI_HIDE_DELAY);
    }

    // 监听鼠标移动和点击
    window.addEventListener('mousemove', showUI);
    window.addEventListener('click', showUI);
    window.addEventListener('touchstart', showUI);

    // 初始启动计时器
    resetHideTimer();
}

// --- 切水果游戏逻辑 ---






// 新增：初始化UI控制事件
function initUIControls() {
    // 模型按钮
    const modelBtns = document.querySelectorAll('.model-btn');
    modelBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // 移除其他激活状态
            modelBtns.forEach(b => b.classList.remove('active'));
            // 激活当前
            e.currentTarget.classList.add('active');

            const model = e.currentTarget.getAttribute('data-model');
            isAutoMode = false; // 停止自动轮播
            updateTextShape(model);
        });
    });

    // 颜色选择器
    const colorPicker = document.getElementById('particle-color');
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            const hex = e.target.value;
            const color = new THREE.Color(hex);
            isAutoMode = false;

            // 更新当前颜色配置
            const newConfig = {
                primary: color,
                secondary: color.clone().offsetHSL(0, 0, -0.2), // 稍微暗一点作为副色
                glow: color.clone().offsetHSL(0, 0, 0.2) // 稍微亮一点作为发光
            };
            updateParticleColor(newConfig);
        });
    }

    // 全屏按钮
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });
    }


}

// 新增：清理函数，用于登录成功后关闭3D系统
export function cleanup3DGestureSystem() {
    console.log('Cleaning up 3D Gesture System...');

    // 取消动画循环
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // 清理Three.js资源
    if (renderer) {
        renderer.dispose();
        const container = document.getElementById('canvas-container');
        if (container && renderer.domElement) {
            container.removeChild(renderer.domElement);
        }
    }

    if (geometry) geometry.dispose();
    if (starGeometry) starGeometry.dispose();
    if (lineGeometry) lineGeometry.dispose();

    if (particles) {
        if (particles.material) particles.material.dispose();
        scene.remove(particles);
    }
    if (stars) {
        if (stars.material) stars.material.dispose();
        scene.remove(stars);
    }
    if (connections) {
        if (connections.material) connections.material.dispose();
        scene.remove(connections);
    }

    // 隐藏UI元素
    const uiLayer = document.getElementById('ui-layer');
    const videoContainer = document.getElementById('video-container');
    const canvasContainer = document.getElementById('canvas-container');

    if (uiLayer) uiLayer.style.display = 'none';
    if (videoContainer) videoContainer.style.display = 'none';
    if (canvasContainer) canvasContainer.style.display = 'none';

    // 停止摄像头
    const videoElement = document.getElementById('input-video');
    if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoElement.srcObject = null;
    }

    // 重置标志
    isInitialized = false;

    console.log('3D Gesture System cleaned up.');
}

// --- 2. Three.js 场景设置 ---
function initThree() {
    const container = document.getElementById('canvas-container');
    if (!container) return; // 确保容器存在

    // 场景
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0008); // 减弱雾效，让粒子更清晰

    // 相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 150;
    camera.position.y = 20;

    // 渲染器 - 高级配置
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比率提升性能
    container.appendChild(renderer.domElement);

    // 初始化星空背景
    initStarField();

    // 初始化粒子系统
    initParticles();

    // 初始化粒子连线
    initConnections();

    // 加载字体 (使用 Three.js 示例中的 Helvetiker 字体)
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function (loadedFont) {
        font = loadedFont;
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.transition = 'opacity 0.5s';
            loadingEl.style.opacity = '0';
            setTimeout(() => loadingEl.style.display = 'none', 500);
        }
        updateTextShape("NODECRYPT"); // 初始文字改为NODECRYPT
    });

    // 窗口大小调整
    window.addEventListener('resize', onWindowResize, false);

    // 鼠标交互事件
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
}

// 鼠标移动事件
function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    lastMouseMoveTime = Date.now();
    isAutoMode = false; // 鼠标移动时退出自动模式

    // 更新UI隐藏计时器
    const controlPanel = document.getElementById('main-control-panel');
    if (controlPanel) {
        controlPanel.classList.remove('hidden');
        if (uiHideTimer) clearTimeout(uiHideTimer);
        uiHideTimer = setTimeout(() => {
            if (!controlPanel.matches(':hover')) controlPanel.classList.add('hidden');
        }, UI_HIDE_DELAY);
    }
}

// 鼠标按下事件
function onDocumentMouseDown(event) {
    isMouseDown = true;
    lastMouseMoveTime = Date.now();
    isAutoMode = false;

    // 酷炫效果：点击产生冲击波
    if (event.button === 0) { // 左键
        shockwave = 1.0;
        // 随机换个颜色
        const randomPalette = colorPalette[Math.floor(Math.random() * 7)];
        if (randomPalette) updateParticleColor(randomPalette);
    }
}

// 鼠标抬起事件
function onDocumentMouseUp(event) {
    isMouseDown = false;
    shockwave = 0;
}

// 新增：创建星空背景
function initStarField() {
    const starCount = 2000;
    starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        // 随机分布在球面上
        const radius = 300 + Math.random() * 500;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = radius * Math.cos(phi);

        // 星星颜色 - 白色到淡蓝色
        const brightness = 0.7 + Math.random() * 0.3;
        starColors[i * 3] = brightness;
        starColors[i * 3 + 1] = brightness * (0.9 + Math.random() * 0.1);
        starColors[i * 3 + 2] = 1;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

// 新增：初始化粒子连线
function initConnections() {
    lineGeometry = new THREE.BufferGeometry();
    const maxConnections = 500;
    const linePositions = new Float32Array(maxConnections * 2 * 3);
    const lineColors = new Float32Array(maxConnections * 2 * 3);

    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });

    connections = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(connections);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function initParticles() {
    geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount); // 新增：每个粒子的大小

    for (let i = 0; i < particleCount; i++) {
        // 初始随机位置 - 更大的分布范围
        positions[i * 3] = (Math.random() - 0.5) * 300;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 300;

        // 初始颜色 (天蓝色)
        const palette = colorPalette[0];
        colors[i * 3] = palette.primary.r;
        colors[i * 3 + 1] = palette.primary.g;
        colors[i * 3 + 2] = palette.primary.b;

        // 随机粒子大小
        sizes[i] = Math.random() * 2 + 1;

        // 初始化物理数据
        particleData.push({
            velocity: new THREE.Vector3(),
            originalPos: new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]),
            targetIndex: i // 将要飞向的目标点索引
        });

        // 默认目标位置就在原点附近
        targetPositions.push(new THREE.Vector3(0, 0, 0));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 升级材质 - 使用ShaderMaterial实现发光效果
    const material = new THREE.PointsMaterial({
        size: 2.5,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        map: createGlowTexture() // 自定义发光纹理
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

// 新增：创建发光纹理
function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // 创建径向渐变
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}


// (updateTextShape 已移动到上方并升级)


// --- 4. MediaPipe 手势识别逻辑 ---
function initMediaPipe() {
    const videoElement = document.getElementById('input-video');

    // 如果没有 video 元素，可能是在非登录页，或者初始化失败
    if (!videoElement) return;

    // 检查 Hands 是否已定义 (全局变量)
    if (typeof Hands === 'undefined') {
        setTimeout(initMediaPipe, 500); // 重试
        return;
    }

    const hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onHandsResults);

    const cameraUtils = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 320,
        height: 240
    });
    cameraUtils.start().catch(err => {
        console.warn("Camera init failed, falling back to Auto Mode", err);
        isAutoMode = true; // 确保启用自动模式
        // 隐藏视频预览框，因为没摄像头
        const videoContainer = document.getElementById('video-container');
        if (videoContainer) videoContainer.style.display = 'none';

        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            // 修改提示文字
            const status = document.getElementById('gesture-status');
            if (status) status.innerText = "鼠标交互模式";
        }
    });
}

function onHandsResults(results) {
    const gestureStatus = document.getElementById('gesture-status');
    const spreadStatus = document.getElementById('spread-status');
    const uiLayer = document.getElementById('ui-layer');

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        lastHandTime = Date.now();
        isAutoMode = false;

        // 显示UI面板
        if (uiLayer) {
            uiLayer.classList.add('visible');
            // 确保 pointer-events 正常 (某些情况下被 CSS 覆盖)
            // uiLayer.style.pointerEvents = 'none'; // 容器本身不阻挡
        }

        let totalSpread = 0;
        let handCount = 0;

        // 遍历所有检测到的手
        for (const landmarks of results.multiHandLandmarks) {

            // 新增：识别到手势时，隐藏"进入系统"按钮，提供更纯净的体验
            // 如果用户移开手，按钮在下面else块中暂时不恢复，或者通过其他方式(如点击屏幕)恢复
            // 这里为了体验，一旦动手玩，就隐藏按钮。
            const startScreen = document.getElementById('start-screen');
            if (startScreen && startScreen.style.opacity !== '0') {
                startScreen.style.transition = 'opacity 0.5s';
                startScreen.style.opacity = '0';
                startScreen.style.pointerEvents = 'none'; // 防止误触
            }
            handCount++;

            // --- 记录食指指尖轨迹 (仅使用第一只手用于绘图) ---
            if (handCount === 1) {
                const indexTip = landmarks[8];
                const aspect = window.innerWidth / window.innerHeight;
                const visibleHeight = 150;
                const visibleWidth = visibleHeight * aspect;
                const targetX = (indexTip.x - 0.5) * -visibleWidth;
                const targetY = (indexTip.y - 0.5) * -visibleHeight;
                const targetZ = 0;

                fingerTrail.unshift(new THREE.Vector3(targetX, targetY, targetZ));
                if (fingerTrail.length > TRAIL_LENGTH) fingerTrail.pop();

                // 手势识别 (仅第一只手用于切换文字)
                const fingers = countFingers(landmarks);
                let newText = currentText;
                let newColor = null; // null 表示保持当前颜色，除非有明确手势
                let gestureName = "未知";

                if (fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
                    currentGesture = 1; // 绘图
                    gestureName = "食指 (绘图)";
                } else if (fingers[1] && fingers[2] && !fingers[3] && !fingers[4]) {
                    currentGesture = 2; // Tech
                    newText = "TECH";
                    gestureName = "2 (科技)";
                } else if (fingers[1] && fingers[2] && fingers[3] && !fingers[4]) {
                    currentGesture = 3; // Art
                    newText = "ART";
                    gestureName = "3 (艺术)";
                } else if (fingers[0] && fingers[1] && !fingers[2] && !fingers[3] && fingers[4]) {
                    currentGesture = 4; // Heart
                    newText = "HEART";
                    gestureName = "🤟 (Love)";
                } else if (fingers[0] && fingers[1] && fingers[2] && fingers[3] && fingers[4]) {
                    // High Five - 2025
                    currentGesture = 5;
                    newText = "2025";
                    gestureName = "🖐 (2025)";
                } else {
                    currentGesture = 0;
                    gestureName = "自由交互";
                }

                if (gestureStatus) gestureStatus.innerText = gestureName;

                // 只有当文字确实改变了，才更新形状
                if (newText !== currentText) {
                    // 如果是手势触发的，且当前不是手动选择模式(虽然这里简化了逻辑)
                    // 只有当不是在绘制模式时才切换
                    if (currentGesture !== 1) {
                        updateTextShape(newText);
                        // 为特定手势设置颜色
                        if (newText === "TECH") updateParticleColor(colorPalette[2]);
                        if (newText === "ART") updateParticleColor(colorPalette[3]);
                        if (newText === "HEART") updateParticleColor(colorPalette[4]);
                        if (newText === "2025") updateParticleColor(colorPalette[5]);
                        if (newText === "NODECRYPT") updateParticleColor(colorPalette[1]);
                    }
                }
            }

            // 计算张合程度 (累加)
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const distance = Math.sqrt(
                Math.pow(thumbTip.x - indexTip.x, 2) +
                Math.pow(thumbTip.y - indexTip.y, 2)
            );

            // 归一化
            let rawSpread = (distance - 0.05) * 5;
            totalSpread += Math.max(0, Math.min(1, rawSpread));
        }

        // 平均张合程度
        if (handCount > 0) {
            handSpread = totalSpread / handCount;
        }

        if (spreadStatus) spreadStatus.innerText = Math.round(handSpread * 100) + "%";

    } else {
        // 没有检测到手
        if (Date.now() - lastHandTime > 2000 && !document.querySelector('.model-btn.active')) {
            // 只有当没有手动激活任何模型按钮时，才恢复自动模式
            isAutoMode = true;
        } else if (Date.now() - lastHandTime > 5000) {
            // 如果手动激活了，但很久没操作，也可以恢复自动？暂时不恢复，保持手动选择
        }

        if (gestureStatus) gestureStatus.innerText = "未检测到手";
        fingerTrail = [];

        // 如果手离开很久，可以考虑让进入按钮重新显示？
        // 暂时不显示，因为用户可能正在欣赏自动动画。
        // 如果需要登录，用户可以点击任意地方或者刷新？
        // 其实 index.html 里有逻辑点击 start-login-btn 才能看到 login-container
        // 如果我们把按钮隐藏了，用户怎么登录？
        // 修改策略：手势消失5秒后，如果是自动模式，让按钮淡入回来
        if (isAutoMode) {
            const startScreen = document.getElementById('start-screen');
            // 只有当登录框还没显示的时候才显示按钮
            const loginContainer = document.getElementById('login-container');
            if (startScreen && (!loginContainer || loginContainer.style.display === 'none')) {
                startScreen.style.opacity = '1';
                startScreen.style.pointerEvents = 'auto';
            }
        }
    }
}

function countFingers(landmarks) {
    // 简单的手指伸展检测逻辑
    // 拇指判断 (根据x坐标)
    const isRightHand = true; // 假设镜像后
    // 实际上 MediaPipe 输出已经标准化，我们用简单的 Y 轴比较
    // 注意：Y 轴向下为正

    const fingers = [false, false, false, false, false];

    // 拇指 (比较指尖和指关节的 x 距离，稍微复杂，这里简化判断)
    // 逻辑：计算拇指指尖到食指掌指关节(MCP)的距离，如果足够远则认为伸出
    const thumbTip = landmarks[4];
    const indexMcp = landmarks[5];

    // 计算2D距离 (x, y)
    const dist = Math.sqrt(Math.pow(thumbTip.x - indexMcp.x, 2) + Math.pow(thumbTip.y - indexMcp.y, 2));

    // 阈值需要调试，通常伸开时距离较大 (>0.15 左右)
    fingers[0] = dist > 0.12; // 稍微宽松一点的阈值

    // 食指 (指尖 y < 指根 y)
    fingers[1] = landmarks[8].y < landmarks[6].y;
    // 中指
    fingers[2] = landmarks[12].y < landmarks[10].y;
    // 无名指
    fingers[3] = landmarks[16].y < landmarks[14].y;
    // 小指
    fingers[4] = landmarks[20].y < landmarks[18].y;

    return fingers;
}

function updateParticleColor(colorConfig) {
    const colors = geometry.attributes.color.array;
    for (let i = 0; i < particleCount; i++) {
        // 使用渐变色 - 在primary和secondary之间随机混合
        const mixFactor = Math.random();
        const r = colorConfig.primary.r * (1 - mixFactor) + colorConfig.secondary.r * mixFactor;
        const g = colorConfig.primary.g * (1 - mixFactor) + colorConfig.secondary.g * mixFactor;
        const b = colorConfig.primary.b * (1 - mixFactor) + colorConfig.secondary.b * mixFactor;

        // 加入轻微随机性，让颜色更生动
        colors[i * 3] = Math.max(0, Math.min(1, r + (Math.random() - 0.5) * 0.1));
        colors[i * 3 + 1] = Math.max(0, Math.min(1, g + (Math.random() - 0.5) * 0.1));
        colors[i * 3 + 2] = Math.max(0, Math.min(1, b + (Math.random() - 0.5) * 0.1));
    }
    geometry.attributes.color.needsUpdate = true;
}


// --- 5. 动画与物理循环 ---
function animate() {
    animationFrameId = requestAnimationFrame(animate);

    if (!geometry || !particles) return;

    const positions = geometry.attributes.position.array;
    const time = Date.now() * 0.0005;

    // --- 自动演示模式逻辑 ---
    if (isAutoMode) {
        autoTimer++;
        // 自动切换文字
        if (autoTimer > AUTO_SWITCH_INTERVAL) {
            autoTimer = 0;
            autoTextIndex = (autoTextIndex + 1) % autoTexts.length;
            const nextText = autoTexts[autoTextIndex];
            updateTextShape(nextText);

            // 智能颜色匹配
            let colorKey = 0;
            if (nextText === "HEART" || nextText === "HAPPY" || nextText === "YEAR") {
                // 红色或金色
                colorKey = Math.random() > 0.5 ? 4 : 5;
            } else if (nextText === "2025" || nextText === "NEW") {
                // 金色或紫色
                colorKey = Math.random() > 0.5 ? 5 : 2;
            } else if (nextText === "HAPPY" || nextText === "YEAR") {
                // 多彩/橙色
                colorKey = 3;
            } else if (nextText === "NODECRYPT") {
                // 青色 (品牌色)
                colorKey = 1;
            } else {
                // 随机
                colorKey = Math.floor(Math.random() * 6);
            }
            updateParticleColor(colorPalette[colorKey] || colorPalette[0]);
        }

        // 自动模式下的呼吸扩散效果
        const autoSpread = (Math.sin(time * 2) + 1) * 0.15;
        handSpread = autoSpread;
    }

    // 扩散系数
    // 如果是鼠标控制模式（最近有移动且没检测到手）
    if (!isAutoMode && Date.now() - lastHandTime > 2000) {
        // 鼠标按下时 spread = 1 (张开)，否则 0 (握拳)
        // 使用平滑过渡
        const targetSpread = isMouseDown ? 1.0 : 0.0;
        handSpread += (targetSpread - handSpread) * 0.1;

        // 生成鼠标轨迹 (模拟手指)
        if (Date.now() - lastMouseMoveTime < 1000) {
            const aspect = window.innerWidth / window.innerHeight;
            const visibleHeight = 150;
            const visibleWidth = visibleHeight * aspect;

            // 将归一化鼠标坐标映射到 3D 视野平面
            const targetX = mouse.x * visibleWidth * 0.5;
            const targetY = mouse.y * visibleHeight * 0.5;
            const targetZ = 0;

            fingerTrail.unshift(new THREE.Vector3(targetX, targetY, targetZ));
            if (fingerTrail.length > TRAIL_LENGTH) fingerTrail.pop();

            // 鼠标模式下默认视为“绘图/交互”手势，除非在点击
            currentGesture = 1;
        } else {
            fingerTrail = [];
            currentGesture = 0;
        }
    }

    const dispersion = handSpread * 80;

    // 更新粒子连线
    updateConnections(positions);

    // --- 粒子运动逻辑 ---
    for (let i = 0; i < particleCount; i++) {
        const px = positions[i * 3];
        const py = positions[i * 3 + 1];
        const pz = positions[i * 3 + 2];

        let target;

        // 如果处于绘图模式 (手势1) 且有轨迹，粒子跟随手指
        if (currentGesture === 1 && fingerTrail.length > 0) {
            // 将粒子分配到轨迹的不同点上，形成长尾效果
            // 使用 i % fingerTrail.length 可以让粒子均匀分布在轨迹上
            const trailIndex = i % fingerTrail.length;
            const trailPoint = fingerTrail[trailIndex];

            // 为了让线条有体积感，加一点随机抖动
            const spread = 2.0;
            target = new THREE.Vector3(
                trailPoint.x + (Math.random() - 0.5) * spread,
                trailPoint.y + (Math.random() - 0.5) * spread,
                trailPoint.z + (Math.random() - 0.5) * spread
            );
            target = new THREE.Vector3(
                trailPoint.x + (Math.random() - 0.5) * spread,
                trailPoint.y + (Math.random() - 0.5) * spread,
                trailPoint.z + (Math.random() - 0.5) * spread
            );
        } else {
            // 默认模式：飞向文字目标点
            const baseTarget = targetPositions[i] || new THREE.Vector3(0, 0, 0);

            // 缩放效果 based on handSpread (0~1)
            // 范围：0.8x (握拳) 到 1.3x (张开)
            const scale = 0.8 + handSpread * 0.5;

            target = new THREE.Vector3(
                baseTarget.x * scale,
                baseTarget.y * scale,
                baseTarget.z * scale
            );
        }

        // 噪声运动
        const noiseX = Math.sin(time * 0.5 + i * 0.1) * dispersion;
        const noiseY = Math.cos(time * 0.7 + i * 0.2) * dispersion;
        const noiseZ = Math.sin(time * 0.3 + i * 0.15) * dispersion;

        let dx, dy, dz;

        if (isAutoMode) {
            // 自动模式下增加波浪效果
            const waveX = Math.sin(time * 2 + py * 0.05) * 10;
            const waveY = Math.cos(time * 1.5 + px * 0.05) * 10;
            dx = target.x + noiseX + waveX - px;
            dy = target.y + noiseY + waveY - py;
            dz = target.z + noiseZ - pz;
        } else {
            dx = target.x + noiseX - px;
            dy = target.y + noiseY - py;
            dz = target.z + noiseZ - pz;
        }

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // 绘图模式下速度要快一点，否则跟不上手指
        let speedFactor = (currentGesture === 1) ? 0.2 : 0.08;
        if (isAutoMode) speedFactor = 0.05; // 自动模式慢一点

        const speed = Math.min(speedFactor + distance * 0.001, 0.3);

        // 鼠标模式下的高级交互
        if (!isAutoMode && Date.now() - lastHandTime > 2000) {
            // 漩涡/黑洞效果 (按住Shift键)
            let vortexX = 0, vortexY = 0, vortexZ = 0;
            // 检查 shiftKey 状态需要从 mousemove event 获取，这里简化为一直有微弱漩涡，或者通过 isMouseDown 增强

            // 冲击波效果 (点击触发)
            if (shockwave > 0.01) {
                const dx_mouse = px - (mouse.x * windowHalfX * 0.5); // 估算映射
                const dy_mouse = py - (mouse.y * windowHalfY * 0.5);
                const dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);

                if (dist_mouse < 200) {
                    const force = (1 - dist_mouse / 200) * shockwave * 50;
                    dx += (dx_mouse / dist_mouse) * force;
                    dy += (dy_mouse / dist_mouse) * force;
                    dz += force; // 也向外推
                }
                shockwave *= 0.95; // 衰减
            }
        }

        const nextX = px + dx * speed;
        const nextY = py + dy * speed;
        const nextZ = pz + dz * speed;

        positions[i * 3] = nextX;
        positions[i * 3 + 1] = nextY;
        positions[i * 3 + 2] = nextZ;
    }

    geometry.attributes.position.needsUpdate = true;

    // 粒子群整体旋转
    if (currentGesture !== 1) {
        // 非绘图模式下正常旋转
        particles.rotation.y += 0.0008;
        particles.rotation.x = Math.sin(time * 0.3) * 0.1;
        particles.rotation.z = Math.cos(time * 0.2) * 0.05;
    } else {
        // 绘图模式下暂停旋转，方便书写
        // 保持当前角度不变，或者非常缓慢地复位，这里完全暂停
    }

    // 更新游戏逻辑
    // (已移除切水果游戏)

    // 星空旋转
    if (stars) {
        stars.rotation.y += 0.0002;
        stars.rotation.x += 0.0001;
    }

    // 相机移动
    // 相机移动
    camera.position.x = Math.sin(time * 0.2) * 5;
    camera.position.y = 20 + Math.cos(time * 0.15) * 3;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

// 新增：更新粒子连线
function updateConnections(positions) {
    if (!lineGeometry || !connections) return;

    const linePositions = lineGeometry.attributes.position.array;
    const lineColors = lineGeometry.attributes.color.array;
    const maxDistance = 50; // 最大连线距离
    let lineIndex = 0;
    const maxConnections = 500;
    const step = Math.floor(particleCount / 100); // 只检查部分粒子以提升性能

    for (let i = 0; i < particleCount && lineIndex < maxConnections; i += step) {
        const x1 = positions[i * 3];
        const y1 = positions[i * 3 + 1];
        const z1 = positions[i * 3 + 2];

        for (let j = i + step; j < particleCount && lineIndex < maxConnections; j += step) {
            const x2 = positions[j * 3];
            const y2 = positions[j * 3 + 1];
            const z2 = positions[j * 3 + 2];

            const dx = x2 - x1;
            const dy = y2 - y1;
            const dz = z2 - z1;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < maxDistance) {
                // 添加连线
                linePositions[lineIndex * 6] = x1;
                linePositions[lineIndex * 6 + 1] = y1;
                linePositions[lineIndex * 6 + 2] = z1;
                linePositions[lineIndex * 6 + 3] = x2;
                linePositions[lineIndex * 6 + 4] = y2;
                linePositions[lineIndex * 6 + 5] = z2;

                // 连线颜色 - 基于距离的透明度
                const alpha = 1 - distance / maxDistance;
                const colors = geometry.attributes.color.array;
                const color1Index = i * 3;
                const color2Index = j * 3;

                lineColors[lineIndex * 6] = colors[color1Index] * alpha;
                lineColors[lineIndex * 6 + 1] = colors[color1Index + 1] * alpha;
                lineColors[lineIndex * 6 + 2] = colors[color1Index + 2] * alpha;
                lineColors[lineIndex * 6 + 3] = colors[color2Index] * alpha;
                lineColors[lineIndex * 6 + 4] = colors[color2Index + 1] * alpha;
                lineColors[lineIndex * 6 + 5] = colors[color2Index + 2] * alpha;

                lineIndex++;
            }
        }
    }

    // 清除未使用的连线
    for (let i = lineIndex; i < maxConnections; i++) {
        for (let j = 0; j < 6; j++) {
            linePositions[i * 6 + j] = 0;
            lineColors[i * 6 + j] = 0;
        }
    }

    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.color.needsUpdate = true;
    lineGeometry.setDrawRange(0, lineIndex * 2);
}
