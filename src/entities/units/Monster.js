import { Unit } from './Unit.js';
import { gameState } from '../../systems/gameState.js';
import { Knight } from './Knight.js';

export class Monster extends Unit {
    constructor(x, y, image) {
        super('monster', x, y, 2, image, gameState.canvas.width, gameState.canvas.height);
        this.size = {
            width: 100,
            height: 100
        };
        this.width = this.size.width;  // For collision detection
        this.height = this.size.height; // For collision detection
        this.maxHealth = 10;
        this.health = this.maxHealth;
        this.attackDamage = 5; // damage per second
        this.lastAttackTime = 0;
        this.attackRange = this.size.width * 1.1;
    }

    findClosestTarget() {
        // First check for knights
        let closestKnight = null;
        let closestKnightDistance = Infinity;

        for (const unit of gameState.units) {
            if (unit instanceof Knight) {
                const dx = unit.x - this.x;
                const dy = unit.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestKnightDistance) {
                    closestKnight = unit;
                    closestKnightDistance = distance;
                }
            }
        }

        // If we found a knight, return it and its distance
        if (closestKnight) {
            return { target: closestKnight, distance: closestKnightDistance };
        }

        // Otherwise, target the tent
        const tentCenterX = gameState.tent.x + gameState.tent.width/2;
        const tentCenterY = gameState.tent.y + gameState.tent.height/2;
        const dx = tentCenterX - this.x;
        const dy = tentCenterY - this.y;
        const tentDistance = Math.sqrt(dx * dx + dy * dy);

        return { target: gameState.tent, distance: tentDistance };
    }

    attack(target) {
        const now = performance.now();
        const timeSinceLastAttack = (now - this.lastAttackTime) / 1000;
        
        if (timeSinceLastAttack >= 1) {
            target.takeDamage(this.attackDamage);
            this.lastAttackTime = now;
        }
    }

    update(deltaTime) {
        const { target, distance } = this.findClosestTarget();

        if (distance <= this.attackRange) {
            // Close enough to attack
            this.attack(target);
        } else {
            // Try to move closer to target
            let targetX, targetY;
            
            if (target instanceof Knight) {
                targetX = target.x;
                targetY = target.y;
            } else {
                // It's the tent
                targetX = target.x + target.width/2;
                targetY = target.y + target.height/2;
            }

            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const angle = Math.atan2(dy, dx);
            
            // Try 8 different directions if direct path is blocked
            const directions = [
                angle,                    // Direct
                angle + Math.PI/4,        // 45 degrees right
                angle - Math.PI/4,        // 45 degrees left
                angle + Math.PI/2,        // 90 degrees right
                angle - Math.PI/2,        // 90 degrees left
                angle + 3*Math.PI/4,      // 135 degrees right
                angle - 3*Math.PI/4,      // 135 degrees left
                angle + Math.PI,          // Opposite direction
            ];

            let moved = false;
            for (const dir of directions) {
                const newX = this.x + Math.cos(dir) * this.speed;
                const newY = this.y + Math.sin(dir) * this.speed;

                // Check if new position would cause collision
                if (!this.checkCollisions(newX, newY)) {
                    this.x = newX;
                    this.y = newY;
                    moved = true;
                    break;
                }
            }
        }
    }

    checkCollisions(newX, newY) {
        // Create a temporary object at the new position to check collisions
        const tempMonster = {
            x: newX - this.size.width/2,
            y: newY - this.size.height/2,
            width: this.size.width,
            height: this.size.height
        };

        // Check collisions with all objects
        const allObjects = [
            ...gameState.resourceNodes,
            ...gameState.units,
            gameState.tent
        ];

        for (const obj of allObjects) {
            if (obj === this) continue; // Skip self
            
            if (this.isColliding(tempMonster, obj)) {
                return true; // Collision detected
            }
        }

        return false; // No collisions
    }

    isColliding(obj1, obj2) {
        return !(obj1.x + obj1.width < obj2.x ||
                obj1.x > obj2.x + obj2.width ||
                obj1.y + obj1.height < obj2.y ||
                obj1.y > obj2.y + obj2.height);
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    draw(ctx) {
        if (this.image && this.image.complete) {
            ctx.drawImage(
                this.image,
                this.x - this.size.width/2,
                this.y - this.size.height/2,
                this.size.width,
                this.size.height
            );
        } else {
            // Draw a fallback rectangle if image isn't loaded
            ctx.fillStyle = 'red';
            ctx.fillRect(
                this.x - this.size.width/2,
                this.y - this.size.height/2,
                this.size.width,
                this.size.height
            );
        }

        // Draw health bar
        const barWidth = this.size.width;
        const barHeight = 10;
        const healthPercent = this.health / this.maxHealth;
        
        // Background
        ctx.fillStyle = "red";
        ctx.fillRect(
            this.x - this.size.width/2,
            this.y - this.size.height/2 - 20,
            barWidth,
            barHeight
        );
        
        // Health
        ctx.fillStyle = "green";
        ctx.fillRect(
            this.x - this.size.width/2,
            this.y - this.size.height/2 - 20,
            barWidth * healthPercent,
            barHeight
        );
    }
}
