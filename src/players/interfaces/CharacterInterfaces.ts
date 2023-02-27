import { Direction } from "../../app/DirectionInput.js";

export interface CharacterMovementData {
    delta: {
        x: Number,
        y: Number
    },

    direction: Direction;
}