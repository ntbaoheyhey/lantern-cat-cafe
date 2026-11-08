import { clone } from '../internal';
import { expect, it } from 'vitest';
import { SCARCITY } from '../catalog';
import { designEligibility, reserveDesignPreview } from './bridge';
import { battleCats, createDepthAccount } from './state';

function eligibleAccount() {
  const state = createDepthAccount(11);
  state.seals = 10;
  state.cleared = [1, 2, 3];
  state.masteries = [1, 2, 3];
  return state;
}

for (const design of SCARCITY) {
  for (const counter of ['issuedDesign', 'seasonIssuedDesign'] as const) {
    const cap = counter === 'issuedDesign' ? design.globalCap : design.seasonCap;
    for (const distance of [-1, 0, 1]) {
      it(`${design.id} checks ${counter} at cap ${distance >= 0 ? '+' : ''}${distance} atomically`, () => {
        const state = eligibleAccount();
        state.account.scarcity[design.id]![counter] = cap + distance;
        const before = clone(state);
        const result = reserveDesignPreview(state, design.id);
        expect(result.ok).toBe(distance === -1);
        expect(state).toEqual(before);
        if (distance === -1) {
          expect(result.state.account.scarcity[design.id]![counter]).toBe(cap);
          expect(result.state.seals).toBe(state.seals - designEligibility(state, design.id).seals);
          expect(result.state.designClaims).toEqual([design.id]);
          expect(battleCats(result.state)).toEqual(battleCats(state));
          const retry = reserveDesignPreview(result.state, design.id);
          expect(retry.ok).toBe(false);
          expect(retry.state).toEqual(result.state);
        } else {
          expect(result.state).toEqual(before);
        }
      });
    }
  }

  it(`${design.id} consumes the last global and seasonal places together`, () => {
    const state = eligibleAccount();
    const counter = state.account.scarcity[design.id]!;
    counter.issuedDesign = design.globalCap - 1;
    counter.seasonIssuedDesign = design.seasonCap - 1;
    const result = reserveDesignPreview(state, design.id);
    expect(result.ok).toBe(true);
    expect(result.state.account.scarcity[design.id]).toMatchObject({
      issuedDesign: design.globalCap, seasonIssuedDesign: design.seasonCap,
    });
    expect(designEligibility(result.state, design.id).supply).toBe(false);
  });

  it(`${design.id} rejects an account's second reservation while supply remains`, () => {
    const state = eligibleAccount();
    state.designClaims = [design.id];
    const result = reserveDesignPreview(state, design.id);
    expect(result.ok).toBe(false);
    expect(result.state).toEqual(state);
  });

  for (const difference of [-1, 0]) {
    it(`${design.id} checks the seal boundary at required ${difference}`, () => {
      const state = eligibleAccount();
      state.seals = designEligibility(state, design.id).seals + difference;
      const result = reserveDesignPreview(state, design.id);
      expect(result.ok).toBe(difference === 0);
      expect(result.state.seals).toBe(difference === 0 ? 0 : state.seals);
    });
  }
}

it.each([0, 1])('Moon Collar requires a chapter clear, with %i recorded', count => {
  const state = eligibleAccount();
  state.cleared = count ? [1] : [];
  expect(reserveDesignPreview(state, 'moon-collar').ok).toBe(count === 1);
});

it.each([
  { masteries: [1, 2], tower: 4, eligible: false },
  { masteries: [1, 2, 3], tower: 4, eligible: true },
  { masteries: [], tower: 5, eligible: true },
])('Golden Maneki checks both existing effort routes with $masteries and floor $tower', fixture => {
  const state = eligibleAccount();
  state.masteries = fixture.masteries;
  state.towerBest = fixture.tower;
  expect(reserveDesignPreview(state, 'golden-maneki').ok).toBe(fixture.eligible);
});
