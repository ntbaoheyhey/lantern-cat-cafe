import { CONFIG } from '@taskbar-hero/game-rules';
import { Art2Frame, Art2Image, ART2_QUALITIES, ART2_SKILLS, ART2_STATES } from './Art2';
import { OriginalArt } from '../original-preview/OriginalArt';

export default function Art2Preview() {
  if (!CONFIG.features.originalEconomy) return null;
  return <section className="art2-preview" aria-label="Original art samples">
    <h2>Original art samples</h2><p>Sample artwork for future features. Frames do not represent owned runes, companions or skill ranks.</p>
    <div className="art2-preview-grid">
      {(['rune', 'pet'] as const).flatMap(kind => ART2_QUALITIES.map(quality => <figure key={`${kind}-${quality}`}>
        <Art2Image id={`${kind}-slot-${quality}`} scale={2} />
        <figcaption>{kind === 'rune' ? 'Rune socket' : 'Companion portrait'} · {quality}<small>Sample</small></figcaption>
      </figure>))}
      {ART2_SKILLS.map(skill => <figure key={skill}><Art2Frame id={`skill-frame-${skill}`}><OriginalArt kind="skill" id={skill} scale={2} /></Art2Frame>
        <figcaption>{CONFIG.originalEconomy.skills.entries[skill].name}<small>Sample frame · existing icon</small></figcaption></figure>)}
      {ART2_STATES.map(id => <figure key={id}><Art2Image id={id} /><figcaption>{id.replaceAll('-', ' ')}<small>Sample illustration</small></figcaption></figure>)}
    </div>
  </section>;
}
