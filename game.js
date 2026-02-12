const config = {
    type: Phaser.AUTO,
    width: 1600,
    height: 1200,
    parent: "game",
    physics: {
        default: "arcade",
        arcade: { debug: false }
    },
    scene: { preload, create, update }
};

let player, cursors, wasd, base, enemies, coins;
let attackCooldown = 0;
let attackSpeed = 500;
let attackDamage = 20;
let coinsCollected = 0;
let wave = 1;
let waveText, coinText, baseHPText, playerHPText;
let baseHP = 300;
let playerHP = 100;
let currentScene;

new Phaser.Game(config);

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

    // Background
    this.cameras.main.setBackgroundColor(0x2a2a3a);

    // Base (plassert i midten) - BOTTOM LAYER
    base = this.physics.add.staticImage(config.width/2, config.height/2, "base");
    base.setScale(0.5);
    base.setAlpha(1);
    
    // Add physics body for collisions
    base.body.setSize(base.width, base.height);

    // Player - TOP LAYER
    player = this.physics.add.sprite(config.width/2, config.height - 150, "player");
    player.setScale(0.2);
    player.setCollideWorldBounds(true);

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
}

// ---------------- UPDATE ----------------

function update() {
    const speed = 200;

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
        const x = Phaser.Math.Between(0, config.width);
        const y = -50; // spawner rett over skjermen
        const enemy = enemies.create(x, y, "enemy");
        enemy.setScale(0.10);
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
