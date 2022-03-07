import axios from "axios"
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

var btc = 0.0
var usd = 0.0

var minor = {status: 'STOPPED', speed: 0, devices:[]}
var desltop = {status: 'STOPPED', speed: 0, devices:[]}

export function getNicehashStatus() {
  return {
    btc: btc,
    usd: usd,
    minor: minor,
    desltop: desltop
  }
}

export function startNicehash() {
  // Get balance every hour
  getBalance()
  setInterval(function() {
    getBalance()
  }, 3600000)

  // Get status every 15 seconds
  getRigStatus()
  setInterval(function() {
    getRigStatus()
  }, 15000)

}

function getBalance() {
  callNicehash('/main/api/v2/accounting/accounts2', 'fiat=USD').then(function (response) {
    let btcBalance = response.data.currencies.filter(c => c.currency == 'BTC')
    if (btcBalance.length == 1) {
      btc = parseFloat(btcBalance[0].totalBalance)
      usd = btc * btcBalance[0].fiatRate
    }
  }).catch(function (error) {
    console.log(error)
  });
}
//MINING STOPPED
function getRigStatus() {
  callNicehash('/main/api/v2/mining/rigs2').then(function (response) {
    let rigs = response.data.miningRigs.filter(r => r.rigId == '0-W6SLxnUkR1mLgRrxqZiZHQ')
    if (rigs.length == 1) {
      minor.status = rigs[0].minerStatus
      minor.devices = []
      minor.speed = 0
      for (let d of rigs[0].devices) {
        if (d.deviceType.enumName == 'CPU') continue
        let speed = d.speeds.length == 0 ? 0 : parseFloat(d.speeds[0].speed)
        minor.devices.push({name: d.name, temp: d.temperature, power: d.powerUsage, speed: speed})
        minor.speed += speed
      }
    }

    rigs = response.data.miningRigs.filter(r => r.rigId == '0-XC35BxW-3FK+VaIsOSyInA')
    if (rigs.length == 1) {
      desltop.status = rigs[0].minerStatus
      desltop.devices = []
      desltop.speed = 0
      for (let d of rigs[0].devices) {
        if (d.deviceType.enumName == 'CPU') continue
        let speed = d.speeds.length == 0 ? 0 : parseFloat(d.speeds[0].speed)
        desltop.devices.push({name: d.name, temp: d.temperature, power: d.powerUsage, speed: speed})
        desltop.speed += speed
      }
    }
  }).catch(function (error) {
    console.log(error)
  });
}

function callNicehash(url, query = undefined) {
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