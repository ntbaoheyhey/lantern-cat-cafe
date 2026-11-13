import {TutorialSettings} from '../shell/Coach';
import {reopenLanding} from '../shell/Entrance';
import {HelpC2} from './TextDietC2';
import {useEffect,useRef,useState} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {showReviewTools} from '../depth/player-mode';
import {artPropsA6} from './art-a6';
import {SoundControlA6} from './SoundControlA6';

function DeskLamp({lit}:{lit:boolean}) {
 return <svg className="a6-desk-lamp" viewBox="0 0 150 160" fill="none" aria-hidden="true" data-lit={lit}>
  <ellipse cx="77" cy="143" rx="55" ry="10" fill="#6b4e3020"/>
  <path d="M48 141h56l-9-10H58Z" fill="#9b7748" stroke="#745535" strokeWidth="3"/>
  <path d="M77 130V93" stroke="#8f6b3f" strokeWidth="7"/>
  <path d="m41 91 8-61 28-10 28 10 8 61-36 13Z" fill={lit?'#f1cb77':'#e7d3a7'} stroke="#8c693e" strokeWidth="3"/>
  <path d="M49 32h56M43 84h68M77 23v73" stroke="#b38e53" strokeWidth="3"/>
  <path d="M68 20v-8a9 9 0 0 1 18 0v8" stroke="#8c693e" strokeWidth="3"/>
  <path d="m61 60 7 8 9-18 9 18 7-8" stroke={lit?'#fff7d5':'#a98c5d'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>;
}
export function SettingsA6({m}:{m:DepthModel}) {
 const [code,setCode]=useState(''),[feedback,setFeedback]=useState(''),[failed,setFailed]=useState(false);
 const [resetPage,setResetPage]=useState(false),[confirmReset,setConfirmReset]=useState(false);
 const [restore,setRestore]=useState<{code:string;state:R.DepthAccount}|null>(null);
 const codeBox=useRef<HTMLTextAreaElement>(null),restart=useRef<HTMLButtonElement>(null),resetTitle=useRef<HTMLHeadingElement>(null);
 const importButton=useRef<HTMLButtonElement>(null),restoreTitle=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(resetPage)resetTitle.current?.focus();},[resetPage]);
 useEffect(()=>{if(restore)restoreTitle.current?.focus();},[restore]);
 const cancelReset=()=>{setConfirmReset(false);setResetPage(false);requestAnimationFrame(()=>restart.current?.focus());};
 const closeRestore=()=>{setRestore(null);requestAnimationFrame(()=>importButton.current?.focus());};
 const exportCode=()=>{setCode(R.exportSave(m.state));setFailed(false);setFeedback('Code ready. Select it, then copy it somewhere safe.');};
 const previewCode=()=>{
  try {setRestore({code,state:R.importSave(code,m.offline?0:Date.now())});setFailed(false);setFeedback('');}
  catch {setFailed(true);setFeedback('This save could not be read. Paste the complete code and try again.');}
 };
 const importCode=()=>{if(!restore)return;m.import(restore.code);setFailed(m.error);setFeedback(m.error?'This save could not be restored. Your code is still here.':'Your saved evening is restored.');closeRestore();};
 const routeNote=(state:R.DepthAccount)=>state.run&&!state.run.complete?(state.run.mode==='tower'?`Tower floor ${state.run.floor}`:`Chapter ${state.run.chapter} route`):'At the cafe';
 if(m.state.formationC2)return <div className="a6-settings-desk c2-settings"><button onClick={reopenLanding}>Landing</button><TutorialSettings/><section className="a6-save-letter" aria-label="Save and restore progress"><header className="a6-save-heading"><img {...artPropsA6(m.state.team[0]??'mochi')} alt=""/><b>↑ {m.state.account.accountLevel} · ♟ {m.state.account.cards.length}/{R.CATS.length}</b><HelpC2 label="Save progress"><p>{m.offline?'Export a code to keep this cafe after closing the demo.':'Keep a copy of your cafe, or restore a saved evening.'}</p><p>{m.saveStatus}</p><p>{feedback}</p></HelpC2></header>
  {resetPage?<section className="a6-reset-page" aria-label="Start again"><h3 ref={resetTitle} tabIndex={-1}>Reset account?</h3><p>Replaces this {m.offline?'demo':'browser'}’s progress. Export first to keep it.</p><button className="a6-reset-confirm" aria-label={confirmReset?'Confirm reset account':'Reset account'} onClick={()=>{if(confirmReset)m.reset();else setConfirmReset(true);}}>{confirmReset?'Confirm reset':'Reset'}</button><button onClick={cancelReset}>Cancel</button></section>:restore?<section className="a6-import-page" aria-label="Review saved progress"><h3 ref={restoreTitle} tabIndex={-1}>Restore save?</h3><table><thead><tr><th></th><th>Current</th><th>Saved</th></tr></thead><tbody><tr><th>↑</th><td>{m.state.account.accountLevel}</td><td>{restore.state.account.accountLevel}</td></tr><tr><th>♟</th><td>{m.state.account.cards.length}</td><td>{restore.state.account.cards.length}</td></tr>{(['fish','stamps','threads','essence'] as const).map((id,i)=><tr key={id}><th aria-label={id}>{['◈','✉','⌁','✦'][i]}</th><td>{m.state.account.currencies[id]}</td><td>{restore.state.account.currencies[id]}</td></tr>)}</tbody></table><p id="c2-restore-consequence">Replaces current progress and settings.</p><button aria-label="Restore saved evening" aria-describedby="c2-restore-consequence" onClick={importCode}>Restore</button><button onClick={closeRestore}>Cancel</button></section>:<><label htmlFor="a6-save-code">Save code</label><textarea id="a6-save-code" ref={codeBox} aria-label="Save code" value={code} spellCheck={false} onChange={e=>{setCode(e.target.value);setFeedback('');setFailed(false);}}/><div className="a6-save-actions"><button className="cr-primary" aria-label="Export save code" onClick={exportCode}>↓ Export</button><button aria-label="Select save code" disabled={!code.trim()} onClick={()=>{codeBox.current?.focus();codeBox.current?.select();setFailed(false);setFeedback('Whole code selected. Use Copy to keep it.');}}>▣ Select</button><button ref={importButton} aria-label="Import save code" disabled={!code.trim()} onClick={previewCode}>↑ Import</button></div><p role="status" aria-label={feedback}>{feedback?(failed?'Invalid code':'✓'):''}</p><button ref={restart} onClick={()=>{setConfirmReset(false);setResetPage(true);}}>↺ Reset</button></>}
 </section>{!resetPage&&!restore&&<section className="a6-comfort-desk" aria-label="Comfort and playback"><header><DeskLamp lit={m.audio.enabled}/></header><div className="a6-sound-row"><SoundControlA6 m={m}/></div><div className="a6-comfort-options"><label>Quality<select value={m.state.settings.quality} onChange={e=>{m.state.settings.quality=e.target.value as R.DepthAccount['settings']['quality'];m.notify();}}>{['low','medium','high'].map(q=><option key={q}>{q}</option>)}</select></label><label>Speed<select value={m.state.settings.speed} onChange={e=>{m.state.settings.speed=Number(e.target.value);m.notify();}}>{[1,2,3].map(n=><option key={n} value={n}>{n}×</option>)}</select></label></div><label className="a6-comfort-motion"><input type="checkbox" checked={m.state.settings.reducedMotion} onChange={e=>{m.state.settings.reducedMotion=e.target.checked;m.notify();}}/>Reduced motion</label><button aria-label="Replay last battle" disabled={!m.canReplay} onClick={()=>m.replayLast()}>▶ Replay</button><HelpC2 label="Playback"><p>Your crew fights automatically. Space pauses the battle. Reduced motion removes camera shake and flashes.</p><p>{m.canReplay?'Replay shows the last recorded battle without spending or granting rewards.':'Play a battle to enable replay.'}</p></HelpC2></section>}</div>;
 return <div className="a6-settings-desk">
  <section className="a6-save-letter" aria-label="Save and restore progress">
   <header className="a6-save-heading"><img {...artPropsA6(m.state.team[0]??'mochi')} alt=""/><div><small>A PLACE KEPT FOR YOU</small><h2>Keep this evening.</h2><p>{m.offline?'Export a code to keep this cafe after closing the demo.':'Keep a copy of your cafe, or bring a saved evening here.'}</p><span className="a6-save-state">{m.saveStatus}</span></div></header>
   {resetPage?<section className="a6-reset-page" aria-label="Start again">
    <small>A FRESH BEGINNING</small><h3 ref={resetTitle} tabIndex={-1}>{confirmReset?'Ready to start over?':'Open a new cafe?'}</h3>
    <p>{m.offline?'This replaces the progress in this open demo.':'This replaces the progress saved in this browser.'} Keep an exported code if you want to return to this evening.</p>
    <p className="a6-reset-account">Account level {m.state.account.accountLevel} · {m.state.account.cards.length} companions</p>
    <div className="cr-actions"><button className="a6-reset-confirm" onClick={()=>{if(confirmReset)m.reset();else setConfirmReset(true);}}>{confirmReset?'Confirm reset account':'Reset account'}</button><button className="cr-primary" onClick={cancelReset}>Keep this account</button></div>
   </section>:restore?<section className="a6-import-page" aria-label="Review saved progress">
    <h3 ref={restoreTitle} tabIndex={-1}>Restore this evening?</h3>
    <table><caption>Your current cafe and this save code</caption><thead><tr><th scope="col">Progress</th><th scope="col">Current</th><th scope="col">Saved</th></tr></thead><tbody>
     <tr><th scope="row">Account level</th><td>{m.state.account.accountLevel}</td><td>{restore.state.account.accountLevel}</td></tr>
     <tr><th scope="row">Cats</th><td>{m.state.account.cards.length} / {R.CATS.length}</td><td>{restore.state.account.cards.length} / {R.CATS.length}</td></tr>
     {(['fish','stamps','threads','essence'] as const).map(currency=><tr key={currency}><th scope="row">{currency[0]!.toUpperCase()+currency.slice(1)}</th><td>{m.state.account.currencies[currency].toLocaleString()}</td><td>{restore.state.account.currencies[currency].toLocaleString()}</td></tr>)}
    </tbody></table>
    <p className="a6-import-crew"><b>Saved crew:</b> {restore.state.team.map(id=>R.CAT_BY_ID[id]!.name).join(' · ')}<small>{routeNote(restore.state)}</small></p>
    <p id="a6-restore-consequence">Restoring replaces this {m.offline?'open demo’s':'browser’s'} progress and settings with the saved evening.</p>
    <div className="cr-actions"><button className="cr-primary" aria-describedby="a6-restore-consequence" onClick={importCode}>Restore saved evening</button><button onClick={closeRestore}>Keep this account</button></div>
   </section>:<>
    <div className="a6-code-caption"><label htmlFor="a6-save-code">Save code</label><small>Lv. {m.state.account.accountLevel} · {m.state.account.cards.length}/{R.CATS.length} cats</small></div>
    <textarea id="a6-save-code" ref={codeBox} aria-label="Save code" value={code} placeholder="Export your evening here, or paste a saved code." spellCheck={false} onChange={e=>{setCode(e.target.value);setFeedback('');setFailed(false);}}/>
    <div className="a6-save-actions"><button className="cr-primary" onClick={exportCode}>Export save code</button><button disabled={!code.trim()} onClick={()=>{codeBox.current?.focus();codeBox.current?.select();setFailed(false);setFeedback('Whole code selected. Use Copy to keep it.');}}>Select save code</button><button ref={importButton} disabled={!code.trim()} onClick={previewCode}>Import save code</button></div>
    <p className="a6-save-feedback" role="status" data-error={failed}>{feedback||'To continue later, paste your whole code and choose Import.'}</p>
    <footer className="a6-save-footer"><span>Your progress travels with the code.</span><button ref={restart} onClick={()=>{setConfirmReset(false);setResetPage(true);}}>Start again</button></footer>
   </>}
  </section>
  <button onClick={reopenLanding}>Landing</button><TutorialSettings/><section className="a6-comfort-desk" aria-label="Comfort and playback">
   <header><div><small>MAKE YOURSELF AT HOME</small><h2>Settle in.</h2><p>A softer evening, at your pace.</p></div><DeskLamp lit={m.audio.enabled}/></header>
   <div className="a6-sound-row"><span>Battle sounds</span><SoundControlA6 m={m}/></div>
   <div className="a6-comfort-options"><label>Quality<select value={m.state.settings.quality} onChange={e=>{m.state.settings.quality=e.target.value as R.DepthAccount['settings']['quality'];m.notify();}}>{['low','medium','high'].map(q=><option key={q}>{q}</option>)}</select></label><label>Playback speed<select value={m.state.settings.speed} onChange={e=>{m.state.settings.speed=Number(e.target.value);m.notify();}}>{[1,2,3].map(n=><option key={n} value={n}>{n}×</option>)}</select></label></div>
   <label className="a6-comfort-motion"><input type="checkbox" checked={m.state.settings.reducedMotion} onChange={e=>{m.state.settings.reducedMotion=e.target.checked;m.notify();}}/><span>Reduced motion<small>Keep the action with gentler movement.</small></span></label>
   <p className="a6-playback-note">Your crew fights automatically. Space pauses the battle.</p>
   <div className="a6-settings-replay"><button disabled={!m.canReplay} aria-describedby="a6-replay-note" onClick={()=>m.replayLast()}>Replay last battle</button><small id="a6-replay-note">{m.canReplay?'Watch recorded actions. Rewards and route progress stay unchanged.':'Play a battle to leave recorded actions here.'}</small></div>
  </section>
  {m.offline&&showReviewTools(R.gameplayV4(m.state))&&<section className="cr-panel dp-shortcuts"><h2>Demo shortcuts</h2><p>Reviewer-granted progress lets you inspect the later systems.</p><div className="cr-actions"><button onClick={()=>m.shortcut('unlock')}>Unlock all cats and build materials</button><button onClick={()=>m.shortcut('stamps')}>Add 1500 demo stamps</button><button onClick={()=>m.shortcut('chapter')}>Unlock chapters and Tower</button><button onClick={()=>m.command({type:'advanceLocalDay'})}>Advance fixture day</button></div></section>}
 </div>;
}
