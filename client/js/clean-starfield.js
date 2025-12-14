// 这是一个独立的、高级的3D星空背景模块，用于黑夜模式
// V3: Ultimate Deep Space - 包含流体星云、星系核心和动态流星

let scene, camera, renderer, animationId;
let stars, nebulaParticles, shootingStarSystem;

export function initStarfield() {
    if (renderer) return;

    // 1. Setup Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020205, 0.0015); // 非常深的蓝黑色雾

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 100;
    camera.rotation.x = Math.PI / 12;

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

    // 淡入
    setTimeout(() => {
        if (renderer) renderer.domElement.style.opacity = '1';
    }, 100);

    // 2. Create Galaxy Components

    // A. 背景微星 (Dust) - 增加数量，减小尺寸，制造深邃感
    createStarLayer(3000, 2000, 0.8, 0x8899aa);

    // B. 明亮主星 (Bright Stars)
    createStarLayer(400, 1200, 2.5, 0xffffff);

    // C. 彩色星云 (Nebula Clouds)
    createNebulaCloud();

    // D. 流星系统 (Shooting Stars)
    createShootingStars();

    // 3. Resize Listener
    window.addEventListener('resize', onWindowResize, false);

    // 4. Start Loop
    animate();
}

function createStarLayer(count, range, size, colorVal) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const blinkData = new Float32Array(count); // 用于闪烁

    for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * range;
        pos[i * 3 + 1] = (Math.random() - 0.5) * range;
        pos[i * 3 + 2] = (Math.random() - 0.5) * range;
        blinkData[i] = Math.random() * 10; // 随机相位
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('blink', new THREE.BufferAttribute(blinkData, 1));

    const mat = new THREE.PointsMaterial({
        size: size,
        color: colorVal,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });

    const mesh = new THREE.Points(geo, mat);
    // 缓慢旋转属性
    mesh.userData = {
        rotSpeed: (Math.random() - 0.5) * 0.0002
    };

    scene.add(mesh);

    if (!stars) stars = [];
    stars.push(mesh);
}

function createNebulaCloud() {
    // 既不是简单的图片，也不是复杂的 volumetric，而是多层半透明的粒子云
    // 我们用 Canvas 生成一个柔和的烟雾纹理
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);

    const count = 300;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        // 创建一个螺旋星系形状
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 600 + 100;
        const spiralOffset = radius * 0.5; // 扭曲度

        pos[i * 3] = Math.cos(angle + spiralOffset) * radius;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 200; // 厚度
        pos[i * 3 + 2] = Math.sin(angle + spiralOffset) * radius - 200; // 推远一点

        // 颜色赋予：中心紫，边缘蓝
        const colorRatio = radius / 800;
        const color1 = new THREE.Color(0xbd34fe); // 紫
        const color2 = new THREE.Color(0x00d9ff); // 蓝

        const mixedColor = color1.lerp(color2, colorRatio);

        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 180,
        map: texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.15, // 非常淡，为了叠加
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    nebulaParticles = new THREE.Points(geo, mat);
    scene.add(nebulaParticles);
}

function createShootingStars() {
    // 简单的流星池
    shootingStarSystem = {
        children: []
    };

    // 我们不需要预先创建 geometry，因为流星是短暂的线
    // 这里我们用一个逻辑循环来动态画线（或者用一个长条贴图的 sprite）
    // 为了性能，我们用一个很长的 Line
}

function createShootingStarGraphic() {
    // 创建一个流星 Mesh
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        0, 0, 0,
        -50, 0, 0 // 尾巴长度50
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
    });

    const line = new THREE.Line(geometry, material);
    return line;
}

// 活跃的流星列表
let activeMeteors = [];

function spawnMeteor() {
    if (activeMeteors.length > 3) return; // 限制数量

    const meteor = createShootingStarGraphic();

    // 随机位置（上方）
    const x = (Math.random() - 0.5) * 1000;
    const y = (Math.random() * 500) + 200;
    const z = (Math.random() - 0.5) * 600 - 200;

    meteor.position.set(x, y, z);

    // 随机角度（向下）
    meteor.rotation.z = Math.PI / 4 + (Math.random() - 0.5) * 0.5;

    scene.add(meteor);

    activeMeteors.push({
        mesh: meteor,
        speed: 15 + Math.random() * 20,
        life: 1.0
    });
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    animationId = requestAnimationFrame(animate);
    const time = Date.now() * 0.0002;

    // 1. Stars Rotation
    if (stars) {
        stars.forEach(s => {
            s.rotation.y += s.userData.rotSpeed;
            // 微微起伏，模拟呼吸
            s.position.y += Math.sin(time * 5 + s.id) * 0.02;
        });
    }

    // 2. Nebula Flow
    if (nebulaParticles) {
        nebulaParticles.rotation.y = -time * 0.5; // 缓慢旋转

        // 粒子本身稍微脉动
        const positions = nebulaParticles.geometry.attributes.position.array;
        // 这一步太消耗CPU，我们只旋转整体
    }

    // 3. Camera Movement (Parallax)
    // 鼠标稍微影响相机？不，保持自动巡航更像屏保
    camera.position.x = Math.sin(time * 0.5) * 50;
    camera.position.y = Math.cos(time * 0.3) * 30;
    camera.lookAt(0, 0, 0);

    // 4. Meteors Logic
    if (Math.random() > 0.98) spawnMeteor();

    for (let i = activeMeteors.length - 1; i >= 0; i--) {
        const m = activeMeteors[i];
        m.mesh.position.x += Math.cos(m.mesh.rotation.z) * m.speed;
        m.mesh.position.y -= Math.sin(m.mesh.rotation.z) * m.speed; // 向下

        m.life -= 0.02;

        // 淡入淡出
        if (m.life > 0.8) m.mesh.material.opacity = (1 - m.life) * 5; // 0 -> 1
        else m.mesh.material.opacity = m.life; // 0.8 -> 0

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
    stars = null;
    nebulaParticles = null;
    activeMeteors = [];
}
