import { GameObject } from "./GameObject.js";
import { Character } from "./Character.js";
import { Direction, DirectionInput } from "./DirectionInput.js";
import { ClientController as $ClientController } from "./ClientController.js";
import { MapI, MapConfigI } from "../players/interfaces/OverworldInterfaces.js";
import { MapNames } from "../constants/MapNames.js";
import Camera from "./Camera.js";

export class GameMap implements MapI {
    gameObjects: Array<GameObject>;
    activeCharacters: Map<string, Character> = new Map<string, Character>();
    lowerImage: HTMLImageElement;
    upperImage: HTMLImageElement;
    private name: MapNames;
    canvas: HTMLCanvasElement | null;
    private ctx: CanvasRenderingContext2D;
    element: HTMLElement | undefined;
    stopLoop: boolean = false;
    counter = 0;
    controller: $ClientController = $ClientController.ClientControllerInstance;
    private camera: Camera = null;
    private worldWidth = 0;
    private worldHeight = 0;
    private character: Character = null;
    private directionInput = new DirectionInput();
    private mapMinHeight: number = 0;
    mapMinWidth: number = 0;

    constructor(config: MapConfigI) {
        this.gameObjects = config.gameObjects || [];
        this.lowerImage = new Image();
        this.lowerImage.src = config.lowerImageSrc;
        this.upperImage = new Image();
        this.upperImage.src = config.upperImageSrc;
        this.element = config.element || null;
        this.name = config.name;
        this.worldHeight = this.lowerImage.height;
        this.worldWidth = this.lowerImage.width;
        this.mapMinHeight = config.mapMinHeight;
        this.mapMinWidth = config.mapMinWidth;
        this.directionInput.init();
        if (this.element) {
            this.canvas = this.element.querySelector(".game-canvas") || config.canvas;
            this.camera = new Camera(this.canvas.width, this.canvas.height, this.worldHeight, this.worldWidth)
            //this.camera = { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height };
        }
        if (this.canvas)
            this.ctx = this.canvas.getContext("2d");

    }

    startGameLoop(): void {
        ;
        if (!this.stopLoop) {
            //temporarily set to a testing function
            this.animate2();
            // window.requestAnimationFrame(() => this.animate);
        }
        //throw new Error("Method not implemented.");
    }

    updateCamera() {
        this.camera.updateCamera(this.character);
    }

    drawBackground() {
        const tileWidth = this.lowerImage.width;
        const tileHeight = this.lowerImage.height;

        const startX = Math.floor(this.camera.x / tileWidth);
        const startY = Math.floor(this.camera.y / tileHeight);
        const endX = Math.ceil((this.camera.x + this.camera.width) / tileWidth);
        const endY = Math.ceil((this.camera.y + this.camera.height) / tileHeight);

        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                this.ctx.drawImage(
                    this.lowerImage,
                    x * tileWidth - this.camera.x,
                    y * tileHeight - this.camera.y
                );
            }
        }
    }

    setClientCharacter(character: Character) {
        this.character = character;
    }

    draw() {
        this.clearCanvas(this.ctx);

        const backgroundX = Math.max(0, this.camera.x);
        const backgroundY = Math.max(0, this.camera.y);
        const offsetX = this.camera.x - backgroundX;
        const offsetY = this.camera.y - backgroundY;
        const imageWidth = Math.min(this.camera.width, this.lowerImage.width - backgroundX);
        const imageHeight = Math.min(this.camera.height, this.lowerImage.height - backgroundY);

        this.ctx.drawImage(this.lowerImage, backgroundX, backgroundY, imageWidth, imageHeight, offsetX, offsetY, imageWidth, imageHeight);
        //this.ctx.drawImage(this.lowerImage, -this.camera.x, -this.camera.y, this.canvas.width, this.canvas.height);
        this.character.updateCharacterLocationAndAppearance({ arrow: this.directionInput.direction });

        let characterX = this.character.x - this.camera.x;
        let characterY = this.character.y - this.camera.y;
        //characterX, characterY
        this.character.sprite.draw(this.ctx, characterX, characterY);


    }

    animate2(): void {
        if (this.character) {

            this.gameObjects.forEach((gameObject) => {

                if ((gameObject instanceof Character)) {
                    if ((gameObject as Character).player == this.character.player) {
                        this.updateCharacter(this.character);
                    } else {
                        this.updateNpcCharacter((gameObject as Character));
                    }
                }
            })
            this.updateCamera();
            this.draw();
        }
        window.requestAnimationFrame(() => this.animate2());
    }

    updateNpcCharacter(gameOBJ: GameObject) {
        


    }

    updateCharacter(character: Character) {
        switch (this.directionInput.direction) {
            case Direction.UP:
                character.y -= character.yVelocity;
                console.log(character.y)
                break;
            case Direction.DOWN:
                character.y += character.yVelocity;
                console.log(character.y)
                break;
            case Direction.LEFT:
                character.x -= character.xVelocity;
                console.log(character.x)
                break;
            case Direction.RIGHT:
                character.x += character.xVelocity;
                console.log(character.x)
                break;
            case Direction.JUMP:
                console.log('character did a jump')
                break;
            default:
                break;
        }
        console.log(character.x = Math.max(this.mapMinWidth, Math.min(character.x, this.worldWidth - character.width)));
        console.log(character.y = Math.max(this.mapMinHeight, Math.min(character.y, this.worldHeight - character.height)));

    }

    animate(): void {
        //setInterval(() => {
        this.clearCanvas(this.ctx);
        //this.updateCamera();
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
