import { addAlert, HOUR_MS } from './alert.js'
import fetch from "node-fetch"
import { load } from 'cheerio'
import { getDBClient } from './db.js'
import axios from "axios"
import {Builder, By, Key} from "selenium-webdriver"

var bulletin = []
var notifyClientCopy, caseStatus, caseLastChecked, caseNextCheck, browser
var loadingCount = 0

const monthFull = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
const monthAbbr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
const caseID = Buffer.from('TVNDMjQ5MDM0NjY3OQ==', 'base64').toString('ascii')

export function getGreencardStatus() {
  return {
    greencard: bulletin,
    greencardCase: {
      status: caseStatus,
      lastCheck: caseLastChecked,
      nextCheck: caseNextCheck
    }
  }
}

export async function startGreencard(notifyClients, production) {
  notifyClientCopy = notifyClients

  getStatus(production)
  setInterval(function() {
    // Refresh every hour between 2nd - 14th, in other dates, refresh once daily at noon CST
    let now = new Date()
    if (now.getDate() > 2 && now.getDate() < 14) {
      getStatus(production)
    } else if (now.getUTCHours() == 18) {
      getStatus(production)
    }

  }, 3600000)// refresh every hour

  // browser = await new Builder().forBrowser(production ? 'firefox' : 'chrome').build()
  // await browser.get('https://egov.uscis.gov/')

  // caseNextCheck = new Date()
  // setInterval(function() {
  //   browser.executeScript(`document.querySelectorAll('h1')[0].innerText = 'Next check in ${Math.ceil((caseNextCheck - new Date()) / 1000)} s'`)
  // }, 10000)
  
  // setTimeout(function (){checkCaseStatus()}, 5000)

  // setInterval(async function() {
  //   loadingCount ++
  //   try {
  //     await browser.findElement(By.css(`span[title='Loading data. Please wait.']`))
  //     if (loadingCount == 10) {
  //       await browser.get('https://egov.uscis.gov/')
  //       loadingCount = 0
  //     }
  //   } catch (e) {
  //     loadingCount = 0
  //   }
  // }, 60000)

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
          let pdDate = new Date(pd).getTime()
          if (pdDate == null) {
            throw new Error(`eb${i + 1} date is not found`)
          }
          data[`eb${i + 1}`] = pdDate
  
          element = element.next()
        }
      } catch (e) {
        console.error(e)
        addAlert('greencard', 'error', 'Failed to parse greencard content: ' + e.message, HOUR_MS * 2)
        return
      }

      bulletin.push(data)
      if (bulletin.length > 12) bulletin.shift()
      await dbClient.query(`update configurations set value = $1 where key = $2`, [JSON.stringify(bulletin), 'GREENCARD'])

      notifyClientCopy(getGreencardStatus())
      addAlert('greencardBulletin', 'info', 'Green card bulletin information released', HOUR_MS * 12)

      console.log("calling alex with data: " + JSON.stringify(data))
      axios.get(`https://tools.fmning.com/api/notifications?message=Green card bulletin information released`).then( res => {})
    }
    
  } catch (e) {
    console.error(e)
    addAlert('greencard', 'error', 'Failed to load greencard: ' + e.message, HOUR_MS * 2)
  } finally {
    await dbClient.end()
  }
  
}

async function checkCaseStatus() {
  try {
    caseLastChecked = new Date()
    caseNextCheck = new Date()

    // schedule next check
    let nextCheckDelay = 3600 + Math.floor(Math.random() * 3600)
    caseNextCheck.setSeconds(caseNextCheck.getSeconds() + nextCheckDelay);
    setTimeout(function (){checkCaseStatus()}, nextCheckDelay * 1000)
  
    // click button
    await browser.findElement(By.css(`input[type='text']`)).sendKeys(caseID)
    await browser.findElement(By.css(`button[type='submit']`)).click()
  
    // check status after delay
    setTimeout(async function (){
      caseLastChecked = new Date()
  
      let header = browser.findElement(By.id(`landing-page-header`))
      let status = await header.getText()
      if (header != null && status != '' && status != 'Check Case Status') {
        if (caseStatus == null) {
          caseStatus = status
          console.log('Initial status is: ' + caseStatus)
        } else if (caseStatus != status) {
          console.log('New status : ' + caseStatus)
          caseStatus = status
          
          let message = 'Green card case status updated: ' + caseStatus
          axios.get('https://tools.fmning.com/api/notifications?message=' + encodeURI(message))
          .then((res) => {})
          .catch((error) => {
            console.error(error)
          })
        } else {
          console.log('Status is the same: ' + caseStatus)
        }
      }
      
      notifyClientCopy({greencardCase: {
        status: caseStatus,
        lastCheck: caseLastChecked,
        nextCheck: caseNextCheck
      }}) 
    }, 120000)
  } catch (e) {
    console.log(e)
    addAlert('greencardCase', 'error', 'Failed to get greencard case: ' + e.message, HOUR_MS * 2)
  }

}
