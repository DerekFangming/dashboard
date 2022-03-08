import express from 'express'
import path from 'path'
import { startNicehash, getNicehashStatus } from './nicehash.js'
import { startMyq, getMyqStatus } from './myq.js'
import { startWeather, getWeather } from './weather.js'

const app = express()
const __dirname = path.resolve()

const port = '9002'
const production = process.env.PRODUCTION == 'true'

startMyq()
startNicehash()
startWeather()

app.get('/status', async (req, res) => {
  res.status(200).json({myq: getMyqStatus(), nh: getNicehashStatus(), weather: getWeather()})
})

app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => {})


