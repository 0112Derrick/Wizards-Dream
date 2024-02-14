import { idText } from "typescript";
import { characterDataInterface as $characterDataInterface } from "../game-server/interfaces/CharacterDataInterface.js";
import { SpriteAnimations as $SpriteAnimations } from "./Sprite.js";
import { GameObject as $GameObject } from "./GameObject.js";
import { Direction as $Direction } from "./DirectionInput.js";
import { CharacterAttributes as $CharacterAttributes } from "./CharacterAttributes.js";
import { MapNames as $MapNames } from "../constants/MapNames.js";
import {
  CharacterSize as $CharacterSize,
  CharacterVelocity as $CharacterVelocity,
} from "../constants/CharacterAttributesConstants.js";
import $Camera from "./Camera.js";
import { Skill as $Skill } from "./Skill.js";
import {
  gameMapGameObjectsI,
  characterAddAndRemoveGameObjectsFromRenderI,
} from "../game-server/interfaces/OverworldInterfaces.js";
import {
  Shape,
  Rectangle as $Rectangle,
  Circle as $Circle,
} from "../framework/Shapes.js";
import { response } from "express";
import { error } from "console";

interface CharacterMovementStateI {
  arrow?: $Direction | null;
  mapMinHeight?: number;
  mapMinWidth?: number;
  worldHeight?: number;
  worldWidth?: number;
  camera?: $Camera;
}
export class Character
  extends $GameObject
  implements
    $characterDataInterface,
    characterAddAndRemoveGameObjectsFromRenderI
{
  movingProgressRemaining: number;
  directionUpdate: {};
  isPlayerControlled: any;
  lastDirection: $Direction;
  username: string;
  class: string;
  unlockedSkills: $Skill[] = [];
  hotbar: any[] = [];
  characterGender: string;
  width: number;
  height: number;
  walking: boolean;
  location: $MapNames;

  attributes: {
    level: number; //Determines players stat attributes
    experience: number; //Tracks player leveling progress
    experienceCap: number; // Determines when the player will level up
    statPoints: number;
    hp: number; // Determines how many times a player can take damage before dying & hp regen amount
    hpCap: number;
    sp: number; // Determines how many times a magic atk can be used and regen amount
    spCap: number;
    def: number; // Determines how much damage is taken from phyiscal hits
    mdef: number; // Determines how much damage is taken from Magic hits
    crit: number; // Determines wheter or not a hit does increased damgage & increased damage amount

    //stats directly controlled by the player when using levelinh points
    Atk: number; // Determines Physical atk damage and gives a minor boost to hp total
    Matk: number; // Determines Magic atk damage and gives a minor boost to sp total
    Vit: number; // Increases hp and def
    Men: number; //Increases sp & mdef
    Dex: number; //Increases Crit
  };

  guild: string;
  items: string[];
  player: any;
  friends: string[];
  equipment: {
    head: number[];
    chest: number[];
    legs: number[];
    weapon: number[];
  };
  gameMapObjects: gameMapGameObjectsI;

  constructor(config) {
    super(config);

    this.movingProgressRemaining = 0;
    this.isPlayerControlled = config.isPlayerControlled || false;

    this.directionUpdate = {
      [$Direction.UP]: ["y", -$CharacterVelocity.yVelocity],
      [$Direction.DOWN]: ["y", +$CharacterVelocity.yVelocity],
      [$Direction.LEFT]: ["x", -$CharacterVelocity.xVelocity],
      [$Direction.RIGHT]: ["x", +$CharacterVelocity.xVelocity],
      [$Direction.SKILL1]: ["y", 0],
    };

    this.gameObjectID = config.gameObjectID || 1;
    this.username = config.username || "newCharacter";
    this.player = config.player;
    this.attributes = config.attributes || new $CharacterAttributes();
    this.characterGender = config.characterGender || "male";
    this.class = config.class || "none";
    this.guild = config.guild || "none";
    this.items = config.items || [];
    this.unlockedSkills = config.skills || [];
    this.name = config.name || "newCharacter";
    this.width = config.width || $CharacterSize.width;
    this.height = config.height || $CharacterSize.height;
    this.walking = config.walking || false;
    this.xVelocity = $CharacterVelocity.xVelocity;
    this.yVelocity = $CharacterVelocity.yVelocity;
    this.equipment = config.equipment || {};
    this.friends = config.friends || [];
    this.init();
  }

  init() {}

  setGameObjects(gameMap: gameMapGameObjectsI) {
    this.gameMapObjects = gameMap;
  }

  addOwnershipOfSkills() {
    for (let skill of this.unlockedSkills) {
      skill.Owner = this.name;
    }
  }

  renderSkill(
    ctx: CanvasRenderingContext2D,
    _skill: $Skill,
    camera: $Camera
  ): boolean {
    for (let skill of this.unlockedSkills) {
      skill.GameObjectsCallback = this;
      if (_skill.Name.toLowerCase() == skill.Name.toLowerCase()) {
        skill.draw(ctx, camera, this.lastDirection, { x: this.x, y: this.y });
        return true;
      }
    }
    return false;
  }

  findSkill(skillName: string): $Skill | undefined {
    return this.unlockedSkills.find((skill) => {
      return skill.name.toLowerCase() == skillName.toLowerCase();
    });
  }

  removeSkillFromRenderContex(object: $GameObject): boolean {
    let result = this.gameMapObjects.removeGameObject(object);
    if (result) {
      return true;
    }
    return false;
  }

  addSkillToRenderContex(object: $GameObject) {
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
  /**
   *
   * @param characterMovementState Should contain an attribute named arrow of type Direction.
   */
  updateCharacterLocationAndAppearance(
    characterMovementState: CharacterMovementStateI
  ): void {
    // this.updatePosition(characterMovementState);
    // console.log(characterMovementState);
    const GridBlockSize = 16;
    this.movingProgressRemaining = 0;
    //testing for attacks
    if (characterMovementState.arrow == $Direction.SKILL1) {
      this.movingProgressRemaining = GridBlockSize;
      return;
    }
    //this.isPlayerControlled &&
    //if player is not moving and controlled it reassigns their direction to their last button clicked
    if (this.movingProgressRemaining === 0 && characterMovementState.arrow) {
      this.direction = characterMovementState.arrow;
      this.movingProgressRemaining = GridBlockSize;
    }

    //if player is moving and controlled it reassigns their direction to their last button clicked and updates the movement gauge
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

    //if player is not moving it reassigns their animation to the idle ver. of the last direction they were moving in or defaults to right.
    else if (!characterMovementState.arrow) {
      this.movingProgressRemaining = 0;
      this.direction = this.lastDirection || $Direction.RIGHT;
    }

    this.updateSpriteAnimation(characterMovementState);
  }

  updatePosition(characterMovementState?) {
    if (this.movingProgressRemaining > 0) {
      const [property, change] = this.directionUpdate[this.direction];
      this[property] += change;
      this.movingProgressRemaining -= 1;
    }

    console.log("updatePosition called ", this.direction, this.x, this.y);
  }

  /**
   * @description Updates players movement based on passed in direction
   * @param characterMovementState
   */
  updateSpriteAnimation(characterMovementState: CharacterMovementStateI) {
    if (
      this.isPlayerControlled &&
      this.movingProgressRemaining === 0 &&
      !characterMovementState.arrow
    ) {
      let animation = null;
      switch (this.direction) {
        case "up":
          animation = $SpriteAnimations.idle_up;
          break;
        case "down":
          animation = $SpriteAnimations.idle_down;
          break;
        case "left":
          animation = $SpriteAnimations.idle_left;
          break;
        case "right":
          animation = $SpriteAnimations.idle_right;
          break;
        case "attack1":
          animation = $SpriteAnimations.attack1;
          break;
        default:
          animation = $SpriteAnimations.idle_right;
          break;
      }

      this.sprite.setAnimation(animation);
    }

    //Determines the walking animation to be played based on input direction
    if (this.movingProgressRemaining > 0) {
      let animation = null;

      switch (this.direction) {
        case "up":
          animation = $SpriteAnimations.walking_up;
          break;
        case "down":
          animation = $SpriteAnimations.walking_down;
          break;
        case "left":
          animation = $SpriteAnimations.walking_left;
          break;
        case "right":
          animation = $SpriteAnimations.walking_right;
          break;
        case "jump":
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
      case "up":
        animation = $SpriteAnimations.idle_up;
        break;
      case "down":
        animation = $SpriteAnimations.idle_down;
        break;
      case "left":
        animation = $SpriteAnimations.idle_left;
        break;
      case "right":
        animation = $SpriteAnimations.idle_right;
        break;
      case "attack1":
        animation = $SpriteAnimations.attack1;
        break;
      default:
        animation = $SpriteAnimations.idle_right;
        break;
    }

    this.sprite.setAnimation(animation);
  }
}
