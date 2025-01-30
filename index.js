import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
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
import { startCamera, restartLiveStream, restartTest } from './services/camera.js'
import { startGreencard, getGreencardStatus } from './services/greencard.js'
import { startZillow, getZillowStatus } from './services/zillow.js'
import { getAlexaStatus, startAlexa, setAlexaCode } from './services/alexa.js'
import psList from 'ps-list'
import os from 'os-utils'
import * as cp from 'child_process'

const app = express()
app.use(bodyParser.json({limit: '100mb'}), cors())
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

  let merged = {...getMyqStatus(), ...getWeather(), ...getServerStatus(), ...getStock(),
    ...getAlerts(), ...getScholarStatus(), ...getGreencardStatus(), ...getZillowStatus(), ...getAlexaStatus()}
  client.send(JSON.stringify(merged))

  client.on('message', function message(data) {
    let message = `${data}`

    if (message == 'heatbeat') {
      client.heatbeat = new Date()
    } else if (message == 'restartLiveStream') {
      restartLiveStream()
    }
  })
})
// =============== Deprecated services ===============
// startNicehash(notifyClients, production)
// startHelium(notifyClients, production)
// startSmartthings(notifyClients, production)
// startMyq(notifyClients, production)

// =============== Active services ===============
startWeather(notifyClients, production)
startServerStatus(notifyClients, production)
startStock(notifyClients, production)
startAlerts(notifyClients)
startScholar(notifyClients)
startCamera(production)
startGreencard(notifyClients, production)
startZillow(notifyClients, production)
startAlexa(notifyClients)


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

app.post('/api/alexa', async (req, res) => {
  setAlexaCode(req.body.code)
  res.status(200).json({})
})

app.get('/test', async (req, res) => {
  // notifyClients({notification: "messages op: " + req.query.op})

  console.log(await psList())
  res.status(200).json({})
})

app.get('/testProcesses', async (req, res) => {
  res.status(200).json((await psList()).sort((a, b) => a.memory > b.memory ? -1 : 1))
})

app.get('/testMem', async (req, res) => {
  res.status(200).json({
    total: os.totalmem(),
    free: os.freemem()
  })
})

app.get('/testCmd/:cmd', async (req, res) => {
  let cmd = req.params.cmd
  try {
    let result = cp.execSync(cmd).toString()

    res.status(200).json({
      cmd: cmd,
      result: result
    })
  } catch (e) {
    res.status(200).json({
      cmd: cmd,
      error: e.toString()
    })
  }
  
})

app.post('/testJson', async (req, res) => {
  notifyClients({notification: req.body})
  res.status(200).json({})
})

app.use(express.static(path.join(__dirname, 'public')))

server.listen(port, function() {
  console.log(`Dashboard app started on port ${port}`)
})
