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
};
export { OverworldMap };
//# sourceMappingURL=OverworldMap.js.map