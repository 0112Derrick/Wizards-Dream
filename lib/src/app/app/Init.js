"use strict";
exports.__esModule = true;
var Overworld_js_1 = require("./Overworld.js");
(function () {
    var OVERWORLD = new Overworld_js_1.Overworld({
        element: document.querySelector(".game-container")
    });
    OVERWORLD.init();
})();
