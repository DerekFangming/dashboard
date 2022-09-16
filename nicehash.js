import axios from "axios"
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import { restartMiner } from './smartthings.js'

var btc = 0.0
var usd = 0.0
var fiatRate = 0.0
var usd = 0.0
var profit = 0.0
var profitUsd = 0.0

var miner = {status: 'STOPPED', speed: 0, joined: 0, devices:[]}
var desktop = {status: 'STOPPED', speed: 0, joined: 0, devices:[]}

var minerStopped
var desktopStopped
var minerAlert
var desktoplert

var hideAlert = false

export function getNicehashStatus() {
  return { nh: {
      btc: btc,
      usd: usd,
      hideAlert: hideAlert,
      p: profit,
      pu: profitUsd,
      miner: miner,
      desktop: desktop
    }
  }
}

export function toggleHideAlert() {
  hideAlert = !hideAlert
}

export function getNicehashAlerts() {
  let alerts = []
  if (minerAlert != undefined) alerts.push(minerAlert)
  if (desktoplert != undefined) alerts.push(desktoplert)

  return alerts
}

var notifyClientCopy

export function startNicehash(notifyClients, production) {
  notifyClientCopy = notifyClients
  // Get balance every hour
  getBalance()
  setInterval(function() {
    getBalance()
  }, 3600000)

  // Get status every 15 seconds
  getRigStatus()
  setInterval(function() {
    getRigStatus()
  }, production ? 15000 : 30000)

  // Check status every 15 minutes
  setInterval(function() {
    if (minerStopped != undefined && Math.abs(new Date() - minerStopped) > 300000) {

      // Notify. Attempt to restart during night time
      let hour = new Date().getHours()
      let dayTime = hour >= 8 && hour <= 23

      let stoppedMinutes = (new Date() - minerStopped) / 60000
      // if (production) {
      //   axios.post(`https://maker.ifttt.com/trigger/notification/with/key/${process.env.IFTTT_WEBHOOK_KEY}`, {value1: `🚨🚨🚨 Miner has stopped for ${stoppedMinutes} min`})

      //   if (!dayTime) {
      //     restartMiner()
      //   }
      // }

      minerAlert = {
        "level": "error",
        "msg": `Miner has stopped for ${ stoppedMinutes } minutes`
      }
    } else {
      minerAlert = undefined
    }

    if (desktopStopped != undefined && Math.abs(new Date() - desktopStopped) > 300000) {

      let stoppedMinutes = (new Date() - desktopStopped) / 60000
      // if (production && !hideAlert) {
      //   axios.post(`https://maker.ifttt.com/trigger/notification/with/key/${process.env.IFTTT_WEBHOOK_KEY}`, {value1: `🚨🚨🚨 Desktop has stopped for ${stoppedMinutes} min`})
      // }

      desktoplert = {
        "level": "error",
        "msg": `Desktop has stopped for ${stoppedMinutes} minutes`
      }
    } else {
      desktoplert = undefined
    }
  }, 900000)

}

function getBalance() {
  callNicehash('/main/api/v2/accounting/accounts2', 'fiat=USD').then(function (response) {
    let btcBalance = response.data.currencies.filter(c => c.currency == 'BTC')
    if (btcBalance.length == 1) {
      btc = parseFloat(btcBalance[0].totalBalance)
      fiatRate = btcBalance[0].fiatRate
      usd = btc * fiatRate
    }
    notifyClientCopy(getNicehashStatus())
  }).catch(function (error) {
    console.log(error)
  });
}

// Status: MINING STOPPED
function getRigStatus() {
  callNicehash('/main/api/v2/mining/rigs2').then(function (response) {
    let hasUpdate = false

    profit = response.data.totalProfitability
    profitUsd = profit * fiatRate

    let minerRig = buildRig(response, '0-W6SLxnUkR1mLgRrxqZiZHQ')
    if (miner.status != minerRig.status || miner.speed != minerRig.speed) {
      miner = minerRig
      hasUpdate = true

      if (minerRig.status != 'MINING') {
        if (minerStopped == undefined) minerStopped = new Date()
      } else {
        minerStopped = undefined
      }
    }
    // let desktopRig = buildRig(response, '0-Y336wKb12EKz7XMq9B8S1w')
    let desktopRig = buildRig(response, '0-sdRMNpymllmepWKiwoA1fw')
    if (desktop.status != desktopRig.status || desktop.speed != desktopRig.speed) {
      desktop = desktopRig
      hasUpdate = true

      if (desktopRig.status != 'MINING') {
        if (desktopStopped == undefined) desktopStopped = new Date()
      } else {
        desktopStopped = undefined
      }
    }

    if (hasUpdate) notifyClientCopy(getNicehashStatus())
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