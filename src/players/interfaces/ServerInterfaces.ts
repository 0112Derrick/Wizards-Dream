import { SkillI as $SkillI } from "./SkillInterface.js";
import { Direction as $Direction } from "../../app/DirectionInput.js";

export interface MessageContentsI {
    action: $Direction | $SkillI,
    worldWidth: number,
    worldHeight: number,
    mapMinWidth: number,
    mapMinHeight: number,
}