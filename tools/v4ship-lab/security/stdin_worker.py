"""Keep stdin delivery uninterrupted while the caller checks stop requests.

LEARN: reports/v4-ship/LEARN/S11-history-gzip.md. Python 3.9 communicate retries
with input=None can stop feeding an unfinished pipe. One worker owns all pipe IO;
only the process passed by the caller is terminated on cancellation.
"""
import threading


def communicate(process, payload, should_stop, interval=2):
    done = threading.Event()
    result = {}

    def transfer():
        try:
            result['streams'] = process.communicate(input=payload)
        except BaseException:
            result['failed'] = True
        finally:
            done.set()

    worker = threading.Thread(target=transfer, name='scanner-stdin')
    worker.start()

    def stop_owned_process():
        if process.poll() is None:
            try:
                process.terminate()
            except ProcessLookupError:
                pass
        if not done.wait(5):
            if process.poll() is None:
                try:
                    process.kill()
                except ProcessLookupError:
                    pass
            if not done.wait(5):
                raise RuntimeError('Owned scanner did not close its pipes')
        worker.join()

    try:
        while not done.wait(interval):
            if should_stop():
                raise InterruptedError('Scanner stop requested')
    except BaseException:
        stop_owned_process()
        raise
    worker.join()
    if result.get('failed'):
        raise RuntimeError('Scanner communication failed; raw diagnostics suppressed')
    return result['streams']
