import { idText } from "typescript";
import { characterDataInterface } from "../players/PlayerDataInterface.js";
import { CharacterAttributesConstants as $chAttr, StatNames as $stats } from '../constants/CharacterAttributesConstants.js'
import { SpriteAnimations } from "./Sprite.js";
import { GameObject } from "./GameObject.js";
import { Direction } from "./DirectionInput.js";

// interface CharacterAttributes {
// }
export class Character extends GameObject implements characterDataInterface {
    movingProgressRemaining: number;
    directionUpdate: {};
    isPlayerControlled: any;
    lastDirection: string;
    username: string;
    class: string;
    characterGender: string;
    attributes: {
        level: number,//Determines players stat attributes
        experience: number, //Tracks player leveling progress
        experienceCap: number, // Determines when the player will level up
        statPoints: number,
        hp: number,// Determines how many times a player can take damage before dying & hp regen amount
        sp: number, // Determines how many times a magic atk can be used and regen amount
        def: number,// Determines how much damage is taken from phyiscal hits
        mdef: number,// Determines how much damage is taken from Magic hits
        crit: number,// Determines wheter or not a hit does increased damgage & increased damage amount

        //stats directly controlled by the player when using levelinh points
        Atk: number,// Determines Physical atk damage and gives a minor boost to hp total
        Matk: number,// Determines Magic atk damage and gives a minor boost to sp total
        Vit: number,// Increases hp and def
        Men: number,//Increases sp & mdef
        Dex: number,//Increases Crit  
    };
    guild: string;
    items: string[];
    player: any;
    friends: string[];
    equipment: { head: number[]; chest: number[]; legs: number[]; weapon: number[]; };

    constructor(config) {
        super(config);

        this.movingProgressRemaining = 0;
        this.isPlayerControlled = config.isPlayerControlled || false;

        this.directionUpdate = {
            [Direction.UP]: ["y", -0.5],
            [Direction.DOWN]: ["y", 0.5],
            [Direction.LEFT]: ["x", -0.7],
            [Direction.RIGHT]: ["x", 0.7],
            [Direction.JUMP]: ["y", 0],
        }

        this.gameObjectID = config.characterID || 1;
        this.username = config.username || 'newCharacter';
        this.attributes = config.atrributes || new CharacterAttributes();
        this.characterGender = config.characterGender || 'male';
        this.class = config.class || 'none';
        this.guild = config.guild || 'none';
        this.items = config.items || [];
        this.player = config.player;
        this.name = config.username;
    }


    toJSON() {
        return {
            username: this.username,
            player: this.player,
            characterID: this.gameObjectID,
            attributes: this.attributes,
            gender: this.characterGender,
            class: this.class,
            guild: this.guild,
            items: this.items,
            x: this.x,
            y: this.y
        }
    }

    /**
     * 
     * @param characterMovementState Should contain an attribute named arrow of type Direction.
     */
    updateCharacterLocationAndAppearance(characterMovementState: any): void {
        //this.updatePosition();
        console.log(characterMovementState);
        const GridBlockSize = 16;
        this.movingProgressRemaining = 0;


        //if player is not moving and controlled it reassigns their direction to their last button clicked
        if (this.isPlayerControlled && this.movingProgressRemaining === 0 && characterMovementState.arrow) {
            this.direction = characterMovementState.arrow;
            this.movingProgressRemaining = GridBlockSize;
        }
        //if player is moving and controlled it reassigns their direction to their last button clicked and updates the movement gauge
        if (characterMovementState.arrow) {
            this.direction = characterMovementState.arrow;
            this.lastDirection = this.direction;
            this.movingProgressRemaining = GridBlockSize;
        }
        //if player is not moving it reassigns their animation to the idle ver. of the last direction they were moving in or defaults to right. 
        else if (!characterMovementState.arrow) {
            this.movingProgressRemaining = 0;
            this.direction = this.lastDirection || Direction.RIGHT;
        }

        this.updateSpriteAnimation(characterMovementState);

    }

    updatePosition() {
        if (this.movingProgressRemaining > 0) {
            const [property, change] = this.directionUpdate[this.direction];
            this[property] += change;
            this.movingProgressRemaining -= 1;
        }
    }

    /**
     * @description Updates players movement based on passed in direction
     * @param characterMovementState 
     */
    updateSpriteAnimation(characterMovementState) {
        if (this.isPlayerControlled && this.movingProgressRemaining === 0 && !characterMovementState.arrow) {
            let animation = null;
            switch (this.direction) {
                case 'up':
                    animation = SpriteAnimations.idle_up;
                    break;
                case 'down':
                    animation = SpriteAnimations.idle_down;
                    break;
                case 'left':
                    animation = SpriteAnimations.idle_left;
                    break;
                case 'right':
                    animation = SpriteAnimations.idle_right;
                    break;
                case 'jump':
                    animation = SpriteAnimations.idle_jump;
                    break;
                default:
                    animation = SpriteAnimations.idle_right;
                    break;
            }

            this.sprite.setAnimation(animation);
        }

        //Determines the walking animation to be played based on input direction
        if (this.movingProgressRemaining > 0) {

            let animation = null;

            switch (this.direction) {
                case 'up':
                    animation = SpriteAnimations.walking_up;
                    break;
                case 'down':
                    animation = SpriteAnimations.walking_down;
                    break;
                case 'left':
                    animation = SpriteAnimations.walking_left;
                    break;
                case 'right':
                    animation = SpriteAnimations.walking_right;
                    break;
                case 'jump':
                    animation = SpriteAnimations.walking_jump;
                    break;
                default:
                    animation = SpriteAnimations.idle_right;
                    break;
            }

            this.sprite.setAnimation(animation);
        }

    }
}

export class CharacterAttributes {
    private level = 1;

    private experience = $chAttr.experience;
    private experienceCap = $chAttr.experienceCap;
    private statPoints = $chAttr.statPoints;
    private hp = $chAttr.hp;
    private sp = $chAttr.sp;
    private def = $chAttr.def;
    private mdef = $chAttr.mdef;
    private crit = $chAttr.crit;

    private Atk = $chAttr.Atk;
    private Matk = $chAttr.Matk;
    private Vit = $chAttr.Vit;
    private Men = $chAttr.Men;
    private Dex = $chAttr.Dex;

    constructor(_Atk: number = 1, _Matk: number = 1, _Vit: number = 1, _Men: number = 1, _Dex: number = 1) {
        this.Atk = _Atk;
        this.Matk = _Matk;
        this.Vit = _Vit;
        this.Men = _Men;
        this.Dex = _Dex;

        if (this.experience >= this.experienceCap) {
            this.levelUp();
        }

    }

    increaseExp(expAmount: number) {
        this.experience += expAmount;
        if (this.experience >= this.experienceCap) {
            this.levelUp();
        }
    }

    levelUp() {
        if (this.experience >= this.experienceCap) {
            this.level += 1;
            this.statPoints += 3;
            this.experienceCap *= 1.8;
        }
    }

    increaseStat(stat: $stats) {
        if (this.statPoints >= 1) {
            switch (stat) {
                case $stats.ATK:
                    this.Atk += 1;
                    this.statPoints -= 1;
                    break;
                case $stats.MATK:
                    this.Matk += 1;
                    this.statPoints -= 1;
                    break;
                case $stats.MEN:
                    this.Men += 1;
                    this.statPoints -= 1;
                    break;
                case $stats.VIT:
                    this.Vit += 1;
                    this.statPoints -= 1;
                    break;
                case $stats.DEX:
                    this.Dex += 1;
                    this.statPoints -= 1;
                    break;
                default:
                    console.log("Enter a valid stat to increase");
            };

        }
    }

    resetStats() {
        this.Atk = $chAttr.Atk;
        this.Matk = $chAttr.Matk;
        this.Vit = $chAttr.Vit;
        this.Men = $chAttr.Men;
        this.Dex = $chAttr.Dex;
        this.hp = $chAttr.hp;
        this.sp = $chAttr.sp;
        this.def = $chAttr.def;
        this.mdef = $chAttr.mdef;
        this.crit = $chAttr.crit;
    }

    public get Level(): number {
        return this.level;
    }

    public set Level(_level: number) {
        if (_level < 1) _level = 1;
        this.level = _level;
    }

    public get Experience(): number {
        return this.experience;
    }

    public set Experience(_exp: number) {
        if (_exp < 1) _exp = 1;
        this.experience = _exp;
    }

    public get ExperienceCap(): number {
        return this.experienceCap;
    }

    public set ExperienceCap(_expCap: number) {
        if (_expCap < 1) _expCap = 1;
        this.experienceCap = _expCap;
    }


    public get HP(): number {
        return this.hp;
    }

    public set HP(_hp: number) {
        if (_hp < 1) _hp = 1;
        this.hp = _hp;
    }

    public get SP(): number {
        return this.sp;
    }

    public set SP(_sp: number) {
        if (_sp < 1) _sp = 1;
        this.sp = _sp;
    }

    public get Def(): number {
        return this.def;
    }

    public set Def(_def: number) {
        if (_def < 1) _def = 1;
        this.def = _def;
    }

    public get MDef(): number {
        return this.mdef;
    }

    public set MDef(_mdef: number) {
        if (_mdef < 1) _mdef = 1;
        this.mdef = _mdef;
    }

    public get Crit(): number {
        return this.crit;
    }

    public set Crit(_crit: number) {
        if (_crit < 1) _crit = 1;
        this.crit = _crit;
    }

    public get AtkAtrribute(): number {
        return this.Atk;
    }

    public set AtkAtrribute(AtkAttribute: number) {
        if (AtkAttribute < 1) AtkAttribute = 1;
        this.Atk = AtkAttribute;
    }

    public get MAtkAtrribute(): number {
        return this.Matk;
    }

    public set MAtkAtrribute(MatkAttribute: number) {
        if (MatkAttribute < 1) MatkAttribute = 1;
        this.Matk = MatkAttribute;
    }

    public get MenAtrribute(): number {
        return this.Men;
    }

    public set MenAtrribute(MenAttribute: number) {
        if (MenAttribute < 1) MenAttribute = 1;
        this.Men = MenAttribute;
    }

    public get VitAtrribute(): number {
        return this.Vit;
    }

    public set VitAtrribute(VitAttribute: number) {
        if (VitAttribute < 1) VitAttribute = 1;
        this.Vit = VitAttribute;
    }

    public get DexAtrribute(): number {
        return this.Dex;
    }

    public set DexAtrribute(DexAttribute: number) {
        if (DexAttribute < 1) DexAttribute = 1;
        this.Dex = DexAttribute;
    }

}
