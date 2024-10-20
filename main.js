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
    clay: 0  // Changed from minerals to clay
};

const clayPatches = [  // Changed from mineralPatches to clayPatches
    { x: 600, y: 300, amount: 1000 },
    { x: 600, y: 500, amount: 1000 }
];

const zharan = {
    x: 150,
    y: 150,
    radius: 10,
    speed: 1,
    carrying: 0,
    carryCapacity: 1,
    targetX: null,
    targetY: null,
    gatheringFrom: null,
    lastTargetedClay: null,
    gatheringTimer: 0,
    gatheringDelay: 300 // 2 seconds at 60 FPS
};

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
        for (const clay of clayPatches) {
            // Draw the clay image
            const imageWidth = 64;  // Adjust based on your image size
            const imageHeight = 64; // Adjust based on your image size
            ctx.drawImage(clayImage, clay.x - imageWidth/2, clay.y - imageHeight/2, imageWidth, imageHeight);
            
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
        for (const clay of clayPatches) {
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
        // Draw Zharan's image
        const imageWidth = 32; // Adjust this based on your image size
        const imageHeight = 32; // Adjust this based on your image size
        ctx.drawImage(zharanImage, zharan.x - imageWidth/2, zharan.y - imageHeight/2, imageWidth, imageHeight);
        
        // If Zharan is carrying clay, draw an indicator
        if (zharan.carrying > 0) {
            ctx.fillStyle = "brown";
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

function gatherClay() {
    if (zharan.gatheringFrom) {
        const clay = zharan.gatheringFrom;
        if (clay.amount > 0 && zharan.carrying < zharan.carryCapacity) {
            // Increment the gathering timer
            zharan.gatheringTimer++;
            
            // If the gathering delay has passed, collect clay
            if (zharan.gatheringTimer >= zharan.gatheringDelay) {
                clay.amount--;
                zharan.carrying++;
                zharan.gatheringTimer = 0; // Reset the timer
            }
        } else if (zharan.carrying === zharan.carryCapacity || clay.amount === 0) {
            zharan.targetX = commandCenter.x + commandCenter.width / 2;
            zharan.targetY = commandCenter.y + commandCenter.height / 2;
            zharan.gatheringFrom = null;
            zharan.gatheringTimer = 0; // Reset the timer
        }
    } else {
        // If Zharan is at the command center and has a last targeted clay patch
        if (zharan.lastTargetedClay && 
            Math.abs(zharan.x - (commandCenter.x + commandCenter.width / 2)) < 5 &&
            Math.abs(zharan.y - (commandCenter.y + commandCenter.height / 2)) < 5) {
            // Check if the last targeted clay patch still has clay
            if (zharan.lastTargetedClay.amount > 0) {
                zharan.targetX = zharan.lastTargetedClay.x;
                zharan.targetY = zharan.lastTargetedClay.y;
            } else {
                // If the clay patch is empty, clear the last targeted clay
                zharan.lastTargetedClay = null;
            }
        }
        
        // Check if Zharan is near any clay patch
        for (const clay of clayPatches) {
            const dx = clay.x - zharan.x;
            const dy = clay.y - zharan.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 30 && clay.amount > 0) {
                zharan.gatheringFrom = clay;
                zharan.lastTargetedClay = clay;  // Remember this clay patch
                break;
            }
        }
    }

    if (zharan.carrying > 0) {
        const dx = commandCenter.x + commandCenter.width / 2 - zharan.x;
        const dy = commandCenter.y + commandCenter.height / 2 - zharan.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 30) {
            gameState.clay += zharan.carrying;
            zharan.carrying = 0;
            zharan.gatheringTimer = 0; // Reset the timer
            if (zharan.lastTargetedClay && zharan.lastTargetedClay.amount > 0) {
                zharan.targetX = zharan.lastTargetedClay.x;
                zharan.targetY = zharan.lastTargetedClay.y;
            }
        }
    }
}

function drawGameState() {
    const clayText = `Clay: ${gameState.clay}`;
    
    // Measure the width of the text
    ctx.font = "bold 24px Arial";
    const textWidth = ctx.measureText(clayText).width;
    
    // Create a semi-transparent background for the text
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(10, 10, textWidth + 13, 34); // Moved down and right, increased height

    // Add a text shadow for depth
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Use a gradient for the text color
    let gradient = ctx.createLinearGradient(10, 10, 10, 40);
    gradient.addColorStop(0, "#FFD700");  // Gold color at the top
    gradient.addColorStop(1, "#FFA500");  // Orange color at the bottom

    ctx.fillStyle = gradient;
    ctx.fillText(clayText, 55, 30); // Moved down and right

    // Reset shadow to prevent affecting other drawings
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
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
    drawClay();
    drawZharan();
    drawGatheringProgress(); // Add this line
    drawGameState();
    moveZharan();
    gatherClay();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
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
