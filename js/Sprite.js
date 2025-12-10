export default class Sprite {
    constructor(config) {
        this.ctx = config.ctx;
        this.pixelSize = config.pixelSize || 2; // Size of one "pixel" in canvas units
        this.color = config.color || '#fff';
        this.data = config.data || []; // 2D array of O (empty) and 1 (filled) or other color codes
    }

    draw(x, y, colorOverride = null) {
        this.ctx.fillStyle = colorOverride || this.color;

        for (let row = 0; row < this.data.length; row++) {
            for (let col = 0; col < this.data[row].length; col++) {
                if (this.data[row][col] !== 0) {
                    this.ctx.fillRect(
                        x + col * this.pixelSize,
                        y + row * this.pixelSize,
                        this.pixelSize,
                        this.pixelSize
                    );
                }
            }
        }
    }
}
