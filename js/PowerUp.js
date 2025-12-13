export default class PowerUp {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.type = type || 'spread';
        this.speed = 1.0;
        this.markedForDeletion = false;

        // Visual props
        this.t = 0;
        this.color = '#fff';

        if (type === 'spread') this.color = '#ffff00'; // Yellow
        else if (type === 'missile') this.color = '#ff0000'; // Red
        else if (type === 'guided') this.color = '#aa00ff'; // Purple
        else if (type === 'shield') this.color = '#00ffff'; // Cyan
        else if (type === 'life') this.color = '#ff00ff'; // Magenta
        else if (type === 'bonus') this.color = '#00ff00'; // Green
        else if (type === 'nuke') this.color = '#ff5500'; // Orange
    }

    update() {
        this.y += this.speed;
        this.t += 0.1;

        // Bobbing motion
        this.x += Math.sin(this.t) * 0.5;

        if (this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }

    draw() {
        const ctx = this.game.ctx;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Pulsing glow
        const scale = 1 + Math.sin(this.t * 2) * 0.1;
        ctx.scale(scale, scale);

        // Outer Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        // Draw shape based on type
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        if (this.type === 'shield' || this.type === 'life') {
            // Heart/Shield - Circle
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.type === 'shield' ? 'S' : '♥', 0, 0);

        } else if (this.type === 'nuke') {
            // Nuclear symbol approximation (Triangle)
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(7, 6);
            ctx.lineTo(-7, 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#000';
            ctx.fillText('N', -3, 3);

        } else {
            // Box default
            ctx.fillRect(-8, -8, 16, 16);
            ctx.strokeRect(-8, -8, 16, 16);

            // Icon letter
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let letter = 'P'; // Powerup
            if (this.type === 'missile') letter = 'M';
            if (this.type === 'guided') letter = 'G';
            if (this.type === 'spread') letter = 'W'; // Wide
            if (this.type === 'bonus') letter = '$';

            ctx.shadowBlur = 0; // Clear shadow for text clarity
            ctx.fillText(letter, 0, 1);
        }

        ctx.restore();
    }
}
