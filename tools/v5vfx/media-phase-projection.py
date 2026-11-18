"""Independent scalar socket reconstruction for a synchronous media draw receipt.

This module never infers a GPU frame from a video clock or callback. The caller
must supply a separately identified texture frame and preserve that evidence.
"""
import math

SOCKET_BONES = {'hpAnchor': 'hp-anchor', 'head': 'head', 'vfxOrigin': 'vfx-origin',
                'mainHand': 'main-hand', 'offHand': 'off-hand', 'feet': 'root', 'chest': 'hip'}


def smooth(value):
    t = max(0., min(1., value))
    return t * t * t * (t * (6 * t - 15) + 10)


def socket_local(manifest, socket, frame, pose):
    """Manifest source coordinates -> canonical authored/cast coordinates."""
    assert math.isfinite(frame)
    bone = SOCKET_BONES[socket]
    x, y = manifest['sockets'][bone]
    channel = manifest.get('socketChannels', {}).get(bone)
    track = manifest.get('socketTracks', {}).get(channel)
    if track is not None:
        assert len(track) == 300
        phase = frame % 300
        index = math.floor(phase)
        fraction = phase - index
        a, b = track[index], track[(index + 1) % 300]
        x += a[0] + (b[0] - a[0]) * fraction
        y += a[1] + (b[1] - a[1]) * fraction
    height = 512.
    scale = height / manifest['opaqueHeight']
    x, y = (x - manifest['foot'][0]) * scale, (manifest['foot'][1] - y) * scale
    if y > 0:
        upper, head = smooth((y / height - .06) / .72), smooth((y / height - .57) / .29)
        sine, cosine = math.sin(pose['tilt']), math.cos(pose['tilt'])
        dx, dy = x, y - height * .63
        offset_x = height * pose['lean'] * upper + (dx * (cosine - 1) - dy * sine) * head
        offset_y = height * (pose['lift'] * upper + pose['follow'] * upper * (1 - head * .75)) + (dx * sine + dy * (cosine - 1)) * head
        x, y = x + offset_x, y + offset_y
    assert all(math.isfinite(v) for v in (x, y))
    return [x, y, 1.]


def multiply(matrix, point):
    """Captured Three Matrix4.elements are column-major, including translation."""
    assert len(matrix) == 16 and len(point) == 4
    assert all(math.isfinite(v) for v in (*matrix, *point))
    return [sum(matrix[row + 4 * col] * point[col] for col in range(4)) for row in range(4)]


def positions(local, root_world, view, projection, canvas):
    world4 = multiply(root_world, [*local, 1.])
    assert abs(world4[3]) > 1e-12
    world = [v / world4[3] for v in world4[:3]]
    clip = multiply(projection, multiply(view, [*world, 1.]))
    assert abs(clip[3]) > 1e-12
    ndc = [v / clip[3] for v in clip[:3]]
    assert canvas['width'] > 0 and canvas['height'] > 0
    css = [canvas['x'] + (ndc[0] + 1) * canvas['width'] / 2,
           canvas['y'] + (1 - ndc[1]) * canvas['height'] / 2]
    return dict(world=world, ndc=ndc, css=css)


def audit_draw(manifest, draw, gpu_frame=None):
    """Compare recorded sockets to the sampler before attributing texture phase.

    draw keys: adapterFrame, pose, sockets (local xyz by socket name),
    rootMatrixWorld, cameraMatrixWorldInverse, cameraProjectionMatrix, canvas.
    gpu_frame must come from independent unambiguous texture identification.
    A result is arithmetic evidence, never texture-identification evidence.
    """
    if gpu_frame is not None:
        assert isinstance(gpu_frame, int) and 0 <= gpu_frame < 300
    matrices = [draw['rootMatrixWorld'], draw['cameraMatrixWorldInverse'],
                draw['cameraProjectionMatrix'], draw['canvas']]
    result = dict(adapterFrame=draw['adapterFrame'], gpuFrame=gpu_frame,
                  samplerReproduced=False, textureFrameProvided=gpu_frame is not None, sockets={})
    for name in SOCKET_BONES:
        observed = draw['sockets'][name]
        sampled = socket_local(manifest, name, draw['adapterFrame'], draw['pose'])
        local_error = math.dist(observed, sampled)
        observed_position = positions(observed, *matrices)
        record = dict(observedLocal=observed, reconstructedLocal=sampled,
                      localReconstructionError=local_error, observed=observed_position)
        if gpu_frame is not None:
            texture_local = socket_local(manifest, name, gpu_frame, draw['pose'])
            texture_position = positions(texture_local, *matrices)
            record.update(textureLocal=texture_local, texture=texture_position,
                          canonicalPhaseDelta=math.dist(sampled, texture_local),
                          worldPhaseDelta=math.dist(observed_position['world'], texture_position['world']),
                          cssPhaseDelta=math.dist(observed_position['css'], texture_position['css']))
        result['sockets'][name] = record
    result['samplerReproduced'] = all(x['localReconstructionError'] <= 1e-6 for x in result['sockets'].values())
    result['phaseAttributableGivenExternalTextureProof'] = result['samplerReproduced'] and gpu_frame is not None
    return result
