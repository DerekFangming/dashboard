import { addAlert, HOUR_MS } from './alert.js'
import fetch from "node-fetch"
import { load } from 'cheerio'
import { getDBClient } from './db.js'

var bulletin = []
var notifyClientCopy

const monthFull = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
const monthAbbr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

export function getGreencardStatus() {
  return {
    greencard: bulletin
  }
}

export function startGreencard(notifyClients, production) {
  notifyClientCopy = notifyClients

  getStatus(production)
  setInterval(function() {
    getStatus(production)
  }, 86400000)// refresh every day
}

async function getStatus(production) {
  bulletin = []
  const dbClient = getDBClient(production)

  try {
    await dbClient.connect()
    let result = await dbClient.query(`select value from configurations where key = $1`, ['GREENCARD'])
  
    bulletin = JSON.parse(result.rows[0].value)

    let month = new Date(bulletin.at(-1).label)
    month.setMonth(month.getMonth() + 1)

    let url = `https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/${month.getFullYear()}/visa-bulletin-for-${monthFull[month.getMonth()]}-${month.getFullYear()}.html`
    let content = await (await fetch(url)).text()

    let $ = load(content)

    if ($('title').text().includes('404')) {
      url = `https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/${month.getFullYear() + 1}/visa-bulletin-for-${monthFull[month.getMonth()]}-${month.getFullYear()}.html`
      content = await (await fetch(url)).text()
      $ = load(content)
    }

    if (! $('title').text().includes('404')) {
      let newMonth = (month.getMonth() + 1).toString()
      if (newMonth.length == 1) newMonth = `0${newMonth}`

      let data = {label: `${month.getFullYear()}/${newMonth}`}

      try {
        let element = $('td').filter(function() {
          return $(this).text().trim() == '1st'
        }).first().parent()
  
        for (let i = 0; i < 3; i++) {
          let children = element.children()
          let pd = $(children[2]).text()
          data[`eb${i + 1}`] = new Date(pd).getTime()
  
          element = element.next()
        }
      } catch (e) {
        console.error(e)
        addAlert('greencard', 'error', 'Failed to parse greencard content: ' + e.message, HOUR_MS * 2)
      }

      bulletin.push(data)
      if (bulletin.length > 12) bulletin.shift()
      await dbClient.query(`update configurations set value = $1 where key = $2`, [JSON.stringify(bulletin), 'GREENCARD'])
    }
    
  } catch (e) {
    console.error(e)
    addAlert('greencard', 'error', 'Failed to load greencard: ' + e.message, HOUR_MS * 2)
  } finally {
    await dbClient.end()
  }
  
  notifyClientCopy(getGreencardStatus())
}
