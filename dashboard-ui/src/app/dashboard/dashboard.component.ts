import { AfterViewInit, Component, ElementRef, Inject, OnInit } from '@angular/core'
import { Chart, registerables } from 'chart.js'
import { CommonModule, DOCUMENT } from '@angular/common'
import 'chartjs-adapter-moment';
import { NotificationsService } from 'angular2-notifications'
import { RouterOutlet } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { CardComponent } from '../card/card.component'
import { environment } from '../../environments/environment'

declare var $: any

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule, CardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {

  connected = true
  ws: WebSocket | undefined
  heartbeatInterval: any
  greencardChart: any
  weatherChart: any

  env = environment

  door: any
  weather: any
  server: any
  stock: any
  alerts: any
  scholar: any
  alexa: any
  greencard: any
  greencardCase: any
  zillow: any
  garage: any

  mode = 'ipad'
  focusLiveStream = false

  constructor(@Inject(DOCUMENT) private document: any, private elementRef:ElementRef, private notifierService: NotificationsService) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    if (typeof window !== "undefined") {
      if (window.screen.width >= 1366 || (window.screen.height == 1366 && window.screen.width == 1024)) {
        this.mode = 'large' //ipad
      } else if (window.screen.width < 1366 && window.screen.width >= 700) {
        this.mode = 'medium' // fridge
      } else {
        this.mode = 'small'
      }
    }
    this.connect()
  }

  ngAfterViewInit() {
    if (typeof window !== "undefined") {
      let isPublic = window.location.href.includes('fmning')
      let cameraStreamUrl = isPublic ? 'wss://dashboard.fmning.com/camera' : environment.production ? 'ws://10.0.1.100:9999' : 'ws://10.0.1.50:9999'
      
      const s = this.document.createElement('script')
      s.type = 'text/javascript'
      s.innerHTML = `player = new JSMpeg.Player('${cameraStreamUrl}', { canvas: document.getElementById('camera')})`
      this.elementRef.nativeElement.appendChild(s)
    }
  }

  connect() {
    let wsHost = environment.socketAddress
    if (this.document.location.hostname == 'localhost' || this.document.location.hostname.startsWith('10.0')) {
      wsHost = `ws://${this.document.location.hostname}:9002`
    }
    console.log('Connecting to ' + wsHost)
    this.ws = new WebSocket(wsHost)
    let that = this

    this.ws.onopen = function (event) {
      that.connected = true

      // heartbeat
      if (that.heartbeatInterval != undefined) {
        clearInterval(that.heartbeatInterval)
      }
      that.heartbeatInterval = setInterval(function() {
        that.ws?.send('heatbeat')
      }, 3000)
    }

    this.ws.onmessage = function (data) {
      console.log('received: %s', data.data)
      let status = JSON.parse(data.data)

      if ('door' in status) that.door = status.door
      if ('server' in status) that.server = status.server
      if ('stock' in status) that.stock = status.stock
      if ('alerts' in status) that.alerts = status.alerts
      if ('scholar' in status) that.scholar = status.scholar
      if ('alexa' in status) that.alexa = status.alexa
      if ('zillow' in status) that.zillow = status.zillow
      if ('garage' in status) that.garage = status.garage
      if ('greencard' in status) {
        that.greencard = status.greencard
        that.updateGreencardChart()
      }
      if ('greencardCase' in status) that.greencardCase = status.greencardCase
      
      if ('weather' in status) {
        that.weather = status.weather
        that.updateWeatherChart()
      }

    }

    this.ws.onclose = function (data) {
      that.connected = false
      that.server = null
      if (that.heartbeatInterval != undefined) {
        clearInterval(that.heartbeatInterval)
      }
      setTimeout(function() {
        if (!that.connected) that.connect()
      }, 5000)
    }

    this.ws.onerror = function (data) {
      that.ws?.close()
    }

  }

  restartLiveStream() {
    this.ws?.send('restartLiveStream')
    this.notifierService.success(null, 'Restart live stream request sent.')
  }

  getStockStyle(dp: any) {
    if (dp <= -5) return 'bg-dark-red'
    if (dp < 0) return 'bg-red'
    if (dp < 5) return 'bg-green'
    return 'bg-dark-green'
  }

  liveStreamClicked() {
    this.focusLiveStream = !this.focusLiveStream
  }

  reloadPage() {
    location.reload()
  }

  showInfo() {
    this.notifierService.success('Success', `Window height: ${window.screen.height}, width: ${window.screen.width}`)
  }

  updateGreencardChart() {
    if (this.greencard == null) return

    let label = [], eb1 = [], eb2 = [], eb3 = [], nfmPD = [], ONE_MONTH = 2592000000
    let max = Number.MIN_SAFE_INTEGER, min = Number.MAX_SAFE_INTEGER
    
    for (let dp of this.greencard) {
      max = Math.max.apply(Math, [max, (dp.eb1 ? dp.eb1 : Number.MIN_SAFE_INTEGER), dp.eb2, dp.eb3])
      min = Math.min.apply(Math, [min, (dp.eb1 ? dp.eb1 : Number.MAX_SAFE_INTEGER), dp.eb2, dp.eb3])
    }

    for (let dp of this.greencard) {
      label.push(dp.label)
      eb1.push(dp.eb1 ? dp.eb1 : max + ONE_MONTH)
      eb2.push(dp.eb2)
      eb3.push(dp.eb3)
      nfmPD.push(1604120400000) // 2020/10/31
    }

    if (this.greencardChart != null) this.greencardChart.destroy()

    let barCanvasEle: any = this.document.getElementById('greencardChart')
    if (barCanvasEle == null) return // Fix server side rendering
    this.greencardChart = new Chart(barCanvasEle.getContext('2d'), {
      type: 'line',
      data: {
        labels: label,
        datasets: [{
          data: eb1,
          borderWidth:5,
          backgroundColor: "#50c878",
          borderColor: "#50c878",
          label: "EB1",
          pointRadius: 0
        },
        {
          data: eb3,
          borderWidth:5,
          backgroundColor: "#ff7373",
          borderColor: "#ff7373",
          label: "EB3",
          pointRadius: 0
        },
        {
          data: eb2,
          borderWidth:5,
          backgroundColor: "#36a2eb",
          borderColor: "#36a2eb",
          label: "EB2",
          pointRadius: 0
        },
        {
          data: nfmPD,
          borderWidth:5,
          backgroundColor: "#666666",
          borderColor: "#666666",
          label: "PD",
          pointRadius: 0
        }]
      },
      options: {
        interaction: {
          intersect: false
        },
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {font: {size: 15, weight: 'bold'} },
          },
          y: {
            type: 'time',
            min: min - ONE_MONTH,
            max: max + ONE_MONTH,
            ticks: {font: {size: 15, weight: 'bold'},
            },
          },
        }
      }
    })
  }

  updateWeatherChart() {
    if (this.weather == null) return

    let label = [], temp = [], wind = [], icon = []
    for (let w of this.weather) {
      let hour = new Date(w.time).getHours() + 1
      label.push(`${hour % 12} ${hour >= 12 && hour < 24 ? 'PM' : 'AM'}`)
      temp.push(w.temp)
      wind.push(w.wind)
      let img = this.document.createElement("img")
      img.height = 30
      img.width = 30
      img.src = `https://openweathermap.org/img/wn/${w.icon}.png`
      icon.push(img)
    }

    if (this.weatherChart != null) this.weatherChart.destroy()
      let img = this.document.createElement("img")
      img.height = 30
      img.width = 30
      img.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStkCgp2U1hHVVtWcf_SD4tVyLqA49lhgygEed0PPPKOZxcevudk3NZ1trGyhpAAMIJysc&usqp=CAU';

    let barCanvasEle: any = this.document.getElementById('weatherChart')
    if (barCanvasEle == null) return // Fix server side rendering
    this.weatherChart = new Chart(barCanvasEle.getContext('2d'), {
      type: 'line',
      data: {
        labels: label,
        datasets: [{
          data: temp,
          borderWidth:5,
          backgroundColor: "#065535",
          borderColor: "#065535",
          label: "Temperature (C)",
          yAxisID: 'yTemp',
          pointStyle: function(context) {
            return icon[context.dataIndex]
          }
        }, 
        {
          data: wind,
          borderWidth:5,
          backgroundColor: "#00ced1",
          borderColor: "#00ced1",
          label: "Wind (mph)",
          yAxisID: 'yWind',
          pointRadius: 0
        }]
      },
      options: {
        interaction: {
          intersect: false
        },
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {font: {size: 15, weight: 'bold'} },
          },
          yTemp: {
            position: 'left',
            ticks: {font: {size: 15, weight: 'bold'}}
          },
          yWind: {
            position: 'right',
            ticks: {font: {size: 15, weight: 'bold'}}
          },
        }
      }
    })
  }

}
