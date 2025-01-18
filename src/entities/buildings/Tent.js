import { GameObject } from '../base/GameObject.js';

export class Tent extends GameObject {
    constructor(config) {
        const { position, size, image } = config;
        super(position.x, position.y, size.width, size.height);
        this.image = image;
        this.maxHealth = 500;
        this.health = this.maxHealth;
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.onDeath();
        }
        return this.health <= 0;
    }
    
    onDeath() {
        // Game over when tent dies
        alert('Game Over - Your tent was destroyed!');
        // Could add more game over logic here
    }
    
    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Fallback drawing if the image isn't loaded
            ctx.fillStyle = "brown";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Draw health bar
        const barWidth = this.width;
        const barHeight = 10;
        const healthPercent = this.health / this.maxHealth;
        
        // Background
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y - 20, barWidth, barHeight);
        
        // Health
        ctx.fillStyle = "green";
        ctx.fillRect(this.x, this.y - 20, barWidth * healthPercent, barHeight);
    }
}