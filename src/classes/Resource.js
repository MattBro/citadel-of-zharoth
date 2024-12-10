import { GameObject } from './GameObject.js';

export class Resource extends GameObject {
    constructor(resourceType, x, y, amount) {
        super(x, y, 64, 64); // Example dimensions for resources
        this.resourceType = resourceType;
        this.amount = amount;
    }

    draw(ctx) {
        if (this.resourceType.image.complete) {
            const imageWidth = 64;  // Adjust based on your image size
            const imageHeight = 64; // Adjust based on your image size
            ctx.drawImage(this.resourceType.image, this.x - imageWidth/2, this.y - imageHeight/2, imageWidth, imageHeight);
            
            ctx.fillStyle = "white";
            ctx.font = "bold 16px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.amount, this.x, this.y + imageHeight/2 + 20);
        }
    }

    isPointInside(px, py) {
        return (px >= this.x - this.width / 2 && px <= this.x + this.width / 2 &&
                py >= this.y - this.height / 2 && py <= this.y + this.height / 2);
    }
} 