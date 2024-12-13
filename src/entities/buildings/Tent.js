import { GameObject } from '../base/GameObject.js';

export class Tent extends GameObject {
    constructor(config) {
        const { position, size, image } = config;
        super(position.x, position.y, size.width, size.height);
        this.image = image;
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