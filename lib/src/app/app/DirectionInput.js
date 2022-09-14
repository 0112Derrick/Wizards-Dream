"use strict";
exports.__esModule = true;
exports.DirectionInput = void 0;
var DirectionInput = /** @class */ (function () {
    function DirectionInput() {
        this.heldDirections = [];
        this.map = {
            "ArrowUp": "up",
            "ArrowDown": "down",
            "ArrowLeft": "left",
            "ArrowRight": "right",
            "KeyW": "up",
            "KeyS": "down",
            "KeyA": "left",
            "KeyD": "right",
            "Space": "jump"
        };
    }
    Object.defineProperty(DirectionInput.prototype, "direction", {
        get: function () {
            return this.heldDirections[0];
        },
        enumerable: false,
        configurable: true
    });
    DirectionInput.prototype.init = function () {
        var _this = this;
        //Adding keys to input map
        document.addEventListener('keydown', function (e) {
            var dir = _this.map[e.code];
            if (dir && _this.heldDirections.indexOf(dir) === -1) {
                _this.heldDirections.unshift(dir);
                console.log('direction: ', _this.heldDirections);
            }
        });
        //removes keys from input map
        document.addEventListener("keyup", function (e) {
            var dir = _this.map[e.code];
            var index = _this.heldDirections.indexOf(dir);
            if (index > -1) {
                _this.heldDirections.splice(index, 1);
                console.log('direction: ', _this.heldDirections);
            }
        });
    };
    return DirectionInput;
}());
exports.DirectionInput = DirectionInput;
