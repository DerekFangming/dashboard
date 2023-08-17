import { addAlert, HOUR_MS } from './alert.js'
import fetch from "node-fetch"
import { load } from 'cheerio'

var citation = '0'
var notifyClientCopy

export function getScholarStatus() {
  return { scholar: {
      citation: citation
    }
  }
}

export function startScholar(notifyClients) {
  notifyClientCopy = notifyClients

  getStatus()
  setInterval(function() {
    getStatus()
  }, 3600000)
}

export async function getStatus() {
  try {
    const content = await (await fetch('https://scholar.google.com/citations?user=6hwtOK4AAAAJ&hl=en')).text()
    let $ = load(content)

    let elements = $('td.gsc_rsb_std')
    for (let e of elements) {
      let str = $(e).text()
      if (str.length >= 3) {
        citation = str
        break
      }
    }
  } catch (e) {
    console.error(e)
    addAlert('scholar', 'error', 'Failed to parse citation content: ' + e.message, HOUR_MS * 2)
  }

  notifyClientCopy(getScholarStatus())
}