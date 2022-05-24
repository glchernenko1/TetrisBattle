const socket = io();

socket.emit("new_player");


const canvas1 = document.getElementById('you');
const context1 = canvas1.getContext('2d');

const canvas2 = document.getElementById('enemy');
const context2 = canvas2.getContext('2d');

socket.on("state", (data)=>{


    //console.log(data.findIndex((player)=>player.id === socket.id));

    const you = data.findIndex((player)=>player.id === socket.id);
    const enemy = data.findIndex((player)=>player.id ===data[you].playWithId);



    loop(data[you], canvas1, context1);
    loop(data[enemy], canvas2, context2);

});

function loop(data, canvas, context){
    if (data.gameOver){
        showText("GAME OVER", canvas, context);
    }
    else
    if (data.win){
        showText("WIN!!!", canvas, context)
    }
    else {
        draw(data, canvas, context);
    }
}


const colors = {
    'I': 'cyan',
    'O': 'yellow',
    'T': 'purple',
    'S': 'green',
    'Z': 'red',
    'J': 'blue',
    'L': 'orange'
};

function showText(str, canvas, context) {
    // прекращаем всю анимацию игры
    // ставим флаг окончания
    // рисуем чёрный прямоугольник посередине поля
    context.fillStyle = 'black';
    context.globalAlpha = 0.75;
    context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
    // пишем надпись белым моноширинным шрифтом по центру
    context.globalAlpha = 1;
    context.fillStyle = 'white';
    context.font = '36px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(str, canvas.width / 2, canvas.height / 2);
}



// размер квадратика
const grid = 32;
let rAF = null;
// requestAnimationFrame
function  draw (data, canvas, context){

    context.clearRect(0,0,canvas.width,canvas.height);


    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
            if (data.playfield[row][col]) {
                const name = data.playfield[row][col];
                context.fillStyle = colors[name];

                // рисуем всё на один пиксель меньше, чтобы получился эффект «в клетку»
                context.fillRect(col * grid, row * grid, grid-1, grid-1);
            }
        }
    }

    if (data.tetromino) {
        context.fillStyle = colors[data.tetromino.name];

        // отрисовываем её
        for (let row = 0; row < data.tetromino.matrix.length; row++) {
            for (let col = 0; col < data.tetromino.matrix[row].length; col++) {
                if (data.tetromino.matrix[row][col]) {

                    // и снова рисуем на один пиксель меньше
                    context.fillRect((data.tetromino.col + col) * grid, (data.tetromino.row + row) * grid, grid-1, grid-1);
                }
            }
        }
    }


}




function onKeyDown(event) {
    const { key } = event
    if (key === "ArrowRight") {
        socket.emit("move","right");
    } else
    if (key === "ArrowLeft") {
        socket.emit("move","left");
    }else
    if (key ==="ArrowUp"){
        socket.emit("move","up");
    }
    else {
        socket.emit("move","down");
    }
}

document.addEventListener('keydown', onKeyDown)





