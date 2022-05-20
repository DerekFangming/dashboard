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

export function restartMiner() {
  // Force shut down
  toggelSwitch(5500).then(function() {

    // Start yo
    setTimeout(async function() {
      toggelSwitch(500)
    }, 5000)

  })

}

export function toggleMinorFan(turnOnFan) {
  if (turnOnFan) {
    axios.post('https://api.smartthings.com/v1/devices/39ef51c9-4c37-4b26-9626-41dfefb26fd2/commands', turnOn, header)
  } else {
    axios.post('https://api.smartthings.com/v1/devices/39ef51c9-4c37-4b26-9626-41dfefb26fd2/commands', turnOff, header)
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