// Create variables for communicating with server
let nb_square

let nb_square_display = document.getElementById("nb_square_display")

// Create WebSocket connection at https://www.breakallsquares.com
const socket = io("https://www.breakallsquares.com", {
  reconnectionDelayMax: 10000,
  auth: {
    token: "123"
  }
});

// On connection
socket.on("connect", () => {
    socket.emit('ask_square')
});

// On Number of Squares changed
socket.on('nb_square_changed', function(data) {
    nb_square = data
    nb_square_display.innerHTML = `${nb_square}`
});