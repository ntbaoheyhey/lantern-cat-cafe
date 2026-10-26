import type { BossFightResultV2 } from '../../api/GameApiV2';
import { buildArenaCues, finalState, type ArenaCue, type ArenaCueOptions } from './cues';

export interface ArenaSink {
  cue(cue: ArenaCue): void;
  finish(state: ReturnType<typeof finalState>): void;
}
/** Consumes C14's already ordered cues. No sorting, random rolls or combat simulation here. */
export class ArenaPlayback {
  readonly cues: ArenaCue[];
  private index = 0;
  private elapsed = 0;
  private finished = false;
  constructor(private result: BossFightResultV2, private options: ArenaCueOptions, private sink: ArenaSink) {
    this.cues = buildArenaCues(result, options);
  }
  advance(dt: number): void {
    if (this.finished) return;
    this.elapsed += Number.isFinite(dt) ? Math.max(0, dt) : 0;
    while (this.index < this.cues.length && this.cues[this.index]!.t <= this.elapsed) this.sink.cue(this.cues[this.index++]!);
    if (this.index === this.cues.length) this.skip();
  }
  skip(): void {
    if (this.finished) return;
    this.finished = true;
    this.sink.finish(finalState(this.result, this.options));
  }
}
