import { Unit } from './Unit.js';
import { gameState } from '../../systems/gameState.js';

export class Knight extends Unit {
    constructor(x, y, image, canvasWidth, canvasHeight, tent) {
        super('Knight', x, y, gameState.config.unitSpeeds.knight, image, canvasWidth, canvasHeight);
        this.tent = tent;
        this.maxHealth = 10;
        this.health = this.maxHealth;
        this.attackDamage = 5;
        this.lastAttackTime = 0;
        this.attackRange = 50;
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

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    attack(target) {
        const now = performance.now();
        const timeSinceLastAttack = (now - this.lastAttackTime) / 1000;
        
        if (timeSinceLastAttack >= 1) {
            target.takeDamage(this.attackDamage);
            this.lastAttackTime = now;
        }
    }

    draw(ctx) {
        super.draw(ctx);
        // Draw health bar
        const barWidth = 32;
        const barHeight = 5;
        const healthPercent = this.health / this.maxHealth;
        
        // Background
        ctx.fillStyle = "red";
        ctx.fillRect(
            this.x - 16,
            this.y - 25,
            barWidth,
            barHeight
        );
        
        // Health
        ctx.fillStyle = "green";
        ctx.fillRect(
            this.x - 16,
            this.y - 25,
            barWidth * healthPercent,
            barHeight
        );
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

    move(objects) {
        if (gameState.monster) {
            // If monster exists, check if we're in attack range
            const dx = gameState.monster.x - this.x;
            const dy = gameState.monster.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.attackRange) {
                // Attack the monster
                this.attack(gameState.monster);
                return;
            }
        }

        // Otherwise, continue with normal movement
        super.move(objects);
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