"use strict";
exports.__esModule = true;
exports.drawGame = exports.Overworld = void 0;
var OverworldMap_js_1 = require("./OverworldMap.js");
var GameObject_js_1 = require("./GameObject.js");
var DirectionInput_js_1 = require("./DirectionInput.js");
var Overworld = /** @class */ (function () {
    function Overworld(config) {
        this.element = config.element;
        if (this.element)
            this.canvas = this.element.querySelector(".game-canvas");
        if (this.canvas)
            this.ctx = this.canvas.getContext("2d");
        this.numbOfPlayers = 1;
        this.map = null;
    }
    Overworld.prototype.startGameLoop = function () {
        var _this = this;
        var step = function () {
            var _a;
            //  setInterval(() => {
            //Clear off canvas
            (_a = _this.ctx) === null || _a === void 0 ? void 0 : _a.clearRect(0, 0, _this.ctx.canvas.width, _this.ctx.canvas.height);
            //draw lower layer
            _this.map.drawLowerImage(_this.ctx);
            //draw gameObjects
            Object.values(_this.map.gameObjects).forEach(function (o) {
                if (o instanceof GameObject_js_1.GameObject) {
                    if (_this.ctx) {
                        o.update({
                            arrow: _this.directionInput.direction
                        });
                        o.sprite.draw(_this.ctx);
                    }
                }
            });
            //draw upper layer
            //this.map.drawUpperImage(this.ctx);
            //    }, 1000 / 60); // sets Frame rate
            requestAnimationFrame(function () {
                step();
            });
        };
        step();
    };
    Overworld.prototype.init = function () {
        // console.log("Overworld ", this);
        this.map = new OverworldMap_js_1.OverworldMap(window.OverworldMaps.grassyField);
        this.directionInput = new DirectionInput_js_1.DirectionInput();
        this.directionInput.init();
        this.startGameLoop();
    };
    return Overworld;
}());
exports.Overworld = Overworld;
function drawGame(gameState) {
    //Clear off canvas
    var canvas = document.querySelector(".game-canvas");
    var ctx = canvas.getContext("2d");
    var directionInput = new DirectionInput_js_1.DirectionInput();
    directionInput.init();
    var map = new OverworldMap_js_1.OverworldMap(gameState.grassyField);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    //draw lower layer
    map.drawLowerImage(ctx);
    //draw gameObjects
    Object.values(map.gameObjects).forEach(function (o) {
        if (o instanceof GameObject_js_1.GameObject) {
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
exports.drawGame = drawGame;
