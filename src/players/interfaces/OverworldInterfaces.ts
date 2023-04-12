import { GameObject as $GameObject } from "../../app/GameObject.js";
import { Character as $Character } from "../../app/Character.js";
import { GameMap as $GameMap } from "../../app/GameMap";
import { MapNames as $MapNames } from "../../constants/MapNames.js";
import { characterDataInterface as $characterDataInterface, commonGameDataInterface as $commonGameDataInterface } from "./CharacterDataInterface.js"

export interface MapConfigI {
    mapMinWidth: number;
    mapMinHeight: number;
    gameObjects: $GameObject[];
    activeCharacters: Map<string, $Character> | null,
    lowerImageSrc: string | null;
    upperImageSrc: string | null;
    canvas: HTMLCanvasElement | null;
    element: HTMLElement | undefined;
    name: $MapNames;
    targetFPS: number;
    targerInterval: number;
    lastFrameTime: number;
}

export interface OverworldMapsI {
    Maps: Array<$GameMap>;
}

export interface MapI {
    addCharacter(character: $Character): void;
    addGameObject(object: $GameObject): void;
    removeCharacter(player: $Character): void;
    removeAllCharacters(): void;
    viewCharacters(): IterableIterator<$characterDataInterface>;
    findCharacter(character: $Character): Boolean;
    syncGameObjects(objects: Map<string, $Character> | Array<$GameObject>): void;
    syncActiveCharacters(characters: Map<string, $characterDataInterface>): void;
    updateCharacterLocation(character: $Character): void;
    drawLowerImage(ctx: CanvasRenderingContext2D): void;
    drawUpperImage(ctx: CanvasRenderingContext2D): void;
    clearCanvas(ctx: CanvasRenderingContext2D): void;
    startGameLoop(ctx: CanvasRenderingContext2D): void
}

export interface OverWorld_MapI {
    name: $MapNames,
    activePlayers: Map<string, $characterDataInterface>,
    gameObjects: $Character[],
    lowerSrc: string,
    upperSrc: string,
}

export interface syncOverworld {
    grassyfield: {
        name: $MapNames.GrassyField,
        activePlayers: Map<string, $characterDataInterface>,
        gameObjects: $Character[],
    }

    hallway: {
        name: $MapNames.Hallway,
        activePlayers: Map<string, $characterDataInterface>,
        gameObjects: $Character[],
    }
}