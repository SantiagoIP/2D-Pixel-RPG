// Enhanced Crafting System for Elder Scrolls RPG
// Supports station-based crafting with recipes and resource management

export class CraftingSystem {
    constructor() {
        this.isVisible = false;
        this.recipes = new Map();
        this.craftingStations = new Map();
        this.discoveredRecipes = new Set();
        this.selectedRecipe = null;
        this.selectedStation = null;
        
        // Initialize crafting recipes
        this.initializeRecipes();
        this.initializeCraftingStations();
        this.setupCraftingUI();
    }
    
    initializeRecipes() {
        // Weapon Recipes
        this.addRecipe({
            id: 'iron_sword',
            name: 'Iron Sword',
            station: 'forge',
            materials: {
                'Iron Ore': 3,
                'Wood': 1
            },
            result: {
                type: 'weapon',
                subtype: 'sword',
                stats: { attack: 2, durability: 100 },
                description: 'A sturdy iron sword'
            },
            craftTime: 3000, // 3 seconds
            unlocked: true // Starting recipe
        });
        
        this.addRecipe({
            id: 'steel_sword',
            name: 'Steel Sword',
            station: 'forge',
            materials: {
                'Iron Ore': 2,
                'Coal': 2,
                'Wood': 1
            },
            result: {
                type: 'weapon',
                subtype: 'sword',
                stats: { attack: 4, durability: 150 },
                description: 'A superior steel blade'
            },
            craftTime: 5000,
            unlocked: false
        });
        
        this.addRecipe({
            id: 'elven_bow',
            name: 'Elven Bow',
            station: 'fletcher',
            materials: {
                'Elven Wood': 2,
                'Sinew': 1,
                'Magic Crystal': 1
            },
            result: {
                type: 'weapon',
                subtype: 'bow',
                stats: { attack: 3, speed: 1, durability: 120 },
                description: 'A graceful bow imbued with magic'
            },
            craftTime: 4000,
            unlocked: false
        });
        
        // Armor Recipes
        this.addRecipe({
            id: 'leather_armor',
            name: 'Leather Armor',
            station: 'forge',
            materials: {
                'Leather': 4,
                'Iron Ore': 1
            },
            result: {
                type: 'armor',
                subtype: 'light',
                stats: { defense: 2, speed: 0, durability: 80 },
                description: 'Flexible leather protection'
            },
            craftTime: 2500,
            unlocked: true
        });
        
        this.addRecipe({
            id: 'iron_armor',
            name: 'Iron Armor',
            station: 'forge',
            materials: {
                'Iron Ore': 6,
                'Leather': 2
            },
            result: {
                type: 'armor',
                subtype: 'heavy',
                stats: { defense: 4, speed: -1, durability: 150 },
                description: 'Heavy iron plate armor'
            },
            craftTime: 6000,
            unlocked: false
        });
        
        // Magic Items
        this.addRecipe({
            id: 'healing_potion',
            name: 'Healing Potion',
            station: 'alchemist',
            materials: {
                'Healing Herb': 2,
                'Water': 1,
                'Empty Bottle': 1
            },
            result: {
                type: 'consumable',
                subtype: 'potion',
                stats: { healing: 3 },
                description: 'Restores health when consumed'
            },
            craftTime: 1500,
            unlocked: true
        });
        
        this.addRecipe({
            id: 'fire_staff',
            name: 'Fire Staff',
            station: 'enchanter',
            materials: {
                'Magic Wood': 1,
                'Fire Crystal': 2,
                'Mana Gem': 1
            },
            result: {
                type: 'weapon',
                subtype: 'staff',
                stats: { attack: 5, mana: 2, durability: 100 },
                description: 'A staff crackling with fire magic'
            },
            craftTime: 7000,
            unlocked: false
        });
        
        // Accessories
        this.addRecipe({
            id: 'speed_ring',
            name: 'Ring of Swiftness',
            station: 'enchanter',
            materials: {
                'Gold Ore': 2,
                'Speed Gem': 1,
                'Mana Dust': 1
            },
            result: {
                type: 'accessory',
                subtype: 'ring',
                stats: { speed: 2 },
                description: 'Increases movement speed'
            },
            craftTime: 4500,
            unlocked: false
        });
    }
    
    initializeCraftingStations() {
        this.craftingStations.set('forge', {
            name: 'Blacksmith Forge',
            description: 'Create weapons and armor from metal and wood',
            availableRecipes: ['iron_sword', 'steel_sword', 'leather_armor', 'iron_armor'],
            biomes: ['Green Hills', 'Mountains']
        });
        
        this.craftingStations.set('fletcher', {
            name: 'Fletcher Workshop',
            description: 'Craft bows and arrows from wood and sinew',
            availableRecipes: ['elven_bow'],
            biomes: ['Magic Forest', 'Green Hills']
        });
        
        this.craftingStations.set('alchemist', {
            name: 'Alchemist Table',
            description: 'Brew potions and magical elixirs',
            availableRecipes: ['healing_potion'],
            biomes: ['Magic Forest', 'Lake']
        });
        
        this.craftingStations.set('enchanter', {
            name: 'Enchanting Circle',
            description: 'Imbue items with magical properties',
            availableRecipes: ['fire_staff', 'speed_ring'],
            biomes: ['Magic Forest', 'Volcano']
        });
    }
    
    addRecipe(recipe) {
        this.recipes.set(recipe.id, recipe);
        if (recipe.unlocked) {
            this.discoveredRecipes.add(recipe.id);
        }
    }
    
    canCraft(recipeId, playerInventory) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe || !this.discoveredRecipes.has(recipeId)) {
            return { canCraft: false, reason: 'Recipe not available' };
        }
        
        // Check materials
        for (const [material, required] of Object.entries(recipe.materials)) {
            const available = playerInventory.getItemQuantity(material) || 0;
            if (available < required) {
                return { 
                    canCraft: false, 
                    reason: `Need ${required - available} more ${material}` 
                };
            }
        }
        
        return { canCraft: true };
    }
    
    craftItem(recipeId, playerInventory, onComplete, onProgress) {
        const recipe = this.recipes.get(recipeId);
        const canCraftResult = this.canCraft(recipeId, playerInventory);
        
        if (!canCraftResult.canCraft) {
            console.log(`Cannot craft: ${canCraftResult.reason}`);
            return false;
        }
        
        // Remove materials from inventory
        for (const [material, required] of Object.entries(recipe.materials)) {
            playerInventory.removeItem(material, required);
        }
        
        // Start crafting process with progress callback
        this.startCraftingProcess(recipe, onComplete, onProgress);
        return true;
    }
    
    startCraftingProcess(recipe, onComplete, onProgress) {
        console.log(`Starting to craft ${recipe.name}...`);
        
        const startTime = Date.now();
        const duration = recipe.craftTime;
        
        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (onProgress) {
                onProgress(progress, recipe);
            }
            
            if (progress >= 1) {
                // Crafting complete
                console.log(`Crafted ${recipe.name}!`);
                if (onComplete) {
                    onComplete(recipe.result, recipe);
                }
            } else {
                // Continue crafting
                requestAnimationFrame(updateProgress);
            }
        };
        
        requestAnimationFrame(updateProgress);
    }
    
    discoverRecipe(recipeId) {
        if (this.recipes.has(recipeId)) {
            this.discoveredRecipes.add(recipeId);
            console.log(`Discovered recipe: ${this.recipes.get(recipeId).name}`);
            return true;
        }
        return false;
    }
    
    getAvailableRecipes(stationType = null) {
        const available = [];
        
        for (const [id, recipe] of this.recipes) {
            if (this.discoveredRecipes.has(id)) {
                if (!stationType || recipe.station === stationType) {
                    available.push({ id, ...recipe });
                }
            }
        }
        
        return available;
    }
    
    getStationRecipes(stationType) {
        const station = this.craftingStations.get(stationType);
        if (!station) return [];
        
        return station.availableRecipes
            .filter(id => this.discoveredRecipes.has(id))
            .map(id => ({ id, ...this.recipes.get(id) }));
    }
    
    // Resource gathering helpers
    addGatherableResources(world) {
        const resources = [
            { type: 'Iron Ore', biomes: ['Mountains', 'Barren Land'], rarity: 0.3 },
            { type: 'Coal', biomes: ['Mountains', 'Volcano'], rarity: 0.4 },
            { type: 'Wood', biomes: ['Green Hills', 'Magic Forest'], rarity: 0.7 },
            { type: 'Leather', biomes: ['Green Hills', 'Barren Land'], rarity: 0.5 },
            { type: 'Magic Crystal', biomes: ['Magic Forest', 'Volcano'], rarity: 0.1 },
            { type: 'Healing Herb', biomes: ['Green Hills', 'Magic Forest', 'Lake'], rarity: 0.6 },
            { type: 'Water', biomes: ['Lake'], rarity: 0.9 },
            { type: 'Elven Wood', biomes: ['Magic Forest'], rarity: 0.2 },
            { type: 'Fire Crystal', biomes: ['Volcano'], rarity: 0.15 },
            { type: 'Gold Ore', biomes: ['Mountains'], rarity: 0.1 }
        ];
        
        world.craftingResources = resources;
        return resources;
    }
    
    // UI Integration
    show() {
        this.isVisible = true;
        const overlay = document.getElementById('crafting-overlay');
        if (overlay) {
            overlay.style.display = 'block';
        }
    }
    
    hide() {
        this.isVisible = false;
        const overlay = document.getElementById('crafting-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    toggle() {
        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            this.show();
        } else {
            this.hide();
        }
        console.log(`🔨 Crafting interface ${this.isVisible ? 'opened' : 'closed'}`);
    }
    
    setupCraftingUI() {
        // Create crafting overlay if it doesn't exist
        if (!document.getElementById('crafting-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'crafting-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                z-index: 1400;
                font-family: 'Press Start 2P', cursive;
            `;
            
            const panel = document.createElement('div');
            panel.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 800px;
                height: 600px;
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                border: 4px solid #ff9800;
                border-radius: 8px;
                box-shadow: 0 0 30px rgba(0,0,0,0.9);
                padding: 20px;
            `;
            
            panel.innerHTML = `
                <h2 style="color: #ff9800; margin: 0 0 20px 0; font-size: 1em; text-align: center;">🔨 Crafting Station</h2>
                <div style="color: white; font-size: 0.7em; text-align: center; margin-bottom: 30px;">
                    Select materials and craft new items
                </div>
                <div style="color: #aaa; font-size: 0.6em; text-align: center; line-height: 1.6;">
                    <p>🛠️ Available Recipes:</p>
                    <p>• Iron Sword (Iron Ore x3, Wood x1)</p>
                    <p>• Leather Armor (Leather x4, Iron Ore x1)</p>
                    <p>• Healing Potion (Healing Herb x2, Water x1, Empty Bottle x1)</p>
                    <p style="margin-top: 20px; color: #ff9800;">More crafting features coming soon!</p>
                </div>
                <button style="
                    position: absolute;
                    bottom: 20px;
                    right: 20px;
                    background: #ff4444;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 0.6em;
                    cursor: pointer;
                    border-radius: 4px;
                " onclick="this.closest('#crafting-overlay').style.display='none'">Close</button>
            `;
            
            overlay.appendChild(panel);
            document.body.appendChild(overlay);
        }
    }
    
    setSelectedRecipe(recipeId) {
        this.selectedRecipe = recipeId;
    }
    
    setSelectedStation(stationType) {
        this.selectedStation = stationType;
    }
    
    getBiomeResources(biomeName) {
        if (!this.biomeResources) {
            this.initializeBiomeResources();
        }

        const normalizedBiome = this.normalizeBiomeName(biomeName);
        return this.biomeResources.filter(resource => 
            resource.biomes.includes(normalizedBiome)
        );
    }

    normalizeBiomeName(biomeName) {
        if (!biomeName) return 'Green Hills';
        if (biomeName.includes('_')) {
            return biomeName
                .toLowerCase()
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
        return biomeName;
    }
    
    initializeBiomeResources() {
        this.biomeResources = [
            { type: 'Iron Ore', biomes: ['Mountains', 'Barren Land'], rarity: 0.3 },
            { type: 'Coal', biomes: ['Mountains', 'Volcano'], rarity: 0.4 },
            { type: 'Wood', biomes: ['Green Hills', 'Magic Forest'], rarity: 0.7 },
            { type: 'Leather', biomes: ['Green Hills', 'Barren Land'], rarity: 0.5 },
            { type: 'Magic Crystal', biomes: ['Magic Forest', 'Volcano'], rarity: 0.1 },
            { type: 'Healing Herb', biomes: ['Green Hills', 'Magic Forest', 'Lake'], rarity: 0.6 },
            { type: 'Water', biomes: ['Lake'], rarity: 0.9 },
            { type: 'Elven Wood', biomes: ['Magic Forest'], rarity: 0.2 },
            { type: 'Fire Crystal', biomes: ['Volcano'], rarity: 0.15 },
            { type: 'Gold Ore', biomes: ['Mountains'], rarity: 0.1 },
            { type: 'Sinew', biomes: ['Barren Land', 'Mountains'], rarity: 0.3 },
            { type: 'Magic Wood', biomes: ['Magic Forest'], rarity: 0.15 },
            { type: 'Mana Gem', biomes: ['Magic Forest', 'Volcano'], rarity: 0.08 },
            { type: 'Empty Bottle', biomes: ['Green Hills', 'Lake'], rarity: 0.4 },
            { type: 'Speed Gem', biomes: ['Mountains'], rarity: 0.05 },
            { type: 'Mana Dust', biomes: ['Magic Forest'], rarity: 0.12 }
        ];
    }
} 