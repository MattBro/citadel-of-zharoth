import { Tent } from './classes/Tent.js';
import { Resource } from './classes/Resource.js';
import { ResourceType } from './classes/ResourceType.js';
import { Zharan } from './classes/Zharan.js';
import { Knight } from './classes/Knight.js';
import { gameState } from './systems/gameState.js';
import { clayType, ironstoneType, carrotType } from './systems/gameState.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// At the top of your file, add this line to create an Image object
const backgroundImage = new Image();
backgroundImage.src = 'grassy-background.png'; // Remove the '@' symbol

// At the top of your file, add this line to create an Image object for Zharan
const zharanImage = new Image();
zharanImage.src = 'zharan.png';

const knightImage = new Image();
knightImage.src = 'knight.png';

// At the top of your file, add this line to create an Image object for the tent
const tentImage = new Image();
tentImage.src = 'tent.png';

// At the top of your file, add this line to create an Image object for the clay
const clayImage = new Image();
clayImage.src = 'clay.png';

const knightCost = 1; // Set the cost for a knight

const tent = new Tent(100, 100, 100, 100, tentImage);
gameState.tent = tent;

const zharan = new Zharan(
    gameState.tent.x + gameState.tent.width/2,
    gameState.tent.y + gameState.tent.height + 20,
    zharanImage,
    canvas.width,
    canvas.height,
    gameState.tent,
    gameState.events
);

gameState.units.push(zharan);


// Usage:
gameState.events.on('resourceGathered', (data) => {
    gameState.resources[data.type].amount += data.amount;
});

function drawBackground() {
    // Check if the image has loaded
    if (backgroundImage.complete) {
        // Draw the image to fill the canvas
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        // If the image hasn't loaded yet, use a solid color as fallback
        ctx.fillStyle = "green";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Add an event listener to redraw once the image loads
        backgroundImage.onload = () => requestAnimationFrame(gameLoop);
    }
}

function drawGameState() {
    const padding = 10; // Padding for left and right sides of the text
    const spacing = 20; // Spacing between resource counters
    let x = padding; // Starting x position
    const y = 10; // Y position for all counters

    ctx.font = "bold 24px Arial";

    const width = 100

    Object.entries(gameState.resources).forEach(([resourceName, resource], index) => {


        ctx.drawImage(resource.type.image, x, y, 20, 20);

        ctx.fillText(resource.amount, 50+ x + padding, y + 20);

        // Move x position for the next resource counter
        x += width + padding * 2 + spacing;
    });
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    
    gameState.tent.draw(ctx);

    gameState.resourceNodes.forEach(resource => resource.draw(ctx));

    const allObjects = [...gameState.resourceNodes, ...gameState.units, gameState.tent];

    gameState.units.forEach(unit => {
        unit.move(allObjects);
        unit.draw(ctx);
    });

    drawGameState();
    drawBuildMenu();
    requestAnimationFrame(gameLoop);
}

// Replace the openBuildMenu function with this
function openBuildMenu() {
    gameState.ui.buildMenu.isOpen = true;
}

function drawBuildMenu() {
    if (!gameState.ui.buildMenu.isOpen) return;
    
    const menuWidth = 200;
    const menuHeight = 100;
    const padding = 10;
    const { x, y } = gameState.ui.buildMenu.position;

    // Draw menu background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, menuWidth, menuHeight);

    // Set text alignment to center
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw menu title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Build Menu', x + menuWidth / 2, y + 25);

    // Draw build option
    ctx.font = '14px Arial';
    const canAffordKnight = gameState.resources.Carrot.amount >= knightCost;
    ctx.fillStyle = canAffordKnight ? 'white' : 'gray';
    ctx.fillText(`Build Knight (${knightCost} Carrots)`, x + menuWidth / 2, y + 50);

    // Draw close button
    ctx.fillStyle = 'white';
    ctx.fillText('Close', x + menuWidth / 2, y + 75);

    // Reset text alignment
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

function buildKnight(){
    console.log("building knight")
    gameState.resources.Carrot.amount -= knightCost;
    const knight = new Knight(tent.x + tent.width/2, tent.y + tent.height, knightImage, canvas.width, canvas.height);
    gameState.units.push(knight)
}


// Add this function to handle clicks on the build menu
function handleBuildMenuClick(mouseX, mouseY) {
    if (!gameState.ui.buildMenu.isOpen) {
        return;
    }

    const menuWidth = 200;
    const menuHeight = 100;
    const padding = 10;
    const { x, y } = gameState.ui.buildMenu.position;

    if (isMouseInBuildMenu(mouseX, mouseY, menuWidth, menuHeight)) {
        console.log("clicked menu");
        
        if (mouseY >= y + padding + 24 && mouseY <= y + padding + 48) {
            if (gameState.resources.Carrot.amount >= knightCost) {
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
    const clickedZharan = gameState.units.find(unit => unit instanceof Zharan && 
        Math.abs(mouseX - unit.x) < 20 && Math.abs(mouseY - unit.y) < 20);

    const clickedKnight = gameState.units.find(unit => unit instanceof Knight && 
        Math.abs(mouseX - unit.x) < 20 && Math.abs(mouseY - unit.y) < 20);

    if (clickedZharan) {
        console.log("Zharan clicked");
        if (gameState.selectedUnit) {
            gameState.selectedUnit.selected = false;
        }
        gameState.selectedUnit = clickedZharan;
        gameState.selectedUnit.selected = true;
        return;
    } else if (clickedKnight) {
        console.log("Knight clicked");
        if (gameState.selectedUnit) {
            gameState.selectedUnit.selected = false;
        }
        gameState.selectedUnit = clickedKnight;
        gameState.selectedUnit.selected = true;
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

gameLoop();

// Add error handling for the image load
backgroundImage.onerror = function() {
    console.error("Error loading the background image");
    // You might want to set a flag here to prevent further attempts to load the image
};

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










