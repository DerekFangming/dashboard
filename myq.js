import { myQApi } from "@hjdhjd/myq"

const myq = new myQApi('synfm123@gmail.com', process.env.MYQ_PASSWORD)

var state = 'unknown'
var since = new Date().toISOString()

export function getMyqStatus() {
  return {
      state: state,
      since: since
  }
}

export function startMyq(checkPoint, production) {
  callMyq(checkPoint)
  setInterval(function() {
    callMyq(checkPoint)
  }, production ? 5000 : 10000)
}

function callMyq(checkPoint = undefined) {
  myq.refreshDevices().then(e => {
    let device = myq.getDevice('CG08503460EE')
    if (device != null) {
      updateState(device.state.door_state, device.state.last_update, checkPoint)
    } else {
      updateState('unknown', new Date().toISOString(), checkPoint)
    }
  })
}

function updateState(doorState, lastUpdate, checkPoint) {
  if (state != doorState || since != lastUpdate ) {
    if (checkPoint != undefined) {
      checkPoint.hash = (Math.random() + 1).toString(36).substring(7)
    }
  }
  state = doorState
  since = lastUpdate
}