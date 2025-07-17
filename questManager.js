export class QuestManager {
    constructor() {
        this.activeQuests = new Map();
        this.completedQuests = new Map();
        this.availableQuests = new Map();
        this.isJournalVisible = false;
        
        this.setupQuestSystem();
        this.initializeStartingQuests();
    }
    
    initializeStartingQuests() {
        // Add some starting quests
        this.addAvailableQuest({
            id: 'welcome_quest',
            title: 'Welcome to the Realm',
            description: 'Explore your surroundings and talk to the village elder.',
            giver: 'Elder Marcus',
            objectives: [
                { id: 'talk_to_elder', description: 'Speak with Elder Marcus', completed: false, type: 'talk_to_npc', target: 'Elder Marcus' },
                { id: 'explore_village', description: 'Walk around the village area', completed: false, type: 'explore_area', target: 'GREEN_HILLS', progress: 0, required: 50 }
            ],
            rewards: {
                gold: 25,
                experience: 50,
                items: []
            },
            type: 'main',
            region: 'GREEN_HILLS'
        });
        
        this.addAvailableQuest({
            id: 'gather_herbs',
            title: 'Herbalist\'s Request',
            description: 'Collect healing herbs from around the village.',
            giver: 'Trader Emma',
            objectives: [
                { id: 'collect_herbs', description: 'Collect 5 healing herbs', completed: false, current: 0, target: 5 }
            ],
            rewards: {
                gold: 15,
                experience: 25,
                items: [{ name: 'Health Potion', quantity: 2 }]
            },
            type: 'side',
            region: 'GREEN_HILLS'
        });
    }
    
    setupQuestSystem() {
        // Create quest journal overlay
        const overlay = document.createElement('div');
        overlay.id = 'quest-journal-overlay';
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
        
        // Main journal panel
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 900px;
            height: 700px;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border: 4px solid #ffeb3b;
            border-radius: 8px;
            box-shadow: 0 0 30px rgba(0,0,0,0.9);
            display: flex;
        `;
        
        // Left sidebar - Quest categories
        const sidebar = document.createElement('div');
        sidebar.style.cssText = `
            width: 250px;
            background: #1a1a1a;
            border-right: 2px solid #444;
            padding: 20px;
        `;
        
        sidebar.innerHTML = `
            <h2 style="color: #ffeb3b; margin: 0 0 20px 0; font-size: 1em; text-align: center;">Quest Journal</h2>
            <div class="quest-categories">
                <div class="quest-category active" data-category="active">
                    <span style="color: #4caf50; font-size: 0.7em;">• Active Quests</span>
                    <span id="active-quest-count" style="color: #aaa; font-size: 0.6em; float: right;">0</span>
                </div>
                <div class="quest-category" data-category="completed">
                    <span style="color: #2196f3; font-size: 0.7em;">• Completed</span>
                    <span id="completed-quest-count" style="color: #aaa; font-size: 0.6em; float: right;">0</span>
                </div>
                <div class="quest-category" data-category="available">
                    <span style="color: #ff9800; font-size: 0.7em;">• Available</span>
                    <span id="available-quest-count" style="color: #aaa; font-size: 0.6em; float: right;">0</span>
                </div>
            </div>
        `;
        
        // Main content area
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
        `;
        
        // Quest list
        const questList = document.createElement('div');
        questList.id = 'quest-list';
        questList.style.cssText = `
            width: 300px;
            background: #222;
            border-right: 2px solid #444;
            overflow-y: auto;
            max-height: 100%;
        `;
        
        // Quest details
        const questDetails = document.createElement('div');
        questDetails.id = 'quest-details';
        questDetails.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: #2a2a2a;
        `;
        
        questDetails.innerHTML = `
            <div id="quest-detail-content">
                <div style="text-align: center; color: #666; font-size: 0.7em; margin-top: 100px;">
                    Select a quest to view details
                </div>
            </div>
        `;
        
        content.appendChild(questList);
        content.appendChild(questDetails);
        
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
        closeButton.addEventListener('click', () => this.toggleJournal());
        
        panel.appendChild(sidebar);
        panel.appendChild(content);
        panel.appendChild(closeButton);
        overlay.appendChild(panel);
        
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
        controls.textContent = 'Click quests to view details • J to close';
        overlay.appendChild(controls);
        
        document.body.appendChild(overlay);
        
        // Add event listeners for quest categories
        const categories = document.querySelectorAll('.quest-category');
        categories.forEach(category => {
            category.style.cssText = `
                padding: 10px;
                margin: 5px 0;
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.2s;
                border: 2px solid transparent;
            `;
            
            category.addEventListener('click', () => {
                // Remove active class from all categories
                categories.forEach(c => {
                    c.classList.remove('active');
                    c.style.background = 'transparent';
                    c.style.borderColor = 'transparent';
                });
                
                // Add active class to clicked category
                category.classList.add('active');
                category.style.background = '#333';
                category.style.borderColor = '#ffeb3b';
                
                // Update quest list
                this.updateQuestList(category.dataset.category);
            });
        });
    }
    
    addAvailableQuest(questData) {
        this.availableQuests.set(questData.id, questData);
        this.updateQuestCounts();
    }
    
    startQuest(questId) {
        const quest = this.availableQuests.get(questId);
        if (!quest) return false;
        
        // Move quest from available to active
        this.availableQuests.delete(questId);
        this.activeQuests.set(questId, {
            ...quest,
            startTime: Date.now(),
            status: 'active'
        });
        
        this.updateQuestCounts();
        console.log(`Started quest: ${quest.title}`);
        return true;
    }
    
    updateQuestObjective(questId, objectiveId, progress = 1) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;
        
        const objective = quest.objectives.find(obj => obj.id === objectiveId);
        if (!objective) return false;
        
        if (objective.target) {
            // Progress-based objective
            objective.current = Math.min(objective.current + progress, objective.target);
            if (objective.current >= objective.target) {
                objective.completed = true;
            }
        } else {
            // Simple completion objective
            objective.completed = true;
        }
        
        // Check if quest is complete
        this.checkQuestCompletion(questId);
        this.updateQuestDisplay();
        
        return true;
    }
    
    checkQuestCompletion(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;
        
        const allCompleted = quest.objectives.every(obj => obj.completed);
        if (allCompleted) {
            this.completeQuest(questId);
        }
        
        return allCompleted;
    }
    
    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;
        
        // Move quest to completed
        this.activeQuests.delete(questId);
        quest.completedTime = Date.now();
        quest.status = 'completed';
        this.completedQuests.set(questId, quest);
        
        this.updateQuestCounts();
        console.log(`Completed quest: ${quest.title}`);
        
        // Distribute rewards
        this.distributeQuestRewards(quest);
        
        // Show completion notification
        this.showQuestCompletionNotification(quest);
        
        return quest.rewards;
    }

    distributeQuestRewards(quest) {
        if (!quest.rewards) return;
        
        const rewards = quest.rewards;
        
        // Give gold
        if (rewards.gold && window.game) {
            window.game.score += rewards.gold;
            window.game.uiManager.playerGold = window.game.score;
            window.game.uiManager.updateGold(window.game.score);
            console.log(`Quest reward: +${rewards.gold} gold`);
        }
        
        // Give experience
        if (rewards.experience && window.game && window.game.player) {
            const leveledUp = window.game.player.addExperience(rewards.experience);
            console.log(`Quest reward: +${rewards.experience} experience`);
            
            if (leveledUp) {
                window.game.handleLevelUp();
            }
        }
        
        // Give items
        if (rewards.items && rewards.items.length > 0 && window.game && window.game.inventorySystem) {
            rewards.items.forEach(rewardItem => {
                const item = {
                    id: `quest_reward_${rewardItem.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
                    name: rewardItem.name,
                    type: rewardItem.type || 'consumable',
                    description: `Quest reward: ${rewardItem.description || rewardItem.name}`,
                    quantity: rewardItem.quantity || 1,
                    value: rewardItem.value || 0,
                    stats: rewardItem.stats || {}
                };
                
                window.game.inventorySystem.addItem(item);
                console.log(`Quest reward: +${item.quantity} ${item.name}`);
            });
        }
        
        // Show reward notification
        if (window.game && window.game.uiManager) {
            let rewardText = 'Quest Completed! Rewards: ';
            const rewardParts = [];
            
            if (rewards.gold) rewardParts.push(`${rewards.gold} gold`);
            if (rewards.experience) rewardParts.push(`${rewards.experience} XP`);
            if (rewards.items && rewards.items.length > 0) {
                rewards.items.forEach(item => {
                    rewardParts.push(`${item.quantity || 1} ${item.name}`);
                });
            }
            
            rewardText += rewardParts.join(', ');
            window.game.uiManager.showNotification(rewardText, 'success');
        }
    }
    
    showQuestCompletionNotification(quest) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-family: 'Press Start 2P', cursive;
            font-size: 0.7em;
            z-index: 2000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            border: 2px solid #ffeb3b;
            animation: slideInRight 0.5s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 0.8em; margin-bottom: 8px;">Quest Completed!</div>
            <div style="font-size: 0.6em; color: #e8f5e8;">${quest.title}</div>
            ${quest.rewards.gold ? `<div style="font-size: 0.5em; margin-top: 5px; color: #ffeb3b;">+${quest.rewards.gold} Gold</div>` : ''}
            ${quest.rewards.experience ? `<div style="font-size: 0.5em; color: #7e57c2;">+${quest.rewards.experience} XP</div>` : ''}
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
    
    updateQuestCounts() {
        document.getElementById('active-quest-count').textContent = this.activeQuests.size;
        document.getElementById('completed-quest-count').textContent = this.completedQuests.size;
        document.getElementById('available-quest-count').textContent = this.availableQuests.size;
    }
    
    updateQuestList(category = 'active') {
        const listContainer = document.getElementById('quest-list');
        listContainer.innerHTML = '';
        
        let quests;
        switch (category) {
            case 'active':
                quests = Array.from(this.activeQuests.values());
                break;
            case 'completed':
                quests = Array.from(this.completedQuests.values());
                break;
            case 'available':
                quests = Array.from(this.availableQuests.values());
                break;
            default:
                quests = [];
        }
        
        if (quests.length === 0) {
            listContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #666; font-size: 0.6em;">
                    No ${category} quests
                </div>
            `;
            return;
        }
        
        quests.forEach(quest => {
            const questItem = document.createElement('div');
            questItem.style.cssText = `
                padding: 15px;
                border-bottom: 1px solid #444;
                cursor: pointer;
                transition: background 0.2s;
            `;
            
            // Quest type color
            const typeColors = {
                main: '#ff5722',
                side: '#2196f3',
                daily: '#ff9800'
            };
            
            questItem.innerHTML = `
                <div style="font-size: 0.6em; color: ${typeColors[quest.type] || '#aaa'}; text-transform: uppercase;">
                    ${quest.type} Quest
                </div>
                <div style="font-size: 0.7em; color: white; margin: 5px 0;">
                    ${quest.title}
                </div>
                <div style="font-size: 0.5em; color: #aaa;">
                    ${quest.giver}
                </div>
                <div style="font-size: 0.5em; color: #4caf50; margin-top: 5px;">
                    ${quest.objectives.filter(obj => obj.completed).length}/${quest.objectives.length} objectives
                </div>
            `;
            
            questItem.addEventListener('mouseenter', () => {
                questItem.style.background = '#333';
            });
            
            questItem.addEventListener('mouseleave', () => {
                questItem.style.background = 'transparent';
            });
            
            questItem.addEventListener('click', () => {
                this.showQuestDetails(quest);
            });
            
            listContainer.appendChild(questItem);
        });
    }
    
    showQuestDetails(quest) {
        const detailsContainer = document.getElementById('quest-detail-content');
        
        const progressBar = quest.objectives.map(obj => {
            const completed = obj.completed ? '✓' : '○';
            const progress = obj.target ? ` (${obj.current || 0}/${obj.target})` : '';
            return `<div style="margin: 5px 0; font-size: 0.6em; color: ${obj.completed ? '#4caf50' : '#aaa'};">
                ${completed} ${obj.description}${progress}
            </div>`;
        }).join('');
        
        detailsContainer.innerHTML = `
            <h3 style="color: #ffeb3b; margin: 0 0 15px 0; font-size: 0.9em;">${quest.title}</h3>
            <div style="color: #aaa; font-size: 0.6em; margin-bottom: 15px;">
                Given by: ${quest.giver} • ${quest.region}
            </div>
            <div style="color: white; font-size: 0.6em; line-height: 1.6; margin-bottom: 20px;">
                ${quest.description}
            </div>
            
            <h4 style="color: #ff9800; font-size: 0.7em; margin: 20px 0 10px 0;">Objectives:</h4>
            ${progressBar}
            
            <h4 style="color: #ff9800; font-size: 0.7em; margin: 20px 0 10px 0;">Rewards:</h4>
            <div style="font-size: 0.6em; color: #aaa;">
                ${quest.rewards.gold ? `• ${quest.rewards.gold} Gold<br>` : ''}
                ${quest.rewards.experience ? `• ${quest.rewards.experience} Experience<br>` : ''}
                ${quest.rewards.items.length > 0 ? quest.rewards.items.map(item => `• ${item.name} (${item.quantity})`).join('<br>') : ''}
            </div>
            
            ${quest.status === 'available' ? `
                <button onclick="game.questManager.startQuest('${quest.id}')" style="
                    margin-top: 20px;
                    background: #4caf50;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 0.6em;
                    cursor: pointer;
                    border-radius: 4px;
                ">Accept Quest</button>
            ` : ''}
        `;
    }
    
    updateQuestDisplay() {
        if (this.isJournalVisible) {
            const activeCategory = document.querySelector('.quest-category.active');
            if (activeCategory) {
                this.updateQuestList(activeCategory.dataset.category);
            }
        }
    }
    
    toggleJournal() {
        this.isJournalVisible = !this.isJournalVisible;
        const overlay = document.getElementById('quest-journal-overlay');
        overlay.style.display = this.isJournalVisible ? 'block' : 'none';
        
        if (this.isJournalVisible) {
            this.updateQuestCounts();
            this.updateQuestList('active');
        }
    }
    
    getActiveQuests() {
        return Array.from(this.activeQuests.values());
    }
    
    getQuestById(questId) {
        return this.activeQuests.get(questId) || 
               this.completedQuests.get(questId) || 
               this.availableQuests.get(questId);
    }
    
    isQuestActive(questId) {
        return this.activeQuests.has(questId);
    }
    
    isQuestCompleted(questId) {
        return this.completedQuests.has(questId);
    }
    
    hasQuest(questId) {
        return this.isQuestActive(questId) || this.isQuestCompleted(questId) || this.availableQuests.has(questId);
    }
    
    dispose() {
        const overlay = document.getElementById('quest-journal-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
} 