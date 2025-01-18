import { Unit } from './Unit.js';
import { gameState } from '../../systems/gameState.js';

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

    update(deltaTime) {
        // Calculate distance to tent center
        const tentCenterX = gameState.tent.x + gameState.tent.width/2;
        const tentCenterY = gameState.tent.y + gameState.tent.height/2;
        const dx = tentCenterX - this.x;
        const dy = tentCenterY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Attack range is 1.5x the monster's width
        const attackRange = this.size.width * 1.5;

        if (distance <= attackRange) {
            // Close enough to attack
            const now = performance.now();
            const timeSinceLastAttack = (now - this.lastAttackTime) / 1000;
            
            if (timeSinceLastAttack >= 1) {
                gameState.tent.takeDamage(this.attackDamage);
                this.lastAttackTime = now;
            }
        } else {
            // Try to move closer
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
