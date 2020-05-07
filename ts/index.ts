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
        return this.width - 16;
    }

    getUpperBoundY(): number {
        return this.height - 16;
    }

    getLowerBoundX(): number {  
        return 0;
    }

    getLowerBoundY(): number {
        return 0;
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
    GAMEOVER,
 }

 enum UserAction {
    LEFT,
    RIGHT,
    UP,
    DOWN,
    TOGGLE_PAUSE
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
    private swipeStart: {[key: string]: number} = {
        X: null,
        Y: null
    };

    constructor() {
        this.score = 0;
        this.status = Status.RUNNING;
        this.board = new Board(document.getElementById('board'), 512, 512);
        this.snake = new Snake(document.getElementById('player'),
            <HTMLCollectionOf<HTMLElement>>document.getElementsByClassName('snake'));
        this.refreshRate = 120;
        this.movement = {
            axis: 'left',
            direction: 1,
            stride: 16
        }
        this.food = {
            element: document.getElementById('food'),
            coord: null,
            colorCycle: 0,
            foodSvg:  `<circle cx="8" cy="8" r="8" style="fill:#e87672"/>`,
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
                left: this.board.width/2 + (i * this.movement.stride) - (svgElements.length * 16)
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
            nextPos.left = this.board.getUpperBoundX();
        } 
        else if (nextPos.left > this.board.getUpperBoundX()) {
            nextPos.left = this.board.getLowerBoundX();
        }
        if (nextPos.top < this.board.getLowerBoundY()) {
            nextPos.top = this.board.getUpperBoundY();
        }
        else if (nextPos.top > this.board.getUpperBoundY()) {
            nextPos.top = this.board.getLowerBoundY();
        }
        // check if the snake will bite itself
        let positionsCopy: Array<GPosition> = [...this.snake.positions];
        positionsCopy.splice(this.snake.getTail(), 1);
        if (willCollide(positionsCopy, nextPos, this.movement.stride)) {
            this.handleGameEnd();
        }
        // check if the snake will eat food in next position
        if (willCollide([nextPos], this.food.coord, 16)) {
            this.hadFood = true;
            this.handleScoreIncrease();
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

    private handleScoreIncrease(): void {
        this.score++;
        document.getElementById('score').textContent = '' + this.score;
        this.spawnFood();
        this.pause();
        if (this.score%5 == 0) {
            this.refreshRate = this.refreshRate * 0.95;
        }
        this.resume();
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
        while (willCollide(this.snake.positions, foodPos, 17)) foodPos = getRandomCoord(this.board);
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

    updateMovement(action: UserAction): void {
        if (this.status == Status.GAMEOVER)
            return;
        if (this.status == Status.PAUSED && action != UserAction.TOGGLE_PAUSE)
            return;
        switch(action) {
            case UserAction.LEFT: // left
                if (this.movement.axis == 'left')
                    break;
                else {
                    this.movement.axis = 'left';
                    this.movement.direction = -1;
                    break;
                }
            case UserAction.UP: // up
                if (this.movement.axis == 'top')
                    break;
                else {
                    this.movement.axis = 'top';
                    this.movement.direction = -1;
                    break;
                }
            case UserAction.RIGHT: // right
                if (this.movement.axis == 'left')
                    break;
                else {
                    this.movement.axis = 'left';
                    this.movement.direction = 1;
                    break;
                }
            case UserAction.DOWN: // down
                if (this.movement.axis == 'top')
                    break;
                else {
                    this.movement.axis = 'top';
                    this.movement.direction = 1;
                    break;
                }
            case UserAction.TOGGLE_PAUSE: // space
                if (this.status == Status.RUNNING) {
                    this.pause();
                } else {
                    this.resume();
                }
                break;
        }
    }

    handleKeyPress = function(event: KeyboardEvent) {
        let action: UserAction = -1;
        action = keyMap['' + event.keyCode];
        if (action >= 0)
            this.updateMovement(action);
    }

    handleTouchStart(event: TouchEvent): void {
        this.swipeStart.X = event.touches[0].clientX;
        this.swipeStart.Y = event.touches[0].clientY;
    }

    handleTouchMove(event: TouchEvent): void {
        if (!this.swipeStart.X || !this.swipeStart.Y)
            return;

        let diffX: number = event.touches[0].clientX - this.swipeStart.X;
        let diffY: number = event.touches[0].clientY - this.swipeStart.Y;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // horizontal movement
            if (diffX < 0) this.updateMovement(UserAction.LEFT);
            else this.updateMovement(UserAction.RIGHT);
        }
        else {
            // vertical movement
            if (diffY < 0) this.updateMovement(UserAction.UP);
            else this.updateMovement(UserAction.DOWN);
        }

        this.swipeStart.X = null;
        this.swipeStart.Y = null;
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
        let paused = false;
        if (this.status != Status.PAUSED) {
            paused = true;
            this.pause();
        }
        for (let i: number = 0; i < this.snake.positions.length; i++) {
            this.snake.body[i].style.top = this.board.getAbsoluteY(this.snake.positions[i].top) + 'px';
            this.snake.body[i].style.left = this.board.getAbsoluteX(this.snake.positions[i].left) + 'px';
        }
        this.food.element.style.top = this.board.getAbsoluteY(this.food.coord.top) + 'px';
        this.food.element.style.left = this.board.getAbsoluteX(this.food.coord.left) + 'px';
        if (paused) this.resume();
    }
 }

const keyMap: {[key: string]: UserAction} = {
    '37': UserAction.LEFT,  
    '65': UserAction.LEFT, // a
    '38': UserAction.UP,
    '87': UserAction.UP, // w
    '39': UserAction.RIGHT,
    '68': UserAction.RIGHT, // d
    '40': UserAction.DOWN,
    '83': UserAction.DOWN, // s
    '32': UserAction.TOGGLE_PAUSE
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
    let grid = {
        nX: board.width / 16,
        nY: board.height / 16
    }
    let randPos: GPosition = {
        top: Math.ceil(Math.random() * (grid.nX-1)),
        left: Math.ceil(Math.random() * (grid.nY-1))
    }
    while (randPos.top <= 1 || randPos.top >= grid.nX) {
        randPos.top = Math.ceil(Math.random() * (grid.nX-1));
    }
    while (randPos.left <= 1 || randPos.left >= grid.nY) {
        randPos.left = Math.ceil(Math.random() * (grid.nY-1))
    }
    randPos.top = randPos.top * 16;
    randPos.left = randPos.left * 16;
    return randPos;
 }

const reset = function(event: MouseEvent): void {
    location.reload();
}

window.onload = function() {
    let game: Game = new Game();
    addEventListener('keydown', game.handleKeyPress.bind(game));
    addEventListener('touchstart', game.handleTouchStart.bind(game));
    addEventListener('touchmove', game.handleTouchMove.bind(game));
    addEventListener('resize', game.repositionOnResize.bind(game));
}