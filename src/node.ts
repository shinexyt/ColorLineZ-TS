import { CommonMethod } from "./common-method"
export interface FGH {
    F: number;
    G: number;
    H: number;
}
export class Node {
    x: number;
    y: number;
    id: string;
    currentY: number;
    flag: number;
    isRoadBlock = false;
    prev: Node = null;
    fObj: FGH = null;
    color = '';
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.id = CommonMethod.getId(x,y);
    }
}
