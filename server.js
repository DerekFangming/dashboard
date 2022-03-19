
import os from 'os-utils'
import fs from 'fs'

var cpu = 0.0
var mem = 0.0

export function getServerStatus() {
  return {
    cpu: cpu,
    mem: mem
  }
}

export function startServerStatus(production) {
  process.memoryUsage()
  getStatus(production)
  setInterval(function() {
    getStatus(production)
  }, production ? 5000 : 10000)
}

function getStatus(production) {
  os.cpuUsage(function(v){
    cpu = v * 100
  })

  var memUsed = 0.0
  var memTotal = os.totalmem()
  if (production) {
    memUsed = Number(/Active:[ ]+(\d+)/.exec(fs.readFileSync('/proc/meminfo', 'utf8'))[1]) / 1000
  } else {
    memUsed = memTotal - os.freemem()
  }

  mem = memUsed / memTotal * 100
}
  

