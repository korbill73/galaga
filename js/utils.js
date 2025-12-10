export function rectIntersect(r1, r2) {
    return !(r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top);
}

// 224 is the original width of Galaga arcade
// 288 is the original height
export const GAME_WIDTH = 224;
export const GAME_HEIGHT = 288;
