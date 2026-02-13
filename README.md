# Base Defender

A fun and engaging tower defense style game built with [Phaser 3](https://phaser.io/). Defend your base from waves of enemies while collecting coins and managing your resources!

## Game Overview

In Base Defender, you take control of a player character tasked with protecting your base from incoming enemy waves. Eliminate enemies, collect coins, and survive as many waves as possible. Each wave brings new challenges and opportunities to increase your score.

## Features

- **Dynamic Wave System**: Enemies spawn in increasing waves with growing difficulty
- **Player Movement**: Use arrow keys or WASD to move your character around the map
- **Shooting Mechanics**: Attack enemies with projectiles to defend your base
- **Resource Management**: Collect coins dropped by defeated enemies
- **Base Defense**: Protect your base's health pool - if it reaches zero, it's game over
- **Score Tracking**: Compete for high scores with a leaderboard system
- **Pause System**: Pause and resume gameplay at any time
- **Menu System**: Intuitive start and pause menus

## Controls

- **Arrow Keys or WASD**: Move your character
- **Mouse**: Aim and shoot at enemies
- **P**: Pause/Resume game
- **Start Button**: Begin the game from the menu

## Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/yourusername/BaseDefender.git
   cd BaseDefender
   ```

2. Open the project folder in Visual Studio Code

3. Install the Live Server extension:
   - Open Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Search for "Live Server" by Ritwick Dey
   - Click Install

4. Launch the game:
   - Right-click on `index.html` and select "Open with Live Server"
   - Your default browser will open the game automatically at `http://127.0.0.1:5500`

## Project Structure

```
BaseDefender/
├── index.html       # Main HTML file
├── game.js          # Core game logic, Phaser config, and game loop
├── entities.js      # Player, Base, and Enemy classes
├── menu.js          # Menu and UI functionality
├── style.css        # Styling for the game
└── assets/          # Game sprites and images
    ├── player.png
    ├── enemy.png
    ├── coin.png
    └── base.png
```

## File Descriptions

- **game.js**: Contains the main Phaser configuration, game initialization, and the update loop that handles all game logic
- **entities.js**: Defines the `Entity`, `Player`, `Base`, and `Enemy` classes that represent game objects
- **menu.js**: Handles menu rendering, UI elements, and scoreboard functionality
- **style.css**: Contains all CSS styling for the game interface
- **assets/**: Directory containing all game sprites and graphics

## Gameplay Tips

- Keep your player moving to avoid enemy attacks
- Position yourself between enemies and your base for better defense
- Collect coins to prepare for future upgrades (if implemented)
- Watch your base health - it decreases when enemies reach it
- Survive longer waves to increase your score and climb the leaderboard

## Technologies Used

- **Phaser 3**: Game framework for rendering and physics
- **JavaScript (ES6+)**: Core game logic
- **HTML5**: Page structure
- **CSS3**: Styling and layout

## Future Enhancements

Potential features for future versions:
- Player and tower upgrades
- Special power-ups
- Multiple difficulty levels
- Sound effects and background music
- Mobile touch controls
- Additional enemy types
- Boss waves

## Author

Created by Robert Slensvik

## Support

For issues or questions, please open an issue on the GitHub repository.

---

**Enjoy defending your base!** 🚀🛡️
