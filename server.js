// Create the app
const { debug } = require('console');
const express = require('express');
const app = express();

// Importing fs to write json file
var fs = require('fs');

// Create Server
const server = require('http').createServer(app);

// Importing Sockets
const options = { /* ... */ };
const io = require('socket.io')(server, options);

// Importing MySQL
const mysql = require('mysql');

// Let the app uses static web environnement
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    // Send the main website page
  res.sendFile(__dirname + '/index.html');
});

// Variables
let data_received; // JSON sent to Client
let data_to_send; // JSON received from Client

let nb_square; // Init : 1001722500

let nb_square_json = {} // JSON wrote in nb_square.json (storing total number of squares left)

// Read the total number of squares left on start (Should be 1 001 722 500 initially)
fs.readFile('nb_square.json', function(err,content){
  let parseJson = JSON.parse(content)

  nb_square = parseJson.nb_square
})

// Create MySQL Pool
let pool = mysql.createPool({
  connectionLimit : 1000, // default : 10
  host            : 'host',
  user            : 'user',
  password        : '123',
  database        : 'db'
});

// Functions

// Random Int Function, gives a random number between 0 and max
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// IsInt Function, tells if given variable is an int
function isInt(value) {
  var x;
  if (isNaN(value)) {
    return false;
  }
  x = parseFloat(value);
  return (x | 0) === x;
}

// IsValid Function, tells if given variable is a number, between min and max
function isValid(value, min, max) {
  return (isInt(value) && value >= min && value <= max)
}

// Setting up connexions
io.on("connection", (socket) => {

  socket.on('ask_chunk', (data) => { // Client asking for a specific chunk

    data_received = JSON.parse(data)

    // Check if client sent integers
    if (isValid(data_received['grid_x'], 0, 632) && isValid(data_received['grid_y'], 0, 632)) {
      // Connect to MySQL Database
      pool.getConnection(function (err, db) {

        if (err) throw err;

        // Select the chunk asked by client
        db.query("SELECT * FROM chunk_?_?", [
          data_received['grid_x'],
          data_received['grid_y']
        ], function (err, result) {
          db.release();
          if (err) throw err;

          data_to_send = result

          socket.emit('chunk_grid', data_to_send);

        });

      });

      list_room = [...socket.rooms];

      socket.leave(list_room[1]);
      socket.join(`chunk_${data_received['grid_x']}_${data_received['grid_y']}`);
    }
  });

  socket.on('ask_random_chunk', (data) => { // Client asking for a random chunk

    // Connect to MySQL Database
    pool.getConnection(function (err, db) {

      if (err) throw err;

      // Get a random chunk which isn't completed
      db.query("SELECT * FROM chunk WHERE completed = 0", function (err, result) {

        if (err) throw err;

        chunk_selected = getRandomInt(result.length)

        chunk_to_get = result[chunk_selected]

        // Send chunk coordinates to client
        socket.emit('random_chunk', chunk_to_get)

        // Select the chunk database
        db.query("SELECT * FROM chunk_?_?", [
          chunk_to_get.x,
          chunk_to_get.y
        ], function (err, result) {
          db.release();
          if (err) throw err;

          data_to_send = result

          // Send chunk squares to client
          socket.emit('chunk_grid', data_to_send);

        });

        // Manage rooms for client
        list_room = [...socket.rooms];

        socket.leave(list_room[1]);
        socket.join(`chunk_${chunk_to_get.x}_${chunk_to_get.y}`);
      });

    });
  });

  socket.on('destroyed_square', (data) => { // Client destroyed square

    data_received = JSON.parse(data);

    // Check if client sent integers
    if (isValid(data_received['grid_x'], 0, 632) && isValid(data_received['grid_y'], 0, 632) && isValid(data_received['square_x'], 0, 49) && isValid(data_received['square_y'], 0, 49)) {
      // Connect to MySQL Database
      pool.getConnection(function (err, db) {
    
        if (err) throw err

        // Add the square to wanted chunk table, so it is considered as destroyed on the server
        db.query("INSERT IGNORE INTO chunk_?_? VALUES (?, ?);", [
          data_received['grid_x'],
          data_received['grid_y'],
          data_received['square_x'],
          data_received['square_y']
        ], function (err, result) {

          if (err) throw err

        });

        // Re-send the chunk to every client on room
        db.query("SELECT * FROM chunk_?_?", [
          data_received['grid_x'],
          data_received['grid_y']
        ], function (err, result) {

          if (err) throw err;

          data_to_send = result;

          io.to(`chunk_${data_received['grid_x']}_${data_received['grid_y']}`).emit('chunk_grid', data_to_send)
        });

        // Update number of squares in chunk
        db.query("UPDATE chunk SET nb_square_left = nb_square_left - 1 WHERE chunk.x = ? AND chunk.y = ?", [
          data_received['grid_x'],
          data_received['grid_y'] 
        ], function (err, result) {});

        // Update "completed" value
        db.query("CALL reload_chunk()", function (err, result) {
          db.release();
        });

      });

      // Change number of square
      nb_square -= 1

      nb_square_json.nb_square = nb_square

      fs.writeFile("nb_square.json", JSON.stringify(nb_square_json), function(err) {
        if (err) throw err
        }
      );

      io.emit('nb_square_changed', nb_square)
    }
  });

  socket.on('ask_square', (data) => { // Client asking for number of square
    socket.emit('nb_square_changed', nb_square)
  });
});

// Setting up the server to listen on port 8080
server.listen(8080)