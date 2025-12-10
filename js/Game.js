import Player from './Player.js';
import InputHandler from './InputHandler.js';
import Enemy from './Enemy.js';
import PowerUp from './PowerUp.js';
import SoundManager from './SoundManager.js';
import { rectIntersect, GAME_WIDTH, GAME_HEIGHT } from './utils.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Internal Logical Size (Galaga Original Resolution)
        // We render to a small offscreen canvas or just scale everything?
        // Actually, let's keep logic in native coordinates (224x288) and use scale() on context.
        this.scale = this.width / GAME_WIDTH;
        this.ctx.scale(this.scale, this.scale);
        this.ctx.imageSmoothingEnabled = false;

        this.player = new Player(this);
        this.input = new InputHandler();
        this.soundManager = new SoundManager();
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = []; // For explosions

        this.score = 0;
        this.highScore = 20000; // Default high score

        this.state = 'MENU'; // MENU, PLAYING, GAMEOVER

        this.lastTime = 0;

        // Starfield
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * GAME_HEIGHT,
                speed: 0.5 + Math.random() * 2,
                color: Math.random() > 0.8 ? '#f00' : '#fff' // Some red stars like in Galaga
            });
        }
    }

    start() {
        this.setState('MENU');
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    setState(newState) {
        this.state = newState;
        const startScreen = document.getElementById('start-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const scoreDisplay = document.getElementById('score-display');
        const highScoreDisplay = document.getElementById('highscore-display');

        if (this.state === 'MENU') {
            startScreen.classList.remove('hidden');
            gameOverScreen.classList.add('hidden');
        } else if (this.state === 'PLAYING') {
            startScreen.classList.add('hidden');
            gameOverScreen.classList.add('hidden');
            this.resetGame();
        } else if (this.state === 'GAMEOVER') {
            gameOverScreen.classList.remove('hidden');
            // Check high score
            if (this.score > this.highScore) {
                this.highScore = this.score;
                highScoreDisplay.innerText = this.highScore;
            }
        }
    }

    resetGame() {
        this.score = 0;
        this.lives = 10; // Requested 10 lives
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.player = new Player(this);
        document.getElementById('score-display').innerText = this.score;
        this.updateLivesDisplay(); // Custom method needed or just reuse score board? 
        // Let's reuse '1UP' label or add new one? For now, we assume simple logic.
        this.spawnWave();
    }

    updateLivesDisplay() {
        // Find or create lives display
        // The original HTML had <div class="score-label">1UP</div>
        // Let's append lives to it or assume "1UP" means Player 1.
        // I'll console log for now or add a small text.
        // Actually, we can update the '1UP' text to 'LIVES: 10'
        const label = document.querySelector('.score-label');
        if (label) label.innerText = `LIVES: ${this.lives}`;
    }

    spawnWave() {
        // Simple Grid Formation
        // 4 Rows: 2 Bee, 1 Butterfly, 1 Boss (Top)
        const startX = 20;
        const startY = 40;
        const gapX = 20;
        const gapY = 20;

        let delayCounter = 0;
        const delayStep = 10; // Frames between each enemy launch

        const createEnemy = (x, y, type) => {
            const enemy = new Enemy(this, x, y, type);
            enemy.delay = delayCounter++ * delayStep;
            this.enemies.push(enemy);
        };

        // Boss Row (Top)
        for (let i = 0; i < 4; i++) {
            createEnemy(startX + 40 + i * gapX, startY, 'boss');
        }
        // Butterfly Row
        for (let i = 0; i < 8; i++) {
            createEnemy(startX + i * gapX, startY + gapY, 'butterfly');
        }
        // Bee Rows
        for (let row = 0; row < 2; row++) {
            for (let i = 0; i < 10; i++) {
                createEnemy(startX - 10 + i * gapX, startY + gapY * 2 + row * gapY, 'bee');
            }
        }
    }

    gameLoop(timeStamp) {
        const deltaTime = timeStamp - this.lastTime;
        this.lastTime = timeStamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        // Background Stars
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > GAME_HEIGHT) star.y = 0;
        });

        if (this.state === 'MENU') {
            if (this.input.isDown('Space')) {
                this.soundManager.play('menu_select');
                this.setState('PLAYING');
            }
            return;
        }

        if (this.state === 'GAMEOVER') {
            if (this.input.isDown('Enter') || this.input.isDown('Space')) {
                this.setState('MENU');
            }
            return;
        }

        // Gameplay Update
        this.player.update(this.input);

        // Bullets
        this.bullets.forEach((bullet, index) => {
            bullet.update();
            if (bullet.markedForDeletion) {
                this.bullets.splice(index, 1);
            }
        });

        // Enemies
        this.enemies.forEach((enemy, index) => {
            enemy.update();
            if (enemy.markedForDeletion) {
                this.enemies.splice(index, 1);
            }
        });

        // PowerUps
        this.powerUps.forEach((powerUp, index) => {
            powerUp.update();
            if (powerUp.markedForDeletion) {
                this.powerUps.splice(index, 1);
            }
        });

        if (this.enemies.length === 0) {
            setTimeout(() => this.spawnWave(), 1000); // Infinite waves
        }

        this.checkCollisions();
    }

    checkCollisions() {
        // Optimization: Filter bullets once
        const playerBullets = this.bullets.filter(b => !b.isEnemy);

        // Player Bullets hitting Enemies
        // O(N*M) loop here might be slow if 100x100.
        // Simple optimization: traditional for-loops are faster than forEach.
        for (let i = 0; i < playerBullets.length; i++) {
            const bullet = playerBullets[i];
            if (bullet.markedForDeletion) continue;

            const bulletRect = { left: bullet.x, right: bullet.x + bullet.width, top: bullet.y, bottom: bullet.y + bullet.height };

            for (let j = 0; j < this.enemies.length; j++) {
                const enemy = this.enemies[j];
                if (enemy.markedForDeletion || enemy.delay > 0) continue; // Don't hit invisible enemies

                const enemyRect = { left: enemy.x, right: enemy.x + enemy.width, top: enemy.y, bottom: enemy.y + enemy.height };

                if (rectIntersect(bulletRect, enemyRect)) {
                    enemy.markedForDeletion = true;
                    bullet.markedForDeletion = true;
                    this.score += 100;
                    document.getElementById('score-display').innerText = this.score;
                    this.soundManager.play('explosion');

                    // 20% chance to drop powerup
                    if (Math.random() < 0.2) {
                        const types = ['spread', 'missile', 'guided', 'bonus'];
                        const type = types[Math.floor(Math.random() * types.length)];
                        this.powerUps.push(new PowerUp(this, enemy.x, enemy.y, type));
                    }
                    break; // Bullet hit something, stop checking this bullet
                }
            }
        }

        // Player vs PowerUps
        for (let i = 0; i < this.powerUps.length; i++) {
            const powerUp = this.powerUps[i];
            const powerUpRect = { left: powerUp.x, right: powerUp.x + powerUp.width, top: powerUp.y, bottom: powerUp.y + powerUp.height };
            const playerRect = { left: this.player.x, right: this.player.x + this.player.width, top: this.player.y, bottom: this.player.y + this.player.height };

            if (rectIntersect(powerUpRect, playerRect)) {
                powerUp.markedForDeletion = true;
                this.soundManager.play('powerup');

                if (powerUp.type === 'bonus') {
                    this.score += 2000;
                } else {
                    this.player.upgradeWeapon(powerUp.type);
                    this.score += 500;
                }
                document.getElementById('score-display').innerText = this.score;
            }
        }

        // Enemy Collision (Body)
        if (!this.player.isDead) { // Don't check if already dead
            const playerRect = { left: this.player.x + 4, right: this.player.x + this.player.width - 4, top: this.player.y + 4, bottom: this.player.y + this.player.height - 4 };

            for (let i = 0; i < this.enemies.length; i++) {
                const enemy = this.enemies[i];
                if (enemy.delay > 0) continue;

                const enemyRect = { left: enemy.x + 2, right: enemy.x + enemy.width - 2, top: enemy.y + 2, bottom: enemy.y + enemy.height - 2 };
                if (rectIntersect(playerRect, enemyRect)) {
                    this.handlePlayerDeath();
                    break;
                }
            }
        }
    }

    handlePlayerDeath() {
        this.lives--;
        this.updateLivesDisplay();
        this.soundManager.play('explosion');

        if (this.lives <= 0) {
            this.player.isDead = true;
            this.setState('GAMEOVER');
        } else {
            // Respawn logic (temporary invincibility or just reset position?)
            // For now, let's reset wave or just player pos.
            // Reset player and clear enemies near spawn?
            // Simplest: Clear all bullets, reset player to center.
            this.bullets = [];
            this.player.x = GAME_WIDTH / 2 - this.player.width / 2;
            this.player.y = GAME_HEIGHT - 40;
            // Maybe flicker effect? (Not implemented yet)
        }
    }

    draw() {
        // Clear logic canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw Stars
        this.stars.forEach(star => {
            this.ctx.fillStyle = star.color;
            if (star.color === '#f00') this.ctx.globalAlpha = 0.5;
            this.ctx.fillRect(star.x, star.y, 1, 1);
            this.ctx.globalAlpha = 1.0;
        });

        if (this.state === 'PLAYING' || this.state === 'GAMEOVER') {
            this.player.draw();
            this.bullets.forEach(b => b.draw());
            this.enemies.forEach(e => e.draw());
            this.powerUps.forEach(p => p.draw());
        }
    }
}
