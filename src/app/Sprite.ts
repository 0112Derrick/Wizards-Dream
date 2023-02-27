
import { isThisTypeNode } from "typescript";
import { DefaultDeserializer } from "v8";

export enum SpriteAnimations {
    idle_up,
    idle_down,
    idle_left,
    idle_right,
    idle_jump,
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

            [SpriteAnimations.idle_up]: [[0, 2]],
            [SpriteAnimations.idle_down]: [[0, 0]],
            [SpriteAnimations.idle_left]: [[0, 3]],
            [SpriteAnimations.idle_right]: [[0, 1]],
            [SpriteAnimations.idle_jump]: [[0, 0]],

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
        //onsole.log('this.currentAnimation: ', this.currentAnimation, ' currentAnimationFrame: ', this.currentAnimationFrame)
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
        this.currentAnimationFrame += 1;

        if (this.frame === undefined) {
            this.currentAnimationFrame = 0;
        }
    }

    draw(ctx): void {
        const ObjectPositionXCoordinate = this.gameObject.x - 8;
        const ObjectPositionYCoordinate = this.gameObject.y - 18;
        const NamePositionXCoordinate = this.gameObject.x + 7;
        const NamePositionYCoordinate = this.gameObject.y - 10;
        const CharacterSpriteSheetSize = 32;
        this.isShadowLoaded && ctx.drawImage(this.shadow, ObjectPositionXCoordinate, ObjectPositionYCoordinate
        );

        if (this.usernames) {
            ctx.font = '9px sans-serif';
            ctx.fillText(this.gameObject.username, NamePositionXCoordinate, NamePositionYCoordinate, 18);
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
        }

        const [frameX, frameY] = this.frame;

        this.isLoaded && ctx.drawImage(this.image,
            frameX * CharacterSpriteSheetSize, frameY * CharacterSpriteSheetSize,
            CharacterSpriteSheetSize, CharacterSpriteSheetSize,
            ObjectPositionXCoordinate, ObjectPositionYCoordinate,
            CharacterSpriteSheetSize, CharacterSpriteSheetSize,
        )
        this.updateAnimationProgress();
    }

}
