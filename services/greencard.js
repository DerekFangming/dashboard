import fetch from "node-fetch"

var bulletin = []
var notifyClientCopy

export function getGreencardStatus() {
  return {
    greencard: bulletin
  }
}

export function startGreencard(notifyClients) {
  notifyClientCopy = notifyClients

  getStatus()
  setInterval(function() {
    getStatus()
  }, 86400000)
}

export async function getStatus() {
  bulletin = []

  try {
    let homePage = (await (await fetch('https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html')).text())
    let monthRegex = /href=\"(\/content\/travel\/en\/legal\/visa-law0\/visa-bulletin\/.*?visa-bulletin.*?html)\"/gm
    let monthMatches = homePage.replace(/(\r\n|\n|\r)/gm, '').matchAll(monthRegex)

    let limit = 0
    for (let m of monthMatches) {
      if (limit++ >= 5) break
      
      try {
        let monthPage = (await (await fetch(`https://travel.state.gov${m[1]}`)).text())
        let tableRegex = /Employment-<br>.*?tbody/gm
        let tableMatches = monthPage.replace(/(\r\n|\n|\r)/gm, '').matchAll(tableRegex)

        let table = ''
        for (let t of tableMatches) {
            table = t[0]
            break
        }

        let dateRegex = /<tr>.*?([0-9]{2}[A-Z]{3}[0-9]{2}).*?([0-9]{2}[A-Z]{3}[0-9]{2}).*?tr>/gm
        let dateMatches = table.matchAll(dateRegex)

        let label = 'page' + limit
        let labelMatches = m[1].matchAll(/visa-bulletin-for-(.*?)\./gm)
        for (let l of labelMatches) {
            label = l[1]
        }

        let res = {label: label}
        let i = 0
        for (let d of dateMatches) {
            if (i++ >= 3) break
            res[`EB${i}`] = d[2]
        }

        bulletin.push(res)
      } catch (e) {
        console.error('Failed to load a month: ' + e)
      }
      
    }
  } catch (e) {
    console.error('Failed to load greencard status: ' + e)
  }
  
  notifyClientCopy(getGreencardStatus())
}