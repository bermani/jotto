'use strict'
const socket = io()

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
  opponentGuessed = document.getElementById('opponent-guessed'),
  newGame = document.getElementById('new-game'),
  waitingMessage = document.getElementById('waiting-message'),
  reset = document.getElementById('reset'),
  submitSecretWord = document.getElementById('submit-secret-word'),
  submitPlayerWord = document.getElementById('submit-player-word')

const BCOLORS = ['#00000000', '#0fbb10', '#bb1010', '#bcbb11']
const COLORS = ['#000000', '#FFFFFF', '#FFFFFF', '#FFFFFF']

const letters = document.getElementsByClassName('cheat-letter')
for (const letter of letters) {
  if (!(letter.innerHTML in window.localStorage)) {
    window.localStorage.setItem(letter.innerHTML, 0)
  } else {
    const color = window.localStorage.getItem(letter.innerHTML)
    letter.style['background-color'] = BCOLORS[color]
    letter.style['color'] = COLORS[color]
  }
  letter.onclick = () => {
    const item = parseInt(window.localStorage.getItem(letter.innerHTML))
    const newColor = (item + 1) % 4
    letter.style['background-color'] = BCOLORS[newColor]
    letter.style['color'] = COLORS[newColor]
    window.localStorage.setItem(letter.innerHTML, newColor)
  }
}
window.addEventListener('storage', e => {
  const letter = document.getElementById(e.key)
  letter.style['background-color'] = BCOLORS[parseInt(e.newValue)]
  letter.style['color'] = COLORS[parseInt(e.newValue)]
})
reset.onclick = () => {
  for (const letter of letters) {
    window.localStorage.setItem(letter.innerHTML, 0)
    letter.style['background-color'] = BCOLORS[0]
    letter.style['color'] = COLORS[0]
  }
}

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

submitSecretWord.addEventListener('click', () => {
  if (secretWord.value) {
    socket.emit('setSecretWord', {
      word: secretWord.value,
      player: playerNumber,
      room
    })
  }
})

socket.on('wordAccepted', word => {
  secretWord.value = ''
  secretWord.style.display = 'none'
  submitSecretWord.style.display = 'none'
  playerSecret.innerHTML = word
  waitingMessage.innerHTML = 'waiting for opponent'
})

socket.on('gameReady', names => {
  setup.style.display = 'none'
  play.style.display = 'flex'
  opponentName.innerHTML = names[3 - playerNumber]
})

socket.on('turn', data => {
  if (data.status === 'finished') {
    playerWord.style.display = 'none'
    submitPlayerWord.style.display = 'none'
    opponentSecret.innerHTML = data.secretWords[2 - playerNumber]
    newGame.style.display = 'inline-block'
  }
  if (data.status === playerNumber) {
    playerWord.style.display = 'inline'
    submitPlayerWord.style.display = 'inline'
  } else {
    playerWord.style.display = 'none'
    submitPlayerWord.style.display = 'none'
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

submitPlayerWord.addEventListener('click', () => {
  if (playerWord.value) {
    socket.emit('guessWord', {
      word: playerWord.value,
      player: playerNumber,
      room
    })
    playerWord.value = ''
  }
})

newGame.addEventListener('click', () => {
  socket.emit('newGame', room)
})

socket.on('newGameReceived', () => {
  newGame.style.display = 'none'
  playerGuessed.innerHTML = ''
  opponentGuessed.innerHTML = ''
  setup.style.display = 'inline-block'
  play.style.display = 'none'
  secretWord.style.display = 'inline-block'
  waitingMessage.innerHTML = ''
  opponentSecret.innerHTML = '?????'
  reset.onclick()
})
