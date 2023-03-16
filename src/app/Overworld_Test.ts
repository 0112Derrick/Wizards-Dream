import { OverworldMapsI } from "../players/interfaces/OverworldInterfaces.js";
import { MapNames } from "../constants/MapNames.js";
import { GameMap } from "./GameMap";


export class Overworld_Test implements OverworldMapsI {
    Maps: GameMap[];

    constructor() {
        this.Maps = [];
    }

    addMap(map: GameMap) {
        this.Maps.push(map);
    }

    init(gameMap: MapNames) {
        console.log("Overworld init started");

        this.Maps.forEach((map) => {
            if (gameMap == map.getMapName) {
                map.startGameLoop();
                console.log("Map: " + map.getMapName + " started.");
            }
        });
        console.log("OverWorld init complete.");
    }
}
