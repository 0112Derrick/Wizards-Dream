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
exports.View = void 0;
var HTMLElementIds_js_1 = require("../constants/HTMLElementIds.js");
var ClientSyntheticEventEmitter_js_1 = require("../framework/ClientSyntheticEventEmitter.js");
var EventConstants_js_1 = require("../constants/EventConstants.js");
var MissingElementError = /** @class */ (function (_super) {
    __extends(MissingElementError, _super);
    function MissingElementError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'Missing Html Element';
        return _this;
    }
    return MissingElementError;
}(Error));
var ClientView = /** @class */ (function (_super) {
    __extends(ClientView, _super);
    function ClientView() {
        var _this = _super.call(this) || this;
        _this.DOM = [];
        for (var elem_id in HTMLElementIds_js_1.HTML_IDS) {
            var elem = document.getElementById(HTMLElementIds_js_1.HTML_IDS[elem_id]);
            if (elem) {
                _this.DOM[HTMLElementIds_js_1.HTML_IDS[elem_id]] = elem;
            }
            else {
                throw new MissingElementError("Element id: ".concat(HTMLElementIds_js_1.HTML_IDS, ": ").concat(HTMLElementIds_js_1.HTML_IDS[elem_id], " ."));
            }
        }
        _this.DOM[HTMLElementIds_js_1.HTML_IDS.LOGOUT].addEventListener('click', function () { _this.logoutAccountCallback(); });
        document.getElementById('logout').addEventListener('click', function () { _this.logoutAccountCallback(); });
        var characterCreate = document.getElementById('characterScreen-CreateCharacterBtn');
        characterCreate === null || characterCreate === void 0 ? void 0 : characterCreate.addEventListener('click', function () { _this.createCharacter(); });
        return _this;
    }
    ClientView.prototype.createCharacter = function () {
        //check GenderText
        //check ClassText 
    };
    ClientView.prototype.logoutAccountCallback = function () {
        this.dispatchEventLocal(EventConstants_js_1.EventConstants.LOGOUT, null);
    };
    return ClientView;
}(ClientSyntheticEventEmitter_js_1["default"]));
exports.View = new ClientView();
