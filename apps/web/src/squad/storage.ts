import { squad } from '@taskbar-hero/game-rules';
export function loadLab(): { save: squad.LabSave; error: string } {
  try {
    const text = localStorage.getItem(squad.SAVE_KEY);
    return { save: text ? squad.parseSave(JSON.parse(text)) : { version: 2, profile: squad.newProfile(), run: null }, error: '' };
  } catch { return { save: { version: 2, profile: squad.newProfile(), run: null }, error: 'The existing save could not be opened. It is preserved; this session will stay in memory. Export your progress before leaving.' }; }
}
export function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
