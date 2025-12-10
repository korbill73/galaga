export default class InputHandler {
    constructor() {
        this.keys = {};

        window.addEventListener('keydown', e => {
            if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'Enter') {
                this.keys[e.code] = true;
            }
        });

        window.addEventListener('keyup', e => {
            if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'Enter') {
                this.keys[e.code] = false;
            }
        });

        this.attachTouchControls();
    }

    isDown(code) {
        return !!this.keys[code];
    }

    attachTouchControls() {
        // Map buttons to keycodes
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnFire = document.getElementById('btn-fire');

        const bindBtn = (elem, code) => {
            if (!elem) return;
            // Touch
            elem.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[code] = true; elem.classList.add('active'); });
            elem.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[code] = false; elem.classList.remove('active'); });

            // Mouse (for desktop testing)
            elem.addEventListener('mousedown', (e) => { this.keys[code] = true; elem.classList.add('active'); });
            elem.addEventListener('mouseup', (e) => { this.keys[code] = false; elem.classList.remove('active'); });
            elem.addEventListener('mouseleave', (e) => { this.keys[code] = false; elem.classList.remove('active'); });
        };

        bindBtn(btnLeft, 'ArrowLeft');
        bindBtn(btnRight, 'ArrowRight');
        bindBtn(btnFire, 'Space');

        // Mobile "Tap to Start" handling
        // Bind to window/document to ensure we catch it anywhere
        const startHandler = (e) => {
            // If game is not started, any tap should simulate Space
            if (!this.keys['Space']) {
                this.keys['Space'] = true;
                setTimeout(() => this.keys['Space'] = false, 200);
            }
        };

        // Attach to body for maximum coverage
        document.body.addEventListener('touchstart', startHandler, { passive: false });
        document.body.addEventListener('click', startHandler);

        // Keep button logic for gameplay
    }
}
