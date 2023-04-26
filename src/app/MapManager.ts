import { Overworld_Test as $Overworld_Test } from "./Overworld_Test.js"
import { MapConfigI as $MapConfigI, syncOverworld as $syncOverworld } from "../players/interfaces/OverworldInterfaces.js"
import { GameObject as $GameObject } from "./GameObject.js";
import { MapNames as $MapNames } from "../constants/MapNames.js"
import { GameMap as $GameMap } from "./GameMap.js";
import { Character as $Character } from "./Character.js";
import { characterDataInterface as $characterDataInterface } from "../players/interfaces/CharacterDataInterface.js";
import $CharacterManager from "./CharacterManager.js"

export default class MapManager {
    private maps: $GameMap[] = new Array<$GameMap>();
    private overworld: $Overworld_Test = null;

    private grassyfieldConfig: $MapConfigI = {
        gameObjects: new Array<$GameObject>(),
        activeCharacters: null,
        name: $MapNames.GrassyField,
        mapMinHeight: 0,
        mapMinWidth: 20,
        lowerImageSrc: '/images/maps/Battleground1.png',
        upperImageSrc: '/images/maps/Battleground1.png',
        element: document.querySelector(".game-container"),
        canvas: document.querySelector(".game-container").querySelector(".game-canvas"),
        targetFPS: 20,
        targerInterval: 1000 / 20,
        lastFrameTime: 0
    }

    private hallwayConfig: $MapConfigI = {
        gameObjects: new Array<$GameObject>(),
        activeCharacters: null,
        name: $MapNames.Hallway,
        mapMinHeight: 0,
        mapMinWidth: 20,
        lowerImageSrc: '/images/maps/Battleground2.png',
        upperImageSrc: '/images/maps/Battleground2.png',
        element: document.querySelector(".game-container"),
        canvas: document.querySelector(".game-container").querySelector(".game-canvas"),
        targetFPS: 20,
        targerInterval: 1000 / 20,
        lastFrameTime: 0
    }

    constructor() {

    }

    createOverworld() {
        let grassyField = new $GameMap(this.grassyfieldConfig);
        let hallway = new $GameMap(this.hallwayConfig);
        this.maps.push(grassyField);
        this.maps.push(hallway);

        this.overworld = new $Overworld_Test();
        this.overworld.addMap(grassyField);
        this.overworld.addMap(hallway);

        console.log(`Overworld created with these maps: ${grassyField.getMapName}, ${hallway.getMapName}.`);
    }

    setClientsCharacterOnMap(character: $Character, map: $MapNames): void {
        let characterMap = this.findOverworldMapByName(map);
        if (characterMap != null) {
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
            gameObjects = this.findOverworldMapByName($MapNames.GrassyField).GameObjects;

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

    syncOverworld(overworld: $syncOverworld, characterManager: $CharacterManager) {

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
                    console.log("GameObjects grassyfield: ", overworld.grassyfield.gameObjects, " Type: ", typeof overworld.grassyfield.gameObjects)
                    let syncedOverworldGameObjects = Object.values(overworld.grassyfield.gameObjects);
                    let updatedObjects = [];

                    syncedOverworldGameObjects.forEach((character: $characterDataInterface) => {
                        if (character.name == characterManager.Character.name || character.player == characterManager.Character.player) {
                            updatedObjects.push(characterManager.Character);
                        } else {
                            updatedObjects.push(characterManager.createCharacterFromCharacterDataI(character as $characterDataInterface))
                        }
                    });
                    map.syncGameObjects(updatedObjects);

                } else {
                    let updatedObjects = [];
                    overworld.grassyfield.gameObjects.forEach((character) => {

                        if (character.username == characterManager.Character.username) {

                            updatedObjects.push(characterManager.Character);

                        } else {

                            updatedObjects.push(characterManager.createCharacterFromCharacterDataI(character));

                        }
                    })
                    map.syncGameObjects(updatedObjects);
                }
            }

            if (map.getMapName == $MapNames.Hallway) {

                map.syncActiveCharacters(overworld.hallway.activePlayers);

                if (!Array.isArray(overworld.hallway.gameObjects)) {
                    console.log("GameObjects hallway: ", overworld.hallway.gameObjects, " Type: ", typeof overworld.hallway.gameObjects)
                    let syncedOverworldGameObjects = Object.values(overworld.hallway.gameObjects);
                    let updatedObjects = [];
                    syncedOverworldGameObjects.forEach((character) => {
                        updatedObjects.push(characterManager.createCharacterFromCharacterDataI(character as $characterDataInterface))
                    });

                    map.syncGameObjects(updatedObjects);
                } else {
                    let updatedObjects = [];
                    overworld.hallway.gameObjects.forEach((character) => {
                        updatedObjects.push(characterManager.createCharacterFromCharacterDataI(character));
                    })
                    map.syncGameObjects(updatedObjects);
                }
            }
        })

        //console.log("Received sync overworld response from the server.");
    }
}
