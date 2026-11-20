"""Bounded baseline-JPEG marker inspection. Never decode or emit pixels."""
from collections import Counter
import hashlib
import struct

sha = lambda b: hashlib.sha256(b).hexdigest()


def require(condition, code):
    if not condition: raise ValueError(code)


def inspect(data):
    require(data[:2] == b'\xff\xd8', 'not-jpeg-soi')
    pos = 2; segments = [{'marker': 'D8', 'offset': 0, 'bytes': 2, 'payloadBytes': 0, 'fillBytes': 0}]
    entropy = []; texts = []; opaque = []; jfif = []; frame = None; scans = 0; restart_interval = 0
    while pos < len(data):
        start = pos; require(data[pos] == 255, 'expected-marker')
        while pos < len(data) and data[pos] == 255: pos += 1
        require(pos < len(data), 'truncated-marker'); marker = data[pos]; fill = pos - start - 1; pos += 1
        require(marker not in (0, 0xD8, 1) and not 0xD0 <= marker <= 0xD7, 'unexpected-standalone-marker')
        if marker == 0xD9:
            segments.append({'marker': 'D9', 'offset': start, 'bytes': pos - start, 'payloadBytes': 0, 'fillBytes': fill})
            require(pos == len(data), 'trailing-data'); require(frame is not None and scans > 0, 'missing-frame-or-scan')
            require(len(jfif) == 1, 'missing-or-duplicate-jfif')
            require(sum(r['bytes'] for r in segments) + sum(r['bytes'] for r in entropy) == len(data), 'byte-accounting')
            return {'framingPass': True, 'metadataComplete': not opaque, 'bytes': len(data), 'segments': segments, 'markerCounts': dict(Counter(r['marker'] for r in segments)), 'entropy': entropy, 'unscannedEntropyBytes': sum(r['bytes'] for r in entropy), 'frame': frame, 'jfif': jfif, 'commentFields': len(texts), 'opaqueMetadata': opaque, 'trailingBytes': 0, 'pixelDecode': False}, texts
        require(pos + 2 <= len(data), 'truncated-length')
        length = struct.unpack_from('>H', data, pos)[0]; require(length >= 2, 'short-segment-length')
        end = pos + length; require(end <= len(data), 'segment-out-of-bounds')
        body = data[pos + 2:end]
        segment = {'marker': f'{marker:02X}', 'offset': start, 'bytes': end - start, 'payloadBytes': len(body), 'fillBytes': fill, 'payloadSha256': sha(body)}
        segments.append(segment); pos = end
        if marker == 0xE0 and body.startswith(b'JFIF\0'):
            require(len(body) >= 14, 'short-jfif')
            major, minor, units, xden, yden, xthumb, ythumb = struct.unpack('>BBBHHBB', body[5:14])
            require(major == 1 and minor in (0, 1, 2) and units in (0, 1, 2), 'unsupported-jfif-fields')
            require(xden > 0 and yden > 0 and len(body) == 14 + 3 * xthumb * ythumb, 'invalid-jfif-size')
            require(not scans and frame is None, 'late-jfif')
            jfif.append({'version': [major, minor], 'units': units, 'density': [xden, yden], 'thumbnailDimensions': [xthumb, ythumb], 'unscannedThumbnailBytes': len(body) - 14})
            if len(body) > 14: opaque.append({'segment': len(segments) - 1, 'kind': 'thumbnail-pixels', 'bytes': len(body) - 14})
        elif 0xE0 <= marker <= 0xEF:
            opaque.append({'segment': len(segments) - 1, 'kind': 'unsupported-APP', 'bytes': len(body)})
        elif marker == 0xFE:
            try: decoded = body.decode('utf-8'); encoding = 'utf-8'
            except UnicodeDecodeError: decoded = body.decode('latin-1'); encoding = 'latin-1'
            if '\0' in decoded:
                opaque.append({'segment': len(segments) - 1, 'kind': 'NUL-comment', 'bytes': len(body)})
            else:
                texts.append({'segment': len(segments) - 1, 'offset': end - len(body), 'encoding': encoding, 'payload': decoded.encode('utf-8')})
        elif marker == 0xC0:
            require(frame is None and len(body) >= 6, 'invalid-baseline-frame')
            precision, height, width, components = struct.unpack('>BHHB', body[:6])
            require(precision == 8 and width > 0 and height > 0 and 1 <= components <= 4 and len(body) == 6 + 3 * components, 'unsupported-frame-fields')
            ids = list(body[6::3]); require(len(set(ids)) == components, 'duplicate-frame-component')
            frame = {'width': width, 'height': height, 'precision': precision, 'componentIds': ids, 'codec': 'mjpeg'}
        elif marker == 0xDD:
            require(len(body) == 2, 'invalid-restart-interval'); restart_interval = int.from_bytes(body, 'big')
        elif marker == 0xDA:
            require(frame is not None and len(body) >= 4, 'scan-before-frame')
            n = body[0]; require(1 <= n <= len(frame['componentIds']) and len(body) == 4 + 2 * n, 'invalid-scan-length')
            ids = list(body[1:1 + 2 * n:2]); require(len(set(ids)) == n and set(ids) <= set(frame['componentIds']) and body[-3:] == b'\0\x3f\0', 'unsupported-scan-fields')
            scans += 1; begin = pos; stuffed = 0; restarts = []; expected_restart = 0
            while True:
                point = data.find(b'\xff', pos); require(point >= 0, 'missing-entropy-terminator')
                after = point + 1
                while after < len(data) and data[after] == 255: after += 1
                require(after < len(data), 'truncated-entropy-marker'); next_marker = data[after]
                if next_marker == 0:
                    require(after == point + 1, 'fill-before-stuffed-byte'); stuffed += 1; pos = after + 1
                elif 0xD0 <= next_marker <= 0xD7:
                    require(restart_interval > 0 and next_marker == 0xD0 + expected_restart, 'invalid-restart-marker')
                    restarts.append({'offset': point, 'bytes': after + 1 - point, 'marker': f'{next_marker:02X}'})
                    expected_restart = (expected_restart + 1) % 8; pos = after + 1
                else:
                    require(point > begin, 'empty-entropy')
                    entropy.append({'offset': begin, 'bytes': point - begin, 'sha256': sha(data[begin:point]), 'stuffedPairs': stuffed, 'restartMarkers': restarts})
                    pos = point; break
        else:
            require(marker in (0xDB, 0xC4), 'unsupported-marker')
    raise ValueError('missing-eoi')
