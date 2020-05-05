var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var Board = /** @class */ (function () {
    function Board(element, width, height) {
        this.element = element;
        this.element.style.width = width + 'px';
        this.element.style.height = height + 'px';
        this.width = width;
        this.height = height;
    }
    Board.prototype.top = function () {
        return this.element.getBoundingClientRect().top;
    };
    Board.prototype.left = function () {
        return this.element.getBoundingClientRect().left;
    };
    Board.prototype.getUpperBoundX = function () {
        return this.width - 14;
    };
    Board.prototype.getUpperBoundY = function () {
        return this.height - 14;
    };
    Board.prototype.getLowerBoundX = function () {
        return 1;
    };
    Board.prototype.getLowerBoundY = function () {
        return 1;
    };
    Board.prototype.getAbsoluteX = function (x) {
        return this.left() + x;
    };
    Board.prototype.getAbsoluteY = function (y) {
        return this.top() + y;
    };
    return Board;
}());
var Snake = /** @class */ (function () {
    function Snake(snakeDiv, body) {
        this.snakeDiv = snakeDiv;
        this.body = body;
        this.positions = [];
        this.head = 0;
        this.tail = 0;
    }
    Snake.prototype.getHead = function () {
        return this.head;
    };
    Snake.prototype.getTail = function () {
        return this.tail;
    };
    Snake.prototype.getLength = function () {
        return this.positions.length;
    };
    Snake.prototype.setHead = function (head) {
        this.head = head;
    };
    Snake.prototype.setTail = function (tail) {
        this.tail = tail;
    };
    Snake.prototype.getHeadPosition = function () {
        return this.positions[this.head];
    };
    Snake.prototype.insert = function (position) {
        this.positions.push(__assign({}, position));
        this.head = this.positions.length - 1;
    };
    Snake.prototype.updatePostion = function (index, newPos) {
        this.positions[index] = __assign({}, newPos);
    };
    Snake.headSvg = "<circle id=\"e1_circle\" cx=\"-796.8920288085938\" cy=\"-54.365928649902344\" \n    style=\"stroke: black; stroke-width: 1px;fill:#42FFA0;\" r=\"53.45\" \n    transform=\"matrix(0.152876 0 0 0.152876 130.076 16.5613)\"/>\n    <ellipse id=\"e3_ellipse\" cx=\"-379.77764892578125\" cy=\"-185.92002868652344\" \n    style=\"fill:black;stroke:black;stroke-width:1px;\" \n    rx=\"10.64050006866455\" ry=\"17.4242000579834\" \n    transform=\"matrix(0.261762 -0.0366327 0.0366327 0.261762 110.186 43.4596)\"/>\n    <ellipse id=\"e1_ellipse\" cx=\"-481.87652587890625\" cy=\"-208.04823303222656\" \n    style=\"fill:black;stroke:black;stroke-width:1px;\" \n    rx=\"10.6405\" ry=\"17.4242\" \n    transform=\"matrix(0.271235 -0.0064775 0.00659337 0.266469 143.923 60.7091)\"/>";
    Snake.bodySvg = '<rect width="16" height="16" style="fill:rgb(0,255, 0);" />';
    return Snake;
}());
var Status;
(function (Status) {
    Status[Status["PAUSED"] = 0] = "PAUSED";
    Status[Status["RUNNING"] = 1] = "RUNNING";
    Status[Status["GAMEOVER"] = 2] = "GAMEOVER";
})(Status || (Status = {}));
var UserAction;
(function (UserAction) {
    UserAction[UserAction["LEFT"] = 0] = "LEFT";
    UserAction[UserAction["RIGHT"] = 1] = "RIGHT";
    UserAction[UserAction["UP"] = 2] = "UP";
    UserAction[UserAction["DOWN"] = 3] = "DOWN";
    UserAction[UserAction["TOGGLE_PAUSE"] = 4] = "TOGGLE_PAUSE";
})(UserAction || (UserAction = {}));
var rotation = {
    top: {
        "1": 0,
        "-1": 180,
    },
    left: {
        "1": -90,
        "-1": 90
    }
};
var Game = /** @class */ (function () {
    function Game() {
        this.status = Status.PAUSED;
        this.snake = null;
        this.board = null;
        this.swipeStart = {
            X: null,
            Y: null
        };
        this.handleKeyPress = function (event) {
            var action = -1;
            action = keyMap['' + event.keyCode];
            if (action >= 0)
                this.updateMovement(action);
        };
        this.score = 0;
        this.status = Status.RUNNING;
        this.board = new Board(document.getElementById('board'), 512, 512);
        this.snake = new Snake(document.getElementById('player'), document.getElementsByClassName('snake'));
        this.refreshRate = 120;
        this.movement = {
            axis: 'left',
            direction: 1,
            stride: 16
        };
        this.food = {
            element: document.getElementById('food'),
            coord: null,
            colorCycle: 0,
            foodSvg: "<circle cx=\"8\" cy=\"8\" r=\"8\" style=\"fill:#e87672\"/>",
            blinkInterval: null
        };
        this.food.element.style.position = 'absolute';
        this.hadFood = false;
        this.init();
    }
    Game.prototype.init = function () {
        var svgElements = this.snake.body;
        for (var i = 0; i < svgElements.length; i++) {
            svgElements[i].style.position = 'absolute';
            var position = {
                top: this.board.height / 2,
                left: this.board.width / 2 + (i * this.movement.stride) - 25
            };
            svgElements[i].style.top = this.board.getAbsoluteY(position.top) + 'px';
            svgElements[i].style.left = this.board.getAbsoluteX(position.left) + 'px';
            this.snake.insert(position);
        }
        this.spawnFood();
        this.blinkFood();
        this.moveSnake();
    };
    Game.prototype.blinkFood = function () {
        this.food.blinkInterval = setInterval(function () {
            // blink the food svg
            var foodCircle = this.food.element.firstChild;
            foodCircle.style.fill = Game.colors[this.food.colorCycle];
            this.food.colorCycle = (this.food.colorCycle + 1) % Game.colors.length;
        }.bind(this), 500);
    };
    Game.prototype.moveSnake = function () {
        this.interval = setInterval(this.frameUpdate.bind(this), this.refreshRate);
    };
    Game.prototype.frameUpdate = function () {
        var nextPos = __assign({}, this.snake.getHeadPosition());
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
        var positionsCopy = __spreadArrays(this.snake.positions);
        positionsCopy.splice(this.snake.getTail(), 1);
        if (willCollide(positionsCopy, nextPos, this.movement.stride)) {
            this.handleGameEnd();
        }
        // check if the snake will eat food in next position
        if (willCollide([nextPos], this.food.coord, 16)) {
            this.hadFood = true;
            this.handleScoreIncrease();
        }
        var secondBodyPart = this.snake.getHead();
        if (this.hadFood && this.snake.getTail() == 0) {
            this.hadFood = false;
            this.createNewBodyPart(nextPos);
            this.snake.insert(nextPos);
        }
        else {
            var tail = this.snake.getTail();
            this.snake.body[tail].style.left = this.board.getAbsoluteX(nextPos.left) + 'px';
            this.snake.body[tail].style.top = this.board.getAbsoluteY(nextPos.top) + 'px';
            this.snake.updatePostion(tail, nextPos);
            this.snake.setHead(tail);
            this.snake.setTail((tail + 1) % this.snake.getLength());
        }
        this.snake.body[this.snake.getHead()].innerHTML = Snake.headSvg;
        this.snake.body[this.snake.getHead()].setAttribute('transform', "rotate(" + rotation[this.movement.axis]['' + this.movement.direction] + ")");
        this.snake.body[secondBodyPart].innerHTML = Snake.bodySvg;
    };
    Game.prototype.handleScoreIncrease = function () {
        this.score++;
        document.getElementById('score').textContent = '' + this.score;
        this.spawnFood();
        this.pause();
        if (this.score % 5 == 0) {
            this.refreshRate = this.refreshRate * 0.96;
        }
        this.resume();
    };
    Game.prototype.handleGameEnd = function () {
        this.pause();
        this.status = Status.GAMEOVER;
        var gameOverDiv = document.getElementById('gameover');
        gameOverDiv.style.display = 'block';
        gameOverDiv.style.left = this.board.getAbsoluteX(this.board.width / 3.5) + 'px';
        gameOverDiv.style.top = this.board.getAbsoluteY(this.board.height / 2.8) + 'px';
    };
    Game.prototype.spawnFood = function () {
        var foodPos = getRandomCoord(this.board);
        while (willCollide(this.snake.positions, foodPos, 16))
            foodPos = getRandomCoord(this.board);
        this.food.element.style.top = this.board.getAbsoluteY(foodPos.top) + 'px';
        this.food.element.style.left = this.board.getAbsoluteX(foodPos.left) + 'px';
        this.food.element.innerHTML = this.food.foodSvg;
        this.food.colorCycle = 0;
        this.food.coord = __assign({}, foodPos);
    };
    Game.prototype.createNewBodyPart = function (nextPos) {
        var newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        newSvg.setAttribute('width', '16');
        newSvg.setAttribute('height', '16');
        newSvg.setAttribute('class', 'snake');
        newSvg.setAttribute('transform', "rotate(" + rotation[this.movement.axis]['' + this.movement.direction] + ")");
        newSvg.style.position = 'absolute';
        newSvg.style.top = this.board.getAbsoluteY(nextPos.top) + 'px';
        newSvg.style.left = this.board.getAbsoluteX(nextPos.left) + 'px';
        newSvg.innerHTML = Snake.headSvg;
        this.snake.snakeDiv.appendChild(newSvg);
    };
    Game.prototype.updateMovement = function (action) {
        if (this.status == Status.GAMEOVER)
            return;
        if (this.status == Status.PAUSED && action != UserAction.TOGGLE_PAUSE)
            return;
        switch (action) {
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
                }
                else {
                    this.resume();
                }
                break;
        }
    };
    Game.prototype.handleTouchStart = function (event) {
        this.swipeStart.X = event.touches[0].clientX;
        this.swipeStart.Y = event.touches[0].clientY;
    };
    Game.prototype.handleTouchMove = function (event) {
        if (!this.swipeStart.X || !this.swipeStart.Y)
            return;
        var diffX = event.touches[0].clientX - this.swipeStart.X;
        var diffY = event.touches[0].clientY - this.swipeStart.Y;
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // horizontal movement
            if (diffX < 0)
                this.updateMovement(UserAction.LEFT);
            else
                this.updateMovement(UserAction.RIGHT);
        }
        else {
            // vertical movement
            if (diffY < 0)
                this.updateMovement(UserAction.UP);
            else
                this.updateMovement(UserAction.DOWN);
        }
        this.swipeStart.X = null;
        this.swipeStart.Y = null;
    };
    Game.prototype.pause = function () {
        if (this.status == Status.GAMEOVER)
            return;
        if (this.interval)
            clearInterval(this.interval);
        if (this.food.blinkInterval)
            clearInterval(this.food.blinkInterval);
        this.interval = null;
        this.food.blinkInterval = null;
        this.status = Status.PAUSED;
    };
    Game.prototype.resume = function () {
        if (this.status == Status.GAMEOVER)
            return;
        this.blinkFood();
        this.moveSnake();
        this.status = Status.RUNNING;
    };
    Game.prototype.repositionOnResize = function (event) {
        this.pause();
        for (var i = 0; i < this.snake.positions.length; i++) {
            this.snake.body[i].style.top = this.board.getAbsoluteY(this.snake.positions[i].top) + 'px';
            this.snake.body[i].style.left = this.board.getAbsoluteX(this.snake.positions[i].left) + 'px';
        }
        this.food.element.style.top = this.board.getAbsoluteY(this.food.coord.top) + 'px';
        this.food.element.style.left = this.board.getAbsoluteX(this.food.coord.left) + 'px';
        this.resume();
    };
    Game.colors = ['#fc3503', '#fcdb03', '#03fcbe'];
    return Game;
}());
var keyMap = {
    '37': UserAction.LEFT,
    '65': UserAction.LEFT,
    '38': UserAction.UP,
    '87': UserAction.UP,
    '39': UserAction.RIGHT,
    '68': UserAction.RIGHT,
    '40': UserAction.DOWN,
    '83': UserAction.DOWN,
    '32': UserAction.TOGGLE_PAUSE
};
var getDistance = function (a, b) {
    return Math.sqrt(Math.pow((a.top - b.top), 2) + Math.pow((a.left - b.left), 2));
};
var willCollide = function (positions, coord, range) {
    for (var _i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
        var position = positions_1[_i];
        if (Math.ceil(getDistance(position, coord)) < range)
            return true;
    }
    return false;
};
var getRandomCoord = function (board) {
    var randPos = {
        top: Math.random() * (board.height - 8),
        left: Math.random() * (board.width - 8)
    };
    while (randPos.top <= board.getLowerBoundY() || randPos.top >= board.getUpperBoundY()) {
        randPos.top = Math.random() * (board.height - 2);
    }
    while (randPos.left <= board.getLowerBoundX() || randPos.left >= board.getUpperBoundX()) {
        randPos.left = Math.random() * (board.width - 2);
    }
    return randPos;
};
var reset = function (event) {
    location.reload();
};
window.onload = function () {
    var game = new Game();
    addEventListener('keydown', game.handleKeyPress.bind(game));
    addEventListener('touchstart', game.handleTouchStart.bind(game));
    addEventListener('touchmove', game.handleTouchMove.bind(game));
    addEventListener('resize', game.repositionOnResize.bind(game));
};
//# sourceMappingURL=index.js.map