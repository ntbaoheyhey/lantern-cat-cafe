"""Free, local callout production; shared DSP and unprompted recognition.

Piper LJSpeech (public-domain dataset) supplies intelligible consonants. Each
character keeps its S4 cat excitation, formants, effort and short room tail.
Reference-game audio is never an input to this module.
"""
import hashlib, importlib.util, json, re, subprocess
from pathlib import Path
import numpy as np
from piper import PiperVoice, SynthesisConfig
from voice_features import RATE, decode, features

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / 'work/v3b2/callouts'
WORK.mkdir(parents=True, exist_ok=True)
spec = importlib.util.spec_from_file_location('cat_speak', ROOT/'scripts/audio/build-cat-voices.py')
cat_speak = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cat_speak)
PROFILES = cat_speak.profiles
MODEL_URL = 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ljspeech/high'
TTS = None

def ffmpeg(x, filters):
    b = subprocess.check_output(['ffmpeg','-v','error','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-af',filters,'-ar',str(RATE),'-f','f32le','pipe:1'], input=x.astype('<f4').tobytes())
    return np.frombuffer(b,dtype='<f4').copy()

def save(path, x):
    path.parent.mkdir(parents=True,exist_ok=True)
    subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-c:a','flac',str(path)], input=x.astype('<f4').tobytes(),check=True)

def speak(text, take=0, pace=1):
    global TTS
    key = hashlib.sha256(f'{text}/{take}/{pace}'.encode()).hexdigest()[:20]
    p = WORK/'tts'/f'{key}.flac'
    if p.exists(): return decode(p)
    if TTS is None: TTS = PiperVoice.load(ROOT/'tools/audio-models/en_US-ljspeech-high.onnx')
    config = SynthesisConfig(length_scale=pace*(.94 if take==0 else 1.02),noise_scale=.5 if take==0 else .65,noise_w_scale=.6 if take==0 else .8)
    x = np.concatenate([c.audio_float_array for c in TTS.synthesize(text,config)])
    b = subprocess.check_output(['ffmpeg','-v','error','-f','f32le','-ar',str(TTS.config.sample_rate),'-ac','1','-i','pipe:0','-ar',str(RATE),'-f','f32le','pipe:1'],input=x.astype('<f4').tobytes())
    x=np.frombuffer(b,dtype='<f4').copy();save(p,x)
    return x

def enemy_profile(unit):
    # Authored formant voices; no imitated performer or protected character.
    index = list(json.loads((ROOT/'scripts/audio/data/callouts.json').read_text())).index(unit)-12
    p=dict(PROFILES[list(PROFILES)[index%12]])
    p.update(baseSemitones=-7+(index%5)*1.4,formantShift=.78+(index%4)*.07,brightness=1800+(index%4)*650,rolloff=1.4,colorHz=260+index*83,colorDb=5,breathiness=.1,signature='purr')
    return p

def rms_normalize(x, target=.12):
    rms=float(np.sqrt(np.mean(x*x)))
    return x*(target/max(.0001,rms))

def process(row, take=0, settings=None):
    settings={'pitchWeight':.65,'filterWeight':.6,'grainGain':.32,'tailSeconds':.22,**(settings or {})}
    unit=row['unitId'];p=PROFILES.get(unit) or enemy_profile(unit)
    text=row['text'];phase=row.get('phase');pace=.98+(p['speed']-.18)*1.2
    pace*=settings.get('paceMultiplier',1)
    speech=speak(settings.get('ttsText',text),settings.get('ttsTake',take),pace)
    if settings.get('cutSpeechMs'):
        speech=cat_speak.edge(speech[:round(RATE*settings['cutSpeechMs']/1000)],.008)
    clear_speech=rms_normalize(speech.copy())
    # Rate-preserving pitch/formant processing. A clear upper consonant band
    # survives the chest/nasal coloration so small speakers retain the words.
    semitones=p['baseSemitones']*settings['pitchWeight']+(take-.5)*.35
    ratio=2**(semitones/12)
    if settings.get('preserveFormants'):
        # WORLD keeps each vowel's spectral envelope while changing the vocal
        # excitation. This avoids the chipmunk/darkened vowels of resampling.
        import pyworld as world
        source=np.asarray(speech,dtype=np.float64)
        f0,t=world.dio(source,RATE,f0_floor=70,f0_ceil=1200,frame_period=5)
        f0=world.stonemask(source,f0,t,RATE)
        envelope=world.cheaptrick(source,f0,t,RATE)
        aperiodicity=world.d4c(source,f0,t,RATE)
        accent=settings.get('phraseAccent',0)
        voiced=np.flatnonzero(f0>0)
        progress=np.clip((t-t[voiced[0]])/max(.01,t[voiced[-1]]-t[voiced[0]]),0,1) if len(voiced) else t*0
        # A spoken exclamation relaxes from its opening emphasis into the end.
        gesture=.5-(3*progress**2-2*progress**3)
        f0*=2**((semitones+accent*gesture)/12)
        speech=world.synthesize(f0,envelope,aperiodicity,RATE,frame_period=5).astype(np.float32)[:len(source)]
    else:
        speech=ffmpeg(speech,f"asetrate={round(RATE*ratio)},aresample={RATE},atempo={1/ratio}")
    weight=settings['filterWeight']
    speech=cat_speak.spectral(speech,lambda f:(1-weight)+weight/(1+(f/p['brightness'])**(2*p.get('rolloff',1))))
    speech=cat_speak.spectral(speech,lambda f:10**(p.get('colorDb',0)*weight*np.exp(-.5*(np.log2(np.maximum(f,30)/p.get('colorHz',900))/.65)**2)/20))
    speech=rms_normalize(speech)
    cat,used,details=cat_speak.render(unit,p,text,'ult' if row['kind']=='ultimate' else 'skill',take)
    cat=rms_normalize(cat)
    # Cat syllables punctuate word starts and finish the line, never replace words.
    lead=.095 if phase=='charge' else .04
    start=int(RATE*lead);tail=int(RATE*settings['tailSeconds'])
    x=np.zeros(start+len(speech)+tail+int(RATE*.12),dtype=np.float32)
    x[start:start+len(speech)]=speech
    word_onsets=settings.get('wordOnsetsSeconds')
    for i,word in enumerate(re.findall(r"[\w']+",text)):
        onset=int(RATE*word_onsets[i]) if word_onsets and i<len(word_onsets) else int(len(speech)*i/max(1,len(text.split())))
        at=min(start+len(speech)-int(RATE*.09),start+int(RATE*.06)+onset)
        grain=cat_speak.edge(cat[(i*int(RATE*.1))%max(1,len(cat)-int(RATE*.09)):][:int(RATE*.09)])
        x[at:at+len(grain)]+=grain*settings['grainGain']
    ending=cat_speak.edge(cat[-min(len(cat),tail+int(RATE*.1)):-int(RATE*.1)])
    at=start+len(speech)-int(RATE*.025)
    x[at:at+len(ending)]+=ending*settings['grainGain']*1.5
    # A CC0 mouth grain gives a short breath/effort onset; the source is logged.
    breath=cat_speak.mouth[(sum(map(ord,unit))+take)%len(cat_speak.mouth)]
    effort=cat_speak.edge(cat_speak.mouth_pcm[breath['id']][:int(RATE*.065)])
    x[:len(effort)]+=rms_normalize(effort,.025)
    used.append(breath)
    if unit not in PROFILES:
        x *= .92+.08*np.sin(2*np.pi*31*np.arange(len(x))/RATE)
    dry=x.copy()
    for seconds,gain in [(.037,.055),(.071,.025)]:
        d=int(RATE*seconds);x[d:]+=dry[:-d]*gain
    if settings.get('eq'):
        eq=settings['eq']
        # Retain a measured amount of the spoken core under character colour.
        # Narrow character filters otherwise remove voiced fundamentals and
        # consonants together, leaving a thin line that music easily masks.
        dry_mix=max(0,min(1,settings.get('spokenCore',0)))
        x=cat_speak.spectral(x,lambda f:dry_mix+(1-dry_mix)*colour_response(f,eq))
    if settings.get('consonantCore') and word_onsets:
        # Restore short, time-aligned upper-band speech attacks after character
        # colour. Timestamps come from unprompted local ASR of the clean source;
        # the measured callout is independently recognised without a prompt.
        core=cat_speak.spectral(clear_speech,lambda f:1-np.exp(-(f/1800)**4))
        for onset in word_onsets:
            at=max(0,round(RATE*onset));end=min(len(core),at+round(RATE*.14))
            grain=cat_speak.edge(core[at:end],.008)*settings['consonantCore']
            count=min(len(grain),len(x)-start-at)
            if count>0:x[start+at:start+at+count]+=grain[:count]
    return normalize_callout(x),used,{'profile':p,'settings':settings,'semitones':semitones,'grains':details,'speechModel':MODEL_URL,'firstWordMs':round(lead*1000)}

def normalize_callout(x):
    # Smooth look-ahead gain controls whole syllables instead of clipping their
    # waveforms. Sub-millisecond compression added harmonics that erased the
    # spectral identity of the quieter cats. A 25 ms peak window and 5 ms gain
    # smoothing retain the consonants and character EQ while reducing crest.
    from scipy.ndimage import maximum_filter1d, gaussian_filter1d
    x=x*.8/max(.0001,float(np.max(np.abs(x))))
    envelope=maximum_filter1d(np.abs(x),size=int(RATE*.025)|1,mode='nearest')
    gain=np.minimum(1,.12/np.maximum(envelope,.0001))
    gain=gaussian_filter1d(gain,sigma=RATE*.005,mode='nearest')
    x=cat_speak.normalize(x*gain)
    level=pcm_levels(x)
    if level['integratedLufs'] < -17:
        envelope=maximum_filter1d(np.abs(x),size=int(RATE*.08)|1,mode='nearest')
        gain=gaussian_filter1d(np.minimum(1,.04/np.maximum(envelope,.0001)),RATE*.01,mode='nearest')
        x=cat_speak.normalize(x*gain)
        level=pcm_levels(x)
    # A constant trim is spectrally neutral. Keep encoder headroom; unusually
    # short charge syllables need this after EBU's short-window normalization.
    gain_db=min(-16-level['integratedLufs'],-1.4-level['truePeakDbTP'])
    return x*10**(gain_db/20)

def pcm_levels(x):
    r=subprocess.run(['ffmpeg','-hide_banner','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0',
      '-af','loudnorm=I=-16:TP=-1:LRA=11:print_format=json','-f','null','-'],input=x.astype('<f4').tobytes(),capture_output=True,check=True)
    text=r.stderr.decode();j=json.JSONDecoder().raw_decode(text[text.rfind('{'):])[0]
    return {'integratedLufs':float(j['input_i']),'truePeakDbTP':float(j['input_tp'])}

def colour_response(f,eq):
    highpass=1/(1+(eq['highpass']/np.maximum(f,1))**(2*eq['highSlope']))
    lowpass=1/(1+(f/eq['lowpass'])**(2*eq['lowSlope']))
    resonance=10**(eq['resonanceDb']*np.exp(-.5*(np.log2(np.maximum(f,30)/eq['resonanceHz'])/.7)**2)/20)
    return highpass*lowpass*resonance

def words(text):
    return re.findall(r"[a-z]+",text.lower().replace("'",''))

def accuracy(expected,actual):
    a,b=words(expected),words(actual);dp=list(range(len(b)+1))
    for i,x in enumerate(a,1):
        nxt=[i]
        for j,y in enumerate(b,1):nxt.append(min(nxt[-1]+1,dp[j]+1,dp[j-1]+(x!=y)))
        dp=nxt
    return max(0,1-dp[-1]/max(1,len(a)))

def recognizer(threads=4):
    from faster_whisper import WhisperModel
    return WhisperModel('small.en',device='cpu',compute_type='int8',cpu_threads=threads,download_root=str(ROOT/'tools/audio-models'),local_files_only=True)

def recognize(model,path,text):
    segments,info=model.transcribe(str(path),language='en',beam_size=5,vad_filter=False,condition_on_previous_text=False,temperature=0)
    result=' '.join(s.text.strip() for s in segments)
    return {'expected':text,'recognized':result,'wordAccuracy':accuracy(text,result),'model':'faster-whisper small.en int8 CPU','prompt':None,'beamSize':5,'temperature':0,'language':'en'}
