import { ResourceType } from "../entities/resources/ResourceType.js";
import { Resource } from "../entities/resources/Resource.js";

export const clayType = new ResourceType("Clay", "clay.png");
export const ironstoneType = new ResourceType("Ironstone", "ironstone.png")
export const carrotType = new ResourceType("Carrot", "carrot.png")

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

export const gameState = {
    resources: {
        Clay: {type:clayType, amount:0},
        Carrot: {type:carrotType, amount:0},
        Ironstone: {type:ironstoneType, amount:0},
    },
    resourceNodes: [
        new Resource(clayType, 600, 300, 1000),
        new Resource(ironstoneType, 600, 500, 1000),
        new Resource(carrotType, 400, 400, 1000)
    ],
    units: [],
    selectedUnit: null,
    tent: null,
    ui: {
        buildMenu: {
            isOpen: false,
            position: {
                x: 100,
                y: 700
            }
        }
    },
    events: eventBus,
    config: {
        costs: {
            knight: 1
        },
        unitSpeeds: {
            knight: 2,
            zharan: 3
        }
    },
    timer: {
        countdown: 60,
        lastTime: performance.now()
    },
    canvas: {
        width: 1000,
        height: 800,
        context: null
    },
    images: {
        background: new Image(),
        zharan: new Image(),
        knight: new Image(),
        tent: new Image(),
        clay: new Image()
    }
};

// Initialize images
gameState.images.background.src = '/grassy-background.png';
gameState.images.zharan.src = '/zharan.png';
gameState.images.knight.src = '/knight.png';
gameState.images.tent.src = '/tent.png';
gameState.images.clay.src = '/clay.png';

// Add error handlers
Object.entries(gameState.images).forEach(([name, img]) => {
    img.onerror = () => console.error(`Error loading image: ${name}`);
});