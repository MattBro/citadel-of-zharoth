const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// At the top of your file, add this line to create an Image object
const backgroundImage = new Image();
backgroundImage.src = 'grassy-background.png'; // Remove the '@' symbol

const commandCenter = {
    x: 100,
    y: 100,
    width: 100,
    height: 100
};

const gameState = {
    clay: 0  // Changed from minerals to clay
};

const clayPatches = [  // Changed from mineralPatches to clayPatches
    { x: 300, y: 200, amount: 1000 },
    { x: 500, y: 400, amount: 1000 }
];

const zharan = {
    x: 150,
    y: 150,
    radius: 10,
    speed: 2,
    carrying: 0,
    carryCapacity: 8,
    targetX: null,
    targetY: null,
    gatheringFrom: null
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
    ctx.fillStyle = "blue";
    ctx.fillRect(commandCenter.x, commandCenter.y, commandCenter.width, commandCenter.height);
}

function drawClay() {  // Changed from drawMinerals to drawClay
    ctx.fillStyle = "brown";  // Changed color to brown for clay
    for (const clay of clayPatches) {
        ctx.beginPath();
        ctx.arc(clay.x, clay.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";  // Changed to white for better contrast
        ctx.font = "12px Arial";
        ctx.fillText(clay.amount, clay.x - 15, clay.y + 5);
        ctx.fillStyle = "brown";  // Reset to brown
    }
}

function drawZharan() {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(zharan.x, zharan.y, zharan.radius, 0, Math.PI * 2);
    ctx.fill();
    if (zharan.carrying > 0) {
        ctx.fillStyle = "cyan";
        ctx.beginPath();
        ctx.arc(zharan.x, zharan.y - 15, 5, 0, Math.PI * 2);
        ctx.fill();
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
            clay.amount--;
            zharan.carrying++;
        } else if (zharan.carrying === zharan.carryCapacity) {
            zharan.targetX = commandCenter.x + commandCenter.width / 2;
            zharan.targetY = commandCenter.y + commandCenter.height / 2;
            zharan.gatheringFrom = null;
        }
    } else {
        for (const clay of clayPatches) {
            const dx = clay.x - zharan.x;
            const dy = clay.y - zharan.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 30) {
                zharan.gatheringFrom = clay;
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
            if (zharan.gatheringFrom) {
                zharan.targetX = zharan.gatheringFrom.x;
                zharan.targetY = zharan.gatheringFrom.y;
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
    ctx.fillRect(5, 5, textWidth + 20, 30); // Add some padding

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
    ctx.fillText(clayText, 10, 30);

    // Reset shadow to prevent affecting other drawings
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawCommandCenter();
    drawClay();
    drawZharan();
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
