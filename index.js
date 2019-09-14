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
  socket.on('join', room => {
    if (!rooms[room]) {
      socket.join(room)
      rooms[room] = {
        messages: [],
        typers: new Set(),
        players: 1
      }
      io.to(socket.id).emit('success')
    } else if (rooms[room].players === 2) {
      io.to(socket.id).emit('error', 'room is full')
    } else {
      socket.join(room)
      rooms[room].players = 2
      io.to(socket.id).emit('success')
      io.to(room).emit('chat', rooms[room].messages)
      io.to(room).emit('typing', [...rooms[room].typers])
    }
    console.log(rooms[room])
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
})
