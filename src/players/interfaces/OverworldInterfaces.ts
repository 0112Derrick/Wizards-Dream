import { GameObject } from "../../app/GameObject.js";
import { Character } from "../../app/Character.js";
import { GameMap } from "../../app/OverworldMap.js";
import { MapNames } from "../../constants/MapNames.js";

export interface MapConfigI {
    gameObjects: GameObject[];
    activeCharacters: Map<string, Character> | null,
    lowerImageSrc: string | null;
    upperImageSrc: string | null;
    canvas: HTMLCanvasElement | null;
    element: HTMLElement | undefined;
    name: MapNames;
}

export interface OverworldMapsI {
    Maps: Array<GameMap>;
}

export interface MapI {
    addCharacter(character: Character): void;
    addGameObject(object: GameObject): void;
    removeCharacter(player: Character): void;
    removeAllCharacters(): void;
    viewCharacters(): IterableIterator<Character>;
    findCharacter(character: Character): Boolean;
    syncCharactersList(playersList: Map<string, Character> | Array<Character>): void;
    updateCharacterLocation(character: Character): void;
    drawLowerImage(ctx: CanvasRenderingContext2D): void;
    drawUpperImage(ctx: CanvasRenderingContext2D): void;
    clearCanvas(ctx: CanvasRenderingContext2D): void;
    startGameLoop(ctx: CanvasRenderingContext2D): void
}
