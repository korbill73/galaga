export default class Bullet {
    constructor(game, x, y, isEnemy, type = 'default') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 3;
        this.height = 6;
        this.isEnemy = isEnemy;
        this.type = type;

        this.speed = isEnemy ? 2 : 8; // Base speed
        if (type === 'guided') this.speed = 5;

        // Missile: Large, Piercing, Fast
        this.pierce = 1;
        if (type === 'missile') {
            this.width = 6;
            this.height = 12;
            this.pierce = 999; // Super penetrating (effectively infinite or just very high)
        }

        this.vx = 0;
        this.vy = isEnemy ? this.speed : -this.speed;

        // Handle types for initial velocity
        if (type === 'left-angled') {
            this.vx = -2;
            this.vy = -6;
        } else if (type === 'right-angled') {
            this.vx = 2;
            this.vy = -6;
        } else if (type === 'left-angled-wide') {
            this.vx = -4;
            this.vy = -5;
        } else if (type === 'right-angled-wide') {
            this.vx = 4;
            this.vy = -5;
        }

        this.markedForDeletion = false;

        // Colors
        this.color = '#0ff';
        if (isEnemy) this.color = '#ff0';
        if (type === 'missile') this.color = '#f00';
        if (type === 'guided') this.color = '#d0f';

        this.angle = 0; // For guided rotation visual
    }

    update() {
        // Guided Logic
        if (!this.isEnemy && this.type === 'guided') {
            const target = this.findNearestEnemy();
            if (target) {
                // Move towards target
                const dx = (target.x + target.width / 2) - this.x;
                const dy = (target.y + target.height / 2) - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                    this.vx = (dx / dist) * this.speed;
                    this.vy = (dy / dist) * this.speed;
                }
            }
        }

        // Missile Logic (Accelerate)
        // Optimization: Removed acceleration to keep speed constant and fast as requested
        /*
        if (!this.isEnemy && this.type === 'missile') {
             this.speed += 0.2;
             this.vy = -this.speed;
        }
        */

        this.x += this.vx;
        this.y += this.vy;

        if (this.y < -50 || this.y > this.game.height + 50 || this.x < -50 || this.x > this.game.width + 50) {
            this.markedForDeletion = true;
        }
    }

    findNearestEnemy() {
        let nearest = null;
        let minDist = Infinity;
        this.game.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });
        return nearest;
    }

    draw() {
        const ctx = this.game.ctx;
        ctx.fillStyle = this.color;

        if (this.type === 'missile') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fill();
            // Trail
            ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
            ctx.fillRect(this.x - 1, this.y + 4, 2, 6);
        } else if (this.type === 'guided') {
            ctx.save();
            ctx.translate(this.x, this.y);
            // Draw a diamond shape
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(3, 0);
            ctx.lineTo(0, 5);
            ctx.lineTo(-3, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else {
            // Standard
            ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.width, this.height);
        }
    }
}
