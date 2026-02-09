// Enhanced Character Progression System
// Handles leveling, stat upgrades, skill trees, and equipment enhancement

export class CharacterProgressionSystem {
    constructor() {
        this.playerLevel = 1;
        this.experience = 0;
        this.experienceToNext = 100;
        this.attributePoints = 0;
        this.skillPoints = 0;
        
        // Core Attributes
        this.attributes = {
            strength: { base: 10, bonus: 0, description: "Increases damage and carrying capacity" },
            dexterity: { base: 10, bonus: 0, description: "Improves attack speed and accuracy" },
            intelligence: { base: 10, bonus: 0, description: "Enhances mana and spell effectiveness" },
            constitution: { base: 10, bonus: 0, description: "Increases health and stamina" },
            wisdom: { base: 10, bonus: 0, description: "Improves mana regeneration and resistance" },
            charisma: { base: 10, bonus: 0, description: "Better prices and dialogue options" }
        };
        
        // Skill Trees
        this.skillTrees = {
            combat: {
                name: "Combat Mastery",
                skills: {
                    swordMastery: { level: 0, maxLevel: 5, description: "Increases sword damage by 10% per level" },
                    archery: { level: 0, maxLevel: 5, description: "Increases bow damage and accuracy" },
                    magicCombat: { level: 0, maxLevel: 5, description: "Enhances spell damage and casting speed" },
                    criticalStrike: { level: 0, maxLevel: 3, description: "Chance for critical hits" },
                    dualWielding: { level: 0, maxLevel: 3, description: "Ability to wield two weapons" }
                }
            },
            survival: {
                name: "Survival Skills",
                skills: {
                    foraging: { level: 0, maxLevel: 5, description: "Find more resources when gathering" },
                    cooking: { level: 0, maxLevel: 5, description: "Create better food and potions" },
                    stealth: { level: 0, maxLevel: 5, description: "Move undetected by enemies" },
                    hunting: { level: 0, maxLevel: 3, description: "Track and hunt animals more effectively" },
                    herbalism: { level: 0, maxLevel: 5, description: "Identify and use medicinal plants" }
                }
            },
            crafting: {
                name: "Crafting Arts",
                skills: {
                    blacksmithing: { level: 0, maxLevel: 5, description: "Craft better weapons and armor" },
                    enchanting: { level: 0, maxLevel: 5, description: "Add magical properties to items" },
                    alchemy: { level: 0, maxLevel: 5, description: "Create powerful potions and elixirs" },
                    leatherworking: { level: 0, maxLevel: 3, description: "Craft leather armor and accessories" },
                    jewelcrafting: { level: 0, maxLevel: 3, description: "Create magical jewelry and gems" }
                }
            },
            magic: {
                name: "Arcane Arts",
                skills: {
                    destruction: { level: 0, maxLevel: 5, description: "Offensive magic spells" },
                    restoration: { level: 0, maxLevel: 5, description: "Healing and protective magic" },
                    illusion: { level: 0, maxLevel: 3, description: "Mind control and invisibility" },
                    conjuration: { level: 0, maxLevel: 3, description: "Summon creatures and weapons" },
                    transmutation: { level: 0, maxLevel: 3, description: "Transform matter and energy" }
                }
            }
        };
        
        // Equipment Enhancement System
        this.enhancementMaterials = {
            common: { name: "Iron Ore", cost: 10, bonusMultiplier: 1.1 },
            uncommon: { name: "Silver Ore", cost: 25, bonusMultiplier: 1.25 },
            rare: { name: "Gold Ore", cost: 50, bonusMultiplier: 1.5 },
            epic: { name: "Mithril Ore", cost: 100, bonusMultiplier: 2.0 },
            legendary: { name: "Adamantine Ore", cost: 250, bonusMultiplier: 3.0 }
        };
        
        // Achievements System
        this.achievements = new Map();
        this.initializeAchievements();
        
        this.setupProgressionUI();
    }
    
    initializeAchievements() {
        const achievements = [
            { id: 'first_level', name: 'Growing Stronger', description: 'Reach level 2', reward: { gold: 50, skillPoints: 1 } },
            { id: 'level_5', name: 'Experienced Adventurer', description: 'Reach level 5', reward: { gold: 200, attributePoints: 2 } },
            { id: 'level_10', name: 'Veteran Warrior', description: 'Reach level 10', reward: { gold: 500, skillPoints: 3 } },
            { id: 'master_crafter', name: 'Master Craftsman', description: 'Max out any crafting skill', reward: { gold: 300, recipe: 'Legendary Weapon' } },
            { id: 'spell_master', name: 'Arcane Master', description: 'Max out any magic skill', reward: { gold: 400, spell: 'Meteor' } },
            { id: 'skill_collector', name: 'Jack of All Trades', description: 'Have at least 1 point in every skill tree', reward: { attributePoints: 5 } }
        ];
        
        achievements.forEach(achievement => {
            this.achievements.set(achievement.id, { ...achievement, unlocked: false });
        });
    }
    
    addExperience(amount) {
        this.experience += amount;
        
        while (this.experience >= this.experienceToNext) {
            this.levelUp();
        }
        
        this.updateProgressionDisplay();
    }
    
    levelUp() {
        this.experience -= this.experienceToNext;
        this.playerLevel++;
        this.attributePoints += 2; // 2 attribute points per level
        this.skillPoints += 1; // 1 skill point per level
        
        // Increase XP requirement for next level
        this.experienceToNext = Math.floor(this.experienceToNext * 1.15);
        
        // Check for achievements
        this.checkAchievements();
        
        // Show level up notification
        this.showLevelUpNotification();
        
        // Heal player on level up (classic RPG mechanic)
        if (window.game && window.game.player) {
            window.game.player.currentHealth = window.game.player.maxHealth;
            window.game.player.mana = window.game.player.maxMana;
        }
    }
    
    upgradeAttribute(attributeName) {
        if (this.attributePoints > 0 && this.attributes[attributeName]) {
            this.attributes[attributeName].bonus++;
            this.attributePoints--;
            this.applyAttributeBonuses();
            this.updateProgressionDisplay();
            return true;
        }
        return false;
    }
    
    upgradeSkill(treeId, skillId) {
        const skill = this.skillTrees[treeId]?.skills[skillId];
        if (skill && this.skillPoints > 0 && skill.level < skill.maxLevel) {
            skill.level++;
            this.skillPoints--;
            this.applySkillBonuses();
            this.updateProgressionDisplay();
            this.checkAchievements();
            return true;
        }
        return false;
    }
    
    applyAttributeBonuses() {
        if (!window.game || !window.game.player) return;
        
        const player = window.game.player;
        const totalStr = this.attributes.strength.base + this.attributes.strength.bonus;
        const totalDex = this.attributes.dexterity.base + this.attributes.dexterity.bonus;
        const totalInt = this.attributes.intelligence.base + this.attributes.intelligence.bonus;
        const totalCon = this.attributes.constitution.base + this.attributes.constitution.bonus;
        const totalWis = this.attributes.wisdom.base + this.attributes.wisdom.bonus;
        
        // Apply bonuses
        player.baseAttackDamage = Math.floor(1 + (totalStr - 10) * 0.1);
        player.attackSpeed = Math.max(0.3, 1.0 - (totalDex - 10) * 0.02);
        player.maxMana = Math.floor(50 + (totalInt - 10) * 5);
        player.maxHealth = Math.floor(100 + (totalCon - 10) * 10);
        player.manaRegenRate = 1 + (totalWis - 10) * 0.1;
        
        // Ensure current values don't exceed max
        player.currentHealth = Math.min(player.currentHealth, player.maxHealth);
        player.currentMana = Math.min(player.currentMana, player.maxMana);
    }
    
    applySkillBonuses() {
        if (!window.game || !window.game.player) return;
        
        const player = window.game.player;
        
        // Combat bonuses
        const swordLevel = this.skillTrees.combat.skills.swordMastery.level;
        const archeryLevel = this.skillTrees.combat.skills.archery.level;
        const magicLevel = this.skillTrees.combat.skills.magicCombat.level;
        const critLevel = this.skillTrees.combat.skills.criticalStrike.level;
        
        player.swordDamageBonus = 1 + (swordLevel * 0.1);
        player.bowDamageBonus = 1 + (archeryLevel * 0.1);
        player.magicDamageBonus = 1 + (magicLevel * 0.15);
        player.criticalChance = critLevel * 0.05; // 5% per level
        
        // Apply other skill bonuses...
        this.applyResourceGatheringBonuses();
        this.applyCraftingBonuses();
    }
    
    applyResourceGatheringBonuses() {
        const foragingLevel = this.skillTrees.survival.skills.foraging.level;
        const huntingLevel = this.skillTrees.survival.skills.hunting.level;
        
        if (window.game) {
            window.game.resourceGatheringBonus = 1 + (foragingLevel * 0.2);
            window.game.huntingEfficiency = 1 + (huntingLevel * 0.15);
        }
    }
    
    applyCraftingBonuses() {
        const blacksmithLevel = this.skillTrees.crafting.skills.blacksmithing.level;
        const alchemyLevel = this.skillTrees.crafting.skills.alchemy.level;
        const enchantingLevel = this.skillTrees.crafting.skills.enchanting.level;
        
        if (window.game && window.game.craftingSystem) {
            window.game.craftingSystem.blacksmithBonus = 1 + (blacksmithLevel * 0.1);
            window.game.craftingSystem.alchemyBonus = 1 + (alchemyLevel * 0.15);
            window.game.craftingSystem.enchantingPower = enchantingLevel;
        }
    }
    
    enhanceEquipment(item, materialType) {
        const material = this.enhancementMaterials[materialType];
        if (!material || !item.stats) return false;
        
        // Check if player has required materials and gold
        if (window.game && window.game.inventorySystem) {
            const inventory = window.game.inventorySystem;
            if (inventory.gold < material.cost) return false;
            
            // Deduct cost
            inventory.gold -= material.cost;
            
            // Enhance item stats
            item.enhancementLevel = (item.enhancementLevel || 0) + 1;
            item.enhancementType = materialType;
            
            for (const stat in item.stats) {
                item.stats[stat] = Math.floor(item.stats[stat] * material.bonusMultiplier);
            }
            
            // Update item name to reflect enhancement
            const enhancementNames = { common: "+1", uncommon: "+2", rare: "+3", epic: "+4", legendary: "+5" };
            if (!item.name.includes("+")) {
                item.name += ` ${enhancementNames[materialType]}`;
            }
            
            return true;
        }
        
        return false;
    }
    
    checkAchievements() {
        this.achievements.forEach((achievement, id) => {
            if (achievement.unlocked) return;
            
            let unlocked = false;
            
            switch (id) {
                case 'first_level':
                    unlocked = this.playerLevel >= 2;
                    break;
                case 'level_5':
                    unlocked = this.playerLevel >= 5;
                    break;
                case 'level_10':
                    unlocked = this.playerLevel >= 10;
                    break;
                case 'master_crafter':
                    unlocked = Object.values(this.skillTrees.crafting.skills).some(skill => skill.level >= skill.maxLevel);
                    break;
                case 'spell_master':
                    unlocked = Object.values(this.skillTrees.magic.skills).some(skill => skill.level >= skill.maxLevel);
                    break;
                case 'skill_collector':
                    unlocked = Object.values(this.skillTrees).every(tree => 
                        Object.values(tree.skills).some(skill => skill.level > 0)
                    );
                    break;
            }
            
            if (unlocked) {
                this.unlockAchievement(id);
            }
        });
    }
    
    unlockAchievement(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || achievement.unlocked) return;
        
        achievement.unlocked = true;
        
        // Apply rewards
        if (achievement.reward.gold && window.game?.inventorySystem) {
            window.game.inventorySystem.gold += achievement.reward.gold;
        }
        if (achievement.reward.attributePoints) {
            this.attributePoints += achievement.reward.attributePoints;
        }
        if (achievement.reward.skillPoints) {
            this.skillPoints += achievement.reward.skillPoints;
        }
        
        // Show achievement notification
        this.showAchievementNotification(achievement);
    }
    
    showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
            color: #000;
            padding: 25px 40px;
            border-radius: 15px;
            font-family: 'Cinzel', serif;
            font-weight: bold;
            font-size: 1.5rem;
            text-align: center;
            z-index: 3000;
            box-shadow: 
                0 0 30px rgba(255, 215, 0, 0.8),
                0 8px 25px rgba(0, 0, 0, 0.4);
            animation: levelUpAnimation 3s ease-out forwards;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 10px;">🎉 LEVEL UP! 🎉</div>
            <div>You are now level ${this.playerLevel}!</div>
            <div style="font-size: 1rem; margin-top: 10px;">
                +${this.attributePoints > 0 ? '2 Attribute Points' : ''} 
                ${this.attributePoints > 0 && this.skillPoints > 0 ? ' • ' : ''}
                +${this.skillPoints > 0 ? '1 Skill Point' : ''}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            font-family: 'Cinzel', serif;
            max-width: 300px;
            z-index: 2500;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            animation: slideInRight 0.5s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">🏆 Achievement Unlocked!</div>
            <div style="font-size: 1.1rem; margin-bottom: 5px;">${achievement.name}</div>
            <div style="font-size: 0.9rem; opacity: 0.9;">${achievement.description}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 4000);
    }
    
    setupProgressionUI() {
        // Add CSS for progression system
        const style = document.createElement('style');
        style.textContent = `
            @keyframes levelUpAnimation {
                0% { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) scale(0.5); 
                    filter: blur(10px);
                }
                20% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1.1); 
                    filter: blur(0);
                }
                80% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1); 
                }
                100% { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) scale(0.9); 
                }
            }
            
            @keyframes slideInRight {
                0% { 
                    opacity: 0; 
                    transform: translateX(100%); 
                }
                100% { 
                    opacity: 1; 
                    transform: translateX(0); 
                }
            }
            
            .progression-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.85);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                font-family: 'Cinzel', serif;
            }
            
            .progression-panel {
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                border: 4px solid #d4af37;
                border-radius: 20px;
                padding: 30px;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                color: #f0f6fc;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    updateProgressionDisplay() {
        // Update any UI elements that show progression info
        if (window.game?.uiManager) {
            window.game.uiManager.updatePlayerStats(this.getPlayerStats());
        }
    }
    
    getPlayerStats() {
        return {
            level: this.playerLevel,
            experience: this.experience,
            experienceToNext: this.experienceToNext,
            attributePoints: this.attributePoints,
            skillPoints: this.skillPoints,
            attributes: this.attributes,
            totalSkillLevels: this.getTotalSkillLevels()
        };
    }
    
    getTotalSkillLevels() {
        let total = 0;
        Object.values(this.skillTrees).forEach(tree => {
            Object.values(tree.skills).forEach(skill => {
                total += skill.level;
            });
        });
        return total;
    }
    
    // Save/Load functionality
    saveProgress() {
        return {
            playerLevel: this.playerLevel,
            experience: this.experience,
            experienceToNext: this.experienceToNext,
            attributePoints: this.attributePoints,
            skillPoints: this.skillPoints,
            attributes: this.attributes,
            skillTrees: this.skillTrees,
            achievements: Array.from(this.achievements.entries())
        };
    }
    
    loadProgress(data) {
        if (!data) return;
        
        this.playerLevel = data.playerLevel || 1;
        this.experience = data.experience || 0;
        this.experienceToNext = data.experienceToNext || 100;
        this.attributePoints = data.attributePoints || 0;
        this.skillPoints = data.skillPoints || 0;
        
        if (data.attributes) this.attributes = { ...this.attributes, ...data.attributes };
        if (data.skillTrees) this.skillTrees = { ...this.skillTrees, ...data.skillTrees };
        if (data.achievements) {
            this.achievements = new Map(data.achievements);
        }
        
        // Apply all bonuses after loading
        this.applyAttributeBonuses();
        this.applySkillBonuses();
        this.updateProgressionDisplay();
    }
}