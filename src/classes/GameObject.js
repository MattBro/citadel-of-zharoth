export class GameObject {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    isColliding(otherObject, buffer = 0) {
        return !(this.x + this.width + buffer < otherObject.x ||
                 this.x - buffer > otherObject.x + otherObject.width ||
                 this.y + this.height + buffer < otherObject.y ||
                 this.y - buffer > otherObject.y + otherObject.height);
    }
} 