export default class Bullet {
    constructor(game, x, y, isEnemy, type = 'default') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.isEnemy = isEnemy;
        this.type = type;

        this.speed = isEnemy ? 8 : 20; // 3x speed boost
        this.vx = 0;
        this.vy = isEnemy ? this.speed : -this.speed;
        this.rotation = 0;

        // Visual properties
        this.color = isEnemy ? '#ff0055' : '#00f7ff';
        this.trail = [];

        if (type === 'missile') {
            this.width = 6;
            this.height = 14;
            this.pierce = 3;
            this.color = '#ffaa00';
            this.speed = 10;
            this.vy = -this.speed;
        } else if (type === 'guided') {
            this.width = 6;
            this.height = 6;
            this.speed = 5;
            this.color = '#aa00ff';
        }

        // Angle logic
        if (type === 'left-angled') {
            this.vx = -2;
            this.rotation = -0.3;
        } else if (type === 'right-angled') {
            this.vx = 2;
            this.rotation = 0.3;
        }

        this.markedForDeletion = false;
        this.pierce = 1;
    }

    update() {
        if (this.type === 'guided' && !this.isEnemy) {
            const target = this.findNearestEnemy();
            if (target) {
                const dx = (target.x + target.width / 2) - this.x;
                const dy = (target.y + target.height / 2) - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.vx += (dx / dist) * 0.5; // Steer
                    this.vy += (dy / dist) * 0.5;
                    // Cap speed
                    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    if (currentSpeed > this.speed) {
                        this.vx = (this.vx / currentSpeed) * this.speed;
                        this.vy = (this.vy / currentSpeed) * this.speed;
                    }
                    this.rotation = Math.atan2(this.vy, this.vx) + Math.PI / 2;
                }
            }
        }

        this.x += this.vx;
        this.y += this.vy;

        // Trail effect
        if (this.game.frame % 2 === 0) { // Optimization
            this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
        }

        // Trail decay
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].alpha -= 0.2;
            if (this.trail[i].alpha <= 0) {
                this.trail.splice(i, 1);
            }
        }

        if (this.y < -50 || this.y > this.game.height + 50 ||
            this.x < -50 || this.x > this.game.width + 50) {
            this.markedForDeletion = true;
        }
    }

    findNearestEnemy() {
        let nearest = null;
        let minDist = 300; // Search radius
        for (const e of this.game.enemies) {
            if (e.delay > 0 || e.markedForDeletion) continue;
            const d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < minDist) {
                minDist = d;
                nearest = e;
            }
        }
        return nearest;
    }

    draw() {
        const ctx = this.game.ctx;

        // Draw Trail
        ctx.save();
        ctx.globalCompositeOperation = 'lighter'; // Additive blending for neon look
        this.trail.forEach(t => {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = t.alpha * 0.5;
            ctx.fillRect(t.x, t.y, this.width, this.height / 2);
        });
        ctx.restore();

        // Draw Bullet
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fff'; // Core is white
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Outer Glow
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-this.width / 2 - 2, -this.height / 2 - 2, this.width + 4, this.height + 4);

        ctx.restore();
    }
}
