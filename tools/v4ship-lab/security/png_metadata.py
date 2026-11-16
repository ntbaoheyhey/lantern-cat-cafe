"""Inspect PNG text metadata only. No image library, rendering or pixel decoding."""
import collections
import hashlib
import re
import struct
import zlib

SIGNATURE = bytes.fromhex('89504e470d0a1a0a')
TEXT_TYPES = {b'tEXt', b'zTXt', b'iTXt'}
MAX_TEXT_BYTES = 64 * 1024 * 1024


class MetadataError(ValueError):
    """Safe fixed error codes; never include metadata values in diagnostics."""


def require(condition, code):
    if not condition:
        raise MetadataError(code)


def expand(data, limit):
    try:
        decoder = zlib.decompressobj()
        text = decoder.decompress(data, limit + 1)
    except zlib.error:
        raise MetadataError('invalid-zlib') from None
    require(len(text) <= limit and not decoder.unconsumed_tail, 'text-resource-limit')
    require(decoder.eof, 'incomplete-zlib')
    require(not decoder.unused_data, 'trailing-zlib-data')
    return text


def decode_text_chunk(kind, data, limit=MAX_TEXT_BYTES):
    require(kind in TEXT_TYPES, 'unsupported-text-kind')
    require(b'\0' in data, 'missing-keyword-separator')
    keyword, rest = data.split(b'\0', 1)
    require(1 <= len(keyword) <= 79, 'invalid-keyword-length')
    require(all(32 <= c <= 126 or 161 <= c <= 255 for c in keyword), 'invalid-keyword-character')
    require(not keyword.startswith(b' ') and not keyword.endswith(b' ') and b'  ' not in keyword,
            'invalid-keyword-spacing')
    fields = [keyword.decode('latin-1').encode('utf-8')]
    compressed = False
    try:
        if kind == b'tEXt':
            text = rest
            encoding = 'latin-1'
        elif kind == b'zTXt':
            require(len(rest) >= 1 and rest[0] == 0, 'unsupported-compression-method')
            text = expand(rest[1:], limit)
            encoding = 'latin-1'
            compressed = True
        else:
            require(len(rest) >= 2, 'missing-itxt-compression-fields')
            flag, method = rest[:2]
            require(flag in (0, 1), 'invalid-compression-flag')
            require(flag == 0 or method == 0, 'unsupported-compression-method')
            pieces = rest[2:].split(b'\0', 2)
            require(len(pieces) == 3, 'missing-itxt-field-separator')
            language, translated, rawtext = pieces
            fields.extend([language.decode('ascii').encode('utf-8'), translated.decode('utf-8').encode('utf-8')])
            compressed = bool(flag)
            text = expand(rawtext, limit) if compressed else rawtext
            encoding = 'utf-8'
        require(len(text) <= limit, 'text-resource-limit')
        require(b'\0' not in text, 'text-contains-nul')
        fields.append(text.decode(encoding).encode('utf-8'))
    except UnicodeError:
        raise MetadataError('invalid-text-encoding') from None
    payload = b'\n'.join(fields)
    require(len(payload) <= limit, 'text-resource-limit')
    return payload, {'compressed': compressed, 'textEncoding': encoding, 'fieldCount': len(fields)}


def inspect(data):
    """Return safe structural metadata and ephemeral decoded scanner inputs."""
    chunks = collections.Counter()
    nontext = collections.Counter()
    texts, payloads, errors = [], [], []
    offset, index, expanded_bytes = 8, 0, 0
    ended = False
    try:
        require(data.startswith(SIGNATURE), 'not-png-signature')
        while offset < len(data):
            require(offset + 12 <= len(data), 'truncated-chunk-header')
            length, kind = struct.unpack_from('>I4s', data, offset)
            require(length <= 0x7fffffff, 'invalid-chunk-length')
            require(re.fullmatch(rb'[A-Za-z]{4}', kind) is not None, 'invalid-chunk-type')
            require(65 <= kind[2] <= 90, 'invalid-reserved-bit')
            end = offset + 12 + length
            require(end <= len(data), 'truncated-chunk-data')
            require(index != 0 or (kind == b'IHDR' and length == 13), 'invalid-first-chunk')
            body = data[offset + 8: end - 4]
            crc = struct.unpack_from('>I', data, end - 4)[0]
            require(zlib.crc32(body, zlib.crc32(kind)) == crc, 'chunk-crc-mismatch')
            name = kind.decode('ascii')
            chunks[name] += 1
            if kind in TEXT_TYPES:
                item = {'index': index, 'offset': offset, 'type': name, 'bytes': length,
                        'sha256': hashlib.sha256(body).hexdigest()}
                try:
                    payload, details = decode_text_chunk(kind, body, MAX_TEXT_BYTES - expanded_bytes)
                    expanded_bytes += len(payload)
                    item.update(details, decodedBytes=len(payload), decodedSha256=hashlib.sha256(payload).hexdigest())
                    payloads.append((len(texts), payload))
                except MetadataError as exc:
                    item['error'] = str(exc)
                    errors.append({'chunk': index, 'code': str(exc)})
                texts.append(item)
            else:
                nontext[name] += length
            offset = end
            index += 1
            if kind == b'IEND':
                require(length == 0, 'nonempty-iend')
                ended = True
                require(offset == len(data), 'trailing-png-data')
                break
        require(ended, 'missing-iend')
        require(chunks['IHDR'] == 1, 'duplicate-ihdr')
        require(chunks['IDAT'] > 0, 'missing-idat')
    except MetadataError as exc:
        errors.append({'chunk': index, 'offset': offset, 'code': str(exc)})
    return {'chunks': dict(chunks), 'nonTextBytesByType': dict(nontext), 'texts': texts,
            'decodedBytes': expanded_bytes, 'errors': errors, 'framingAndTextComplete': not errors}, payloads
