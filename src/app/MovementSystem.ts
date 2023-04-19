import { Direction } from "./DirectionInput.js";
import { Character } from "./Character.js";
import { CharacterVelocity as $CharacterVelocity } from "../constants/CharacterAttributesConstants.js";

class MovementSystem {

    updateCharacterPosition(character: Character, direction: Direction): { x: number, y: number } {

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
                console.log(`Direction is invalid: ${direction}`);
                break;
        }

        return { x: character.x, y: character.y }
    }
}

const Movement_System = new MovementSystem();

export default Movement_System;