import { ShapeTypes as $ShapeTypes, Shape as $Shape } from "../../framework/Shapes.js";
import { SkillTypes as $SkillTypes } from "../../constants/SkillTypes.js";

export interface SkillI {
    name: string;
    power: number;
    shape: $Shape;
    castTime: number;
    effectTime: number;
    cooldown: number;
    element: string;
    owner: string;
    src: string;
    skillType: $SkillTypes
}