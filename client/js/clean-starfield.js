// 这是一个独立的、高级的3D星空背景模块，用于黑夜模式
// V5: Ultimate Spiral Voyage - 螺旋星系漫游版
// 核心：结合了绚丽的螺旋星云视觉 + 缓慢向中心推进的探索感

let scene, camera, renderer, animationId;
let stars = [], clouds = [];
let activeMeteors = [];

export function initStarfield() {
    if (renderer) return;

    // 1. Setup Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0006); // 稍微稀薄一点的雾，看更深

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
    // 起始位置远一点，准备进入
    camera.position.z = 800;
    camera.position.y = 100;
    camera.rotation.x = -0.1;

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
        transition: 'opacity 2s ease'
    });

    document.body.appendChild(renderer.domElement);

    setTimeout(() => {
        if (renderer) renderer.domElement.style.opacity = '1';
    }, 100);

    // 2. Galaxy Components
    createBackgroundStars(); // 背景繁星
    createSpiralClouds();    // 核心螺旋星云（多层）

    // 3. Resize Listener
    window.addEventListener('resize', onWindowResize, false);

    // 4. Start Loop
    animate();
}

// -------------------------------------------------------------
// Component Generators
// -------------------------------------------------------------

function getCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
}
const cloudTex = getCloudTexture();

function createBackgroundStars() {
    const geometry = new THREE.BufferGeometry();
    const count = 4000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 4000;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 4000;
        // Z轴分布在 -4000 到 1000
        positions[i * 3 + 2] = Math.random() * 5000 - 4000;
        sizes[i] = Math.random() * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8
    });

    const starSystem = new THREE.Points(geometry, material);
    scene.add(starSystem);
    stars.push(starSystem);
}

function createSpiralClouds() {
    // 我们创建3层螺旋，以此产生深度
    for (let layer = 0; layer < 3; layer++) {
        const count = 400;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        // Z轴偏移，让它们前后错开
        const zOffset = -layer * 1000;

        for (let i = 0; i < count; i++) {
            // 螺旋数学
            const angle = Math.random() * Math.PI * 2;
            // 半径分布：越远越散
            const radius = Math.random() * 800 + 100;
            const spiralK = 1.5; // 螺旋紧密度

            // x = r * cos(theta + r*k)
            const spiralAngle = angle + (radius * 0.002);

            positions[i * 3] = Math.cos(spiralAngle) * radius;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 300; // 厚度
            positions[i * 3 + 2] = Math.sin(spiralAngle) * radius + zOffset; // 加上层级偏移

            // 颜色：核心紫，外围蓝
            const colorRatio = radius / 1000;
            const c1 = new THREE.Color(0xaa00ff); // 紫
            const c2 = new THREE.Color(0x0088ff); // 蓝
            const mixed = c1.lerp(c2, colorRatio);

            // 随机干扰
            mixed.r += (Math.random() - 0.5) * 0.2;
            mixed.b += (Math.random() - 0.5) * 0.2;

            colors[i * 3] = mixed.r;
            colors[i * 3 + 1] = mixed.g;
            colors[i * 3 + 2] = mixed.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 200,
            map: cloudTex,
            vertexColors: true,
            transparent: true,
            opacity: 0.12,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const cloudSystem = new THREE.Points(geometry, material);
        // 保存初始 Z 以便循环
        cloudSystem.userData = { initialZ: zOffset };

        scene.add(cloudSystem);
        clouds.push(cloudSystem);
    }
}

// 流星
function createMeteor() {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([0, 0, 0, -80, 0, 0]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const line = new THREE.Line(geometry, material);

    // 随机出现在视野前方
    line.position.set(
        (Math.random() - 0.5) * 1000,
        Math.random() * 400 + 100,
        camera.position.z - 500 - Math.random() * 500
    );
    line.rotation.z = Math.PI / 4 + (Math.random() - 0.5);
    scene.add(line);
    return { mesh: line, speed: 25 + Math.random() * 15, life: 1.0 };
}


// -------------------------------------------------------------
// Animation Loop
// -------------------------------------------------------------

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    animationId = requestAnimationFrame(animate);

    // 1. Camera Move (The Voyage)
    // 相机并不是无脑快进，而是所有的粒子向后移动，模拟穿梭
    const flySpeed = 0.8; // 优雅的速度

    // 背景星星循环
    stars.forEach(sys => {
        const pos = sys.geometry.attributes.position.array;
        let update = false;
        for (let i = 2; i < pos.length; i += 3) {
            pos[i] += flySpeed * 0.5; // 星星远，动得慢
            if (pos[i] > 1000) {
                pos[i] = -4000;
                update = true;
            }
        }
        if (update) sys.geometry.attributes.position.needsUpdate = true;
    });

    // 螺旋星云循环 + 旋转
    clouds.forEach(cloud => {
        // 自转
        cloud.rotation.z += 0.0003;

        // 推进 (整个物体移动，或者粒子移动) - 这里移动粒子比较麻烦因为有旋转
        // 简单方案：移动整个 Group 的 position.z
        cloud.position.z += flySpeed;

        // 循环逻辑：如果跑得太近（出了视野），就瞬移到最后面
        if (cloud.position.z > 1200) {
            cloud.position.z -= 3000; // 3层 x 1000间隔
            // 稍微随机旋转一下，不显得重复
            cloud.rotation.z += Math.random() * Math.PI;
        }
    });

    // 2. Camera Float
    const time = Date.now() * 0.0005;
    camera.position.x = Math.sin(time) * 20;
    camera.position.y = Math.cos(time * 0.8) * 20 + 100;
    camera.lookAt(0, 0, -500); // 始终看向深处

    // 3. Meteors
    if (Math.random() > 0.985) activeMeteors.push(createMeteor());

    for (let i = activeMeteors.length - 1; i >= 0; i--) {
        const m = activeMeteors[i];
        m.mesh.position.x += Math.cos(m.mesh.rotation.z) * m.speed;
        m.mesh.position.y -= Math.sin(m.mesh.rotation.z) * m.speed;
        m.life -= 0.015;

        if (m.life > 0.8) m.mesh.material.opacity = (1 - m.life) * 5;
        else m.mesh.material.opacity = m.life;

        if (m.life <= 0) {
            scene.remove(m.mesh);
            m.mesh.geometry.dispose();
            m.mesh.material.dispose();
            activeMeteors.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

export function stopStarfield() {
    if (animationId) cancelAnimationFrame(animationId);
    if (renderer && renderer.domElement && document.body.contains(renderer.domElement)) {
        document.body.removeChild(renderer.domElement);
        renderer.dispose();
    }
    window.removeEventListener('resize', onWindowResize);
    renderer = null;
    scene = null;
    camera = null;
    stars = [];
    clouds = [];
    activeMeteors = [];
}
