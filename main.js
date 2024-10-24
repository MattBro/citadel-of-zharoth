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

const tent = {
    x: 100,
    y: 100,
    width: 200,  // Adjust this to match your image width
    height: 200  // Adjust this to match your image height
};

class ResourceType {
    constructor(name, imageSrc){
        this.name = name;
        this.image = new Image();
        this.image.src = imageSrc;
    }
}

class Resource {
    constructor(resourceType, x, y, amount) {
        this.resourceType = resourceType;
        this.x = x;
        this.y = y;
        this.amount = amount;
    }

    draw(ctx) {
        if (this.resourceType.image.complete) {
            const imageWidth = 64;  // Adjust based on your image size
            const imageHeight = 64; // Adjust based on your image size
            ctx.drawImage(this.resourceType.image, this.x - imageWidth/2, this.y - imageHeight/2, imageWidth, imageHeight);
            
            ctx.fillStyle = "white";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.amount, this.x, this.y + imageHeight/2 + 20);
        }
    }
}

const clayType = new ResourceType("Clay", "clay.png");
const ironstoneType = new ResourceType("Ironstone", "ironstone.png")
const carrotType = new ResourceType("Carrot", "carrot.png")

const resources = [
    new Resource(clayType, 600, 300, 1000),
    new Resource(ironstoneType, 600, 500, 1000),
    new Resource(carrotType, 400, 400, 1000)
];

const gameState = {
    resources: {
        Clay: {type:clayType, amount:0},
        Carrot: {type:carrotType, amount:0},
        Ironstone: {type:ironstoneType, amount:0},
    },
    units: []
};

class Unit {
    constructor(type, x, y, speed, image) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.image = image;
        this.radius = 16;
        this.targetX = null;
        this.targetY = null;
    }

    move() {
        if (this.targetX !== null && this.targetY !== null) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > this.speed) {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
                this.targetX = null;
                this.targetY = null;
            }
        }
    }

    draw(ctx) {
        if (this.image?.complete) { // Use optional chaining here
            const imageWidth = 32;
            const imageHeight = 32;
            ctx.drawImage(this.image, this.x - imageWidth/2, this.y - imageHeight/2, imageWidth, imageHeight);
        } else {
            // Fallback drawing if image isn't loaded
            ctx.fillStyle = "gray";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
}

// Zharan class extending Unit
class Zharan extends Unit {
    constructor(x, y, image) {
        super('zharan', x, y, 1, image);
        this.carrying = {
            type: null,
            amount: 0
        };
        this.carryCapacity = 1;
        this.gatheringFrom = null;
        this.lastTargetedResource = null;
        this.gatheringTimer = 0;
        this.gatheringDelay = 300;
        this.selected = false; // Add a selected property
    }

    draw(ctx) {
        // Draw the Zharan unit
        super.draw(ctx);
        
        // Draw selection highlight
        if (this.selected) {
            ctx.strokeStyle = 'blue'; // Highlight color for selection
            ctx.strokeRect(this.x - 16, this.y - 16, 32, 32); // Adjust size as needed
        }
        
        if (this.image && this.image.complete) {
            const imageWidth = 32;
            const imageHeight = 32;
            ctx.drawImage(this.image, this.x - imageWidth/2, this.y - imageHeight/2, imageWidth, imageHeight);
        } else {
            // Fallback drawing if image isn't loaded
            ctx.fillStyle = "gray";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.carrying.amount > 0) {
            const dotImage = this.carrying.type.image; // Get the image for the carrying type
            if (dotImage.complete) {
                ctx.drawImage(dotImage, this.x - 10, this.y - 36, 20, 20); // Draw the image above the Zharan's head
            }
        }

        this.drawGatheringProgress(ctx);
    }

    drawGatheringProgress(ctx) {
        if (this.gatheringFrom && this.gatheringTimer > 0) {
            const progress = this.gatheringTimer / this.gatheringDelay;
            const barWidth = 30;
            const barHeight = 5;
            
            ctx.fillStyle = "black";
            ctx.fillRect(this.x - barWidth/2, this.y - 25, barWidth, barHeight);
            
            ctx.fillStyle = "yellow";
            ctx.fillRect(this.x - barWidth/2, this.y - 25, barWidth * progress, barHeight);
        }
    }

    gatherResource(resources, tent) {
        // If full, head to the tent
        if (this.carrying.amount >= this.carryCapacity) {
            this.setTarget(tent.x + tent.width / 2, tent.y + tent.height / 2);
            this.gatheringFrom = null;
            this.gatheringTimer = 0;
        }

        // Check if we're at the tent and carrying resources
        if (this.carrying.amount > 0 && 
            Math.abs(this.x - (tent.x + tent.width / 2)) < 20 && 
            Math.abs(this.y - (tent.y + tent.height / 2)) < 20) {
                console.log("At tent, depositing resources");
                console.log("lastTargetedResource", this.lastTargetedResource);
            // Deposit resources
            eventBus.emit('resourceGathered', { type: this.carrying.type.name, amount: this.carrying.amount });
            this.carrying.type = null;
            this.carrying.amount = 0;
            // If there's a last targeted resource, go back to it
            if (this.lastTargetedResource) {
                this.setTarget(this.lastTargetedResource.x, this.lastTargetedResource.y);
            }
            return; // Exit the method after depositing
        }

        // If we're gathering from a resource
        if (this.gatheringFrom) {
            this.gatheringTimer++;
            if (this.gatheringTimer >= this.gatheringDelay) {
                this.lastTargetedResource = this.gatheringFrom;
                const amountToGather = Math.min(this.carryCapacity - this.carrying.amount, this.gatheringFrom.amount);
                if (amountToGather > 0) {
                    this.carrying.type = this.gatheringFrom.resourceType;
                    this.carrying.amount += amountToGather;
                    this.gatheringFrom.amount -= amountToGather;
                }
                this.gatheringTimer = 0;

                if (this.carrying.amount >= this.carryCapacity || this.gatheringFrom.amount <= 0) {
                    this.gatheringFrom = null;
                    this.setTarget(tent.x + tent.width / 2, tent.y + tent.height / 2);
                }
            }
        } else if (this.carrying.amount === 0) {
            // If we're not carrying anything, look for a resource to gather
            for (const resource of resources) {
                if (Math.abs(this.x - resource.x) < 20 && Math.abs(this.y - resource.y) < 20) {
                    this.gatheringFrom = resource;
                    this.gatheringTimer = 0;
                    break;
                }
            }
        }
    }
}

// Example of how to create a new unit type
class Knight extends Unit {
    constructor(x, y, image) {
        super('knight', x, y, 3, image); // Knights move faster than Zharan
        this.attackPower = 10;
        this.health = 100;
    }

    attack(target) {
        // Implement attack logic here
    }
}

const zharan = new Zharan(tent.x + tent.width/2, tent.y + tent.height, zharanImage);

gameState.units.push(zharan);

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

function drawTent() {
    if (tentImage.complete) {
        // Draw the tent image
        ctx.drawImage(tentImage, tent.x, tent.y, tent.width, tent.height);
    } else {
        // Fallback to drawing a rectangle if the image hasn't loaded
        ctx.fillStyle = "brown";
        ctx.fillRect(tent.x, tent.y, tent.width, tent.height);
        
        // Add an event listener to redraw once the image loads
        tentImage.onload = () => requestAnimationFrame(gameLoop);
    }
}

function drawClay() {
    if (clayImage.complete) {
        for (const clay of resources) {
            // Draw the clay image
            const imageWidth = 64;  // Adjust based on your image size
            const imageHeight = 64; // Adjust based on your image size
            ctx.drawImage(clay.image, clay.x - imageWidth/2, clay.y - imageHeight/2, imageWidth, imageHeight);
            
            // Draw the amount of clay remaining
            ctx.fillStyle = "white";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(clay.amount, clay.x, clay.y + imageHeight/2 + 20);
        }
    } else {
        // Fallback to drawing circles if the image hasn't loaded
        ctx.fillStyle = "brown";
        for (const clay of resources) {
            ctx.beginPath();
            ctx.arc(clay.x, clay.y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.font = "12px Arial";
            ctx.fillText(clay.amount, clay.x - 15, clay.y + 5);
            ctx.fillStyle = "brown";
        }
        
        // Add an event listener to redraw once the image loads
        clayImage.onload = () => requestAnimationFrame(gameLoop);
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
    drawTent();
    resources.forEach(resource => resource.draw(ctx));
    
    gameState.units.forEach(unit => {
        unit.move();
        if (unit instanceof Zharan) {
            unit.gatherResource(resources, tent);
        }
        unit.draw(ctx);
    });
    
    drawGameState();
    drawBuildMenu(); // Add this line to draw the build menu
    requestAnimationFrame(gameLoop);
}

let selectedZharan = null; // Variable to keep track of the selected Zharan

// Replace the openBuildMenu function with this
function openBuildMenu() {
    showBuildMenu = true;
}
let buildMenuX = 100;
let buildMenuY = 700;

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
    const knightCost = 50; // Set the cost for a knight
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
    const knight = new Knight(tent.x + tent.width/2, tent.y + tent.height, knightImage);
    gameState.units.push(knight)
}


// Add this function to handle clicks on the build menu
function handleBuildMenuClick(mouseX, mouseY) {

    if(!showBuildMenu)
    {
        return
    }

    const menuWidth = 200;
    const menuHeight = 100;
    const padding = 10;

    if (mouseX >= buildMenuX && mouseX <= buildMenuX + menuWidth &&
        mouseY >= buildMenuY && mouseY <= buildMenuY + menuHeight) {
        
        // Check if "Build Knight" is clicked
        if (mouseY >= buildMenuY + padding + 24 && mouseY <= buildMenuY + padding + 48) {
            const knightCost = 1;
            if (gameState.resources.Carrot >= knightCost) {
                buildKnight();
            }
        }
        
        // Check if "Close" is clicked
        if (mouseY >= buildMenuY + padding + 48) {
            showBuildMenu = false;
        }
    } else {
        console.log("setting show build to false")
        showBuildMenu = false;
    }
}

canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Prevent the default context menu from appearing

    // Get the mouse coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect(); // Get the canvas bounds
    const mouseX = event.clientX - rect.left; // Calculate the mouse X position
    const mouseY = event.clientY - rect.top;  // Calculate the mouse Y position

    console.log("Right click detected at:", mouseX, mouseY);

    // If a Zharan is selected, move it to the clicked position
    if (selectedZharan) {
        console.log("Moving Zharan to:", mouseX, mouseY); // Debugging statement
        selectedZharan.setTarget(mouseX, mouseY);
    }
    return; // Exit after handling right-click
});
// Existing click event listener
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    console.log("Left click detected");
    // Check if the Zharan is clicked first
    const clickedZharan = gameState.units.find(unit => unit instanceof Zharan && 
        Math.abs(mouseX - unit.x) < 20 && Math.abs(mouseY - unit.y) < 20);

    if (clickedZharan) {
        console.log("Zharan clicked"); // Debugging statement
        // Select the Zharan
        if (selectedZharan) {
            selectedZharan.selected = false; // Deselect previously selected Zharan
        }
        selectedZharan = clickedZharan;
        selectedZharan.selected = true; // Mark the clicked Zharan as selected
        return; // Exit to prevent further checks
    }
    console.log("No Zharan clicked"); // Debugging statement

    handleBuildMenuClick(mouseX, mouseY)

    // If no Zharan is selected and the tent is clicked, open the build menu
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

function closeBuildMenu() {
    const buildMenu = document.getElementById('buildMenu');
    buildMenu.style.display = 'none';
}

function buildStructure(type) {
    console.log(`Building ${type}...`);
    // Implement the logic to build the selected structure
    // For example, you might want to create a new instance of the structure
    closeBuildMenu(); // Close the menu after selection
}

