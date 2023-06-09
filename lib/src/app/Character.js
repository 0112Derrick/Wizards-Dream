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
    unlockedSkills = [];
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
    gameMapObjects;
    constructor(config) {
        super(config);
        this.movingProgressRemaining = 0;
        this.isPlayerControlled = config.isPlayerControlled || false;
        this.directionUpdate = {
            [$Direction.UP]: ["y", -$CharacterVelocity.yVelocity],
            [$Direction.DOWN]: ["y", +$CharacterVelocity.yVelocity],
            [$Direction.LEFT]: ["x", -$CharacterVelocity.xVelocity],
            [$Direction.RIGHT]: ["x", +$CharacterVelocity.xVelocity],
            [$Direction.ATTACK1]: ["y", 0],
        };
        this.gameObjectID = config.gameObjectID || 1;
        this.username = config.username || 'newCharacter';
        this.player = config.player;
        this.attributes = config.attributes || new $CharacterAttributes();
        this.characterGender = config.characterGender || 'male';
        this.class = config.class || 'none';
        this.guild = config.guild || 'none';
        this.items = config.items || [];
        this.unlockedSkills = config.skills || [];
        this.name = config.name || 'newCharacter';
        this.width = config.width || $CharacterSize.width;
        this.height = config.height || $CharacterSize.height;
        this.walking = config.walking || false;
        this.xVelocity = $CharacterVelocity.xVelocity;
        this.yVelocity = $CharacterVelocity.yVelocity;
        this.equipment = config.equipment || {};
        this.friends = config.friends || [];
        this.init();
    }
    init() {
    }
    setGameObjects(gameMap) {
        this.gameMapObjects = gameMap;
    }
    addOwnershipOfSkills() {
        for (let skill of this.unlockedSkills) {
            skill.Owner = this.name;
        }
    }
    renderSkill(ctx, _skill, camera) {
        for (let skill of this.unlockedSkills) {
            skill.GameObjectsCallback = this;
            if (_skill.toLowerCase() == skill.Name.toLowerCase()) {
                skill.draw(ctx, camera, this.lastDirection, { x: this.x, y: this.y });
                return true;
            }
        }
        return false;
    }
    findSkill(skillName) {
        return this.unlockedSkills.find((skill) => {
            return skill.name.toLowerCase() == skillName.toLowerCase();
        });
    }
    removeSkillFromRenderContex(object) {
        let result = this.gameMapObjects.removeGameObject(object);
        if (result) {
            return true;
        }
        return false;
    }
    addSkillToRenderContex(object) {
        this.gameMapObjects.addGameObject(object);
    }
    toJSON() {
        return {
            username: this.username,
            player: this.player,
            gameObjectID: this.gameObjectID,
            attributes: this.attributes,
            characterGender: this.characterGender,
            class: this.class,
            guild: this.guild,
            items: this.items,
            equipment: this.equipment,
            friends: this.friends,
            x: this.x,
            y: this.y,
            location: this.location,
            xVelocity: this.xVelocity,
            yVelocity: this.yVelocity,
            lastDirection: this.lastDirection,
            direction: this.direction,
            name: this.name,
            unlockedSkills: this.unlockedSkills,
            width: this.width,
            height: this.height,
            walking: this.walking,
            sprite: this.sprite.toJSON(),
        };
    }
    updateCharacterLocationAndAppearance(characterMovementState) {
        const GridBlockSize = 16;
        this.movingProgressRemaining = 0;
        if (characterMovementState.arrow == $Direction.ATTACK1) {
            this.movingProgressRemaining = GridBlockSize;
            return;
        }
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
            this.lastDirection = this.direction;
            this.direction = characterMovementState.arrow;
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
                case 'attack1':
                    animation = $SpriteAnimations.attack1;
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
    playIdleAnimation() {
        let animation = null;
        switch (this.lastDirection) {
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
            case 'attack1':
                animation = $SpriteAnimations.attack1;
                break;
            default:
                animation = $SpriteAnimations.idle_right;
                break;
        }
        this.sprite.setAnimation(animation);
    }
}
//# sourceMappingURL=Character.js.map