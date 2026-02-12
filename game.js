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

let player, cursors, wasd, base, enemies, coins, background;
let attackCooldown = 0;
let attackSpeed = 500;
let attackDamage = 20;
let coinsCollected = 0;
let wave = 1;
let waveText, coinText, baseHPText, playerHPText;
let baseHP = 300;
let playerHP = 100;
let currentScene;

let game = new Phaser.Game(config);

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

    // Base (plassert i midten) - BOTTOM LAYER
    base = this.physics.add.staticImage(this.scale.width/2, this.scale.height/2, "base");
    // Make the base a bit smaller visually
    const BASE_SCALE = 0.35;
    base.setScale(BASE_SCALE);
    base.setAlpha(1);
    // Ensure the base stays visible above other objects
    base.setDepth(10);
    // Make the physics body smaller than the sprite so enemies must hit the core
    if (base.body) {
        const bw = (base.displayWidth || base.width) * 0.6;
        const bh = (base.displayHeight || base.height) * 0.6;
        base.body.setSize(bw, bh);
        base.body.immovable = true;
    }

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
    player.setCollideWorldBounds(true);
    // Ensure player renders above the base
    player.setDepth(20);

    // Keyboard input
    cursors = this.input.keyboard.createCursorKeys();
    wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.input.keyboard.on("keydown-SPACE", () => attackEnemy(this));

    // Groups
    enemies = this.physics.add.group();
    coins = this.physics.add.group();

    // Collisions
    this.physics.add.collider(player, enemies, playerHit, null, this);
    this.physics.add.overlap(player, coins, collectCoin, null, this);
    this.physics.add.overlap(enemies, base, hitBase, null, this);

    // UI
    coinText = this.add.text(20, 20, "Coins: 0", { fontSize: "20px", fill: "#fff" });
    coinText.setDepth(100);
    waveText = this.add.text(20, 50, "Wave: 1", { fontSize: "20px", fill: "#fff" });
    waveText.setDepth(100);
    playerHPText = this.add.text(20, 80, "Player HP: 100", { fontSize: "20px", fill: "#00ff00" });
    playerHPText.setDepth(100);
    baseHPText = this.add.text(20, 110, "Base HP: 300", { fontSize: "20px", fill: "#ff4444" });
    baseHPText.setDepth(100);

    // Spawn first wave
    spawnWave(this);

    // Keep game responsive: when the window changes size, resize Phaser and reposition base/player
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
        if (base) base.setPosition(this.scale.width / 2, this.scale.height / 2);
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
    coin.setScale(0.5);
    // Coins should appear above the base
    coin.setDepth(20);
    coin.setVelocity(Phaser.Math.Between(-50, 50), -50);
}

function collectCoin(player, coin) {
    coinsCollected++;
    coinText.setText("Coins: " + coinsCollected);
    coin.destroy();
}

function playerHit(player, enemy) {
    playerHP -= 5;
    playerHPText.setText("Player HP: " + playerHP);
    enemy.destroy();

    if (playerHP <= 0) {
        alert("Du døde! Game over.");
        location.reload();
    }
}

function hitBase(enemy, base) {
    baseHP -= 10;
    baseHPText.setText("Base HP: " + baseHP);
    enemy.destroy();

    if (baseHP <= 0) {
        alert("Basen falt! Game over.");
        location.reload();
    }
}
