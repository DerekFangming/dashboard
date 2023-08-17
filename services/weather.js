import axios from "axios"
import { addAlert, HOUR_MS } from './alert.js'

const appId = Buffer.from('YTA4NWVkMjRmMGUyNmMxNzljOTBkMjExYjE3NmFmYTk=', 'base64').toString('ascii')
const tempOffset = 273.15

var weather = []

export function getWeather() {
  return {weather: weather}
}

export function startWeather(notifyClients, production) {
  updateWeather(notifyClients)
  setInterval(function() {
    updateWeather(notifyClients)
  }, production ? 1800000 : 3600000)
}

function updateWeather(notifyClients) {
  axios.get('https://api.openweathermap.org/data/2.5/onecall?lat=30.35&lon=-97.60&exclude=minutely,daily&appid=' + appId).then(function (response) {
    weather = []

    processWeather(response.data.current, 'Now')

    let counter = 0
    for (let t of response.data.hourly) {
      if (counter >= 22) break
      if (counter % 2 == 0) processWeather(t)
      counter ++
    }

    notifyClients(getWeather())
  }).catch (function(e){
    console.error(e)
    addAlert('weather', 'error', 'Failed to weather: ' + e.message, HOUR_MS * 1)
  })
}

function processWeather(w, time = undefined) {
  let hour = new Date(w.dt * 1000).getHours() + 1
  let hourStr = hour == 24 ? '12AM' : hour == 12 ? '12PM' : hour > 12 ? (hour % 12) + 'PM' : hour + 'AM'
  let temp = Math.floor(w.temp - tempOffset)
  weather.push({
    time: time == undefined ? hourStr : time,
    temp: temp,
    wind: Math.ceil(w.wind_gust),
    icon: w.weather[0].icon
  })
}