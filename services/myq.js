import { myQApi } from "@hjdhjd/myq"
import { addAlert, HOUR_MS } from './alert.js'

const myq = new myQApi()



var state = 'unknown'

export function getMyqStatus() {
  return { myq: {
      state: state
    }
  }
}

export async function startMyq(notifyClients, production) {
  await myq.login('synfm123@gmail.com', process.env.MYQ_PASSWORD)
  callMyq(notifyClients)
  setInterval(function() {
    callMyq(notifyClients)
  }, production ? 5000 : 30000)
}

function callMyq(notifyClients) {
  myq.refreshDevices().then(e => {
    let device = myq.getDevice('CG08503460EE')
    if (device != null) {
      updateState(notifyClients, device.state.door_state)
    } else {
      updateState(notifyClients, 'unknown')
    }
  }).catch (function(e){
    console.error(e)
    addAlert('myq', 'error', 'Failed to myQ: ' + e.message, HOUR_MS * 1)
  })
}

function updateState(notifyClients, doorState) {
  if (state != doorState) {
    state = doorState
    notifyClients(getMyqStatus())
  }
}
