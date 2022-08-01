import { Sprite } from './Sprite.js';

export class GameObject {
    posX: number;
    posY: number;
    sprite: Sprite;
    direction: any;
    constructor(config) {
        this.posX = config.posX || 0;
        this.posY = config.posY || 0;
        this.direction = config.direction || 'down';
        this.sprite = new Sprite({
            gameObject: this,
            src: config.src || "/images/characters/players/erio.png"
        });
    }
    update({}) {

    }
}