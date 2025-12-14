import Player from './Player.js';
import InputHandler from './InputHandler.js';
import Enemy from './Enemy.js';
import PowerUp from './PowerUp.js';
import SoundManager from './SoundManager.js';
import Leaderboard from './Leaderboard.js';
import { rectIntersect, GAME_WIDTH, GAME_HEIGHT } from './utils.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Logical Resolution Setup (224x288)
        this.scale = this.width / GAME_WIDTH;
        this.ctx.scale(this.scale, this.scale);
        this.ctx.imageSmoothingEnabled = false;

        // Core Systems
        this.player = new Player(this);
        this.input = new InputHandler();
        this.soundManager = new SoundManager();
        this.leaderboard = new Leaderboard();

        // Game Entities
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = []; // Explosions
        this.stars = [];

        // Game State
        this.score = 0;
        this.highScore = 20000;
        this.lives = 3;
        this.level = 0; // Will start at 1
        this.state = 'MENU'; // MENU, PLAYING, GAMEOVER, VICTORY, PAUSED
        this.lastTime = 0;

        // Combo System
        this.combo = 0;
        this.comboTimer = 0;
        this.comboMaxTime = 180; // 3 seconds (60fps)
        this.comboMultiplier = 1.0;

        // Progression
        this.MAX_LEVEL = 10; // Game Ends after clearing Level 10

        // Visual Effects
        this.nukeFlash = 0;
        this.nukeExplosions = [];
        this.bossWarning = 0;

        // Background
        this.bgImage = new Image();
        this.bgImage.src = 'assets/bg_nebula_ultimate.png';

        // Init Starfield
        this.initStars();
    }

    initStars() {
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * GAME_HEIGHT,
                speed: 0.2 + Math.random() * 1.5,
                color: Math.random() > 0.9 ? '#ff0055' : (Math.random() > 0.7 ? '#00f7ff' : '#ffffff'),
                size: Math.random() > 0.9 ? 1.5 : 1
            });
        }
    }

    start() {
        this.setState('MENU');
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    async setState(newState) {
        this.state = newState;

        // UI Elements
        const screens = {
            'MENU': document.getElementById('start-screen'),
            'GAMEOVER': document.getElementById('game-over-screen'),
            'VICTORY': document.getElementById('victory-screen')
        };

        // Hide all screens first
        Object.values(screens).forEach(el => el && el.classList.add('hidden'));

        if (this.state === 'MENU') {
            screens['MENU'].classList.remove('hidden');
            this.loadLeaderboard();
        }
        else if (this.state === 'PLAYING') {
            this.resetGame();
        }
        else if (this.state === 'GAMEOVER') {
            screens['GAMEOVER'].classList.remove('hidden');
            this.handleEndGame();
        }
        else if (this.state === 'VICTORY') {
            screens['VICTORY'].classList.remove('hidden');
            this.handleEndGame(true);
        }
    }

    async loadLeaderboard() {
        try {
            const scores = await this.leaderboard.getScores();
            const list = document.getElementById('top-rank-list');
            if (list) {
                if (scores.length === 0) {
                    list.innerHTML = '<span style="color:#888">No records yet.</span>';
                } else {
                    const top3 = scores.slice(0, 3);
                    list.innerHTML = top3.map((s, i) =>
                        `<div style="margin-bottom:6px; display:flex; justify-content:space-between;">
                            <span>${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} <span style="color:#fff">${s.player_name}</span></span>
                            <span style="color:#0ff;">${s.score.toLocaleString()}</span>
                        </div>`
                    ).join('');
                }
            }
        } catch (e) { console.error("Leaderboard load failed", e); }
    }

    resetGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 0;
        this.combo = 0;
        this.comboMultiplier = 1.0;

        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.nukeExplosions = [];
        this.player = new Player(this);
        this.waveSpawning = false;

        this.updateScoreUI();
        this.spawnWave();
    }

    handleEndGame(isVictory = false) {
        // Stats for Game Over / Victory
        const statsId = isVictory ? 'victory-stats' : 'results-stats';
        const statsEl = document.getElementById(statsId);
        if (statsEl) {
            statsEl.innerHTML = `
                SCORE: <span style="color:#ff0">${this.score.toLocaleString()}</span><br>
                LEVEL: <span style="color:#0ff">${this.level}</span><br>
            `;
        }

        // Leaderboard & Input Logic
        // Always allow input if score > 0
        if (this.score > 0) {
            const nameInputSection = document.getElementById('name-input-section');
            if (nameInputSection) {
                nameInputSection.style.display = 'block';
                setTimeout(() => document.getElementById('player-name-input').focus(), 500);
            }

            // Setup Submit Handler
            const submitBtn = document.getElementById('submit-score-btn');
            submitBtn.onclick = async () => {
                const nameInput = document.getElementById('player-name-input');
                const name = nameInput.value.trim() || 'PILOT';
                await this.leaderboard.saveScore(name, this.score, this.level);
                nameInputSection.style.display = 'none';
                this.loadFullLeaderboard();
            };
        } else {
            this.loadFullLeaderboard();
        }

        if (this.score > this.highScore) {
            this.highScore = this.score;
            document.getElementById('highscore-display').innerText = this.highScore;
        }
    }

    async loadFullLeaderboard() {
        try {
            await this.leaderboard.displayLeaderboard();
        } catch (e) { console.error(e); }
    }

    spawnWave() {
        if (this.level >= this.MAX_LEVEL) {
            this.setState('VICTORY');
            return;
        }

        this.level++;
        this.updateScoreUI();

        const isBossLevel = (this.level === this.MAX_LEVEL);

        // Letter Formations (A-J for levels 1-10)
        // 0-9
        const letters = [
            "  ###  \n #   # \n #   # \n ##### \n #   # \n #   # \n #   # ", // A
            " ####  \n #   # \n ####  \n #   # \n #   # \n #   # \n ####  ", // B
            "  #### \n #     \n #     \n #     \n #     \n #     \n  #### ", // C
            " ####  \n #   # \n #   # \n #   # \n #   # \n #   # \n ####  ", // D
            " ##### \n #     \n #     \n ####  \n #     \n #     \n ##### ", // E
            " ##### \n #     \n #     \n ####  \n #     \n #     \n #     ", // F
            "  #### \n #     \n #  ## \n #   # \n #   # \n #   # \n  #### ", // G
            " #   # \n #   # \n #   # \n ##### \n #   # \n #   # \n #   # ", // H
            " ##### \n   #   \n   #   \n   #   \n   #   \n   #   \n ##### ", // I
            " ##### \n    #  \n    #  \n    #  \n #  #  \n #  #  \n  ##   "  // J/T hybrid? Let's do J
        ];

        // Specific Boss Level (Level 10)
        if (isBossLevel) {
            this.bossWarning = 180;
            this.soundManager.play('powerup');

            // Boss Formation (Crown Shape)
            const centerX = GAME_WIDTH / 2;
            const startY = 80;

            // King
            this.enemies.push(new Enemy(this, centerX, startY, 'king'));

            // Escorts (Dense)
            for (let i = 0; i < 30; i++) {
                const x = centerX + Math.cos(i * 0.5) * (80 + Math.random() * 20);
                const y = startY + Math.sin(i * 0.5) * (60 + Math.random() * 20);
                this.enemies.push(new Enemy(this, x, y, 'boss'));
            }
            return;
        }

        // Generate Letter Pattern
        const patternIdx = (this.level - 1) % letters.length;
        const patternStr = letters[patternIdx];
        const rows = patternStr.split('\n');

        // Grid config
        const cellSize = 18;
        const offsetX = (GAME_WIDTH - (rows[0].length * cellSize)) / 2;
        const offsetY = 50;

        let delayCounter = 0;

        // Increase Density: Create multiple enemies per "pixel" in the letter
        const density = 2; // 2 enemies per # logic?
        // Or just draw the letter and then fill background with randoms?
        // User asked for "5배 정도 많이".
        // A 7x7 grid has ~20-30 points. * 5 = 150 enemies. perfect.

        for (let r = 0; r < rows.length; r++) {
            const rowStr = rows[r];
            for (let c = 0; c < rowStr.length; c++) {
                if (rowStr[c] === '#') {
                    // Spawn a cluster for this point
                    for (let k = 0; k < 4; k++) {
                        const type = k === 0 ? 'boss' : (k === 1 ? 'butterfly' : 'bee');
                        // Jitter position to form a thick letter
                        const ex = offsetX + (c * cellSize) + (Math.random() * 14 - 7);
                        const ey = offsetY + (r * cellSize) + (Math.random() * 14 - 7);

                        // Limit width
                        if (ex > 10 && ex < GAME_WIDTH - 20) {
                            const enemy = new Enemy(this, ex, ey, type);
                            enemy.delay = delayCounter++ * 3; // Fast stream
                            this.enemies.push(enemy);
                        }
                    }
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
        // Starfield
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > GAME_HEIGHT) star.y = 0;
        });

        if (this.state === 'MENU') {
            if (this.input.isDown('Space') || this.input.isDown('Enter')) {
                this.soundManager.play('menu_select');
                this.setState('PLAYING');
            }
            return;
        }

        if (this.state === 'GAMEOVER' || this.state === 'VICTORY') {
            const nameInput = document.getElementById('player-name-input');
            const isInputActive = document.activeElement === nameInput;

            if (!isInputActive && (this.input.isDown('Space') || this.input.isDown('Enter'))) {
                this.setState('MENU');
            }
            return;
        }

        // --- PLAYING STATE ---

        // Combo Logic
        if (this.combo > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
        this.updateComboUI();

        // Player & Entities
        this.player.update(this.input);

        this.bullets.forEach((b, i) => {
            b.update();
            if (b.markedForDeletion) this.bullets.splice(i, 1);
        });

        // Boss Logic Check
        let bossExists = false;
        let bossHP = 0;
        let bossMaxHP = 1;

        // Iterate backwards to safely splice
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update();
            if (e.markedForDeletion) {
                this.enemies.splice(i, 1);
            } else if (e.type === 'king') {
                bossExists = true;
                bossHP = e.hp;
                bossMaxHP = e.maxHp;
            }
        }

        // Update Boss UI
        this.updateBossUI(bossExists, bossHP, bossMaxHP);

        this.powerUps.forEach((p, i) => {
            p.update();
            if (p.markedForDeletion) this.powerUps.splice(i, 1);
        });

        // FX
        if (this.nukeFlash > 0) this.nukeFlash--;
        if (this.bossWarning > 0) this.bossWarning--;

        this.nukeExplosions.forEach((exp, i) => {
            if (exp.growing) {
                exp.radius += 3;
                if (exp.radius >= exp.maxRadius) exp.growing = false;
            } else {
                exp.alpha -= 0.05;
                if (exp.alpha <= 0) this.nukeExplosions.splice(i, 1);
            }
        });

        // Wave Cycle
        if (this.enemies.length === 0 && !this.waveSpawning) {
            this.waveSpawning = true;
            setTimeout(() => {
                this.spawnWave();
                this.waveSpawning = false;
            }, 1500);
        }

        this.checkCollisions();
    }

    resetCombo() {
        this.combo = 0;
        this.comboMultiplier = 1.0;
        this.updateComboUI();
    }

    addCombo() {
        this.combo++;
        this.comboTimer = this.comboMaxTime;
        // Multiplier caps at 5x
        this.comboMultiplier = Math.min(1.0 + (this.combo * 0.1), 5.0);
        this.updateComboUI();
    }

    updateComboUI() {
        const container = document.getElementById('combo-container');
        const value = document.getElementById('combo-value');
        if (!container || !value) return;

        if (this.combo > 1) {
            container.style.opacity = '1';
            // Shake effect if combo is high
            const shake = this.combo > 10 ? `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)` : 'none';
            container.style.transform = shake; // Note: this might override CSS positioning if not careful, better to use margin or inner span

            value.innerText = `x${this.comboMultiplier.toFixed(1)} (${this.combo})`;

            // Color shift based on combo
            if (this.combo > 20) value.style.color = '#ff0055'; // Red
            else if (this.combo > 10) value.style.color = '#f5d300'; // Yellow
            else value.style.color = '#00f7ff'; // Blue
        } else {
            container.style.opacity = '0';
        }
    }

    updateScoreUI() {
        const scoreEl = document.getElementById('score-display');
        const livesEl = document.querySelector('.score-label'); // Reuse 1UP label for Lives/Level
        const enemyCountEl = document.getElementById('enemy-count-display');

        if (scoreEl) scoreEl.innerText = Math.floor(this.score).toLocaleString();
        if (livesEl) livesEl.innerHTML = `LIVES: ${this.lives} <span style="margin-left:10px; color:#aaa;">LV: ${this.level}</span>`;
        if (enemyCountEl) {
            // Count enemies that are NOT delay > 0 (spawned) or just all? User wants to see how many left
            // Just filtering markedForDeletion
            const count = this.enemies.filter(e => !e.markedForDeletion).length;
            enemyCountEl.innerText = count;
            enemyCountEl.style.color = count < 10 ? '#ff0000' : '#ffff00';
        }
    }

    updateBossUI(active, hp, maxHp) {
        const hud = document.getElementById('boss-hud');
        if (!hud) return;

        if (active) {
            hud.style.display = 'flex';
            const fill = document.getElementById('boss-hp-fill');
            if (fill) {
                const pct = Math.max(0, (hp / maxHp) * 100);
                fill.style.width = `${pct}%`;
            }
        } else {
            hud.style.display = 'none';
        }
    }

    checkCollisions() {
        const playerBullets = this.bullets.filter(b => !b.isEnemy);

        // Player Bullets vs Enemies
        playerBullets.forEach(bullet => {
            if (bullet.markedForDeletion) return;

            const bRect = { left: bullet.x, right: bullet.x + bullet.width, top: bullet.y, bottom: bullet.y + bullet.height };

            for (const enemy of this.enemies) {
                if (enemy.markedForDeletion || enemy.delay > 0 || enemy.y < 0) continue;
                // Invincibility during ENTRANCE
                if (enemy.state === 'entrance') continue;

                const eRect = { left: enemy.x, right: enemy.x + enemy.width, top: enemy.y, bottom: enemy.y + enemy.height };

                if (rectIntersect(bRect, eRect)) {
                    // Hit logic
                    if (enemy.type === 'king') {
                        enemy.hp -= 10; // Bullet damage
                        this.score += 10 * this.comboMultiplier;
                        this.soundManager.play('shoot');
                        if (enemy.hp <= 0) {
                            this.killEnemy(enemy);
                            this.score += 5000 * this.comboMultiplier; // Boss Bonus
                        }
                    } else {
                        this.killEnemy(enemy);
                        this.score += 100 * this.comboMultiplier;
                    }

                    // Bullet management
                    if (bullet.pierce > 0) {
                        bullet.pierce--;
                        if (bullet.pierce <= 0) bullet.markedForDeletion = true;
                    } else {
                        bullet.markedForDeletion = true;
                    }

                    this.updateScoreUI();
                    if (bullet.markedForDeletion) break;
                }
            }
        });

        // Player vs PowerUps
        const pRect = { left: this.player.x, right: this.player.x + this.player.width, top: this.player.y, bottom: this.player.y + this.player.height };
        this.powerUps.forEach(p => {
            const puRect = { left: p.x, right: p.x + p.width, top: p.y, bottom: p.y + p.height };
            if (rectIntersect(pRect, puRect)) {
                p.markedForDeletion = true;
                this.soundManager.play('powerup');
                this.applyPowerUp(p.type);
            }
        });

        // Enemies vs Player
        if (!this.player.isDead) {
            const pHitBox = { left: this.player.x + 4, right: this.player.x + this.player.width - 4, top: this.player.y + 4, bottom: this.player.y + this.player.height - 4 };
            for (const enemy of this.enemies) {
                if (enemy.delay > 0) continue;
                const eRect = { left: enemy.x + 2, right: enemy.x + enemy.width - 2, top: enemy.y + 2, bottom: enemy.y + enemy.height - 2 };

                if (rectIntersect(pHitBox, eRect)) {
                    if (this.player.shieldTimer > 0) {
                        this.killEnemy(enemy); // Shield kills enemy
                    } else {
                        this.handlePlayerDeath();
                    }
                }
            }
        }
    }

    killEnemy(enemy) {
        enemy.markedForDeletion = true;
        this.addCombo();
        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        this.soundManager.play('explosion');

        // Item Drop (Increased chance with combo)
        const dropChance = 0.05 + (this.combo * 0.001); // 5% base + 0.1% per combo
        if (Math.random() < dropChance) {
            const types = ['spread', 'missile', 'guided', 'shield', 'nuke', 'life'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerUps.push(new PowerUp(this, enemy.x, enemy.y, type));
        }
    }

    createExplosion(x, y) {
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30, maxLife: 30,
                color: '#ffaa00'
            });
        }
    }

    applyPowerUp(type) {
        if (type === 'bonus') this.score += 5000;
        else if (type === 'super_bonus') this.score += 500000;
        else if (type === 'life') {
            this.lives++;
            this.score += 1000;
        }
        else if (type === 'nuke') {
            this.player.nukesLeft = Math.min(this.player.nukesLeft + 1, 5);
            this.score += 1000;
        }
        else {
            this.player.upgradeWeapon(type);
            this.score += 500;
        }
        this.updateScoreUI();
    }

    handlePlayerDeath() {
        this.lives--;
        this.resetCombo();
        this.soundManager.play('explosion');
        this.updateScoreUI();

        if (this.lives <= 0) {
            this.player.isDead = true;
            this.setState('GAMEOVER');
        } else {
            this.bullets = [];
            this.nukeExplosions = []; // Clear visual clutter
            this.player.resetPosition();
            this.player.shieldTimer = 180; // 3 sec shield
        }
    }

    draw() {
        // Clear & Draw Background
        if (this.bgImage && this.bgImage.complete) {
            this.ctx.drawImage(this.bgImage, 0, 0, GAME_WIDTH, GAME_HEIGHT);
        } else {
            this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }

        // Stars (Overlay for depth)
        this.stars.forEach(s => {
            this.ctx.fillStyle = s.color;
            this.ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        if (this.state === 'PLAYING' || this.state === 'GAMEOVER' || this.state === 'VICTORY') {
            this.powerUps.forEach(p => p.draw());
            this.enemies.forEach(e => e.draw());
            this.player.draw();
            this.bullets.forEach(b => b.draw());

            // Particles
            this.particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                } else {
                    this.ctx.fillStyle = p.color;
                    this.ctx.globalAlpha = p.life / p.maxLife;
                    this.ctx.fillRect(p.x, p.y, 2, 2);
                    this.ctx.globalAlpha = 1.0;
                }
            });

            // Nuke Overlay
            if (this.nukeFlash > 0) {
                this.ctx.fillStyle = `rgba(255, 255, 200, ${this.nukeFlash / 60})`;
                this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            }

            // Boss Warning Overlay
            if (this.bossWarning > 0 && (Math.floor(Date.now() / 200) % 2 === 0)) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                // Text is handled by DOM or we can draw it
                this.ctx.fillStyle = 'yellow';
                this.ctx.font = '20px "Press Start 2P"';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('WARNING', GAME_WIDTH / 2, GAME_HEIGHT / 2);
            }
        }
    }
}
