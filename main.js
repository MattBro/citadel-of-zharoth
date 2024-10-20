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

const tent = {
    x: 100,
    y: 100,
    width: 200,  // Adjust this to match your image width
    height: 200  // Adjust this to match your image height
};

const gameState = {
    resources: {
        Clay: 0,
        Carrot: 0  // Changed from Wheat to Carrot
    },
    units: []
};

class Resource {
    constructor(name, imageSrc, x, y, amount) {
        this.name = name;
        this.image = new Image();
        this.image.src = imageSrc;
        this.x = x;
        this.y = y;
        this.amount = amount;
    }

    draw(ctx) {
        if (this.image.complete) {
            const imageWidth = 64;  // Adjust based on your image size
            const imageHeight = 64; // Adjust based on your image size
            ctx.drawImage(this.image, this.x - imageWidth/2, this.y - imageHeight/2, imageWidth, imageHeight);
            
            ctx.fillStyle = "white";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.amount, this.x, this.y + imageHeight/2 + 20);
        }
    }
}

const resources = [
    new Resource("Clay", "clay.png", 600, 300, 1000),
    new Resource("Clay", "clay.png", 600, 500, 1000),
    new Resource("Carrot", "carrot.png", 400, 400, 1000)
];

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
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
}

// Zharan class extending Unit
class Zharan extends Unit {
    constructor(x, y, image) {
        super('zharan', x, y, .5, image);
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
            let dotColor = this.carrying.type === 'Clay' ? "brown" : "orange";
            ctx.fillStyle = dotColor;
            ctx.beginPath();
            ctx.arc(this.x, this.y - 26, 5, 0, Math.PI * 2);
            ctx.fill();
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
            // Deposit resources
            eventBus.emit('resourceGathered', { type: this.carrying.type, amount: this.carrying.amount });
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
                const amountToGather = Math.min(this.carryCapacity - this.carrying.amount, this.gatheringFrom.amount);
                if (amountToGather > 0) {
                    this.carrying.type = this.gatheringFrom.name;
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

const zharan = new Zharan(150, 150, zharanImage);

const knight = new Knight(200, 200, knightImage);
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
    gameState.resources[data.type] += data.amount;
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

    // First, calculate the widths of all resource texts
    const resourceWidths = Object.entries(gameState.resources).map(([resourceName, amount]) => {
        const resourceText = `${resourceName}: ${amount}`;
        return ctx.measureText(resourceText).width;
    });

    // Find the maximum width to use for all backgrounds
    const maxWidth = Math.max(...resourceWidths);

    Object.entries(gameState.resources).forEach(([resourceName, amount], index) => {
        const resourceText = `${resourceName}: ${amount}`;
        
        // Create a semi-transparent background for the text
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(x, y, maxWidth + padding * 2, 34);

        // Add a text shadow for depth
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Use a gradient for the text color
        let gradient = ctx.createLinearGradient(x, y, x, y + 34);
        gradient.addColorStop(0, "#FFD700");  // Gold color at the top
        gradient.addColorStop(1, "#FFA500");  // Orange color at the bottom

        ctx.fillStyle = gradient;
        ctx.fillText(resourceText, 50+ x + padding, y + 20);

        // Reset shadow to prevent affecting other drawings
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Move x position for the next resource counter
        x += maxWidth + padding * 2 + spacing;
    });
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawTent();
    resources.forEach(resource => resource.draw(ctx));
    gameState.units.forEach(unit => {
        unit.move();
        unit.draw(ctx);
        if (unit instanceof Zharan) {
            unit.gatherResource(resources, tent);
        }
    });
    drawGameState();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    for (const resource of resources) {
        const dx = resource.x - x;
        const dy = resource.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 30) {
            zharan.lastTargetedResource = resource;
            break;
        }
    }
    
    zharan.setTarget(x, y);
    zharan.gatheringFrom = null;
});

gameLoop();

// Add error handling for the image load
backgroundImage.onerror = function() {
    console.error("Error loading the background image");
    // You might want to set a flag here to prevent further attempts to load the image
};

// You might want to adjust Zharan's properties to account for the image size
zharan.radius = 16; // Adjust this if needed for collision detection












