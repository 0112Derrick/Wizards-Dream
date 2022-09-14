"use strict";
exports.__esModule = true;
exports.GameObject = void 0;
var Sprite_js_1 = require("./Sprite.js");
var GameObject = /** @class */ (function () {
    function GameObject(config) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.name = config.name || 'default';
        this.direction = config.direction || 'down';
        this.sprite = new Sprite_js_1.Sprite({
            gameObject: this,
            src: config.src || "/images/characters/players/erio.png"
        });
    }
    GameObject.prototype.update = function (_a) {
    };
    return GameObject;
}());
exports.GameObject = GameObject;
