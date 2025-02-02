
import os from 'os-utils'
import fs from 'fs'
import si from 'systeminformation'

var cpu = 0.0
var mem = 0.0
var networkIn = '0.00 b/s'
var networkOut = '0.00 b/s'

export function getServerStatus() {
  return { server: {
      cpu: cpu,
      mem: mem,
      networkIn: networkIn,
      networkOut: networkOut
    }
  }
}

export function startServerStatus(notifyClients, production) {
  getStatus(notifyClients, production)
  setInterval(function() {
    getStatus(notifyClients, production)
  }, production ? 5000 : 5000)
}

async function getStatus(notifyClients, production) {
  cpu = (await si.currentLoad()).currentLoad.toFixed(2)

  let memory = await si.mem()
  mem = (100 - (memory.available / memory.total * 100)).toFixed(2)

  let networkStats = await si.networkStats()
  let txTotal = networkStats.reduce((total, i) => total + i.tx_sec, 0)
  let rxTotal = networkStats.reduce((total, i) => total + i.rx_sec, 0)

  networkOut = byteToReadableSpeed(txTotal)
  networkIn = byteToReadableSpeed(rxTotal)

  // os.cpuUsage(function(v){
  //   cpu = v * 100
  //   cpu = Math.round(cpu * 100) / 100
  // })

  // var memUsed = 0.0
  // var memTotal = os.totalmem()
  // if (production) {
  //   memUsed = Number(/Active:[ ]+(\d+)/.exec(fs.readFileSync('/proc/meminfo', 'utf8'))[1]) / 1000
  // } else {
  //   memUsed = memTotal - os.freemem()
  // }

  // mem = memUsed / memTotal * 100
  // mem = Math.round(mem * 100) / 100

  notifyClients(getServerStatus())
}

function byteToReadableSpeed(b) {
  if (b < 1000) {
    return `${b.toFixed(2)} b/s`
  }

  b = b / 1024
  if (b < 1000) {
    return `${b.toFixed(2)} Kb/s`
  }

  b = b / 1024
  return `${b.toFixed(2)} Mb/s`
}
  

