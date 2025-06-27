# 🎮 Rosebud Game - Deployment Guide

## 🚀 Quick Start for Friends

### Option 1: Play Online (Recommended)
1. Visit: **[Your GitHub Pages URL will be here]**
2. Click on a biome to start playing!
3. Use WASD to move, Spacebar to attack

### Option 2: Run Locally
```bash
# Clone the repository
git clone https://github.com/[YOUR_USERNAME]/rosebud-game.git
cd rosebud-game

# Start the game (no installation needed!)
npm start

# Open in browser
open http://localhost:3000
```

## 🌐 GitHub Pages Deployment

### Automatic Deployment
This repository is configured for GitHub Pages deployment:

1. **Push to main branch** - Game automatically deploys
2. **Access via**: `https://[YOUR_USERNAME].github.io/rosebud-game/`
3. **Share the link** with friends!

### Manual Setup (if needed)
1. Go to repository **Settings** → **Pages**
2. Set **Source** to "Deploy from a branch"
3. Select **Branch**: `main` and **Folder**: `/ (root)`
4. Save and wait a few minutes

## 🔧 Development Setup

### For Contributors
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/[YOUR_USERNAME]/rosebud-game.git
cd rosebud-game

# Create feature branch
git checkout -b feature/awesome-addition

# Make changes and test
npm start

# Commit and push
git add .
git commit -m "Add awesome feature"
git push origin feature/awesome-addition

# Create Pull Request on GitHub
```

### Testing Changes
```bash
# Run the game locally
npm start

# Test in browser at http://localhost:3000
# Try all biomes and features
# Check browser console for errors
```

## 📱 Sharing with Friends

### Easy Sharing Options:
1. **GitHub Pages Link**: `https://[YOUR_USERNAME].github.io/rosebud-game/`
2. **QR Code**: Generate one for the GitHub Pages URL
3. **Social Media**: Share screenshots and the link
4. **Local Network**: Run `npm start` and share `http://[YOUR_IP]:3000`

### Game Features to Highlight:
- 🗺️ **7 Unique Biomes** (Green Hills to Volcano)
- ⚔️ **3 Weapon Types** (Sword, Bow, Staff)
- 🎵 **Procedural Music & Sound Effects**
- 🏰 **Castle Interior** with throne room
- ⭐ **Shrine Buffs** for power-ups
- 🎨 **16x16 Pixel Art** - All procedurally generated!

## 🐛 Troubleshooting

### Common Issues:
- **Port 3000 busy**: Try `npm run dev` or use port 8080
- **Black screen**: Refresh browser and check console
- **No audio**: Click anywhere to enable audio context
- **Controls not working**: Make sure game window has focus

### Browser Requirements:
- ✅ **Chrome/Safari/Firefox** (latest versions)
- ✅ **WebGL support** required
- ✅ **ES6 modules** support needed
- ✅ **Web Audio API** for sound

## 🎯 Performance Tips

### For Best Experience:
1. **Use fullscreen mode** (F11)
2. **Close other browser tabs** for better performance
3. **Enable hardware acceleration** in browser settings
4. **Use wired connection** for multiplayer (future feature)

## 📝 Version Info

- **Current Version**: 1.0.0 (Fully Working Release)
- **Engine**: Three.js v0.152.2
- **No Installation Required**: Runs directly in browser
- **File Size**: ~200KB (lightweight!)

---

**Ready to play? Share this link: [YOUR_GITHUB_PAGES_URL]** 🎮 