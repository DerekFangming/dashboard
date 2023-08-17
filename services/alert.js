import { getNicehashAlerts } from './nicehash.js'

var alerts = new Map()
var alertsUpdated = false
var trashAlert

const HOUR_MS = 3600000
export { HOUR_MS }

export function getAlerts() {
  return {alerts: Array.from(alerts.entries()).map(([k, v]) => v.alert)}
}

export function startAlerts(notifyClients) {

  // Check every 5 seconds for all alerts
  setInterval(function() {
    if (alerts.size == 0) return

    let now = new Date().getTime()
    for (const [k, v] of alerts.entries()) {
      if (v.expiry < now) {
        alertsUpdated = true
        alerts.delete(k)
      }
    }

    if (alertsUpdated) {
      alertsUpdated = false
      notifyClients(getAlerts())
    }
  }, 5000)

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

export function addAlert(alertKey, level, msg, timeout = 60000) {
  alertsUpdated = true
  alerts.set(alertKey, {
    expiry: new Date().getTime() + timeout,
    alert: {
      level: level,
      msg: `[${new Date().toLocaleString()}] ${msg}`
    }
  })
}