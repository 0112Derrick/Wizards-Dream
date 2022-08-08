import { Sprite } from './Sprite.js';
export class GameObject {
    x;
    y;
    sprite;
    direction;
    constructor(config) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.direction = config.direction || 'down';
        this.sprite = new Sprite({
            gameObject: this,
            src: config.src || "/images/characters/players/erio.png"
        });
    }
    update({}) {
    }
}
//# sourceMappingURL=GameObject.js.map