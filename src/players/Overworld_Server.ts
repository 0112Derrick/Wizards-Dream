import { Character } from "../app/Character.js";
import { MapNames } from "../constants/MapNames.js";
import { OverWorld_MapI } from "./interfaces/OverworldInterfaces.js";

export class Overworld_Server {
    maps: Map<MapNames, OverWorld_MapI>;
    constructor() {
        this.maps = new Map();
        this.maps.set(MapNames.GrassyField, this.grassyfield);
        this.maps.set(MapNames.Hallway, this.hallway);
    }
    grassyfield: OverWorld_MapI = {
        name: MapNames.GrassyField,
        activePlayers: new Map<string, Character>(),
        gameObjects: [],
        lowerSrc: '/images/maps/Battleground1.png',
        upperSrc: '/images/maps/Battleground1.png',
        //element: string = 'document.querySelector(".game-container");'
    };

    hallway: OverWorld_MapI = {
        name: MapNames.Hallway,
        activePlayers: new Map<string, Character>(),
        gameObjects: [],
        lowerSrc: '/images/maps/Battleground2.png',
        upperSrc: '/images/maps/Battleground2.png',
        //element: string = 'document.querySelector(".game-container");'
    };
}
