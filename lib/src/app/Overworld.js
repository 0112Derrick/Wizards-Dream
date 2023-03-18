import { OverworldMap } from "./OverworldMap.js";
import { GameObject } from "./GameObject.js";
import { DirectionInput } from "./DirectionInput.js";
import { ClientController } from "./ClientController.js";
import { Character } from "./Character.js";
export class Overworld {
    canvas;
    htmlElement;
    ctx;
    numbOfPlayers;
    gameWorld;
    image;
    directionInput;
    stopLoop = false;
    constructor(config) {
        this.htmlElement = config.element;
        if (this.htmlElement)
            this.canvas = this.htmlElement.querySelector(".game-canvas");
        if (this.canvas)
            this.ctx = this.canvas.getContext("2d");
        this.numbOfPlayers = config.numbOfPlayers || 1;
        this.gameWorld = null;
    }
    startGameLoop() {
        const step = async () => {
            this.ctx?.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.gameWorld.drawLowerImage(this.ctx);
            this.gameWorld.gameObjects.forEach(gameOBJ => {
                if (gameOBJ instanceof GameObject) {
                    if (this.ctx) {
                        if (gameOBJ instanceof Character) {
                            ClientController.ClientControllerInstance.serverRequestMoveCharacter(gameOBJ, this.directionInput.direction);
                        }
                        gameOBJ.sprite.draw(this.ctx);
                    }
                }
            });
            let updateMap = (_map = window.OverworldMaps.grassyField) => {
                this.gameWorld.gameObjects = _map.gameObjects;
            };
            if (!this.stopLoop)
                requestAnimationFrame(() => {
                    updateMap();
                    step();
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