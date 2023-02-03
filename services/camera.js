import Recorder, { RecorderEvents } from 'rtsp-video-recorder'

var started = false
var lastProgress = new Date()
var recorder = null
const streamURL = 'rtsp://admin:wlp33cka@10.0.1.158/live'

export function startCamera() {

  recorder = new Recorder.Recorder(streamURL, 'D:/Github/dashboard/videos', {
    title: 'Rercordings',
    filePattern: '%Y.%m.%d/%H.%M.%S',
    segmentTime: 60,
    noAudio: false,
    ffmpegBinary: 'ffmpeg',
  })
  
  recorder.on(RecorderEvents.START, (payload) => {
    started = true
  })
  
  recorder.on(RecorderEvents.STOP, (payload) => {
    started = false
  })
  
  recorder.on(RecorderEvents.ERROR, (payload) => {})
  
  recorder.on(RecorderEvents.PROGRESS, (payload) => {
    lastProgress = new Date()
  })
  
  recorder.start()

  setInterval(function() {
    if (new Date() - lastProgress > 20000) {
      if (started) {
        recorder.stop()
      } else {
        recorder.start()
      }
    }
  }, 5000)
}

export function test() {
  if (started) {
    started = false
    recorder.stop();
    console.log("=============== Stopping")
  } else {
    started = true
    recorder.start();
    console.log("=============== Starting")
  }
}
