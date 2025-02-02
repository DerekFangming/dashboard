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
  

