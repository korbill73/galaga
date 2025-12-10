import Sprite from './Sprite.js';
import Bullet from './Bullet.js';

export default class Enemy {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.type = type; // 'bee', 'butterfly', 'boss'
        this.markedForDeletion = false;

        // Animation state
        this.frame = 0;
        this.animationTimer = 0;

        // Path / Movement state
        this.state = 'entrance'; // 'entrance', 'formation', 'dive', 'return'

        // Formation Target Position
        this.targetX = x;
        this.targetY = y;

        // Start offscreen top-center
        this.originX = 112;
        this.originY = -50;

        this.x = this.originX;
        this.y = this.originY;

        // Entrance path variables
        this.t = 0;
        this.entranceOffset = Math.random() * 20; // Stagger

        // Spawn Delay
        this.delay = 0;

        this.defineSprites();
    }

    defineSprites() {
        // Bee (Yellow/White)
        this.beeSprite = [
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 2, 1, 1, 1, 2, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 0],
            [1, 1, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0]
        ];

        // Butterfly (Red/White)
        this.butterflySprite = [
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 2, 2, 1, 2, 2, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0],
            [0, 1, 1, 2, 2, 1, 2, 2, 2, 1, 2, 2, 1, 1, 0],
            [1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1],
            [1, 1, 1, 2, 2, 2, 1, 1, 1, 2, 2, 2, 1, 1, 1],
            [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
        ];

        // Boss (Green/Purple/White)
        this.bossSprite = [
            [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 2, 2, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 2, 3, 3, 2, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 3, 3, 3, 3, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 1, 1, 1, 1],
            [1, 1, 1, 1, 3, 3, 1, 3, 3, 1, 3, 3, 1, 1, 1],
            [1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 1],
            [1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 3, 1, 1, 3, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]
        ];
    }

    update() {
        // Handle spawn delay
        if (this.delay > 0) {
            this.delay--;
            return; // Stay invisible/inactive
        }

        this.animationTimer++;
        if (this.animationTimer > 30) {
            this.animationTimer = 0;
            this.frame = this.frame === 0 ? 1 : 0;
        }

        if (this.state === 'entrance') {
            // Loop entrance
            this.t += 0.015;

            if (this.t < 1.0) {
                // Slide down with loop
                this.x = this.originX + Math.sin(this.t * 10 + this.entranceOffset) * 40;
                this.y = this.originY + this.t * 200;
            } else {
                // Move to formation
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                this.x += dx * 0.05;
                this.y += dy * 0.05;

                if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                    this.x = this.targetX;
                    this.y = this.targetY;
                    this.state = 'formation';
                }
            }
        }
        else if (this.state === 'formation') {
            // Hover
            this.x = this.targetX + Math.sin(Date.now() / 400 + this.entranceOffset) * 2;

            // Random dive logic
            if (Math.random() < 0.0005) {
                this.state = 'dive';
            }
        }
        else if (this.state === 'dive') {
            this.y += 2.5;
            this.x += Math.sin(this.y / 25) * 4;

            if (this.y > 300) {
                this.y = this.originY; // Reset to top
                this.t = 0; // Reset entrance param
                this.state = 'entrance';
            }
        }
    }

    draw() {
        if (this.delay > 0) return; // Don't draw if waiting

        const ctx = this.game.ctx;
        let data = [];
        let palette = {};

        if (this.type === 'bee') {
            data = this.beeSprite;
            palette = { 1: '#00f', 2: '#ff0' };
        } else if (this.type === 'butterfly') {
            data = this.butterflySprite;
            palette = { 1: '#d00', 2: '#ff0' };
        } else if (this.type === 'boss') {
            data = this.bossSprite;
            palette = { 1: '#00f', 2: '#d00', 3: '#2d2' };
        }

        const pixelSize = 1;

        // Draw centered on x,y
        for (let row = 0; row < data.length; row++) {
            for (let col = 0; col < data[row].length; col++) {
                const colorCode = data[row][col];
                if (colorCode !== 0) {
                    ctx.fillStyle = palette[colorCode] || '#fff';
                    ctx.fillRect(Math.floor(this.x + col * pixelSize), Math.floor(this.y + row * pixelSize), pixelSize, pixelSize);
                }
            }
        }
    }
}
