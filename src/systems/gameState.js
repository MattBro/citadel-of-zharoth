import { ResourceType } from "../classes/ResourceType.js";

export const clayType = new ResourceType("Clay", "clay.png");
export const ironstoneType = new ResourceType("Ironstone", "ironstone.png")
export const carrotType = new ResourceType("Carrot", "carrot.png")

export const gameState = {
    resources: {
        Clay: {type:clayType, amount:0},
        Carrot: {type:carrotType, amount:0},
        Ironstone: {type:ironstoneType, amount:0},
    },
    units: [],
    selectedUnit: null
};