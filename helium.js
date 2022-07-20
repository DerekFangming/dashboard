import axios from "axios"

var status = 'Unknown'
var gap = '0'
var data = []

export function getHeliumStatus() {
  return { helium: {
      status: status,
      gap: gap,
      data: data
    }
  }
}

var notifyClientCopy

function getStatus() {
  axios.get(`https://api.helium.io/v1/hotspots//112n1rehHZRo1qxqD9ksd5zzdBAVtJaAMopo6BeWX3tjxpc3zeQd/roles`).then( res => {
    let cursor = res.data.cursor
    axios.get(`https://api.helium.io/v1/hotspots//112n1rehHZRo1qxqD9ksd5zzdBAVtJaAMopo6BeWX3tjxpc3zeQd/roles?cursor=` + cursor).then( res => {
      let rawData = res.data.data.sort((a, b) => a - b)

      // for (const rd of rawData) {
      //   let date = new Date(0)
      //   date.setUTCSeconds(rd.time);
    
      //   let diff = Math.abs(new Date().valueOf() - date.valueOf()) / 36e5
      //   console.log(rd.type + ' ' + diff.toFixed(2) + ' hours ago')
      // }

      if (rawData.length > 6) rawData = rawData.slice(0, 6)

      data = []
      for (const rd of rawData) {
        data.push({type: rd.type, time: rd.time})
      }

      notifyClientCopy(getHeliumStatus())
    }).catch(e => {
      status = 'Failed to retrieve rewards.'
      notifyClientCopy(getHeliumStatus())
    })
  }).catch(e => {
    status = 'Failed to retrieve cursor.'
    notifyClientCopy(getHeliumStatus())
  })

}

export function startHelium(notifyClients, production) {
  notifyClientCopy = notifyClients

  getStatus()
  setInterval(function() {
    getStatus()
  }, 300000)
}
