import { Character } from "../../app/Character.js";
import { Direction } from "../../app/DirectionInput.js";

export interface CharacterMovementData extends CharacterData_Direction {
    delta: {
        x: number,
        y: number
    },
    direction: Direction;
}

export interface CharacterData_Direction {
    characterObj: Character
    direction: Direction
}