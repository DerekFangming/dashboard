import axios from "axios"

const appId = Buffer.from('YTA4NWVkMjRmMGUyNmMxNzljOTBkMjExYjE3NmFmYTk=', 'base64').toString('ascii')
const tempOffset = 273.15

var weather = []

export function getWeather() {
  return weather
}

export function startWeather(checkPoint, production) {
  updateWeather()
  setInterval(function() {
    updateWeather(checkPoint)
  }, production ? 1800000 : 15000)
}

function updateWeather(checkPoint = undefined) {
  axios.get('https://api.openweathermap.org/data/2.5/onecall?lat=30.35&lon=-97.60&exclude=minutely,daily&appid=' + appId).then(function (response) {
    weather = []

    processWeather(response.data.current, 'Now')

    let counter = 0
    for (let t of response.data.hourly) {
      if (counter >= 20) break
      if (counter % 2 == 0) processWeather(t)
      counter ++
    }

    if (checkPoint != undefined) checkPoint.hash = (Math.random() + 1).toString(36).substring(7)
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