import { GameObject } from './GameObject.js';

export class Tent extends GameObject {
    constructor(x, y, width, height, tentImage) {
        super(x, y, width, height);
        this.image = tentImage;
    }
    
    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Fallback drawing if the image isn't loaded
            ctx.fillStyle = "brown";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
} 