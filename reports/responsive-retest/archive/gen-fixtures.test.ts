import { it } from 'vitest';
import { mockV2SaveJson } from '/Users/bao/taskbar-hero/apps/web/src/api/mockV2Fixtures';
import fs from 'fs';

it('generates fixtures', () => {
  const midGame = mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'witch' });
  const fresh = mockV2SaveJson('fresh', { nowMs: Date.now(), classId: 'warrior' });
  fs.writeFileSync('/Users/bao/.gemini/antigravity/brain/cb56daaa-b920-4372-a259-dd5034078adb/scratch/fixtures.json', JSON.stringify({ midGame, fresh }, null, 2));
});
