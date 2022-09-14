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
var Observer = /** @class */ (function (_super) {
    __extends(Observer, _super);
    function Observer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    //Override notify on the class that extends Observer
    Observer.prototype.notify = function (data) {
        console.log("Notified of change to ".concat(data));
    };
    Observer.prototype.addEventListner = function (event, callback, viewEventSource) {
        //de-couple the controller and view
        _super.prototype.addEventListener.call(this, event, callback); //Register the event with the system.
        viewEventSource.addEventTarget(event, this); // Add this controller as the target of the event
    };
    Observer.prototype.listenForEvent = function (event, callback, eventSource) {
        //Register the event with the system
        _super.prototype.addEventListener.call(this, event, callback);
        //Add this event sink to the given source
        eventSource.addEventTarget(event, this);
    };
    return Observer;
}(EventTarget));
exports["default"] = Observer;
