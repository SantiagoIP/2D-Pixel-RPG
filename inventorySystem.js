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
    
    addItem(itemData) {
        const existingItem = Array.from(this.items.values())
            .find(item => item.name === itemData.name && item.type === itemData.type);
        
        if (existingItem && itemData.type === 'consumable') {
            // Stack consumables
            existingItem.quantity = (existingItem.quantity || 1) + (itemData.quantity || 1);
        } else {
            // Add new item
            const item = {
                ...itemData,
                id: itemData.id || this.generateItemId(),
                quantity: itemData.quantity || 1
            };
            this.items.set(item.id, item);
            
            // Auto-equip if it's the first item of its type
            if (itemData.equipped || (!this.equipment[item.type] && 
                ['weapon', 'armor', 'accessory'].includes(item.type))) {
                this.equipItem(item.id);
            }
        }
        
        this.updateInventoryDisplay();
        return true;
    }
    
    removeItem(itemId, quantity = 1) {
        const item = this.items.get(itemId);
        if (!item) return false;
        
        if (item.quantity > quantity) {
            item.quantity -= quantity;
        } else {
            this.items.delete(itemId);
            // Unequip if currently equipped
            Object.keys(this.equipment).forEach(slot => {
                if (this.equipment[slot]?.id === itemId) {
                    this.equipment[slot] = null;
                }
            });
        }
        
        this.updateInventoryDisplay();
        return true;
    }
    
    equipItem(itemId) {
        const item = this.items.get(itemId);
        if (!item || !['weapon', 'armor', 'accessory'].includes(item.type)) {
            return false;
        }
        
        // Unequip current item in that slot
        if (this.equipment[item.type]) {
            this.equipment[item.type].equipped = false;
        }
        
        // Equip new item
        this.equipment[item.type] = item;
        item.equipped = true;
        
        this.updateInventoryDisplay();
        return true;
    }
    
    useItem(itemId) {
        const item = this.items.get(itemId);
        if (!item) return false;
        
        switch (item.type) {
            case 'consumable':
                if (item.healing) {
                    // Heal player - this would need to be connected to player object
                    console.log(`Used ${item.name}, healing for ${item.healing}`);
                    this.removeItem(itemId, 1);
                    return { type: 'heal', amount: item.healing };
                }
                break;
            case 'weapon':
            case 'armor':
            case 'accessory':
                this.equipItem(itemId);
                break;
        }
        
        return false;
    }
    
    handleSlotClick(slotIndex) {
        const items = Array.from(this.items.values());
        const item = items[slotIndex];
        
        if (item) {
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
        
        // Update gold display
        document.getElementById('gold-display').textContent = `Gold: ${this.gold}`;
        
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
        this.updateInventoryDisplay();
    }
    
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.updateInventoryDisplay();
            return true;
        }
        return false;
    }
    
    hasItem(itemName) {
        return Array.from(this.items.values()).some(item => item.name === itemName);
    }
    
    getItemCount(itemName) {
        const item = Array.from(this.items.values()).find(item => item.name === itemName);
        return item ? item.quantity : 0;
    }
    
    updateCharacterDisplay(stats) {
        // Update character stats display in inventory
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
    
    // Enhanced add item with equipment support
    addItem(itemId, quantity = 1, itemData = null) {
        if (this.items.has(itemId)) {
            const existingItem = this.items.get(itemId);
            existingItem.quantity += quantity;
        } else {
            this.items.set(itemId, { 
                quantity, 
                type: itemData?.type || 'consumable',
                stats: itemData?.stats || {},
                description: itemData?.description || '',
                rarity: itemData?.rarity || 'common'
            });
        }
        console.log(`Added ${quantity} ${itemId}(s) to inventory`);
        this.refreshInventoryDisplay();
    }
    
    // New equipment methods
    equipItem(itemId) {
        const item = this.items.get(itemId);
        if (!item) return false;
        
        const equipSlot = this.getEquipmentSlot(item.type);
        if (!equipSlot) return false;
        
        // Unequip current item in slot if any
        if (this.equipment[equipSlot]) {
            this.unequipItem(equipSlot);
        }
        
        // Equip new item
        this.equipment[equipSlot] = {
            id: itemId,
            ...item
        };
        
        // Remove from inventory
        this.removeItem(itemId, 1);
        
        // Apply stat bonuses
        this.applyEquipmentBonuses();
        
        console.log(`Equipped ${itemId} in ${equipSlot} slot`);
        this.refreshInventoryDisplay();
        return true;
    }
    
    unequipItem(slot) {
        const equipped = this.equipment[slot];
        if (!equipped) return false;
        
        // Add back to inventory
        this.addItem(equipped.id, 1, {
            type: equipped.type,
            stats: equipped.stats,
            description: equipped.description,
            rarity: equipped.rarity
        });
        
        // Remove from equipment
        this.equipment[slot] = null;
        
        // Recalculate bonuses
        this.applyEquipmentBonuses();
        
        console.log(`Unequipped ${equipped.id} from ${slot} slot`);
        this.refreshInventoryDisplay();
        return true;
    }
    
    getEquipmentSlot(itemType) {
        const slotMap = {
            'weapon': 'weapon',
            'sword': 'weapon',
            'bow': 'weapon', 
            'staff': 'weapon',
            'armor': 'armor',
            'helmet': 'armor',
            'chestplate': 'armor',
            'ring': 'accessory',
            'amulet': 'accessory'
        };
        return slotMap[itemType] || null;
    }
    
    applyEquipmentBonuses() {
        // Reset bonuses
        this.equipmentBonuses = {
            attack: 0,
            defense: 0,
            speed: 0,
            health: 0
        };
        
        // Calculate total bonuses from all equipped items
        Object.values(this.equipment).forEach(item => {
            if (item && item.stats) {
                Object.keys(this.equipmentBonuses).forEach(stat => {
                    if (item.stats[stat]) {
                        this.equipmentBonuses[stat] += item.stats[stat];
                    }
                });
            }
        });
        
        console.log('Equipment bonuses updated:', this.equipmentBonuses);
    }
    
    getTotalStats() {
        return {
            attack: this.playerStats.attack + this.equipmentBonuses.attack,
            defense: this.playerStats.defense + this.equipmentBonuses.defense,
            speed: this.playerStats.speed + this.equipmentBonuses.speed,
            maxHealth: this.playerStats.maxHealth + this.equipmentBonuses.health
        };
    }
    
    setupEquipmentUI() {
        // Equipment panel will be added to existing inventory UI
        // This will be integrated with the main inventory display
    }
    
    // Enhanced inventory display with equipment
    refreshInventoryDisplay() {
        if (!this.isVisible || !this.overlay) return;
        
        const inventoryGrid = this.overlay.querySelector('.inventory-grid');
        const equipmentPanel = this.overlay.querySelector('.equipment-panel');
        
        if (inventoryGrid) {
            inventoryGrid.innerHTML = '';
            
            // Display regular inventory items
            this.items.forEach((item, itemId) => {
                const itemElement = this.createItemElement(itemId, item);
                inventoryGrid.appendChild(itemElement);
            });
        }
        
        // Update equipment panel
        if (equipmentPanel) {
            this.updateEquipmentPanel(equipmentPanel);
        }
        
        // Update stats display
        this.updateStatsDisplay();
    }
    
    updateEquipmentPanel(panel) {
        panel.innerHTML = `
            <h3>Equipment</h3>
            <div class="equipment-slots">
                <div class="equipment-slot weapon-slot">
                    <div class="slot-label">Weapon</div>
                    <div class="slot-content">
                        ${this.equipment.weapon ? this.createEquippedItemDisplay(this.equipment.weapon) : '<div class="empty-slot">Empty</div>'}
                    </div>
                </div>
                <div class="equipment-slot armor-slot">
                    <div class="slot-label">Armor</div>
                    <div class="slot-content">
                        ${this.equipment.armor ? this.createEquippedItemDisplay(this.equipment.armor) : '<div class="empty-slot">Empty</div>'}
                    </div>
                </div>
                <div class="equipment-slot accessory-slot">
                    <div class="slot-label">Accessory</div>
                    <div class="slot-content">
                        ${this.equipment.accessory ? this.createEquippedItemDisplay(this.equipment.accessory) : '<div class="empty-slot">Empty</div>'}
                    </div>
                </div>
            </div>
        `;
    }
    
    createEquippedItemDisplay(item) {
        const rarityClass = item.rarity || 'common';
        const statsText = Object.entries(item.stats || {})
            .map(([stat, value]) => `${stat}: +${value}`)
            .join(', ');
        
        return `
            <div class="equipped-item ${rarityClass}" data-item="${item.id}">
                <div class="item-name">${this.formatItemName(item.id)}</div>
                ${statsText ? `<div class="item-stats">${statsText}</div>` : ''}
                <button class="unequip-btn" onclick="window.game.inventorySystem.unequipItem('${this.getEquipmentSlot(item.type)}')">Unequip</button>
            </div>
        `;
    }
    
    // Enhanced item element creation with equip functionality
    createItemElement(itemId, item) {
        const element = document.createElement('div');
        element.className = `inventory-item ${item.rarity || 'common'}`;
        element.dataset.itemId = itemId;
        
        const isEquippable = this.getEquipmentSlot(item.type) !== null;
        const statsText = Object.entries(item.stats || {})
            .map(([stat, value]) => `${stat}: +${value}`)
            .join(', ');
        
        element.innerHTML = `
            <div class="item-name">${this.formatItemName(itemId)}</div>
            <div class="item-quantity">x${item.quantity}</div>
            ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
            ${statsText ? `<div class="item-stats">${statsText}</div>` : ''}
            <div class="item-actions">
                ${isEquippable ? `<button onclick="window.game.inventorySystem.equipItem('${itemId}')">Equip</button>` : ''}
                ${item.type === 'consumable' ? `<button onclick="window.game.inventorySystem.useItem('${itemId}')">Use</button>` : ''}
            </div>
        `;
        
        return element;
    }
} 