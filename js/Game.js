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

        // Nuclear effects
        this.nukeFlash = 0; // Flash effect when nuke is launched
        this.nukeExplosions = []; // Explosion animations

        // Boss warning
        this.bossWarning = 0; // Warning message when boss appears

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
        this.waveSpawning = false; // Flag to prevent multiple wave spawns
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
            // Display BOSS WARNING message
            this.bossWarning = 180; // Display for 3 seconds
            this.soundManager.play('powerup'); // Warning sound

            const centerX = GAME_WIDTH / 2;
            const centerY = 80;

            // Create a KING BOSS formation - "적의 대왕"
            // CENTER: The KING BOSS!
            createEnemy(centerX, centerY, 'king');

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
            // Classic Grid - ULTRA slow progression
            // Level 1: 1 boss, 2 butterfly, 1x3 bee (total 6)
            // Level 20: Still around 8-10 total
            const bossCount = Math.min(1 + Math.floor(this.level / 10), 2);
            const butterflyCount = Math.min(2 + Math.floor(this.level / 8), 4);
            const beePerRow = Math.min(3 + Math.floor(this.level / 6), 5);

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
            // Start with 6, ultra slowly increase
            const count = Math.min(6 + Math.floor(this.level * 0.3), 12);

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
            // Start with 2 rows, increase ultra slowly
            const rows = Math.min(2 + Math.floor(this.level / 8), 4);

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
            // Start smaller, ultra slow increase
            const rows = Math.min(2 + Math.floor(this.level / 10), 3);
            const cols = Math.min(3 + Math.floor(this.level / 8), 5);
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

        // Nuclear Flash effect
        if (this.nukeFlash > 0) this.nukeFlash--;

        // Boss Warning
        if (this.bossWarning > 0) this.bossWarning--;

        // Nuclear Explosions animations
        this.nukeExplosions.forEach((exp, index) => {
            if (exp.growing) {
                exp.radius += 3;
                if (exp.radius >= exp.maxRadius) {
                    exp.growing = false;
                }
            } else {
                exp.alpha -= 0.05;
                if (exp.alpha <= 0) {
                    this.nukeExplosions.splice(index, 1);
                }
            }
        });

        if (this.enemies.length === 0 && !this.waveSpawning) {
            this.waveSpawning = true;
            setTimeout(() => {
                this.spawnWave();
                this.waveSpawning = false;
            }, 1000);
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
                    // HP System for king boss
                    if (enemy.type === 'king') {
                        enemy.hp--;
                        this.score += 50; // Partial score for hitting king
                        this.soundManager.play('shoot'); // Hit sound

                        if (enemy.hp <= 0) {
                            enemy.markedForDeletion = true;
                            this.score += 500; // Bonus for killing king
                            this.soundManager.play('explosion');
                        }
                    } else {
                        enemy.markedForDeletion = true;
                        this.score += 100;
                        this.soundManager.play('explosion');
                    }

                    // Piercing Logic
                    if (bullet.pierce) {
                        bullet.pierce--;
                        if (bullet.pierce <= 0) bullet.markedForDeletion = true;
                    } else {
                        bullet.pierce = 0; // Default safety
                        bullet.markedForDeletion = true;
                    }

                    document.getElementById('score-display').innerText = this.score;

                    // Item drop only when enemy is actually killed
                    if (enemy.markedForDeletion) {
                        // Item drop rate doubled for better gameplay
                        if (Math.random() < 0.035) {
                            // Removed 'bonus' (standard 2000pts)
                            const types = ['spread', 'missile', 'guided', 'shield'];
                            const type = types[Math.floor(Math.random() * types.length)];
                            this.powerUps.push(new PowerUp(this, enemy.x, enemy.y, type));
                        }
                        // Rare Super Bonus (0.25% chance - special 1,000,000 point bonus)
                        else if (Math.random() < 0.0025) {
                            this.powerUps.push(new PowerUp(this, enemy.x, enemy.y, 'super_bonus'));
                        }
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

            // Draw nuclear explosions
            this.nukeExplosions.forEach(exp => {
                this.ctx.save();
                // Outer blast wave
                const gradient = this.ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
                gradient.addColorStop(0, `rgba(255, 255, 200, ${exp.alpha * 0.8})`);
                gradient.addColorStop(0.3, `rgba(255, 150, 0, ${exp.alpha * 0.6})`);
                gradient.addColorStop(0.6, `rgba(255, 50, 0, ${exp.alpha * 0.4})`);
                gradient.addColorStop(1, `rgba(100, 0, 0, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
                this.ctx.fill();

                // Inner core
                this.ctx.fillStyle = `rgba(255, 255, 255, ${exp.alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(exp.x, exp.y, exp.radius * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            });

            // Nuclear flash effect (screen-wide)
            if (this.nukeFlash > 0) {
                this.ctx.save();
                const flashAlpha = this.nukeFlash / 60;
                this.ctx.fillStyle = `rgba(255, 255, 200, ${flashAlpha * 0.5})`;
                this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                this.ctx.restore();
            }

            // Boss Warning Message - "적의 대왕 출현!"
            if (this.bossWarning > 0) {
                this.ctx.save();
                const warningAlpha = Math.min(this.bossWarning / 60, 1);
                const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;

                // Background flash
                this.ctx.fillStyle = `rgba(255, 0, 0, ${warningAlpha * 0.3 * pulse})`;
                this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

                // Warning text
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                // Shadow effect
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowOffsetX = 3;
                this.ctx.shadowOffsetY = 3;

                // Main text - "적의 대왕!"
                this.ctx.font = 'bold 32px Arial';
                this.ctx.fillStyle = `rgba(255, 255, 0, ${warningAlpha})`;
                this.ctx.strokeStyle = `rgba(255, 0, 0, ${warningAlpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.strokeText('적의 대왕!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
                this.ctx.fillText('적의 대왕!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);

                // Sub text - "WARNING!"
                this.ctx.font = 'bold 20px Arial';
                this.ctx.fillStyle = `rgba(255, 100, 100, ${warningAlpha * pulse})`;
                this.ctx.fillText('BOSS INCOMING!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15);

                this.ctx.restore();
            }
        }
    }
}
