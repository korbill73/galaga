import Sprite from './Sprite.js';
import Bullet from './Bullet.js';
import { GAME_WIDTH, GAME_HEIGHT } from './utils.js';

export default class Player {
    constructor(game) {
        this.game = game;
        this.width = 16;
        this.height = 16;
        this.x = GAME_WIDTH / 2 - this.width / 2;
        this.y = GAME_HEIGHT - 30;
        this.speed = 2;
        this.maxBullets = 2;
        this.bullets = [];
        this.isDead = false;

        // Galaga Ship Sprite (Simplified 15x16 approx)
        // 1 = White, 2 = Red, 0 = Empty
        const red = '#d00';
        const white = '#ededed';
        const blue = '#00f';

        this.sprite = new Sprite({
            ctx: game.ctx,
            pixelSize: 1, // We will scale it up in draw
            data: [
                [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 2, 2, 2, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 2, 2, 2, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 1, 2, 2, 2, 1, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 1, 0, 0],
                [0, 1, 1, 2, 2, 1, 2, 2, 2, 1, 2, 2, 1, 1, 0],
                [1, 1, 2, 2, 2, 1, 1, 2, 1, 1, 2, 2, 2, 1, 1],
                [1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1],
                [1, 2, 2, 2, 2, 1, 1, 0, 1, 1, 2, 2, 2, 2, 1],
                [1, 2, 2, 2, 2, 1, 0, 0, 0, 1, 2, 2, 2, 2, 1],
                [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0]
            ]
        });

        this.shootTimer = 0;
    }

    update(input) {
        if (this.isDead) return;

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
        // Only allow shooting if we have less than max bullets alive
        const activeBullets = this.game.bullets.filter(b => !b.isEnemy).length;
        if (input.isDown('Space') && activeBullets < this.maxBullets && this.shootTimer <= 0) {
            this.shoot();
            this.shootTimer = 20; // Cooldown
        }

        if (this.shootTimer > 0) this.shootTimer--;
    }

    shoot() {
        // Spawn bullet at center top of ship
        const bulletX = this.x + this.width / 2 - 1;
        const bulletY = this.y;
        this.game.bullets.push(new Bullet(this.game, bulletX, bulletY, false));
    }

    draw() {
        if (this.isDead) return;
        // The sprite data is 15x15.
        // We want to render it at this.x, this.y with appropriate colors.
        // The sprite class handles simple rendering, but our sprite has color codes (1, 2)
        // Sprite.js was simple. Let's customize drawing here a bit or update Sprite.js
        // Actually, Sprite.js takes a "color" but our data has codes.
        // Let's manually draw for now to handle multi-color properly, or update Sprite logic later.
        // For now, I'll iterate the data here or pass a color map.

        const palette = {
            1: '#ededed', // White
            2: '#d00',    // Red
            3: '#00f'     // Blue
        };

        const ctx = this.game.ctx;
        const data = this.sprite.data;
        const pixelSize = 1; // logical pixel size

        for (let row = 0; row < data.length; row++) {
            for (let col = 0; col < data[row].length; col++) {
                const colorCode = data[row][col];
                if (colorCode !== 0) {
                    ctx.fillStyle = palette[colorCode];
                    ctx.fillRect(Math.floor(this.x + col * pixelSize), Math.floor(this.y + row * pixelSize), pixelSize, pixelSize);
                }
            }
        }
    }
}
