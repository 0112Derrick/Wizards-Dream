import { GameObject } from "./GameObject.js";
import { Character } from "./Character.js";
import { DirectionInput } from "./DirectionInput.js";
import { clientController } from "./ClientController.js";
class OverworldMap {
    gameObjects;
    lowerImage;
    upperImage;
    constructor(config) {
        this.gameObjects = config.gameObjects;
        this.lowerImage = new Image();
        this.lowerImage.src = config.lowerSrc;
        this.upperImage = new Image();
        this.upperImage.src = config.upperSrc;
    }
    drawLowerImage(ctx) {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    drawUpperImage(ctx) {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}
export class Overworld_Test {
    Maps;
    constructor() {
        this.Maps = [];
    }
    addMap(map) {
        this.Maps.push(map);
    }
    init(startMap) {
        console.log("Overworld init started");
        this.Maps.forEach((map) => {
            if (startMap == map.getMapName) {
                map.startGameLoop();
                console.log("Map: " + map.getMapName + " started.");
            }
        });
        console.log("OverWorld init complete.");
    }
}
export class GameMap {
    gameObjects;
    activeCharacters = new Map();
    lowerImage;
    upperImage;
    name;
    canvas;
    ctx;
    element;
    directionInput;
    stopLoop = false;
    counter = 0;
    constructor(config) {
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
    startGameLoop() {
        this.directionInput = new DirectionInput();
        if (!this.stopLoop) {
            this.animate();
        }
    }
    animate() {
        this.clearCanvas(this.ctx);
        this.drawLowerImage(this.ctx);
        this.drawUpperImage(this.ctx);
        console.log(this.counter++);
        this.gameObjects.forEach((gameObject) => {
            if (gameObject instanceof Character) {
                clientController.serverRequestMoveCharacter(gameObject, this.directionInput.direction);
            }
            gameObject.sprite.draw(this.ctx);
        });
        window.requestAnimationFrame(() => this.animate);
    }
    drawLowerImage(ctx) {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    drawUpperImage(ctx) {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    clearCanvas(ctx) {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    addCharacter(character) {
        if (this.activeCharacters.has(character.name)) {
            return;
        }
        this.activeCharacters.set(character.name, character);
        this.gameObjects.push(character);
        console.log('Player:' + character.name + " has been added to: " + this.name);
    }
    addGameObject(object) {
        for (let i = 0; i < this.gameObjects.length; i++) {
            if (this.gameObjects[i].gameObjectID == object.gameObjectID) {
                return;
            }
        }
        this.gameObjects.push(object);
    }
    removeCharacter(character) {
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
    removeAllCharacters() {
        this.gameObjects = [];
        this.activeCharacters.clear();
    }
    viewCharacters() {
        return this.activeCharacters.values();
    }
    findCharacter(character) {
        throw new Error("Method not implemented.");
    }
    syncCharactersList(playersList) {
        throw new Error("Method not implemented.");
    }
    updateCharacterLocation(character) {
        throw new Error("Method not implemented.");
    }
    changeMapName(name) {
        this.name = name;
    }
    get getMapName() {
        return this.name;
    }
    set setMapName(name) {
        this.name = name;
    }
}
window.OverworldMaps = {
    grassyField: {
        lowerSrc: "/images/maps/Battleground1.png",
        upperSrc: "/images/maps/Battleground1.png",
        gameObjects: []
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
    giantTree: {}
};
export { OverworldMap };
//# sourceMappingURL=OverworldMap.js.map