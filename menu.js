// =============== MENU.JS ===============
// Contains all menu and UI related functions

// ============== MAIN MENU ==============
function showMainMenu(scene) {
    // Clear any existing game state
    gameStarted = false;
    snakeActive = false;
    gamePaused = false;

    // Hide pause menu container
    if (pauseMenuContainer) {
        pauseMenuContainer.setVisible(false);
    }

    // Clear enemy wave
    if (enemies) {
        enemies.clear(true, true);
        enemyEntities = [];
    }

    // Hide game sprites and UI
    if (player) player.setVisible(false);
    if (base) base.setVisible(false);
    if (coinText) coinText.setVisible(false);
    if (waveText) waveText.setVisible(false);
    if (playerHPText) playerHPText.setVisible(false);
    if (baseHPText) baseHPText.setVisible(false);

    // Set black background
    scene.cameras.main.setBackgroundColor('#000000');

    // Create menu container
    menuContainer = scene.add.container(scene.scale.width / 2, scene.scale.height / 2);

    // Main Title - "Robert's Arcade"
    const arcadeTitle = scene.add.text(0, -180, "Robert's Arcade", {
        fontSize: '72px',
        fill: '#ff00ff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#ff0080',
        strokeThickness: 3
    });
    arcadeTitle.setOrigin(0.5);
    menuContainer.add(arcadeTitle);

    // Subtitle
    const titleText = scene.add.text(0, -80, 'GAME SELECTOR', {
        fontSize: '36px',
        fill: '#00ff00',
        fontFamily: 'Arial',
        fontStyle: 'bold'
    });
    titleText.setOrigin(0.5);
    menuContainer.add(titleText);

    // Subtitle
    const subtitleText = scene.add.text(0, -120, 'Choose a game to play', {
        fontSize: '20px',
        fill: '#aaa',
        fontFamily: 'Arial'
    });
    subtitleText.setOrigin(0.5);
    menuContainer.add(subtitleText);

    // Base Defender Button
    const baseDefenderBtn = scene.add.rectangle(0, -20, 300, 80, 0x1a7a1a);
    baseDefenderBtn.setInteractive();
    baseDefenderBtn.on('pointerover', () => {
        baseDefenderBtn.setFillStyle(0x22aa22);
    });
    baseDefenderBtn.on('pointerout', () => {
        baseDefenderBtn.setFillStyle(0x1a7a1a);
    });
    baseDefenderBtn.on('pointerdown', () => {
        showBaseDefenderMenu(scene);
    });
    menuContainer.add(baseDefenderBtn);

    const baseDefenderText = scene.add.text(0, -20, 'BASE DEFENDER', {
        fontSize: '24px',
        fill: '#fff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
    });
    baseDefenderText.setOrigin(0.5);
    baseDefenderText.setInteractive();
    baseDefenderText.on('pointerover', () => {
        baseDefenderBtn.setFillStyle(0x22aa22);
    });
    baseDefenderText.on('pointerout', () => {
        baseDefenderBtn.setFillStyle(0x1a7a1a);
    });
    baseDefenderText.on('pointerdown', () => {
        showBaseDefenderMenu(scene);
    });
    menuContainer.add(baseDefenderText);

    // Snake Button
    const snakeBtn = scene.add.rectangle(0, 100, 300, 80, 0x1a2a7a);
    snakeBtn.setInteractive();
    snakeBtn.on('pointerover', () => {
        snakeBtn.setFillStyle(0x2244ff);
    });
    snakeBtn.on('pointerout', () => {
        snakeBtn.setFillStyle(0x1a2a7a);
    });
    snakeBtn.on('pointerdown', () => {
        showSnakeMenu(scene);
    });
    menuContainer.add(snakeBtn);

    const snakeText = scene.add.text(0, 100, 'SNAKE', {
        fontSize: '24px',
        fill: '#fff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
    });
    snakeText.setOrigin(0.5);
    snakeText.setInteractive();
    snakeText.on('pointerover', () => {
        snakeBtn.setFillStyle(0x2244ff);
    });
    snakeText.on('pointerout', () => {
        snakeBtn.setFillStyle(0x1a2a7a);
    });
    snakeText.on('pointerdown', () => {
        showSnakeMenu(scene);
    });
    menuContainer.add(snakeText);

    // Instructions
    const instructionsText = scene.add.text(0, 200, 'Click to select a game', {
        fontSize: '16px',
        fill: '#999',
        fontFamily: 'Arial'
    });
    instructionsText.setOrigin(0.5);
    menuContainer.add(instructionsText);

    menuContainer.setDepth(100);
}

// ============== BASE DEFENDER MENU ==============
function showBaseDefenderMenu(scene) {
    // Clear the main menu
    if (menuContainer) {
        menuContainer.destroy();
        menuContainer = null;
    }

    // Show game sprites as background
    if (player) player.setVisible(true);
    if (base) base.setVisible(true);

    // Set background to game background color (not black)
    scene.cameras.main.setBackgroundColor('#1a2233');

    // Show the Base Defender menu with Start Game, Controls, Scoreboard
    menuContainer = createMenuUI(scene);
}

// ============== SNAKE MENU ==============
function showSnakeMenu(scene) {
    // Clear the main menu
    if (menuContainer) {
        menuContainer.destroy();
        menuContainer = null;
    }

    // Show the Snake menu
    menuContainer = createSnakeMenuUI(scene);
}

function startGame(scene) {
    if (gameStarted) return;
    gameStarted = true;
    console.log('Starting Base Defender game...');
    
    // Show game sprites and UI
    if (player) player.setVisible(true);
    if (base) base.setVisible(true);
    if (coinText) coinText.setVisible(true);
    if (waveText) waveText.setVisible(true);
    if (playerHPText) playerHPText.setVisible(true);
    if (baseHPText) baseHPText.setVisible(true);
    
    // Destroy menu container and ensure it's fully cleaned up
    try {
        if (menuContainer) {
            console.log('Destroying menu container');
            menuContainer.destroy(true); // recursively destroy children
            menuContainer = null;
        }
    } catch (e) {
        console.warn('Error destroying menu container:', e);
        menuContainer = null;
    }
    
    // Reinitialize Base Defender game objects if they were destroyed
    try {
        console.log('Reinitializing Base Defender...');
        reInitializeBaseDefender(scene);
        console.log('Base Defender reinitialized successfully');
    } catch (e) {
        console.error('Error reinitializing Base Defender:', e);
        gameStarted = false;
        throw e;
    }
    
    try {
        console.log('Spawning first wave...');
        spawnWave(scene);
        console.log('First wave spawned successfully');
    } catch (e) {
        console.error('Error spawning wave:', e);
        gameStarted = false;
        throw e;
    }
}

function reInitializeBaseDefender(scene) {
    console.log('reInitializeBaseDefender called');
    
    // Reset pause state
    gamePaused = false;
    
    // Ensure pause menu is hidden
    if (pauseMenuContainer) {
        pauseMenuContainer.setVisible(false);
    }
    
    // Update current scene reference
    currentScene = scene;
    
    // Flag to track if we've already set up collision handlers
    let collisionsSetup = false;
    
    // Helper to check if an object is valid (exists and is not destroyed)
    const isValid = (obj) => obj && obj !== null && typeof obj === 'object';
    const isSpriteValid = (sprite) => isValid(sprite) && sprite.active !== false;
    
    try {
        // Recreate base entity if it doesn't exist or is destroyed
        if (!isValid(baseEntity) || !isSpriteValid(base)) {
            // Try to destroy old sprite if it exists
            try {
                if (baseEntity && baseEntity.destroy && typeof baseEntity.destroy === 'function') {
                    baseEntity.destroy();
                }
                if (base && base.destroy && typeof base.destroy === 'function') {
                    base.destroy();
                }
            } catch (e2) {
                console.warn('Error destroying old base:', e2);
            }
            const baseLeftMargin = 80;
            baseEntity = new Base(scene, baseLeftMargin, scene.scale.height / 2);
            base = baseEntity.sprite;
        }
    } catch (e) {
        console.warn('Error creating base entity:', e);
        const baseLeftMargin = 80;
        baseEntity = new Base(scene, baseLeftMargin, scene.scale.height / 2);
        base = baseEntity.sprite;
    }

    try {
        // Recreate player entity if it doesn't exist or is destroyed
        if (!isValid(playerEntity) || !isSpriteValid(player)) {
            // Try to destroy old sprite if it exists
            try {
                if (playerEntity && playerEntity.destroy && typeof playerEntity.destroy === 'function') {
                    playerEntity.destroy();
                }
                if (player && player.destroy && typeof player.destroy === 'function') {
                    player.destroy();
                }
            } catch (e2) {
                console.warn('Error destroying old player:', e2);
            }
            playerEntity = new Player(scene, scene.scale.width / 2, scene.scale.height - 150);
            player = playerEntity.sprite;
        }
    } catch (e) {
        console.warn('Error creating player entity:', e);
        playerEntity = new Player(scene, scene.scale.width / 2, scene.scale.height - 150);
        player = playerEntity.sprite;
    }

    // Recreate enemy group
    if (!isValid(enemies)) {
        enemies = scene.physics.add.group();
    } else {
        enemies.clear(true, true);
    }

    // Recreate coins group
    if (!isValid(coins)) {
        coins = scene.physics.add.group();
    } else {
        coins.clear(true, true);
    }

    // Recreate projectiles group
    if (!isValid(projectiles)) {
        projectiles = scene.physics.add.group();
    } else {
        projectiles.clear(true, true);
    }
    
    // Configure projectiles group for world bounds detection
    try {
        if (projectiles.children && projectiles.children.entries) {
            projectiles.children.entries.forEach(proj => {
                if (proj && proj.body) {
                    proj.body.setCollideWorldBounds(true);
                    proj.body.onWorldBounds = true;
                }
            });
        }
    } catch (e) {
        console.warn('Error configuring projectiles:', e);
    }

    // Recreate UI text - always destroy and recreate fresh
    try {
        if (coinText) {
            try { coinText.destroy(); } catch (e) {}
        }
        coinText = scene.add.text(20, 20, 'Coins: 0', { fontSize: '20px', fill: '#fff' });
        coinText.setDepth(100);
        console.log('coinText created');
    } catch (e) {
        console.error('Error creating coinText:', e);
    }

    try {
        if (waveText) {
            try { waveText.destroy(); } catch (e) {}
        }
        waveText = scene.add.text(20, 50, 'Wave: 1', { fontSize: '20px', fill: '#fff' });
        waveText.setDepth(100);
        console.log('waveText created');
    } catch (e) {
        console.error('Error creating waveText:', e);
    }

    try {
        if (playerHPText) {
            try { playerHPText.destroy(); } catch (e) {}
        }
        playerHPText = scene.add.text(20, 80, 'Player HP: 100', { fontSize: '20px', fill: '#00ff00' });
        playerHPText.setDepth(100);
        console.log('playerHPText created');
    } catch (e) {
        console.error('Error creating playerHPText:', e);
    }

    try {
        if (baseHPText) {
            try { baseHPText.destroy(); } catch (e) {}
        }
        baseHPText = scene.add.text(20, 110, 'Base HP: 300', { fontSize: '20px', fill: '#ff4444' });
        baseHPText.setDepth(100);
        console.log('baseHPText created');
    } catch (e) {
        console.error('Error creating baseHPText:', e);
    }

    // Reset game state
    coinsCollected = 0;
    wave = 1;
    attackCooldown = 0;
    shootCooldown = 0;
    enemyEntities = [];
    
    // Reinitialize player and base HP
    if (isValid(playerEntity)) {
        playerEntity.hp = 100;
    }
    if (isValid(baseEntity)) {
        baseEntity.hp = 300;
    }

    // Re-add collision handlers - clear old ones first by removing and recreating the physics groups
    try {
        console.log('Setting up collision handlers');
        scene.physics.add.collider(player, enemies, playerHit, null, scene);
        scene.physics.add.overlap(player, coins, collectCoin, null, scene);
        if (baseEntity && baseEntity.hitZone) {
            scene.physics.add.overlap(enemies, baseEntity.hitZone, hitBase, null, scene);
        }
        scene.physics.add.overlap(projectiles, enemies, projectileHitEnemy, null, scene);
        
        // Re-add world bounds event handler for projectiles
        scene.physics.world.on('worldbounds', body => {
            if (body && body.gameObject && body.gameObject.texture && body.gameObject.texture.key === 'bullet') {
                body.gameObject.destroy();
            }
        });
        console.log('Collision handlers set up successfully');
    } catch (e) {
        console.error('Error setting up collision handlers:', e);
    }

    // Reset camera background color for Base Defender
    scene.cameras.main.setBackgroundColor('#1a2233');
    
    // Note: Keyboard handlers are already set up in game.js create(), 
    // no need to set them up again here - this would create duplicate handlers.

    // Ensure physics is running (in case it was paused)
    try {
        if (scene && scene.physics && typeof scene.physics.resume === 'function') {
            scene.physics.resume();
        }
    } catch (e) {
        console.warn('Error resuming physics:', e);
    }
}

async function loadScoreboard(scene, textObj) {
    if (!textObj) return;
    textObj.setText('Loading...');

    // Helper: normalize an entry to { name, score, wave, date, source }
    const normalize = (s, source) => {
        if (!s) return null;
        if (Array.isArray(s)) {
            return {
                name: String(s[0] || 'Anon'),
                score: Number(s[1] || 0) || 0,
                wave: null,
                date: null,
                source
            };
        }
        if (typeof s === 'object') {
            return {
                name: String(s.name || s.player || 'Anon'),
                score: Number(s.score ?? s.points ?? 0) || 0,
                wave: s.wave ?? null,
                date: s.date ?? null,
                source
            };
        }
        // primitive
        return { name: String(s), score: 0, wave: null, date: null, source };
    };

    let serverList = [];
    // Try to load from Scoreboard.json file first
    try {
        const res = await fetch('./Scoreboard.json');
        if (res && res.ok) {
            let data = await res.json();
            if (!Array.isArray(data)) {
                if (data && Array.isArray(data.scores)) data = data.scores;
                else data = [];
            }
            serverList = data.map(s => normalize(s, 'file')).filter(Boolean).filter(s => s.game === 'basedefender' || !s.game);
        }
    } catch (err) {
        console.warn('Failed to fetch Scoreboard.json:', err);
        // Try legacy /scores endpoint as fallback
        try {
            const res = await fetch('/scores');
            if (res && res.ok) {
                let data = await res.json();
                if (!Array.isArray(data)) {
                    if (data && Array.isArray(data.scores)) data = data.scores;
                    else data = [];
                }
                serverList = data.map(s => normalize(s, 'server')).filter(Boolean).filter(s => s.game === 'basedefender' || !s.game);
            }
        } catch (err2) {
            console.warn('Failed to fetch server scores:', err2);
            serverList = [];
        }
    }

    // Load local scores saved when submit failed
    let localList = [];
    try {
        const key = 'base_defender_local_scores_v1';
        const raw = localStorage.getItem(key);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                localList = parsed.map(s => normalize(s, 'local')).filter(Boolean).filter(s => s.game === 'basedefender' || !s.game);
            }
        }
    } catch (err) {
        console.warn('Failed to read local scores:', err);
    }

    const combined = serverList.concat(localList);
    if (combined.length === 0) {
        textObj.setText('No scores yet');
        return;
    }

    // sort by score desc
    combined.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Find highest score from last patch/deploy
    // Now: highest score overall
    let highestScoreLastPatch = null;
    if (combined.length > 0) {
        highestScoreLastPatch = combined.reduce((max, s) => (s.score > max.score ? s : max), combined[0]);
    }

    // Get patch number from package.json
    let patchNumber = 'unknown';
    try {
        const res = await fetch('./package.json');
        if (res && res.ok) {
            const pkg = await res.json();
            patchNumber = pkg.version || 'unknown';
        }
    } catch (e) {}

    const lines = [];
    if (highestScoreLastPatch) {
        lines.push(`Highest score patch ${patchNumber}: "${highestScoreLastPatch.score}" by ${highestScoreLastPatch.name}`);
        lines.push('');
    }
    lines.push(...combined.slice(0, 5).map((s, i) => {
        const wavePart = s.wave ? ` (W${s.wave})` : '';
        const src =
            s.source === 'local' &&
            !serverList.find(ss => ss.name === s.name && ss.score === s.score)
                ? ' [local]'
                : '';
        return `${i + 1}. ${s.name} — ${s.score}${wavePart}${src}`;
    }));

    textObj.setText(lines.join('\n'));
}

function showGameOverPrompt(scene, meta) {
    if (typeof document === 'undefined') {
        location.reload();
        return;
    }

    if (window.__gd_prompt_shown) return;
    window.__gd_prompt_shown = true;

    const score = (meta && meta.score) || 0;
    const waves = (meta && meta.wave) || 0;

    const overlay = document.createElement('div');
    overlay.id = 'gd-gameover-overlay';
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
    info.innerText = `Score: ${score}   Wave: ${waves}`;

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
        window.__gd_prompt_shown = false;
        showMainMenu(scene);
    }

    skipBtn.addEventListener('click', () => {
        cleanupAndReturnToMenu();
    });

    submitBtn.addEventListener('click', async () => {
        const name = (input.value || 'Anon').trim().substring(0, 32);
        status.innerText = 'Saving...';
        submitBtn.disabled = true;
        skipBtn.disabled = true;
        try {
            await submitScore({ name, score, wave: waves, game: 'basedefender' });
            status.innerText = 'Saved! Returning to menu...';
            setTimeout(cleanupAndReturnToMenu, 900);
        } catch (e) {
            status.innerText = 'Failed to save remotely — saved locally.';
            setTimeout(cleanupAndReturnToMenu, 900);
        }
    });

    input.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') submitBtn.click();
    });
}

async function submitScore(payload) {
    try {
        const res = await fetch('/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Network response not ok');
        return await res.json();
    } catch (e) {
        try {
            const key = 'base_defender_local_scores_v1';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push({
                name: payload.name,
                score: payload.score,
                wave: payload.wave,
                game: payload.game || 'basedefender',
                date: new Date().toISOString()
            });
            localStorage.setItem(key, JSON.stringify(existing));
        } catch (err) {
            console.warn('Failed to save locally', err);
        }
        throw e;
    }
}

function createPauseMenuUI(scene) {
    const pauseContainer = scene.add.container(0, 0).setDepth(200);
    const pauseBg = scene.add
        .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.6)
        .setOrigin(0);
    const pauseTitle = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 100, 'PAUSED', {
            fontSize: '44px',
            fill: '#fff'
        })
        .setOrigin(0.5);

    // Resume button
    const resumeBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 10, 'Resume Game', {
            fontSize: '28px',
            fill: '#0f0',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    // Controls button
    const controlsBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 50, 'Controls', {
            fontSize: '28px',
            fill: '#0ff',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    // Exit button
    const exitBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 110, 'Exit to Menu', {
            fontSize: '28px',
            fill: '#ff0',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    // Controls panel (hidden by default)
    const controlsPanel = scene.add.container(0, 0).setVisible(false);
    const panelBg = scene.add
        .rectangle(
            scene.scale.width / 2 - 260,
            scene.scale.height / 2 - 120,
            520,
            260,
            0x111111,
            0.95
        )
        .setOrigin(0);
    const controlsTitle = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 80, 'Controls', {
            fontSize: '36px',
            fill: '#fff'
        })
        .setOrigin(0.5);
    const controlsText = scene.add
        .text(
            scene.scale.width / 2,
            scene.scale.height / 2 - 20,
            'Move: WASD or Arrow keys\nShoot: SPACE\nSpawn new wave: E\nPause: ESC',
            { fontSize: '20px', fill: '#ddd', align: 'center' }
        )
        .setOrigin(0.5);
    const backBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 80, 'Back', {
            fontSize: '22px',
            fill: '#fff',
            backgroundColor: '#333'
        })
        .setOrigin(0.5)
        .setPadding(8)
        .setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
        controlsPanel.setVisible(false);
        resumeBtn.setVisible(true);
        controlsBtn.setVisible(true);
        exitBtn.setVisible(true);
    });
    controlsPanel.add([panelBg, controlsTitle, controlsText, backBtn]);

    // Resume button handler
    resumeBtn.on('pointerdown', () => {
        gamePaused = false;
        pauseContainer.setVisible(false);
        try {
            if (scene && scene.physics && typeof scene.physics.resume === 'function') {
                scene.physics.resume();
            }
        } catch (e) {
            console.warn('Failed to resume physics on scene:', e);
        }
    });

    // Controls button handler
    controlsBtn.on('pointerdown', () => {
        controlsPanel.setVisible(true);
        resumeBtn.setVisible(false);
        controlsBtn.setVisible(false);
        exitBtn.setVisible(false);
    });

    // Exit button handler
    exitBtn.on('pointerdown', () => {
        gamePaused = false;
        gameStarted = false;
        pauseContainer.setVisible(false);
        try {
            if (menuContainer) menuContainer.destroy();
        } catch (e) {}
        showMainMenu(scene);
    });

    pauseContainer.add([pauseBg, pauseTitle, resumeBtn, controlsBtn, exitBtn, controlsPanel]);
    return pauseContainer;
}

function createMenuUI(scene) {
    const menuContainer = scene.add.container(0, 0).setDepth(200);
    const menuBg = scene.add
        .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.6)
        .setOrigin(0);
    const title = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 80, 'Base Defender', {
            fontSize: '48px',
            fill: '#fff'
        })
        .setOrigin(0.5);

    // Main menu buttons
    const startBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 10, 'Start Game', {
            fontSize: '28px',
            fill: '#0f0',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    const controlsBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 70, 'Controls', {
            fontSize: '28px',
            fill: '#0ff',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    const scoreboardBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 130, 'Scoreboard', {
            fontSize: '28px',
            fill: '#ff0',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    const exitMenuBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 190, 'Back to Games', {
            fontSize: '28px',
            fill: '#f0f',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    // Controls panel (hidden by default)
    const controlsPanel = scene.add.container(0, 0).setVisible(false);
    const panelBg = scene.add
        .rectangle(
            scene.scale.width / 2 - 260,
            scene.scale.height / 2 - 120,
            520,
            260,
            0x111111,
            0.95
        )
        .setOrigin(0);
    const controlsTitle = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 80, 'Controls', {
            fontSize: '36px',
            fill: '#fff'
        })
        .setOrigin(0.5);
    const controlsText = scene.add
        .text(
            scene.scale.width / 2,
            scene.scale.height / 2 - 20,
            'Move: WASD or Arrow keys\nShoot: SPACE\nSpawn new wave: E\nStart: ENTER or click Start Game',
            { fontSize: '20px', fill: '#ddd', align: 'center' }
        )
        .setOrigin(0.5);
    const backBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 80, 'Back', {
            fontSize: '22px',
            fill: '#fff',
            backgroundColor: '#333'
        })
        .setOrigin(0.5)
        .setPadding(8)
        .setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
        controlsPanel.setVisible(false);
        startBtn.setVisible(true);
        controlsBtn.setVisible(true);
        scoreboardBtn.setVisible(true);
        exitMenuBtn.setVisible(true);
    });
    controlsPanel.add([panelBg, controlsTitle, controlsText, backBtn]);

    // Scoreboard panel (hidden by default)
    const scoreboardPanel = scene.add.container(0, 0).setVisible(false);
    const sbBg = scene.add
        .rectangle(
            scene.scale.width / 2 - 260,
            scene.scale.height / 2 - 140,
            520,
            300,
            0x0b0b0b,
            0.95
        )
        .setOrigin(0);
    const sbTitle = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 100, 'Scoreboard', {
            fontSize: '36px',
            fill: '#fff'
        })
        .setOrigin(0.5);
    const scoresText = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 40, 'Loading...', {
            fontSize: '20px',
            fill: '#ddd',
            align: 'center'
        })
        .setOrigin(0.5);
    const sbRefresh = scene.add
        .text(scene.scale.width / 2 - 60, scene.scale.height / 2 + 100, 'Refresh', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#333'
        })
        .setOrigin(0.5)
        .setPadding(8)
        .setInteractive({ useHandCursor: true });
    const sbBack = scene.add
        .text(scene.scale.width / 2 + 60, scene.scale.height / 2 + 100, 'Back', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#333'
        })
        .setOrigin(0.5)
        .setPadding(8)
        .setInteractive({ useHandCursor: true });
    sbBack.on('pointerdown', () => {
        scoreboardPanel.setVisible(false);
        startBtn.setVisible(true);
        controlsBtn.setVisible(true);
        scoreboardBtn.setVisible(true);
        exitMenuBtn.setVisible(true);
    });
    sbRefresh.on('pointerdown', () => loadScoreboard(scene, scoresText));
    scoreboardPanel.add([sbBg, sbTitle, scoresText, sbRefresh, sbBack]);

    // Wire up main menu actions
    startBtn.on('pointerdown', () => startGame(scene));
    scene.input.keyboard.on('keydown-ENTER', () => startGame(scene));
    controlsBtn.on('pointerdown', () => {
        // show controls and hide main buttons
        controlsPanel.setVisible(true);
        startBtn.setVisible(false);
        controlsBtn.setVisible(false);
        scoreboardBtn.setVisible(false);
        exitMenuBtn.setVisible(false);
    });

    scoreboardBtn.on('pointerdown', () => {
        // show scoreboard and hide main buttons
        scoreboardPanel.setVisible(true);
        startBtn.setVisible(false);
        controlsBtn.setVisible(false);
        scoreboardBtn.setVisible(false);
        exitMenuBtn.setVisible(false);
        loadScoreboard(scene, scoresText);
    });

    exitMenuBtn.on('pointerdown', () => {
        menuContainer.destroy();
        showMainMenu(scene);
    });

    menuContainer.add([menuBg, title, startBtn, controlsBtn, scoreboardBtn, exitMenuBtn, controlsPanel, scoreboardPanel]);
    return menuContainer;
}
// ============== SNAKE MENU ==============
function createSnakeMenuUI(scene) {
    const menuContainer = scene.add.container(0, 0).setDepth(200);
    
    // Create checkerboard background
    const gridSize = 20;
    const width = Math.floor(scene.scale.width / gridSize);
    const height = Math.floor(scene.scale.height / gridSize);
    
    const checkerboardGraphics = scene.add.graphics();
    checkerboardGraphics.setDepth(0);
    
    const darkGreen = 0x1a4d1a;
    const lightGreen = 0x2d7a2d;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = (x + y) % 2 === 0 ? darkGreen : lightGreen;
            checkerboardGraphics.fillStyle(color);
            checkerboardGraphics.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
        }
    }
    
    // Semi-transparent overlay for menu readability
    const menuBg = scene.add
        .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.3)
        .setOrigin(0);
    menuBg.setDepth(199);
    
    const title = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 80, 'Snake', {
            fontSize: '48px',
            fill: '#fff'
        })
        .setOrigin(0.5);

    // Main menu buttons
    const startBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 10, 'Start Game', {
            fontSize: '28px',
            fill: '#0f0',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    const scoreboardBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 70, 'High Scores', {
            fontSize: '28px',
            fill: '#ff0',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    const exitBtn = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 130, 'Exit to Game Selector', {
            fontSize: '28px',
            fill: '#f0f',
            backgroundColor: '#222'
        })
        .setOrigin(0.5)
        .setPadding(10)
        .setInteractive({ useHandCursor: true });

    // Scoreboard panel (hidden by default)
    const scoreboardPanel = scene.add.container(0, 0).setVisible(false);
    const sbBg = scene.add
        .rectangle(
            scene.scale.width / 2 - 260,
            scene.scale.height / 2 - 140,
            520,
            300,
            0x0b0b0b,
            0.95
        )
        .setOrigin(0);
    const sbTitle = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 100, 'High Scores', {
            fontSize: '36px',
            fill: '#fff'
        })
        .setOrigin(0.5);
    const scoresText = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 - 40, 'Loading...', {
            fontSize: '20px',
            fill: '#ddd',
            align: 'center'
        })
        .setOrigin(0.5);
    const sbBack = scene.add
        .text(scene.scale.width / 2, scene.scale.height / 2 + 100, 'Back', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#333'
        })
        .setOrigin(0.5)
        .setPadding(8)
        .setInteractive({ useHandCursor: true });
    sbBack.on('pointerdown', () => {
        scoreboardPanel.setVisible(false);
        startBtn.setVisible(true);
        scoreboardBtn.setVisible(true);
        exitBtn.setVisible(true);
    });
    scoreboardPanel.add([sbBg, sbTitle, scoresText, sbBack]);

    // Wire up main menu actions
    startBtn.on('pointerdown', () => startSnakeGame(scene));
    scoreboardBtn.on('pointerdown', () => {
        // show scoreboard and hide main buttons
        scoreboardPanel.setVisible(true);
        startBtn.setVisible(false);
        scoreboardBtn.setVisible(false);
        exitBtn.setVisible(false);
        loadSnakeScoreboard(scene, scoresText);
    });

    exitBtn.on('pointerdown', () => {
        try {
            if (checkerboardGraphics) checkerboardGraphics.destroy();
        } catch (e) {}
        menuContainer.destroy();
        showMainMenu(scene);
    });

    menuContainer.add([checkerboardGraphics, menuBg, title, startBtn, scoreboardBtn, exitBtn, scoreboardPanel]);
    return menuContainer;
}

// Load snake high scores
function loadSnakeScoreboard(scene, textObj) {
    if (!textObj) return;
    textObj.setText('Loading...');

    const normalize = (s) => {
        if (!s) return null;
        if (typeof s === 'object') {
            return {
                name: String(s.name || 'Anon'),
                score: Number(s.score || 0),
                game: s.game || null
            };
        }
        return null;
    };

    let scores = [];

    // Try to load from Scoreboard.json file first
    try {
        fetch('./Scoreboard.json')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    let fileScores = [];
                    if (!Array.isArray(data)) {
                        if (data && Array.isArray(data.scores)) fileScores = data.scores;
                    } else {
                        fileScores = data;
                    }
                    scores = fileScores
                        .map(s => normalize(s))
                        .filter(s => s && (s.game === 'snake' || !s.game))
                        .filter(Boolean);
                }
                
                // Fallback to localStorage if no server scores found
                if (scores.length === 0) {
                    try {
                        const key = 'snake_scores_v1';
                        const raw = localStorage.getItem(key);
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            if (Array.isArray(parsed)) {
                                scores = parsed
                                    .filter(s => !s.game || s.game === 'snake')
                                    .map(s => ({
                                        name: String(s.name || 'Anon'),
                                        score: Number(s.score || 0)
                                    }));
                            }
                        }
                    } catch (err) {
                        console.warn('Failed to load local snake scores:', err);
                    }
                }

                // Also check old key for backwards compatibility
                if (scores.length === 0) {
                    try {
                        const key = 'snake_high_scores_v1';
                        const raw = localStorage.getItem(key);
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            if (Array.isArray(parsed)) {
                                scores = parsed.map(s => ({
                                    name: String(s.name || 'Anon'),
                                    score: Number(s.score || 0)
                                }));
                            }
                        }
                    } catch (err) {}
                }

                displaySnakeScores(textObj, scores);
            })
            .catch(err => {
                console.warn('Failed to fetch Scoreboard.json:', err);
                // Fallback to localStorage
                try {
                    const key = 'snake_scores_v1';
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            scores = parsed
                                .filter(s => !s.game || s.game === 'snake')
                                .map(s => ({
                                    name: String(s.name || 'Anon'),
                                    score: Number(s.score || 0)
                                }));
                        }
                    }
                    displaySnakeScores(textObj, scores);
                } catch (err2) {
                    console.warn('Failed to load snake scores:', err2);
                    textObj.setText('No high scores yet');
                }
            });
    } catch (err) {
        console.warn('Error loading snake scoreboard:', err);
        textObj.setText('No high scores yet');
    }
}

function displaySnakeScores(textObj, scores) {
    if (scores.length === 0) {
        textObj.setText('No high scores yet');
        return;
    }

    scores.sort((a, b) => b.score - a.score);
    const top10 = scores.slice(0, 10);

    let text = 'Top Scores:\n\n';
    top10.forEach((entry, i) => {
        text += `${i + 1}. ${entry.name} - ${entry.score}\n`;
    });

    textObj.setText(text);
}