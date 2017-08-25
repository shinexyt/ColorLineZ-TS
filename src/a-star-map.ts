import { Node, FGH } from "./node";
interface IndexNode {
    [index: string]: Node;
}
export interface Pointer {
    x: number;
    y: number;
}
export class Map {
    private data: Node[][] = [];
    private openArea: Node[] = [];
    paths: Pointer[] = [];
    closeArea: IndexNode = {};
    cache: IndexNode = {};
    startNode: Node = null;
    endNode: Node = null;
    private costEnergy_S = 10;
    private costEnergy_L = 14;
    private gridColumns: number;
    private gridRows: number;
    private gridSize: number;
    constructor(gridColumns: number, gridSize: number) {
        this.gridColumns = gridColumns;
        this.gridRows = gridColumns;
        this.gridSize = gridSize;
        this.data = [];
        for (let y = 0; y < this.gridColumns; y++) {
            let _arr = [];
            for (let x = 0; x < this.gridColumns; x++) {
                let mapNode = new Node(this.gridSize * x + this.gridSize / 2, this.gridSize * y + this.gridSize / 2);
                this.cache[mapNode.id] = mapNode;
                _arr.push(mapNode);
            }
            this.data.push(_arr);
        }
    }
    getNode(x: number, y: number): Node {
        return this.cache[`map_${x}_${y}`];
    }
    setStartNode(node: Node) {
        this.startNode = node;
    }
    setEndNode(node: Node) {
        this.endNode = node;
    }
    private isOpenAreaExitNode(node: Node): Node {
        let openArea = this.openArea;
        for (let i = 0; i < openArea.length; i++) {
            if (openArea[i].id === node.id)
                return openArea[i];
        }
        return null;
    }
    getPath() {
        this.getAroundNode(this.startNode);
        if (this.openArea.length == 0)
            return;
        this.search(this.endNode);
        this.doPaths(this.endNode);
    }
    /**  不断删除查找周围节点，直到找寻到结束点 */
    private search(node: Node) {
        while (!this.closeArea[node.id]) {
            let _fMinNode = this.getFMin();
            if (!_fMinNode)
                break;
            this.getAroundNode(_fMinNode);
            this.search(node);
        }
    }
    private doPaths(node: Node) {
        if (this.closeArea[node.id]) {
            this.drawRoad(node);
        }
    }
    /**  绘制路线 */
    private drawRoad(node: Node) {
        this.paths.push(node);
        //delete map.closeArea[node.id];
        if (node.prev !== this.startNode)
            this.drawRoad(node.prev);
    }
    /**  从开启列表从寻找F点最小的点 从开启列表移除 移入关闭列表 */
    private getFMin() {
        if (this.openArea.length == 0)
            return null;
        this.orderOpenArea();
        this.closeArea[this.openArea[0].id] = this.openArea[0];
        return this.openArea.shift();
    }
    /**  排序开启列表 */
    private orderOpenArea() {
        this.openArea.sort(function (objF, objN) {
            return objF.fObj.F - objN.fObj.F;
        });
    }
    resetArea() {
        this.openArea = [];
        this.closeArea = {};
        for (let y = 0; y < this.gridRows; y++) {
            for (let x = 0; x < this.gridColumns; x++) {
                let id = `map_${this.gridSize * x + this.gridSize / 2}_${this.gridSize * y + this.gridSize / 2}`
                let node = this.cache[id];
                if (node.isRoadBlock === true)
                    this.closeArea[id] = node;
            }
        }
    }
    /**  获取当前父节点周围的点  */
    private getAroundNode(node: Node) {
        let maxHeight = this.gridRows;
        let maxWidth = this.gridColumns;
        let nodeX;
        let nodeY;
        let corner = [];
        for (let x = -1 * this.gridSize; x <= this.gridSize; x += this.gridSize) {
            nodeX = node.x + x;
            for (let y = -1 * this.gridSize; y <= this.gridSize; y += this.gridSize) {
                nodeY = node.y + y;
                //剔除本身以及对角线的点
                if ((x === 0 && y === 0) || x * y != 0)
                    continue;
                if (nodeX > 0 && nodeY > 0 && nodeX <= maxWidth * this.gridSize && nodeY <= maxHeight * this.gridSize) {
                    let mapNode = this.getNode(nodeX, nodeY);
                    //查找周围的新节点， 如果新节点处于拐角则跳过
                    if (Math.abs(x) == Math.abs(y) && this.isCorner(mapNode, {
                        x: x,
                        y: y
                    }))
                        continue;
                    if (!this.closeArea[mapNode.id]) {
                        let _fObj: FGH = this.getF(node, mapNode);
                        // 如果周围节点已在开启区域的 根据当前节点 获取新的G值  与当前点的进行比较 如果小于以前的G值 则指定当前节点为其父节点
                        let tmpNode = this.isOpenAreaExitNode(mapNode);
                        if (tmpNode) {
                            if (tmpNode.fObj.G <= _fObj.G)
                                continue;
                        }
                        mapNode.fObj = _fObj;
                        mapNode.prev = node;
                        this.openArea.push(mapNode);
                    }
                }
            }
        }
    }
    /**  获取当前点的F G H值 */
    private getF(cNode: Node, aNode: Node) {
        let energyW = Math.abs(this.endNode.x - aNode.x) * this.costEnergy_S;
        let energyH = Math.abs(this.endNode.y - aNode.y) * this.costEnergy_S;
        let _H = energyW + energyH;
        let _G = (Math.abs(aNode.x - cNode.x) === Math.abs(aNode.y - cNode.y) ? this.costEnergy_L : this.costEnergy_S);
        if (cNode.fObj)
            _G = cNode.fObj.G + _G;
        return {
            F: _H + _G,
            H: _H,
            G: _G
        };
    }
    /**  监测节点是否为拐角， 如果是 从开启列表中移除穿越拐角到达的点 */
    private isCorner(node: Node, obj: Pointer) {
        let closeArea = this.closeArea;
        let x = obj.x;
        let y = obj.y;
        let getNode = this.getNode;
        if (Math.abs(x) === Math.abs(y)) {
            if (x > 0 && y < 0) {
                return closeArea[getNode(node.x, node.y + 1).id] || closeArea[getNode(node.x - 1, node.y).id];
            }
            if (x < 0 && y > 0) {
                return closeArea[getNode(node.x, node.y - 1).id] || closeArea[getNode(node.x + 1, node.y).id];
            }
            if (x === y && x > 0) {
                return closeArea[getNode(node.x, node.y - 1).id] || closeArea[getNode(node.x - 1, node.y).id];
            }
            if (x === y && x < 0) {
                return closeArea[getNode(node.x, node.y + 1).id] || closeArea[getNode(node.x + 1, node.y).id];
            }
        }
    }
}
