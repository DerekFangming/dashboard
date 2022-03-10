$( document ).ready(function() {

  var serverState
  var lastStatusDate = new Date()
  var statusFailedCount = 0

  var garageState

  const bgGreen = '#c3e6cb'
  const bgDarkGreen = '#28a745'
  const bgYellow = '#fad673'
  const bgRed = '#f8d7da'
  const bgDarkRed = '#dc3545'

  loadStatus();
  setInterval(function() {
    loadStatus();
  }, 2000);

  function loadStatus() {
    $.ajax({
      url: 'status',
      type: 'GET',
      dataType: 'json',
      contentType: 'application/json',
      success: function(data, textStatus, request) {

        statusFailedCount = 0
        lastStatusDate = new Date()

        setServerState(true)
        setGarageState(data.myq)
        setNicehashState(data.nh)
        setWeatherState(data.weather)

      },
      error: function(xhr, status, errMsg){
        statusFailedCount ++;
        if (statusFailedCount >= 5) {
          setServerState(false, lastStatusDate)
        }
      }
    });
  }

  function setServerState(state, time = undefined) {
    
    if (serverState == state) return
      serverState = state
    if (serverState) {
      $('.server-status').css('background-color', bgGreen)
      $('#serverStateTxt').html('<big>Connected</big>')
    } else {
      $('.server-status').css('background-color', bgRed)
      $('#serverStateTxt').html(`<big>Disconnected</big><small class="ml-1">Last seen ${time.toLocaleTimeString()}</small>`)
    }
  }

  function setGarageState(state) {
    if (garageState == state.state) return
    garageState = state.state
    $('#garageStateTxt').html(garageState == 'open' ? `<big>Open</big><small class="ml-1">Since ${new Date(state.since).toLocaleTimeString()}</small>`
      : `<big class="text-capitalize">${garageState}</big>`)

    if (garageState == 'closed') {
      $('.garage-status').css('background-color', bgGreen)
    } else if (garageState == 'closing' || garageState == 'opening') {
      $('.garage-status').css('background-color', bgYellow)
    } else {
      $('.garage-status').css('background-color', bgRed)
    }
  }

  var nhBtcState
  var minorState
  var desktopState
  function setNicehashState(state) {
    if (nhBtcState != state.btc) {
      nhBtcState = state.btc
      $('#nhBtcTxt').html(`BTC : ${state.btc.toFixed(5)}`)
      $('#nhUsdTxt').html(`USD: ${state.usd.toFixed(2)}`)
    }

    if (minorState != state.minor.speed) {
      minorState = state.minor.speed
      if (state.minor.status == 'MINING') {
        $('.minor-status').css('background-color', bgGreen)
        $('#nhMinorStatTxt').html(`Minor - Mining - ${Math.floor(state.minor.speed)} MH/s`)
        let html = ''
        let deviceDead = false
        for (let d of state.minor.devices) {
          let name = d.name.endsWith('Ti') ? d.name : d.name + '&nbsp&nbsp&nbsp'
          html += `<p class="mb-0">${name} - ${d.speed.toFixed(2)} MH/s - ${d.temp} °C - ${d.power} W </p>`
          if (d.speed == 0) deviceDead = true
        }
        if (deviceDead || state.minor.devices.length < 7) $('.minor-status').css('background-color', bgYellow)
        $('#nhMinorDevicesBlk').html(html)
      } else {
        $('.minor-status').css('background-color', bgRed)
        $('#nhMinorStatTxt').html('Minor - ' + state.minor.status)
        $('#nhMinorDevicesBlk').html('')
        
      }
    }

    if (desktopState != state.desktop.speed) {
      desktopState = state.desktop.speed
      if (state.desktop.status == 'MINING') {
        $('.desktop-status').css('background-color', bgGreen)
        $('#nhDesktopStatTxt').html(`Desktop - Mining - ${Math.floor(state.desktop.speed)} MH/s`)
        let html = ''
        let deviceDead = false
        for (let d of state.desktop.devices) {
          let name = d.name.endsWith('Ti') ? d.name : d.name + '&nbsp&nbsp&nbsp'
          html += `<p class="mb-0">${name} - ${d.speed.toFixed(2)} MH/s - ${d.temp} °C - ${d.power} W </p>`
          if (d.speed == 0) deviceDead = true
        }
        if (deviceDead || state.desktop.devices.length < 1) $('.desktop-status').css('background-color', bgYellow)
        $('#nhDesktopDevicesBlk').html(html)
      } else {
        $('.desktop-status').css('background-color', bgRed)
        $('#nhDesktopStatTxt').html('Desktop - ' + state.desktop.status)
        $('#nhDesktopDevicesBlk').html('')
      }
    }
    
  }

  var weatherState
  function setWeatherState(weather) {
    if (weatherState == weather[1].time) return
    weatherState = weather[1].time

    let html = ''
    for (let w of weather) {
      html += `<div class="col"><p class="mb-0 ml-1">${w.time}</p><img src="http://openweathermap.org/img/wn/${w.icon}.png"/><p class="mb-0 ml-2">${w.temp} °C</p></div>`
    }
    $('#weather').html(html)
  }
  
  loadStocks()
  setInterval(function() {
    loadStocks()
  }, 15000)

  var token
  function loadStocks() {
    if (token == undefined) token = atob('c2FuZGJveF9jOGoxcWEyYWQzaWZnOHRjNzNlZw==')
    axios({ method: 'get', url: 'https://finnhub.io/api/v1/quote?symbol=VOO&token=' + token}).then((response) => {
      $('.voo-status').css('background-color', getStockBgColor(response.data.dp))
      $('#vooStateTxt').html(`<big>$ ${response.data.c.toFixed(2)}</big><br /><small> $${response.data.d.toFixed(2)}(${response.data.dp.toFixed(2)}%)</small>`)
    })
    axios({ method: 'get', url: 'https://finnhub.io/api/v1/quote?symbol=SAIL&token=' + token}).then((response) => {
      $('.sail-status').css('background-color', getStockBgColor(response.data.dp))
      $('#sailStateTxt').html(`<big>$ ${response.data.c.toFixed(2)}</big><br /><small> $${response.data.d.toFixed(2)}(${response.data.dp.toFixed(2)}%)</small>`)
    })
    axios({ method: 'get', url: 'https://finnhub.io/api/v1/quote?symbol=BTC-USD&token=' + token}).then((response) => {
      $('.btc-status').css('background-color', getStockBgColor(response.data.dp))
      $('#btcStateTxt').html(`<big>$ ${response.data.c.toFixed(2)}</big><br /><small> $${response.data.d.toFixed(2)}(${response.data.dp.toFixed(2)}%)</small>`)
    })
    axios({ method: 'get', url: 'https://finnhub.io/api/v1/quote?symbol=ETH-USD&token=' + token}).then((response) => {
      $('.eth-status').css('background-color', getStockBgColor(response.data.dp))
      $('#ethStateTxt').html(`<big>$ ${response.data.c.toFixed(2)}</big><br /><small> $${response.data.d.toFixed(2)}(${response.data.dp.toFixed(2)}%)</small>`)
    })
  }

  function getStockBgColor(dp) {
    if (dp <= -5) return bgDarkRed
    if (dp < 0) return bgRed
    if (dp < 5) return bgGreen
    return bgDarkGreen
  }

});