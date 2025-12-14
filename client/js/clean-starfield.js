
// 这是一个独立的、精简的3D星空背景模块，用于黑夜模式
// 依赖全局 THREE 对象 (已在 index.html 中引入)
// V2: 增强宇宙感，加入星云和动态光晕

let scene, camera, renderer, animationId;
let stars = [], nebulaSystem;

export function initStarfield() {
    if (renderer) return;

    // 1. Setup Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.001); // Deep dark blue fog

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 100;
    camera.rotation.x = Math.PI / 8;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.domElement.id = 'clean-starfield-canvas';
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
    renderer.domElement.style.zIndex = '-9999';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.opacity = '1';
    renderer.domElement.style.display = 'block';

    document.body.appendChild(renderer.domElement);

    // 2. Create Galaxy Components

    // A. Stars (3 Layers)
    createStarLayer(1500, 1000, 1.2, 0xaaaaaa); // Far
    createStarLayer(800, 800, 2.0, 0xcceeff);   // Mid
    createStarLayer(200, 600, 3.5, 0xffffff);   // Near bright

    // B. Nebula (Cloud Clusters)
    createNebula();

    // 3. Resize Listener
    window.addEventListener('resize', onWindowResize, false);

    // 4. Start Loop
    animate();
}

function createStarLayer(count, range, size, colorVal) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * range * 1.5;
        pos[i * 3 + 1] = (Math.random() - 0.5) * range * 0.8;
        pos[i * 3 + 2] = (Math.random() - 0.5) * range * 0.8;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
        size: size,
        color: colorVal,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });
    const mesh = new THREE.Points(geo, mat);
    mesh.userData = { speed: (Math.random() * 0.0005) + 0.0001 };
    scene.add(mesh);
    stars.push(mesh);
}

function createNebula() {
    // Generate soft texture directly
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    // Purple/Blue Cosmic Colors
    grad.addColorStop(0, 'rgba(100, 100, 255, 0.4)'); // Core
    grad.addColorStop(0.5, 'rgba(80, 0, 120, 0.2)');  // Mid
    grad.addColorStop(1, 'rgba(0,0,0,0)');            // Edge
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);

    const count = 150;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        // Spread broadly
        pos[i * 3] = (Math.random() - 0.5) * 800;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 400;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 200 - 100; // Background

        // Color variation
        if (Math.random() > 0.5) {
            // Pinkish
            colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.4; colors[i * 3 + 2] = 0.8;
        } else {
            // Blueish
            colors[i * 3] = 0.4; colors[i * 3 + 1] = 0.6; colors[i * 3 + 2] = 1.0;
        }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 150,
        map: texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    nebulaSystem = new THREE.Points(geo, mat);
    scene.add(nebulaSystem);
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    animationId = requestAnimationFrame(animate);
    const time = Date.now() * 0.0005;

    // Rotate Stars
    stars.forEach((s, idx) => {
        // Different layers rotate at different speeds for parallax
        const dir = idx % 2 === 0 ? 1 : -1;
        s.rotation.y += s.userData.speed * dir;
        // Float effect
        s.position.y += Math.sin(time + idx) * 0.05;
    });

    // Animate Nebula
    if (nebulaSystem) {
        nebulaSystem.rotation.z = Math.sin(time * 0.2) * 0.05;
        // Pulse
        const scale = 1 + Math.sin(time * 0.5) * 0.05;
        nebulaSystem.scale.set(scale, scale, scale);
    }

    // Camera Drift
    camera.position.x = Math.sin(time * 0.2) * 20;
    camera.position.y = Math.cos(time * 0.3) * 20;
    camera.lookAt(0, 0, 0);

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
    nebulaSystem = null;
}
