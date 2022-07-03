import axios from "axios"

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

export function getSmartthingsStatus() {
  return {smartthings: {
    fanOn: fanOn
  }}
}

export function startSmartthings(notifyClients, production) {
  updateDeviceStatus()
  setInterval(function() {
    updateDeviceStatus()
    notifyClients(getSmartthingsStatus())
  }, production ? 120000 : 10000 )

}

export function restartMiner() {
  // Force shut down
  toggelSwitch(5500).then(function() {

    // Start yo
    setTimeout(async function() {
      toggelSwitch(500)
    }, 5000)

  })

}

export function toggleMinorFan() {
  if (fanOn) {
    axios.post('https://api.smartthings.com/v1/devices/39ef51c9-4c37-4b26-9626-41dfefb26fd2/commands', turnOff, header)
  } else {
    axios.post('https://api.smartthings.com/v1/devices/39ef51c9-4c37-4b26-9626-41dfefb26fd2/commands', turnOn, header)
  }
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
