import { Overworld_Test as $Overworld_Test } from "./Overworld_Test.js";
import {
  MapConfigI as $MapConfigI,
  syncOverworld as $syncOverworld,
} from "../game-server/interfaces/OverworldInterfaces.js";
import { GameObject as $GameObject } from "./GameObject.js";
import { MapNames as $MapNames } from "../constants/MapNames.js";
import { GameMap as $GameMap } from "./GameMap.js";
import { Character as $Character } from "./Character.js";
import { characterDataInterface as $characterDataInterface } from "../game-server/interfaces/CharacterDataInterface.js";
import $CharacterManager from "./CharacterManager.js";
import { Direction as $Direction } from "./DirectionInput.js";
import { utilFunctions } from "./Utils.js";
//import * as fs from 'fs';
import { error } from "console";
import { Message as $Message } from "../framework/MessageHeader.js";
const filePath = "../testing.txt";

export default class MapManager {
  private maps: $GameMap[] = new Array<$GameMap>();
  private overworld: $Overworld_Test = null;

  private grassyfieldConfig: $MapConfigI = {
    gameObjects: new Array<$GameObject>(),
    activeCharacters: new Map<string, $characterDataInterface>(),
    name: $MapNames.GrassyField,
    mapMinHeight: 0,
    mapMinWidth: 20,
    lowerImageSrc: "/images/maps/Battleground1.png",
    upperImageSrc: "/images/maps/Battleground1.png",
    element: document.querySelector(".game-container"),
    canvas: document
      .querySelector(".game-container")
      .querySelector(".game-canvas"),
    targetFPS: 20,
    targerInterval: 1000 / 20,
    lastFrameTime: 0,
  };

  private hallwayConfig: $MapConfigI = {
    gameObjects: new Array<$GameObject>(),
    activeCharacters: new Map<string, $characterDataInterface>(),
    name: $MapNames.Hallway,
    mapMinHeight: 0,
    mapMinWidth: 20,
    lowerImageSrc: "/images/maps/Battleground2.png",
    upperImageSrc: "/images/maps/Battleground2.png",
    element: document.querySelector(".game-container"),
    canvas: document
      .querySelector(".game-container")
      .querySelector(".game-canvas"),
    targetFPS: 20,
    targerInterval: 1000 / 20,
    lastFrameTime: 0,
  };

  constructor() {}

  createOverworld() {
    let grassyField = new $GameMap(this.grassyfieldConfig);
    let hallway = new $GameMap(this.hallwayConfig);
    this.maps.push(grassyField);
    this.maps.push(hallway);

    this.overworld = new $Overworld_Test();
    this.overworld.addMap(grassyField);
    this.overworld.addMap(hallway);

    console.log(
      `Overworld created with these maps: ${grassyField.getMapName}, ${hallway.getMapName}.`
    );
  }

  setClientsCharacterOnMap(character: $Character, map: $MapNames): void {
    let characterMap = this.findOverworldMapByName(map);
    if (characterMap != null) {
      character.setGameObjects(characterMap);
      characterMap.setClientCharacter(character);
      return;
    }
    console.log("characterMap is null.");
  }

  addCharacterToMap(character: $Character, selectedMap: $MapNames) {
    let map = this.findOverworldMapByName(selectedMap);
    map.addCharacter(character);
  }

  findOverworldMapByName(selectedMap: $MapNames): $GameMap | null {
    let foundMap = null;
    for (let map of this.overworld.Maps) {
      console.log(`map: ${map.getMapName} , searching map: ${selectedMap}`);
      if (map.getMapName == selectedMap) {
        foundMap = map;
        break;
      }
    }
    return foundMap;
  }

  addCharacterToOverworld(character: $Character, map = $MapNames.GrassyField) {
    let gameObjects = null;

    let selectedMap = this.findOverworldMapByName(map);

    if (selectedMap) {
      gameObjects = selectedMap.GameObjects;
    } else {
      console.log("Unable to find map.\nDefaulted user to Grassyfield map. ");
      gameObjects = this.findOverworldMapByName(
        $MapNames.GrassyField
      ).GameObjects;
    }

    gameObjects.forEach((gameObject: $GameObject) => {
      if (gameObject instanceof $Character) {
        if ((gameObject as $Character).username == character.username) {
          console.log("Character is already exists in this map.");
          return;
        }
      }
    });
    gameObjects.push(character);
  }

  startOverWorld(startMap: $MapNames = $MapNames.GrassyField) {
    if (this.overworld == null) {
      this.createOverworld();
    }
    this.overworld.init(startMap);
  }

  changeGameMap(map: $MapNames) {
    this.overworld.init(map);
  }

  updateGameObjects(gameObjects: $GameObject[], updatedMap: $MapNames) {
    let map = this.findOverworldMapByName(updatedMap);
    map.syncGameObjects(gameObjects);
  }

  updateCharacterPositionViaServerREQ(
    character: $Character,
    x: number,
    y: number
  ) {
    let map = this.findOverworldMapByName(character.location);
    map.setCharacterPosition(character, x, y);
  }
  /**
   * Will take in a object check it to see if it meets the standards of a character
   * Will check to see if the equivalent of this character already exist on the map based on character location data
   * Will determine what direction the character walked in based on deltas
   * Will update the gameObject equivalency of the character on the map to the new location and play the correct walk animation based on the direction.
   */

  moveNonControlledCharactersWithAnimations(message: {
    coords;
    username;
    id;
    location;
  }): void {
    // let result = this.checkIfObjectIsCharacter(character);
    //if (!result) return;
    console.log("action: ", message);
    let { coords, username, id, location } = message;
    let map = this.findOverworldMapByName(location);
    let foundCharacter = map.findCharacterByName(username);
    if (foundCharacter == null) {
      return;
    }
    let delta = { x: foundCharacter.x, y: foundCharacter.y };
    let direction = this.determineCharacterWalkingDirectionBasedOnDeltas(
      delta,
      coords
    );
    foundCharacter.updateCharacterLocationAndAppearance({ arrow: direction });
    foundCharacter.x = coords.x;
    foundCharacter.y = coords.y;
    setTimeout(() => {
      foundCharacter.playIdleAnimation();
    }, 1000);
  }

  checkIfObjectIsCharacter(obj: any, testing: boolean) {
    return utilFunctions.checkIfObjectMeetsCharacterDataInterface(obj, testing);
  }

  _testDetermineCharacterWalkingDirectionBasedOnDeltas(): boolean {
    let resultA: boolean,
      resultB: boolean,
      resultC: boolean,
      resultD: boolean,
      resultE: boolean,
      resultF: boolean,
      resultG: boolean,
      resultH: boolean,
      resultI: boolean = false;
    let directionA: $Direction,
      directionB: $Direction,
      directionC: $Direction,
      directionD: $Direction,
      directionE: $Direction = null;
    let directionArr = [
      directionA,
      directionB,
      directionC,
      directionD,
      directionE,
    ];
    let deltaTest = { x: 10, y: 10 };
    let deltaPosX = { x: 20, y: 10 };
    let deltaPosY = { x: 10, y: 20 };
    let deltaNegX = { x: 0, y: 20 };
    let deltaNegY = { x: 10, y: 0 };
    let testingArr = [deltaTest, deltaPosX, deltaPosY, deltaNegX, deltaNegY];

    for (let i = 0; i < testingArr.length; i++) {
      let test = testingArr[i];
      directionArr[i] = this.determineCharacterWalkingDirectionBasedOnDeltas(
        deltaTest,
        test
      );
    }

    if (
      this.determineCharacterWalkingDirectionBasedOnDeltas(deltaTest, {
        x: null,
        y: 10,
      }) == null
    ) {
      console.log("x is null test passed\n");
      resultF = true;
    } else {
      console.log("x is null test failed\n");
    }
    if (
      this.determineCharacterWalkingDirectionBasedOnDeltas(deltaTest, {
        y: null,
        x: 10,
      }) == null
    ) {
      console.log("y is null test passed\n");
      resultG = true;
    } else {
      console.log("y is null test failed\n");
    }
    if (
      this.determineCharacterWalkingDirectionBasedOnDeltas(deltaTest, {
        x: null,
        y: null,
      }) == null
    ) {
      console.log("x & y are null test passed\n");
      resultH = true;
    } else {
      console.log("x & y test failed\n");
    }
    if (
      this.determineCharacterWalkingDirectionBasedOnDeltas(
        { x: null, y: null },
        { x: null, y: null }
      ) == null
    ) {
      console.log("both objects x & y are null\n");
      resultI = true;
    } else {
      console.log("both objects x & y are null test failed\n");
    }

    console.log("Directions test based on deltas: \n");
    if (directionA == $Direction.STANDSTILL) {
      resultA = true;
      console.log("standstill test passed.\n");
    } else {
      console.log("standstill test failed.\n");
    }
    if (directionB == $Direction.RIGHT) {
      resultB = true;
      console.log("right test passed.\n");
    } else {
      console.log("right test failed.\n");
    }
    if (directionC == $Direction.DOWN) {
      resultC = true;
      console.log("down test passed.\n");
    } else {
      console.log("down test failed.\n");
    }
    if (directionD == $Direction.LEFT) {
      resultD = true;
      console.log("left test passed.\n");
    } else {
      console.log("left test failed.\n");
    }
    if (directionE == $Direction.UP) {
      resultE = true;
      console.log("up test passed.");
    } else {
      console.log("up test failed.");
    }

    if (
      resultA &&
      resultB &&
      resultC &&
      resultD &&
      resultE &&
      resultF &&
      resultG &&
      resultH &&
      resultI
    ) {
      console.log("DetermineCharacterWalkingDirectionBasedOnDelta passed");
      return true;
    }
    console.log("DetermineCharacterWalkingDirectionBasedOnDelta failed");
    return false;
  }

  /**
   *Takes two delta objects with properties of x:number & y:number
   *Returns a Direction based on the difference in the deltas.
   *Delta1 will be treated as the character delta and the delta 2 will be treated as the new position.
   */
  determineCharacterWalkingDirectionBasedOnDeltas(
    delta1: { x: number; y: number },
    delta2: { x: number; y: number }
  ): $Direction | null {
    let direction: $Direction = null;
    let standingstill = { x: false, y: false };

    if (!delta1 && !delta2) {
      console.log("Incorrect data types passed in.");
      return null;
    }
    if (!("x" in delta1) && !("y" in delta1)) {
      console.log("Missing properties.");
      return null;
    }

    if (!("x" in delta2) && !("y" in delta2)) {
      console.log("Missing properties.");
      return null;
    }

    console.log("Comparing x deltas:", delta1.x, " ", delta2.x);
    if (delta1.x == delta2.x) {
      console.log("no change in x");
      standingstill.x = true;
    }
    if (delta1.x < delta2.x) {
      console.log("x increased, direction set to right.");
      direction = $Direction.RIGHT;
    } else if (delta1.x > delta2.x) {
      console.log("x decreased, direction set to left.");
      direction = $Direction.LEFT;
    }

    console.log("Comparing y deltas:", delta1.y, " ", delta2.y);
    if (delta1.y == delta2.y) {
      console.log("no change in y");
      standingstill.y = true;
    }
    if (delta1.y < delta2.y) {
      console.log("y increased, direction set to down.");
      direction = $Direction.DOWN;
    } else if (delta1.y > delta2.y) {
      console.log("y decreased, direction set to up.");
      direction = $Direction.UP;
    }
    if (standingstill.x && standingstill.y) {
      console.log("Character is not moving.");
      direction = $Direction.STANDSTILL;
    }

    return direction;
  }

  removeCharacterFromMap(character: any) {
    if (!utilFunctions.checkIfObjectMeetsCharacterDataInterface(character)) {
      console.log("Object is not a character.");
      return;
    }

    let map = this.findOverworldMapByName(
      (character as $characterDataInterface).location
    );
    let foundCharacter = map.findCharacterByName(
      (character as $characterDataInterface).username
    );
    if (map.getMapName == $MapNames.GrassyField)
      map.removeCharacter(foundCharacter, this.maps.at(0));
    if (map.getMapName == $MapNames.Hallway)
      map.removeCharacter(foundCharacter, this.maps.at(1));
  }

  syncOverworld(
    overworld: $syncOverworld,
    characterManager: $CharacterManager
  ) {
    //let matchFound = false;
    /*come up with a framework to do interpolation
          dependency injection or visitor pattern
          vector from server > visitor pattern that implements interpolation
          based on current direction continue moving non player controlled characters in that direction until you receive an update from the server
        */
    console.log("Received sync overworld data: " + overworld);

    this.overworld.Maps.forEach((map) => {
      if (map.getMapName == $MapNames.GrassyField) {
        map.syncActiveCharacters(overworld.grassyfield.activePlayers);

        if (!Array.isArray(overworld.grassyfield.gameObjects)) {
          console.log(
            "GameObjects grassyfield: ",
            overworld.grassyfield.gameObjects,
            " Type: ",
            typeof overworld.grassyfield.gameObjects
          );
          let syncedOverworldGameObjects = Object.values(
            overworld.grassyfield.gameObjects
          );
          let updatedObjects = [];

          syncedOverworldGameObjects.forEach(
            (character: $characterDataInterface) => {
              if (
                character.name == characterManager.Character.name ||
                character.player == characterManager.Character.player
              ) {
                updatedObjects.push(characterManager.Character);
              } else {
                updatedObjects.push(
                  characterManager.createCharacterFromCharacterDataI(
                    character as $characterDataInterface
                  )
                );
              }
            }
          );

          map.syncGameObjects(updatedObjects);
        } else {
          let updatedObjects = [];
          overworld.grassyfield.gameObjects.forEach((character) => {
            if (character.username == characterManager.Character.username) {
              updatedObjects.push(characterManager.Character);
            } else {
              updatedObjects.push(
                characterManager.createCharacterFromCharacterDataI(character)
              );
            }
          });
          map.syncGameObjects(updatedObjects);
        }
      }

      if (map.getMapName == $MapNames.Hallway) {
        map.syncActiveCharacters(overworld.hallway.activePlayers);

        if (!Array.isArray(overworld.hallway.gameObjects)) {
          console.log(
            "GameObjects hallway: ",
            overworld.hallway.gameObjects,
            " Type: ",
            typeof overworld.hallway.gameObjects
          );
          let syncedOverworldGameObjects = Object.values(
            overworld.hallway.gameObjects
          );
          let updatedObjects = [];
          syncedOverworldGameObjects.forEach((character) => {
            updatedObjects.push(
              characterManager.createCharacterFromCharacterDataI(
                character as $characterDataInterface
              )
            );
          });

          map.syncGameObjects(updatedObjects);
        } else {
          let updatedObjects = [];
          overworld.hallway.gameObjects.forEach((character) => {
            updatedObjects.push(
              characterManager.createCharacterFromCharacterDataI(character)
            );
          });
          map.syncGameObjects(updatedObjects);
        }
      }
    });

    //console.log("Received sync overworld response from the server.");
  }
}
