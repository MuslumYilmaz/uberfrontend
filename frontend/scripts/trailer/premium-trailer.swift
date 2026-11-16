// Builds the company guide's Premium trailer from four real screens: a slow zoom on each, crossfades between them,
// and an ending that fades back into the first frame so the loop has no jump. Writes an H.264 MP4 (moov first) and a
// JPEG poster of the first frame.
//
//   swiftc scripts/trailer/premium-trailer.swift -o /tmp/premium-trailer -framework AVFoundation -framework ImageIO
//   /tmp/premium-trailer <out.mp4> <poster.jpg> <task.png> <checks.png> <entry.png> <round.png>
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count == 7 else {
  FileHandle.standardError.write("usage: premium-trailer <out.mp4> <poster.jpg> <task.png> <checks.png> <entry.png> <round.png>\n".data(using: .utf8)!)
  exit(2)
}

func load(_ path: String) -> CGImage {
  guard let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
        let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else { fatalError("cannot read \(path)") }
  return image
}

let images = (3...6).map { load(args[$0]) }
let width = 960, height = 600
let fps: Int32 = 24
let duration = 20.0
let frameCount = Int(duration * Double(fps))

/// A view of one screen: zoom 1 shows the whole screen; (cx, cy) is the centre of the view as a fraction of it.
struct View { let zoom: Double; let cx: Double; let cy: Double }
/// One shot: a screen, when it shows, and the view it moves from and to.
struct Shot { let image: Int; let start: Double; let end: Double; let from: View; let to: View }

let fade = 0.6
let shots: [Shot] = [
  // The task: description, editor and live preview, closing in on the editor and the form.
  Shot(image: 0, start: 0.0, end: 5.6, from: View(zoom: 1.0, cx: 0.5, cy: 0.5), to: View(zoom: 1.14, cx: 0.62, cy: 0.52)),
  // The checks: each failing check says what failed.
  Shot(image: 1, start: 5.0, end: 11.6, from: View(zoom: 1.0, cx: 0.5, cy: 0.5), to: View(zoom: 1.85, cx: 0.86, cy: 0.69)),
  // Pressure Mode's entry: keep coding as the requirements change.
  Shot(image: 2, start: 11.0, end: 14.8, from: View(zoom: 1.6, cx: 0.2, cy: 0.62), to: View(zoom: 1.72, cx: 0.19, cy: 0.63)),
  // Round 1: the interviewer's constraint beside the code.
  Shot(image: 3, start: 14.2, end: duration, from: View(zoom: 1.22, cx: 0.26, cy: 0.45), to: View(zoom: 1.34, cx: 0.25, cy: 0.43)),
]
let loopFade = 0.5

func smoothstep(_ x: Double) -> Double {
  let t = min(max(x, 0), 1)
  return t * t * (3 - 2 * t)
}

/// The crop of a screen for a view, kept inside the screen.
func crop(_ image: CGImage, _ view: View) -> CGRect {
  let iw = Double(image.width), ih = Double(image.height)
  let w = iw / view.zoom, h = ih / view.zoom
  let x = min(max(view.cx * iw - w / 2, 0), iw - w)
  let y = min(max(view.cy * ih - h / 2, 0), ih - h)
  return CGRect(x: x.rounded(), y: y.rounded(), width: w.rounded(), height: h.rounded())
}

func view(of shot: Shot, at time: Double) -> View {
  let p = smoothstep((time - shot.start) / (shot.end - shot.start))
  return View(zoom: shot.from.zoom + (shot.to.zoom - shot.from.zoom) * p,
              cx: shot.from.cx + (shot.to.cx - shot.from.cx) * p,
              cy: shot.from.cy + (shot.to.cy - shot.from.cy) * p)
}

/// The shots on screen at a time, each with its opacity; a later shot fades in over the one before it.
func layers(at time: Double) -> [(Shot, Double, Double)] {
  var result: [(Shot, Double, Double)] = []
  for shot in shots where time >= shot.start && time < shot.end + 1e-9 {
    let fadeIn = shot.start == 0 ? 1 : smoothstep((time - shot.start) / fade)
    result.append((shot, time, fadeIn))
  }
  // The ending fades back into the opening frame, so the loop restarts without a jump.
  if time > duration - loopFade {
    result.append((shots[0], 0, smoothstep((time - (duration - loopFade)) / loopFade)))
  }
  return result
}

func draw(at time: Double, into context: CGContext) {
  context.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 1))
  context.fill(CGRect(x: 0, y: 0, width: width, height: height))
  context.interpolationQuality = .high
  for (shot, shotTime, alpha) in layers(at: time) {
    let image = images[shot.image]
    guard let part = image.cropping(to: crop(image, view(of: shot, at: shotTime))) else { continue }
    context.setAlpha(CGFloat(alpha))
    context.draw(part, in: CGRect(x: 0, y: 0, width: width, height: height))
  }
  context.setAlpha(1)
}

// The video.
let videoURL = URL(fileURLWithPath: args[1])
try? FileManager.default.removeItem(at: videoURL)
let writer = try AVAssetWriter(outputURL: videoURL, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: width,
  AVVideoHeightKey: height,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: 900_000,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    AVVideoMaxKeyFrameIntervalKey: 48,
    AVVideoExpectedSourceFrameRateKey: Int(fps),
  ],
])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
  kCVPixelBufferWidthKey as String: width,
  kCVPixelBufferHeightKey as String: height,
])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)
let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!

for frame in 0..<frameCount {
  while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.005) }
  var buffer: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &buffer)
  guard let pixels = buffer else { fatalError("no pixel buffer") }
  CVPixelBufferLockBaseAddress(pixels, [])
  let context = CGContext(data: CVPixelBufferGetBaseAddress(pixels), width: width, height: height, bitsPerComponent: 8,
                          bytesPerRow: CVPixelBufferGetBytesPerRow(pixels), space: colorSpace,
                          bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
  draw(at: Double(frame) / Double(fps), into: context)
  CVPixelBufferUnlockBaseAddress(pixels, [])
  adaptor.append(pixels, withPresentationTime: CMTime(value: CMTimeValue(frame), timescale: fps))
}
input.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
guard writer.status == .completed else { fatalError("writer failed: \(String(describing: writer.error))") }

// The poster: the opening frame.
let poster = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace,
                       bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
draw(at: 0, into: poster)
let posterURL = URL(fileURLWithPath: args[2]) as CFURL
let destination = CGImageDestinationCreateWithURL(posterURL, UTType.jpeg.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(destination, poster.makeImage()!, [kCGImageDestinationLossyCompressionQuality: 0.8] as CFDictionary)
CGImageDestinationFinalize(destination)
print("wrote \(frameCount) frames")
