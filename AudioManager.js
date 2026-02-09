// Enhanced Web Audio API manager with volume controls, biome-specific music, and richer SFX
export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.musicTracks = {};
        this.currentMusicSource = null;
        this.musicTimeoutId = null;
        this.isInitialized = false;
        this.musicEnabled = false;
        this.userHasInteracted = false;
        
        // Volume controls (0.0 - 1.0)
        this.masterVolume = 0.7;
        this.musicVolume = 0.4;
        this.sfxVolume = 0.6;
        
        // Gain nodes for volume control
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        // Current biome for music selection
        this.currentBiome = 'GREEN_HILLS';
        this.currentTrackName = null;
        
        // Bind and setup user interaction detection
        this.handleUserInteraction = this.handleUserInteraction.bind(this);
        this.setupUserInteractionListeners();
        
        console.log("🎵 AudioManager created - waiting for user interaction");
    }

    setupUserInteractionListeners() {
        // Listen for any user interaction to enable audio
        const events = ['click', 'keydown', 'touchstart', 'mousedown'];
        events.forEach(event => {
            document.addEventListener(event, this.handleUserInteraction, { once: false });
        });
    }
    
    async handleUserInteraction() {
        if (this.userHasInteracted) return;
        
        console.log("🎵 User interaction detected - enabling audio");
        this.userHasInteracted = true;
        
        // Remove event listeners
        const events = ['click', 'keydown', 'touchstart', 'mousedown'];
        events.forEach(event => {
            document.removeEventListener(event, this.handleUserInteraction);
        });
        
        // Initialize audio system
        if (!this.isInitialized) {
            const success = await this.initialize();
            if (success) {
                console.log("🎵 Audio initialized successfully");
                this.startMusic();
            }
        }
    }

    async initialize() {
        if (this.isInitialized) return true;
        
        try {
            console.log("🎵 Initializing AudioContext...");
            
            // Create AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            console.log("🎵 AudioContext state:", this.audioContext.state);
            
            if (this.audioContext.state === 'running') {
                // Create gain node hierarchy: source -> sfx/music -> master -> destination
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = this.masterVolume;
                this.masterGain.connect(this.audioContext.destination);
                
                this.musicGain = this.audioContext.createGain();
                this.musicGain.gain.value = this.musicVolume;
                this.musicGain.connect(this.masterGain);
                
                this.sfxGain = this.audioContext.createGain();
                this.sfxGain.gain.value = this.sfxVolume;
                this.sfxGain.connect(this.masterGain);
                
                this.preloadSounds();
                this.isInitialized = true;
                this.musicEnabled = true;
                console.log("🎵 Audio system fully initialized!");
                return true;
            } else {
                console.warn("🎵 AudioContext not running:", this.audioContext.state);
                return false;
            }
        } catch (error) {
            console.error("🎵 Failed to initialize audio:", error);
            return false;
        }
    }

    preloadSounds() {
        if (!this.audioContext) return;
        
        console.log("🎵 Preloading enhanced sounds...");
        
        // Combat sounds
        this.sounds['playerAttack'] = this.createSwordSlashSound();
        this.sounds['playerAttack_bow'] = this.createBowSound();
        this.sounds['playerAttack_staff'] = this.createMagicCastSound();
        this.sounds['monsterHit'] = this.createImpactSound(0.15, 300);
        this.sounds['playerHit'] = this.createPlayerHurtSound();
        this.sounds['monsterDefeat'] = this.createDefeatSound();
        this.sounds['criticalHit'] = this.createCriticalHitSound();
        
        // UI / Feedback sounds
        this.sounds['levelUp'] = this.createLevelUpFanfare();
        this.sounds['questComplete'] = this.createQuestCompleteSound();
        this.sounds['itemPickup'] = this.createPickupSound();
        this.sounds['uiClick'] = this.createUIClickSound();
        this.sounds['uiOpen'] = this.createUIOpenSound();
        this.sounds['uiClose'] = this.createUICloseSound();
        this.sounds['notification'] = this.createNotificationSound();
        
        // Movement
        this.sounds['footstep'] = this.createFootstepSound();
        
        // Interaction
        this.sounds['shrineActivate'] = this.createShrineSound();
        this.sounds['npcGreet'] = this.createNPCGreetSound();
        this.sounds['purchase'] = this.createPurchaseSound();
        
        // Create biome-specific music tracks
        this.createMusicTrack('GREEN_HILLS', 120, [
            // Main Theme A (peaceful village)
            { note: 'C4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
            { note: 'D4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'F4', duration: 0.5 },
            { note: 'C4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'G4', duration: 1.0 },
            { note: 'G4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'E4', duration: 0.5 }, { note: 'C4', duration: 0.5 },
            // Theme B (wandering/exploration)
            { note: 'A4', duration: 0.5 }, { note: 'C5', duration: 0.5 }, { note: 'B4', duration: 0.5 }, { note: 'A4', duration: 0.5 },
            { note: 'G4', duration: 0.5 }, { note: 'B4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
            { note: 'F4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
            { note: 'D4', duration: 1.0 }, { note: 'G4', duration: 1.0 },
            // Theme C (heroic variation with harmonies)
            { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.25 }, { note: 'A4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
            { note: 'E5', duration: 0.25 }, { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'B4', duration: 0.5 },
            { note: 'C5', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'C4', duration: 0.5 },
            { note: 'D4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'G4', duration: 1.0 },
            // Extended Bridge (mysterious transition)
            { note: 'A3', duration: 1.0 }, { note: 'C4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
            { note: 'G4', duration: 0.75 }, { note: 'F4', duration: 0.25 }, { note: 'E4', duration: 0.5 }, { note: 'D4', duration: 0.5 },
            { note: 'C4', duration: 1.0 }, { note: 'G3', duration: 0.5 }, { note: 'A3', duration: 0.5 },
            { note: 'B3', duration: 0.5 }, { note: 'D4', duration: 0.5 }, { note: 'G4', duration: 1.0 },
            // Theme A Return (more ornate)
            { note: 'C4', duration: 0.25 }, { note: 'D4', duration: 0.25 }, { note: 'E4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
            { note: 'D4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'F4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'F4', duration: 0.5 },
            { note: 'C4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'B4', duration: 0.5 }, { note: 'A4', duration: 0.5 },
            { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'E4', duration: 1.0 }, { note: 'C4', duration: 1.0 },
        ]);
        
        this.createMusicTrack('DESERT', 140, [
            // Epic Intro
            { note: 'G3', duration: 0.5 }, { note: 'C4', duration: 0.5 }, { note: 'D4', duration: 0.5 }, { note: 'D#4', duration: 0.5 },
            { note: 'F4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'A#4', duration: 0.5 }, { note: 'G4', duration: 1.0 },
            // Main Adventure Theme
            { note: 'G4', duration: 0.25 }, { note: 'A#4', duration: 0.25 }, { note: 'C5', duration: 0.5 }, { note: 'G4', duration: 0.5 },
            { note: 'D#4', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'G4', duration: 0.5 }, { note: 'D#4', duration: 0.5 },
            { note: 'A#4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 }, { note: 'A#4', duration: 0.5 },
            { note: 'F4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'A#4', duration: 0.5 }, { note: 'F4', duration: 0.5 },
            // Dramatic Chorus
            { note: 'C5', duration: 0.5 }, { note: 'D5', duration: 0.25 }, { note: 'D#5', duration: 0.75 },
            { note: 'A#4', duration: 0.5 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.75 },
            { note: 'F5', duration: 0.5 }, { note: 'D#5', duration: 0.5 }, { note: 'D5', duration: 0.5 }, { note: 'C5', duration: 0.5 },
            { note: 'A#4', duration: 1.0 }, { note: 'G4', duration: 1.0 },
            // Battle Bridge (intense)
            { note: 'D5', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'A#4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'G4', duration: 0.5 },
            { note: 'F4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'A#4', duration: 0.25 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.5 },
            { note: 'D#5', duration: 0.5 }, { note: 'F5', duration: 0.5 }, { note: 'G5', duration: 1.0 },
            { note: 'F5', duration: 0.5 }, { note: 'D#5', duration: 0.5 }, { note: 'D5', duration: 0.5 }, { note: 'C5', duration: 0.5 },
            // Heroic Resolution
            { note: 'C5', duration: 0.5 }, { note: 'A#4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 0.5 },
            { note: 'D#4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'G4', duration: 1.0 },
            { note: 'A#4', duration: 0.5 }, { note: 'C5', duration: 0.5 }, { note: 'D5', duration: 1.0 },
            { note: 'C5', duration: 2.0 }, { note: 'G4', duration: 2.0 },
        ]);
        
        this.createMusicTrack('MAGIC_FOREST', 90, [
            // Ethereal Opening
            { note: 'C3', duration: 1.5 }, { note: 'G3', duration: 0.5 }, { note: 'A#3', duration: 1.5 }, { note: 'F3', duration: 0.5 },
            { note: 'D#3', duration: 1.5 }, { note: 'A#3', duration: 0.5 }, { note: 'D3', duration: 1.5 }, { note: 'G3', duration: 0.5 },
            { note: 'C4', duration: 1.0 }, { note: 'G3', duration: 0.5 }, { note: 'D#4', duration: 1.0 }, { note: 'A#3', duration: 0.5 },
            // Mystical Development
            { note: 'F4', duration: 0.5 }, { note: 'D#4', duration: 0.5 }, { note: 'D4', duration: 0.5 }, { note: 'C4', duration: 0.5 },
            { note: 'A#3', duration: 0.5 }, { note: 'C4', duration: 0.5 }, { note: 'D4', duration: 1.0 },
            { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'D#4', duration: 0.5 }, { note: 'D4', duration: 0.5 },
            { note: 'C4', duration: 1.0 }, { note: 'G3', duration: 1.0 },
            // Magic Crescendo
            { note: 'C4', duration: 0.5 }, { note: 'D4', duration: 0.5 }, { note: 'D#4', duration: 1.0 },
            { note: 'F4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'G#4', duration: 1.0 },
            { note: 'A#4', duration: 0.5 }, { note: 'C5', duration: 0.5 }, { note: 'D5', duration: 1.0 },
            { note: 'D#5', duration: 0.5 }, { note: 'F5', duration: 0.5 }, { note: 'G5', duration: 2.0 },
            // Magical Climax
            { note: 'C5', duration: 2.0 }, { note: 'G#4', duration: 1.0 }, { note: 'F4', duration: 1.0 },
            { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'D#4', duration: 2.0 },
            { note: 'C4', duration: 4.0 },
            // Extended Mystical Journey
            { note: 'A#3', duration: 1.0 }, { note: 'F3', duration: 0.5 }, { note: 'C4', duration: 1.0 },
            { note: 'D#4', duration: 0.5 }, { note: 'G3', duration: 1.0 }, { note: 'C4', duration: 0.5 },
            { note: 'A#3', duration: 1.0 }, { note: 'D4', duration: 0.5 }, { note: 'F4', duration: 1.0 },
            { note: 'G#4', duration: 0.5 }, { note: 'C5', duration: 1.5 }, { note: 'A#4', duration: 0.5 },
            { note: 'G4', duration: 1.0 }, { note: 'F4', duration: 0.5 }, { note: 'D#4', duration: 1.0 },
            { note: 'C4', duration: 2.0 }, { note: 'G3', duration: 1.0 }, { note: 'C3', duration: 3.0 },
            // Ethereal Outro with Harmony
            { note: 'C3', duration: 1.0 }, { note: 'G3', duration: 0.5 }, { note: 'A#3', duration: 1.0 },
            { note: 'F3', duration: 0.5 }, { note: 'D#3', duration: 1.0 }, { note: 'A#3', duration: 0.5 },
            { note: 'D3', duration: 1.0 }, { note: 'G3', duration: 0.5 }, { note: 'C4', duration: 1.0 },
            { note: 'D4', duration: 0.5 }, { note: 'D#4', duration: 1.0 }, { note: 'F4', duration: 0.5 },
            { note: 'G4', duration: 1.0 }, { note: 'G#4', duration: 0.5 }, { note: 'C5', duration: 2.0 },
            { note: 'G#4', duration: 1.0 }, { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 0.5 },
            { note: 'D#4', duration: 2.0 }, { note: 'C4', duration: 4.0 }, { note: 'C3', duration: 4.0 }
        ]);
        
        // Additional biome tracks
        this.createMusicTrack('VOLCANO', 100, [
            { note: 'E3', duration: 1.0 }, { note: 'G3', duration: 0.5 }, { note: 'A3', duration: 0.5 },
            { note: 'B3', duration: 1.0 }, { note: 'E3', duration: 0.5 }, { note: 'G3', duration: 0.5 },
            { note: 'A3', duration: 0.5 }, { note: 'G3', duration: 0.5 }, { note: 'E3', duration: 1.0 },
            { note: 'D3', duration: 1.0 }, { note: 'E3', duration: 0.5 }, { note: 'G3', duration: 0.5 },
            { note: 'B3', duration: 1.0 }, { note: 'A3', duration: 0.5 }, { note: 'G3', duration: 0.5 },
            { note: 'E3', duration: 2.0 },
        ]);
        
        this.createMusicTrack('MOUNTAINS', 80, [
            { note: 'D4', duration: 1.0 }, { note: 'A3', duration: 0.5 }, { note: 'F3', duration: 1.0 },
            { note: 'G3', duration: 0.5 }, { note: 'A3', duration: 1.0 }, { note: 'D4', duration: 0.5 },
            { note: 'C4', duration: 1.0 }, { note: 'A3', duration: 0.5 }, { note: 'G3', duration: 1.0 },
            { note: 'F3', duration: 1.0 }, { note: 'G3', duration: 0.5 }, { note: 'A3', duration: 1.5 },
            { note: 'D4', duration: 2.0 },
        ]);
        
        this.createMusicTrack('LAKE', 70, [
            { note: 'C4', duration: 1.5 }, { note: 'E4', duration: 1.0 }, { note: 'G4', duration: 0.5 },
            { note: 'A4', duration: 1.5 }, { note: 'G4', duration: 0.5 }, { note: 'E4', duration: 1.0 },
            { note: 'D4', duration: 1.5 }, { note: 'C4', duration: 1.0 }, { note: 'E4', duration: 0.5 },
            { note: 'G4', duration: 2.0 }, { note: 'E4', duration: 1.0 }, { note: 'C4', duration: 2.0 },
        ]);
        
        this.createMusicTrack('BARREN_LAND', 60, [
            { note: 'A3', duration: 2.0 }, { note: 'C4', duration: 1.0 }, { note: 'D4', duration: 0.5 },
            { note: 'E4', duration: 1.5 }, { note: 'D4', duration: 0.5 }, { note: 'C4', duration: 1.0 },
            { note: 'A3', duration: 2.0 }, { note: 'G3', duration: 1.0 }, { note: 'A3', duration: 3.0 },
        ]);
        
        console.log("🎵 Enhanced sounds and biome-specific music preloaded");
    }

    // === Enhanced Sound Creation Methods ===
    
    createSwordSlashSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            // Noise burst filtered to high frequencies
            const bufferSize = this.audioContext.sampleRate * 0.08;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
            }
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 2000;
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain || this.audioContext.destination);
            source.start(now);
            source.stop(now + 0.08);
        };
    }
    
    createBowSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain);
            gain.connect(this.sfxGain || this.audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        };
    }
    
    createMagicCastSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            // Magical shimmer - two detuned oscillators
            for (let i = 0; i < 2; i++) {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600 + i * 15, now);
                osc.frequency.exponentialRampToValueAtTime(1200 + i * 30, now + 0.2);
                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(this.sfxGain || this.audioContext.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        };
    }
    
    createImpactSound(duration, freq) {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            const bufferSize = this.audioContext.sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
            }
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = freq;
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain || this.audioContext.destination);
            source.start(now);
            source.stop(now + duration);
        };
    }
    
    createPlayerHurtSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(this.sfxGain || this.audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        };
    }
    
    createDefeatSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain);
            gain.connect(this.sfxGain || this.audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        };
    }
    
    createCriticalHitSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            // Bright rising tone + impact
            const osc = this.audioContext.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain);
            gain.connect(this.sfxGain || this.audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        };
    }
    
    createLevelUpFanfare() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
            notes.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                const gain = this.audioContext.createGain();
                const start = now + i * 0.12;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
                osc.connect(gain);
                gain.connect(this.sfxGain || this.audioContext.destination);
                osc.start(start);
                osc.stop(start + 0.5);
            });
        };
    }
    
    createQuestCompleteSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            const notes = [392, 493.88, 587.33, 783.99]; // G4 B4 D5 G5
            notes.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const gain = this.audioContext.createGain();
                const start = now + i * 0.15;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.25, start + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
                osc.connect(gain);
                gain.connect(this.sfxGain || this.audioContext.destination);
                osc.start(start);
                osc.stop(start + 0.6);
            });
        };
    }
    
    createPickupSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain);
            gain.connect(this.sfxGain || this.audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        };
    }
    
    createUIClickSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 800;
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.connect(gain);
            gain.connect(this.sfxGain || this.audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.04);
        };
    }
    
    createUIOpenSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain);
            gain.connect(this.sfxGain || this.audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        };
    }
    
    createUICloseSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(this.sfxGain || this.audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        };
    }
    
    createNotificationSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            [660, 880].forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const gain = this.audioContext.createGain();
                const start = now + i * 0.1;
                gain.gain.setValueAtTime(0.15, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
                osc.connect(gain);
                gain.connect(this.sfxGain || this.audioContext.destination);
                osc.start(start);
                osc.stop(start + 0.15);
            });
        };
    }
    
    createFootstepSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            const bufferSize = this.audioContext.sampleRate * 0.05;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 5);
            }
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400 + Math.random() * 200;
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain || this.audioContext.destination);
            source.start(now);
            source.stop(now + 0.05);
        };
    }
    
    createShrineSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            // Ethereal shimmer chord
            [440, 554.37, 659.25, 880].forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
                osc.connect(gain);
                gain.connect(this.sfxGain || this.audioContext.destination);
                osc.start(now + i * 0.05);
                osc.stop(now + 1.5);
            });
        };
    }
    
    createNPCGreetSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.linearRampToValueAtTime(500, now + 0.15);
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(this.sfxGain || this.audioContext.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        };
    }
    
    createPurchaseSound() {
        return () => {
            if (!this.audioContext || this.audioContext.state !== 'running') return;
            const now = this.audioContext.currentTime;
            // Coin jingle
            [1200, 1400, 1600].forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const gain = this.audioContext.createGain();
                const start = now + i * 0.06;
                gain.gain.setValueAtTime(0.12, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
                osc.connect(gain);
                gain.connect(this.sfxGain || this.audioContext.destination);
                osc.start(start);
                osc.stop(start + 0.1);
            });
        };
    }
    
    // Volume control methods
    setMasterVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.masterVolume, this.audioContext.currentTime, 0.1);
        }
    }
    
    setMusicVolume(value) {
        this.musicVolume = Math.max(0, Math.min(1, value));
        if (this.musicGain) {
            this.musicGain.gain.setTargetAtTime(this.musicVolume, this.audioContext.currentTime, 0.1);
        }
    }
    
    setSFXVolume(value) {
        this.sfxVolume = Math.max(0, Math.min(1, value));
        if (this.sfxGain) {
            this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.audioContext.currentTime, 0.1);
        }
    }
    
    // Biome-aware music selection
    setBiome(biomeName) {
        this.currentBiome = biomeName;
        if (this.musicEnabled && this.isInitialized) {
            // Transition to biome-appropriate music
            this.playMusicNow();
        }
    }

    createSynthSound(frequency, duration, type = 'sine', volume = 0.5) {
        return () => {
             if (!this.audioContext || this.audioContext.state !== 'running') return;
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

     createNoiseSound(duration, volume = 0.5) {
        return () => {
             if (!this.audioContext || this.audioContext.state !== 'running') return;
            const bufferSize = this.audioContext.sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1; // White noise
            }

            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = buffer;
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);


            noiseSource.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            noiseSource.start(this.audioContext.currentTime);
            noiseSource.stop(this.audioContext.currentTime + duration); // Ensure it stops
        };
    }
    // Note to frequency map (simplified)
    getNoteFrequency(note) {
        // Full chromatic note map at octave 4
        const noteMap = {
            'C': 261.63, 'C#': 277.18, 'Db': 277.18,
            'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
            'E': 329.63, 'Fb': 329.63,
            'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
            'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
            'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
            'B': 493.88, 'Cb': 493.88
        };
        
        // Parse note name and octave (e.g., "A#4" -> noteName="A#", octave=4)
        const octaveChar = note.slice(-1);
        const octave = parseInt(octaveChar, 10);
        const noteName = note.slice(0, -1);
        
        if (isNaN(octave)) return null;
        
        const baseFreq = noteMap[noteName];
        if (!baseFreq) return null;
        
        return baseFreq * Math.pow(2, octave - 4);
    }
    createMusicTrack(name, tempo, sequence) {
        this.musicTracks[name] = { tempo, sequence };
    }
    stopMusic() {
        if (this.musicTimeoutId) {
            clearTimeout(this.musicTimeoutId);
            this.musicTimeoutId = null;
        }
        // We don't need to stop individual notes as they are scheduled with a finite duration.
    }
    startMusic() {
        console.log("🎵 Starting music system...");
        
        if (!this.isInitialized || !this.audioContext) {
            console.log("🎵 Audio not initialized, cannot start music");
            return;
        }
        
        if (this.audioContext.state !== 'running') {
            console.log("🎵 AudioContext not running:", this.audioContext.state);
            return;
        }
        
        this.musicEnabled = true;
        this.playMusicNow();
    }
    
    playMusic() {
        // Legacy method for compatibility
        if (this.userHasInteracted && this.isInitialized) {
            this.startMusic();
        }
    }
    
    playMusicNow() {
        this.stopMusic();
        this.musicEnabled = true;
        
        const trackNames = Object.keys(this.musicTracks);
        if (trackNames.length === 0) {
            console.warn("🎵 No music tracks available");
            return;
        }
        
        console.log("🎵 Starting music playback now...");
        
        const playTrack = () => {
            if (!this.musicEnabled || !this.audioContext || this.audioContext.state !== 'running') {
                console.log("🎵 Music stopped or audio unavailable");
                return;
            }
            
            // Prefer biome-specific track, fallback to random
            let trackName = this.currentBiome;
            if (!this.musicTracks[trackName]) {
                trackName = trackNames[Math.floor(Math.random() * trackNames.length)];
            }
            
            const track = this.musicTracks[trackName];
            const noteDuration = 60 / track.tempo;
            let scheduleTime = this.audioContext.currentTime;
            let totalDuration = 0;
            this.currentTrackName = trackName;
            
            console.log(`🎵 Playing track: ${trackName}`);
            
            // Choose oscillator type based on biome for tonal variety
            const biomeOscTypes = {
                'GREEN_HILLS': 'triangle',
                'DESERT': 'sawtooth',
                'MAGIC_FOREST': 'sine',
                'VOLCANO': 'square',
                'MOUNTAINS': 'triangle',
                'LAKE': 'sine',
                'BARREN_LAND': 'sawtooth'
            };
            const oscType = biomeOscTypes[trackName] || 'triangle';
            const destination = this.musicGain || this.audioContext.destination;
            
            for (const note of track.sequence) {
                const freq = this.getNoteFrequency(note.note);
                const duration = note.duration * noteDuration;
                
                if (freq && this.audioContext && this.audioContext.state === 'running') {
                    try {
                        // Main melody voice
                        const oscillator = this.audioContext.createOscillator();
                        const gainNode = this.audioContext.createGain();
                        
                        oscillator.type = oscType;
                        oscillator.frequency.setValueAtTime(freq, scheduleTime);
                        gainNode.gain.setValueAtTime(0.1, scheduleTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, scheduleTime + duration * 0.9);
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(destination);
                        oscillator.start(scheduleTime);
                        oscillator.stop(scheduleTime + duration);
                        
                        // Add a subtle harmonic an octave below for depth (pad layer)
                        if (duration >= 0.5) {
                            const pad = this.audioContext.createOscillator();
                            const padGain = this.audioContext.createGain();
                            pad.type = 'sine';
                            pad.frequency.setValueAtTime(freq / 2, scheduleTime);
                            padGain.gain.setValueAtTime(0.03, scheduleTime);
                            padGain.gain.exponentialRampToValueAtTime(0.001, scheduleTime + duration * 0.85);
                            pad.connect(padGain);
                            padGain.connect(destination);
                            pad.start(scheduleTime);
                            pad.stop(scheduleTime + duration);
                        }
                    } catch (error) {
                        // Silently continue on audio errors
                    }
                }
                
                scheduleTime += duration;
                totalDuration += duration;
            }
            
            // Schedule next track with a pause
            const pauseDuration = 2000 + Math.random() * 4000;
            this.musicTimeoutId = setTimeout(playTrack, (totalDuration * 1000) + pauseDuration);
        };
        
        playTrack();
    }
    playSound(soundName) {
        // Only play sounds if audio is properly initialized
        if (!this.audioContext || this.audioContext.state !== 'running' || !this.isInitialized) {
            return;
        }

        const sound = this.sounds[soundName];
        if (sound) {
            sound();
        } else {
            console.warn(`Sound not found: ${soundName}`);
        }
    }

    toggleMusic() {
        console.log("🎵 Toggle music called. Current state - enabled:", this.musicEnabled, "initialized:", this.isInitialized, "interacted:", this.userHasInteracted);
        
        if (!this.userHasInteracted) {
            console.log("🎵 User hasn't interacted yet - music toggle will work after interaction");
            return;
        }
        
        if (!this.isInitialized) {
            console.log("🎵 Audio not initialized, initializing now...");
            this.initialize().then((success) => {
                if (success) {
                    console.log("🎵 Audio initialized for toggle, starting music");
                    this.startMusic();
                }
            });
            return;
        }
        
        if (this.musicEnabled) {
            console.log("🎵 Stopping music");
            this.stopMusic();
            this.musicEnabled = false;
        } else {
            console.log("🎵 Starting music");
            this.startMusic();
        }
    }

    dispose() {
        this.stopMusic();
        
        // Clear any pending music timeout to prevent memory leaks
        if (this.musicTimeoutId) {
            clearTimeout(this.musicTimeoutId);
            this.musicTimeoutId = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close().catch(e => console.error("Error closing AudioContext:", e));
            this.audioContext = null;
        }
        this.sounds = {};
        this.isInitialized = false;
    }
    
    // Enhanced Audio Features
    playPositionalSound(soundType, position, listener, volume = 1.0) {
        if (!this.isInitialized || !this.audioContext) return;
        
        const sound = this.sounds[soundType];
        if (!sound) return;
        
        // Create positional audio
        const source = this.audioContext.createBufferSource();
        const panner = this.audioContext.createPanner();
        const gainNode = this.audioContext.createGain();
        
        // Configure 3D audio
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'exponential';
        panner.refDistance = 1;
        panner.maxDistance = 50;
        panner.rolloffFactor = 1;
        
        // Set positions
        panner.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
        panner.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
        panner.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);
        
        if (listener) {
            this.audioContext.listener.positionX.setValueAtTime(listener.x, this.audioContext.currentTime);
            this.audioContext.listener.positionY.setValueAtTime(listener.y, this.audioContext.currentTime);
            this.audioContext.listener.positionZ.setValueAtTime(listener.z, this.audioContext.currentTime);
        }
        
        // Set volume
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        
        // Connect nodes
        source.buffer = sound;
        source.connect(panner);
        panner.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Play sound
        source.start();
        
        return { source, panner, gainNode };
    }
    
    createAudioFade(audioNode, targetVolume, duration = 1.0) {
        if (!this.audioContext || !audioNode.gain) return;
        
        const currentTime = this.audioContext.currentTime;
        audioNode.gain.exponentialRampToValueAtTime(
            Math.max(0.001, targetVolume), 
            currentTime + duration
        );
    }
    
    playWithReverb(soundType, reverbAmount = 0.3, volume = 1.0) {
        if (!this.isInitialized || !this.audioContext) return;
        
        const sound = this.sounds[soundType];
        if (!sound) return;
        
        // Create reverb effect
        const convolver = this.audioContext.createConvolver();
        const dryGain = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();
        const outputGain = this.audioContext.createGain();
        
        // Create impulse response for reverb
        this.createReverbImpulse(convolver, 2, 2, false);
        
        // Set levels
        dryGain.gain.setValueAtTime(1 - reverbAmount, this.audioContext.currentTime);
        wetGain.gain.setValueAtTime(reverbAmount, this.audioContext.currentTime);
        outputGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        
        // Create and connect source
        const source = this.audioContext.createBufferSource();
        source.buffer = sound;
        
        // Connect audio graph
        source.connect(dryGain);
        source.connect(convolver);
        
        dryGain.connect(outputGain);
        convolver.connect(wetGain);
        wetGain.connect(outputGain);
        
        outputGain.connect(this.audioContext.destination);
        
        source.start();
        return source;
    }
    
    createReverbImpulse(convolver, duration, decay, reverse) {
        const length = this.audioContext.sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const n = reverse ? length - i : i;
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
            }
        }
        
        convolver.buffer = impulse;
    }
    
    playSequence(sounds, interval = 0.5) {
        if (!Array.isArray(sounds)) return;
        
        sounds.forEach((soundType, index) => {
            setTimeout(() => {
                this.playSound(soundType);
            }, index * interval * 1000);
        });
    }
    
    playRandomSound(soundArray, volume = 1.0) {
        if (!Array.isArray(soundArray) || soundArray.length === 0) return;
        
        const randomSound = soundArray[Math.floor(Math.random() * soundArray.length)];
        this.playSound(randomSound, volume);
    }
    
    // Environmental audio
    setEnvironmentalAudio(environment) {
        const environmentSounds = {
            forest: ['birds', 'wind', 'leaves'],
            cave: ['drips', 'echo', 'bats'],
            city: ['crowd', 'traffic', 'bells'],
            dungeon: ['chains', 'torch', 'rats'],
            beach: ['waves', 'seagulls', 'wind']
        };
        
        const sounds = environmentSounds[environment];
        if (sounds) {
            sounds.forEach(soundType => {
                this.playSound(soundType, 0.3); // Ambient volume
            });
        }
    }
    
    // Dynamic music system
    crossfadeMusic(newTrack, fadeTime = 2.0) {
        if (!this.isInitialized) return;
        
        // Fade out current music
        if (this.currentMusicSource) {
            this.createAudioFade(this.currentMusicSource.gainNode, 0, fadeTime);
            
            setTimeout(() => {
                if (this.currentMusicSource) {
                    this.currentMusicSource.source.stop();
                }
            }, fadeTime * 1000);
        }
        
        // Fade in new music
        setTimeout(() => {
            this.playMusic(newTrack);
        }, fadeTime * 500); // Start new track halfway through fade
    }
    
    // Audio feedback for game events
    playLevelUpSound() {
        this.playSequence(['chime', 'success', 'fanfare'], 0.3);
    }
    
    playDeathSound() {
        this.playWithReverb('death', 0.5, 0.8);
    }
    
    playMagicSound(spellType = 'generic') {
        const magicSounds = {
            fire: ['fire_cast', 'flames'],
            ice: ['ice_cast', 'freeze'],
            lightning: ['lightning', 'thunder'],
            healing: ['heal', 'blessing'],
            generic: ['magic', 'spell']
        };
        
        const sounds = magicSounds[spellType] || magicSounds.generic;
        this.playRandomSound(sounds);
    }
    
    playUISound(action) {
        const uiSounds = {
            click: 'ui_click',
            hover: 'ui_hover',
            open: 'ui_open',
            close: 'ui_close',
            error: 'ui_error',
            success: 'ui_success'
        };
        
        const soundType = uiSounds[action];
        if (soundType) {
            this.playSound(soundType, 0.7);
        }
    }
}