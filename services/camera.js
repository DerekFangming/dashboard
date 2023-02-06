import Recorder, { RecorderEvents } from 'rtsp-video-recorder'
import Stream from 'node-rtsp-stream'

var started = false
var lastProgress = new Date()
var recorder = null
const rtspURL = `rtsp://synfm:camera@10.0.1.101/live`
var stream

export function startCamera(production) {
  startLiveStream()
  startRecording(production)
}

function startLiveStream() {
  stream = new Stream({
    name: 'Live stream',
    streamUrl: rtspURL,
    wsPort: 9999,
    ffmpegOptions: {
      '-stats': '',
      '-r': 30,
    }
  })

  
}

function startRecording(production) {

  recorder = new Recorder.Recorder(rtspURL, production ? '/media/archive/Camera' : 'D:/Github/dashboard/videos', {
    title: 'Rercordings',
    filePattern: '%Y.%m.%d/%H.%M.%S',
    segmentTime: 900,
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

export function restartLiveStream() {
  stream.stop()
  
  stream = new Stream({
    name: 'Live stream',
    streamUrl: rtspURL,
    wsPort: 9999,
    ffmpegOptions: {
      '-stats': '',
      '-r': 30,
    }
  })

}
