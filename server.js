
import os from 'os-utils'

var cpu = 0.0
var mem = 0.0

export function getServerStatus() {
  return {
    cpu: cpu,
    mem: mem
  }
}

export function startServerStatus(production) {
  getStatus()
  setInterval(function() {
    getStatus()
  }, production ? 5000 : 10000)
}

function getStatus() {
  os.cpuUsage(function(v){
    cpu = v * 100
  })

  mem = (os.totalmem() - os.freemem()) / 1000
}
  

