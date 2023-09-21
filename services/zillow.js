import axios from "axios"
import { getDBClient } from './db.js'
import { addAlert, HOUR_MS } from './alert.js'

const apiKey = Buffer.from('OGQxZjQ0Y2NjMG1zaDM3OWUyYjk2M2Y4ZGZkZXAxMTA0YmFqc25mZTc0NDNkMDZiZjk=', 'base64').toString('ascii')

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
        url: 'https://zillow-data-v2.p.rapidapi.com/properties/detail',
        params: {zpid: p},
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'zillow-data-v2.p.rapidapi.com'
        }
      })

      data.properties[p] = response.data.data.zestimate
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
