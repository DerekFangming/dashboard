import express from 'express'
import path from 'path'
import { startNicehash, getNicehashStatus, getNicehashAlerts } from './nicehash.js'
import { startMyq, getMyqStatus } from './myq.js'
import { startWeather, getWeather } from './weather.js'
import { restartMiner } from './smartthings.js'

const app = express()
const __dirname = path.resolve()

const port = '9002'
const production = process.env.PRODUCTION == 'true'

var checkPoint = {
  "hash": (Math.random() + 1).toString(36).substring(7)
}

startMyq(checkPoint, production)
startNicehash(checkPoint, production)
startWeather(checkPoint, production)

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
    res.status(200).json({checkPoint: checkPoint.hash, myq: getMyqStatus(), nh: getNicehashStatus(), weather: getWeather(), alerts: alerts})
  } else {
    res.status(200).json({})
  }
})

app.get('/test', async (req, res) => {
  restartMiner()
  res.status(200).json({})
})

app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => {})
