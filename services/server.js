
import os from 'os-utils'
import fs from 'fs'

var cpu = 0.0
var mem = 0.0

export function getServerStatus() {
  return { server: {
      cpu: cpu,
      mem: mem
    }
  }
}

export function startServerStatus(notifyClients, production) {
  process.memoryUsage()
  getStatus(notifyClients, production)
  setInterval(function() {
    getStatus(notifyClients, production)
  }, production ? 5000 : 30000)
}

function getStatus(notifyClients, production) {
  os.cpuUsage(function(v){
    cpu = v * 100
    cpu = Math.round(cpu * 100) / 100
  })

  var memUsed = 0.0
  var memTotal = os.totalmem()
  if (production) {
    memUsed = Number(/Active:[ ]+(\d+)/.exec(fs.readFileSync('/proc/meminfo', 'utf8'))[1]) / 1000
  } else {
    memUsed = memTotal - os.freemem()
  }

  mem = memUsed / memTotal * 100
  mem = Math.round(mem * 100) / 100

  notifyClients(getServerStatus())
}
  

