import { Tent } from './entities/buildings/Tent.js';
import { Zharan } from './entities/units/Zharan.js';
import { Knight } from './entities/units/Knight.js';
import { Monster } from './entities/units/Monster.js';
import { gameState } from './systems/gameState.js';
import { drawBackground, drawGameState, drawBuildMenu, drawGame } from './systems/renderer.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Store canvas context in gameState
gameState.canvas.context = ctx;

// Load monster image
gameState.images.monster = new Image();
gameState.images.monster.src = 'monster.png';

// Add background image load handler
gameState.images.background.onload = () => requestAnimationFrame(gameLoop);

const tent = new Tent({
    position: { x: 100, y: 100 },
    size: { width: 100, height: 100 },
    image: gameState.images.tent
});
gameState.tent = tent;

const zharan = new Zharan(
    gameState.tent.x + gameState.tent.width/2,
    gameState.tent.y + gameState.tent.height + 20,
    gameState.images.zharan,
    gameState.canvas.width,
    gameState.canvas.height,
    gameState.tent,
    gameState.events
);

gameState.units.push(zharan);


// Usage:
gameState.events.on('resourceGathered', (data) => {
    gameState.resources[data.type].amount += data.amount;
});

// Initialize countdown timer
gameState.timer = {
    countdown: 5,
    lastTime: performance.now()
};

function drawCountdownTimer() {
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

function gameLoop() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - gameState.timer.lastTime) / 1000; // Convert to seconds
    gameState.timer.lastTime = currentTime;
    
    // Update countdown
    if (gameState.timer.countdown > 0) {
        gameState.timer.countdown -= deltaTime;
        
        // Spawn monster when timer hits 0
        if (gameState.timer.countdown <= 0) {
            const monster = new Monster(
                gameState.canvas.width - 100,  // x position (right side)
                gameState.canvas.height - 100, // y position (bottom)
                gameState.images.monster
            );
            gameState.monsters.push(monster);
            
            // Reset timer for next monster
            gameState.timer.countdown = 5;  // Reset to 5 seconds
        }
    }

    const allObjects = [...gameState.resourceNodes, ...gameState.units, gameState.tent];
    
    // Update game state
    gameState.units.forEach(unit => {
        unit.move(allObjects);
    });

    // Update monsters
    gameState.monsters.forEach(monster => {
        monster.update(deltaTime);
    });

    // Draw everything
    drawGame();
    drawCountdownTimer();
    
    requestAnimationFrame(gameLoop);
}

// Replace the openBuildMenu function with this
function openBuildMenu() {
    gameState.ui.buildMenu.isOpen = true;
}

function buildKnight(){
    console.log("building knight")
    gameState.resources.Carrot.amount -= gameState.config.costs.knight;
    const knight = new Knight(
        gameState.tent.x + gameState.tent.width/2, 
        gameState.tent.y + gameState.tent.height, 
        gameState.images.knight,
        gameState.canvas.width,
        gameState.canvas.height
    );
    gameState.units.push(knight)
}


// Add this function to handle clicks on the build menu
function handleBuildMenuClick(mouseX, mouseY) {
    if (!gameState.ui.buildMenu.isOpen) return;

    const menuWidth = 200;
    const menuHeight = 100;
    const padding = 10;
    const { x, y } = gameState.ui.buildMenu.position;

    if (isMouseInBuildMenu(mouseX, mouseY, menuWidth, menuHeight)) {
        console.log("clicked menu");
        
        if (mouseY >= y + padding + 24 && mouseY <= y + padding + 48) {
            if (gameState.resources.Carrot.amount >= gameState.config.costs.knight) {
                buildKnight();
            }
        }
        
        if (mouseY >= y + padding + 48) {
            gameState.ui.buildMenu.isOpen = false;
        }
    } else {
        console.log("setting show build to false");
        gameState.ui.buildMenu.isOpen = false;
    }
}

function isMouseInBuildMenu(mouseX, mouseY, menuWidth, menuHeight) {
    const { x, y } = gameState.ui.buildMenu.position;
    return mouseX >= x && mouseX <= x + menuWidth &&
           mouseY >= y && mouseY <= y + menuHeight;
}

canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    console.log("Right click detected at:", mouseX, mouseY);

    if (gameState.selectedUnit) {
        console.log("Moving unit to:", mouseX, mouseY);
        gameState.selectedUnit.setTarget(mouseX, mouseY);

        for (const resource of gameState.resourceNodes) {
            if (resource.isPointInside(mouseX, mouseY)) {
                if (gameState.selectedUnit) {
                    gameState.selectedUnit.gatheringFrom = resource;
                    gameState.selectedUnit.lastTargetedResource = resource;
                    gameState.selectedUnit.gatheringTimer = 0;
                    console.log(`Gathering from ${resource.resourceType.name}`);
                }
                break;
            }
        }
    }
    return;
});

canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Prevent the default context menu from appearing
    const clickX = event.offsetX;
    const clickY = event.offsetY;
    moveSelectedKnights(clickX, clickY);
});

function moveSelectedKnights(targetX, targetY) {
    // Loop through all units and set target position for selected knights
    gameState.units.forEach(unit => {
        if (unit instanceof Knight && unit.isSelected()) {
            unit.targetX = targetX; // Set the knight's target x position
            unit.targetY = targetY; // Set the knight's target y position
            unit.moveToTarget(); // Call a method to handle movement towards the target
        }
    });
}

let isSelecting = false;
let startX, startY, selectionBox;

function initSelection() {
    const canvas = document.getElementById('gameCanvas');
    canvas.addEventListener('mousedown', startSelection);
    // Move mousemove and mouseup to window level
    window.addEventListener('mousemove', drawSelection);
    window.addEventListener('mouseup', endSelection);
}

function startSelection(e) {
    isSelecting = true;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    selectionBox = document.createElement('div');
    selectionBox.style.position = 'absolute';
    selectionBox.style.border = '1px dashed #000';
    selectionBox.style.backgroundColor = 'rgba(0, 0, 255, 0.3)';
    selectionBox.style.pointerEvents = 'none'; // Prevent the box from interfering with mouse events
    document.body.appendChild(selectionBox);
}

function drawSelection(e) {
    if (!isSelecting) return;
    
    const canvas = document.getElementById('gameCanvas');
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Constrain the selection box to the canvas boundaries
    const boundedX = Math.max(0, Math.min(currentX, canvas.width));
    const boundedY = Math.max(0, Math.min(currentY, canvas.height));

    const width = boundedX - startX;
    const height = boundedY - startY;
    
    selectionBox.style.left = `${rect.left + Math.min(startX, boundedX)}px`;
    selectionBox.style.top = `${rect.top + Math.min(startY, boundedY)}px`;
    selectionBox.style.width = `${Math.abs(width)}px`;
    selectionBox.style.height = `${Math.abs(height)}px`;
}

function endSelection(e) {
    if (!isSelecting) return;
    
    isSelecting = false;
    if (selectionBox && selectionBox.parentNode) {
        document.body.removeChild(selectionBox);
    }
    
    const canvas = document.getElementById('gameCanvas');
    const rect = canvas.getBoundingClientRect();
    const endX = Math.max(0, Math.min(e.clientX - rect.left, canvas.width));
    const endY = Math.max(0, Math.min(e.clientY - rect.top, canvas.height));
    
    const selectedKnights = getSelectedKnights(startX, startY, endX, endY);
    
    // Set selected state for the identified knights
    selectedKnights.forEach(knight => {
        knight.selected = true;
    });
}

function getSelectedKnights(startX, startY, endX, endY) {
    // Logic to determine which knights are within the selection box
    // This will likely involve checking each knight's position
    const selectedKnights = gameState.units.filter(unit => {
        if (unit instanceof Knight) {
            const unitX = unit.x;
            const unitY = unit.y;
            return unitX >= Math.min(startX, endX) && unitX <= Math.max(startX, endX) &&
                   unitY >= Math.min(startY, endY) && unitY <= Math.max(startY, endY);
        }
        return false;
    });
    return selectedKnights;
}

initSelection();

// Existing click event listener
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    console.log("Left click detected");
    const clickedZharan = findClickedUnit(Zharan, mouseX, mouseY);
    const clickedKnight = findClickedUnit(Knight, mouseX, mouseY);

    if (clickedZharan) {
        handleUnitClick(clickedZharan);
        return;
    } else if (clickedKnight) {
        handleUnitClick(clickedKnight);
        return;
    }

    console.log("No unit clicked");
    handleBuildMenuClick(mouseX, mouseY)

    // If no unit is selected and the tent is clicked, open the build menu
    if (isTentClicked(mouseX, mouseY)) {
        console.log("Opening build menu"); // Debugging statement
        openBuildMenu();
    }
});

function findClickedUnit(unitType, mouseX, mouseY) {
    return gameState.units.find(unit => unit instanceof unitType && 
        Math.abs(mouseX - unit.x) < 20 && Math.abs(mouseY - unit.y) < 20);
}

function handleUnitClick(clickedUnit) {
    console.log(`${clickedUnit.constructor.name} clicked`);
    // Deselect all units first
    gameState.units.forEach(unit => {
        if (unit.selected) {
            unit.selected = false;
        }
    });
    gameState.selectedUnit = clickedUnit;
    clickedUnit.selected = true;
}

// You might want to adjust Zharan's properties to account for the image size
zharan.radius = 16; // Adjust this if needed for collision detection

// Function to check if the tent is clicked
function isTentClicked(mouseX, mouseY) {
    const tentX = gameState.tent.x;
    const tentY = gameState.tent.y;
    const tentWidth = gameState.tent.width;
    const tentHeight = gameState.tent.height;

    return mouseX >= tentX && mouseX <= tentX + tentWidth &&
           mouseY >= tentY && mouseY <= tentY + tentHeight;
}