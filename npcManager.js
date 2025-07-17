import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { createPixelSprite } from './spriteUtils.js';

// NPC types with their characteristics
export const NPC_TYPES = {
    MERCHANT: 'merchant',
    GUARD: 'guard',
    VILLAGER: 'villager',
    QUEST_GIVER: 'questGiver',
    TRAINER: 'trainer',
    BLACKSMITH: 'blacksmith',
    MAGE: 'mage',
    PRIEST: 'priest',
    INNKEEPER: 'innkeeper'
};

export class NPC {
    constructor(type, name, position, dialogue, options = {}) {
        this.type = type;
        this.name = name;
        this.position = position.clone();
        this.dialogue = dialogue;
        this.size = options.size || 0.9;
        this.wanderRadius = options.wanderRadius || 3;
        this.isStationary = options.isStationary || false;
        this.faction = options.faction || 'neutral';
        this.shop = options.shop || null; // For merchants
        this.quests = options.quests || []; // Available quests
        this.services = options.services || []; // Available services (training, healing, etc.)
        this.region = options.region || null; // NEW: Store the NPC's region
        
        // Create visual representation with stable positioning
        this.mesh = createPixelSprite(this.getSpriteType(), this.size);
        this.mesh.position.copy(this.position);
        this.mesh.position.y = this.size / 2; // Stable Y position
        this.mesh.userData.npc = this;
        this.mesh.userData.isNPC = true; // Flag for identification
        this.mesh.userData.baseY = this.size / 2; // Store base Y for animations
        
        // Add flat ellipse shadow with stable properties
        const shadowGeometry = new THREE.PlaneGeometry(this.size * 0.7, this.size * 0.3);
        const shadowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000, 
            transparent: true, 
            opacity: 0.35,
            depthWrite: false,
            fog: false
        });
        this.shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.shadowMesh.rotation.x = -Math.PI / 2;
        this.shadowMesh.position.set(0, 0.01, 0);
        this.mesh.add(this.shadowMesh);
        
        // Movement and AI
        this.basePosition = position.clone();
        this.moveDirection = new THREE.Vector3();
        this.changeDirectionTimer = 0;
        this.wanderSpeed = 0.5;
        this.interactionRange = 2.5;
        
        // Dialogue state
        this.hasBeenTalkedTo = false;
        this.relationshipLevel = 0; // -100 to 100, affects available dialogue
        this.lastInteractionTime = 0;
        
        // Schedule system (optional future enhancement)
        this.schedule = options.schedule || null;
        this.currentActivity = 'idle';
        
        // Prevent flickering variables
        this.isInitialized = true;
        this.lastUpdateTime = 0;
    }
    
    getSpriteType() {
        // Map NPC types to sprite names
        switch (this.type) {
            case NPC_TYPES.MERCHANT: return 'merchant';
            case NPC_TYPES.GUARD: return 'guard';
            case NPC_TYPES.BLACKSMITH: return 'blacksmith';
            case NPC_TYPES.MAGE: return 'mage';
            case NPC_TYPES.PRIEST: return 'priest';
            case NPC_TYPES.TRAINER: return 'trainer';
            case NPC_TYPES.INNKEEPER: return 'innkeeper';
            case NPC_TYPES.QUEST_GIVER: return 'questGiver';
            default: return 'villager';
        }
    }
    
    update(deltaTime, playerPosition) {
        // Enhanced stability checks
        if (!this.mesh || !this.mesh.position || !playerPosition) {
            return false;
        }
        
        // Prevent rapid updates that could cause flickering
        const currentTime = Date.now();
        if (currentTime - this.lastUpdateTime < 16) { // Limit to ~60fps updates
            const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
            return distanceToPlayer <= this.interactionRange;
        }
        this.lastUpdateTime = currentTime;
        
        // Handle wandering behavior for non-stationary NPCs
        if (!this.isStationary && this.isInitialized) {
            this.updateMovement(deltaTime);
        }
        
        // Ensure mesh stays at proper height with bounds checking
        const targetY = this.size / 2;
        if (Math.abs(this.mesh.position.y - targetY) > 0.01) {
            this.mesh.position.y = targetY;
        }
        
        // Check if player is nearby for interaction prompt
        const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
        return distanceToPlayer <= this.interactionRange;
    }
    
    updateMovement(deltaTime) {
        // Enhanced movement with stability checks
        if (!this.mesh || !this.mesh.position) return;
        
        // Clamp deltaTime to prevent large jumps
        deltaTime = Math.min(deltaTime, 0.1);
        
        this.changeDirectionTimer -= deltaTime;
        
        if (this.changeDirectionTimer <= 0) {
            // Change direction periodically
            const angle = Math.random() * Math.PI * 2;
            this.moveDirection.set(Math.cos(angle), 0, Math.sin(angle));
            this.changeDirectionTimer = Math.random() * 4 + 2; // 2-6 seconds
        }
        
        // Move within wander radius with collision detection
        const moveDelta = this.moveDirection.clone().multiplyScalar(this.wanderSpeed * deltaTime);
        const potentialPos = this.mesh.position.clone().add(moveDelta);
            
        const distanceFromBase = potentialPos.distanceTo(this.basePosition);
        if (distanceFromBase <= this.wanderRadius) {
            // Safe movement within bounds
            this.mesh.position.x = potentialPos.x;
            this.mesh.position.z = potentialPos.z;
        } else {
            // Turn back toward base
            this.moveDirection = this.basePosition.clone()
                .sub(this.mesh.position)
                .normalize();
        }
        
        // Always maintain stable Y position
        this.mesh.position.y = this.size / 2;
    }
    
    interact(player) {
        this.hasBeenTalkedTo = true;
        this.lastInteractionTime = Date.now();
        
        // Return interaction data
        return {
            npc: this,
            dialogue: this.getCurrentDialogue(),
            shop: this.shop,
            quests: this.getAvailableQuests(),
            services: this.services
        };
    }
    
    getCurrentDialogue() {
        // Select appropriate dialogue based on relationship and previous interactions
        if (Array.isArray(this.dialogue)) {
            if (!this.hasBeenTalkedTo && this.dialogue.length > 1) {
                return this.dialogue[0]; // First meeting
            }
            return this.dialogue[Math.min(1, this.dialogue.length - 1)]; // Subsequent meetings
        }
        return this.dialogue;
    }
    
    getAvailableQuests() {
        // Filter quests based on player progress, relationship, etc.
        return this.quests.filter(quest => {
            // Add quest availability logic here
            return quest.available !== false;
        });
    }
    
    dispose() {
        if (this.mesh.dispose) {
            this.mesh.dispose();
        }
    }
    
    refreshSprite() {
        // Recreate the sprite to fix any corruption issues
        const oldMesh = this.mesh;
        const oldPosition = oldMesh.position.clone();
        const oldParent = oldMesh.parent;
        
        // Create new sprite mesh
        this.mesh = createPixelSprite(this.getSpriteType(), this.size);
        this.mesh.position.copy(oldPosition);
        this.mesh.userData.npc = this;
        this.mesh.userData.isNPC = true;
        this.mesh.userData.baseY = this.size / 2;
        
        // Maintain original rotation if stored
        if (this.originalRotation) {
            this.mesh.rotation.copy(this.originalRotation);
        }
        
        // Re-add shadow
        if (this.shadowMesh) {
            this.mesh.add(this.shadowMesh);
        }
        
        // Replace in scene
        if (oldParent) {
            oldParent.remove(oldMesh);
            oldParent.add(this.mesh);
        }
        
        // Dispose old mesh
        if (oldMesh.dispose) {
            oldMesh.dispose();
        }
    }
}

export class NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = new Map(); // NPCs by region
        this.activeNPCs = []; // Currently loaded NPCs
        this.interactionPromptShown = false;
        
        this.setupRegionalNPCs();
    }
    
    setupRegionalNPCs() {
        // Define NPCs for each region
        this.npcs.set('GREEN_HILLS', [
            new NPC(
                NPC_TYPES.QUEST_GIVER,
                'Elder Marcus',
                new THREE.Vector3(5, 0, 8),
                [
                    "Welcome to Greendale, weary traveler. I am Elder Marcus, keeper of these ancient lands. In the old tongue, we are called 'Aethermoor' - the first settlement founded after the Great Sundering, when the Crystal of Eternity shattered and scattered its fragments across the seven realms. You carry the aura of one touched by destiny... tell me, do you remember the dreams? The visions of crystal light calling you home?",
                    "The signs grow stronger each day, brave soul. The Shadowtide stirs in the eastern wastes, and the ancient barriers weaken. Our scouts report strange lights in the Mystic Groves, and the desert nomads speak of awakening powers beneath the dunes. The time of prophecy approaches - will you be the one to reunite the Crystal Fragments and restore balance to the realm?"
                ],
                { 
                    isStationary: true, 
                    wanderRadius: 1,
                    quests: [
                        {
                            id: 'welcome_quest',
                            title: 'Welcome to the Realm',
                            description: 'Learn the basics by exploring the village and meeting its inhabitants.',
                            objectives: [
                                { id: 'talk_to_elder', description: 'Speak with Elder Marcus', completed: false, type: 'talk_to_npc', target: 'Elder Marcus' },
                                { id: 'explore_village', description: 'Walk around the village area', completed: false, type: 'explore_area', target: 'GREEN_HILLS', progress: 0, required: 50 }
                            ],
                            rewards: {
                                gold: 25,
                                experience: 50,
                                items: [{ name: 'Village Map', quantity: 1 }]
                            },
                            type: 'main',
                            region: 'GREEN_HILLS',
                            available: true
                        }
                    ],
                    region: 'GREEN_HILLS'
                }
            ),
            new NPC(
                NPC_TYPES.MERCHANT,
                'Trader Emma',
                new THREE.Vector3(-8, 0, 5),
                [
                    "Greetings, wanderer! I am Emma Brightbough, descendant of the merchant princes who once traded between the Seven Kingdoms before the Sundering. My family has preserved ancient recipes and knowledge through the dark centuries. These healing draughts contain essences from the sacred Silverleaf trees - they still grow in hidden groves where the old magic lingers strongest. Perhaps you seek such treasures?",
                    "You have the look of one who walks the old paths, friend. My grandmother spoke of the Hearthstone Prophecy - that one day a traveler bearing the mark of the crystal shards would unite the scattered realms once more. The herbs I seek aren't mere ingredients... they're components for the Ritual of Awakening. Help me gather them, and I'll share secrets known only to my bloodline."
                ],
                { 
                    wanderRadius: 4,
                    shop: {
                        items: [
                            { name: 'Health Potion', price: 15, description: 'Restores 25 health points', type: 'consumable', healing: 25 },
                            { name: 'Mana Potion', price: 20, description: 'Restores 50 mana points', type: 'consumable', manaRestore: 50 },
                            { name: 'Magic Scroll', price: 25, description: 'Ancient magical knowledge', type: 'consumable' },
                            { name: 'Iron Ore', price: 8, description: 'Useful for crafting weapons', type: 'material' },
                            { name: 'Rope', price: 5, description: 'Strong hemp rope', type: 'material' },
                            { name: 'Torch', price: 2, description: 'Lights the way in dark places', type: 'consumable' }
                        ]
                    },
                    quests: [
                        {
                            id: 'gather_herbs',
                            title: 'Herbalist\'s Request',
                            description: 'Collect healing herbs from around the village for Trader Emma.',
                            objectives: [
                                { id: 'collect_herbs', description: 'Collect 5 healing herbs', completed: false, type: 'gather_resources', target: 'Healing Herb', current: 0, required: 5 }
                            ],
                            rewards: {
                                gold: 15,
                                experience: 25,
                                items: [{ name: 'Health Potion', quantity: 2 }]
                            },
                            type: 'side',
                            region: 'GREEN_HILLS',
                            available: true
                        }
                    ],
                    region: 'GREEN_HILLS'
                }
            ),
            new NPC(
                NPC_TYPES.GUARD,
                'Captain Reid',
                new THREE.Vector3(0, 0, -10),
                [
                    "Halt, traveler! I am Captain Reid Ironwatch, Last Guardian of the Aethermoor Border. For three generations my family has stood vigil against the creeping darkness from the Shadowlands. The creatures grow bolder each passing moon - twisted beings born from the corrupted crystal fragments. They hunger for the pure essence that still flows through these blessed lands.",
                    "The ancient wards weaken, and our scouts report disturbing signs. Strange lights dance in the northern peaks, and the desert winds carry whispers in the old tongue. If you venture beyond our borders, carry blessed silver and keep the Sacred Words upon your lips: 'By Light Divided, By Will United.' May the Crystal's grace protect you on the dark paths ahead."
                ],
                { isStationary: true, region: 'GREEN_HILLS' }
            ),
            new NPC(
                NPC_TYPES.BLACKSMITH,
                'Gareth the Smith',
                new THREE.Vector3(2, 0, -10),
                [
                    "Ho there, warrior! I am Gareth Stormforge, last heir to the Draconic Smiths of the old kingdom. My ancestors forged the Crystal-Touched Blades that once held back the tide of shadow. The techniques live on through me, though the sacred meteoric iron grows scarce. These modern tools pale before the legendary weapons of old - but with the right materials, I could craft you something worthy of the ancient heroes.",
                    "The mountain peaks hold secrets, traveler. Deep in the volcanic heart of Mount Pyraxis lies Starfall Iron - metal blessed by celestial fire that fell during the Great Sundering. Legend speaks of Crystal Cores still pulsing with pure light, waiting for one brave enough to claim them. Bring me such treasures, and I'll forge you a weapon that could cut through shadow itself and restore the broken barriers of our world."
                ],
                { 
                    isStationary: true,
                    services: ['repair', 'upgrade', 'crystal_forging'],
                    region: 'GREEN_HILLS'
                }
            )
        ]);
        
        this.npcs.set('DESERT', [
            new NPC(
                NPC_TYPES.MERCHANT,
                'Hassan the Trader',
                new THREE.Vector3(10, 0, 10),
                [
                    "Peace be upon you, wanderer of the endless dunes! I am Hassan al-Zahra, Keeper of the Desert Mysteries and last of the Sunward Nomads. My people have roamed these sacred sands since before the Crystal shattered the sky. We remember when these wastes were gardens of gold, before the Scorching Tears fell and turned paradise to dust. In my caravan rest treasures from the buried city of Qadesh'thara - relics of power that predate even the Crystal of Eternity.",
                    "The desert speaks to those who listen, friend. Deep beneath the shifting sands lies the Tomb of the First Pharaoh, she who first bound the Solar Fragment to her crown. My grandmother's grandmother saw the crystal lights dancing over the burial site on the night of the Blood Moon. The Scorpion Lords guard the entrance, but within... such power awaits! The Solar Fragment could ignite the ritual circles and awaken the sleeping guardians. Will you brave the Temple of Endless Suns?"
                ],
                {
                    shop: {
                        items: [
                            { name: 'Health Potion', price: 18, description: 'Desert healing elixir', type: 'consumable', healing: 25 },
                            { name: 'Mana Potion', price: 25, description: 'Mystical desert brew', type: 'consumable', manaRestore: 50 },
                            { name: 'Waterskin', price: 15, description: 'Essential for desert survival', type: 'consumable' },
                            { name: 'Scimitar', price: 120, description: 'Sharp curved desert blade', type: 'weapon', stats: { attack: 8 } },
                            { name: 'Desert Turban', price: 40, description: 'Protection from sun and sand', type: 'armor', stats: { defense: 2 } }
                        ]
                    },
                    region: 'DESERT'
                }
            ),
            new NPC(
                NPC_TYPES.VILLAGER,
                'Nomad Zara',
                new THREE.Vector3(-5, 0, -5),
                [
                    "The night winds carry ancient songs, stranger. I am Zara the Starseeker, daughter of the Moonlight Caravan. My ancestors were the first to witness the Solar Fragment's fall from the heavens, burning a crater where the sacred oasis once bloomed. The djinn of the deep sands remember the old pacts - they speak of a great Sandwyrm that guards the Crystal Heart, sleeping since the day the stars wept tears of fire. Do you hear their whispers too?",
                    "The constellations have shifted, wanderer. The Serpent rises where the Phoenix once soared, and the desert's dreams grow restless. My grandmother taught me the old ways - how to read the patterns in the sand, how to speak with the wind-spirits who guard the hidden paths. The Scorpion Lords stir in their crystal tombs, sensing the approach of the Convergence. You bear the mark of destiny... will you awaken what should remain sleeping?"
                ],
                {
                    wanderRadius: 8,
                    region: 'DESERT'
                }
            )
        ]);
        
        this.npcs.set('MAGIC_FOREST', [
            new NPC(
                NPC_TYPES.MAGE,
                'Archmage Elara',
                new THREE.Vector3(0, 0, 0),
                [
                    "Step carefully, seeker of wisdom. I am Archmage Elara Moonwhisper, Guardian of the Verdant Fragment and last of the Circle of Seven Stars. This forest is the final sanctuary where the old magic still flows pure and untainted. When the Crystal of Eternity shattered, one of its greatest fragments fell here, merging with the Heart Tree and awakening the ancient consciousness that slumbers in root and branch. The very air shimmers with possibility and power.",
                    "The prophecies speak of a time when the scattered fragments would call to a chosen soul. The Nature Fragment pulses with increasing intensity - can you feel its song resonating in your bones? The forest spirits whisper of dark changes in the cosmic patterns. Shadow-touched creatures probe our borders, seeking the power that dwells within our sacred groves. If you would claim the fragment's blessing, you must first prove yourself worthy by healing the corruption that spreads from the northern blight."
                ],
                {
                    isStationary: true,
                    services: ['train_magic', 'enchant'],
                    region: 'MAGIC_FOREST'
                }
            ),
            new NPC(
                NPC_TYPES.VILLAGER,
                'Forest Guardian Alin',
                new THREE.Vector3(-8, 0, -8),
                [
                    "Welcome, child of distant roads. I am Alin Starleaf, born of union between the woodland folk and the spirits of the grove. My mother was an elf-maiden who danced with moonbeams, my father a treant whose roots touched the world's foundations. I have lived three centuries in these enchanted glades, watching over the delicate balance between the mortal realm and the realm of fae. The very trees sing to me of your approach - they sense the crystal's resonance within your spirit.",
                    "Dark tidings trouble the ancient harmonies, wanderer. The Shadow Blight spreads from the cursed groves where corrupted crystal shards poison the earth. The unicorns have fled to deeper mysteries, and even the wise owls speak in riddles of coming doom. Yet the Great Tree dreams of renewal - its roots whisper of one who will bridge the severed realms and restore the broken song. Are you the prophesied Shard-Bearer who will cleanse the tainted fragments and reunite the sundered magical essence?"
                ],
                { wanderRadius: 5, region: 'MAGIC_FOREST' }
            )
        ]);
        
        // Add more regions as needed...
    }
    
    loadNPCsForRegion(regionName) {
        // Clear existing NPCs
        this.clearActiveNPCs();
        
        // Load NPCs for the new region
        const regionNPCs = this.npcs.get(regionName) || [];
        for (const npc of regionNPCs) {
            this.scene.add(npc.mesh);
            this.activeNPCs.push(npc);
        }
        
        console.log(`Loaded ${regionNPCs.length} NPCs for region: ${regionName}`);
    }
    
    clearActiveNPCs() {
        // Remove NPCs from scene
        for (const npc of this.activeNPCs) {
            if (npc.mesh && npc.mesh.parent) {
                this.scene.remove(npc.mesh);
            }
        }
        this.activeNPCs = [];
        console.log("🧙‍♂️ Cleared all active NPCs");
    }
    
    update(deltaTime, playerPosition) {
        let nearbyNPC = null;
        
        for (const npc of this.activeNPCs) {
            const isNearby = npc.update(deltaTime, playerPosition);
            if (isNearby && !nearbyNPC) {
                nearbyNPC = npc;
            }
        }
        
        return nearbyNPC;
    }
    
    getNearbyNPC(playerPosition, maxDistance = 2.5) {
        for (const npc of this.activeNPCs) {
            const distance = npc.mesh.position.distanceTo(playerPosition);
            if (distance <= maxDistance) {
                return npc;
            }
        }
        return null;
    }
    
    getActiveNPCs() {
        return this.activeNPCs;
    }
    
    dispose() {
        this.clearActiveNPCs();
        // Dispose all NPCs in storage
        for (const [region, npcs] of this.npcs) {
            for (const npc of npcs) {
                npc.dispose();
            }
        }
        this.npcs.clear();
    }
} 