import { MapNames as $MapNames } from "../constants/MapNames.js";
import { GameMap as $GameMap } from "./GameMap.js";
import { characterDataInterface as $characterDataInterface } from "../game-server/interfaces/CharacterDataInterface.js";
import { Direction as $Direction } from "./DirectionInput.js";

export const Utils = {
  withGrid(n) {
    return n * 16;
  },
};

class UtilFunctions {
  findOverworldMapByName(
    selectedMap: $MapNames,
    searchingList: Array<$GameMap>
  ): $GameMap | null {
    let foundMap = null;
    for (let map of searchingList) {
      console.log(`map: ${map.getMapName} , searching map: ${selectedMap}`);
      if (map.getMapName == selectedMap) {
        foundMap = map;
        break;
      }
    }
    return foundMap;
  }

  findObjectByNameInArray(name: string, list: Array<any>): any | null {
    for (let obj of list) {
      if (obj.name == name) {
        console.log("Found object: ", obj.name);
        return obj;
      }
    }
    console.log("Unable to find object");
    return null;
  }

  findObjectByidInArray(id: number, list: Array<any>): any | null {
    for (let obj of list) {
      if (obj.id == id) {
        console.log("Found object: ", obj.id);
        return obj;
      }
    }
    console.log("Unable to find object");
    return null;
  }

  removeObjectFromArray(
    list: Array<any>,
    propertyToMatch: string,
    identifier: any
  ): Array<any> | null {
    if (list.length == 0) {
      return null;
    }
    let returnArr = [];
    let objectIndex = -1;

    for (let i = 0; i < list.length; i++) {
      if (list[i][propertyToMatch] == identifier) {
        objectIndex = i;
      }
    }
    if (objectIndex == -1) {
      return null;
    }

    returnArr = returnArr.concat(list);
    returnArr.splice(objectIndex, 1);

    return returnArr;
  }

  objectToMap(obj: Object): Map<any, any> {
    return new Map(Object.entries(obj));
  }

  checkIfObjectMeetsCharacterDataInterface(
    object: any,
    testing = false
  ): boolean | { result: boolean; data: string } {
    if (!(object instanceof Object)) {
      return false;
    }

    if (testing && !(object instanceof Object)) {
      return { result: false, data: "null" };
    }

    let missingItemsArray: Array<string> = [];
    let direction: boolean,
      unlockedSkills: boolean,
      hotbar: boolean,
      name: boolean,
      xVelocity: boolean,
      yVelocity: boolean,
      username: boolean,
      _class: boolean,
      characterGender: boolean,
      width: boolean,
      height: boolean,
      location: boolean,
      attributes: boolean,
      guild: boolean,
      items: boolean,
      player: boolean,
      friends: boolean,
      equipment: boolean,
      x: boolean,
      y: boolean,
      sprite: boolean = false;

    "name" in object ? (name = true) : missingItemsArray.push(" name");

    "direction" in object
      ? (direction = true)
      : missingItemsArray.push(" direction");

    "username" in object
      ? (username = true)
      : missingItemsArray.push(" username");

    "class" in object ? (_class = true) : missingItemsArray.push(" class");

    "xVelocity" in object
      ? (xVelocity = true)
      : missingItemsArray.push(" xVelocity");

    "yVelocity" in object
      ? (yVelocity = true)
      : missingItemsArray.push(" yVelocity");

    "characterGender" in object
      ? (characterGender = true)
      : missingItemsArray.push(" characterGender");

    "width" in object ? (width = true) : missingItemsArray.push(" width");

    "unlockedSkills" in object
      ? (unlockedSkills = true)
      : missingItemsArray.push(" unlockedSkills");

    "height" in object ? (height = true) : missingItemsArray.push(" height");

    "location" in object
      ? (location = true)
      : missingItemsArray.push(" location");

    "attributes" in object
      ? (attributes = true)
      : missingItemsArray.push(" attributes");

    "guild" in object ? (guild = true) : missingItemsArray.push(" guild");

    "items" in object ? (items = true) : missingItemsArray.push(" items");

    "player" in object ? (player = true) : missingItemsArray.push(" player");

    "friends" in object ? (friends = true) : missingItemsArray.push(" friends");

    "equipment" in object
      ? (equipment = true)
      : missingItemsArray.push(" equipment");

    "x" in object ? (x = true) : missingItemsArray.push(" x");

    "y" in object ? (y = true) : missingItemsArray.push(" y");

    "sprite" in object ? (sprite = true) : missingItemsArray.push(" sprite");

    "hotbar" in object ? (hotbar = true) : missingItemsArray.push(" hotbar");

    if (
      testing &&
      direction &&
      xVelocity &&
      yVelocity &&
      username &&
      _class &&
      characterGender &&
      width &&
      height &&
      location &&
      attributes &&
      guild &&
      items &&
      player &&
      friends &&
      equipment &&
      unlockedSkills &&
      hotbar &&
      x &&
      y &&
      sprite
    ) {
      let resultString =
        "Character does meet the standards of character data interface.";

      return { result: true, data: resultString };
    }

    if (
      direction &&
      xVelocity &&
      yVelocity &&
      username &&
      _class &&
      characterGender &&
      width &&
      height &&
      location &&
      attributes &&
      hotbar &&
      unlockedSkills &&
      guild &&
      items &&
      player &&
      friends &&
      equipment &&
      x &&
      y &&
      sprite
    ) {
      console.log("✅ object is a character.");
      return true;
    }

    let failureString: string = "❌ object is not a charcter. Missing:";
    let missingItems: string = "";

    for (let item = 0; item < missingItemsArray.length; item++) {
      missingItems += missingItemsArray[item];
      if (item < missingItemsArray.length) {
        missingItems += ",";
      }
      if (item % 4 == 0) {
        missingItems += "...\n";
      }
    }

    if (testing) {
      let s = failureString + missingItems;
      let result = { result: false, data: s };
      return result;
    }

    console.log(failureString + missingItems);
    return false;
  }

  _testCheckIfObjectIsCharacter(): string {
    let resultA: boolean,
      resultB: boolean,
      resultC: boolean,
      resultD: boolean = false;
    let objectA = {};
    let objectB: $characterDataInterface = {
      attributes: {
        level: 0,
        experience: 0,
        experienceCap: 0,
        statPoints: 0,
        hp: 0,
        sp: 0,
        def: 0,
        mdef: 0,
        crit: 0,
        Atk: 0,
        Matk: 0,
        Vit: 0,
        Men: 0,
        Dex: 0,
        hpCap: 0,
        spCap: 0,
      },
      unlockedSkills: [],
      class: "test",
      guild: "test",
      friends: [],
      items: [],
      hotbar: [],
      equipment: {
        head: [],
        chest: [],
        legs: [],
        weapon: [],
      },
      characterGender: "test",
      player: undefined,
      location: $MapNames.GrassyField,
      x: 0,
      y: 0,
      sprite: "sprite.png",
      direction: $Direction.RIGHT,
      width: 0,
      height: 0,
      xVelocity: 0,
      yVelocity: 0,
      gameObjectID: 0,
      name: "test",
      username: "test",
    };

    let testResults: string = "";

    let returnValA,
      returnValB,
      returnValC,
      returnValD = null;
    returnValA = this.checkIfObjectMeetsCharacterDataInterface(objectA, true);
    returnValB = this.checkIfObjectMeetsCharacterDataInterface(objectB, true);
    returnValC = this.checkIfObjectMeetsCharacterDataInterface(
      [
        "gameObjectID",
        "name",
        "username",
        "yVelocity",
        "height",
        "width",
        "direction",
        "sprite",
        "y",
        "x",
        "location",
        "player",
        "characterGender",
        "class",
        "unlockedSkills",
        "hotbar",
        "guild",
        "friends",
        "items",
        "equipment",
        "attributes",
      ],
      true
    );
    returnValD = this.checkIfObjectMeetsCharacterDataInterface([], true);

    if (returnValA.result == false) {
      testResults += "test checkIfObjectIsCharacter \n blank object: success";
      resultA = true;
    } else {
      testResults +=
        "test checkIfObjectIsCharacter \n blank Object: failure " +
        returnValA.data;
    }
    if (returnValB.result == true) {
      testResults +=
        "test checkIfObjectIsCharacter \n Filled in object : success";
      resultB = true;
    } else {
      testResults +=
        "test checkIfObjectIsCharacter \n Filled in Object: failure " +
        returnValB.data;
    }
    if (returnValC.result == false) {
      testResults += "test checkIfObjectIsCharacter \n As an array : success";
      resultC = true;
    } else {
      testResults +=
        "test checkIfObjectIsCharacter \n Character data as an Array: failure " +
        returnValC.data;
    }
    if (returnValD.result == false) {
      testResults += "test checkIfObjectIsCharacter \n blank array: success";
      resultD = true;
    } else {
      testResults +=
        "test checkIfObjectIsCharacter \n blank array: failure " +
        returnValD.data;
    }

    return testResults;
  }
}
const utilFunctions = new UtilFunctions();
export { utilFunctions };
