import axios from "axios"

const appId = Buffer.from('YTA4NWVkMjRmMGUyNmMxNzljOTBkMjExYjE3NmFmYTk=', 'base64').toString('ascii')
const tempOffset = 273.15

var weather = []

export function getWeather() {
  return weather
}

export function startWeather() {
  updateWeather()
  setInterval(function() {
    updateWeather()
  }, 1800000)
}

function updateWeather() {
  axios.get('https://api.openweathermap.org/data/2.5/onecall?lat=30.35&lon=-97.60&exclude=minutely,daily&appid=' + appId).then(function (response) {
    weather = []

    processWeather(response.data.current, 'Now')

    let counter = 0
    for (let t of response.data.hourly) {
      if (counter >= 20) break
      if (counter % 2 == 0) processWeather(t)
      counter ++
    }
  })
}

function processWeather(w, time = undefined) {
  let hour = new Date(w.dt * 1000).getHours() + 1
  let hourStr = hour == 24 ? '12AM' : hour == 12 ? '12PM' : hour > 12 ? (hour % 12) + 'PM' : hour + 'AM'
  let temp = (w.temp - tempOffset).toFixed(1)
  weather.push({
    time: time == undefined ? hourStr : time,
    temp: temp,
    icon: w.weather[0].icon
  })
}