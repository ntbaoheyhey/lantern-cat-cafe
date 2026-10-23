import { useGameMode } from './store';
import './demoNote.css';

/** Tells the player when progress is not saved (demo mode). Renders nothing on the server. */
export function DemoNote() {
  const { demo, notice } = useGameMode();
  if (!demo) return null;
  return (
    <p className="demo-note" role="status" data-testid="demo-note">
      {notice ?? 'Demo mode, sign in to save progress.'}
    </p>
  );
}
