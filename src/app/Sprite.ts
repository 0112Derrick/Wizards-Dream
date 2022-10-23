
import { isThisTypeNode } from "typescript";
import { DefaultDeserializer } from "v8";

export class Sprite {
    animations: Array<Array<any>>;
    currentAnimation: any;
    currentAnimationFrame: number;
    image: HTMLImageElement;
    isLoaded: boolean = false;
    gameObject: any;
    shadow: HTMLImageElement;
    isShadowLoaded: boolean = false;
    useShadow: boolean = true;
    animationFrameLimit: any;
    animationFrameProgress: any;
    usernames: boolean = true;

    constructor(config) {

        //Set up the image
        this.image = new Image();
        this.image.src = config.src;
        this.image.onload = () => {
            this.isLoaded = true;
        }

        //Shadow
        this.shadow = new Image();
        this.useShadow = true; //config.useShadow || false
        if (this.useShadow) { this.shadow.src = "/images/characters/shadow.png"; }
        this.shadow.onload = () => {
            this.isShadowLoaded = true;
        }


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

        }

        this.currentAnimation = 'idle-right';//config.currentAnimation || "idleDown";
        this.currentAnimationFrame = 0;

        this.animationFrameLimit = config.animationFrameLimit || 32;
        this.animationFrameProgress = this.animationFrameLimit;

        // Reference the game object
        this.gameObject = config.gameObject;
    }

    get frame() {

        // console.log('animations: ', this.animations);
        //onsole.log('this.currentAnimation: ', this.currentAnimation, ' currentAnimationFrame: ', this.currentAnimationFrame)
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
    }

    draw(ctx): void {
        const posX = this.gameObject.x - 8;
        const posY = this.gameObject.y - 18;
        const nameposX = this.gameObject.x + 5;
        const nameposY = this.gameObject.y - 10;
        this.isShadowLoaded && ctx.drawImage(this.shadow, posX, posY
        );

        if (this.usernames) {
            ctx.font = '9px sans-serif';
            ctx.fillText(this.gameObject.username, nameposX, nameposY, 16);
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
        }

        const [frameX, frameY] = this.frame;

        this.isLoaded && ctx.drawImage(this.image,
            frameX * 32, frameY * 32,
            32, 32,
            posX, posY,
            32, 32,
        )
        this.updateAnimationProgress();
    }

}
