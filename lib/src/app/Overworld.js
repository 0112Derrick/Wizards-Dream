import { OverworldMap } from "./OverworldMap.js";
import { GameObject } from "./GameObject.js";
import { DirectionInput } from "./DirectionInput.js";
import { clientController } from "./ClientController.js";
import { Character } from "./Character.js";
export class Overworld {
    canvas;
    element;
    ctx;
    numbOfPlayers;
    gameWorld;
    image;
    directionInput;
    pos = { x: 0, y: 0 };
    movingObj;
    constructor(config) {
        this.element = config.element;
        if (this.element)
            this.canvas = this.element.querySelector(".game-canvas");
        if (this.canvas)
            this.ctx = this.canvas.getContext("2d");
        this.numbOfPlayers = config.numbOfPlayers || 1;
        this.gameWorld = null;
    }
    async move(callback, direction, obj) {
        callback(direction, obj);
    }
    startGameLoop() {
        const step = () => {
            this.ctx?.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.gameWorld.drawLowerImage(this.ctx);
            this.gameWorld.gameObjects.forEach(gameOBJ => {
                if (gameOBJ instanceof GameObject) {
                    if (this.ctx) {
                        clientController.reqMove(gameOBJ, this.directionInput.direction);
                        const moveCharacter = (obj, delta) => {
                            if (gameOBJ instanceof Character) {
                                if (gameOBJ.name == obj.name) {
                                    gameOBJ.x = delta.x;
                                    gameOBJ.y = delta.y;
                                }
                            }
                        };
                        moveCharacter(this.movingObj, this.pos);
                        gameOBJ.sprite.draw(this.ctx);
                    }
                }
            });
            let updateMap = (_map = window.OverworldMaps.grassyField) => {
                this.gameWorld.gameObjects = _map.gameObjects;
            };
            requestAnimationFrame(() => {
                step();
                updateMap();
            });
        };
        step();
    }
    init() {
        this.gameWorld = new OverworldMap(window.OverworldMaps.grassyField);
        this.directionInput = new DirectionInput();
        this.directionInput.init();
        this.startGameLoop();
    }
}
//# sourceMappingURL=Overworld.js.map