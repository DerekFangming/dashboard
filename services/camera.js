import Recorder, { RecorderEvents } from 'rtsp-video-recorder'
import Stream from 'node-rtsp-stream'
import fs from 'fs'
import { addAlert, HOUR_MS } from './alert.js'

var started = false
var lastProgress = new Date()
var recorder = null
const rtspURL = `rtsp://synfm:camera@10.0.1.101/live`
var stream
var recordingPath = ''

export function startCamera(production) {
  recordingPath = production ? '/media/archive/Camera' : 'D:/Github/dashboard/videos'
  startLiveStream()
  
  if (production) {
    startRecording()
    startCleanupJob(production)
  }

  setInterval(function() {
    restartLiveStream()
  }, 1800000)
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

function startRecording() {
  recorder = new Recorder.Recorder(rtspURL, recordingPath, {
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

function startCleanupJob(production) {
  setInterval(function() {
    let files = fs.readdirSync(recordingPath)
    let now = new Date()
    for (let f of files) {
      let filePath = recordingPath + '/' + f
      let stat = fs.statSync(filePath)
      let diffTime = Math.abs(now - stat.mtime)
      let diffDays = Math.ceil(diffTime / 86400000)

      if (diffDays >= 30) {
        console.log(`Deleting file because exceeded 30 days(${diffDays}): ${filePath}`)
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        console.log(`Won't delete file because with 30 days(${diffDays}): ${filePath}`)
      }
    }
  }, production ? 86400000 : 30000)
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
