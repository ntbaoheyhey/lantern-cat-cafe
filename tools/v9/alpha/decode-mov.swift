// Native Apple decoding preserves HEVC auxiliary alpha, which ffmpeg may ignore.
// Usage: swift decode-mov.swift input.mov output-directory [--first]
import Foundation
import AVFoundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count >= 3 else {
    fatalError("Usage: decode-mov.swift input.mov output-directory [--first]")
}
let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
let asset = AVURLAsset(url: input)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = CMTime(value: 1, timescale: 30)
let count = CommandLine.arguments.contains("--first") ? 1 : max(1, Int((CMTimeGetSeconds(asset.duration) * 30).rounded()))
for frame in 0..<count {
    try autoreleasepool {
        let image = try generator.copyCGImage(at: CMTime(value: Int64(frame), timescale: 30), actualTime: nil)
        let path = output.appendingPathComponent(String(format: "%04d.png", frame + 1))
        guard let destination = CGImageDestinationCreateWithURL(path as CFURL, UTType.png.identifier as CFString, 1, nil) else {
            fatalError("Cannot create PNG")
        }
        CGImageDestinationAddImage(destination, image, nil)
        guard CGImageDestinationFinalize(destination) else { fatalError("Cannot save PNG") }
    }
}
print("Decoded \(count) native RGBA frames at 30 fps: \(output.path)")
