export class Sprite {
    animations;
    currentAnimation;
    currentAnimationFrame;
    image;
    isLoaded = false;
    gameObject;
    shadow;
    isShadowLoaded = false;
    useShadow = true;
    animationFrameLimit;
    animationFrameProgress;
    constructor(config) {
        this.image = new Image();
        this.image.src = config.src;
        this.image.onload = () => {
            this.isLoaded = true;
        };
        this.shadow = new Image();
        this.useShadow = true;
        if (this.useShadow) {
            this.shadow.src = "/images/characters/shadow.png";
        }
        this.shadow.onload = () => {
            this.isShadowLoaded = true;
        };
        this.animations = config.animations || {
            'idle-down': [
                [0, 0]
            ],
            "idle-up": [
                [0, 2]
            ],
            'idle-right': [
                [0, 1]
            ],
            'idle-left': [
                [0, 3]
            ],
            'walk-down': [
                [1, 0], [0, 0], [3, 0], [0, 0]
            ],
            'walk-right': [
                [1, 1], [0, 1], [3, 1], [0, 1]
            ],
            'walk-left': [
                [1, 3], [0, 3], [3, 3], [0, 3]
            ],
            'walk-up': [
                [1, 2], [0, 2], [3, 2], [0, 2]
            ],
            'walk-jump': [[0, 0]],
            'idle-jump': [[0, 0]],
            'idle-undefined': [[0, 0]],
            'walking-undefined': [[0, 0]],
            'idle-object': [[0, 0]],
            'walking-object': [[0, 0]],
            'idle-0': [[0, 0]],
            'walking-0': [[0, 0]]
        };
        this.currentAnimation = 'idle-right';
        this.currentAnimationFrame = 0;
        this.animationFrameLimit = config.animationFrameLimit || 32;
        this.animationFrameProgress = this.animationFrameLimit;
        this.gameObject = config.gameObject;
    }
    get frame() {
        return this.animations[this.currentAnimation][this.currentAnimationFrame];
    }
    setAnimation(key) {
        if (key !== this.currentAnimation) {
            this.currentAnimation = key;
            this.currentAnimationFrame = 0;
            this.animationFrameProgress = this.animationFrameLimit;
        }
    }
    updateAnimationProgress() {
        if (this.animationFrameProgress > 0) {
            this.animationFrameProgress -= 1;
            return;
        }
        this.animationFrameProgress = this.animationFrameLimit;
        this.currentAnimationFrame += 1;
        if (this.frame === undefined) {
            this.currentAnimationFrame = 0;
        }
    }
    draw(ctx) {
        const posX = this.gameObject.posX - 8;
        const posY = this.gameObject.posY - 18;
        this.isShadowLoaded && ctx.drawImage(this.shadow, posX, posY);
        const [frameX, frameY] = this.frame;
        this.isLoaded && ctx.drawImage(this.image, frameX * 32, frameY * 32, 32, 32, posX, posY, 32, 32);
        this.updateAnimationProgress();
    }
}
//# sourceMappingURL=Sprite.js.map