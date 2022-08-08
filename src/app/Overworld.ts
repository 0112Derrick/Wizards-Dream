import { OverworldMap } from "./OverworldMap.js";
import { GameObject } from "./GameObject.js"
import { Sprite } from "./Sprite.js";
import { DirectionInput } from "./DirectionInput.js";


import { runInThisContext } from "vm";

export class Overworld<T> {
    canvas!: HTMLCanvasElement | null;
    element: HTMLElement | undefined;
    ctx!: CanvasRenderingContext2D | null;
    numbOfPlayers: number;
    map: any;
    image!: HTMLImageElement;
    directionInput!: DirectionInput;

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
            //  setInterval(() => {
            //Clear off canvas
            this.ctx?.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            //draw lower layer
            this.map.drawLowerImage(this.ctx);


            //draw gameObjects
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

            //draw upper layer
            //this.map.drawUpperImage(this.ctx);
            //    }, 1000 / 60); // sets Frame rate
            requestAnimationFrame(() => {
                step();
            });
        }
        step();
    }

    init() {
        // console.log("Overworld ", this);
        this.map = new OverworldMap(window.OverworldMaps.grassyField);
        this.directionInput = new DirectionInput();
        this.directionInput.init();
        this.startGameLoop();
    }

}
export function drawGame(gameState) {

    //Clear off canvas
    const canvas: HTMLCanvasElement = document.querySelector(".game-canvas")!;
    let ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
    let directionInput = new DirectionInput();
    directionInput.init();
    let map = new OverworldMap(gameState.grassyField);

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);


    //draw lower layer
    map.drawLowerImage(ctx);


    //draw gameObjects
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
    //draw upper layer
    //this.map.drawUpperImage(this.ctx);
}



