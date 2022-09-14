"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var SyntheticEventEmitter_js_1 = require("./SyntheticEventEmitter.js");
var ClientSyntheticEventEmitter = /** @class */ (function (_super) {
    __extends(ClientSyntheticEventEmitter, _super);
    function ClientSyntheticEventEmitter() {
        return _super.call(this) || this;
    }
    /**
     * Dispatches a "local" synthetic "event" to the targets who have registered to receive the "event"
     * @param event - The name of the event
     * @param data  - The data that should be sent with the event.
     */
    ClientSyntheticEventEmitter.prototype.dispatchEventLocal = function (event, data) {
        var targets = this.eventMap.get(event);
        var eventObj = new CustomEvent(event, { detail: data });
        if (targets) {
            for (var _i = 0, targets_1 = targets; _i < targets_1.length; _i++) {
                var target = targets_1[_i];
                target.dispatchEvent(eventObj);
            }
        }
    };
    return ClientSyntheticEventEmitter;
}(SyntheticEventEmitter_js_1["default"]));
exports["default"] = ClientSyntheticEventEmitter;
