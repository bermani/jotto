const express = require('express')
const socket = require('socket.io')

const app = express()
const server = app.listen(4000, () =>
  console.log('listening to requests on port 4000')
)

app.use(express.static('public'))

const io = socket(server)

const rooms = {}
const messages = []
let typers = new Set()

io.on('connection', socket => {
  console.log('made socket connection', socket.id)
  socket.on('join', room => {
    socket.join(room)
    if (!rooms[room]) {
      rooms[room] = {
        messages: [],
        typers: new Set()
      }
    }
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
})
