import { Character as $Character } from "./Character.js";
import {
  CharacterVelocity as $CharacterVelocity,
  CharacterSize as $CharacterSize,
} from "../constants/CharacterAttributesConstants.js";
import { Sprite } from "./Sprite.js";
import {
  characterDataInterface as $characterDataInterface,
  inputHistory as $inputHistory,
} from "../game-server/interfaces/CharacterDataInterface.js";
import { MapNames as $MapNames } from "../constants/MapNames.js";
import { Utils as $Utils } from "./Utils.js";
import { CharacterCreationDataInterface as $characterSignup } from "../game-server/interfaces/CharacterDataInterface.js";
import { Direction as $Direction } from "./DirectionInput.js";
import { Skill as $Skill, Skill } from "./Skill.js";
import { SkillTypes as $SkillTypes } from "../constants/SkillTypes.js";

export default class CharacterManager {
  private character: $Character = null;
  private listOfCharacters: any[] = null;
  private clientInputHistory: Map<number, $inputHistory> = new Map<
    number,
    $inputHistory
  >();
  private characterSkills: Array<$Skill> = [];

  constructor() {
    this.fetchSkills();
  }

  public get InputHistory(): Map<number, $inputHistory> {
    return this.clientInputHistory;
  }

  public get Character(): $Character {
    return this.character;
  }

  public SETCharacter(char: $Character): void {
    this.character = char;
  }

  getListOfCharacters(): any[] {
    return this.listOfCharacters;
  }

  setListOfCharacter(characters: Array<any>) {
    if (Array.isArray(characters)) {
      this.listOfCharacters = characters;
      console.log("Characters array set.");
    }
  }

  selectCharacterByIndex(index: number): any {
    if (index > this.listOfCharacters.length) {
      console.log(
        "Index out of bounds. index:" +
          index +
          " character list length: " +
          this.listOfCharacters.length
      );
      return;
    }

    return this.listOfCharacters.at(index);
  }

  printActiveCharacter(): void {
    console.log("Character: " + this.character.toJSON());
  }

  fetchSkills() {
    fetch("/src/constants/skills.json")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);

        for (let skill of data) {
          let type: $SkillTypes;
          switch (data.type) {
            case $SkillTypes.RANGED: {
              type = $SkillTypes.RANGED;
              break;
            }
            case $SkillTypes.MELEE: {
              type = $SkillTypes.MELEE;
              break;
            }
            case $SkillTypes.HEAL: {
              type = $SkillTypes.HEAL;
              break;
            }
          }

          this.characterSkills.push(
            new $Skill({
              x: skill.x,
              y: skill.y,
              name: skill.name,
              src: skill.src,
              direction: null,
              createSprite: false,
              dependencies: skill.dependencies,
              xVelocity: skill.velocity,
              yVelocity: skill.velocity,
              type: type,
              shape: skill.shape,
              castTime: skill.castTime,
              element: skill.element,
              power: skill.power,
              effectTime: skill.effectTime,
              cooldown: skill.cooldown,
            })
          );
        }
      })
      .catch((error) => {
        console.log("Error:", error);
      });
  }
  addBasicSkillsToHotBar() {
    this.Character.unlockedSkills.forEach((skill) => {
      this.Character.hotbar.push(skill);
    });
  }

  updateHotBar(pos: number, skill?: Skill, item?: any) {
    if (skill) this.Character.hotbar.splice(pos, 1, skill);
    if (item) this.Character.hotbar.splice(pos, 1, item);
  }

  addCharacterBasicSkills() {
    let basicMeleeAtk = this.characterSkills.find((skill) => {
      return skill.name.toLowerCase() == "melee attack";
    });

    let basicRangedAtk = this.characterSkills.find((skill) => {
      return skill.name.toLowerCase() == "ranged attack";
    });

    if (basicMeleeAtk) {
      this.Character.unlockedSkills.push(basicMeleeAtk);
    } else {
      console.log("Failure to find basic melee attack.");
    }

    if (basicRangedAtk) {
      this.Character.unlockedSkills.push(basicRangedAtk);
    } else {
      console.log("Failure to find basic ranged attack.");
    }
  }

  createCharacterFromCharacterDataI(
    character: $characterDataInterface
  ): $Character {
    if (character.y >= 400) {
      character.y = 100;
    }

    let createdCharacter = new $Character({
      isPlayerControlled: false,
      x: character.x,
      y: character.y,
      name: character.name || character.username,
      xVelocity: $CharacterVelocity.xVelocity,
      yVelocity: $CharacterVelocity.yVelocity,
      width: character.width,
      height: character.height,
      sprite: new Sprite({
        gameObject: this,
        src: character.sprite.src || "/images/characters/players/erio.png",
      }),
      username: character.username,
      attributes: character.attributes,
      characterGender: character.characterGender,
      unlockedSkills: character.unlockedSkills,
      player: character.player,
      class: character.class,
      guild: character.guild,
      characterID: character.gameObjectID,
      items: character.items,
      direction: character.direction || "right",
    });
    return createdCharacter;
  }

  //create an interface for obj
  syncUsertoCharacter(obj) {
    let char = new $Character({
      isPlayerControlled: true,
      name: obj.username,
      x: $Utils.withGrid(6),
      y: $Utils.withGrid(6),
      sprite: new Sprite({
        src: obj.src || "/images/characters/players/erio.png",
      }),
      width: obj.width,
      height: obj.height,
      direction: obj.direction || "right",
      characterID: obj._id,
      username: obj.username,
      attributes: obj.attributes,
      unlockedSkills: obj.unlockedSkills,
      class: obj.class,
      guild: obj.guild,
      items: obj.items,
      player: obj.player,
      location: obj.location || $MapNames.GrassyField,
      xVelocity: $CharacterVelocity.xVelocity,
      yVelocity: $CharacterVelocity.yVelocity,
    });

    if (!char.location) {
      char.location = $MapNames.GrassyField;
    }

    this.SETCharacter(char);
    return char;
  }
}
