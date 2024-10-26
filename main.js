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

class GameObject {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    // Method to check collision with another GameObject with a buffer
    isColliding(otherObject, buffer = 0) {
        return !(this.x + this.width + buffer < otherObject.x ||
                 this.x - buffer > otherObject.x + otherObject.width ||
                 this.y + this.height + buffer < otherObject.y ||
                 this.y - buffer > otherObject.y + otherObject.height);
    }
}



class Tent extends GameObject {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.image = tentImage; // Assuming tentImage is defined elsewhere
    }
    
    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Fallback drawing if the image isn't loaded
            ctx.fillStyle = "brown";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

const tent = new Tent(100, 100, 100, 100); // Example position and size


class ResourceType {
    constructor(name, imageSrc){
        this.name = name;
        this.image = new Image();
        this.image.src = imageSrc;
    }
}

class Resource extends GameObject {
    constructor(resourceType, x, y, amount) {
        super(x, y, 64, 64); // Example dimensions for resources
        this.resourceType = resourceType;
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

    isPointInside(px, py) {
        return (px >= this.x - this.width / 2 && px <= this.x + this.width / 2 &&
                py >= this.y - this.height / 2 && py <= this.y + this.height / 2);
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



class Unit extends GameObject {
    constructor(type, x, y, speed, image, selected) {
        super(x, y, 32, 32); // Example dimensions; adjust as needed
        this.type = type;
        this.speed = speed;
        this.image = image;
        this.selected = selected || false;
        this.targetX = null;
        this.targetY = null;
    }

    move(objects) {
        if (this.targetX === null || this.targetY === null) {
            return;
        }
    
        // Calculate direction to target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        // Check if the unit is close enough to gather resources
        if (this.gatheringFrom){
            if(Math.sqrt(
            (this.x - this.gatheringFrom.x) ** 2 + 
            (this.y - this.gatheringFrom.y) ** 2
            ) <= 50) { // Assuming 50 pixels is the gathering range
                this.gatherResource(tent); // Call gatherResource if close enough
                return
            }
        }
        

        if(this.dropOffResource)
            this.dropOffResource()
    
        // If we're close enough to target, snap to it and stop
        if (distanceToTarget < this.speed) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.targetX = null;
            this.targetY = null;
            return;
        }
    
        // Calculate base movement direction
        const normalizedDx = dx / distanceToTarget;
        const normalizedDy = dy / distanceToTarget;
    
        // Initialize position changes
        let moveX = normalizedDx * this.speed;
        let moveY = normalizedDy * this.speed;
    
        // Enhanced obstacle avoidance
        const avoidanceRadius = this.width * 1.5; // Increased radius to start avoiding earlier
        const avoidanceStrength = 2.0; // Increased strength for stronger avoidance
        let totalAvoidanceX = 0;
        let totalAvoidanceY = 0;
    
        // Check each object for collision avoidance
        objects.forEach(obj => {
            if (obj === this) return; // Skip self
    
            // Calculate distance to object
            const objDx = obj.x - this.x;
            const objDy = obj.y - this.y;
            const distanceToObj = Math.sqrt(objDx * objDx + objDy * objDy);
            
            // Calculate minimum safe distance (sum of both objects' radii plus buffer)
            const safeDistance = (this.width + obj.width) / 2 + 10;  // Added 10px buffer
    
            // If object is within avoidance radius
            if (distanceToObj < avoidanceRadius) {
                // Calculate avoidance force (exponentially stronger when closer)
                const avoidanceFactor = Math.pow((avoidanceRadius - distanceToObj) / avoidanceRadius, 2);
                
                // If we're very close, apply maximum avoidance
                if (distanceToObj < safeDistance) {
                    const emergencyStrength = 3.0;  // Stronger avoidance for imminent collisions
                    totalAvoidanceX -= (objDx / distanceToObj) * emergencyStrength;
                    totalAvoidanceY -= (objDy / distanceToObj) * emergencyStrength;
                } else {
                    // Normal avoidance behavior
                    totalAvoidanceX -= (objDx / distanceToObj) * avoidanceFactor * avoidanceStrength;
                    totalAvoidanceY -= (objDy / distanceToObj) * avoidanceFactor * avoidanceStrength;
    
                    // Add perpendicular avoidance component for smoother circulation
                    totalAvoidanceX += (objDy / distanceToObj) * avoidanceFactor * 0.5;
                    totalAvoidanceY += (-objDx / distanceToObj) * avoidanceFactor * 0.5;
                }
            }
        });
    
        // Add avoidance to movement with weight balancing
        const targetWeight = 0.7;  // Maintain some focus on target
        const avoidanceWeight = 1.0;  // Full weight to avoidance
        
        moveX = (moveX * targetWeight) + (totalAvoidanceX * avoidanceWeight);
        moveY = (moveY * targetWeight) + (totalAvoidanceY * avoidanceWeight);
    
        // Normalize combined movement vector if it exceeds speed
        const moveLength = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveLength > this.speed) {
            moveX = (moveX / moveLength) * this.speed;
            moveY = (moveY / moveLength) * this.speed;
        }
    
        // Preview next position
        const nextX = this.x + moveX;
        const nextY = this.y + moveY;
    
        // Boundary checking
        const margin = this.width / 2;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
    
        // Keep unit within canvas bounds
        this.x = Math.max(margin, Math.min(canvasWidth - margin, nextX));
        this.y = Math.max(margin, Math.min(canvasHeight - margin, nextY));
    }

    draw(ctx) {
        // Draw the unit's image
        if (this.image?.complete) {
            ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
        // Draw selection highlight
        this.drawSelectionHighlight(ctx);
    }

    drawSelectionHighlight(ctx) {
        if (this.selected) {
            ctx.shadowColor = 'rgba(0, 150, 255, 0.2)';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const radius = 10;
            ctx.moveTo(this.x - this.width / 2 + radius, this.y - this.height / 2);
            ctx.lineTo(this.x + this.width / 2 - radius, this.y - this.height / 2);
            ctx.quadraticCurveTo(this.x + this.width / 2, this.y - this.height / 2, this.x + this.width / 2, this.y - this.height / 2 + radius);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2 - radius);
            ctx.quadraticCurveTo(this.x + this.width / 2, this.y + this.height / 2, this.x + this.width / 2 - radius, this.y + this.height / 2);
            ctx.lineTo(this.x - this.width / 2 + radius, this.y + this.height / 2);
            ctx.quadraticCurveTo(this.x - this.width / 2, this.y + this.height / 2, this.x - this.width / 2, this.y + this.height / 2 - radius);
            ctx.lineTo(this.x - this.width / 2, this.y - this.height / 2 + radius);
            ctx.quadraticCurveTo(this.x - this.width / 2, this.y - this.height / 2, this.x - this.width / 2 + radius, this.y - this.height / 2);
            ctx.closePath();
            ctx.stroke();
            ctx.shadowBlur = 0;
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
    }

    draw(ctx) {
        // Draw the Zharan unit
        super.draw(ctx);

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

    dropOffResource(){
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
                this.gatheringFrom = this.lastTargetedResource
                this.setTarget(this.lastTargetedResource.x, this.lastTargetedResource.y);
            return; // Exit the method after depositing
        }
    }

    gatherResource(tent) {
        // If full, head to the tent
        if (this.carrying.amount >= this.carryCapacity) {
            this.setTarget(tent.x + tent.width / 2, tent.y + tent.height / 2);
            this.gatheringFrom = null;
            this.gatheringTimer = 0;
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

    draw(ctx) {
        // Draw the Knight unit
        super.draw(ctx); // Call the parent draw method
    }

    attack(target) {
        // Implement attack logic here
    }
}

const zharan = new Zharan(tent.x + tent.width/2, tent.y + tent.height + 20, zharanImage);

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
            console.log("clicked menu")
            
            // Check if "Build Knight" is clicked
        if (mouseY >= buildMenuY + padding + 24 && mouseY <= buildMenuY + padding + 48) {
            const knightCost = 1;
            if (gameState.resources.Carrot.amount >= knightCost) {
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

        for (const resource of resources) {
            if (resource.isPointInside(mouseX, mouseY)) {
                // Set the target for the selected unit to gather from this resource
                if (selectedZharan) { // Assuming selectedZharan is the currently selected unit
                    selectedZharan.gatheringFrom = resource; // Set the resource to gather from
                    selectedZharan.lastTargetedResource = resource;
                    selectedZharan.gatheringTimer = 0; // Reset the gathering timer
                    console.log(`Gathering from ${resource.resourceType.name}`);
                }
                break; // Exit the loop once we find the clicked resource
            }
        }
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

    // Check if the Knight is clicked
    const clickedKnight = gameState.units.find(unit => unit instanceof Knight && 
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
    } else if (clickedKnight) {
        console.log("Knight clicked"); // Debugging statement
        // Select the Knight
        if (selectedZharan) {
            selectedZharan.selected = false; // Deselect previously selected Zharan
        }
        selectedZharan = clickedKnight; // You can reuse selectedZharan for both units
        selectedZharan.selected = true; // Mark the clicked Knight as selected
        return; // Exit to prevent further checks
    }

    console.log("No unit clicked"); // Debugging statement

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










