// Simple UI Manager using DOM elements
export class UIManager {
    constructor(container) {
        this.container = container;
        this.healthDisplayContainer = null;
        this.healthBarFill = null;
        this.healthText = null;
        this.scoreDisplay = null;
        this.waveDisplay = null;
        this.biomeDisplay = null;
        this.minimapContainer = null;
        this.playerDot = null;
        this.castleIcon = null; // Add a property for the castle icon
        this.monsterDots = [];
        this.levelDisplay = null;
        this.xpBarFill = null;
        this.levelUpContainer = null;
        this.statsDisplay = null; // New container for stats
        this.maxHealthStat = null;
        this.speedStat = null;
        this.attackCooldownStat = null;
        this.introScreen = null;
        this.interactionPrompt = null;
        this.buffContainer = null;
        this.weaponDisplay = null; // New weapon display
        this.lastHealth = undefined;
        this.lastScore = undefined;
        this.vignetteOverlay = null;
        this.dayNightOverlay = null;
        this.fadeOverlay = null;
        this.centerOverlay = null;
        this.weaponSwitchOverlay = null;
        this.pauseMenuOverlay = null;
        this.bestiaryOverlay = null;
        this.biomeSelectOverlay = null;
        this.initUI();
    }
    initUI() {
        // Inject a stylesheet for all UI elements
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            
            .ui-overlay {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                padding: 15px; box-sizing: border-box; pointer-events: none; z-index: 10;
                background: transparent;
                font-family: 'Press Start 2P', cursive; color: white; text-transform: uppercase;
                text-shadow: 3px 3px 0px #000, 0 0 8px #000;
                image-rendering: pixelated;
            }
            .hud-container {
                background: repeating-linear-gradient(135deg, #222 0 4px, #333 4px 8px);
                border: 4px solid #fffbe6;
                border-radius: 8px;
                box-shadow: 0 0 0 4px #212121, 0 2px 8px #000a;
                padding: 8px;
                image-rendering: pixelated;
            }
            .hud-top-left { position: absolute; top: 15px; left: 15px; }
            .hud-top-center { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); font-size: 1.2em; padding: 8px 12px; }
            .hud-top-right { position: absolute; top: 15px; right: 15px; font-size: 1.2em; padding: 8px 12px; }
            .hud-bottom-right { position: absolute; bottom: 15px; right: 15px; }
            .hud-bottom-left { position: absolute; bottom: 15px; left: 15px; }
            .health-text { font-size: 0.9em; margin-bottom: 5px; letter-spacing: 1px; }
            .bar-background { background-color: #212121; border: 2px solid #fffbe6; border-radius: 4px; padding: 2px; margin-bottom: 5px; }
            .health-bar-fill { height: 16px; width: 100%; background: linear-gradient(90deg, #ff5252, #ffb300); border-radius: 3px; transition: width 0.2s cubic-bezier(.68,-0.55,.27,1.55); box-shadow: 0 0 6px #ff5252a0; }
            .level-text { font-size: 0.8em; color: #ffeb3b; margin-top: 5px; text-shadow: 2px 2px 0px #212121; }
            .xp-bar-fill { height: 8px; width: 0%; background: linear-gradient(90deg, #7e57c2, #00e5ff); border-radius: 2px; transition: width 0.2s cubic-bezier(.68,-0.55,.27,1.55); }
            .stats-display {
                display: flex;
                justify-content: space-around;
                margin-top: 8px;
                padding: 4px;
                background: repeating-linear-gradient(135deg, #111 0 4px, #222 4px 8px);
                border-radius: 6px;
                border: 2px solid #fffbe6;
            }
            .stat-item {
                display: flex;
                align-items: center;
                font-size: 0.8em;
                min-width: 60px;
                letter-spacing: 1px;
            }
            .stat-item span {
                margin-left: 5px;
            }
            #minimap { width: 150px; height: 150px; overflow: hidden; position: relative; border: 4px solid #fffbe6; border-radius: 8px; background: #181818; box-shadow: 0 0 0 4px #212121; }
            #player-dot { 
                position: absolute; width: 8px; height: 8px; background-color: #ff5722; 
                border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px #ff5722;
            }
            #castle-icon {
                position: absolute; font-size: 20px; color: #ffeb3b;
                text-shadow: 2px 2px 0px #000;
            }
            .monster-dot {
                position: absolute; width: 6px; height: 6px; background-color: #f44336;
                 border-radius: 50%; border: 1px solid white; transition: transform 0.1s linear;
             }
             #interaction-prompt {
                 position: absolute; bottom: 25%; left: 50%; transform: translateX(-50%);
                 padding: 12px 18px; background-color: rgba(0,0,0,0.8); border: 3px solid #BA55D3;
                 font-size: 1em; pointer-events: none; z-index: 15; display: none;
                color: #fff;
                text-shadow: 2px 2px 0px #4B0082;
             }
             .buff-container { display: flex; flex-direction: column; gap: 8px; }
             .buff-icon {
                display: flex; align-items: center; justify-content: center;
                width: 48px; height: 48px; background-color: rgba(0,0,0,0.6);
                border: 2px solid #BA55D3; font-size: 24px;
                position: relative;
                border-radius: 6px;
                box-shadow: 0 0 0 2px #fffbe6;
             }
             .buff-timer {
                position: absolute; bottom: 0; right: 0;
                font-size: 0.5em; background-color: rgba(0,0,0,0.8);
                padding: 1px 3px; color: white;
                border-radius: 3px;
             }
            button, input, select {
                font-family: 'Press Start 2P', cursive !important;
                image-rendering: pixelated;
            }
            .hp-flash {
                animation: hpFlash 0.4s cubic-bezier(.68,-0.55,.27,1.55);
            }
            @keyframes hpFlash {
                0% { box-shadow: 0 0 0 0 #fffbe6, 0 0 6px #ff5252a0; }
                50% { box-shadow: 0 0 16px 8px #fffbe6, 0 0 16px #ff5252; }
                100% { box-shadow: 0 0 0 0 #fffbe6, 0 0 6px #ff5252a0; }
            }
            .score-pop {
                animation: scorePop 0.4s cubic-bezier(.68,-0.55,.27,1.55);
            }
            @keyframes scorePop {
                0% { transform: scale(1); color: #fffbe6; }
                50% { transform: scale(1.25); color: #ffeb3b; }
                100% { transform: scale(1); color: white; }
            }
            .pixel-heart {
                display: inline-block; width: 18px; height: 16px;
                background: url('data:image/svg+xml;utf8,<svg width=\'18\' height=\'16\' xmlns=\'http://www.w3.org/2000/svg\'><path fill=\'%23ff5252\' stroke=\'%23fffbe6\' stroke-width=\'2\' d=\'M9 15s-7-4.35-7-8.5A4.5 4.5 0 0 1 9 2.5 4.5 4.5 0 0 1 16 6.5C16 10.65 9 15 9 15z\'/></svg>') no-repeat center/contain;
                vertical-align: middle;
                margin-right: 4px;
            }
            .pixel-weapon-sword {
                display: inline-block; width: 18px; height: 16px;
                background: url('data:image/svg+xml;utf8,<svg width=\'18\' height=\'16\' xmlns=\'http://www.w3.org/2000/svg\'><rect x=\'8\' y=\'2\' width=\'2\' height=\'10\' fill=\'%23fffbe6\'/><rect x=\'7\' y=\'12\' width=\'4\' height=\'2\' fill=\'%23ff5252\'/></svg>') no-repeat center/contain;
                vertical-align: middle;
                margin-right: 4px;
            }
            .pixel-weapon-bow {
                display: inline-block; width: 18px; height: 16px;
                background: url('data:image/svg+xml;utf8,<svg width=\'18\' height=\'16\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M4 2 Q14 8 4 14\' stroke=\'%23fffbe6\' stroke-width=\'2\' fill=\'none\'/><line x1=\'4\' y1=\'2\' x2=\'4\' y2=\'14\' stroke=\'%23ffb300\' stroke-width=\'2\'/></svg>') no-repeat center/contain;
                vertical-align: middle;
                margin-right: 4px;
            }
            .pixel-weapon-staff {
                display: inline-block; width: 18px; height: 16px;
                background: url('data:image/svg+xml;utf8,<svg width=\'18\' height=\'16\' xmlns=\'http://www.w3.org/2000/svg\'><rect x=\'8\' y=\'2\' width=\'2\' height=\'10\' fill=\'%237e57c2\'/><circle cx=\'9\' cy=\'2\' r=\'2\' fill=\'%2300e5ff\'/></svg>') no-repeat center/contain;
                vertical-align: middle;
                margin-right: 4px;
            }
            .pixel-buff-damage {
                display: inline-block; width: 20px; height: 20px;
                background: url('data:image/svg+xml;utf8,<svg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'><polygon points=\'10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8\' fill=\'%23ffb300\' stroke=\'%23fffbe6\' stroke-width=\'2\'/></svg>') no-repeat center/contain;
                vertical-align: middle;
            }
            .pixel-buff-speed {
                display: inline-block; width: 20px; height: 20px;
                background: url('data:image/svg+xml;utf8,<svg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'><rect x=\'4\' y=\'8\' width=\'12\' height=\'4\' fill=\'%2300e5ff\'/><polygon points=\'16,10 20,6 20,14\' fill=\'%2300e5ff\'/></svg>') no-repeat center/contain;
                vertical-align: middle;
            }
            .pixel-buff-health {
                display: inline-block; width: 20px; height: 20px;
                background: url('data:image/svg+xml;utf8,<svg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'><path fill=\'%23ff5252\' stroke=\'%23fffbe6\' stroke-width=\'2\' d=\'M10 18s-7-4.35-7-8.5A4.5 4.5 0 0 1 10 5.5 4.5 4.5 0 0 1 17 9.5C17 13.65 10 18 10 18z\'/></svg>') no-repeat center/contain;
                vertical-align: middle;
            }
            .vignette-overlay {
                pointer-events: none;
                position: absolute; left: 0; top: 0; width: 100vw; height: 100vh;
                z-index: 100; opacity: 1;
                background: radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%);
                mix-blend-mode: multiply;
            }
            .daynight-overlay {
                pointer-events: none;
                position: absolute; left: 0; top: 0; width: 100vw; height: 100vh;
                z-index: 101; opacity: 0;
                background: #000;
                transition: opacity 1s;
                mix-blend-mode: multiply;
            }
            .fade-overlay {
                pointer-events: none;
                position: absolute; left: 0; top: 0; width: 100vw; height: 100vh;
                z-index: 200; opacity: 0;
                background: #000;
                transition: opacity 1s;
            }
            .center-overlay {
                pointer-events: none;
                position: absolute; left: 0; top: 0; width: 100vw; height: 100vh;
                z-index: 201; display: flex; align-items: center; justify-content: center;
            }
            .pixel-border-box {
                font-size: 2.5em; color: #fffbe6; background: #181818;
                border: 8px solid #fffbe6; border-radius: 12px;
                box-shadow: 0 0 0 8px #212121, 0 2px 16px #000a;
                padding: 32px 64px; text-align: center;
                font-family: 'Press Start 2P', cursive;
                text-shadow: 3px 3px 0px #000, 0 0 8px #000;
                image-rendering: pixelated;
            }
            .weapon-switch-overlay {
                position: absolute; left: 50%; top: 30%; transform: translate(-50%, -50%);
                z-index: 300; display: flex; flex-direction: column; align-items: center;
                font-family: 'Press Start 2P', cursive; font-size: 2.5em; color: #fffbe6;
                text-shadow: 3px 3px 0px #000, 0 0 8px #000;
                pointer-events: none; animation: weaponPop 0.5s cubic-bezier(.68,-0.55,.27,1.55);
            }
            @keyframes weaponPop {
                0% { transform: scale(0.7) translate(-50%, -50%); opacity: 0; }
                60% { transform: scale(1.2) translate(-50%, -50%); opacity: 1; }
                100% { transform: scale(1) translate(-50%, -50%); opacity: 1; }
            }
            .pause-menu-overlay {
                position: absolute; left: 0; top: 0; width: 100vw; height: 100vh;
                z-index: 400; background: rgba(24,24,24,0.95);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: 'Press Start 2P', cursive; color: #fffbe6;
                pointer-events: auto;
            }
            .pause-menu {
                background: #181818; border: 8px solid #fffbe6; border-radius: 12px;
                box-shadow: 0 0 0 8px #212121, 0 2px 16px #000a;
                padding: 32px 64px; text-align: center;
                display: flex; flex-direction: column; gap: 24px;
                align-items: center;
            }
            .pause-menu button {
                font-family: 'Press Start 2P', cursive; font-size: 1.1em;
                background: #222; color: #fffbe6; border: 3px solid #fffbe6;
                border-radius: 8px; padding: 12px 32px; margin: 8px 0;
                cursor: pointer; transition: background 0.2s, color 0.2s, transform 0.2s;
            }
            .pause-menu button:hover {
                background: #fffbe6; color: #181818; transform: scale(1.05);
            }
            .bestiary-overlay, .biome-info-overlay {
                position: absolute; left: 0; top: 0; width: 100vw; height: 100vh;
                z-index: 500; background: rgba(24,24,24,0.98);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                font-family: 'Press Start 2P', cursive; color: #fffbe6;
                pointer-events: auto;
            }
            .bestiary-panel, .biome-panel {
                background: #181818; border: 8px solid #fffbe6; border-radius: 12px;
                box-shadow: 0 0 0 8px #212121, 0 2px 16px #000a;
                padding: 32px 64px; text-align: center;
                max-width: 90vw; max-height: 80vh; overflow-y: auto;
            }
            .bestiary-list {
                display: flex; flex-wrap: wrap; gap: 32px; justify-content: center; margin-top: 24px;
            }
            .bestiary-entry {
                display: flex; flex-direction: column; align-items: center; width: 160px;
                background: #222; border: 3px solid #fffbe6; border-radius: 8px; padding: 16px;
                margin-bottom: 12px;
            }
            .bestiary-icon {
                font-size: 2.5em; margin-bottom: 8px;
            }
            .biome-panel {
                display: flex; flex-direction: column; align-items: center;
            }
            .biome-icon {
                font-size: 3em; margin-bottom: 12px;
            }
            .close-btn {
                font-family: 'Press Start 2P', cursive; font-size: 1em;
                background: #fffbe6; color: #181818; border: 3px solid #fffbe6;
                border-radius: 8px; padding: 8px 24px; margin-top: 24px;
                cursor: pointer; transition: background 0.2s, color 0.2s, transform 0.2s;
            }
            .close-btn:hover {
                background: #181818; color: #fffbe6; border: 3px solid #fffbe6;
            }
        `;
        document.head.appendChild(style);
        const uiOverlay = document.createElement('div');
        uiOverlay.className = 'ui-overlay';
        // --- Top-Left HUD (Health, Level, XP) ---
        const topLeftContainer = document.createElement('div');
        topLeftContainer.className = 'hud-top-left';
        
        this.healthDisplayContainer = document.createElement('div');
        this.healthDisplayContainer.className = 'hud-container';
        this.healthText = document.createElement('div');
        this.healthText.className = 'health-text';
        this.healthText.textContent = 'HP: ???/???';
        const healthBarBackground = document.createElement('div');
        healthBarBackground.className = 'bar-background';
        healthBarBackground.style.width = '180px';
        this.healthBarFill = document.createElement('div');
        this.healthBarFill.className = 'health-bar-fill';
        healthBarBackground.appendChild(this.healthBarFill);
        this.levelDisplay = document.createElement('div');
        this.levelDisplay.className = 'level-text';
        this.levelDisplay.textContent = 'Level: 1';
        const xpBarBackground = document.createElement('div');
        xpBarBackground.className = 'bar-background';
        this.xpBarFill = document.createElement('div');
        this.xpBarFill.className = 'xp-bar-fill';
        xpBarBackground.appendChild(this.xpBarFill);
        this.healthDisplayContainer.append(this.healthText, healthBarBackground, this.levelDisplay, xpBarBackground);
        // --- Stats Display (below health) ---
        this.statsDisplay = document.createElement('div');
        this.statsDisplay.className = 'stats-display hud-container';
        this.maxHealthStat = this.createStatItem('❤️');
        this.speedStat = this.createStatItem('👟');
        this.attackCooldownStat = this.createStatItem('⚔️');
        this.statsDisplay.append(this.maxHealthStat, this.speedStat, this.attackCooldownStat);
        topLeftContainer.append(this.healthDisplayContainer, this.statsDisplay);
        uiOverlay.appendChild(topLeftContainer);
        // --- Bottom-Left HUD (Buffs) ---
        const bottomLeftContainer = document.createElement('div');
        bottomLeftContainer.className = 'hud-bottom-left';
        this.buffContainer = document.createElement('div');
        this.buffContainer.className = 'buff-container';
        bottomLeftContainer.appendChild(this.buffContainer);
        uiOverlay.appendChild(bottomLeftContainer);
        // --- Top-Center HUD (Wave & Biome) ---
        const topCenterContainer = document.createElement('div');
        topCenterContainer.className = 'hud-top-center hud-container';
        this.waveDisplay = document.createElement('div');
        this.waveDisplay.id = 'waveDisplay';
        this.waveDisplay.style.marginBottom = '4px';
        this.biomeDisplay = document.createElement('div');
        this.biomeDisplay.id = 'biomeDisplay';
        this.biomeDisplay.style.fontSize = '0.7em';
        this.biomeDisplay.style.textTransform = 'capitalize';
        this.biomeDisplay.style.color = '#cccccc';
        topCenterContainer.append(this.waveDisplay, this.biomeDisplay);
        uiOverlay.appendChild(topCenterContainer);
        // --- Top-Right HUD (Score) ---
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.id = 'scoreDisplay';
        this.scoreDisplay.className = 'hud-top-right hud-container';
        uiOverlay.appendChild(this.scoreDisplay);
        
        // --- Weapon Display (below score) ---
        this.weaponDisplay = document.createElement('div');
        this.weaponDisplay.className = 'hud-top-right hud-container';
        this.weaponDisplay.style.top = '80px';
        this.weaponDisplay.style.fontSize = '0.8em';
        uiOverlay.appendChild(this.weaponDisplay);
        // --- Bottom-Right HUD (Minimap) ---
        const bottomRightContainer = document.createElement('div');
        bottomRightContainer.className = 'hud-bottom-right';
        this.minimapContainer = document.createElement('div');
        this.minimapContainer.id = 'minimap';
        this.minimapContainer.className = 'hud-container';
        
        this.playerDot = document.createElement('div');
        this.playerDot.id = 'player-dot';
        
        this.castleIcon = document.createElement('div');
        this.castleIcon.id = 'castle-icon';
        this.castleIcon.textContent = '🏰';
        
        this.minimapContainer.append(this.playerDot, this.castleIcon);
        bottomRightContainer.appendChild(this.minimapContainer);
        uiOverlay.appendChild(bottomRightContainer);
        // --- Floating Elements ---
        this.interactionPrompt = document.createElement('div');
        this.interactionPrompt.id = 'interaction-prompt';
        uiOverlay.appendChild(this.interactionPrompt);
        // --- Vignette Overlay ---
        this.vignetteOverlay = document.createElement('div');
        this.vignetteOverlay.className = 'vignette-overlay';
        this.container.appendChild(this.vignetteOverlay);
        // --- Day/Night Overlay ---
        this.dayNightOverlay = document.createElement('div');
        this.dayNightOverlay.className = 'daynight-overlay';
        this.container.appendChild(this.dayNightOverlay);
        // --- Fade Overlay ---
        this.fadeOverlay = document.createElement('div');
        this.fadeOverlay.className = 'fade-overlay';
        this.fadeOverlay.style.opacity = '0'; // Ensure it starts hidden
        this.container.appendChild(this.fadeOverlay);
        // --- Pause/Level Up Overlay ---
        this.centerOverlay = document.createElement('div');
        this.centerOverlay.className = 'center-overlay';
        this.centerOverlay.style.display = 'none';
        this.container.appendChild(this.centerOverlay);
        // --- Weapon Switch Overlay ---
        this.weaponSwitchOverlay = document.createElement('div');
        this.weaponSwitchOverlay.className = 'weapon-switch-overlay';
        this.weaponSwitchOverlay.style.display = 'none';
        this.container.appendChild(this.weaponSwitchOverlay);
        // --- Pause Menu Overlay ---
        this.pauseMenuOverlay = document.createElement('div');
        this.pauseMenuOverlay.className = 'pause-menu-overlay';
        this.pauseMenuOverlay.style.display = 'none';
        this.container.appendChild(this.pauseMenuOverlay);
        // --- Bestiary Overlay ---
        this.bestiaryOverlay = document.createElement('div');
        this.bestiaryOverlay.className = 'bestiary-overlay';
        this.bestiaryOverlay.style.display = 'none';
        this.container.appendChild(this.bestiaryOverlay);
        // --- Biome Info Overlay ---

        this.uiOverlay = uiOverlay;
        this.uiOverlay.style.display = 'none'; // Hide initially until game starts
        this.container.appendChild(this.uiOverlay);
    }
    createStatItem(icon) {
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `${icon} <span>...</span>`;
        return item;
    }
    updateBuffs(buffs) {
        if (this.buffContainer) {
            this.buffContainer.innerHTML = '';
            Object.entries(buffs).forEach(([buff, timer]) => {
                const buffDiv = document.createElement('div');
                buffDiv.className = 'buff-icon';
                buffDiv.innerHTML = `<span class='pixel-buff-${buff}'></span><span class='buff-timer'>${timer.toFixed(1)}s</span>`;
                this.buffContainer.appendChild(buffDiv);
            });
        }
    }
    updatePlayerHealth(currentHealth, maxHealth) {
        if (this.healthBarFill && this.healthText) {
            const healthPercentage = Math.max(0, (currentHealth / maxHealth) * 100);
            // Animate HP bar flash if health changes
            if (this.lastHealth !== undefined && currentHealth < this.lastHealth) {
                this.healthBarFill.classList.remove('hp-flash');
                void this.healthBarFill.offsetWidth; // Force reflow
                this.healthBarFill.classList.add('hp-flash');
            }
            this.healthBarFill.style.width = `${healthPercentage}%`;
            this.healthText.innerHTML = `<span class='pixel-heart'></span> ${Math.max(0, currentHealth)} / ${maxHealth}`;
            this.lastHealth = currentHealth;
        }
    }
    updateExperience(level, currentXP, xpToNextLevel) {
        if (this.levelDisplay && this.xpBarFill) {
            this.levelDisplay.textContent = `Level: ${level}`;
            const xpPercentage = Math.max(0, (currentXP / xpToNextLevel) * 100);
            this.xpBarFill.style.width = `${xpPercentage}%`;
        }
    }
    updatePlayerStats(stats) {
        if (this.maxHealthStat) {
            this.maxHealthStat.querySelector('span').textContent = stats.maxHealth;
        }
        if (this.speedStat) {
            this.speedStat.querySelector('span').textContent = stats.speed.toFixed(1);
        }
        if (this.attackCooldownStat) {
            this.attackCooldownStat.querySelector('span').textContent = `${stats.attackCooldown.toFixed(2)}s`;
        }
    }
    updateScore(score) {
        if (this.scoreDisplay) {
            if (this.lastScore !== undefined && score > this.lastScore) {
                this.scoreDisplay.classList.remove('score-pop');
                void this.scoreDisplay.offsetWidth;
                this.scoreDisplay.classList.add('score-pop');
            }
            this.scoreDisplay.textContent = `Score: ${score}`;
            this.lastScore = score;
        }
    }
    updateWeapon(weapon, stance) {
        if (this.weaponDisplay) {
            const weaponIcons = {
                'sword': "<span class='pixel-weapon-sword'></span>",
                'bow': "<span class='pixel-weapon-bow'></span>",
                'staff': "<span class='pixel-weapon-staff'></span>"
            };
            const stanceText = stance === 'defensive' ? ' (Def)' : '';
            this.weaponDisplay.innerHTML = `${weaponIcons[weapon] || '<span class=\'pixel-weapon-sword\'></span>'} ${weapon.toUpperCase()}${stanceText}`;
        }
    }
    updateWave(wave) {
        if (this.waveDisplay) {
            this.waveDisplay.textContent = `Wave: ${wave}`;
        }
    }
    updateBiome(biomeName) {
        if (this.biomeDisplay) {
            this.biomeDisplay.textContent = biomeName;
        }
    }
    updateMinimap(playerPosition, worldSize, castlePosition, monsterPositions = []) {
        if (!this.minimapContainer) return;
        const mapWidth = this.minimapContainer.clientWidth;
        const mapHeight = this.minimapContainer.clientHeight;
        
        // Update player dot
        if (this.playerDot) {
            const pPercentX = (playerPosition.x + worldSize / 2) / worldSize;
            const pPercentZ = (playerPosition.z + worldSize / 2) / worldSize;
            const dotX = pPercentX * mapWidth - (this.playerDot.offsetWidth / 2);
            const dotY = pPercentZ * mapHeight - (this.playerDot.offsetHeight / 2);
            this.playerDot.style.transform = `translate(${dotX}px, ${dotY}px)`;
        }
        // Update castle icon
        if (this.castleIcon && castlePosition) {
            const cPercentX = (castlePosition.x + worldSize / 2) / worldSize;
            const cPercentZ = (castlePosition.z + worldSize / 2) / worldSize;
            const iconX = cPercentX * mapWidth - (this.castleIcon.offsetWidth / 2);
            const iconY = cPercentZ * mapHeight - (this.castleIcon.offsetHeight / 2);
            this.castleIcon.style.transform = `translate(${iconX}px, ${iconY}px)`;
        }
        
        // Update monster dots
        for (let i = 0; i < monsterPositions.length; i++) {
            if (i >= this.monsterDots.length) {
                // Create new dot if we don't have enough
                const newDot = document.createElement('div');
                newDot.className = 'monster-dot';
                this.minimapContainer.appendChild(newDot);
                this.monsterDots.push(newDot);
            }
            const dot = this.monsterDots[i];
            const pos = monsterPositions[i];
            
            dot.style.display = 'block';
            const mPercentX = (pos.x + worldSize / 2) / worldSize;
            const mPercentZ = (pos.z + worldSize / 2) / worldSize;
            const dotX = mPercentX * mapWidth - (dot.offsetWidth / 2);
            const dotY = mPercentZ * mapHeight - (dot.offsetHeight / 2);
            dot.style.transform = `translate(${dotX}px, ${dotY}px)`;
        }
        // Hide unused monster dots
        for (let i = monsterPositions.length; i < this.monsterDots.length; i++) {
            this.monsterDots[i].style.display = 'none';
        }
    }
    showInteractionPrompt(text) {
        if (this.interactionPrompt) {
            this.interactionPrompt.textContent = text;
            this.interactionPrompt.style.display = 'block';
        }
    }
    hideInteractionPrompt() {
        if (this.interactionPrompt) {
            this.interactionPrompt.style.display = 'none';
        }
    }
    showGameOver() {
        const gameOverMessage = document.createElement('div');
         gameOverMessage.textContent = 'GAME OVER';
         gameOverMessage.style.position = 'absolute';
         gameOverMessage.style.top = '50%';
         gameOverMessage.style.left = '50%';
         gameOverMessage.style.transform = 'translate(-50%, -50%)';
         gameOverMessage.style.color = 'red';
         gameOverMessage.style.fontSize = '48px';
         gameOverMessage.style.fontWeight = 'bold';
         gameOverMessage.style.textShadow = '2px 2px 4px black';
         gameOverMessage.style.pointerEvents = 'none';
         this.container.appendChild(gameOverMessage);
     }
    showLevelUpUI(upgradeOptions, onSelectCallback) {
        this.hideLevelUpUI(); // Ensure no duplicates
        this.levelUpContainer = document.createElement('div');
        this.levelUpContainer.style.position = 'absolute';
        this.levelUpContainer.style.top = '0';
        this.levelUpContainer.style.left = '0';
        this.levelUpContainer.style.width = '100%';
        this.levelUpContainer.style.height = '100%';
        this.levelUpContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
        this.levelUpContainer.style.display = 'flex';
        this.levelUpContainer.style.justifyContent = 'center';
        this.levelUpContainer.style.alignItems = 'center';
        this.levelUpContainer.style.flexDirection = 'column';
        this.levelUpContainer.style.zIndex = '20'; // Above other UI
        this.levelUpContainer.style.fontFamily = `'Press Start 2P', cursive`;
        const title = document.createElement('h2');
        title.textContent = 'LEVEL UP!';
        title.style.color = '#ffeb3b'; // Gold
        title.style.fontSize = '2em';
        title.style.textShadow = '3px 3px 0px #212121';
        title.style.marginBottom = '10px';
        this.levelUpContainer.appendChild(title);
        const subtitle = document.createElement('p');
        subtitle.textContent = 'Choose an Upgrade:';
        subtitle.style.color = 'white';
        subtitle.style.fontSize = '1em';
        subtitle.style.marginBottom = '25px';
        this.levelUpContainer.appendChild(subtitle);
        const optionsContainer = document.createElement('div');
        optionsContainer.style.display = 'flex';
        optionsContainer.style.gap = '20px';
        upgradeOptions.forEach(option => {
            const button = document.createElement('button');
            button.style.width = '180px';
            button.style.padding = '15px';
            button.style.border = '3px solid #ffeb3b';
            button.style.backgroundColor = '#212121';
            button.style.color = 'white';
            button.style.cursor = 'pointer';
            button.style.fontFamily = 'inherit';
            button.style.textAlign = 'center';
            button.style.transition = 'background-color 0.2s, transform 0.2s';
            button.innerHTML = `
                <div style="font-weight: bold; font-size: 1.1em; color: #ffeb3b; margin-bottom: 8px;">${option.title}</div>
                <div style="font-size: 0.8em; line-height: 1.4; text-transform: none;">${option.description}</div>
            `;
            button.onmouseenter = () => {
                button.style.backgroundColor = '#ffeb3b';
                button.style.color = 'black';
                button.style.transform = 'scale(1.05)';
            };
            button.onmouseleave = () => {
                button.style.backgroundColor = '#212121';
                button.style.color = 'white';
                button.style.transform = 'scale(1.0)';
            };
            button.onclick = () => onSelectCallback(option.id);
            optionsContainer.appendChild(button);
        });
        this.levelUpContainer.appendChild(optionsContainer);
        this.container.appendChild(this.levelUpContainer);
    }
    hideLevelUpUI() {
        if (this.levelUpContainer) {
            this.container.removeChild(this.levelUpContainer);
            this.levelUpContainer = null;
        }
    }
    dispose() {
        this.hideLevelUpUI(); // Make sure level up UI is removed
        this.hideInteractionPrompt();
        // Remove UI elements when game ends or resets
        const uiOverlay = this.healthDisplayContainer?.parentElement?.parentElement; // parent is leftUIContainer
        if (uiOverlay && uiOverlay.parentElement === this.container) {
            this.container.removeChild(uiOverlay);
        }
         // Remove game over message if present
         const gameOver = this.container.querySelector('div[style*="GAME OVER"]');
         if (gameOver) {
             this.container.removeChild(gameOver);
         }
        if (this.introScreen) {
            this.container.removeChild(this.introScreen);
        }
    }
    showIntroScreen(onStartCallback) {
        // Hide game UI during intro
        if (this.uiOverlay) this.uiOverlay.style.display = 'none';
        this.introScreen = document.createElement('div');
        this.introScreen.style.position = 'absolute';
        this.introScreen.style.top = '0';
        this.introScreen.style.left = '0';
        this.introScreen.style.width = '100%';
        this.introScreen.style.height = '100%';
        this.introScreen.style.backgroundColor = 'rgba(10, 20, 30, 0.9)';
        this.introScreen.style.color = 'white';
        this.introScreen.style.display = 'flex';
        this.introScreen.style.flexDirection = 'column';
        this.introScreen.style.alignItems = 'center';
        this.introScreen.style.justifyContent = 'center';
        this.introScreen.style.fontFamily = `'Press Start 2P', cursive`;
        this.introScreen.style.textAlign = 'center';
        this.introScreen.style.zIndex = '100';
        const title = document.createElement('h1');
        title.textContent = 'Pixel Scrolls';
        title.style.fontSize = '3.5em';
        title.style.color = '#ffeb3b';
        title.style.textShadow = '4px 4px 0px #212121';
        this.introScreen.appendChild(title);
        const instructions = document.createElement('p');
        instructions.innerHTML = `
            CONTROLS:<br>
            WASD or ARROW KEYS to MOVE<br>
            SPACEBAR to ATTACK<br>
            1, 2, 3 to SWITCH WEAPONS<br>
            SHIFT to BLOCK<br>
            CTRL for DEFENSIVE STANCE
        `;
        instructions.style.fontSize = '1em';
        instructions.style.lineHeight = '1.8';
        instructions.style.marginTop = '30px';
        instructions.style.marginBottom = '40px';
        instructions.style.color = '#eeeeee';
        this.introScreen.appendChild(instructions);
        const startButton = document.createElement('button');
        startButton.textContent = 'Start Game';
        startButton.style.fontSize = '1.5em';
        startButton.style.padding = '15px 30px';
        startButton.style.border = '3px solid #ffeb3b';
        startButton.style.backgroundColor = '#212121';
        startButton.style.color = 'white';
        startButton.style.cursor = 'pointer';
        startButton.style.fontFamily = 'inherit';
        startButton.style.textTransform = 'uppercase';
        startButton.style.transition = 'background-color 0.2s, transform 0.2s';
        startButton.onmouseenter = () => {
            startButton.style.backgroundColor = '#ffeb3b';
            startButton.style.color = 'black';
            startButton.style.transform = 'scale(1.05)';
        };
        startButton.onmouseleave = () => {
            startButton.style.backgroundColor = '#212121';
            startButton.style.color = 'white';
            startButton.style.transform = 'scale(1.0)';
        };
        startButton.onclick = () => {
            this.hideIntroScreen();
            onStartCallback();
        };
        this.introScreen.appendChild(startButton);
        this.container.appendChild(this.introScreen);
    }
    hideIntroScreen() {
        if (this.introScreen) {
            this.container.removeChild(this.introScreen);
            this.introScreen = null;
            if (this.uiOverlay) this.uiOverlay.style.display = 'block'; // Show game UI
        }
    }
    showGameUI() {
        console.log("showGameUI called - hiding all overlays");
        // Hide all menu overlays and show the game UI
        if (this.biomeSelectOverlay) {
            this.biomeSelectOverlay.style.display = 'none';
            this.biomeSelectOverlay.style.visibility = 'hidden';
            console.log("biomeSelectOverlay hidden");
        }

        if (this.bestiaryOverlay) {
            this.bestiaryOverlay.style.display = 'none';
            this.bestiaryOverlay.style.visibility = 'hidden';
        }
        if (this.pauseMenuOverlay) {
            this.pauseMenuOverlay.style.display = 'none';
            this.pauseMenuOverlay.style.visibility = 'hidden';
        }
        if (this.uiOverlay) {
            this.uiOverlay.style.display = 'block';
            this.uiOverlay.style.visibility = 'visible';
            console.log("uiOverlay shown");
        }
        
        // Make sure the game container is visible
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.background = 'transparent'; // Remove any background that might be blocking the canvas
        
        console.log("Game UI shown, all overlays hidden");
        
        // Debug: log all child elements and their visibility
        console.log("Container children:", this.container.children.length);
        for (let i = 0; i < this.container.children.length; i++) {
            const child = this.container.children[i];
            console.log(`Child ${i}:`, child.tagName, child.className, 'display:', child.style.display, 'visibility:', child.style.visibility);
        }
    }
    showPauseOverlay() {
        this.centerOverlay.innerHTML = `<div class='pixel-border-box'>PAUSED</div>`;
        this.centerOverlay.style.display = 'flex';
    }
    showLevelUpOverlay() {
        this.centerOverlay.innerHTML = `<div class='pixel-border-box'>LEVEL UP!</div>`;
        this.centerOverlay.style.display = 'flex';
    }
    hideCenterOverlay() {
        this.centerOverlay.style.display = 'none';
    }
    setDayNightTint(color, opacity) {
        this.dayNightOverlay.style.background = color;
        this.dayNightOverlay.style.opacity = opacity;
    }
    fadeIn(duration = 1000) {
        this.fadeOverlay.style.transition = `opacity ${duration}ms`;
        this.fadeOverlay.style.opacity = 1;
        setTimeout(() => {
            this.fadeOverlay.style.opacity = 0;
        }, 50);
    }
    fadeOut(duration = 1000) {
        this.fadeOverlay.style.transition = `opacity ${duration}ms`;
        this.fadeOverlay.style.opacity = 1;
    }
    showWeaponSwitch(weapon) {
        const icons = { sword: '🗡️', bow: '🏹', staff: '🔮' };
        const names = { sword: 'SWORD', bow: 'BOW', staff: 'STAFF' };
        this.weaponSwitchOverlay.innerHTML = `<div>${icons[weapon] || '❓'}</div><div style='font-size:0.5em;'>${names[weapon] || weapon}</div>`;
        this.weaponSwitchOverlay.style.display = 'flex';
        setTimeout(() => { this.weaponSwitchOverlay.style.display = 'none'; }, 700);
    }
    showPauseMenu(onResume, onBestiary, onBiomes, onQuit) {
        this.pauseMenuOverlay.innerHTML = `
            <div class='pause-menu'>
                <div style='font-size:2em; margin-bottom:16px;'>⏸️ PAUSED</div>
                <button id='resume-btn'>Resume</button>
                <button id='bestiary-btn'>Bestiary / FAQ</button>
                <button id='biomes-btn'>Biomes</button>
                <button id='quit-btn'>Quit</button>
            </div>
        `;
        this.pauseMenuOverlay.style.display = 'flex';
        document.getElementById('resume-btn').onclick = () => { this.pauseMenuOverlay.style.display = 'none'; if (onResume) onResume(); };
        document.getElementById('bestiary-btn').onclick = () => { this.showBestiary(onBestiary); };
        document.getElementById('biomes-btn').onclick = () => { this.showBiomeSelectionMenu(onBiomes); };
        document.getElementById('quit-btn').onclick = () => { if (onQuit) onQuit(); };
    }
    showBestiary(onClose) {
        // Example bestiary data (replace with your monsters)
        const monsters = [
            { icon: '👹', name: 'Green Ogre', desc: 'A slow but tough brute.' },
            { icon: '💀', name: 'Red Skull', desc: 'Fast and deadly, beware its charge.' },
            { icon: '👁️', name: 'Cyclops', desc: 'Big, strong, and can stun.' },
            { icon: '✨', name: 'Magic Wisp', desc: 'Floats and shoots magic bolts.' }
        ];
        this.bestiaryOverlay.innerHTML = `
            <div class='bestiary-panel'>
                <div style='font-size:2em; margin-bottom:16px;'>Bestiary</div>
                <div class='bestiary-list'>
                    ${monsters.map(m => `<div class='bestiary-entry'><div class='bestiary-icon'>${m.icon}</div><div style='font-size:1.1em;'>${m.name}</div><div style='font-size:0.8em; margin-top:6px;'>${m.desc}</div></div>`).join('')}
                </div>
                <div style='margin-top:24px; font-size:1.2em;'>FAQ</div>
                <div style='font-size:0.8em; margin-top:8px; text-align:left;'>
                    <b>Q:</b> How do I move?<br><b>A:</b> Use WASD or arrow keys.<br><br>
                    <b>Q:</b> How do I attack?<br><b>A:</b> Press Space.<br><br>
                    <b>Q:</b> How do I switch weapons?<br><b>A:</b> 1 = Sword, 2 = Bow, 3 = Staff.<br><br>
                    <b>Q:</b> What are buffs?<br><b>A:</b> Buffs are temporary power-ups from shrines.<br>
                </div>
                <button class='close-btn'>Close</button>
            </div>
        `;
        this.bestiaryOverlay.style.display = 'flex';
        this.bestiaryOverlay.querySelector('.close-btn').onclick = () => {
            this.bestiaryOverlay.style.display = 'none';
            if (onClose) onClose();
        };
    }
    showBiomeSelectionMenu(onSelect) {
        console.log("showBiomeSelectionMenu called");

        const biomes = [
            { id: 'GREEN_HILLS', icon: '🌳', name: 'Green Hills', desc: 'Easy - Lush grasslands, ogres and wisps.' },
            { id: 'DESERT', icon: '🏜️', name: 'Desert', desc: 'Dry and harsh, beware the cyclops and sandstorms.' },
            { id: 'MAGIC_FOREST', icon: '🌲', name: 'Magic Forest', desc: 'Enchanted woods, red skulls and wisps.' },
            { id: 'BARREN_LAND', icon: '🪨', name: 'Barren Land', desc: 'Sparse, rocky, dead trees and skulls.' },
            { id: 'MOUNTAINS', icon: '⛰️', name: 'Mountains', desc: 'Rocky terrain, tough monsters, rare shrines.' },
            { id: 'LAKE', icon: '💧', name: 'Crystal Lake', desc: 'A shimmering lake, magical wisps abound.' },
            { id: 'VOLCANO', icon: '🔥', name: 'Volcano', desc: 'Lava flows, high risk, high reward.' }
        ];
        if (!this.biomeSelectOverlay) {
            this.biomeSelectOverlay = document.createElement('div');
            this.biomeSelectOverlay.className = 'biome-info-overlay';
            this.container.appendChild(this.biomeSelectOverlay);
        }
        this.biomeSelectOverlay.innerHTML = '';
        const title = document.createElement('h2');
        title.textContent = 'Select Your Starting Biome';
        this.biomeSelectOverlay.appendChild(title);
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
        grid.style.gap = '18px';
        grid.style.marginTop = '18px';
        biomes.forEach(biome => {
            const card = document.createElement('div');
            card.className = 'biome-card';
            card.style.border = '3px solid #ffeb3b';
            card.style.background = '#222';
            card.style.color = 'white';
            card.style.padding = '18px';
            card.style.borderRadius = '10px';
            card.style.cursor = 'pointer';
            card.style.fontFamily = 'inherit';
            card.style.textAlign = 'center';
            card.style.transition = 'background 0.2s, transform 0.2s';
            card.innerHTML = `
                <div style="font-size: 2.5em; margin-bottom: 10px;">${biome.icon}</div>
                <div style="font-weight: bold; font-size: 1.1em; color: #ffeb3b; margin-bottom: 8px;">${biome.name}</div>
                <div style="font-size: 0.9em; line-height: 1.4; text-transform: none;">${biome.desc}</div>
            `;
            card.onmouseenter = () => {
                card.style.background = '#ffeb3b';
                card.style.color = '#222';
                card.style.transform = 'scale(1.05)';
            };
            card.onmouseleave = () => {
                card.style.background = '#222';
                card.style.color = 'white';
                card.style.transform = 'scale(1.0)';
            };
            card.onclick = () => {
                console.log("Biome card clicked:", biome.id);
                this.removeAllOverlays();
                onSelect(biome.id);
            };
            grid.appendChild(card);
        });
        this.biomeSelectOverlay.appendChild(grid);
        this.biomeSelectOverlay.style.display = 'flex';
        this.biomeSelectOverlay.style.flexDirection = 'column';
        this.biomeSelectOverlay.style.alignItems = 'center';
        this.biomeSelectOverlay.style.justifyContent = 'center';
        this.biomeSelectOverlay.style.position = 'absolute';
        this.biomeSelectOverlay.style.top = '0';
        this.biomeSelectOverlay.style.left = '0';
        this.biomeSelectOverlay.style.width = '100%';
        this.biomeSelectOverlay.style.height = '100%';
        this.biomeSelectOverlay.style.background = 'rgba(10, 20, 30, 0.92)';
        this.biomeSelectOverlay.style.zIndex = '600';
    }
    removeAllOverlays() {
        console.log("removeAllOverlays called - completely removing overlays from DOM");
        // Completely remove overlays from DOM
        if (this.biomeSelectOverlay && this.biomeSelectOverlay.parentNode) {
            this.biomeSelectOverlay.parentNode.removeChild(this.biomeSelectOverlay);
            this.biomeSelectOverlay = null;
            console.log("biomeSelectOverlay removed from DOM");
        }

        if (this.bestiaryOverlay && this.bestiaryOverlay.parentNode) {
            this.bestiaryOverlay.style.display = 'none';
        }
        if (this.pauseMenuOverlay && this.pauseMenuOverlay.parentNode) {
            this.pauseMenuOverlay.style.display = 'none';
        }
        
        // Hide fade overlay to ensure game is visible
        if (this.fadeOverlay) {
            this.fadeOverlay.style.opacity = '0';
            this.fadeOverlay.style.display = 'none';
            console.log("fadeOverlay hidden");
        }
        
        // Show the game UI
        if (this.uiOverlay) {
            this.uiOverlay.style.display = 'block';
            this.uiOverlay.style.visibility = 'visible';
            console.log("uiOverlay shown");
        }
    }
}