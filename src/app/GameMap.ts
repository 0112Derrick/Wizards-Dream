import { GameObject } from "./GameObject.js";
import { Character } from "./Character.js";
import { Direction, DirectionInput } from "./DirectionInput.js";
import { ClientController as $ClientController } from "./ClientController.js";
import { MapI, MapConfigI } from "../players/interfaces/OverworldInterfaces.js";
import { MapNames } from "../constants/MapNames.js";
import { characterDataInterface as $characterDataInterface } from "../players/interfaces/CharacterDataInterface.js"
import Camera from "./Camera.js";
import e from "express";
import { ServerMessages as $serverMessages } from '../constants/ServerMessages.js'

export class GameMap implements MapI {
    private gameObjects: Array<GameObject>;
    activeCharacters: Map<string, $characterDataInterface> = new Map<string, $characterDataInterface>();
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
    private mapLoaded: boolean = false;
    targetFPS: number = 20;
    targetInterval = 1000 / this.targetFPS; // in milliseconds
    lastFrameTime = 0;

    constructor(config: MapConfigI) {
        this.gameObjects = config.gameObjects || [];
        this.lowerImage = new Image();
        this.lowerImage.src = config.lowerImageSrc;
        this.upperImage = new Image();
        this.upperImage.src = config.upperImageSrc;
        this.element = config.element || null;
        this.name = config.name;
        this.lowerImage.onload = (() => {
            this.worldHeight = this.lowerImage.height;
            this.worldWidth = this.lowerImage.width;
            this.camera.setWorldHeight(this.worldHeight);
            this.camera.setWorldWidth(this.worldWidth);
            this.mapLoaded = true;
        })

        this.mapMinHeight = config.mapMinHeight;
        this.mapMinWidth = config.mapMinWidth;
        this.directionInput.init();

        if (this.element) {
            this.canvas = this.element.querySelector(".game-canvas") || config.canvas;
            this.camera = new Camera(this.canvas.width, this.canvas.height, this.worldHeight, this.worldWidth);
            //this.camera = { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height };
        }
        if (this.canvas)
            this.ctx = this.canvas.getContext("2d");

        setInterval(() => {
            try {
                console.log("Character location: X:", this.character.x, ", Y:", this.character.y, " Direction: ", this.character.lastDirection, ", Map:", this.character.location)
            } catch (error) {
                //console.log(error)
            }

        }, 3000)
    }

    get GameObjects(): Array<GameObject> {
        return this.gameObjects;
    }

    setGameObjects(value: Array<GameObject>) {
        if (!Array.isArray(value)) {
            //console.log("Attempted to set gameObjects to a non array.");
            const error = new Error("Attempted to set gameObjects to a non array.");
            const stackLines = error.stack.split('\n');
            const callerLine = stackLines[2];
            console.log('Caller: ', callerLine);
            return;
        }
        this.gameObjects = value;
    }

    startGameLoop(): void {
        if (!this.stopLoop) {
            //temporarily set to a testing function
            window.requestAnimationFrame((time) => this.animate2(time));
            //this.animate2();
            // window.requestAnimationFrame(() => this.animate);
        }
        //throw new Error("Method not implemented.");
    }

    updateCamera(player) {
        this.camera.updateCamera(player);
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


        this.gameObjects.forEach((gameObject) => {
            let character = (gameObject as Character);

            if (character.username == this.character.username) {
                character.updateCharacterLocationAndAppearance({ arrow: this.directionInput.direction })
            } else {
                character.updateCharacterLocationAndAppearance({})
            }
            let characterX = character.x - this.camera.x;
            let characterY = character.y - this.camera.y;

            if (this.camera.isInsideOfView(characterX, characterY)) {
                character.sprite.draw(this.ctx, characterX, characterY);
            }

        });
    }

    /*      
            let characterX = this.character.x - this.camera.x;
            let characterY = this.character.y - this.camera.y;
            this.character.updateCharacterLocationAndAppearance({ arrow: this.directionInput.direction });
            this.character.sprite.draw(this.ctx, characterX, characterY); 
    */

    animate2(currentTime: number): void {
        const timeSinceLastFrame = currentTime - this.lastFrameTime;

        if (timeSinceLastFrame >= this.targetInterval) {
            this.lastFrameTime = currentTime;

            if (this.character && this.mapLoaded) {

                this.gameObjects.forEach((gameObject) => {

                    if ((gameObject instanceof Character)) {
                        if ((gameObject as Character).player == this.character.player) {
                            this.character = gameObject;
                            //send message to server with the clients direction.
                            this.updateCharacter((gameObject as Character));

                        } else {
                            this.updateNpcCharacter((gameObject as Character));
                        }
                    }

                });

                this.draw();
            }

        }

        window.requestAnimationFrame((time) => this.animate2(time));
    }

    updateNpcCharacter(gameOBJ: GameObject) {

    }

    updateCharacter(character: Character) {
        let currentDirection = this.directionInput.direction;
        $ClientController.ClientControllerInstance.notifyServer($serverMessages.Movement, currentDirection)

        switch (currentDirection) {
            case Direction.UP:
                character.y -= character.yVelocity;
                // console.log(character.y)
                break;
            case Direction.DOWN:
                character.y += character.yVelocity;
                // console.log(character.y)
                break;
            case Direction.LEFT:
                character.x -= character.xVelocity;
                //  console.log(character.x)
                break;
            case Direction.RIGHT:
                character.x += character.xVelocity;
                //console.log(character.x)
                break;
            case Direction.JUMP:
                console.log('character did a jump')
                break;
            default:
                character.playIdleAnimation();
                break;
        }
        character.x = Math.max(this.mapMinWidth, Math.min(character.x, this.worldWidth - character.width));
        character.y = Math.max(this.mapMinHeight, Math.min(character.y, this.worldHeight - character.height));


        // console.log(character.x = Math.max(this.mapMinWidth, Math.min(character.x, this.worldWidth - character.width)));
        // console.log(character.y = Math.max(this.mapMinHeight, Math.min(character.y, this.worldHeight - character.height)));
        this.updateCamera(this.character);
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

        ctx ? ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height) : this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
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

    removeCharactersFromGameObjectsList(newCharacters: Map<string, $characterDataInterface>, map: GameMap) {
        let characterNames = this.activeCharacters.keys();

        for (let name of characterNames) {
            if (newCharacters.has(name)) {
                break;
            }

            map.GameObjects.forEach((obj, i) => {
                if (obj.name == name) {
                    console.log("Removed gameObject ", map.GameObjects.splice(i, 1));
                }
            })
        }
    }

    viewCharacters(): IterableIterator<$characterDataInterface> {
        return this.activeCharacters.values();
    }
    findCharacter(character: Character): Boolean {
        throw new Error("Method not implemented.");
    }
    syncGameObjects(playersList: Array<GameObject>): void {
        console.log("Synced game objects: " + playersList + "\nType: " + typeof playersList)
        if (!Array.isArray(playersList)) {
            //console.log("Attempted to set gameObjects to a non array.");
            const error = new Error("Attempted to set gameObjects to a non array.");
            const stackLines = error.stack.split('\n');
            const callerLine = stackLines[2];
            console.log('Caller: ', callerLine);
            return;
        }

        this.setGameObjects(playersList);
    }

    syncActiveCharacters(activeCharactersList: Map<string, $characterDataInterface>): void {
        console.log("Synced characters: " + activeCharactersList + "\nType: " + typeof activeCharactersList);
        this.activeCharacters = activeCharactersList;
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
