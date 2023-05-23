import { GameObject } from "./GameObject.js";
import { Character } from "./Character.js";
import { Direction, DirectionInput } from "./DirectionInput.js";
import { ClientController as $ClientController, ClientController } from "./ClientController.js";
import { MapI, MapConfigI, gameMapGameObjectsI } from "../players/interfaces/OverworldInterfaces.js";
import { MapNames } from "../constants/MapNames.js";
import { characterDataInterface as $characterDataInterface } from "../players/interfaces/CharacterDataInterface.js";
import { Circle, Rectangle, ShapeTypes } from "../framework/Shapes.js";
import Camera from "./Camera.js";
import { ServerMessages as $serverMessages } from '../constants/ServerMessages.js';
import $Movement_System from "./MovementSystem.js";
import { Intersector as $Intersector } from "./Intesector.js";
import { Skill as $Skill } from "./Skill.js";


export class GameMap implements MapI, gameMapGameObjectsI {
    private gameObjects: Array<GameObject>;
    activeCharacters: Map<string, $characterDataInterface>;
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
    private movementSystem = $Movement_System;
    private intersector = new $Intersector();

    constructor(config: MapConfigI) {
        this.gameObjects = config.gameObjects || [];
        this.lowerImage = new Image();
        this.lowerImage.src = config.lowerImageSrc;
        this.upperImage = new Image();
        this.upperImage.src = config.upperImageSrc;
        this.element = config.element || null;
        this.name = config.name;
        this.activeCharacters = config.activeCharacters;
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
        }
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
            if (gameObject instanceof Character) {
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
            }

            let currentDirection = this.directionInput.direction;
            if (currentDirection == Direction.ATTACK1 && this.character.sprite.currentAnimationFrame == 0) {
                this.updateCamera(this.character);
                this.character.renderSkill(this.ctx, "melee attack", this.camera);
                return;
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
        //manages game loop speed.
        if (timeSinceLastFrame >= this.targetInterval) {
            this.lastFrameTime = currentTime;

            if (!this.character || !this.mapLoaded) {
                window.requestAnimationFrame((time) => this.animate2(time));
                return;
            }

            this.gameObjects.forEach((gameObject) => {

                if (!(gameObject instanceof Character)) {
                    window.requestAnimationFrame((time) => this.animate2(time));
                    return;
                }

                if ((gameObject as Character).player == this.character.player) {
                    this.character = gameObject;
                    //send message to server with the clients direction.
                    this.updateCharacter((gameObject as Character));

                } else {
                    this.updateNpcCharacter((gameObject as Character));
                }

                if (gameObject instanceof $Skill) {
                    this.handleCollisions(gameObject);
                }
            });

            this.draw();

        }

        window.requestAnimationFrame((time) => this.animate2(time));
    }

    updateNpcCharacter(gameOBJ: GameObject) {

    }

    handleCollisions(skill: $Skill) {
        this.gameObjects.filter(characterObj => characterObj instanceof Character).forEach(characterObj => {

            if (skill.Shape.type == ShapeTypes.Rectangle) {
                if (this.intersector.isRect2DColliding({
                    width: (characterObj as Character).width,
                    height: (characterObj as Character).height,
                    x: (characterObj as Character).x,
                    y: (characterObj as Character).y,
                    type: ShapeTypes.Rectangle,
                    color: ""
                }, {
                    width: (skill.Shape as Rectangle).width,
                    height: (skill.Shape as Rectangle).height,
                    x: skill.x,
                    y: skill.y,
                    type: ShapeTypes.Rectangle,
                    color: ""
                })) {
                    console.log(`${skill.name} collided with ${characterObj.name}`);
                }
            } else {

                if (this.intersector.isRectCollidingWithCircle({
                    width: (characterObj as Character).width,
                    height: (characterObj as Character).height,
                    x: (characterObj as Character).x,
                    y: (characterObj as Character).y,
                    type: ShapeTypes.Rectangle,
                    color: ""
                }, {
                    radius: (skill.Shape as Circle).radius,
                    x: skill.x,
                    y: skill.y,
                    type: ShapeTypes.Circle,
                    color: ""
                })) {
                    console.log(`${skill.name} collided with ${characterObj.name}`);
                }
            }

        })
    }

    updateCharacter(character: Character) {

        let currentDirection = this.directionInput.direction;
        character.setGameObjects(this);

        if (!currentDirection) {
            currentDirection = Direction.STANDSTILL;
        } else {
            let tick = $ClientController.ClientControllerInstance.CurrentSystemTick;
            $ClientController.ClientControllerInstance.notifyServer($serverMessages.Movement, currentDirection, this.worldWidth, this.worldHeight, this.mapMinWidth, this.mapMinHeight, tick)
            let pos = this.movementSystem.updateCharacterPosition(character, currentDirection, this.worldWidth, this.worldHeight, this.mapMinWidth, this.mapMinHeight)
            ClientController.ClientControllerInstance.setInputHistory(pos, tick);
            character.x = pos.x;
            character.y = pos.y;
        }

        this.updateCamera(this.character);
    }

    setCharacterPosition(character: Character, updatedX: number, updatedY: number) {
        let foundCharacter = this.findCharacterByName(character.name);

        if (foundCharacter) {
            foundCharacter.x = updatedX;
            foundCharacter.y = updatedY;
            console.log("Updated characters position:", foundCharacter.name, " new position: ", foundCharacter.x, foundCharacter.y);
            this.updateCamera(foundCharacter);
            return;
        }
        console.log("Character not found.");
    }

    findCharacterByName(name: string): Character | null {
        for (let character of this.gameObjects) {
            if (character instanceof Character) {
                if (character.name == name) {
                    return character as Character;
                };
            }
        }
        return null;
    }

    findCharacterByID(id: number): Character | null {
        for (let character of this.gameObjects) {
            if (character instanceof Character) {
                if (character.gameObjectID == id) {
                    return character;
                };
            }
        }
        return null;
    }

    findgameObjectByID(id: number): GameObject | null {
        for (let gameObj of this.gameObjects) {
            if (gameObj.gameObjectID == id) {
                return gameObj;
            };
        }
        return null;
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


    drawLowerImage(ctx: CanvasRenderingContext2D): void {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    drawUpperImage(ctx: CanvasRenderingContext2D): void {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    clearCanvas(ctx: CanvasRenderingContext2D): void {

        ctx ? ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height) : this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    get ActiveCharacters() {
        if (!this.activeCharacters) {
            return this.activeCharacters = new Map<string, $characterDataInterface>();
        } else {
            return this.activeCharacters;
        }

    }

    set ActiveCharacters(characters: Map<string, $characterDataInterface>) {
        this.activeCharacters = characters;
    }

    addCharacter(character: Character): boolean {
        if (this.activeCharacters.has(character.name)) {
            console.log("Character already created.")
            return false;
        }

        this.activeCharacters.set(character.name, character);
        this.gameObjects.push(character);
        console.log('Player:' + character.name + " has been added to: " + this.name);
        return true;
    }

    addGameObject(object: GameObject): void {
        for (let i = 0; i < this.gameObjects.length; i++) {
            if (this.gameObjects[i].gameObjectID == object.gameObjectID) {
                return;
            }
        }
        console.log(object.name, " added to map.")
        this.gameObjects.push(object);
        console.log(this.gameObjects);
    }

    removeGameObject(object: GameObject): boolean {
        for (let i = 0; i < this.gameObjects.length; i++) {
            if (this.gameObjects[i].gameObjectID == object.gameObjectID) {
                this.gameObjects.splice(i, 1);
                console.log(object.name, " removed from the map.")
                return true;
            }
        }
        return false;
    }

    removeCharacter = (character: Character, map: GameMap): boolean => {
        let activeCharacters = map.ActiveCharacters;

        if (activeCharacters.has(character.name)) {

            let result = activeCharacters.delete(character.name);
            console.log('Character was removed: ' + result);

            for (let i = 0; i < map.gameObjects.length; i++) {

                if (character.name == map.gameObjects[i].name) {
                    let characters = map.gameObjects.splice(i, 1);
                    let delCharacter: GameObject = characters.at(0);
                    console.log(`${delCharacter.name} successfully removed.`);
                    return true;
                }
            }
            return false;
        }
        return false;
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
        if (activeCharactersList.size == 0) {
            console.log("Cannot set activeCharacters map with an empty map.");
            return;
        }

        let characterNames = activeCharactersList.keys();
        let namesString: string = "";

        for (let characterName of characterNames) {
            namesString += characterName + ", ";
        }

        console.log("Synced characters: " + namesString + "\nType: " + typeof activeCharactersList);
        this.ActiveCharacters = activeCharactersList;
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
