import { myQApi } from "@hjdhjd/myq"

const myq = new myQApi('synfm123@gmail.com', process.env.MYQ_PASSWORD)

var state = 'unknown'
var since = new Date().toISOString()

export function getMyqStatus() {
  return { myq: {
      state: state,
      since: since
    }
  }
}

export function startMyq(notifyClients, production) {
  callMyq(notifyClients)
  setInterval(function() {
    callMyq(notifyClients)
  }, production ? 5000 : 10000)
}

function callMyq(notifyClients) {
  myq.refreshDevices().then(e => {
    let device = myq.getDevice('CG08503460EE')
    if (device != null) {
      updateState(notifyClients, device.state.door_state, device.state.last_update)
    } else {
      updateState(notifyClients, 'unknown', new Date().toISOString())
    }
  })
}

function updateState(notifyClients, doorState, lastUpdate) {
  if (state != doorState || since != lastUpdate ) {
    state = doorState
    since = lastUpdate
    notifyClients(getMyqStatus())
  }
}
