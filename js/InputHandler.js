export default class InputHandler {
    constructor() {
        this.keys = {};

        window.addEventListener('keydown', e => {
            if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyN') {
                this.keys[e.code] = true;
            }
        });

        window.addEventListener('keyup', e => {
            if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyN') {
                this.keys[e.code] = false;
            }
        });

        this.attachTouchControls();
    }

    isDown(code) {
        return !!this.keys[code];
    }

    attachTouchControls() {
        // Remove old buttons from DOM if possible or just ignore them. 
        // User asked to move by finger movement, so buttons are less useful.
        // We will make the whole screen a touch area for movement.

        const touchZone = document.body; // Use whole body
        let startX = 0;
        let lastTapTime = 0; // For double tap detection

        touchZone.addEventListener('touchstart', (e) => {
            // e.preventDefault(); // Might block scrolling, which is good for game
            startX = e.touches[0].clientX;

            // Double tap detection for nuke
            const currentTime = Date.now();
            if (currentTime - lastTapTime < 300) { // 300ms for double tap
                this.keys['KeyN'] = true;
                setTimeout(() => this.keys['KeyN'] = false, 100);
            }
            lastTapTime = currentTime;

            // Also trigger start if needed
            if (!this.keys['Space']) {
                this.keys['Space'] = true;
                setTimeout(() => this.keys['Space'] = false, 200);
            }
        }, { passive: false });

        touchZone.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent scrolling
            const currentX = e.touches[0].clientX;
            const diff = currentX - startX;

            // Sensitivity threshold
            if (diff > 5) {
                this.keys['ArrowRight'] = true;
                this.keys['ArrowLeft'] = false;
                startX = currentX; // Reset to keep moving if dragging continues
            } else if (diff < -5) {
                this.keys['ArrowLeft'] = true;
                this.keys['ArrowRight'] = false;
                startX = currentX;
            } else {
                // Stop if small movement?
                // Actually better to just hold the key until touch ends or direction changes.
                // But Player.js moves constantly if key is true.
                // So we just update direction.
            }
        }, { passive: false });

        touchZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
        });

        // Mouse Fallback for testing on PC without keys
        let isDragging = false;
        touchZone.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            isDragging = true;
            if (!this.keys['Space']) {
                this.keys['Space'] = true;
                setTimeout(() => this.keys['Space'] = false, 200);
            }
        });
        touchZone.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const currentX = e.clientX;
            const diff = currentX - startX;
            if (diff > 5) {
                this.keys['ArrowRight'] = true;
                this.keys['ArrowLeft'] = false;
                startX = currentX;
            } else if (diff < -5) {
                this.keys['ArrowLeft'] = true;
                this.keys['ArrowRight'] = false;
                startX = currentX;
            }
        });
        touchZone.addEventListener('mouseup', () => {
            isDragging = false;
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
        });
    }
}
