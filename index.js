import express from 'express'
import http from 'http'
import path from 'path'
import { WebSocketServer } from 'ws'
import { startNicehash, getNicehashStatus, toggleHideAlert } from './services/nicehash.js'
import { startMyq, getMyqStatus } from './services/myq.js'
import { startWeather, getWeather } from './services/weather.js'
import { restartMiner, toggleMinorFan, startSmartthings, getSmartthingsStatus } from './services/smartthings.js'
import { startServerStatus, getServerStatus } from './services/server.js'
import { startStock, getStock } from './services/stock.js'
import { startAlerts, getAlerts } from './services/alert.js'
import { startHelium, getHeliumStatus } from './services/helium.js'
import { startTesla } from './services/tesla.js'
import { startScholar, getScholarStatus } from './services/scholar.js'
import { startCamera, test } from './services/camera.js'

import Stream from 'node-rtsp-stream'

// const stream = new Stream({
//   name: 'name',
//   streamUrl: 'rtsp://admin:wlp33cka@10.0.1.158/live',
//   wsPort: 9999,
//   ffmpegOptions: { // options ffmpeg flags
//     '-stats': '', // an option with no neccessary value uses a blank string
//     '-r': 30 // options with required values specify the value after the key
//   }
// })

const app = express()
const server = http.createServer()
const __dirname = path.resolve()

app.get('/test1', async (req, res) => {
  test()
  res.status(200).json({})
})

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

  let merged = {...getMyqStatus(), ...getNicehashStatus(), ...getWeather(), ...getServerStatus(), ...getStock(),
    ...getAlerts(), ...getSmartthingsStatus(), ...getHeliumStatus(), ...getScholarStatus()}
  client.send(JSON.stringify(merged))

  client.on('message', function message(data) {
    let message = `${data}`

    if (message == 'heatbeat') {
      client.heatbeat = new Date()
    } else if (message == 'restartMiner') {
      restartMiner()
    } else if (message == 'toggleMinorFan') {
      toggleMinorFan()
    } else if (message == 'toggleHideAlert') {
      toggleHideAlert()
    }
  })
})

startMyq(notifyClients, production)
startWeather(notifyClients, production)
startServerStatus(notifyClients, production)
startStock(notifyClients, production)
startAlerts(notifyClients)
startNicehash(notifyClients, production)
startSmartthings(notifyClients, production)
startHelium(notifyClients, production)
startScholar(notifyClients)
startCamera(production)


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

app.get('/test', async (req, res) => {
  res.status(200).json({})
})

app.use(express.static(path.join(__dirname, 'public')))

server.listen(port, function() {
  console.log(`Dashboard app started on port ${port}`)
})
