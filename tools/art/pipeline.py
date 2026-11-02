#!/usr/bin/env python3
"""Offline pixel-art transforms. Python 3.9+ standard library; see README.md."""
import argparse
from dataclasses import dataclass
import json
from pathlib import Path
import re
import struct
import zlib
from typing import Dict, List, Optional, Tuple, Union

SIGNATURE = b'\x89PNG\r\n\x1a\n'
MAX_PIXELS = 16_777_216
ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class Image:
    width: int
    height: int
    pixels: bytes

    def __post_init__(self) -> None:
        if (type(self.width) is not int or type(self.height) is not int
                or min(self.width, self.height) < 1
                or self.width * self.height > MAX_PIXELS
                or not isinstance(self.pixels, bytes)
                or len(self.pixels) != self.width * self.height * 4):
            raise ValueError('invalid RGBA dimensions or byte count')

    def at(self, x: int, y: int) -> bytes:
        start = (y * self.width + x) * 4
        return self.pixels[start:start + 4]


def chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))


def paeth(a: int, b: int, c: int) -> int:
    p = a + b - c
    distances = (abs(p - a), abs(p - b), abs(p - c))
    return (a, b, c)[distances.index(min(distances))]


def decode_png(data: bytes) -> Image:
    """Strict static PNG reader: 8-bit RGB/RGBA/gray/gray-alpha/indexed, filters 0..4."""
    if not data.startswith(SIGNATURE):
        raise ValueError('not a PNG')
    offset, chunks, ended = 8, [], False
    while offset < len(data):
        if offset + 12 > len(data):
            raise ValueError('truncated PNG chunk')
        size = struct.unpack_from('>I', data, offset)[0]
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:offset + 8 + size]
        if offset + size + 12 > len(data):
            raise ValueError('truncated PNG payload')
        crc = struct.unpack_from('>I', data, offset + 8 + size)[0]
        if zlib.crc32(kind + payload) != crc:
            raise ValueError('PNG CRC mismatch')
        if kind not in (b'IHDR', b'PLTE', b'IDAT', b'IEND') and not kind[0] & 32:
            raise ValueError('unsupported critical PNG chunk')
        if kind in (b'acTL', b'fcTL', b'fdAT'):
            raise ValueError('animated PNG unsupported; use individual frames')
        chunks.append((kind, payload))
        offset += size + 12
        if kind == b'IEND':
            if payload or offset != len(data):
                raise ValueError('invalid PNG end or trailing data')
            ended = True
            break
    if not ended or not chunks or chunks[0][0] != b'IHDR' or len(chunks[0][1]) != 13:
        raise ValueError('missing PNG header/end')
    kinds = [kind for kind, _ in chunks]
    if any(kinds.count(kind) > 1 for kind in (b'IHDR', b'PLTE', b'tRNS')) or b'IDAT' not in kinds:
        raise ValueError('duplicate header/palette or missing image data')
    first, last = kinds.index(b'IDAT'), len(kinds) - 1 - kinds[::-1].index(b'IDAT')
    if any(kind != b'IDAT' for kind in kinds[first:last + 1]):
        raise ValueError('noncontiguous PNG image data')
    if any(kinds.index(kind) > first for kind in (b'PLTE', b'tRNS') if kind in kinds):
        raise ValueError('late PNG palette/transparency')
    width, height, depth, mode, comp, filt, interlace = struct.unpack('>IIBBBBB', chunks[0][1])
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}.get(mode)
    if depth != 8 or not channels or comp or filt or interlace:
        raise ValueError('only 8-bit noninterlaced static PNG supported')
    if not width or not height or width * height > MAX_PIXELS:
        raise ValueError('PNG exceeds dimensions limit')
    table = dict(chunks)
    palette, alpha = table.get(b'PLTE', b''), table.get(b'tRNS', b'')
    if b'PLTE' in table and (not palette or len(palette) % 3 or len(palette) > 768):
        raise ValueError('invalid PNG palette')
    if mode == 3 and (not palette or len(alpha) > len(palette) // 3):
        raise ValueError('indexed PNG needs a valid palette')
    if b'tRNS' in table and (mode in (4, 6) or (mode == 0 and len(alpha) != 2)
                            or (mode == 2 and len(alpha) != 6)):
        raise ValueError('invalid PNG transparency')
    expected = (width * channels + 1) * height
    stream = zlib.decompressobj()
    raw = stream.decompress(b''.join(v for k, v in chunks if k == b'IDAT'), expected + 1)
    if len(raw) != expected or not stream.eof or stream.unused_data or stream.unconsumed_tail:
        raise ValueError('PNG inflated length/stream mismatch')
    stride, output, prev = width * channels, bytearray(), bytearray(width * channels)
    for y in range(height):
        filter_type = raw[y * (stride + 1)]
        if filter_type > 4:
            raise ValueError('unknown PNG row filter')
        row = bytearray(raw[y * (stride + 1) + 1:(y + 1) * (stride + 1)])
        for i in range(stride):
            a, b, c = (row[i - channels] if i >= channels else 0), prev[i], (prev[i - channels] if i >= channels else 0)
            prediction = (0, a, b, (a + b) // 2, paeth(a, b, c))[filter_type]
            row[i] = (row[i] + prediction) & 255
        for x in range(width):
            p = bytes(row[x * channels:(x + 1) * channels])
            if mode == 6:
                output.extend(p)
            elif mode == 2:
                transparent = bool(alpha) and tuple(p) == struct.unpack('>HHH', alpha)
                output.extend(p + bytes([0 if transparent else 255]))
            elif mode == 0:
                transparent = bool(alpha) and p[0] == struct.unpack('>H', alpha)[0]
                output.extend(p * 3 + bytes([0 if transparent else 255]))
            elif mode == 4:
                output.extend(p[:1] * 3 + p[1:])
            else:
                index = p[0]
                if index * 3 + 3 > len(palette):
                    raise ValueError('PNG palette index out of range')
                output.extend(palette[index * 3:index * 3 + 3] + bytes([alpha[index] if index < len(alpha) else 255]))
        prev = row
    return Image(width, height, bytes(output))


def encode_png(image: Image) -> bytes:
    """Choose smallest deterministic lossless encoding; ties use candidate order."""
    candidates = []
    pixels = [image.pixels[i:i + 4] for i in range(0, len(image.pixels), 4)]
    colors = sorted(set(pixels))
    modes = [(6, 4, image.pixels, b'')]
    if all(p[3] == 255 for p in pixels):
        modes.append((2, 3, b''.join(p[:3] for p in pixels), b''))
    if len(colors) <= 256:
        indices = {c: i for i, c in enumerate(colors)}
        extra = chunk(b'PLTE', b''.join(c[:3] for c in colors))
        if any(c[3] != 255 for c in colors):
            extra += chunk(b'tRNS', bytes(c[3] for c in colors))
        modes.append((3, 1, bytes(indices[p] for p in pixels), extra))
    for mode, channels, packed, extra in modes:
        stride = image.width * channels
        for filter_type in (0, 1):
            raw = bytearray()
            for y in range(image.height):
                row = packed[y * stride:(y + 1) * stride]
                raw.append(filter_type)
                raw.extend((v - (row[i - channels] if i >= channels and filter_type else 0)) & 255 for i, v in enumerate(row))
            head = struct.pack('>IIBBBBB', image.width, image.height, 8, mode, 0, 0, 0)
            candidates.append(SIGNATURE + chunk(b'IHDR', head) + extra + chunk(b'IDAT', zlib.compress(bytes(raw), 9)) + chunk(b'IEND', b''))
    return min(candidates, key=len)


def optimize_png(data: bytes) -> bytes:
    """Strip ancillary metadata and choose a lossless candidate no larger than input."""
    image = decode_png(data)
    stripped, offset = bytearray(SIGNATURE), 8
    while offset < len(data):
        size = struct.unpack_from('>I', data, offset)[0]
        kind = data[offset + 4:offset + 8]
        if kind in (b'IHDR', b'PLTE', b'tRNS', b'IDAT', b'IEND'):
            stripped.extend(data[offset:offset + size + 12])
        offset += size + 12
    return min((encode_png(image), bytes(stripped)), key=len)


def snap(image: Image, width: int, height: int) -> Image:
    """Downsample pixel centres using nearest neighbour, never blend."""
    if min(width, height) < 1 or width > image.width or height > image.height:
        raise ValueError('snap grid must be positive and no larger than input')
    return Image(width, height, b''.join(image.at(
        (2 * x + 1) * image.width // (2 * width),
        (2 * y + 1) * image.height // (2 * height))
        for y in range(height) for x in range(width)))


def load_palette(path: Union[Path, str] = ROOT / 'tools/art/palette.json') -> List[bytes]:
    obj = json.loads(Path(path).read_text())
    if not isinstance(obj, dict) or obj.get('schemaVersion') != 1:
        raise ValueError('palette must use schemaVersion 1')
    colors = obj.get('colors')
    if (not isinstance(colors, list) or not colors
            or any(not isinstance(c, str) or not re.fullmatch(r'#[0-9a-f]{6}', c) for c in colors)
            or len(colors) != len(set(colors))):
        raise ValueError('palette needs unique lowercase #rrggbb colors')
    return [bytes.fromhex(c[1:]) for c in colors]


def palette_lock(image: Image, palette: List[bytes], threshold: int = 128) -> Image:
    if not palette or any(len(c) != 3 for c in palette) or not 1 <= threshold <= 255:
        raise ValueError('invalid palette or alpha threshold')
    result = bytearray()
    for i in range(0, len(image.pixels), 4):
        p = image.pixels[i:i + 4]
        if p[3] < threshold:
            result.extend(b'\0\0\0\0')
        else:
            closest = min(palette, key=lambda c: sum((p[k] - c[k]) ** 2 for k in range(3)))
            result.extend(closest + b'\xff')
    return Image(image.width, image.height, bytes(result))


def trim(image: Image) -> Tuple[Image, dict]:
    occupied = [(x, y) for y in range(image.height) for x in range(image.width) if image.at(x, y)[3]]
    if not occupied:
        return Image(1, 1, b'\0\0\0\0'), {'x': 0, 'y': 0, 'w': 1, 'h': 1, 'empty': True}
    left, top = min(x for x, _ in occupied), min(y for _, y in occupied)
    right, bottom = max(x for x, _ in occupied) + 1, max(y for _, y in occupied) + 1
    return Image(right - left, bottom - top, b''.join(image.at(x, y) for y in range(top, bottom) for x in range(left, right))), {
        'x': left, 'y': top, 'w': right - left, 'h': bottom - top, 'empty': False}


def pad(image: Image, width: int, height: int) -> Image:
    if type(width) is not int or type(height) is not int or width * height > MAX_PIXELS:
        raise ValueError('padding exceeds dimensions limit')
    if width < image.width or height < image.height:
        raise ValueError('padding must not crop')
    left, top = (width - image.width) // 2, (height - image.height) // 2
    return Image(width, height, b''.join(
        image.at(x - left, y - top) if left <= x < left + image.width and top <= y < top + image.height else b'\0\0\0\0'
        for y in range(height) for x in range(width)))


def pack(frames: Dict[str, Image], columns: int = 8, gutter: int = 1, fps: int = 12, do_trim: bool = False) -> Tuple[Image, dict]:
    """Stable grid atlas with source rectangles sufficient to reconstruct every frame."""
    if not frames or columns < 1 or gutter < 1 or fps < 1:
        raise ValueError('nonempty frames, positive columns/gutter/fps required')
    if any(not re.fullmatch(r'[a-z0-9][a-z0-9._-]*', key) for key in frames):
        raise ValueError('frame IDs must be lowercase safe names')
    ordered = []
    for key, src in sorted(frames.items()):
        img, rect = trim(src) if do_trim else (src, {'x': 0, 'y': 0, 'w': src.width, 'h': src.height, 'empty': not any(src.pixels[3::4])})
        ordered.append((key, src, img, rect))
    cols = min(columns, len(ordered))
    cell_w = max(i.width for _, _, i, _ in ordered) + 2 * gutter
    cell_h = max(i.height for _, _, i, _ in ordered) + 2 * gutter
    width, height = cols * cell_w, ((len(ordered) + cols - 1) // cols) * cell_h
    if width * height > MAX_PIXELS:
        raise ValueError('atlas exceeds dimensions limit')
    pixels, atlas = bytearray(width * height * 4), {}
    for index, (key, src, img, rect) in enumerate(ordered):
        x, y = (index % cols) * cell_w + gutter, (index // cols) * cell_h + gutter
        for iy in range(img.height):
            start = ((y + iy) * width + x) * 4
            pixels[start:start + img.width * 4] = img.pixels[iy * img.width * 4:(iy + 1) * img.width * 4]
        atlas[key] = {'frame': {'x': x, 'y': y, 'w': img.width, 'h': img.height}, 'rotated': False,
                      'trimmed': do_trim, 'spriteSourceSize': {k: rect[k] for k in ('x', 'y', 'w', 'h')},
                      'sourceSize': {'w': src.width, 'h': src.height}, 'empty': rect['empty'], 'pivot': {'x': 0.5, 'y': 0.5}}
    return Image(width, height, bytes(pixels)), {'schemaVersion': 1, 'frames': atlas,
        'meta': {'format': 'RGBA8888', 'size': {'w': width, 'h': height}, 'scale': 1, 'fps': fps,
                 'gutter': gutter, 'frameOrder': list(atlas), 'reducedMotionFrame': next(iter(atlas))}}


def write_new(path: Union[Path, str], data: bytes) -> None:
    """Exclusive create: input files and pre-existing output files cannot be overwritten."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('xb') as stream:
        stream.write(data)


def json_bytes(value: dict) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True) + '\n').encode()


def main(argv: Optional[List[str]] = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    for command in ('snap', 'lock', 'trim', 'pad', 'optimize', 'check'):
        part = sub.add_parser(command)
        part.add_argument('input', type=Path)
        if command != 'check':
            part.add_argument('output', type=Path)
        if command in ('snap', 'pad'):
            part.add_argument('--width', type=int, required=True)
            part.add_argument('--height', type=int, required=True)
        if command in ('lock', 'check'):
            part.add_argument('--palette', type=Path, default=ROOT / 'tools/art/palette.json')
        if command == 'check':
            part.add_argument('--width', type=int, required=True)
            part.add_argument('--height', type=int, required=True)
            part.add_argument('--max-colors', type=int, default=16)
        if command == 'trim':
            part.add_argument('--metadata', type=Path, required=True)
    part = sub.add_parser('sheet')
    part.add_argument('output', type=Path, help='new directory containing sheet.png + atlas.json')
    part.add_argument('frames', type=Path, nargs='+', help='PNG filenames are unique frame IDs')
    part.add_argument('--columns', type=int, default=8)
    part.add_argument('--gutter', type=int, default=1)
    part.add_argument('--fps', type=int, default=12)
    part.add_argument('--trim', action='store_true')
    args = parser.parse_args(argv)
    try:
        if args.command == 'sheet':
            if len({p.stem for p in args.frames}) != len(args.frames):
                raise ValueError('duplicate frame IDs')
            image, atlas = pack({p.stem: decode_png(p.read_bytes()) for p in args.frames}, args.columns, args.gutter, args.fps, args.trim)
            args.output.mkdir(parents=True, exist_ok=False)
            write_new(args.output / 'sheet.png', encode_png(image))
            atlas['meta']['image'] = 'sheet.png'
            write_new(args.output / 'atlas.json', json_bytes(atlas))
        else:
            image = decode_png(args.input.read_bytes())
            if args.command == 'snap':
                image = snap(image, args.width, args.height)
            elif args.command == 'lock':
                image = palette_lock(image, load_palette(args.palette))
            elif args.command == 'trim':
                image, rect = trim(image)
                if args.output.resolve() == args.metadata.resolve() or args.output.exists() or args.metadata.exists():
                    raise ValueError('trim requires two distinct, new output paths')
                write_new(args.metadata, json_bytes(rect))
            elif args.command == 'pad':
                image = pad(image, args.width, args.height)
            elif args.command == 'check':
                if (image.width, image.height) != (args.width, args.height):
                    raise ValueError('wrong native pixel grid')
                if palette_lock(image, load_palette(args.palette)) != image:
                    raise ValueError('off-palette or nonbinary alpha pixels')
                if len({image.pixels[i:i + 3] for i in range(0, len(image.pixels), 4) if image.pixels[i + 3]}) > args.max_colors:
                    raise ValueError('sprite exceeds color budget')
                print('palette, binary alpha, native dimensions and color budget verified')
                return
            write_new(args.output, optimize_png(args.input.read_bytes()) if args.command == 'optimize' else encode_png(image))
        print(args.command + ': wrote new output')
    except (ValueError, OSError, zlib.error) as exc:
        parser.exit(1, 'art: ' + str(exc) + '\n')


if __name__ == '__main__':
    main()
