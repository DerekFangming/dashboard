import { myQApi } from "@hjdhjd/myq"
import express from 'express'
import path from 'path'
import axios from "axios"
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

const myq = new myQApi('synfm123@gmail.com', process.env.MYQ_PASSWORD)
const app = express()
const __dirname = path.resolve()

const port = '9002'
const production = process.env.PRODUCTION == 'true'
let startupDelay = production ? 5000 : 0

var garageState = 'unknown'
var garageStateSince = new Date().toISOString()

var nhBtcBalance = 0.0
var nhUsdBalance = 0.0

var startDashboard = function() {
  
  nicehash('/main/api/v2/accounting/accounts2', 'fiat=USD').then(function (response) {
    // let btcBalance = response.data.total.totalBalance
    // console.log(btcBalance)
    let btc = response.data.currencies.filter(c => c.currency == 'BTC')
    if (btc.length == 1) {
      // console.log(btc[0].totalBalance)
      // console.log(btc[0].fiatRate)
      nhBtcBalance = parseFloat(btc[0].totalBalance)
      nhUsdBalance = nhBtcBalance * btc[0].fiatRate
      console.log(nhUsdBalance)
    }
  }).catch(function (error) {
    console.log(error);
    console.log('Failed');
  });
}

setTimeout(function() {
  // console.log(22)
  startDashboard()
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
  //console.log(11)
}, 5000) // 30 minutes 1800000

function nicehash(url, query = undefined) {
  let time = '' + Date.now()
  let nonce = uuidv4()

  var authBuf =  Buffer.concat([new Buffer.from(process.env.NH_API_KEY), new Buffer.alloc(1)])
  authBuf = Buffer.concat([authBuf, new Buffer.from(time), new Buffer.alloc(1)])
  authBuf = Buffer.concat([authBuf, new Buffer.from(nonce), new Buffer.alloc(1), new Buffer.alloc(1)])
  authBuf = Buffer.concat([authBuf, new Buffer.from(process.env.NH_ORG_ID), new Buffer.alloc(1), new Buffer.alloc(1)])
  authBuf = Buffer.concat([authBuf, new Buffer.from('GET'), new Buffer.alloc(1)])
  authBuf = Buffer.concat([authBuf, new Buffer.from(url), new Buffer.alloc(1)])
  if (query != undefined) authBuf = Buffer.concat([authBuf, new Buffer.from(query)])

  let auth = crypto.createHmac('sha256', process.env.NH_API_SECRET).update(authBuf).digest('hex')

  let fullUrl = query == undefined ? 'https://api2.nicehash.com' + url : 'https://api2.nicehash.com' + url + '?' + query
  return axios.get(fullUrl, {
    headers: {
      'x-time': time,
      'x-nonce': nonce,
      'x-organization-id': process.env.NH_ORG_ID,
      'x-request-id': uuidv4(),
      'x-auth': process.env.NH_API_KEY + ':' + auth
    }
  })
}

app.get('/status', async (req, res) => {
  res.status(200).json({garageState: garageState, garageStateSince: garageStateSince})
})

app.get('/test', async (req, res) => {
  res.sendStatus(200)
})

app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => {})


