import { Sprite } from './Sprite.js';

export class GameObject {

    name: string;
    x: number;
    y: number;
    xVelocity: number;
    yVelocity: number;
    sprite: Sprite;
    direction: any;
    gameObjectID: number;

    constructor(config: { x: number, y: number, name: string, src: string, direction: string, createSprite?, gameObjectID?, xVelocity?, yVelocity?}) {

        this.x = config.x || 0;
        this.y = config.y || 0;

        if (config.createSprite == undefined || config.createSprite == null) {
            config.createSprite = true;
        }

        if (config.gameObjectID) {
            this.gameObjectID = config.gameObjectID;
        }
        

        this.name = config.name || 'default';
        this.direction = config.direction || 'down';

        if (config.createSprite) {
            this.sprite = new Sprite({
                gameObject: this,
                src: config.src || "/images/characters/players/erio.png"
            });
        }
    }

    updateCharacterLocationAndAppearance({ }) {
    }
}