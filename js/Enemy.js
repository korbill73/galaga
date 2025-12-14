// Cache object to store rendered sprites
const SpriteCache = {};

export default class Enemy {
    constructor(game, x, y, type) {
        this.game = game;
        this.type = type; // 'bee', 'butterfly', 'boss', 'king'

        // Stats Scaling
        const level = game.level || 1;

        // Dimensions & Base Stats
        if (type === 'king') {
            this.width = 48;
            this.height = 48;
            this.hp = 1000 + (level * 500);
            this.maxHp = this.hp;
            this.shootCooldown = Math.max(30, 90 - level * 4);
            this.points = 5000 * level;
        } else {
            this.width = 16;
            this.height = 16;
            this.hp = type === 'boss' ? (2 + Math.floor(level / 5)) : 1;
            this.maxHp = this.hp;
            this.points = type === 'boss' ? 300 : (type === 'butterfly' ? 160 : 100);
        }

        // Elite Enemy Chance
        this.isElite = Math.random() < (0.05 + level * 0.01);
        if (this.isElite && type !== 'king') {
            this.hp *= 2;
            this.points *= 2;
            this.speedMult = 1.3;
        } else {
            this.speedMult = 1.0;
        }

        this.markedForDeletion = false;

        // Combat State
        this.shootTimer = Math.random() * 200;
        this.hitTimer = 0;

        // Animation
        this.frame = 0;
        this.animationTimer = 0;

        // Position & Movement
        this.state = 'entrance';
        this.targetX = x;
        this.targetY = y;

        // Spawn Entrance Logic
        this.originX = this.targetX + (Math.random() - 0.5) * 100;
        this.originY = -50 - Math.random() * 150;

        this.x = this.originX;
        this.y = this.originY;

        this.t = 0;
        this.entranceOffset = Math.random();
        this.delay = 0;

        // Ensure cache exists
        if (!SpriteCache[this.type]) {
            this.generateSpriteCache(this.type);
        }
    }

    generateSpriteCache(type) {
        // Bee (Yellow/White)
        const beeSprite = [
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
        const butterflySprite = [
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
        const bossSprite = [
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

        // King (Gold/Red/Purple)
        const kingSprite = [
            [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 0, 0, 0],
            [0, 0, 2, 2, 3, 3, 3, 1, 1, 1, 3, 3, 3, 2, 2, 0, 0],
            [0, 2, 2, 3, 4, 4, 4, 3, 3, 3, 4, 4, 4, 3, 2, 2, 0],
            [2, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 2],
            [2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 2],
            [2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 2],
            [2, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 2, 2],
            [0, 2, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 3, 3, 2, 2, 0],
            [0, 0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 0, 0],
            [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0]
        ];

        let data = [];
        let palette = {};

        if (type === 'bee') {
            data = beeSprite;
            palette = { 1: '#0ff', 2: '#fff' }; // Neon Cyan
        } else if (type === 'butterfly') {
            data = butterflySprite;
            palette = { 1: '#f0f', 2: '#ff0' }; // Neon Magenta
        } else if (type === 'boss') {
            data = bossSprite;
            palette = { 1: '#0f0', 2: '#f00', 3: '#fff' }; // Neon Green
        } else if (type === 'king') {
            data = kingSprite;
            palette = { 1: '#ffd700', 2: '#ff0000', 3: '#800080', 4: '#ffffff' };
        }

        const c = document.createElement('canvas');
        c.width = type === 'king' ? 34 : 16;
        c.height = type === 'king' ? 22 : 16;
        const ctx = c.getContext('2d');
        const pixelSize = type === 'king' ? 2 : 1;

        for (let row = 0; row < data.length; row++) {
            for (let col = 0; col < (data[row] ? data[row].length : 0); col++) {
                const colorCode = data[row][col];
                if (colorCode !== 0 && palette[colorCode]) {
                    ctx.fillStyle = palette[colorCode];
                    ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
                }
            }
        }
        SpriteCache[type] = c;
    }

    update() {
        if (this.delay > 0) {
            this.delay--;
            return;
        }

        if (this.hitTimer > 0) this.hitTimer--;

        // Animation Frame
        this.animationTimer++;
        if (this.animationTimer > 20) {
            this.animationTimer = 0;
            this.frame = !this.frame;
        }

        // Shooting Behavior
        this.shootTimer++;
        const fireThresh = Math.max(30, 250 - this.game.level * 15);
        if (this.shootTimer > fireThresh) {
            const shootChance = 0.05 + (this.game.level * 0.015);
            if (Math.random() < shootChance && this.y > 0 && this.y < this.game.height - 20) {
                this.shoot();
            }
            this.shootTimer = 0;
        }

        // Speed
        const levelSpeed = 1.0 + (this.game.level * 0.15);

        // --- State Machine ---
        if (this.state === 'entrance') {
            this.t += 0.015 * levelSpeed;
            if (this.t < 1.0) {
                this.x = (1 - this.t) * this.originX + this.t * this.targetX;
                this.y = (1 - this.t) * this.originY + this.t * this.targetY;
                this.x += Math.sin(this.t * 15) * 5;
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
                this.state = 'formation';
            }
        }
        else if (this.state === 'formation') {
            this.x = this.targetX + Math.sin(Date.now() / 300 + this.entranceOffset * 5) * 4;

            const diveCh = 0.002 + (this.game.level * 0.0008);
            if (Math.random() < diveCh && this.type !== 'king') {
                this.state = 'dive';
            }
        }
        else if (this.state === 'dive') {
            const diveSpeed = (2.5 + (this.game.level * 0.35)) * this.speedMult;
            this.y += diveSpeed;
            this.x += Math.sin(this.y / 20) * (3 * this.speedMult);

            // X Boundary Check for Dive (Clamp, don't wrap side-to-side)
            if (this.x < 0) {
                this.x = 0;
                // Bounce? or just clamp
            }
            if (this.x > this.game.width - this.width) {
                this.x = this.game.width - this.width;
            }

            // Loop Top (When going off bottom)
            if (this.y > this.game.height + 20) {
                this.y = -30;
                // Respawn at random x or center? User said "center"
                // "화면 외 가운데에서 빠르게 출현" -> slightly randomized center
                this.x = (this.game.width / 2) + (Math.random() * 100 - 50);
                this.state = 'dive';

                // Increase speed on re-entry?
                this.speedMult *= 1.1;
            }
        }
    }

    shoot() {
        if (this.type === 'king') {
            import('./Bullet.js').then(m => {
                const B = m.default;
                this.game.bullets.push(new B(this.game, this.x + this.width / 2, this.y + this.height, true));
                this.game.bullets.push(new B(this.game, this.x, this.y + this.height, true, 'left-angled'));
                this.game.bullets.push(new B(this.game, this.x + this.width, this.y + this.height, true, 'right-angled'));
            });
        } else {
            import('./Bullet.js').then(m => {
                this.game.bullets.push(new m.default(this.game, this.x + this.width / 2, this.y + this.height, true));
            });
        }
    }

    draw() {
        if (this.delay > 0) return;

        const ctx = this.game.ctx;
        ctx.save();

        if (this.hitTimer > 0) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
            return;
        }

        const img = SpriteCache[this.type];
        if (img) {
            if (this.isElite || this.type === 'king' || this.type === 'boss') {
                ctx.shadowColor = this.isElite ? '#ff0000' : (this.type === 'king' ? '#ffd700' : '#00ff00');
                ctx.shadowBlur = 10;
            }
            ctx.drawImage(img, Math.floor(this.x), Math.floor(this.y), this.width, this.height);
        } else {
            ctx.fillStyle = '#f00';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }
}
