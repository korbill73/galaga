import Bullet from './Bullet.js';
import { GAME_WIDTH, GAME_HEIGHT } from './utils.js';

export default class Player {
    constructor(game) {
        this.game = game;
        this.width = 36;
        this.height = 36;
        this.resetPosition();

        this.speed = 8; // Faster (Doubled)
        this.maxBullets = 20; // Flood
        this.bullets = [];
        this.isDead = false;

        this.weaponType = 'default';
        this.weaponLevel = 1;

        // Load Image
        this.image = new Image();
        this.image.src = 'assets/player_ultimate.png';

        this.shootTimer = 0;

        // Timers
        this.shieldTimer = 0;
        this.weaponTimer = 0;

        // Nuclear
        this.nukesLeft = 3;
        this.nukeLaunched = false;
    }

    resetPosition() {
        this.x = GAME_WIDTH / 2 - this.width / 2;
        this.y = GAME_HEIGHT - 40;
    }

    update(input) {
        if (this.isDead) return;

        // Timers
        if (this.shieldTimer > 0) this.shieldTimer--;
        if (this.weaponTimer > 0) {
            this.weaponTimer--;
            if (this.weaponTimer <= 0) {
                this.weaponType = 'default';
                this.weaponLevel = 1;
            }
        }

        // Movement
        if (input.isDown('ArrowLeft')) {
            this.x -= this.speed;
        }
        if (input.isDown('ArrowRight')) {
            this.x += this.speed;
        }

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > GAME_WIDTH - this.width) this.x = GAME_WIDTH - this.width;

        // Shooting
        // Rapid fire logic (200ms -> ~5 frames @ 60fps)
        if (this.shootTimer > 0) this.shootTimer--;
        if (this.shootTimer <= 0) {
            this.shoot();
            this.shootTimer = 4; // 15 shots/sec
        }

        // Nuke
        if (input.isDown('KeyN') && this.nukesLeft > 0 && !this.nukeLaunched) {
            this.launchNuke();
            this.nukeLaunched = true;
        }
        if (!input.isDown('KeyN')) {
            this.nukeLaunched = false;
        }
    }

    upgradeWeapon(type) {
        if (type === 'shield') {
            this.shieldTimer = 300;
            return;
        }

        if (this.weaponType === type) {
            this.weaponLevel++;
        } else {
            this.weaponType = type;
            this.weaponLevel = 1;
        }
        if (this.weaponLevel > 3) this.weaponLevel = 3;
        this.weaponTimer = 900;
    }

    shoot() {
        if (this.game.soundManager) this.game.soundManager.play('shoot');

        const bulletX = this.x + this.width / 2 - 2;
        const bulletY = this.y;

        // Weapon Logic
        if (this.weaponType === 'spread') {
            this.game.bullets.push(new Bullet(this.game, bulletX, bulletY, false, 'default'));
            this.game.bullets.push(new Bullet(this.game, bulletX - 4, bulletY + 4, false, 'left-angled'));
            this.game.bullets.push(new Bullet(this.game, bulletX + 4, bulletY + 4, false, 'right-angled'));
        }
        else if (this.weaponType === 'missile') {
            this.game.bullets.push(new Bullet(this.game, bulletX + 2, bulletY, false, 'missile'));
            if (this.weaponLevel >= 2) {
                this.game.bullets.push(new Bullet(this.game, bulletX - 8, bulletY + 2, false, 'missile'));
                this.game.bullets.push(new Bullet(this.game, bulletX + 12, bulletY + 2, false, 'missile'));
            }
        }
        else if (this.weaponType === 'guided') {
            this.game.bullets.push(new Bullet(this.game, bulletX - 10, bulletY + 5, false, 'guided'));
            this.game.bullets.push(new Bullet(this.game, bulletX + 10, bulletY + 5, false, 'guided'));
            if (this.weaponLevel >= 2) {
                this.game.bullets.push(new Bullet(this.game, bulletX, bulletY, false, 'guided'));
            }
        }
        else {
            this.game.bullets.push(new Bullet(this.game, bulletX, bulletY, false, 'default'));
            if (this.weaponLevel >= 2) {
                this.game.bullets.push(new Bullet(this.game, bulletX - 6, bulletY, false, 'default'));
                this.game.bullets.push(new Bullet(this.game, bulletX + 6, bulletY, false, 'default'));
            }
            if (this.weaponLevel >= 3) {
                this.game.bullets.push(new Bullet(this.game, bulletX, bulletY - 5, false, 'default'));
            }
        }
    }

    launchNuke() {
        this.nukesLeft--;
        this.game.soundManager.play('explosion');
        this.game.nukeFlash = 60;

        this.game.enemies.forEach(enemy => {
            if (!enemy.markedForDeletion && enemy.delay <= 0) {
                if (enemy.type === 'king') {
                    enemy.hp -= 500;
                    if (enemy.hp <= 0) this.game.killEnemy(enemy);
                } else {
                    this.game.killEnemy(enemy);
                }
                this.createNukeExplosion(enemy.x, enemy.y);
            }
        });
        this.game.updateScoreUI();
    }

    createNukeExplosion(x, y) {
        if (!this.game.nukeExplosions) this.game.nukeExplosions = [];
        this.game.nukeExplosions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 40,
            alpha: 1,
            growing: true
        });
    }

    draw() {
        if (this.isDead) return;

        const ctx = this.game.ctx;
        if (this.image.complete) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            ctx.restore();
        } else {
            ctx.fillStyle = 'cyan';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        if (this.shieldTimer > 0) this.drawShield(ctx);
        this.drawNukeUI(ctx);
    }

    drawShield(ctx) {
        ctx.save();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radius = this.width / 1.5;
        const time = Date.now() / 1000;
        const hue = (time * 100) % 360;

        ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.8)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = `hsla(${hue}, 100%, 75%, 0.2)`;
        ctx.fill();
        ctx.restore();
    }

    drawNukeUI(ctx) {
        const nukeX = GAME_WIDTH - 50;
        const nukeY = GAME_HEIGHT - 20;

        if (this.nukesLeft > 0) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(nukeX, nukeY, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = '10px sans-serif';
            ctx.fillText(`x${this.nukesLeft}`, nukeX + 10, nukeY + 3);
        }
    }
}
