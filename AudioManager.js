// Simple Web Audio API manager
export class AudioManager {
    constructor() {
        // Create AudioContext on first user interaction (or lazily)
        this.audioContext = null;
        this.sounds = {};
        this.musicTracks = {};
        this.currentMusicSource = null; // To control the currently playing music
        this.musicTimeoutId = null; // Store timeout ID to manage loops
        this.isInitialized = false;
        this.musicQueuedToPlay = false; // Flag to play music after user interaction
        // Attempt to initialize immediately, might require user gesture later
        this.tryInitialize();
    }

    tryInitialize() {
        if (this.isInitialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioContext.state === 'suspended') {
                 console.log("AudioContext suspended, needs user gesture to resume.");
                 // Add a listener to resume on first interaction (e.g., click)
                 const resumeAudio = () => {
                    if(this.audioContext && this.audioContext.state === 'suspended') {
                        this.audioContext.resume().then(() => {
                            console.log("AudioContext resumed successfully.");
                            this.preloadSounds(); // Load sounds after resuming
                            // If music was supposed to play, start it now
                            if (this.musicQueuedToPlay) {
                                this.musicQueuedToPlay = false; // Reset flag
                                this.playMusic();
                            }
                            window.removeEventListener('click', resumeAudio);
                            window.removeEventListener('keydown', resumeAudio);
                        });
                    }
                 };
                 window.addEventListener('click', resumeAudio, { once: true });
                 window.addEventListener('keydown', resumeAudio, { once: true });
            } else {
                this.preloadSounds();
            }
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
        }
    }

    preloadSounds() {
         if (!this.audioContext) return;
        console.log("Preloading sounds...");
        // Generate simple sounds programmatically
        this.sounds['playerAttack'] = this.createSynthSound(440, 0.05, 'square', 0.5); // Short 'pew'
        this.sounds['monsterHit'] = this.createNoiseSound(0.15, 0.2); // Short noise burst
        this.sounds['playerHit'] = this.createNoiseSound(0.25, 0.4); // Longer, slightly harsher noise
        this.sounds['levelUp'] = this.createSynthSound(523.25, 0.5, 'triangle', 0.6); // Upward 'ding'
        // Define music tracks
        this.createMusicTrack('overworld', 120, [
            // A Section (calm, establishing)
            { note: 'C4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
            { note: 'D4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'F4', duration: 0.5 },
            { note: 'C4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'G4', duration: 1.0 },
            { note: 'G4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'E4', duration: 0.5 }, { note: 'C4', duration: 0.5 },
            // B Section (brighter, more movement)
            { note: 'A4', duration: 0.5 }, { note: 'C5', duration: 0.5 }, { note: 'B4', duration: 0.5 }, { note: 'A4', duration: 0.5 },
            { note: 'G4', duration: 0.5 }, { note: 'B4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
            { note: 'F4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
            { note: 'D4', duration: 1.0 }, { note: 'G4', duration: 1.0 },
             // A Section Variation (return to theme with more flair)
            { note: 'C4', duration: 0.5 }, { note: 'E4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
            { note: 'D4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'A4', duration: 0.5 }, { note: 'F4', duration: 0.5 },
            { note: 'C4', duration: 0.25 }, { note: 'D4', duration: 0.25 }, { note: 'E4', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'G4', duration: 1.0 },
            { note: 'G4', duration: 0.25 }, { note: 'A4', duration: 0.25 }, { note: 'G4', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'E4', duration: 1.0 },
        ]);
        this.createMusicTrack('adventure', 140, [
             // Intro
            { note: 'G3', duration: 0.5 }, { note: 'C4', duration: 0.5 }, { note: 'D4', duration: 0.5 }, { note: 'D#4', duration: 0.5 },
            // Verse 1
            { note: 'G4', duration: 0.25 }, { note: 'A#4', duration: 0.25 }, { note: 'C5', duration: 0.5 }, { note: 'G4', duration: 0.5 },
            { note: 'D#4', duration: 0.25 }, { note: 'F4', duration: 0.25 }, { note: 'G4', duration: 0.5 }, { note: 'D#4', duration: 0.5 },
            // Chorus (dramatic)
            { note: 'C5', duration: 0.5 }, { note: 'D5', duration: 0.25 }, { note: 'D#5', duration: 0.75 },
            { note: 'A#4', duration: 0.5 }, { note: 'C5', duration: 0.25 }, { note: 'D5', duration: 0.75 },
            // Bridge
            { note: 'F4', duration: 1.0 }, { note: 'G#4', duration: 1.0 },
            { note: 'G4', duration: 1.0 }, { note: 'A#4', duration: 1.0 },
            // Outro
            { note: 'C5', duration: 0.5 }, { note: 'A#4', duration: 0.5 }, { note: 'G4', duration: 1.0 },
        ]);
        this.createMusicTrack('mystic', 90, [
             // Part 1: Slow and spacious
            { note: 'C3', duration: 1.5 }, { note: 'G3', duration: 0.5 }, { note: 'A#3', duration: 1.5 }, { note: 'F3', duration: 0.5 },
            { note: 'D#3', duration: 1.5 }, { note: 'A#3', duration: 0.5 }, { note: 'D3', duration: 1.5 }, { note: 'G3', duration: 0.5 },
            // Part 2: Building tension
            { note: 'C4', duration: 0.5 }, { note: 'D4', duration: 0.5 }, { note: 'D#4', duration: 1.0 },
            { note: 'F4', duration: 0.5 }, { note: 'G4', duration: 0.5 }, { note: 'G#4', duration: 1.0 },
            // Part 3: Climax and release
            { note: 'C5', duration: 2.0 }, { note: 'G#4', duration: 1.0 },
            { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 0.5 }, { note: 'D#4', duration: 2.0 },
            { note: 'C4', duration: 4.0 }, // Long fade out note
            // New: Extended section for longer music
            { note: 'A#3', duration: 1.0 }, { note: 'F3', duration: 0.5 }, { note: 'C4', duration: 1.0 },
            { note: 'D#4', duration: 0.5 }, { note: 'G3', duration: 1.0 }, { note: 'C4', duration: 0.5 },
            { note: 'A#3', duration: 1.0 }, { note: 'D4', duration: 0.5 }, { note: 'F4', duration: 1.0 },
            { note: 'G#4', duration: 0.5 }, { note: 'C5', duration: 1.5 }, { note: 'A#4', duration: 0.5 },
            { note: 'G4', duration: 1.0 }, { note: 'F4', duration: 0.5 }, { note: 'D#4', duration: 1.0 },
            { note: 'C4', duration: 2.0 },
            // Repeat a variation for even more length
            { note: 'C3', duration: 1.0 }, { note: 'G3', duration: 0.5 }, { note: 'A#3', duration: 1.0 },
            { note: 'F3', duration: 0.5 }, { note: 'D#3', duration: 1.0 }, { note: 'A#3', duration: 0.5 },
            { note: 'D3', duration: 1.0 }, { note: 'G3', duration: 0.5 }, { note: 'C4', duration: 1.0 },
            { note: 'D4', duration: 0.5 }, { note: 'D#4', duration: 1.0 }, { note: 'F4', duration: 0.5 },
            { note: 'G4', duration: 1.0 }, { note: 'G#4', duration: 0.5 }, { note: 'C5', duration: 2.0 },
            { note: 'G#4', duration: 1.0 }, { note: 'G4', duration: 0.5 }, { note: 'F4', duration: 0.5 },
            { note: 'D#4', duration: 2.0 }, { note: 'C4', duration: 4.0 }
        ]);
        this.isInitialized = true;
        console.log("Sounds and music preloaded.");
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
    playMusic() {
        // If context isn't ready, set a flag to play music once it is
        if (!this.audioContext || this.audioContext.state !== 'running') {
            this.musicQueuedToPlay = true;
            return;
        }
        this.stopMusic(); // Stop any previous music loop
        const trackNames = Object.keys(this.musicTracks);
        if (trackNames.length === 0) return;
        const playRandomTrack = () => {
            const name = trackNames[Math.floor(Math.random() * trackNames.length)];
            const track = this.musicTracks[name];
            const noteDuration = 60 / track.tempo;
            let trackTotalDuration = 0;
            let scheduleTime = this.audioContext.currentTime;
            for (const note of track.sequence) {
                const freq = this.getNoteFrequency(note.note);
                const duration = note.duration * noteDuration * 2; // Musical timing adjust
                if (freq) {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(freq, scheduleTime);
                    gainNode.gain.setValueAtTime(0.2, scheduleTime); // Music volume
                    gainNode.gain.exponentialRampToValueAtTime(0.01, scheduleTime + duration * 0.9);
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    oscillator.start(scheduleTime);
                    oscillator.stop(scheduleTime + duration);
                }
                scheduleTime += duration;
                trackTotalDuration += duration;
            }
            // Set a timeout to play the next random track after this one finishes
            // Set a timeout to play the next random track after this one finishes, plus a pause
            const pauseDuration = (Math.random() * 10 + 8) * 1000; // 8-18 second pause
            this.musicTimeoutId = setTimeout(playRandomTrack, (trackTotalDuration * 1000) + pauseDuration);
        };
        playRandomTrack();
    }
    playSound(soundName) {
        // Ensure context is running (might need user interaction first)
        this.tryInitialize(); // Try initializing if not done yet
         if (!this.audioContext || this.audioContext.state !== 'running') {
             // console.warn(`AudioContext not running. Cannot play sound: ${soundName}`);
             return;
         }

        const sound = this.sounds[soundName];
        if (sound) {
            sound();
        } else {
            console.warn(`Sound not found: ${soundName}`);
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