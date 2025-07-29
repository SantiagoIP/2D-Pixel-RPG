import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

export function setupScene() {
    const scene = new THREE.Scene();
    
    // Create an enhanced gradient sky background with dynamic time effects
    const skyGradient = createEnhancedSkyGradient();
    scene.background = skyGradient;

    // Use Orthographic Camera for 2D feel with better positioning
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

    // Position the camera above the scene, looking down with slight angle for depth
    camera.position.set(0, 15, 0);
    camera.lookAt(scene.position);
    camera.zoom = 1;
    camera.updateProjectionMatrix();

    // Enhanced Lighting System with dynamic elements
    setupEnhancedLighting(scene);

    // Add dynamic atmospheric fog with color variation
    const fogColor = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(fogColor, 25, 55);

    // Add environmental effects
    addEnvironmentalEffects(scene);

    return { scene, camera };
}

function createEnhancedSkyGradient() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;  // Higher resolution for better quality
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create a beautiful fantasy sky gradient with multiple layers
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height * 0.3, 0,
        canvas.width / 2, canvas.height * 0.3, canvas.width * 0.8
    );
    
    // Enhanced color stops for magical atmosphere
    gradient.addColorStop(0, '#FFE4B5');   // Warm center (sun area)
    gradient.addColorStop(0.2, '#87CEEB'); // Sky blue
    gradient.addColorStop(0.4, '#9370DB'); // Medium orchid
    gradient.addColorStop(0.6, '#4682B4'); // Steel blue
    gradient.addColorStop(0.8, '#2F4F4F'); // Dark slate gray
    gradient.addColorStop(1, '#191970');   // Midnight blue at edges
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add mystical clouds with varying opacity
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 12; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.8;
        const size = 30 + Math.random() * 60;
        const opacity = 0.1 + Math.random() * 0.3;
        
        const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        cloudGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
        cloudGradient.addColorStop(0.6, `rgba(220, 220, 255, ${opacity * 0.6})`);
        cloudGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = cloudGradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Add subtle sparkles for magical effect
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 1 + Math.random() * 2;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
}

function setupEnhancedLighting(scene) {
    // Enhanced ambient light with warm fantasy tone
    const ambientLight = new THREE.AmbientLight(0xFFF8DC, 0.4);
    scene.add(ambientLight);

    // Main directional light (magical sun) with enhanced properties
    const sunLight = new THREE.DirectionalLight(0xFFE4B5, 1.0);
    sunLight.position.set(12, 25, 8);
    sunLight.castShadow = true;
    
    // Enhanced shadow configuration
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.00005;
    sunLight.shadow.normalBias = 0.02;
    
    scene.add(sunLight);

    // Secondary fill light with magical purple tint
    const fillLight = new THREE.DirectionalLight(0xDDA0DD, 0.3);
    fillLight.position.set(-10, 18, -12);
    scene.add(fillLight);

    // Rim light for dramatic character separation
    const rimLight = new THREE.DirectionalLight(0x87CEEB, 0.25);
    rimLight.position.set(0, 12, -20);
    scene.add(rimLight);

    // Magical atmospheric point lights with animated properties
    const magicLight1 = new THREE.PointLight(0xBA55D3, 0.4, 35);
    magicLight1.position.set(20, 10, 20);
    scene.add(magicLight1);

    const magicLight2 = new THREE.PointLight(0x98FB98, 0.3, 30);
    magicLight2.position.set(-18, 8, -15);
    scene.add(magicLight2);

    const magicLight3 = new THREE.PointLight(0xFFB6C1, 0.35, 25);
    magicLight3.position.set(5, 6, -25);
    scene.add(magicLight3);

    // Subtle hemisphere light for overall ambiance
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.2);
    scene.add(hemisphereLight);

    // Store lights for potential animation
    scene.userData.magicLights = [magicLight1, magicLight2, magicLight3];
}

function addEnvironmentalEffects(scene) {
    // Add subtle environmental particles (dust motes, magical sparkles)
    const particleCount = 50;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        // Randomly distribute particles in the scene
        positions[i * 3] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = Math.random() * 20 + 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
        
        // Assign subtle magical colors
        const colorChoice = Math.random();
        if (colorChoice < 0.4) {
            colors[i * 3] = 1.0;     // White
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 1.0;
        } else if (colorChoice < 0.7) {
            colors[i * 3] = 0.9;     // Light blue
            colors[i * 3 + 1] = 0.9;
            colors[i * 3 + 2] = 1.0;
        } else {
            colors[i * 3] = 1.0;     // Light purple
            colors[i * 3 + 1] = 0.9;
            colors[i * 3 + 2] = 1.0;
        }
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
    
    // Store for potential animation
    scene.userData.environmentalParticles = particleSystem;
}