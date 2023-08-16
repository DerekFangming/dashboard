import fetch from "node-fetch"
import pg from 'pg'

var bulletin = []
var notifyClientCopy

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

export async function getStatus(production) {
  bulletin = []

  const dbClient = new pg.Client({
    user: 'postgres',
    host: production ? 'localhost' : '10.0.1.100',
    database: 'test',
    password: process.env.DATABASE_PASSWORD,
    port: 5432,
  })

  try {
    await dbClient.connect()
    let result = await dbClient.query(`select value from configurations where key = $1`, ['GREENCARD'])
    await dbClient.end()
  
    bulletin = JSON.parse(result.rows[0].value)
  } catch (e) {
    console.error(e)
  }



  // try {
  //   let now = new Date()
  //   now.setMonth(now.getMonth() + 3)
  //   let endDate = `${now.getFullYear()}-${now.getMonth()}`
  //   let url = `https://visa.careerengine.us/api/historic/visa/trends?ref=https://www.google.com/&&Type=employment&LatestMonth=${endDate}&Country=china&DateRangeMonths=12&Preferences=1st,2nd,3rd&Lang=en`
    
  //   let dataStr = await (await fetch(url)).text()
  //   console.log(dataStr)
  //   let data = JSON.parse(dataStr)

  //   for (let i = 0; i < data.EmploymentData.DateLabels.length; i ++) {
  //     let label = 'data.EmploymentData.DateLabels[i]'

  //     let res = {label: label}
  //     res[`eb1`] = data.EmploymentData.Data.china_1st[i]
  //     res[`eb2`] = data.EmploymentData.Data.china_2nd[i]
  //     res[`eb3`] = data.EmploymentData.Data.china_3rd[i]
  //     bulletin.push(res)
  //   }
  // } catch (e) {
  //   console.error(e)
  // }
  
  notifyClientCopy(getGreencardStatus())
}
