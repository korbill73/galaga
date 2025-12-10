import Sprite from './Sprite.js';
import Bullet from './Bullet.js';
import { GAME_WIDTH, GAME_HEIGHT } from './utils.js';

export default class Player {
    constructor(game) {
        this.game = game;
        this.width = 36; // Increased size for detailed graphic
        this.height = 36;
        this.x = GAME_WIDTH / 2 - this.width / 2;
        this.y = GAME_HEIGHT - 40;
        this.speed = 3; // Slightly faster movement
        this.maxBullets = 10; // More bullets for faster fire rate
        this.bullets = [];
        this.isDead = false;

        this.weaponType = 'default'; // default, spread, missile, guided
        this.weaponLevel = 1;

        // Load Image
        this.image = new Image();
        this.image.src = 'assets/player.png';

        this.shootTimer = 0;

        // PowerUp Timers (10 seconds = 600 frames at 60fps)
        this.shieldTimer = 0;
        this.weaponTimer = 0;
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

        if (input.isDown('Space') && this.shootTimer <= 0) {
            this.shoot();
            // Fire rate
            // Default fast rate
            this.shootTimer = 4; // Very fast for all weapons including missile
        }

        if (this.shootTimer > 0) this.shootTimer--;
    }

    upgradeWeapon(type) {
        if (type === 'shield') {
            this.shieldTimer = 600; // 10 seconds
            return;
        }

        if (this.weaponType === type) {
            this.weaponLevel++;
        } else {
            this.weaponType = type;
            this.weaponLevel = 1;
        }
        if (this.weaponLevel > 3) this.weaponLevel = 3;

        // Reset timer for weapon
        this.weaponTimer = 600; // 10 seconds
    }

    shoot() {
        this.game.soundManager.play('shoot');

        const bulletX = this.x + this.width / 2 - 2; // Center
        const bulletY = this.y;

        // Spread logic
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
            // Default
            this.game.bullets.push(new Bullet(this.game, bulletX, bulletY, false, 'default'));
            if (this.weaponLevel >= 2) { // Double
                this.game.bullets.push(new Bullet(this.game, bulletX - 6, bulletY, false, 'default'));
                this.game.bullets.push(new Bullet(this.game, bulletX + 6, bulletY, false, 'default'));
            }
            if (this.weaponLevel >= 3) { // Triple
                this.game.bullets.push(new Bullet(this.game, bulletX, bulletY - 5, false, 'default'));
            }
        }
    }

    draw() {
        if (this.isDead) return;

        const ctx = this.game.ctx;
        if (this.image.complete) {
            ctx.save();
            // Use screen blend mode to make black background transparent-ish
            ctx.globalCompositeOperation = 'screen';
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            ctx.restore();
        } else {
            // Fallback
            ctx.fillStyle = 'cyan';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x + 16, this.y, 4, 4);
        }

        // Draw Shield
        if (this.shieldTimer > 0) {
            ctx.save();
            ctx.strokeStyle = `rgba(0, 200, 255, ${0.5 + Math.sin(Date.now() / 100) * 0.2})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 1.5, 0, Math.PI * 2);
            ctx.stroke();

            // Text to show time? Optional.
            // ctx.fillStyle = 'white';
            // ctx.fillText(Math.ceil(this.shieldTimer/60), this.x, this.y - 10);
            ctx.restore();
        }
    }
}
