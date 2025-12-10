// Cubic Bezier helper
// p0: start, p1: cp1, p2: cp2, p3: end, t: 0..1
export function cubicBezier(p0, p1, p2, p3, t) {
    const x = Math.pow(1 - t, 3) * p0.x +
        3 * Math.pow(1 - t, 2) * t * p1.x +
        3 * (1 - t) * t * t * p2.x +
        t * t * t * p3.x;

    const y = Math.pow(1 - t, 3) * p0.y +
        3 * Math.pow(1 - t, 2) * t * p1.y +
        3 * (1 - t) * t * t * p2.y +
        t * t * t * p3.y;
    return { x, y };
}

// Definition of entrance paths relative to screen size (224x288)
// Enemies will follow these paths before settling into formation
export const PATHS = {
    // Loop from top left
    TYPE_1: [
        { x: 112, y: -20 }, // Start (Top Center-ish)
        { x: 112, y: 100 },
        { x: 20, y: 150 },
        { x: 50, y: 200 }   // Just examples, will need tweaking for nice loops
    ],
    // Loop from top right
    TYPE_2: [
        { x: 112, y: -20 },
        { x: 112, y: 100 },
        { x: 204, y: 150 },
        { x: 174, y: 200 }
    ]
};
