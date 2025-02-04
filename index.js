// Izveidoti visi nepieciešamie mainīgie un konstanti priekš spēles
const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d");
const scoreText = document.querySelector("#scoreText");
const resetBtn = document.querySelector("#resetBtn");
const startBtn = document.querySelector("#startBtn");
const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;
const boardBackground = "lightgray";
const snakeColor = "lightgreen";
const snakeBorder = "black";
const foodColor = "red";
const unitSize = 25;
let running = false;
let xVelocity = unitSize;
let yVelocity = 0;
let foodX;
let foodY;
let score = 0;
let snake = [
    {x:unitSize * 4, y:0},
    {x:unitSize * 3, y:0},
    {x:unitSize * 2, y:0},
    {x:unitSize, y:0},
    {x:0, y:0}
];
let time_out_id;

// Iegūst no HTML faila, kāds līmenis ir izvēlēts.
const gameContainer = document.getElementById("container");
const gameMode = gameContainer.getAttribute("data-mode");

// Izveidoti game mode objekti.
const gameSettings = {
    easy: { speed: 75, obstacleCount: 0 },
    normal: { speed: 75, obstacleCount: 6 },
    hard: { speed: 45, obstacleCount: 9 },
    impossible: { speed: 80, obstacleCount: 12 }
}

// Piešķir, kāds būs ātrums un cik būs šķēršļi.
const speed = gameSettings[gameMode].speed;
const obstacleCount = gameSettings[gameMode].obstacleCount;

window.addEventListener("keydown", changeDirection);
resetBtn.addEventListener("click", resetGame);
resetBtn.style.display = "none";
startBtn.addEventListener("click", startGame);

// Izveidoju šķēršļu masīvu un arī safe zone izmēru.
let obstacles = [];
const safeZoneSize = 5 * unitSize;

// Funkcija, kas ģenerē šķēršļus.
function generateObstacles() {
    obstacles = [];

    let maxAttempts = 100;
    for (let i = 0; i < obstacleCount; i++) {
        let obstacleX, obstacleY;
        let validPosition = false;
        let attempts = 0;

        while (!validPosition && attempts < maxAttempts) {
            attempts++;
            obstacleX = getRandomPosition(0, gameWidth - unitSize);
            obstacleY = getRandomPosition(0, gameHeight - unitSize);

            const isInSafeZone = snake.some(segment =>
                Math.abs(segment.x - obstacleX) < 5 * unitSize &&
                Math.abs(segment.y - obstacleY) < 5 * unitSize
            );

            // Nosacījumi, lai šķērslis būtu brīvā vietā (kur nav čūska un/vai ēdiens).
            validPosition = !isInSafeZone &&
                            !snake.some(segment => segment.x === obstacleX && segment.y === obstacleY) &&
                            !(foodX === obstacleX && foodY === obstacleY);
        }

        if (validPosition) {
            obstacles.push({ x: obstacleX, y: obstacleY });
        }
    }
}

function getRandomPosition(min, max){
    return Math.round((Math.random() * (max - min) + min) / unitSize) * unitSize;
}

// Nosaka, kādi izskatīsies šķēršļi.
function drawObstacles() {
    ctx.fillStyle = "rgb(20,20,20)";
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, unitSize, unitSize);
    });
}

// Izsauc šo funkciju, lai sāktos spēle.
function startGame(){
    gameStart();
    startBtn.style.display = "none";
    resetBtn.style.display = "block";
}

// Funkcija, kas nostrādā tad, kad sākas jauna spēle.
function gameStart(){
    running = true;
    scoreText.textContent = score;
    createFood();
    generateObstacles();
    drawFood();
    nextTick();
};

function nextTick(){
    if(running){
        time_out_id = setTimeout(()=>{
            clearBoard();
            drawFood();
            drawObstacles();
            moveSnake();
            drawSnake();
            checkGameOver();
            nextTick();
        }, speed);
    }
    else{
        displayGameOver();
    }
};

function clearBoard(){
    ctx.fillStyle = boardBackground;
    ctx.fillRect(0, 0, gameWidth, gameHeight);
};

// Funkcija, kas izveido ēdiena gabaliņus.
function createFood(){
    function randomFood(min, max){
        const randNum = Math.round((Math.random() * (max - min) + min) / unitSize) * unitSize;
        return randNum;
    }
    foodX = randomFood(0, gameWidth - unitSize);
    foodY = randomFood(0, gameWidth - unitSize);

    while (obstacles.some(obstacle => obstacle.x === foodX && obstacle.y === foodY)) {
        foodX = getRandomPosition(0, gameWidth - unitSize);
        foodY = getRandomPosition(0, gameHeight - unitSize);
    }

    if(gameMode == "impossible"){
        generateObstacles();
    }
};

// Funkcija, kas nodefinē, kādiem jaizskatās ēdiena gabaliņiem.
function drawFood(){
    ctx.fillStyle = foodColor;
    ctx.fillRect(foodX, foodY, unitSize, unitSize);
};

function moveSnake(){
    const head = {x: snake[0].x + xVelocity,
                  y: snake[0].y + yVelocity};

    snake.unshift(head);
    if(snake[0].x === foodX && snake[0].y === foodY){
        score+=1;
        scoreText.textContent = score;
        createFood();
    }
    else{
        snake.pop();
    }
};

function drawSnake(){
    ctx.fillStyle = snakeColor;
    ctx.strokeStyle = snakeBorder;
    snake.forEach(snakePart => {
        ctx.fillRect(snakePart.x, snakePart.y, unitSize, unitSize);
        ctx.strokeRect(snakePart.x, snakePart.y, unitSize, unitSize);
    })
};

// Nosaka spēlei kontroles pogas un virzienu uz kuru tai jādodas, kad nospiež doto pogu.
function changeDirection(event){
    const keyPressed = event.keyCode;
    const LEFT = 37;
    const UP = 38;
    const RIGHT = 39;
    const DOWN = 40;

    const goingUp = (yVelocity == -unitSize);
    const goingDown = (yVelocity == unitSize);
    const goingRight = (xVelocity == unitSize);
    const goingLeft = (xVelocity == -unitSize);

    switch(true){
        // Ja nospiež kreiso arrow key, tad čūska pārvietojas pa kreisi x asī un y asī nekustās.
        case(keyPressed == LEFT && !goingRight):
            xVelocity = -unitSize;
            yVelocity = 0;
            break;

        // Ja nospiež augšējo arrow key, tad čūska pārvietojas uz augšu y asī un x asī nekustās.
        case(keyPressed == UP && !goingDown):
            xVelocity = 0;
            yVelocity = -unitSize;
            break;

        // Ja nospiež labo arrow key, tad čūska pārvietojas pa labi x asī un y asī nekustas.
        case(keyPressed == RIGHT && !goingLeft):
            xVelocity = unitSize;
            yVelocity = 0;
            break;

        // Ja nospiež lejējo arrow key, tad čūska pārvietojas uz leju y asī un x asī nekustas.
        case(keyPressed == DOWN && !goingUp):
            xVelocity = 0;
            yVelocity = unitSize;
            break;
    }
};

// Funkcija, kas pārbauda, vai čūska nav izgājusi no spēles laukuma.
function checkGameOver(){
    switch(true){

        // Pārbauda, vai čūskas array pirmais elements nav mazāks par nulli x asī.
        case(snake[0].x < 0):
            running = false;
            break;

        // Pārbauda, vai čūskas array pirmais elements x asī nepārsniedz spēles lauka platumu.
        case(snake[0].x >= gameWidth):
            running = false;
            break;

        // Pārbauda, vai čūskas array pirmais elements nav mazāks par nulli y asī.
        case(snake[0].y < 0):
            running = false;
            break;

        // Pārbauda, vai čūskas array pirmais elements y asī nepārsniedz spēles lauka augstumu.
        case(snake[0].y >= gameHeight):
            running = false;
            break;
    }

    // Pārbauda, vai čūska nav saskrējusies pati ar sevīm.
    for(let i = 1; i < snake.length; i+=1){
        if(snake[i].x == snake[0].x && snake[i].y == snake[0].y){
            running = false;
        }
    }
    for(let i = 0; i < obstacles.length; i++){
        if(snake[0].x == obstacles[i].x && snake[0].y == obstacles[i].y){
            running = false;
        }
    }
};

// Funkcija, kas izvada 'Game Over' ziņojumu.
function displayGameOver(){
    ctx.font = "50px MV Boli";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER!", gameWidth / 2, gameHeight / 2);
    running = false;
};

// Kad nospiež pogu 'Reset', tad izpildās šī funkcija, kas atgriež visu, kā sākumā (rezultāts = 0 un čūska atgriežas starta pozīcijā).
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
    clearTimeout(time_out_id);
    gameStart();
};