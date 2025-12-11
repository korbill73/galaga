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
        this.level = 0; // Reset level, spawnWave will inc to 1
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
        this.level++; // Increment level

        // Update "Lives" label to show Level as well, or just log it
        const label = document.querySelector('.score-label');
        if (label) {
            label.innerHTML = `LIVES: ${this.lives}<br>LEVEL: ${this.level}`;
        }

        // Difficulty Multiplier
        const difficulty = 1 + (this.level * 0.1);

        // Check if this is a BOSS LEVEL (every 10 levels)
        const isBossLevel = (this.level % 10 === 0);

        const startX = 20;
        const startY = 40;
        const gapX = 20;
        const gapY = 20;

        let delayCounter = 0;
        const delayStep = Math.max(5, 10 - this.level); // Faster entrance as levels go up

        const createEnemy = (x, y, type) => {
            // Keep within bounds
            if (x < 10) x = 10;
            if (x > GAME_WIDTH - 26) x = GAME_WIDTH - 26;

            const enemy = new Enemy(this, x, y, type);
            enemy.delay = delayCounter++ * delayStep;

            this.enemies.push(enemy);
        };

        // SPECIAL BOSS WAVE every 10 levels
        if (isBossLevel) {
            const centerX = GAME_WIDTH / 2;
            const centerY = 80;

            // Create a KING BOSS formation
            // Large boss circle with escorts
            const bossCount = 8;
            const radius = 50;
            for (let i = 0; i < bossCount; i++) {
                const angle = (i / bossCount) * Math.PI * 2;
                const bx = centerX + Math.cos(angle) * radius;
                const by = centerY + Math.sin(angle) * radius * 0.7;
                createEnemy(bx, by, 'boss');
            }

            // Inner circle of butterflies
            const butterflyCount = 6;
            const innerRadius = 30;
            for (let i = 0; i < butterflyCount; i++) {
                const angle = (i / butterflyCount) * Math.PI * 2;
                const bx = centerX + Math.cos(angle) * innerRadius;
                const by = centerY + Math.sin(angle) * innerRadius * 0.7;
                createEnemy(bx, by, 'butterfly');
            }

            // Add extra escorts based on level
            const extraCount = Math.min(Math.floor(this.level / 10), 4);
            for (let i = 0; i < extraCount; i++) {
                createEnemy(centerX - 60 - i * 15, centerY + 30, 'butterfly');
                createEnemy(centerX + 60 + i * 15, centerY + 30, 'butterfly');
            }

            return; // Skip normal patterns for boss level
        }

        // Calculate enemy count based on level (gradual increase)
        // Start with fewer enemies, increase gradually
        const baseMultiplier = Math.min(1 + (this.level - 1) * 0.15, 2.5); // Cap at 2.5x

        // Pattern Selection
        const patterns = ['grid', 'circle', 'v-shape', 'staggered'];
        const pattern = patterns[(this.level - 1) % patterns.length];

        if (pattern === 'grid') {
            // Classic Grid - Progressive scaling
            // Level 1: 2 boss, 4 butterfly, 2x4 bee
            // Level 5+: 3 boss, 6 butterfly, 2x7 bee
            const bossCount = Math.min(2 + Math.floor(this.level / 3), 4);
            const butterflyCount = Math.min(4 + Math.floor(this.level / 2), 8);
            const beePerRow = Math.min(4 + Math.floor(this.level / 2), 8);

            for (let i = 0; i < bossCount; i++) createEnemy(startX + 40 + i * gapX, startY, 'boss');
            for (let i = 0; i < butterflyCount; i++) createEnemy(startX + i * gapX + 20, startY + gapY, 'butterfly');
            for (let row = 0; row < 2; row++) {
                for (let i = 0; i < beePerRow; i++) createEnemy(startX + 10 + i * gapX, startY + gapY * 2 + row * gapY, 'bee');
            }
        }
        else if (pattern === 'circle') {
            const centerX = GAME_WIDTH / 2;
            const centerY = 100;
            const radius = 60;
            // Start with 10, gradually increase
            const count = Math.min(10 + Math.floor(this.level * 1.2), 22);

            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const ex = centerX + Math.cos(angle) * radius;
                const ey = centerY + Math.sin(angle) * radius * 0.8; // Ellipse
                const type = i % 5 === 0 ? 'boss' : (i % 2 === 0 ? 'butterfly' : 'bee');
                createEnemy(ex, ey, type);
            }
        }
        else if (pattern === 'v-shape') {
            const centerX = GAME_WIDTH / 2;
            // Start with 3 rows, increase gradually
            const rows = Math.min(3 + Math.floor(this.level / 2), 7);

            for (let r = 0; r < rows; r++) {
                // Left wing
                createEnemy(centerX - r * 15, startY + r * 15, r === 0 ? 'boss' : 'bee');
                // Right wing
                if (r > 0) createEnemy(centerX + r * 15, startY + r * 15, 'bee');
            }
            // Inner logic
            for (let r = 1; r < rows - 1; r++) {
                createEnemy(centerX - r * 15 + 10, startY + r * 15 + 10, 'butterfly');
                createEnemy(centerX + r * 15 - 10, startY + r * 15 + 10, 'butterfly');
            }
        }
        else if (pattern === 'staggered') {
            // Start smaller, scale up
            const rows = Math.min(3 + Math.floor(this.level / 3), 5);
            const cols = Math.min(4 + Math.floor(this.level / 2), 7);
            for (let r = 0; r < rows; r++) {
                const offset = (r % 2) * 15;
                for (let c = 0; c < cols; c++) {
                    createEnemy(30 + c * 25 + offset, 40 + r * 20, r === 0 ? 'boss' : 'bee');
                }
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

                    // Piercing Logic
                    if (bullet.pierce) {
                        bullet.pierce--;
                        if (bullet.pierce <= 0) bullet.markedForDeletion = true;
                    } else {
                        bullet.pierce = 0; // Default safety
                        bullet.markedForDeletion = true;
                    }

                    this.score += 100;
                    document.getElementById('score-display').innerText = this.score;
                    this.soundManager.play('explosion');

                    // 20% -> 14% -> 10% -> 7% chance to drop powerup (Further reduced for better balance)
                    if (Math.random() < 0.07) {
                        // Removed 'bonus' (standard 2000pts)
                        const types = ['spread', 'missile', 'guided', 'shield'];
                        const type = types[Math.floor(Math.random() * types.length)];
                        this.powerUps.push(new PowerUp(this, enemy.x, enemy.y, type));
                    }
                    // Rare Super Bonus (0.5% chance - special 1,000,000 point bonus)
                    else if (Math.random() < 0.005) {
                        this.powerUps.push(new PowerUp(this, enemy.x, enemy.y, 'super_bonus'));
                    }

                    // Don't break if piercing, continue to check other enemies? 
                    // Actually, if we hit one, we shouldn't hit the *same* one again.
                    // But hitting multiple in one frame is rare unless overlapping.
                    // If piercing, we just don't delete bullet.
                    if (bullet.markedForDeletion) break;
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
                }
                else if (powerUp.type === 'super_bonus') {
                    this.score += 1000000; // 1 Million Points
                }
                else {
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
                    if (this.player.shieldTimer > 0) {
                        // Shield hit
                        enemy.markedForDeletion = true;
                        this.soundManager.play('explosion');
                    } else {
                        this.handlePlayerDeath();
                    }
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
            // Respawn logic
            this.bullets = [];
            this.player.x = GAME_WIDTH / 2 - this.player.width / 2;
            this.player.y = GAME_HEIGHT - 40;

            // Grant Shield on Respawn
            this.player.shieldTimer = 300; // 5 seconds of safety
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
