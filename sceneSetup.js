import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

export function setupScene() {
    const scene = new THREE.Scene();
    
    // Create a beautiful gradient sky background
    const skyGradient = createSkyGradient();
    scene.background = skyGradient;

    // Use Orthographic Camera for 2D feel
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 25;
    const camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        100
    );

    // Position the camera above the scene, looking down
    camera.position.set(0, 15, 0);
    camera.lookAt(scene.position);
    camera.zoom = 1;
    camera.updateProjectionMatrix();

    // Enhanced Lighting System
    setupEnhancedLighting(scene);

    // Add atmospheric fog for depth
    scene.fog = new THREE.Fog(0x87CEEB, 30, 60); // Reduced fog density

    return { scene, camera };
}

function createSkyGradient() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Create a beautiful sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');   // Sky blue at top
    gradient.addColorStop(0.3, '#B0E0E6'); // Powder blue
    gradient.addColorStop(0.7, '#F0F8FF'); // Alice blue
    gradient.addColorStop(1, '#FFE4B5');   // Moccasin at horizon
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some subtle clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // Slightly more visible clouds
    for (let i = 0; i < 8; i++) { // More clouds
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.7;
        const size = 25 + Math.random() * 35; // Larger clouds
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    
    console.log('Sky texture created:', texture);
    return texture;
}

function setupEnhancedLighting(scene) {
    // Warm ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xFFF8DC, 0.8); // Increased intensity
    scene.add(ambientLight);

    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xFFFACD, 1.2); // Increased intensity
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    
    // Configure shadows for better quality
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    sunLight.shadow.bias = -0.0001;
    
    scene.add(sunLight);

    // Secondary fill light for softer shadows
    const fillLight = new THREE.DirectionalLight(0xE6E6FA, 0.5); // Increased intensity
    fillLight.position.set(-8, 15, -8);
    scene.add(fillLight);

    // Rim light for character separation
    const rimLight = new THREE.DirectionalLight(0xFFE4E1, 0.4); // Increased intensity
    rimLight.position.set(0, 10, -15);
    scene.add(rimLight);

    // Add some point lights for atmospheric effect
    const atmosphericLight1 = new THREE.PointLight(0xFFB6C1, 0.6, 30); // Increased intensity
    atmosphericLight1.position.set(15, 8, 15);
    scene.add(atmosphericLight1);

    const atmosphericLight2 = new THREE.PointLight(0x98FB98, 0.5, 25); // Increased intensity
    atmosphericLight2.position.set(-12, 6, -10);
    scene.add(atmosphericLight2);
}