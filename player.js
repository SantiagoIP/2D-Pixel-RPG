import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { createPixelSprite, createAttackSprite } from './spriteUtils.js';

class AttackProjectile {
    constructor(position, direction, scene, size = 0.5, lifetime = 0.2, attackType = 'melee') {
        this.size = size;
        this.attackType = attackType;
        
        // Create the projectile mesh
        this.mesh = createAttackSprite(this.size);
        
        // Set color based on attack type - handle different material types
        if (this.mesh.material.uniforms && this.mesh.material.uniforms.u_color) {
            // ShaderMaterial with uniforms
            if (attackType === 'magic') {
                this.mesh.material.uniforms.u_color.value.setHex(0x00ffff); // Cyan for magic
            } else if (attackType === 'ranged') {
                this.mesh.material.uniforms.u_color.value.setHex(0xffaa00); // Orange for ranged
            } else {
                this.mesh.material.uniforms.u_color.value.setHex(0xffffff); // White for melee
            }
        } else if (this.mesh.material.color) {
            // MeshBasicMaterial with color property
            if (attackType === 'magic') {
                this.mesh.material.color.setHex(0x00ffff); // Cyan for magic
            } else if (attackType === 'ranged') {
                this.mesh.material.color.setHex(0xffaa00); // Orange for ranged
            } else {
                this.mesh.material.color.setHex(0xffffff); // White for melee
            }
        }
        
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.5; // Keep slightly above ground
        this.direction = direction.normalize();
        this.speed = attackType === 'magic' ? 20 : attackType === 'ranged' ? 25 : 15;
        this.lifetime = lifetime;
        this.aliveTime = 0;
        this.damage = attackType === 'magic' ? 3 : attackType === 'ranged' ? 2 : 1;
    }

    update(deltaTime) {
        this.mesh.position.add(this.direction.clone().multiplyScalar(this.speed * deltaTime));
        this.aliveTime += deltaTime;
        
        // Add some visual effects
        if (this.attackType === 'magic') {
            this.mesh.rotation.z += deltaTime * 10; // Spin magic projectiles
        }
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

export class Player {
    constructor(scene, inputHandler, particleSystem) {
        this.scene = scene;
        this.inputHandler = inputHandler;
        this.particleSystem = particleSystem;
        this.size = 1;
        this.mesh = createPixelSprite('player', this.size);
        this.mesh.position.set(0, this.size / 2, 0);
        this.scene.add(this.mesh);
        // Add flat ellipse shadow
        const shadowGeometry = new THREE.PlaneGeometry(this.size * 0.7, this.size * 0.3);
        const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
        this.shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.shadowMesh.rotation.x = -Math.PI / 2;
        this.shadowMesh.position.set(0, 0.01, 0); // Slightly above ground
        this.mesh.add(this.shadowMesh);

        // Movement and basic stats
        this.baseSpeed = 5;
        this.speed = this.baseSpeed;
        this.velocity = new THREE.Vector3();
        this.moveDirection = new THREE.Vector3();
        this.maxHealth = 5;
        this.currentHealth = this.maxHealth;
        
        // Enhanced combat stats
        this.baseAttackCooldown = 0.3; // Faster base cooldown for more dramatic differences
        this.attackCooldown = this.baseAttackCooldown;
        this.weaponCooldownMultiplier = 1.0; // Track weapon-specific cooldown multiplier
        this.lastAttackTime = -this.attackCooldown;
        this.baseAttackDamage = 1;
        this.attackDamage = this.baseAttackDamage;
        this.baseAttackSize = 0.5;
        this.attackSize = this.baseAttackSize;
        this.baseAttackLifetime = 0.2;
        this.attackLifetime = this.baseAttackLifetime;
        
        // New combat mechanics
        this.currentWeapon = 'sword'; // sword, bow, staff
        this.weaponLevel = 1;
        this.criticalChance = 0.1; // 10% base crit chance
        this.criticalMultiplier = 2.0;
        this.blockChance = 0.05; // 5% base block chance
        this.dodgeChance = 0.05; // 5% base dodge chance
        this.isBlocking = false;
        this.isDodging = false;
        this.combatStance = 'normal'; // normal, aggressive, defensive
        
        // Combat animations
        this.attackAnimationTime = 0;
        this.attackAnimationDuration = 0.2;
        this.isAttacking = false;
        this.originalScale = this.mesh.scale.clone();
        
        // RPG progression
        this.level = 1;
        this.experience = 0;
        this.xpToNextLevel = 20;
        this.activeBuffs = {};
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 1.0;
        this.invulnerabilityTimer = 0;
        
        // Combat feedback
        this.lastHitTime = 0;
        this.hitFlashDuration = 0.1;
    }

    isAlive() {
        return this.currentHealth > 0;
    }

    addExperience(amount) {
        this.experience += amount;
        console.log(`Player gained ${amount} XP. Total: ${this.experience}/${this.xpToNextLevel}`);
        if (this.experience >= this.xpToNextLevel) {
            this.levelUp();
            return true; // Leveled up
        }
        return false; // Did not level up
    }

    levelUp() {
        this.level++;
        this.experience -= this.xpToNextLevel; // Carry over any extra XP
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5); // Increase XP needed for next level
        this.currentHealth = this.maxHealth; // Fully heal the player
        console.log(`LEVEL UP! Player is now level ${this.level}. HP restored. Next level at ${this.xpToNextLevel} XP.`);
        if (this.particleSystem) {
            this.particleSystem.createEffect('levelUp', this.mesh.position);
        }
    }

    applyUpgrade(upgradeId) {
        switch (upgradeId) {
            case 'health':
                this.maxHealth += 2;
                this.currentHealth += 2; // Add current health too
                console.log(`Player upgraded max health to ${this.maxHealth}`);
                break;
            case 'speed':
                this.baseSpeed += 0.5;
                console.log(`Player upgraded base speed to ${this.baseSpeed}`);
                break;
            case 'attackSpeed':
                this.baseAttackCooldown = Math.max(0.1, this.baseAttackCooldown * 0.9); // 10% faster, capped
                console.log(`Player upgraded attack cooldown to ${this.baseAttackCooldown}`);
                break;
            case 'attackDamage':
                this.baseAttackDamage += 1;
                console.log(`Player upgraded attack damage to ${this.baseAttackDamage}`);
                break;
            case 'attackSize':
                this.baseAttackSize += 0.1;
                console.log(`Player upgraded attack size to ${this.baseAttackSize}`);
                break;
            case 'projectileLifetime':
                this.baseAttackLifetime += 0.075; // Increase by a bit more for a noticeable effect
                console.log(`Player upgraded attack range (lifetime: ${this.baseAttackLifetime.toFixed(2)}s)`);
                break;
        }
    }

    addBuff(buff) {
        console.log(`Player received buff: ${buff.name}`);
        // Create a copy so we can modify it (e.g., timeLeft)
        const buffInstance = { ...buff, timeLeft: buff.duration };
        // If the buff already exists, this will refresh its duration
        this.activeBuffs[buff.id] = buffInstance;
        // Special case for shield: it's just a state, no permanent stat change
        if (buff.id === 'damage_shield') {
            // Nothing to apply immediately, its presence is checked in takeDamage
            return;
        }
        // For other buffs, we can apply them right away if needed
        // but the current implementation recalculates stats every frame in updateBuffs
    }

    takeDamage(amount) {
        if (this.isInvulnerable) return;
        
        // Check for dodge
        if (Math.random() < this.dodgeChance) {
            console.log('Dodged the attack!');
            this.particleSystem.createEffect('monsterHit', this.mesh.position);
            return;
        }
        
        // Check for block
        if (this.isBlocking && Math.random() < this.blockChance) {
            amount = Math.floor(amount * 0.5); // Block reduces damage by 50%
            console.log('Blocked the attack!');
        }
        
        // Check for damage shield buff
        if (this.activeBuffs['damage_shield']) {
            console.log("Damage absorbed by Aegis shield!");
            delete this.activeBuffs['damage_shield'];
            this.isInvulnerable = true;
            this.invulnerabilityTimer = this.invulnerabilityDuration;
            return;
        }
        
        this.currentHealth -= amount;
        this.isInvulnerable = true;
        this.invulnerabilityTimer = this.invulnerabilityDuration;
        this.lastHitTime = performance.now() / 1000;
        
        console.log(`Player took ${amount} damage, HP left: ${this.currentHealth}`);
        
        // Visual feedback
        if (this.particleSystem) {
            this.particleSystem.createEffect('playerHit', this.mesh.position);
        }
        
        if (this.currentHealth <= 0) {
            console.log("Player has died.");
        }
    }

    attack() {
        const now = performance.now() / 1000;
        if (now - this.lastAttackTime < this.attackCooldown || this.isAttacking) {
            return null; // Attack on cooldown or already attacking
        }
        
        this.lastAttackTime = now;
        this.isAttacking = true;
        this.attackAnimationTime = 0;
        
        // Determine attack type based on weapon
        let attackType = 'melee';
        let damage = this.attackDamage;
        let size = this.attackSize;
        let lifetime = this.attackLifetime;
        
        switch (this.currentWeapon) {
            case 'bow':
                attackType = 'ranged';
                damage = this.attackDamage * 1.5;
                size = this.attackSize * 0.8;
                lifetime = this.attackLifetime * 2;
                break;
            case 'staff':
                attackType = 'magic';
                damage = this.attackDamage * 2;
                size = this.attackSize * 1.2;
                lifetime = this.attackLifetime * 1.5;
                break;
            default: // sword
                attackType = 'melee';
                damage = this.attackDamage;
                size = this.attackSize;
                lifetime = this.attackLifetime;
                break;
        }
        
        // Critical hit calculation
        const isCritical = Math.random() < this.criticalChance;
        if (isCritical) {
            damage *= this.criticalMultiplier;
            console.log('Critical hit!');
        }
        
        // Create projectile
        const attackDirection = this.moveDirection.lengthSq() > 0 ? this.moveDirection.clone() : new THREE.Vector3(0, 0, -1);
        const startPosition = this.mesh.position.clone().add(attackDirection.clone().multiplyScalar(this.size * 0.6));
        const projectile = new AttackProjectile(startPosition, attackDirection, this.scene, size, lifetime, attackType);
        projectile.damage = damage;
        projectile.isCritical = isCritical;
        
        return projectile;
    }

    // New method to switch weapons
    switchWeapon(weaponType) {
        if (['sword', 'bow', 'staff'].includes(weaponType)) {
            this.currentWeapon = weaponType;
            console.log(`Switched to ${weaponType}`);
            
            // Adjust stats based on weapon - make differences much more noticeable
            switch (weaponType) {
                case 'bow':
                    this.weaponCooldownMultiplier = 2.5; // Much slower but stronger
                    this.speed = this.baseSpeed * 0.9; // Slightly slower with bow
                    break;
                case 'staff':
                    this.weaponCooldownMultiplier = 4; // Very slow but powerful
                    this.speed = this.baseSpeed * 0.8; // Slower with staff
                    break;
                default: // sword
                    this.weaponCooldownMultiplier = 1.0; // Normal speed
                    this.speed = this.baseSpeed;
                    break;
            }
        }
    }

    handleMovement(deltaTime) {
        this.velocity.set(0, 0, 0);
        this.moveDirection.set(0,0,0);

        // Vertical movement
        if (this.inputHandler.keys['KeyW'] || this.inputHandler.keys['ArrowUp']) {
            this.velocity.z = -1;
            this.moveDirection.z = -1;
        } else if (this.inputHandler.keys['KeyS'] || this.inputHandler.keys['ArrowDown']) {
            this.velocity.z = 1;
            this.moveDirection.z = 1;
        }
        // Horizontal movement
        if (this.inputHandler.keys['KeyA'] || this.inputHandler.keys['ArrowLeft']) {
            this.velocity.x = -1;
            this.moveDirection.x = -1;
        } else if (this.inputHandler.keys['KeyD'] || this.inputHandler.keys['ArrowRight']) {
            this.velocity.x = 1;
            this.moveDirection.x = 1;
        }

        // Normalize velocity vector if moving diagonally
        if (this.velocity.lengthSq() > 1) {
            this.velocity.normalize();
        }
         if (this.moveDirection.lengthSq() > 0) {
            this.moveDirection.normalize();
         }


        this.velocity.multiplyScalar(this.speed * deltaTime);
        return this.velocity;
    }

     checkCollision(potentialPosition, obstacles, worldSize, worldCenter) {
        const halfSize = this.size / 2;
        const halfWorld = worldSize / 2;
        // World bounds check, relative to the center of the current world space
        if (potentialPosition.x < worldCenter.x - halfWorld + halfSize || potentialPosition.x > worldCenter.x + halfWorld - halfSize ||
            potentialPosition.z < worldCenter.z - halfWorld + halfSize || potentialPosition.z > worldCenter.z + halfWorld - halfSize) {
            return true; // Collision with world edge
        }
        // Obstacle collision check (simple AABB)
        for (const obstacle of obstacles) {
            const obstaclePos = obstacle.position;
            const obstacleSize = obstacle.userData.size || 1; // Assuming size is stored or default
            const halfObstacleSize = obstacleSize / 2;

            if (Math.abs(potentialPosition.x - obstaclePos.x) < (halfSize + halfObstacleSize) &&
                Math.abs(potentialPosition.z - obstaclePos.z) < (halfSize + halfObstacleSize)) {
                // If the obstacle is marked as a decoration, allow some overlap
                if (obstacle.userData.isDecoration) {
                    if (Math.abs(potentialPosition.x - obstaclePos.x) < halfObstacleSize * 0.7 && Math.abs(potentialPosition.z - obstaclePos.z) < halfObstacleSize * 0.7) {
                        return true;
                    }
                } else {
                    return true; // Solid collision with obstacle
                }
            }
        }

        return false; // No collision
    }


    updateBuffs(deltaTime) {
        // Reset temporary stats to base values before recalculating
        this.speed = this.baseSpeed;
        this.attackDamage = this.baseAttackDamage;
        this.attackSize = this.baseAttackSize;
        this.attackLifetime = this.baseAttackLifetime;
        
        // Calculate attack cooldown with weapon multiplier
        this.attackCooldown = this.baseAttackCooldown * this.weaponCooldownMultiplier;
        
        for (const buffId in this.activeBuffs) {
            const buff = this.activeBuffs[buffId];
            if (isFinite(buff.duration)) {
                buff.timeLeft -= deltaTime;
                if (buff.timeLeft <= 0) {
                    console.log(`Buff ${buff.name} expired.`);
                    delete this.activeBuffs[buffId];
                    continue; // Skip to next buff
                }
            }
            // Apply buff effect
            switch (buff.id) {
                case 'speed':
                    this.speed *= buff.potency;
                    break;
                case 'attack_speed':
                    this.attackCooldown *= buff.potency;
                    break;
            }
        }
    }

    update(deltaTime, obstacles, worldSize, worldCenter = new THREE.Vector3(0,0,0)) {
        this.updateBuffs(deltaTime); // Update buffs and their effects
        this.updateCombatAnimations(deltaTime); // Update combat animations
        
        // Handle invulnerability and flashing
        if (this.isInvulnerable) {
            this.invulnerabilityTimer -= deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
                this.mesh.material.uniforms.u_flash.value = 0; // Ensure flash is off
            }
        }
        
        // Handle blocking (hold Shift to block)
        this.isBlocking = this.inputHandler.keys['ShiftLeft'] || this.inputHandler.keys['ShiftRight'];
        
        // Handle combat stance (hold Ctrl for defensive stance)
        if (this.inputHandler.keys['ControlLeft'] || this.inputHandler.keys['ControlRight']) {
            this.combatStance = 'defensive';
            this.speed *= 0.7; // Slower in defensive stance
            this.blockChance = 0.15; // Higher block chance
        } else {
            this.combatStance = 'normal';
            this.blockChance = 0.05; // Normal block chance
        }
        
        const moveDelta = this.handleMovement(deltaTime);
        const potentialPosition = this.mesh.position.clone().add(moveDelta);
        
        // Check collision before applying movement
        if (!this.checkCollision(potentialPosition, obstacles, worldSize, worldCenter)) {
            this.mesh.position.add(moveDelta);
        } else {
            // Try sliding along the wall
            const potentialX = this.mesh.position.clone().add(new THREE.Vector3(moveDelta.x, 0, 0));
            if (!this.checkCollision(potentialX, obstacles, worldSize, worldCenter)) {
                this.mesh.position.add(new THREE.Vector3(moveDelta.x, 0, 0));
            } else {
                const potentialZ = this.mesh.position.clone().add(new THREE.Vector3(0, 0, moveDelta.z));
                if (!this.checkCollision(potentialZ, obstacles, worldSize, worldCenter)) {
                    this.mesh.position.add(new THREE.Vector3(0, 0, moveDelta.z));
                }
            }
        }

        // Ensure player stays exactly at ground level (plus half size)
        this.mesh.position.y = this.size / 2;

        // Ensure shadow follows player
        if (this.shadowMesh) {
            this.shadowMesh.position.x = 0;
            this.shadowMesh.position.z = 0;
            this.shadowMesh.position.y = -this.size / 2 + 0.01;
        }
    }

    // Update combat animations
    updateCombatAnimations(deltaTime) {
        if (this.isAttacking) {
            this.attackAnimationTime += deltaTime;
            
            // Attack animation - scale up briefly
            const progress = this.attackAnimationTime / this.attackAnimationDuration;
            if (progress < 1) {
                const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
                this.mesh.scale.setScalar(scale);
            } else {
                this.mesh.scale.copy(this.originalScale);
                this.isAttacking = false;
            }
        }
        
        // Hit flash effect
        if (this.isInvulnerable) {
            const timeSinceHit = (performance.now() / 1000) - this.lastHitTime;
            if (timeSinceHit < this.hitFlashDuration) {
                // Flash red when hit
                this.mesh.material.uniforms.u_flash.value = 0.5;
            } else {
                this.mesh.material.uniforms.u_flash.value = 0;
            }
        }
    }
}
