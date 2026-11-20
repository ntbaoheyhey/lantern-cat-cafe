// Only a declared current milestone status may admit art into the UI branch.
// A current incomplete state takes precedence over historical report evidence.
export function publishedArtPass(state, report) {
  const plain = text => text.replace(/[*`]/g, '').split(/\r?\n/).map(line => line.trim());
  const incomplete = /\b(PARTIAL|PAUSED|BLOCKED|WIP|FAIL(?:ED)?)\b/i;
  const passed = /\bPASS\b/i;
  const current = plain(state).find(line => /^NOW\b/.test(line)) ?? '';
  if (incomplete.test(current)) return false;
  if (passed.test(current)) return true;
  const declaration = plain(report).find(line => {
    const label = line.replace(/^#{1,6}\s+/, '');
    return (/^#\s/.test(line) || /^(?:Status|Overall(?: status)?|Milestone(?: status)?)\s*[:—-]/i.test(label))
      && (passed.test(line) || incomplete.test(line));
  }) ?? '';
  return passed.test(declaration) && !incomplete.test(declaration);
}
