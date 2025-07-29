// Player class for RPG game

import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { createPixelSprite, createAttackSprite } from './spriteUtils.js';

class AttackProjectile {
    constructor(position, direction, scene, size = 0.5, lifetime = 0.2, attackType = 'melee') {
        this.size = size;
        this.attackType = attackType;
        
        // Create the projectile mesh
        this.mesh = createAttackSprite(this.size);
        
        // Enhanced color handling for different material types
        this.setProjectileColor(attackType);
        
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.5; // Keep slightly above ground
        this.direction = direction.normalize();
        this.speed = attackType === 'magic' ? 20 : attackType === 'ranged' ? 25 : 15;
        this.lifetime = lifetime;
        this.aliveTime = 0;
        this.damage = attackType === 'magic' ? 3 : attackType === 'ranged' ? 2 : 1;
    }
    
    setProjectileColor(attackType) {
        if (!this.mesh || !this.mesh.material) return;
        
        const material = this.mesh.material;
        let targetColor;
        
        switch (attackType) {
            case 'magic':
                targetColor = 0x00ffff; // Cyan for magic
                break;
            case 'ranged':
                targetColor = 0xffaa00; // Orange for ranged
                break;
            default:
                targetColor = 0xffffff; // White for melee
                break;
        }
        
        // Handle different material types
        if (material.uniforms && material.uniforms.u_color) {
            // ShaderMaterial with uniforms
            material.uniforms.u_color.value.setHex(targetColor);
        } else if (material.color) {
            // MeshBasicMaterial with color property
            material.color.setHex(targetColor);
        }
    }

    update(deltaTime) {
        if (!this.mesh || !this.mesh.position) return;
        
        this.mesh.position.add(this.direction.clone().multiplyScalar(this.speed * deltaTime));
        this.aliveTime += deltaTime;
        
        // Add visual effects based on attack type
        if (this.attackType === 'magic') {
            this.mesh.rotation.z += deltaTime * 10; // Spin magic projectiles
        } else if (this.attackType === 'ranged') {
            // Slight wobble for arrows
            this.mesh.rotation.z = Math.sin(this.aliveTime * 20) * 0.1;
        }
    }

    isAlive() {
        return this.aliveTime < this.lifetime;
    }

    expire() {
         this.aliveTime = this.lifetime; // Mark for removal
    }

    dispose() {
        if (this.mesh && this.mesh.dispose) {
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

        // Movement and basic stats with enhanced responsiveness
        this.baseSpeed = 5;
        this.speed = this.baseSpeed;
        this.velocity = new THREE.Vector3();
        this.moveDirection = new THREE.Vector3();
        this.maxHealth = 5;
        this.currentHealth = this.maxHealth;
        
        // Enhanced movement smoothing
        this.moveSmoothing = 0.15;
        this.lastMoveDirection = new THREE.Vector3();
        this.isMoving = false;
        this.movementTimer = 0;
        
        // Mana system for magic attacks with improved regeneration
        this.maxMana = 100;
        this.mana = this.maxMana;
        this.manaRegenRate = 8; // Increased regeneration rate
        this.lastManaRegenTime = Date.now();
        
        // Enhanced combat stats with better feedback
        this.baseAttackCooldown = 0.25; // Slightly faster for better responsiveness
        this.attackCooldown = this.baseAttackCooldown;
        this.weaponCooldownMultiplier = 1.0;
        this.lastAttackTime = -this.attackCooldown;
        this.baseAttackDamage = 1;
        this.attackDamage = this.baseAttackDamage;
        this.baseAttackSize = 0.5;
        this.attackSize = this.baseAttackSize;
        this.baseAttackLifetime = 0.2;
        this.attackLifetime = this.baseAttackLifetime;
        
        // Equipment bonuses (initialized to 0)
        this.equipmentAttackBonus = 0;
        this.equipmentDefenseBonus = 0;
        this.equipmentSpeedBonus = 0;
        this.equipmentHealthBonus = 0;
        
        // Enhanced combat mechanics
        this.currentWeapon = 'sword'; // sword, bow, staff
        this.weaponLevel = 1;
        this.criticalChance = 0.1; // 10% base crit chance
        this.criticalMultiplier = 2.0;
        this.blockChance = 0.05; // 5% base block chance
        this.dodgeChance = 0.05; // 5% base dodge chance
        this.isBlocking = false;
        this.isDodging = false;
        this.combatStance = 'normal'; // normal, aggressive, defensive
        
        // Enhanced combat animations with juice
        this.attackAnimationTime = 0;
        this.attackAnimationDuration = 0.2;
        this.isAttacking = false;
        this.originalScale = this.mesh.scale.clone();
        this.hitShakeIntensity = 0;
        this.hitShakeDuration = 0;
        
        // RPG progression with quality of life improvements
        this.level = 1;
        this.experience = 0;
        this.xpToNextLevel = 20;
        this.activeBuffs = {};
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 1.5; // Balanced for better gameplay flow
        this.invulnerabilityTimer = 0;
        
        // Auto-pickup system
        this.autoPickupEnabled = true;
        this.autoPickupRadius = 2.0; // Increased pickup radius
        this.lastPickupTime = 0;
        this.pickupCooldown = 0.1; // Prevent spam pickup
        
        // Enhanced spell costs with balance adjustments
        this.spellCosts = {
            magic: 15, // Reduced cost for better gameplay flow
            heal: 25,  // Reduced cost
            buff: 20   // Reduced cost
        };
        
        // Combat feedback with enhanced visual indicators
        this.lastHitTime = 0;
        this.hitFlashDuration = 0.15;
        this.interactionRadius = 2.0; // Increased for better usability
        this.damageNumbers = []; // For floating damage numbers
        
        // Status effect indicators
        this.statusEffects = {
            poisoned: { active: false, duration: 0, damage: 0 },
            burning: { active: false, duration: 0, damage: 0 },
            frozen: { active: false, duration: 0, speedReduction: 0 },
            blessed: { active: false, duration: 0, healRate: 0 }
        };
        
        // Enhanced audio feedback
        this.lastFootstepTime = 0;
        this.footstepInterval = 0.4; // Time between footsteps
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
        
        // Apply equipment defense bonus
        const totalDefense = this.equipmentDefenseBonus || 0;
        const originalAmount = amount;
        amount = Math.max(1, amount - totalDefense); // Minimum 1 damage
        
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
        
        if (totalDefense > 0) {
            console.log(`Player took ${amount} damage (${originalAmount} - ${totalDefense} defense), HP left: ${this.currentHealth}`);
        } else {
            console.log(`Player took ${amount} damage, HP left: ${this.currentHealth}`);
        }
        
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
        let baseDamage = this.attackDamage + (this.equipmentAttackBonus || 0); // Include equipment bonus
        let damage = baseDamage;
        let size = this.attackSize;
        let lifetime = this.attackLifetime;
        
        switch (this.currentWeapon) {
            case 'bow':
                attackType = 'ranged';
                damage = baseDamage * 1.5;
                size = this.attackSize * 0.8;
                lifetime = this.attackLifetime * 2;
                break;
            case 'staff':
                attackType = 'magic';
                // Check if player has enough mana for magic attack
                if (this.mana < this.spellCosts.magic) {
                    console.log('Not enough mana for magic attack!');
                    // Show mana notification if UIManager is available
                    if (window.game && window.game.uiManager) {
                        window.game.uiManager.showNotification('Not enough mana!', 'error');
                    }
                    return; // Cancel the attack
                }
                // Consume mana for magic attack
                this.mana -= this.spellCosts.magic;
                damage = baseDamage * 2;
                size = this.attackSize * 1.2;
                lifetime = this.attackLifetime * 1.5;
                break;
            default: // sword
                attackType = 'melee';
                damage = baseDamage;
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
        
        // Add visual impact particle effect at attack point
        const attackPos = this.mesh.position.clone().add(attackDirection.multiplyScalar(this.size * 0.7));
        if (typeof this.particleSystem.createEffect === 'function') {
            this.particleSystem.createEffect('attackHit', attackPos);
        }
        
        return projectile;
    }

    // New method to switch weapons
    switchWeapon(weaponType) {
        if (['sword', 'bow', 'staff'].includes(weaponType)) {
            this.currentWeapon = weaponType;
            console.log(`Switched to ${weaponType}`);
            
            // Calculate effective base speed including equipment
            const effectiveBaseSpeed = this.baseSpeed + (this.equipmentSpeedBonus || 0);
            
            // Adjust stats based on weapon - make differences much more noticeable
            switch (weaponType) {
                case 'bow':
                    this.weaponCooldownMultiplier = 2.5; // Much slower but stronger
                    this.speed = effectiveBaseSpeed * 0.9; // Slightly slower with bow
                    break;
                case 'staff':
                    this.weaponCooldownMultiplier = 4; // Very slow but powerful
                    this.speed = effectiveBaseSpeed * 0.8; // Slower with staff
                    break;
                default: // sword
                    this.weaponCooldownMultiplier = 1.0; // Normal speed
                    this.speed = effectiveBaseSpeed;
                    break;
            }
        }
    }

    handleMovement(deltaTime) {
        this.velocity.set(0, 0, 0);
        this.moveDirection.set(0,0,0);

        // Check if input handler is available
        if (!this.inputHandler) {
            console.error("❌ InputHandler is not available!");
            return this.velocity;
        }

        const keys = this.inputHandler.keys;

        // Vertical movement (Arrow Keys Only for AZERTY compatibility)
        if (keys['ArrowUp']) {
            this.velocity.z = -1;
            this.moveDirection.z = -1;
        } else if (keys['ArrowDown']) {
            this.velocity.z = 1;
            this.moveDirection.z = 1;
        }
        
        // Horizontal movement (Arrow Keys Only for AZERTY compatibility)
        if (keys['ArrowLeft']) {
            this.velocity.x = -1;
            this.moveDirection.x = -1;
        } else if (keys['ArrowRight']) {
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
        
        // Return the velocity for use in update function
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
            if (!obstacle || !obstacle.userData || typeof obstacle.userData.size !== 'number') continue;
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
        // Reset stats to base values + equipment bonuses before reapplying buffs
        this.speed = this.baseSpeed + (this.equipmentSpeedBonus || 0);
        this.attackDamage = this.baseAttackDamage;
        this.attackCooldown = this.baseAttackCooldown * this.weaponCooldownMultiplier;

        for (const buffId in this.activeBuffs) {
            const buff = this.activeBuffs[buffId];
            buff.timeLeft -= deltaTime;

            if (buff.timeLeft <= 0) {
                console.log(`Buff ${buff.name} expired.`);
                delete this.activeBuffs[buffId];
            } else {
                // Apply buff effects
                if (buff.effects.speed) this.speed *= buff.effects.speed;
                if (buff.effects.attackDamage) this.attackDamage *= buff.effects.attackDamage;
                if (buff.effects.attackSpeed) this.attackCooldown *= (1 / buff.effects.attackSpeed);
            }
        }
    }

    update(deltaTime, obstacles, worldSize, worldCenter = new THREE.Vector3(0,0,0), world, questManager, inventorySystem) {
        if (!this.isAlive()) return;

        // Calculate movement and apply to position
        const velocity = this.handleMovement(deltaTime);
        
        // Apply movement with collision detection
        if (velocity.lengthSq() > 0) {
            const potentialPosition = this.mesh.position.clone().add(velocity);
            
            // Check for collisions before moving
            if (!this.checkCollision(potentialPosition, obstacles, worldSize, worldCenter)) {
                const oldPosition = this.mesh.position.clone();
                this.mesh.position.add(velocity);
            }
        }
        
        this.updateBuffs(deltaTime);
        this.updateCombatAnimations(deltaTime);

        // Mana regeneration
        if (this.mana < this.maxMana) {
            this.mana = Math.min(this.maxMana, this.mana + (this.manaRegenRate * deltaTime));
        }
        
        if (this.isInvulnerable) {
            this.invulnerabilityTimer -= deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
            }
        }
        
        if (world && questManager && inventorySystem) {
            this.checkForCollectibles(world, questManager, inventorySystem);
        }
    }

    checkForCollectibles(world, questManager, inventorySystem) {
        if (!world.collectibles || world.collectibles.length === 0) return;

        const playerPosition = this.mesh.position;
        const collectiblesToRemove = [];

        for (let i = 0; i < world.collectibles.length; i++) {
            const collectible = world.collectibles[i];
            const distance = playerPosition.distanceTo(collectible.position);

            if (distance < this.interactionRadius) {
                if (collectible.userData.type === 'herb') {
                    console.log('Collected a healing herb!');
                    questManager.updateQuestObjective('gather_herbs', 'collect_herbs', 1);
                    if(inventorySystem) {
                        inventorySystem.addItem({ name: 'Healing Herb', quantity: 1, type: 'herb' });
                    }
                    this.particleSystem.createEffect('pickup', collectible.position);
                    collectiblesToRemove.push(i);
                    world.overworldContainer.remove(collectible);
                }
            }
        }

        // Remove collected items from the main array (in reverse to avoid index issues)
        for (let i = collectiblesToRemove.length - 1; i >= 0; i--) {
            world.collectibles.splice(collectiblesToRemove[i], 1);
        }
    }

    updateCombatAnimations(deltaTime) {
        if (this.isAttacking) {
            this.attackAnimationTime += deltaTime;

            // Reduce animation intensity to prevent flickering in tight spaces
            const progress = this.attackAnimationTime / this.attackAnimationDuration;
            const scaleFactor = 1 + Math.sin(progress * Math.PI) * 0.15; // Reduced from 0.3 to 0.15
            this.mesh.scale.set(this.originalScale.x * (1/scaleFactor), this.originalScale.y * scaleFactor, this.originalScale.z);

            if (this.attackAnimationTime >= this.attackAnimationDuration) {
                this.isAttacking = false;
                this.attackAnimationTime = 0;
                this.mesh.scale.copy(this.originalScale);
            }
        } else {
            // Stable scaling - prevent constant lerping that can cause flickering
            if (!this.mesh.scale.equals(this.originalScale)) {
                this.mesh.scale.copy(this.originalScale);
            }
        }
    }
    
    getStats() {
        return {
            level: this.level,
            health: this.currentHealth,
            maxHealth: this.maxHealth,
            attack: this.attackDamage,
            defense: Math.floor(this.blockChance * 100), // Convert to percentage
            experience: this.experience,
            xpToNextLevel: this.xpToNextLevel,
            weapon: this.currentWeapon,
            weaponLevel: this.weaponLevel
        };
    }
}
