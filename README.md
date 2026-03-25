# Pixel Scrolls - 2D Elder Scrolls RPG

**Play Now**: [https://santiagoip.github.io/2D-Pixel-RPG/](https://santiagoip.github.io/2D-Pixel-RPG/)

A 2D pixel art RPG inspired by The Elder Scrolls, built entirely in the browser with Three.js. Features procedurally generated sprites, synthesized audio, exploration, quests, crafting, and combat across 7 biomes.

## Controls

### Movement & Combat
| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move |
| Space | Attack / Cast spell |
| Shift | Dodge roll |
| Q (hold) | Block |
| 1 / 2 / 3 | Switch weapon (Sword / Bow / Staff) |
| E | Interact with NPCs, doors, objects |
| F | Gather resources |

### Menus & Interface
| Key | Action |
|-----|--------|
| I | Inventory & Equipment |
| J | Quest Journal |
| C | Crafting |
| M | World Map |
| B | Bestiary |
| H | Help overlay |
| N | Toggle music |
| P / Esc | Pause |
| Ctrl+S | Save game |
| Ctrl+L | Load game |

## Features

- **7 Biomes** -- Green Hills, Desert, Magic Forest, Barren Land, Mountains, Lake, Volcano
- **Quest System** -- Story and side quests with objective tracking
- **NPC Dialogue** -- Merchants, quest givers, and lore NPCs
- **Crafting & Equipment** -- Gather resources, craft items, equip gear
- **Castle Interior** -- Explorable castle with throne room
- **Shrine Buffs** -- Temporary stat boosts from overworld shrines
- **Procedural Audio** -- All music and SFX synthesized via Web Audio API
- **Procedural Sprites** -- All art rendered from pixel data, no external images
- **Save/Load** -- LocalStorage persistence with auto-save

## Running Locally

```bash
git clone https://github.com/SantiagoIP/2D-Pixel-RPG.git
cd 2D-Pixel-RPG
npx http-server -c-1 -p 3000
# Open http://localhost:3000
```

No build step or dependencies required -- the game runs as static ES modules loaded directly by the browser.

## Architecture

All source lives flat in the repo root as ES modules:

| File | Purpose |
|------|---------|
| `index.html` | Shell, tutorial, help overlay, CSS |
| `main.js` | Entry point, creates `Game` |
| `game.js` | Main loop, state, system orchestration |
| `player.js` | Player entity, movement, combat, collectibles |
| `monster.js` | Enemy AI, aggro, attacks |
| `world.js` | Biome world generation, obstacles, castle interior |
| `sceneSetup.js` | Three.js scene, camera, lighting, fog |
| `inputHandler.js` | Keyboard input tracking |
| `UIManager.js` | HUD, menus, overlays, shop |
| `AudioManager.js` | Procedural music and SFX (Web Audio) |
| `particleSystem.js` | GPU particle effects |
| `spriteUtils.js` | Pixel sprite generation |
| `noise.js` | Perlin noise for terrain |
| `buffs.js` | Shrine buff definitions |
| `npcManager.js` | NPC spawning, wandering, dialogue hooks |
| `dialogueSystem.js` | Dialogue UI and conversation flow |
| `questManager.js` | Quest state, journal, rewards |
| `inventorySystem.js` | Inventory grid, equipment, gold |
| `craftingSystem.js` | Crafting recipes and UI |
| `performanceOptimizer.js` | Adaptive quality, FPS monitoring |

## Tech Stack

- **Three.js v0.152.2** (CDN) -- WebGL rendering with orthographic camera
- **Web Audio API** -- Procedural synthesized audio
- **ES Modules** -- No bundler, plain browser imports
- **LocalStorage** -- Save/load persistence
