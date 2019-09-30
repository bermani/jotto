const socket = io.connect('http://localhost:4000', { secure: true })

const message = document.getElementById('message'),
  namebox = document.getElementById('name'),
  output = document.getElementById('output'),
  send = document.getElementById('send'),
  feedback = document.getElementById('feedback'),
  game = document.getElementById('game'),
  roombox = document.getElementById('room'),
  find = document.getElementById('find'),
  join = document.getElementById('join'),
  error = document.getElementById('error'),
  info = document.getElementById('info'),
  chatWindow = document.getElementById('chat-window'),
  secretWord = document.getElementById('secret-word'),
  setup = document.getElementById('setup'),
  play = document.getElementById('play'),
  playerSecret = document.getElementById('player-secret'),
  opponentSecret = document.getElementById('opponent-secret'),
  playerName = document.getElementById('player-name'),
  opponentName = document.getElementById('opponent-name'),
  playerWord = document.getElementById('player-word'),
  playerGuessed = document.getElementById('player-guessed'),
  opponentGuessed = document.getElementById('opponent-guessed')

let name
let room
let playerNumber

join.addEventListener('click', () => {
  error.innerHTML = ''
  name = namebox.value
  room = roombox.value
  if (roombox.value && namebox.value) {
    socket.emit('join', room, name)
  }
})

namebox.addEventListener('keydown', e => {
  if (namebox.value && roombox.value && e.key === 'Enter') {
    error.innerHTML = ''
    name = namebox.value
    room = roombox.value
    socket.emit('join', room, name)
  }
})

roombox.addEventListener('keydown', e => {
  if (namebox.value && roombox.value && e.key === 'Enter') {
    error.innerHTML = ''
    name = namebox.value
    room = roombox.value
    socket.emit('join', room, name)
  }
})

socket.on('error', (message, redirect) => {
  error.innerHTML = '<h4>' + message + '</h4>'
  if (redirect) {
    setTimeout(location.reload, 500)
  }
})

socket.on('success', num => {
  playerName.innerHTML = name
  info.innerHTML = '<strong>roomname: ' + room + '</strong>'
  game.style.display = 'flex'
  find.style.display = 'none'
  playerNumber = num
})

// CHAT

send.addEventListener('click', () => {
  if (message.value) {
    socket.emit('submit', {
      message: message.value,
      name,
      room
    })
    message.value = ''
    socket.emit('update', {
      message: message.value,
      name,
      room
    })
  }
})

message.addEventListener('keydown', e => {
  if (message.value && e.key === 'Enter') {
    socket.emit('submit', {
      message: message.value,
      name,
      room
    })
    message.value = ''
    socket.emit('update', {
      message: message.value,
      name,
      room
    })
  }
})

message.addEventListener('keyup', () => {
  socket.emit('update', {
    message: message.value,
    name,
    room
  })
})

socket.on('chat', data => {
  output.innerHTML = ''
  data.forEach(message => {
    output.innerHTML += message.sentByServer
      ? '<span style="color: grey"><em>' + message.message + '</em></span><br/>'
      : '<span><strong>' +
        message.name +
        ':</strong> ' +
        message.message +
        '</span><br/>'
  })
  chatWindow.scrollTop = chatWindow.scrollHeight
})

socket.on('typing', data => {
  data = data.filter(item => item !== name)
  feedback.innerHTML = ''
  if (data.length === 1) {
    feedback.innerHTML = '<em>' + data[0] + ' is typing a message...</em>'
  } else if (data.length > 1) {
    feedback.innerHTML = '<em>multiple people are typing a message...</em>'
  }
})

// GAME

secretWord.addEventListener('keydown', e => {
  if (secretWord.value && e.key === 'Enter') {
    socket.emit('setSecretWord', {
      word: secretWord.value,
      player: playerNumber,
      room
    })
  }
})

socket.on('wordAccepted', word => {
  playerSecret.innerHTML = word
  setup.innerHTML = 'waiting for opponent'
})

socket.on('gameReady', names => {
  setup.style.display = 'none'
  play.style.display = 'flex'
  opponentName.innerHTML = names[3 - playerNumber]
})

socket.on('turn', data => {
  if (data.status === 'finished') {
    playerWord.style.display = 'none'
    opponentSecret.innerHTML = data.secretWords[2 - playerNumber]
  }
  if (data.status === playerNumber) {
    playerWord.style.display = 'inline'
  } else {
    playerWord.style.display = 'none'
  }
  playerGuessed.innerHTML = ''
  data.playerOneHistory.forEach(guess => {
    playerGuessed.innerHTML =
      guess.guess +
      ': ' +
      guess.count.toString() +
      '<br>' +
      playerGuessed.innerHTML
  })
  opponentGuessed.innerHTML = ''
  data.playerTwoHistory.forEach(guess => {
    opponentGuessed.innerHTML =
      guess.guess +
      ': ' +
      guess.count.toString() +
      '<br>' +
      opponentGuessed.innerHTML
  })
  let temp
  if (playerNumber === 2) {
    temp = playerGuessed.innerHTML
    playerGuessed.innerHTML = opponentGuessed.innerHTML
    opponentGuessed.innerHTML = temp
  }
})

playerWord.addEventListener('keydown', e => {
  if (playerWord.value && e.key === 'Enter') {
    socket.emit('guessWord', {
      word: playerWord.value,
      player: playerNumber,
      room
    })
    playerWord.value = ''
  }
})
