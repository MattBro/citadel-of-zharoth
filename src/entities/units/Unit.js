import { GameObject } from '../base/GameObject.js';

export class Unit extends GameObject {
    constructor(type, x, y, speed, image, canvasWidth, canvasHeight, selected = false) {
        super(x, y, 32, 32);
        this.type = type;
        this.speed = speed;
        this.image = image;
        this.selected = selected;
        this.targetX = null;
        this.targetY = null;
        this.gatheringFrom = null;
        this.gatheringTimer = 0;
        this.lastTargetedResource = null;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    move(objects) {
        if (this.targetX === null || this.targetY === null) {
            return;
        }
    
        // Calculate direction to target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        // Check if the unit is close enough to gather resources
        if (this.gatheringFrom) {
            if(Math.sqrt(
                (this.x - this.gatheringFrom.x) ** 2 + 
                (this.y - this.gatheringFrom.y) ** 2
            ) <= 50) {
                this.gatherResource();
                return;
            }
        }

        if(this.dropOffResource) {
            this.dropOffResource();
        }
    
        // If we're close enough to target, snap to it and stop
        if (distanceToTarget < this.speed) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.targetX = null;
            this.targetY = null;
            return;
        }
    
        // Calculate base movement direction
        const normalizedDx = dx / distanceToTarget;
        const normalizedDy = dy / distanceToTarget;
    
        // Initialize position changes
        let moveX = normalizedDx * this.speed;
        let moveY = normalizedDy * this.speed;
    
        // Enhanced obstacle avoidance
        const avoidanceRadius = this.width * 1.5;
        const avoidanceStrength = 2.0;
        let totalAvoidanceX = 0;
        let totalAvoidanceY = 0;
    
        // Check each object for collision avoidance
        objects.forEach(obj => {
            if (obj === this) return;
    
            const objDx = obj.x - this.x;
            const objDy = obj.y - this.y;
            const distanceToObj = Math.sqrt(objDx * objDx + objDy * objDy);
            
            const safeDistance = (this.width + obj.width) / 2 + 10;
    
            if (distanceToObj < avoidanceRadius) {
                const avoidanceFactor = Math.pow((avoidanceRadius - distanceToObj) / avoidanceRadius, 2);
                
                if (distanceToObj < safeDistance) {
                    const emergencyStrength = 3.0;
                    totalAvoidanceX -= (objDx / distanceToObj) * emergencyStrength;
                    totalAvoidanceY -= (objDy / distanceToObj) * emergencyStrength;
                } else {
                    totalAvoidanceX -= (objDx / distanceToObj) * avoidanceFactor * avoidanceStrength;
                    totalAvoidanceY -= (objDy / distanceToObj) * avoidanceFactor * avoidanceStrength;
    
                    totalAvoidanceX += (objDy / distanceToObj) * avoidanceFactor * 0.5;
                    totalAvoidanceY += (-objDx / distanceToObj) * avoidanceFactor * 0.5;
                }
            }
        });
    
        const targetWeight = 0.7;
        const avoidanceWeight = 1.0;
        
        moveX = (moveX * targetWeight) + (totalAvoidanceX * avoidanceWeight);
        moveY = (moveY * targetWeight) + (totalAvoidanceY * avoidanceWeight);
    
        const moveLength = Math.sqrt(moveX * moveX + moveY * moveY);
        if (moveLength > this.speed) {
            moveX = (moveX / moveLength) * this.speed;
            moveY = (moveY / moveLength) * this.speed;
        }
    
        const nextX = this.x + moveX;
        const nextY = this.y + moveY;
    
        const margin = this.width / 2;
        
        // Keep unit within canvas bounds
        // Note: canvas needs to be passed in or accessed differently
        this.x = Math.max(margin, Math.min(this.canvasWidth - margin, nextX));
        this.y = Math.max(margin, Math.min(this.canvasHeight - margin, nextY));
    }

    draw(ctx) {
        if (this.image?.complete) {
            ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
        this.drawSelectionHighlight(ctx);
    }

    drawSelectionHighlight(ctx) {
        if (this.selected) {
            ctx.shadowColor = 'rgba(0, 150, 255, 0.2)';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const radius = 10;
            ctx.moveTo(this.x - this.width / 2 + radius, this.y - this.height / 2);
            ctx.lineTo(this.x + this.width / 2 - radius, this.y - this.height / 2);
            ctx.quadraticCurveTo(this.x + this.width / 2, this.y - this.height / 2, 
                this.x + this.width / 2, this.y - this.height / 2 + radius);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2 - radius);
            ctx.quadraticCurveTo(this.x + this.width / 2, this.y + this.height / 2, 
                this.x + this.width / 2 - radius, this.y + this.height / 2);
            ctx.lineTo(this.x - this.width / 2 + radius, this.y + this.height / 2);
            ctx.quadraticCurveTo(this.x - this.width / 2, this.y + this.height / 2, 
                this.x - this.width / 2, this.y + this.height / 2 - radius);
            ctx.lineTo(this.x - this.width / 2, this.y - this.height / 2 + radius);
            ctx.quadraticCurveTo(this.x - this.width / 2, this.y - this.height / 2, 
                this.x - this.width / 2 + radius, this.y - this.height / 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    // These methods should be implemented by child classes
    gatherResource() {
        throw new Error('gatherResource must be implemented by child class');
    }

    dropOffResource() {
        throw new Error('dropOffResource must be implemented by child class');
    }
} 