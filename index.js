const express = require('express')
const socket = require('socket.io')

const app = express()
const server = app.listen(4000, () =>
  console.log('listening to requests on port 4000')
)

app.use(express.static('public'))

const io = socket(server)

const messages = []
let typers = new Set()

io.on('connection', socket => {
  console.log('made socket connection', socket.id)
  socket.emit('chat', messages)
  socket.emit('typing', [...typers])

  socket.on('submit', data => {
    messages.push(data)
    typers.delete(data.name)
    io.sockets.emit('chat', messages)
  })

  socket.on('update', data => {
    if (data.message) {
      typers.add(data.name)
    } else {
      typers.delete(data.name)
    }
    io.sockets.emit('typing', [...typers])
  })
})
