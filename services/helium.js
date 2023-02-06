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

      let newData = []
      for (const rd of rawData) {
        let date = new Date(0)
        date.setUTCSeconds(rd.time);
    
        if (Math.abs(new Date().valueOf() - date.valueOf()) / 36e5 < 25) newData.push({type: rd.type, time: rd.time})
      }

      if (newData.length != data.length) {
        data = newData
        notifyClientCopy(getHeliumStatus())
      } else {
        for(var i = 0; i< newData.length; i++){
          if (newData[i].time != data[i].time) {
            data = newData
            notifyClientCopy(getHeliumStatus())
            break
          }
        }
      }
      
    }).catch(e => {
      status = 'Failed to retrieve rewards.'
      console.log(e)
      notifyClientCopy(getHeliumStatus())
    })
  }).catch(e => {
    status = 'Failed to retrieve cursor.'
    console.log(e)
    notifyClientCopy(getHeliumStatus())
  })

}

export function startHelium(notifyClients, production) {
  notifyClientCopy = notifyClients

  getStatus()
  setInterval(function() {
    getStatus()
  }, production ? 300000 : 3000000)
}
