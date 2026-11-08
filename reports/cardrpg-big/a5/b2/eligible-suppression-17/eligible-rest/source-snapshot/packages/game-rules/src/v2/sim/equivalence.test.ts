// @ts-expect-error Node test APIs; production has no Node dependency.
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { CLASS_IDS } from '../content';
import { C5C_SB_OVERRIDES } from './proposal';
import { simulateV2 } from './simulate';
// Digests of full 21 results captured from origin/main 3379777 BEFORE the key-refund change.
const C5C_SB_DIGESTS = ["8f8e7a8cbc26a2f8c0d1922a584f4b41fd8e1cba4348d3e95b3fd5aceb8f245c","cdc3a6ef24e50e18ebf982b0c6e92225c3401ee7092c95a9e68b657f805387e7","5245e7a0ad2893338566de62540ad51d8e55ec3d751659ed12aab0ddc0178117","5c7a131233cd4386485ccd152aecb0570a8b6bee4d1909ff36d8afccc45556d8","4d03cb7b6b54079d8d382b323a41fc8617cb2b34e5ca22c21a34864c47deb80b","9c7898bcff064a03ac44df783068b66661b9fc5d3ec89facfcf082d9b0ab000f","477c9af067d52081cbb1e3b99d876671998ae64759256e2de72dff7d9c0b8100","a11bb5caf73657810bc4e22250f2e16e64138644500e943cf6d59a5677b808b3","f4f29264d1ebabe1d090e8702fbba4be6d253c153b3308473f075ff55d30a6fb","29847edb1afcd3999333d523f91fe30e5e5ef097187c65cfa5ca67dc3e872666","3641f005bb10af83067e721cd2cb9eaaa2d321d7448819fbfc0f082ca9a4f33a","17a6f0f863a445da2892ecfcc9cddc8678bce108a4954cb5a5486376709b8865","a0bbc1c47a4a5331592c4c0e2933d55ca07347d5b17ba631fc38f3563561172c","ba30169a28d0293eeb8fc202b6d41ce25fc26f07a91fd3c5c353c2a5c180e2b5","9a245797777f65c1cab7694837526ee6e0bab25dc3ef0a9830db81f752cf0800","8739a77397aef8775468f684cdce8fa5e4790f4af225e8330a1a3269b55bc36c","dc4f1333302fe3b14ad1e4a3d5f1227d694a474c591888c986fd5d8326cb0b2b","5d59b0e8699136d93e89673196bf0c024a16e0880bda8b1f4242813866993b75","4c496dfac27d6d44cc7b6209ab83d53bf821ae0e034d963592ee6f66b095133a","2650ee18e9fe3b2b004853bd74619a335f14686c4a6a434fc02ed2cc018411fb","d6f411ddd1b05cb47114e21166eb1c7b198000dd97ae74b86a2bb68f014496b0"];
it('preserves every C5c S-B result on seeds 1–3 with the config leaf', () => {
  const runs = CLASS_IDS.flatMap(classId => [1, 2, 3].map(seed => simulateV2({ classId, seed, overrides: { ...C5C_SB_OVERRIDES, boss: { ...C5C_SB_OVERRIDES.boss, firstClearKeys: 1 } } })));
  expect(runs.map(r => createHash('sha256').update(JSON.stringify(r)).digest('hex'))).toEqual(C5C_SB_DIGESTS);
}, 180000);
