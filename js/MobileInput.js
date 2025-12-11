// Simple mobile-compatible name input using native prompt

export function getMobilePlayerName() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const name = prompt('🏆 NEW HIGH SCORE! 🏆\nEnter your name:', 'PLAYER');
            resolve(name ? name.trim() : 'PLAYER');
        }, 500);
    });
}
