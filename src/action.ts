import { Map, Pointer } from "./a-star-map";
import { CommonMethod } from "./common-method"
export class Action {
    private map: Map;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private tipsContext: CanvasRenderingContext2D;
    private gridSize: number;
    private gridColumns: number;
    private gridRows: number;
    private num = 0;
    private num1 = 0;
    private result = 0;
    private colors = ["red", "blue", "orange", "green", "brown"];
    private nextColors: string[];
    private eliminatedBalls: any = [];
    private ballRadius = 13;
    private score = 0;
    private stopMoveAnimation: number = null;
    private currentColor: string;
    private stopJump: number = null;
    private stopRemove: number = null;
    constructor(gridColumns: number, gridSize: number) {
        this.gridSize = gridSize;
        this.gridColumns = gridColumns;
        this.gridRows = gridColumns;

        this.map = new Map(gridColumns, gridSize);

        this.canvas = <HTMLCanvasElement>document.getElementById("myCanvas");
        this.context = this.canvas.getContext("2d");
        this.canvas.addEventListener('click', this.click, false);

        let tipsCanvas = <HTMLCanvasElement>document.getElementById("tipsCanvas");
        this.tipsContext = tipsCanvas.getContext("2d");
    }
    Init() {
        this.CreateInitialBall();
        this.GetNextColors();
    }
    private CreateInitialBall() {
        for (let i = 0; i < 5; i++) {
            let color = this.GetRandomColor();
            let x = this.GetRandomNum();
            let y = this.GetRandomNum();
            let node = this.map.getNode(x, y);
            let id = CommonMethod.getId(x, y);
            if (!node.isRoadBlock) {
                node.isRoadBlock = true;
                node.color = color;
                this.map.closeArea[id] = node;
                this.CreateBall(color, x, y);
            }
            else
                i--;
        }
    }
    private GetRandomColor() {
        return this.colors[Math.floor(Math.random() * 5)];
    }
    private GetRandomNum() {
        return this.gridSize * Math.floor(Math.random() * 9) + this.gridSize / 2;
    }
    private CreateBall(color: string, x: number, y: number) {
        //增加小球渐变颜色，实现粗糙光照3d效果。
        let grd = this.context.createRadialGradient(x - 2, y - 2, 1, x, y, 10);
        grd.addColorStop(1, color);
        grd.addColorStop(0, "white");
        // context.fillStyle = "rgba(255,255,255,0.5)";
        this.context.fillStyle = grd;
        this.context.beginPath();
        this.context.arc(x, y, this.ballRadius, 0, 2 * Math.PI);
        this.context.fill();
    }
    private GetNextColors() {
        this.nextColors = [];
        this.nextColors.push(this.colors[Math.floor(Math.random() * 5)]);
        this.nextColors.push(this.colors[Math.floor(Math.random() * 5)]);
        this.nextColors.push(this.colors[Math.floor(Math.random() * 5)]);
        this.CreateTipsBall(this.nextColors[0], 15, 15);
        this.CreateTipsBall(this.nextColors[1], 45, 15);
        this.CreateTipsBall(this.nextColors[2], 75, 15);
    }
    private CreateTipsBall(color: string, x: number, y: number) {
        //增加小球渐变颜色，实现粗糙光照3d效果。
        let grd = this.tipsContext.createRadialGradient(x - 2, y - 2, 1, x, y, 10);
        grd.addColorStop(1, color);
        grd.addColorStop(0, "white");
        // context.fillStyle = "rgba(255,255,255,0.5)";
        this.tipsContext.fillStyle = grd;
        this.tipsContext.beginPath();
        this.tipsContext.arc(x, y, this.ballRadius, 0, 2 * Math.PI);
        this.tipsContext.fill();
    }
    private click = (event: MouseEvent) => {
        let mousePos = this.getMousePos(event);
        let node = this.map.getNode(mousePos.x, mousePos.y);
        if (!node) {
            return;
        }
        if (node.isRoadBlock) {
            cancelAnimationFrame(this.stopJump);
            if (this.map.startNode) {
                this.RemoveBall(this.map.startNode.x, this.map.startNode.currentY);
                this.CreateBall(this.map.startNode.color, this.map.startNode.x, this.map.startNode.y);
            }
            this.map.setStartNode(node);
            this.SelectBall();
        }
        else {
            if (!this.map.startNode) {
                this.playSound('media/click-error.mp3');
                return;
            }
            this.map.setEndNode(node);
            this.map.getPath();
            if (this.map.paths.length > 0) {
                cancelAnimationFrame(this.stopJump);
                this.RemoveBall(this.map.startNode.x, this.map.startNode.currentY);
                this.map.paths = this.SmoothPath(5);
                this.currentColor = this.map.startNode.color;
                // this.map.startNode.color = this.bgColor;
                this.map.startNode.color = '';
                this.map.startNode.isRoadBlock = false;
                this.num = 1;
                this.playSound('media/run.mp3');
                this.moveAnimation();
            }
            else {
                this.playSound('media/click-error1.mp3');
                this.map.resetArea();
            }
        }
    }
    private getMousePos(evt: MouseEvent) {
        let rect = this.canvas.getBoundingClientRect();
        let x = evt.clientX - rect.left * (this.canvas.width / rect.width);
        let y = evt.clientY - rect.top * (this.canvas.height / rect.height);
        let gridSize = this.gridSize;
        return {
            x: Math.ceil(x / gridSize) * gridSize - gridSize / 2,
            y: Math.ceil(y / gridSize) * gridSize - gridSize / 2
        };
    }
    private RemoveBall(x: number, y: number) {
        let ballRadius = this.ballRadius;
        this.context.clearRect(x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2);
    }
    private SelectBall() {
        this.playSound('media/click.mp3');
        this.map.startNode.currentY = this.map.startNode.y;
        //小球每一帧跳动幅度
        this.map.startNode.flag = 1;
        this.JumpBall();
    }
    private JumpBall = () => {
        this.RemoveBall(this.map.startNode.x, this.map.startNode.currentY);
        //小球跳动范围
        if (Math.abs(this.map.startNode.currentY - this.map.startNode.y) == 8)
            this.map.startNode.flag *= -1;
        this.map.startNode.currentY += this.map.startNode.flag;
        this.CreateBall(this.map.startNode.color, this.map.startNode.x, this.map.startNode.currentY);
        this.stopJump = requestAnimationFrame(this.JumpBall);
    }
    private playSound(uri: string) {
        let audio = new Audio(uri);
        audio.play();
    }
    private SmoothPath(frames: number) {
        this.map.paths.reverse();
        let tempPath = [];
        let step = this.gridSize / frames;
        this.map.paths.unshift({
            x: this.map.startNode.x,
            y: this.map.startNode.y
        });
        for (let i = 1; i < this.map.paths.length; i++) {
            tempPath.push({
                x: this.map.paths[i - 1].x,
                y: this.map.paths[i - 1].y
            });
            if (this.map.paths[i - 1].x === this.map.paths[i].x) {
                let flag = 1;
                if (this.map.paths[i - 1].y > this.map.paths[i].y)
                    flag = -1;
                for (let j = 1; j < frames; j++) {
                    tempPath.push({
                        x: this.map.paths[i - 1].x,
                        y: this.map.paths[i - 1].y + flag * j * step
                    });
                }
            }
            else {
                let flag = 1;
                if (this.map.paths[i - 1].x > this.map.paths[i].x)
                    flag = -1;
                for (let j = 1; j < frames; j++) {
                    tempPath.push({
                        x: this.map.paths[i - 1].x + flag * j * step,
                        y: this.map.paths[i - 1].y
                    });
                }
            }
        }
        tempPath.push({
            x: this.map.paths[this.map.paths.length - 1].x,
            y: this.map.paths[this.map.paths.length - 1].y
        });
        return tempPath;
    }
    private moveAnimation = () => {
        this.RemoveBall(this.map.paths[this.num - 1].x, this.map.paths[this.num - 1].y);
        let x = this.map.paths[this.num].x;
        let y = this.map.paths[this.num].y;
        this.CreateBall(this.currentColor, x, y);
        this.num++;
        if (this.num >= this.map.paths.length) {
            cancelAnimationFrame(this.stopMoveAnimation);
            let node = this.map.getNode(x, y);
            node.color = this.currentColor;
            node.isRoadBlock = true;
            this.num = 0;
            this.map.paths = [];
            this.map.startNode = null;
            this.checkResult();
            this.map.resetArea();
        }
        else {
            this.stopMoveAnimation = requestAnimationFrame(this.moveAnimation);
        }
    }
    private checkResult() {
        this.getEliminatedBalls();
        if (this.eliminatedBalls.length >= 4) {
            if (this.eliminatedBalls.length + 1 == 5)
                this.score += 10;
            else {
                this.getScore(10);
                this.score += this.result;
                this.result = 0;
            }
            document.getElementById('scoreboard').innerText = this.score.toString();
            this.ClearPathBalls();
        }
        else {
            this.eliminatedBalls = [];
            this.CreateNextBall();
            this.GetNextColors();
        }
    }
    private getEliminatedBalls() {
        let node = this.map.endNode;
        let h = [];
        let v = [];
        let l = [];
        let r = [];
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if (i == 0 && j == 0)
                    continue;
                for (let k = 1; k < 9; k++) {
                    if (node.x + i * k * this.gridSize > 0 && node.x + i * k * this.gridSize < 380 && node.y + j * k * this.gridSize > 0 && node.y + j * k * this.gridSize < 380) {
                        let leftNode = this.map.cache[CommonMethod.getId(node.x + i * k * this.gridSize, node.y + j * k * this.gridSize)];
                        if (leftNode.color == node.color) {
                            if (Math.abs(i + j) == 2)
                                r.push(leftNode);
                            else if (Math.abs(i + j) == 0)
                                l.push(leftNode);
                            else if (i == 0)
                                v.push(leftNode);
                            else
                                h.push(leftNode);
                            //eliminatedBalls.push(leftNode);
                        }
                        else
                            break;
                    }
                    else
                        break;
                }
            }
        }
        if (h.length >= 4)
            this.eliminatedBalls = this.eliminatedBalls.concat(h);
        if (v.length >= 4)
            this.eliminatedBalls = this.eliminatedBalls.concat(v);
        if (l.length >= 4)
            this.eliminatedBalls = this.eliminatedBalls.concat(l);
        if (r.length >= 4)
            this.eliminatedBalls = this.eliminatedBalls.concat(r);
    }
    private getScore(startScore: number) {
        this.num++;
        this.result = startScore + 4 * this.num - 2;
        if (this.num < this.eliminatedBalls.length + 1 - 5)
            this.getScore(this.result);
        else
            this.num = 0;
    }
    private ClearPathBalls() {
        this.playSound('media/bingo.mp3');
        this.map.endNode.color = '';
        this.map.endNode.isRoadBlock = false;
        for (let i = 0; i < this.eliminatedBalls.length; i++) {
            this.eliminatedBalls[i].isRoadBlock = false;
            this.eliminatedBalls[i].color = '';
        }
        this.RemoveBall(this.map.endNode.x, this.map.endNode.y);
        this.RemoveBalls();
    }
    private RemoveBalls = () => {
        this.RemoveBall(this.eliminatedBalls[this.num1].x, this.eliminatedBalls[this.num1].y);
        this.num1++;
        if (this.num1 < this.eliminatedBalls.length)
            this.stopRemove = requestAnimationFrame(this.RemoveBalls);
        else {
            this.num1 = 0;
            this.eliminatedBalls = [];
            cancelAnimationFrame(this.stopRemove);
        }
    }
    private CreateNextBall() {
        for (let i = 0; i < 3; i++) {
            let color = this.nextColors[i];
            let x = this.GetRandomNum();
            let y = this.GetRandomNum();
            let node = this.map.getNode(x, y);
            let id = CommonMethod.getId(x, y);
            if (!node.isRoadBlock) {
                node.isRoadBlock = true;
                node.color = color;
                this.map.closeArea[id] = node;
                if (!this.CheckIsGameOver()) {
                    this.CreateBall(color, x, y);
                    this.map.setEndNode(node);
                    this.autoCheckResult();
                }
                else {
                    alert('Game Over!');
                    window.location.reload();
                    break;
                }
            }
            else
                i--;
        }
    }
    private CheckIsGameOver() {
        let count = 0;
        for (let item in this.map.closeArea) {
            count++;
        }
        if (count === this.gridColumns * this.gridRows) {
            return true;
        }
        else
            return false;
    }
    private autoCheckResult() {
        this.getEliminatedBalls();
        if (this.eliminatedBalls.length >= 4) {
            this.ClearPathBalls();
        }
        else {
            this.eliminatedBalls = [];
        }
    }
}