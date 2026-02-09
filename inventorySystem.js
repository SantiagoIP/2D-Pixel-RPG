export class InventorySystem {
    constructor() {
        this.items = new Map(); // All items by ID
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
        this.gold = 0;
        this.maxSlots = 20; // Grid size: 4x5
        this.isVisible = false;
        this.selectedItem = null;
        this.overlay = null;
        this.inventoryGrid = null;
        this.playerStats = {
            level: 1,
            health: 5,
            maxHealth: 5,
            attack: 1,
            defense: 0,
            speed: 5,
            gold: 0
        };
        this.equipmentBonuses = {
            attack: 0,
            defense: 0,
            speed: 0,
            health: 0
        };
        
        this.setupInventoryUI();
        this.initializeStartingItems();
    }
    
    initializeStartingItems() {
        // Give player some starting items
        this.addItem({
            id: 'starter_sword',
            name: 'Rusty Sword',
            type: 'weapon',
            description: 'A basic sword, worn from years of use.',
            value: 10,
            stats: { attack: 5 },
            equipped: true
        });
        
        this.addItem({
            id: 'health_potion_1',
            name: 'Health Potion',
            type: 'consumable',
            description: 'Restores 25 health points.',
            value: 15,
            healing: 25,
            quantity: 3
        });
        
        this.gold = 50; // Starting gold
    }
    
    setupInventoryUI() {
        // Create inventory overlay
        const overlay = document.createElement('div');
        overlay.id = 'inventory-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            z-index: 1500;
            font-family: 'Press Start 2P', cursive;
        `;
        this.overlay = overlay;
        
        // Main inventory panel
        const panel = document.createElement('div');
        panel.id = 'inventory-panel';
        panel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px;
            height: 600px;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border: 4px solid #ffeb3b;
            border-radius: 8px;
            box-shadow: 0 0 30px rgba(0,0,0,0.9);
            display: flex;
        `;
        
        // Left side - Equipment and character
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            width: 300px;
            padding: 20px;
            border-right: 2px solid #555;
        `;
        
        // Character display
        const characterDisplay = document.createElement('div');
        characterDisplay.innerHTML = `
            <h3 style="color: #ffeb3b; margin: 0 0 20px 0; font-size: 0.8em;">Character</h3>
            <div id="character-stats" style="color: white; font-size: 0.6em; line-height: 1.6;">
                <div>Level: <span id="char-level">1</span></div>
                <div>Health: <span id="char-health">100</span></div>
                <div>Attack: <span id="char-attack">10</span></div>
                <div>Defense: <span id="char-defense">5</span></div>
            </div>
        `;
        
        // Equipment slots
        const equipmentDisplay = document.createElement('div');
        equipmentDisplay.innerHTML = `
            <h3 style="color: #ffeb3b; margin: 20px 0 15px 0; font-size: 0.8em;">Equipment</h3>
            <div id="equipment-slots" style="display: flex; flex-direction: column; gap: 10px;">
                <div class="equipment-slot" data-slot="weapon">
                    <span style="color: #ff9800; font-size: 0.6em;">Weapon:</span>
                    <div class="slot-item" style="min-height: 30px; border: 2px solid #555; padding: 8px; background: #333; color: white; font-size: 0.5em;">
                        Empty
                    </div>
                </div>
                <div class="equipment-slot" data-slot="armor">
                    <span style="color: #ff9800; font-size: 0.6em;">Armor:</span>
                    <div class="slot-item" style="min-height: 30px; border: 2px solid #555; padding: 8px; background: #333; color: white; font-size: 0.5em;">
                        Empty
                    </div>
                </div>
                <div class="equipment-slot" data-slot="accessory">
                    <span style="color: #ff9800; font-size: 0.6em;">Accessory:</span>
                    <div class="slot-item" style="min-height: 30px; border: 2px solid #555; padding: 8px; background: #333; color: white; font-size: 0.5em;">
                        Empty
                    </div>
                </div>
            </div>
        `;
        
        leftPanel.appendChild(characterDisplay);
        leftPanel.appendChild(equipmentDisplay);
        
        // Right side - Inventory grid
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            display: flex;
            flex-direction: column;
        `;
        
        const inventoryHeader = document.createElement('div');
        inventoryHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        `;
        
        const inventoryTitle = document.createElement('h3');
        inventoryTitle.textContent = 'Inventory';
        inventoryTitle.style.cssText = `
            color: #ffeb3b;
            margin: 0;
            font-size: 0.8em;
        `;
        
        const goldDisplay = document.createElement('div');
        goldDisplay.id = 'gold-display';
        goldDisplay.style.cssText = `
            color: #ffeb3b;
            font-size: 0.7em;
        `;
        goldDisplay.textContent = `Gold: ${this.gold}`;
        
        inventoryHeader.appendChild(inventoryTitle);
        inventoryHeader.appendChild(goldDisplay);
        
        // Inventory grid
        const inventoryGrid = document.createElement('div');
        inventoryGrid.id = 'inventory-grid';
        inventoryGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(5, 1fr);
            gap: 5px;
            flex: 1;
            padding: 10px;
            background: #222;
            border: 2px solid #555;
            border-radius: 4px;
        `;
        this.inventoryGrid = inventoryGrid;
        
        // Create inventory slots
        for (let i = 0; i < this.maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slotIndex = i;
            slot.style.cssText = `
                background: #333;
                border: 2px solid #555;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                min-height: 60px;
                position: relative;
            `;
            
            slot.addEventListener('mouseenter', () => {
                slot.style.borderColor = '#ffeb3b';
                slot.style.background = '#444';
            });
            
            slot.addEventListener('mouseleave', () => {
                slot.style.borderColor = '#555';
                slot.style.background = '#333';
            });
            
            slot.addEventListener('click', () => this.handleSlotClick(i));
            
            inventoryGrid.appendChild(slot);
        }
        
        rightPanel.appendChild(inventoryHeader);
        rightPanel.appendChild(inventoryGrid);
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #ff4444;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2em;
            font-family: Arial, sans-serif;
        `;
        closeButton.addEventListener('click', () => this.toggleInventory());
        
        panel.appendChild(leftPanel);
        panel.appendChild(rightPanel);
        panel.appendChild(closeButton);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        
        // Controls info
        const controls = document.createElement('div');
        controls.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: #aaa;
            font-size: 0.6em;
            text-align: center;
        `;
        controls.textContent = 'Click items to use/equip • Right-click to drop • I to close';
        overlay.appendChild(controls);
    }
    
    addItem(itemOrId, quantity = 1, itemData = null) {
        let item = null;
        let shouldEquip = false;

        if (itemOrId && typeof itemOrId === 'object') {
            const data = { ...itemOrId };
            const itemType = data.type || 'consumable';
            const itemQuantity = data.quantity || 1;
            const itemName = data.name || this.formatItemName(data.id || 'item');

            if (this.isStackable(itemType)) {
                const existingItem = this.findStackableItem(itemName, itemType);
                if (existingItem) {
                    existingItem.quantity += itemQuantity;
                    this.updateInventoryDisplay();
                    return true;
                }
            }

            item = {
                id: data.id || this.generateItemId(),
                name: itemName,
                type: itemType,
                description: data.description || '',
                value: data.value || 0,
                stats: data.stats || {},
                quantity: itemQuantity,
                equipped: !!data.equipped,
                rarity: data.rarity || 'common',
                healing: data.healing,
                manaRestore: data.manaRestore,
                buffType: data.buffType,
                buffEffects: data.buffEffects,
                buffDuration: data.buffDuration,
                icon: data.icon
            };
            shouldEquip = item.equipped;
        } else {
            const itemId = String(itemOrId);
            const data = itemData || {};
            const itemType = data.type || 'consumable';
            const itemName = data.name || this.formatItemName(itemId);

            if (this.isStackable(itemType)) {
                const existingItem = this.findStackableItem(itemName, itemType);
                if (existingItem) {
                    existingItem.quantity += quantity;
                    this.updateInventoryDisplay();
                    return true;
                }
            }

            item = {
                id: itemId,
                name: itemName,
                type: itemType,
                description: data.description || '',
                value: data.value || 0,
                stats: data.stats || {},
                quantity: quantity,
                equipped: !!data.equipped,
                rarity: data.rarity || 'common',
                healing: data.healing,
                manaRestore: data.manaRestore,
                buffType: data.buffType,
                buffEffects: data.buffEffects,
                buffDuration: data.buffDuration,
                icon: data.icon
            };
            shouldEquip = item.equipped;
        }

        if (!item) return false;

        this.items.set(item.id, item);

        // Auto-equip if requested or slot empty for equippable items
        const slot = this.getEquipmentSlot(item.type);
        if (shouldEquip || (slot && !this.equipment[slot])) {
            this.equipItem(item.id);
        } else {
            this.updateInventoryDisplay();
        }

        return true;
    }
    
    removeItem(itemIdOrName, quantity = 1) {
        let item = this.items.get(itemIdOrName);

        if (!item) {
            // Attempt to find by name (stackable items)
            item = this.findStackableItem(String(itemIdOrName));
        }

        if (!item) return false;

        if (item.quantity > quantity) {
            item.quantity -= quantity;
        } else {
            this.items.delete(item.id);
            if (item.equipped) {
                const slot = this.getEquipmentSlot(item.type);
                if (slot) {
                    this.equipment[slot] = null;
                }
            }
        }

        this.applyEquipmentBonuses();
        this.updateInventoryDisplay();
        return true;
    }
    
    equipItem(itemId) {
        const item = this.items.get(itemId);
        if (!item) return false;

        const slot = this.getEquipmentSlot(item.type);
        if (!slot) return false;

        if (this.equipment[slot] && this.equipment[slot].id !== itemId) {
            this.equipment[slot].equipped = false;
        }

        this.equipment[slot] = item;
        item.equipped = true;

        this.applyEquipmentBonuses();
        this.updateInventoryDisplay();
        return true;
    }

    unequipItem(slotOrItemId) {
        let slot = slotOrItemId;
        if (!['weapon', 'armor', 'accessory'].includes(slotOrItemId)) {
            const item = this.items.get(slotOrItemId);
            slot = item ? this.getEquipmentSlot(item.type) : null;
        }

        if (!slot || !this.equipment[slot]) return false;

        this.equipment[slot].equipped = false;
        this.equipment[slot] = null;

        this.applyEquipmentBonuses();
        this.updateInventoryDisplay();
        return true;
    }
    
    useItem(itemId) {
        const item = this.items.get(itemId);
        if (!item) return false;
        
        switch (item.type) {
            case 'consumable':
                return this.useConsumable(item, itemId);
            case 'weapon':
            case 'armor':
            case 'accessory':
                this.equipItem(itemId);
                return { type: 'equipped', item: item.name };
        }
        
        return false;
    }

    useConsumable(item, itemId) {
        let result = false;
        
        // Handle different consumable types
        if (item.name === 'Health Potion' || item.healing) {
            const healAmount = item.healing || 25; // Default heal amount
            
            // Check if player needs healing
            if (window.game && window.game.player) {
                const player = window.game.player;
                if (player.currentHealth < player.maxHealth) {
                    const actualHeal = Math.min(healAmount, player.maxHealth - player.currentHealth);
                    player.currentHealth += actualHeal;
                    
                    // Create healing particle effect
                    if (player.particleSystem) {
                        player.particleSystem.createEffect('heal', player.mesh.position);
                    }
                    
                    // Remove one item from inventory
                    this.removeItem(itemId, 1);
                    
                    console.log(`Used ${item.name}, healed for ${actualHeal} HP`);
                    
                    // Show notification
                    if (window.game && window.game.uiManager) {
                        window.game.uiManager.showNotification(`Healed for ${actualHeal} HP!`, 'success');
                    }
                    
                    result = { type: 'heal', amount: actualHeal };
                } else {
                    // Show notification if already at full health
                    if (window.game && window.game.uiManager) {
                        window.game.uiManager.showNotification('Already at full health!', 'info');
                    }
                    result = { type: 'heal', amount: 0, message: 'Already at full health' };
                }
            }
        } else if (item.name === 'Mana Potion' || item.manaRestore) {
            const manaAmount = item.manaRestore || 50; // Default mana restore
            
            if (window.game && window.game.player) {
                const player = window.game.player;
                // Check if player has mana system
                if (player.mana !== undefined && player.maxMana !== undefined) {
                    if (player.mana < player.maxMana) {
                        const actualRestore = Math.min(manaAmount, player.maxMana - player.mana);
                        player.mana += actualRestore;
                        
                        this.removeItem(itemId, 1);
                        console.log(`Used ${item.name}, restored ${actualRestore} mana`);
                        
                        if (window.game && window.game.uiManager) {
                            window.game.uiManager.showNotification(`Restored ${actualRestore} mana!`, 'success');
                        }
                        
                        result = { type: 'mana', amount: actualRestore };
                    } else {
                        if (window.game && window.game.uiManager) {
                            window.game.uiManager.showNotification('Mana already full!', 'info');
                        }
                        result = { type: 'mana', amount: 0, message: 'Mana already full' };
                    }
                } else {
                    // No mana system available
                    if (window.game && window.game.uiManager) {
                        window.game.uiManager.showNotification('Cannot use mana potions yet!', 'error');
                    }
                    result = { type: 'mana', amount: 0, message: 'No mana system' };
                }
            }
        } else if (item.buffType) {
            // Handle buff potions
            if (window.game && window.game.player) {
                const player = window.game.player;
                // Create buff from item properties
                const buff = {
                    id: item.buffType,
                    name: item.name,
                    icon: item.icon || '⚡',
                    description: item.description || 'Temporary enhancement',
                    duration: item.buffDuration || 30,
                    effects: item.buffEffects || {}
                };
                
                player.addBuff(buff);
                this.removeItem(itemId, 1);
                
                console.log(`Used ${item.name}, applied buff: ${buff.name}`);
                
                if (window.game && window.game.uiManager) {
                    window.game.uiManager.showNotification(`Applied ${buff.name}!`, 'success');
                }
                
                result = { type: 'buff', buff: buff };
            }
        } else {
            // Generic consumable with custom effects
            console.log(`Used ${item.name}`);
            this.removeItem(itemId, 1);
            
            if (window.game && window.game.uiManager) {
                window.game.uiManager.showNotification(`Used ${item.name}!`, 'info');
            }
            
            result = { type: 'generic', item: item.name };
        }
        
        return result;
    }
    
    handleSlotClick(slotIndex) {
        const items = Array.from(this.items.values());
        const item = items[slotIndex];
        
        if (item) {
            const slot = this.getEquipmentSlot(item.type);
            if (item.equipped && slot) {
                this.unequipItem(slot);
                if (window.game?.uiManager) {
                    window.game.uiManager.showNotification(`Unequipped ${item.name}`, 'info');
                }
                return { type: 'unequip', item: item.name };
            }

            const result = this.useItem(item.id);
            if (result) {
                // Return result for game to handle (e.g., healing)
                return result;
            }
        }
    }
    
    generateItemId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
    }
    
    updateInventoryDisplay() {
        if (!this.isVisible) return;

        this.syncGoldFromGame();
        
        // Update gold display
        const goldDisplay = document.getElementById('gold-display');
        if (goldDisplay) {
            goldDisplay.textContent = `Gold: ${this.gold}`;
        }
        
        // Update equipment slots
        Object.keys(this.equipment).forEach(slot => {
            const slotElement = document.querySelector(`[data-slot="${slot}"] .slot-item`);
            const item = this.equipment[slot];
            
            if (item) {
                slotElement.textContent = item.name;
                slotElement.style.background = '#2d5a2d';
                slotElement.style.borderColor = '#4caf50';
            } else {
                slotElement.textContent = 'Empty';
                slotElement.style.background = '#333';
                slotElement.style.borderColor = '#555';
            }
        });
        
        // Update inventory grid
        const slots = document.querySelectorAll('.inventory-slot');
        const items = Array.from(this.items.values());
        
        slots.forEach((slot, index) => {
            const item = items[index];
            
            if (item) {
                let displayText = item.name;
                if (item.quantity > 1) {
                    displayText += ` (${item.quantity})`;
                }
                
                // Create secure DOM element instead of innerHTML
                const slotContent = document.createElement('div');
                slotContent.style.cssText = 'text-align: center; font-size: 0.5em; color: white; padding: 2px;';
                slotContent.textContent = displayText; // Use textContent to prevent XSS
                slot.innerHTML = ''; // Clear existing content
                slot.appendChild(slotContent);
                
                // Color coding by type
                const colors = {
                    weapon: '#ff6b6b',
                    armor: '#4ecdc4',
                    accessory: '#ffe66d',
                    consumable: '#a8e6cf',
                    material: '#dda0dd'
                };
                
                slot.style.background = colors[item.type] || '#333';
                slot.style.borderColor = item.equipped ? '#ffeb3b' : '#555';
                
            } else {
                slot.innerHTML = '';
                slot.style.background = '#333';
                slot.style.borderColor = '#555';
            }
        });
    }
    
    toggleInventory() {
        this.isVisible = !this.isVisible;
        const overlay = document.getElementById('inventory-overlay');
        overlay.style.display = this.isVisible ? 'block' : 'none';
        
        if (this.isVisible) {
            this.updateInventoryDisplay();
        }
    }
    
    getEquippedWeapon() {
        return this.equipment.weapon;
    }
    
    getEquippedArmor() {
        return this.equipment.armor;
    }
    
    getTotalAttack() {
        let attack = 10; // Base attack
        if (this.equipment.weapon) {
            attack += this.equipment.weapon.stats?.attack || 0;
        }
        return attack;
    }
    
    getTotalDefense() {
        let defense = 5; // Base defense
        if (this.equipment.armor) {
            defense += this.equipment.armor.stats?.defense || 0;
        }
        return defense;
    }
    
    addGold(amount) {
        this.gold += amount;
        if (window.game) {
            window.game.score = this.gold;
            if (window.game.uiManager) {
                window.game.uiManager.updateGold(this.gold);
            }
        }
        this.updateInventoryDisplay();
    }
    
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            if (window.game) {
                window.game.score = this.gold;
                if (window.game.uiManager) {
                    window.game.uiManager.updateGold(this.gold);
                }
            }
            this.updateInventoryDisplay();
            return true;
        }
        return false;
    }
    
    hasItem(itemName) {
        return Array.from(this.items.values()).some(item => item.name === itemName);
    }
    
    getItemCount(itemName) {
        return this.getItemQuantity(itemName);
    }
    
    updateCharacterDisplay(stats) {
        // Update character stats display in inventory
        this.syncGoldFromGame();
        const levelDisplay = document.getElementById('char-level');
        const healthDisplay = document.getElementById('char-health');
        const attackDisplay = document.getElementById('char-attack');
        const defenseDisplay = document.getElementById('char-defense');
        
        if (levelDisplay) levelDisplay.textContent = stats.level;
        if (healthDisplay) healthDisplay.textContent = stats.health;
        if (attackDisplay) attackDisplay.textContent = stats.attack;
        if (defenseDisplay) defenseDisplay.textContent = stats.defense;
        
        // Update gold display
        const goldDisplay = document.getElementById('gold-display');
        if (goldDisplay) {
            goldDisplay.textContent = `Gold: ${this.gold}`;
        }
    }
    
    dispose() {
        const overlay = document.getElementById('inventory-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    syncGoldFromGame() {
        if (window.game && typeof window.game.score === 'number') {
            this.gold = window.game.score;
        }
    }

    getItemQuantity(itemIdOrName) {
        if (!itemIdOrName) return 0;

        const direct = this.items.get(itemIdOrName);
        if (direct) return direct.quantity || 0;

        let total = 0;
        const name = String(itemIdOrName);
        this.items.forEach(item => {
            if (item.name === name) {
                total += item.quantity || 0;
            }
        });
        return total;
    }

    getAllItems() {
        return Array.from(this.items.values()).map(item => ({ ...item }));
    }

    loadItems(items) {
        this.items.clear();
        this.equipment = { weapon: null, armor: null, accessory: null };

        if (Array.isArray(items)) {
            items.forEach(data => {
                if (!data) return;
                const item = {
                    id: data.id || this.generateItemId(),
                    name: data.name || this.formatItemName(data.id || 'item'),
                    type: data.type || 'consumable',
                    description: data.description || '',
                    value: data.value || 0,
                    stats: data.stats || {},
                    quantity: data.quantity || 1,
                    equipped: !!data.equipped,
                    rarity: data.rarity || 'common',
                    healing: data.healing,
                    manaRestore: data.manaRestore,
                    buffType: data.buffType,
                    buffEffects: data.buffEffects,
                    buffDuration: data.buffDuration,
                    icon: data.icon
                };
                this.items.set(item.id, item);
            });
        }

        // Restore equipment references
        this.items.forEach(item => {
            if (item.equipped) {
                const slot = this.getEquipmentSlot(item.type);
                if (slot) {
                    this.equipment[slot] = item;
                }
            }
        });

        this.applyEquipmentBonuses();
        this.updateInventoryDisplay();
    }

    getEquipmentSlot(itemType) {
        const slotMap = {
            weapon: 'weapon',
            sword: 'weapon',
            bow: 'weapon',
            staff: 'weapon',
            armor: 'armor',
            helmet: 'armor',
            chestplate: 'armor',
            ring: 'accessory',
            amulet: 'accessory',
            accessory: 'accessory'
        };
        return slotMap[itemType] || null;
    }

    applyEquipmentBonuses() {
        this.equipmentBonuses = {
            attack: 0,
            defense: 0,
            speed: 0,
            health: 0
        };

        Object.values(this.equipment).forEach(item => {
            if (item && item.stats) {
                Object.keys(this.equipmentBonuses).forEach(stat => {
                    if (item.stats[stat]) {
                        this.equipmentBonuses[stat] += item.stats[stat];
                    }
                });
            }
        });

        if (window.game?.syncInventoryWithPlayer) {
            window.game.syncInventoryWithPlayer();
        }
    }

    getTotalStats() {
        return {
            attack: this.equipmentBonuses.attack,
            defense: this.equipmentBonuses.defense,
            speed: this.equipmentBonuses.speed,
            maxHealth: this.equipmentBonuses.health
        };
    }

    isStackable(itemType) {
        return ['consumable', 'material', 'herb', 'currency', 'resource'].includes(itemType);
    }

    findStackableItem(itemName, itemType = null) {
        return Array.from(this.items.values()).find(item => {
            if (item.name !== itemName) return false;
            if (!itemType) return true;
            return item.type === itemType;
        });
    }

    formatItemName(itemId) {
        return String(itemId)
            .replace(/[_-]+/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    refreshInventoryDisplay() {
        this.updateInventoryDisplay();
    }
}