var ws = require("nodejs-websocket")
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "TrackingWebSocket"
});


ws.createServer(function (conn) {
    console.log("New connection")
    conn.on("text", async function (str) {
        var location = JSON.parse(str);
            console.log("Connected!");
            var sql = `INSERT INTO locations (lat, lng) VALUES ('${location.lat}', '${location.lng}')`;
            await con.query(sql, function (err, result) {
              if (err) throw err;
              console.log("1 record inserted");
            });
          
        conn.sendText("Saved!")
    })
    conn.on("close", function (code, reason) {
        console.log("Connection closed")
    })
}).listen(8000)