export default class PowerUp {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 24; // Bigger for icons
        this.height = 24;
        this.type = type || 'spread'; // Default
        this.speed = 1.5;
        this.markedForDeletion = false;

        this.image = new Image();
        if (this.type === 'missile') {
            this.image.src = 'assets/item_missile.png';
        } else if (this.type === 'guided') {
            this.image.src = 'assets/item_guided.png';
        } else if (this.type === 'spread') {
            this.image.src = 'assets/item_spread.png';
        } else if (this.type === 'bonus') {
            this.image.src = 'assets/item_bonus.png';
        } else {
            this.image.src = 'assets/item_spread.png'; // Fallback
        }

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

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Draw placeholder
            ctx.fillStyle = '#f0f';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#fff';
            ctx.fillText(this.type[0].toUpperCase(), this.x + 5, this.y + 15);
        }
        ctx.restore();
    }
}
