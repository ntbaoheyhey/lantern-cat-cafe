import {readFileSync, writeFileSync, existsSync, statSync, readdirSync} from 'node:fs';
import {resolve, relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {T, CARDS} from './thresholds.mjs';

const DEFAULT_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const B = 'reports/v3-shell/b2/';
const finite = n => typeof n === 'number' && Number.isFinite(n);
const all = (xs, fn) => Array.isArray(xs) && xs.length > 0 && xs.every(fn);
const unique = xs => new Set(xs.filter(x => x !== undefined && x !== null && x !== '')).size;
const between = (v, lo, hi) => finite(v) && v >= lo && v <= hi;
const percentile = (xs, p) => {
  if (!all(xs, finite)) return NaN;
  const a = [...xs].sort((a,b) => a-b), pos = (a.length-1)*p/100;
  return a[Math.floor(pos)] + (a[Math.ceil(pos)]-a[Math.floor(pos)])*(pos%1);
};

export function checkGates({root = DEFAULT_ROOT, now = new Date()} = {}) {
  // One synchronous evidence snapshot per invocation. Large committed economy
  // reports are cited hundreds of times; hash each file and Git blob once.
  // New calls get fresh caches, so edits between checks are still observed.
  const rows = [], cache = new Map(), digests = new Map(), committedFiles = new Map();
  const path = p => { const a = resolve(root,p); if (relative(root,a).startsWith('..')) throw Error('Evidence outside repository'); return a; };
  const file = p => typeof p === 'string' && existsSync(path(p)) && statSync(path(p)).isFile() && statSync(path(p)).size > 0;
  const text = p => file(p) ? readFileSync(path(p),'utf8') : '';
  const json = p => { if (!cache.has(p)) { try { cache.set(p,JSON.parse(text(p))); } catch { cache.set(p,undefined); } } return cache.get(p); };
  const ev = p => json(B+p);
  const files = dir => {
    if (!existsSync(path(dir))) return [];
    return readdirSync(path(dir),{withFileTypes:true}).flatMap(e => e.isSymbolicLink() ? [] : e.isDirectory() ? files(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
  };
  const digest = p => {
    if (!digests.has(p)) digests.set(p, file(p) ? createHash('sha256').update(readFileSync(path(p))).digest('hex') : undefined);
    return digests.get(p);
  };
  const signedFile = r => !!r && file(r.path) && typeof r.sha256 === 'string' && digest(r.path) === r.sha256;
  const committed = p => {
    if (!committedFiles.has(p)) {
      let matches = false;
      if (file(p)) {
        try { matches = createHash('sha256').update(execFileSync('git',['show',`HEAD:${p}`],{cwd:root,stdio:['ignore','pipe','ignore'],maxBuffer:64*1024*1024})).digest('hex')===digest(p); } catch {}
      }
      committedFiles.set(p, matches);
    }
    return committedFiles.get(p);
  };
  const test = r => !!r && r.exitCode === 0 && r.passed > 0 && signedFile(r.log);
  const record = (id, threshold, measured, pass, detail='') => rows.push({id,card:id.split('.')[0],threshold,measured: measured ?? 'missing',status:pass?'PASS':'FAIL',detail});
  const num = (id, threshold, v, fn) => record(id,threshold,v,finite(v)&&fn(v));
  const count = (id, threshold, xs, n, predicate = () => true) => num(id,threshold,Array.isArray(xs)?xs.filter(predicate).length:undefined,v=>v>=n);
  const every = (id, threshold, xs, predicate) => record(id,threshold,Array.isArray(xs)?`${xs.filter(predicate).length}/${xs.length}`:'missing',all(xs,predicate));
  const artifact = (id, p) => record(id,`nonempty ${p}`,file(p)?statSync(path(p)).size:undefined,file(p));
  const checkTest = (id, r) => record(id,'passing test + SHA-256-verified log',r?.passed,test(r));

  const reference = ev('REFERENCE-AUDIO.json'), candidates = json('assets/audio-sources/CANDIDATES.json');
  const metrics = ['onsetsPerSecond','layersPerOnset','integratedLufs','loudnessRange','musicBedFraction','voiceContoursPerMinute','tickTransientsPerSecond','silenceFraction'];
  const fallback = reference?.videosMissing === true && typeof reference?.fallback?.reason === 'string' && text(B+'DECISIONS.md').includes('videos missing');
  record('R.windows',`>= ${T.researchWindows} measured windows with all metrics, or logged videos missing`,reference?.windows?.length,fallback || (reference?.windows?.length>=T.researchWindows && all(reference.windows,w=>metrics.every(m=>finite(w.metrics?.[m])) && w.durationSeconds>=30)));
  count('R.candidates',`>= ${T.researchCandidates} candidate files with licence URLs`,candidates?.files,T.researchCandidates,r=>!!r.sourceUrl&&!!r.licenseUrl&&!!r.file);
  count('R.levers',`>= ${T.researchNewLevers} new economy levers with file:line`,ev('RESEARCH-LEVERS.json')?.levers,T.researchNewLevers,r=>file(r.path)&&Number.isInteger(r.line)&&r.line>0&&!!r.whoPays&&!!r.benefit&&!!r.risk);
  artifact('R.report',B+'RESEARCH-B2.md');

  const map = ev('SOUND-MAP.json'), coverage=ev('SOUND-MAP-COVERAGE.json');
  const validMap = r => !!r.cueId&&!!r.screen&&!!r.event&&!!r.bus&&Array.isArray(r.layers)&&r.layers.length>0&&finite(r.variantCount)&&Array.isArray(r.pitchRange)&&Array.isArray(r.volumeRange)&&finite(r.cooldownMs)&&finite(r.priority)&&r.ducking!==undefined&&!JSON.stringify(r).includes('TBD');
  count('S1.events',`>= ${T.mappedEvents} complete events; 0 TBD`,map?.rows,T.mappedEvents,validMap);
  num('S1.screens',`>= ${T.mappedScreens} screens`,map?.rows?unique(map.rows.filter(validMap).map(r=>r.screen)):undefined,n=>n>=T.mappedScreens);
  num('S1.existingCues',`0 existing cues absent; >= 1 inspected`,coverage?.missingExisting?.length,n=>n===0&&coverage.existingCueCount>0&&signedFile(coverage.cuesSource));
  num('S1.callsites',`0 unresolved playCue sites; >= 1 inspected`,coverage?.unresolved?.length,n=>n===0&&coverage.callsiteCount>0&&all(coverage.sources,signedFile));
  artifact('S1.report',B+'SOUND-MAP.md'); artifact('S1.typedMap','apps/web/src/audio/sound-map.ts');

  const catalog=json('assets/audio-sources/CATALOG.json'), clips=catalog?.clips, licences=json('apps/web/public/audio/LICENSES.json')?.files;
  const usable=r=>signedFile(r)&&finite(r.durationSeconds)&&r.durationSeconds>0&&!!r.role;
  count('S2.clips',`>= ${T.sourceClips} usable hashed source clips`,clips,T.sourceClips,usable);
  const cats=clips?.filter(r=>r.kind==='cat-recording'&&usable(r));
  num('S2.catRecordings',`>= ${T.catRecordings} distinct original recordings`,cats?unique(cats.map(r=>r.recordingId)):undefined,n=>n>=T.catRecordings);
  num('S2.catAuthors',`>= ${T.catAuthors} cat-recording authors`,cats?unique(cats.map(r=>r.author)):undefined,n=>n>=T.catAuthors);
  count('S2.consonants',`>= ${T.consonantGrains} consonant/mouth/click grains`,clips,T.consonantGrains,r=>r.role==='consonant'&&usable(r));
  count('S2.ambience',`>= ${T.ambienceBeds} ambience beds`,clips,T.ambienceBeds,r=>r.role==='ambience'&&usable(r));
  count('S2.music',`>= ${T.musicPieces} music pieces`,clips,T.musicPieces,r=>r.role==='music'&&usable(r));
  count('S2.stings',`>= ${T.stings} stings`,clips,T.stings,r=>r.kind==='sting'&&usable(r));
  const audioFiles=[...files('assets/audio-sources'),...files('apps/web/public/audio')].filter(p=>/\.(flac|opus|webm|mp3|wav|ogg|aif|aiff)$/i.test(p));
  const licensed=p=>licences?.some(l=>(l.path??`apps/web/public/audio/${l.file}`)===p&&(l.sha256??l.hash)===digest(p)&&l.sourceUrl&&l.author&&l.date&&l.license);
  num('S2.licenceCoverage','100% source and shipped audio files with licence, author, URL, date, SHA-256',audioFiles.length?audioFiles.filter(licensed).length/audioFiles.length:undefined,n=>n===T.licenceCoverage);
  const allowed=l=>/^(CC0(?:-1\.0)?|SIL OFL(?:-1\.1)?|Pixabay Content License|Kenney \(CC0\)|Sonniss GDC bundle licence|Own synthesis|Own recording)$/.test(l.license??'');
  num('S2.licences','0 non-commercial, unlicensed, or disallowed licence rows',licences?.filter(l=>!allowed(l)).length,n=>n===T.forbiddenLicences&&licences.length>0);

  const layers=ev('LAYERED-AUDIO.json'), battle=ev('AUDIO-BATTLE.json');
  every('S3.hitLayers',`each battle hit >= ${T.hitLayers} layers`,layers?.hitCues,r=>r.layers?.length>=T.hitLayers);
  every('S3.hitVariants',`each hit layer >= ${T.hitLayerVariants} variants`,layers?.hitCues,r=>all(r.layers,l=>l.variants?.length>=T.hitLayerVariants&&all(l.variants,signedFile)));
  every('S3.uiVariants',`each UI cue >= ${T.uiVariants} variants`,layers?.uiCues,r=>r.variants?.length>=T.uiVariants);
  num('S3.repeats',`0 consecutive identical variants in >= ${T.battleSeconds}s auto battle`,battle?.consecutiveVariantRepeats,n=>n===T.consecutiveRepeats&&battle.durationSeconds>=T.battleSeconds&&battle.played>0);
  num('S3.sfxConcurrency',`<= ${T.sfxConcurrency} sfx including layers`,battle?.maxSfxConcurrency,n=>n<=T.sfxConcurrency&&battle.durationSeconds>=T.battleSeconds);
  num('S3.voiceConcurrency',`<= ${T.voiceConcurrency} voice`,battle?.maxVoiceConcurrency,n=>n<=T.voiceConcurrency&&battle.durationSeconds>=T.battleSeconds);
  const shipped=files('apps/web/public/audio').filter(p=>/\.(mp3|webm|opus|ogg|flac|wav)$/i.test(p));
  num('S3.bytes',`<= ${T.shippedAudioBytes} bytes incl. callouts`,shipped.length?shipped.reduce((s,p)=>s+statSync(path(p)).size,0):undefined,n=>n<=T.shippedAudioBytes);
  num('S3.cpu',`< ${T.cpuAddedPercent}% added main-thread time, ${T.battleSeconds}s paired traces`,ev('AUDIO-PERFORMANCE.json')?.addedMainThreadPercent,n=>n<T.cpuAddedPercent&&all(ev('AUDIO-PERFORMANCE.json')?.traces,r=>r.durationSeconds>=T.battleSeconds&&signedFile(r)));

  const voice=ev('VOICE-DISTINCT.json');
  const distinct=r=>finite(r.nearestMfccDistance)&&r.nearestMfccDistance>=percentile(voice?.sourceBetweenRecordingDistances??[],T.sourceDistancePercentile)&&(r.nearestSourceRecording!==r.sourceRecording||r.nearestF0Semitones>=T.nearestF0Semitones);
  count('S4.cats',`>= ${T.cats} cats, >= ${T.voiceLinesPerCat} lines each`,voice?.cats,T.cats,r=>r.lines?.length>=T.voiceLinesPerCat);
  every('S4.consonants',`each rendered line >= ${T.consonantsPerSyllable} consonants/syllable`,voice?.cats,r=>all(r.lines,l=>l.syllables>0&&l.consonants/l.syllables>=T.consonantsPerSyllable&&signedFile(l)));
  every('S4.distinct',`nearest MFCC >= source p${T.sourceDistancePercentile}; F0 >= ${T.nearestF0Semitones} semitones OR different source`,voice?.cats,distinct);
  every('S4.loudness',`${T.voiceLufs} LUFS +/- ${T.voiceLufsTolerance}`,voice?.cats,r=>all(r.lines,l=>between(l.integratedLufs,T.voiceLufs-T.voiceLufsTolerance,T.voiceLufs+T.voiceLufsTolerance)));
  num('S4.cadence',`median voice interval ${T.voiceIntervalMin}-${T.voiceIntervalMax}s`,battle?.medianVoiceIntervalSeconds,n=>between(n,T.voiceIntervalMin,T.voiceIntervalMax));
  artifact('S4.lines',B+'VOICE-LINES.md');

  const callouts=json('apps/web/src/audio/voice-callouts.json'), callout=ev('VOICE-CALLOUTS-VALIDATION.json');
  every('V.coverage','100% playable, elite and boss active skills + ultimates from rules',callout?.roster,r=>all(r.requiredCueIds,id=>callouts?.some(c=>c.cueId===id&&c.unitId===r.unitId))&&all(r.sources,signedFile));
  every('V.variants',`>= ${T.ultimateVariants} takes per ultimate line`,callout?.ultimates,r=>r.variants?.length>=T.ultimateVariants&&all(r.variants,signedFile));
  every('V.ultAccuracy',`recogniser word accuracy >= ${T.ultWordAccuracy}`,callout?.ultimates,r=>r.wordAccuracy>=T.ultWordAccuracy&&signedFile(r.recogniserLog));
  every('V.skillAccuracy',`recogniser word accuracy >= ${T.skillWordAccuracy}`,callout?.skills,r=>r.wordAccuracy>=T.skillWordAccuracy&&signedFile(r.recogniserLog));
  every('V.distinct','S4 distinctness holds for callouts',callout?.cats,distinct);
  num('V.battle',`0 missing ultimate callouts; music ducks; >= ${T.battleSeconds}s`,callout?.battle?.missing,n=>n===T.missingUltimateCallouts&&callout.battle.durationSeconds>=T.battleSeconds&&callout.battle.ultimateCasts>0&&callout.battle.duckedCasts===callout.battle.ultimateCasts&&signedFile(callout.battle.log));
  every('V.levels',`${T.voiceLufs} LUFS +/- ${T.voiceLufsTolerance}, peak <= ${T.truePeakDbTP} dBTP`,callout?.files,r=>between(r.integratedLufs,T.voiceLufs-T.voiceLufsTolerance,T.voiceLufs+T.voiceLufsTolerance)&&finite(r.truePeakDbTP)&&r.truePeakDbTP<=T.truePeakDbTP&&signedFile(r));
  artifact('V.lines',B+'VOICE-CALLOUTS.md');

  const audit=ev('UI-AUDIT.json'), rebuilt=ev('UI-REBUILD.json'), art=ev('UI-ART.json');
  const scoreNames=['artRichness','hierarchy','textDiet','gameFeel','consistency'];
  count('U1.screens',`>= ${T.auditedScreens} states, screenshots, all metrics and fix lists`,audit?.screens,T.auditedScreens,r=>r.viewport?.width===1280&&r.viewport?.height===720&&signedFile(r.screenshot)&&finite(r.visibleWords)&&finite(r.plainTextButtons)&&finite(r.iconTiles)&&scoreNames.every(k=>between(r.scores?.[k],1,10))&&Array.isArray(r.missingElements)&&Array.isArray(r.fixes)&&r.fixes.length>0);
  artifact('U1.report',B+'UI-AUDIT.md');
  count('U2.files',`>= ${T.uiArtFiles} new art files with provenance`,art?.files,T.uiArtFiles,r=>signedFile(r)&&r.isNew===true&&r.provenance?.tool&&r.provenance?.prompt&&r.provenance?.license);
  num('U2.bytes',`<= ${T.uiArtBytes} bytes new UI art`,art?.files&&all(art.files,signedFile)?art.files.reduce((s,r)=>s+statSync(path(r.path)).size,0):undefined,n=>n<=T.uiArtBytes);
  every('U2.inputs','0 reference frames as generator inputs; text/own images only',art?.files,r=>Array.isArray(r.provenance?.inputs)&&r.provenance.inputs.every(i=>i.kind==='text'||(i.kind==='own-image'&&signedFile(i))));
  artifact('U2.sheet',B+'shots/ui-kit.png');
  count('U3.screens',`>= ${T.rebuiltScreens} rebuilt screens`,rebuilt?.screens,T.rebuiltScreens);
  every('U3.coverage','every U1 screen rebuilt',audit?.screens,r=>rebuilt?.screens?.some(s=>s.id===r.id));
  every('U3.images','1280x720 AND 1440x900 before/after images per screen',rebuilt?.screens,r=>[[1280,720],[1440,900]].every(([w,h])=>r.shots?.some(s=>s.width===w&&s.height===h&&signedFile(s)&&signedFile(s.before))));
  every('U3.words',`<= ${T.visibleWords} visible words every screen`,rebuilt?.screens,r=>finite(r.visibleWords)&&r.visibleWords<=T.visibleWords);
  every('U3.buttons',`<= ${T.plainTextButtons} plain text buttons every screen`,rebuilt?.screens,r=>finite(r.plainTextButtons)&&r.plainTextButtons<=T.plainTextButtons);
  num('U3.fonts',`0 system fonts`,rebuilt?.systemFontCount,n=>n===T.systemFonts);
  num('U3.glyphs',`0 Unicode glyph icons`,rebuilt?.unicodeIconCount,n=>n===T.unicodeIcons);
  every('U3.scores',`average >= ${T.screenAverageScore}; every criterion >= ${T.criterionScore}`,rebuilt?.screens,r=>scoreNames.every(k=>between(r.scores?.[k],T.criterionScore,10))&&scoreNames.reduce((s,k)=>s+r.scores[k],0)/scoreNames.length>=T.screenAverageScore);
  checkTest('U3.flows',rebuilt?.e2e);
  const motion=ev('UI-MOTION.json');
  record('U4.tour',`>= ${T.uiTourSeconds}s WebM with sound, <= ${T.uiTourBytes} bytes`,motion?.tour?.durationSeconds,signedFile(motion?.tour)&&motion.tour.durationSeconds>=T.uiTourSeconds&&motion.tour.hasAudio===true&&statSync(path(motion.tour.path)).size<=T.uiTourBytes);
  num('U4.cls',`0 layout shifts > ${T.layoutShiftThreshold} CLS`,motion?.layoutShifts?.filter(n=>n>T.layoutShiftThreshold).length,n=>n===T.excessiveLayoutShifts&&motion.screenChanges>0&&signedFile(motion.trace));
  num('U4.fps',`median >= ${T.transitionMedianFps} fps in panel transitions`,motion?.transitionMedianFps,n=>n>=T.transitionMedianFps&&signedFile(motion.trace));
  checkTest('U4.reducedMotion',motion?.reducedMotion);

  const ours=ev('OUR-AUDIO.json');
  const analyserHash=digest('scripts/audio/analyse.py');
  every('S5.algorithm','same current measurement algorithm for references and all six non-diagnostic renders',ours?.renders,r=>ours.renders.length===6&&new Set(ours.renders.map(v=>v.name)).size===6&&!!analyserHash&&reference?.algorithmSha256===analyserHash&&r.algorithmSha256===analyserHash&&!r.diagnostic);
  for(const name of ['battle','boss','home','bag','gacha','forge']) {
    const r=ours?.renders?.find(r=>r.name===name), ref=reference?.targets?.[name==='boss'?'battle':name], isBattle=['battle','boss'].includes(name);
    const seconds=name==='battle'?T.battleSeconds:name==='boss'?T.bossSeconds:T.menuSeconds;
    record(`S5.${name}.render`,`>= ${seconds}s measured Opus render`,r?.durationSeconds,r?.durationSeconds>=seconds&&signedFile(r)&&signedFile(r?.runtime)&&r?.errors?.length===0&&!r?.diagnostic);
    const relativeMetric=(metric,tolerance)=>num(`S5.${name}.${metric}`,`reference +/- ${tolerance*100}% (reference ${ref?.[metric]??'missing'})`,r?.[metric],n=>finite(ref?.[metric])&&Math.abs(n-ref[metric])<=Math.abs(ref[metric])*tolerance);
    relativeMetric('onsetsPerSecond',T.onsetRelativeTolerance);
    num(`S5.${name}.layers`, `>= reference median - ${T.layerMedianAllowance}`,r?.layersPerOnset,n=>finite(ref?.layersPerOnset)&&n>=ref.layersPerOnset-T.layerMedianAllowance);
    relativeMetric('tickTransientsPerSecond',T.tickRelativeTolerance);
    num(`S5.${name}.music`,`music bed >= ${T.musicBedFraction*100}%`,r?.musicBedFraction,n=>n>=T.musicBedFraction);
    relativeMetric('voiceContoursPerMinute',T.voiceRelativeTolerance);
    num(`S5.${name}.silence`,`<= reference + ${T.silenceFractionAllowance*100} percentage points`,r?.silenceFraction,n=>finite(ref?.silenceFraction)&&n<=ref.silenceFraction+T.silenceFractionAllowance);
    num(`S5.${name}.lufs`,isBattle?`${T.battleLufsMin} to ${T.battleLufsMax} LUFS`:`${T.menuLufsMin} to ${T.menuLufsMax} LUFS`,r?.integratedLufs,n=>isBattle?between(n,T.battleLufsMin,T.battleLufsMax):between(n,T.menuLufsMin,T.menuLufsMax));
    num(`S5.${name}.peak`,`<= ${T.truePeakDbTP} dBTP`,r?.truePeakDbTP,n=>n<=T.truePeakDbTP);
  }
  record('S5.duck',`${T.duckDb} dB, ${T.duckAttackMs}ms attack, ${T.duckReleaseMs}ms release`,ours?.ducking,ours?.ducking?.db===T.duckDb&&ours.ducking.attackMs===T.duckAttackMs&&ours.ducking.releaseMs===T.duckReleaseMs);
  artifact('S5.chart',B+'shots/audio-vs-ref.png');
  record('S5.reel',`>= ${T.soundReelSeconds}s sound reel`,ours?.reel?.durationSeconds,ours?.reel?.durationSeconds>=T.soundReelSeconds&&signedFile(ours.reel));
  const uiAudio=ev('UI-AUDIO.json');
  num('S6.coverage',`>= ${T.interactiveCueCoverage*100}% interactive elements emit mapped cue`,uiAudio?.elements?.length?uiAudio.elements.filter(r=>r.mappedCue).length/uiAudio.elements.length:undefined,n=>n>=T.interactiveCueCoverage&&all(audit?.screens,s=>uiAudio.elements.some(r=>r.screen===s.id)));
  num('S6.errors',`0 console audio errors`,uiAudio?.audioErrors?.length,n=>n===T.audioErrors&&uiAudio.elements?.length>0);
  num('S6.gaps',`no music silence > ${T.maxMusicGapMs}ms during screen changes`,uiAudio?.maxMusicGapMs,n=>n<=T.maxMusicGapMs&&signedFile(uiAudio.render));
  checkTest('S6.settings',uiAudio?.settings);
  const lab=ev('AUDIO-LAB.json');
  num('S7.coverage','100% mapped cues listed in lab',lab?.mappedCueCount>0?lab.listedCueCount/lab.mappedCueCount:undefined,n=>n===T.labCueCoverage&&lab.missingCueIds?.length===0);
  num('S7.random',`>= ${T.labRandomPlays} random cues from static server, 0 errors`,lab?.playedCueIds?.length,n=>n>=T.labRandomPlays&&lab.errors?.length===0&&/^http:\/\/(localhost|127\.0\.0\.1):/.test(lab.url??'')&&signedFile(lab.log));

  const baseline=ev('econ/BASELINE.json'), sinks=ev('econ/SINKS.json'), final=ev('econ/FINAL.json'), search=ev('econ/SEARCH.json');
  const scenariosValid=rs=>all(rs,r=>[0.5,1].includes(r.demand)&&[0.1,0.2,0.35].includes(r.botShare)&&r.seeds>=T.seeds&&r.tokenWeeks===T.tokenWeeks&&r.gearCohort&&r.quantiles?.median&&r.quantiles?.p10&&r.quantiles?.p90)&&unique(rs.map(r=>`${r.mix}:${r.demand}:${r.botShare}`))>=T.playerMixes*T.demandLevels*T.botLevels;
  record('E1.scenarios',`${T.playerMixes} mixes x ${T.demandLevels} demands x ${T.botLevels} bot shares; >= ${T.seeds} seeds each, ${T.tokenWeeks} weeks + gear cohort`,baseline?.scenarios?.length,scenariosValid(baseline?.scenarios));
  num('E1.runtime',`< ${T.economyRuntimeSeconds}s`,baseline?.elapsedSeconds,n=>n<T.economyRuntimeSeconds);
  checkTest('E1.liveConfig',baseline?.liveConfigTest);
  count('E2.sinks',`>= ${T.newSinks} new sinks in rules, server, UI, sim with tests and screenshots`,sinks?.sinks,T.newSinks,r=>all([r.rules,r.server,r.ui,r.sim,r.screenshot],signedFile)&&test(r.test)&&r.benefit&&r.costShown&&r.oddsShown);
  checkTest('E2.bellsOnly',sinks?.bellsOnlyTest);
  let rounds; try { rounds=text(B+'econ/ROUNDS.jsonl').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); } catch { rounds=undefined; }
  count('E3.rounds',`>= ${T.tuningRounds} logged rounds with scenario tables and lessons`,rounds,T.tuningRounds,r=>r.changes?.length>0&&r.scenarios?.length>0&&r.learned);
  num('E3.leverChanges',`>= ${T.leversChangedPerRound} changed levers per round on average`,rounds?.length?rounds.reduce((s,r)=>s+(r.changes?.filter(c=>c.before!==c.after).length??0),0)/rounds.length:undefined,n=>n>=T.leversChangedPerRound);
  count('E3.searchLevers',`>= ${T.searchLevers} levers per search`,search?.leverNames,T.searchLevers);
  count('E3.configs',`>= ${T.searchedConfigs} unique configs evaluated with >= ${T.fastSearchSeeds} seeds`,search?.configs,T.searchedConfigs,r=>r.seeds>=T.fastSearchSeeds&&r.configHash&&r.scenarioScores?.length>=T.playerMixes*T.demandLevels*T.botLevels);
  count('E3.confirmed',`top ${T.confirmedTopConfigs} confirmed with >= ${T.seeds} seeds`,search?.confirmed,T.confirmedTopConfigs,r=>r.seeds>=T.seeds);
  count('E3.structural',`>= ${T.structuralChanges} model/lever structural changes`,search?.structuralChanges,T.structuralChanges,r=>r.description&&all(r.sources,signedFile));
  record('E3.finalScenarios',`all ${T.playerMixes*T.demandLevels*T.botLevels} scenarios at >= ${T.seeds} seeds`,final?.scenarios?.length,scenariosValid(final?.scenarios));
  every('E3.T-a',`burn/all claims >= ${T.burnClaimsMin}; at 100% demand <= ${T.fullDemandBurnClaimsMax}`,final?.scenarios,r=>finite(r.quantiles?.median?.burnClaims)&&r.quantiles.median.burnClaims>=T.burnClaimsMin&&(r.demand!==1||r.quantiles.median.burnClaims<=T.fullDemandBurnClaimsMax));
  every('E3.T-b',`Star Thread source/sink ${T.starRatioMin}-${T.starRatioMax}`,final?.scenarios,r=>between(r.quantiles?.median?.starRatio,T.starRatioMin,T.starRatioMax));
  every('E3.T-c',`heavy/casual YARN/hour <= ${T.hourlyRatioMax}x both directions`,final?.scenarios,r=>between(r.quantiles?.median?.heavyCasualHourlyRatio,1/T.hourlyRatioMax,T.hourlyRatioMax));
  every('E3.T-d',`casual day ${T.casualLegendaryMin}-${T.casualLegendaryMax}; heavy day ${T.heavyLegendaryMin}-${T.heavyLegendaryMax}, strictly faster`,final?.scenarios,r=>between(r.quantiles?.median?.casualLegendaryDay,T.casualLegendaryMin,T.casualLegendaryMax)&&between(r.quantiles?.median?.heavyLegendaryDay,T.heavyLegendaryMin,T.heavyLegendaryMax)&&r.quantiles.median.heavyLegendaryDay<r.quantiles.median.casualLegendaryDay);
  every('E3.T-e',`at 35% bots, bot/regular YARN/hour <= ${T.botHourlyRatioMax}`,final?.scenarios?.filter(r=>r.botShare===0.35),r=>finite(r.quantiles?.median?.botRegularHourlyRatio)&&r.quantiles.median.botRegularHourlyRatio<=T.botHourlyRatioMax);
  every('E3.T-f',`top-1% share of withdrawn YARN <= ${T.topPercentWithdrawnShareMax*100}%`,final?.scenarios,r=>finite(r.quantiles?.median?.topOnePercentWithdrawnShare)&&r.quantiles.median.topOnePercentWithdrawnShare<=T.topPercentWithdrawnShareMax);
  every('E3.T-g',`p90: half-demand burn >= ${T.robustBurnMin}; Star ${T.robustStarMin}-${T.robustStarMax}`,final?.scenarios,r=>(r.demand!==0.5||(finite(r.quantiles?.p90?.burnClaims)&&r.quantiles.p90.burnClaims>=T.robustBurnMin))&&between(r.quantiles?.p90?.starRatio,T.robustStarMin,T.robustStarMax));
  every('E3.T-h',`each assumption +/- ${T.sensitivityDelta*100}%: burn >= ${T.robustBurnMin}; Star ${T.robustStarMin}-${T.robustStarMax}`,final?.sensitivity,r=>[-T.sensitivityDelta,T.sensitivityDelta].every(d=>r.cases?.some(c=>c.delta===d&&all(c.scenarios,s=>s.burnClaims>=T.robustBurnMin&&between(s.starRatio,T.robustStarMin,T.robustStarMax)))));
  checkTest('E3.configOdds',final?.oddsTest); record('E3.configSource','committed final rules config matches measured hash',final?.config?.path,signedFile(final?.config)&&committed(final.config.path));
  const proof=ev('econ/ANVIL-E2E.json'), economyUi=ev('econ/UI.json');
  count('E4.receipts',`>= ${T.baseAnvilReceipts} + new sink count confirmed receipts`,proof?.receipts,T.baseAnvilReceipts+(sinks?.sinks?.length??T.newSinks),r=>r.status==='success'&&/^0x[0-9a-f]{64}$/i.test(r.transactionHash??'')&&finite(r.blockNumber));
  every('E4.sinks','one confirmed use of every new sink',sinks?.sinks,r=>proof?.receipts?.some(p=>p.sinkId===r.id&&p.status==='success'));
  record('E4.screenshots','1280x720 and 1440x900 economy screenshots',economyUi?.shots?.length,[[1280,720],[1440,900]].every(([w,h])=>economyUi?.shots?.some(r=>r.width===w&&r.height===h&&signedFile(r))));
  checkTest('E4.odds',economyUi?.oddsTest);
  artifact('E5.report',B+'econ/ECONOMY-FINAL.md');
  const citations=ev('econ/REPORT-NUMBERS.json')?.citations;
  const citationValid=r=>{const source=json(r.source);const v=r.pointer?.split('/').filter(Boolean).reduce((o,k)=>o?.[k],source);return finite(v)&&v===r.value&&committed(r.source)&&text(B+'econ/ECONOMY-FINAL.md').includes(r.rendered)&&r.rendered===new Intl.NumberFormat('en-US',{useGrouping:false,maximumFractionDigits:r.decimals??3}).format(v);};
  count('E5.numbers',`>= ${T.reportSampledNumbers} report numbers checked against committed JSON`,citations,T.reportSampledNumbers,citationValid);
  every('E5.allCitations','all report-number citations valid',citations,citationValid);
  const soft=ev('econ/SOFT-CURRENCIES.json');
  checkTest('E6.migration',soft?.migrationTest);checkTest('E6.dynamicFee',soft?.feeTest);
  num('E6.median',`${T.priceMedianDays}-day median seal price`,soft?.medianDays,n=>n===T.priceMedianDays);

  const tutorial=ev('TUTORIAL.json');
  checkTest('T1.walkthrough',tutorial?.e2e);
  every('T1.geometry',`target inside spotlight with >= ${T.tutorialPaddingPx}px padding; bubble not overlapping`,tutorial?.steps,r=>signedFile(r.screenshot)&&r.target&&r.spotlight&&r.bubble&&r.target.x-r.spotlight.x>=T.tutorialPaddingPx&&r.target.y-r.spotlight.y>=T.tutorialPaddingPx&&r.spotlight.x+r.spotlight.width-r.target.x-r.target.width>=T.tutorialPaddingPx&&r.spotlight.y+r.spotlight.height-r.target.y-r.target.height>=T.tutorialPaddingPx&&(r.bubble.x+r.bubble.width<=r.target.x||r.bubble.x>=r.target.x+r.target.width||r.bubble.y+r.bubble.height<=r.target.y||r.bubble.y>=r.target.y+r.target.height));
  num('T1.fallbacks','0 fallback steps on owned screens',tutorial?.steps?.filter(r=>r.owned&&r.fallback).length,n=>n===T.tutorialOwnedFallbacks&&tutorial.steps.some(r=>r.owned));
  every('T1.words',`<= ${T.tutorialWords} words per step`,tutorial?.steps,r=>typeof r.text==='string'&&r.text.trim().split(/\s+/).length<=T.tutorialWords);
  const live=ev('LIVE-FUJI.json');
  count('C1.counters',`>= ${T.liveCounterMinimum}/${T.liveCounterTotal} real Fuji counters numeric, raw RPC + screenshot`,live?.counters,T.liveCounterMinimum,r=>finite(r.value)&&r.source==='fuji-rpc'&&r.chainId===43113&&signedFile(r.rawRpc)&&signedFile(live.screenshot));
  record('C1.policy',`${T.rpcTimeoutMs}ms timeout, ${T.rpcCacheMs}ms cache, ${T.rpcRetries} retries`,live?.policy,live?.policy?.timeoutMs===T.rpcTimeoutMs&&live.policy.cacheMs===T.rpcCacheMs&&live.policy.retries===T.rpcRetries);
  checkTest('C1.offline',live?.offlineTest);
  for (const [card,date,md] of [['SY1',T.sync16,'SYNC-16'],['SY2',T.sync18,'SYNC-18']]) {
    const sync=ev(md+'.json');
    record(`${card}.time`,`at or after ${date}`,sync?.at,new Date(now)>=new Date(date)&&new Date(sync?.at)>=new Date(date)&&new Date(sync?.at)<=new Date(now));
    record(`${card}.commits`,'both branch commit IDs, suite, coverage numbers',sync?`${sync.shellCommit} / ${sync.battleCommit}`:undefined,/^[0-9a-f]{40}$/.test(sync?.shellCommit??'')&&/^[0-9a-f]{40}$/.test(sync?.battleCommit??'')&&test(sync.suite)&&finite(sync.cueCoverage)&&sync.checkedEvents>0);
    artifact(`${card}.report`,B+md+'.md');
  }
  const freeze=ev('FREEZE.json');
  record('SY3.time',`at or after ${T.freeze}`,freeze?.at,new Date(now)>=new Date(T.freeze)&&new Date(freeze?.at)>=new Date(T.freeze)&&new Date(freeze?.at)<=new Date(now));
  artifact('SY3.report',B+'REPORT-B2.md');artifact('SY3.status',B+'STATUS-VI.md');artifact('SY3.user',B+'NEEDS-USER.md');
  const partialEvidence={voice:callout,rebuilt,s5:ours,search,rounds,final,voiceIterations:file(B+'VOICE-ITERATIONS.md'),mixIterations:file(B+'MIX-ITERATIONS.md'),requestsToA:text('reports/v3-shell/REQUESTS-TO-A.md')};
  record('SY3.final','all other gates PASS or explicitly qualified PARTIAL',freeze?.gateStates?.length,all(freeze?.gateStates,r=>r.status==='PASS'||(r.status==='PARTIAL'&&qualifiesPartial(r.card,partialEvidence,rows)))&&rows.filter(r=>!['G0','SY3'].includes(r.card)).every(r=>freeze?.gateStates?.some(s=>s.id===r.id&&(r.status==='PASS'?s.status==='PASS':s.status==='PARTIAL'&&qualifiesPartial(s.card,partialEvidence,rows)))));
  record('G0.inventory','every required card has gates and thresholds',CARDS.filter(c=>c!=='G0'&&rows.some(r=>r.card===c)).length,CARDS.filter(c=>c!=='G0').every(c=>rows.some(r=>r.card===c&&r.threshold)));
  checkTest('G0.tests',ev('GATE-TESTS.json'));
  return rows.sort((a,b)=>CARDS.indexOf(a.card)-CARDS.indexOf(b.card));
}

export function qualifiesPartial(card, evidence, gates=[]) {
  const passed=id=>gates.some(r=>r.id===id&&r.status==='PASS');
  if(card==='V') return evidence.voiceIterations&&evidence.voice?.processingIterations>=T.calloutPartialIterations&&['coverage','variants','distinct','battle','levels','lines'].every(k=>passed('V.'+k));
  if(card==='U3') {
    const criterion=['artRichness','hierarchy','textDiet','gameFeel','consistency'];
    const good=r=>finite(r.visibleWords)&&r.visibleWords<=T.visibleWords&&finite(r.plainTextButtons)&&r.plainTextButtons<=T.plainTextButtons&&criterion.every(k=>between(r.scores?.[k],T.criterionScore,10))&&criterion.reduce((s,k)=>s+r.scores[k],0)/criterion.length>=T.screenAverageScore;
    return passed('U3.flows')&&passed('U3.fonts')&&passed('U3.glyphs')&&passed('U3.images')&&evidence.rebuilt?.screens?.filter(good).length>=T.partialRebuiltScreens&&all(evidence.rebuilt.screens.filter(r=>!good(r)),r=>r.redesignIterations>=T.partialRedesignIterations);
  }
  if(card==='S5') return evidence.mixIterations&&evidence.s5?.mixIterations>=T.mixPartialIterations&&!!evidence.s5?.sessionABlocker&&evidence.requestsToA?.includes(evidence.s5.sessionABlocker);
  if(card==='E3') return ['rounds','leverChanges','searchLevers','configs','confirmed','structural','finalScenarios','T-a','T-b','T-d','configSource','configOdds'].every(k=>passed('E3.'+k))&&evidence.search?.pareto?.length>=T.paretoConfigs&&all(evidence.search.pareto,r=>r.conflicts&&r.reason);
  return false;
}

export const formatGate = r => `${r.status} ${r.id}: measured ${typeof r.measured==='object'?JSON.stringify(r.measured):r.measured}; required ${r.threshold}${r.detail?`; ${r.detail}`:''}`;
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const rows=checkGates(), selected=process.argv.includes('--card')?rows.filter(r=>r.card===process.argv[process.argv.indexOf('--card')+1]):rows;
  if(process.argv.includes('--write')) writeFileSync(resolve(DEFAULT_ROOT,B+'GATES.md'),'# B2 gate results\n\nGenerated from current files. Missing evidence is FAIL; no production completion is inferred.\n\n```text\n'+rows.map(formatGate).join('\n')+'\n```\n');
  console.log(process.argv.includes('--json')?JSON.stringify(selected,null,2):selected.map(formatGate).join('\n'));
  process.exitCode=selected.length>0&&selected.every(r=>r.status==='PASS')?0:1;
}
