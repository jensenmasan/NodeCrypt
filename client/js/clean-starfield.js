// 这是一个独立的、高级的3D星空背景模块，用于黑夜模式
// V4: Infinite Voyage - 无尽探索版
// 核心：相机持续向前飞行，星星和星云动态循环，鼠标控制航向

let scene, camera, renderer, animationId;
let stars = [], clouds = [];
let mouseX = 0, mouseY = 0;
let flySpeed = 2.5; // 基础飞行速度

export function initStarfield() {
    if (renderer) return;

    // 1. Setup Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0008); // 纯黑背景，雾气更淡，看更远

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.z = 1000; // 相机起始位置

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.domElement.id = 'clean-starfield-canvas';
    Object.assign(renderer.domElement.style, {
        position: 'fixed',
        top: '0', left: '0',
        width: '100vw', height: '100vh',
        zIndex: '-9999',
        pointerEvents: 'none',
        opacity: '0',
        transition: 'opacity 3s ease'
    });

    document.body.appendChild(renderer.domElement);

    setTimeout(() => {
        if (renderer) renderer.domElement.style.opacity = '1';
    }, 100);

    // 2. Create Infinite Components

    // A. 动态星海 (Stars)
    // 我们创建多个星团，分布在 Z 轴不同深度
    // 关键：不使用所有的 PointCloud，而是分块管理以便循环
    createStarField();

    // B. 体积云 (Nebula Clouds)
    // 使用大尺寸的半透明粒子模拟云层穿梭
    createCloudField();

    // 3. Listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onMouseMove, false);

    // 4. Start Loop
    animate();
}

// 纹理生成器：柔和的光点
function getStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
}

// 纹理生成器：绚丽星云
function getCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    // 更加复杂的云雾噪点
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.02)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
}

const starTexture = getStarTexture();
const cloudTexture = getCloudTexture();

function createStarField() {
    // 创建 5000 颗星星，分布在很长的 Z 轴区间内
    const geometry = new THREE.BufferGeometry();
    const count = 6000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const color1 = new THREE.Color(0xaaccff); // 蓝白
    const color2 = new THREE.Color(0xffffee); // 黄白
    const color3 = new THREE.Color(0xff88cc); // 粉紫 - 增加一点神秘感

    for (let i = 0; i < count; i++) {
        // X, Y 范围大一点，避免穿越时看到边界
        positions[i * 3] = (Math.random() - 0.5) * 4000;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 4000;
        // Z 分布在相机前方 -2000 到 -8000 (ThreeJS坐标系里，我们要往-Z飞)
        // 修正：我们让相机不动，粒子动？或者相机动。这里让粒子循环更简单。
        // 方案：粒子 Z 范围 -4000 到 1000。
        positions[i * 3 + 2] = Math.random() * 6000 - 5000;

        // 颜色随机混合
        const c = Math.random();
        let finalColor;
        if (c < 0.6) finalColor = color1;
        else if (c < 0.9) finalColor = color2;
        else finalColor = color3;

        colors[i * 3] = finalColor.r;
        colors[i * 3 + 1] = finalColor.g;
        colors[i * 3 + 2] = finalColor.b;

        sizes[i] = Math.random() * 4 + 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 4,
        map: starTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

function createCloudField() {
    // 创建一些巨大的星云块
    const geometry = new THREE.BufferGeometry();
    const count = 100; // 数量不用多，但要大
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorVars = [
        new THREE.Color(0x4400cc), // 深紫
        new THREE.Color(0x0044aa), // 深蓝
        new THREE.Color(0xcc0066)  // 深红
    ];

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 2000;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
        positions[i * 3 + 2] = Math.random() * 6000 - 5000;

        const col = colorVars[Math.floor(Math.random() * colorVars.length)];
        // 稍微随机化亮度
        col.multiplyScalar(0.5 + Math.random() * 0.5);

        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 500, // 巨大
        map: cloudTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.08, // 非常淡
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    clouds = new THREE.Points(geometry, material);
    scene.add(clouds);
}

function onMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) * 0.5; // 减小灵敏度
    mouseY = (event.clientY - window.innerHeight / 2) * 0.5;
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    animationId = requestAnimationFrame(animate);

    // 逻辑：不是移动相机，而是移动所有的点，让它们循环
    // 这样不用处理庞大的坐标数字

    const speed = flySpeed;

    // 1. Stars Update
    if (stars) {
        const positions = stars.geometry.attributes.position.array;
        let needsUpdate = false;
        for (let i = 0; i < positions.length; i += 3) {
            // 向 +Z 移动 (因为我们往 -Z 看) -> 也就是星星迎面飞来
            positions[i + 2] += speed * 2;

            // 如果跑到相机后面了 (Z > 1000)
            if (positions[i + 2] > 1000) {
                positions[i + 2] = -5000; // 放到最远处
                // 也可以稍微重置XY，避免模式重复
                positions[i] = (Math.random() - 0.5) * 4000;
                positions[i + 1] = (Math.random() - 0.5) * 4000;
                needsUpdate = true;
            }
        }
        if (needsUpdate) stars.geometry.attributes.position.needsUpdate = true;

        // 响应鼠标视差
        stars.rotation.x += ((-mouseY * 0.0001) - stars.rotation.x) * 0.05;
        stars.rotation.y += ((-mouseX * 0.0001) - stars.rotation.y) * 0.05;
    }

    // 2. Clouds Update (Slower speed, parallax effect)
    if (clouds) {
        const cPositions = clouds.geometry.attributes.position.array;
        let needsUpdate = false;
        for (let i = 0; i < cPositions.length; i += 3) {
            cPositions[i + 2] += speed * 1.5; // 星云飞得慢一点点？不，应该也差不多，或者慢一点显得巨大

            if (cPositions[i + 2] > 1000) {
                cPositions[i + 2] = -5000;
                cPositions[i] = (Math.random() - 0.5) * 3000;
                cPositions[i + 1] = (Math.random() - 0.5) * 3000;
                needsUpdate = true;
            }
        }
        if (needsUpdate) clouds.geometry.attributes.position.needsUpdate = true;

        // 星云自身旋转
        clouds.rotation.z += 0.0005;
    }

    // 3. Camera subtle shake (Engine vibration)
    camera.position.x += (Math.sin(Date.now() * 0.002) * 2 - camera.position.x) * 0.01;
    camera.position.y += (Math.cos(Date.now() * 0.003) * 2 - camera.position.y) * 0.01;

    renderer.render(scene, camera);
}

export function stopStarfield() {
    if (animationId) cancelAnimationFrame(animationId);
    if (renderer && renderer.domElement && document.body.contains(renderer.domElement)) {
        document.body.removeChild(renderer.domElement);
        renderer.dispose();
    }
    window.removeEventListener('resize', onWindowResize);
    document.removeEventListener('mousemove', onMouseMove);
    renderer = null;
    scene = null;
    camera = null;
    stars = null;
    clouds = null;
}
