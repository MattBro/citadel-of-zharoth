import { Tent } from './entities/buildings/Tent.js';
import { Zharan } from './entities/units/Zharan.js';
import { Knight } from './entities/units/Knight.js';
import { gameState } from './systems/gameState.js';
import { drawBackground, drawGameState, drawBuildMenu, drawGame } from './systems/renderer.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Store canvas context in gameState
gameState.canvas.context = ctx;

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

function gameLoop() {
    const allObjects = [...gameState.resourceNodes, ...gameState.units, gameState.tent];
    
    // Update game state
    gameState.units.forEach(unit => {
        unit.move(allObjects);
    });

    // Draw everything
    drawGame();
    
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
    if (gameState.selectedUnit) {
        gameState.selectedUnit.selected = false;
    }
    gameState.selectedUnit = clickedUnit;
    gameState.selectedUnit.selected = true;
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