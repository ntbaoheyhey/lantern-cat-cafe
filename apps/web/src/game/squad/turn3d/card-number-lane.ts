/** Shared scene/DOM geometry. Text is measured conservatively in CSS pixels. */
export function numberLaneWidth(labels: readonly {type:string; amount:number; note?:string; bitter?:boolean}[]) {
  let width = 60;
  for (const label of labels) {
    const length = label.type === 'status_apply' || label.type === 'fizzle' ? (label.note?.length ?? 0) : label.type === 'death' ? 2 : String(label.amount).length + 1;
    width = Math.max(width, length * 10 + 12 + (label.bitter ? 44 : 0));
  }
  return Math.min(160, width);
}
