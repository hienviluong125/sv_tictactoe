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

io.on('connection', (socket) => {
    const yourId = uuidv4();
    users[yourId] = socket;

    console.log("user: ", yourId, " joined");
    console.log("FROM CONNECT current_users: ", Object.keys(users));

    socket.emit('user_joined', { token: yourId });

    socket.on('join_by_token', data => {
        users[data.token].emit("be_a_host");
        socket.emit("be_a_guest");
    })

    socket.on('hit_board', data => {
        socket.broadcast.emit('receive_hit_board', data);
    });

    socket.on('user_quit', data => {
        delete users[data.token];
        console.log("user_quit - users: ", Object.keys(users));
    });

    socket.on('disconnect', data => {
        for(let userId in users) {
            if(users[userId].id == socket.id) {
                console.log("user: ", userId, " quitted")
                delete users[userId];
                console.log("FROM DISCONNECT current_users: ", Object.keys(users));
                break
            }
        }
    })
});

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
