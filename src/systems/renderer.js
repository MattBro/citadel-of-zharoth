import { gameState } from './gameState.js';

export function drawBackground() {
    const ctx = gameState.canvas.context;
    if (gameState.images.background.complete) {
        ctx.drawImage(gameState.images.background, 0, 0, gameState.canvas.width, gameState.canvas.height);
    } else {
        ctx.fillStyle = "green";
        ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
        gameState.images.background.onload = () => requestAnimationFrame(gameLoop);
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

export function drawBuildMenu() {
    if (!gameState.ui.buildMenu.isOpen) return;
    
    const ctx = gameState.canvas.context;
    const menuWidth = 200;
    const menuHeight = 100;
    const padding = 10;
    const { x, y } = gameState.ui.buildMenu.position;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, menuWidth, menuHeight);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Build Menu', x + menuWidth / 2, y + 25);

    ctx.font = '14px Arial';
    const canAffordKnight = gameState.resources.Carrot.amount >= gameState.config.costs.knight;
    ctx.fillStyle = canAffordKnight ? 'white' : 'gray';
    ctx.fillText(`Build Knight (${gameState.config.costs.knight} Carrots)`, x + menuWidth / 2, y + 50);

    ctx.fillStyle = 'white';
    ctx.fillText('Close', x + menuWidth / 2, y + 75);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

export function drawGame() {
    const ctx = gameState.canvas.context;
    
    // Clear and draw background
    ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    drawBackground();
    
    // Draw tent
    gameState.tent.draw(ctx);

    // Draw resources
    gameState.resourceNodes.forEach(resource => resource.draw(ctx));

    // Draw units
    gameState.units.forEach(unit => {
        unit.draw(ctx);
    });

    // Draw UI elements
    drawGameState();
    drawBuildMenu();
}
