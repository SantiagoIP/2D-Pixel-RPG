// Enhanced Quest System with Dynamic Generation
// Supports multiple quest types, procedural generation, and better tracking

export class EnhancedQuestSystem {
    constructor() {
        this.activeQuests = new Map();
        this.completedQuests = new Map();
        this.availableQuests = new Map();
        this.questTemplates = new Map();
        this.dailyQuests = new Map();
        this.lastDailyReset = new Date().toDateString();
        this.questIdCounter = 1000;
        this.isJournalVisible = false;
        
        this.initializeQuestTemplates();
        this.initializeStartingQuests();
        this.generateDailyQuests();
        this.setupQuestUI();
    }
    
    initializeQuestTemplates() {
        // Exploration Quest Templates
        this.questTemplates.set('exploration', [
            {
                id: 'explore_biome',
                title: 'Explore the {biome}',
                description: 'Journey to the {biome} and discover its secrets.',
                type: 'exploration',
                objectives: [
                    { type: 'visit_biome', target: '{biome}', completed: false }
                ],
                baseReward: { gold: 75, experience: 100 },
                difficulty: 'easy'
            },
            {
                id: 'find_location',
                title: 'Discover {location}',
                description: 'Locate and explore the mysterious {location}.',
                type: 'exploration',
                objectives: [
                    { type: 'find_location', target: '{location}', completed: false }
                ],
                baseReward: { gold: 100, experience: 150 },
                difficulty: 'medium'
            }
        ]);
        
        // Combat Quest Templates
        this.questTemplates.set('combat', [
            {
                id: 'slay_monsters',
                title: 'Slay {count} {monster_type}',
                description: 'The {monster_type} have been terrorizing travelers. Eliminate {count} of them.',
                type: 'combat',
                objectives: [
                    { type: 'kill_monster', target: '{monster_type}', current: 0, required: '{count}', completed: false }
                ],
                baseReward: { gold: 50, experience: 80 },
                difficulty: 'medium'
            },
            {
                id: 'eliminate_boss',
                title: 'Defeat the {boss_name}',
                description: 'A powerful {boss_name} has emerged. Defeat it to restore peace.',
                type: 'combat',
                objectives: [
                    { type: 'kill_boss', target: '{boss_name}', completed: false }
                ],
                baseReward: { gold: 200, experience: 300 },
                difficulty: 'hard'
            }
        ]);
        
        // Collection Quest Templates
        this.questTemplates.set('collection', [
            {
                id: 'gather_resources',
                title: 'Gather {count} {resource}',
                description: 'Collect {count} units of {resource} for the village supplies.',
                type: 'collection',
                objectives: [
                    { type: 'collect_item', target: '{resource}', current: 0, required: '{count}', completed: false }
                ],
                baseReward: { gold: 40, experience: 60 },
                difficulty: 'easy'
            },
            {
                id: 'rare_ingredients',
                title: 'Find Rare {ingredient}',
                description: 'Locate and gather {count} rare {ingredient} for magical research.',
                type: 'collection',
                objectives: [
                    { type: 'collect_rare', target: '{ingredient}', current: 0, required: '{count}', completed: false }
                ],
                baseReward: { gold: 120, experience: 180 },
                difficulty: 'hard'
            }
        ]);
        
        // Delivery Quest Templates
        this.questTemplates.set('delivery', [
            {
                id: 'deliver_item',
                title: 'Deliver {item} to {npc}',
                description: 'Take this {item} to {npc} in {location}.',
                type: 'delivery',
                objectives: [
                    { type: 'deliver_to_npc', target: '{npc}', item: '{item}', completed: false }
                ],
                baseReward: { gold: 60, experience: 40 },
                difficulty: 'easy'
            },
            {
                id: 'urgent_delivery',
                title: 'Urgent Delivery to {location}',
                description: 'Time is of the essence! Deliver this package to {location} quickly.',
                type: 'delivery',
                objectives: [
                    { type: 'timed_delivery', target: '{location}', timeLimit: 300, completed: false }
                ],
                baseReward: { gold: 150, experience: 120 },
                difficulty: 'medium'
            }
        ]);
        
        // Crafting Quest Templates
        this.questTemplates.set('crafting', [
            {
                id: 'craft_items',
                title: 'Craft {count} {item}',
                description: 'Use your crafting skills to create {count} {item}.',
                type: 'crafting',
                objectives: [
                    { type: 'craft_item', target: '{item}', current: 0, required: '{count}', completed: false }
                ],
                baseReward: { gold: 80, experience: 100 },
                difficulty: 'medium'
            },
            {
                id: 'master_recipe',
                title: 'Master the {recipe} Recipe',
                description: 'Learn and successfully craft the legendary {recipe}.',
                type: 'crafting',
                objectives: [
                    { type: 'learn_recipe', target: '{recipe}', completed: false },
                    { type: 'craft_masterwork', target: '{recipe}', completed: false }
                ],
                baseReward: { gold: 300, experience: 400 },
                difficulty: 'hard'
            }
        ]);
    }
    
    initializeStartingQuests() {
        // Add initial tutorial and story quests
        this.addQuest({
            id: 'welcome_quest',
            title: 'Welcome to the Realm',
            description: 'Begin your adventure by exploring your surroundings and talking to the locals.',
            type: 'story',
            objectives: [
                { id: 'talk_to_elder', description: 'Speak with Elder Marcus', completed: false, type: 'talk_to_npc', target: 'Elder Marcus' },
                { id: 'explore_village', description: 'Explore the starting area', completed: false, type: 'explore_area', target: 'GREEN_HILLS', progress: 0, required: 100 }
            ],
            rewards: {
                gold: 50,
                experience: 100,
                items: [{ name: 'Traveler\'s Pack', quantity: 1 }]
            },
            priority: 'high',
            region: 'GREEN_HILLS'
        });
        
        // Generate some initial random quests
        this.generateRandomQuests(3);
    }
    
    generateDailyQuests() {
        const currentDate = new Date().toDateString();
        if (this.lastDailyReset !== currentDate) {
            this.dailyQuests.clear();
            this.lastDailyReset = currentDate;
        }
        
        if (this.dailyQuests.size === 0) {
            // Generate 3 daily quests
            for (let i = 0; i < 3; i++) {
                const quest = this.generateRandomQuest('daily');
                if (quest) {
                    quest.isDaily = true;
                    quest.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
                    this.dailyQuests.set(quest.id, quest);
                }
            }
        }
    }
    
    generateRandomQuests(count) {
        for (let i = 0; i < count; i++) {
            const quest = this.generateRandomQuest();
            if (quest) {
                this.availableQuests.set(quest.id, quest);
            }
        }
    }
    
    generateRandomQuest(type = 'random') {
        const questTypes = ['exploration', 'combat', 'collection', 'delivery', 'crafting'];
        const selectedType = questTypes[Math.floor(Math.random() * questTypes.length)];
        const templates = this.questTemplates.get(selectedType);
        
        if (!templates || templates.length === 0) return null;
        
        const template = templates[Math.floor(Math.random() * templates.length)];
        const quest = this.instantiateQuestTemplate(template, type);
        
        return quest;
    }
    
    instantiateQuestTemplate(template, questType = 'random') {
        const quest = JSON.parse(JSON.stringify(template)); // Deep clone
        quest.id = `${template.id}_${this.questIdCounter++}`;
        quest.isGenerated = true;
        quest.generatedType = questType;
        
        // Replace placeholders with actual values
        quest.title = this.replacePlaceholders(quest.title);
        quest.description = this.replacePlaceholders(quest.description);
        
        // Process objectives
        quest.objectives.forEach(objective => {
            Object.keys(objective).forEach(key => {
                if (typeof objective[key] === 'string') {
                    objective[key] = this.replacePlaceholders(objective[key]);
                }
            });
        });
        
        // Scale rewards based on difficulty and type
        const difficultyMultiplier = this.getDifficultyMultiplier(quest.difficulty);
        const typeMultiplier = questType === 'daily' ? 1.5 : 1.0;
        
        quest.rewards = {
            gold: Math.floor(quest.baseReward.gold * difficultyMultiplier * typeMultiplier),
            experience: Math.floor(quest.baseReward.experience * difficultyMultiplier * typeMultiplier),
            items: this.generateQuestRewardItems(quest.difficulty)
        };
        
        return quest;
    }
    
    replacePlaceholders(text) {
        const placeholders = {
            '{biome}': this.getRandomBiome(),
            '{location}': this.getRandomLocation(),
            '{monster_type}': this.getRandomMonsterType(),
            '{boss_name}': this.getRandomBossName(),
            '{count}': this.getRandomCount(),
            '{resource}': this.getRandomResource(),
            '{ingredient}': this.getRandomIngredient(),
            '{item}': this.getRandomItem(),
            '{npc}': this.getRandomNPC(),
            '{recipe}': this.getRandomRecipe()
        };
        
        let result = text;
        Object.keys(placeholders).forEach(placeholder => {
            result = result.replace(new RegExp(placeholder, 'g'), placeholders[placeholder]);
        });
        
        return result;
    }
    
    getRandomBiome() {
        const biomes = ['Mystic Forest', 'Crystal Caves', 'Volcanic Peaks', 'Frozen Wastes', 'Desert Oasis'];
        return biomes[Math.floor(Math.random() * biomes.length)];
    }
    
    getRandomLocation() {
        const locations = ['Ancient Ruins', 'Hidden Grove', 'Abandoned Temple', 'Crystal Lake', 'Windswept Ridge'];
        return locations[Math.floor(Math.random() * locations.length)];
    }
    
    getRandomMonsterType() {
        const monsters = ['Shadow Wolves', 'Crystal Spiders', 'Fire Salamanders', 'Ice Wraiths', 'Sand Scorpions'];
        return monsters[Math.floor(Math.random() * monsters.length)];
    }
    
    getRandomBossName() {
        const bosses = ['Shadowfang Alpha', 'Crystal Queen', 'Flame Lord Pyrion', 'Frost Giant Ymir', 'Sandstorm Titan'];
        return bosses[Math.floor(Math.random() * bosses.length)];
    }
    
    getRandomCount() {
        return Math.floor(Math.random() * 8) + 3; // 3-10
    }
    
    getRandomResource() {
        const resources = ['Iron Ore', 'Wild Herbs', 'Crystal Shards', 'Ancient Wood', 'Magic Essence'];
        return resources[Math.floor(Math.random() * resources.length)];
    }
    
    getRandomIngredient() {
        const ingredients = ['Moonstone Dust', 'Phoenix Feather', 'Dragon Scale', 'Unicorn Hair', 'Starlight Essence'];
        return ingredients[Math.floor(Math.random() * ingredients.length)];
    }
    
    getRandomItem() {
        const items = ['Health Potion', 'Magic Scroll', 'Iron Sword', 'Leather Armor', 'Ancient Tome'];
        return items[Math.floor(Math.random() * items.length)];
    }
    
    getRandomNPC() {
        const npcs = ['Merchant Blake', 'Healer Sarah', 'Guard Captain Tom', 'Wise Oracle Elena', 'Blacksmith Magnus'];
        return npcs[Math.floor(Math.random() * npcs.length)];
    }
    
    getRandomRecipe() {
        const recipes = ['Dragonfire Blade', 'Mooncloak Armor', 'Elixir of Strength', 'Ring of Protection', 'Staff of Storms'];
        return recipes[Math.floor(Math.random() * recipes.length)];
    }
    
    getDifficultyMultiplier(difficulty) {
        switch (difficulty) {
            case 'easy': return 1.0;
            case 'medium': return 1.3;
            case 'hard': return 1.7;
            default: return 1.0;
        }
    }
    
    generateQuestRewardItems(difficulty) {
        const rewardItems = [];
        const itemChance = difficulty === 'hard' ? 0.8 : difficulty === 'medium' ? 0.5 : 0.3;
        
        if (Math.random() < itemChance) {
            const items = [
                { name: 'Health Potion', quantity: Math.floor(Math.random() * 3) + 1 },
                { name: 'Mana Potion', quantity: Math.floor(Math.random() * 2) + 1 },
                { name: 'Enchanted Scroll', quantity: 1 },
                { name: 'Rare Gem', quantity: 1 },
                { name: 'Magic Essence', quantity: Math.floor(Math.random() * 5) + 1 }
            ];
            
            const selectedItem = items[Math.floor(Math.random() * items.length)];
            rewardItems.push(selectedItem);
        }
        
        return rewardItems;
    }
    
    addQuest(quest) {
        this.availableQuests.set(quest.id, quest);
        this.notifyQuestAvailable(quest);
    }
    
    acceptQuest(questId) {
        const quest = this.availableQuests.get(questId) || this.dailyQuests.get(questId);
        if (!quest) return false;
        
        this.activeQuests.set(questId, quest);
        this.availableQuests.delete(questId);
        this.dailyQuests.delete(questId);
        
        this.notifyQuestStarted(quest);
        this.updateQuestDisplay();
        
        return true;
    }
    
    updateQuestProgress(type, target, amount = 1) {
        this.activeQuests.forEach((quest, questId) => {
            quest.objectives.forEach(objective => {
                if (objective.type === type && 
                    (objective.target === target || objective.target === 'any')) {
                    
                    if (objective.hasOwnProperty('current')) {
                        objective.current = Math.min(objective.current + amount, objective.required);
                        if (objective.current >= objective.required) {
                            objective.completed = true;
                        }
                    } else {
                        objective.completed = true;
                    }
                    
                    this.checkQuestCompletion(questId);
                }
            });
        });
        
        this.updateQuestDisplay();
    }
    
    checkQuestCompletion(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return;
        
        const allCompleted = quest.objectives.every(obj => obj.completed);
        if (allCompleted) {
            this.completeQuest(questId);
        }
    }
    
    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return;
        
        // Move to completed quests
        this.completedQuests.set(questId, quest);
        this.activeQuests.delete(questId);
        
        // Grant rewards
        this.grantQuestRewards(quest);
        
        // Show completion notification
        this.notifyQuestCompleted(quest);
        
        // Generate new quests periodically
        if (this.availableQuests.size < 5) {
            this.generateRandomQuests(1);
        }
        
        this.updateQuestDisplay();
    }
    
    grantQuestRewards(quest) {
        if (!quest.rewards) return;
        
        // Grant experience
        if (quest.rewards.experience && window.game?.progressionSystem) {
            window.game.progressionSystem.addExperience(quest.rewards.experience);
        }
        
        // Grant gold
        if (quest.rewards.gold && window.game?.inventorySystem) {
            window.game.inventorySystem.gold += quest.rewards.gold;
            if (window.game.uiManager) {
                window.game.uiManager.updateGold(window.game.inventorySystem.gold);
            }
        }
        
        // Grant items
        if (quest.rewards.items && window.game?.inventorySystem) {
            quest.rewards.items.forEach(item => {
                window.game.inventorySystem.addItem(item);
            });
        }
    }
    
    notifyQuestAvailable(quest) {
        this.showNotification(`📋 New Quest Available: ${quest.title}`, 'info');
    }
    
    notifyQuestStarted(quest) {
        this.showNotification(`✅ Quest Started: ${quest.title}`, 'success');
    }
    
    notifyQuestCompleted(quest) {
        let rewardText = '';
        if (quest.rewards) {
            const parts = [];
            if (quest.rewards.gold) parts.push(`${quest.rewards.gold} gold`);
            if (quest.rewards.experience) parts.push(`${quest.rewards.experience} XP`);
            if (quest.rewards.items && quest.rewards.items.length > 0) {
                parts.push(`${quest.rewards.items.length} item(s)`);
            }
            rewardText = parts.length > 0 ? ` Rewards: ${parts.join(', ')}` : '';
        }
        
        this.showNotification(`🎉 Quest Completed: ${quest.title}!${rewardText}`, 'success');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #4caf50, #388e3c)' : 
                         type === 'warning' ? 'linear-gradient(135deg, #ff9800, #f57c00)' :
                         'linear-gradient(135deg, #2196f3, #1976d2)'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-family: 'Cinzel', serif;
            max-width: 350px;
            z-index: 3000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideInNotification 0.5s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutNotification 0.3s ease-in forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
    }
    
    setupQuestUI() {
        // Add notification animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInNotification {
                0% { transform: translateX(100%); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutNotification {
                0% { transform: translateX(0); opacity: 1; }
                100% { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    updateQuestDisplay() {
        // Update quest journal and UI elements
        if (window.game?.uiManager) {
            // Implementation depends on existing UI structure
            this.updateActiveQuestTracker();
        }
    }
    
    updateActiveQuestTracker() {
        // Show active quest progress in the main UI
        const activeQuest = Array.from(this.activeQuests.values())[0]; // Show first active quest
        if (activeQuest && window.game?.uiManager) {
            // Update the active quest display with current progress
            const progressText = this.getQuestProgressText(activeQuest);
            // Implementation depends on existing UI elements
        }
    }
    
    getQuestProgressText(quest) {
        const completedObjectives = quest.objectives.filter(obj => obj.completed).length;
        const totalObjectives = quest.objectives.length;
        return `${quest.title} (${completedObjectives}/${totalObjectives})`;
    }
    
    // Periodic updates
    update(deltaTime) {
        // Check for expired daily quests
        this.generateDailyQuests();
        
        // Check timed objectives
        this.activeQuests.forEach((quest, questId) => {
            quest.objectives.forEach(objective => {
                if (objective.type === 'timed_delivery' && objective.timeLimit) {
                    objective.timeLimit -= deltaTime;
                    if (objective.timeLimit <= 0 && !objective.completed) {
                        // Quest failed
                        this.failQuest(questId);
                    }
                }
            });
        });
    }
    
    failQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return;
        
        this.activeQuests.delete(questId);
        this.showNotification(`❌ Quest Failed: ${quest.title}`, 'warning');
        this.updateQuestDisplay();
    }
    
    // Save/Load functionality
    saveQuestData() {
        return {
            activeQuests: Array.from(this.activeQuests.entries()),
            completedQuests: Array.from(this.completedQuests.entries()),
            availableQuests: Array.from(this.availableQuests.entries()),
            dailyQuests: Array.from(this.dailyQuests.entries()),
            lastDailyReset: this.lastDailyReset,
            questIdCounter: this.questIdCounter
        };
    }
    
    loadQuestData(data) {
        if (!data) return;
        
        this.activeQuests = new Map(data.activeQuests || []);
        this.completedQuests = new Map(data.completedQuests || []);
        this.availableQuests = new Map(data.availableQuests || []);
        this.dailyQuests = new Map(data.dailyQuests || []);
        this.lastDailyReset = data.lastDailyReset || new Date().toDateString();
        this.questIdCounter = data.questIdCounter || 1000;
        
        this.updateQuestDisplay();
    }
}