import { Character } from "./Character.js";

export default class Camera {
    public x: number = 0;
    public y: number = 0;
    private centerX: number = 0
    private centerY: number = 0
    width: number = 0;
    height: number = 0;
    worldHeight: number = 0;
    worldWidth: number = 0;


    constructor(width: number, height: number, worldHeight: number, worldWidth: number) {
        this.width = width;
        this.height = height;
        this.worldHeight = worldHeight;
        this.worldWidth = worldWidth;
    }

    public updateCamera(character: Character) {
        this.centerX = character.x + character.width / 2;
        this.centerY = character.y + character.height / 2;

        this.x = this.centerX - this.width / 2;
        this.y = this.centerY - this.height / 2;

        this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.height));
    }

    isInsideOfView(x: number, y: number, width: number = 32, height: number = 32): boolean {
        if (x + width >= 0 && x <= this.width &&
            y + height >= 0 && y <= this.height) {
            return true;
        }
        return false;
    }

    isCircleInsideOfView(x: number, y: number, radius: number = 16): boolean {
        if (x + radius >= 0 && x - radius <= this.width &&
            y + radius >= 0 && y - radius <= this.height) {
            return true;
        }
        return false;
    }

    setWorldHeight(height: number) {
        this.worldHeight = height;
    }
    setWorldWidth(width: number) {
        this.worldWidth = width;
    }
}