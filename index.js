import { myQApi } from "@hjdhjd/myq"
import express from 'express'
import path from 'path'
import { startNicehash, getNicehashStatus } from './nicehash.js'

const myq = new myQApi('synfm123@gmail.com', process.env.MYQ_PASSWORD)
const app = express()
const __dirname = path.resolve()

const port = '9002'
const production = process.env.PRODUCTION == 'true'
let startupDelay = production ? 5000 : 0

var garageState = 'unknown'
var garageStateSince = new Date().toISOString()

// console.log(getUsdBalance())
startNicehash()

// startNicehash.startNicehash()


setTimeout(function() {
  // console.log(22)
  //startDashboard()
}, startupDelay);

// MyQ
setInterval(function() {
  // myq.refreshDevices().then(e => {
  //   let device = myq.getDevice('CG08503460EE')
  //   if (device != null) {
  //     garageState = device.state.door_state
  //     garageStateSince = device.state.last_update
  //   } else {
  //     garageState = 'unknown'
  //     garageStateSince = new Date().toISOString()
  //   }
  // })
}, 5000)

setInterval(function() {
  console.log(getNicehashStatus())
}, 1000) // 30 minutes 1800000



app.get('/status', async (req, res) => {
  res.status(200).json({garageState: garageState, garageStateSince: garageStateSince, nh: getNicehashStatus()})
})

app.get('/test', async (req, res) => {
  res.sendStatus(200)
})

app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => {})


