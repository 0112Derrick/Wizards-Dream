import { GameObject } from "./GameObject.js";
import { Character } from "./Character.js";
class OverworldMap {
    gameObjects;
    lowerImage;
    upperImage;
    constructor(config) {
        this.gameObjects = config.gameObjects;
        this.lowerImage = new Image();
        this.lowerImage.src = config.lowerSrc;
        this.upperImage = new Image();
        this.upperImage.src = config.upperSrc;
    }
    drawLowerImage(ctx) {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    drawUpperImage(ctx) {
        ctx.drawImage(this.lowerImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}
window.OverworldMaps = {
    grassyField: {
        lowerSrc: "/images/maps/Battleground1.png",
        upperSrc: "/images/maps/Battleground1.png",
        gameObjects: []
    },
    hallway: {
        lowerSrc: "/images/maps/Battleground2.png",
        upperSrc: "/images/maps/Battleground2.png",
        gameObjects: {
            hero: new Character({
                isPlayerControlled: true,
                x: 5,
                y: 5,
            }),
            npcHero: new GameObject({
                x: 10,
                y: 4,
                src: "/images/characters/players/witch-girl.png"
            })
        }
    },
    giantTree: {}
};
export { OverworldMap };
//# sourceMappingURL=OverworldMap.js.map