import { MyCanvas } from "./canvas";
import { Action } from "./action";

const gridColumns = 9;
const gridSize = 40;

document.bgColor =  "beige";

let myCanvas = new MyCanvas(gridColumns, gridSize);
myCanvas.drawRect();

let mainAction = new Action(gridColumns, gridSize);
mainAction.Init();
