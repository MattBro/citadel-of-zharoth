const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// At the top of your file, add this line to create an Image object
const backgroundImage = new Image();
backgroundImage.src = 'grassy-background.png'; // Remove the '@' symbol

// At the top of your file, add this line to create an Image object for Zharan
const zharanImage = new Image();
zharanImage.src = 'zharan-villager-transparent.png';

// At the top of your file, add this line to create an Image object for the tent
const tentImage = new Image();
tentImage.src = 'tent.png';

// At the top of your file, add this line to create an Image object for the clay
const clayImage = new Image();
clayImage.src = 'clay.png';

const commandCenter = {
    x: 100,
    y: 100,
    width: 200,  // Adjust this to match your image width
    height: 200  // Adjust this to match your image height
};

const gameState = {
    resources: {
        Clay: 0,
        Carrot: 0  // Changed from Wheat to Carrot
    }
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

const zharan = {
    x: 150,
    y: 150,
    radius: 10,
    speed: .5,
    carrying: {
        type: null,
        amount: 0
    },
    carryCapacity: 1,
    targetX: null,
    targetY: null,
    gatheringFrom: null,
    lastTargetedResource: null,  // Change from lastTargetedClay
    gatheringTimer: 0,
    gatheringDelay: 300 // 2 seconds at 60 FPS
};

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

function drawCommandCenter() {
    if (tentImage.complete) {
        // Draw the tent image
        ctx.drawImage(tentImage, commandCenter.x, commandCenter.y, commandCenter.width, commandCenter.height);
    } else {
        // Fallback to drawing a rectangle if the image hasn't loaded
        ctx.fillStyle = "brown";
        ctx.fillRect(commandCenter.x, commandCenter.y, commandCenter.width, commandCenter.height);
        
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

function drawZharan() {
    if (zharanImage.complete) {
        const imageWidth = 32; // Adjust this based on your image size
        const imageHeight = 32; // Adjust this based on your image size
        ctx.drawImage(zharanImage, zharan.x - imageWidth/2, zharan.y - imageHeight/2, imageWidth, imageHeight);
        
        // If Zharan is carrying resources, draw an indicator
        if (zharan.carrying.amount > 0) {
            let dotColor;
            switch(zharan.carrying.type) {
                case 'Clay':
                    dotColor = "brown";
                    break;
                case 'Carrot':
                    dotColor = "orange";
                    break;
                default:
                    dotColor = "red"; // Fallback color
            }
            ctx.fillStyle = dotColor;
            ctx.beginPath();
            ctx.arc(zharan.x, zharan.y - imageHeight/2 - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Fallback to drawing a circle if the image hasn't loaded
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(zharan.x, zharan.y, zharan.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add an event listener to redraw once the image loads
        zharanImage.onload = () => requestAnimationFrame(gameLoop);
    }
}

function moveZharan() {
    if (zharan.targetX !== null && zharan.targetY !== null) {
        const dx = zharan.targetX - zharan.x;
        const dy = zharan.targetY - zharan.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > zharan.speed) {
            zharan.x += (dx / distance) * zharan.speed;
            zharan.y += (dy / distance) * zharan.speed;
        } else {
            zharan.x = zharan.targetX;
            zharan.y = zharan.targetY;
            zharan.targetX = null;
            zharan.targetY = null;
        }
    }
}

function gatherResource() {
    if (zharan.gatheringFrom) {
        const resource = zharan.gatheringFrom;
        if (resource.amount > 0 && zharan.carrying.amount < zharan.carryCapacity) {
            zharan.gatheringTimer++;
            
            if (zharan.gatheringTimer >= zharan.gatheringDelay) {
                resource.amount--;
                zharan.carrying.type = resource.name;
                zharan.carrying.amount++;
                zharan.gatheringTimer = 0;
                // Remove the event emission from here
            }
        } else if (zharan.carrying.amount === zharan.carryCapacity || resource.amount === 0) {
            zharan.targetX = commandCenter.x + commandCenter.width / 2;
            zharan.targetY = commandCenter.y + commandCenter.height / 2;
            zharan.gatheringFrom = null;
            zharan.gatheringTimer = 0;
        }
    } else {
        // Check if Zharan is near any resource
        for (const resource of resources) {
            const dx = resource.x - zharan.x;
            const dy = resource.y - zharan.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 30 && resource.amount > 0) {
                zharan.gatheringFrom = resource;
                zharan.lastTargetedResource = resource;  // Remember this resource
                break;
            }
        }
    }

    if (zharan.carrying.amount > 0) {
        const dx = commandCenter.x + commandCenter.width / 2 - zharan.x;
        const dy = commandCenter.y + commandCenter.height / 2 - zharan.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 30) {
            // Emit the event here, when Zharan returns to the command center
            eventBus.emit('resourceGathered', { type: zharan.carrying.type, amount: zharan.carrying.amount });
            
            zharan.carrying.amount = 0;
            zharan.carrying.type = null;
            zharan.gatheringTimer = 0; // Reset the timer
            if (zharan.lastTargetedResource && zharan.lastTargetedResource.amount > 0) {
                zharan.targetX = zharan.lastTargetedResource.x;
                zharan.targetY = zharan.lastTargetedResource.y;
            }
        }
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

function drawGatheringProgress() {
    if (zharan.gatheringFrom && zharan.gatheringTimer > 0) {
        const progress = zharan.gatheringTimer / zharan.gatheringDelay;
        const barWidth = 30;
        const barHeight = 5;
        
        ctx.fillStyle = "black";
        ctx.fillRect(zharan.x - barWidth/2, zharan.y - 25, barWidth, barHeight);
        
        ctx.fillStyle = "yellow";
        ctx.fillRect(zharan.x - barWidth/2, zharan.y - 25, barWidth * progress, barHeight);
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawCommandCenter();
    resources.forEach(resource => resource.draw(ctx));
    drawZharan();
    drawGatheringProgress();
    drawGameState();
    moveZharan();
    gatherResource();
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
    
    zharan.targetX = x;
    zharan.targetY = y;
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






