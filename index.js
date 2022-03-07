import express from 'express'
import path from 'path'
import { startNicehash, getNicehashStatus } from './nicehash.js'
import { startMyq, getMyqStatus } from './myq.js'


const app = express()
const __dirname = path.resolve()

const port = '9002'
const production = process.env.PRODUCTION == 'true'
let startupDelay = production ? 5000 : 0


// startMyq()
startNicehash()

// startNicehash.startNicehash()


setTimeout(function() {
  // console.log(22)
  //startDashboard()
}, startupDelay);

// MyQ
setInterval(function() {
}, 5000)

setInterval(function() {
  // console.log(getNicehashStatus())
}, 1000) // 30 minutes 1800000



app.get('/status', async (req, res) => {
  res.status(200).json({myq: getMyqStatus(), nh: getNicehashStatus()})
})

app.get('/test', async (req, res) => {
  res.sendStatus(200)
})

app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => {})


