// PixiJS Setup
const app = new PIXI.Application({
    width: window.innerWidth, height: window.innerHeight, backgroundColor: 0x000000, resolution: window.devicePixelRatio || 1,
});

// Functions
function isInt(value) {
    var x;
    if (isNaN(value)) {
      return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}

// Main Canvas
main_canvas = document.getElementById("main_canvas")    

main_canvas.appendChild(app.view);

const container = new PIXI.Container();

app.stage.addChild(container);

// Make things interactive
app.stage.interactive = true;

// Create grid background
big_square = new PIXI.Graphics();

big_square.interactive = true;

// Background moving function for faking "camera"
function onBackgroundClick(event) {
    this.dragging = true;
    this.mouse_origin = event.data.getLocalPosition(this.parent);
    this.data = event.data;
    this.origin_x = this.x;
    this.origin_y = this.y;
}

function onBackgroundDrag() {
    if (this.dragging) {
        let x = this.origin_x - (this.mouse_origin.x - this.data.getLocalPosition(this.parent).x)*1;
        let y = this.origin_y - (this.mouse_origin.y - this.data.getLocalPosition(this.parent).y)*1;
        this.x = Math.max(Math.min(x, 200), -this.width);
        this.y = Math.max(Math.min(y, 200), -this.height);
    }
}

function onBackgroundUnclick(object) {
    object.dragging = false;
}

// Adding functions to the square
big_square.on('pointerdown', onBackgroundClick);
big_square.on('pointermove', onBackgroundDrag);
big_square.on('pointerup', (event) => onBackgroundUnclick(big_square));
big_square.on('pointerupoutside', (event) => onBackgroundUnclick(big_square));

// Define Grid Variables/Objects

vw = document.getElementById("main_canvas").clientWidth / 100;

let case_size = vw * 2.5;
let gap = vw / 2;
let grid_size = 50;

let grid_x = 0;
let grid_y = 0;

// Define 'Number of Squares Left' Variables/Objects
let nb_square;

let nb_square_navbar = document.getElementById("nb_square_navbar")
let display_chunk_navbar = document.getElementById("display_chunk_navbar")

// Drawing background
big_square.beginFill(0xF5F5F5);
big_square.drawRect(0, 0, case_size*grid_size + gap, case_size*grid_size + gap);
big_square.endFill();

// Moving the background so "camera" appear nearly in the middle of the screen
big_square.x -= 500;
big_square.y -= 500;

// Add the background to the stage
app.stage.addChild(big_square);

// drawSquare Function, draw a square on (pos_x, pos_y) coordinates, considering a square size (case_size) and a gap between squares (gap)
function drawSquare(pos_x, pos_y, case_size, gap) {
    // Graphic Setup
    const graphics = new PIXI.Graphics();

    // Make it interactive
    graphics.interactive = true;

    // To do when clicking on square
    const onClick = function(object) {
        data_to_send = '{' +
        `"grid_x": ${grid_x},` +
        `"grid_y": ${grid_y},` +
        `"square_x": ${pos_x},` +
        `"square_y": ${pos_y}` +
        '}';

        // Sending event to server
        socket.emit('destroyed_square', data_to_send);

        // Destroying the square
        object.destroy();
    }

    // Add Event
    graphics.on('pointerdown', (event) => onClick(graphics));

    // Draw Square
    graphics.beginFill(0xAA000A);
    graphics.drawRect(pos_x*case_size + gap, pos_y*case_size + gap, case_size - gap, case_size - gap);
    graphics.endFill();

    // Add it to the stage
    big_square.addChild(graphics);
}

// Create variables for communicating with server
let data_received;
let data_type;
let data_to_send;
let chunk_received;

// Function that check if coordinates are in JSON file
function IsSquareIn(x, y, json_array) {
    for (i = 0; i < json_array.length; i++) {
        if (x == json_array[i].x) {
            if (y == json_array[i].y) {
                return true;
            }
        }
    }
    return false;
}

// Create WebSocket connection with https://www.breakallsquares.com
const socket = io("https://www.breakallsquares.com", {
  reconnectionDelayMax: 10000,
  auth: {
    token: "123"
  }
});

// On connection
socket.on("connect", () => {
    data_to_send = '{' +
        `"grid_random": 1` +
    '}';

    socket.emit('ask_square')
    socket.emit('ask_random_chunk', data_to_send);
});

// On Chunk Received
socket.on('chunk_grid', function(data) {
    chunk_received = data; // Store chunk

    big_square.removeChildren();

    // Draw Grid
    for (y = 0; y < grid_size; y++) {
        for (x = 0; x < grid_size; x++) {
            if (!IsSquareIn(x, y, chunk_received)) {
                drawSquare(x, y, case_size, gap);
            }
        }
    }

    display_chunk_navbar.innerHTML = `You're in chunk : ${grid_x} ; ${grid_y}`

    socket.emit("ask_square")
});

// On Number of Squares changed
socket.on('nb_square_changed', function(data) {
    nb_square = data
    nb_square_navbar.innerHTML = `Squares Left : ${nb_square}`
});

// Random Chunk Coordinates received
socket.on('random_chunk', function(data) {
    grid_x = data.x
    grid_y = data.y

    display_chunk_navbar.innerHTML = `You're in chunk : ${grid_x} ; ${grid_y}`
});

function OnRandomChunk() {
    socket.emit('ask_random_chunk')
}




// Select Form Button (Asking for a specific chunk)
button_form = document.getElementById("form_input_button");

let search_x;
let search_y;

// Set its event
button_form.addEventListener("click", function() {
    search_x = document.getElementById("form_input_text_x").value;
    search_y = document.getElementById("form_input_text_y").value;

    if (isInt(search_x) && isInt(search_y)) {
        if (search_x >= 0 && search_x < 633) {
            if (search_y >= 0 && search_y < 633) {
                data_to_send = '{' +
                    `"grid_x": ${search_x},` +
                    `"grid_y": ${search_y}` +
                '}';
        
                grid_x = search_x;
                grid_y = search_y;
        
                socket.emit('ask_chunk', data_to_send);
            }
        }
    }
}, false);
