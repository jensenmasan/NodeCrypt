// 3D 粒子手势交互系统
// 3D Particle Gesture Interaction System

// --- 1. 全局变量与初始化 ---
let scene, camera, renderer;
let particles;
let geometry;
const particleCount = 4000; // 粒子总数
const particleData = []; // 存储每个粒子的物理状态

// 目标形状的点集
let targetPositions = [];

// 字体加载器
let font;

// 交互状态
let currentGesture = 0; // 0=无, 1=Gest1, 2=Gest2, 3=Gest3
let handSpread = 0; // 0 到 1，控制扩散
let currentText = "READY"; // 当前文字

// 颜色配置
const colorPalette = {
    1: new THREE.Color(0x00ffff), // 青色
    2: new THREE.Color(0xff00ff), // 紫色
    3: new THREE.Color(0xffff00), // 黄色
    0: new THREE.Color(0xffffff)  // 白色
};

export function init3DGestureSystem() {
    initThree();
    initMediaPipe();
    animate();
}

// --- 2. Three.js 场景设置 ---
function initThree() {
    const container = document.getElementById('canvas-container');
    if (!container) return; // 确保容器存在

    // 场景
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    // 相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;
    camera.position.y = 0;

    // 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 初始化粒子系统
    initParticles();

    // 加载字体 (使用 Three.js 示例中的 Helvetiker 字体)
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function (loadedFont) {
        font = loadedFont;
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';
        updateTextShape("READY"); // 初始文字
    });

    // 窗口大小调整
    window.addEventListener('resize', onWindowResize, false);
}

function initParticles() {
    geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        // 初始随机位置
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

        // 初始颜色 (白色)
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;

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

    // 材质
    const material = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        opacity: 0.8
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

// --- 3. 字体生成逻辑 ---
function updateTextShape(text) {
    if (!font) return;
    currentText = text;

    const textGeo = new THREE.TextGeometry(text, {
        font: font,
        size: 20,
        height: 2,
        curveSegments: 10,
        bevelEnabled: false
    });

    textGeo.center(); // 居中

    // 从几何体中获取点
    // 我们需要根据粒子数量重新采样或填充
    // 这里我们简单地从顶点数组中随机取样，如果不够就循环取
    const textPoints = textGeo.attributes.position.array;
    const pointCount = textPoints.length / 3;

    // 更新目标位置
    for (let i = 0; i < particleCount; i++) {
        const targetIndex = i % pointCount;
        const tx = textPoints[targetIndex * 3];
        const ty = textPoints[targetIndex * 3 + 1];
        const tz = textPoints[targetIndex * 3 + 2];

        // 将新的目标位置存入
        targetPositions[i] = new THREE.Vector3(tx, ty, tz);
    }
}

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

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // 1. 计算手势 (简单的手指计数法)
        const fingers = countFingers(landmarks);

        // 防止抖动，只有变化时才更新文字
        let newText = currentText;
        let newColor = colorPalette[0];
        let gestureName = "未知";

        if (fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
            // 仅食指 -> 手势 1
            currentGesture = 1;
            newText = "FUTURE";
            newColor = colorPalette[1];
            gestureName = "1 (未来)";
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
        } else {
            currentGesture = 0;
            gestureName = "自由模式";
        }

        if (newText !== currentText) {
            updateTextShape(newText);
            updateParticleColor(newColor);
        }

        if (gestureStatus) gestureStatus.innerText = gestureName;

        // 2. 计算张合程度 (Thumb Tip 到 Index Tip 的距离)
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2)
        );

        // 归一化距离 (大概范围 0.02 到 0.2)
        // 捏合时距离小 -> spread 小
        // 张开时距离大 -> spread 大
        // 我们放大这个效果：
        let rawSpread = (distance - 0.05) * 5; // 调整参数
        handSpread = Math.max(0, Math.min(1, rawSpread)); // 限制在 0-1

        if (spreadStatus) spreadStatus.innerText = Math.round(handSpread * 100) + "%";

    } else {
        // 没有检测到手
        if (gestureStatus) gestureStatus.innerText = "未检测到手";
        handSpread = 0;
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
    // 简单判断：如果拇指尖端比IP关节远
    // fingers[0] = landmarks[4].x < landmarks[3].x; // 简化忽略拇指

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

function updateParticleColor(color) {
    const colors = geometry.attributes.color.array;
    for (let i = 0; i < particleCount; i++) {
        // 简单的渐变效果，稍微加点随机性
        colors[i * 3] = color.r + (Math.random() - 0.5) * 0.2;
        colors[i * 3 + 1] = color.g + (Math.random() - 0.5) * 0.2;
        colors[i * 3 + 2] = color.b + (Math.random() - 0.5) * 0.2;
    }
    geometry.attributes.color.needsUpdate = true;
}


// --- 5. 动画与物理循环 ---
function animate() {
    requestAnimationFrame(animate);

    if (!geometry || !particles) return;

    const positions = geometry.attributes.position.array;

    // 扩散系数：基于手势张开程度
    // 0 = 紧凑, 1 = 爆炸
    const dispersion = handSpread * 50; // 最大扩散半径 50

    for (let i = 0; i < particleCount; i++) {
        const px = positions[i * 3];
        const py = positions[i * 3 + 1];
        const pz = positions[i * 3 + 2];

        const target = targetPositions[i] || new THREE.Vector3(0, 0, 0);

        // 计算扩散偏移 (基于噪声或随机)
        // 这里使用简单的随机偏移，每一帧都重新计算会导致剧烈抖动
        // 所以我们让目标位置加上一个基于 dispersion 的偏移

        // 物理运动 (Lerp 插值模拟弹簧)
        // 基础速度
        const speed = 0.08;

        // 目标位置 + 扩散效果
        // 如果 handSpread 很大，目标位置就变得随机
        // 简单的实现：目标 = 原始目标 + 随机向量 * handSpread

        // 优化：不仅仅是随机，而是让粒子带有"呼吸感"
        // 我们可以利用 sin/cos 时间函数加上 handSpread
        const time = Date.now() * 0.001;
        const noiseX = Math.sin(time + i) * dispersion * 2;
        const noiseY = Math.cos(time + i * 0.5) * dispersion * 2;
        const noiseZ = Math.sin(time * 0.5 + i) * dispersion * 2;

        // 计算下一步位置
        const nextX = px + (target.x + noiseX - px) * speed;
        const nextY = py + (target.y + noiseY - py) * speed;
        const nextZ = pz + (target.z + noiseZ - pz) * speed;

        positions[i * 3] = nextX;
        positions[i * 3 + 1] = nextY;
        positions[i * 3 + 2] = nextZ;
    }

    geometry.attributes.position.needsUpdate = true;

    // 缓慢旋转整个粒子群
    particles.rotation.y += 0.002;
    particles.rotation.x += (Math.sin(Date.now() * 0.001) * 0.001);

    renderer.render(scene, camera);
}
