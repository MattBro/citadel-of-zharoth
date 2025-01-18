export class GameObject {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.maxHealth = 10;
        this.health = this.maxHealth;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.onDeath();
        }
        return this.health <= 0;
    }

    // Override this in child classes to handle death
    onDeath() {
        // Base class does nothing
    }

    isColliding(obj1, obj2) {
        return !(obj1.x + obj1.width < obj2.x ||
                obj1.x > obj2.x + obj2.width ||
                obj1.y + obj1.height < obj2.y ||
                obj1.y > obj2.y + obj2.height);
    }
}