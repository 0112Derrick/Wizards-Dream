import { Direction } from "./DirectionInput.js";
import { Character } from "./Character.js";
import { CharacterVelocity as $CharacterVelocity } from "../constants/CharacterAttributesConstants.js";

class MovementSystem {

    updateCharacterPosition(character: Character, direction: Direction) {

        switch (direction) {
            case Direction.UP:
                character.y -= $CharacterVelocity.yVelocity;
                break;

            case Direction.DOWN:
                character.y += $CharacterVelocity.yVelocity;
                break;

            case Direction.LEFT:
                character.x -= $CharacterVelocity.xVelocity;
                break;
            
            case Direction.RIGHT:
                character.x += $CharacterVelocity.xVelocity;
                break;

            default:
                break;
        }

    }
}

const Movement_System = new MovementSystem();

export default Movement_System;