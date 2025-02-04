var alerts = new Map()
var alertsUpdated = false

const HOUR_MS = 3600000
const TIMEZONE_OFFSET = -6 // CST
const BOTH_COLLECTION_DAY = '2025-01-27T06:00:00.000Z'

export { HOUR_MS }

export function getAlerts() {
  return {alerts: Array.from(alerts.entries()).map(([k, v]) => v.alert)}
}

export function startAlerts(notifyClients, production) {

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
  trashStatus(production)
  setInterval(function() {
    trashStatus(production)
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

function trashStatus(production) {
  let now = new Date()
  now.setHours(now.getHours() + TIMEZONE_OFFSET)

  let bothCollectionDay = new Date(BOTH_COLLECTION_DAY)
  bothCollectionDay.setHours(bothCollectionDay.getHours() - 24)
  let bothCollectionDayMs = bothCollectionDay.getTime()

  bothCollectionDay.setHours(bothCollectionDay.getHours() + TIMEZONE_OFFSET)
  let notifyDay = bothCollectionDay.getUTCDay()
  if (now.getUTCDay() == notifyDay && now.getUTCHours() >= 10) {
    const diff = Math.floor(Math.ceil(Math.abs(now.getTime() - bothCollectionDayMs) / 86400000) / 7)
    let expiry = HOUR_MS * (24 - now.getUTCHours())
    if (diff % 2 == 0) {
      addAlert('trash', 'info', 'Both trash and recycle will be collected tomorrow', expiry)
    } else {
      addAlert('trash', 'info', 'Trash will be collected tomorrow', expiry)
    }
  }
}