/** B4b candidate tables. Consumers opt in through formationC2; old rules retain
 * their published guarantees. The first candidate is measured before acceptance.
 */
export const ECONOMY_C2 = {
  // One item must not decide a late-boss result. These are prospective B4b
  // budgets, measured with paired battles; Power alone is not the acceptance.
  equipment: { commonPower: 0.008, maximumPower: 0.02, minimumMain: 1, affixScale: 0.25, defenseWeight: 3, hpWeight: 0.6 },
  // Flat defense persists over every hit. Set completion must not create an
  // unlimited taunt loop or overload a protector with shared damage.
  sets: { hearthloomShareBp: 500, bellsteelSheltersPerBattle: 0, bellsteelRipostesPerBattle: 1 },
  uniques: { rainbellCleanseStacks: 1, softcollarShield: 8 },
  dropsPerDay: 6,
  // Basis points, in the shared Common/Rare/Epic/Legendary order.
  drops: {
    battle: { common: 6500, rare: 3000, epic: 500, legendary: 0 },
    elite: { common: 0, rare: 7200, epic: 2795, legendary: 5 },
    boss: { common: 0, rare: 2985, epic: 7000, legendary: 15 },
  },
  // Keep the earned 13/24-pull guarantee intact; pace gear through its price.
  equipmentInvitation: { stamps: 300 },
  tailoring: {
    common: { fish: 180, threads: 30 },
    rare: { fish: 180, threads: 30 },
    epic: { fish: 20, threads: 240, essence: 9 },
    legendary: { fish: 100, threads: 300, essence: 60 },
  },
  legendary: { seals: 10, materials: 200, selectorMarks: 72 },
} as const;
