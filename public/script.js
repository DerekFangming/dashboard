$( document ).ready(function() {

  var serverState
  var lastStatusDate = new Date()
  var statusFailedCount = 0

  var garageState

  const bgGreen = '#c3e6cb'
  const bgYellow = '#fad673'
  const bgRed = '#f8d7da'

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
        $('#nhMinorStatTxt').html('Minor - Stopped')
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
        $('#nhDesktopStatTxt').html('Desktop - Stopped')
        $('#nhDesktopDevicesBlk').html('')
        
      }
    }
    
  }
  
  loadStocks()
  setInterval(function() {
    loadStocks()
  }, 15000)

  function loadStocks() {
    axios({ method: 'get', url: 'https://finnhub.io/api/v1/quote?symbol=VOO&token=sandbox_c8j1qa2ad3ifg8tc73eg'}).then((response) => {
      $('.voo-status').css('background-color', response.data.dp < 0 ? bgRed : bgGreen)
      $('#vooStateTxt').html(`<big>$ ${response.data.c.toFixed(2)}</big><br /><small> $${response.data.d.toFixed(2)}(${response.data.dp.toFixed(2)}%)</small>`)
    })
    axios({ method: 'get', url: 'https://finnhub.io/api/v1/quote?symbol=SAIL&token=sandbox_c8j1qa2ad3ifg8tc73eg'}).then((response) => {
      $('.sail-status').css('background-color', response.data.dp < 0 ? bgRed : bgGreen)
      $('#sailStateTxt').html(`<big>$ ${response.data.c.toFixed(2)}</big><br /><small> $${response.data.d.toFixed(2)}(${response.data.dp.toFixed(2)}%)</small>`)
    })
    axios({ method: 'get', url: 'https://finnhub.io/api/v1/quote?symbol=BTC-USD&token=sandbox_c8j1qa2ad3ifg8tc73eg'}).then((response) => {
      $('.btc-status').css('background-color', response.data.dp < 0 ? bgRed : bgGreen)
      $('#btcStateTxt').html(`<big>$ ${response.data.c.toFixed(2)}</big><br /><small> $${response.data.d.toFixed(2)}(${response.data.dp.toFixed(2)}%)</small>`)
    })
    axios({ method: 'get', url: 'https://finnhub.io/api/v1/quote?symbol=ETH-USD&token=sandbox_c8j1qa2ad3ifg8tc73eg'}).then((response) => {
      $('.eth-status').css('background-color', response.data.dp < 0 ? bgRed : bgGreen)
      $('#ethStateTxt').html(`<big>$ ${response.data.c.toFixed(2)}</big><br /><small> $${response.data.d.toFixed(2)}(${response.data.dp.toFixed(2)}%)</small>`)
    })
  }

});