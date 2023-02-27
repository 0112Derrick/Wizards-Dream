import { OverworldMap } from "./OverworldMap.js";
import { GameObject } from "./GameObject.js";
import { DirectionInput } from "./DirectionInput.js";
import { clientController } from "./ClientController.js";
export class Overworld {
    canvas;
    element;
    ctx;
    numbOfPlayers;
    gameWorld;
    image;
    directionInput;
    stopLoop = false;
    constructor(config) {
        this.element = config.element;
        if (this.element)
            this.canvas = this.element.querySelector(".game-canvas");
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
                        clientController.requestServerGameObjectMove(gameOBJ, this.directionInput.direction);
                        gameOBJ.sprite.draw(this.ctx);
                    }
                }
            });
            let updateMap = (_map = window.OverworldMaps.grassyField) => {
                this.gameWorld.gameObjects = _map.gameObjects;
            };
            if (!this.stopLoop)
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