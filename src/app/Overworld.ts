import { OverworldMap } from "./OverworldMap.js";
import { GameObject } from "./GameObject.js"
import { Sprite } from "./Sprite.js";
import { DirectionInput } from "./DirectionInput.js";
import { ClientController } from "./ClientController.js";

import { runInThisContext } from "vm";
import { Character } from "./Character.js";

export class Overworld<T> {
    canvas!: HTMLCanvasElement | null;
    htmlElement: HTMLElement | undefined;
    ctx!: CanvasRenderingContext2D | null;
    numbOfPlayers: number;
    gameWorld: any;
    image!: HTMLImageElement;
    directionInput!: DirectionInput;
    stopLoop: boolean = false;


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
            //  setInterval(() => {
            //Clear off canvas
            this.ctx?.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            //draw lower layer
            this.gameWorld.drawLowerImage(this.ctx);


            //draw gameObjects
            //Object.values(this.gameWorld.gameObjects).forEach(o => {
            this.gameWorld.gameObjects.forEach(gameOBJ => {
                if (gameOBJ instanceof GameObject) {
                    if (this.ctx) {
                        if (gameOBJ instanceof Character) {
                            // ClientController.ClientControllerInstance.serverRequestMoveCharacter(gameOBJ, this.directionInput.direction);
                        }
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
            if (!this.stopLoop)

                requestAnimationFrame(() => {
                    updateMap();
                    step();
                });
        }
        step();
    }


    init() {
        // console.log("Overworld ", this);
        this.gameWorld = new OverworldMap(window.OverworldMaps.grassyField);
        this.directionInput = new DirectionInput();
        this.directionInput.init();
        this.startGameLoop();
    }

}




