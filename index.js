import express from 'express'
import path from 'path'
import { startNicehash, getNicehashStatus } from './nicehash.js'
import { startMyq, getMyqStatus } from './myq.js'


const app = express()
const __dirname = path.resolve()

const port = '9002'
const production = process.env.PRODUCTION == 'true'
let startupDelay = production ? 5000 : 0

startMyq()
startNicehash()

setTimeout(function() {
}, startupDelay);

setInterval(function() {
}, 1000)



app.get('/status', async (req, res) => {
  res.status(200).json({myq: getMyqStatus(), nh: getNicehashStatus()})
})

app.get('/test', async (req, res) => {
  res.sendStatus(200)
})

app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => {})


