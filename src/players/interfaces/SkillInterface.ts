import { ShapeTypes as $ShapeTypes, Shape as $Shape } from "../../framework/Shapes.js";
import { SkillTypes as $SkillTypes } from "../../constants/SkillTypes.js";

export interface SkillI {
    get Power(): number
    get Shape(): $Shape
    get Name(): string
    get CastTime(): number
    get EffectTime(): number
    get Cooldown(): number
    get Element(): string
    get Owner(): string
    get Src(): string
    get SkillType(): $SkillTypes
    get Dependencies():{class:string,costCategory:string[],costAmount:number}
}