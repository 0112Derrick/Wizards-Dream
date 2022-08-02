import { OverworldMap } from "./OverworldMap.js";
import { GameObject } from "./GameObject.js";
import { DirectionInput } from "./DirectionInput.js";
export class Overworld {
    canvas;
    element;
    ctx;
    numbOfPlayers;
    map;
    image;
    directionInput;
    constructor(config) {
        this.element = config.element;
        if (this.element)
            this.canvas = this.element.querySelector(".game-canvas");
        if (this.canvas)
            this.ctx = this.canvas.getContext("2d");
        this.numbOfPlayers = 1;
        this.map = null;
    }
    startGameLoop() {
        const step = () => {
            this.ctx?.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.map.drawLowerImage(this.ctx);
            Object.values(this.map.gameObjects).forEach(o => {
                if (o instanceof GameObject) {
                    if (this.ctx) {
                        o.update({
                            arrow: this.directionInput.direction
                        });
                        o.sprite.draw(this.ctx);
                    }
                }
            });
            requestAnimationFrame(() => {
                step();
            });
        };
        step();
    }
    init() {
        this.map = new OverworldMap(window.OverworldMaps.grassyField);
        this.directionInput = new DirectionInput();
        this.directionInput.init();
        this.startGameLoop();
    }
}
//# sourceMappingURL=Overworld.js.map