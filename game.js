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
import { NPCManager } from './npcManager.js';
import { DialogueSystem } from './dialogueSystem.js';
import { QuestManager } from './questManager.js';
import { InventorySystem } from './inventorySystem.js';
import { CraftingSystem } from './craftingSystem.js';
import { CharacterProgressionSystem } from './characterProgression.js';
import { PerformanceOptimizer } from './performanceOptimizer.js';

const RENDER_SCALE = 0.75; // Render at lower res for performance/style
const PLAYER_INVULNERABILITY_DURATION = 1.0; // Seconds of invulnerability after taking damage

export class Game {
    constructor(renderDiv) {
        this.renderDiv = renderDiv;
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, // Keep pixel art sharp
            alpha: false,  // Changed to false to ensure proper background rendering
            preserveDrawingBuffer: false
        });
        
        // Set clear color to ensure renderer is visible
        this.renderer.setClearColor(0x000000, 1);
        
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
        this.isPaused = false; // Pause state for menus
        this.score = 0; // Initialize score (now used for gold/currency)
        this.gameMode = 'exploration'; // 'exploration' or 'arena' (for optional combat areas)
        this.currentBiomeName = 'GREEN_HILLS'; // Default start biome
        this.explorationMode = true; // New flag to disable wave-based progression
        
        // Replace wave system with exploration regions
        this.currentRegion = 'GREEN_HILLS';
        this.discoveredRegions = new Set(['GREEN_HILLS']); // Track discovered areas
        this.regionConnections = {
            'GREEN_HILLS': ['DESERT', 'MAGIC_FOREST'],
            'DESERT': ['GREEN_HILLS', 'BARREN_LAND', 'VOLCANO'],
            'MAGIC_FOREST': ['GREEN_HILLS', 'LAKE', 'MOUNTAINS'],
            'BARREN_LAND': ['DESERT', 'MOUNTAINS'],
            'MOUNTAINS': ['MAGIC_FOREST', 'BARREN_LAND', 'LAKE'],
            'LAKE': ['MAGIC_FOREST', 'MOUNTAINS', 'VOLCANO'],
            'VOLCANO': ['DESERT', 'LAKE']
        };
        
        // Town and NPC system
        this.towns = new Map(); // Store town data for each region
        this.currentTown = null;
        this.inTown = false;
        
        this.playerLocation = 'overworld'; // 'overworld', 'castle', 'town', 'dungeon'
        this.teleportCooldown = 0.5; // Cooldown to prevent rapid teleporting
        this.teleportTimer = 0;
        this.hasRestedOnThrone = false; // Flag for throne interaction
        this.selectedBiome = null;

        // Base monster count for exploration encounters
        this.baseMonsterCount = 2; // Reduced for exploration mode
        
        // Game systems
        const { scene, camera } = setupScene();
        this.scene = scene;
        this.camera = camera;
        this.setupRenderer();
        this.inputHandler = new InputHandler();
        this.uiManager = new UIManager(this.renderDiv);
        this.audioManager = new AudioManager();
        this.particleSystem = new ParticleSystem(this.scene);
        
        // Initialize RPG systems
        this.npcManager = new NPCManager(this.scene, this.particleSystem);
        this.dialogueSystem = new DialogueSystem(this.uiManager);
        this.inventorySystem = new InventorySystem();
        this.questManager = new QuestManager();
        this.craftingSystem = new CraftingSystem();
        this.progressionSystem = new CharacterProgressionSystem();
        this.performanceOptimizer = new PerformanceOptimizer(this);
        
        // Add starting items and equipment for testing
        this.inventorySystem.addItem({ name: 'Healing Potion', quantity: 3, type: 'consumable' });
        this.inventorySystem.addItem({ name: 'Mana Potion', quantity: 2, type: 'consumable', manaRestore: 50 });
        this.inventorySystem.addItem({ name: 'Iron Ore', quantity: 5, type: 'material' });
        this.inventorySystem.addItem({ name: 'Wood', quantity: 8, type: 'material' });
        this.inventorySystem.addItem({ name: 'Leather', quantity: 3, type: 'material' });
        
        // Initialize with score as gold
        this.uiManager.updateGold(this.score);
        this.uiManager.playerGold = this.score; // Sync playerGold with score

        // Connect global game reference for shop system
        window.game = this;
        
        // World setup
        this.world = new World(this.currentBiomeName);
        this.scene.add(this.world.container);
        
        this.player = new Player(this.scene, this.inputHandler, this.particleSystem);
        this.player.particleSystem = this.particleSystem; // Ensure particle system is accessible
        // Move player spawn far north away from castle and obstacles
        this.player.mesh.position.set(0, this.player.size / 2, -25);
        
        // Store bound animate function
        this.boundAnimate = this.animate.bind(this);
        
        // Wait for tutorial to be dismissed before showing biome selection
        this.tutorialComplete = false;
        this.waitingForTutorial = true;
        
        // Listen for tutorial completion
        window.addEventListener('tutorialComplete', () => {
            this.tutorialComplete = true;
            this.waitingForTutorial = false;
            
            // Show biome selection for starting region
            this.uiManager.showBiomeSelectionMenu((biomeId) => {
                console.log("Starting region selected:", biomeId);
                this.selectedBiome = biomeId;
                this.startGame();
            });
        });
        
        this.animate(); // Start render loop, but game logic is paused
        this.lastWeapon = this.player?.currentWeapon;
        
        // Initialize enhanced systems
        this.initAutoSave();
        this.initPerformanceMonitoring();
        this.gameStartTime = Date.now();
        
        // Debug mode - bypass tutorial and biome selection
        if (window.location.search.includes('debug=true')) {
            console.log('🔧 Debug mode enabled - bypassing tutorial and biome selection');
            setTimeout(() => {
                this.tutorialComplete = true;
                this.waitingForTutorial = false;
                this.selectedBiome = 'GREEN_HILLS';
                this.startGame();
                console.log('🎮 Game started in debug mode');
            }, 100);
        }
        
        // Enhanced keyboard shortcuts with save/load
        window.addEventListener('keydown', (e) => {
            // Audio will initialize automatically on user interaction
            
            // Save game with Ctrl+S
            if (e.ctrlKey && e.code === 'KeyS') {
                e.preventDefault();
                this.saveGame();
                return;
            }
            
            // Load game with Ctrl+L
            if (e.ctrlKey && e.code === 'KeyL') {
                e.preventDefault();
                this.loadGame();
                return;
            }
            
            // Toggle fullscreen with F11 or F key
            if (e.code === 'F11') {
                if (this.renderer.domElement.requestFullscreen) {
                    this.renderer.domElement.requestFullscreen();
                } else if (this.renderer.domElement.mozRequestFullScreen) {
                    this.renderer.domElement.mozRequestFullScreen();
                } else if (this.renderer.domElement.webkitRequestFullscreen) {
                    this.renderer.domElement.webkitRequestFullscreen();
                }
            } else if (e.code === 'Escape' || e.code === 'KeyP') {
                if (!this.isPaused && !this.dialogueSystem.isActive) {
                    this.isPaused = true;
                    this.uiManager.showPauseMenu(
                        () => { this.isPaused = false; },
                        () => { this.uiManager.showBestiary(); },
                        () => { this.uiManager.showBiomeSelectionMenu((biomeId) => this.travelToRegion(biomeId)); },
                        () => { window.location.reload(); }
                    );
                }
            } else if (e.code === 'KeyB') {
                this.uiManager.showBestiary();
            } else if (e.code === 'KeyI') {
                e.preventDefault();

                if (this.inventorySystem && typeof this.inventorySystem.toggleInventory === 'function') {
                    this.inventorySystem.toggleInventory();
                } else {
                    console.error('❌ Inventory system not available');
                }
            } else if (e.code === 'KeyJ') {
                e.preventDefault();

                if (this.questManager && typeof this.questManager.toggleJournal === 'function') {
                    this.questManager.toggleJournal();
                } else {
                    console.error('❌ Quest manager not available');
                }
            } else if (e.code === 'KeyC') {
                e.preventDefault();

                if (this.craftingSystem && typeof this.craftingSystem.toggle === 'function') {
                    this.craftingSystem.toggle();
                } else {
                    console.error('❌ Crafting system not available');
                }
            } else if (e.code === 'KeyM') {
                e.preventDefault();

                if (this.uiManager && typeof this.uiManager.toggleMinimap === 'function') {
                    this.uiManager.toggleMinimap();
                } else {
                    console.error('❌ UI manager minimap not available');
                }
            } else if (e.code === 'KeyN') {
                // Music toggle
                console.log("🎵 N key pressed - toggling music");
                this.audioManager.toggleMusic();
            } else if (e.code === 'KeyS' && e.ctrlKey) {
                // Save game with Ctrl+S
                e.preventDefault();
                console.log("💾 Ctrl+S pressed - saving game");
                this.saveGame();
            } else if (e.code === 'KeyL' && e.ctrlKey) {
                // Load game with Ctrl+L
                e.preventDefault();
                console.log("📁 Ctrl+L pressed - loading game");
                this.loadGame();
            } else if (e.code === 'F5') {
                // Quick save with F5
                e.preventDefault();
                console.log("💾 F5 pressed - quick save");
                this.saveGame();
            } else if (e.code === 'F9') {
                // Quick load with F9
                e.preventDefault();
                console.log("📁 F9 pressed - quick load");
                this.loadGame();
            } else if (e.code === 'KeyE') {
                // Interaction key - talk to NPCs, enter buildings, etc.
                e.preventDefault(); // Prevent any default behavior
                this.handleInteraction();
            } else if (e.code === 'KeyH') {
                // Toggle help overlay
                e.preventDefault();
                console.log('❓ H key pressed - toggling help');
                const helpOverlay = document.getElementById('help-overlay');
                if (helpOverlay) {
                    const isVisible = helpOverlay.style.display !== 'none';
                    helpOverlay.style.display = isVisible ? 'none' : 'block';
                    console.log(`Help overlay ${isVisible ? 'hidden' : 'shown'}`);
                } else {
                    console.warn('❌ Help overlay not found');
                }
            }
        });
    }

    setupRenderer() {
        const width = this.renderDiv.clientWidth;
        const height = this.renderDiv.clientHeight;
        
        console.log('🎮 Setting up renderer:', { width, height, renderDiv: this.renderDiv });
        
        // Check if the renderDiv has proper dimensions
        if (width === 0 || height === 0) {
            // Set a default size
            this.renderDiv.style.width = '800px';
            this.renderDiv.style.height = '600px';
            console.log('⚠️ RenderDiv had zero dimensions, setting default size');
        }
        
        const finalWidth = Math.max(width, 800);
        const finalHeight = Math.max(height, 600);
        
        console.log('📐 Final dimensions:', { finalWidth, finalHeight, scale: RENDER_SCALE });
        
        this.renderer.setSize(finalWidth * RENDER_SCALE, finalHeight * RENDER_SCALE, false);
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.setPixelRatio(1);
        this.renderDiv.appendChild(this.renderer.domElement);
        
        console.log('✅ Canvas appended to renderDiv');
        console.log('🎯 Canvas element:', this.renderer.domElement);
        
        // Force the canvas to be visible
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '1';
        
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
            const monster = new Monster(this.scene, type, this.currentBiomeName); // Pass type and biome
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
    spawnRandomEncounter() {
        // Only spawn encounters occasionally during exploration
        if (Math.random() < 0.08) { // 8% chance per frame for more encounters
            const monsterTypes = this.getBiomeMonsters(this.currentBiomeName);
            // Difficulty-based monster count: harder biomes get more monsters
            const biomeBase = this.getBiomeDifficulty(this.currentBiomeName);
            const monsterCount = Math.max(1, biomeBase + Math.floor(Math.random() * (biomeBase + 1)));
            console.log(`🎯 Random encounter in ${this.currentBiomeName}:`, monsterTypes);
            this.spawnMonsters(monsterCount, monsterTypes);
        }
    }
    
    getBiomeMonsters(biomeName) {
        // Use the improved Monster class static method
        return Monster.getBiomeMonsters(biomeName);
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
        
        // IMPORTANT: Reset game state and player health
        this.isGameOver = false;
        this.isPaused = false;
        
        // Set the current biome to the selected one
        if (this.selectedBiome) {
            this.currentBiomeName = this.selectedBiome;
            this.currentRegion = this.selectedBiome;
        } else {
            // Default to GREEN_HILLS if no valid selection
            this.currentBiomeName = 'GREEN_HILLS';
            this.currentRegion = 'GREEN_HILLS';
        }
        
        // Recreate world with the selected biome
        this.world.dispose();
        this.world = new World(this.currentBiomeName);
        this.scene.add(this.world.container);
        
        // Load NPCs for the current region
        this.npcManager.loadNPCsForRegion(this.currentBiomeName);
        
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
        
        // CRITICAL: Reset player health and state
        if (this.player) {
            this.player.currentHealth = this.player.maxHealth; // Full health
            this.player.isInvulnerable = false; // Clear any invulnerability 
            this.player.mesh.position.set(0, this.player.size / 2, -25); // Safe starting position - far north
            console.log("✅ Player health reset to full:", this.player.currentHealth, "/", this.player.maxHealth);
        }
        
        // Clear any existing monsters near spawn
        this.monsters.forEach(m => {
            this.scene.remove(m.mesh);
            m.dispose();
        });
        this.monsters = [];
        this.projectiles = [];
        this.monsterProjectiles = [];
        console.log("✅ Cleared all monsters and projectiles");
        
        this.isStarted = true;
        
        // Update UI with current biome
        this.uiManager.updateBiome(this.currentBiomeName.replace(/_/g, ' '));
        
        // Audio will start automatically after user interaction
        console.log("🎵 Game started - audio will begin automatically on user interaction");
        console.log("🎮 Pixel Scrolls ready for exploration - Player health:", this.player.currentHealth, "/", this.player.maxHealth);
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
        
        // Fixed player update call with correct arguments
        this.player.update(
            deltaTime, 
            currentObstacles, 
            currentBounds, 
            boundsCenter,
            this.world,
            this.questManager,
            this.inventorySystem
        );
        this.world.update(deltaTime); // Update world elements like torch flickers
        
        // Update sprite animations
        this.updateSpriteAnimations(animationTime);
        
        // Update biome-specific visual effects
        this.updateBiomeEffects(deltaTime);
        
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
                        this.uiManager.playerGold = this.score; // Sync playerGold with score
        this.uiManager.updateScore(this.score); // Update UI
                        
                        // Handle quest objectives for monster kills
                        this.handleMonsterKillQuests(monster);
                        
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
         
         // Update NPCs separately (they should persist regardless of waves)
         this.npcManager.update(deltaTime, this.player.mesh.position);

         // Handle NPC interactions
         const nearbyNPC = this.npcManager.getNearbyNPC(this.player.mesh.position);
         if (nearbyNPC) {
             this.uiManager.showInteractionPrompt(`Press 'E' to talk to ${nearbyNPC.name}`);
         } else {
             this.uiManager.hideInteractionPrompt();
         }

         // Update quest system and UI
         this.updateQuestSystem();
        
        // Update quest progress for exploration
        this.updateQuestProgress();
         
         // Check shrine interaction
         this.checkShrineInteraction();
         
         // Check for resource gathering
         this.checkResourceGathering();
         
         this.checkTeleport();
         this.checkThroneInteraction();
         // Update UI
         this.uiManager.updatePlayerHealth(this.player.currentHealth, this.player.maxHealth);
        this.uiManager.updateMana(this.player.mana, this.player.maxMana);
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
        // Get NPC positions for minimap
        const npcPositions = this.npcManager.getActiveNPCs().map(npc => npc.position);
        this.uiManager.updateMinimap(this.player.mesh.position, this.world.worldSize, this.world.castlePosition, monsterPositions, npcPositions);
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
        // In exploration mode, occasionally spawn random encounters
        if (this.monsters.length === 0 && !this.isGameOver && this.explorationMode) {
            this.spawnRandomEncounter();
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
                    try {
                        // --- Show buff selection UI ---
                        const availableBuffs = Object.values(BUFFS);
                        if (availableBuffs.length > 0) {
                            this.isPaused = true; // Pause game during selection
                            this.uiManager.showBuffSelectionUI(availableBuffs, (selectedBuff) => {
                                this.player.addBuff(selectedBuff);
                                this.isPaused = false; // Resume game
                                this.audioManager.playSound('levelUp');
                                this.particleSystem.createEffect('shrineActivate', shrine.position);
                                console.log(`Shrine blessing received: ${selectedBuff.name}`);
                            });
                        }
                        shrine.userData.used = true; // Mark as used
                        // Make the shrine visually inactive by updating the color uniform (if shader uses it)
                        if (shrine.material && shrine.material.uniforms && shrine.material.uniforms.u_color) {
                            shrine.material.uniforms.u_color.value.set(0x555555);
                        }
                        console.log('Shrine activated successfully');
                    } catch (error) {
                        console.error('Error during shrine interaction:', error);
                        // Mark shrine as used even if error to prevent repeated issues
                        shrine.userData.used = true;
                        this.isPaused = false;
                    }
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
            // Check for castle entry - improved detection zone
            const door = this.world.castleDoor;
            if (door && this.currentBiomeName === 'GREEN_HILLS') {
                const distanceSquared = this.player.mesh.position.distanceToSquared(door.position);
                const triggerDistance = 9; // 3^2 - larger trigger zone
                
                if (distanceSquared < triggerDistance) {
                    // Auto-enter castle when close enough - no need to press E
                    this.uiManager.showInteractionPrompt("✨ Entering Castle...");
                    this.enterCastle();
                }
            }
        } else if (this.playerLocation === 'castle') {
            // Check for castle exit - reduced detection to prevent accidental exits
            const exitPoint = this.world.castleExitPoint;
            if (exitPoint) {
                const distanceSquared = this.player.mesh.position.distanceToSquared(exitPoint);
                const triggerDistance = 4; // 2^2 - smaller, more precise exit zone
                
                if (distanceSquared < triggerDistance) {
                    // Auto-exit castle when very close to exit door
                    this.uiManager.showInteractionPrompt("✨ Exiting Castle...");
                    this.exitCastle();
                }
            }
        }
    }
    enterCastle() {
        console.log("Entering castle...");
        this.playerLocation = 'castle';
        this.teleportTimer = this.teleportCooldown * 2; // Longer cooldown when entering castle
        
        // Move player to castle interior entrance
        if (this.world.castleInteriorEntryPoint) {
            this.player.mesh.position.copy(this.world.castleInteriorEntryPoint);
            this.player.mesh.position.y = this.player.size / 2; // Ensure proper Y position
            
            // IMPORTANT: Instantly move camera to prevent scene sliding effect
            const cameraTarget = this.player.mesh.position.clone();
            cameraTarget.y = this.camera.position.y;
            this.camera.position.copy(cameraTarget);
            
            // Force sprite position stability to prevent initial flickering
            if (this.player.mesh.scale) {
                this.player.mesh.scale.copy(this.player.originalScale);
            }
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
        
        // Show teleportation effect
        this.uiManager.showInteractionPrompt('✨ Entered Castle Interior ✨');
        setTimeout(() => {
            this.uiManager.hideInteractionPrompt();
        }, 1500);
    }
    exitCastle() {
        console.log("Exiting castle...");
        this.playerLocation = 'overworld';
        this.teleportTimer = this.teleportCooldown;
        
        // Move player to just outside the castle door
        if (this.world.castleDoor) {
            const exitPos = this.world.castleDoor.position.clone();
            exitPos.z += 3; // Place player further south of the door
            this.player.mesh.position.copy(exitPos);
            this.player.mesh.position.y = this.player.size / 2; // Ensure proper Y position
            
            // IMPORTANT: Instantly move camera to prevent scene sliding effect
            const cameraTarget = this.player.mesh.position.clone();
            cameraTarget.y = this.camera.position.y;
            this.camera.position.copy(cameraTarget);
            
            // Force sprite position stability to prevent flickering
            if (this.player.mesh.scale) {
                this.player.mesh.scale.copy(this.player.originalScale);
            }
        }
        
        this.world.overworldContainer.visible = true;
        this.world.interiorContainer.visible = false;
        
        // In exploration mode, reset encounter chance when exiting castle
        if (this.world.monstersClearedOnEnter) {
            // Reset exploration state - player might encounter monsters again
            this.world.monstersClearedOnEnter = false;
        }
        
        // Show teleportation effect
        this.uiManager.showInteractionPrompt('✨ Exited Castle ✨');
        setTimeout(() => {
            this.uiManager.hideInteractionPrompt();
        }, 1500);
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
        
        // Update performance monitoring
        this.performanceOptimizer.updateFrameRate(deltaTime);
        
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

    saveGame() {
        try {
            const gameState = {
                version: '1.1.0',
                timestamp: Date.now(),
                player: {
                    level: this.player.level,
                    experience: this.player.experience,
                    xpToNextLevel: this.player.xpToNextLevel,
                    health: this.player.currentHealth,
                    maxHealth: this.player.maxHealth,
                    mana: this.player.mana,
                    maxMana: this.player.maxMana,
                    position: {
                        x: this.player.mesh.position.x,
                        y: this.player.mesh.position.y,
                        z: this.player.mesh.position.z
                    },
                    currentWeapon: this.player.currentWeapon,
                    weaponLevel: this.player.weaponLevel
                },
                world: {
                    currentRegion: this.currentRegion,
                    discoveredRegions: Array.from(this.discoveredRegions),
                    hasRestedOnThrone: this.hasRestedOnThrone
                },
                inventory: this.inventorySystem.getAllItems(),
                quests: this.questManager.getAllQuests(),
                score: this.score,
                playtime: Date.now() - (this.gameStartTime || Date.now())
            };

            localStorage.setItem('pixelScrollsRPG_save', JSON.stringify(gameState));
            this.uiManager.showNotification('Game Saved Successfully!', 'success');
            console.log('Game saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            this.uiManager.showNotification('Failed to save game', 'error');
            return false;
        }
    }

    loadGame() {
        try {
            const saveData = localStorage.getItem('pixelScrollsRPG_save');
            if (!saveData) {
                console.log('No save data found');
                return false;
            }

            const gameState = JSON.parse(saveData);
            
            // Restore player state
            if (gameState.player) {
                this.player.level = gameState.player.level || 1;
                this.player.experience = gameState.player.experience || 0;
                this.player.xpToNextLevel = gameState.player.xpToNextLevel || 20;
                this.player.currentHealth = gameState.player.health || this.player.maxHealth;
                this.player.maxHealth = gameState.player.maxHealth || 5;
                this.player.mana = gameState.player.mana || this.player.maxMana;
                this.player.maxMana = gameState.player.maxMana || 100;
                this.player.currentWeapon = gameState.player.currentWeapon || 'sword';
                this.player.weaponLevel = gameState.player.weaponLevel || 1;
                
                if (gameState.player.position) {
                    this.player.mesh.position.set(
                        gameState.player.position.x || 0,
                        gameState.player.position.y || this.player.size / 2,
                        gameState.player.position.z || -25
                    );
                }
            }

            // Restore world state
            if (gameState.world) {
                this.currentRegion = gameState.world.currentRegion || 'GREEN_HILLS';
                this.discoveredRegions = new Set(gameState.world.discoveredRegions || ['GREEN_HILLS']);
                this.hasRestedOnThrone = gameState.world.hasRestedOnThrone || false;
            }

            // Restore inventory
            if (gameState.inventory) {
                this.inventorySystem.loadItems(gameState.inventory);
            }

            // Restore quests
            if (gameState.quests) {
                this.questManager.loadQuests(gameState.quests);
            }

            // Restore score
            this.score = gameState.score || 0;
            this.uiManager.updateGold(this.score);

            this.uiManager.showNotification('Game Loaded Successfully!', 'success');
            console.log('Game loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load game:', error);
            this.uiManager.showNotification('Failed to load game', 'error');
            return false;
        }
    }

    hasSaveFile() {
        return localStorage.getItem('pixelScrollsRPG_save') !== null;
    }

    deleteSave() {
        try {
            localStorage.removeItem('pixelScrollsRPG_save');
            if (this.uiManager) {
                this.uiManager.showNotification('Save deleted!', 'info');
            }
            console.log('Save file deleted');
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }
    travelToRegion(region) {
        // Implementation of travelToRegion method
        console.log("Traveling to region:", region);
        
        // Validate region exists
        if (!this.regionConnections[region]) {
            console.warn("Invalid region:", region);
            return;
        }
        
        // Update current region
        this.currentRegion = region;
        this.currentBiomeName = region;
        this.discoveredRegions.add(region);
        
        // Recreate world with new biome
        if (this.world) {
            this.world.dispose();
        }
        this.world = new World(this.currentBiomeName);
        this.scene.add(this.world.container);
        
        // Load NPCs for the new region
        this.npcManager.loadNPCsForRegion(this.currentBiomeName);
        
        // Debug: Track NPC loading
        console.log(`🧙‍♂️ Loading NPCs for ${this.currentBiomeName}`);
        
        // Clear monsters and reset player position
        this.monsters.forEach(monster => {
            this.scene.remove(monster.mesh);
            monster.dispose();
        });
        this.monsters = [];
        
        // Clear projectiles to prevent visual artifacts
        this.projectiles.forEach(proj => {
            this.scene.remove(proj.mesh);
            proj.dispose();
        });
        this.projectiles = [];
        this.monsterProjectiles.forEach(proj => {
            this.scene.remove(proj.mesh);
            proj.dispose();
        });
        this.monsterProjectiles = [];
        
        // Reset player to safe spawn location in new region
        if (this.player) {
            this.player.mesh.position.set(0, this.player.size / 2, -25);
        }
        
        // Update UI
        this.uiManager.updateBiome(region);
        console.log("Successfully traveled to:", region);
    }
    
    handleInteraction() {
        // Handle player interactions (NPCs, doors, items, etc.)
        console.log("🎮 E key pressed - checking interactions");
        
        if (!this.player) {
            console.log("❌ No player found");
            return;
        }
        
        // If dialogue is active, do nothing
        if (this.dialogueSystem.isActive) {
            console.log("❌ Dialogue already active");
            return;
        }
        
        const playerPosition = this.player.mesh.position;
        console.log("📍 Player position:", playerPosition);
        
        // Check for nearby NPCs to talk to with increased range
        const nearbyNPC = this.npcManager.getNearbyNPC(playerPosition, 3.5);
        if (nearbyNPC) {
            console.log(`✅ Found nearby NPC: ${nearbyNPC.name}`);
            
            // Show interaction feedback
            this.uiManager.showInteractionPrompt(`Talking to ${nearbyNPC.name}...`);
            
            // Handle quest completion through dialogue
            this.handleQuestInteraction(nearbyNPC);
            
            // Get interaction data from NPC
            const interactionData = nearbyNPC.interact(this.player);
            
            // Create interaction particle effect
            this.particleSystem.createEffect('npcInteract', nearbyNPC.position);
            
            // Start dialogue with the nearby NPC
            this.dialogueSystem.startDialogue(nearbyNPC, interactionData);
            
            // Hide interaction prompt after short delay
            setTimeout(() => {
                this.uiManager.hideInteractionPrompt();
            }, 1000);
            
            return;
        }
        
        // Check for castle entrance (only in GREEN_HILLS)
        if (this.currentBiomeName === 'GREEN_HILLS' && this.playerLocation === 'overworld') {
            const distanceToCastle = playerPosition.distanceTo(new THREE.Vector3(0, 0, 0));
            console.log('🏰 Distance to castle:', distanceToCastle);
            if (distanceToCastle < 4) {
                console.log('✅ Entering castle...');
                this.uiManager.showInteractionPrompt('Entering Castle...');
                this.enterCastle();
                setTimeout(() => {
                    this.uiManager.hideInteractionPrompt();
                }, 1000);
                return;
            }
        }
        
        // Check for shrine interactions
        this.checkShrineInteraction();
        
        // Check for resource gathering
        this.checkResourceGathering();
        
        console.log("❌ No interactions found at this location");
        this.uiManager.showInteractionPrompt('Nothing to interact with here...');
        setTimeout(() => {
            this.uiManager.hideInteractionPrompt();
        }, 1500);
    }
    
    handleQuestInteraction(npc) {
        console.log(`Talking to ${npc.name} for quest interaction`);
        
        if (npc.quests && npc.quests.length > 0) {
            npc.quests.forEach(quest => {
                if (!this.questManager.hasQuest(quest.id)) {
                    console.log(`Starting quest: ${quest.title}`);
                    this.questManager.addAvailableQuest(quest);
                    this.questManager.startQuest(quest.id);
                    
                    // Add equipment rewards to some quests
                    if (quest.id === 'welcome_quest') {
                        // Give starting equipment
                        this.inventorySystem.addItem('iron_sword', 1, {
                            type: 'weapon',
                            stats: { attack: 3 },
                            description: 'A sturdy iron sword',
                            rarity: 'common'
                        });
                        console.log('Received Iron Sword as quest reward!');
                    }
                }
            });
        }
        
        // Check for quest completion
        const activeQuests = this.questManager.getActiveQuests();
        activeQuests.forEach(quest => {
            quest.objectives.forEach(objective => {
                if (objective.type === 'talk_to_npc' && objective.target === npc.name && !objective.completed) {
                    objective.completed = true;
                    console.log(`Quest objective completed: Talk to ${npc.name}`);
                    
                    // Check if quest is complete
                    if (quest.objectives.every(obj => obj.completed)) {
                        this.questManager.completeQuest(quest.id);
                        this.score += quest.reward || 10;
                        this.uiManager.playerGold = this.score; // Sync playerGold with score
                        this.uiManager.updateGold(this.score);
                        
                        // Equipment quest rewards
                        if (quest.id === 'herbalist_request') {
                            this.inventorySystem.addItem('leather_armor', 1, {
                                type: 'armor',
                                stats: { defense: 2, health: 5 },
                                description: 'Basic leather armor',
                                rarity: 'common'
                            });
                            console.log('Received Leather Armor as quest reward!');
                        }
                    }
                }
            });
        });
    }
    
    handleMonsterKillQuests(monster) {
        // Check if killing this monster advances any quest objectives
        const activeQuests = this.questManager.getActiveQuests();
        
        for (const quest of activeQuests) {
            for (const objective of quest.objectives) {
                if (!objective.completed && objective.id === 'kill_monsters') {
                    console.log('✅ Monster killed for quest progress');
                    this.questManager.updateQuestObjective(quest.id, 'kill_monsters');
                }
            }
        }
    }
    
    syncInventoryWithPlayer() {
        if (this.inventorySystem && this.player) {
            // Update inventory with current player stats including equipment bonuses
            const totalStats = this.inventorySystem.getTotalStats ? this.inventorySystem.getTotalStats() : {};
            
            this.inventorySystem.updateCharacterDisplay({
                level: this.player.level,
                health: this.player.currentHealth,
                maxHealth: this.player.maxHealth + (totalStats.maxHealth || 0),
                attack: this.player.attackDamage + (totalStats.attack || 0),
                defense: (totalStats.defense || 0),
                gold: this.score
            });
            
            // Apply equipment bonuses to player
            if (this.inventorySystem.equipmentBonuses) {
                const bonuses = this.inventorySystem.equipmentBonuses;
                
                // Apply bonuses to player stats (store for combat calculations)
                this.player.equipmentAttackBonus = bonuses.attack || 0;
                this.player.equipmentDefenseBonus = bonuses.defense || 0;
                this.player.equipmentSpeedBonus = bonuses.speed || 0;
                this.player.equipmentHealthBonus = bonuses.health || 0;
                
                // Update player's effective stats but don't override weapon adjustments
                // The updateBuffs method will handle the speed calculation properly
                this.player.updateBuffs(0); // Force a stat recalculation
            }
        }
    }
    updateQuestSystem() {
        // Get the first active quest for display
        const activeQuests = this.questManager.getActiveQuests();
        if (activeQuests.length > 0) {
            this.uiManager.updateActiveQuest(activeQuests[0]);
        } else {
            this.uiManager.updateActiveQuest(null);
        }
        
        // Auto-start the welcome quest if no quests are active and it's not completed
        if (activeQuests.length === 0 && !this.questManager.isQuestCompleted('welcome_quest')) {
            this.questManager.startQuest('welcome_quest');
        }
    }
    
    updateQuestProgress() {
        if (!this.player) return;
        
        const activeQuests = this.questManager.getActiveQuests();
        const playerPosition = this.player.mesh.position;
        
        activeQuests.forEach(quest => {
            quest.objectives.forEach(objective => {
                if (objective.completed) return;
                
                // Handle exploration objectives
                if (objective.type === 'explore_area') {
                    if (objective.target === this.currentBiomeName) {
                        // Track movement distance for exploration
                        if (!this.lastPlayerPosition) {
                            this.lastPlayerPosition = playerPosition.clone();
                        }
                        
                        const distanceMoved = playerPosition.distanceTo(this.lastPlayerPosition);
                        if (distanceMoved > 0.5) { // Minimum movement threshold
                            objective.progress = (objective.progress || 0) + distanceMoved;
                            this.lastPlayerPosition = playerPosition.clone();
                            
                            console.log(`📈 Exploration progress: ${objective.progress.toFixed(1)}/${objective.required}`);
                            
                            // Check if objective is complete
                            if (objective.progress >= objective.required) {
                                objective.completed = true;
                                console.log(`✅ Quest objective completed: ${objective.description}`);
                                
                                // Show completion notification
                                this.uiManager.showInteractionPrompt(`Quest Progress: ${objective.description}`);
                                setTimeout(() => {
                                    this.uiManager.hideInteractionPrompt();
                                }, 2000);
                                
                                // Check if entire quest is complete
                                if (quest.objectives.every(obj => obj.completed)) {
                                    this.questManager.completeQuest(quest.id);
                                            this.score += quest.rewards.gold || 0;
        this.uiManager.playerGold = this.score; // Sync playerGold with score
        this.uiManager.updateGold(this.score);
                                    console.log(`🎉 Quest completed: ${quest.title}`);
                                }
                            }
                        }
                    }
                }
                
                // Handle other objective types here as needed
            });
        });
    }
    
    updateBiomeEffects(deltaTime) {
        // Enhanced biome-specific visual and atmospheric effects
        const time = performance.now() / 1000;
        
        // Get current ambient light from scene
        const ambientLight = this.scene.children.find(child => child.type === 'AmbientLight');
        
        if (!ambientLight) return;
        
        switch (this.currentBiomeName) {
            case 'DESERT':
                // Heat shimmer effect - subtle color variations
                const heatShimmer = Math.sin(time * 3) * 0.05;
                ambientLight.intensity = 0.9 + heatShimmer;
                break;
                
            case 'MAGIC_FOREST':
                // Magical pulsing light
                const magicPulse = (Math.sin(time * 2) + 1) / 2 * 0.3 + 0.7;
                ambientLight.intensity = magicPulse;
                break;
                
            case 'VOLCANO':
                // Flickering volcanic light
                const volcanicFlicker = Math.sin(time * 5) * 0.2 + Math.sin(time * 7) * 0.1;
                ambientLight.intensity = 1.0 + volcanicFlicker;
                break;
                
            case 'LAKE':
                // Gentle water reflection effects
                const waterReflection = Math.sin(time * 1.5) * 0.1;
                ambientLight.intensity = 0.8 + waterReflection;
                break;
                
            case 'BARREN_LAND':
                // Oppressive, slowly changing darkness
                const darkPulse = Math.sin(time * 0.5) * 0.1;
                ambientLight.intensity = 0.5 + darkPulse;
                break;
                
            case 'MOUNTAINS':
                // Clear, crisp mountain light
                ambientLight.intensity = 0.8;
                break;
                
            default: // GREEN_HILLS
                // Natural, stable light with gentle variations
                const naturalVariation = Math.sin(time * 0.8) * 0.05;
                ambientLight.intensity = 0.9 + naturalVariation;
        }
    }
    getBiomeDifficulty(biomeName) {
        // Return base monster count based on biome difficulty
        const biomeDifficulty = {
            'GREEN_HILLS': 1,      // Easy starter area: 1-2 monsters
            'DESERT': 2,           // Medium: 2-3 monsters  
            'MAGIC_FOREST': 2,     // Medium: 2-3 monsters
            'BARREN_LAND': 3,      // Hard: 3-4 monsters
            'MOUNTAINS': 3,        // Hard: 3-4 monsters
            'LAKE': 2,             // Medium: 2-3 monsters
            'VOLCANO': 4,          // Very Hard: 4-5 monsters
        };
        return biomeDifficulty[biomeName] || 1;
    }
    checkResourceGathering() {
        if (!this.inputHandler.keys['KeyF']) return;
        this.inputHandler.keys['KeyF'] = false; // Consume the input
        
        // Check for nearby resources in the current biome
        const playerPos = this.player.mesh.position;
        const currentBiome = this.currentRegion || 'Green Hills';
        
        // Get available resources for this biome
        const biomeResources = this.craftingSystem.getBiomeResources(currentBiome);
        if (biomeResources.length === 0) return;
        
        // Randomly select a resource based on rarity
        const availableResource = this.selectRandomResource(biomeResources);
        if (!availableResource) return;
        
        // Add resource to inventory
        const amount = Math.floor(Math.random() * 3) + 1; // 1-3 items
        this.inventorySystem.addItem({
            name: availableResource.type,
            quantity: amount,
            type: 'material',
            description: `Gathered from ${currentBiome}`
        });
        
        // Visual feedback
        this.particleSystem.createEffect('pickup', playerPos);
        console.log(`Gathered ${amount} ${availableResource.type} from ${currentBiome}`);
        
        // Update UI
        this.uiManager.showNotification(`+${amount} ${availableResource.type}`, 'resource');
    }
    
    selectRandomResource(resources) {
        // Weight resources by rarity (higher rarity = more likely to find)
        const weightedResources = [];
        resources.forEach(resource => {
            const weight = Math.floor(resource.rarity * 100);
            for (let i = 0; i < weight; i++) {
                weightedResources.push(resource);
            }
        });
        
        if (weightedResources.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * weightedResources.length);
        return weightedResources[randomIndex];
    }



    // Auto-save functionality
    initAutoSave() {
        // Auto-save every 2 minutes
        setInterval(() => {
            if (this.isStarted && !this.isPaused && !this.isGameOver) {
                this.saveGame();
                console.log('Auto-save completed');
            }
        }, 120000); // 2 minutes
    }

    // Enhanced notification system
    showFloatingText(text, position, color = '#FFD700', size = 1.0) {
        const floatingText = {
            text: text,
            position: position.clone(),
            color: color,
            size: size,
            life: 0,
            maxLife: 2.0,
            velocity: new THREE.Vector3(0, 2, 0)
        };

        if (!this.floatingTexts) {
            this.floatingTexts = [];
        }
        this.floatingTexts.push(floatingText);
    }

    updateFloatingTexts(deltaTime) {
        if (!this.floatingTexts) return;

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            text.life += deltaTime;
            text.position.add(text.velocity.clone().multiplyScalar(deltaTime));
            text.velocity.multiplyScalar(0.95); // Slow down over time

            if (text.life >= text.maxLife) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    // Enhanced performance monitoring
    initPerformanceMonitoring() {
        this.performanceStats = {
            fps: 0,
            frameTime: 0,
            lastFrameTime: performance.now(),
            frameCount: 0,
            lastFPSUpdate: performance.now()
        };
    }

    updatePerformanceStats() {
        const now = performance.now();
        this.performanceStats.frameTime = now - this.performanceStats.lastFrameTime;
        this.performanceStats.lastFrameTime = now;
        this.performanceStats.frameCount++;

        // Update FPS every second
        if (now - this.performanceStats.lastFPSUpdate >= 1000) {
            this.performanceStats.fps = this.performanceStats.frameCount;
            this.performanceStats.frameCount = 0;
            this.performanceStats.lastFPSUpdate = now;
        }
    }
}