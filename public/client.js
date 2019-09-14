let socket = io.connect('http://localhost:4000')

let message = document.getElementById('message'),
  namebox = document.getElementById('name'),
  output = document.getElementById('output'),
  send = document.getElementById('send'),
  feedback = document.getElementById('feedback'),
  game = document.getElementById('game'),
  roombox = document.getElementById('room'),
  find = document.getElementById('find'),
  join = document.getElementById('join')

let name
let room

join.addEventListener('click', () => {
  if (roombox.value && namebox.value) {
    name = namebox.value
    room = roombox.value
    game.style.display = 'inline'
    find.style.display = 'none'

    socket.emit('join', room)
  }
})

send.addEventListener('click', () => {
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
    output.innerHTML +=
      '<p><strong>' + message.name + ':</strong> ' + message.message + '</p>'
  })
})

socket.on('typing', data => {
  data = data.filter(item => item !== name)
  feedback.innerHTML = ''
  if (data.length === 1) {
    feedback.innerHTML =
      '<p><em>' + data[0] + ' is typing a message...</em></p>'
  } else if (data.length > 1) {
    feedback.innerHTML =
      '<p><em>multiple people are typing a message...</em></p>'
  }
})
