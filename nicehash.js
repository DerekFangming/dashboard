import axios from "axios"
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

var btc = 0.0
var usd = 0.0

var miner = {status: 'STOPPED', speed: 0, joined: 0, devices:[]}
var desktop = {status: 'STOPPED', speed: 0, joined: 0, devices:[]}

var minerStopped
var desktopStopped
var minerAlert
var desktoplert

export function getNicehashStatus() {
  return {
    btc: btc,
    usd: usd,
    miner: miner,
    desktop: desktop
  }
}

export function getNicehashAlerts() {
  let alerts = []
  if (minerAlert != undefined) alerts.push(minerAlert)
  if (desktoplert != undefined) alerts.push(desktoplert)

  return alerts
}

export function startNicehash(checkPoint, production) {
  // Get balance every hour
  getBalance()
  setInterval(function() {
    getBalance(checkPoint)
  }, 3600000)

  // Get status every 15 seconds
  getRigStatus()
  setInterval(function() {
    getRigStatus(checkPoint)

    if (minerStopped != undefined && Math.abs(new Date() - minerStopped) > 900000) {
      minerAlert = {
        "level": "error",
        "msg": "Miner has stopped for 15 minutes"
      }
    } else {
      minerAlert = undefined
    }
    if (desktopStopped != undefined && Math.abs(new Date() - desktopStopped) > 900000) {
      desktoplert = {
        "level": "error",
        "msg": "Desktop has stopped for 15 minutes"
      }
    } else {
      desktoplert = undefined
    }
     
  }, production ? 15000 : 30000)

}

function getBalance(checkPoint = undefined) {
  callNicehash('/main/api/v2/accounting/accounts2', 'fiat=USD').then(function (response) {
    let btcBalance = response.data.currencies.filter(c => c.currency == 'BTC')
    if (btcBalance.length == 1) {
      btc = parseFloat(btcBalance[0].totalBalance)
      usd = btc * btcBalance[0].fiatRate
    }
    if (checkPoint != undefined) checkPoint.hash = (Math.random() + 1).toString(36).substring(7)
  }).catch(function (error) {
    console.log(error)
  });
}
//MINING STOPPED
function getRigStatus(checkPoint = undefined) {
  callNicehash('/main/api/v2/mining/rigs2').then(function (response) {
    let updateCheckpoint = false

    let minerRig = buildRig(response, '0-W6SLxnUkR1mLgRrxqZiZHQ')
    if (miner.status != minerRig.status || miner.speed != minerRig.speed) {
      miner = minerRig
      updateCheckpoint = true

      if (minerRig.status == 'STOPPED') {
        if (minerStopped == undefined) minerStopped = new Date()
      } else {
        minerStopped = undefined
      }
    }

    let desktopRig = buildRig(response, '0-VabHkOCiY1uFwrEBWAkhGQ')
    if (desktop.status != desktopRig.status || desktop.speed != desktopRig.speed) {
      desktop = desktopRig
      updateCheckpoint = true

      if (desktopRig.status == 'STOPPED') {
        if (desktopStopped == undefined) desktopStopped = new Date()
      } else {
        desktopStopped = undefined
      }
    }

    if (updateCheckpoint && checkPoint != undefined) checkPoint.hash = (Math.random() + 1).toString(36).substring(7)
  }).catch(function (error) {
    console.log(error)
  });
}

function buildRig(response, id) {
  let rig = {status: 'STOPPED', speed: 0, joined: 0, devices:[]}
  let rigs = response.data.miningRigs.filter(r => r.rigId == id)
    if (rigs.length == 1) {
      let totalSpeed = 0.0
      rig.joined = rigs[0].joinTime * 1000
      rig.status = rigs[0].minerStatus
      for (let d of rigs[0].devices) {
        if (d.deviceType.enumName == 'CPU') continue
        let speed = d.speeds.length == 0 ? 0 : parseFloat(d.speeds[0].speed)
        let name = d.name.split('TX ')[1]
        rig.devices.push({name: name, temp: d.temperature, power: d.powerUsage, speed: speed})
        totalSpeed += speed
      }
      rig.speed = totalSpeed
    }
    return rig
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