"use strict";
exports.__esModule = true;
exports.Sprite = void 0;
var Sprite = /** @class */ (function () {
    function Sprite(config) {
        var _this = this;
        this.isLoaded = false;
        this.isShadowLoaded = false;
        this.useShadow = true;
        //Set up the image
        this.image = new Image();
        this.image.src = config.src;
        this.image.onload = function () {
            _this.isLoaded = true;
        };
        //Shadow
        this.shadow = new Image();
        this.useShadow = true; //config.useShadow || false
        if (this.useShadow) {
            this.shadow.src = "/images/characters/shadow.png";
        }
        this.shadow.onload = function () {
            _this.isShadowLoaded = true;
        };
        //Configure Animation & initial state
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
        this.currentAnimation = 'idle-right'; //config.currentAnimation || "idleDown";
        this.currentAnimationFrame = 0;
        this.animationFrameLimit = config.animationFrameLimit || 32;
        this.animationFrameProgress = this.animationFrameLimit;
        // Reference the game object
        this.gameObject = config.gameObject;
    }
    Object.defineProperty(Sprite.prototype, "frame", {
        get: function () {
            // console.log('animations: ', this.animations);
            //onsole.log('this.currentAnimation: ', this.currentAnimation, ' currentAnimationFrame: ', this.currentAnimationFrame)
            return this.animations[this.currentAnimation][this.currentAnimationFrame];
        },
        enumerable: false,
        configurable: true
    });
    Sprite.prototype.setAnimation = function (key) {
        if (key !== this.currentAnimation) {
            this.currentAnimation = key;
            this.currentAnimationFrame = 0;
            this.animationFrameProgress = this.animationFrameLimit;
        }
    };
    Sprite.prototype.updateAnimationProgress = function () {
        //Downtick frame progress
        if (this.animationFrameProgress > 0) {
            this.animationFrameProgress -= 1;
            return;
        }
        // Reset the counter
        this.animationFrameProgress = this.animationFrameLimit;
        this.currentAnimationFrame += 1;
        if (this.frame === undefined) {
            this.currentAnimationFrame = 0;
        }
    };
    Sprite.prototype.draw = function (ctx) {
        var posX = this.gameObject.x - 8;
        var posY = this.gameObject.y - 18;
        this.isShadowLoaded && ctx.drawImage(this.shadow, posX, posY);
        var _a = this.frame, frameX = _a[0], frameY = _a[1];
        this.isLoaded && ctx.drawImage(this.image, frameX * 32, frameY * 32, 32, 32, posX, posY, 32, 32);
        this.updateAnimationProgress();
    };
    return Sprite;
}());
exports.Sprite = Sprite;
