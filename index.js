let board = {
    boardElement: null,
    width: 500,
    height: 500,
    top: function() {
        return this.boardElement != null ? this.boardElement.getBoundingClientRect().top : 0;
    },
    left: function() {
        return this.boardElement != null ? this.boardElement.getBoundingClientRect().left : 0;
    },
    getUpperBoundX: function() {
        return this.width + this.left() - 2;
    },
    getLowerBoundX: function() {
        return this.left() + 2;
    },
    getUpperBoundY: function() {
        return this.height + this.top() - 2;
    },
    getLowerBoundY: function() {
        return this.top() + 2;
    }
}

let player = {
    x: board.width/2 - 25,
    y: board.height/2 - 25,
    positions: []
}

var snakeBody = null;

let tail = 0;
let head = 0;

var foodCoord = null;
var hadFood = false;

var score = 0;

let movement = {
    axis: 'left',
    direction: 1,
    stride: 10,
    speed: 1
}

const colors = ['rgb(0,255, 0)', 'rgb(119, 0, 255)', 'rgb(0, 174, 255)', 'rgb(255, 145, 0)'];

const RUNNING = 'RUNNING';
const PAUSED = 'PAUSED';


var interval = null;
var status = PAUSED;

var reset = function(e) {
    location.reload();
}

var game = function() {
    tail = 0;
    head = snakeBody.length-1;
    movePlayer();
    spawnFood();
    status = RUNNING;
    document.addEventListener('keydown', updateMovement);
}

var movePlayer = function() {
    let l = snakeBody.length;
    interval = this.setInterval(function() {
        let nextPosition = {};
        nextPosition.left = Number(snakeBody[head].style.left.replace('px', ''));
        nextPosition.top = Number(snakeBody[head].style.top.replace('px', ''));
        nextPosition[movement.axis] += movement.direction * movement.stride;
        if (movement.axis == 'left' && nextPosition.left >= board.getUpperBoundX()) nextPosition.left = board.getLowerBoundX();
        else if (movement.axis == 'left' && nextPosition.left <= board.getLowerBoundX()) nextPosition.left = board.getUpperBoundX();
        if (movement.axis == 'top' && nextPosition.top >= board.getUpperBoundY()) nextPosition.top = board.getLowerBoundY();
        else if (movement.axis == 'top' && nextPosition.top <= board.getLowerBoundY()) nextPosition.top = board.getUpperBoundY();
        let hasEaten = checkAndUpdateScore(nextPosition);
        let secondCell = 0;
        if (hasEaten) {
            hadFood = true;
        } 
        if (hadFood && tail == 0) {
            hadFood = false;
            let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute('width', 10);
            svg.setAttribute('height', 10);
            svg.setAttribute('class', 'snake');
            svg.style.position = 'absolute';
            svg.style.top = nextPosition.top + 'px';
            svg.style.left = nextPosition.left + 'px';
            svg.innerHTML = '<rect width="8" height="8" style="fill:rgb(0,255, 0);" />';
            document.getElementById('player').appendChild(svg);
            secondCell = head;
            head = l;
            l++;
        } else {
            snakeBody[tail].style.left = nextPosition.left + 'px';
            snakeBody[tail].style.top = nextPosition.top + 'px';
            secondCell = head;
            head = tail;
            tail = tail + 1;
            if (tail == l) {
                tail = 0; 
            } 
            player.positions.splice(0, 1); 
        }
        checkIfBitten(nextPosition);
        player.positions.push(nextPosition);
        snakeBody[secondCell].children[0].style.fill = colors[secondCell%colors.length];
        snakeBody[head].children[0].style.fill = "red";
    }, 100);
}

var getRandomCoord = function() {
    let top = board.top() + Math.random() * board.height;
    while (top >= board.getUpperBoundY() - 3 || top <= board.getLowerBoundY() + 3) {
        top = board.top() + Math.random() * board.height;
    }
    let left = board.left() + Math.random() * board.width;
    while (left >= board.getUpperBoundX() - 3 || left <= board.getLowerBoundX() + 3) {
        left = board.left() + Math.random() * board.width;
    }
    return {top, left};
}

var collides = function(coordinates) {
    for (let i = 0; i < player.positions.length; i++) {
        if (getDistance(coordinates, player.positions[i]) < (6 + 5)) return true; 
    }
    return false;
}

var spawnFood = function() {
    let newFoodLoc = getRandomCoord();
    while (collides(newFoodLoc)) newFoodLoc = getRandomCoord();
    let food = document.getElementById('food');
    food.style.position = 'absolute';
    food.style.top = newFoodLoc.top + 'px';
    food.style.left = newFoodLoc.left + 'px';
    foodCoord = {
        top: newFoodLoc.top + 6,
        left: newFoodLoc.left + 6
    }
    food.innerHTML = '<circle cx="6" cy="6" r="6" fill="cyan"/>';
}

var getDistance = function(a, b) {
    return Math.sqrt(Math.pow(a.top - b.top, 2) + Math.pow(a.left - b.left, 2));
}

var checkIfBitten = function(newPosition) {
    for (let i = 0; i < player.positions.length; i++) {
        let distance = Math.ceil(getDistance(newPosition, player.positions[i]));
        if (distance < (5 + 5)) {
            clearInterval(interval);
            let gameover = document.getElementById('over');
            gameover.style.display = 'block';
            gameover.style.position = 'absolute';
            gameover.style.left = board.getLowerBoundX() + board.width/3.2 + 'px';
            gameover.style.top = board.getLowerBoundY() + board.height/2.8 + 'px';
        }
    }
}

var checkAndUpdateScore = function(newPosition) {
    let blockCenter = {
        top: newPosition.top + 5,
        left: newPosition.left + 5
    }
    let distance = getDistance(blockCenter, foodCoord);
    if (distance < (5 + 5)) {
        spawnFood();
        score++;
        document.getElementById('score').innerText = score;
        return true;
    }
    return false;
}


var updateMovement = function(e) {
    if (status == PAUSED && e.keyCode != 32 ) return;
    switch(e.keyCode) {
        case 37: // left
            if (movement.axis == 'left')
                break;
            else {
                movement.axis = 'left';
                movement.direction = -1;
                break;
            }
        case 38: // up
            if (movement.axis == 'top')
                break;
            else {
                movement.axis = 'top';
                movement.direction = -1;
                break;
            }
        case 39: // right
            if (movement.axis == 'left')
                break;
            else {
                movement.axis = 'left';
                movement.direction = 1;
                break;
            }
        case 40: // down
            if (movement.axis == 'top')
                break;
            else {
                movement.axis = 'top';
                movement.direction = 1;
                break;
            }
        case 32: // space
            if (status == RUNNING) {
                if (interval) clearInterval(interval);
                status = PAUSED;
            } else {
                movePlayer();
                status = RUNNING;
            }
    }
}

window.onload = function() {
    let boardElement = document.getElementById('board');
    boardElement.style.width = board.width + 'px';
    boardElement.style.height = board.height + 'px';
    board.boardElement = boardElement;
    // board.top = boardElement.getBoundingClientRect().top;
    // board.left = boardElement.getBoundingClientRect().left;
    boardElement.style.backgroundColor = 'blue';
    snakeBody = document.getElementsByClassName('snake');
    for (let i = 0; i < snakeBody.length; i++) {
        snakeBody[i].style.position = 'absolute';
        snakeBody[i].style.top = player.y + board.top() + 'px';
        snakeBody[i].style.left = player.x + i * 10 + board.left() + 'px';
        let position = {}
        position.left = player.x + i * 10 + board.left();
        position.top = player.y + board.top();
        player.positions.push(position);
    }
    game();
};