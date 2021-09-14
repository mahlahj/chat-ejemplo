// Setup básico del servidor express
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Servidor en puerto %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom
let numUsers = 0;

io.on('connection', (socket) => {
  let addUser = false;

  // Cuando el cliente emite 'new message', esto escucha y ejecuta
  socket.on('new message', (data) => {
    // Mandamos al cliente ejecutar 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // Cuando el cliente emite 'add user', esto escucha y ejecuta
  socket.on('add user', (username) => {
    if (addUser) return;

    // Almacenamos el username en la sesión de socket para este cliente
    socket.username = username;
    ++numUsers;
    addUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // Mensaje global (todos los clientes) que una persona se ha conectado
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // Cuando el cliente emite 'typing', hacemos broadcast a los demás
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // Cuando el cliente emite 'stop typing', hacemos broadcast a los demás
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // Cuando un user se desconecta realiza esto
  socket.on('disconnect', () => {
    if (addUser) {
      --numUsers;

      // Mensaje global que el cliente ha salido
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});