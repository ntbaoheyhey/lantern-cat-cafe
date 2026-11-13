import unittest
import numpy as np
from analyse import measure, RATE


class Measurements(unittest.TestCase):
    def test_silence_is_not_music_voice_or_onsets(self):
        result=measure(np.zeros(RATE*2))
        self.assertEqual(result['silenceFraction'],1)
        self.assertEqual(result['onsetCount'],0)
        self.assertEqual(result['voiceContoursPerMinute'],0)
        self.assertEqual(result['musicBedFraction'],0)

    def test_sustained_tone_has_a_bed_without_voice_contours(self):
        t=np.arange(RATE*2)/RATE
        result=measure(0.2*np.sin(2*np.pi*440*t))
        self.assertGreater(result['musicBedFraction'],0.95)
        self.assertEqual(result['voiceContoursPerMinute'],0)
        self.assertEqual(result['silenceFraction'],0)

    def test_separated_broadband_impacts_have_onsets_and_band_rises(self):
        x=np.zeros(RATE*3)
        rng=np.random.default_rng(2)
        for at in [0.5,1.5,2.5]:
            n=round(RATE*0.025)
            x[round(at*RATE):round(at*RATE)+n]=rng.normal(0,0.2,n)*np.hanning(n)
        result=measure(x)
        self.assertGreaterEqual(result['onsetCount'],3)
        self.assertGreaterEqual(result['layersPerOnset'],2)
        self.assertGreater(result['silenceFraction'],0.7)


if __name__=='__main__':
    unittest.main()
