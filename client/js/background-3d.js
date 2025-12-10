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
const autoTexts = ["NODECRYPT", "SPHERE", "FUTURE", "DNA", "TECH", "MOBIUS", "ART", "HEART", "HAPPY", "NEW", "YEAR", "2025"];
let autoTextIndex = 0;

// 交互与物理引擎变量
let mouse = new THREE.Vector2(-9999, -9999); // 鼠标位置
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let interactionForce = 0; // 交互力场强度 (-1: 吸入, 0: 无, 1: 排斥)
let forceRadius = 100; // 力场半径

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
    } else {
        if (!font) return;

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
    animate();
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
        maxNumHands: 1,
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
    cameraUtils.start();
}

function onHandsResults(results) {
    const gestureStatus = document.getElementById('gesture-status');
    const spreadStatus = document.getElementById('spread-status');
    const uiLayer = document.getElementById('ui-layer');

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        lastHandTime = Date.now();
        isAutoMode = false;

        // 显示UI面板
        if (uiLayer) uiLayer.classList.add('visible');

        const landmarks = results.multiHandLandmarks[0];

        // --- 记录食指指尖轨迹 (用于绘图) ---
        const indexTip = landmarks[8];
        // 转换坐标系: MediaPipe(0~1) -> Three.js(场景坐标)
        // 视口宽高比例适配
        const aspect = window.innerWidth / window.innerHeight;
        const visibleHeight = 150; // 近似可见区域高度
        const visibleWidth = visibleHeight * aspect;

        const targetX = (indexTip.x - 0.5) * -visibleWidth; // 镜像X
        const targetY = (indexTip.y - 0.5) * -visibleHeight; // 反转Y
        const targetZ = 0; // 投影到平面

        fingerTrail.unshift(new THREE.Vector3(targetX, targetY, targetZ));
        if (fingerTrail.length > TRAIL_LENGTH) {
            fingerTrail.pop();
        }

        // 1. 计算手势 (简单的手指计数法)
        const fingers = countFingers(landmarks);

        // 防止抖动，只有变化时才更新文字
        let newText = currentText;
        let newColor = colorPalette[0];
        let gestureName = "未知";

        if (fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
            // 仅食指 -> 自由绘图模式
            currentGesture = 1;
            // newText 不变，维持现状
            newColor = colorPalette[1];
            gestureName = "食指 (绘图)";
        } else if (fingers[1] && fingers[2] && !fingers[3] && !fingers[4]) {
            // 食指+中指 -> 手势 2
            currentGesture = 2;
            newText = "TECH";
            newColor = colorPalette[2];
            gestureName = "2 (科技)";
        } else if (fingers[1] && fingers[2] && fingers[3] && !fingers[4]) {
            // 食指+中指+无名指 -> 手势 3
            currentGesture = 3;
            newText = "ART";
            newColor = colorPalette[3];
            gestureName = "3 (艺术)";
        } else if (fingers[0] && fingers[1] && !fingers[2] && !fingers[3] && fingers[4]) {
            // 🤟 I Love You 手势 (拇指+食指+小指) -> 爱心
            currentGesture = 4;
            newText = "HEART"; // 这里会触发 updateTextShape 生成心形
            newColor = colorPalette[4]; // 红色
            gestureName = "🤟 (Love)";
        } else if (fingers[0] && fingers[1] && fingers[2] && fingers[3] && fingers[4]) {
            // 🖐 五指张开 -> 2025 新年快乐
            currentGesture = 5;
            newText = "2025";
            newColor = colorPalette[5]; // 金色
            gestureName = "🖐 (2025)";
        } else {
            // 其他手势 -> 恢复默认
            currentGesture = 0;
            // newText = "NODECRYPT"; 
            gestureName = "自由交互";
            if (currentText !== "NODECRYPT" && currentText !== "FUTURE" && currentText !== "TECH" && currentText !== "ART" && currentText !== "HEART" && currentText !== "2025") {
                newText = "NODECRYPT";
            }
        }

        if (newText !== currentText) {
            updateTextShape(newText);
            updateParticleColor(newColor);
        }

        if (gestureStatus) gestureStatus.innerText = gestureName;

        // 2. 计算张合程度 (Thumb Tip 到 Index Tip 的距离)
        const thumbTip = landmarks[4];
        // const indexTip = landmarks[8];
        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2)
        );

        // 归一化距离 (大概范围 0.02 到 0.2)
        let rawSpread = (distance - 0.05) * 5;
        handSpread = Math.max(0, Math.min(1, rawSpread));

        if (spreadStatus) spreadStatus.innerText = Math.round(handSpread * 100) + "%";

    } else {
        // 没有检测到手 - 检查是否进入自动模式
        if (Date.now() - lastHandTime > 2000) { // 2秒无操作
            isAutoMode = true;
            // 隐藏UI面板
            if (uiLayer) uiLayer.classList.remove('visible');
        }

        if (gestureStatus) gestureStatus.innerText = "未检测到手";
        // handSpread = 0; // 自动模式下不重置，由动画控制
        fingerTrail = []; // 清空轨迹
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
        } else {
            // 默认模式：飞向文字目标点
            target = targetPositions[i] || new THREE.Vector3(0, 0, 0);
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

    // 星空旋转
    if (stars) {
        stars.rotation.y += 0.0002;
        stars.rotation.x += 0.0001;
    }

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
