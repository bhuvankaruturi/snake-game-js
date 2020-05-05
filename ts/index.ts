class Board {
    element: HTMLElement;
    width: number;
    height: number;
    constructor(element: HTMLElement, width: number, height: number) {
        this.element = element;
        this.element.style.width = width + 'px';
        this.element.style.height = height + 'px';
        this.width = width;
        this.height = height;
    }

    top() : number {
        return this.element.getBoundingClientRect().top;
    }

    left() : number {
        return this.element.getBoundingClientRect().left;
    }

    getUpperBoundX(): number {
        return this.width - 14;
    }

    getUpperBoundY(): number {
        return this.height - 14;
    }

    getLowerBoundX(): number {  
        return 1;
    }

    getLowerBoundY(): number {
        return 1;
    }

    getAbsoluteX(x: number): number {
        return this.left() + x;
    }

    getAbsoluteY(y: number): number {
        return this.top() + y;
    }
}

interface GPosition {
    top: number,
    left: number
}

class Snake {
    snakeDiv: HTMLElement;
    body: HTMLCollectionOf<HTMLElement>;
    positions: Array<GPosition>;
    private head: number;
    private tail: number;
    static headSvg: string = `<circle id="e1_circle" cx="-796.8920288085938" cy="-54.365928649902344" 
    style="stroke: black; stroke-width: 1px;fill:#42FFA0;" r="53.45" 
    transform="matrix(0.152876 0 0 0.152876 130.076 16.5613)"/>
    <ellipse id="e3_ellipse" cx="-379.77764892578125" cy="-185.92002868652344" 
    style="fill:black;stroke:black;stroke-width:1px;" 
    rx="10.64050006866455" ry="17.4242000579834" 
    transform="matrix(0.261762 -0.0366327 0.0366327 0.261762 110.186 43.4596)"/>
    <ellipse id="e1_ellipse" cx="-481.87652587890625" cy="-208.04823303222656" 
    style="fill:black;stroke:black;stroke-width:1px;" 
    rx="10.6405" ry="17.4242" 
    transform="matrix(0.271235 -0.0064775 0.00659337 0.266469 143.923 60.7091)"/>`;
    static bodySvg: string = '<rect width="16" height="16" style="fill:rgb(0,255, 0);" />';

    constructor(snakeDiv: HTMLElement, body: HTMLCollectionOf<HTMLElement>) {
        this.snakeDiv = snakeDiv;
        this.body = body;
        this.positions = [];
        this.head = 0;
        this.tail = 0;
    }

    getHead(): number {
        return this.head;
    }

    getTail(): number {
        return this.tail;
    }

    getLength(): number {
        return this.positions.length;
    }

    setHead(head: number): void {
        this.head = head;
    }

    setTail(tail: number): void {
        this.tail = tail;
    }

    getHeadPosition(): GPosition {
        return this.positions[this.head];
    }

    insert(position: GPosition): void {
        this.positions.push({...position});
        this.head = this.positions.length - 1;
    }

    updatePostion(index: number, newPos: GPosition): void {
        this.positions[index] = {...newPos};
    }

 } 

 enum Status {
    PAUSED,
    RUNNING,
    GAMEOVER
 }

 type Axis = "top" | "left";

 interface GMovement {
    axis: Axis,
    direction: 1 | -1,
    stride: number
 }

 interface Food {
     element: HTMLElement,
     coord: GPosition,
     colorCycle: number,
     foodSvg: string,
     blinkInterval: number
 }

 const rotation = {
    top: {
        "1": 0,
        "-1": 180,
    },
    left: {
        "1": -90,
        "-1": 90
    }
 }

 class Game {
    private score: number;
    private status: Status = Status.PAUSED;
    private interval: number;
    private snake: Snake = null;
    private board: Board = null;
    private refreshRate: number;
    private movement: GMovement;
    private food: Food;
    private hadFood: boolean;
    private static colors: Array<string> = ['#fc3503', '#fcdb03', '#03fcbe'];

    constructor() {
        this.score = 0;
        this.status = Status.RUNNING;
        this.board = new Board(document.getElementById('board'), 500, 500);
        this.snake = new Snake(document.getElementById('player'),
            <HTMLCollectionOf<HTMLElement>>document.getElementsByClassName('snake'));
        this.refreshRate = 90;
        this.movement = {
            axis: 'left',
            direction: 1,
            stride: 15
        }
        this.food = {
            element: document.getElementById('food'),
            coord: null,
            colorCycle: 0,
            foodSvg:  `<circle cx="10" cy="10" r="9" style="fill:#e87672"/>`,
            blinkInterval: null
        }
        this.food.element.style.position = 'absolute';
        this.hadFood = false;
        this.init();
    }

    private init(): void {
        let svgElements: HTMLCollectionOf<HTMLElement> = this.snake.body;
        for (let i: number = 0; i < svgElements.length; i++) {
            svgElements[i].style.position = 'absolute';
            let position: GPosition = {
                top: this.board.height/2,
                left: this.board.width/2 + (i * this.movement.stride) - 25
            } 
            svgElements[i].style.top = this.board.getAbsoluteY(position.top) + 'px';
            svgElements[i].style.left = this.board.getAbsoluteX(position.left) + 'px';
            this.snake.insert(position);
        }
        this.spawnFood();
        this.blinkFood();
        this.moveSnake();
    }

    private blinkFood(): void {
        this.food.blinkInterval = setInterval(
            function() {
                // blink the food svg
                let foodCircle: HTMLElement = <HTMLElement> this.food.element.firstChild;
                foodCircle.style.fill = Game.colors[this.food.colorCycle];
                this.food.colorCycle = (this.food.colorCycle+1) % Game.colors.length;
            }.bind(this), 
            500
        )
    }
    
    private moveSnake(): void {
        this.interval = setInterval(
            this.frameUpdate.bind(this),
            this.refreshRate
        )
    }

    private frameUpdate(): void {
        let nextPos: GPosition = {...this.snake.getHeadPosition()};
        nextPos[this.movement.axis] = nextPos[this.movement.axis] + this.movement.direction * this.movement.stride;
        if (nextPos.left < this.board.getLowerBoundX()) {
            nextPos.left = this.board.getUpperBoundX() - 0.5;
        } 
        else if (nextPos.left > this.board.getUpperBoundX()) {
            nextPos.left = this.board.getLowerBoundX() + 0.5;
        }
        if (nextPos.top < this.board.getLowerBoundY()) {
            nextPos.top = this.board.getUpperBoundY() - 0.5;
        }
        else if (nextPos.top > this.board.getUpperBoundY()) {
            nextPos.top = this.board.getLowerBoundY() + 0.5;
        }
        // check if the snake will bite itself
        let positionsCopy: Array<GPosition> = [...this.snake.positions];
        positionsCopy.splice(this.snake.getTail(), 1);
        if (willCollide(positionsCopy, nextPos, this.movement.stride)) {
            this.handleGameEnd();
        }
        // check if the snake will eat food in next position
        if (willCollide([nextPos], this.food.coord, 17)) {
            this.hadFood = true;
            this.score++;
            document.getElementById('score').textContent = '' + this.score;
            this.spawnFood();
        }
        let secondBodyPart: number = this.snake.getHead();
        if (this.hadFood && this.snake.getTail() == 0) {
            this.hadFood = false;
            this.createNewBodyPart(nextPos);
            this.snake.insert(nextPos);
        } else {
            let tail: number = this.snake.getTail();
            this.snake.body[tail].style.left = this.board.getAbsoluteX(nextPos.left) + 'px';
            this.snake.body[tail].style.top = this.board.getAbsoluteY(nextPos.top) + 'px';
            this.snake.updatePostion(tail, nextPos);
            this.snake.setHead(tail);
            this.snake.setTail((tail+1) % this.snake.getLength()); 
        }
        this.snake.body[this.snake.getHead()].innerHTML = Snake.headSvg;
        this.snake.body[this.snake.getHead()].setAttribute('transform', 
            `rotate(${rotation[this.movement.axis]['' + this.movement.direction]})`);
        this.snake.body[secondBodyPart].innerHTML = Snake.bodySvg;
    }

    private handleGameEnd(): void {
        this.pause();
        this.status = Status.GAMEOVER;
        let gameOverDiv: HTMLElement = document.getElementById('gameover');
        gameOverDiv.style.display = 'block';
        gameOverDiv.style.left = this.board.getAbsoluteX(this.board.width/3.5) + 'px';
        gameOverDiv.style.top = this.board.getAbsoluteY(this.board.height/2.8) + 'px';
    }

    private spawnFood(): void {
        let foodPos = getRandomCoord(this.board);
        while (willCollide(this.snake.positions, foodPos, 14)) foodPos = getRandomCoord(this.board);
        this.food.element.style.top = this.board.getAbsoluteY(foodPos.top) + 'px';
        this.food.element.style.left = this.board.getAbsoluteX(foodPos.left) + 'px';
        this.food.element.innerHTML = this.food.foodSvg;
        this.food.colorCycle = 0;
        this.food.coord = {...foodPos};
    }

    private createNewBodyPart(nextPos: GPosition): void {
        let newSvg: SVGSVGElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        newSvg.setAttribute('width', '16');
        newSvg.setAttribute('height', '16');
        newSvg.setAttribute('class', 'snake');
        newSvg.setAttribute('transform', `rotate(${rotation[this.movement.axis]['' + this.movement.direction]})`);
        newSvg.style.position = 'absolute';
        newSvg.style.top = this.board.getAbsoluteY(nextPos.top) + 'px';
        newSvg.style.left = this.board.getAbsoluteX(nextPos.left) + 'px';
        newSvg.innerHTML = Snake.headSvg;
        this.snake.snakeDiv.appendChild(newSvg);
    }

    updateMovement(event: KeyboardEvent): void {
        if (this.status == Status.GAMEOVER)
            return;
        if (this.status == Status.PAUSED && event.keyCode != 32)
            return;
        switch(event.keyCode) {
            case 37: // left
                if (this.movement.axis == 'left')
                    break;
                else {
                    this.movement.axis = 'left';
                    this.movement.direction = -1;
                    break;
                }
            case 38: // up
                if (this.movement.axis == 'top')
                    break;
                else {
                    this.movement.axis = 'top';
                    this.movement.direction = -1;
                    break;
                }
            case 39: // right
                if (this.movement.axis == 'left')
                    break;
                else {
                    this.movement.axis = 'left';
                    this.movement.direction = 1;
                    break;
                }
            case 40: // down
                if (this.movement.axis == 'top')
                    break;
                else {
                    this.movement.axis = 'top';
                    this.movement.direction = 1;
                    break;
                }
            case 32: // space
                if (this.status == Status.RUNNING) {
                    this.pause();
                } else {
                    this.resume();
                }
        }
    }

    private pause(): void {
        if (this.status == Status.GAMEOVER)
            return;
        if (this.interval) clearInterval(this.interval);
        if (this.food.blinkInterval) clearInterval(this.food.blinkInterval);
        this.interval = null;
        this.food.blinkInterval = null;
        this.status = Status.PAUSED;
    }

    private resume(): void {
        if (this.status == Status.GAMEOVER)
            return;
        this.blinkFood();
        this.moveSnake();
        this.status = Status.RUNNING;
    }

    repositionOnResize(event: UIEvent): void {
        this.pause();
        for (let i: number = 0; i < this.snake.positions.length; i++) {
            this.snake.body[i].style.top = this.board.getAbsoluteY(this.snake.positions[i].top) + 'px';
            this.snake.body[i].style.left = this.board.getAbsoluteX(this.snake.positions[i].left) + 'px';
        }
        this.food.element.style.top = this.board.getAbsoluteY(this.food.coord.top) + 'px';
        this.food.element.style.left = this.board.getAbsoluteX(this.food.coord.left) + 'px';
        this.resume();
    }
 }

 const getDistance = function(a: GPosition, b: GPosition) : number {
     return Math.sqrt(Math.pow((a.top - b.top), 2) + Math.pow((a.left - b.left), 2));
 }

 const willCollide = function(positions: Array<GPosition>, coord: GPosition, range: number): boolean {
    for (let position of positions) {
        if (Math.ceil(getDistance(position, coord)) < range) return true;
    }
    return false;
 }

 const getRandomCoord = function(board: Board): GPosition {
    let randPos: GPosition = {
        top: Math.random() * (board.height - 8),
        left: Math.random() * (board.width - 8)
    }
    while (randPos.top <= board.getLowerBoundY() || randPos.top >= board.getUpperBoundY()) {
        randPos.top = Math.random() * (board.height - 2);
    }
    while (randPos.left <= board.getLowerBoundX() || randPos.left >= board.getUpperBoundX()) {
        randPos.left = Math.random() * (board.width - 2)
    }
    return randPos;
 }

 const reset = function(event: MouseEvent): void {
     location.reload();
 }

window.onload = function() {
    let game: Game = new Game();
    addEventListener('keydown', game.updateMovement.bind(game));
    addEventListener('resize', game.repositionOnResize.bind(game));
}