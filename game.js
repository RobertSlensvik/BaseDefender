// =============== GAME.JS ===============
// Main game file - handles Phaser config, game loop, and core gameplay

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: { preload, create, update }
};

// Global game variables
let player, cursors, wasd, base, enemies, coins, background, projectiles;
let playerEntity, baseEntity;
let enemyEntities = [];

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
let currentScene;
let gameStarted = false;
let gamePaused = false;
let menuContainer;
let pauseMenuContainer;

let game = new Phaser.Game(config);

// ============== PRELOAD ==============

function preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('enemy', 'assets/enemy.png');
    this.load.image('coin', 'assets/coin.png');
    this.load.image('base', 'assets/base.png');
    // Use provided bullet image if present (fallback generation remains)
    this.load.image('bullet', 'assets/bullet.png');
}

// ============== CREATE ==============

function create() {
    currentScene = this;

    // Background
    background = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x2a2a3a).setOrigin(0).setDepth(-10);
    this.cameras.main.setBackgroundColor(0x2a2a3a);

    // Create base entity
    baseEntity = new Base(this, this.scale.width / 2, this.scale.height / 2);
    base = baseEntity.sprite;

    // Create player entity
    playerEntity = new Player(this, this.scale.width / 2, this.scale.height - 150);
    player = playerEntity.sprite;

    // Create bullet texture at runtime
    if (!this.textures.exists('bullet')) {
        const g = this.add.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1);
        g.fillCircle(5, 5, 5);
        g.generateTexture('bullet', 10, 10);
        g.destroy();
    }

    // Projectiles group
    projectiles = this.physics.add.group();

    // Shooting: SPACE to shoot (rate-limited)
    this.input.keyboard.on('keydown-SPACE', () => shootProjectile(this, this.input.activePointer));

    // Destroy projectiles on world bounds
    this.physics.world.on('worldbounds', body => {
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

    // Melee attack on 'E' key
    this.input.keyboard.on('keydown-E', () => attackEnemy(this));

    // Pause menu on ESC key
    this.input.keyboard.on('keydown-ESC', () => {
        if (gameStarted && !gamePaused) {
            gamePaused = true;
            this.physics.pause();
            if (pauseMenuContainer) {
                pauseMenuContainer.setVisible(true);
            }
        } else if (gameStarted && gamePaused) {
            gamePaused = false;
            this.physics.resume();
            if (pauseMenuContainer) {
                pauseMenuContainer.setVisible(false);
            }
        }
    });

    // Groups
    enemies = this.physics.add.group();
    coins = this.physics.add.group();

    // Collisions
    this.physics.add.collider(player, enemies, playerHit, null, this);
    this.physics.add.overlap(player, coins, collectCoin, null, this);
    this.physics.add.overlap(enemies, baseEntity.hitZone, hitBase, null, this);
    this.physics.add.overlap(projectiles, enemies, projectileHitEnemy, null, this);

    // UI
    coinText = this.add.text(20, 20, 'Coins: 0', { fontSize: '20px', fill: '#fff' });
    coinText.setDepth(100);
    waveText = this.add.text(20, 50, 'Wave: 1', { fontSize: '20px', fill: '#fff' });
    waveText.setDepth(100);
    playerHPText = this.add.text(20, 80, 'Player HP: 100', { fontSize: '20px', fill: '#00ff00' });
    playerHPText.setDepth(100);
    baseHPText = this.add.text(20, 110, 'Base HP: 300', { fontSize: '20px', fill: '#ff4444' });
    baseHPText.setDepth(100);

    // Create menu UI
    menuContainer = createMenuUI(this);

    // Create pause menu UI (hidden by default)
    pauseMenuContainer = createPauseMenuUI(this);
    pauseMenuContainer.setVisible(false);

    // Handle window resize
    try {
        document.body.style.overflow = 'hidden';
    } catch (e) {}

    let resizeTimer = null;
    const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (w === this.scale.width && h === this.scale.height) return;
        this.scale.resize(w, h);
        if (background) {
            background.setSize(this.scale.width, this.scale.height);
            background.setPosition(0, 0);
        }
        if (baseEntity) {
            baseEntity.updatePosition(this.scale.width / 2, this.scale.height / 2);
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

// ============== UPDATE ==============

function update() {
    // Don't update gameplay until the player starts the game
    if (!gameStarted) return;

    // Don't update gameplay if the game is paused
    if (gamePaused) return;

    const speed = 400;

    player.setVelocity(0);

    // Movement controls
    if (cursors.left.isDown || wasd.left.isDown) {
        player.setVelocityX(-speed);
    }
    if (cursors.right.isDown || wasd.right.isDown) {
        player.setVelocityX(speed);
    }
    if (cursors.up.isDown || wasd.up.isDown) {
        player.setVelocityY(-speed);
    }
    if (cursors.down.isDown || wasd.down.isDown) {
        player.setVelocityY(speed);
    }

    // Enemy movement toward base
    enemies.children.iterate(enemy => {
        if (enemy) {
            currentScene.physics.moveToObject(enemy, baseEntity.sprite, 60);
        }
    });
}

// ============== GAME LOGIC ==============

function spawnWave(scene) {
    for (let i = 0; i < wave * 3; i++) {
        const x = Phaser.Math.Between(0, scene.scale.width);
        const y = -50;
        const enemy = enemies.create(x, y, 'enemy');
        enemy.setScale(0.1);
        enemy.setDepth(20);
        enemy.hp = 40 + wave * 10;
    }
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
        bullet.setScale(0.05);
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
    playerEntity.takeDamage(5);
    playerHPText.setText('Player HP: ' + playerEntity.hp);
    enemy.destroy();

    if (playerEntity.hp <= 0) {
        showGameOverPrompt(currentScene, { score: coinsCollected, wave: wave });
    }
}

function hitBase(objA, objB) {
    // Determine which object is the enemy and which is the base hit zone
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
        enemyObj = objA;
        baseObj = objB;
    }

    baseEntity.takeDamage(10);
    baseHPText.setText('Base HP: ' + baseEntity.hp);

    if (enemyObj && enemyObj !== baseObj && enemyObj.destroy) {
        enemyObj.destroy();
    }

    if (baseEntity.hp <= 0) {
        showGameOverPrompt(currentScene, { score: coinsCollected, wave: wave });
    }
}
