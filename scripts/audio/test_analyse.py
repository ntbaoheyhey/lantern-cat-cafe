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

    def test_sustained_tones_and_chords_do_not_manufacture_repeated_attacks(self):
        t=np.arange(RATE*6)/RATE
        for frequencies in [[440],[73.416],[146.8,174.6,220],[73.4,146.8,220.2]]:
            for gain in [.03,.2]:
                result=measure(sum(gain*np.sin(2*np.pi*f*t) for f in frequencies))
                interior=[at for at in result['onsetTimes'] if .2<at<5.8]
                self.assertEqual(interior,[],(frequencies,gain,interior))

    def test_real_attacks_remain_detectable_and_time_aligned(self):
        t=np.arange(RATE*4)/RATE
        signal=.04*np.sin(2*np.pi*220*t)
        for at in [.5,1.5,2.5,3.5]:
            begin=round(at*RATE);n=round(.12*RATE);local=np.arange(n)/RATE
            signal[begin:begin+n]+=.35*np.sin(2*np.pi*880*local)*np.exp(-local/.025)
        result=measure(signal)
        for at in [.5,1.5,2.5,3.5]:
            self.assertTrue(any(abs(found-at)<.03 for found in result['onsetTimes']),(at,result['onsetTimes']))

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
