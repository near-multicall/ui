export default class Grid {

    private grid: Task[];
    
    tileAmt: number;
    ColumnAmt: number;


    constructor() {

        window["GRID"] = this;

    }

    declareTask(item: any, dom: HTMLElement): number {

        this.grid[this.tileAmt] = new Task(item, dom);
        return this.tileAmt++;

    }

}

class Task {

    item: any;
    dom: HTMLElement;

    constructor(item: any, dom: HTMLElement) {

        this.item = item;
        this.dom = dom;

    }

}