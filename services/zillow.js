import axios from "axios"
import { getDBClient } from './db.js'
import { addAlert, HOUR_MS } from './alert.js'

const apiKey = Buffer.from('MGZmZGVlY2Q0MDhkYzM2MGU5YTUyNjJiZjEzZDAzOTY=', 'base64').toString('ascii')

var total = 0
var cost = 0
var notifyClientCopy

export function getZillowStatus() {
  return {zillow: {
    total: total,
    cost: cost
  }}
}

export function startZillow(notifyClients, production) {
  notifyClientCopy = notifyClients

  getTotal(production)
  setInterval(function() {
    getTotal(production)
  }, 86400000)// refresh every day

  getCost(production)
  setInterval(function() {
    getCost(production)
  }, 604800000)// refresh every 7 days

}

async function getCost(production) {
  const dbClient = getDBClient(production)
  try {
    await dbClient.connect()
    let result = await dbClient.query(`select value from configurations where key = $1`, ['ZILLOW_COST'])
  
    let data = JSON.parse(result.rows[0].value)
    let totalBalance = 0
    for (let entry of data) {
      let months = monthDiff(new Date(entry.start), new Date())

      let balance = entry.balance
      while (months > 0) {
        months --
        let interest = (balance * entry.rate) / 12
        let principal = entry.total - interest 
        balance = balance - principal
      }

      totalBalance += balance
    }
    cost = Math.round(totalBalance)

  } catch (e) {
    addAlert('zillow', 'error', 'Failed to load zillow cost: ' + e.message, HOUR_MS * 2)
  } finally {
    await dbClient.end()
  }
}
  
function monthDiff(d1, d2) {
  var months;
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}

async function getTotal(production) {
  const dbClient = getDBClient(production)

  try {
    await dbClient.connect()
    let result = await dbClient.query(`select value from configurations where key = $1`, ['ZILLOW'])
  
    let data = JSON.parse(result.rows[0].value)
    let now = new Date()
    if (data.nextCheck != null && data.nextCheck > now.getTime()) {
      setTotal(data.properties)
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
    setTotal(data.properties)
  } catch (e) {
    addAlert('zillow', 'error', 'Failed to load zillow total: ' + e.message, HOUR_MS * 2)
  } finally {
    await dbClient.end()
  }

  notifyClientCopy(getZillowStatus())
}

function setTotal(properties) {
  total = 0
  for (var p in properties) {
    total += properties[p]
  }
}
