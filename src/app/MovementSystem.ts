import { Direction } from "./DirectionInput.js";
import { Character } from "./Character.js";

class MovementSystem {

    updateCharacterPosition(character: Character, direction: Direction) {

        switch (direction) {
            case Direction.UP:
                character.y -= character.yVelocity;
                break;
            case Direction.DOWN:
                character.y += character.yVelocity;

                break;
            case Direction.LEFT:
                character.x -= character.xVelocity;

                break;
            case Direction.RIGHT:
                character.x += character.xVelocity;
                break;

            default:
                break;
        }

    }
}

const Movement_System = new MovementSystem();

export default Movement_System;