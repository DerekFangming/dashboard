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
      if (limit++ >= 10) break
      
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
          let labels = l[1].split('-20')
          label = monthConvert(labels[0]) + '/' + labels[1]
        }

        let res = {label: label}
        let i = 0
        for (let d of dateMatches) {
          if (i++ >= 3) break

          // res[`EB${i}`] = monthConvert(d[2].substring(2, 5)) + '/' + d[2].substring(5, 7)
          res[`eb${i}`] = d[2]
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

function monthConvert(month) {
  switch(month.toLowerCase()) {
    case 'january': case 'jan':
      return '01'
    case 'february': case 'feb':
      return '02'
    case 'march': case 'mar':
      return '03'
    case 'april': case 'apr':
      return '04'
    case 'may':
      return '05'
    case 'june': case 'jun':
      return '06'
    case 'july': case 'jul':
      return '07'
    case 'august': case 'aug':
      return '08'
    case 'september': case 'sep':
      return '09'
    case 'october ': case 'oct':
      return '10'
    case 'november': case 'nov':
      return '11'
    case 'december': case 'dec':
      return '12'
  }
  return 'XX'
}