export enum ShapeTypes {
    Rectangle = "rectangle",
    Circle = "circle"
}

export interface Shape {
    x: number, y: number;
    type: ShapeTypes
    color: string;
}

export interface Rectangle extends Shape {
    width: number,
    height: number
}

export interface Circle extends Shape {
    radius: number
}