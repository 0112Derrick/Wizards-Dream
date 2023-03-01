import { Utils } from "./Utils.js";
import { GameObject } from "./GameObject.js";
import { Character } from "./Character.js";
import { } from './Types.js'
import { PrivateIdentifier } from "typescript";
import { Direction } from "readline";
import { DirectionInput } from "./DirectionInput.js";
import { clientController } from "./ClientController.js";

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
    private name: string;
    canvas: HTMLCanvasElement | null;
    private ctx: CanvasRenderingContext2D;
    element: HTMLElement | undefined;
    directionInput: DirectionInput

    constructor(config: MapConfigI) {
        this.gameObjects = config.gameObjects || [];
        this.lowerImage = new Image();
        this.lowerImage.src = config.lowerImageSrc;
        this.upperImage = new Image();
        this.upperImage.src = config.lowerImageSrc;
        this.element = config.element;
        this.element = config.element;
        if (this.element)
            this.canvas = this.element.querySelector(".game-canvas") || config.canvas;
        if (this.canvas)
            this.ctx = this.canvas.getContext("2d");
    }

    startGameLoop(): void {
        this.directionInput = new DirectionInput();
        window.requestAnimationFrame(this.animate);
        throw new Error("Method not implemented.");
    }

    animate(): void {
        this.clearCanvas(this.ctx);
        this.drawLowerImage(this.ctx);
        this.drawUpperImage(this.ctx);
        this.gameObjects.forEach((gameObject) => {
            if (gameObject instanceof Character) {
                clientController.serverRequestMoveCharacter(gameObject, this.directionInput.direction);
            }
            gameObject.sprite.draw(this.ctx);
        });

        throw new Error("Method not implemented.");
        window.requestAnimationFrame(this.animate);
    }

    drawLowerImage(ctx: CanvasRenderingContext2D): void {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    drawUpperImage(ctx: CanvasRenderingContext2D): void {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    clearCanvas(ctx: CanvasRenderingContext2D): void {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    addCharacter(character: Character): void {
        if (this.playerList.has(character.name)) {
            return;
        }
        this.playerList.set(character.name, character);
        this.gameObjects.push(character);
        console.log('Player:' + character.name + " has been added to: " + this.name);
    }

    addGameObject(object: GameObject): void {
        for (let i = 0; i < this.gameObjects.length; i++) {
            if (this.gameObjects[i].gameObjectID == object.gameObjectID) {
                return;
            }
        }
        this.gameObjects.push(object);
    }

    removeCharacter(character: Character): void {
        if (this.playerList.has(character.name)) {
            let result = this.playerList.delete(character.name);
            console.log('Character was removed: ' + result);
            for (let i = 0; i < this.gameObjects.length; i++) {
                if (character.name == this.gameObjects[i].name) {
                    this.gameObjects.splice(i);
                }
            }
        }
    }
    removeAllCharacters(): void {
        this.gameObjects = [];
        this.playerList.clear();
    }
    viewCharacters(): IterableIterator<Character> {
        return this.playerList.values();
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

    changeMapName(): void {
        throw new Error("Method not implemented.");
    }
    get getMapName(): string {
        return this.name;
    }
    set setMapName(name: string) {
        this.name = name;
    }

}

interface MapConfigI {
    gameObjects: Array<GameObject> | null;
    lowerImageSrc: string | null;
    upperImageSrc: string | null;
    canvas: HTMLCanvasElement | null;
    element: HTMLElement | undefined;
}

interface OverworldMapsI {
    Maps: Array<GameMap>;
}



interface MapI {
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