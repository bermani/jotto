const express = require('express')
const socket = require('socket.io')
const fs = require('fs')

const jotto = require('./jottoGame')

const app = express()
const server = app.listen(4000, () =>
  console.log('listening to requests on port 4000')
)

app.use(express.static('public'))

const io = socket(server)

const rooms = {}

const dictionary = JSON.parse(fs.readFileSync('./wordlist.json', 'utf8'))

io.on('connection', socket => {
  console.log('made socket connection', socket.id)

  const getRoom = room => {
    room = rooms[room]
    if (!room) {
      io.to(socket.id).emit(
        'error',
        'room has been deleted due to inactivity',
        true
      )
      return null
    }
    return room
  }

  const serverMsg = (text, room) => {
    const message = {
      message: text,
      sentByServer: true
    }
    rooms[room].messages.push(message)
    io.to(room).emit('chat', rooms[room].messages)
    io.to(room).emit('typing', [...rooms[room].typers])
  }

  socket.on('join', (room, name) => {
    if (rooms[room]) {
      if (rooms[room].playerCount >= 2) {
        io.to(socket.id).emit('error', 'room is full')
        return
      }
      for (const key in rooms[room].players) {
        if (rooms[room].players[key] === name) {
          io.to(socket.id).emit(
            'error',
            'someone with that name is already in that room'
          )
          return
        }
      }
    }
    if (!rooms[room]) {
      rooms[room] = {
        messages: [],
        typers: new Set(),
        playerCount: 1,
        players: { [socket.id]: name },
        playerNumbers: { 1: name },
        jottoGame: new jotto.JottoGame()
      }
      socket.join(room)
      io.to(socket.id).emit('success', 1)
    } else {
      rooms[room].playerCount += 1
      rooms[room].players[socket.id] = name
      socket.join(room)

      const num = rooms[room].playerNumbers[1] ? 2 : 1
      rooms[room].playerNumbers[num] = name
      io.to(socket.id).emit('success', num)
      const game = rooms[room].jottoGame
      if (game.status() != 'setup') {
        io.to(socket.id).emit(
          'wordAccepted',
          num === 1 ? game.playerOneWord : game.playerTwoWord
        )
        io.to(socket.id).emit('gameReady', rooms[room].playerNumbers)
        io.to(socket.id).emit('turn', {
          status: game.status(),
          playerOneHistory: game.playerOneHistory,
          playerTwoHistory: game.playerTwoHistory,
          secretWords:
            game.status() === 'finished'
              ? [game.playerOneWord, game.playerTwoWord]
              : null
        })
      }
    }
    if (rooms[room].timeout) {
      clearTimeout(rooms[room].timeout)
      delete rooms[room].timeout
    }
    serverMsg(name + ' connected', room)
  })

  socket.on('submit', data => {
    const room = getRoom(data.room)
    if (!room) {
      return
    }
    room.messages.push(data)
    room.typers.delete(data.name)
    io.to(data.room).emit('chat', room.messages)
  })

  socket.on('update', data => {
    const room = getRoom(data.room)
    if (!room) {
      return
    }
    if (data.message) {
      room.typers.add(data.name)
    } else {
      room.typers.delete(data.name)
    }
    io.to(data.room).emit('typing', [...room.typers])
  })

  socket.on('disconnecting', reason => {
    for (const roomName in socket.rooms) {
      if (rooms[roomName]) {
        room = rooms[roomName]
        serverMsg(room.players[socket.id] + ' disconnected', roomName)
        room.playerCount -= 1
        room.typers.delete(room.players[socket.id])
        io.to(roomName).emit('typing', [...room.typers])
        delete room.playerNumbers[
          Object.keys(room.playerNumbers).find(
            key => room.playerNumbers[key] === room.players[socket.id]
          )
        ]
        delete room.players[socket.id]
        if (room.playerCount === 0) {
          room.jottoGame = new jotto.JottoGame()
          room.timeout = setTimeout(
            () => delete rooms[roomName],
            3 * 60 * 60 * 1000
          )
        }
      }
    }
  })

  //GAME

  socket.on('setSecretWord', data => {
    io.to(socket.id).emit('error', '')
    const game = rooms[data.room].jottoGame
    if (dictionary[data.word]) {
      game.setWord(data.word, data.player)
      io.to(socket.id).emit('wordAccepted', data.word)
      io.to(socket.id).emit('error', '')
      if (game.status() !== 'setup') {
        io.to(data.room).emit('gameReady', rooms[data.room].playerNumbers)
        io.to(data.room).emit('turn', {
          status: game.status(),
          playerOneHistory: [],
          playerTwoHistory: []
        })
      }
    } else {
      io.to(socket.id).emit('error', 'invalid word')
    }
  })

  socket.on('guessWord', data => {
    if (dictionary[data.word]) {
      const game = rooms[data.room].jottoGame
      if (data.player === 1) {
        game.playerOneGuessWord(data.word)
      } else {
        game.playerTwoGuessWord(data.word)
      }
      io.to(data.room).emit('turn', {
        status: game.status(),
        playerOneHistory: game.playerOneHistory,
        playerTwoHistory: game.playerTwoHistory,
        secretWords:
          game.status() === 'finished'
            ? [game.playerOneWord, game.playerTwoWord]
            : null
      })
      io.to(data.room).emit('error', '')
    } else {
      io.to(socket.id).emit('error', 'invalid word')
    }
  })

  socket.on('newGame', room => {
    rooms[room].jottoGame = new jotto.JottoGame()
    io.to(room).emit('newGameReceived')
  })
})
