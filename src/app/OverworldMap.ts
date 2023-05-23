import { Utils } from "./Utils.js";
import { GameObject } from "./GameObject.js";
import { Character } from "./Character.js";
import { } from './Types.js'
import { PrivateIdentifier } from "typescript";
import { Direction } from "readline";

class OverworldMap {
    gameObjects: any;
    lowerImage: HTMLImageElement;
    upperImage: HTMLImageElement;
    

    // ctx!: CanvasRenderingContext2D | null;

    constructor(config) {
        this.gameObjects = config.gameObjects;

        this.lowerImage = new Image();
        this.lowerImage.src = config.lowerSrc;

        this.upperImage = new Image();
        this.upperImage.src = config.upperSrc;
    }

    drawLowerImage(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    drawUpperImage(ctx) {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }

}

window.OverworldMaps = {
    grassyField: {
        lowerSrc: "/images/maps/Battleground1.png",
        upperSrc: "/images/maps/Battleground1.png",
        gameObjects: []
        // player01: new Character({
        //     isPlayerControlled: true,
        //     x: Utils.withGrid(6),
        //     y: Utils.withGrid(6),
        //     src: "/images/characters/players/erio.png",
        //     direction: 'down'
        // }),
        // hero: new Player({
        //     isPlayerControlled: false,
        //     posX: Utils.withGrid(5),
        //     posY: Utils.withGrid(6),
        // }),

    },
    /*  hallway: {
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
     giantTree: {
 
     } */
};


export { OverworldMap }