import Game from './Game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    // Set canvas size to scale up the original aspect ratio (224x288)
    // We'll multiply by 2 or 3 for better visibility on modern screens
    const SCALE = 2.5;
    canvas.width = 224 * SCALE;
    canvas.height = 288 * SCALE;

    const game = new Game(canvas);
    game.start();
});
