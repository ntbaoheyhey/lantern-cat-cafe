export interface LayoutFindings {
  dimensions: { viewportWidth: number; viewportHeight: number; scrollWidth: number; scrollHeight: number; scrollX: number; scrollY: number };
  documentScroll: boolean;
  horizontalOverflow: { element: string; left: number; right: number }[];
  elementOverlap: { first: string; second: string; width: number; height: number }[];
}
export function layoutFindings(): LayoutFindings;
