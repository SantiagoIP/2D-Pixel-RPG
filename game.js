import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { setupScene } from './sceneSetup.js';
import { Player } from './player.js';
import { InputHandler } from './inputHandler.js';
import { World, biomes } from './world.js';
import { Monster } from './monster.js';
import { UIManager } from './UIManager.js';
import { AudioManager } from './AudioManager.js';
import { ParticleSystem } from './particleSystem.js';
import { BUFFS } from './buffs.js';
const RENDER_SCALE = 0.75; // Render at lower res for performance/style
const PLAYER_INVULNERABILITY_DURATION = 1.0; // Seconds of invulnerability after taking damage
export class Game {
    constructor(renderDiv) {
        this.renderDiv = renderDiv;
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, // Keep pixel art sharp
            alpha: true,
            preserveDrawingBuffer: false
        });
        
        // Enable shadow mapping
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        
        // Enhanced renderer settings for better visual quality
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        this.clock = new THREE.Clock();
        this.monsters = [];
        this.projectiles = []; // Keep track of player attacks
        this.monsterProjectiles = []; // Keep track of monster attacks
        this.isGameOver = false; // Game state flag
        this.isStarted = false; // Has the game started from the intro screen?
        this.isPaused = false; // Pause state for level-up screen
        this.score = 0; // Initialize score
        this.currentWave = 0;
        this.baseMonsterCount = 3; // Monsters in the first wave
        this.currentBiomeName = 'GREEN_HILLS'; // Default start, will be overridden by selection
        
        // Define the progression of biomes and what wave they appear on.
        // Updated to include all 7 biomes with proper monster progression
        this.biomeProgression = [
            { wave: 1, name: 'GREEN_HILLS', monsters: ['greenOgre'] },
            { wave: 3, name: 'DESERT', monsters: ['greenOgre', 'cyclops'] },
            { wave: 5, name: 'BARREN_LAND', monsters: ['cyclops', 'redSkull'] },
            { wave: 7, name: 'MAGIC_FOREST', monsters: ['redSkull', 'magicWisp'] },
            { wave: 9, name: 'MOUNTAINS', monsters: ['cyclops', 'redSkull', 'magicWisp'] },
            { wave: 11, name: 'LAKE', monsters: ['greenOgre', 'magicWisp'] },
            { wave: 13, name: 'VOLCANO', monsters: ['redSkull', 'magicWisp', 'cyclops'] }
        ];
        
        // Biome difficulty mapping for starting biome selection
        this.biomeDifficulty = {
            'GREEN_HILLS': { baseWave: 1, monsters: ['greenOgre'] },
            'DESERT': { baseWave: 3, monsters: ['greenOgre', 'cyclops'] },
            'MAGIC_FOREST': { baseWave: 7, monsters: ['redSkull', 'magicWisp'] },
            'BARREN_LAND': { baseWave: 5, monsters: ['cyclops', 'redSkull'] },
            'MOUNTAINS': { baseWave: 9, monsters: ['cyclops', 'redSkull', 'magicWisp'] },
            'LAKE': { baseWave: 11, monsters: ['greenOgre', 'magicWisp'] },
            'VOLCANO': { baseWave: 13, monsters: ['redSkull', 'magicWisp', 'cyclops'] }
        };
        this.playerLocation = 'overworld'; // 'overworld' or 'castle'
        this.teleportCooldown = 0.5; // Cooldown to prevent rapid teleporting
        this.teleportTimer = 0;
        this.hasRestedOnThrone = false; // Flag for throne interaction
        this.selectedBiome = null;
        const { scene, camera } = setupScene();
        this.scene = scene;
        this.camera = camera;
        this.setupRenderer();
        this.inputHandler = new InputHandler();
        this.uiManager = new UIManager(this.renderDiv); // Initialize UI Manager
        this.audioManager = new AudioManager(); // Initialize Audio Manager
        this.particleSystem = new ParticleSystem(this.scene); // Initialize Particle System
        this.uiManager.updateScore(this.score); // Initialize score display
        // World setup
        this.world = new World(this.currentBiomeName);
        this.scene.add(this.world.container);
        
        this.player = new Player(this.scene, this.inputHandler, this.particleSystem);
        // Store bound animate function
        this.boundAnimate = this.animate.bind(this);
        this.uiManager.showBiomeSelectionMenu((biomeId) => {
            console.log("Biome selected:", biomeId);
            this.selectedBiome = biomeId;
            this.startGame();
        });
        this.animate(); // Start render loop, but game logic is paused
        this.lastWeapon = this.player?.currentWeapon;
        // Keyboard shortcuts for demo
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (!this.isPaused) {
                    this.isPaused = true;
                    this.uiManager.showPauseMenu(
                        () => { this.isPaused = false; },
                        () => {},
                        () => {},
                        () => { window.location.reload(); }
                    );
                }
            } else if (e.code === 'KeyB') {
                this.uiManager.showBestiary();
            }
        });
    }

    setupRenderer() {
        const width = this.renderDiv.clientWidth;
        const height = this.renderDiv.clientHeight;
        
        // Check if the renderDiv has proper dimensions
        if (width === 0 || height === 0) {
            // Set a default size
            this.renderDiv.style.width = '800px';
            this.renderDiv.style.height = '600px';
        }
        
        const finalWidth = Math.max(width, 800);
        const finalHeight = Math.max(height, 600);
        
        this.renderer.setSize(finalWidth * RENDER_SCALE, finalHeight * RENDER_SCALE, false);
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.setPixelRatio(1);
        this.renderDiv.appendChild(this.renderer.domElement);
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    onWindowResize() {
        const width = this.renderDiv.clientWidth;
        const height = this.renderDiv.clientHeight;

        // Update camera aspect ratio
        const aspect = width / height;
        const frustumSize = 25; // Match sceneSetup
        this.camera.left = frustumSize * aspect / -2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = frustumSize / -2;
        this.camera.updateProjectionMatrix();

        // Update renderer size
        this.renderer.setSize(width * RENDER_SCALE, height * RENDER_SCALE, false);
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.setPixelRatio(1);
    }

    spawnMonsters(count, monsterTypes) {
        if (!monsterTypes || monsterTypes.length === 0) {
            console.warn("spawnMonsters called with no monster types.");
            return;
        }
        for (let i = 0; i < count; i++) {
            // Randomly choose from the *allowed* monster types for the current biome
            const type = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
            const monster = new Monster(this.scene, type); // Pass type to constructor
            // Attempt to spawn away from the center and obstacles
            let positionFound = false;
            let attempts = 0;
            while (!positionFound && attempts < 20) {
                const x = (Math.random() - 0.5) * this.world.worldSize * 0.9;
                const z = (Math.random() - 0.5) * this.world.worldSize * 0.9;
                const potentialPos = new THREE.Vector3(x, 0.5, z); // Place slightly above ground
                 // Simple check: not too close to origin or existing monsters
                let tooClose = potentialPos.length() < 5;
                if (!tooClose) {
                    for(const otherMonster of this.monsters) {
                         if (potentialPos.distanceTo(otherMonster.mesh.position) < 2) {
                            tooClose = true;
                            break;
                         }
                    }
                }
                 // Add obstacle check here if needed

                if (!tooClose) {
                    monster.mesh.position.copy(potentialPos);
                    positionFound = true;
                }
                attempts++;
            }
             // If failed after attempts, spawn at random anyway
            if (!positionFound) {
                 const x = (Math.random() - 0.5) * this.world.worldSize * 0.9;
                 const z = (Math.random() - 0.5) * this.world.worldSize * 0.9;
                 monster.mesh.position.set(x, 0.5, z);
            }

            this.monsters.push(monster);
        }
    }
    startNextWave() {
        this.currentWave++;
        this.uiManager.updateWave(this.currentWave);
        
        // Determine the correct biome and available monsters for the current wave
        let currentProgression = this.biomeProgression
            .filter(p => this.currentWave >= p.wave)
            .pop(); // Get the latest unlocked progression
        
        // If no progression found (starting game), use current biome
        if (!currentProgression) {
            currentProgression = this.biomeDifficulty[this.currentBiomeName] || this.biomeDifficulty['GREEN_HILLS'];
        }
        
        const newBiomeName = currentProgression.name || this.currentBiomeName;
        
        // --- Change Biome if necessary ---
        if (newBiomeName !== this.currentBiomeName) {
            this.currentBiomeName = newBiomeName;
            this.world.dispose(); // Dispose old meshes, textures, etc.
            this.world = new World(this.currentBiomeName);
            this.scene.add(this.world.container);
            // Reset player position to avoid getting stuck in new obstacles
            this.player.mesh.position.set(0, 0.5, 0);
        }
        this.uiManager.updateBiome(this.currentBiomeName.replace(/_/g, ' '));
        // --- End Biome Change ---
        
        const monsterCount = this.baseMonsterCount + (this.currentWave - 1) * 2; // e.g., 3, 5, 7...
        // Spawn monsters allowed for this biome
        this.spawnMonsters(monsterCount, currentProgression.monsters);
    }
    handleLevelUp() {
        this.isPaused = true;
        this.audioManager.playSound('levelUp'); // Play a victory sound
        // Define some upgrade options
        const upgradeOptions = [
            {
                id: 'health',
                title: 'Vitality',
                description: 'Increase Max Health by 2 points.'
            }, 
            {
                id: 'speed',
                title: 'Agility',
                description: 'Increase movement speed.'
            },
            {
                id: 'attackSpeed',
                title: 'Frenzy',
                description: 'Increase attack speed by 10%.'
            },
            {
                id: 'attackDamage',
                title: 'Power',
                description: 'Increase attack damage and range.'
            },
            {
                id: 'attackSize',
                title: 'Impact',
                description: 'Increase attack area of effect.'
            },
            {
                id: 'projectileLifetime',
                title: 'Endurance',
                description: 'Increase projectile lifetime for greater range.'
            }
        ];
        // Shuffle and pick 3 unique options
        const options = upgradeOptions.sort(() => 0.5 - Math.random()).slice(0, 3);
        this.uiManager.showLevelUpUI(options, (upgradeId) => {
            this.player.applyUpgrade(upgradeId);
            this.uiManager.hideLevelUpUI();
            this.isPaused = false;
        });
        this.uiManager.showLevelUpOverlay();
        setTimeout(() => this.uiManager.hideCenterOverlay(), 1200);
        // Screen shake
        this.shakeScreen();
    }
    startGame() {
        console.log("startGame called");
        // Set the current biome to the selected one and adjust starting wave
        if (this.selectedBiome && this.biomeDifficulty[this.selectedBiome]) {
            this.currentBiomeName = this.selectedBiome;
            // Start at the appropriate wave for the selected biome difficulty
            this.currentWave = this.biomeDifficulty[this.selectedBiome].baseWave - 1; // -1 because startNextWave() increments it
        } else {
            // Default to GREEN_HILLS if no valid selection
            this.currentBiomeName = 'GREEN_HILLS';
            this.currentWave = 0;
        }
        
        // Recreate world with the selected biome
        this.world.dispose();
        this.world = new World(this.currentBiomeName);
        this.scene.add(this.world.container);
        
        // Ensure UI is shown properly - remove overlays completely
        this.uiManager.removeAllOverlays();
        
        // Ensure the game canvas is visible and properly positioned
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.style.display = 'block';
            this.renderer.domElement.style.visibility = 'visible';
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
            this.renderer.domElement.style.zIndex = '1'; // Put it in front but behind UI overlays
            this.renderer.domElement.style.background = 'transparent';
            console.log("Canvas made visible with position settings");
            
            // Force the render target container to be transparent
            this.renderDiv.style.background = 'transparent';
            this.renderDiv.style.position = 'relative';
            this.renderDiv.style.zIndex = '0';
        }
        
        this.isStarted = true;
        this.startNextWave(); // This will set currentWave to the correct starting wave
        this.audioManager.playMusic();
        console.log("Starting Pixel Scrolls...");
    }
    update(deltaTime) {
        if (!this.isStarted || this.isGameOver || this.isPaused) return;
        // Cooldown timer for teleporting
        if (this.teleportTimer > 0) {
            this.teleportTimer -= deltaTime;
        }
        
        // Update animation time for sprite effects
        const animationTime = performance.now() / 1000;
        
        this.particleSystem.update(deltaTime);
        const currentObstacles = this.playerLocation === 'overworld' ? this.world.obstacles : this.world.interiorObstacles;
        const currentBounds = this.playerLocation === 'overworld' ? this.world.worldSize : this.world.interiorSize;
        const boundsCenter = this.playerLocation === 'overworld' ? new THREE.Vector3(0,0,0) : this.world.castleRoomCenter.clone().setY(0);
        this.player.update(deltaTime, currentObstacles, currentBounds, boundsCenter);
        this.world.update(deltaTime); // Update world elements like torch flickers
        
        // Update sprite animations
        this.updateSpriteAnimations(animationTime);
        
        // Player attack logic
        if (this.inputHandler.keys['Space']) {
            this.inputHandler.keys['Space'] = false; // Consume the input
            const attackHit = this.player.attack();
            if (attackHit) {
                this.projectiles.push(attackHit);
                this.scene.add(attackHit.mesh);
                this.audioManager.playSound('playerAttack'); // Play attack sound
            }
        }

        // Weapon switching
        if (this.inputHandler.keys['Digit1']) {
            this.inputHandler.keys['Digit1'] = false;
            this.player.switchWeapon('sword');
        } else if (this.inputHandler.keys['Digit2']) {
            this.inputHandler.keys['Digit2'] = false;
            this.player.switchWeapon('bow');
        } else if (this.inputHandler.keys['Digit3']) {
            this.inputHandler.keys['Digit3'] = false;
            this.player.switchWeapon('staff');
        }

        // Update projectiles (attack visuals)
        const remainingProjectiles = [];
        for (const proj of this.projectiles) {
            proj.update(deltaTime);
            if (proj.isAlive()) {
                remainingProjectiles.push(proj);
            } else {
                this.scene.remove(proj.mesh);
                proj.dispose();
            }
        }
        this.projectiles = remainingProjectiles;
        // Update monster projectiles
        const remainingMonsterProjectiles = [];
        for (const proj of this.monsterProjectiles) {
            proj.update(deltaTime);
            if (proj.isAlive()) {
                remainingMonsterProjectiles.push(proj);
            } else {
                this.scene.remove(proj.mesh);
                proj.dispose();
            }
        }
        this.monsterProjectiles = remainingMonsterProjectiles;
        // Update monsters and check for attack hits
        const aliveMonsters = [];
        for (const monster of this.monsters) {
            const attackProjectile = monster.update(deltaTime, this.player.mesh.position, this.world.obstacles, this.world.worldSize);
            if (attackProjectile) {
                this.monsterProjectiles.push(attackProjectile);
                this.scene.add(attackProjectile.mesh);
                // Maybe a specific sound for monster attack?
            }
            let hit = false;
            // Check collision with active projectiles - use squared distance for performance
            for (const proj of this.projectiles) {
                const distanceSquared = proj.mesh.position.distanceToSquared(monster.mesh.position);
                const collisionThreshold = Math.pow((monster.size + proj.size) / 2, 2);
                if (distanceSquared < collisionThreshold) {
                     // Hit detected!
                    monster.takeDamage(proj.damage); // Use projectile's damage instead of player's base damage
                    hit = true;
                    proj.expire(); // Remove projectile after hit
                    this.audioManager.playSound('monsterHit'); // Play monster hit sound
                    
                    // Enhanced hit effects based on attack type
                    if (proj.isCritical) {
                        this.particleSystem.createEffect('monsterDefeat', monster.mesh.position); // Bigger effect for crits
                    } else {
                        this.particleSystem.createEffect('monsterHit', monster.mesh.position);
                    }
                    
                    if (!monster.isAlive()) {
                        this.score += 10; // Add to score
                        const leveledUp = this.player.addExperience(10); // Grant XP to player
                        if (leveledUp) {
                            this.handleLevelUp();
                        }
                        this.uiManager.updateScore(this.score); // Update UI
                        // Emit defeat particles
                        this.particleSystem.createEffect('monsterDefeat', monster.mesh.position);
                        // Defeat animation before removal
                        monster.defeatAnimation(() => {
                            this.scene.remove(monster.mesh);
                            monster.dispose();
                        });
                        continue;
                    } else {
                         // Optional: Add visual feedback for monster hit (flash color?)
                    }
                    break; // Monster can only be hit once per frame by one projectile
                }
            }
            // Only push monsters that weren't hit OR were hit but survived
            if (!hit || monster.isAlive()) {
                 aliveMonsters.push(monster);
            }
        }
        this.monsters = aliveMonsters;
        // Update monsters only if in the overworld
        if (this.playerLocation === 'overworld') {
            this.updateMonsters(deltaTime, aliveMonsters);
        } else {
             this.monsters = []; // Remove all monsters when not in overworld
         }
         this.checkTeleport();
         this.checkThroneInteraction();
        this.checkShrineInteraction();
         // Update UI
         this.uiManager.updatePlayerHealth(this.player.currentHealth, this.player.maxHealth);
        this.uiManager.updateExperience(this.player.level, this.player.experience, this.player.xpToNextLevel);
       this.uiManager.updatePlayerStats({
           maxHealth: this.player.maxHealth,
           speed: this.player.speed,
           attackCooldown: this.player.attackCooldown
       });
       // Update UI with active buffs
       this.uiManager.updateBuffs(this.player.activeBuffs);
       // Update weapon display
       this.uiManager.updateWeapon(this.player.currentWeapon, this.player.combatStance);
        const monsterPositions = this.monsters.map(m => m.mesh.position);
        this.uiManager.updateMinimap(this.player.mesh.position, this.world.worldSize, this.world.castlePosition, monsterPositions);
       // Make camera follow player smoothly
        const targetPosition = this.player.mesh.position.clone();
        targetPosition.y = this.camera.position.y; // Maintain camera height
        this.camera.position.lerp(targetPosition, 0.05); // Smooth interpolation
        // Day/night cycle overlay
        const dayTime = (performance.now() / 1000) % 20;
        // 0-10 = day, 10-20 = night
        let tint = '#000000', opacity = 0;
        if (dayTime < 10) {
            // Day to dusk
            opacity = 0.15 * (dayTime / 10);
        } else {
            // Night to dawn
            opacity = 0.15 + 0.35 * ((dayTime - 10) / 10);
        }
        this.uiManager.setDayNightTint(tint, opacity);
        // Show weapon switch overlay if weapon changed
        if (this.player.currentWeapon !== this.lastWeapon) {
            this.uiManager.showWeaponSwitch(this.player.currentWeapon);
            this.lastWeapon = this.player.currentWeapon;
        }
    }
    checkThroneInteraction() {
        // Only matters if we are in the castle and haven't rested yet
        if (this.playerLocation !== 'castle' || this.hasRestedOnThrone) {
            this.uiManager.hideInteractionPrompt();
            return;
        }
        const throne = this.world.throne;
        if (!throne) return;
        const distanceSquared = this.player.mesh.position.distanceToSquared(throne.position);
        const interactionDistanceSquared = 6.25; // 2.5^2
        if (distanceSquared < interactionDistanceSquared) {
            this.uiManager.showInteractionPrompt("Press 'E' to rest");
            // Check for interaction key press
            if (this.inputHandler.keys['KeyE']) {
                this.inputHandler.keys['KeyE'] = false; // Consume input
                this.hasRestedOnThrone = true;
                // Heal player to full
                this.player.currentHealth = this.player.maxHealth;
                // Grant bonus XP
                const leveledUp = this.player.addExperience(50);
                if (leveledUp) {
                    this.handleLevelUp();
                }
                this.audioManager.playSound('levelUp'); // Play a rewarding sound
                this.uiManager.hideInteractionPrompt();
            }
        } else {
            this.uiManager.hideInteractionPrompt();
        }
    }
    updateMonsters(deltaTime, aliveMonsters) {
        // Check if all monsters are defeated to start the next wave
        if (this.monsters.length === 0 && !this.isGameOver) {
            this.startNextWave();
        }
        // Check if player touches monster and apply damage if not invulnerable
        for (const monster of this.monsters) {
            const distanceSquared = this.player.mesh.position.distanceToSquared(monster.mesh.position);
            const collisionThreshold = Math.pow((this.player.size + monster.size) / 2, 2);
            if (distanceSquared < collisionThreshold) {
                if (!this.player.isInvulnerable) {
                    this.player.takeDamage(1); // Player takes 1 damage from collision
                    this.audioManager.playSound('playerHit'); // Play player hit sound
                    // Optional: Player knockback
                    const pushDirection = this.player.mesh.position.clone().sub(monster.mesh.position).normalize();
                    this.player.mesh.position.add(pushDirection.multiplyScalar(0.2)); // Stronger push
                    // Check for game over
                    if (!this.player.isAlive()) {
                        this.gameOver();
                        break; // Stop checking collisions if game over
                    }
                    break; // Player takes damage from only one monster per frame check
                }
            }
        }
        // Check collision with monster projectiles
        for (const proj of this.monsterProjectiles) {
            const distanceSquared = this.player.mesh.position.distanceToSquared(proj.mesh.position);
            const collisionThreshold = Math.pow((this.player.size + proj.size) / 2, 2);
            if (distanceSquared < collisionThreshold) {
                 if (!this.player.isInvulnerable) {
                    this.player.takeDamage(1);
                    this.audioManager.playSound('playerHit');
                    proj.expire(); // Remove projectile after hit
                    // Optional: knockback from projectile hit
                    const pushDirection = this.player.mesh.position.clone().sub(proj.mesh.position).normalize();
                    this.player.mesh.position.add(pushDirection.multiplyScalar(0.1));
                    if (!this.player.isAlive()) {
                        this.gameOver();
                    }
                    break; // Player can only be hit by one projectile per frame
                }
            }
        }
     }
    checkShrineInteraction() {
        if (this.playerLocation !== 'overworld' || !this.world.shrines) {
            return;
        }
        let canInteract = false;
        const interactionDistanceSquared = 4.0; // 2.0^2
        for (const shrine of this.world.shrines) {
            // Skip shrines that have been used
            if (shrine.userData.used) continue;
            const distanceSquared = this.player.mesh.position.distanceToSquared(shrine.position);
            if (distanceSquared < interactionDistanceSquared) {
                canInteract = true;
                this.uiManager.showInteractionPrompt("Press 'E' for a pact");
                if (this.inputHandler.keys['KeyE']) {
                    this.inputHandler.keys['KeyE'] = false; // Consume input
                    // --- Apply a random buff ---
                    const availableBuffs = Object.values(BUFFS);
                    const chosenBuff = availableBuffs[Math.floor(Math.random() * availableBuffs.length)];
                    this.player.addBuff(chosenBuff);
                    shrine.userData.used = true; // Mark as used
                    // Make the shrine visually inactive by updating the color uniform
                    if (shrine.material.uniforms.u_color) {
                        shrine.material.uniforms.u_color.value.set(0x555555);
                    }
                    this.audioManager.playSound('levelUp'); // Use a rewarding sound for now
                    this.particleSystem.createEffect('shrineActivate', shrine.position);
                    // Ensure game is not paused or frozen after shrine interaction
                    this.isPaused = false;
                }
                break; // Only interact with one shrine at a time
            }
        }
        if (!canInteract) {
            this.uiManager.hideInteractionPrompt();
        }
    }
     checkTeleport() {
         if (this.teleportTimer > 0) return;
        if (this.playerLocation === 'overworld') {
            // Check for entry
            const door = this.world.castleDoor;
            if (door) {
                const distanceSquared = this.player.mesh.position.distanceToSquared(door.position);
                if (distanceSquared < 4) { // 2^2
                    this.enterCastle();
                }
            }
        } else { // playerLocation is 'castle'
            // Check for exit
            const exitPoint = this.world.castleExitPoint;
            if (exitPoint) {
                const distanceSquared = this.player.mesh.position.distanceToSquared(exitPoint);
                if (distanceSquared < 4) { // 2^2
                    this.exitCastle();
                }
            }
        }
    }
    enterCastle() {
        console.log("Entering castle...");
        this.playerLocation = 'castle';
        this.teleportTimer = this.teleportCooldown;
        // Move player to castle interior entrance
        if (this.world.castleInteriorEntryPoint) {
            this.player.mesh.position.copy(this.world.castleInteriorEntryPoint);
        }
        
        this.world.overworldContainer.visible = false;
        this.world.interiorContainer.visible = true;
        
        // Stop all monsters
        this.monsters.forEach(m => this.scene.remove(m.mesh));
        this.world.monstersClearedOnEnter = this.monsters.length === 0;
        this.monsters.forEach(m => this.scene.remove(m.mesh));
        this.monsters = [];
        this.projectiles = []; // Also clear any lingering projectiles
        this.hasRestedOnThrone = false; // Reset throne state on entering
    }
    exitCastle() {
        console.log("Exiting castle...");
        this.playerLocation = 'overworld';
        this.teleportTimer = this.teleportCooldown;
        // Move player to just outside the castle door
        if (this.world.castleExitPoint) {
            const exitPos = this.world.castleDoor.position.clone();
            exitPos.z += 2; // Place player slightly south of the door
            this.player.mesh.position.copy(exitPos);
        }
        this.world.overworldContainer.visible = true;
        this.world.interiorContainer.visible = false;
        // Restart the wave
        // Restart the wave
        // If there were no monsters when we left, it means we should start a new wave.
        // Otherwise, the old wave is still "active" and should continue.
        if (this.world.monstersClearedOnEnter) {
            this.startNextWave();
            this.world.monstersClearedOnEnter = false; // Reset flag
        }
    }
    gameOver() {
        this.isGameOver = true;
        this.uiManager.showGameOver();
        console.log("GAME OVER");
        // Maybe stop player movement, etc.
    }
    dispose() {
        // Clean up resources if the game is ever destroyed
        // ... (other disposals for scene, renderer, etc. could go here)
        this.particleSystem.dispose();
        this.monsterProjectiles.forEach(p => {
            this.scene.remove(p.mesh);
            p.dispose();
        });
        this.audioManager.dispose();
        this.inputHandler.dispose();
        this.uiManager.dispose();
        this.world.dispose();
    }
    animate() {
        requestAnimationFrame(this.boundAnimate);
        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }
    start() {
        // This is now effectively replaced by showIntroScreen and startGame
        // We keep it here in case we want to bypass the intro for debugging
        this.startGame();
        this.animate();
    }
    updateSpriteAnimations(animationTime) {
        // Update player sprite animation
        if (this.player.mesh.updateAnimation) {
            this.player.mesh.updateAnimation(animationTime);
        }
        
        // Update monster sprite animations
        for (const monster of this.monsters) {
            if (monster.mesh.updateAnimation) {
                monster.mesh.updateAnimation(animationTime);
            }
        }
        
        // Update projectile animations
        for (const proj of this.projectiles) {
            if (proj.mesh.updateAnimation) {
                proj.mesh.updateAnimation(animationTime);
            }
        }
        
        // Update monster projectile animations
        for (const proj of this.monsterProjectiles) {
            if (proj.mesh.updateAnimation) {
                proj.mesh.updateAnimation(animationTime);
            }
        }
        
        // Update world decoration animations
        if (this.world.decorations) {
            for (const decoration of this.world.decorations) {
                if (decoration.updateAnimation) {
                    decoration.updateAnimation(animationTime);
                }
            }
        }
    }
    shakeScreen(intensity = 8, duration = 350) {
        const div = this.renderDiv;
        let elapsed = 0;
        const start = Date.now();
        const shake = () => {
            elapsed = Date.now() - start;
            if (elapsed < duration) {
                const dx = (Math.random() - 0.5) * intensity;
                const dy = (Math.random() - 0.5) * intensity;
                div.style.transform = `translate(${dx}px,${dy}px)`;
                requestAnimationFrame(shake);
            } else {
                div.style.transform = '';
            }
        };
        shake();
    }
}