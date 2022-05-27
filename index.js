import express from 'express'
import http from 'http'
import path from 'path'
import WebSocket, { WebSocketServer } from 'ws'
import { startNicehash, getNicehashStatus, getNicehashAlerts } from './nicehash.js'
import { startMyq, getMyqStatus } from './myq.js'
import { startWeather, getWeather } from './weather.js'
import { restartMiner, toggleMinorFan } from './smartthings.js'
import { startServerStatus, getServerStatus } from './server.js'
import { startStock, getStock } from './stock.js'

const app = express()
const server = http.createServer()
const __dirname = path.resolve()

let clients = []

const port = '9002'
const production = process.env.PRODUCTION == 'true'
const clientTimeoutLimit = 180000



const wss = new WebSocketServer({
  server: server
})

server.on('request', app)



wss.on('connection', function connection(client) {
  client.heatbeat = new Date()
  clients.push(client)

  let merged = {...getMyqStatus(), ...getNicehashStatus(), ...getWeather(), ...getServerStatus(), ...getStock()}
  client.send(JSON.stringify(merged))

  client.on('message', function message(data) {
    let message = `${data}`
    // console.log(`${data}`)

    if (message == 'heatbeat') {
      client.heatbeat = new Date()
    }
  })
})



var checkPoint = {
  "hash": (Math.random() + 1).toString(36).substring(7)
}

// startMyq(notifyClients, production)
startNicehash(notifyClients, production)
// startWeather(notifyClients, production)
startServerStatus(notifyClients, production)
startStock(notifyClients, production)

function notifyClients(msg) {
  clients = clients.filter(c => {
    if (new Date() - c.heatbeat > clientTimeoutLimit) {
      c.close()
      return false
    }

    // Send message
    c.send(JSON.stringify(msg))
    return true
  })
}

var alerts
// Check every 5 seconds for alerts
setInterval(function() {
  let tempAlerts = getNicehashAlerts()
  if (alert) tempAlerts.push(alert)
  alerts = tempAlerts.length == 0 ? undefined : tempAlerts
}, 5000)

// Check hourly for trash collection
var alert
setInterval(function() {

  let bothWendesday = new Date(1646805600000)
  let now = new Date()

  if (now.getDay() == 3 && now.getHours() > 12) {
    const diff = Math.floor(Math.ceil(Math.abs(now - bothWendesday) / 86400000) / 7)
    if (diff % 2 == 0) {
      alert = {
        "level": "info",
        "msg": "Both trash and recycle will be collected tomorrow"
      }
    } else {
      alert = {
        "level": "info",
        "msg": "Trash will be collected tomorrow"
      }
    }
  } else {
    alert = undefined
  }
}, 3600000)

app.get('/status', async (req, res) => {
  if (req.query.checkPoint == undefined || req.query.checkPoint != checkPoint.hash) {
    res.status(200).json({checkPoint: checkPoint.hash, myq: getMyqStatus(), nh: getNicehashStatus(), weather: getWeather(), server: getServerStatus(), alerts: alerts})
  } else {
    res.status(200).json({})
  }
})

var turn = true

app.get('/test', async (req, res) => {
  toggleMinorFan(turn)
  turn = !turn
  res.status(200).json({})
})

app.use(express.static(path.join(__dirname, 'public')))

server.listen(port, function() {
  // console.log(111)
  // let a = {abc: 'abc'}
  // let b = {haha: 'haha'}
  // let merged = {...a, ...b};
  // console.log(merged)
})
