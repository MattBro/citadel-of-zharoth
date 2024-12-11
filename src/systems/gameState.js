import { ResourceType } from "../classes/ResourceType.js";
import { Resource } from "../classes/Resource.js";

export const clayType = new ResourceType("Clay", "clay.png");
export const ironstoneType = new ResourceType("Ironstone", "ironstone.png")
export const carrotType = new ResourceType("Carrot", "carrot.png")

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
    tent: null
};