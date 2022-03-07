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

export function startMyq() {
  callMyq()
  setInterval(function() {
    callMyq()
  }, 5000)
}

function callMyq() {
  myq.refreshDevices().then(e => {
    let device = myq.getDevice('CG08503460EE')
    if (device != null) {
      state = device.state.door_state
      since = device.state.last_update
    } else {
      state = 'unknown'
      since = new Date().toISOString()
    }
  })
}