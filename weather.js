import axios from "axios"

const appId = Buffer.from('YTA4NWVkMjRmMGUyNmMxNzljOTBkMjExYjE3NmFmYTk=', 'base64').toString('ascii')
const tempOffset = 273.15

var weather = []

export function getWeather() {
  return weather
}

export function startWeather() {
  axios.get('https://api.openweathermap.org/data/2.5/onecall?lat=30.35&lon=-97.60&exclude=minutely,daily&appid=' + appId).then(function (response) {
    // console.log(response.data)
    weather = []
    // console.log((response.data.current.temp - tempOffset).toFixed(1))

    processWeather(response.data.current)

    for (let t of response.data.hourly) {
      // console.log(new Date(t.dt * 1000).toISOString() + ' --  ' + new Date(t.dt * 1000).getHours())
      // let hour = new Date(t.dt * 1000).getHours() + 1
      // let hourStr = hour == 24 ? '12AM' : hour == 12 ? '12PM' : hour > 12 ? (hour % 12) + 'PM' : hour + 'AM'
      // console.log(hourStr + ' - ' + (t.temp - tempOffset).toFixed(1) )

      processWeather(t)
    }

    console.log(weather)
  })
}

function processWeather(w) {
  let hour = new Date(w.dt * 1000).getHours() + 1
  let hourStr = hour == 24 ? '12AM' : hour == 12 ? '12PM' : hour > 12 ? (hour % 12) + 'PM' : hour + 'AM'
  let temp = (w.temp - tempOffset).toFixed(1)
  weather.push({
    time: hourStr,
    temp: temp,
    icon: w.weather[0].icon
  })
}