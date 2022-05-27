import { getNicehashAlerts } from './nicehash.js'

var alerts = []
var trashAlert

export function startAlerts(notifyClients) {

  // Check every 5 seconds for all alerts
  setInterval(function() {
    let tempAlerts = getNicehashAlerts()
    if (trashAlert) tempAlerts.push(trashAlert)
    alerts = tempAlerts.length == 0 ? [] : tempAlerts
  }, 5000)

  // Send alerts every minutes
  setInterval(function() {
    notifyClients({alerts: alerts})
  }, 60000)

  // Check hourly for trash collection
  setInterval(function() {
    let bothWendesday = new Date(1646805600000)
    let now = new Date()

    if (now.getDay() == 3 && now.getHours() > 12) {
      const diff = Math.floor(Math.ceil(Math.abs(now - bothWendesday) / 86400000) / 7)
      if (diff % 2 == 0) {
        trashAlert = {
          "level": "info",
          "msg": "Both trash and recycle will be collected tomorrow"
        }
      } else {
        trashAlert = {
          "level": "info",
          "msg": "Trash will be collected tomorrow"
        }
      }
    } else {
      trashAlert = undefined
    }
  }, 3600000)
}