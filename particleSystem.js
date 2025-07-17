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
                pointTexture: { value: new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABFklEQVR42u3WMU4CQRTG8b8CCpTSUFPQ0BDQ0FKQ0BDQ0lCQUhBQLUKlpSgIqAjB3Z3dTCYzc6/5L5klM2/e3NnL7CIRl/oFncYp8AqcAgLAANgAK+BWGlisAAnYAVvD/IdfANrE2iXgCjwDO8A2sK0CXgA7wP6wP2wPj4AFsE4h0x9gAEwAP2gGKxqAAmwDzwS/XwDOgC/g8/YtA9g2sNJnAZgD3sC7rYwBC8AysL+aP/VbA7wA600s/wE4A3aBF3AVWAArk9mH8BH4AD4BN8ACGAHzwHlgGdgAdcDXRbYVwA/glvXpWsDW8B8/AlwA1sRif/xXgL8D2o2vAQvAClgBVsAC+Ac4AobBAFh3Gg4AAAAASUVORK5CYII=') }
            },
            vertexShader: `
                attribute float size;
                attribute float alpha;
                attribute vec3 color;
                varying float vAlpha;
                varying vec3 vColor;
                void main() {
                    vAlpha = alpha;
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying float vAlpha;
                varying vec3 vColor;
                void main() {
                    gl_FragColor = vec4(vColor, vAlpha);
                    gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
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
        
        this.effectConfigs = {
            levelUp: {
                count: 150,
                colors: ['#FFD700', '#FFEC8B', '#FFFFFF', '#FFA500', '#FF6B6B'],
                sizeRange: [6, 15],
                speedRange: [4, 9],
                lifeRange: [1.5, 3.0],
                gravity: 3,
                drag: 0.98
            },
            monsterHit: {
                count: 25,
                colors: ['#FF4444', '#FF8888', '#FF6B6B', '#FFB6C1'],
                sizeRange: [3, 7],
                speedRange: [3, 6],
                lifeRange: [0.4, 0.8],
                gravity: 2,
                drag: 0.95
            },
            playerHit: {
                count: 30,
                colors: ['#FF0000', '#FF6666', '#FFFFFF', '#FFB6C1'],
                sizeRange: [4, 8],
                speedRange: [4, 7],
                lifeRange: [0.5, 1.0],
                gravity: 1.5,
                drag: 0.96
            },
            monsterDefeat: {
                count: 80,
                colors: ['#AA0000', '#FF5555', '#FFFFFF', '#FFD700', '#FF6B6B'],
                sizeRange: [5, 12],
                speedRange: [5, 10],
                lifeRange: [1.0, 2.0],
                gravity: 3,
                drag: 0.97
            },
            shrineActivate: {
                count: 100,
                colors: ['#BA55D3', '#DDA0DD', '#FFFFFF', '#9370DB', '#E6E6FA'],
                sizeRange: [4, 10],
                speedRange: [2, 5],
                lifeRange: [2.0, 4.0],
                gravity: -0.5, // Rise upwards
                drag: 0.98,
                elevationRange: [0, 1] // Emit upwards in a cone
            },
            criticalHit: {
                count: 50,
                colors: ['#FFFF00', '#FFAA00', '#FFFFFF', '#FFD700', '#FF6B6B'],
                sizeRange: [5, 10],
                speedRange: [6, 12],
                lifeRange: [0.8, 1.5],
                gravity: 1.5,
                drag: 0.97
            },
            attackHit: {
                count: 15,
                colors: ['#FFFFFF', '#F0F0F0', '#DDDDDD'],
                sizeRange: [2, 5],
                speedRange: [2, 5],
                lifeRange: [0.2, 0.5],
                gravity: 1,
                drag: 0.92
            },
            heal: {
                count: 40,
                colors: ['#00FF00', '#88FF88', '#CCFFCC', '#FFFFFF', '#90EE90'],
                sizeRange: [4, 8],
                speedRange: [1, 4],
                lifeRange: [1.5, 2.5],
                gravity: -1, // Rise upwards
                drag: 0.98,
                elevationRange: [0, 1] // Emit upwards in a cone
            },
            npcInteract: {
                count: 20,
                colors: ['#88FF88', '#CCFFCC', '#FFFFFF'],
                sizeRange: [2, 4],
                speedRange: [1, 3],
                lifeRange: [0.5, 1.0],
                gravity: -0.5, // Rise up
                drag: 0.95,
                elevationRange: [0, 0.5]
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