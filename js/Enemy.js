// Cache object to store rendered sprites
const SpriteCache = {};

export default class Enemy {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;

        // King boss is 3x larger
        if (type === 'king') {
            this.width = 48;
            this.height = 48;
            this.hp = 30; // Takes 30 hits to kill!
            this.maxHp = 30;
            this.shootTimer = 0;
            this.shootCooldown = 120; // Shoots every 2 seconds
        } else {
            this.width = 16;
            this.height = 16;
            this.hp = 1;
            this.maxHp = 1;
        }

        this.type = type; // 'bee', 'butterfly', 'boss', 'king'
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

        // King Boss (Gold/Red/Purple) - 3x larger with crown
        const kingSprite = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 0, 0],
            [0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0],
            [1, 1, 2, 2, 3, 3, 2, 2, 2, 3, 3, 2, 2, 1, 1],
            [1, 2, 2, 3, 3, 3, 3, 2, 3, 3, 3, 3, 2, 2, 1],
            [1, 2, 3, 3, 4, 4, 3, 3, 3, 4, 4, 3, 3, 2, 1],
            [1, 2, 3, 4, 4, 4, 4, 3, 4, 4, 4, 4, 3, 2, 1],
            [1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1],
            [1, 2, 2, 3, 4, 4, 4, 4, 4, 4, 4, 3, 2, 2, 1],
            [0, 1, 2, 2, 3, 3, 4, 4, 4, 3, 3, 2, 2, 1, 0],
            [0, 0, 1, 2, 2, 3, 3, 3, 3, 3, 2, 2, 1, 0, 0],
            [0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0]
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
        } else if (type === 'king') {
            data = kingSprite;
            palette = { 1: '#ff0', 2: '#f80', 3: '#f00', 4: '#d0d' }; // Gold, Orange, Red, Purple
        }

        // Create offscreen canvas
        const c = document.createElement('canvas');
        c.width = type === 'king' ? 48 : 16;
        c.height = type === 'king' ? 48 : 16;
        const ctx = c.getContext('2d');

        // Draw pixel data to canvas (king uses 3x pixels)
        const pixelSize = type === 'king' ? 3 : 1;
        for (let row = 0; row < data.length; row++) {
            for (let col = 0; col < data[row].length; col++) {
                const colorCode = data[row][col];
                if (colorCode !== 0) {
                    ctx.fillStyle = palette[colorCode];
                    ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
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

        // King boss shoots bullets
        if (this.type === 'king' && this.state === 'formation') {
            this.shootTimer++;
            if (this.shootTimer >= this.shootCooldown) {
                this.shootTimer = 0;
                // Create enemy bullet (handled by Game.js)
                const bulletX = this.x + this.width / 2;
                const bulletY = this.y + this.height;
                // Import Bullet dynamically
                import('./Bullet.js').then(module => {
                    const Bullet = module.default;
                    this.game.bullets.push(new Bullet(this.game, bulletX, bulletY, true, 'enemy'));
                });
                this.game.soundManager.play('shoot');
            }
        }

        if (this.state === 'entrance') {
            // Loop entrance - SPEED TRIPLED (200% increase)
            this.t += 0.00315;

            if (this.t < 1.0) {
                // Slide down with loop - 30% slower descent
                this.x = this.originX + Math.sin(this.t * 10 + this.entranceOffset) * 40;
                this.y = this.originY + this.t * 8.75;
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
                // Reset to center area instead of edges to prevent getting stuck
                const GAME_WIDTH = 224;
                const centerX = GAME_WIDTH / 2;
                // Spawn near center with random offset (±60 pixels from center)
                this.originX = centerX + (Math.random() - 0.5) * 120;
                // Clamp to safe bounds
                if (this.originX < 30) this.originX = 30;
                if (this.originX > GAME_WIDTH - 30) this.originX = GAME_WIDTH - 30;

                this.originY = -50 - Math.random() * 30;
                this.x = this.originX;
                this.y = this.originY;
                this.t = 0; // Reset entrance param
                this.state = 'entrance';
            }
        }

        // Keep enemies within screen bounds
        const GAME_WIDTH = 224;
        if (this.x < 0) this.x = 0;
        if (this.x > GAME_WIDTH - this.width) this.x = GAME_WIDTH - this.width;
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
