import si from 'systeminformation'

var cpu = 0.0
var mem = 0.0
var download = 0
var upload = 0

export function getServerStatus() {
  return { server: {
      cpu: cpu,
      mem: mem,
      download: download,
      upload: upload
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
  cpu = (await si.currentLoad()).currentLoad

  let memory = await si.mem()
  mem = (100 - (memory.available / memory.total * 100))

  let networkStats = await si.networkStats()
  upload = networkStats.reduce((total, i) => total + i.tx_sec, 0)
  download = networkStats.reduce((total, i) => total + i.rx_sec, 0)

  notifyClients(getServerStatus())
}
