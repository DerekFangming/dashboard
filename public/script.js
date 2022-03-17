$( document ).ready(function() {

  var checkPoint = ''

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
      url: 'status?checkPoint=' + checkPoint,
      type: 'GET',
      dataType: 'json',
      contentType: 'application/json',
      success: function(data, textStatus, request) {
        // Reset server status
        statusFailedCount = 0
        lastStatusDate = new Date()
        setServerState(true)


        if (data.checkPoint) {
          checkPoint = data.checkPoint

          setGarageState(data.myq)
          setNicehashState(data.nh)
          setWeatherState(data.weather)
          setAlertState(data.alerts)
        }

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
  var minerState
  var desktopState
  function setNicehashState(state) {
    if (nhBtcState != state.btc) {
      nhBtcState = state.btc
      $('#nhBtcTxt').html(`BTC : ${state.btc.toFixed(5)}`)
      $('#nhUsdTxt').html(`USD: ${state.usd.toFixed(2)}`)
    }
    
    setMinerState(minerState, state, 'miner')
    setMinerState(desktopState, state, 'desktop')
  }
  
  function setMinerState(preState, state, name) {
    if (preState != state[name].status + state[name].speed) {
      preState = state[name].status + state[name].speed
      let displayName = capitalize(name)
      if (state[name].status == 'MINING') {
        $(`.${name}-status`).css('background-color', bgGreen)
        $(`#nh${displayName}StatTxt`).html(displayName + ` - Mining - ${state[name].speed.toFixed(2)} MH/s`)
        let html = `<p class="mb-0"><b>Joined for ${(Math.abs(new Date() - new Date(state[name].joined)) / 36e5).toFixed(2)} hours</b></p>`
        for (let d of state[name].devices) {
          let name = d.name.endsWith('Ti') ? d.name : d.name + '&nbsp&nbsp&nbsp&nbsp'
          let style = (d.speed <= 0 || d.temp >= 75) ?  `style="background-color:${bgYellow}"` : ''
          html += `<p class="mb-0" ${style}>${name} - ${d.speed.toFixed(2)} MH/s - ${d.temp} °C - ${d.power < 0 ? 0 : d.power} W </p>`
        }
        $(`#nh${displayName}DevicesBlk`).html(html)
      } else {
        $(`.${name}-status`).css('background-color', bgRed)
        $(`#nh${displayName}StatTxt`).html(displayName + ' - ' + capitalize(state[name].status))
        $(`#nh${displayName}DevicesBlk`).html('')
      }
    }
  }

  var weatherState
  function setWeatherState(weather) {
    if (weatherState == weather[1].time) return
    weatherState = weather[1].time

    let html = ''
    for (let w of weather) {
      let style = (w.temp <= 3 || w.wind > 10) ? `style="background-color:${bgYellow}"` : ''
      html += `<div class="col py-2 px-1 text-center" ${style}><p class="mb-0">${w.time}</p><img src="http://openweathermap.org/img/wn/${w.icon}.png"/><p class="mb-0">${w.temp} °C</p><p class="mb-0">${w.wind} MPH</p></div>`
    }
    $('#weather').html(html)
  }

  var alertsState
  function setAlertState(alerts) {
    if (alertsState == alerts) return
    alertsState = alerts

    let html = ''
    if (alerts != undefined) {
      for (let a of alerts) {
        html += `<div class="col-12">
                  <div class="card" style="background-color: ${a.level == 'info' ? bgGreen : a.level == 'warn' ? bgYellow : bgRed};">
                    <div class="card-body py-2">
                      <div class="text-center">
                        <p class="card-text mb-0 lead"><span class=" mr-2"><b>${a.msg}</b></span></p>
                      </div>
                    </div>
                  </div>
                </div>`
      }
    }
    $('#alerts').html(html)
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

  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }

});