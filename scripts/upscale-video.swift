// 旧トップの現場動画を、Apple の AI 高画質化（macOS 26 の VideoToolbox 超解像）で 4 倍にする。
// 4 倍（5120x2880）を 2x2 平均で 2560x1440 に落とし、HEVC の中間ファイルに書く。
// 色調整と書き出しは scripts/build-craft-video.sh が行う。
//
//   ffmpeg -ss 19.9 -i references/538620822806856036.MP4 -t 18.6 -an -c:v prores_ks -profile:v 3 /tmp/clip.mov
//   swiftc -O scripts/upscale-video.swift -o /tmp/upscale && /tmp/upscale /tmp/clip.mov references/craft-upscaled.mov
//   bash scripts/build-craft-video.sh references/craft-upscaled.mov 19.9
//
// 注意
// - 入出力の画素形式は RGBA の半精度浮動小数（'RGhA'）。VTPixelTransferSession ではこの形式へ
//   変換できず真っ黒になったので、変換は自前で行う
// - 同期版の process(parameters:) はエラー無しで何も書かずに戻ることがあった。完了ハンドラ版を待つ
// - 前のコマ（入力と出力）を渡すと、時間方向にちらつかない
import AVFoundation
import VideoToolbox
import Foundation

let args = CommandLine.arguments
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
let OUT_W = 2560, OUT_H = 1440
try? FileManager.default.removeItem(at: outURL)

func check(_ s: OSStatus, _ what: String) { if s != noErr { print("\(what) failed: \(s)"); exit(3) } }

let asset = AVURLAsset(url: inURL)
let sem0 = DispatchSemaphore(value: 0)
var track: AVAssetTrack!
Task { track = try! await asset.loadTracks(withMediaType: .video).first!; sem0.signal() }
sem0.wait()
let W = 1280, H = 720

guard let cfg = VTSuperResolutionScalerConfiguration(frameWidth: W, frameHeight: H, scaleFactor: 4, inputType: .video, usePrecomputedFlow: false, qualityPrioritization: .normal, revision: VTSuperResolutionScalerConfiguration.defaultRevision) else { print("cfg nil"); exit(1) }
guard cfg.configurationModelStatus == .ready else { print("model not ready"); exit(1) }

let processor = VTFrameProcessor()
try processor.startSession(configuration: cfg)

func makePool(_ attrs: [String: Any]) -> CVPixelBufferPool {
  var pool: CVPixelBufferPool?
  check(CVPixelBufferPoolCreate(nil, nil, attrs as CFDictionary, &pool), "pool")
  return pool!
}
let srcPool = makePool(cfg.sourcePixelBufferAttributes)
let dstPool = makePool(cfg.destinationPixelBufferAttributes)
let outPool = makePool([
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
  kCVPixelBufferWidthKey as String: OUT_W, kCVPixelBufferHeightKey as String: OUT_H,
  kCVPixelBufferIOSurfacePropertiesKey as String: [:],
])
func buf(_ pool: CVPixelBufferPool) -> CVPixelBuffer {
  var b: CVPixelBuffer?; check(CVPixelBufferPoolCreatePixelBuffer(nil, pool, &b), "buffer"); return b!
}



/// BGRA8 -> RGBA half float (same transfer curve, 0..1)
func toHalf(_ from: CVPixelBuffer, _ to: CVPixelBuffer) {
  CVPixelBufferLockBaseAddress(from, .readOnly); CVPixelBufferLockBaseAddress(to, [])
  let w = CVPixelBufferGetWidth(from), h = CVPixelBufferGetHeight(from)
  let s = CVPixelBufferGetBaseAddress(from)!.assumingMemoryBound(to: UInt8.self)
  let sb = CVPixelBufferGetBytesPerRow(from)
  let d = CVPixelBufferGetBaseAddress(to)!.assumingMemoryBound(to: Float16.self)
  let db = CVPixelBufferGetBytesPerRow(to) / 2
  let k: Float = 1 / 255
  for y in 0..<h {
    let sr = s + y * sb, dr = d + y * db
    for x in 0..<w {
      dr[x * 4 + 0] = Float16(Float(sr[x * 4 + 2]) * k)
      dr[x * 4 + 1] = Float16(Float(sr[x * 4 + 1]) * k)
      dr[x * 4 + 2] = Float16(Float(sr[x * 4 + 0]) * k)
      dr[x * 4 + 3] = 1
    }
  }
  CVPixelBufferUnlockBaseAddress(from, .readOnly); CVPixelBufferUnlockBaseAddress(to, [])
}

/// RGBA half (2W x 2H) -> BGRA8 (W x H), 2x2 box average
func fromHalfHalved(_ from: CVPixelBuffer, _ to: CVPixelBuffer) {
  CVPixelBufferLockBaseAddress(from, .readOnly); CVPixelBufferLockBaseAddress(to, [])
  let w = CVPixelBufferGetWidth(to), h = CVPixelBufferGetHeight(to)
  let s = CVPixelBufferGetBaseAddress(from)!.assumingMemoryBound(to: Float16.self)
  let sb = CVPixelBufferGetBytesPerRow(from) / 2
  let d = CVPixelBufferGetBaseAddress(to)!.assumingMemoryBound(to: UInt8.self)
  let db = CVPixelBufferGetBytesPerRow(to)
  for y in 0..<h {
    let r0 = s + (2 * y) * sb, r1 = s + (2 * y + 1) * sb, dr = d + y * db
    for x in 0..<w {
      let i = 8 * x
      for c in 0..<3 {
        let v = (Float(r0[i + c]) + Float(r0[i + 4 + c]) + Float(r1[i + c]) + Float(r1[i + 4 + c])) * 0.25
        dr[x * 4 + (2 - c)] = UInt8(max(0, min(255, v * 255 + 0.5)))
      }
      dr[x * 4 + 3] = 255
    }
  }
  CVPixelBufferUnlockBaseAddress(from, .readOnly); CVPixelBufferUnlockBaseAddress(to, [])
}

let reader = try AVAssetReader(asset: asset)
let rout = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
reader.add(rout)
reader.startReading()

let writer = try AVAssetWriter(outputURL: outURL, fileType: .mov)
let win = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.hevc, AVVideoWidthKey: OUT_W, AVVideoHeightKey: OUT_H,
  AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 80_000_000],
])
win.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: win, sourcePixelBufferAttributes: nil)
writer.add(win)
writer.startWriting()
var started = false

var prevSrc: VTFrameProcessorFrame? = nil
var prevOut: VTFrameProcessorFrame? = nil
var n = 0
let t0 = Date()
while let sb = rout.copyNextSampleBuffer() {
  guard let img = CMSampleBufferGetImageBuffer(sb) else { continue }
  let pts = CMSampleBufferGetPresentationTimeStamp(sb)
  let src = buf(srcPool)
  toHalf(img, src)
  let dst = buf(dstPool)
  let sf = VTFrameProcessorFrame(buffer: src, presentationTimeStamp: pts)!
  let df = VTFrameProcessorFrame(buffer: dst, presentationTimeStamp: pts)!
  let p = VTSuperResolutionScalerParameters(sourceFrame: sf, previousFrame: prevSrc, previousOutputFrame: prevOut, opticalFlow: nil, submissionMode: .sequential, destinationFrame: df)!
  let psem = DispatchSemaphore(value: 0)
  var perr: Error?
  processor.process(parameters: p) { _, e in perr = e; psem.signal() }
  psem.wait()
  if let perr { print("process error:", perr); exit(4) }
  prevSrc = sf; prevOut = df
  let out = buf(outPool)
  fromHalfHalved(dst, out)
  if !started { writer.startSession(atSourceTime: pts); started = true }
  while !win.isReadyForMoreMediaData { usleep(2000) }
  adaptor.append(out, withPresentationTime: pts)
  n += 1
  if n % 30 == 0 { print(String(format: "%d frames, %.2f s/frame", n, Date().timeIntervalSince(t0) / Double(n))); fflush(stdout) }
}
processor.endSession()
win.markAsFinished()
let sem = DispatchSemaphore(value: 0)
writer.finishWriting { sem.signal() }
sem.wait()
print("done", n, "frames", writer.status.rawValue, writer.error as Any)
