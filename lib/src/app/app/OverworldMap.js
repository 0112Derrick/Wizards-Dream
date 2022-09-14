"use strict";
exports.__esModule = true;
exports.OverworldMap = void 0;
var Utils_js_1 = require("./Utils.js");
var GameObject_js_1 = require("./GameObject.js");
var Character_js_1 = require("./Character.js");
var OverworldMap = /** @class */ (function () {
    // ctx!: CanvasRenderingContext2D | null;
    function OverworldMap(config) {
        this.gameObjects = config.gameObjects;
        this.lowerImage = new Image();
        this.lowerImage.src = config.lowerSrc;
        this.upperImage = new Image();
        this.upperImage.src = config.upperSrc;
    }
    OverworldMap.prototype.drawLowerImage = function (ctx) {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    };
    OverworldMap.prototype.drawUpperImage = function (ctx) {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    };
    return OverworldMap;
}());
exports.OverworldMap = OverworldMap;
window.OverworldMaps = {
    grassyField: {
        lowerSrc: "/images/maps/Battleground1.png",
        upperSrc: "/images/maps/Battleground1.png",
        gameObjects: {
            player01: new Character_js_1.Character({
                isPlayerControlled: true,
                x: Utils_js_1.Utils.withGrid(6),
                y: Utils_js_1.Utils.withGrid(6),
                src: "/images/characters/players/erio.png",
                direction: 'down'
            })
        }
    },
    hallway: {
        lowerSrc: "/images/maps/Battleground2.png",
        upperSrc: "/images/maps/Battleground2.png",
        gameObjects: {
            hero: new Character_js_1.Character({
                isPlayerControlled: true,
                x: 5,
                y: 5
            }),
            npcHero: new GameObject_js_1.GameObject({
                x: 10,
                y: 4,
                src: "/images/characters/players/witch-girl.png"
            })
        }
    },
    giantTree: {}
};
