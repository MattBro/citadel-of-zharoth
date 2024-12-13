import { Unit } from './Unit.js';
import { gameState } from '../../systems/gameState.js';

export class Knight extends Unit {
    constructor(x, y, image, canvasWidth, canvasHeight) {
        super('Knight', x, y, gameState.config.unitSpeeds.knight, image, canvasWidth, canvasHeight);
        this.attackRange = 50;
        this.attackDamage = 10;
        this.lastAttackTime = 0;
        this.attackSpeed = 1000; // Attack cooldown in milliseconds
    }

    gatherResource() {
        // Knights can't gather resources
        return;
    }

    dropOffResource() {
        // Knights don't carry resources
        return;
    }

    draw(ctx) {
        super.draw(ctx);
        // You could add knight-specific visual effects here
    }
} 