import { Shape, Rectangle, Circle } from "../framework/Shapes.js";

export class Intersector {
    printDialogueFeature: boolean = true;

    isRect2DColliding(rect1: Rectangle, rect2: Rectangle): boolean {
        if ((rect1.x < rect2.x + rect2.width) &&
            (rect1.x + rect1.width > rect2.x) &&
            (rect1.y < rect2.y + rect2.height) &&
            (rect1.height + rect1.y > rect2.y)) {
            this.printDialogue("Collision!");
            return true;
        }
        this.printDialogue(`Failure:\n rec1[x]:${rect1.x}, rec1[y]:${rect1.y}\n rec2[x]:${rect2.x}, rec2[y]:${rect2.y}\n
        test1: rec1[x]: ${rect1.x} < rec2[x] + rec2[width]: ${rect2.x + rect2.width} result ${rect1.x < rect2.x + rect2.width ? true : false}\n
        test2:  rec1[x] + rec1[width] ${rect1.x + rect1.width} > rec2[x] ${rect2.x} result ${rect1.x + rect1.width > rect2.x ? true : false}\n
        test3: rec1[y]: ${rect1.y} < rec2[y] + rec2[height]: ${rect2.y + rect2.height} result ${rect1.y < rect2.y + rect2.height ? true : false}\n
        test4:  rec1[y] + rec1[height] ${rect1.y + rect1.height} > rec2[y] ${rect2.y} result ${rect1.y + rect1.height > rect2.y ? true : false}\n
        `);
        return false;
    }

    isCircleColliding(circle1: Circle, circle2: Circle): boolean {
        let dx = Math.abs(circle1.x - circle2.x);
        let dy = Math.abs(circle1.y - circle2.y);

        dx = dx * dx;
        dy = dy * dy;

        const distance = Math.sqrt(dx + dy);

        if (distance < circle1.radius + circle2.radius) {
            this.printDialogue("Collision!");
            return true
        }
        return false;
    }


    isRectCollidingWithCircle(rect: Rectangle, circle: Circle): boolean {
        let distance = { x: null, y: null };

        distance.x = Math.abs(circle.x - rect.x);
        distance.y = Math.abs(circle.y - rect.y);
        if (distance.x > (rect.width / 2 + circle.radius)) { return false; }
        if (distance.y > (rect.height / 2 + circle.radius)) { return false; }
        if (distance.x <= (rect.width / 2)) { this.printDialogue("Collision!"); return true; }
        if (distance.y <= (rect.height / 2)) { this.printDialogue("Collision!"); return true; }
        let cDist_sq = (distance.x - rect.width / 2) ^ 2 + (distance.y - rect.height / 2) ^ 2;

        if ((cDist_sq <= (circle.radius ^ 2))) {
            this.printDialogue("Collision!");
            return true;
        };

        return false;

    }

    printDialogue(text: string) {
        if (this.printDialogueFeature)
            console.log(text);
    }

}