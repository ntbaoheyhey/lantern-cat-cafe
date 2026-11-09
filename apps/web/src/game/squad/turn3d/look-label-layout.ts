import { intersects, layoutLabels, type LabelInput, type Rect } from './label-layout';
/** Keep small idle movements from rerunning the candidate search or moving DOM
 * plates. Reuse only while every previous plate still clears every silhouette. */
export class StableLabelLayout {
  private width = 0;
  private height = 0;
  private labelWidth = 0;
  private anchors = new Map<string, { x: number; y: number; height: number }>();
  private placed = new Map<string, Rect>();
  resolve(input: LabelInput[], width: number, height: number, labelWidth: number, obstacles: Rect[]) {
    const heads = [...input.map(label => label.head), ...obstacles];
    const reusable = width === this.width && height === this.height && labelWidth === this.labelWidth
      && input.length === this.placed.size && input.every(label => {
        const anchor = this.anchors.get(label.id), box = this.placed.get(label.id);
        return anchor && box && anchor.height === label.height
          && Math.abs(anchor.x - label.x) <= 6 && Math.abs(anchor.y - label.y) <= 6
          && !heads.some(head => intersects(box, head, 5));
      });
    if (reusable) return this.placed;
    this.width = width; this.height = height; this.labelWidth = labelWidth;
    this.anchors = new Map(input.map(label => [label.id, { x: label.x, y: label.y, height: label.height }]));
    this.placed = layoutLabels(input, width, height, labelWidth, obstacles);
    return this.placed;
  }
}
