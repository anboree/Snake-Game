// Creating all constants and variables needed for the game
const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d");
const scoreText = document.querySelector("#scoreText");
const resetBtn = document.querySelector("#resetBtn");
const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;
const boardBackground = "lightgray";
const snakeColor = "green";
const snakeBorder = "black";
const foodColor = "red";
const unitSize = 25;
const difficultySelect = document.querySelector("#difficulty");
const victoryScore = 50;
const obstacleLabel = document.querySelector("#obstacleLabel");
const obstacleToggle = document.querySelector("#obstacleToggle");
const obstacleCount = 6;
const obstacleColor = "dimgray";
let running = false;
let xVelocity = unitSize;
let yVelocity = 0;
let foodX;
let foodY;
let specialFoodX;
let specialFoodY;
let isSpecialFood = false;
let score = 0;
let timeout;
let paused = false;
// Array for obstacles
let obstacles = [];
// Default game speed
let gameSpeed = 75;
// Creating and setting the default snake size
let snake = [
    {x:unitSize * 4, y:0},
    {x:unitSize * 3, y:0},
    {x:unitSize * 2, y:0},
    {x:unitSize, y:0},
    {x:0, y:0}
];

// Event listeners to set the keys to move and the reset/start button and difficulty dropdown
window.addEventListener("keydown", function(event){
    changeDirection(event);

    // If 'R' key is pressed, then reset game so user doesn't have to use mouse
    if((event.key === "r" || event.key === "R") && startBtn.style.display == "none"){
        resetGame();
    }

    // If 'P' key is pressed, then pause the game
    if((event.key === "p" || event.key === "P") && startBtn.style.display == "none"){
        togglePause();
    }
});
resetBtn.addEventListener("click", resetGame);
startBtn.addEventListener("click", startGame);
difficultySelect.addEventListener("change", function() {
    gameSpeed = Number(this.value);
});

// Title for game before start + controls
ctx.font = "50px sans-serif";
ctx.fillStyle = "green";
ctx.textAlign = "center";
ctx.fillText("SNAKE GAME", gameWidth / 2, gameHeight / 2);
ctx.font = "17px sans-serif";
ctx.fillStyle = "black";
ctx.fillText("Press 'Start Game' to Play & You Can Pause by Pressing 'P'", gameWidth / 2, gameHeight / 2 + 40);

// Start the game when player clicks on the "Start Game" button
function startGame(){
    startBtn.style.display = "none";
    difficultySelect.style.display = "none";
    obstacleLabel.style.display = "none";
    obstacleToggle.style.display = "none";
    gameSpeed = Number(difficultySelect.value);

    gameStart();
}

// Function that automatically starts the game
function gameStart(){
    running = true;
    scoreText.textContent = score;
    createFood();
    if(obstacleToggle.checked) createObstacles();
    drawFood();
    nextTick();
    resetBtn.style.display = "block";
};

// Function that sets everything that happens after each tick
function nextTick(){
    if(running){
        timeout = setTimeout(()=>{
            clearBoard();
            drawFood();
            if(obstacleToggle.checked) drawObstacles();
            moveSnake();
            drawSnake();
            checkGameOver();
            nextTick();
        }, gameSpeed)
    }
    else{
        if(score >= victoryScore){
            displayVictory();
        }
        else{
            displayGameOver();
        }
    }
};

// Function to clear the game board after snake collects a piece of food
function clearBoard(){
    ctx.fillStyle = boardBackground;
    ctx.fillRect(0, 0, gameWidth, gameHeight);
};

// Function that creates how the food will spawn
function createFood(){
    function randomFood(min, max){
        const randNum = Math.round((Math.random() * (max - min) + min) / unitSize) * unitSize;
        return randNum;
    }

    // 10% chance for special food to appear
    isSpecialFood = Math.random() < 0.1;

    if(isSpecialFood){
        specialFoodX = randomFood(0, gameWidth - unitSize);
        specialFoodY = randomFood(0, gameHeight - unitSize);
    }
    else{
        foodX = randomFood(0, gameWidth - unitSize);
        foodY = randomFood(0, gameHeight - unitSize);
    }

    // Condition for isFoodBlocked function
    let attempts = 0;
    do{
        foodX = Math.floor(Math.random() * (gameWidth / unitSize)) * unitSize;
        foodY = Math.floor(Math.random() * (gameHeight / unitSize)) * unitSize;
        attempts++;
    }
    while(
        (obstacles.some(ob => ob.x === foodX && ob.y === foodY) ||
        isFoodBlocked(foodX, foodY)) &&
        attempts < 100
    );
};

// Function that draws the food for player to see
function drawFood(){
    if(isSpecialFood){
        ctx.fillStyle = "gold";
        ctx.fillRect(specialFoodX, specialFoodY, unitSize, unitSize);
    }
    else{
        ctx.fillStyle = foodColor;
        ctx.fillRect(foodX, foodY, unitSize, unitSize);
    }
};

// Function that sets the head of the snake and checks if the snake eats any food, if so then update the score by 1
function moveSnake(){
    const head = {x: snake[0].x + xVelocity,
                  y: snake[0].y + yVelocity};

    snake.unshift(head);

    if(!isSpecialFood && snake[0].x == foodX && snake[0].y == foodY){
        score++;
        scoreText.textContent = score;
        createFood();
    }
    else if(isSpecialFood && snake[0].x == specialFoodX && snake[0].y == specialFoodY){
        score += 2; // Special food = 2 points
        scoreText.textContent = score;
        createFood();
    }
    else{
        snake.pop();
    }

    // Checks if score is enough to win the game
    if(score >= victoryScore){
        running = false;
        displayVictory();
        return;
    }
};

// Function that makes the snake visible
function drawSnake(){
    ctx.fillStyle = snakeColor;
    ctx.strokeStyle = snakeBorder;
    snake.forEach(snakePart => {
        ctx.fillRect(snakePart.x, snakePart.y, unitSize, unitSize);
        ctx.strokeRect(snakePart.x, snakePart.y, unitSize, unitSize);
    })
};

// Function that sets the controls so the player can move the snake (the 4 keys used here are arrow keys)
function changeDirection(event){
    const keyPressed = event.keyCode;
    const LEFT = 37;
    const UP = 38;
    const RIGHT = 39;
    const DOWN = 40;

    const goingUP = (yVelocity == -unitSize);
    const goingDOWN = (yVelocity == unitSize);
    const goingLEFT = (xVelocity == -unitSize);
    const goingRIGHT = (xVelocity == unitSize);

    // Switch statement to check if snake isn't colliding with itself
    switch(true){
        case(keyPressed == LEFT && !goingRIGHT):
            xVelocity = -unitSize;
            yVelocity = 0;
            break;
        case(keyPressed == UP && !goingDOWN):
            xVelocity = 0;
            yVelocity = -unitSize;
            break;
        case(keyPressed == RIGHT && !goingLEFT):
            xVelocity = unitSize;
            yVelocity = 0;
            break;
        case(keyPressed == DOWN && !goingUP):
            xVelocity = 0;
            yVelocity = unitSize;
    }
};

// Function that checks if the snake goes out of the container borders, if so the snake stops moving
function checkGameOver(){
    switch(true){
        case (snake[0].x < 0):
            running = false;
            break;
        case (snake[0].x >= gameWidth):
            running = false;
            break;
        case (snake[0].y < 0):
            running = false;
            break;
        case (snake[0].y >= gameHeight):
            running = false;
            break;
    }

    for(let i = 1; i < snake.length; i++){
        if(snake[i].x == snake[0].x && snake[i].y == snake[0].y){
            running = false;
        }
    }

    if(obstacleToggle.checked){
        for (let ob of obstacles){
            if(snake[0].x === ob.x && snake[0].y === ob.y){
                running = false;
            }
        }
    }
};

// Displays GAME OVER screen to the player + controls to reset
function displayGameOver(){
    ctx.font = "50px sans-serif";
    ctx.fillStyle = "darkred";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER!", gameWidth / 2, gameHeight / 2);
    ctx.font = "17px sans-serif";
    ctx.fillStyle = "black";
    ctx.fillText("Press 'R' or click the 'Reset' button to retry", gameWidth / 2, gameHeight / 2 + 40);
    running = false;
    difficultySelect.style.display = "block";
    obstacleLabel.style.display = "block";
    obstacleToggle.style.display = "block";
};

// Resets the canvas and snake to default
function resetGame(){
    score = 0;
    xVelocity = unitSize;
    yVelocity = 0;
    snake = [
        {x:unitSize * 4, y:0},
        {x:unitSize * 3, y:0},
        {x:unitSize * 2, y:0},
        {x:unitSize, y:0},
        {x:0, y:0}
    ];
    clearTimeout(timeout);
    difficultySelect.style.display = "none";
    obstacleLabel.style.display = "none";
    obstacleToggle.style.display = "none";
    if(obstacleToggle.checked) createObstacles();
    gameStart();
};

// Function that pauses the game
function togglePause(){
    if (!running) return;

    paused = !paused;

    if(paused){
        clearTimeout(timeout);
        displayPause();
    }
    else{
        nextTick();
    }
}

// Styling the pause screen
function displayPause(){
    ctx.font = "50px sans-serif";
    ctx.fillStyle = "blue";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", gameWidth / 2, gameHeight / 2);
}

// Creating the victory screen
function displayVictory(){
    ctx.font = "50px sans-serif";
    ctx.fillStyle = "green";
    ctx.textAlign = "center";
    ctx.fillText("YOU WIN!!!", gameWidth / 2, gameHeight / 2);
    ctx.font = "17px sans-serif";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText("You Reached 50 Points!", gameWidth / 2, gameHeight / 2 + 40);
    running = false;
}

// Logic used for creating obstacles
function createObstacles(){
    obstacles = [];

    for(let i = 0; i < obstacleCount; i++){
        let x, y, attempts = 0;
        do{
            x = Math.floor(Math.random() * (gameWidth / unitSize)) * unitSize;
            y = Math.floor(Math.random() * (gameHeight / unitSize)) * unitSize;
            attempts++;
        }
        while(
            (snake.some(part => part.x === x && part.y === y) ||
            (x === foodX && y === foodY) ||
            y === 0) && attempts < 100
        );

        if(attempts < 100) obstacles.push({x, y});
    }
}

function drawObstacles(){
    ctx.fillStyle = obstacleColor;
    obstacles.forEach(ob => {
        ctx.fillRect(ob.x, ob.y, unitSize, unitSize);
    });
}

// Function to check if food is trapped in a corner
function isFoodBlocked(x, y){
    let freeNeighbors = 0;

    const directions = [
        {dx: unitSize, dy: 0}, 
        {dx: -unitSize, dy: 0},
        {dx: 0, dy: unitSize}, 
        {dx: 0, dy: -unitSize}
    ];
    
    for(let d of directions){
        const nx = x + d.dx;
        const ny = y + d.dy;
        
        // Check if within bounds and not an obstacle
        if(nx >= 0 && nx < gameWidth && ny >= 0 && ny < gameHeight &&
           !obstacles.some(ob => ob.x === nx && ob.y === ny)){
            freeNeighbors++;
        }
    }   

    return freeNeighbors < 2; // "trapped" if less than 2 exits
}