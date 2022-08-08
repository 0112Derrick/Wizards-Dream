import { idText } from "typescript";
import { GameObject } from "./GameObject.js";

export class Player extends GameObject {
    movingProgressRemaining: number;
    directionUpdate: {};
    isPlayerControlled: any;

    constructor(config) {
        super(config);
        this.movingProgressRemaining = 0;
        this.isPlayerControlled = config.isPlayerControlled || false;

        this.directionUpdate = {
            "up": ["y", -0.5],
            "down": ["y", 0.5],
            "left": ["x", -0.7],
            "right": ["x", 0.7],
            "jump": ["posY", 0],
        }
    }

    update(state): void {
        this.updatePosition();
        //console.log(state);
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