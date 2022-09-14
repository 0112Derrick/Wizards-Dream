"use strict";
exports.__esModule = true;
exports.createGameState = void 0;
var Character_js_1 = require("./Character.js");
var Utils_js_1 = require("./Utils.js");
function createGameState() {
    return {
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
                    x: Utils_js_1.Utils.withGrid(5),
                    y: Utils_js_1.Utils.withGrid(6)
                }),
                npcHero: new Character_js_1.Character({
                    x: 10,
                    y: 4,
                    src: "/images/characters/players/witch-girl.png"
                })
            }
        },
        giantTree: {}
    };
}
exports.createGameState = createGameState;
