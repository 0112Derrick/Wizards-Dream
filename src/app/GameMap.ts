import { GameObject } from "./GameObject.js";
import { Character } from "./Character.js";
import { DirectionInput } from "./DirectionInput.js";
import { ClientController as $ClientController } from "./ClientController.js";
import { MapI, MapConfigI } from "../players/interfaces/OverworldInterfaces.js";
import { MapNames } from "../constants/MapNames.js";


export class GameMap implements MapI {
    gameObjects: Array<GameObject>;
    activeCharacters: Map<string, Character> = new Map<string, Character>();
    lowerImage: HTMLImageElement;
    upperImage: HTMLImageElement;
    private name: MapNames;
    canvas: HTMLCanvasElement | null;
    private ctx: CanvasRenderingContext2D;
    element: HTMLElement | undefined;
    directionInput: DirectionInput;
    stopLoop: boolean = false;
    counter = 0;
    controller: $ClientController = $ClientController.ClientControllerInstance;

    constructor(config: MapConfigI) {
        this.gameObjects = config.gameObjects || [];
        this.lowerImage = new Image();
        this.lowerImage.src = config.lowerImageSrc;
        this.upperImage = new Image();
        this.upperImage.src = config.upperImageSrc;
        this.element = config.element || null;
        this.name = config.name;
        if (this.element)
            this.canvas = this.element.querySelector(".game-canvas") || config.canvas;
        if (this.canvas)
            this.ctx = this.canvas.getContext("2d");

    }

    startGameLoop(): void {
        this.directionInput = new DirectionInput();
        if (!this.stopLoop) {
            this.animate();
            // window.requestAnimationFrame(() => this.animate);
        }
        //throw new Error("Method not implemented.");
    }

    animate(): void {
        //setInterval(() => {
        this.clearCanvas(this.ctx);
        this.drawLowerImage(this.ctx);
        this.drawUpperImage(this.ctx);

        this.gameObjects.forEach((gameObject) => {

            if (gameObject instanceof Character) {
                this.controller.serverRequestMoveCharacter(gameObject, this.directionInput.direction);
            }

            gameObject.sprite.draw(this.ctx);
        });

        // }, 16);
        window.requestAnimationFrame(() => this.animate());
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
        if (this.activeCharacters.has(character.name)) {
            return;
        }
        this.activeCharacters.set(character.name, character);
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
        if (this.activeCharacters.has(character.name)) {
            let result = this.activeCharacters.delete(character.name);
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
        this.activeCharacters.clear();
    }
    viewCharacters(): IterableIterator<Character> {
        return this.activeCharacters.values();
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

    changeMapName(name: MapNames): void {
        this.name = name;
    }

    get getMapName(): MapNames {
        return this.name;
    }
    set setMapName(name: MapNames) {
        this.name = name;
    }

}
