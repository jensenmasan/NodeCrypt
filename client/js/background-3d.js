// 3D 粒子手势交互系统 - 高级版
// 3D Particle Gesture Interaction System - Premium Edition

// --- 1. 全局变量与初始化 ---
let scene, camera, renderer;
let particles, stars, connections;
let geometry, starGeometry, lineGeometry;
const particleCount = 40000; // 再次增加粒子数，确保每个字都清晰饱满
const particleData = []; // 存储每个粒子的物理状态
let animationFrameId = null; // 用于取消动画循环

// 目标形状的点集
let targetPositions = [];
let explosionVelocities = []; // 专用：烟花爆炸速度
let isExploding = false; // 是否处于爆炸物理模式




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
// 终极自动轮播内容：包含了祝福语的高级循环
const autoTexts = ["CUSTOM:马老师祝您新年快乐", "HEART", "2025", "FIREWORKS", "CUSTOM:万事如意", "TECH", "ART", "MOBIUS", "DNA",
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
let fireworksInterval = null; // 烟花循环定时器




// 粒子颜色配置 (扩充)
const colorPalette = {
    1: { primary: new THREE.Color(0x00f260), secondary: new THREE.Color(0x0575e6), glow: new THREE.Color(0x00f260) }, // Cyber Green
    2: { primary: new THREE.Color(0xb92b27), secondary: new THREE.Color(0x1565c0), glow: new THREE.Color(0xff00cc) }, // Neural Red/Blue
    3: { primary: new THREE.Color(0xFDC830), secondary: new THREE.Color(0xF37335), glow: new THREE.Color(0xFFD700) }, // Royal Gold
    0: { primary: new THREE.Color(0x00c6ff), secondary: new THREE.Color(0x0072ff), glow: new THREE.Color(0x00ffff) }, // Deep Ocean
    4: { primary: new THREE.Color(0xe100ff), secondary: new THREE.Color(0x7f00ff), glow: new THREE.Color(0xff00ff) }, // Neon Purple
    5: { primary: new THREE.Color(0xff4b1f), secondary: new THREE.Color(0x1fddff), glow: new THREE.Color(0xffffff) }, // Fire & Ice
    6: { primary: new THREE.Color(0xD9001B), secondary: new THREE.Color(0xFFD700), glow: new THREE.Color(0xFF4500) },  // Premium Red/Gold (New Year)
    7: { primary: new THREE.Color(0x8E2DE2), secondary: new THREE.Color(0x4A00E0), glow: new THREE.Color(0xaa00ff) }   // Mystic Violet
};

// ... (init3DGestureSystem 等函数保持不变，直到 updateTextShape) ...

// --- 3. 字体生成逻辑 (升级版：支持心形) ---
function updateTextShape(text) {
    currentText = text;

    // 默认关闭爆炸模式，除非是 FIREWORKS
    if (text !== "FIREWORKS") isExploding = false;

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
        // 🎆 真实物理烟花 (升级版)
        isExploding = true;

        // 1. 发射源：中心点加上一点随机偏移
        const sourceCenter = new THREE.Vector3(0, 0, 0);

        // 2. 颜色初始化：炸开瞬间是高亮白/金
        const colors = geometry.attributes.color.array;

        for (let i = 0; i < particleCount; i++) {
            // 初始位置集中在一点
            const p = geometry.attributes.position.array;
            p[i * 3] = sourceCenter.x + (Math.random() - 0.5) * 2;
            p[i * 3 + 1] = sourceCenter.y + (Math.random() - 0.5) * 2;
            p[i * 3 + 2] = sourceCenter.z + (Math.random() - 0.5) * 2;

            // 速度向量：球壳分布 (Spherical Shell) 让烟花更像空心球
            // 混合多种形态：80% 球壳, 20% 随机填充
            let vx, vy, vz;
            const speedBase = 3.5 + Math.random() * 2; // 爆炸速度

            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);

            if (Math.random() > 0.2) {
                // 球壳表面
                vx = Math.sin(phi) * Math.cos(theta) * speedBase;
                vy = Math.sin(phi) * Math.sin(theta) * speedBase;
                vz = Math.cos(phi) * speedBase;
            } else {
                // 内部填充 / 爆炸碎片
                const r = Math.pow(Math.random(), 1 / 3) * speedBase; // 均匀分布在球体内
                vx = Math.sin(phi) * Math.cos(theta) * r;
                vy = Math.sin(phi) * Math.sin(theta) * r;
                vz = Math.cos(phi) * r;
            }

            if (!explosionVelocities[i]) explosionVelocities[i] = new THREE.Vector3();
            explosionVelocities[i].set(vx, vy, vz);

            // 重置颜色为超亮白/金
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.9;
            colors[i * 3 + 2] = 0.6 + Math.random() * 0.4;

            targetPositions[i] = new THREE.Vector3(0, 0, 0);
        }
        geometry.attributes.color.needsUpdate = true;
    } else if (["ARIES", "TAURUS", "GEMINI", "CANCER", "LEO", "VIRGO", "LIBRA", "SCORPIO", "SAGITTARIUS", "CAPRICORN", "AQUARIUS", "PISCES"].includes(text)) {
        isExploding = false; // 退出爆炸模式
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
    } else if (text.startsWith("PATTERN:")) {
        // 新增：满屏重复文字模式
        const patternText = text.substring(8);
        const points = createPointsFromCanvas(patternText, true); // true for pattern mode
        const pLen = points.length;

        for (let i = 0; i < particleCount; i++) {
            if (i < pLen) {
                targetPositions[i] = points[i];
            } else {
                // 多余粒子参与构图（重复利用点阵）
                targetPositions[i] = points[i % pLen];
            }
        }
    } else if (text === "NEWYEAR_WISH") {
        // 新增：马老师新年祝福 (中文)
        // 使用 Canvas 生成点阵
        const points = createPointsFromCanvas("马老师祝你们新年快乐");

        // 分配目标位置
        // 如果点数不够，循环使用；如果多了，剩下的回到原点
        const pLen = points.length;
        for (let i = 0; i < particleCount; i++) {
            if (i < pLen) {
                targetPositions[i] = points[i];
            } else {
                // 多余的粒子变成背景星空
                targetPositions[i] = new THREE.Vector3(
                    (Math.random() - 0.5) * 500,
                    (Math.random() - 0.5) * 500,
                    (Math.random() - 0.5) * 500
                );
            }
        }
    } else if (text === "DNA") {
        // 🧬 DNA 双螺旋
        for (let i = 0; i < particleCount; i++) {
            const t = (i / particleCount) * Math.PI * 20; // 10 turns
            const radius = 30;
            const height = 200;
            const y = (i / particleCount) * height - height / 2;

            // Strand 1
            let x = Math.cos(t) * radius;
            let z = Math.sin(t) * radius;

            // Strand 2 (offset by PI)
            if (i % 2 === 0) {
                x = Math.cos(t + Math.PI) * radius;
                z = Math.sin(t + Math.PI) * radius;
            }

            // Add some thickness/scatter
            x += (Math.random() - 0.5) * 2;
            z += (Math.random() - 0.5) * 2;

            targetPositions[i] = new THREE.Vector3(x, y, z);
        }
    } else if (text === "GALAXY") {
        // 🌌 银河系/旋涡
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 100;
            const spiralOffset = radius * 0.5; // Spiral factor

            // 3 Arms
            const armOffset = (Math.floor(Math.random() * 3) * Math.PI * 2) / 3;
            const finalAngle = angle + spiralOffset + armOffset;

            const x = Math.cos(finalAngle) * radius;
            const z = Math.sin(finalAngle) * radius;
            const y = (Math.random() - 0.5) * (20 - radius * 0.15); // Center is thicker

            targetPositions[i] = new THREE.Vector3(x, y, z);
        }
    } else if (text === "ATOM") {
        // ⚛️ 原子模型
        const nucleusCount = Math.floor(particleCount * 0.2);
        for (let i = 0; i < particleCount; i++) {
            if (i < nucleusCount) {
                // Nucleus (Dense sphere)
                const r = 10 * Math.cbrt(Math.random());
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                targetPositions[i] = new THREE.Vector3(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );
            } else {
                // Electron shells (3 rings)
                const ring = Math.floor(Math.random() * 3);
                const angle = Math.random() * Math.PI * 2;
                const radius = 60 + Math.random() * 5;

                let x, y, z;
                if (ring === 0) { // XY plane
                    x = Math.cos(angle) * radius;
                    y = Math.sin(angle) * radius;
                    z = (Math.random() - 0.5) * 2;
                } else if (ring === 1) { // XZ plane
                    x = Math.cos(angle) * radius;
                    z = Math.sin(angle) * radius;
                    y = (Math.random() - 0.5) * 2;
                } else { // YZ plane (rotated)
                    // Arbitrary tilt
                    const rX = Math.cos(angle) * radius;
                    const rY = Math.sin(angle) * radius;
                    // Rotate 45 deg around X
                    x = rX;
                    y = rY * Math.cos(Math.PI / 4);
                    z = rY * Math.sin(Math.PI / 4);
                }
                targetPositions[i] = new THREE.Vector3(x, y, z);
            }
        }
    } else if (text === "SPHERE") {
        // 🌐 Geodesic Sphere / Planet
        for (let i = 0; i < particleCount; i++) {
            const r = 70;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            targetPositions[i] = new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
        }
    } else if (text === "WAVE") {
        // 🌊 3D 波浪
        const side = Math.sqrt(particleCount);
        const size = 200;
        for (let i = 0; i < particleCount; i++) {
            const r = Math.floor(i / side);
            const c = i % side;
            const x = (c / side) * size - size / 2;
            const z = (r / side) * size - size / 2;
            const y = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 30;
            targetPositions[i] = new THREE.Vector3(x, y, z);
        }
    } else if (text === "BUTTERFLY") {
        // 🦋 蝴蝶 (Lorenz Attractor-ish or Parametric)
        for (let i = 0; i < particleCount; i++) {
            // Parametric Butterfly Curve
            // r = e^sin(t) - 2cos(4t) + sin^5((2t - pi)/24)
            const t = Math.random() * 12 * Math.PI;
            const r = Math.exp(Math.sin(t)) - 2 * Math.cos(4 * t) + Math.pow(Math.sin((2 * t - Math.PI) / 24), 5);

            const scale = 15;
            const x = r * Math.cos(t) * scale;
            const y = r * Math.sin(t) * scale;
            const z = (Math.random() - 0.5) * 50 * Math.sin(t); // Wing depth volume

            // Tilt it a bit
            targetPositions[i] = new THREE.Vector3(x, y, z);
        }
    } else if (text === "TORNADO") {
        // 🌪️ 龙卷风
        for (let i = 0; i < particleCount; i++) {
            const h = Math.random() * 200 - 100; // Height -100 to 100
            const progress = (h + 100) / 200; // 0 to 1
            const r = 10 + progress * 60; // Bottom narrow, top wide
            const angle = Math.random() * Math.PI * 2 * 5 + i * 0.01;

            const x = r * Math.cos(angle);
            const z = r * Math.sin(angle);
            targetPositions[i] = new THREE.Vector3(x, h, z);
        }
    } else if (text === "DIAMOND") {
        // 💎 钻石形状 (Double Cone / Octahedron approx)
        for (let i = 0; i < particleCount; i++) {
            const y = (Math.random() - 0.5) * 100;
            const radiusAtY = (1 - Math.abs(y / 50)) * 50; // Linear fade from center

            // Top part flatter? Let's do simple Octahedron-ish
            // y goes -50 to 50
            // r goes 0 -> 50 -> 0

            const angle = Math.random() * Math.PI * 2;
            // Snapping angle to create facets (e.g. 8 facets)
            const facet = Math.floor(Math.random() * 8);
            const facetAngle = (facet / 8) * Math.PI * 2;
            // Mix random and faceted
            const finalAngle = Math.random() > 0.8 ? angle : facetAngle + (Math.random() - 0.5) * 0.1;

            const x = radiusAtY * Math.cos(finalAngle);
            const z = radiusAtY * Math.sin(finalAngle);

            targetPositions[i] = new THREE.Vector3(x, y, z);
        }
    } else if (text.startsWith("CUSTOM:")) {
        // 自定义文字模式 (打字机效果用到)
        const customText = text.substring(7);
        const points = createPointsFromCanvas(customText);
        const pLen = points.length;
        for (let i = 0; i < particleCount; i++) {
            if (i < pLen) {
                targetPositions[i] = points[i];
            } else {
                targetPositions[i] = new THREE.Vector3(
                    (Math.random() - 0.5) * 500,
                    (Math.random() - 0.5) * 500,
                    (Math.random() - 0.5) * 500
                );
            }
        }
    } else {
        if (!font) return;
        // Default text
        const textGeo = new THREE.TextGeometry(text, {
            font: font,
            size: 20,
            height: 4,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 0.5,
            bevelSegments: 3
        });
        textGeo.center();
        const textPoints = textGeo.attributes.position.array;
        const pointCount = textPoints.length / 3;
        for (let i = 0; i < particleCount; i++) {
            const targetIndex = i % pointCount;
            const tx = textPoints[targetIndex * 3];
            const ty = textPoints[targetIndex * 3 + 1];
            const tz = textPoints[targetIndex * 3 + 2];
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

// 新增：从 Canvas 获取文字点阵 (支持中文 + 满屏模式 + 自动竖屏适配)
function createPointsFromCanvas(text, isPattern = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 检测是否为移动端 (屏幕宽度小于 800)
    const isMobile = window.innerWidth < 800;
    // 如果是移动端，或者文字特别长且非Pattern模式，强制竖排
    // 如果是移动端，或者文字超过9个字符（如祝福语）且非Pattern模式，强制竖排
    // 修改：去掉了宽度限制，让PC端长文也竖排
    const useVertical = isMobile || (text.length > 9 && !isPattern);

    // 字体设置
    let fontSize = 40; // PC默认
    if (isPattern) fontSize = isMobile ? 30 : 40; // Pattern模式：手机30，PC 40
    else {
        // 主标题：如果竖排且文字较长
        if (useVertical && text.length > 5) {
            fontSize = isMobile ? 28 : 45; // 手机28，PC 45 (防止竖排过高)
        } else {
            fontSize = isMobile ? 40 : 60;
        }
    }

    const fontFamily = 'Arial, "Microsoft YaHei", sans-serif';
    ctx.font = `bold ${fontSize}px ${fontFamily}`;

    // 测量
    const metrics = ctx.measureText(text);

    let textWidth, textHeight;

    if (useVertical) {
        // 竖排：宽 = 字宽，高 = 字高 * 字数
        textWidth = fontSize * 1.5;
        textHeight = (fontSize * 1.2) * text.length;
    } else {
        // 横排
        textWidth = Math.ceil(metrics.width);
        textHeight = Math.ceil(fontSize * 1.5);
    }

    if (isPattern) {
        // 满屏模式：创建一个更大大画布，循环绘制
        const screenW = isMobile ? 800 : 1500;
        const screenH = isMobile ? 1200 : 1200;
        canvas.width = screenW;
        canvas.height = screenH;

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center'; // 竖排时居中比较好对齐
        ctx.textBaseline = 'middle';

        // 间距配置
        let itemW = useVertical ? (fontSize * 2.5) : (textWidth + 40);
        let itemH = useVertical ? (textHeight + 50) : (textHeight + 20);

        // 防止除以0
        if (itemW < 1) itemW = 50;
        if (itemH < 1) itemH = 50;

        const cols = Math.floor(screenW / itemW) + 1;
        const rows = Math.floor(screenH / itemH) + 1;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cx = c * itemW + (r % 2 === 0 ? 0 : itemW / 2);
                const cy = r * itemH;

                if (useVertical) {
                    // 绘制竖排文字
                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];
                        ctx.fillText(char, cx + textWidth / 2, cy + i * (fontSize * 1.2) + fontSize / 2);
                    }
                } else {
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    const offsetX = (r % 2 === 0) ? 0 : (textWidth / 2);
                    ctx.fillText(text, c * (textWidth + 40) + offsetX, r * (textHeight + 20));
                }
            }
        }
    } else {
        // 普通大字 (单个)
        canvas.width = textWidth + 40;
        canvas.height = textHeight + 40;

        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (useVertical) {
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                // 居中绘制每个字
                ctx.fillText(char, canvas.width / 2, 20 + i * (fontSize * 1.2) + fontSize / 2);
            }
        } else {
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        }
    }

    // 读取像素
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const points = [];

    // 采样步长 (1=最精细)
    const step = 1;
    // 缩放系数：手机端要稍微小一点以免爆屏
    let scaleFactor = isMobile ? 0.8 : 1.2;

    // 针对长文本竖排的特殊处理，动态计算最佳缩放比例
    if (useVertical && text.length > 5 && !isPattern) {
        // 目标：让总高度适应屏幕可视区域 (约200单位高度)
        const totalTextHeightPixels = text.length * fontSize * 1.2;
        const spreadY = 1.5; // 下面代码中的 multiplier

        // 我们希望 totalTextHeightPixels * scaleFactor * spreadY <= 200
        // scaleFactor <= 200 / (totalTextHeightPixels * spreadY)
        const maxScale = 220 / (totalTextHeightPixels * spreadY);
        scaleFactor = Math.min(scaleFactor, maxScale);

        // 保证最小可见性
        if (scaleFactor < 0.25) scaleFactor = 0.25;
    }

    for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
            const index = (y * canvas.width + x) * 4;
            if (data[index + 3] > 128) {
                // 坐标映射
                let px, py, pz;
                if (isPattern) {
                    px = (x - canvas.width / 2) * scaleFactor;
                    py = -(y - canvas.height / 2) * scaleFactor;
                    pz = 0;
                } else {
                    // 主标题：稍微拉开一点
                    // 注意：Y轴方向py本身已经是居中的（减去了 canvas.height/2）
                    // 但由于相机 LookAt 问题，如果觉得偏了，可以在这里微调

                    px = (x - canvas.width / 2) * (scaleFactor * 1.5);
                    py = -(y - canvas.height / 2) * (scaleFactor * 1.5);

                    if (useVertical) {
                        // 竖排时，如果文字太长，稍微往上提一点，因为相机好像偏高(y=20)
                        py += 10;
                    }

                    pz = (Math.random() - 0.5) * 10;
                }
                points.push(new THREE.Vector3(px, py, pz));
            }
        }
    }

    return points;
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
    document.addEventListener('dblclick', onDocumentDoubleClick, false); // 新增双击事件

    // Touch events for mobile interaction
    document.addEventListener('touchstart', onDocumentTouchStart, { passive: false });
    document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
    document.addEventListener('touchend', onDocumentTouchEnd, { passive: false });
}

// 新增：双击事件 - 触发新年祝福模式
function onDocumentDoubleClick(event) {
    event.preventDefault();
    startNewYearMode();
}

// 新增：新年祝福模式逻辑
// 新增：新年祝福模式逻辑
let isNewYearMode = false;

function startNewYearMode() {
    isNewYearMode = true;
    isAutoMode = false;

    // 清除旧的定时器
    if (fireworksInterval) clearInterval(fireworksInterval);
    if (window.typewriterTimer) clearTimeout(window.typewriterTimer);

    const fullText = "马老师祝大家新年快乐";
    let charIndex = 0;

    // 播放打字机序列
    function playSequence() {
        if (charIndex <= fullText.length) {
            // 阶段1：逐字显示大字
            const subText = fullText.substring(0, charIndex);
            if (subText.length > 0) {
                updateTextShape("CUSTOM:" + subText);
            }
            updateParticleColor({ primary: new THREE.Color(0xff0000), secondary: new THREE.Color(0xffd700), glow: new THREE.Color(0xffaa00) });
            charIndex++;
            window.typewriterTimer = setTimeout(playSequence, 400);
        } else {
            // 阶段2：显示完毕，停留一下
            window.typewriterTimer = setTimeout(() => {
                // 阶段3：满屏小号文字
                updateTextShape("PATTERN:" + fullText);

                // 5秒后循环 or 保持？ 让它保持直到用户双击取消或动鼠标
                // 为了效果，我们可以让它循环：满屏 -> 收回 -> 满屏
                /*
                window.typewriterTimer = setTimeout(() => {
                    charIndex = 1;
                    playSequence();
                }, 5000);
                */
            }, 1500);
        }
    }

    charIndex = 1;
    playSequence();
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

    // 如果点击了，且当前正在放烟花循环，停止循环回到普通模式？
    // 或者点击只是加特效，不打断循环？
    // 这里选择：点击不打断，只是增加冲击波效果

    // 酷炫效果：点击产生冲击波
    if (event.button === 0) { // 左键
        shockwave = 1.0;
        // 随机换个颜色
        const randomPalette = colorPalette[Math.floor(Math.random() * 7)];
        if (randomPalette) updateParticleColor(randomPalette);
    }
}

// 鼠标抬起事件
// 鼠标抬起事件
function onDocumentMouseUp(event) {
    isMouseDown = false;
    shockwave = 0;
}

// --- 触摸事件支持 (移动端) ---

let lastTouchTime = 0;

function onDocumentTouchStart(event) {
    if (event.touches.length === 1) {
        // 检查点击目标是否是交互元素 (按钮、输入框等)
        const target = event.target;
        const isInteractive = target.closest('button') ||
            target.closest('input') ||
            target.closest('textarea') || // Also allow textareas
            target.closest('.input-message-input') || // Specific chat input class
            target.closest('[contenteditable="true"]') || // Generic contenteditable
            target.closest('.send-message-btn') || // Send message button
            target.closest('a') ||
            target.closest('.flip-card') ||
            target.closest('.start-screen') || // Start screen should allow clicks on button
            target.closest('.control-panel'); // Control panel buttons

        if (!isInteractive) {
            event.preventDefault(); // 防止滚动 (仅非交互区域)

            const now = Date.now();
            if (now - lastTouchTime < 300) {
                // 双击检测成功：触发新年模式 (仅在非交互区域双击)
                startNewYearMode();
            }
            lastTouchTime = now;
        }

        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        isMouseDown = true;
        lastMouseMoveTime = Date.now();
        isAutoMode = false;

        // 像点击一样产生冲击波
        shockwave = 1.0;
        const randomPalette = colorPalette[Math.floor(Math.random() * 7)];
        if (randomPalette) updateParticleColor(randomPalette);

        // 显示UI
        const controlPanel = document.getElementById('main-control-panel');
        if (controlPanel) {
            controlPanel.classList.remove('hidden');
            if (uiHideTimer) clearTimeout(uiHideTimer);
            uiHideTimer = setTimeout(() => {
                // 检查 hover 状态可能在移动端不准确，但这里作为辅助
                if (controlPanel && !controlPanel.matches(':hover')) controlPanel.classList.add('hidden');
            }, UI_HIDE_DELAY);
        }
    }
}

function onDocumentTouchMove(event) {
    // 检查是否在可滚动区域
    const target = event.target;
    // 允许在登录容器、帮助内容、设置内容中滚动
    const isScrollable = target.closest('.login-container') ||
        target.closest('.help-content') ||
        target.closest('.settings-content') ||
        target.closest('.chat-area') ||
        target.closest('.rooms');

    if (event.touches.length === 1) {
        if (!isScrollable) {
            event.preventDefault(); // 防止滚动 (仅当不在可滚动区域时)
        }

        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        lastMouseMoveTime = Date.now(); // 保持活跃，产生轨迹
        isAutoMode = false;
    }
}

function onDocumentTouchEnd(event) {
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

            // 智能颜色匹配 - Premium Loop Colors (Expanded)
            let colorKey = 0;
            if (nextText.includes("马老师") || nextText.includes("新年") || nextText.includes("万事") || nextText.includes("财富")) {
                colorKey = 6; // Premium Red/Gold
            } else if (nextText === "HEART" || nextText === "BUTTERFLY" || nextText === "FLOWER") {
                colorKey = 4; // Neon Purple / Pink
            } else if (nextText === "2025" || nextText === "FIREWORKS" || nextText === "DIAMOND" || nextText === "SPHERE") {
                colorKey = 3; // Royal Gold
            } else if (nextText === "TECH" || nextText === "DNA" || nextText === "ATOM" || nextText === "NodeCrypt") {
                colorKey = 1; // Cyber Green
            } else if (nextText === "ART" || nextText === "MOBIUS" || nextText === "GALAXY") {
                colorKey = 7; // Mystic Violet
            } else if (nextText === "WAVE" || nextText === "TORNADO" || nextText === "AQUARIUS" || nextText === "PISCES") {
                colorKey = 0; // Deep Ocean
            } else {
                // Zodiacs and others: random mix
                colorKey = Math.floor(Math.random() * 8);
            }
            updateParticleColor(colorPalette[colorKey] || colorPalette[0]);
        }

        // --- 自动模式下的动态动画 (Movement/Animation) ---
        // 让特定物体这自动模式下动起来 (旋转、飘动)
        const currentModel = autoTexts[autoTextIndex] || "";
        if (currentModel === "GALAXY" || currentModel === "ATOM") {
            // 整体缓慢旋转
            scene.rotation.y += 0.002;
            scene.rotation.z += 0.001;
        } else if (currentModel === "DNA" || currentModel === "TORNADO") {
            scene.rotation.y += 0.005; // Spin faster
        } else if (currentModel === "WAVE") {
            // Waving handled in shader/update usually, but we can tilt
            scene.rotation.x = Math.sin(time * 0.5) * 0.2;
        } else {
            // Default gentle drift
            scene.rotation.y += 0.0005;
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
    // updateConnections(positions); // 暂时禁用，因为粒子数太多，性能消耗大

    // --- 粒子运动逻辑 ---
    for (let i = 0; i < particleCount; i++) {
        const px = positions[i * 3];
        const py = positions[i * 3 + 1];
        const pz = positions[i * 3 + 2];

        const p = new THREE.Vector3(px, py, pz); // 临时Vector3用于物理计算

        // --- 物理更新核心 ---
        // 模式 A: 爆炸物理模拟 (烟花)
        if (isExploding && explosionVelocities[i]) {
            const vel = explosionVelocities[i];

            // 重力 (稍微加大一点，增加真实感)
            vel.y -= 0.08;
            // 空气阻力
            vel.x *= 0.96;
            vel.y *= 0.96;
            vel.z *= 0.96;

            p.x += vel.x;
            p.y += vel.y;
            p.z += vel.z;

            // 颜色冷却效果：逐渐变红/变暗
            // 取当前速度大小作为"温度"参考
            const speedSq = vel.x * vel.x + vel.y * vel.y + vel.z * vel.z;
            const colors = geometry.attributes.color.array;

            if (speedSq > 0.1) {
                // 还在飞：闪烁
                if (Math.random() > 0.95) {
                    colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1; // 闪白光
                } else {
                    // 随速度变暗
                    colors[i * 3] *= 0.99;
                    colors[i * 3 + 1] *= 0.98; // 绿蓝衰减快 -> 变红
                    colors[i * 3 + 2] *= 0.97;
                }
            } else {
                // 速度慢了，熄灭
                colors[i * 3] *= 0.95;
                colors[i * 3 + 1] *= 0.95;
                colors[i * 3 + 2] *= 0.95;
            }

            // 如果掉太低，重置或让它消失
            if (p.y < -300) {
                vel.set(0, 0, 0);
                p.y = -300;
                colors[i * 3] = 0; colors[i * 3 + 1] = 0; colors[i * 3 + 2] = 0;
            }
        }
        // 模式 B: 寻找目标点 (文字/形状)
        else {
            if (!targetPositions[i]) continue;

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

            // 原始归位力
            let dx = target.x + noiseX - p.x;
            let dy = target.y + noiseY - p.y;
            let dz = target.z + noiseZ - p.z;

            // 根据手指轨迹产生排斥/吸引 (仅当非自动模式且有轨迹且非绘图模式时)
            // (如果是绘图模式，粒子跟随手指，这里简化逻辑)

            // ... [保留原有鼠标/手势交互逻辑] ...

            // 自动模式下的镜头漂移效果
            if (isAutoMode) {
                // 稍微上下浮动
                dy += Math.sin(time * 2 + p.x * 0.05) * 5;
            }

            // 速度因子 (越远越快)
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            // 增加归位速度，让文字显示更利索
            let speedFactor = (currentGesture === 1) ? 0.2 : 0.08;
            if (isAutoMode) speedFactor = 0.05; // 自动模式慢一点
            const speed = Math.min(speedFactor + distance * 0.001, 0.3);

            // 鼠标模式下的高级交互
            if (!isAutoMode && Date.now() - lastHandTime > 2000) {
                if (shockwave > 0.01) {
                    const dx_mouse = p.x - (mouse.x * window.innerWidth * 0.5); // 估算映射
                    const dy_mouse = p.y - (mouse.y * window.innerHeight * 0.5);
                    const dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);

                    if (dist_mouse < 200) {
                        const force = (1 - dist_mouse / 200) * shockwave * 80; // 增强冲击波
                        dx += (dx_mouse / dist_mouse) * force;
                        dy += (dy_mouse / dist_mouse) * force;
                        dz += force;
                    }
                    shockwave *= 0.95;
                }
            }

            const nextX = p.x + dx * speed;
            const nextY = p.y + dy * speed;
            const nextZ = p.z + dz * speed;

            p.x += (nextX - p.x) * 0.5; // 平滑插值
            p.y += (nextY - p.y) * 0.5;
            p.z += (nextZ - p.z) * 0.5;
        }

        // 更新位置
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
    }


    // 如果是爆炸模式，需要更新颜色缓冲
    if (isExploding) {
        geometry.attributes.color.needsUpdate = true;
    }

    geometry.attributes.position.needsUpdate = true;

    // 如果是爆炸模式，不用连线；如果是文字模式，可以有连线
    if (connections && !isExploding) {
        // 简化连线逻辑以提高性能 (20000个粒子连线会卡死)
        // 仅在手动模式下开启连线，或者只连很少一部分？
        // 为了性能，当粒子数增加到 2万时，必须大幅减少连线计算或彻底关闭
        // 建议：此处暂时禁用 updateConnections();
        // updateConnections(); 
    }

    if (isAutoMode && Date.now() - autoTimer > AUTO_SWITCH_INTERVAL * 50) { // 减慢自动切换
        // do auto logic
    }

    // 逻辑：当鼠标/触摸没有移动时（空闲状态），显示特定祝福语
    // 无论是否在新年模式，只要空闲就显示，提升高级感
    // 逻辑：当鼠标/触摸没有移动时（空闲状态），进入自动循环模式
    // Logic: When idle (no mouse/touch movement), enter auto-loop mode
    if (!isMouseDown && !isExploding && !document.querySelector('.model-btn.active')) {
        // 移动端和PC端统一判定空闲时间 (例如 3秒)
        // 确保没有在手动交互
        if (Date.now() - lastMouseMoveTime > 3000 && Date.now() - lastHandTime > 3000) {
            if (!isAutoMode) {
                isAutoMode = true;
                // 重置计时器以便立即切换
                autoTimer = AUTO_SWITCH_INTERVAL;
            }
        }
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
