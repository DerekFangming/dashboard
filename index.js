// const express = require('express')
// const axios = require('axios')
// const myQApi = require('@hjdhjd/myq')
import { myQApi } from "@hjdhjd/myq"
import express from 'express'
import path from 'path';

const myq = new myQApi('synfm123@gmail.com', process.env.MYQ_PASSWORD)
const app = express()
const __dirname = path.resolve()

const port = '9002'
const production = process.env.PRODUCTION == 'true'
let startupDelay = production ? 5000 : 0

var garageState = 'unknown'
var garageStateSince = new Date().toISOString()

var startDashboard = function() {
}

setTimeout(function() {
  startDashboard()
}, startupDelay);

// MyQ
setInterval(function() {
  // myq.refreshDevices().then(e => {
  //   let device = myq.getDevice('CG08503460EE')
  //   if (device != null) {
  //     garageState = device.state.door_state
  //     garageStateSince = device.state.last_update
  //   } else {
  //     garageState = 'unknown'
  //     garageStateSince = new Date().toISOString()
  //   }
  // })
}, 5000);



// app.get('/', (req, res) => {res.sendFile(__dirname + '/index.html')})
// app.get('/script.js', (req, res) => {res.sendFile(__dirname + '/script.js')})
// app.get('/extra.js', (req, res) => {production ? res.sendFile(__dirname + '/extra-prod.js') : res.sendFile(__dirname + '/extra-dev.js')})
// app.get('/style.css', (req, res) => {res.sendFile(__dirname + '/style.css')})
// app.get('/favicon.ico', (req, res) => {res.sendFile(__dirname + '/favicon.ico')})
// app.get('/alert.mp3', (req, res) => {res.sendFile(__dirname + '/alert.mp3')})



app.get('/t1', (req, res) => {
  console.log(myq.getDevice('CG08503460EE').state.door_state)
  res.sendStatus(200)
})

app.get('/t2', (req, res) => {
  myq.refreshDevices().then(e => {
    console.log(myq.getDevice('CG08503460EE').state.door_state)
  })
  res.sendStatus(200)
})

app.get('/status', async (req, res) => {
  // checkPoint = (Math.random() + 1).toString(36).substring(7)
  // sellerCards = []
  // storeCards = []
  // highlightCards = []

  res.status(200).json({garageState: garageState, garageStateSince: garageStateSince})
})

app.get('/test', async (req, res) => {

  // console.log(cache('key'))
  // cache.set({key: 123}, 5)
  // console.log(cache('key'))

  
  // checkPoint = (Math.random() + 1).toString(36).substring(7)
  

  res.sendStatus(200)
})

app.get('/testNotification', async (req, res) => {

  // processCard({item: 'GIGABYTE GeForce lHR RTX 3060 Ti LHR GAMING OC 1.0 8G GDDR6 Video Card (GV-N306TGAMING...', model: '2060ti', price: '900', location: 'us', store: 'evga'}, true)
  
  res.sendStatus(200)
})

// app.configure(function(){
//   // server.use('/media', express.static(__dirname + '/media'));
//   // server.use(express.static(__dirname + '/public'));
//   server.use(express.static(__dirname))
// });

app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => {})


