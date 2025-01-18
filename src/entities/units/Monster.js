import { Unit } from './Unit.js';
import { gameState } from '../../systems/gameState.js';

export class Monster extends Unit {
    constructor(x, y, image) {
        super('monster', x, y, 2, image, gameState.canvas.width, gameState.canvas.height);
        this.size = {
            width: 100,
            height: 100
        };
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
    }
}
