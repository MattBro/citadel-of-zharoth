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
        // Add an event listener to redraw once the image loads
        gameState.images.background.onload = () => requestAnimationFrame(gameLoop);
    }
}
