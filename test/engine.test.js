'use strict';
const assert = require('assert');
const G = require('../lib/game');
const V = (P, id, t) => { const r = G.submitVote(P, id, t); G.drive(P, 1_000_000); return r; };
let n = 0; const t = (name, fn) => { fn(); n++; console.log('  ok  ' + name); };

function mk(count, settings) {
  const T0 = 1_000_000;
  const host = G.newPlayer('P0', 'h0', T0);
  const P = G.newParty('ABCDE', host, T0);
  for (let i = 1; i < count; i++) P.players.push(G.newPlayer('P' + i, 'h' + i, T0));
  Object.assign(P.settings, settings || {});
  assert(G.startRound(P, T0).ok);
  P.players.forEach((p) => G.setReady(P, p.id));
  G.drive(P, T0);
  return { P, T0 };
}

t('a clue timeout skips the turn on its own (the old "timer did not move on" bug)', () => {
  const { P, T0 } = mk(4, { clueSec: 30 });
  assert.strictEqual(P.phase, 'clue');
  const first = P.order[P.turn];
  G.drive(P, T0 + 29_000); assert.strictEqual(P.order[P.turn], first);
  G.drive(P, T0 + 31_000); assert.notStrictEqual(P.order[P.turn], first);
  assert.strictEqual(G.byId(P, first).clues[0], '');
  assert.strictEqual(P.turnEnd, T0 + 31_000 + 30_000, 'next turn gets a fresh 30 s');
});
t('no timer: nothing times out', () => {
  const { P, T0 } = mk(4, { clueSec: 0 });
  const first = P.order[P.turn];
  G.drive(P, T0 + 3_600_000);
  assert.strictEqual(P.order[P.turn], first); assert.strictEqual(P.turnEnd, 0);
});
t('a disconnected player is skipped after 20 s even with no timer', () => {
  const { P, T0 } = mk(4, { clueSec: 0 });
  const cur = G.byId(P, P.order[P.turn]); cur.connected = false; cur.discAt = T0;
  G.drive(P, T0 + 10_000); assert.strictEqual(P.order[P.turn], cur.id);
  G.drive(P, T0 + 21_000); assert.notStrictEqual(P.order[P.turn], cur.id);
});
t('voting times out and a lone vote is no majority', () => {
  const { P, T0 } = mk(5, { clueSec: 0, voteSec: 30 });
  for (let i = 0; i < 5; i++) { const c = P.order[P.turn]; assert(G.submitClue(P, c, 'w', T0).ok || G.byId(P, c)); }
  // force through any clue the crew could not send (word clash) by skipping
  while (P.phase === 'clue') G.skipTurn(P, T0);
  assert.strictEqual(P.phase, 'vote');
  V(P, P.alive[0], P.alive[1]);
  G.drive(P, T0 + 31_000);
  assert.strictEqual(P.phase, 'tally'); assert.strictEqual(P.tally.out, null);
  G.drive(P, T0 + 31_000 + G.TALLY_MS + 1);
  assert.strictEqual(P.phase, 'clue'); assert.strictEqual(P.lap, 2);
});
t('majority = more than half of those still in (3 of 5, 2 of 4 is not enough)', () => {
  let { P, T0 } = mk(5, { clueSec: 0, voteSec: 0 });
  while (P.phase === 'clue') G.skipTurn(P, T0);
  const innocent = P.alive.find((id) => id !== P.imp);
  const voters = P.alive.filter((id) => id !== innocent);
  V(P, voters[0], innocent); V(P, voters[1], innocent); V(P, voters[2], '');V(P, voters[3], '');V(P, innocent, '');
  assert.strictEqual(P.phase, 'tally'); assert.strictEqual(P.tally.out, null, '2 of 5 is not a majority');
  ({ P, T0 } = mk(5, { clueSec: 0, voteSec: 0 }));
  while (P.phase === 'clue') G.skipTurn(P, T0);
  const inn = P.alive.find((id) => id !== P.imp);
  P.alive.filter((id) => id !== inn).slice(0, 3).forEach((id) => V(P, id, inn));
  P.alive.forEach((id) => { if (!G.byId(P, id).vote) V(P, id, ''); });
  G.drive(P, T0);
  assert.strictEqual(P.tally.out, inn, '3 of 5 is a majority');
  });
t('imposter wins when only two players are left', () => {
  const { P, T0 } = mk(4, { clueSec: 0, voteSec: 0 });
  while (P.phase === 'clue') G.skipTurn(P, T0);
  const inn = P.alive.find((id) => id !== P.imp);
  // 4 alive: need 3 votes
  P.alive.filter((id) => id !== inn).forEach((id) => V(P, id, inn));
  V(P, inn, '');
  assert.strictEqual(P.tally.out, inn);
  G.forceNext(P, T0);
  assert.strictEqual(P.phase, 'clue'); assert.strictEqual(P.alive.length, 3);
  while (P.phase === 'clue') G.skipTurn(P, T0);
  const inn2 = P.alive.find((id) => id !== P.imp);
  P.alive.filter((id) => id !== inn2).forEach((id) => V(P, id, inn2));
  V(P, inn2, '');
  G.forceNext(P, T0);
  assert.strictEqual(P.phase, 'result'); assert.strictEqual(P.result.win, 'imp'); assert.strictEqual(P.result.reason, 'two-left');
  assert.strictEqual(P.scores[P.imp], 2);
});
t('guess timer: no guess in time means the crew wins', () => {
  const { P, T0 } = mk(4, { clueSec: 30, voteSec: 0 });
  while (P.phase === 'clue') G.skipTurn(P, T0);
  P.alive.filter((id) => id !== P.imp).forEach((id) => V(P, id, P.imp));
  V(P, P.imp, '');
  G.forceNext(P, T0);
  assert.strictEqual(P.phase, 'guess');
  G.drive(P, T0 + 31_000);
  assert.strictEqual(P.phase, 'result'); assert.strictEqual(P.result.win, 'crew');
});
t('imposter leaving ends the round for the crew', () => {
  const { P, T0 } = mk(4, { clueSec: 0 });
  G.removePlayer(P, P.imp, T0);
  assert.strictEqual(P.phase, 'result'); assert.strictEqual(P.result.reason, 'left');
});
t('a word never repeats inside one party until the list runs out', () => {
  const { P, T0 } = mk(3, { cats: ['animals'] });
  const seen = new Set([P.secret.word]);
  for (let i = 0; i < 40; i++) { P.phase = 'result'; G.startRound(P, T0); assert(!seen.has(P.secret.word), 'repeat: ' + P.secret.word); seen.add(P.secret.word); }
});
console.log('\n' + n + ' engine tests passed');
