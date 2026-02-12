const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "game",
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: "arcade",
        arcade: { debug: false }
    },
    scene: { preload, create, update }
};

let player, cursors, wasd, base, enemies, coins, background, projectiles;
let attackCooldown = 0;
let attackSpeed = 500;
let attackDamage = 20;
let shootCooldown = 0;
let shootRate = 250; // ms between shots
let projectileDamage = 30;
let projectileSpeed = 800;
let coinsCollected = 0;
let wave = 1;
let waveText, coinText, baseHPText, playerHPText;
let baseHP = 300;
let playerHP = 100;
let currentScene;
let gameStarted = false;
let menuContainer;

let game = new Phaser.Game(config);
// debug graphics removed

// ---------------- PRELOAD ----------------

function preload() {
    this.load.image("player", "assets/player.png");
    this.load.image("enemy", "assets/enemy.png");
    this.load.image("coin", "assets/coin.png");
    this.load.image("base", "assets/base.png");
}

// ---------------- CREATE ----------------

function create() {
    currentScene = this;


    // Background (cover whole playing area)
    background = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x2a2a3a).setOrigin(0).setDepth(-10);
    this.cameras.main.setBackgroundColor(0x2a2a3a);

    // Base (plassert i midten) - BOTTOM LAYER (visual only)
    base = this.add.image(this.scale.width/2, this.scale.height/2, "base");
    base.setOrigin(0.5, 0.5);
    const BASE_SCALE = 0.35;
    base.setScale(BASE_SCALE);
    base.setAlpha(1);
    base.setDepth(10);

    // Create a separate static physics zone to act as the hitbox for the base
    // This avoids tricky body offsets on the sprite itself.
    let bw = (base.displayWidth || base.width) * 0.6;
    let bh = (base.displayHeight || base.height) * 0.6;
    const baseHit = this.add.zone(base.x, base.y, bw, bh).setOrigin(0.5);
    this.physics.add.existing(baseHit, true);
    baseHit.body.setSize(bw, bh);
    baseHit.body.immovable = true;
    // store baseHit on the base object for later reference
    base.hitZone = baseHit;

    // Watchdog: if the base is removed or becomes invisible unexpectedly, log it for debugging
    setTimeout(() => {
        try {
            if (!base || !base.body || !base.active || base.visible === false) {
                console.warn('Base missing or inactive after 3s', { base });
            }
        } catch (e) {
            console.warn('Error checking base after 3s', e);
        }
    }, 3000);

    // Player - TOP LAYER
    player = this.physics.add.sprite(this.scale.width/2, this.scale.height - 150, "player");
    player.setScale(0.2);
    player.setOrigin(0.5, 0.5);
    player.setCollideWorldBounds(true);
    // Ensure player renders above the base
    player.setDepth(20);
    // Make player physics body a bit smaller and center it to match the sprite
    if (player.body) {
        const pw = (player.displayWidth || player.width) * 0.6;
        const ph = (player.displayHeight || player.height) * 0.6;
        player.body.setSize(pw, ph);
        // Center the body at the sprite's center position
        if (player.body.setCenter) {
            player.body.setCenter(player.displayWidth / 2, player.displayHeight / 2);
        }
        if (player.body.updateFromGameObject) player.body.updateFromGameObject();
    }

    // Create a simple bullet texture at runtime (small white circle)
    if (!this.textures.exists('bullet')) {
        const g = this.add.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1);
        g.fillCircle(5, 5, 5);
        g.generateTexture('bullet', 10, 10);
        g.destroy();
    }


    // Projectiles group
    projectiles = this.physics.add.group();

    // Shooting: use SPACE to shoot (rate-limited). Pointer/click removed to match testing controls.
    this.input.keyboard.on('keydown-SPACE', () => shootProjectile(this, this.input.activePointer));

    // Destroy projectiles on world bounds
    this.physics.world.on('worldbounds', (body) => {
        if (body && body.gameObject && body.gameObject.texture && body.gameObject.texture.key === 'bullet') {
            body.gameObject.destroy();
        }
    });

    // Keyboard input
    cursors = this.input.keyboard.createCursorKeys();
    wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Melee attack moved to 'E' key to avoid conflict with shooting on SPACE
    this.input.keyboard.on("keydown-E", () => attackEnemy(this));

    // Groups
    enemies = this.physics.add.group();
    coins = this.physics.add.group();

    // Collisions
    this.physics.add.collider(player, enemies, playerHit, null, this);
    this.physics.add.overlap(player, coins, collectCoin, null, this);
    // Use the base's hitZone for overlaps so the visual sprite doesn't need a physics body
    this.physics.add.overlap(enemies, base.hitZone, hitBase, null, this);
    this.physics.add.overlap(projectiles, enemies, projectileHitEnemy, null, this);

    // UI
    coinText = this.add.text(20, 20, "Coins: 0", { fontSize: "20px", fill: "#fff" });
    coinText.setDepth(100);
    waveText = this.add.text(20, 50, "Wave: 1", { fontSize: "20px", fill: "#fff" });
    waveText.setDepth(100);
    playerHPText = this.add.text(20, 80, "Player HP: 100", { fontSize: "20px", fill: "#00ff00" });
    playerHPText.setDepth(100);
    baseHPText = this.add.text(20, 110, "Base HP: 300", { fontSize: "20px", fill: "#ff4444" });
    baseHPText.setDepth(100);

    // Start menu: show overlay until player starts the game
    menuContainer = this.add.container(0,0).setDepth(200);
    const menuBg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.6).setOrigin(0);
    const title = this.add.text(this.scale.width/2, this.scale.height/2 - 80, "Base Defender", { fontSize: "48px", fill: "#fff" }).setOrigin(0.5);

    // Main menu buttons
    const startBtn = this.add.text(this.scale.width/2, this.scale.height/2 + 10, "Start Game", { fontSize: "28px", fill: "#0f0", backgroundColor: "#222" }).setOrigin(0.5).setPadding(10).setInteractive({ useHandCursor: true });
    const controlsBtn = this.add.text(this.scale.width/2, this.scale.height/2 + 70, "Controls", { fontSize: "28px", fill: "#0ff", backgroundColor: "#222" }).setOrigin(0.5).setPadding(10).setInteractive({ useHandCursor: true });
    const scoreboardBtn = this.add.text(this.scale.width/2, this.scale.height/2 + 130, "Scoreboard", { fontSize: "28px", fill: "#ff0", backgroundColor: "#222" }).setOrigin(0.5).setPadding(10).setInteractive({ useHandCursor: true });

    // Controls panel (hidden by default)
    const controlsPanel = this.add.container(0, 0).setVisible(false);
    const panelBg = this.add.rectangle(this.scale.width/2 - 260, this.scale.height/2 - 120, 520, 260, 0x111111, 0.95).setOrigin(0);
    const controlsTitle = this.add.text(this.scale.width/2, this.scale.height/2 - 80, "Controls", { fontSize: "36px", fill: "#fff" }).setOrigin(0.5);
    const controlsText = this.add.text(this.scale.width/2, this.scale.height/2 - 20,
        "Move: WASD or Arrow keys\nShoot: SPACE\nMelee: E\nStart: ENTER or click Start Game",
        { fontSize: "20px", fill: "#ddd", align: 'center' }
    ).setOrigin(0.5);
    const backBtn = this.add.text(this.scale.width/2, this.scale.height/2 + 80, "Back", { fontSize: "22px", fill: "#fff", backgroundColor: "#333" }).setOrigin(0.5).setPadding(8).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => {
        controlsPanel.setVisible(false);
        startBtn.setVisible(true);
        controlsBtn.setVisible(true);
    });
    controlsPanel.add([panelBg, controlsTitle, controlsText, backBtn]);

    // Scoreboard panel (hidden by default)
    const scoreboardPanel = this.add.container(0, 0).setVisible(false);
    const sbBg = this.add.rectangle(this.scale.width/2 - 260, this.scale.height/2 - 140, 520, 300, 0x0b0b0b, 0.95).setOrigin(0);
    const sbTitle = this.add.text(this.scale.width/2, this.scale.height/2 - 100, "Scoreboard", { fontSize: "36px", fill: "#fff" }).setOrigin(0.5);
    const scoresText = this.add.text(this.scale.width/2, this.scale.height/2 - 40, "Loading...", { fontSize: "20px", fill: "#ddd", align: 'center' }).setOrigin(0.5);
    const sbRefresh = this.add.text(this.scale.width/2 - 60, this.scale.height/2 + 100, "Refresh", { fontSize: "20px", fill: "#fff", backgroundColor: "#333" }).setOrigin(0.5).setPadding(8).setInteractive({ useHandCursor: true });
    const sbBack = this.add.text(this.scale.width/2 + 60, this.scale.height/2 + 100, "Back", { fontSize: "20px", fill: "#fff", backgroundColor: "#333" }).setOrigin(0.5).setPadding(8).setInteractive({ useHandCursor: true });
    sbBack.on('pointerdown', () => {
        scoreboardPanel.setVisible(false);
        startBtn.setVisible(true);
        controlsBtn.setVisible(true);
        scoreboardBtn.setVisible(true);
    });
    sbRefresh.on('pointerdown', () => loadScoreboard(this, scoresText));
    scoreboardPanel.add([sbBg, sbTitle, scoresText, sbRefresh, sbBack]);

    // Wire up main menu actions
    startBtn.on('pointerdown', () => startGame(this));
    this.input.keyboard.on('keydown-ENTER', () => startGame(this));
    controlsBtn.on('pointerdown', () => {
        // show controls and hide main buttons
        controlsPanel.setVisible(true);
        startBtn.setVisible(false);
        controlsBtn.setVisible(false);
        scoreboardBtn.setVisible(false);
    });

    scoreboardBtn.on('pointerdown', () => {
        // show scoreboard and hide main buttons
        scoreboardPanel.setVisible(true);
        startBtn.setVisible(false);
        controlsBtn.setVisible(false);
        scoreboardBtn.setVisible(false);
        loadScoreboard(this, scoresText);
    });

    menuContainer.add([menuBg, title, startBtn, controlsBtn, scoreboardBtn, controlsPanel, scoreboardPanel]);

    // Keep game responsive: when the window changes size, resize Phaser and sadareposition base/player
    // Disable page scroll while playing to avoid scroll-induced layout loops
    try { document.body.style.overflow = 'hidden'; } catch (e) {}

    let resizeTimer = null;
    const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        // avoid re-resizing to same size (prevents feedback loops)
        if (w === this.scale.width && h === this.scale.height) return;
        this.scale.resize(w, h);
        if (background) {
            background.setSize(this.scale.width, this.scale.height);
            background.setPosition(0, 0);
        }
        if (base) {
            base.setPosition(this.scale.width / 2, this.scale.height / 2);
            // recompute base hit zone size & position
            try {
                if (base.hitZone && base.hitZone.body) {
                    const bw = (base.displayWidth || base.width) * 0.6;
                    const bh = (base.displayHeight || base.height) * 0.6;
                    base.hitZone.setPosition(base.x, base.y);
                    base.hitZone.setSize(bw, bh);
                    base.hitZone.body.setSize(bw, bh);
                    base.hitZone.body.x = base.x - bw/2;
                    base.hitZone.body.y = base.y - bh/2;
                    // no debug rectangle
                }
            } catch (e) {}
        }
        if (player) {
            player.x = Phaser.Math.Clamp(player.x, 0, this.scale.width);
            player.y = Phaser.Math.Clamp(player.y, 0, this.scale.height);
            player.setCollideWorldBounds(true);
        }
    };

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 120);
    });
}

// ---------------- UPDATE ----------------

function update() {
    // Don't update gameplay until the player starts the game
    if (!gameStarted) return;

    // Player movement speed (increase for testing; revert when done)
    const speed = 400;

    player.setVelocity(0);

    // LEFT
    if (cursors.left.isDown || wasd.left.isDown) {
        player.setVelocityX(-speed);
    }
    // RIGHT
    if (cursors.right.isDown || wasd.right.isDown) {
        player.setVelocityX(speed);
    }
    // UP
    if (cursors.up.isDown || wasd.up.isDown) {
        player.setVelocityY(-speed);
    }
    // DOWN
    if (cursors.down.isDown || wasd.down.isDown) {
        player.setVelocityY(speed);
    }

    // Enemy movement toward base
    enemies.children.iterate(enemy => {
        if (enemy) {
            currentScene.physics.moveToObject(enemy, base, 60);
        }
    });
}

// ---------------- GAME LOGIC ----------------

function spawnWave(scene) {
    for (let i = 0; i < wave * 3; i++) {
        const x = Phaser.Math.Between(0, scene.scale.width);
        const y = -50; // spawner rett over skjermen
        const enemy = enemies.create(x, y, "enemy");
        enemy.setScale(0.10);
        // Ensure enemies render above the base
        enemy.setDepth(20);
        enemy.hp = 40 + wave * 10;
    }
}

function startGame(scene) {
    if (gameStarted) return;
    gameStarted = true;
    try { if (menuContainer) menuContainer.destroy(); } catch (e) {}
    spawnWave(scene);
}

function shootProjectile(scene, pointer) {
    if (Date.now() < shootCooldown) return;
    shootCooldown = Date.now() + shootRate;

    const targetX = pointer.worldX !== undefined ? pointer.worldX : pointer.x;
    const targetY = pointer.worldY !== undefined ? pointer.worldY : pointer.y;

    // Determine number of shots: double at 10 coins, then +1 shot every 5 additional coins
    let shots = 1;
    if (coinsCollected >= 10) {
        shots = 2 + Math.floor((coinsCollected - 10) / 5);
    }
    // cap shots to avoid excessive bullets
    shots = Math.min(shots, 8);

    const baseAngle = Phaser.Math.Angle.Between(player.x, player.y, targetX, targetY);
    const spacing = 0.14; // radians between bullets
    const start = -((shots - 1) * spacing) / 2;

    for (let i = 0; i < shots; i++) {
        const angle = baseAngle + start + i * spacing;

        const bullet = projectiles.create(player.x, player.y, 'bullet');
        if (!bullet) continue;
        bullet.setDepth(20);
        bullet.setScale(1);
        if (bullet.body) {
            bullet.body.setCircle(5);
            bullet.body.collideWorldBounds = true;
            bullet.body.onWorldBounds = true;
        }
        const vx = Math.cos(angle) * projectileSpeed;
        const vy = Math.sin(angle) * projectileSpeed;
        if (bullet.body) bullet.body.setVelocity(vx, vy);
    }
}

function projectileHitEnemy(bullet, enemy) {
    try {
        if (bullet && bullet.destroy) bullet.destroy();
        if (!enemy) return;
        enemy.hp -= projectileDamage;
        if (enemy.hp <= 0) {
            dropCoin(this, enemy.x, enemy.y);
            enemy.destroy();
            if (enemies.countActive() === 0) {
                wave++;
                waveText.setText("Wave: " + wave);
                spawnWave(this);
            }
        }
    } catch (e) {
        console.warn('Error in projectileHitEnemy', e);
    }
}

function attackEnemy(scene) {
    if (Date.now() < attackCooldown) return;

    attackCooldown = Date.now() + attackSpeed;

    enemies.children.iterate(enemy => {
        if (!enemy) return;

        const dist = Phaser.Math.Distance.Between(
            player.x, player.y,
            enemy.x, enemy.y
        );

        if (dist < 60) {
            enemy.hp -= attackDamage;
            if (enemy.hp <= 0) {
                dropCoin(scene, enemy.x, enemy.y);
                enemy.destroy();
            }
        }
    });

    if (enemies.countActive() === 0) {
        wave++;
        waveText.setText("Wave: " + wave);
        spawnWave(scene);
    }
}

function dropCoin(scene, x, y) {
    const coin = coins.create(x, y, "coin");
    // Make coins smaller (half of previous 0.1 -> 0.05) and place them where the enemy died
    coin.setScale(0.05);
    coin.setDepth(20);
    // Keep coin stationary at spawn point
    if (coin.body) {
        coin.body.setVelocity(0, 0);
        coin.body.allowGravity = false;
        coin.body.immovable = true;
    }
}

function collectCoin(player, coin) {
    if (!coin) return;
    if (coin.getData && coin.getData('collected')) return;
    if (coin.setData) coin.setData('collected', true);
    coinsCollected++;
    coinText.setText("Coins: " + coinsCollected);
    if (coin.body) coin.body.enable = false;
    coin.destroy();
}

function playerHit(player, enemy) {
    playerHP -= 5;
    playerHPText.setText("Player HP: " + playerHP);
    enemy.destroy();

    if (playerHP <= 0) {
        showGameOverPrompt(currentScene, { score: coinsCollected, wave: wave });
    }
}

function hitBase(objA, objB) {
    // Determine which object is the enemy and which is the base to avoid destroying the base by mistake
    let enemyObj = objA;
    let baseObj = objB;
    try {
        if (objA && objA.texture && objA.texture.key === 'base') {
            baseObj = objA;
            enemyObj = objB;
        }
        if (objB && objB.texture && objB.texture.key === 'base') {
            baseObj = objB;
            enemyObj = objA;
        }
    } catch (e) {
        // fallback: assume original ordering
        enemyObj = objA;
        baseObj = objB;
    }

    baseHP -= 10;
    baseHPText.setText("Base HP: " + baseHP);

    if (enemyObj && enemyObj !== baseObj && enemyObj.destroy) {
        enemyObj.destroy();
    }

    if (baseHP <= 0) {
        showGameOverPrompt(currentScene, { score: coinsCollected, wave: wave });
    }
}

// ---------------- SCOREBOARD ----------------

async function loadScoreboard(scene, textObj) {
    if (!textObj) return;
    textObj.setText('Loading...');

    // Helper: normalize an entry to { name, score, wave, date, source }
    const normalize = (s, source) => {
        if (!s) return null;
        if (Array.isArray(s)) {
            return { name: String(s[0] || 'Anon'), score: Number(s[1] || 0) || 0, wave: null, date: null, source };
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
    try {
        const res = await fetch('/scores');
        if (res && res.ok) {
            let data = await res.json();
            if (!Array.isArray(data)) {
                if (data && Array.isArray(data.scores)) data = data.scores;
                else data = [];
            }
            serverList = data.map(s => normalize(s, 'server')).filter(Boolean);
        }
    } catch (err) {
        console.warn('Failed to fetch server scores:', err);
        serverList = [];
    }

    // Load local scores saved when submit failed
    let localList = [];
    try {
        const key = 'base_defender_local_scores_v1';
        const raw = localStorage.getItem(key);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                localList = parsed.map(s => normalize(s, 'local')).filter(Boolean);
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

    const lines = combined.slice(0, 10).map((s, i) => {
        const wavePart = s.wave ? ` (W${s.wave})` : '';
        const src = s.source === 'local' && (!serverList.find(ss => ss.name === s.name && ss.score === s.score)) ? ' [local]' : '';
        return `${i+1}. ${s.name} — ${s.score}${wavePart}${src}`;
    });

    textObj.setText(lines.join('\n'));
}

// ---------------- GAME OVER / SUBMIT SCORE UI ----------------

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

    function cleanupAndReload() {
        try { document.body.removeChild(overlay); } catch (e) {}
        window.__gd_prompt_shown = false;
        location.reload();
    }

    skipBtn.addEventListener('click', () => {
        cleanupAndReload();
    });

    submitBtn.addEventListener('click', async () => {
        const name = (input.value || 'Anon').trim().substring(0, 32);
        status.innerText = 'Saving...';
        submitBtn.disabled = true;
        skipBtn.disabled = true;
        try {
            await submitScore({ name, score, wave: waves });
            status.innerText = 'Saved! Returning to menu...';
            setTimeout(cleanupAndReload, 900);
        } catch (e) {
            status.innerText = 'Failed to save remotely — saved locally.';
            setTimeout(cleanupAndReload, 900);
        }
    });

    input.addEventListener('keydown', (ev) => {
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
            existing.push({ name: payload.name, score: payload.score, wave: payload.wave, date: (new Date()).toISOString() });
            localStorage.setItem(key, JSON.stringify(existing));
        } catch (err) {
            console.warn('Failed to save locally', err);
        }
        throw e;
    }
}
