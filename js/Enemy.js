// Cache object to store rendered sprites
const SpriteCache = {};

export default class Enemy {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type; // 'bee', 'butterfly', 'boss', 'king'

        // King boss is larger
        if (type === 'king') {
            this.width = 48;
            this.height = 48;
            this.hp = 2000 + (game.level * 200); // Scale with level
            this.maxHp = this.hp;
            this.shootCooldown = Math.max(60, 120 - game.level * 2); // Faster shooting with levels
            this.points = 5000;
        } else {
            this.width = 16;
            this.height = 16;
            this.hp = type === 'boss' ? 2 : 1; // Bosses take 2 hits
            this.maxHp = this.hp;
            this.points = type === 'boss' ? 300 : (type === 'butterfly' ? 160 : 100);
        }

        // Elite chance (Red glowing enemies that drop items or give more points)
        this.isElite = Math.random() > 0.95; // 5% chance
        if (this.isElite && type !== 'king') {
            this.hp *= 2;
            this.points *= 3;
        }

        this.shootTimer = Math.random() * 200;
        this.markedForDeletion = false;

        // Animation state
        this.frame = 0;
        this.animationTimer = 0;
        this.hitTimer = 0; // Flash red when hit

        // Path / Movement state
        this.state = 'entrance'; // 'entrance', 'formation', 'dive', 'return'

        // Formation Target Position
        this.targetX = x;
        this.targetY = y;

        // Spawn logic
        this.originX = this.targetX + (Math.random() - 0.5) * 80;
        this.originY = -50 - Math.random() * 100;

        this.x = this.originX;
        this.y = this.originY;

        this.t = 0; // Curve parameter
        this.entranceOffset = Math.random();
        this.delay = 0;

        // Initialize Sprite Cache
        if (!SpriteCache[this.type]) {
            this.generateSpriteCache(this.type);
        }
    }

    generateSpriteCache(type) {
        // ... (Keep existing sprite data arrays or use new neon ones) ...
        // For brevity in this big file rewrite, I will assume the same sprites but 
        // I will apply a glow effect in the draw method instead of baking it here.
        // Let's copy the sprite arrays from previous file to ensure they exist.

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
            palette = { 1: '#0ff', 2: '#fff' }; // Cyan/White
        } else if (type === 'butterfly') {
            data = butterflySprite;
            palette = { 1: '#f0f', 2: '#ff0' }; // Magenta/Yellow
        } else if (type === 'boss') {
            data = bossSprite;
            palette = { 1: '#0f0', 2: '#f00', 3: '#fff' }; // Green/Red
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

        // Animation
        this.animationTimer++;
        if (this.animationTimer > 20) {
            this.animationTimer = 0;
            this.frame = !this.frame;
        }

        // Shooting
        this.shootTimer++;
        if (this.shootTimer > 200) {
            // Basic random fire
            if (Math.random() > 0.95 && this.y > 0 && this.y < this.game.height - 100) {
                this.shoot();
            }
            this.shootTimer = 0;
        }

        // King Boss Specific Logic
        if (this.type === 'king') {
            // Boss logic mostly handled in Game.js / patterns, 
            // but we can add specific boss movement or phases here if needed.
            // For now, it follows standard entrance/formation.
        }

        // Behavior State Machine
        if (this.state === 'entrance') {
            this.t += 0.015; // Speed
            if (this.t < 1.0) {
                // Bezier-like curve to target
                const cx = (this.originX + this.targetX) / 2 + Math.sin(this.t * Math.PI) * 50;
                this.x = (1 - this.t) * this.originX + this.t * this.targetX;
                this.y = (1 - this.t) * this.originY + this.t * this.targetY;
                this.x += Math.sin(this.t * 10) * 10; // Wiggle
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
                this.state = 'formation';
            }
        }
        else if (this.state === 'formation') {
            // Hover
            this.x = this.targetX + Math.sin(Date.now() / 300 + this.entranceOffset * 10) * 3;

            // Dive Chance
            const diveCh = 0.001 + (this.game.level * 0.0002);
            if (Math.random() < diveCh && this.type !== 'king') {
                this.state = 'dive';
            }
        }
        else if (this.state === 'dive') {
            this.y += 2 + (this.game.level * 0.2); // Dive Speed
            this.x += Math.sin(this.y / 20) * 2;

            if (this.y > this.game.height) {
                // Respawn at top for loop
                this.y = -20;
                this.x = Math.random() * (this.game.width - 20) + 10;
                this.state = 'entrance';
                this.originX = this.x;
                this.originY = -20;
                this.targetX = this.x; // Just fall back to where it spawns?
                // Actually better to return to formation
                this.t = 0;
            }
        }
    }

    shoot() {
        if (this.type === 'king') {
            // Triple shot
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

        // Hit Flash
        if (this.hitTimer > 0) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
            return;
        }

        const img = SpriteCache[this.type];
        if (img) {
            // Shadow / Glow
            if (this.isElite || this.type === 'king') {
                ctx.shadowColor = this.isElite ? '#f00' : '#ff0';
                ctx.shadowBlur = 10;
            }

            ctx.drawImage(img, Math.floor(this.x), Math.floor(this.y), this.width, this.height);
        } else {
            ctx.fillStyle = this.isElite ? '#f00' : '#0f0';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.restore();
    }
}
