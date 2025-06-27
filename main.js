import { Game } from './game.js';  // ✅ CORRECT relative path

// Get the render target
const renderDiv = document.getElementById('game');

if (!renderDiv) {
    console.error("Fatal Error: game div not found.");
} else {
    const game = new Game(renderDiv);
}