
// 这是一个独立的、精简的3D星空背景模块，用于黑夜模式
// 依赖全局 THREE 对象 (已在 index.html 中引入)

let scene, camera, renderer, animationId;
let stars;

export function initStarfield() {
    if (renderer) return; // 防止重复初始化

    console.log("Initializing Clean Starfield for Dark Mode...");

    // 1. Setup Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001); // 纯黑背景雾

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 1;
    camera.rotation.x = Math.PI / 2;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 强制样式，确保显示
    renderer.domElement.id = 'clean-starfield-canvas';
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100vw'; // 强制全宽
    renderer.domElement.style.height = '100vh'; // 强制全高
    renderer.domElement.style.zIndex = '-9999'; // 最底层
    renderer.domElement.style.pointerEvents = 'none'; // 不阻挡点击
    renderer.domElement.style.opacity = '1';
    renderer.domElement.style.display = 'block';

    document.body.appendChild(renderer.domElement);

    // 2. Create Stars 粒子系统
    // 模拟首页的流动感：大量微小白点 + 少量亮星
    const starGeo = new THREE.BufferGeometry();
    const starCount = 8000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        // 随机分布在空间中
        positions[i * 3] = (Math.random() - 0.5) * 600;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 600;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 600;

        // 颜色稍微有点变化 (蓝白)
        const colorType = Math.random();
        if (colorType > 0.9) {
            colors[i * 3] = 0.8; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0; // 亮蓝
        } else {
            colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.6; colors[i * 3 + 2] = 0.8; // 灰调
        }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    });

    stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 3. Resize Listener
    window.addEventListener('resize', onWindowResize, false);

    // 4. Start Loop
    animate();
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    animationId = requestAnimationFrame(animate);

    // 简单的缓慢旋转，模拟宇宙流动
    if (stars) {
        stars.rotation.y += 0.0003;
        stars.rotation.x += 0.0001;
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
}
