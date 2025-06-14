var notifyClientCopy

export function getAlexaStatus() {
  return {}
}

export async function startAlexa(notifyClients, production) {
  notifyClientCopy = notifyClients
}

export function setAlexaCode(code) {
  notifyClientCopy({
    receivedCode: code
  })

}