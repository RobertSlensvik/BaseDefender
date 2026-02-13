// =============== ENTITIES.JS ===============
// Contains classes and factory functions for Player, Base, and Enemy

class Entity {
    constructor(scene, x, y, texture) {
        this.scene = scene;
        this.texture = texture;
        this.x = x;
        this.y = y;
        this.hp = 100;
        this.sprite = null;
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

class Player extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        this.maxHP = 100;
        this.hp = 100;
        this.speed = 800;
        this.create();
    }

    create() {
        this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'player');
        this.sprite.setScale(0.2);
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDepth(20);
        
        // Adjust physics body
        if (this.sprite.body) {
            const pw = (this.sprite.displayWidth || this.sprite.width) * 0.6;
            const ph = (this.sprite.displayHeight || this.sprite.height) * 0.6;
            this.sprite.body.setSize(pw, ph);
            if (this.sprite.body.setCenter) {
                this.sprite.body.setCenter(this.sprite.displayWidth / 2, this.sprite.displayHeight / 2);
            }
            if (this.sprite.body.updateFromGameObject) {
                this.sprite.body.updateFromGameObject();
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        return this.hp <= 0;
    }

    setVelocity(vx, vy) {
        if (this.sprite && this.sprite.body) {
            this.sprite.body.setVelocity(vx, vy);
        }
    }

    updatePosition() {
        if (this.sprite) {
            this.x = this.sprite.x;
            this.y = this.sprite.y;
        }
    }
}

class Base extends Entity {
    constructor(scene, x, y) {
        super(scene, x, y, 'base');
        this.maxHP = 300;
        this.hp = 300;
        this.hitZone = null;
        this.create();
    }

    create() {
        this.sprite = this.scene.add.image(this.x, this.y, 'base');
        this.sprite.setOrigin(0.5, 0.5);
        const BASE_SCALE = 0.35;
        this.sprite.setScale(BASE_SCALE);
        this.sprite.setAlpha(1);
        this.sprite.setDepth(10);

        // Add a static physics body directly to the base sprite and use it as the hit zone
        let bw = (this.sprite.displayWidth || this.sprite.width) * 0.6;
        let bh = (this.sprite.displayHeight || this.sprite.height) * 0.6;
        this.scene.physics.add.existing(this.sprite, true);
        if (this.sprite.body) {
            this.sprite.body.setSize(bw, bh);
            this.sprite.body.immovable = true;
        }
        // Use the sprite itself as the hitZone so overlaps target the visible base
        this.hitZone = this.sprite;

        // Watchdog to check if base is still valid
        setTimeout(() => {
            try {
                if (!this.sprite || !this.sprite.active || this.sprite.visible === false) {
                    console.warn('Base missing or inactive after 3s');
                }
            } catch (e) {
                console.warn('Error checking base after 3s', e);
            }
        }, 3000);
    }

    takeDamage(amount) {
        this.hp -= amount;
        return this.hp <= 0;
    }

    updatePosition(newX, newY) {
        if (this.sprite) {
            this.sprite.setPosition(newX, newY);
            this.x = newX;
            this.y = newY;

            // Update hitzone
            if (this.hitZone && this.hitZone.body) {
                const bw = (this.sprite.displayWidth || this.sprite.width) * 0.6;
                const bh = (this.sprite.displayHeight || this.sprite.height) * 0.6;
                // Update physics body size and ensure it's positioned around the sprite
                this.hitZone.body.setSize(bw, bh);
                if (this.hitZone.body.position) {
                    this.hitZone.body.x = this.sprite.x - bw / 2;
                    this.hitZone.body.y = this.sprite.y - bh / 2;
                }
            }
        }
    }
}

class Enemy extends Entity {
    constructor(scene, x, y, wave) {
        super(scene, x, y, 'enemy');
        this.wave = wave;
        this.hp = 40 + wave * 10;
        this.speed = 60;
        this.create();
    }

    create() {
        this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'enemy');
        this.sprite.setScale(0.10);
        this.sprite.setDepth(20);
    }

    takeDamage(amount) {
        this.hp -= amount;
        return this.hp <= 0;
    }

    moveToward(target) {
        if (this.sprite && target) {
            this.scene.physics.moveToObject(this.sprite, target, this.speed);
        }
    }
}

// Factory functions to simplify creation
function createPlayer(scene, x, y) {
    return new Player(scene, x, y);
}

function createBase(scene, x, y) {
    return new Base(scene, x, y);
}

function createEnemy(scene, x, y, wave) {
    return new Enemy(scene, x, y, wave);
}
