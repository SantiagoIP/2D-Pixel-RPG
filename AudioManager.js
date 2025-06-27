// Simple Web Audio API manager
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
        
        console.log("🎵 Preloading sounds...");
        
        // Generate simple sounds programmatically
        this.sounds['playerAttack'] = this.createSynthSound(440, 0.05, 'square', 0.5);
        this.sounds['monsterHit'] = this.createNoiseSound(0.15, 0.2);
        this.sounds['playerHit'] = this.createNoiseSound(0.25, 0.4);
        this.sounds['levelUp'] = this.createSynthSound(523.25, 0.5, 'triangle', 0.6);
        
        // Create music tracks
        this.createMusicTrack('overworld', 120, [
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
        
        this.createMusicTrack('adventure', 140, [
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
        
        this.createMusicTrack('mystic', 90, [
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
        
        console.log("🎵 Sounds and music preloaded");
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
        const notes = { 'C': 261.63, 'D': 293.66, 'E': 329.63, 'F': 349.23, 'G': 392.00, 'A': 440.00, 'B': 493.88 };
        const octave = parseInt(note.replace('#', '').slice(-1), 10);
        const key = note.replace('#', '').slice(0, -1);
        const baseFreq = notes[key];
        if (!baseFreq) return null;
        let freq = baseFreq * Math.pow(2, octave - 4);
        if (note.includes('#')) {
            freq *= Math.pow(2, 1/12); // Go up one semitone for a sharp
        }
        return freq;
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
        this.stopMusic(); // Stop any existing music
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
            
            const trackName = trackNames[Math.floor(Math.random() * trackNames.length)];
            const track = this.musicTracks[trackName];
            const noteDuration = 60 / track.tempo;
            let scheduleTime = this.audioContext.currentTime;
            let totalDuration = 0;
            
            console.log(`🎵 Playing track: ${trackName}`);
            
            for (const note of track.sequence) {
                const freq = this.getNoteFrequency(note.note);
                const duration = note.duration * noteDuration;
                
                if (freq && this.audioContext && this.audioContext.state === 'running') {
                    try {
                        const oscillator = this.audioContext.createOscillator();
                        const gainNode = this.audioContext.createGain();
                        
                        oscillator.type = 'triangle';
                        oscillator.frequency.setValueAtTime(freq, scheduleTime);
                        gainNode.gain.setValueAtTime(0.08, scheduleTime); // Lower volume
                        gainNode.gain.exponentialRampToValueAtTime(0.001, scheduleTime + duration * 0.9);
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(this.audioContext.destination);
                        oscillator.start(scheduleTime);
                        oscillator.stop(scheduleTime + duration);
                    } catch (error) {
                        console.error("🎵 Error creating audio note:", error);
                    }
                }
                
                scheduleTime += duration;
                totalDuration += duration;
            }
            
            // Schedule next track with a pause
            const pauseDuration = 3000 + Math.random() * 5000; // 3-8 second pause
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
        if (this.audioContext) {
            this.audioContext.close().catch(e => console.error("Error closing AudioContext:", e));
            this.audioContext = null;
        }
        this.sounds = {};
        this.isInitialized = false;
    }
}