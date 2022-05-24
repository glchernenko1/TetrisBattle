const exprees = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");

const app = exprees();
const server = http.Server(app);
const io = socketIO(server);

app.set("port", 5000);
app.use("/static", exprees.static(__dirname + "/static"));

app.get("/", function(request, response){
    response.sendFile(path.join(__dirname + "/static", "index.html"));
});


server.listen(5000, ()=>{
    console.log("Starting server!!");
});

const tetrominos = {
    'I': [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ],
    'J': [
        [2,0,0],
        [2,2,2],
        [0,0,0],
    ],
    'L': [
        [0,0,3],
        [3,3,3],
        [0,0,0],
    ],
    'O': [
        [4,4],
        [4,4],
    ],
    'S': [
        [0,5,5],
        [5,5,0],
        [0,0,0],
    ],
    'Z': [
        [6,6,0],
        [0,6,6],
        [0,0,0],
    ],
    'T': [
        [0,7,0],
        [7,7,7],
        [0,0,0],
    ]
};





function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rotate(matrix) {
    const N = matrix.length - 1;
    const result = matrix.map((row, i) =>
        row.map((val, j) => matrix[N - j][i])
    );
    // на входе матрица, и на выходе тоже отдаём матрицу
    return result;
}


class Player{
    constructor(id) {
        this.id = id;
        this.playWithId = null;

        this.playfield = [];
        for (let row = -2; row < 20; row++) {
            this.playfield[row] = [];

            for (let col = 0; col < 10; col++) {
                this.playfield[row][col] = 0;
            }
        }

        this.tetrominoSequence = [];
        this.tetromino = this.getNextTetromino();
        this.gameOver = false;
        this.win = false;
        this.count =0;

    }


    generateSequence() {
        // тут — сами фигуры
        const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

        while (sequence.length) {
            // случайным образом находим любую из них
            const rand = getRandomInt(0, sequence.length - 1);
            const name = sequence.splice(rand, 1)[0];
            // помещаем выбранную фигуру в игровой массив с последовательностями
            this.tetrominoSequence.push(name);
        }
    }


    getNextTetromino() {
        // если следующей нет — генерируем
        if (this.tetrominoSequence.length === 0) {
            this.generateSequence();
        }
        // берём первую фигуру из массива
        const name = this.tetrominoSequence.pop();
        // сразу создаём матрицу, с которой мы отрисуем фигуру
        const matrix = tetrominos[name];

        // I и O стартуют с середины, остальные — чуть левее
        const col = this.playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);

        // I начинает с 21 строки (смещение -1), а все остальные — со строки 22 (смещение -2)
        const row = name === 'I' ? -1 : -2;

        // вот что возвращает функция
        return {
            name: name,      // название фигуры (L, O, и т.д.)
            matrix: matrix,  // матрица с фигурой
            row: row,        // текущая строка (фигуры стартую за видимой областью холста)
            col: col         // текущий столбец
        };
    }

    isValidMove(matrix, cellRow, cellCol) {
        // проверяем все строки и столбцы
        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
                if (matrix[row][col] && (
                    // если выходит за границы поля…
                    cellCol + col < 0 ||
                    cellCol + col >= this.playfield[0].length ||
                    cellRow + row >= this.playfield.length ||
                    // …или пересекается с другими фигурами
                    this.playfield[cellRow + row][cellCol + col])
                ) {
                    // то возвращаем, что нет, так не пойдёт
                    return false;
                }
            }
        }
        // а если мы дошли до этого момента и не закончили раньше — то всё в порядке
        return true;
    }

    placeTetromino() {
        // обрабатываем все строки и столбцы в игровом поле
        for (let row = 0; row < this.tetromino.matrix.length; row++) {
            for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
                if (this.tetromino.matrix[row][col]) {

                    // если край фигуры после установки вылезает за границы поля, то игра закончилась
                    if (this.tetromino.row + row < 0) {
                         this.gameOver=true;

                        const j =players.findIndex((player)=> player.id===this.playWithId);
                        if (j!==-1){
                            players[j].win=true;
                        }

                         //this.endPlay();
                         return;
                    }
                    // если всё в порядке, то записываем в массив игрового поля нашу фигуру
                    this.playfield[this.tetromino.row + row][this.tetromino.col + col] = this.tetromino.name;
                }
            }
        }

        // проверяем, чтобы заполненные ряды очистились снизу вверх
        for (let row = this.playfield.length - 1; row >= 0; ) {
            // если ряд заполнен
            if (this.playfield[row].every(cell => !!cell)) {

                // очищаем его и опускаем всё вниз на одну клетку
                for (let r = row; r >= 0; r--) {
                    for (let c = 0; c < this.playfield[r].length; c++) {
                        this.playfield[r][c] = this.playfield[r-1][c];
                    }
                }
            }
            else {
                // переходим к следующему ряду
                row--;
            }
        }
        // получаем следующую фигуру
        this.tetromino = this.getNextTetromino();
    }

    loop() {
        if (this.tetromino) {

            // фигура сдвигается вниз каждые 35 кадров
            if (this.count++ > 35) {
                this.tetromino.row++;
                this.count = 0;

                // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
                if (!this.isValidMove(this.tetromino.matrix, this.tetromino.row, this.tetromino.col)) {
                    this.tetromino.row--;
                    this.placeTetromino();
                }
            }
        }
    }

    move(str){
        if (this.gameOver) return;


        // стрелки влево и вправо
        if (str === "right" || str === "left") {
            const col = str === "left"
                // если влево, то уменьшаем индекс в столбце, если вправо — увеличиваем
                ? this.tetromino.col - 1
                : this.tetromino.col + 1;

            // если так ходить можно, то запоминаем текущее положение
            if (this.isValidMove(this.tetromino.matrix, this.tetromino.row, col)) {
                this.tetromino.col = col;
            }
        }

        if (str === "up") {
            // поворачиваем фигуру на 90 градусов
            const matrix = rotate(this.tetromino.matrix);
            // если так ходить можно — запоминаем
            if (this.isValidMove(matrix, this.tetromino.row, this.tetromino.col)) {
                this.tetromino.matrix = matrix;
            }
        }

        // стрелка вниз — ускорить падение
        if(str === "down") {
            // смещаем фигуру на строку вниз
            const row = this.tetromino.row + 1;
            // если опускаться больше некуда — запоминаем новое положение
            if (!this.isValidMove(this.tetromino.matrix, row, this.tetromino.col)) {
                this.tetromino.row = row - 1;
                // ставим на место и смотрим на заполненные ряды
                this.placeTetromino();
                return;
            }
            // запоминаем строку, куда стала фигура
            this.tetromino.row = row;
        }

    }



    startPlayWith(player){
        this.playWithId = player.id;
        player.playWithId = this.id;
    }

    endPlay(){
        const j =players.findIndex((player)=> player.playWithId===this.playWithId);
        if (j!==-1){
            players[j].playWithId=null;
        }
        this.playWithId = null;
    }

    isPlay(){
        return this.playWithId != null;
    }

}

const players = [];
let countPlayers = 0;

function delPlayer(id){
    let i = players.findIndex((data)=> data.id===id);
    if (i!==-1){


        countPlayers--;
        players.splice(i, 1)
    }
}

function  addPlayer(id){
    player = new Player(id);
    let j = players.findIndex((data)=>!data.isPlay());
    if (j!==-1){
        player.startPlayWith(players[j]);
    }
    players.push(player);
    countPlayers++;
}



io.on("connection",  (socket) =>{
    socket.on("new_player", ()=>{
        addPlayer(socket.id)
    });

    socket.on("move", (data)=>{

        let j = players.findIndex((player)=>player.id === socket.id);
        if (j!==-1){

            players[j].move(data);
        }


    });


    socket.on("disconnect", ()=>{
        delPlayer(socket.id);
    })

});



setInterval(()=>{
    if (players && io){
        gameLoop(players, io);
    }
}, 1000/60)


const gameLoop = (players, io) =>{

    players.forEach((player)=>{
        if (player.isPlay()){
            player.loop();
        }
    })

    io.sockets.emit("state", players);


}