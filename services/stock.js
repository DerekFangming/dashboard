import axios from "axios"

const token = Buffer.from('YzhqMXFhMmFkM2lmZzh0YzczZTA=', 'base64').toString('ascii')

var voo = {c: 0.0, d: 0.0, dp: 0.0}
var sail = {c: 0.0, d: 0.0, dp: 0.0}
var btc = {c: 0.0, d: 0.0, dp: 0.0}
var eth = {c: 0.0, d: 0.0, dp: 0.0}

export function getStock() {
  return {stock: {
    voo: voo,
    sail: sail,
    btc: btc,
    eth: eth
  }}
}

export function startStock(notifyClients, production) {
  updateStock()
  setInterval(function() {
    updateStock()
  }, production ? 15000 : 30000)

  setInterval(function() {
    notifyClients(getStock())
  }, production ? 10000 : 10000)
}

function updateStock() {
  axios.get('https://finnhub.io/api/v1/quote?symbol=VOO&token=' + token).then(function (response) {
    voo.c = response.data.c.toFixed(2)
    voo.d = response.data.d.toFixed(2)
    voo.dp = response.data.dp.toFixed(2)
  })
  
  // axios.get('https://finnhub.io/api/v1/quote?symbol=SAIL&token=' + token).then(function (response) {
  //   sail.c = response.data.c.toFixed(2)
  //   sail.d = response.data.d.toFixed(2)
  //   sail.dp = response.data.dp.toFixed(2)
  // })
  
  axios.get('https://finnhub.io/api/v1/quote?symbol=BTC-USD&token=' + token).then(function (response) {
    btc.c = response.data.c.toFixed(2)
    btc.d = response.data.d.toFixed(2)
    btc.dp = response.data.dp.toFixed(2)
  })
  
  axios.get('https://finnhub.io/api/v1/quote?symbol=ETH-USD&token=' + token).then(function (response) {
    eth.c = response.data.c.toFixed(2)
    eth.d = response.data.d.toFixed(2)
    eth.dp = response.data.dp.toFixed(2)
  })
}