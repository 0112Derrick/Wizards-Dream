import { OverworldMap } from "./OverworldMap.js";
import { GameObject } from "./GameObject.js"
import { Sprite } from "./Sprite.js";
import { DirectionInput } from "./DirectionInput.js";
import { clientController } from "./ClientController.js";

import { runInThisContext } from "vm";
import { Character } from "./Character.js";

export class Overworld<T> {
    canvas!: HTMLCanvasElement | null;
    element: HTMLElement | undefined;
    ctx!: CanvasRenderingContext2D | null;
    numbOfPlayers: number;
    gameWorld: any;
    image!: HTMLImageElement;
    directionInput!: DirectionInput;


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

        const step = () => {
            this.ctx?.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.gameWorld.drawLowerImage(this.ctx);


            //draw gameObjects
            this.gameWorld.gameObjects.forEach(gameOBJ => {
                if (gameOBJ instanceof GameObject) {
                    if (this.ctx) {
                        clientController.requestMove(gameOBJ, this.directionInput.direction)
                        gameOBJ.sprite.draw(this.ctx);
                    }
                }
            });

            let updateMap = (_map = window.OverworldMaps.grassyField) => {
                this.gameWorld.gameObjects = _map.gameObjects;
            };

            //draw upper layer
            //this.map.drawUpperImage(this.ctx);
            //    }, 1000 / 60); // sets Frame rate
            requestAnimationFrame(() => {
                step();
                updateMap();
            });
        }
        step();
    }


    init() {
        this.gameWorld = new OverworldMap(window.OverworldMaps.grassyField);
        this.directionInput = new DirectionInput();
        this.directionInput.init();
        this.startGameLoop();
    }

}




