import fetch from "node-fetch"

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
  const html = (await (await fetch('https://scholar.google.com/citations?user=6hwtOK4AAAAJ&hl=en')).text())

  var regex = /years to all publications.*?gsc_rsb_std">(.*?)<\/td>/g
  var match = regex.exec(html)

  citation = match[1]

  notifyClientCopy(getScholarStatus())
}