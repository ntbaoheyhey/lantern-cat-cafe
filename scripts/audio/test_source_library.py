import unittest,runpy
from pathlib import Path
import numpy as np

M=runpy.run_path(str(Path(__file__).with_name('build-source-library.py')))
RATE=M['RATE']


class SourceQuality(unittest.TestCase):
    def test_mouth_grains_are_nonoverlapping_real_events(self):
        data=np.zeros(RATE*3,dtype=np.float32)
        for second in [.2,.6,1.0,1.5,2.0,2.5]:
            at=int(second*RATE);pulse=np.hanning(800)*.6
            data[at:at+800]=pulse
        parts=M['mouth_segments'](data)
        self.assertEqual(len(parts),6)
        for previous,current in zip(parts,parts[1:]):self.assertLessEqual(previous[2],current[1])
        for sample,start,end in parts:
            np.testing.assert_array_equal(sample,data[round(start*RATE):round(end*RATE)])

    def test_normalization_caps_gain_and_peak_without_inventing_silent_audio(self):
        signal=np.sin(np.linspace(0,60,4800)).astype(np.float32)*.99
        out,metrics=M['normalize'](signal,-3)
        self.assertLessEqual(metrics['samplePeakDbFS'],-2.999)
        self.assertLessEqual(metrics['gainDb'],18)
        self.assertEqual(len(out),len(signal))
        with self.assertRaises(ValueError):M['normalize'](np.zeros(4800,dtype=np.float32))

    def test_trim_preserves_impulse_and_documents_original_range(self):
        signal=np.zeros(RATE,dtype=np.float32);signal[RATE//2]=.8
        clipped,start,end=M['trim'](signal)
        self.assertIn(.8,clipped)
        np.testing.assert_array_equal(clipped,signal[round(start*RATE):round(end*RATE)])
        self.assertLess(start,.5);self.assertGreater(end,.5)


if __name__=='__main__':unittest.main()
