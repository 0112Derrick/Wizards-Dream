import { Rectangle, Circle, Shape, ShapeTypes } from "../framework/Shapes.js";
import { GameObject as $GameObject } from "./GameObject.js";
import { Sprite as $Sprite } from "./Sprite.js";
import { characterAddAndRemoveGameObjectsFromRenderI as $characterAddAndRemoveGameObjectsFromRenderI } from "../players/interfaces/OverworldInterfaces.js";
import $Camera from "./Camera.js";
import { Direction as $Direction } from "./DirectionInput.js";
import { CharacterSize as $CharacterSize } from "../constants/CharacterAttributesConstants.js"

export class Skill extends $GameObject {
    private shape: Shape;
    private castTime: number;
    private power: number;
    private effectTime: number;
    private cooldown: number;
    private onCooldown: boolean = false;
    private gameObjectsListCommandsCallback: $characterAddAndRemoveGameObjectsFromRenderI;
    private element: string;
    private cycle: number = 1000 / 20;

    constructor(config: {
        gameObjectID?, x: number, y: number, element: string, name: string, src: string, direction: string, createSprite: boolean, shape: Shape, castTime: number, power: number, effectTime: number, cooldown: number, xVelocity: number, yVelocity: number
    }) {

        const timestamp = new Date().getTime();
        const randomNum = Math.floor(Math.random() * 1000);
        config.gameObjectID = timestamp + randomNum;
        config.createSprite = false;

        super(config);

        this.name = config.name;
        this.shape = config.shape;
        this.castTime = config.castTime;
        this.cooldown = config.cooldown;
        this.power = config.power;
        this.effectTime = config.effectTime;
        this.element = config.element;
        this.xVelocity = config.xVelocity;
        this.yVelocity = config.yVelocity;

        if (config.src) {
            this.createSprite(config.src);
        } else {
            this.sprite = null;
        }
    }

    set GameObjectsCallback(object: $characterAddAndRemoveGameObjectsFromRenderI) {
        this.gameObjectsListCommandsCallback = object;
    }

    get Element(): string {
        return this.element;
    }

    get Shape(): Shape {
        return this.shape;
    }

    get Name(): string {
        return this.name;
    }

    get EffectTime(): number {
        return this.effectTime;
    }

    get OnCooldown(): boolean {
        return this.onCooldown;
    }

    get Damage(): number {
        return this.power;
    }

    set Damage(damage: number) {
        this.power = damage;
    }

    private addToGameObjectsListCallback() {
        this.gameObjectsListCommandsCallback.addSkillToRenderContex(this);
    }

    private removeSelfFromRenderedGameObjectsListCallback() {
        let result = this.gameObjectsListCommandsCallback.removeSkillFromRenderContex(this);
        if (result) {
            return;
        }
        console.log("Failure to remove attack.");
    }

    createSprite(src: string) {
        this.sprite = new $Sprite({
            gameObject: this,
            src: src
        })
    }

    createRect(x: number, y: number, height: number, width: number, color?): Rectangle {
        let rect: Rectangle = {
            width: width,
            height: height,
            x: x,
            y: y,
            type: ShapeTypes.Rectangle,
            color: color || "red"
        }

        return rect;
    }

    createCircle(x: number, y: number, radius: number, color?): Circle {
        let circ: Circle = {
            radius: radius,
            x: x,
            y: y,
            type: ShapeTypes.Circle,
            color: color || "white"
        }
        return circ;
    }

    draw(ctx: CanvasRenderingContext2D, camera: $Camera, facingDirection: $Direction, coords: { x: number, y: number }) {

        if (this.onCooldown) {
            return;
        }

        if (this.cooldown > 1) {
            this.onCooldown = true;
            setTimeout(() => { this.onCooldown = false; }, this.cooldown);
        }

        this.direction = facingDirection;

        switch (facingDirection) {
            case $Direction.UP:
                this.shape.x = coords.x - ($CharacterSize.width / 1.8);
                this.shape.y = coords.y - $CharacterSize.height / 1.5;
                break;
            case $Direction.DOWN:
                this.shape.x = coords.x - ($CharacterSize.width / 1.8);
                this.shape.y = coords.y;
                break;
            case $Direction.LEFT:
                this.shape.x = coords.x - $CharacterSize.width;
                this.shape.y = coords.y - ($CharacterSize.height / 2.5);
                break;
            case $Direction.RIGHT:
                this.shape.x = coords.x;
                this.shape.y = coords.y - ($CharacterSize.height / 2.5);
                break;
            default:
                console.log("unknown direction: ", facingDirection);
                return;
        }


        if (this.sprite) {

            if (this.shape.type == ShapeTypes.Rectangle) {
                if (!camera.isInsideOfView((this.shape as Rectangle).x, (this.shape as Rectangle).y, (this.shape as Rectangle).width, (this.shape as Rectangle).height)) {
                    return
                }
                console.log("shape is rect")
            }

            if (this.shape.type == ShapeTypes.Circle) {
                //draw circle
                if (!camera.isCircleInsideOfView(this.shape.x, this.shape.y, (this.shape as Circle).radius)) {
                    return;
                }
                console.log("shape is circ")
            }

            if (this.castTime > 1) {

                console.log("Casting " + this.name);

                setTimeout(() => {
                    this.sprite.drawGameObject(ctx, this.shape.x, this.shape.y);
                    this.addToGameObjectsListCallback();
                }, this.castTime);

            } else {
                this.sprite.drawGameObject(ctx, this.shape.x, this.shape.y);
                this.addToGameObjectsListCallback();
            }

            let animationFrame = setInterval(() => {
                switch (this.direction) {
                    case $Direction.UP:
                        this.shape.y -= this.yVelocity;
                        break;
                    case $Direction.DOWN:
                        this.shape.y = coords.y + this.yVelocity;
                        break;
                    case $Direction.LEFT:
                        this.shape.x = coords.x - this.xVelocity;
                        break;
                    case $Direction.RIGHT:
                        this.shape.x = coords.x + this.xVelocity;
                        break;
                }
                console.log(this.name, " x:", this.shape.x, " y:", this.shape.y)
            }, this.cycle);

            setTimeout(() => { this.removeSelfFromRenderedGameObjectsListCallback(); clearInterval(animationFrame); }, this.effectTime * this.cycle);
            return;
        }

        this.addToGameObjectsListCallback();
        this.shape.x -= camera.x;
        this.shape.y -= camera.y;
        this.x = this.shape.x;
        this.y = this.shape.y;

        if (this.shape.type == ShapeTypes.Rectangle) {
            //draw rectangle
            if (camera.isInsideOfView((this.shape as Rectangle).x, (this.shape as Rectangle).y, (this.shape as Rectangle).width, (this.shape as Rectangle).height)) {
                ctx.fillStyle = this.shape.color;
                ctx.fillRect(this.shape.x, this.shape.y, (this.shape as Rectangle).width, (this.shape as Rectangle).height);
            }
        }

        if (this.shape.type == ShapeTypes.Circle) {
            //draw circle
            if (camera.isCircleInsideOfView(this.shape.x - camera.x, this.shape.y - camera.y, (this.shape as Circle).radius)) {
                ctx.fillStyle = this.shape.color;
                ctx.beginPath();
                ctx.arc(this.shape.x, this.shape.y, (this.shape as Circle).radius, 0, 2 * Math.PI); // 2 * Math.PI represents a full circle (360 degrees)
                ctx.fill()
            }
        }

        let animationFrame = setInterval(() => {
            switch (this.direction) {
                case $Direction.UP:
                    this.shape.y -= this.yVelocity;
                    break;
                case $Direction.DOWN:
                    this.shape.y = coords.y + this.yVelocity;
                    break;
                case $Direction.LEFT:
                    this.shape.x = coords.x - this.xVelocity;
                    break;
                case $Direction.RIGHT:
                    this.shape.x = coords.x + this.xVelocity;
                    break;
            }
            console.log(this.name, " x:", this.shape.x, " y:", this.shape.y)
        }, this.cycle);

        setTimeout(() => { this.removeSelfFromRenderedGameObjectsListCallback(); clearInterval(animationFrame) }, this.effectTime * this.cycle);
    }

}