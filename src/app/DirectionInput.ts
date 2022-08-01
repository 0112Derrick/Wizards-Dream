export class DirectionInput {
    heldDirections: any[];
    map: { ArrowUp: string; ArrowDown: string; ArrowLeft: string; ArrowRight: string; KeyW: string; KeyS: string; KeyA: string; KeyD: string; Space: string; };
    constructor() {
        this.heldDirections = [];

        this.map = {
            "ArrowUp": "up",
            "ArrowDown": "down",
            "ArrowLeft": "left",
            "ArrowRight": "right",
            "KeyW": "up",
            "KeyS": "down",
            "KeyA": "left",
            "KeyD": "right",
            "Space": "jump",
        }
    }
    get direction() {
        return this.heldDirections[0];
    }

    init() {
        //Adding keys to input map
        document.addEventListener('keydown', e => {

            const dir = this.map[e.code];
            if (dir && this.heldDirections.indexOf(dir) === -1) {
                this.heldDirections.unshift(dir);
                console.log(this.heldDirections);

            }
        });

        //removes keys from input map
        document.addEventListener("keyup", (e) => {
            const dir = this.map[e.code];
            const index = this.heldDirections.indexOf(dir);

            if (index > -1) {
                this.heldDirections.splice(index, 1);
                console.log(this.heldDirections)
            }
        });
    }
}