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
    constructor(scene, type = 'greenOgre', biome = 'GREEN_HILLS') { // Accept biome parameter
        this.scene = scene;
        this.type = type; // Store the type
        this.biome = biome; // Store biome for special behaviors
        
        // Define properties based on type with biome-specific variations
        if (type === 'desertScorpion') {
            this.size = 0.9 + Math.random() * 0.3;
            this.speed = 2.0 + Math.random() * 0.5; // Fast desert creature
            this.maxHealth = 3;
            this.attackRange = 6;
            this.attackCooldown = 1.8;
            this.lastAttackTime = -this.attackCooldown;
        } else if (type === 'frostWolf') {
            this.size = 1.1 + Math.random() * 0.4;
            this.speed = 2.5 + Math.random() * 0.6; // Very fast pack hunter
            this.maxHealth = 2;
            this.attackRange = 5;
            this.attackCooldown = 1.5;
            this.lastAttackTime = -this.attackCooldown;
        } else if (type === 'volcanicGolem') {
            this.size = 1.4 + Math.random() * 0.5; // Large and tough
            this.speed = 0.8 + Math.random() * 0.3; // Slow but powerful
            this.maxHealth = 6; // Very tough
            this.attackRange = 4;
            this.attackCooldown = 3.0; // Slow attacks but devastating
            this.lastAttackTime = -this.attackCooldown;
        } else if (type === 'iceElemental') {
            this.size = 1.0 + Math.random() * 0.3;
            this.speed = 1.2 + Math.random() * 0.4; // Moderate speed
            this.maxHealth = 4;
            this.attackRange = 8; // Long range magic attacks
            this.attackCooldown = 2.5;
            this.lastAttackTime = -this.attackCooldown;
        } else if (type === 'magicTreent') {
            this.size = 1.6 + Math.random() * 0.4; // Large tree creature
            this.speed = 0.5 + Math.random() * 0.2; // Very slow
            this.maxHealth = 8; // Extremely tough
            this.attackRange = 6;
            this.attackCooldown = 4.0; // Very slow but powerful
            this.lastAttackTime = -this.attackCooldown;
        } else if (type === 'redSkull') {
            this.size = 0.8 + Math.random() * 0.2;
            this.speed = 1.8 + Math.random() * 0.4;
            this.maxHealth = 2;
            this.attackRange = 7;
            this.attackCooldown = 2.0;
            this.lastAttackTime = -this.attackCooldown;
        } else if (type === 'magicWisp') {
            this.size = 0.7 + Math.random() * 0.2;
            this.speed = 2.4 + Math.random() * 0.6;
            this.maxHealth = 3;
            this.attackRange = 9; // Long range magic
            this.attackCooldown = 2.2;
            this.lastAttackTime = -this.attackCooldown;
        } else if (type === 'cyclops') {
            this.size = 1.5 + Math.random() * 0.4;
            this.speed = 1.0 + Math.random() * 0.3;
            this.maxHealth = 4;
            this.attackRange = 5;
            this.attackCooldown = 2.8;
            this.lastAttackTime = -this.attackCooldown;
        } else { // Default to greenOgre
            this.size = 0.9 + Math.random() * 0.3;
            this.speed = 1.5 + Math.random() * 0.5;
            this.maxHealth = 2;
            this.attackRange = 4;
            this.attackCooldown = 2.0;
            this.lastAttackTime = -this.attackCooldown;
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
        // AI improvements
        this.aggroRange = this.detectionRange * 1.5; // Extended aggro range
        this.circleTimer = 0;
        this.circleDirection = Math.random() > 0.5 ? 1 : -1; // Clockwise or counter-clockwise
        this.lastPlayerPosition = null;
        this.huntingMode = false;
        this.specialAttackCooldown = 0;
        this.specialAttackTimer = Math.random() * 5 + 3; // First special attack in 3-8 seconds
    }
    takeDamage(amount) {
        this.currentHealth -= amount;
        
        // Enhanced hurt flash that works with different material types
        if (this.mesh && this.mesh.material) {
            const material = this.mesh.material;
            
            // Store original color/uniform state
            let originalColor = null;
            let originalFlash = null;
            
            if (material.uniforms && material.uniforms.u_flash) {
                // Shader material with flash uniform
                originalFlash = material.uniforms.u_flash.value;
                material.uniforms.u_flash.value = 0.7;
            } else if (material.color) {
                // Basic material - modify color directly
                originalColor = material.color.clone();
                material.color.lerp(new THREE.Color(0xffffff), 0.6); // Flash to white
            }
            
            // Restore original state after flash duration
            setTimeout(() => {
                if (this.mesh && this.mesh.material) {
                    if (originalFlash !== null && material.uniforms && material.uniforms.u_flash) {
                        material.uniforms.u_flash.value = originalFlash;
                    } else if (originalColor && material.color) {
                        material.color.copy(originalColor);
                    }
                }
            }, 120);
        }
        
        // console.log(`Monster took ${amount} damage, HP left: ${this.currentHealth}`);
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
            if (!obstacle || !obstacle.userData || typeof obstacle.userData.size !== 'number') continue;
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
        this.circleTimer += deltaTime;
        this.specialAttackCooldown -= deltaTime;
        this.specialAttackTimer -= deltaTime;
        
        let projectile = null;
        const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
        
        // Enhanced AI logic
        if (distanceToPlayer < this.aggroRange) {
            this.lastPlayerPosition = playerPosition.clone();
            this.huntingMode = true;
            
            // Different behavior based on monster type and distance
            if (distanceToPlayer < this.attackRange) {
                // In attack range - try different strategies
                if (this.type === 'redSkull' || this.type === 'magicWisp' || this.type === 'iceElemental') {
                    // Ranged monsters: maintain distance and attack
                    if (distanceToPlayer < this.attackRange * 0.7) {
                        // Too close, back away while attacking
                        this.moveDirection = this.mesh.position.clone().sub(playerPosition).normalize();
                        this.speed = this.speed;
                    } else {
                        // Good distance, circle around player
                        const perpendicular = new THREE.Vector3(-playerPosition.clone().sub(this.mesh.position).z, 0, playerPosition.clone().sub(this.mesh.position).x).normalize();
                        this.moveDirection = perpendicular.multiplyScalar(this.circleDirection);
                        this.speed = this.speed * 0.8;
                    }
                    projectile = this.attack(playerPosition);
                } else {
                    // Melee monsters: aggressive charge
                    this.moveDirection = playerPosition.clone().sub(this.mesh.position).normalize();
                    this.speed = (this.baseSpeed || this.speed); // Back to normal speed
                    if (Math.random() < 0.3) projectile = this.attack(playerPosition); // Sometimes attack while moving
                }
            } else if (distanceToPlayer < this.detectionRange) {
                // In detection range but not attack range - smart approach
                if (this.type === 'frostWolf' || this.type === 'redSkull') {
                    // Fast monsters: zigzag approach
                    const baseDirection = playerPosition.clone().sub(this.mesh.position).normalize();
                    const zigzag = Math.sin(this.circleTimer * 4) * 0.5;
                    const perpendicular = new THREE.Vector3(-baseDirection.z, 0, baseDirection.x);
                    this.moveDirection = baseDirection.clone().add(perpendicular.multiplyScalar(zigzag)).normalize();
                    this.speed = (this.baseSpeed || this.speed);
                } else {
                    // Normal approach with some randomness
                    const baseDirection = playerPosition.clone().sub(this.mesh.position).normalize();
                    const randomOffset = new THREE.Vector3((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3);
                    this.moveDirection = baseDirection.add(randomOffset).normalize();
                    this.speed = (this.baseSpeed || this.speed);
                }
            } else {
                // Distant but in aggro range - hunt towards last known position
                if (this.lastPlayerPosition) {
                    this.moveDirection = this.lastPlayerPosition.clone().sub(this.mesh.position).normalize();
                    this.speed = (this.baseSpeed || this.speed);
                }
            }
            
            this.isChasing = true;
            
            // Special attacks
            if (this.specialAttackTimer <= 0 && this.specialAttackCooldown <= 0) {
                projectile = this.performSpecialAttack(playerPosition);
                this.specialAttackTimer = Math.random() * 8 + 5; // Next special in 5-13 seconds
                this.specialAttackCooldown = 2.0; // Cooldown after special
            }
        } else {
            // Out of range - return to wandering but remember last position for a while
            if (this.huntingMode && this.lastPlayerPosition) {
                // Hunt towards last known position for a few seconds
                this.moveDirection = this.lastPlayerPosition.clone().sub(this.mesh.position).normalize();
                this.speed = (this.baseSpeed || this.speed);
                // Stop hunting after some time
                if (Math.random() < 0.05) { // 5% chance per frame to give up
                    this.huntingMode = false;
                    this.lastPlayerPosition = null;
                }
            } else {
                // Normal wandering
                this.huntingMode = false;
                if (this.isChasing || this.changeDirectionTimer <= 0) {
                    this.moveDirection.set((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2).normalize();
                    this.changeDirectionTimer = Math.random() * 3 + 1;
                    this.isChasing = false;
                    this.speed = this.speed; // Reset to base speed
                }
            }
        }
        
        // Store base speed if not already stored
        if (!this.baseSpeed) {
            this.baseSpeed = this.speed;
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

    performSpecialAttack(playerPosition) {
        const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
        
        switch (this.type) {
            case 'cyclops':
                // Cyclops: Rock throw with knockback
                if (distanceToPlayer < this.attackRange * 1.5) {
                    console.log('Cyclops throws a massive rock!');
                    const direction = playerPosition.clone().sub(this.mesh.position).normalize();
                    const startPosition = this.mesh.position.clone().add(direction.clone().multiplyScalar(this.size * 0.6));
                    const projectile = new MonsterProjectile(startPosition, direction);
                    projectile.damage = 3; // High damage
                    projectile.size = 0.8; // Larger projectile
                    projectile.speed = 6; // Slower but powerful
                    return projectile;
                }
                break;
                
            case 'volcanicGolem':
                // Volcanic Golem: Lava burst (multiple projectiles)
                if (distanceToPlayer < this.attackRange) {
                    console.log('Volcanic Golem erupts with lava!');
                    // Return first projectile, create additional ones
                    const projectiles = [];
                    for (let i = 0; i < 5; i++) {
                        const angle = (i - 2) * 0.3; // Spread projectiles
                        const direction = playerPosition.clone().sub(this.mesh.position).normalize();
                        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                        const startPosition = this.mesh.position.clone().add(direction.clone().multiplyScalar(this.size * 0.6));
                        projectiles.push(new MonsterProjectile(startPosition, direction));
                    }
                    return projectiles[0]; // Return first one, others handled by game logic
                }
                break;
                
            case 'frostWolf':
                // Frost Wolf: Ice shard barrage
                if (distanceToPlayer < this.attackRange * 1.2) {
                    console.log('Frost Wolf howls and launches ice shards!');
                    const direction = playerPosition.clone().sub(this.mesh.position).normalize();
                    const startPosition = this.mesh.position.clone().add(direction.clone().multiplyScalar(this.size * 0.6));
                    const projectile = new MonsterProjectile(startPosition, direction);
                    projectile.speed = 10; // Very fast
                    projectile.lifetime = 2.0; // Long range
                    return projectile;
                }
                break;
                
            case 'magicTreent':
                // Magic Treant: Root entangle (slowing effect)
                if (distanceToPlayer < this.attackRange) {
                    console.log('Magic Treant summons entangling roots!');
                    const direction = playerPosition.clone().sub(this.mesh.position).normalize();
                    const startPosition = this.mesh.position.clone().add(direction.clone().multiplyScalar(this.size * 0.6));
                    const projectile = new MonsterProjectile(startPosition, direction);
                    projectile.speed = 4; // Slower but persistent
                    projectile.lifetime = 3.0; // Very long lasting
                    return projectile;
                }
                break;
                
            case 'iceElemental':
                // Ice Elemental: Freeze blast
                if (distanceToPlayer < this.attackRange * 1.3) {
                    console.log('Ice Elemental unleashes a freezing blast!');
                    const direction = playerPosition.clone().sub(this.mesh.position).normalize();
                    const startPosition = this.mesh.position.clone().add(direction.clone().multiplyScalar(this.size * 0.6));
                    const projectile = new MonsterProjectile(startPosition, direction);
                    projectile.size = 0.6; // Larger area
                    projectile.speed = 8;
                    return projectile;
                }
                break;
                
            case 'desertScorpion':
                // Desert Scorpion: Poison sting
                if (distanceToPlayer < this.attackRange * 0.8) {
                    console.log('Desert Scorpion strikes with venomous tail!');
                    const direction = playerPosition.clone().sub(this.mesh.position).normalize();
                    const startPosition = this.mesh.position.clone().add(direction.clone().multiplyScalar(this.size * 0.6));
                    const projectile = new MonsterProjectile(startPosition, direction);
                    projectile.speed = 12; // Very fast strike
                    projectile.damage = 2;
                    return projectile;
                }
                break;
                
            default:
                // Default special attack for other monsters
                return this.attack(playerPosition);
        }
        
        return null;
    }
}

// Static method to get biome-appropriate monster types
Monster.getBiomeMonsters = function(biomeName) {
    const biomeMonsterTypes = {
        'GREEN_HILLS': ['greenOgre', 'redSkull'], // Classic enemies
        'DESERT': ['desertScorpion', 'redSkull', 'cyclops'], // Desert creatures
        'MAGIC_FOREST': ['magicWisp', 'magicTreent', 'greenOgre'], // Magical creatures
        'BARREN_LAND': ['redSkull', 'cyclops', 'greenOgre'], // Undead and tough enemies
        'MOUNTAINS': ['frostWolf', 'iceElemental', 'cyclops'], // Cold climate creatures
        'LAKE': ['greenOgre', 'magicWisp', 'iceElemental'], // Water-adjacent creatures
        'VOLCANO': ['volcanicGolem', 'redSkull', 'cyclops'], // Fire and lava creatures
    };
    
    return biomeMonsterTypes[biomeName] || ['greenOgre', 'redSkull']; // Fallback
};

// Static method to get a random monster type for a biome
Monster.getRandomBiomeMonster = function(biomeName) {
    const types = Monster.getBiomeMonsters(biomeName);
    return types[Math.floor(Math.random() * types.length)];
};