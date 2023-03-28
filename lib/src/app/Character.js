import { SpriteAnimations } from "./Sprite.js";
import { GameObject } from "./GameObject.js";
import { Direction } from "./DirectionInput.js";
import { CharacterAttributes } from "./CharacterAttributes.js";
export class Character extends GameObject {
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
        this.width = config.width || 32;
        this.height = config.height || 32;
        this.walking = config.walking || false;
        this.xVelocity = 2;
        this.yVelocity = 2;
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
//# sourceMappingURL=Character.js.map