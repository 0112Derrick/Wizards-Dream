"use strict";
exports.__esModule = true;
var SyntheticEventEmitter = /** @class */ (function () {
    function SyntheticEventEmitter() {
        this.eventMap = new Map();
    }
    SyntheticEventEmitter.prototype.addEventTarget = function (event, target) {
        if (this.eventMap.has(event)) {
            this.eventMap.get(event).push(target);
        }
        else {
            this.eventMap.set(event, new Array(target));
        }
    };
    return SyntheticEventEmitter;
}());
exports["default"] = SyntheticEventEmitter;
