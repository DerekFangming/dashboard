import axios from "axios"

const accessToken = Buffer.from('Y2Q4NzdkNWMwZmVkNDg4YjEwYTI3NmM3ZmViMGNiYzY=', 'base64').toString('ascii')
const secretToken = Buffer.from('OWE5N2E0MjAyNTkzZDVmNzQ3Mzk5NzAxNmJmOGJmZDk=', 'base64').toString('ascii')

export function startTesla() {

  setInterval(function() {

    axios.get('https://www.tesla.com/inventory/api/v1/inventory-results', {
      params: {
        query: '{"query":{"model":"my","condition":"new","options":{},"arrangeby":"Price","order":"asc","market":"US","language":"en","super_region":"north america","lng":-97.64938579999999,"lat":30.3558863,"zip":"78754","range":200,"region":"TX"},"offset":0,"count":50,"outsideOffset":0,"outsideSearch":false}'
      }
    }).then(res => {
      console.log('Found ' + res.data.total_matches_found + ' cars')
      if (res.data.total_matches_found > 0) {
        axios.get('https://api.voicemonkey.io/trigger', {
          params: {
            access_token: accessToken,
            secret_token: secretToken,
            monkey: 'voice',
            announcement: 'Tesla is in stock now',
            chime: 'soundbank://soundlibrary/alarms/air_horns/air_horn_01'
          }
        })
      }
    })

  }, 60000)
  
}