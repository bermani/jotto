let socket = io.connect('http://localhost:4000')

let message = document.getElementById('message'),
  name = document.getElementById('name'),
  output = document.getElementById('output'),
  button = document.getElementById('send'),
  feedback = document.getElementById('feedback')

button.addEventListener('click', () => {
  socket.emit('submit', {
    message: message.value,
    name: name.value
  })
  message.value = ''
  socket.emit('update', {
    message: message.value,
    name: name.value
  })
})

message.addEventListener('keyup', () => {
  socket.emit('update', {
    message: message.value,
    name: name.value
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
  data = data.filter(item => item !== name.value)
  feedback.innerHTML = ''
  if (data.length === 1) {
    feedback.innerHTML =
      '<p><em>' + data[0] + ' is typing a message...</em></p>'
  } else if (data.length > 1) {
    feedback.innerHTML =
      '<p><em>multiple people are typing a message...</em></p>'
  }
})
