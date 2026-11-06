import { loadRules } from '../cardrpg-sim/load.mjs';
import { writeFile } from 'node:fs/promises';
const { load, vite } = await loadRules();
const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
const { CARDS } = await load('packages/game-rules/src/cardrpg/catalog.ts');
const rows = [], skills = {}, deaths = {};
const teams = [];
for (let first = 0; first < R.CATS.length - 2; first++) {
  for (let second = first + 1; second < R.CATS.length - 1; second++) {
    for (let third = second + 1; third < R.CATS.length; third++) {
      teams.push([R.CATS[first], R.CATS[second], R.CATS[third]]);
    }
  }
}
try {
  for (const [teamIndex, members] of teams.entries()) {
    for (let omit = 0; omit < 4; omit++) for (const chapter of [2, 3]) for (let seat = 0; seat < 3; seat++) {
      const team = [...members.slice(seat), ...members.slice(0, seat)];
      const seed = 5001 + seat;
      const cats = team.map((cat, index) => ({ id: cat.id, stats: { ...CARDS.find(c => c.id === cat.id).baseStats }, row: index === 0 ? 'front' : 'rear', skills: cat.skills.filter((_, i) => i !== omit).map(s => s.id) }));
      const battle = R.createBattle({ seed, chapter, cats, enemies: [R.CHAPTERS[chapter - 1].boss] });
      let choiceTurns = 0;
      for (let i = 0; i < 900 && !battle.result; i++) {
        if (R.currentActor(battle)?.side === 'enemy') R.enemyAct(battle);
        else {
          const legal = R.legalChoices(battle), legalIds = [...new Set(legal.map(c => c.skillId))];
          if (legalIds.length > 1) choiceTurns++;
          for (const id of legalIds) { skills[id] ??= { offers: 0, picks: 0 }; skills[id].offers++; }
          const choice = R.chooseAction(battle, 'smart');
          skills[choice.skillId].picks++;
          if (!R.act(battle, choice)) throw Error('Invalid policy action');
        }
      }
      if (!battle.result) throw Error('Battle exceeded bound');
      const first = battle.firstDeath;
      if (first) deaths[first] = (deaths[first] ?? 0) + 1;
      rows.push({ teamIndex, seat, team: team.map(c => c.id), omittedSkill: omit + 1, chapter, seed, won: battle.result === 'party', turns: battle.choices.length, choiceTurns, firstDeath: first });
    }
    if ((teamIndex + 1) % 20 === 0) console.log(`Team ${teamIndex + 1}/${teams.length} complete`);
  }
  const cats = R.CATS.map(cat => {
    const relevant = rows.filter(r => r.team.includes(cat.id));
    const kit = cat.skills.map(skill => ({ id: skill.id, ...skills[skill.id], selectionRate: (skills[skill.id]?.picks ?? 0) / (skills[skill.id]?.offers || 1) }));
    return { id: cat.id, runs: relevant.length, winRate: relevant.filter(r => r.won).length / relevant.length, kit };
  });
  await writeFile('reports/cardrpg-depth/sim/roster-broad.json', JSON.stringify({ method: '5280 seeded boss encounters across all 220 three-cat teams. Four omitted-skill loadouts, chapters 2 and 3, three seat rotations paired with seeds 5001–5003. Unleveled cat base stats and no gear. Every cat appears in 55 distinct teams and 1320 encounters. Skill rates count only turns where that skill is legal. Team-context win rates measure this fixture and policy.', cats, deaths, skills, rows }, null, 2));
  console.log(JSON.stringify({ cats, deaths }));
} finally { await vite.close(); }
