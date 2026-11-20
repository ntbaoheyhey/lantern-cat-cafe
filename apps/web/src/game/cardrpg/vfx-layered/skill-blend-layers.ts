type Blend = 'add' | 'screen';
interface Pass {canvas: HTMLCanvasElement; context: CanvasRenderingContext2D; blend: Blend; active: boolean}

/** Emissive pixels must blend with the stage, not only a transparent 2D bitmap.
 * Allocate at most two surfaces, on first textured use, and reuse until disposal.
 * Normal materials remain in the existing painted canvas below these light passes. */
export class SkillBlendLayers {
  readonly passes: Pass[] = [];
  private width = 1;
  private height = 1;
  private ratio = 1;
  constructor(private host: HTMLElement) {}

  begin(width: number, height: number, ratio: number): void {
    this.width = Math.max(1, Math.round(width * ratio));
    this.height = Math.max(1, Math.round(height * ratio)); this.ratio = ratio;
    for (const pass of this.passes) {
      this.size(pass); pass.context.clearRect(0, 0, width, height); pass.active = false;
    }
  }

  context(blend: Blend): CanvasRenderingContext2D {
    let pass: Pass | undefined;
    for (const candidate of this.passes) if (candidate.blend === blend) { pass = candidate; break; }
    if (!pass) {
      const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
      if (!context) throw Error('Skill blend canvas unavailable');
      canvas.dataset.paintedVfxBlend = blend; canvas.setAttribute('aria-hidden', 'true');
      Object.assign(canvas.style, {position: 'absolute', inset: '0', width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: '2', mixBlendMode: blend === 'add' ? 'plus-lighter' : 'screen'});
      pass = {canvas, context, blend, active: false}; this.passes.push(pass);
      this.host.appendChild(canvas); this.size(pass);
    }
    pass.active = true;
    return pass.context;
  }

  private size(pass: Pass): void {
    if (pass.canvas.width !== this.width || pass.canvas.height !== this.height) {
      pass.canvas.width = this.width; pass.canvas.height = this.height;
    }
    pass.context.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
  }

  clear(): void {
    for (const pass of this.passes) {
      pass.context.setTransform(1, 0, 0, 1, 0, 0);
      pass.context.clearRect(0, 0, pass.canvas.width, pass.canvas.height); pass.active = false;
    }
  }
  dispose(): void {
    for (const pass of this.passes) { pass.canvas.remove(); pass.canvas.width = pass.canvas.height = 1; }
    this.passes.length = 0;
  }
}
