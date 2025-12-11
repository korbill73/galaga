// Cache object to store rendered sprites
const SpriteCache = {};

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

        // Start offscreen from various positions (not just center)
        // Each enemy starts near its target X position for better distribution
        this.originX = this.targetX + (Math.random() - 0.5) * 40; // Random offset around target
        this.originY = -50 - Math.random() * 30; // Varying heights above screen

        this.x = this.originX;
        this.y = this.originY;

        // Entrance path variables
        this.t = 0;
        this.entranceOffset = Math.random() * 20; // Stagger

        // Spawn Delay
        this.delay = 0;

        // Initialize Sprite Cache if needed
        if (!SpriteCache[this.type]) {
            this.generateSpriteCache(this.type);
        }
    }

    generateSpriteCache(type) {
        // Define data locally
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

        let data = [];
        let palette = {};

        if (type === 'bee') {
            data = beeSprite;
            palette = { 1: '#00f', 2: '#ff0' };
        } else if (type === 'butterfly') {
            data = butterflySprite;
            palette = { 1: '#d00', 2: '#ff0' };
        } else if (type === 'boss') {
            data = bossSprite;
            palette = { 1: '#00f', 2: '#d00', 3: '#2d2' };
        }

        // Create offscreen canvas
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 16;
        const ctx = c.getContext('2d');

        // Draw pixel data to canvas
        for (let row = 0; row < data.length; row++) {
            for (let col = 0; col < data[row].length; col++) {
                const colorCode = data[row][col];
                if (colorCode !== 0) {
                    ctx.fillStyle = palette[colorCode];
                    ctx.fillRect(col, row, 1, 1);
                }
            }
        }

        // Save to cache
        SpriteCache[type] = c;
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
            // Loop entrance - SPEED TRIPLED (200% increase)
            this.t += 0.00315;

            if (this.t < 1.0) {
                // Slide down with loop - Descent speed reduced by 87.5% (very slow)
                this.x = this.originX + Math.sin(this.t * 10 + this.entranceOffset) * 40;
                this.y = this.originY + this.t * 25;
            } else {
                // Move to formation - SPEED TRIPLED
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                this.x += dx * 0.0135;
                this.y += dy * 0.0135;

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

            // Random dive logic - scales with level
            // Base 0.0005, increases by 20% per level or similar linear
            const diveChance = 0.0005 + (this.game.level * 0.0001);
            if (Math.random() < diveChance) {
                this.state = 'dive';
            }
        }
        else if (this.state === 'dive') {
            // Speed scales with level - SPEED TRIPLED (200% increase)
            const speed = 0.54 + (this.game.level * 0.0225);
            this.y += speed;
            this.x += Math.sin(this.y / 25) * 2.25;

            if (this.y > 300) {
                // Reset to new random position near target for variety
                this.originX = this.targetX + (Math.random() - 0.5) * 40;
                this.originY = -50 - Math.random() * 30;
                this.x = this.originX;
                this.y = this.originY;
                this.t = 0; // Reset entrance param
                this.state = 'entrance';
            }
        }
    }

    draw() {
        if (this.delay > 0) return; // Don't draw if waiting

        const ctx = this.game.ctx;

        // Use cached sprite
        const img = SpriteCache[this.type];
        if (img) {
            ctx.drawImage(img, Math.floor(this.x), Math.floor(this.y));
        } else {
            // Fallback
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, 16, 16);
        }
    }
}
