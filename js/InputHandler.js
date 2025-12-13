export default class InputHandler {
    constructor() {
        this.keys = {};
        this.touchX = 0;
        this.touchY = 0;
        this.isTouching = false;

        // Keyboard
        window.addEventListener('keydown', e => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'KeyN'].includes(e.code)) {
                this.keys[e.code] = true;
            }
        });

        window.addEventListener('keyup', e => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'KeyN'].includes(e.code)) {
                this.keys[e.code] = false;
            }
        });

        this.attachTouchControls();
    }

    isDown(code) {
        return !!this.keys[code];
    }

    attachTouchControls() {
        const zone = document.getElementById('game-container') || document.body;

        let startX = 0;
        let lastTap = 0;

        // Prevent default gestures
        zone.addEventListener('touchstart', e => {
            // Don't prevent default if touching an input field
            if (e.target.tagName !== 'INPUT') {
                e.preventDefault();
            }
            const touch = e.touches[0];
            startX = touch.clientX;
            this.touchX = touch.clientX;
            this.touchY = touch.clientY;
            this.isTouching = true;

            // Map tap to space for menu selection
            this.keys['Space'] = true;
            this.keys['Enter'] = true;

            // Check Nuke Button bounds (defined in Player.js drawing)
            if (window.nukeButtonBounds) {
                const rect = document.getElementById('gameCanvas').getBoundingClientRect();
                // Scale for resolution
                const scaleX = 224 / rect.width; // 224 is base width? No, canvas.width is scaled.
                // Actually Game.js sets canvas.width/height based on scale.
                const cvs = document.getElementById('gameCanvas');
                // Wait, we need to map Touch Client coordinates to Canvas Logical coordinates (224x288) or Scaled Canvas coordinates.
                // Player.js draws in *Logical* coordinates (0-224).
                // Context is scaled by `this.scale`.

                // So we need to reverse the transform.
                // let's fetch Game instance scale if possible, or re-calculate.
                // Simple approach: The canvas size ON SCREEN is rect.width.
                // The internal logical width is 224.

                const logicalX = (touch.clientX - rect.left) * (224 / rect.width);
                const logicalY = (touch.clientY - rect.top) * (288 / rect.height);

                const b = window.nukeButtonBounds;
                if (logicalX >= b.left - 10 && logicalX <= b.right + 10 &&
                    logicalY >= b.top - 10 && logicalY <= b.bottom + 10) {
                    this.keys['KeyN'] = true;
                    // Haptic feedback
                    if (navigator.vibrate) navigator.vibrate(50);
                }
            }

            // Double tap for Nuke as fallback
            const now = Date.now();
            if (now - lastTap < 300) {
                this.keys['KeyN'] = true;
            }
            lastTap = now;

        }, { passive: false });

        zone.addEventListener('touchmove', e => {
            if (e.target.tagName !== 'INPUT') e.preventDefault();
            const touch = e.touches[0];
            const diff = touch.clientX - startX;

            // Dead zone
            if (Math.abs(diff) > 5) {
                if (diff > 0) {
                    this.keys['ArrowRight'] = true;
                    this.keys['ArrowLeft'] = false;
                } else {
                    this.keys['ArrowLeft'] = true;
                    this.keys['ArrowRight'] = false;
                }
            } else {
                this.keys['ArrowRight'] = false;
                this.keys['ArrowLeft'] = false;
            }

            // Update for continuous drag relative to finger position? 
            // Classic arcade feels better with relative "virtual joystick" or just "touch side of screen"
            // Use "follow finger" logic if diff is large?
            // Reset startX to keep 'relative' feel
            startX = touch.clientX;

        }, { passive: false });

        zone.addEventListener('touchend', e => {
            if (e.target.tagName !== 'INPUT') e.preventDefault();
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
            setTimeout(() => {
                this.keys['Space'] = false;
                this.keys['Enter'] = false;
                this.keys['KeyN'] = false;
            }, 100);
            this.isTouching = false;
        });

        // Mouse fallback for desktop testing
        let mouseDown = false;
        zone.addEventListener('mousedown', e => {
            if (e.target.tagName === 'CANVAS') {
                mouseDown = true;
                startX = e.clientX;
                this.keys['Space'] = true; // For menu
            }
        });
        zone.addEventListener('mousemove', e => {
            if (!mouseDown) return;
            const diff = e.clientX - startX;
            if (Math.abs(diff) > 2) {
                if (diff > 0) {
                    this.keys['ArrowRight'] = true;
                    this.keys['ArrowLeft'] = false;
                } else {
                    this.keys['ArrowLeft'] = true;
                    this.keys['ArrowRight'] = false;
                }
                startX = e.clientX;
            }
        });
        zone.addEventListener('mouseup', () => {
            mouseDown = false;
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
            this.keys['Space'] = false;
        });
    }
}
