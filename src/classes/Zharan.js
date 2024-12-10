import { Unit } from './Unit.js';

export class Zharan extends Unit {
    constructor(x, y, image, canvasWidth, canvasHeight, tent, eventBus) {
        super('zharan', x, y, 1, image, canvasWidth, canvasHeight);
        this.carrying = {
            type: null,
            amount: 0
        };
        this.carryCapacity = 1;
        this.gatheringFrom = null;
        this.lastTargetedResource = null;
        this.gatheringTimer = 0;
        this.gatheringDelay = 300;
        this.tent = tent;
        this.eventBus = eventBus;
    }

    draw(ctx) {
        // Draw the Zharan unit
        super.draw(ctx);

        if (this.carrying.amount > 0) {
            const dotImage = this.carrying.type.image; // Get the image for the carrying type
            if (dotImage.complete) {
                ctx.drawImage(dotImage, this.x - 10, this.y - 36, 20, 20); // Draw the image above the Zharan's head
            }
        }

        this.drawGatheringProgress(ctx);
    }

    drawGatheringProgress(ctx) {
        if (this.gatheringFrom && this.gatheringTimer > 0) {
            const progress = this.gatheringTimer / this.gatheringDelay;
            const barWidth = 30;
            const barHeight = 5;
            
            ctx.fillStyle = "black";
            ctx.fillRect(this.x - barWidth/2, this.y - 25, barWidth, barHeight);
            
            ctx.fillStyle = "yellow";
            ctx.fillRect(this.x - barWidth/2, this.y - 25, barWidth * progress, barHeight);
        }
    }

    dropOffResource(){
        // Check if we're at the tent and carrying resources
        if (this.carrying.amount > 0 && 
            Math.abs(this.x - (this.tent.x + this.tent.width / 2)) < 20 && 
            Math.abs(this.y - (this.tent.y + this.tent.height / 2)) < 20) {
                console.log("At tent, depositing resources");
                console.log("lastTargetedResource", this.lastTargetedResource);
            // Deposit resources
            this.eventBus.emit('resourceGathered', { type: this.carrying.type.name, amount: this.carrying.amount });
            this.carrying.type = null;
            this.carrying.amount = 0;
            // If there's a last targeted resource, go back to it
                this.gatheringFrom = this.lastTargetedResource
                this.setTarget(this.lastTargetedResource.x, this.lastTargetedResource.y);
            return; // Exit the method after depositing
        }
    }

    gatherResource(tent) {
        // If full, head to the tent
        if (this.carrying.amount >= this.carryCapacity) {
            this.setTarget(this.tent.x + this.tent.width / 2, this.tent.y + this.tent.height / 2);
            this.gatheringFrom = null;
            this.gatheringTimer = 0;
        }

        // If we're gathering from a resource
        if (this.gatheringFrom) {
            this.gatheringTimer++;
            if (this.gatheringTimer >= this.gatheringDelay) {
                this.lastTargetedResource = this.gatheringFrom;
                const amountToGather = Math.min(this.carryCapacity - this.carrying.amount, this.gatheringFrom.amount);
                if (amountToGather > 0) {
                    this.carrying.type = this.gatheringFrom.resourceType;
                    this.carrying.amount += amountToGather;
                    this.gatheringFrom.amount -= amountToGather;
                }
                this.gatheringTimer = 0;

                if (this.carrying.amount >= this.carryCapacity || this.gatheringFrom.amount <= 0) {
                    this.gatheringFrom = null;
                    this.setTarget(this.tent.x + this.tent.width / 2, this.tent.y + this.tent.height / 2);
                }
            }
        }
    }
}