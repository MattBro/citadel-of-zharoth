import { gameState } from './gameState.js';

export function drawBackground() {
    const ctx = gameState.canvas.context;
    if (gameState.images.background.complete) {
        ctx.drawImage(gameState.images.background, 0, 0, gameState.canvas.width, gameState.canvas.height);
    } else {
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
    ctx.fillStyle = "white";  // Set text color to white

    Object.entries(gameState.resources).forEach(([resourceName, resource], index) => {
        ctx.drawImage(resource.type.image, x, y, 20, 20);
        ctx.fillStyle = "white";  // Ensure text stays white for each resource
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

export function drawCountdownTimer() {
    const ctx = gameState.canvas.context;
    ctx.save();
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    const timerText = `${Math.ceil(gameState.timer.countdown)}`;
    const x = gameState.canvas.width - 50;
    const y = 40;
    ctx.strokeText(timerText, x, y);
    ctx.fillText(timerText, x, y);
    ctx.restore();
}

export function drawGame() {
    const ctx = gameState.canvas.context;
    
    // Clear the canvas
    ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    // Draw background
    drawBackground();
    
    // Draw resource nodes
    gameState.resourceNodes.forEach(node => {
        node.draw(ctx);
    });
    
    // Draw tent
    if (gameState.tent) {
        gameState.tent.draw(ctx);
    }
    
    // Draw units
    gameState.units.forEach(unit => {
        unit.draw(ctx);
    });

    // Draw monsters
    gameState.monsters.forEach(monster => {
        monster.draw(ctx);
    });
    
    // Draw UI elements
    drawGameState();
    drawBuildMenu();
    drawCountdownTimer();
}
