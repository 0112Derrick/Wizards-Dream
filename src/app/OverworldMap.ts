import { Utils } from "./Utils.js";
import { GameObject } from "./GameObject.js";
import { Character } from "./Character.js";
import { } from './Types.js'

class OverworldMap {
    gameObjects: any;
    lowerImage: HTMLImageElement;
    upperImage: HTMLImageElement;


    // ctx!: CanvasRenderingContext2D | null;

    constructor(config) {
        this.gameObjects = config.gameObjects;

        this.lowerImage = new Image();
        this.lowerImage.src = config.lowerSrc;

        this.upperImage = new Image();
        this.upperImage.src = config.upperSrc;
    }

    drawLowerImage(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    drawUpperImage(ctx) {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }

}

class GameMap implements MapI {
    gameObjects: Array<GameObject>;
    playerList: Map<string, Character> = new Map();
    lowerImage: HTMLImageElement;
    upperImage: HTMLImageElement;
    name: string;

    constructor(config: MapConfigI) {
        this.gameObjects = config.gameObjects || [];
        this.lowerImage = new Image();
        this.lowerImage.src = config.lowerImageSrc;
        this.upperImage = new Image();
        this.upperImage.src = config.lowerImageSrc;
    }

    drawLowerImage(ctx: CanvasRenderingContext2D): void {
        throw new Error("Method not implemented.");
    }
    drawUpperImage(ctx: CanvasRenderingContext2D): void {
        throw new Error("Method not implemented.");
    }
    clearCanvas(ctx: CanvasRenderingContext2D): void {
        throw new Error("Method not implemented.");
    }

    addCharacter(character: Character): void {
        throw new Error("Method not implemented.");
    }
    addGameObject(object: GameObject): void {
        throw new Error("Method not implemented.");
    }
    removeCharacter(player: Character): void {
        throw new Error("Method not implemented.");
    }
    removeAllCharacters(): void {
        throw new Error("Method not implemented.");
    }
    viewCharacters(): any[] {
        throw new Error("Method not implemented.");
    }
    findCharacter(character: Character): Boolean {
        throw new Error("Method not implemented.");
    }
    syncCharactersList(playersList: Map<string, Character> | Array<Character>): void {
        throw new Error("Method not implemented.");
    }
    updateCharacterLocation(character: Character): void {
        throw new Error("Method not implemented.");
    }

}

interface MapConfigI {
    gameObjects: Array<GameObject> | null;
    lowerImageSrc: string | null;
    upperImageSrc: string | null;
}

interface OverworldMapsConfig {
    Maps: Array<GameMap>;
}

interface MapI {
    name: string;
    addCharacter(character: Character): void;
    addGameObject(object: GameObject): void;
    removeCharacter(player: Character): void;
    removeAllCharacters(): void;
    viewCharacters(): Array<any>;
    findCharacter(character: Character): Boolean;
    syncCharactersList(playersList: Map<string, Character> | Array<Character>): void;
    updateCharacterLocation(character: Character): void;
    drawLowerImage(ctx: CanvasRenderingContext2D): void;
    drawUpperImage(ctx: CanvasRenderingContext2D): void;
    clearCanvas(ctx: CanvasRenderingContext2D): void;
}

window.OverworldMaps = {
    grassyField: {
        lowerSrc: "/images/maps/Battleground1.png",
        upperSrc: "/images/maps/Battleground1.png",
        gameObjects: []
        // player01: new Character({
        //     isPlayerControlled: true,
        //     x: Utils.withGrid(6),
        //     y: Utils.withGrid(6),
        //     src: "/images/characters/players/erio.png",
        //     direction: 'down'
        // }),
        // hero: new Player({
        //     isPlayerControlled: false,
        //     posX: Utils.withGrid(5),
        //     posY: Utils.withGrid(6),
        // }),

    },
    hallway: {
        lowerSrc: "/images/maps/Battleground2.png",
        upperSrc: "/images/maps/Battleground2.png",
        gameObjects: {
            hero: new Character({
                isPlayerControlled: true,
                x: 5,
                y: 5,
            }),
            npcHero: new GameObject({
                x: 10,
                y: 4,
                src: "/images/characters/players/witch-girl.png"
            })
        }
    },
    giantTree: {

    }
};


export { OverworldMap }