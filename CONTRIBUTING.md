# 🎮 Contributing to Rosebud Game

Thanks for your interest in contributing! This guide will help you get started.

## 🚀 Quick Start

1. **Fork** this repository
2. **Clone** your fork locally
3. **Create** a feature branch
4. **Make** your changes
5. **Test** thoroughly 
6. **Submit** a Pull Request

## 🎯 Ways to Contribute

### 🐛 Bug Reports
- Use the issue template
- Include browser/OS info
- Provide steps to reproduce
- Add screenshots if helpful

### ✨ Feature Ideas
- **New Biomes**: Desert variations, underwater, space
- **Monsters**: Flying enemies, boss battles, mini-bosses
- **Weapons**: Magic spells, traps, area effects
- **UI Improvements**: Better menus, mobile support
- **Audio**: More music tracks, sound variety
- **Visual Effects**: Better particles, lighting, shadows

### 🎨 Art & Design
- **New Sprites**: Monsters, items, terrain
- **Animations**: Character movement, attack effects
- **UI Design**: Better layouts, icons, themes
- **Color Schemes**: Biome variations, accessibility

### 🔧 Code Improvements
- **Performance**: Optimize rendering, memory usage
- **Architecture**: Better code organization, modularity
- **Features**: Save/load, achievements, multiplayer
- **Testing**: Unit tests, integration tests

## 🛠️ Development Setup

### Prerequisites
- Modern browser (Chrome, Firefox, Safari)
- Basic knowledge of JavaScript
- Git for version control

### Local Development
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/rosebud-game.git
cd rosebud-game

# Start development server
npm start

# Game runs at http://localhost:3000
```

### File Structure
```
rosebud-game/
├── index.html          # Entry point
├── main.js             # Game initialization
├── game.js             # Main game loop
├── player.js           # Player character system
├── monster.js          # Monster AI and behavior
├── world.js            # World generation and biomes
├── UIManager.js        # User interface management
├── AudioManager.js     # Sound and music system
├── spriteUtils.js      # Pixel art sprite generation
├── particleSystem.js   # Visual effects
├── sceneSetup.js       # Three.js scene configuration
├── inputHandler.js     # Keyboard input management
├── buffs.js            # Shrine buff definitions
├── noise.js            # Terrain generation
└── README.md           # Project documentation
```

## 📝 Code Style

### JavaScript Guidelines
- Use **ES6+ features** (modules, arrow functions, classes)
- **Descriptive variable names** (`playerHealth` not `pH`)
- **Comment complex logic** and algorithms
- **No console.log in production** (use for debugging only)
- **Consistent indentation** (2 spaces)

### Code Example
```javascript
// Good: Clear and descriptive
export class Monster {
    constructor(scene, type = 'greenOgre') {
        this.currentHealth = this.getMaxHealthForType(type);
        this.attackDamage = this.getAttackDamageForType(type);
    }
    
    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.showDamageEffect();
    }
}
```

### Sprite Development
- **16x16 pixel art** format
- **Procedural generation** (no external images)
- **Color palettes** that fit biome themes
- **Consistent pixel density**

## 🧪 Testing

### Before Submitting
1. **Test all biomes** - Ensure each biome loads and plays correctly
2. **Check all weapons** - Sword, bow, and staff functionality
3. **Verify UI** - Menus, health bars, minimap work
4. **Audio test** - Music and sound effects play
5. **Browser compatibility** - Test in Chrome, Firefox, Safari
6. **Performance check** - No significant frame drops

### Testing Commands
```bash
# Start local server
npm start

# Open in different browsers
open -a "Google Chrome" http://localhost:3000
open -a Safari http://localhost:3000
open -a Firefox http://localhost:3000
```

## 📋 Pull Request Process

### 1. Preparation
```bash
# Create feature branch
git checkout -b feature/amazing-addition

# Make your changes
# Test thoroughly
```

### 2. Commit Guidelines
```bash
# Use descriptive commit messages
git commit -m "Add fire elemental monster to volcano biome"
git commit -m "Fix player collision with castle walls"
git commit -m "Improve particle effects for magic attacks"
```

### 3. Submission
- **Clear description** of changes
- **Screenshots/GIFs** for visual changes
- **Test results** in different browsers
- **Link to related issues** if applicable

### 4. Review Process
- Code review by maintainers
- Testing on different systems
- Discussion and feedback
- Merge when approved

## 🎨 Design Philosophy

### Game Design Principles
- **Accessibility**: Easy to learn, hard to master
- **Performance**: Smooth gameplay on all devices
- **Modularity**: Clean, maintainable code
- **Pixel Art**: Retro aesthetic with modern tech
- **Procedural**: Generate content algorithmically

### Technical Principles
- **No External Dependencies**: Self-contained except Three.js CDN
- **Browser-First**: Works directly in web browsers
- **Lightweight**: Fast loading and responsive
- **Cross-Platform**: Runs on desktop and mobile browsers

## 🏆 Recognition

### Contributors
All contributors will be:
- **Listed in README** with their contributions
- **Credited in game** (about screen)
- **Invited to beta test** new features
- **Given commit access** for trusted contributors

### Contribution Types
- 🐛 **Bug fixes**
- ✨ **New features** 
- 🎨 **Art & design**
- 📝 **Documentation**
- 🧪 **Testing**
- 💡 **Ideas & feedback**

## 📞 Getting Help

### Questions?
- **Open an issue** for game-related questions
- **Check existing issues** for similar problems
- **Join discussions** in issue comments
- **Review the code** - it's well-documented!

### Learning Resources
- [Three.js Documentation](https://threejs.org/docs/)
- [MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [Game Development Patterns](https://gameprogrammingpatterns.com/)

---

**Happy coding! Let's make this game amazing together!** 🎮✨ 