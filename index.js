var WebSocketServer = require("ws").Server
var mysql = require('mysql');
var express = require('express');
var app = express();
var http = require("http");
var bodyParser = require('body-parser');

//To parse URL encoded data
app.use(bodyParser.urlencoded({ extended: false }))

//To parse json data
app.use(bodyParser.json())

var con = mysql.createConnection({
  host: "localhost",
  user: "dplyr",
  password: "dplyr",
  database: "tracking"
});

server = http.createServer(app);

app.get("/ride", async function (req, res) {
  await con.query("SELECT * FROM locations", function (err, result) {
    if (err) res.json(err);
    res.json(result)
  });
})
app.post("/ride/create", async function (req, res) {
  var rideName = req.body.rideName;
  var live = req.body.live;
  con.query(`INSERT INTO locations (rideName,live) VALUES ('${rideName}',${live});`, function (err, result) {
    if (err) res.json(err);
    res.json({ message: "Created Successfully!" })
  });
});

app.delete("/ride/delete", async function (req, res) {
  var rideId = req.body.rideId;
  con.query(`DELETE FROM locations WHERE id = ${rideId};`, function (err, result) {
    if (err) res.json(err);
    res.json({ message: "Deleted Successfully!" })
  });
});

app.post("/ride/start", async function (req, res) {
  var rideId = req.body.rideId;
  await con.query(`UPDATE locations SET live = true WHERE id = ${rideId};`, function (err, result) {
    if (err) res.json(err);
    res.json({ message: "Started Ride Successfully!" })
  });
})

app.post("/ride/stop", async function (req, res) {
  var rideId = req.body.rideId;
  await con.query(`UPDATE locations SET live = false WHERE id = ${rideId};`, function (err, result) {
    if (err) res.json(err);
    res.json({ message: "Stopped Ride Successfully!" })
  });
})



var wss = new WebSocketServer({ server: server });
wss.on('connection', function connection(ws) {
  ws.on('message', async function incoming(str) {
    var location = JSON.parse(str);
    con.query(`SELECT live FROM locations WHERE id=${location.rideId}`, async function (err,result) {
      result = JSON.stringify(result);
      result = JSON.parse(result);
      if (err) ws.send("{message:'Error'}");
      console.log(result[0])

      if(result[0].live == 1){
        await updateCoordinates(location);
        ws.send("{'message':'Success'}")
      } else {
        ws.send("{'message':'Error'}")
      }
    })
  });
});


async function updateCoordinates(location) {
  var updateLat = `UPDATE locations set lat = '${location.lat}' WHERE id = ${location.rideId};`;
  var updateLng = `UPDATE locations set lng = '${location.lng}' WHERE id = ${location.rideId};`;
  await con.query(updateLat, function (err, result) {
    if (err) throw err;
    console.log("Lat Updated!");
  });
  await con.query(updateLng, function (err, result) {
    if (err) throw err;
    console.log("Lng Updated!");
  });
}

server.listen(8080)
