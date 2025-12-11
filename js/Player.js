import Sprite from './Sprite.js';
import Bullet from './Bullet.js';
import { GAME_WIDTH, GAME_HEIGHT } from './utils.js';

export default class Player {
    constructor(game) {
        this.game = game;
        this.width = 36; // Increased size for detailed graphic
        this.height = 36;
        this.x = GAME_WIDTH / 2 - this.width / 2;
        this.y = GAME_HEIGHT - 40;
        this.speed = 3; // Slightly faster movement
        this.maxBullets = 10; // More bullets for faster fire rate
        this.bullets = [];
        this.isDead = false;

        this.weaponType = 'default'; // default, spread, missile, guided
        this.weaponLevel = 1;

        // Load Image
        this.image = new Image();
        this.image.src = 'assets/player.png';

        this.shootTimer = 0;

        // PowerUp Timers (10 seconds = 600 frames at 60fps)
        this.shieldTimer = 0;
        this.weaponTimer = 0;

        // Nuclear Missiles
        this.nukesLeft = 3; // Total 3 nukes
    }

    update(input) {
        if (this.isDead) return;

        // Timers
        if (this.shieldTimer > 0) this.shieldTimer--;
        if (this.weaponTimer > 0) {
            this.weaponTimer--;
            if (this.weaponTimer <= 0) {
                this.weaponType = 'default';
                this.weaponLevel = 1;
            }
        }

        // Movement
        if (input.isDown('ArrowLeft')) {
            this.x -= this.speed;
        }
        if (input.isDown('ArrowRight')) {
            this.x += this.speed;
        }

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > GAME_WIDTH - this.width) this.x = GAME_WIDTH - this.width;

        // Shooting
        // Auto-Fire enabled (no input check needed for space)

        if (this.shootTimer <= 0) {
            this.shoot();
            // Fire rate - INCREASED 30% (4 -> 5.2 frames)
            this.shootTimer = 5.2;
        }

        if (this.shootTimer > 0) this.shootTimer--;

        // Nuclear Missile Launch (N key)
        if (input.isDown('KeyN') && this.nukesLeft > 0 && !this.nukeLaunched) {
            this.launchNuke();
            this.nukeLaunched = true;
        }
        if (!input.isDown('KeyN')) {
            this.nukeLaunched = false;
        }
    }

    upgradeWeapon(type) {
        if (type === 'shield') {
            this.shieldTimer = 300; // 5 seconds (reduced from 10)
            return;
        }

        if (this.weaponType === type) {
            this.weaponLevel++;
        } else {
            this.weaponType = type;
            this.weaponLevel = 1;
        }
        if (this.weaponLevel > 3) this.weaponLevel = 3;

        // Reset timer for weapon
        this.weaponTimer = 600; // 10 seconds
    }

    shoot() {
        this.game.soundManager.play('shoot');

        const bulletX = this.x + this.width / 2 - 2; // Center
        const bulletY = this.y;

        // Spread logic
        if (this.weaponType === 'spread') {
            this.game.bullets.push(new Bullet(this.game, bulletX, bulletY, false, 'default'));
            this.game.bullets.push(new Bullet(this.game, bulletX - 4, bulletY + 4, false, 'left-angled'));
            this.game.bullets.push(new Bullet(this.game, bulletX + 4, bulletY + 4, false, 'right-angled'));
        }
        else if (this.weaponType === 'missile') {
            this.game.bullets.push(new Bullet(this.game, bulletX + 2, bulletY, false, 'missile'));
            if (this.weaponLevel >= 2) {
                this.game.bullets.push(new Bullet(this.game, bulletX - 8, bulletY + 2, false, 'missile'));
                this.game.bullets.push(new Bullet(this.game, bulletX + 12, bulletY + 2, false, 'missile'));
            }
        }
        else if (this.weaponType === 'guided') {
            this.game.bullets.push(new Bullet(this.game, bulletX - 10, bulletY + 5, false, 'guided'));
            this.game.bullets.push(new Bullet(this.game, bulletX + 10, bulletY + 5, false, 'guided'));
            if (this.weaponLevel >= 2) {
                this.game.bullets.push(new Bullet(this.game, bulletX, bulletY, false, 'guided'));
            }
        }
        else {
            // Default
            this.game.bullets.push(new Bullet(this.game, bulletX, bulletY, false, 'default'));
            if (this.weaponLevel >= 2) { // Double
                this.game.bullets.push(new Bullet(this.game, bulletX - 6, bulletY, false, 'default'));
                this.game.bullets.push(new Bullet(this.game, bulletX + 6, bulletY, false, 'default'));
            }
            if (this.weaponLevel >= 3) { // Triple
                this.game.bullets.push(new Bullet(this.game, bulletX, bulletY - 5, false, 'default'));
            }
        }
    }

    draw() {
        if (this.isDead) return;

        const ctx = this.game.ctx;
        if (this.image.complete) {
            ctx.save();
            // Use screen blend mode to make black background transparent-ish
            ctx.globalCompositeOperation = 'screen';
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            ctx.restore();
        } else {
            // Fallback
            ctx.fillStyle = 'cyan';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x + 16, this.y, 4, 4);
        }

        // Draw Shield - Fantastic Multi-layer Gradient Effect
        if (this.shieldTimer > 0) {
            ctx.save();

            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const radius = this.width / 1.5;
            const time = Date.now() / 1000;

            // Layer 1: Outer pulsing glow
            const outerPulse = Math.sin(time * 3) * 0.3 + 0.7;
            const outerGradient = ctx.createRadialGradient(
                centerX, centerY, radius * 0.7,
                centerX, centerY, radius * 1.3
            );
            outerGradient.addColorStop(0, `rgba(100, 200, 255, ${0.15 * outerPulse})`);
            outerGradient.addColorStop(0.5, `rgba(0, 150, 255, ${0.3 * outerPulse})`);
            outerGradient.addColorStop(1, 'rgba(0, 100, 200, 0.0)');

            ctx.fillStyle = outerGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
            ctx.fill();

            // Layer 2: Main shield with rainbow gradient
            const hue = (time * 50) % 360;
            const mainGradient = ctx.createRadialGradient(
                centerX, centerY - radius * 0.3, radius * 0.2,
                centerX, centerY, radius
            );
            mainGradient.addColorStop(0, `hsla(${hue}, 100%, 80%, 0.1)`);
            mainGradient.addColorStop(0.4, `hsla(${hue + 60}, 100%, 60%, 0.3)`);
            mainGradient.addColorStop(0.7, `hsla(${hue + 120}, 100%, 50%, 0.4)`);
            mainGradient.addColorStop(1, `hsla(${hue + 180}, 100%, 40%, ${0.6 + Math.sin(time * 2) * 0.2})`);

            ctx.fillStyle = mainGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Layer 3: Inner bright core
            const coreGradient = ctx.createRadialGradient(
                centerX, centerY - radius * 0.2, 0,
                centerX, centerY, radius * 0.5
            );
            coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.5 + Math.sin(time * 4) * 0.3})`);
            coreGradient.addColorStop(0.5, `rgba(150, 220, 255, ${0.3 + Math.sin(time * 3) * 0.2})`);
            coreGradient.addColorStop(1, 'rgba(0, 200, 255, 0.0)');

            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Layer 4: Multiple rotating rings
            for (let i = 0; i < 3; i++) {
                const ringOffset = (time * (i + 1) * 0.5) % (Math.PI * 2);
                const ringRadius = radius * (0.6 + i * 0.15);
                const ringAlpha = 0.5 + Math.sin(time * 2 + i) * 0.3;

                ctx.strokeStyle = `hsla(${(hue + i * 120) % 360}, 100%, 70%, ${ringAlpha})`;
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 10]);
                ctx.lineDashOffset = -ringOffset * 20;
                ctx.beginPath();
                ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.setLineDash([]);

            // Layer 5: Sparkle points
            const sparkleCount = 8;
            for (let i = 0; i < sparkleCount; i++) {
                const angle = (i / sparkleCount) * Math.PI * 2 + time * 2;
                const sparkleRadius = radius * 0.9;
                const sx = centerX + Math.cos(angle) * sparkleRadius;
                const sy = centerY + Math.sin(angle) * sparkleRadius;
                const sparkleSize = 2 + Math.sin(time * 5 + i) * 1;

                const sparkleGradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, sparkleSize * 2);
                sparkleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                sparkleGradient.addColorStop(0.5, `hsla(${(hue + i * 45) % 360}, 100%, 70%, 0.6)`);
                sparkleGradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

                ctx.fillStyle = sparkleGradient;
                ctx.beginPath();
                ctx.arc(sx, sy, sparkleSize * 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // Draw Nuclear Missile UI (bottom right) - CLICKABLE
        const nukeX = GAME_WIDTH - 70;
        // Button background
        if (this.nukesLeft > 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 2;
        } else {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
        }
        ctx.fillRect(nukeX - 5, nukeY - buttonHeight / 2, buttonWidth, buttonHeight);
        ctx.strokeRect(nukeX - 5, nukeY - buttonHeight / 2, buttonWidth, buttonHeight);

        // Text
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = this.nukesLeft > 0 ? '#ff0' : '#888';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('NUKE', nukeX, nukeY);

        // Count
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = this.nukesLeft > 0 ? '#fff' : '#666';
        ctx.textAlign = 'right';
        ctx.fillText(`×${this.nukesLeft}`, nukeX + 50, nukeY);

        // Nuclear icon
        if (this.nukesLeft > 0) {
            const iconX = nukeX + 25;
            const iconY = nukeY;
            const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;

            ctx.fillStyle = `rgba(255, 50, 0, ${pulse})`;
            ctx.beginPath();
            ctx.arc(iconX, iconY, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    launchNuke() {
        this.nukesLeft--;
        this.game.soundManager.play('explosion');

        // Create massive explosion effect
        this.game.nukeFlash = 60; // Flash duration

        // Destroy ALL enemies on screen
        this.game.enemies.forEach(enemy => {
            if (!enemy.markedForDeletion && enemy.delay <= 0) {
                enemy.markedForDeletion = true;
                this.game.score += 100;

                // Create explosion particles
                this.createNukeExplosion(enemy.x, enemy.y);
            }
        });

        document.getElementById('score-display').innerText = this.game.score;
    }

    createNukeExplosion(x, y) {
        // Add explosion visual effect (handled in Game.js)
        if (!this.game.nukeExplosions) this.game.nukeExplosions = [];
        this.game.nukeExplosions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 40,
            alpha: 1,
            growing: true
        });
    }
}
