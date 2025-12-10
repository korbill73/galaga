export default class PowerUp {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;
        this.speed = 1.5;
        this.markedForDeletion = false;
        this.color = '#0f0'; // Green
        this.blinkTimer = 0;
    }

    update() {
        this.y += this.speed;
        if (this.y > this.game.height) {
            this.markedForDeletion = true;
        }
        this.blinkTimer++;
    }

    draw() {
        const ctx = this.game.ctx;
        if (Math.floor(this.blinkTimer / 10) % 2 === 0) {
            ctx.fillStyle = this.color;
        } else {
            ctx.fillStyle = '#fff';
        }

        // Draw a simple "P" or Box
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.fillText('P', this.x + 3, this.y + 10);
    }
}
