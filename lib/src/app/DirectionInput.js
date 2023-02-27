export var Direction;
(function (Direction) {
    Direction["UP"] = "up";
    Direction["DOWN"] = "down";
    Direction["LEFT"] = "left";
    Direction["RIGHT"] = "right";
    Direction["W"] = "up";
    Direction["A"] = "left";
    Direction["S"] = "right";
    Direction["D"] = "down";
    Direction["JUMP"] = "jump";
})(Direction || (Direction = {}));
export class DirectionInput {
    heldDirections;
    map;
    constructor() {
        this.heldDirections = [];
        this.map = {
            "ArrowUp": Direction.UP,
            "ArrowDown": Direction.DOWN,
            "ArrowLeft": Direction.LEFT,
            "ArrowRight": Direction.RIGHT,
            "KeyW": Direction.UP,
            "KeyS": Direction.DOWN,
            "KeyA": Direction.LEFT,
            "KeyD": Direction.RIGHT,
            "Space": Direction.JUMP,
        };
    }
    get direction() {
        return this.heldDirections[0];
    }
    init() {
        document.addEventListener('keydown', e => {
            const dir = this.map[e.code];
            if (dir && this.heldDirections.indexOf(dir) === -1) {
                this.heldDirections.unshift(dir);
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