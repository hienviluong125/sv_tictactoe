// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

let users = {};
let matrix = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
]
let rooms = {};
let hostJoined = false;
let guestJoined = false;
let roomToken = "";

io.on('connection', (socket) => {
    const yourId = uuidv4();
    users[yourId] = socket;

    console.log("user: ", yourId, " joined");
    console.log("FROM CONNECT current_users: ", Object.keys(users));

    socket.emit('user_joined', { token: yourId });

    socket.on('join_by_token', data => {
        roomToken = data.token;
        hostJoined = false;
        guestJoined = false;
        matrix = resetMatrix();

        socket.join(data.token);
        users[data.token].join(data.token);

        io.to(roomToken).emit("joined_room", { roomToken: roomToken });
    })

    socket.on('start_game', data => {
        if (data.roomToken === data.token) {
            hostJoined = true
        } else {
            guestJoined = true
        }

        if (hostJoined === true && guestJoined === true) {
            if (data.roomToken === data.token) {
                socket.emit("be_a_host")
                socket.broadcast.emit("be_a_guest")
            } else {
                socket.emit("be_a_guest")
                socket.broadcast.emit("be_a_host")
            }
        } else {
            socket.emit("wait_for_rival");
        }
    })

    socket.on('hit_board', data => {
        socket.broadcast.emit('receive_hit_board', data);

        // check is Win
        let label = data.isHost ? 1 : 2;
        let pos = parseInt(data.id);
        let row = parseInt(pos / 3);
        let col = pos % 3;

        matrix[row][col] = label;
        let result = checkWin(data.isHost);

        if (result.isWin) {
            socket.emit("win", { positions: result.positions })
            socket.broadcast.emit("lose", { positions: result.positions })
            hostJoined = false;
            guestJoined = false;
            matrix = resetMatrix();
        } else {
            if (checkTie()) {
                socket.emit("tie")
                socket.broadcast.emit("tie")
                hostJoined = false;
                guestJoined = false;
                matrix = resetMatrix();
            }
        }
    });

    socket.on('user_quit', data => {
        delete users[data.token];
        console.log("user_quit - users: ", Object.keys(users));
    });

    socket.on('disconnect', data => {
        for (let userId in users) {
            if (users[userId].id == socket.id) {
                console.log("user: ", userId, " quitted")
                delete users[userId];
                console.log("FROM DISCONNECT current_users: ", Object.keys(users));
                break
            }
        }
    })
});

function checkWin(isHost) {
    return checkWinFor(isHost);
}

function checkTie() {
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] === 0) {
                return false
            }
        }
    }

    return true
}

function checkWinFor(isHost) {
    let label = isHost ? 1 : 2;
    if (matrix[0][0] === label && matrix[0][0] === matrix[0][1] && matrix[0][0] === matrix[0][2]) {
        return {
            positions: [0, 1, 2],
            isWin: true,
            isHost: isHost
        }
    }

    if (matrix[0][0] === label && matrix[0][0] === matrix[1][1] && matrix[0][0] === matrix[2][2]) {
        return {
            positions: [0, 4, 8],
            isWin: true,
            isHost: isHost
        }
    }

    if (matrix[0][0] === label && matrix[0][0] === matrix[1][0] && matrix[0][0] === matrix[2][0]) {
        return {
            positions: [0, 3, 6],
            isWin: true,
            isHost: isHost
        }
    }

    if (matrix[1][0] === label && matrix[1][0] === matrix[1][1] && matrix[1][0] === matrix[1][2]) {
        return {
            positions: [3, 4, 5],
            isWin: true,
            isHost: isHost
        }
    }

    if (matrix[2][0] === label && matrix[2][0] === matrix[2][1] && matrix[2][0] === matrix[2][2]) {
        return {
            positions: [6, 7, 8],
            isWin: true,
            isHost: isHost
        }
    }

    if (matrix[2][0] === label && matrix[2][0] === matrix[1][1] && matrix[2][0] === matrix[0][2]) {
        return {
            positions: [6, 4, 2],
            isWin: true,
            isHost: isHost
        }
    }

    if (matrix[0][1] === label && matrix[0][1] === matrix[1][1] && matrix[0][1] === matrix[2][1]) {
        return {
            positions: [1, 4, 7],
            isWin: true,
            isHost: isHost
        }
    }

    if (matrix[0][2] === label && matrix[0][2] === matrix[1][2] && matrix[0][2] === matrix[2][2]) {
        return {
            positions: [2, 5, 8],
            isWin: true,
            isHost: isHost
        }
    }

    return {
        isWin: false,
        isHost: isHost
    }
}

function resetMatrix() {
    return [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
