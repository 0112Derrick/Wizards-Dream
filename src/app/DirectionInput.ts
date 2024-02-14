export enum Direction {
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
  W = "up",
  A = "left",
  S = "down",
  D = "right",
  SKILL1 = "attack1",
  SKILL2 = "attack2",
  SKILL3 = "attack3",
  SKILL4 = "attack4",
  SKILL5 = "attack5",
  STANDSTILL = "standstill",
}

export class DirectionInput {
  heldDirections: any[];
  map: {
    ArrowUp: Direction.UP;
    ArrowDown: Direction.DOWN;
    ArrowLeft: Direction.LEFT;
    ArrowRight: Direction.RIGHT;
    KeyW: Direction.UP;
    KeyS: Direction.DOWN;
    KeyA: Direction.LEFT;
    KeyD: Direction.RIGHT;
    Digit1: Direction.SKILL1;
    Digit2: Direction.SKILL2;
    Digit3: Direction.SKILL3;
    Digit4: Direction.SKILL4;
    Digit5: Direction.SKILL5;
  };

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
    //Adding keys to input map
    document.addEventListener("keydown", (e) => {
      console.log("key:", e);
      const dir = this.map[e.code];
      if (dir && this.heldDirections.indexOf(dir) === -1) {
        this.heldDirections.unshift(dir);
        console.log("direction: ", this.heldDirections);
      }
    });

    //removes keys from input map
    document.addEventListener("keyup", (e) => {
      const dir = this.map[e.code];
      const index = this.heldDirections.indexOf(dir);

      if (index > -1) {
        this.heldDirections.splice(index, 1);
        //console.log('direction: ', this.heldDirections)
      }
    });
  }
}
