export var SpriteAnimations;
(function (SpriteAnimations) {
    SpriteAnimations[SpriteAnimations["idle_up"] = 0] = "idle_up";
    SpriteAnimations[SpriteAnimations["idle_down"] = 1] = "idle_down";
    SpriteAnimations[SpriteAnimations["idle_left"] = 2] = "idle_left";
    SpriteAnimations[SpriteAnimations["idle_right"] = 3] = "idle_right";
    SpriteAnimations[SpriteAnimations["attack1"] = 4] = "attack1";
    SpriteAnimations[SpriteAnimations["walking_up"] = 5] = "walking_up";
    SpriteAnimations[SpriteAnimations["walking_down"] = 6] = "walking_down";
    SpriteAnimations[SpriteAnimations["walking_left"] = 7] = "walking_left";
    SpriteAnimations[SpriteAnimations["walking_right"] = 8] = "walking_right";
    SpriteAnimations[SpriteAnimations["walking_jump"] = 9] = "walking_jump";
})(SpriteAnimations || (SpriteAnimations = {}));
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
    usernames = true;
    src = '';
    originalImgData = null;
    animationSpeed = null;
    attacks = [];
    constructor(config) {
        this.image = new Image();
        this.image.src = config.src;
        this.src = config.src;
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
        this.animationSpeed = 2;
        this.animations = config.animations || {
            [SpriteAnimations.idle_up]: [[0, 2]],
            [SpriteAnimations.idle_down]: [[0, 0]],
            [SpriteAnimations.idle_left]: [[0, 3]],
            [SpriteAnimations.idle_right]: [[0, 1]],
            [SpriteAnimations.attack1]: [[0, 0]],
            [SpriteAnimations.walking_up]: [[1, 2], [0, 2], [3, 2], [0, 2]],
            [SpriteAnimations.walking_down]: [[1, 0], [0, 0], [3, 0], [0, 0]],
            [SpriteAnimations.walking_left]: [[1, 3], [0, 3], [3, 3], [0, 3]],
            [SpriteAnimations.walking_right]: [[1, 1], [0, 1], [3, 1], [0, 1]],
            [SpriteAnimations.walking_jump]: [[0, 0]],
            'idle-undefined': [[0, 0]],
            'walking-undefined': [[0, 0]],
            'idle-object': [[0, 0]],
            'walking-object': [[0, 0]],
            'idle-0': [[0, 0]],
            'walking-0': [[0, 0]]
        };
        this.currentAnimation = SpriteAnimations.idle_right;
        this.currentAnimationFrame = 0;
        this.animationFrameLimit = config.animationFrameLimit || 32;
        this.animationFrameProgress = this.animationFrameLimit;
        this.gameObject = config.gameObject;
    }
    get frame() {
        return this.animations[this.currentAnimation][this.currentAnimationFrame];
    }
    setAnimation(animationsKey) {
        if (animationsKey !== this.currentAnimation) {
            this.currentAnimation = animationsKey;
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
        this.currentAnimationFrame += this.animationSpeed;
        while (this.frame === undefined) {
            this.currentAnimationFrame -= this.animations[this.currentAnimation].length;
        }
    }
    drawGameObject(ctx, x, y) {
        if (this.isLoaded) {
            ctx.drawImage(this.image, x, y);
        }
    }
    draw(ctx, characterX, characterY) {
        let ObjectPositionXCoordinate;
        let ObjectPositionYCoordinate;
        let NamePositionXCoordinate;
        let NamePositionYCoordinate;
        const offsetX = this.gameObject.width;
        const offsetY = this.gameObject.height;
        if (characterX && characterY) {
            ObjectPositionXCoordinate = characterX - offsetX;
            ObjectPositionYCoordinate = characterY - offsetY;
            NamePositionXCoordinate = characterX - 15;
            NamePositionYCoordinate = characterY - 20;
        }
        else {
            ObjectPositionXCoordinate = this.gameObject.x - offsetX;
            ObjectPositionYCoordinate = this.gameObject.y - offsetY;
            NamePositionXCoordinate = this.gameObject.x + 7;
            NamePositionYCoordinate = this.gameObject.y - 10;
        }
        if (this.isLoaded) {
            this.originalImgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        const CharacterSpriteSheetSize = 32;
        this.isShadowLoaded && ctx.drawImage(this.shadow, ObjectPositionXCoordinate, ObjectPositionYCoordinate);
        const [frameX, frameY] = this.frame;
        if (this.currentAnimation == SpriteAnimations.attack1 && this.currentAnimationFrame == 0) {
            this.updateAnimationProgress();
        }
        if (this.usernames) {
            ctx.font = '9px sans-serif';
            ctx.fillStyle = 'white';
            ctx.fillText(this.gameObject.username, NamePositionXCoordinate, NamePositionYCoordinate, 18);
            ctx.textAlign = 'center';
        }
        this.isLoaded && ctx.drawImage(this.image, frameX * CharacterSpriteSheetSize, frameY * CharacterSpriteSheetSize, CharacterSpriteSheetSize, CharacterSpriteSheetSize, ObjectPositionXCoordinate, ObjectPositionYCoordinate, CharacterSpriteSheetSize, CharacterSpriteSheetSize);
        this.updateAnimationProgress();
    }
    toJSON() {
        return {
            src: this.src,
        };
    }
}
//# sourceMappingURL=Sprite.js.map