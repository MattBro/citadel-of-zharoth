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

let showBuildMenu = false; // Flag to control the visibility of the build menu

const tent = new Tent(100, 100, 100, 100, tentImage); // Example position and size

const resources = [
    new Resource(clayType, 600, 300, 1000),
    new Resource(ironstoneType, 600, 500, 1000),
    new Resource(carrotType, 400, 400, 1000)
];

const eventBus = {
    listeners: {},
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
};

const zharan = new Zharan(tent.x + tent.width/2, tent.y + tent.height + 20, zharanImage, canvas.width, canvas.height, tent, eventBus);

gameState.units.push(zharan);


// Usage:
eventBus.on('resourceGathered', (data) => {
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
    
    // Draw the tent
    tent.draw(ctx); // Assuming tent is an instance of the Tent class

    // Draw resources
    resources.forEach(resource => resource.draw(ctx));

    // Combine all game objects for collision detection
    const allObjects = [...resources, ...gameState.units, tent]; // Include the tent

    // Move and draw units
    gameState.units.forEach(unit => {
        unit.move(allObjects);  // Pass all objects to check for collision
        unit.draw(ctx);
    });

    drawGameState();
    drawBuildMenu();
    requestAnimationFrame(gameLoop);
}

// Replace the openBuildMenu function with this
function openBuildMenu() {
    showBuildMenu = true;
}
let buildMenuX = 100;
let buildMenuY = 700;
const knightCost = 5; // Set the cost for a knight

function drawBuildMenu() {
    if (!showBuildMenu) return;
    
    const menuWidth = 200;
    const menuHeight = 100;
    const padding = 10;
    

    // Draw menu background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(buildMenuX, buildMenuY, menuWidth, menuHeight);

    // Set text alignment to center
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw menu title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Build Menu', buildMenuX + menuWidth / 2, buildMenuY + 25);

    // Draw build option
    ctx.font = '14px Arial';
    const canAffordKnight = gameState.resources.Carrot >= knightCost;
    ctx.fillStyle = canAffordKnight ? 'white' : 'gray';
    ctx.fillText(`Build Knight (${knightCost} Carrots)`, buildMenuX + menuWidth / 2, buildMenuY + 50);

    // Draw close button
    ctx.fillStyle = 'white';
    ctx.fillText('Close', buildMenuX + menuWidth / 2, buildMenuY + 75);

    // Reset text alignment to default for other drawing operations
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

    if(!showBuildMenu) {
        return;
    }

    const menuWidth = 200;
    const menuHeight = 100;
    const padding = 10;

    if (isMouseInBuildMenu.call(this, mouseX, mouseY, menuWidth, menuHeight)) {
        console.log("clicked menu");
        
        // Check if "Build Knight" is clicked
        if (mouseY >= buildMenuY + padding + 24 && mouseY <= buildMenuY + padding + 48) {
            if (gameState.resources.Carrot.amount >= knightCost) {
                buildKnight();
            }
        }
        
        // Check if "Close" is clicked
        if (mouseY >= buildMenuY + padding + 48) {
            showBuildMenu = false;
        }
    } else {
        console.log("setting show build to false");
        showBuildMenu = false;
    }
}

function isMouseInBuildMenu(mouseX, mouseY, menuWidth, menuHeight) {
    return mouseX >= buildMenuX && mouseX <= buildMenuX + menuWidth &&
           mouseY >= buildMenuY && mouseY <= buildMenuY + menuHeight;
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

        for (const resource of resources) {
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
    const tentX = tent.x; // Assuming tent has x and y properties
    const tentY = tent.y;
    const tentWidth = tent.width; // Assuming tent has width and height properties
    const tentHeight = tent.height;

    return mouseX >= tentX && mouseX <= tentX + tentWidth &&
           mouseY >= tentY && mouseY <= tentY + tentHeight;
}










