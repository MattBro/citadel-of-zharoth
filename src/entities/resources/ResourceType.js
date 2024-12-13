export class ResourceType {
    constructor(name, imageSrc) {
        this.name = name;
        this.image = new Image();
        this.image.src = imageSrc;
    }
} 