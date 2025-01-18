import { Unit } from './Unit.js';
import { gameState } from '../../systems/gameState.js';

export class Monster extends Unit {
    constructor(x, y, image) {
        super('monster', x, y, 2, image, gameState.canvas.width, gameState.canvas.height);
        this.size = {
            width: 100,
            height: 100
        };
        this.maxHealth = 10;
        this.health = this.maxHealth;
        this.attackDamage = 5; // damage per second
        this.lastAttackTime = 0;
    }

    update(deltaTime) {
        // Move towards tent if not already there
        const dx = gameState.tent.x - this.x;
        const dy = gameState.tent.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.size.width/2) {
            // Move towards tent
            const speed = this.speed;
            const vx = (dx / distance) * speed;
            const vy = (dy / distance) * speed;
            this.x += vx;
            this.y += vy;
        } else {
            // Attack tent
            const now = performance.now();
            const timeSinceLastAttack = (now - this.lastAttackTime) / 1000; // convert to seconds
            
            if (timeSinceLastAttack >= 1) { // Attack once per second
                gameState.tent.takeDamage(this.attackDamage);
                this.lastAttackTime = now;
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
