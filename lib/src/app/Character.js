import { SpriteAnimations as $SpriteAnimations } from "./Sprite.js";
import { GameObject as $GameObject } from "./GameObject.js";
import { Direction as $Direction } from "./DirectionInput.js";
import { CharacterAttributes as $CharacterAttributes } from "./CharacterAttributes.js";
import { CharacterSize as $CharacterSize, CharacterVelocity as $CharacterVelocity } from "../constants/CharacterAttributesConstants.js";
export class Character extends $GameObject {
    movingProgressRemaining;
    directionUpdate;
    isPlayerControlled;
    lastDirection;
    username;
    class;
    characterGender;
    width;
    height;
    walking;
    location;
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
            [$Direction.UP]: ["y", -$CharacterVelocity.yVelocity],
            [$Direction.DOWN]: ["y", +$CharacterVelocity.yVelocity],
            [$Direction.LEFT]: ["x", -$CharacterVelocity.xVelocity],
            [$Direction.RIGHT]: ["x", +$CharacterVelocity.xVelocity],
            [$Direction.JUMP]: ["y", 0],
        };
        this.gameObjectID = config.gameObjectID || 1;
        this.username = config.username || 'newCharacter';
        this.player = config.player;
        this.attributes = config.attributes || new $CharacterAttributes();
        this.characterGender = config.characterGender || 'male';
        this.class = config.class || 'none';
        this.guild = config.guild || 'none';
        this.items = config.items || [];
        this.name = config.name = 'newCharacter';
        this.width = config.width || $CharacterSize.width;
        this.height = config.height || $CharacterSize.height;
        this.walking = config.walking || false;
        this.xVelocity = $CharacterVelocity.xVelocity;
        this.yVelocity = $CharacterVelocity.yVelocity;
        this.equipment = config.equipment || {};
        this.friends = config.friends || [];
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
            y: this.y,
            location: this.location,
            xVelocity: this.xVelocity,
            yVelocity: this.yVelocity,
            lastDirection: this.lastDirection,
            name: this.name,
            width: this.width,
            height: this.height,
            walking: this.walking,
            sprite: this.sprite.src,
        };
    }
    updateCharacterLocationAndAppearance(characterMovementState) {
        console.log(characterMovementState);
        const GridBlockSize = 16;
        this.movingProgressRemaining = 0;
        if (this.movingProgressRemaining === 0 && characterMovementState.arrow) {
            this.direction = characterMovementState.arrow;
            this.movingProgressRemaining = GridBlockSize;
        }
        if (characterMovementState.arrow) {
            if (characterMovementState.arrow == $Direction.STANDSTILL) {
                this.movingProgressRemaining = 0;
                this.direction = this.lastDirection || $Direction.RIGHT;
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
            this.direction = this.lastDirection || $Direction.RIGHT;
        }
        this.updateSpriteAnimation(characterMovementState);
    }
    updatePosition(characterMovementState) {
        if (this.movingProgressRemaining > 0) {
            const [property, change] = this.directionUpdate[this.direction];
            this[property] += change;
            this.movingProgressRemaining -= 1;
        }
        console.log("updatePosition called ", this.direction, this.x, this.y);
    }
    updateSpriteAnimation(characterMovementState) {
        if (this.isPlayerControlled && this.movingProgressRemaining === 0 && !characterMovementState.arrow) {
            let animation = null;
            switch (this.direction) {
                case 'up':
                    animation = $SpriteAnimations.idle_up;
                    break;
                case 'down':
                    animation = $SpriteAnimations.idle_down;
                    break;
                case 'left':
                    animation = $SpriteAnimations.idle_left;
                    break;
                case 'right':
                    animation = $SpriteAnimations.idle_right;
                    break;
                case 'jump':
                    animation = $SpriteAnimations.idle_jump;
                    break;
                default:
                    animation = $SpriteAnimations.idle_right;
                    break;
            }
            this.sprite.setAnimation(animation);
        }
        if (this.movingProgressRemaining > 0) {
            let animation = null;
            switch (this.direction) {
                case 'up':
                    animation = $SpriteAnimations.walking_up;
                    break;
                case 'down':
                    animation = $SpriteAnimations.walking_down;
                    break;
                case 'left':
                    animation = $SpriteAnimations.walking_left;
                    break;
                case 'right':
                    animation = $SpriteAnimations.walking_right;
                    break;
                case 'jump':
                    animation = $SpriteAnimations.walking_jump;
                    break;
                default:
                    animation = $SpriteAnimations.idle_right;
                    break;
            }
            this.sprite.setAnimation(animation);
        }
    }
}
//# sourceMappingURL=Character.js.map