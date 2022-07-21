import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core'
import { NotifierService } from 'angular-notifier'
import { environment } from 'src/environments/environment'
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  connected = true
  ws: WebSocket
  heartbeatInterval: any

  env = environment

  myq: any
  nh: any
  weather: any
  server: any
  stock: any
  smartthings: any
  alerts: any
  helium: any

  cardRateMin = new Map()

  @ViewChild('errModal', { static: true}) errModal: TemplateRef<any>

  private readonly notifier: NotifierService;
  constructor(private elementRef:ElementRef, private notifierService: NotifierService) {
    this.notifier = notifierService
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.cardRateMin.set('2080 Ti', 55)
    this.cardRateMin.set('3060', 47)
    this.cardRateMin.set('3060 Ti', 58)
    this.cardRateMin.set('3070', 61)
    this.cardRateMin.set('3070 Ti', 40)
    this.connect()
  }

  connect() {
    this.ws = new WebSocket(environment.socketAddress)
    let that = this

    this.ws.onopen = function (event) {
      that.connected = true

      // heartbeat
      if (that.heartbeatInterval != undefined) {
        clearInterval(that.heartbeatInterval)
      }
      that.heartbeatInterval = setInterval(function() {
        that.ws.send('heatbeat')
      }, 3000)
    }

    this.ws.onmessage = function (data) {
      console.log('received: %s', data.data)
      let status = JSON.parse(data.data)

      if ('myq' in status) that.myq = status.myq
      if ('nh' in status) that.nh = status.nh
      if ('weather' in status) that.weather = status.weather
      if ('server' in status) that.server = status.server
      if ('stock' in status) that.stock = status.stock
      if ('smartthings' in status) that.smartthings = status.smartthings
      if ('alerts' in status) that.alerts = status.alerts
      if ('helium' in status) that.helium = status.helium
  
    }

    this.ws.onclose = function (data) {
      that.connected = false
      if (that.heartbeatInterval != undefined) {
        clearInterval(that.heartbeatInterval)
      }
      setTimeout(function() {
        if (!that.connected) that.connect()
      }, 5000)
    }

    this.ws.onerror = function (data) {
      that.ws.close();
    }

  }

  restartMiner() {
    this.ws.send('restartMiner')
    this.notifier.notify('success', 'Restart miner request sent.')
  }

  toggleMinorFan() {
    this.ws.send('toggleMinorFan')
    this.notifier.notify('success', 'Toggle miner fan request sent.')
  }

  toggleHideAlert() {
    this.ws.send('toggleHideAlert')
    if (this.nh) this.nh.hideAlert = !this.nh.hideAlert
  }

  getMinerStatus(name) {
    if (this.nh[name].status == 'MINING') {
      return ' - Mining - ' + this.nh[name].speed.toFixed(2) + ' MH/s'
    }
    return this.capitalize(this.nh[name].status)
  }

  getMinerJoinTime(name) {
    return `Joined for ${(Math.abs(new Date().valueOf() - new Date(this.nh[name].joined).valueOf()) / 36e5).toFixed(2)} hours`
  }

  getDeviceStyle(device) {
    return (device.speed <= 0 || (device.temp >= 75 && device.temp < 200) || this.cardRateMin.get(device.name) > device.speed) ? 'bg-yellow' : ''
  }

  getDeviceStatus(device) {
    return ` - ${device.speed.toFixed(2)} MH/s - ${device.temp} °C - ${device.power < 0 ? 0 : device.power} W`
  }

  getStockStyle(dp) {
    if (dp <= -5) return 'bg-dark-red'
    if (dp < 0) return 'bg-red'
    if (dp < 5) return 'bg-green'
    return 'bg-dark-green'
  }

  updateChart() {
    let witnesses = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    let rewards = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    this.helium.data.forEach(h=> {
      let date = new Date(0)
      date.setUTCSeconds(h.time)

      let diff = Math.floor(Math.abs(new Date().valueOf() - date.valueOf()) / 36e5)
      if (diff > 23) diff = 0
      else diff = 23 - diff

      if (h.type=='poc_receipts_v2') witnesses[diff] = witnesses[diff] + 1
      else if (h.type=='rewards_v2') rewards[diff] = rewards[diff] + 1
    })


    const barCanvasEle: any = document.getElementById('heliumChart')
    const barChart = new Chart(barCanvasEle.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['24', '23', '22', '21', '20', '19', '18', '17', '16', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
        datasets: [{
          label: 'Witness',
          data: witnesses,
          backgroundColor: "#50c878",
        }, 
        {
          label: 'Rewards',
          data: rewards,
          backgroundColor: "#36a2eb",
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // plugins: {
        //   title: {
        //     display: true,
        //     text: 'Helium Status'
        //   },
        // },
        scales: {
            x: {
              stacked: true,
              grid: {
                display: false
              }
            },
            y: {
              stacked: true,
              grid: {
                display: false
              }
            }
        }
      }
    })

    return this.helium.status
  }

  getTimeDifferent(sec) {
    let date = new Date(0)
    date.setUTCSeconds(sec);

    let diff = Math.abs(new Date().valueOf() - date.valueOf()) / 36e5
    return diff.toFixed(2) + ' hours ago'
    // return date.toLocaleTimeString()
  }
  
  readableDate(string) {
    return new Date(string).toLocaleTimeString()
  }

  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }
}
