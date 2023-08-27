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

    let counter = 0
    for (let t of response.data.hourly) {
      if (counter >= 24) break
      if (counter % 2 == 0) {
        weather.push({
          time: t.dt * 1000,
          temp: Math.floor(t.temp - tempOffset),
          wind: Math.ceil(t.wind_gust),
          icon: t.weather[0].icon
        })
      }
      counter ++
    }

    notifyClients(getWeather())
  }).catch (function(e){
    console.error(e)
    addAlert('weather', 'error', 'Failed to weather: ' + e.message, HOUR_MS * 1)
  })
}