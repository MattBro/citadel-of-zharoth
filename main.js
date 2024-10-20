const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const commandCenter = {
    x: 100,
    y: 100,
    width: 100,
    height: 100
};

const gameState = {
    minerals: 0
};

const mineralPatches = [
    { x: 300, y: 200, amount: 1000 },
    { x: 500, y: 400, amount: 1000 }
];

const scv = {
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
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCommandCenter() {
    ctx.fillStyle = "blue";
    ctx.fillRect(commandCenter.x, commandCenter.y, commandCenter.width, commandCenter.height);
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(`Minerals: ${gameState.minerals}`, 10, 30);
}

function drawMinerals() {
    ctx.fillStyle = "cyan";
    for (const mineral of mineralPatches) {
        ctx.beginPath();
        ctx.arc(mineral.x, mineral.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.fillText(mineral.amount, mineral.x - 15, mineral.y + 5);
        ctx.fillStyle = "cyan";
    }
}

function drawSCV() {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(scv.x, scv.y, scv.radius, 0, Math.PI * 2);
    ctx.fill();
    if (scv.carrying > 0) {
        ctx.fillStyle = "cyan";
        ctx.beginPath();
        ctx.arc(scv.x, scv.y - 15, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function moveSCV() {
    if (scv.targetX !== null && scv.targetY !== null) {
        const dx = scv.targetX - scv.x;
        const dy = scv.targetY - scv.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > scv.speed) {
            scv.x += (dx / distance) * scv.speed;
            scv.y += (dy / distance) * scv.speed;
        } else {
            scv.x = scv.targetX;
            scv.y = scv.targetY;
            scv.targetX = null;
            scv.targetY = null;
        }
    }
}

function gatherMinerals() {
    if (scv.gatheringFrom) {
        const mineral = scv.gatheringFrom;
        if (mineral.amount > 0 && scv.carrying < scv.carryCapacity) {
            mineral.amount--;
            scv.carrying++;
        } else if (scv.carrying === scv.carryCapacity) {
            scv.targetX = commandCenter.x + commandCenter.width / 2;
            scv.targetY = commandCenter.y + commandCenter.height / 2;
            scv.gatheringFrom = null;
        }
    } else {
        for (const mineral of mineralPatches) {
            const dx = mineral.x - scv.x;
            const dy = mineral.y - scv.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 30) {
                scv.gatheringFrom = mineral;
                break;
            }
        }
    }

    if (scv.carrying > 0) {
        const dx = commandCenter.x + commandCenter.width / 2 - scv.x;
        const dy = commandCenter.y + commandCenter.height / 2 - scv.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 30) {
            gameState.minerals += scv.carrying;
            scv.carrying = 0;
            if (scv.gatheringFrom) {
                scv.targetX = scv.gatheringFrom.x;
                scv.targetY = scv.gatheringFrom.y;
            }
        }
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();  // Add this line
    drawCommandCenter();
    drawMinerals();
    drawSCV();
    moveSCV();
    gatherMinerals();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    scv.targetX = x;
    scv.targetY = y;
    scv.gatheringFrom = null;
});

gameLoop();
