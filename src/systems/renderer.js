import { gameState } from './gameState.js';

export function drawBackground() {
    const ctx = gameState.canvas.context;
    // Check if the image has loaded
    if (gameState.images.background.complete) {
        // Draw the image to fill the canvas
        ctx.drawImage(gameState.images.background, 0, 0, gameState.canvas.width, gameState.canvas.height);
    } else {
        // If the image hasn't loaded yet, use a solid color as fallback
        ctx.fillStyle = "green";
        ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    }
}

export function drawGameState() {
    const ctx = gameState.canvas.context;
    const padding = 10;
    const spacing = 20;
    let x = padding;
    const y = 10;
    const width = 100;

    ctx.font = "bold 24px Arial";

    Object.entries(gameState.resources).forEach(([resourceName, resource], index) => {
        ctx.drawImage(resource.type.image, x, y, 20, 20);
        ctx.fillText(resource.amount, 50 + x + padding, y + 20);
        x += width + padding * 2 + spacing;
    });
}
