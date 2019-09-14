let socket = io.connect('http://localhost:4000')

let message = document.getElementById('message'),
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
  chatWindow = document.getElementById('chat-window')

let name
let room

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
    socket.emit('join', room)
  }
})

roombox.addEventListener('keydown', e => {
  if (namebox.value && roombox.value && e.key === 'Enter') {
    error.innerHTML = ''
    name = namebox.value
    room = roombox.value
    socket.emit('join', room)
  }
})

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

socket.on('error', message => (error.innerHTML = '<h4>' + message + '</h4>'))

socket.on('success', () => {
  game.style.display = 'flex'
  find.style.display = 'none'
  info.innerHTML = '<strong>roomname: ' + room + '</strong>'
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
    feedback.innerHTML =
      '<p><em>' + data[0] + ' is typing a message...</em></p>'
  } else if (data.length > 1) {
    feedback.innerHTML =
      '<p><em>multiple people are typing a message...</em></p>'
  }
})
