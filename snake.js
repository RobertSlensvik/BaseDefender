// =============== SNAKE.JS ===============
// Simple Snake game implementation

let snakeGame = null;
let snakeActive = false;

class SnakeGame {
    constructor(scene) {
        this.scene = scene;
        this.gridSize = 20;
        this.width = Math.floor(scene.scale.width / this.gridSize);
        this.height = Math.floor(scene.scale.height / this.gridSize);

        // Game state
        this.snake = [{ x: 10, y: 10 }];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = this.generateFood();
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.pauseMenu = null;

        // Timing
        this.moveCounter = 0;
        this.moveDelay = 5; // moves every 5 frames

        // Input handlers (store for cleanup)
        this.keyHandlers = {};

        // Draw green checkerboard background
        this.checkerboardGraphics = null;
        this.drawCheckerboardBackground(scene);

        // Graphics
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(10);

        // UI
        this.scoreText = scene.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        });
        this.scoreText.setDepth(100);

        this.instructionsText = scene.add.text(
            scene.scale.width / 2,
            scene.scale.height - 40,
            'Arrow Keys to Move | ESC to Return to Menu',
            {
                fontSize: '16px',
                fill: '#aaa',
                fontFamily: 'Arial',
                align: 'center'
            }
        );
        this.instructionsText.setOrigin(0.5);
        this.instructionsText.setDepth(100);

        // Input
        this.setupInput();
    }

    setupInput() {
        const escHandler = () => {
            if (!snakeActive) return;
            if (this.paused) {
                this.closePauseMenu();
            } else {
                this.showPauseMenu();
            }
        };

        const upHandler = () => {
            if (!snakeActive) return;
            if (this.direction.y === 0 && !this.paused) this.nextDirection = { x: 0, y: -1 };
        };

        const downHandler = () => {
            if (!snakeActive) return;
            if (this.direction.y === 0 && !this.paused) this.nextDirection = { x: 0, y: 1 };
        };

        const leftHandler = () => {
            if (!snakeActive) return;
            if (this.direction.x === 0 && !this.paused) this.nextDirection = { x: -1, y: 0 };
        };

        const rightHandler = () => {
            if (!snakeActive) return;
            if (this.direction.x === 0 && !this.paused) this.nextDirection = { x: 1, y: 0 };
        };

        this.scene.input.keyboard.on('keydown-UP', upHandler);
        this.scene.input.keyboard.on('keydown-DOWN', downHandler);
        this.scene.input.keyboard.on('keydown-LEFT', leftHandler);
        this.scene.input.keyboard.on('keydown-RIGHT', rightHandler);
        this.scene.input.keyboard.on('keydown-ESC', escHandler);

        this.keyHandlers = {
            up: { event: 'keydown-UP', handler: upHandler },
            down: { event: 'keydown-DOWN', handler: downHandler },
            left: { event: 'keydown-LEFT', handler: leftHandler },
            right: { event: 'keydown-RIGHT', handler: rightHandler },
            esc: { event: 'keydown-ESC', handler: escHandler }
        };
    }

    drawCheckerboardBackground(scene) {
        this.checkerboardGraphics = scene.add.graphics();
        this.checkerboardGraphics.setDepth(-1);
        
        const darkGreen = 0x1a4d1a;
        const lightGreen = 0x2d7a2d;
        const gridSize = this.gridSize;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Alternate colors based on position
                const color = (x + y) % 2 === 0 ? darkGreen : lightGreen;
                this.checkerboardGraphics.fillStyle(color);
                this.checkerboardGraphics.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
            }
        }
    }

    generateFood() {
        let newFood;
        let collision = true;

        while (collision) {
            newFood = {
                x: Math.floor(Math.random() * this.width),
                y: Math.floor(Math.random() * this.height)
            };

            collision = this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
        }

        return newFood;
    }

    update() {
        if (this.gameOver || !snakeActive || this.paused) return;

        this.moveCounter++;

        if (this.moveCounter >= this.moveDelay) {
            this.moveCounter = 0;

            // Apply direction change
            this.direction = this.nextDirection;

            // Move head
            const head = this.snake[0];
            const newHead = {
                x: (head.x + this.direction.x + this.width) % this.width,
                y: (head.y + this.direction.y + this.height) % this.height
            };

            // Check collision with self
            if (this.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
                this.endGame();
                return;
            }

            this.snake.unshift(newHead);

            // Check food collision
            if (newHead.x === this.food.x && newHead.y === this.food.y) {
                this.score += 10;
                this.food = this.generateFood();
                this.scoreText.setText('Score: ' + this.score);
            } else {
                this.snake.pop();
            }
        }

        this.draw();
    }

    draw() {
        if (this.gameOver) return;

        // Clear graphics
        this.graphics.clear();

        // Draw snake
        this.graphics.fillStyle(0x00ff00, 1);
        this.snake.forEach(segment => {
            this.graphics.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        });

        // Draw food
        this.graphics.fillStyle(0xff0000, 1);
        this.graphics.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 1,
            this.gridSize - 1
        );
    }

    endGame() {
        this.gameOver = true;

        // Show game over prompt with name input
        showSnakeGameOverPrompt(this.scene, {
            score: this.score,
            snakeGame: this
        });
    }

    saveSnakeScore(name = 'Player') {
        // Try to save to server first
        try {
            fetch('/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    score: this.score,
                    game: 'snake',
                    date: new Date().toISOString()
                })
            }).catch(err => {
                // If server fails, save to localStorage
                this.saveSnakeScoreLocal(name);
            });
        } catch (err) {
            // Local fallback
            this.saveSnakeScoreLocal(name);
        }
    }

    saveSnakeScoreLocal(name = 'Player') {
        try {
            const key = 'snake_scores_v1';
            const raw = localStorage.getItem(key) || '[]';
            let scores = JSON.parse(raw);
            if (!Array.isArray(scores)) scores = [];
            
            scores.push({
                name: name,
                score: this.score,
                game: 'snake',
                date: new Date().toISOString()
            });
            
            localStorage.setItem(key, JSON.stringify(scores));
        } catch (err) {
            console.warn('Failed to save snake score locally:', err);
        }
    }

    cleanup() {
        if (this.scoreText) this.scoreText.destroy();
        if (this.instructionsText) this.instructionsText.destroy();
        if (this.graphics) this.graphics.destroy();
        if (this.checkerboardGraphics) this.checkerboardGraphics.destroy();
        if (this.pauseMenu) this.pauseMenu.destroy();
        
        // Remove keyboard event listeners
        if (this.keyHandlers) {
            Object.values(this.keyHandlers).forEach(handler => {
                this.scene.input.keyboard.off(handler.event, handler.handler);
            });
        }
        
        // Reset background to black
        this.scene.cameras.main.setBackgroundColor('#000000');
    }

    showPauseMenu() {
        this.paused = true;

        // Create semi-transparent overlay
        const overlay = this.scene.add.rectangle(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2,
            this.scene.scale.width,
            this.scene.scale.height,
            0x000000,
            0.7
        );
        overlay.setDepth(200);

        // Create pause menu container
        this.pauseMenu = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2
        );
        this.pauseMenu.add(overlay);

        // Pause title
        const pauseTitle = this.scene.add.text(0, -100, 'PAUSED', {
            fontSize: '48px',
            fill: '#fff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        pauseTitle.setOrigin(0.5);
        this.pauseMenu.add(pauseTitle);

        // Resume button
        const resumeBtn = this.scene.add.rectangle(0, -20, 250, 60, 0x22aa22);
        resumeBtn.setInteractive();
        resumeBtn.on('pointerover', () => {
            resumeBtn.setFillStyle(0x44dd44);
        });
        resumeBtn.on('pointerout', () => {
            resumeBtn.setFillStyle(0x22aa22);
        });
        resumeBtn.on('pointerdown', () => {
            this.closePauseMenu();
        });
        this.pauseMenu.add(resumeBtn);

        const resumeText = this.scene.add.text(0, -20, 'RESUME', {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        resumeText.setOrigin(0.5);
        resumeText.setInteractive();
        resumeText.on('pointerover', () => {
            resumeBtn.setFillStyle(0x44dd44);
        });
        resumeText.on('pointerout', () => {
            resumeBtn.setFillStyle(0x22aa22);
        });
        resumeText.on('pointerdown', () => {
            this.closePauseMenu();
        });
        this.pauseMenu.add(resumeText);

        // Return to menu button
        const menuBtn = this.scene.add.rectangle(0, 70, 250, 60, 0xaa2222);
        menuBtn.setInteractive();
        menuBtn.on('pointerover', () => {
            menuBtn.setFillStyle(0xff4444);
        });
        menuBtn.on('pointerout', () => {
            menuBtn.setFillStyle(0xaa2222);
        });
        menuBtn.on('pointerdown', () => {
            this.returnToMenu();
        });
        this.pauseMenu.add(menuBtn);

        const menuText = this.scene.add.text(0, 70, 'RETURN TO MENU', {
            fontSize: '20px',
            fill: '#fff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        menuText.setOrigin(0.5);
        menuText.setInteractive();
        menuText.on('pointerover', () => {
            menuBtn.setFillStyle(0xff4444);
        });
        menuText.on('pointerout', () => {
            menuBtn.setFillStyle(0xaa2222);
        });
        menuText.on('pointerdown', () => {
            this.returnToMenu();
        });
        this.pauseMenu.add(menuText);

        this.pauseMenu.setDepth(201);
    }

    closePauseMenu() {
        if (this.pauseMenu) {
            this.pauseMenu.destroy();
            this.pauseMenu = null;
        }
        this.paused = false;
    }

    returnToMenu() {
        this.paused = false;
        snakeActive = false;
        this.cleanup();
        showSnakeMenu(this.scene);
    }
}

function showSnakeGameOverPrompt(scene, meta) {
    if (typeof document === 'undefined') {
        location.reload();
        return;
    }

    if (window.__snake_gameover_prompt_shown) return;
    window.__snake_gameover_prompt_shown = true;

    const score = (meta && meta.score) || 0;
    const snakeGame = meta && meta.snakeGame;

    const overlay = document.createElement('div');
    overlay.id = 'snake-gameover-overlay';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.75)';
    overlay.style.zIndex = 10000;

    const box = document.createElement('div');
    box.style.background = '#111';
    box.style.color = '#fff';
    box.style.padding = '20px';
    box.style.borderRadius = '8px';
    box.style.minWidth = '320px';
    box.style.textAlign = 'center';

    const title = document.createElement('h2');
    title.innerText = 'Game Over';
    title.style.marginTop = '0';

    const info = document.createElement('p');
    info.innerText = `Final Score: ${score}`;

    const label = document.createElement('label');
    label.innerText = 'Enter name for scoreboard:';
    label.style.display = 'block';
    label.style.margin = '12px 0 6px 0';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Your name';
    input.style.width = '90%';
    input.style.padding = '8px';
    input.style.borderRadius = '4px';
    input.style.border = '1px solid #333';

    const btnRow = document.createElement('div');
    btnRow.style.marginTop = '14px';
    btnRow.style.display = 'flex';
    btnRow.style.justifyContent = 'center';
    btnRow.style.gap = '10px';

    const submitBtn = document.createElement('button');
    submitBtn.innerText = 'Submit';
    submitBtn.style.padding = '8px 14px';
    submitBtn.style.cursor = 'pointer';

    const skipBtn = document.createElement('button');
    skipBtn.innerText = 'Skip';
    skipBtn.style.padding = '8px 14px';
    skipBtn.style.cursor = 'pointer';

    const status = document.createElement('div');
    status.style.marginTop = '10px';
    status.style.fontSize = '14px';

    btnRow.appendChild(submitBtn);
    btnRow.appendChild(skipBtn);

    box.appendChild(title);
    box.appendChild(info);
    box.appendChild(label);
    box.appendChild(input);
    box.appendChild(btnRow);
    box.appendChild(status);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function cleanupAndReturnToMenu() {
        try {
            document.body.removeChild(overlay);
        } catch (e) {}
        window.__snake_gameover_prompt_shown = false;
        snakeActive = false;
        if (snakeGame) snakeGame.cleanup();
        showSnakeMenu(scene);
    }

    skipBtn.addEventListener('click', () => {
        const name = 'Anonymous';
        if (snakeGame) snakeGame.saveSnakeScore(name);
        cleanupAndReturnToMenu();
    });

    submitBtn.addEventListener('click', async () => {
        const name = (input.value || 'Anon').trim().substring(0, 32);
        status.innerText = 'Saving...';
        submitBtn.disabled = true;
        skipBtn.disabled = true;
        
        if (snakeGame) {
            snakeGame.saveSnakeScore(name);
            status.innerText = 'Saved! Returning to menu...';
        }
        
        setTimeout(cleanupAndReturnToMenu, 900);
    });

    input.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') submitBtn.click();
    });

    // Focus input field
    input.focus();
}

function startSnakeGame(scene) {
    if (snakeActive) return;
    snakeActive = true;

    // Clear any existing menus
    try {
        if (menuContainer) menuContainer.destroy();
    } catch (e) {}

    // Clear all Base Defender game objects
    try {
        if (player) player.destroy();
        if (base) base.destroy();
        if (enemies) enemies.clear(true, true);
        if (coins) coins.clear(true, true);
        if (background) background.destroy();
        if (projectiles) projectiles.clear(true, true);
        if (playerEntity) playerEntity.destroy();
        if (baseEntity) baseEntity.destroy();
    } catch (e) {}

    // Clear Base Defender UI text
    try {
        if (coinText) coinText.destroy();
        if (waveText) waveText.destroy();
        if (playerHPText) playerHPText.destroy();
        if (baseHPText) baseHPText.destroy();
    } catch (e) {}

    snakeGame = new SnakeGame(scene);
}

function updateSnakeGame() {
    if (snakeGame && snakeActive) {
        snakeGame.update();
    }
}

