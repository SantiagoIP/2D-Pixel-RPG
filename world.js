import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { createPixelSprite, getPixelSpriteTexture } from './spriteUtils.js';
import { SimplexNoise } from './noise.js';
// Biome definitions
export const biomes = {
    GREEN_HILLS: {
        colors: ['#4CAF50', '#8BC34A', '#CDDC39'], // Vibrant greens with yellow accents
        obstacles: ['tree', 'rock'],
        obstacleDensity: 0.4,
        decorations: ['grass', 'flower', 'dirtPatch'],
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
            const decorationMesh = createPixelSprite(spriteType, size);
            decorationMesh.position.set(posX, size / 2, posZ);
            safeAdd(this.overworldContainer, decorationMesh);
            this.decorations.push(decorationMesh);
        }
     }
    createLandmarks() {
        const landmarkCount = 1; // Create one castle for now
        for (let i = 0; i < landmarkCount; i++) {
            let positionFound = false;
            let attempts = 0;
            let centerPos;
            while (!positionFound && attempts < 30) {
                const posX = (Math.random() - 0.5) * this.worldSize * 0.7;
                const posZ = (Math.random() - 0.5) * this.worldSize * 0.7;
                centerPos = new THREE.Vector3(posX, 0, posZ);
                if (centerPos.length() < 20) { // Keep far from center
                    attempts++;
                    continue;
                }
                
                // Check against other landmark centers if we add more
                positionFound = true; 
            }
            if (positionFound) {
                this.createCastle(centerPos);
            }
        }
    }
    createCastle(centerPosition) {
        this.castlePosition = centerPosition.clone();
        const castleSize = 10; // The visual size of our castle sprite
        const doorWidth = 2;
        const doorHeight = 2.5;
        // Create the main castle sprite (visual only, no collision)
        const castleSprite = createPixelSprite('castle', castleSize);
        castleSprite.position.copy(centerPosition);
        castleSprite.position.y = castleSize / 2; // Lift sprite so base is at y=0
        safeAdd(this.overworldContainer, castleSprite);
        // Create invisible collision boxes around the sprite
        const wallThickness = 1; // Make collision box thick
        const wallHeight = 4; // Tall enough to block player
        
        // Helper to add an invisible wall
        const addInvisibleWall = (size, pos) => {
            const wallGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
            const wallMat = new THREE.MeshBasicMaterial({ visible: false }); // Invisible!
            const wallMesh = new THREE.Mesh(wallGeo, wallMat);
            wallMesh.position.copy(pos).add(centerPosition);
            safeAdd(this.overworldContainer, wallMesh); // Add to scene
            this.obstacles.push(wallMesh); // But most importantly, add to obstacles
            wallMesh.userData.size = Math.max(size.x, size.z);
        };
        
        const halfSize = castleSize / 2;
        // North wall (solid)
        addInvisibleWall(new THREE.Vector3(castleSize + wallThickness, wallHeight, wallThickness), new THREE.Vector3(0, wallHeight / 2, -halfSize));
        // West wall (solid)
        addInvisibleWall(new THREE.Vector3(wallThickness, wallHeight, castleSize), new THREE.Vector3(-halfSize, wallHeight / 2, 0));
        // East wall (solid)
        addInvisibleWall(new THREE.Vector3(wallThickness, wallHeight, castleSize), new THREE.Vector3(halfSize, wallHeight / 2, 0));
        
        // South wall (in two parts to leave a gap for the door)
        const southWallZ = halfSize;
        const sideWallWidth = (castleSize - doorWidth) / 2;
        
        // Left part of south wall
        const leftWallPosX = -halfSize + sideWallWidth / 2;
        addInvisibleWall(new THREE.Vector3(sideWallWidth, wallHeight, wallThickness), new THREE.Vector3(leftWallPosX, wallHeight / 2, southWallZ));
        
        // Right part of south wall
        const rightWallPosX = halfSize - sideWallWidth / 2;
        addInvisibleWall(new THREE.Vector3(sideWallWidth, wallHeight, wallThickness), new THREE.Vector3(rightWallPosX, wallHeight / 2, southWallZ));
        // Create the visible door mesh, which acts as the trigger zone
        const doorGeo = new THREE.PlaneGeometry(doorWidth, doorHeight);
        const doorMaterial = new THREE.MeshBasicMaterial({ 
            map: getPixelSpriteTexture('castleDoor', 1),
            transparent: true,
            alphaTest: 0.1,
        });
        this.castleDoor = new THREE.Mesh(doorGeo, doorMaterial);
        this.castleDoor.position.set(centerPosition.x, doorHeight / 2, centerPosition.z + southWallZ + 0.01);
        safeAdd(this.overworldContainer, this.castleDoor);
        // This object's position is used to check for entry. It is NOT an obstacle.
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
         this.interiorSize = 14; // Increased size slightly for more room
        const wallHeight = 4;
        const wallThickness = 0.5;
        const roomCenter = new THREE.Vector3(100, 0, 100); // Place it far away
        this.castleRoomCenter = roomCenter;
        this.castleInteriorEntryPoint = roomCenter.clone().add(new THREE.Vector3(0, 0, this.interiorSize / 2 - 2));
        this.castleExitPoint = this.castleInteriorEntryPoint.clone();
        // Interior floor
        const floorGeo = new THREE.PlaneGeometry(this.interiorSize, this.interiorSize);
        // Use the stone wall texture for the floor with proper error handling
        let largeCastleWallTexture;
        try {
            largeCastleWallTexture = getPixelSpriteTexture('castleWall', 1, 128);
            if (largeCastleWallTexture) {
                largeCastleWallTexture.wrapS = THREE.RepeatWrapping;
                largeCastleWallTexture.wrapT = THREE.RepeatWrapping;
                largeCastleWallTexture.repeat.set(this.interiorSize / 4, this.interiorSize / 4);
            }
        } catch (error) {
            console.warn('[TextureCheck] Error creating castleWall texture:', error);
            largeCastleWallTexture = null;
        }
        
        const floorMat = new THREE.MeshLambertMaterial({
            map: largeCastleWallTexture,
            color: largeCastleWallTexture ? 0xffffff : 0x666666 // Gray fallback if no texture
        });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.copy(roomCenter);
        safeAdd(this.interiorContainer, floorMesh);
        // Interior walls - reuse the same texture for consistency
        const wallMaterial = new THREE.MeshLambertMaterial({
            map: largeCastleWallTexture,
            color: largeCastleWallTexture ? 0xffffff : 0x555555 // Darker gray fallback for walls
        });
        const walls = [
             // North wall (behind throne)
            { pos: new THREE.Vector3(0, wallHeight / 2, -this.interiorSize / 2), size: new THREE.Vector3(this.interiorSize, wallHeight, wallThickness) },
             // South wall (with exit) - we leave a gap, no wall needed as it's the exit zone
            // { pos: new THREE.Vector3(0, wallHeight / 2, this.interiorSize / 2), size: new THREE.Vector3(this.interiorSize, wallHeight, wallThickness) },
             // West wall
            { pos: new THREE.Vector3(-this.interiorSize / 2, wallHeight / 2, 0), size: new THREE.Vector3(wallThickness, wallHeight, this.interiorSize) },
             // East wall
            { pos: new THREE.Vector3(this.interiorSize / 2, wallHeight / 2, 0), size: new THREE.Vector3(wallThickness, wallHeight, this.interiorSize) },
        ];
        walls.forEach(w => {
            const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(w.size.x, w.size.y, w.size.z), wallMaterial);
            wallMesh.geometry.attributes.uv.array.forEach((_, i) => {
                if (i % 2 === 0) wallMesh.geometry.attributes.uv.array[i] *= Math.max(w.size.x, w.size.z);
                else wallMesh.geometry.attributes.uv.array[i] *= w.size.y;
            });
            wallMesh.position.copy(w.pos).add(roomCenter);
            safeAdd(this.interiorContainer, wallMesh);
            // This is a BoxGeometry, not a sprite, so collision check needs adjustment if we use size.
            // For now, we rely on the bounds check.
        });
        // Helper to add decorative sprites
        const addDecoration = (spriteType, size, position, rotationY = 0) => {
            const deco = createPixelSprite(spriteType, size);
            deco.position.copy(position);
            deco.rotation.y = rotationY;
            deco.position.y = 0.01; // Place slightly above floor to prevent z-fighting
            safeAdd(this.interiorContainer, deco);
            return deco;
        };
        // Add Throne
        const throneSize = 2;
        const throne = addDecoration('throne', throneSize, roomCenter.clone().add(new THREE.Vector3(0, throneSize / 2, -this.interiorSize / 2 + 2)));
        throne.userData.size = throneSize;
        // this.interiorObstacles.push(throne); // The throne should be interactable, not a solid obstacle
        this.throne = throne; // Store a direct reference
        // Add Fireplace with Light
        const fireplaceSize = 1.5;
        const fireplace = addDecoration('fireplace', fireplaceSize, roomCenter.clone().add(new THREE.Vector3(this.interiorSize/2 - 0.5, fireplaceSize/2, -3)), -Math.PI / 2);
        fireplace.userData.size = fireplaceSize;
        this.interiorObstacles.push(fireplace);
        const fireLight = new THREE.PointLight(0xff6600, 2, 8, 2);
        fireLight.position.copy(fireplace.position).add(new THREE.Vector3(-0.2, 0.2, 0));
        fireLight.userData.baseIntensity = fireLight.intensity;
        fireLight.userData.flickerOffset = Math.random() * 100;
        safeAdd(this.interiorContainer, fireLight);
        this.torchLights.push(fireLight); // Add to same flicker system
        // Add Torches with dynamic lights next to the throne
        const torchY = 2; // Height on the wall
        const createTorchWithLight = (position) => {
            const torchSize = 1;
            const torch = createPixelSprite('torch', torchSize);
            torch.position.copy(position);
            safeAdd(this.interiorContainer, torch);
            const torchLight = new THREE.PointLight(0xffaa33, 1.5, 7, 2);
            torchLight.position.copy(position).add(new THREE.Vector3(0, 0.2, 0)); // Light emanates slightly above base
            torchLight.userData.baseIntensity = torchLight.intensity;
            torchLight.userData.flickerOffset = Math.random() * 100;
            safeAdd(this.interiorContainer, torchLight);
            this.torchLights.push(torchLight);
        };
        const throneZ = -this.interiorSize / 2 + 1.5;
        createTorchWithLight(roomCenter.clone().add(new THREE.Vector3(-2.5, torchY, throneZ)));
        createTorchWithLight(roomCenter.clone().add(new THREE.Vector3(2.5, torchY, throneZ)));
        // Add Bookshelves
        const bookshelfSize = new THREE.Vector3(1, 2.5, 1);
        const createBookshelf = (posX, posZ) => {
            const shelf = addDecoration('bookshelf', bookshelfSize.x, roomCenter.clone().add(new THREE.Vector3(posX, bookshelfSize.y / 2, posZ)));
            shelf.scale.y = bookshelfSize.y / bookshelfSize.x; // Adjust height
            shelf.userData.size = bookshelfSize.x;
            this.interiorObstacles.push(shelf);
        };
        const bookshelfWallOffset = -this.interiorSize / 2 + 0.5;
        createBookshelf(bookshelfWallOffset, -2);
        createBookshelf(bookshelfWallOffset, 2);
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
}
// Helper to safely add objects to a parent
function safeAdd(parent, child) {
    if (parent === child) {
        console.warn('[safeAdd] Attempted to add object as a child of itself:', parent);
        return;
    }
    parent.add(child);
}