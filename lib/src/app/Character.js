import { CharacterAttributesConstants as $chAttr, StatNames as $stats } from '../constants/CharacterAttributesConstants.js';
import { SpriteAnimations } from "./Sprite.js";
import { GameObject } from "./GameObject.js";
import { Direction } from "./DirectionInput.js";
export class Character extends GameObject {
    movingProgressRemaining;
    directionUpdate;
    isPlayerControlled;
    lastDirection;
    username;
    class;
    characterGender;
    attributes;
    guild;
    items;
    player;
    friends;
    equipment;
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
        };
        this.gameObjectID = config.gameObjectID || 1;
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
            gameObjectID: this.gameObjectID,
            attributes: this.attributes,
            gender: this.characterGender,
            class: this.class,
            guild: this.guild,
            items: this.items,
            x: this.x,
            y: this.y
        };
    }
    updateCharacterLocationAndAppearance(characterMovementState) {
        console.log(characterMovementState);
        const GridBlockSize = 16;
        this.movingProgressRemaining = 0;
        if (this.isPlayerControlled && this.movingProgressRemaining === 0 && characterMovementState.arrow) {
            this.direction = characterMovementState.arrow;
            this.movingProgressRemaining = GridBlockSize;
        }
        if (characterMovementState.arrow) {
            if (characterMovementState.arrow == Direction.STANDSTILL) {
                this.movingProgressRemaining = 0;
                this.direction = this.lastDirection || Direction.RIGHT;
                characterMovementState.arrow = null;
                this.updateSpriteAnimation(characterMovementState);
                return;
            }
            this.direction = characterMovementState.arrow;
            this.lastDirection = this.direction;
            this.movingProgressRemaining = GridBlockSize;
        }
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
    level = 1;
    experience = $chAttr.experience;
    experienceCap = $chAttr.experienceCap;
    statPoints = $chAttr.statPoints;
    hp = $chAttr.hp;
    sp = $chAttr.sp;
    def = $chAttr.def;
    mdef = $chAttr.mdef;
    crit = $chAttr.crit;
    Atk = $chAttr.Atk;
    Matk = $chAttr.Matk;
    Vit = $chAttr.Vit;
    Men = $chAttr.Men;
    Dex = $chAttr.Dex;
    constructor(_Atk = 1, _Matk = 1, _Vit = 1, _Men = 1, _Dex = 1) {
        this.Atk = _Atk;
        this.Matk = _Matk;
        this.Vit = _Vit;
        this.Men = _Men;
        this.Dex = _Dex;
        if (this.experience >= this.experienceCap) {
            this.levelUp();
        }
    }
    increaseExp(expAmount) {
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
    increaseStat(stat) {
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
            }
            ;
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
    get Level() {
        return this.level;
    }
    set Level(_level) {
        if (_level < 1)
            _level = 1;
        this.level = _level;
    }
    get Experience() {
        return this.experience;
    }
    set Experience(_exp) {
        if (_exp < 1)
            _exp = 1;
        this.experience = _exp;
    }
    get ExperienceCap() {
        return this.experienceCap;
    }
    set ExperienceCap(_expCap) {
        if (_expCap < 1)
            _expCap = 1;
        this.experienceCap = _expCap;
    }
    get HP() {
        return this.hp;
    }
    set HP(_hp) {
        if (_hp < 1)
            _hp = 1;
        this.hp = _hp;
    }
    get SP() {
        return this.sp;
    }
    set SP(_sp) {
        if (_sp < 1)
            _sp = 1;
        this.sp = _sp;
    }
    get Def() {
        return this.def;
    }
    set Def(_def) {
        if (_def < 1)
            _def = 1;
        this.def = _def;
    }
    get MDef() {
        return this.mdef;
    }
    set MDef(_mdef) {
        if (_mdef < 1)
            _mdef = 1;
        this.mdef = _mdef;
    }
    get Crit() {
        return this.crit;
    }
    set Crit(_crit) {
        if (_crit < 1)
            _crit = 1;
        this.crit = _crit;
    }
    get AtkAtrribute() {
        return this.Atk;
    }
    set AtkAtrribute(AtkAttribute) {
        if (AtkAttribute < 1)
            AtkAttribute = 1;
        this.Atk = AtkAttribute;
    }
    get MAtkAtrribute() {
        return this.Matk;
    }
    set MAtkAtrribute(MatkAttribute) {
        if (MatkAttribute < 1)
            MatkAttribute = 1;
        this.Matk = MatkAttribute;
    }
    get MenAtrribute() {
        return this.Men;
    }
    set MenAtrribute(MenAttribute) {
        if (MenAttribute < 1)
            MenAttribute = 1;
        this.Men = MenAttribute;
    }
    get VitAtrribute() {
        return this.Vit;
    }
    set VitAtrribute(VitAttribute) {
        if (VitAttribute < 1)
            VitAttribute = 1;
        this.Vit = VitAttribute;
    }
    get DexAtrribute() {
        return this.Dex;
    }
    set DexAtrribute(DexAttribute) {
        if (DexAttribute < 1)
            DexAttribute = 1;
        this.Dex = DexAttribute;
    }
}
//# sourceMappingURL=Character.js.map