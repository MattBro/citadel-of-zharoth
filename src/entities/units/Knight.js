import { Unit } from './Unit.js';
import { gameState } from '../../systems/gameState.js';

export class Knight extends Unit {
    constructor(x, y, image, canvasWidth, canvasHeight) {
        super('Knight', x, y, gameState.config.unitSpeeds.knight, image, canvasWidth, canvasHeight);
        this.attackRange = 50;
        this.attackDamage = 10;
        this.lastAttackTime = 0;
        this.attackSpeed = 1000; // Attack cooldown in milliseconds
        this.selected = false;
        this.targetX = null;
        this.targetY = null;
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

    isWithinSelection(startX, startY, endX, endY) {
        return (this.x >= Math.min(startX, endX) && this.x <= Math.max(startX, endX) &&
                this.y >= Math.min(startY, endY) && this.y <= Math.max(startY, endY));
    }

    select() {
        this.selected = true;
    }

    deselect() {
        this.selected = false;
    }

    isSelected() {
        return this.selected;
    }

    moveToTarget() {
        if (this.targetX !== null && this.targetY !== null) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Move towards the target at a constant speed
            if (distance > 1) { // Prevent overshooting
                this.x += (dx / distance) * this.speed; // Assuming speed is defined
                this.y += (dy / distance) * this.speed;
            } else {
                // Reached the target
                this.x = this.targetX;
                this.y = this.targetY;
                this.targetX = null; // Reset target
                this.targetY = null; // Reset target
            }
        }
    }
}