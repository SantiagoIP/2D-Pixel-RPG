import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
// Performance Optimization System
// Handles frame rate monitoring, LOD management, and resource optimization

export class PerformanceOptimizer {
    constructor(game) {
        this.game = game;
        this.targetFPS = 60;
        this.minFPS = 30;
        this.frameHistory = [];
        this.frameHistoryLength = 60; // Track last 60 frames
        this.currentFPS = 60;
        this.averageFPS = 60;
        
        // Performance settings
        this.settings = {
            renderDistance: 50,
            particleLimit: 1000,
            shadowQuality: 'high',
            textureQuality: 'high',
            antialiasing: true,
            bloomEffect: true,
            autoOptimize: true
        };
        
        // LOD (Level of Detail) system
        this.lodLevels = {
            high: { distance: 20, particleMultiplier: 1.0, detailLevel: 'full' },
            medium: { distance: 35, particleMultiplier: 0.7, detailLevel: 'reduced' },
            low: { distance: 50, particleMultiplier: 0.4, detailLevel: 'minimal' }
        };
        
        // Performance monitoring
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.performanceMetrics = {
            renderTime: 0,
            updateTime: 0,
            memoryUsage: 0,
            drawCalls: 0
        };
        
        this.initializeOptimizations();
    }
    
    initializeOptimizations() {
        // Set up renderer optimizations
        this.optimizeRenderer();
        
        // Initialize object pooling
        this.initializeObjectPools();
        
        // Set up automatic quality adjustment
        if (this.settings.autoOptimize) {
            this.startPerformanceMonitoring();
        }
        
        // Add performance UI
        this.createPerformanceUI();
    }
    
    optimizeRenderer() {
        const renderer = this.game.renderer;
        
        // Enable frustum culling
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Optimize shadow settings
        if (this.settings.shadowQuality === 'low') {
            renderer.shadowMap.enabled = false;
        } else {
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = this.settings.shadowQuality === 'high' ? 
                THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
        }
        
        // Set appropriate render size
        const renderScale = this.settings.textureQuality === 'high' ? 1.0 : 
                           this.settings.textureQuality === 'medium' ? 0.75 : 0.5;
        
        const width = Math.floor(window.innerWidth * renderScale);
        const height = Math.floor(window.innerHeight * renderScale);
        renderer.setSize(width, height);
    }
    
    initializeObjectPools() {
        // Vector3 pool for reduced garbage collection
        this.vector3Pool = {
            pool: [],
            get() {
                return this.pool.length > 0 ? this.pool.pop().set(0, 0, 0) : new THREE.Vector3();
            },
            release(vector) {
                this.pool.push(vector);
            }
        };
        
        // Matrix4 pool
        this.matrix4Pool = {
            pool: [],
            get() {
                return this.pool.length > 0 ? this.pool.pop().identity() : new THREE.Matrix4();
            },
            release(matrix) {
                this.pool.push(matrix);
            }
        };
        
        // Color pool
        this.colorPool = {
            pool: [],
            get() {
                return this.pool.length > 0 ? this.pool.pop().setRGB(1, 1, 1) : new THREE.Color();
            },
            release(color) {
                this.pool.push(color);
            }
        };
    }
    
    startPerformanceMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.analyzePerformance();
            this.adjustQualitySettings();
        }, 2000); // Check every 2 seconds
    }
    
    updateFrameRate(deltaTime) {
        this.frameCount++;
        const currentTime = performance.now();
        
        // Calculate current FPS
        this.currentFPS = 1000 / (deltaTime * 1000);
        
        // Update frame history
        this.frameHistory.push(this.currentFPS);
        if (this.frameHistory.length > this.frameHistoryLength) {
            this.frameHistory.shift();
        }
        
        // Calculate average FPS
        if (this.frameHistory.length > 0) {
            this.averageFPS = this.frameHistory.reduce((sum, fps) => sum + fps, 0) / this.frameHistory.length;
        }
        
        // Update performance metrics
        this.performanceMetrics.renderTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update memory usage (if available)
        if (performance.memory) {
            this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024); // MB
        }
    }
    
    analyzePerformance() {
        const lowFPSFrames = this.frameHistory.filter(fps => fps < this.minFPS).length;
        const lowFPSPercentage = lowFPSFrames / this.frameHistory.length;
        
        // Performance classification
        if (this.averageFPS >= this.targetFPS * 0.9) {
            this.performanceLevel = 'excellent';
        } else if (this.averageFPS >= this.targetFPS * 0.7) {
            this.performanceLevel = 'good';
        } else if (this.averageFPS >= this.targetFPS * 0.5) {
            this.performanceLevel = 'fair';
        } else {
            this.performanceLevel = 'poor';
        }
        
        // Detect performance issues
        this.performanceIssues = {
            lowFPS: lowFPSPercentage > 0.3,
            highMemory: this.performanceMetrics.memoryUsage > 500, // 500MB threshold
            inconsistentFramerate: this.getFrameTimeVariance() > 16.67 // > 1 frame variance
        };
    }
    
    getFrameTimeVariance() {
        if (this.frameHistory.length < 10) return 0;
        
        const frameTimes = this.frameHistory.map(fps => 1000 / fps);
        const average = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
        const variance = frameTimes.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / frameTimes.length;
        return Math.sqrt(variance);
    }
    
    adjustQualitySettings() {
        if (!this.settings.autoOptimize) return;
        
        // Automatic quality adjustment based on performance
        switch (this.performanceLevel) {
            case 'poor':
                this.setQualityPreset('low');
                break;
            case 'fair':
                this.setQualityPreset('medium');
                break;
            case 'good':
            case 'excellent':
                // Gradually increase quality if performance allows
                if (this.averageFPS > this.targetFPS * 0.95) {
                    this.graduallyIncreaseQuality();
                }
                break;
        }
    }
    
    setQualityPreset(preset) {
        const presets = {
            low: {
                renderDistance: 30,
                particleLimit: 300,
                shadowQuality: 'off',
                textureQuality: 'low',
                antialiasing: false,
                bloomEffect: false
            },
            medium: {
                renderDistance: 40,
                particleLimit: 600,
                shadowQuality: 'low',
                textureQuality: 'medium',
                antialiasing: false,
                bloomEffect: true
            },
            high: {
                renderDistance: 50,
                particleLimit: 1000,
                shadowQuality: 'high',
                textureQuality: 'high',
                antialiasing: true,
                bloomEffect: true
            }
        };
        
        const newSettings = presets[preset];
        if (newSettings) {
            Object.assign(this.settings, newSettings);
            this.applySettings();
        }
    }
    
    graduallyIncreaseQuality() {
        // Slowly increase quality if performance allows
        if (this.settings.particleLimit < 1000) {
            this.settings.particleLimit = Math.min(1000, this.settings.particleLimit + 50);
        }
        
        if (this.settings.renderDistance < 50) {
            this.settings.renderDistance = Math.min(50, this.settings.renderDistance + 2);
        }
        
        if (this.settings.shadowQuality === 'off' && this.averageFPS > this.targetFPS * 0.9) {
            this.settings.shadowQuality = 'low';
        }
        
        this.applySettings();
    }
    
    applySettings() {
        // Apply render distance
        if (this.game.camera) {
            this.game.camera.far = this.settings.renderDistance;
            this.game.camera.updateProjectionMatrix();
        }
        
        // Apply particle limit
        if (this.game.particleSystem) {
            this.game.particleSystem.maxParticles = this.settings.particleLimit;
        }
        
        // Apply renderer settings
        this.optimizeRenderer();
        
        // Notify of quality changes
        this.showQualityNotification();
    }
    
    showQualityNotification() {
        if (this.lastNotificationTime && Date.now() - this.lastNotificationTime < 5000) {
            return; // Don't spam notifications
        }
        
        this.lastNotificationTime = Date.now();
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #2196f3, #1976d2);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: 'Cinzel', serif;
            font-size: 0.9rem;
            z-index: 2500;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const qualityLevel = this.getQualityLevel();
        notification.textContent = `Graphics quality adjusted to ${qualityLevel}`;
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => notification.style.opacity = '1', 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    getQualityLevel() {
        if (this.settings.shadowQuality === 'high' && this.settings.particleLimit >= 1000) {
            return 'High';
        } else if (this.settings.shadowQuality !== 'off' && this.settings.particleLimit >= 600) {
            return 'Medium';
        } else {
            return 'Low';
        }
    }
    
    // Level of Detail (LOD) management
    getLODForDistance(distance) {
        if (distance <= this.lodLevels.high.distance) return 'high';
        if (distance <= this.lodLevels.medium.distance) return 'medium';
        return 'low';
    }
    
    shouldRenderObject(object, cameraPosition) {
        const distance = object.position.distanceTo(cameraPosition);
        return distance <= this.settings.renderDistance;
    }
    
    optimizeForMobile() {
        // Mobile-specific optimizations
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            this.setQualityPreset('low');
            this.settings.autoOptimize = true;
            this.targetFPS = 30; // Lower target for mobile
        }
    }
    
    createPerformanceUI() {
        // Create performance monitor overlay (debug)
        const perfOverlay = document.createElement('div');
        perfOverlay.id = 'performance-overlay';
        perfOverlay.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            display: none;
            min-width: 200px;
        `;
        
        document.body.appendChild(perfOverlay);
        
        // Toggle with P key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'P' && e.ctrlKey) {
                perfOverlay.style.display = perfOverlay.style.display === 'none' ? 'block' : 'none';
            }
        });
        
        // Update performance display
        this.perfUpdateInterval = setInterval(() => {
            if (perfOverlay.style.display !== 'none') {
                perfOverlay.innerHTML = `
                    <div>FPS: ${Math.round(this.currentFPS)} (avg: ${Math.round(this.averageFPS)})</div>
                    <div>Performance: ${this.performanceLevel}</div>
                    <div>Quality: ${this.getQualityLevel()}</div>
                    <div>Render Distance: ${this.settings.renderDistance}</div>
                    <div>Particles: ${this.settings.particleLimit}</div>
                    <div>Memory: ${Math.round(this.performanceMetrics.memoryUsage)}MB</div>
                    <div>Render Time: ${Math.round(this.performanceMetrics.renderTime)}ms</div>
                `;
            }
        }, 1000);
    }
    
    // Cleanup and resource management
    dispose() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        if (this.perfUpdateInterval) {
            clearInterval(this.perfUpdateInterval);
        }
        
        // Release pooled objects
        this.vector3Pool.pool.length = 0;
        this.matrix4Pool.pool.length = 0;
        this.colorPool.pool.length = 0;
    }
    
    // Manual optimization methods
    optimizeMemory() {
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Clean up unused textures and geometries
        this.cleanupUnusedResources();
    }
    
    cleanupUnusedResources() {
        // This would require tracking which resources are in use
        // Implementation would depend on the specific game structure
        console.log('Cleaning up unused resources...');
    }
    
    // Public API for manual quality control
    setManualQuality(preset) {
        this.settings.autoOptimize = false;
        this.setQualityPreset(preset);
    }
    
    enableAutoOptimization() {
        this.settings.autoOptimize = true;
        this.startPerformanceMonitoring();
    }
    
    getPerformanceReport() {
        return {
            currentFPS: this.currentFPS,
            averageFPS: this.averageFPS,
            performanceLevel: this.performanceLevel,
            qualityLevel: this.getQualityLevel(),
            settings: { ...this.settings },
            metrics: { ...this.performanceMetrics },
            issues: { ...this.performanceIssues }
        };
    }
}