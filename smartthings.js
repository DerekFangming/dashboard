import axios from "axios"
import { getNicehashStatus } from './nicehash.js'

const header = {headers: { Authorization: `Bearer ${process.env.SMARTTHINGS_PAT}`}}
const turnOn = {
  "commands": [
    {
      "component": "main",
      "capability": "switch",
      "command": "on",
      "arguments": []
    }
  ]
}
const turnOff = {
  "commands": [
    {
      "component": "main",
      "capability": "switch",
      "command": "off",
      "arguments": []
    }
  ]
}
var fanOn = false
var notifyClientCopy

export function getSmartthingsStatus() {
  return {smartthings: {
    fanOn: fanOn
  }}
}

export function startSmartthings(notifyClients, production) {
  notifyClientCopy = notifyClients
  updateDeviceStatus()
  setInterval(function() {
    updateDeviceStatus()
    notifyClients(getSmartthingsStatus())
  }, production ? 120000 : 10000 )

  setInterval(function() {
    let status = getNicehashStatus()
    let maxTemp = Number.MIN_SAFE_INTEGER
    for (let d of status.nh.miner.devices) {
      if (d.temp > maxTemp) maxTemp = d.temp
    }

    if (maxTemp > Number.MIN_SAFE_INTEGER) {
      if (fanOn) {
        if (maxTemp <= 65) { //65
          toggleMinorFan()
        }
      } else {
        if (maxTemp >= 75) { //75
          toggleMinorFan()
        }
      }
    }
  }, production ? 1200000 : 5000 )

}

export function restartMiner() {
  toggelSwitch(5500).then(function() {
    setTimeout(async function() {
      toggelSwitch(500)
    }, 5000)

  })

}

export function toggleMinorFan() {
  if (fanOn) {
    axios.post('https://api.smartthings.com/v1/devices/39ef51c9-4c37-4b26-9626-41dfefb26fd2/commands', turnOff, header)
    fanOn = false
  } else {
    axios.post('https://api.smartthings.com/v1/devices/39ef51c9-4c37-4b26-9626-41dfefb26fd2/commands', turnOn, header)
    fanOn = true
  }
  notifyClientCopy(getSmartthingsStatus())
}

async function toggelSwitch(timeout) {
  return new Promise(async function(resolve) {
    await axios.post('https://api.smartthings.com/v1/devices/d602faa9-e713-434f-819e-ad18e650012e/commands', turnOn, header)
    setTimeout(async function() {
      await axios.post('https://api.smartthings.com/v1/devices/d602faa9-e713-434f-819e-ad18e650012e/commands', turnOff, header)
      resolve()
    }, timeout)
  })
}

async function updateDeviceStatus() {
  let res = await axios.get('https://api.smartthings.com/v1/devices/39ef51c9-4c37-4b26-9626-41dfefb26fd2/status', header)
  fanOn = res.data.components.main.switch.switch.value == 'on'
}
