var garage
var door
var unknown
var notifyClientCopy

export function getAlexaStatus() {
  return {...garage, ...door, ...unknown}
}

export function startAlexa(notifyClients) {
  notifyClientCopy = notifyClients
}

export function setAlexaCode(code) {
  switch(code) {
    case 0:
      door = {door: 'locked'}
      notifyClientCopy(door)
      break
    case 1:
      door = {door: 'unlocked'}
      notifyClientCopy(door)
      break
    case 2:
      door = {door: 'jammed'}
      notifyClientCopy(door)
      break
    case 3:
      garage = {garage: 'closed'}
      notifyClientCopy(garage)
      break
    case 4:
      garage = {garage: 'open'}
      notifyClientCopy(garage)
      break
    default:
      unknown = {alexaUnknown: code}
      notifyClientCopy(unknown)
      break
  }
}