import axios from "axios"
import { getDBClient } from './db.js'
import { addAlert, HOUR_MS } from './alert.js'

const apiKey = Buffer.from('MGZmZGVlY2Q0MDhkYzM2MGU5YTUyNjJiZjEzZDAzOTY=', 'base64').toString('ascii')

var amount = 0
var notifyClientCopy

export function getZillowStatus() {
  return {zillow: amount}
}

export function startZillow(notifyClients, production) {
  notifyClientCopy = notifyClients

  getStatus(production)
  setInterval(function() {
    getStatus(production)
  }, 86400000)// refresh every day
}

async function getStatus(production) {
  const dbClient = getDBClient(production)

  try {
    await dbClient.connect()
    let result = await dbClient.query(`select value from configurations where key = $1`, ['ZILLOW'])
  
    let data = JSON.parse(result.rows[0].value)
    let now = new Date()
    if (data.nextCheck != null && data.nextCheck > now.getTime()) {
      setAmount(data.properties)
      return
    }

    for (var p in data.properties) {
      let response = await axios.request({
        method: 'GET',
        url: 'https://api.bridgedataoutput.com/api/v2/zestimates_v2/zestimates',
        params: {
          access_token: apiKey,
          zpid: p
        }
      })

      data.properties[p] = response.data.bundle[0].zestimate
    }

    now.setDate(now.getDate() + 3)
    data.nextCheck = now.getTime()

    await dbClient.query(`update configurations set value = $1 where key = $2`, [JSON.stringify(data), 'ZILLOW'])
    setAmount(data.properties)
  } catch (e) {
    addAlert('zillow', 'error', 'Failed to load zillow: ' + e.message, HOUR_MS * 2)
  } finally {
    await dbClient.end()
  }

  notifyClientCopy(getZillowStatus())
}

function setAmount(properties) {
  amount = 0
  for (var p in properties) {
    amount += properties[p]
  }
}
