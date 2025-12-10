export default class Bullet {
    constructor(game, x, y, isEnemy) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 2;
        this.height = 4;
        this.isEnemy = isEnemy;
        this.speed = isEnemy ? 2 : 4;
        this.markedForDeletion = false;
        this.color = isEnemy ? '#ff0' : '#0ff'; // Yellow for enemy, Cyan for player
    }

    update() {
        if (this.isEnemy) {
            this.y += this.speed;
        } else {
            this.y -= this.speed;
        }

        if (this.y < 0 || this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }

    draw() {
        this.game.ctx.fillStyle = this.color;
        this.game.ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.width, this.height);
    }
}
