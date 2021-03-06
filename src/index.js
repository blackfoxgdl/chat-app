const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom, getAllRoomsAvailables } = require('./utils/users');
const { isObject } = require('util');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

let count = 0;

io.on('connection', (socket) => {
    console.log('new web socket connection');

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin says:', 'Welcome'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin says:', `${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        io.to(user.room).emit('roomsListData', {
            rooms: getAllRoomsAvailables()
        });

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!');
        }

        io.to(user.room).emit('message', generateMessage(`${user.username} says:`, message));
        callback();
    });

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        console.log(user);
        io.to(user.room).emit('shareLocation', generateLocationMessage(`${user.username} says:`, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin says:', `${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });
    // socket.emit('countUpdated', count);

    // socket.on('increment', () => {
    //     count++;
    //     io.emit('countUpdated', count);
    // });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});