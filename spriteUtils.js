import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
// Function to draw pixel data onto canvas context
function drawPixels(context, pixelData, pixelSize, colors) {
    const gridPixelSize = context.canvas.width / pixelSize; // Size of each "pixel" on the canvas grid
    context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clear previous drawing
    for (let y = 0; y < pixelSize; y++) {
        for (let x = 0; x < pixelSize; x++) {
            const colorIndex = pixelData[y * pixelSize + x];
            if (colorIndex > 0) { // 0 is transparent
                context.fillStyle = colors[colorIndex - 1]; // Adjust index for colors array
                context.fillRect(x * gridPixelSize, y * gridPixelSize, gridPixelSize, gridPixelSize);
            }
        }
    }
}
// Sprite definitions (0=transparent, 1=color1, 2=color2, etc.)
// 16x16 Sprite definitions (0=transparent)
// Colors: 1: Primary, 2: Secondary, 3: Accent1, 4: Accent2, etc.
const spriteData = {
    player: { // Classic Blue Wizard
        pixels: [
            0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0, // Hat tip
            0,0,0,0,0,1,1,2,1,0,0,0,0,0,0,0,
            0,0,0,0,1,1,2,2,1,1,0,0,0,0,0,0,
            0,0,0,1,1,2,2,2,2,1,1,0,0,0,0,0,
            0,0,1,3,3,3,3,3,3,3,1,0,0,0,0,0, // Hat brim
            0,0,5,5,5,5,5,5,5,5,5,5,0,0,0,0, // Hair
            0,0,5,4,4,8,5,5,8,4,4,5,0,0,0,0, // Face/Eyes
            0,0,5,5,4,4,4,4,4,4,5,5,0,0,0,0, // Beard
            0,0,0,5,5,5,5,5,5,5,5,0,0,0,0,0,
            0,0,0,1,2,1,5,5,1,2,1,0,7,0,0,0, // Shoulders & Staff
            0,0,1,2,2,2,1,1,2,2,2,1,6,7,0,0,
            0,1,2,2,2,2,2,2,2,2,2,1,6,0,0,0,
            0,1,1,2,2,2,2,2,2,2,1,1,6,0,0,0,
            0,0,1,1,2,2,2,2,2,2,1,1,6,0,0,0,
            0,0,0,0,1,1,0,0,1,1,0,0,6,0,0,0, // Robe Hem & Feet
            0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0, // Staff Bottom
        ],
        colors: ['#283593', '#3949AB', '#FFD700', '#FFCCBC', '#F5F5F5', '#8D6E63', '#00BCD4', '#000000'],
        pixelGridSize: 16
    },
    greenOgre: { // Renamed from monster (Simple Slime)
        pixels: [
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, // Row 1
            0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0, // Row 2
            0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0, // Row 3
            0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0, // Row 4
            0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0, // Row 5
            0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0, // Row 6
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, // Row 7
            1,1,1,1,1,2,2,1,1,2,2,1,1,1,1,1, // Row 8 (Eyes)
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, // Row 9
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, // Row 10
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, // Row 11
            0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0, // Row 12
            0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0, // Row 13
            0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0, // Row 14
            0,0,0,0,1,1,1,0,0,1,1,1,0,0,0,0, // Row 15 (Base)
            0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0, // Row 16
        ],
        colors: ['#32CD32', '#000000'], // Body (Lime Green), Eyes
        pixelGridSize: 16
    },
    redSkull: { // New Enemy Type
         pixels: [
            0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0, // Row 1
            0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0, // Row 2
            0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0, // Row 3
            0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0, // Row 4
            0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0, // Row 5
            1,1,1,1,1,2,2,1,1,2,2,1,1,1,1,1, // Row 6 (Eyes)
            1,1,1,1,2,3,3,2,2,3,3,2,1,1,1,1, // Row 7 (Eye Sockets)
            1,1,1,1,1,2,2,1,1,2,2,1,1,1,1,1, // Row 8
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, // Row 9
            0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0, // Row 10
            0,1,1,1,1,3,1,1,1,1,3,1,1,1,1,0, // Row 11 (Nose Hole)
            0,0,1,1,1,1,3,3,3,3,1,1,1,1,0,0, // Row 12 (Teeth Top)
            0,0,0,1,1,3,1,3,1,3,1,1,1,0,0,0, // Row 13 (Teeth Gaps)
            0,0,0,1,1,1,3,3,3,3,1,1,1,0,0,0, // Row 14 (Teeth Bottom)
            0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0, // Row 15
            0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0, // Row 16
        ],
        colors: ['#DCDCDC', '#B22222', '#000000'], // Gainsboro, Firebrick Red (for eyes), Black (sockets)
        pixelGridSize: 16
    },
    cyclops: {
        pixels: [
            0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,
            0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,
            0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0,
            0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0,
            0,1,2,2,2,3,3,3,3,2,2,2,2,1,0,0, // Eye top
            1,2,2,2,3,4,5,5,4,3,2,2,2,2,1,0,
            1,2,2,2,3,5,5,5,5,3,2,2,2,2,1,0,
            1,2,2,2,3,4,5,5,4,3,2,2,2,2,1,0,
            0,1,2,2,2,3,3,3,3,2,2,2,2,1,0,0, // Eye bottom
            0,1,2,2,2,2,2,2,2,2,2,2,2,1,0,0,
            0,0,1,2,2,6,6,6,6,6,6,2,2,1,0,0, // Mouth
            0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0,
            0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,
            0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0, // Legs
            0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0,
            0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,
        ],
        colors: ['#6B4226', '#A0522D', '#FFFFFF', '#FF0000', '#000000', '#5C4033'], // DarkBrown, MedBrown, EyeWhite, PupilRed, PupilBlack, MouthDark
        pixelGridSize: 16
    },
    magicWisp: {
        pixels: [
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,
            0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,
            0,0,0,1,2,3,3,3,3,3,2,1,0,0,0,0,
            0,0,1,2,3,3,4,4,3,3,2,1,0,0,0,0,
            0,1,2,3,3,4,4,4,4,3,3,2,1,0,0,0,
            0,1,2,3,4,4,5,5,4,4,3,2,1,0,0,0,
            0,1,2,3,4,5,5,5,5,4,3,2,1,0,0,0,
            0,1,2,3,4,4,5,5,4,4,3,2,1,0,0,0,
            0,1,2,3,3,4,4,4,4,3,3,2,1,0,0,0,
            0,0,1,2,3,3,4,4,3,3,2,1,0,0,0,0,
            0,0,0,1,2,3,3,3,3,3,2,1,0,0,0,0,
            0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0,
            0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        ],
        colors: ['#483D8B', '#7B68EE', '#9370DB', '#BA55D3', '#FFFFFF'], // DarkSlateBlue, MediumSlateBlue, MediumPurple, MediumOrchid, White core
        pixelGridSize: 16
    },
    rock: {
        pixels: [
            0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0, // Row 1
            0,0,0,1,1,2,2,2,2,1,1,1,0,0,0,0, // Row 2
            0,0,1,2,2,2,2,2,2,2,2,1,1,0,0,0, // Row 3
            0,1,2,2,2,2,2,2,2,2,2,2,1,1,0,0, // Row 4
            0,1,2,2,2,2,2,2,2,2,2,2,2,1,1,0, // Row 5
            1,1,2,2,2,2,2,2,2,2,2,2,2,1,1,1, // Row 6
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1, // Row 7
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1, // Row 8
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1, // Row 9
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1, // Row 10
            1,1,2,2,2,2,2,2,2,2,2,2,2,2,1,1, // Row 11
            0,1,1,2,2,2,2,2,2,2,2,2,1,1,1,0, // Row 12
            0,0,1,1,1,2,2,2,2,2,1,1,1,1,0,0, // Row 13
            0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0, // Row 14
            0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0, // Row 15
            0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0, // Row 16
        ],
        colors: ['#795548', '#A1887F'], // Dark Brown-Gray, Light Brown-Gray
        pixelGridSize: 16
    },
    tree: { // More detailed oak-style tree
        pixels: [
            0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,
            0,0,0,1,2,2,3,3,2,2,2,1,1,0,0,0,
            0,0,1,2,3,3,3,3,3,3,2,2,1,0,0,0,
            0,1,2,3,3,3,1,1,3,3,3,2,1,1,0,0,
            1,2,3,3,1,1,0,0,1,1,3,3,2,1,1,0,
            1,2,3,1,0,0,0,0,0,0,0,1,3,2,1,0,
            1,2,2,1,0,0,4,4,4,0,0,0,1,2,1,0,
            0,1,1,0,0,4,5,5,4,4,0,0,1,1,0,0,
            0,0,0,0,0,4,5,5,5,4,0,0,0,0,0,0,
            0,0,0,0,0,4,5,5,5,4,0,0,0,0,0,0,
            0,0,0,0,0,0,4,5,4,0,0,0,0,0,0,0,
            0,0,0,0,0,0,4,4,4,0,0,0,0,0,0,0,
            0,0,0,0,0,0,4,4,4,0,0,0,0,0,0,0,
            0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0,
            0,0,0,0,4,4,4,0,0,4,4,4,0,0,0,0,
            0,0,0,0,4,4,0,0,0,0,4,4,0,0,0,0,
        ],
        colors: ['#228B22', '#006400', '#3CB371', '#8B4513', '#A0522D'], // ForestGreen, DarkGreen, MedSeaGreen, SaddleBrown, Sienna
        pixelGridSize: 16
    },
    deadTree: { // Gnarled, leafless tree
        pixels: [
            0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,
            0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,
            0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,
            0,0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,
            0,0,1,0,0,0,0,1,0,1,0,0,0,0,0,0,
            0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0,
            0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,
            0,0,0,0,1,2,1,0,0,1,0,0,0,0,0,0,
            0,0,0,0,1,2,1,0,1,0,0,0,0,0,0,0,
            0,0,0,1,2,2,1,0,1,0,0,0,0,0,0,0,
            0,0,0,1,2,2,1,0,0,0,0,0,0,0,0,0,
            0,0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,
            0,0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,
        ],
        colors: ['#4B3A26', '#3D2D1D'], // Dark, gnarled brown colors
        pixelGridSize: 16
    },
    cactus: { // Saguaro-style cactus
        pixels: [
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,1,1,0,0,0,2,0,0,0, // Top with flower
            0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0,
            0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0,
            0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,
            0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,
            0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,
            0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,
            0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,
            0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,
            0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,
            0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,
            0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,
            0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        ],
        colors: ['#2E8B57', '#FF69B4'], // SeaGreen, HotPink (flower)
        pixelGridSize: 16
    },
    grass: {
        pixels: [
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,
            0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,
            0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0,
            0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,
            0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,
            0,0,0,1,1,1,0,1,0,1,1,1,0,0,0,0,
            0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,
            0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,
            0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,
            0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,
            1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,
            1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,
        ],
        colors: ['#34A853'], // Vibrant green
        pixelGridSize: 16
    },
    flower: { // A yellow flower with a red center
        pixels: [
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0,
            0,0,0,0,2,3,3,2,2,3,3,2,0,0,0,0,
            0,0,0,0,2,3,3,2,2,3,3,2,0,0,0,0,
            0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0,
            0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,
            0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,
            0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,
            0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        ],
        colors: ['#2E8B57', '#FFD700', '#FF4500'], // StemGreen, PetalGold, CenterRed
        pixelGridSize: 16
    },
    default: {
        pixels: [ // Simple 16x16 white square for default
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
        ],
        colors: ['#FFFFFF'],
        pixelGridSize: 16
    },
    castle: { // A smaller, more compact castle sprite
        pixels: [
            0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,
            0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0,
            0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0,
            0,1,2,2,1,3,3,1,1,3,3,1,2,2,1,0, // Windows
            0,1,2,2,1,3,3,1,1,3,3,1,2,2,1,0,
            1,2,2,2,1,1,1,1,1,1,1,1,2,2,2,1,
            1,2,2,2,1,1,1,1,1,1,1,1,2,2,2,1,
            1,2,2,2,1,1,1,1,1,1,1,1,2,2,2,1,
            1,2,2,2,1,1,1,1,1,1,1,1,2,2,2,1,
            1,2,2,2,1,1,1,1,1,1,1,1,2,2,2,1,
            1,2,2,2,1,1,1,1,1,1,1,1,2,2,2,1,
            1,2,2,2,1,0,0,0,0,0,0,1,2,2,2,1, // Door top
            1,2,2,2,1,0,0,0,0,0,0,1,2,2,2,1,
            1,2,2,2,1,0,0,0,0,0,0,1,2,2,2,1,
            1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,
            1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,
        ],
        colors: ['#A9A9A9', '#808080', '#ADD8E6'], // Stone, Shadow, Window
        pixelGridSize: 16
    },
    castleWall: {
        pixels: [
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,
            2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,
            2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,
            2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,
            2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,
        ],
        colors: ['#696969', '#A9A9A9'], // DarkGray mortar, Silver stone
        pixelGridSize: 16
    },
    castleDoor: {
        pixels: [
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,2,2,2,2,1,1,1,1,1,1,2,2,2,2,1,
            1,2,2,2,2,1,3,3,3,3,1,2,2,2,2,1,
            1,2,2,2,2,1,3,4,4,3,1,2,2,2,2,1,
            1,2,2,2,2,1,3,4,4,3,1,2,2,2,2,1,
            1,2,2,2,2,1,3,3,3,3,1,2,2,2,2,1,
            1,2,2,2,2,1,1,1,1,1,1,2,2,2,2,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        ],
        colors: ['#8B4513', '#A0522D', '#5C4033', '#C0C0C0'], // SaddleBrown, Sienna, DarkBrown, Silver handle
        pixelGridSize: 16
    },
    throne: {
        pixels: [
            0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,
            0,0,0,0,0,0,1,2,2,2,2,2,2,1,0,0,
            0,0,0,0,0,1,2,3,3,3,3,3,2,1,0,0,
            0,0,0,0,1,2,3,3,3,3,3,3,2,1,0,0,
            0,0,0,1,2,3,3,3,3,3,3,3,2,1,0,0,
            0,0,1,2,3,2,2,2,2,2,2,3,2,1,0,0,
            0,0,1,2,3,2,3,3,3,3,2,3,2,1,0,0,
            0,0,1,2,3,2,3,3,3,3,2,3,2,1,0,0,
            0,0,1,2,3,2,3,3,3,3,2,3,2,1,0,0,
            0,0,1,2,3,2,2,2,2,2,2,3,2,1,0,0,
            0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0,
            0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,
            0,0,4,4,1,1,1,1,1,1,1,1,4,4,0,0,
            0,0,4,4,1,3,3,3,3,3,3,1,4,4,0,0,
            0,0,4,4,1,3,3,3,3,3,3,1,4,4,0,0,
            0,0,4,4,1,1,1,1,1,1,1,1,4,4,0,0,
        ],
        colors: ['#FFD700', '#D4AF37', '#B22222', '#8B4513'], // Gold, DarkerGold, Red, Brown
        pixelGridSize: 16
    },
    torch: {
        pixels: [
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,
            0,0,0,0,0,4,5,5,4,0,0,0,0,0,0,0,
            0,0,0,0,3,4,5,5,4,3,0,0,0,0,0,0,
            0,0,0,0,3,4,4,4,4,3,0,0,0,0,0,0,
            0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,
            0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,
            0,0,0,0,2,1,1,1,1,2,0,0,0,0,0,0,
            0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,
            0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,
            0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        ],
        colors: ['#8B4513', '#808080', '#B22222', '#FF8C00', '#FFD700'], // Wood, Metal, Red, Orange, Yellow
        pixelGridSize: 16
    },
    bookshelf: {
        pixels: [
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,2,3,4,5,6,3,4,5,6,3,4,5,6,2,1,
            1,2,3,4,5,6,3,4,5,6,3,4,5,6,2,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,2,4,5,6,3,4,5,6,3,4,5,6,3,2,1,
            1,2,4,5,6,3,4,5,6,3,4,5,6,3,2,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,2,5,6,3,4,5,6,3,4,5,6,3,4,2,1,
            1,2,5,6,3,4,5,6,3,4,5,6,3,4,2,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        ],
        colors: ['#8B4513', '#5C4033', '#B22222', '#00008B', '#006400', '#FFD700'], // Wood, DarkWood, Red, Blue, Green, Gold
        pixelGridSize: 16
    },
    fireplace: {
        pixels: [
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1,
            1,2,1,3,3,3,3,3,3,3,3,3,3,1,2,1,
            1,2,1,3,4,5,5,5,5,5,5,4,3,1,2,1,
            1,2,1,3,4,4,5,5,5,5,4,4,3,1,2,1,
            1,2,1,3,3,4,4,5,5,4,4,3,3,1,2,1,
            1,2,1,3,3,3,4,4,4,4,3,3,3,1,2,1,
            1,2,1,3,3,3,3,3,3,3,3,3,3,1,2,1,
            1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1,
            1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,
            1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
            0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,
            0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,
            0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,
            0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,
        ],
        colors: ['#696969', '#A9A9A9', '#000000', '#FF8C00', '#FF4500'], // Mortar, Stone, Inside, Orange, Red
        pixelGridSize: 16
    },
    deadBush: {
        pixels: [
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,
            0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,0,
            0,0,0,0,1,0,1,0,1,0,1,0,0,0,0,0,
            0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,0,
            0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,
            0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,
            0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        ],
        colors: ['#8B5A2B'], // Dry brown
        pixelGridSize: 16
    },
    dirtPatch: {
        pixels: [
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,
            0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,
            0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,
            0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,
            0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,
            0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,
            0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,
            0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,
            0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,
            0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,
            0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        ],
        colors: ['#966944'], // Earthy brown
         pixelGridSize: 16
     },
    shrine: {
        pixels: [
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,
            0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,
            0,0,0,0,0,1,2,3,3,2,1,0,0,0,0,0,
            0,0,0,0,1,2,3,4,4,3,2,1,0,0,0,0,
            0,0,0,1,1,2,3,4,4,3,2,1,1,0,0,0,
            0,0,0,1,2,2,3,3,3,3,2,2,1,0,0,0,
            0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0,
            0,0,0,0,5,5,5,5,5,5,5,5,0,0,0,0,
            0,0,0,0,5,6,6,6,6,6,6,5,0,0,0,0,
            0,0,0,0,5,6,6,6,6,6,6,5,0,0,0,0,
            0,0,0,0,0,5,5,5,5,5,5,0,0,0,0,0,
            0,0,0,0,0,0,5,5,5,5,0,0,0,0,0,0,
            0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
        ],
        colors: ['#FFFFFF', '#BA55D3', '#9370DB', '#DDA0DD', '#A9A9A9', '#696969'], // White, Orchid, Purple, Plum, Gray Stone
        pixelGridSize: 16
    },
 };
 // Creates a PlaneGeometry with a CanvasTexture for a pixelated sprite look
export function createPixelSprite(spriteType = 'default', size = 1, canvasResolution) {
    let spriteInfo = spriteData[spriteType];
    if (!spriteInfo) {
        console.warn(`[createPixelSprite] Sprite type '${spriteType}' not found. Using default sprite.`);
        spriteInfo = spriteData.default;
    }
    const resolution = canvasResolution || spriteInfo.pixelGridSize || 16;
    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    drawPixels(context, spriteInfo.pixels, spriteInfo.pixelGridSize, spriteInfo.colors);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    const geometry = new THREE.PlaneGeometry(size, size);
    // Flat, pixel-art ShaderMaterial with no shadow or lighting
    const material = new THREE.ShaderMaterial({
        uniforms: {
            u_texture: { value: texture },
            u_flash: { value: 0.0 },
            u_color: { value: new THREE.Color(0xffffff) },
            u_time: { value: 0.0 },
            u_lightIntensity: { value: 1.0 },
            u_shadowIntensity: { value: 0.0 } // Disable shadow
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D u_texture;
            uniform float u_flash;
            uniform vec3 u_color;
            uniform float u_time;
            varying vec2 vUv;
            void main() {
                vec4 texColor = texture2D(u_texture, vUv);
                if (texColor.a < 0.1) discard;
                vec3 finalColor = mix(texColor.rgb * u_color, vec3(1.0, 1.0, 1.0), u_flash);
                gl_FragColor = vec4(finalColor, texColor.a);
            }
        `,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.rotation.x = -Math.PI / 2;
    mesh.dispose = () => {
        geometry.dispose();
        material.dispose();
        texture.dispose();
    };
    mesh.updateAnimation = (time) => {
        if (material.uniforms.u_time) {
            material.uniforms.u_time.value = time;
        }
    };
    return mesh;
}
// Creates a simple attack effect sprite (e.g., a slash)
export function createMonsterAttackSprite(size = 0.4) {
    const canvas = document.createElement('canvas');
    const canvasSize = 16;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    // Draw a red energy ball
    const colors = ['#FF4500', '#B22222', '#8B0000']; // OrangeRed core, Firebrick mid, DarkRed outer
    const cx = canvasSize / 2;
    const cy = canvasSize / 2;
    // Outer glow
    context.fillStyle = colors[2];
    context.beginPath();
    context.arc(cx, cy, 7, 0, Math.PI * 2);
    context.fill();
    // Mid glow
    context.fillStyle = colors[1];
    context.beginPath();
    context.arc(cx, cy, 5, 0, Math.PI * 2);
    context.fill();
    // Core
    context.fillStyle = colors[0];
    context.beginPath();
    context.arc(cx, cy, 3, 0, Math.PI * 2);
    context.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.dispose = () => {
        geometry.dispose();
        material.dispose();
        texture.dispose();
    };
    return mesh;
}
// Creates a magic bolt sprite for the player
export function createAttackSprite(size = 0.5) {
     const canvas = document.createElement('canvas');
     const canvasSize = 16;
     canvas.width = canvasSize;
     canvas.height = canvasSize;
     const context = canvas.getContext('2d');
     context.imageSmoothingEnabled = false; // Ensure sharp pixels
     // Draw a simple magic bolt/spark
     const colors = ['#FFFFFF', '#9999FF', '#5D3FD3']; // White core, light purple glow, dark purple outline
     const cx = canvasSize / 2;
     const cy = canvasSize / 2;
     // Outer glow (darker purple)
     context.fillStyle = colors[2];
     context.beginPath();
     context.moveTo(cx, 0);
     context.lineTo(canvasSize - 2, cy);
     context.lineTo(cx, canvasSize);
     context.lineTo(2, cy);
     context.closePath();
     context.fill();
     // Inner glow (lighter purple)
      context.fillStyle = colors[1];
      context.beginPath();
      context.moveTo(cx, 2);
      context.lineTo(canvasSize - 4, cy);
      context.lineTo(cx, canvasSize - 2);
      context.lineTo(4, cy);
      context.closePath();
      context.fill();
     // Core (white)
     context.fillStyle = colors[0];
     context.fillRect(cx - 1, cy - 3, 2, 6); // Vertical core
     context.fillRect(cx - 3, cy - 1, 6, 2); // Horizontal core
     const texture = new THREE.CanvasTexture(canvas);
     texture.magFilter = THREE.NearestFilter;
     texture.minFilter = THREE.NearestFilter;
     const geometry = new THREE.PlaneGeometry(size, size);
     const material = new THREE.MeshBasicMaterial({
         map: texture,
         color: 0xffffff, // Don't tint the texture
         transparent: true, // Use alpha from canvas
         alphaTest: 0.1,   // Render only non-transparent pixels
         side: THREE.DoubleSide
     });
     const mesh = new THREE.Mesh(geometry, material);
     mesh.rotation.x = -Math.PI / 2; // Orient correctly
     // Attach dispose function
      mesh.dispose = () => {
         geometry.dispose();
         material.dispose();
         texture.dispose();
     };
     return mesh;
}
export function getPixelSpriteTexture(spriteType = 'default', size = 1, canvasResolution) {
    let spriteInfo = spriteData[spriteType];
    if (!spriteInfo) {
        console.warn(`[getPixelSpriteTexture] Sprite type '${spriteType}' not found. Using default sprite.`);
        spriteInfo = spriteData.default;
    }
    const resolution = canvasResolution || spriteInfo.pixelGridSize || 16;
    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    drawPixels(context, spriteInfo.pixels, spriteInfo.pixelGridSize, spriteInfo.colors);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}