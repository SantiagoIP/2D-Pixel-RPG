import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { createPixelSprite, getPixelSpriteTexture } from './spriteUtils.js';
import { SimplexNoise } from './noise.js';
// Biome definitions
export const biomes = {
    GREEN_HILLS: {
        colors: ['#4CAF50', '#8BC34A', '#CDDC39'], // Vibrant greens with yellow accents
        obstacles: ['tree', 'rock'],
        obstacleDensity: 0.4,
        decorations: ['grass', 'flower', 'dirtPatch', 'herb'], // Added herbs
        decorationDensity: 0.7,
        terrainNoiseScale: 0.08,
        terrainNoiseStrength: 1.0,
    },
    DESERT: {
        colors: ['#FF9800', '#FFC107', '#FFEB3B'], // Warm oranges and yellows
        obstacles: ['rock', 'cactus'], // Added cactus to the desert
        obstacleDensity: 0.15,
        decorations: ['cactus', 'deadBush'], // Use cactus as decoration too
        decorationDensity: 0.05,
        terrainNoiseScale: 0.12, // Larger features for dunes
        terrainNoiseStrength: 0.8,
    },
    MAGIC_FOREST: {
        colors: ['#9C27B0', '#E91E63', '#FF5722'], // Magical purples and pinks
        obstacles: ['tree'],
        obstacleDensity: 0.8, // Very dense with trees
        decorations: ['grass', 'flower'],
        decorationDensity: 0.9,
        terrainNoiseScale: 0.05, // Denser, smaller noise
        terrainNoiseStrength: 1.2,
    },
    BARREN_LAND: {
        colors: ['#795548', '#A1887F', '#D7CCC8'], // Rich browns and earth tones
        obstacles: ['rock', 'deadTree'],
        obstacleDensity: 0.2,
        decorations: ['deadBush'], // Sparse, hardy grass
        decorationDensity: 0.1,
        terrainNoiseScale: 0.1,
        terrainNoiseStrength: 0.7,
    },
    MOUNTAINS: {
        colors: ['#B0BEC5', '#78909C', '#37474F'],
        obstacles: ['rock', 'deadTree'],
        obstacleDensity: 0.35,
        decorations: ['deadBush', 'dirtPatch'],
        decorationDensity: 0.15,
        terrainNoiseScale: 0.13,
        terrainNoiseStrength: 1.3,
    },
    LAKE: {
        colors: ['#2196F3', '#64B5F6', '#B3E5FC'],
        obstacles: ['rock'],
        obstacleDensity: 0.1,
        decorations: ['grass', 'flower'],
        decorationDensity: 0.5,
        terrainNoiseScale: 0.09,
        terrainNoiseStrength: 0.6,
    },
    VOLCANO: {
        colors: ['#FF7043', '#D84315', '#212121'],
        obstacles: ['rock', 'deadTree'],
        obstacleDensity: 0.25,
        decorations: ['deadBush', 'dirtPatch'],
        decorationDensity: 0.08,
        terrainNoiseScale: 0.15,
        terrainNoiseStrength: 1.5,
    },
};
export class World {
    constructor(biomeName) {
        this.container = new THREE.Group();
        this.worldSize = 60;
        this.castlePosition = null;
        this.throne = null;
        this.shrines = [];
        this.biome = biomes[biomeName] || biomes.GREEN_HILLS;
        this.terrainNoise = new SimplexNoise(Math.random);
        this.torchLights = [];
        this.monstersClearedOnEnter = false;
        this.castleRoomCenter = null;
        this.overworldContainer = new THREE.Group();
        this.interiorContainer = new THREE.Group();
        this.container.add(this.overworldContainer);
        this.container.add(this.interiorContainer);
        this.interiorContainer.visible = false;
        this.obstacles = [];
        this.interiorObstacles = [];
        this.decorations = [];
        this.collectibles = []; // Array for interactive items
        this.createGround();
        this.createObstacles();
        this.createDecorations();
        this.createLandmarks();
        this.createShrines();
        this.createCastleInterior();
    }
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(this.worldSize, this.worldSize);
        
        // Use enhanced ground texture for better visuals
        const groundTexture = this.createGroundTexture(256);
        const groundMaterial = new THREE.MeshLambertMaterial({
            map: groundTexture,
            side: THREE.DoubleSide
        });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = 0;
        
        // Enable shadow receiving
        groundMesh.receiveShadow = true;
        
        safeAdd(this.overworldContainer, groundMesh);
    }
    createGroundTexture(resolution) {
        const canvas = document.createElement('canvas');
        canvas.width = resolution;
        canvas.height = resolution;
        const context = canvas.getContext('2d');
        const imageData = context.createImageData(resolution, resolution);
        const data = imageData.data;
        const color = new THREE.Color();
        
        for (let y = 0; y < resolution; y++) {
            for (let x = 0; x < resolution; x++) {
                const worldX = (x / resolution - 0.5) * this.worldSize;
                const worldZ = (y / resolution - 0.5) * this.worldSize;
                
                // Multi-layered noise for more interesting terrain
                let total = 0;
                let amplitude = this.biome.terrainNoiseStrength || 1;
                let frequency = this.biome.terrainNoiseScale || 0.08;
                const octaves = 6; // More octaves for detail
                
                for (let i = 0; i < octaves; i++) {
                    total += this.terrainNoise.noise2D(worldX * frequency, worldZ * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                const terrainNoise = (total + 1) / 2; // Normalize to 0-1
                
                // Use all three colors for richer terrain
                const color1 = new THREE.Color(this.biome.colors[0]);
                const color2 = new THREE.Color(this.biome.colors[1]);
                const color3 = new THREE.Color(this.biome.colors[2] || this.biome.colors[1]);
                
                // Create more complex color blending
                let finalColor;
                if (terrainNoise < 0.33) {
                    finalColor = color1.clone().lerp(color2, terrainNoise * 3);
                } else if (terrainNoise < 0.66) {
                    finalColor = color2.clone().lerp(color3, (terrainNoise - 0.33) * 3);
                } else {
                    finalColor = color3.clone().lerp(color1, (terrainNoise - 0.66) * 3);
                }
                
                // Add subtle color variation based on position
                const positionVariation = Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1) * 0.1;
                finalColor.offsetHSL(0, 0, positionVariation);
                
                const index = (y * resolution + x) * 4;
                data[index] = finalColor.r * 255;
                data[index + 1] = finalColor.g * 255;
                data[index + 2] = finalColor.b * 255;
                data[index + 3] = 255;
            }
        }
        
        context.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        return texture;
    }
     createObstacles() {
        const totalObstacles = 80; // Total obstacles to distribute across the world
        for (let i = 0; i < totalObstacles; i++) {
             // Position obstacles randomly, avoiding the center spawn area
            let posX, posZ;
            do {
               posX = (Math.random() - 0.5) * this.worldSize * 0.9;
               posZ = (Math.random() - 0.5) * this.worldSize * 0.9;
            } while (Math.sqrt(posX*posX + posZ*posZ) < 4); // Keep away from player start
            // Check density - skip creating an obstacle sometimes based on biome
            if (Math.random() > this.biome.obstacleDensity) {
                continue;
            }
            
            // Choose an obstacle type from the biome's allowed list
            const possibleObstacles = this.biome.obstacles;
            const spriteType = possibleObstacles[Math.floor(Math.random() * possibleObstacles.length)];
            // Determine size based on type (could be more complex)
            const isTree = spriteType === 'tree';
            const isCactus = spriteType === 'cactus';
            const isDeadTree = spriteType === 'deadTree';
            let size;
            if (isTree) {
                size = 1.2 + Math.random() * 0.5;
            } else if (isCactus) {
                size = 1.0 + Math.random() * 0.6; // Cacti have slightly different size variation
            } else if (isDeadTree) {
                 size = 1.1 + Math.random() * 0.4;
            } else { // Rock
                size = 0.8 + Math.random() * 0.4;
            }
            const obstacleMesh = createPixelSprite(spriteType, size);
            obstacleMesh.userData.size = size; // Store size for collision detection
            
            obstacleMesh.position.set(posX, size / 2, posZ); // Place on ground
            safeAdd(this.overworldContainer, obstacleMesh);
            this.obstacles.push(obstacleMesh);
        }
     }
     createDecorations() {
        const totalDecorations = 320; // More decorations than obstacles
        for (let i = 0; i < totalDecorations; i++) {
            const posX = (Math.random() - 0.5) * this.worldSize;
            const posZ = (Math.random() - 0.5) * this.worldSize;
            if (Math.random() > this.biome.decorationDensity || this.biome.decorations.length === 0) {
                continue;
            }
            const spriteType = this.biome.decorations[Math.floor(Math.random() * this.biome.decorations.length)];
            const size = 0.5 + Math.random() * 0.2; // Decorations are small

            // Handle collectibles separately
            if (spriteType === 'herb') {
                if (Math.random() < 0.1) { // Make herbs relatively rare
                    const herbMesh = createPixelSprite(spriteType, size);
                    herbMesh.position.set(posX, size / 2, posZ);
                    herbMesh.userData = { type: 'herb', collectible: true };
                    safeAdd(this.overworldContainer, herbMesh);
                    this.collectibles.push(herbMesh);
                }
                continue; // Don't add it as a standard decoration
            }
            
            const decorationMesh = createPixelSprite(spriteType, size);
            decorationMesh.position.set(posX, size / 2, posZ);
            safeAdd(this.overworldContainer, decorationMesh);
            this.decorations.push(decorationMesh);
        }
     }
    createLandmarks() {
        // Always create the castle in the center for now
        this.createCastle(new THREE.Vector3(0, 0, 0));
        
        // Add biome-specific landmarks
        if (this.biome === biomes.GREEN_HILLS) {
            this.createVillage();
        } else if (this.biome === biomes.DESERT) {
            this.createOasis();
        } else if (this.biome === biomes.MAGIC_FOREST) {
            this.createMagicalGrove();
        } else if (this.biome === biomes.VOLCANO) {
            this.createLavaVents();
        } else if (this.biome === biomes.MOUNTAINS) {
            this.createMiningOutpost();
        } else if (this.biome === biomes.LAKE) {
            this.createFishingDock();
        }
    }
    createCastle(centerPosition) {
        this.castlePosition = centerPosition.clone();
        const castleSize = 12; // Slightly larger castle sprite for better visibility
        const doorWidth = 5; // Much wider entrance for easy access
        const doorHeight = 3;
        
        // Create the main castle sprite (visual only, no collision)
        const castleSprite = createPixelSprite('castle', castleSize);
        castleSprite.position.copy(centerPosition);
        castleSprite.position.y = castleSize / 2; // Lift sprite so base is at y=0
        safeAdd(this.overworldContainer, castleSprite);
        
        // Create a much simpler collision system - just a basic boundary around the castle
        // Leave the southern side completely open for easy access
        const wallThickness = 0.3;
        const wallHeight = 4;
        
        // Helper to add an invisible wall
        const addInvisibleWall = (size, pos) => {
            const wallGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
            const wallMat = new THREE.MeshBasicMaterial({ visible: false });
            const wallMesh = new THREE.Mesh(wallGeo, wallMat);
            wallMesh.position.copy(pos).add(centerPosition);
            safeAdd(this.overworldContainer, wallMesh);
            this.obstacles.push(wallMesh);
            wallMesh.userData.size = Math.max(size.x, size.z);
        };
        
        const halfSize = castleSize / 2;
        
        // Only create walls on three sides, leaving the south completely open
        // North wall (behind the castle)
        addInvisibleWall(new THREE.Vector3(castleSize, wallHeight, wallThickness), new THREE.Vector3(0, wallHeight / 2, -halfSize - wallThickness));
        
        // West wall (left side) - much shorter and closer to castle to avoid blocking NPCs
        addInvisibleWall(new THREE.Vector3(wallThickness, wallHeight, castleSize * 0.4), new THREE.Vector3(-halfSize - wallThickness, wallHeight / 2, -castleSize * 0.3));
        
        // East wall (right side) - much shorter and closer to castle to avoid blocking NPCs
        addInvisibleWall(new THREE.Vector3(wallThickness, wallHeight, castleSize * 0.4), new THREE.Vector3(halfSize + wallThickness, wallHeight / 2, -castleSize * 0.3));
        
        // Create the door trigger zone - much larger and more accessible
        const doorGeo = new THREE.PlaneGeometry(doorWidth, doorHeight);
        const doorMaterial = new THREE.MeshBasicMaterial({ 
            map: getPixelSpriteTexture('castleDoor', 1),
            transparent: true,
            alphaTest: 0.1,
        });
        this.castleDoor = new THREE.Mesh(doorGeo, doorMaterial);
        this.castleDoor.position.set(centerPosition.x, doorHeight / 2, centerPosition.z + halfSize + 0.5);
        safeAdd(this.overworldContainer, this.castleDoor);
        
        // Add a visual welcome mat or pathway to guide players
        const pathGeo = new THREE.PlaneGeometry(doorWidth + 2, 2);
        const pathMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x8B7355, // Brown path color
            transparent: true,
            opacity: 0.7
        });
        const pathMesh = new THREE.Mesh(pathGeo, pathMaterial);
        pathMesh.rotation.x = -Math.PI / 2;
        pathMesh.position.set(centerPosition.x, 0.01, centerPosition.z + halfSize + 1.5);
        safeAdd(this.overworldContainer, pathMesh);
        
        console.log("🏰 Enhanced castle with simplified collision and clear entrance path");
     }
    createShrines() {
        const shrineCount = 3; // Number of shrines per world
        for (let i = 0; i < shrineCount; i++) {
            let positionFound = false;
            let attempts = 0;
            let shrinePos;
            while (!positionFound && attempts < 20) {
                const posX = (Math.random() - 0.5) * this.worldSize * 0.8;
                const posZ = (Math.random() - 0.5) * this.worldSize * 0.8;
                shrinePos = new THREE.Vector3(posX, 0, posZ);
                // Ensure it's not too close to the center or the castle
                if (shrinePos.length() < 15 || (this.castlePosition && shrinePos.distanceTo(this.castlePosition) < 15)) {
                    attempts++;
                    continue;
                }
                positionFound = true;
            }
            if (positionFound) {
                const size = 1.5;
                const shrineMesh = createPixelSprite('shrine', size);
                shrineMesh.position.set(shrinePos.x, size / 2, shrinePos.z);
                safeAdd(this.overworldContainer, shrineMesh);
                this.shrines.push(shrineMesh);
            }
        }
    }
     createCastleInterior() {
         this.interiorSize = 16; // Increased size for more room
        const wallHeight = 5; // Taller walls for more grandeur
        const wallThickness = 0.5;
        const roomCenter = new THREE.Vector3(100, 0, 100); // Place it far away
        this.castleRoomCenter = roomCenter;
        // Entry point: South side of the room (where player enters from overworld)
        this.castleInteriorEntryPoint = roomCenter.clone().add(new THREE.Vector3(0, 0, this.interiorSize / 2 - 2));
        
        // Exit point: Much further south, near the actual exit door
        this.castleExitPoint = roomCenter.clone().add(new THREE.Vector3(0, 0, this.interiorSize / 2 - 0.5));
        
        // Interior floor with enhanced texture
        const floorGeo = new THREE.PlaneGeometry(this.interiorSize, this.interiorSize);
        let largeCastleWallTexture;
        try {
            largeCastleWallTexture = getPixelSpriteTexture('castleWall', 1, 128);
            if (largeCastleWallTexture) {
                largeCastleWallTexture.wrapS = THREE.RepeatWrapping;
                largeCastleWallTexture.wrapT = THREE.RepeatWrapping;
                largeCastleWallTexture.repeat.set(this.interiorSize / 3, this.interiorSize / 3);
            }
        } catch (error) {
            console.warn('[TextureCheck] Error creating castleWall texture:', error);
            largeCastleWallTexture = null;
        }
        
        const floorMat = new THREE.MeshLambertMaterial({
            map: largeCastleWallTexture,
            color: largeCastleWallTexture ? 0xffffff : 0x666666
        });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.copy(roomCenter);
        safeAdd(this.interiorContainer, floorMesh);
        
        // Enhanced interior walls
        const wallMaterial = new THREE.MeshLambertMaterial({
            map: largeCastleWallTexture,
            color: largeCastleWallTexture ? 0xffffff : 0x555555
        });
        
        const walls = [
            // North wall (behind throne)
            { pos: new THREE.Vector3(0, wallHeight / 2, -this.interiorSize / 2), size: new THREE.Vector3(this.interiorSize, wallHeight, wallThickness) },
            // West wall
            { pos: new THREE.Vector3(-this.interiorSize / 2, wallHeight / 2, 0), size: new THREE.Vector3(wallThickness, wallHeight, this.interiorSize) },
            // East wall
            { pos: new THREE.Vector3(this.interiorSize / 2, wallHeight / 2, 0), size: new THREE.Vector3(wallThickness, wallHeight, this.interiorSize) },
            // Partial south wall (leaving exit area open)
            { pos: new THREE.Vector3(-this.interiorSize / 4, wallHeight / 2, this.interiorSize / 2), size: new THREE.Vector3(this.interiorSize / 2, wallHeight, wallThickness) },
            { pos: new THREE.Vector3(this.interiorSize / 4, wallHeight / 2, this.interiorSize / 2), size: new THREE.Vector3(this.interiorSize / 2, wallHeight, wallThickness) },
        ];
        
        walls.forEach(w => {
            const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(w.size.x, w.size.y, w.size.z), wallMaterial);
            wallMesh.position.copy(w.pos).add(roomCenter);
            safeAdd(this.interiorContainer, wallMesh);
        });
        
        // Helper to add decorative sprites
        const addDecoration = (spriteType, size, position, rotationY = 0) => {
            const deco = createPixelSprite(spriteType, size);
            deco.position.copy(position);
            deco.rotation.y = rotationY;
            deco.position.y = size / 2; // Proper positioning
            safeAdd(this.interiorContainer, deco);
            return deco;
        };
        
        // Enhanced Throne with more grandeur
        const throneSize = 2.5;
        const throne = addDecoration('throne', throneSize, roomCenter.clone().add(new THREE.Vector3(0, 0, -this.interiorSize / 2 + 2.5)));
        throne.userData.size = throneSize;
        this.throne = throne;
        
        // Add decorative pillars
        const pillarSize = 1.2;
        const createPillar = (posX, posZ) => {
            const pillar = addDecoration('torch', pillarSize, roomCenter.clone().add(new THREE.Vector3(posX, 0, posZ)));
            pillar.scale.y = 3; // Make it taller like a pillar
            pillar.userData.size = pillarSize;
            this.interiorObstacles.push(pillar);
            
            // Add light at the top of each pillar
            const pillarLight = new THREE.PointLight(0xffd700, 1.8, 10, 2);
            pillarLight.position.copy(pillar.position).add(new THREE.Vector3(0, 2.5, 0));
            pillarLight.userData.baseIntensity = pillarLight.intensity;
            pillarLight.userData.flickerOffset = Math.random() * 100;
            safeAdd(this.interiorContainer, pillarLight);
            this.torchLights.push(pillarLight);
        };
        
        // Place pillars symmetrically
        createPillar(-4, -2);
        createPillar(4, -2);
        createPillar(-4, 2);
        createPillar(4, 2);
        
        // Enhanced Fireplace
        const fireplaceSize = 2;
        const fireplace = addDecoration('fireplace', fireplaceSize, roomCenter.clone().add(new THREE.Vector3(this.interiorSize/2 - 1, 0, -4)), -Math.PI / 2);
        fireplace.userData.size = fireplaceSize;
        this.interiorObstacles.push(fireplace);
        
        // Enhanced fireplace lighting
        const fireLight = new THREE.PointLight(0xff4500, 3, 12, 2);
        fireLight.position.copy(fireplace.position).add(new THREE.Vector3(-0.3, 1, 0));
        fireLight.userData.baseIntensity = fireLight.intensity;
        fireLight.userData.flickerOffset = Math.random() * 100;
        safeAdd(this.interiorContainer, fireLight);
        this.torchLights.push(fireLight);
        
        // Multiple Bookshelves along walls
        const bookshelfSize = 1.2;
        const createBookshelf = (posX, posZ, rotY = 0) => {
            const shelf = addDecoration('bookshelf', bookshelfSize, roomCenter.clone().add(new THREE.Vector3(posX, 0, posZ)), rotY);
            shelf.userData.size = bookshelfSize;
            shelf.userData.isInteractable = true;
            shelf.userData.interactionText = "Read ancient tomes";
            this.interiorObstacles.push(shelf);
        };
        
        // Bookshelves along the north wall
        createBookshelf(-5, -this.interiorSize / 2 + 0.8);
        createBookshelf(-1.5, -this.interiorSize / 2 + 0.8);
        createBookshelf(1.5, -this.interiorSize / 2 + 0.8);
        createBookshelf(5, -this.interiorSize / 2 + 0.8);
        
        // Multiple treasure chests
        const chestSize = 1.2;
        const createTreasureChest = (posX, posZ, hasLoot = true, lootType = 'gold') => {
            const chest = addDecoration('chest', chestSize, roomCenter.clone().add(new THREE.Vector3(posX, 0, posZ)));
            chest.userData.size = chestSize;
            chest.userData.isInteractable = true;
            chest.userData.interactionText = hasLoot ? "Open treasure chest" : "Empty chest";
            chest.userData.hasLoot = hasLoot;
            chest.userData.opened = false;
            
            if (hasLoot) {
                const lootOptions = {
                    gold: [
                        { name: 'Gold Coins', quantity: 100, type: 'currency' },
                        { name: 'Ruby Gem', quantity: 1, type: 'valuable' }
                    ],
                    equipment: [
                        { name: 'Royal Blade', quantity: 1, type: 'weapon' },
                        { name: 'Crown of Kings', quantity: 1, type: 'armor' }
                    ],
                    magical: [
                        { name: 'Scroll of Power', quantity: 1, type: 'consumable' },
                        { name: 'Mana Crystal', quantity: 3, type: 'material' }
                    ]
                };
                chest.userData.loot = lootOptions[lootType] || lootOptions.gold;
            }
            
            this.interiorObstacles.push(chest);
            return chest;
        };
        
        // Place treasure chests strategically
        createTreasureChest(this.interiorSize / 2 - 2, this.interiorSize / 2 - 2, true, 'gold');
        createTreasureChest(-this.interiorSize / 2 + 2, this.interiorSize / 2 - 2, true, 'equipment');
        createTreasureChest(6, -6, true, 'magical');
        createTreasureChest(-6, -6, false); // Empty chest
        
        // Enhanced royal banners
        const bannerSize = 1.8;
        const createBanner = (posX, posZ, rotY = 0) => {
            const banner = addDecoration('banner', bannerSize, roomCenter.clone().add(new THREE.Vector3(posX, 1, posZ)), rotY);
            banner.userData.size = bannerSize;
            banner.userData.isInteractable = true;
            banner.userData.interactionText = "Examine royal heraldry";
            return banner;
        };
        
        // Banners on side walls
        createBanner(-this.interiorSize / 2 + 0.3, -3, Math.PI / 2);
        createBanner(-this.interiorSize / 2 + 0.3, 3, Math.PI / 2);
        createBanner(this.interiorSize / 2 - 0.3, -3, -Math.PI / 2);
        createBanner(this.interiorSize / 2 - 0.3, 3, -Math.PI / 2);
        
        // Enhanced mystical altar
        const altarSize = 1.5;
        const altar = addDecoration('altar', altarSize, roomCenter.clone().add(new THREE.Vector3(0, 0, -5)));
        altar.userData.size = altarSize;
        altar.userData.isInteractable = true;
        altar.userData.interactionText = "Touch the mystical altar";
        altar.userData.altarType = "royal";
        this.interiorObstacles.push(altar);
        
        // Mystical lighting for the altar
        const altarLight = new THREE.PointLight(0x9400d3, 2, 8, 2);
        altarLight.position.copy(altar.position).add(new THREE.Vector3(0, 1, 0));
        altarLight.userData.baseIntensity = altarLight.intensity;
        altarLight.userData.flickerOffset = Math.random() * 100;
        safeAdd(this.interiorContainer, altarLight);
        this.torchLights.push(altarLight);
        
        // Add exit trigger zone - make it clearly visible
        const exitTriggerGeo = new THREE.PlaneGeometry(4, 1);
        const exitTriggerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.3 
        });
        const exitTrigger = new THREE.Mesh(exitTriggerGeo, exitTriggerMaterial);
        exitTrigger.rotation.x = -Math.PI / 2;
        exitTrigger.position.copy(roomCenter).add(new THREE.Vector3(0, 0.02, this.interiorSize / 2 - 1));
        safeAdd(this.interiorContainer, exitTrigger);
        
        // Store castle NPCs for later integration
        this.castleNPCs = [];
        const createGuardNPC = (posX, posZ, name, dialogue) => {
            const guardPosition = roomCenter.clone().add(new THREE.Vector3(posX, 0, posZ));
            const guardData = {
                type: 'GUARD',
                name: name,
                position: guardPosition,
                dialogue: dialogue,
                isStationary: true,
                region: 'CASTLE'
            };
            this.castleNPCs.push(guardData);
            return guardData;
        };
        
        createGuardNPC(3, 4, 'Royal Guard Captain', [
            "Welcome to the royal throne room, traveler. You stand in the heart of the kingdom.",
            "The throne has awaited a worthy ruler for generations. Perhaps that ruler is you?"
        ]);
        
        createGuardNPC(-3, 4, 'Castle Steward', [
            "These halls have seen the rise and fall of many kings. The treasures here are ancient and powerful.",
            "The mystical altar behind the throne holds great power. Approach it with reverence."
        ]);
        
        console.log("🏰 Enhanced castle interior with detailed decorations, lighting, and clear teleportation zones");
    }
    update(deltaTime) {
        const time = Date.now() * 0.008; // Flicker speed
        this.torchLights.forEach(light => {
            const flicker = Math.sin(time + light.userData.flickerOffset) * 0.15; // Flicker amount
            const noise = (this.terrainNoise.noise2D(time * 0.5, light.userData.flickerOffset) + 1) / 2 * 0.2; // Slower noise
            light.intensity = light.userData.baseIntensity + flicker + noise;
        });
    }
    dispose() {
        // Remove the main containers, which will clean up everything inside
        this.container.remove(this.overworldContainer);
        this.container.remove(this.interiorContainer);
        // You might still want to call dispose on geometries/materials if needed
        // but for now, this removes them from the scene.
    }
    createVillage() {
        // Create a small village in Green Hills biome
        const villageCenter = new THREE.Vector3(15, 0, 15);
        
        // Village houses
        const housePositions = [
            new THREE.Vector3(12, 0, 12),
            new THREE.Vector3(18, 0, 10),
            new THREE.Vector3(20, 0, 16),
            new THREE.Vector3(14, 0, 20),
            new THREE.Vector3(10, 0, 18)
        ];
        
        housePositions.forEach((pos, index) => {
            const spriteType = index === 1 ? 'villageShop' : 'villageHouse'; // One shop
            const houseSize = 1.5;
            const house = createPixelSprite(spriteType, houseSize);
            house.position.copy(pos);
            house.position.y = houseSize / 2 + 0.01; // raise slightly above ground to prevent z-fighting
            safeAdd(this.overworldContainer, house);
            
            // Add to obstacles for collision
            this.obstacles.push({
                position: pos,
                size: 1.5
            });
        });
        
        // Village well in center
        const wellSize = 1.0;
        const well = createPixelSprite('villageWell', wellSize);
        well.position.copy(villageCenter);
        well.position.y = wellSize / 2 + 0.01;
        safeAdd(this.overworldContainer, well);
        
        this.obstacles.push({
            position: villageCenter,
            size: 1.0
        });
        
        console.log("🏘️ Created village with", housePositions.length, "buildings and a well");
    }
    
    createOasis() {
        // Desert oasis with palm trees and water
        const oasisCenter = new THREE.Vector3(-18, 0, -12);
        
        // Create water patch (using blue ground texture)
        const waterGeometry = new THREE.CircleGeometry(4, 16);
        const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4FC3F7, 
            transparent: true, 
            opacity: 0.8 
        });
        const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        waterMesh.rotation.x = -Math.PI / 2;
        waterMesh.position.copy(oasisCenter);
        waterMesh.position.y = 0.01;
        safeAdd(this.overworldContainer, waterMesh);
        
        // Palm trees around oasis (using modified tree sprites)
        const palmPositions = [
            new THREE.Vector3(-15, 0, -15),
            new THREE.Vector3(-21, 0, -9),
            new THREE.Vector3(-16, 0, -8),
            new THREE.Vector3(-20, 0, -15)
        ];
        
        palmPositions.forEach(pos => {
            const palmSize = 1.2;
            const palm = createPixelSprite('tree', palmSize); // Will enhance this later
            palm.position.copy(pos);
            palm.position.y = palmSize / 2 + 0.01;
            safeAdd(this.overworldContainer, palm);
            
            this.obstacles.push({
                position: pos,
                size: 1.2
            });
        });
        
        console.log("🌴 Created desert oasis");
    }
    
    createMagicalGrove() {
        // Magic forest special grove
        const groveCenter = new THREE.Vector3(-15, 0, 15);
        
        // Magical crystal formations
        const crystalPositions = [
            new THREE.Vector3(-12, 0, 18),
            new THREE.Vector3(-18, 0, 12),
            new THREE.Vector3(-15, 0, 15),
        ];
        
        crystalPositions.forEach(pos => {
            const crystalSize = 1.0;
            const crystal = createPixelSprite('shrine', crystalSize); // Reuse shrine sprite
            crystal.position.copy(pos);
            crystal.position.y = crystalSize / 2 + 0.01;
            safeAdd(this.overworldContainer, crystal);
            
            // Add magical glow effect
            const light = new THREE.PointLight(0x9C27B0, 0.5, 10);
            light.position.copy(pos);
            light.position.y = 1;
            safeAdd(this.overworldContainer, light);
        });
        
        console.log("✨ Created magical grove");
    }
    
    createLavaVents() {
        // Volcano biome lava vents
        const ventPositions = [
            new THREE.Vector3(18, 0, -18),
            new THREE.Vector3(-20, 0, 20),
            new THREE.Vector3(15, 0, 22),
        ];
        
        ventPositions.forEach(pos => {
            // Create lava vent (using modified rock sprite)
            const ventSize = 1.0;
            const vent = createPixelSprite('rock', ventSize);
            vent.position.copy(pos);
            vent.position.y = ventSize / 2 + 0.01;
            safeAdd(this.overworldContainer, vent);
            
            // Add orange/red glow for lava
            const light = new THREE.PointLight(0xFF4500, 0.8, 12);
            light.position.copy(pos);
            light.position.y = 1;
            safeAdd(this.overworldContainer, light);
        });
        
        console.log("🌋 Created lava vents");
    }
    
    createMiningOutpost() {
        // Mountain mining outpost
        const outpostPos = new THREE.Vector3(20, 0, -15);
        
        const outpostSize = 1.2;
        const outpost = createPixelSprite('villageHouse', outpostSize);
        outpost.position.copy(outpostPos);
        outpost.position.y = outpostSize / 2 + 0.01;
        safeAdd(this.overworldContainer, outpost);
        
        this.obstacles.push({
            position: outpostPos,
            size: 1.2
        });
        
        console.log("⛏️ Created mining outpost");
    }
    
    createFishingDock() {
        // Lake fishing dock
        const dockPos = new THREE.Vector3(-22, 0, 8);
        
        // Simple dock structure (using modified village shop)
        const dockSize = 1.0;
        const dock = createPixelSprite('villageShop', dockSize);
        dock.position.copy(dockPos);
        dock.position.y = dockSize / 2 + 0.01;
        safeAdd(this.overworldContainer, dock);
        
        this.obstacles.push({
            position: dockPos,
            size: 1.0
        });
        
        console.log("🎣 Created fishing dock");
    }
}
// Helper to safely add objects to a parent
function safeAdd(parent, child) {
    if (parent === child) {
        console.warn('[safeAdd] Attempted to add object as a child of itself:', parent);
        return;
    }
    parent.add(child);
}