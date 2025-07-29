import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

// A reusable pool for vectors to avoid creating new objects in the loop
const vec3Pool = {
    pool: [],
    get: function() {
        return this.pool.length > 0 ? this.pool.pop().set(0, 0, 0) : new THREE.Vector3();
    },
    release: function(v) {
        this.pool.push(v);
    }
};

class Particle {
    constructor() {
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.color = new THREE.Color();
        this.alpha = 1.0;
        this.size = 1.0;
        this.life = 0;
        this.maxLife = 1;
        this.gravity = 0;
        this.drag = 0;
    }

    reset(origin, config) {
        this.position.copy(origin);
        
        const speed = THREE.MathUtils.randFloat(config.speedRange[0], config.speedRange[1]);
        const angle = Math.random() * Math.PI * 2;
        const elevation = (config.elevationRange ? THREE.MathUtils.randFloat(config.elevationRange[0], config.elevationRange[1]) : Math.random()) * Math.PI - Math.PI / 2;

        this.velocity.set(
            Math.cos(angle) * Math.cos(elevation) * speed,
            Math.sin(elevation) * speed,
            Math.sin(angle) * Math.cos(elevation) * speed
        );

        this.color.set(config.colors[Math.floor(Math.random() * config.colors.length)]);
        this.alpha = 1.0;
        this.size = THREE.MathUtils.randFloat(config.sizeRange[0], config.sizeRange[1]);
        this.maxLife = THREE.MathUtils.randFloat(config.lifeRange[0], config.lifeRange[1]);
        this.life = 0;
        this.gravity = config.gravity || 0;
        this.drag = config.drag || 1.0;

        return this;
    }

    update(deltaTime) {
        this.life += deltaTime;
        if (this.life >= this.maxLife) return false;

        this.position.addScaledVector(this.velocity, deltaTime);
        
        this.velocity.y -= this.gravity * deltaTime;
        this.velocity.multiplyScalar(this.drag);
        
        // Fade out
        const lifeRatio = this.life / this.maxLife;
        this.alpha = 1.0 - lifeRatio * lifeRatio; // Use quadratic fade-out for a nicer effect

        return true;
    }
}


export class ParticleSystem {
    constructor(scene, maxParticles = 1000) {
        this.scene = scene;
        this.maxParticles = maxParticles;

        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(maxParticles * 3);
        this.colors = new Float32Array(maxParticles * 3);
        this.alphas = new Float32Array(maxParticles);
        this.sizes = new Float32Array(maxParticles);

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
        this.geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(this.alphas, 1));
        this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(this.sizes, 1));
        
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABFklEQVR42u3WMU4CQRTG8b8CCpTSUFPQ0BDQ0FKQ0BDQ0lCQUhBQLUKlpSgIqAjB3Z3dTCYzc6/5L5klM2/e3NnL7CIRl/oFncYp8AqcAgLAANgAK+BWGlisAAnYAVvD/IdfANrE2iXgCjwDO8A2sK0CXgA7wP6wP2wPj4AFsE4h0x9gAEwAP2gGKxqAAmwDzwS/XwDOgC/g8/YtA9g2sNJnAZgD3sC7rYwBC8AysL+aP/VbA7wA600s/wE4A3aBF3AVWAArk9mH8BH4AD4BN8ACGAHzwHlgGdgAdcDXRbYVwA/glvXpWsDW8B8/AlwA1sRif/xXgL8D2o2vAQvAClgBVsAC+Ac4AobBAFh3Gg4AAAAASUVORK5CYII=') },
                time: { value: 0.0 }
            },
            vertexShader: `
                attribute float size;
                attribute float alpha;
                attribute vec3 color;
                varying float vAlpha;
                varying vec3 vColor;
                varying vec2 vUv;
                uniform float time;
                
                void main() {
                    vAlpha = alpha;
                    vColor = color;
                    vUv = uv;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Enhanced size calculation with breathing effect
                    float breathe = 1.0 + 0.1 * sin(time * 3.0 + position.x + position.z);
                    float finalSize = size * breathe * (300.0 / -mvPosition.z);
                    
                    gl_PointSize = finalSize;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                uniform float time;
                varying float vAlpha;
                varying vec3 vColor;
                
                void main() {
                    // Enhanced particle texture with glow effect
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center);
                    
                    // Create a soft circular gradient
                    float mask = 1.0 - smoothstep(0.3, 0.5, dist);
                    
                    // Add subtle sparkle effect
                    float sparkle = 1.0 + 0.3 * sin(time * 8.0 + dist * 20.0);
                    
                    // Enhanced glow with sparkle
                    vec3 finalColor = vColor * sparkle;
                    float finalAlpha = vAlpha * mask;
                    
                    gl_FragColor = vec4(finalColor, finalAlpha);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);

        this.activeParticles = [];
        this.particlePool = [];
        
        // Enhanced effect configurations
        this.effectConfigs = {
            levelUp: {
                count: 200,
                colors: ['#FFD700', '#FFEC8B', '#FFFFFF', '#FFA500', '#FF6B6B', '#87CEEB'],
                sizeRange: [8, 18],
                speedRange: [5, 12],
                lifeRange: [2.0, 4.0],
                gravity: 2,
                drag: 0.98,
                elevationRange: [0, Math.PI]
            },
            monsterHit: {
                count: 35,
                colors: ['#FF4444', '#FF8888', '#FF6B6B', '#FFB6C1', '#8B0000'],
                sizeRange: [4, 9],
                speedRange: [4, 8],
                lifeRange: [0.5, 1.2],
                gravity: 2.5,
                drag: 0.94,
                elevationRange: [-Math.PI/4, Math.PI/4]
            },
            playerHit: {
                count: 40,
                colors: ['#FF0000', '#FF6666', '#FFFFFF', '#FFB6C1', '#DC143C'],
                sizeRange: [5, 10],
                speedRange: [5, 9],
                lifeRange: [0.8, 1.5],
                gravity: 1.8,
                drag: 0.95,
                elevationRange: [-Math.PI/6, Math.PI/3]
            },
            magicCast: {
                count: 60,
                colors: ['#9370DB', '#BA55D3', '#DA70D6', '#EE82EE', '#DDA0DD', '#FFFFFF'],
                sizeRange: [6, 14],
                speedRange: [3, 7],
                lifeRange: [1.5, 2.5],
                gravity: -1, // Negative gravity for floating effect
                drag: 0.97,
                elevationRange: [0, Math.PI/2]
            },
            heal: {
                count: 50,
                colors: ['#00FF00', '#32CD32', '#7CFC00', '#ADFF2F', '#FFFFFF'],
                sizeRange: [5, 12],
                speedRange: [2, 5],
                lifeRange: [1.2, 2.0],
                gravity: -0.5, // Slight upward movement
                drag: 0.98,
                elevationRange: [Math.PI/4, 3*Math.PI/4]
            },
            treasure: {
                count: 80,
                colors: ['#FFD700', '#FFA500', '#FF6347', '#FFE4B5', '#FFFFFF'],
                sizeRange: [7, 15],
                speedRange: [3, 8],
                lifeRange: [2.0, 3.5],
                gravity: 1.5,
                drag: 0.96,
                elevationRange: [0, Math.PI]
            },
            questComplete: {
                count: 120,
                colors: ['#00BFFF', '#87CEEB', '#87CEFA', '#B0E0E6', '#FFFFFF', '#FFD700'],
                sizeRange: [6, 16],
                speedRange: [4, 10],
                lifeRange: [2.5, 4.0],
                gravity: 1,
                drag: 0.97,
                elevationRange: [0, Math.PI]
            },
            weaponPickup: {
                count: 45,
                colors: ['#C0C0C0', '#FFD700', '#FF6347', '#87CEEB'],
                sizeRange: [5, 11],
                speedRange: [3, 6],
                lifeRange: [1.0, 2.0],
                gravity: 2,
                drag: 0.96,
                elevationRange: [-Math.PI/6, Math.PI/2]
            }
        };
    }

    createEffect(type, origin) {
        if (!this.effectConfigs[type]) {
            console.warn(`Particle effect type "${type}" not found.`);
            return;
        }
        
        const config = this.effectConfigs[type];
        
        for (let i = 0; i < config.count; i++) {
            if (this.activeParticles.length >= this.maxParticles) break;

            const particle = this.particlePool.length > 0 ? this.particlePool.pop() : new Particle();
            particle.reset(origin, config);
            this.activeParticles.push(particle);
        }
    }

    update(deltaTime) {
        // Update time uniform for shader effects
        this.material.uniforms.time.value += deltaTime;
        
        let activeCount = 0;
        for (let i = 0; i < this.activeParticles.length; i++) {
            const particle = this.activeParticles[i];
            const isAlive = particle.update(deltaTime);

            if (isAlive) {
                if (i !== activeCount) {
                    // This particle is alive, but it's not in the right position in the array.
                    // To fix this, we'll swap it with the first "dead" particle we've found.
                    const temp = this.activeParticles[activeCount];
                    this.activeParticles[activeCount] = particle;
                    this.activeParticles[i] = temp;
                }

                // Now that the particle is in the correct slot, update its attributes.
                this.positions[activeCount * 3] = particle.position.x;
                this.positions[activeCount * 3 + 1] = particle.position.y;
                this.positions[activeCount * 3 + 2] = particle.position.z;
                particle.color.toArray(this.colors, activeCount * 3);
                this.alphas[activeCount] = particle.alpha;
                this.sizes[activeCount] = particle.size;

                activeCount++;
            }
        }

        // Return dead particles to the pool
        while(this.activeParticles.length > activeCount) {
            this.particlePool.push(this.activeParticles.pop());
        }
        
        // Hide unused particles
        for(let j = activeCount; j < this.maxParticles; j++) {
            this.sizes[j] = 0;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.alpha.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
        
        this.geometry.computeBoundingSphere();
    }
    
    dispose() {
        this.scene.remove(this.points);
        this.geometry.dispose();
        this.material.dispose();
    }
}