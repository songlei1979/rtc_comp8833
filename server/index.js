const io = require('socket.io')(5001, {
  cors: { origin: '*' }
});

io.on('connection', socket => {
  console.log('New client connected');

  socket.on('offer', (data) => {
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.broadcast.emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    socket.broadcast.emit('ice-candidate', data);
  });
});
