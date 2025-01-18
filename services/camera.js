import Recorder, { RecorderEvents } from 'rtsp-video-recorder'
import Stream from 'node-rtsp-stream'
import fs from 'fs'
import { addAlert, HOUR_MS } from './alert.js'

var started = false
var lastProgress = new Date()
var recorder = null
const rtspURL = `rtsp://admin:${process.env.DATABASE_PASSWORD}@10.0.1.101:554/h264Preview_01_main`
const wsPort = 9999
var stream
var recordingPath = ''

export function startCamera(production) {
  recordingPath = production ? '/media/archive/Camera' : 'D:/Github/dashboard/videos'
  startLiveStream()
  
  // if (production) {
  //   try {
  //     startRecording()
  //     startCleanupJob(production)
  //   } catch (e) {
  //     addAlert('camera', 'error', 'Failed to start camera: ' + e.message, HOUR_MS * 96)
  //   }
  // }

  // setInterval(function() {
  //   restartLiveStream()
  // }, 1800000)
}

function startLiveStream() {
  stream = new Stream({
    name: 'Live stream',
    streamUrl: rtspURL,
    wsPort: wsPort,
    ffmpegOptions: {
      '-loglevel': 'error',
      '-r': 30,
      '-drop_pkts_on_overflow': 1,
      '-attempt_recovery': 1,
      '-recover_any_error': 1,
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
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
  }, production ? 86400000 : 30000)
}

export function restartTest() {
  console.error('Restart camera confirmed')
}

export function restartLiveStream() {
  stream.stop()
  
  stream = new Stream({
    name: 'Live stream',
    streamUrl: rtspURL,
    wsPort: wsPort,
    ffmpegOptions: {
      '-loglevel': 'error',
      '-r': 30,
      '-drop_pkts_on_overflow': 1,
      '-attempt_recovery': 1,
      '-recover_any_error': 1,
    }
  })

}
