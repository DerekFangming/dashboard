import { AfterViewInit, Component, ElementRef, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core'
import { NotifierService } from 'angular-notifier'
import { environment } from 'src/environments/environment'
import { Chart, registerables } from 'chart.js'
import { DOCUMENT } from '@angular/common'
import 'chartjs-adapter-moment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {

  connected = true
  ws: WebSocket
  heartbeatInterval: any
  greencardChart: any

  env = environment

  myq: any
  nh: any
  weather: any
  server: any
  stock: any
  smartthings: any
  alerts: any
  scholar: any
  alexa: any
  greencard: any

  cardRateMin = new Map()
  focusLiveStream = false

  @ViewChild('errModal', { static: true}) errModal: TemplateRef<any>

  private readonly notifier: NotifierService;
  constructor(@Inject(DOCUMENT) private document, private elementRef:ElementRef, private notifierService: NotifierService) {
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

  ngAfterViewInit() {
    const s = this.document.createElement('script');
    s.type = 'text/javascript';
    s.innerHTML = `player = new JSMpeg.Player('ws://10.0.1.${environment.production ? '100' : '50'}:9999', { canvas: document.getElementById('camera')})`
    console.log(s.innerHTML)
    this.elementRef.nativeElement.appendChild(s);
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
      if ('scholar' in status) that.scholar = status.scholar
      if ('alexa' in status) that.alexa = status.alexa
      if ('greencard' in status) {
        that.greencard = status.greencard
        that.updateChart()
      }
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

  getTimeDifferent(sec) {
    let date = new Date(0)
    date.setUTCSeconds(sec);

    let diff = Math.abs(new Date().valueOf() - date.valueOf()) / 36e5
    return diff.toFixed(2) + ' hours ago'
  }
  
  readableDate(string) {
    return new Date(string).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }

  liveStreamClicked() {
    this.focusLiveStream = !this.focusLiveStream
  }

  updateChart() {
    if (this.greencard == null) return

    let label = []
    let eb1 = []
    let eb2 = []
    let eb3 = []

    for (let dp of this.greencard.reverse()) {
      console.log(dp)
      label.push(dp.label)
      eb1.push(new Date(dp.eb1))
      eb2.push(new Date(dp.eb2))
      eb3.push(new Date(dp.eb3))
    }

    // this.greencard.data.forEach(h=> {
    //   let date = new Date(0)
    //   date.setUTCSeconds(h.time)

    //   let diff = Math.floor(Math.abs(new Date().valueOf() - date.valueOf()) / 36e5)
    //   if (diff > 23) diff = 0
    //   else diff = 23 - diff

      
    // })

    if (this.greencardChart != null) this.greencardChart.destroy()

    let barCanvasEle: any = document.getElementById('greencardChart')
    this.greencardChart = new Chart(barCanvasEle.getContext('2d'), {
      type: 'line',
      data: {
        labels: label,
        datasets: [{
          data: eb1,
          backgroundColor: "#50c878",
        }, 
        {
          data: eb2,
          backgroundColor: "#36a2eb",
        }, 
        {
          data: eb3,
          backgroundColor: "#ff7373",
        }]
      },
      options: {
        maintainAspectRatio: false,
        scales: {
            x: {
              // grid: {
              //   display: false
              // }
            },
            y: {
              type: 'time',
              min: '08MAY19',
              max: '08AUG23'
              // grid: {
              //   display: false
              // }
            }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    })

    // return this.helium.status
  }
}
