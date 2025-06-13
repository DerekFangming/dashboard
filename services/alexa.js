import axios from "axios"
import { getDBClient } from './db.js'

var url
var notifyClientCopy

export function getAlexaStatus() {
  return {}
}

export async function startAlexa(notifyClients, production) {
  notifyClientCopy = notifyClients
  
  const dbClient = getDBClient(production)
  try {
    await dbClient.connect()
    let result = await dbClient.query(`select value from configurations where key = $1`, ['TEMPERATURE_WEBHOOK_URL'])
    url = result.rows[0].value
  } catch (e) {
    addAlert('zillow', 'error', 'Failed to load zillow API leu: ' + e.message, HOUR_MS * 2)
  } finally {
    await dbClient.end()
  }
}

export function setAlexaCode(code) {
  notifyClientCopy({
    receivedCode: code
  })

  if (code >= 70 && code <= 80) {
    axios.post(url, {temperature: code})
  }

}