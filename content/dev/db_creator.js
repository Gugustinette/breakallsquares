// Create mysql
const mysql = require('mysql');

// Create MySQL Database Connection
const db = mysql.createConnection({

    host: "localhost",

    user: "root",

    password: "just_password",

    database : "break"

});

// Connect to MySQL Database
db.connect(function(err) {

    if (err) throw err;

    let x
    let y

    for (x = 0; x < 300; x++) {
        for (y = 0; y < 300; y++) {
            db.query("CREATE TABLE chunk_?_? (x INT, y INT, PRIMARY KEY(x, y))", [x,y]);

            db.query("INSERT INTO chunk VALUES (?, ?, false, 2500)", [x,y]);

            console.log("Chunk : " + x + " ; " + y)
        }
    }

});