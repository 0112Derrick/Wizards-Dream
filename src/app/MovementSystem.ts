import { Direction as $Direction } from "./DirectionInput.js";
import { Character as $Character } from "./Character.js";
import { CharacterVelocity as $CharacterVelocity } from "../constants/CharacterAttributesConstants.js";
import { characterDataInterface as $characterDataInterface } from "../game-server/interfaces/CharacterDataInterface.js";
class MovementSystem {

    updateCharacterPosition(character: $Character | $characterDataInterface, direction: $Direction, worldWidth: number, worldHeight: number, mapMinWidth: number, mapMinHeight: number): { x: number, y: number } {

        switch (direction) {
            case $Direction.UP:
                character.y -= $CharacterVelocity.yVelocity;
                break;

            case $Direction.DOWN:
                character.y += $CharacterVelocity.yVelocity;
                break;

            case $Direction.LEFT:
                character.x -= $CharacterVelocity.xVelocity;
                break;

            case $Direction.RIGHT:
                character.x += $CharacterVelocity.xVelocity;
                break;
            case $Direction.STANDSTILL:
                break;
            default:
                console.log(`Direction is invalid: ${direction}`);
                break;
        }

        character.x = Math.max(mapMinWidth, Math.min(character.x, worldWidth - character.width));
        character.y = Math.max(mapMinHeight, Math.min(character.y, worldHeight - character.height));

        return { x: character.x, y: character.y }
    }
}

const Movement_System = new MovementSystem();

export default Movement_System;