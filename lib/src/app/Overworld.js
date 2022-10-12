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
        this.numbOfPlayers = config.numbOfPlayers || 1;
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
export function drawGame(gameState) {
    const canvas = document.querySelector(".game-canvas");
    let ctx = canvas.getContext("2d");
    let directionInput = new DirectionInput();
    directionInput.init();
    let map = new OverworldMap(gameState.grassyField);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    map.drawLowerImage(ctx);
    Object.values(map.gameObjects).forEach(o => {
        if (o instanceof GameObject) {
            if (ctx) {
                o.update({
                    arrow: directionInput.direction
                });
                o.sprite.draw(ctx);
            }
        }
    });
}
//# sourceMappingURL=Overworld.js.map