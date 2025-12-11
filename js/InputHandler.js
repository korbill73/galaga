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
        const touchZone = document.body;
        let startX = 0;
        let lastTapTime = 0;

        touchZone.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];

            // Check nuke button click
            const canvas = document.getElementById('gameCanvas');
            if (canvas && window.nukeButtonBounds) {
                const canvasRect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / canvasRect.width;
                const scaleY = canvas.height / canvasRect.height;
                const gameX = (touch.clientX - canvasRect.left) * scaleX;
                const gameY = (touch.clientY - canvasRect.top) * scaleY;

                const bounds = window.nukeButtonBounds;
                if (gameX >= bounds.left && gameX <= bounds.right &&
                    gameY >= bounds.top && gameY <= bounds.bottom) {
                    this.keys['KeyN'] = true;
                    setTimeout(() => this.keys['KeyN'] = false, 100);
                    return;
                }
            }

            startX = touch.clientX;

            // Double tap for nuke (backup)
            const currentTime = Date.now();
            if (currentTime - lastTapTime < 300) {
                this.keys['KeyN'] = true;
                setTimeout(() => this.keys['KeyN'] = false, 100);
            }
            lastTapTime = currentTime;

            // Trigger start
            if (!this.keys['Space']) {
                this.keys['Space'] = true;
                setTimeout(() => this.keys['Space'] = false, 200);
            }
        }, { passive: false });

        touchZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const currentX = e.touches[0].clientX;
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
        }, { passive: false });

        touchZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
        });

        // Mouse fallback
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
