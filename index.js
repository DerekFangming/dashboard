import express from 'express'
import path from 'path'
import { startNicehash, getNicehashStatus } from './nicehash.js'
import { startMyq, getMyqStatus } from './myq.js'
import { startWeather, getWeather } from './weather.js'

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

setInterval(function() {
  if (alerts == undefined) {
    alerts = {
      "level": "alert",
      "msg": "Tash can needs to be colected"
    }
  } else {
    alerts = undefined
  }
}, 10000)

app.get('/status', async (req, res) => {
  if (req.query.checkPoint == undefined || req.query.checkPoint != checkPoint.hash) {
    res.status(200).json({checkPoint: checkPoint.hash, myq: getMyqStatus(), nh: getNicehashStatus(), weather: getWeather(), alerts: alerts})
  } else {
    res.status(200).json({})
  }
})

app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => {})
