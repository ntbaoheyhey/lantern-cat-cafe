import type { TurnScene, SceneView } from '../../squad/turn3d/scene';
import { sampleActionPlan } from '../../squad/turn3d/effects';
import { loadPreviewModel, loadPreviewScene } from './preview-loader';
import { isLookV2 } from '../../squad/turn3d/look-v2';
import type { galleryFixture } from './feel-lab';
import type { DepthModel } from './model';

type Options = {
  view: SceneView; fixture: { battle: ReturnType<typeof galleryFixture>['battle']; plan: ReturnType<typeof galleryFixture>['plan'] | null }; rotating: boolean; angle: number;
  skillId?: string; visible: boolean; id?: string; entranceKey?: string;
};

/** Two paint opportunities, then idle work. Cancellation also works before idle. */
function afterPaintIdle(work: () => void) {
  let frame = 0, idle = 0, timer = 0;
  frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(() => {
      if (window.requestIdleCallback) idle = window.requestIdleCallback(work, { timeout: 1000 });
      else timer = window.setTimeout(work, 32);
    });
  });
  return () => { cancelAnimationFrame(frame); window.cancelIdleCallback?.(idle); clearTimeout(timer); };
}

let preloadQueue = Promise.resolve();
const pending = new Set<string>();
/** Hover/focus schedules one decoded model per idle boundary, using the engine cache. */
export function preloadPreviewModels(ids: string[]) {
  for (const id of new Set(ids)) {
    const key = `${isLookV2()}:${id}`;
    if (pending.has(key)) continue;
    pending.add(key);
    preloadQueue = preloadQueue.then(() => new Promise<void>(done => {
      afterPaintIdle(() => { void loadPreviewModel(id).catch(() => undefined).finally(() => { pending.delete(key); done(); }); });
    }));
  }
}

/** The canvas is an imperative child. React only owns the lightweight docking slots. */
export class PreviewRuntime {
  private host = document.createElement('div');
  private scene: TurnScene | null = null;
  private options?: () => Options;
  private lastOptions?: Options;
  private notify?: (status: string) => void;
  private slot?: HTMLElement;
  private cancelStart?: () => void;
  private generation = 0;
  private loadingGeneration?: number;
  private disposed = false;
  private frame = 0;
  private elapsed = 0;
  private last = 0;
  private fixture?: Options['fixture'];
  private playedEntrance?: string;
  private entrancePending = false;
  private nextEntranceAttempt = 0;
  private look = isLookV2();
  private message = 'Preparing miniatures…';
  constructor(private m: DepthModel) { this.host.className = 'dp-preview-surface'; }

  attach(slot: HTMLElement, options: () => Options, notify: (status: string) => void) {
    if (this.disposed) return () => {};
    this.slot = slot; this.options = options; this.notify = notify;
    slot.appendChild(this.host);
    notify(this.scene?.ready ? '' : this.message);
    this.schedule(); this.invalidate();
    return () => {
      if (this.slot !== slot) return;
      this.generation++;
      this.lastOptions = options(); this.slot = undefined; this.options = undefined; this.notify = undefined;
      this.host.remove(); this.cancelStart?.(); this.cancelStart = undefined;
      cancelAnimationFrame(this.frame); this.frame = 0; this.last = 0;
      // Keep scene/GPU resources until the app or Look mode is torn down.
    };
  }
  setLook(look: boolean) {
    if (look === this.look) return;
    this.look = look; this.releaseScene(); this.schedule();
  }
  invalidate() { this.scene?.invalidate(); }
  private status = (value: string) => { this.message = value; this.notify?.(value); };
  private view = () => {
    const current = this.options?.() ?? this.lastOptions!;
    if (this.fixture !== current.fixture) { this.fixture = current.fixture; this.elapsed = 0; }
    const plan = current.skillId ? current.fixture.plan : null;
    const at = plan ? this.elapsed % (plan.duration + 900) : 0;
    current.view.frame = plan && at < plan.duration ? sampleActionPlan(plan, at, current.view.reducedMotion) : null;
    current.view.suspended = !this.slot || this.m.showBattle || !current.visible;
    if (current.view.model) current.view.model.angle = current.angle
      + (current.rotating && !current.entranceKey && !current.view.reducedMotion ? this.elapsed * .00016 : 0);
    return current.view;
  };
  private schedule() {
    if (!this.slot || this.cancelStart || this.disposed || this.loadingGeneration === this.generation) return;
    this.cancelStart = afterPaintIdle(() => {
      this.cancelStart = undefined;
      if (!this.slot) return;
      const generation = this.generation;
      this.loadingGeneration = generation;
      void this.prepareScene(generation);
    });
  }
  private async prepareScene(generation: number) {
    const current = () => !this.disposed && !!this.slot && generation === this.generation;
    try {
      if (!this.scene) {
        const Renderer = await loadPreviewScene();
        if (!current()) return;
        performance.mark('preview-create:start');
        this.scene = new Renderer(this.host, this.view, () => {}, () => {}, this.status);
        performance.mark('preview-create:end');
        if (this.m.offline || import.meta.env.DEV) window.__depthPreviewScene = this.scene;
      }
      if (!current()) return;
      cancelAnimationFrame(this.frame); this.frame = requestAnimationFrame(this.tick);
    } catch (error) {
      if (current()) this.status(`Preview unavailable. ${String(error).slice(0, 100)}`);
    } finally {
      if (this.loadingGeneration === generation) this.loadingGeneration = undefined;
    }
  }
  private tick = (now: number) => {
    const current = this.options?.();
    if (!current) return;
    if (this.scene?.ready && !this.m.showBattle && current.visible) {
      this.elapsed += this.last ? Math.min(100, now - this.last) : 0;
      if (this.message) this.status('');
      if (current.entranceKey && current.id && current.entranceKey !== this.playedEntrance
        && !this.entrancePending && now >= this.nextEntranceAttempt) {
        const key = current.entranceKey, scene = this.scene;
        this.entrancePending = true; this.nextEntranceAttempt = now + 100;
        void scene.playEntrance(current.id).then(played => {
          if (this.scene === scene && played && this.options?.().entranceKey === key) this.playedEntrance = key;
        }).catch(() => {
          if (this.scene === scene) this.status('The companion portrait is ready. The miniature is unavailable.');
          this.playedEntrance = key;
        }).finally(() => { this.entrancePending = false; });
      }
    }
    this.last = now; this.frame = requestAnimationFrame(this.tick);
  };
  private releaseScene() {
    this.generation++;
    this.cancelStart?.(); this.cancelStart = undefined;
    cancelAnimationFrame(this.frame); this.frame = 0;
    if (window.__depthPreviewScene === this.scene) delete window.__depthPreviewScene;
    this.scene?.dispose(); this.scene = null;
    this.host.replaceChildren(); delete this.host.dataset.ready;
    this.last = 0; this.playedEntrance = undefined; this.status('Preparing miniatures…');
  }
  dispose() { this.disposed = true; this.releaseScene(); this.host.remove(); }
}
