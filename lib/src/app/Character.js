import { GameObject } from "./GameObject.js";
export class Character extends GameObject {
    movingProgressRemaining;
    directionUpdate;
    isPlayerControlled;
    id;
    level;
    class;
    guild;
    items;
    constructor(config) {
        super(config);
        this.movingProgressRemaining = 0;
        this.isPlayerControlled = config.isPlayerControlled || false;
        this.directionUpdate = {
            "up": ["y", -0.5],
            "down": ["y", 0.5],
            "left": ["x", -0.7],
            "right": ["x", 0.7],
            "jump": ["y", 0],
        };
        this.id = config.id || '00001';
        this.level = config.level || 1;
        this.class = config.class || 'mage';
        this.guild = config.guild || 'none';
        this.items = config.items || [];
    }
    update(state) {
        this.updatePosition();
        this.updateSprite(state);
        if (this.isPlayerControlled && this.movingProgressRemaining === 0 && state.arrow) {
            this.direction = state.arrow;
            this.movingProgressRemaining = 16;
        }
    }
    updatePosition() {
        if (this.movingProgressRemaining > 0) {
            const [property, change] = this.directionUpdate[this.direction];
            this[property] += change;
            this.movingProgressRemaining -= 1;
        }
    }
    updateSprite(state) {
        if (this.isPlayerControlled && this.movingProgressRemaining === 0 && !state.arrow) {
            this.sprite.setAnimation('idle-' + this.direction);
        }
        if (this.movingProgressRemaining > 0) {
            this.sprite.setAnimation('walk-' + this.direction);
        }
    }
}
//# sourceMappingURL=Character.js.map