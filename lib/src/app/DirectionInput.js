export var Direction;
(function (Direction) {
    Direction["UP"] = "up";
    Direction["DOWN"] = "down";
    Direction["LEFT"] = "left";
    Direction["RIGHT"] = "right";
    Direction["W"] = "up";
    Direction["A"] = "left";
    Direction["S"] = "down";
    Direction["D"] = "right";
    Direction["SKILL1"] = "attack1";
    Direction["SKILL2"] = "attack2";
    Direction["SKILL3"] = "attack3";
    Direction["SKILL4"] = "attack4";
    Direction["SKILL5"] = "attack5";
    Direction["STANDSTILL"] = "standstill";
})(Direction || (Direction = {}));
export class DirectionInput {
    heldDirections;
    map;
    constructor() {
        this.heldDirections = [];
        this.map = {
            ArrowUp: Direction.UP,
            ArrowDown: Direction.DOWN,
            ArrowLeft: Direction.LEFT,
            ArrowRight: Direction.RIGHT,
            KeyW: Direction.UP,
            KeyS: Direction.DOWN,
            KeyA: Direction.LEFT,
            KeyD: Direction.RIGHT,
            Digit1: Direction.SKILL1,
            Digit2: Direction.SKILL2,
            Digit3: Direction.SKILL3,
            Digit4: Direction.SKILL4,
            Digit5: Direction.SKILL5,
        };
    }
    get direction() {
        return this.heldDirections[0];
    }
    get keyReleased() {
        return this.heldDirections.length == 0 ? true : false;
    }
    init() {
        document.addEventListener("keydown", (e) => {
            console.log("key:", e);
            const dir = this.map[e.code];
            if (dir && this.heldDirections.indexOf(dir) === -1) {
                this.heldDirections.unshift(dir);
                console.log("direction: ", this.heldDirections);
            }
        });
        document.addEventListener("keyup", (e) => {
            const dir = this.map[e.code];
            const index = this.heldDirections.indexOf(dir);
            if (index > -1) {
                this.heldDirections.splice(index, 1);
            }
        });
    }
}
//# sourceMappingURL=DirectionInput.js.map