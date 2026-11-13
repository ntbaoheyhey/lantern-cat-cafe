import unittest
import numpy as np
from voice_features import features,RATE

class VoiceFeaturesTest(unittest.TestCase):
 def test_pitch_measurement_tracks_three_octaves(self):
  for f in [110,220,440,880]:
   t=np.arange(RATE)/RATE;x=.3*np.sin(2*np.pi*f*t)+.12*np.sin(4*np.pi*f*t)
   measured=features(x)
   self.assertLess(abs(12*np.log2(measured['medianF0']/f)),.7)
 def test_silence_does_not_dominate_identity(self):
  t=np.arange(RATE)/RATE;x=.3*np.sin(2*np.pi*350*t)+.05*np.sin(2*np.pi*2400*t)
  a=features(x);b=features(np.r_[np.zeros(RATE),x,np.zeros(RATE)])
  self.assertLess(np.linalg.norm(np.asarray(a['mfcc'])-b['mfcc']),8)
  self.assertLess(abs(a['medianF0']-b['medianF0']),2)
 def test_loudness_is_not_confused_with_identity(self):
  t=np.arange(RATE)/RATE;x=.3*np.sin(2*np.pi*300*t)+.1*np.sin(2*np.pi*900*t)
  a=features(x);b=features(x*.3)
  self.assertLess(np.linalg.norm(np.asarray(a['mfcc'])-b['mfcc']),5)

if __name__=='__main__':unittest.main()
