import type {SceneView} from '../../squad/turn3d/scene';
import type {EffectPlan} from '../../squad/turn3d/effects';
import type {ResolveSocket} from '../spine/vfx';
import type {PaintedStamps} from '../spine/vfx-stamps';
import {PAINT} from '../spine/style';
import {getV5Timeline, getV5Texture, paintedTargets} from '../spine/vfx-registry';
import {sampleSkillLayer, type SkillLayerSample} from './skill-timeline';
import {v5TextureRect, type V5TextureRect} from './skill-textures';
import {SKILL_BUDGETS, SKILL_MAX_COUNT, SKILL_MAX_LAYERS} from './skill-budget';
import type {SkillBlendLayers} from './skill-blend-layers';

/** Shares the existing effect canvas, socket resolver, stamps and final face masks. */
export class V5SkillPlayer {
  readonly audit = {id: '', phase: '', draws: 0, particles: 0, textured: 0, dropped: 0, impactMs: 0, layers: [] as string[]};
  private sample: SkillLayerSample = {progress: 0, eased: 0, alpha: 0, scale: 1, rotation: 0};
  private rect: V5TextureRect = {x: 0, y: 0, width: 0, height: 0};
  private targets: string[] = [];
  private plan: EffectPlan | undefined;
  private checkedPlan: EffectPlan | undefined;
  private handled = false;
  constructor(private socket: ResolveSocket, private stamps: PaintedStamps) {}

  handles(plan: EffectPlan): boolean {
    if (this.checkedPlan !== plan) {
      this.checkedPlan = plan; this.handled = false;
      for (const event of plan.events) if (event.type === 'action_start') { this.handled = true; break; }
    }
    return this.handled && !!getV5Timeline(plan.presentationId ?? plan.skillId);
  }

  clear(): void { this.plan = this.checkedPlan = undefined; this.targets.length = 0; }

  render(base: CanvasRenderingContext2D, view: SceneView, enabled = true, blends?: SkillBlendLayers): void {
    const a = this.audit;
    a.id = ''; a.phase = ''; a.draws = 0; a.particles = 0; a.textured = 0; a.dropped = 0; a.layers.length = 0;
    const frame = view.frame;
    if (!enabled || !frame || !this.handles(frame.plan)) { this.clear(); return; }
    const plan = frame.plan, timeline = getV5Timeline(plan.presentationId ?? plan.skillId)!;
    const impact = plan.beats[2]!.start, at = frame.elapsed - impact + timeline.impactMs;
    a.id = timeline.id; a.impactMs = impact;
    a.phase = at < timeline.layers[0]!.startMs || at >= timeline.durationMs ? 'rest' :
      at < timeline.impactMs ? 'anticipation' : at < timeline.impactMs + 60 ? 'impact' : 'dissipation';
    if (this.plan !== plan) {
      this.plan = plan;
      const damage = plan.events.some(e => e.actorId === plan.actorId && e.type === 'damage');
      const support = plan.events.some(e => e.actorId === plan.actorId && (e.type === 'heal' || e.type === 'shield'));
      paintedTargets(plan, damage ? 'damage' : support || timeline.owner === 'clover' ? 'friendly' : 'hostile', view.actors, this.targets);
    }
    const source = this.socket(plan.actorId, 'mainHand');
    if (!source) return;
    const sample = this.sample, rect = this.rect;
    const budget = view.reducedMotion ? SKILL_BUDGETS.reduced : view.quality === 'low' ? SKILL_BUDGETS.low : SKILL_BUDGETS.high;
    for (let l = 0; l < Math.min(timeline.layers.length, SKILL_MAX_LAYERS); l++) {
      const layer = timeline.layers[l]!;
      if (!sampleSkillLayer(layer, at, view.reducedMotion, sample) || sample.alpha <= 0) continue;
      const texture = layer.shape === 'flash' ? undefined : getV5Texture(layer.texture);
      const blend = texture?.blend ?? layer.blend;
      const c = texture && blends && blend !== 'normal' ? blends.context(blend) : base;
      const glyph = layer.shape === 'charge' || layer.shape === 'decal' ? 'ring' :
        layer.shape === 'flash' ? 'spark' : layer.shape === 'slash' ? 'arc' : timeline.motif;
      const stamp = texture ? undefined : this.stamps.get(glyph, layer.shape === 'flash' ? PAINT.cream : timeline.color);
      if (!texture && !stamp) continue;
      if (texture) v5TextureRect(texture, sample.progress, rect);
      let drew = false;
      const recipients = layer.anchor === 'caster' ? 1 : this.targets.length;
      for (let r = 0; r < recipients; r++) {
        const id = layer.anchor === 'caster' ? plan.actorId : this.targets[r]!;
        const point = this.socket(id, layer.anchor === 'ground' ? 'feet' : layer.anchor === 'caster' ? 'mainHand' : 'vfxOrigin');
        const feet = this.socket(id, 'feet'), head = this.socket(id, 'head');
        if (!point || !feet || !head) continue;
        const unit = Math.max(1, Math.abs(feet.y - head.y) / .77);
        const count = Number.isFinite(layer.count) ? Math.max(0, Math.min(SKILL_MAX_COUNT, Math.floor(layer.count))) : 0;
        const requested = view.reducedMotion ? Math.min(count, 3) : count;
        const allowed = Math.max(0, Math.min(requested, budget.draws - a.draws,
          layer.shape === 'mote' ? budget.motes - a.particles : budget.draws));
        a.dropped += requested - allowed + (count !== layer.count ? 1 : 0);
        for (let i = 0; i < allowed; i++) {
          let x = point.x, y = point.y;
          const angle = i * 2.399963 + (timeline.owner === 'soot' ? .4 : 0);
          if (layer.shape === 'projectile' || layer.shape === 'slash') {
            const flight = Math.max(0, Math.min(1, (at - layer.startMs) / (timeline.impactMs - layer.startMs)));
            if (!view.reducedMotion) {
              x = source.x + (point.x - source.x) * flight;
              y = source.y + (point.y - source.y) * flight - Math.sin(flight * Math.PI) * unit * .12;
            }
          } else if (layer.shape === 'mote') {
            const distance = view.reducedMotion ? .10 : .05 + sample.eased * .29;
            x += Math.cos(angle) * unit * distance;
            y += Math.sin(angle) * unit * distance * .5 - (view.reducedMotion ? 0 : sample.progress * unit * .12);
          }
          const extent = unit * layer.size * sample.scale;
          c.save(); c.globalAlpha = sample.alpha;
          c.globalCompositeOperation = blend === 'add' ? 'lighter' : blend === 'screen' ? 'screen' : 'source-over';
          c.translate(x, y); c.rotate(sample.rotation + (layer.shape === 'mote' ? angle : 0));
          if (layer.anchor === 'ground') c.scale(1, .28);
          if (texture) {
            const h = extent * rect.height / rect.width;
            c.drawImage(texture.image, rect.x, rect.y, rect.width, rect.height, -extent / 2, -h / 2, extent, h);
            a.textured++;
          } else c.drawImage(stamp!, -extent / 2, -extent / 2, extent, extent);
          c.restore(); a.draws++; if (layer.shape === 'mote') a.particles++; drew = true;
        }
      }
      if (drew) a.layers.push(layer.id);
    }
  }
}
