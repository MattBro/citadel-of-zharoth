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
        this.width = 32;  // For collision detection
        this.height = 32; // For collision detection
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

    isColliding(obj1, obj2) {
        return !(obj1.x + obj1.width < obj2.x ||
                obj1.x > obj2.x + obj2.width ||
                obj1.y + obj1.height < obj2.y ||
                obj1.y > obj2.y + obj2.height);
    }

    isInAttackRange(target) {
        // Add a larger buffer for attack range since monsters are big
        const attackRange = 60;  // Increased attack range
        const targetWidth = target.size ? target.size.width : target.width;
        const targetHeight = target.size ? target.size.height : target.height;
        
        // Calculate centers
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If we're within attack range of the target's edge
        return distance <= (targetWidth / 2) + attackRange;
    }

    takeDamage(amount) {
        super.takeDamage(amount);
    }

    attack(target) {
        const now = performance.now();
        const timeSinceLastAttack = (now - this.lastAttackTime) / 1000;
        
        if (timeSinceLastAttack >= 1) {
            target.takeDamage(this.attackDamage);
            this.lastAttackTime = now;
        }
    }

    move(objects) {
        // Include monsters in the objects to check for collisions
        const allObjects = [...objects, ...gameState.monsters];

        if (gameState.monsters.length > 0) {
            // Check for any nearby monsters
            for (const monster of gameState.monsters) {
                if (this.isInAttackRange(monster)) {
                    // Attack the closest monster
                    this.attack(monster);
                    return;
                }
            }
        }

        // Continue with normal movement, but use allObjects for collision checks
        super.move(allObjects);
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