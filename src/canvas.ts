/**画布类 */
export class MyCanvas {
    private gridColumns: number;
    private gridSize: number;
    constructor(gridColumns: number, gridSize: number) {
        this.gridColumns = gridColumns;
        this.gridSize = gridSize;
    }
    /**绘制棋盘 */
    drawRect() {
        let bgCanvas = <HTMLCanvasElement>document.getElementById("bgCanvas");
        let bgContext = bgCanvas.getContext("2d");
        let endPoint = this.gridColumns * this.gridSize;
        // bgContext.lineWidth = 0.5;
        for (let i = 0; i <= endPoint; i += this.gridSize) {
            bgContext.beginPath();
            bgContext.moveTo(0, i);
            bgContext.lineTo(endPoint, i);
            bgContext.stroke();
            bgContext.closePath();
            bgContext.beginPath();
            bgContext.moveTo(i, 0);
            bgContext.lineTo(i, endPoint);
            bgContext.stroke();
            bgContext.closePath();
        }
    }
}