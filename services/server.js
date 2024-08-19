
import os from 'os-utils'
import fs from 'fs'
import * as cp from 'child_process'
import { addAlert, HOUR_MS } from './alert.js'

var cpu = 0.0
var mem = 0.0
var networkIn = ''
var networkOut = ''

export function getServerStatus() {
  return { server: {
      cpu: cpu,
      mem: mem,
      networkIn: networkIn,
      networkOut: networkOut
    }
  }
}

export function startServerStatus(notifyClients, production) {
  process.memoryUsage()
  getStatus(notifyClients, production)
  setInterval(function() {
    getStatus(notifyClients, production)
  }, production ? 5000 : 30000)

  // if (production) {
  //   const child = cp.spawn('nload', ['-k', 'eth0'], { shell: true })
  //   child.stdout.on('data', (data) => {
        
  //     data =  data.toString()
  //     if (data.includes('Incoming') && data.includes('Outgoing')) {
  //         var myRegexp = new RegExp('Curr: (.*?\\/s)', 'g')
  //         var matches = myRegexp.exec(data);
          
  //         if (!matches || matches.length < 2) return
  //         networkIn = kbToMb(matches[1])
          
  //         matches = myRegexp.exec(data)
  //         if (matches && matches.length >= 2) networkOut = kbToMb(matches[1])
  //     }
  //   })

  //   child.stderr.on('data', (data) => {
  //     addAlert('server', 'error', 'Failed to load network status: ' + data, HOUR_MS * 2)
  //   });
    
  //   child.on('close', (code) => {
  //     addAlert('serverClosed', 'error', 'Network process stopped with code ' + code, HOUR_MS * 5)
  //   });
  // }
}

function getStatus(notifyClients, production) {
  os.cpuUsage(function(v){
    cpu = v * 100
    cpu = Math.round(cpu * 100) / 100
  })

  var memUsed = 0.0
  var memTotal = os.totalmem()
  if (production) {
    memUsed = Number(/Active:[ ]+(\d+)/.exec(fs.readFileSync('/proc/meminfo', 'utf8'))[1]) / 1000
  } else {
    memUsed = memTotal - os.freemem()
  }

  mem = memUsed / memTotal * 100
  mem = Math.round(mem * 100) / 100

  notifyClients(getServerStatus())
}

function kbToMb(speed) {
  speed = speed.trim()
  let arr = speed.split(' ')
  if (arr.length != 2 || arr[1] == 'MBit/s') return speed

  let s = parseFloat(arr[0]) / 1000
  return s.toFixed(2) + ' MBit/s'
}
  

