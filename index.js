const express = require('express')
const socket = require('socket.io')

const app = express()
const server = app.listen(4000, () =>
  console.log('listening to requests on port 4000')
)

app.use(express.static('public'))

const io = socket(server)

const rooms = {}

io.on('connection', socket => {
  console.log('made socket connection', socket.id)
  socket.on('join', (room, name) => {
    if (rooms[room] && rooms[room].playerCount >= 2) {
      io.to(socket.id).emit('error', 'room is full')
      return
    }
    if (!rooms[room]) {
      socket.join(room)
      rooms[room] = {
        messages: [],
        typers: new Set(),
        playerCount: 1,
        players: { [socket.id]: name },
        finished: false
      }
      io.to(socket.id).emit('success')
    } else {
      socket.join(room)
      rooms[room].playerCount += 1
      rooms[room].players[socket.id] = name
      io.to(socket.id).emit('success')
    }
    const message = {
      message: rooms[room].players[socket.id] + ' connected',
      sentByServer: true
    }
    rooms[room].messages.push(message)
    io.to(room).emit('chat', rooms[room].messages)
    io.to(room).emit('typing', [...rooms[room].typers])
  })

  socket.on('submit', data => {
    const room = rooms[data.room]
    room.messages.push(data)
    room.typers.delete(data.name)
    io.to(data.room).emit('chat', room.messages)
  })

  socket.on('update', data => {
    const room = rooms[data.room]
    if (data.message) {
      room.typers.add(data.name)
    } else {
      room.typers.delete(data.name)
    }
    io.to(data.room).emit('typing', [...room.typers])
  })

  socket.on('disconnecting', reason => {
    console.log('yes')
    for (const room in socket.rooms) {
      if (rooms[room]) {
        rooms[room].playerCount -= 1
        const message = {
          message: rooms[room].players[socket.id] + ' disconnected',
          sentByServer: true
        }
        rooms[room].messages.push(message)
        io.to(room).emit('chat', rooms[room].messages)
        if (rooms[room].playerCount === 0) {
          setTimeout(() => delete rooms[room], 10 * 1000)
        }
      }
    }
  })
})
