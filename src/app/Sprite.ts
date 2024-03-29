
import { config } from "process";
import { isThisTypeNode } from "typescript";
import { DefaultDeserializer } from "v8";

export enum SpriteAnimations {
    idle_up,
    idle_down,
    idle_left,
    idle_right,
    attack1,
    walking_up,
    walking_down,
    walking_left,
    walking_right,
    walking_jump,
}
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
    src: string = '';
    originalImgData = null;
    animationSpeed = null;
    attacks = [];

    constructor(config) {

        //Set up the image
        this.image = new Image();
        this.image.src = config.src;
        this.src = config.src;
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

        this.animationSpeed = 2;


        //Configure Animation & initial state
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
        }

        this.currentAnimation = SpriteAnimations.idle_right;//config.currentAnimation || "idleDown";
        this.currentAnimationFrame = 0;

        this.animationFrameLimit = config.animationFrameLimit || 32;
        this.animationFrameProgress = this.animationFrameLimit;

        // Reference the game object
        this.gameObject = config.gameObject;
    }

    get frame() {
        // console.log('animations: ', this.animations);
        //console.log('this.currentAnimation: ', this.currentAnimation, ' currentAnimationFrame: ', this.currentAnimationFrame)
        return this.animations[this.currentAnimation][this.currentAnimationFrame];
    }

    setAnimation(animationsKey: SpriteAnimations) {
        if (animationsKey !== this.currentAnimation) {
            this.currentAnimation = animationsKey;
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
        this.currentAnimationFrame += this.animationSpeed;


        while (this.frame === undefined) {
            this.currentAnimationFrame -= this.animations[this.currentAnimation].length;
        }
    }

    drawGameObject(ctx: CanvasRenderingContext2D, x, y) {
        if (this.isLoaded) {
            ctx.drawImage(this.image, x, y);
        }
    }

    draw(ctx: CanvasRenderingContext2D, characterX?, characterY?): void {
        let ObjectPositionXCoordinate;
        let ObjectPositionYCoordinate;
        let NamePositionXCoordinate;
        let NamePositionYCoordinate;

        const offsetX = this.gameObject.width;
        const offsetY = this.gameObject.height;

        if (characterX && characterY) {
            ObjectPositionXCoordinate = characterX - offsetX;
            ObjectPositionYCoordinate = characterY - offsetY;
            //console.log("Sprite being drawn at:\nx: ", ObjectPositionXCoordinate, " y: ", ObjectPositionYCoordinate);
            NamePositionXCoordinate = characterX - 15;
            NamePositionYCoordinate = characterY - 20;
        } else {
            ObjectPositionXCoordinate = this.gameObject.x - offsetX;
            ObjectPositionYCoordinate = this.gameObject.y - offsetY;
            //ObjectPositionXCoordinate = (this.gameObject.x - 8) - offsetX;
            //ObjectPositionYCoordinate = (this.gameObject.y - 18) - offsetY;
            NamePositionXCoordinate = this.gameObject.x + 7;
            NamePositionYCoordinate = this.gameObject.y - 10;
        }

        if (this.isLoaded) {
            this.originalImgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        const CharacterSpriteSheetSize = 32;
        this.isShadowLoaded && ctx.drawImage(this.shadow, ObjectPositionXCoordinate, ObjectPositionYCoordinate
        );


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

        this.isLoaded && ctx.drawImage(this.image,
            frameX * CharacterSpriteSheetSize, frameY * CharacterSpriteSheetSize,
            CharacterSpriteSheetSize, CharacterSpriteSheetSize,
            ObjectPositionXCoordinate, ObjectPositionYCoordinate,
            CharacterSpriteSheetSize, CharacterSpriteSheetSize,
        );

        this.updateAnimationProgress();
    }

    toJSON() {
        return {
            src: this.src,
        }
    }

}
