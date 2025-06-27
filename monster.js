import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { createPixelSprite, createMonsterAttackSprite } from './spriteUtils.js';
class MonsterProjectile {
    constructor(position, direction) {
        this.size = 0.4;
        this.mesh = createMonsterAttackSprite(this.size);
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.5; // Keep slightly above ground
        this.direction = direction.normalize();
        this.speed = 8;
        this.lifetime = 1.5; // Projectiles last for 1.5 seconds
        this.aliveTime = 0;
    }
    update(deltaTime) {
        this.mesh.position.add(this.direction.clone().multiplyScalar(this.speed * deltaTime));
        this.aliveTime += deltaTime;
    }
    isAlive() {
        return this.aliveTime < this.lifetime;
    }
    expire() {
        this.aliveTime = this.lifetime; // Mark for removal
    }
    dispose() {
        if (this.mesh.dispose) {
            this.mesh.dispose();
        }
    }
}
export class Monster {
    constructor(scene, type = 'greenOgre') { // Accept type, default to greenOgre
        this.scene = scene;
        this.type = type; // Store the type
        // Define properties based on type
        if (type === 'redSkull') {
            this.size = 0.8 + Math.random() * 0.2;
            this.speed = 1.8 + Math.random() * 0.4;
            this.maxHealth = 2; // Tougher than a greenOgre
            this.attackRange = 7;
            this.attackCooldown = 2.0; // Seconds between attacks
            this.lastAttackTime = -this.attackCooldown; // Allow immediate first attack
        } else if (type === 'magicWisp') {
            this.size = 0.7 + Math.random() * 0.2; // Smaller and harder to hit
            this.speed = 2.4 + Math.random() * 0.6; // Very fast
            this.maxHealth = 3; // A bit tougher than skulls
        } else if (type === 'cyclops') {
            this.size = 1.5 + Math.random() * 0.4;
            this.speed = 1.0 + Math.random() * 0.3;
            this.maxHealth = 4;
        } else { // Default to greenOgre
            this.size = 0.9 + Math.random() * 0.3;
            this.speed = 1.5 + Math.random() * 0.5;
            this.maxHealth = 2;
        }
        this.mesh = createPixelSprite(this.type, this.size);
        this.scene.add(this.mesh);
        // Add flat ellipse shadow
        const shadowGeometry = new THREE.PlaneGeometry(this.size * 0.7, this.size * 0.3);
        const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
        this.shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.shadowMesh.rotation.x = -Math.PI / 2;
        this.shadowMesh.position.set(0, 0.01, 0);
        this.mesh.add(this.shadowMesh);
        // Spawn pop animation
        this.mesh.scale.set(0.1, 0.1, 0.1);
        this.spawnAnimTime = 0.18;
        this.spawnAnimElapsed = 0;
        this.isSpawning = true;
        this.currentHealth = this.maxHealth;
        this.moveDirection = new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2).normalize();
        this.changeDirectionTimer = Math.random() * 3 + 1; // Change direction every 1-4 seconds
        this.detectionRange = 8; // How far the monster can see the player
        this.isChasing = false;
    }
    takeDamage(amount) {
        this.currentHealth -= amount;
        // Hurt flash
        if (this.mesh.material.uniforms && this.mesh.material.uniforms.u_flash) {
            this.mesh.material.uniforms.u_flash.value = 0.7;
            setTimeout(() => {
                if (this.mesh.material.uniforms) this.mesh.material.uniforms.u_flash.value = 0;
            }, 120);
        }
        // console.log(`Monster took ${amount} damage, HP left: ${this.currentHealth}`);
        // Optional: Add visual feedback
    }
    isAlive() {
        return this.currentHealth > 0;
    }
    checkCollision(potentialPosition, obstacles, worldSize) {
        const halfSize = this.size / 2;
        const halfWorld = worldSize / 2;

        // World bounds check
         if (potentialPosition.x < -halfWorld + halfSize || potentialPosition.x > halfWorld - halfSize ||
             potentialPosition.z < -halfWorld + halfSize || potentialPosition.z > halfWorld - halfSize) {
             return true; // Collision with world edge
         }

        // Obstacle collision check
         for (const obstacle of obstacles) {
            const obstaclePos = obstacle.position;
            const obstacleSize = obstacle.userData.size || 1;
            const halfObstacleSize = obstacleSize / 2;

            if (Math.abs(potentialPosition.x - obstaclePos.x) < (halfSize + halfObstacleSize) &&
                Math.abs(potentialPosition.z - obstaclePos.z) < (halfSize + halfObstacleSize)) {
                return true; // Collision with obstacle
            }
        }
        return false;
    }

    attack(targetPosition) {
        const now = performance.now() / 1000;
        if (now - this.lastAttackTime < this.attackCooldown) {
            return null; // On cooldown
        }
        this.lastAttackTime = now;
        const direction = targetPosition.clone().sub(this.mesh.position).normalize();
        const startPosition = this.mesh.position.clone().add(direction.clone().multiplyScalar(this.size * 0.6));
        return new MonsterProjectile(startPosition, direction);
    }
    update(deltaTime, playerPosition, obstacles, worldSize) {
        this.changeDirectionTimer -= deltaTime;
        let projectile = null;
        const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
        if (distanceToPlayer < this.detectionRange) {
            this.moveDirection = playerPosition.clone().sub(this.mesh.position).normalize();
            this.isChasing = true;
            // Red Skull specific: attack if in range
            if (this.type === 'redSkull' && distanceToPlayer < this.attackRange) {
                // If in attack range, stop moving to cast the spell
                this.speed = 0;
                projectile = this.attack(playerPosition);
            } else if (this.type === 'redSkull') {
                 // If chasing but not in attack range, resume normal speed
                this.speed = 1.8 + Math.random() * 0.4;
            }
        } else {
            if (this.isChasing || this.changeDirectionTimer <= 0) {
                this.moveDirection.set((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2).normalize();
                this.changeDirectionTimer = Math.random() * 3 + 1;
                this.isChasing = false;
            }
        }
        const moveDelta = this.moveDirection.clone().multiplyScalar(this.speed * deltaTime);
        const potentialPosition = this.mesh.position.clone().add(moveDelta);
        if (this.checkCollision(potentialPosition, obstacles, worldSize)) {
            this.moveDirection.set((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2).normalize();
            this.changeDirectionTimer = 0.5;
            this.isChasing = false;
        } else {
            this.mesh.position.add(moveDelta);
        }
        this.mesh.position.y = this.size / 2;
        // Shadow follows monster
        if (this.shadowMesh) {
            this.shadowMesh.position.x = 0;
            this.shadowMesh.position.z = 0;
            this.shadowMesh.position.y = -this.size / 2 + 0.01;
        }
        // Spawn pop animation
        if (this.isSpawning) {
            this.spawnAnimElapsed += deltaTime;
            const t = Math.min(1, this.spawnAnimElapsed / this.spawnAnimTime);
            const scale = 0.1 + (1 - 0.1) * t;
            this.mesh.scale.set(scale, scale, scale);
            if (t >= 1) {
                this.mesh.scale.set(1, 1, 1);
                this.isSpawning = false;
            }
        }
        return projectile; // Return projectile if one was created
    }

    dispose() {
        // Clean up Three.js resources
        if (this.mesh.dispose) {
            this.mesh.dispose(); // Call the dispose helper on the sprite
        }
         // No need to explicitly remove from scene here, Game class handles it
    }

    defeatAnimation(callback) {
        // Scale pop and fade out
        const mesh = this.mesh;
        let elapsed = 0;
        const duration = 0.25;
        const animate = () => {
            elapsed += 0.016;
            const t = Math.min(1, elapsed / duration);
            mesh.scale.setScalar(1 + 0.5 * t);
            mesh.material.opacity = 1 - t;
            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                if (callback) callback();
            }
        };
        animate();
    }
}