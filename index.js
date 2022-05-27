import express from 'express'
import http from 'http'
import path from 'path'
import { WebSocketServer } from 'ws'
import { startNicehash, getNicehashStatus, getNicehashAlerts } from './nicehash.js'
import { startMyq, getMyqStatus } from './myq.js'
import { startWeather, getWeather } from './weather.js'
import { restartMiner, toggleMinorFan } from './smartthings.js'
import { startServerStatus, getServerStatus } from './server.js'
import { startStock, getStock } from './stock.js'
import { startAlerts } from './alert.js'

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

    if (message == 'heatbeat') {
      client.heatbeat = new Date()
    }
  })
})

// startMyq(notifyClients, production)
startNicehash(notifyClients, production)
// startWeather(notifyClients, production)
startServerStatus(notifyClients, production)
startStock(notifyClients, production)
startAlerts(notifyClients)

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


var turn = true

app.get('/test', async (req, res) => {
  toggleMinorFan(turn)
  turn = !turn
  res.status(200).json({})
})

app.use(express.static(path.join(__dirname, 'public')))

server.listen(port, function() {})
