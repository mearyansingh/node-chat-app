// Import required modules
const path = require('path')
const express = require("express");
const http = require('http');
const socketIo = require('socket.io');
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Create a Socket.io instance and attach it to the HTTP server
const io = socketIo(server);

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, "../public");

//Setup static directory to serve
app.use(express.static(publicDirectoryPath));


// Handle WebSocket connections
io.on('connection', (socket) => {
   console.log('A user connected');

   // socket.emit('message', generateMessage("Welcome!"));
   // socket.broadcast.emit("message", generateMessage("A new user has joined!"));

   socket.on('join', ({ userName, room }, callback) => {

      const { error, user } = addUser({ id: socket.id, userName, room })

      if (error) {
         return callback(error)
      }

      //-------sent events from client to user(methods)---------//
      //socket.emit -> that sends an event to a specific client
      //io.emit -> sends an event to every connected clients
      //socket.broadcast.emit -> sends an event to every connected client except for this one 
      //------- variation----------//
      // io.to.emit,socket.broadcast.to.emit

      socket.join(user.room)

      socket.emit('message', generateMessage('Admin', "Welcome!"));
      socket.broadcast.to(user.room).emit("message", generateMessage("Admin", `${user.userName} has joined!`));
      io.to(user.room).emit("roomData", {
         room: user.room,
         users: getUsersInRoom(user.room)
      })
      callback()
   });

   // Listen for messages from the client
   socket.on('sendMessage', (msg, callback) => {
      const user = getUser(socket.id)
      //used bad word filter
      const filter = new Filter()
      if (filter.isProfane(msg)) {
         return callback('Profanity is not allowed')
      }
      // Broadcast the message to all connected clients
      io.to(user.room).emit('message', generateMessage(user.userName, msg));
      callback()
   });

   socket.on('sendLocation', (coords, callback) => {
      const user = getUser(socket.id)
      // Broadcast the message to all connected clients
      io.to(user.room).emit('locationMessage', generateLocationMessage(user.userName, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
      callback()
   });

   // Handle disconnection
   socket.on('disconnect', () => {
      const user = removeUser(socket.id)
      if (user) {
         io.to(user.room).emit('message', generateMessage('Admin', `${user.userName} has left!`));
         io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
         })
      }
   });
});

server.listen(port, () => {
   console.log(`server is up on port ${port}`);
});