import { useTickNumber } from './useTickNumber';

/** Reserve a stable numeric column; screen-reader labels keep the authoritative value. */
export function MotionNumber({ value }: { value: number }) {
  const shown = useTickNumber(value, 180);
  return <span className="motion-number" data-motion-number={value}>{shown.toLocaleString('en-US')}</span>;
}
