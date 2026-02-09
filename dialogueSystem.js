export class DialogueSystem {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.isActive = false;
        this.currentNPC = null;
        this.currentDialogue = null;
        this.dialogueHistory = new Map(); // Track conversation history with each NPC
        
        this.setupDialogueHandlers();
    }
    
    setupDialogueHandlers() {
        // Create dialogue overlay if it doesn't exist
        if (!document.getElementById('dialogue-overlay')) {
            this.createDialogueOverlay();
        }
    }
    
    createDialogueOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'dialogue-overlay';
        overlay.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-top: 4px solid #ffeb3b;
            border-image: linear-gradient(90deg, #ffeb3b, #ff9800) 1;
            padding: 20px;
            display: none;
            z-index: 1000;
            font-family: 'Press Start 2P', cursive;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.8);
            max-height: 40vh;
            overflow-y: auto;
        `;
        
        // NPC Info Section
        const npcInfo = document.createElement('div');
        npcInfo.id = 'npc-info';
        npcInfo.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            color: #ffeb3b;
            font-size: 0.9em;
        `;
        
        const npcName = document.createElement('span');
        npcName.id = 'npc-name';
        npcName.style.cssText = `
            font-weight: bold;
            margin-right: 15px;
        `;
        
        const npcType = document.createElement('span');
        npcType.id = 'npc-type';
        npcType.style.cssText = `
            color: #ff9800;
            font-size: 0.7em;
            text-transform: uppercase;
        `;
        
        npcInfo.appendChild(npcName);
        npcInfo.appendChild(npcType);
        
        // Dialogue Text
        const dialogueText = document.createElement('div');
        dialogueText.id = 'dialogue-text';
        dialogueText.style.cssText = `
            color: white;
            line-height: 1.6;
            margin-bottom: 20px;
            font-size: 0.8em;
            text-shadow: 2px 2px 0px #000;
        `;
        
        // Dialogue Options
        const dialogueOptions = document.createElement('div');
        dialogueOptions.id = 'dialogue-options';
        dialogueOptions.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        
        // Control Instructions
        const controls = document.createElement('div');
        controls.id = 'dialogue-controls';
        controls.style.cssText = `
            color: #aaa;
            font-size: 0.6em;
            margin-top: 15px;
            text-align: center;
        `;
        controls.textContent = 'Use number keys or click to select options • ESC to close';
        
        overlay.appendChild(npcInfo);
        overlay.appendChild(dialogueText);
        overlay.appendChild(dialogueOptions);
        overlay.appendChild(controls);
        
        document.body.appendChild(overlay);
        
        // Add keyboard event listener for dialogue navigation
        document.addEventListener('keydown', this.handleDialogueInput.bind(this));
    }
    
    startDialogue(npc, interactionData) {
        if (this.isActive) return; // Already in dialogue
        
        this.isActive = true;
        this.currentNPC = npc;
        this.currentDialogue = interactionData;
        
        // Show dialogue overlay
        const overlay = document.getElementById('dialogue-overlay');
        overlay.style.display = 'block';
        
        // Update NPC info
        document.getElementById('npc-name').textContent = npc.name;
        document.getElementById('npc-type').textContent = npc.type.replace(/([A-Z])/g, ' $1').trim();
        
        // Display initial dialogue
        this.displayDialogue(interactionData.dialogue);
        
        // Generate dialogue options
        this.generateDialogueOptions();
    }
    
    displayDialogue(text) {
        const dialogueText = document.getElementById('dialogue-text');
        dialogueText.textContent = text;
    }
    
    generateDialogueOptions() {
        const optionsContainer = document.getElementById('dialogue-options');
        optionsContainer.innerHTML = '';
        
        const options = [];
        
        // Basic dialogue options
        options.push({
            text: "Tell me about this place",
            action: () => this.showLocationInfo()
        });
        
        // Shop option
        if (this.currentDialogue.shop) {
            options.push({
                text: "Show me your wares",
                action: () => this.openShop()
            });
        }
        
        // Quest options
        if (this.currentDialogue.quests && this.currentDialogue.quests.length > 0) {
            options.push({
                text: "Do you have any tasks for me?",
                action: () => this.showQuests()
            });
        }
        
        // Service options
        if (this.currentDialogue.services && this.currentDialogue.services.length > 0) {
            for (const service of this.currentDialogue.services) {
                options.push({
                    text: this.getServiceText(service),
                    action: () => this.useService(service)
                });
            }
        }
        
        // Always include goodbye option
        options.push({
            text: "Farewell",
            action: () => this.endDialogue()
        });
        
        // Create option buttons
        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = `${index + 1}. ${option.text}`;
            button.style.cssText = `
                background: linear-gradient(135deg, #333 0%, #555 100%);
                color: white;
                border: 2px solid #666;
                padding: 10px 15px;
                font-family: 'Press Start 2P', cursive;
                font-size: 0.7em;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
            `;
            
            button.addEventListener('mouseenter', () => {
                button.style.background = 'linear-gradient(135deg, #ffeb3b 0%, #ff9800 100%)';
                button.style.color = '#000';
                button.style.borderColor = '#ffeb3b';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = 'linear-gradient(135deg, #333 0%, #555 100%)';
                button.style.color = 'white';
                button.style.borderColor = '#666';
            });
            
            button.addEventListener('click', option.action);
            optionsContainer.appendChild(button);
        });
    }
    
    getServiceText(service) {
        switch (service) {
            case 'repair': return "Can you repair my equipment?";
            case 'upgrade': return "I'd like to upgrade my gear";
            case 'craft': return "Can you craft something for me?";
            case 'train_magic': return "Teach me about magic";
            case 'enchant': return "Can you enchant my items?";
            case 'identify': return "Help me identify this item";
            default: return `Use ${service} service`;
        }
    }
    
    showLocationInfo() {
        const locationInfo = this.getLocationInfo();
        this.displayDialogue(locationInfo);
        
        // Show simplified options
        this.showBackOptions();
    }
    
    getLocationInfo() {
        const npc = this.currentNPC;
        const region = this.currentDialogue.npc.region; // Assuming region is passed in dialogue data

        // Default message
        let info = "This is a notable place in the realm. Ask around, you might learn something.";

        // Name-specific dialogue
        switch (npc.name) {
            case 'Elder Marcus':
                return "Greendale has been our home for generations. We are a peaceful folk, but the encroaching shadows from the Barren Lands concern me. The old castle to the west... it's been silent for too long.";
            case 'Trader Emma':
                return "This crossroads is perfect for trade! I get goods from all over, from the western mountains to the eastern desert. If you need supplies, I'm your best bet. And if you see any of those Sun-kissed Ferns, I'm always buying!";
            case 'Gareth the Smith':
                return "This is a good, sturdy village. The trees provide strong wood, and the hills have enough iron for my work. It's a fine place to forge a weapon... or a legacy. But stay out of the old ruins; they're nothing but trouble.";
        }

        // Generic dialogue based on NPC type and region
        switch (npc.type) {
            case 'guard':
                if (region === 'GREEN_HILLS') {
                    info = "I guard the roads. It's mostly been quiet, but we've had reports of oversized green ogres wandering closer to the village than usual. Be on your guard.";
                } else {
                    info = "My job is to keep the peace. Don't cause any trouble, and we'll get along just fine.";
                }
                break;
            case 'merchant':
                info = "A good place to do business. Lots of travelers means lots of coin, if you have the right goods.";
                break;
            case 'villager':
                info = "It's a quiet life here, and we like it that way. We have all we need from the land.";
                break;
            case 'mage':
                info = "The ley lines here are strong. A good place for one to practice the arcane arts without too much... interruption.";
                break;
        }
        
        return info;
    }
    
    openShop() {
        // Close dialogue and open shop interface
        this.endDialogue();
        const uiManager = this.uiManager || window.game?.uiManager;
        if (uiManager && typeof uiManager.showShop === 'function') {
            uiManager.showShop(this.currentDialogue.shop, this.currentNPC.name);
        } else {
            console.warn('Shop UI unavailable');
        }
    }
    
    showQuests() {
        const quests = this.currentDialogue.quests;
        if (quests.length === 0) {
            this.displayDialogue("I don't have any tasks for you right now, but check back later!");
        } else {
            const questText = quests.map(quest => 
                `${quest.title || quest.name}: ${quest.description}`
            ).join('\n\n');
            this.displayDialogue(`Here's what I need help with:\n\n${questText}`);
        }
        
        this.showBackOptions();
    }
    
    useService(service) {
        // Handle different services
        switch (service) {
            case 'repair':
                this.displayDialogue("Bring me your damaged equipment and I'll fix it up for a fair price!");
                break;
            case 'upgrade':
                this.displayDialogue("If you have the materials, I can improve your gear significantly!");
                break;
            case 'craft':
                this.displayDialogue("Tell me what you need and I'll see if I can make it for you!");
                break;
            case 'train_magic':
                this.displayDialogue("Magic requires discipline and understanding. Are you ready to learn?");
                break;
            case 'enchant':
                this.displayDialogue("Enchanting requires special crystals and reagents. Do you have what's needed?");
                break;
            case 'identify':
                this.displayDialogue("Show me the mysterious item and I'll tell you what I can about it.");
                break;
        }
        
        this.showBackOptions();
    }
    
    showBackOptions() {
        const optionsContainer = document.getElementById('dialogue-options');
        optionsContainer.innerHTML = '';
        
        const backButton = document.createElement('button');
        backButton.textContent = "1. Back to main conversation";
        backButton.style.cssText = `
            background: linear-gradient(135deg, #333 0%, #555 100%);
            color: white;
            border: 2px solid #666;
            padding: 10px 15px;
            font-family: 'Press Start 2P', cursive;
            font-size: 0.7em;
            cursor: pointer;
            transition: all 0.2s;
            text-align: left;
            margin-bottom: 10px;
        `;
        
        backButton.addEventListener('click', () => {
            this.displayDialogue(this.currentDialogue.dialogue);
            this.generateDialogueOptions();
        });
        
        const endButton = document.createElement('button');
        endButton.textContent = "2. End conversation";
        endButton.style.cssText = backButton.style.cssText;
        endButton.addEventListener('click', () => this.endDialogue());
        
        optionsContainer.appendChild(backButton);
        optionsContainer.appendChild(endButton);
    }
    
    handleDialogueInput(event) {
        if (!this.isActive) return;
        
        if (event.code === 'Escape') {
            this.endDialogue();
            return;
        }
        
        // Handle number key selection
        const keyNum = parseInt(event.key, 10);
        if (keyNum >= 1 && keyNum <= 9) {
            const buttons = document.querySelectorAll('#dialogue-options button');
            if (buttons[keyNum - 1]) {
                buttons[keyNum - 1].click();
            }
        }
    }
    
    endDialogue() {
        this.isActive = false;
        this.currentNPC = null;
        this.currentDialogue = null;
        
        // Hide dialogue overlay
        const overlay = document.getElementById('dialogue-overlay');
        overlay.style.display = 'none';
        
        // Clear content
        document.getElementById('dialogue-text').textContent = '';
        document.getElementById('dialogue-options').innerHTML = '';
    }
    
    isDialogueActive() {
        return this.isActive;
    }
    
    dispose() {
        const overlay = document.getElementById('dialogue-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        document.removeEventListener('keydown', this.handleDialogueInput);
    }
} 