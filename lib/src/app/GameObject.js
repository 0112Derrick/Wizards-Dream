import { Sprite } from './Sprite.js';
export class GameObject {
    name;
    x;
    y;
    xVelocity;
    yVelocity;
    sprite;
    direction;
    gameObjectID;
    constructor(config) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.name = config.name || 'default';
        this.direction = config.direction || 'down';
        this.sprite = new Sprite({
            gameObject: this,
            src: config.src || "/images/characters/players/erio.png"
        });
    }
    updateCharacterLocationAndAppearance({}) {
    }
}
//# sourceMappingURL=GameObject.js.map