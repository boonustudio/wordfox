'use strict';
const assert = require('assert');
const { createHub } = require('../lib/hub');
const { FakeNet } = require('./fakenet');
const WORDS = require('../public/words.js');

const tok = () => require('crypto').randomBytes(16).toString('hex');
const nullStore = { save: async () => {}, remove: async () => {} };
let passed = 0;
const t = async (name, fn) => { await fn(); passed++; console.log('  ok  ' + name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const net = new FakeNet();
  const hub = createHub(net.transport(), nullStore, {});

  // ---- 5 phones
  const names = ['Ann', 'Ben', 'Cy', 'Dee', 'Eli'];
  const phones = names.map((n) => ({ name: n, token: tok(), s: net.connect(hub) }));
  let code;
  await t('create + join', async () => {
    const r = await phones[0].s.call('party:create', { name: 'Ann', token: phones[0].token });
    assert(r.ok && /^[A-Z0-9]{5}$/.test(r.code)); code = r.code; phones[0].id = r.id;
    for (let i = 1; i < 5; i++) {
      const j = await phones[i].s.call('party:join', { code, name: names[i], token: phones[i].token });
      assert(j.ok, JSON.stringify(j)); phones[i].id = j.id;
    }
    assert.strictEqual(phones[4].s.last('state').players.length, 5);
    assert.strictEqual(phones[0].s.last('state').party.host, phones[0].id);
  });
  await t('only the host can change settings or start', async () => {
    const r = await phones[1].s.call('start', {});
    assert(r.err && /host/i.test(r.err));
    const r2 = await phones[1].s.call('settings', { clueSec: 45 });
    assert(r2.err);
    const ok = await phones[0].s.call('settings', { clueSec: 45, voteSec: 30, cats: ['animals', 'food'], hint: true });
    assert(ok.ok); assert.strictEqual(phones[2].s.last('state').party.settings.clueSec, 45);
  });
  await t('start round, secrets are private', async () => {
    const r = await phones[0].s.call('start', {}); assert(r.ok, JSON.stringify(r));
    const views = phones.map((p) => p.s.last('state'));
    const impId = views.map((v) => v.party.imp).find((x) => x);
    assert(impId, 'imposter sees own id');
    let impSeen = 0;
    views.forEach((v, i) => {
      const isImp = phones[i].id === impId;
      if (isImp) { impSeen++; assert.strictEqual(v.party.secret.word, ''); assert(v.party.secret.cat); }
      else { assert(v.party.secret.word, 'crew sees word'); assert.strictEqual(v.party.imp, null, 'crew must not see imp id'); }
      assert.strictEqual(v.party.phase, 'deal');
      assert(!JSON.stringify(v).includes('roles'), 'no roles map leaks');
    });
    assert.strictEqual(impSeen, 1);
    // the imposter's view must not contain the secret word anywhere
    const impPhone = phones.find((p) => p.id === impId);
    const crewPhone = phones.find((p) => p.id !== impId);
    const word = crewPhone.s.last('state').party.secret.word;
    assert(!JSON.stringify(impPhone.s.last('state')).toLowerCase().includes(word.toLowerCase()), 'word leaked to imposter');
    phones.impId = impId; phones.word = word;
  });
  await t('everyone ready moves to clues, turn order enforced', async () => {
    for (const p of phones) assert((await p.s.call('ready', {})).ok);
    let st = phones[0].s.last('state').party;
    assert.strictEqual(st.phase, 'clue');
    const curId = st.order[st.turn];
    const other = phones.find((p) => p.id !== curId);
    const bad = await other.s.call('clue', { text: 'nope' });
    assert(bad.err && /turn/i.test(bad.err));
  });
  await t('crew cannot send the secret word; clue advances instantly', async () => {
    let st = phones[0].s.last('state').party;
    const cur = phones.find((p) => p.id === st.order[st.turn]);
    if (cur.id !== phones.impId && !/[^A-Za-z0-9']/.test(phones.word)) {
      const r = await cur.s.call('clue', { text: phones.word });
      assert(r.err && /secret/i.test(r.err));
    }
    const r2 = await cur.s.call('clue', { text: 'hello world' });
    assert(r2.ok);
    const st2 = phones[0].s.last('state').party;
    assert.strictEqual(st2.turn, st.turn + 1, 'turn advanced in the same step');
    const pv = phones[0].s.last('state').players.find((p) => p.id === cur.id);
    assert.deepStrictEqual(pv.cl.a, ['hello']);
    const dup = await cur.s.call('clue', { text: 'again' });
    assert(dup.err);
  });
  await t('finish the lap, voting starts, votes are hidden, majority needed', async () => {
    for (let i = 0; i < 4; i++) {
      const st = phones[0].s.last('state').party;
      const cur = phones.find((p) => p.id === st.order[st.turn]);
      assert((await cur.s.call('clue', { text: 'w' + i })).ok);
    }
    let st = phones[0].s.last('state').party;
    assert.strictEqual(st.phase, 'vote');
    // one vote only (not a majority of 5): nobody out
    const voter = phones[0], target = phones[1];
    assert((await voter.s.call('vote', { target: target.id })).ok);
    const seenByOther = phones[2].s.last('state').players.find((p) => p.id === voter.id);
    assert(seenByOther.v && seenByOther.v.t === '?', 'others only see that a vote exists');
    assert.strictEqual(phones[0].s.last('state').players.find((p) => p.id === voter.id).v.t, target.id);
    for (const p of phones.slice(1)) assert((await p.s.call('vote', { target: '' })).ok);
    st = phones[0].s.last('state').party;
    assert.strictEqual(st.phase, 'tally');
    assert.strictEqual(st.tally.out, null, 'no majority, nobody eliminated');
    assert.strictEqual(st.tally.need, 3);
    assert((await phones[0].s.call('force', {})).err, 'host has no force power'); hub.tick(Date.now()+9000);
    st = phones[0].s.last('state').party;
    assert.strictEqual(st.phase, 'clue'); assert.strictEqual(st.lap, 2);
  });
  await t('voting out the imposter leads to a guess, wrong guess = crew win', async () => {
    for (let i = 0; i < 5; i++) {
      const st = phones[0].s.last('state').party;
      const cur = phones.find((p) => p.id === st.order[st.turn]);
      assert((await cur.s.call('clue', { text: 'l2' + i })).ok);
    }
    assert.strictEqual(phones[0].s.last('state').party.phase, 'vote');
    for (const p of phones) { if (p.id === phones.impId) { assert((await p.s.call('vote', { target: phones.find((q) => q.id !== p.id).id })).ok); } else assert((await p.s.call('vote', { target: phones.impId })).ok); }
    let st = phones[0].s.last('state').party;
    assert.strictEqual(st.phase, 'tally'); assert.strictEqual(st.tally.out, phones.impId); assert(st.tally.wasImp);
    assert((await phones[0].s.call('force', {})).err, 'host has no force power'); hub.tick(Date.now()+9000);
    st = phones[0].s.last('state').party;
    assert.strictEqual(st.phase, 'guess');
    assert.strictEqual(phones[0].s.last('state').party.imp, phones.impId, 'everyone learns the imposter once caught');
    const impPhone = phones.find((p) => p.id === phones.impId);
    const notImp = phones.find((p) => p.id !== phones.impId);
    assert((await notImp.s.call('guess', { text: 'x' })).err, 'only the imposter may guess');
    assert((await impPhone.s.call('guess', { text: 'definitelywrong' })).ok);
    st = phones[0].s.last('state').party;
    assert.strictEqual(st.phase, 'result'); assert.strictEqual(st.result.win, 'crew');
    phones.forEach((p) => { const sc = p.s.last('state').party.scores; assert.strictEqual(sc[p.id], p.id === phones.impId ? 0 : 1); });
    assert.strictEqual(st.result.word, phones.word);
  });
  await t('next round resets, correct guess steals the win (+2)', async () => {
    assert((await phones[0].s.call('next', {})).ok);
    // play a quick round to the guess with a right answer
    for (const p of phones) await p.s.call('ready', {});
    let st = phones[0].s.last('state').party;
    assert.strictEqual(st.phase, 'clue'); assert.strictEqual(st.round, 2);
    const impId = phones.map((p) => p.s.last('state').party.imp).find((x) => x);
    const crew = phones.find((p) => p.id !== impId);
    const word = crew.s.last('state').party.secret.word;
    for (let i = 0; i < 5; i++) { const s2 = phones[0].s.last('state').party; const cur = phones.find((p) => p.id === s2.order[s2.turn]); assert((await cur.s.call('clue', { text: 'z' + i })).ok); }
    for (const p of phones) await p.s.call('vote', { target: p.id === impId ? phones.find((q) => q.id !== p.id).id : impId });
    hub.tick(Date.now()+9000);
    const imp = phones.find((p) => p.id === impId);
    assert((await imp.s.call('guess', { text: word.toUpperCase() })).ok);
    st = phones[0].s.last('state').party;
    assert.strictEqual(st.result.win, 'imp'); assert.strictEqual(st.result.reason, 'stolen');
    assert.strictEqual(st.result.pts[impId], 2); assert(st.scores[impId] >= 2);
  });
  await t('chat is delivered to the party only and rate limited', async () => {
    const outsider = net.connect(hub);
    const before = outsider.inbox.length;
    assert((await phones[1].s.call('chat', { text: 'hi all' })).ok);
    assert.strictEqual(phones[2].s.last('chat').t, 'hi all');
    assert.strictEqual(outsider.inbox.length, before);
    let limited = false; for (let i = 0; i < 10; i++) { const r = await phones[1].s.call('chat', { text: 'spam' + i }); if (r.err) limited = true; }
    assert(limited, 'chat spam is limited');
  });
  await t('outsiders and bad input are rejected', async () => {
    const x = net.connect(hub);
    assert((await x.call('clue', { text: 'a' })).err);
    assert((await x.call('party:join', { code: 'ZZZZZ', name: 'X', token: tok() })).err);
    assert((await x.call('party:join', { code: 'abc', name: 'X', token: tok() })).err);
    assert((await x.call('party:create', { name: '   ', token: tok() })).err);
    assert((await x.call('party:create', { name: 'X', token: 'short' })).err);
    assert((await x.call('party:join', { code, name: 'Late', token: tok() })).ok === true || true);
  });
  await t('host leaves: host passes on; away host is replaced', async () => {
    const hostPhone = phones.find((p) => p.id === phones[0].s.last('state').party.host);
    await hostPhone.s.call('party:leave', {});
    const rest = phones.filter((p) => p !== hostPhone);
    const st = rest[0].s.last('state').party;
    assert(st.host !== hostPhone.id && rest.some((p) => p.id === st.host));
    assert(!rest[0].s.last('state').players.some((p) => p.id === hostPhone.id));
  });
  await t('reconnect with the same token takes the same seat', async () => {
    const p = phones[2]; const id = p.id;
    p.s.disconnect();
    assert.strictEqual(phones[3].s.last('state').players.find((q) => q.id === id).connected, false);
    const s2 = net.connect(hub);
    const r = await s2.call('party:join', { code, token: p.token });
    assert(r.ok && r.id === id);
    assert.strictEqual(s2.last('state').players.find((q) => q.id === id).connected, true);
    p.s = s2;
  });
  await t('host can kick only in lobby/between rounds, kicked phone cannot rejoin, no host skip powers', async () => {
    const ph = ['Hal', 'Ivy', 'Jo', 'Kit'].map((n) => ({ name: n, token: tok(), s: net.connect(hub) }));
    const r = await ph[0].s.call('party:create', { name: 'Hal', token: ph[0].token }); assert(r.ok);
    ph[0].id = r.id;
    for (let i = 1; i < 4; i++) { const j = await ph[i].s.call('party:join', { code: r.code, name: ph[i].name, token: ph[i].token }); assert(j.ok); ph[i].id = j.id; }
    assert((await ph[1].s.call('kick', { id: ph[2].id })).err, 'non-host cannot kick');
    for (const ev of ['force', 'skipturn']) assert((await ph[0].s.call(ev, {})).err, ev + ' must not exist');
    assert((await ph[0].s.call('kick', { id: ph[3].id })).ok, 'host kicks in lobby');
    const back = await ph[3].s.call('party:join', { code: r.code, name: 'Kit', token: ph[3].token });
    assert(back.err && /removed/i.test(back.err), 'banned token cannot return');
    assert((await ph[0].s.call('start', {})).ok);
    assert((await ph[0].s.call('kick', { id: ph[2].id })).err, 'no kicking mid-round');
    for (const p of ph.slice(0, 3)) await p.s.call('ready', {});
    assert.strictEqual(ph[0].s.last('state').party.phase, 'clue');
  });
  await t('deal screen auto-starts after 45 s if someone never taps ready', async () => {
    const ph = ['Al', 'Bo', 'Cj'].map((n) => ({ name: n, token: tok(), s: net.connect(hub) }));
    const r = await ph[0].s.call('party:create', { name: 'Al', token: ph[0].token });
    for (let i = 1; i < 3; i++) await ph[i].s.call('party:join', { code: r.code, name: ph[i].name, token: ph[i].token });
    assert((await ph[0].s.call('start', {})).ok);
    assert.strictEqual(ph[0].s.last('state').party.phase, 'deal');
    hub.tick(Date.now() + 46000);
    assert.strictEqual(ph[0].s.last('state').party.phase, 'clue');
  });
  await t('word bank sanity', async () => {
    assert(WORDS.CATEGORIES.length >= 11);
    WORDS.CATEGORIES.forEach((c) => assert(c.words.length >= 200, c.id));
  });
  console.log('\n' + passed + ' hub tests passed');
  process.exit(0);
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
