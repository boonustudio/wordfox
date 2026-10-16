'use strict';
/*
 * Wordfox game engine. Pure rules, no network and no database.
 * The server owns every party object, so secrets (the word and who the imposter is)
 * only leave the server inside viewFor(), which builds a private view per player.
 *
 * Round flow: lobby > deal > clue (turn by turn) > vote > tally > (clue again | guess > result | result)
 */
const crypto = require('crypto');
const WORDS = require('../public/words.js');

const MAX_PLAYERS = 12;
const MIN_PLAYERS = 3;
const CLUE_TIMES = [0, 30, 45, 60];
const VOTE_TIMES = [0, 30, 60, 90];
const AWAY_SKIP_MS = 20 * 1000; // a disconnected player's turn is skipped after this long
const TALLY_MS = 8 * 1000;
const DEAL_MS = 45 * 1000;
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CAT_IDS = WORDS.CATEGORIES.map((c) => c.id);

function rnd(n) { return crypto.randomInt(n); }
function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
function newId() { return crypto.randomBytes(5).toString('hex'); }
function genCode() { let s = ''; for (let i = 0; i < 5; i++) s += ALPHA[rnd(ALPHA.length)]; return s; }
function norm(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function isMatch(t, word) { const a = norm(t), b = norm(word); return !!a && (a === b || a === b + 's' || a + 's' === b); }
function cleanName(raw) {
  return String(raw || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 14);
}
function cleanClue(raw) {
  return String(raw || '').trim().split(/\s+/)[0].replace(/[^\w'\-]/g, '').slice(0, 20);
}

/* ---------- party and player records ---------- */
function newPlayer(name, tokenHash, now) {
  return { id: newId(), tokenHash, name, joined: now, connected: true, discAt: 0, clues: [], vote: null, guess: null, ready: 0 };
}
function newParty(code, host, now) {
  return {
    code, hostId: host.id, phase: 'lobby', round: 0, lap: 1, turn: 0,
    order: [], alive: [], roles: {}, imp: null, secret: null,
    settings: { clueSec: 30, voteSec: 60, hint: true, cats: CAT_IDS.slice() },
    turnEnd: 0, voteEnd: 0, nextAt: 0, guessEnd: 0, dealEnd: 0, tally: null, result: null,
    scores: {}, players: [host], used: [], chat: [], banned: [], created: now, updated: now, emptySince: 0
  };
}
function byId(P, id) { for (const p of P.players) if (p.id === id) return p; return null; }
function uniqueName(P, name) {
  const low = P.players.map((p) => p.name.toLowerCase());
  let n = name, k = 2;
  while (low.includes(n.toLowerCase())) { n = name.slice(0, 11) + ' ' + k; k++; }
  return n;
}
function aliveIds(P) { return P.alive.filter((id) => byId(P, id)); }
function inRound(P) { return ['deal', 'clue', 'vote', 'tally', 'guess'].includes(P.phase); }

/* ---------- words ---------- */
function pickWord(P) {
  const cats = P.settings.cats.filter((id) => CAT_IDS.includes(id));
  const use = cats.length ? cats : CAT_IDS;
  let pool = [];
  WORDS.CATEGORIES.forEach((c) => { if (use.includes(c.id)) c.words.forEach((w) => pool.push({ word: w, cat: c.name })); });
  let avail = pool.filter((p) => !P.used.includes(p.word));
  if (!avail.length) { P.used = P.used.filter((w) => !pool.some((p) => p.word === w)); avail = pool; }
  const pick = avail[rnd(avail.length)];
  P.used.push(pick.word);
  return { word: pick.word, cat: pick.cat, hint: WORDS.HINTS[pick.word] || '' };
}

/* ---------- actions (each returns {ok:true} or {err:'message'}) ---------- */
const ok = () => ({ ok: true });
const err = (m) => ({ err: m });

function setSettings(P, patch) {
  const s = P.settings;
  if (patch && CLUE_TIMES.includes(patch.clueSec)) s.clueSec = patch.clueSec;
  if (patch && VOTE_TIMES.includes(patch.voteSec)) s.voteSec = patch.voteSec;
  if (patch && typeof patch.hint === 'boolean') s.hint = patch.hint;
  if (patch && Array.isArray(patch.cats)) {
    const c = [...new Set(patch.cats.filter((id) => CAT_IDS.includes(id)))];
    if (c.length) s.cats = c;
  }
  return ok();
}

function startRound(P, now) {
  if (P.phase !== 'lobby' && P.phase !== 'result') return err('A round is already running.');
  if (P.players.length < MIN_PLAYERS) return err('Need at least ' + MIN_PLAYERS + ' players.');
  const ids = P.players.map((p) => p.id);
  const imp = ids[rnd(ids.length)];
  const roles = {};
  ids.forEach((id) => { roles[id] = id === imp ? 'imp' : 'crew'; });
  P.round += 1; P.phase = 'deal'; P.roles = roles; P.imp = imp; P.secret = pickWord(P);
  P.order = shuffle(ids); P.alive = ids.slice(); P.lap = 1; P.turn = 0;
  P.turnEnd = P.voteEnd = P.nextAt = P.guessEnd = 0; P.tally = null; P.result = null;
  P.dealEnd = now + DEAL_MS; // the role check ends by itself, nobody needs to hurry it
  P.players.forEach((p) => { p.clues = []; p.vote = null; p.guess = null; p.ready = 0; });
  return ok();
}

function toLobby(P) {
  if (P.phase === 'lobby') return ok();
  P.phase = 'lobby'; P.imp = null; P.secret = null; P.roles = {}; P.tally = null; P.result = null;
  P.turnEnd = P.voteEnd = P.nextAt = P.guessEnd = 0;
  return ok();
}

function setReady(P, pid) {
  if (P.phase !== 'deal') return err('Not in the role check.');
  const p = byId(P, pid); if (p) p.ready = P.round;
  return ok();
}

function clueDeadline(P, now) { return P.settings.clueSec ? now + P.settings.clueSec * 1000 : 0; }
function voteDeadline(P, now) { return P.settings.voteSec ? now + P.settings.voteSec * 1000 : 0; }

function firstAlive(P, from, alive) {
  const list = alive || P.alive;
  for (let i = Math.max(0, from); i < P.order.length; i++) {
    if (list.includes(P.order[i]) && byId(P, P.order[i])) return i;
  }
  return -1;
}

function startClues(P, now) {
  if (P.phase !== 'deal') return;
  P.phase = 'clue'; P.lap = 1; P.turn = Math.max(0, firstAlive(P, 0)); P.turnEnd = clueDeadline(P, now);
}

function advanceTurn(P, now) {
  const i = firstAlive(P, P.turn + 1);
  if (i < 0) {
    P.phase = 'vote'; P.turnEnd = 0; P.voteEnd = voteDeadline(P, now);
    P.players.forEach((p) => { p.vote = null; });
  } else { P.turn = i; P.turnEnd = clueDeadline(P, now); }
}

function submitClue(P, pid, text, now) {
  if (P.phase !== 'clue' || P.order[P.turn] !== pid || !P.alive.includes(pid)) return err('It is not your turn.');
  const p = byId(P, pid);
  if (p.clues.length >= P.lap) return err('You already sent a clue.');
  const t = cleanClue(text);
  if (!t) return err('Type one word first.');
  if (P.roles[pid] !== 'imp' && norm(t) === norm(P.secret.word)) return err('Do not use the secret word itself.');
  while (p.clues.length < P.lap - 1) p.clues.push('');
  p.clues[P.lap - 1] = t;
  advanceTurn(P, now); // move on at once, no waiting for a tick
  return ok();
}

function skipTurn(P, now) {
  if (P.phase !== 'clue') return err('Nothing to skip.');
  const cur = byId(P, P.order[P.turn]);
  if (cur) { while (cur.clues.length < P.lap) cur.clues.push(''); }
  advanceTurn(P, now);
  return ok();
}

function submitVote(P, pid, target) {
  if (P.phase !== 'vote' || !P.alive.includes(pid)) return err('You cannot vote right now.');
  const p = byId(P, pid);
  if (target === '' || target === null) { p.vote = { l: P.lap, t: '' }; return ok(); }
  if (target === pid || !P.alive.includes(target) || !byId(P, target)) return err('Pick another player.');
  // tapping the same choice again takes the vote back to "no vote yet"
  p.vote = (p.vote && p.vote.l === P.lap && p.vote.t === target) ? { l: P.lap, t: '' } : { l: P.lap, t: target };
  return ok();
}

function endVote(P, now) {
  if (P.phase !== 'vote') return;
  const al = aliveIds(P), counts = {};
  al.forEach((id) => { counts[id] = 0; });
  al.forEach((id) => {
    const v = byId(P, id).vote;
    if (v && v.l === P.lap && v.t && v.t !== id && counts[v.t] !== undefined) counts[v.t]++;
  });
  const need = Math.floor(al.length / 2) + 1;
  let out = null;
  al.forEach((id) => { if (counts[id] >= need) out = id; });
  P.phase = 'tally'; P.voteEnd = 0; P.nextAt = now + TALLY_MS;
  P.tally = { lap: P.lap, ids: al, counts, need, out, wasImp: out === P.imp, n: al.length };
}

function afterTally(P, now) {
  const T = P.tally;
  if (P.phase !== 'tally' || !T) return;
  if (T.out) {
    if (T.wasImp) {
      P.phase = 'guess'; P.nextAt = 0; P.guessEnd = P.settings.clueSec ? now + P.settings.clueSec * 1000 : 0;
      return;
    }
    const al = P.alive.filter((id) => id !== T.out && byId(P, id));
    if (al.length <= 2) { P.alive = al; finishRound(P, 'imp', 'two-left'); return; }
    P.alive = al;
  }
  P.phase = 'clue'; P.nextAt = 0; P.lap += 1; P.turn = Math.max(0, firstAlive(P, 0)); P.turnEnd = clueDeadline(P, now);
}

function submitGuess(P, pid, text) {
  if (P.phase !== 'guess' || pid !== P.imp) return err('You cannot guess now.');
  const p = byId(P, pid);
  if (p.guess) return err('You already guessed.');
  p.guess = { t: String(text || '').trim().slice(0, 40) };
  finishGuess(P);
  return ok();
}

function finishGuess(P) {
  if (P.phase !== 'guess') return;
  const ip = byId(P, P.imp), t = ip && ip.guess ? ip.guess.t : '';
  if (isMatch(t, P.secret.word)) finishRound(P, 'imp', 'stolen', t);
  else finishRound(P, 'crew', 'caught', t);
}

function finishRound(P, win, reason, guess) {
  if (P.phase === 'result' || P.phase === 'lobby') return;
  const pts = {};
  P.players.forEach((p) => {
    const imp = p.id === P.imp;
    const g = win === 'imp' ? (imp ? 2 : 0) : (imp ? 0 : 1);
    pts[p.id] = g; P.scores[p.id] = (P.scores[p.id] || 0) + g;
  });
  P.result = { win, reason, imp: P.imp, word: P.secret.word, cat: P.secret.cat, hint: P.secret.hint || '', guess: guess || '', pts };
  P.phase = 'result'; P.turnEnd = P.voteEnd = P.nextAt = P.guessEnd = 0;
}

/* Not reachable from players (not even the host): the server clock moves the game on. Kept for tests. */
function forceNext(P, now) {
  if (P.phase === 'deal') { startClues(P, now); return ok(); }
  if (P.phase === 'vote') { endVote(P, now); return ok(); }
  if (P.phase === 'tally') { afterTally(P, now); return ok(); }
  if (P.phase === 'guess') { finishGuess(P); return ok(); }
  return err('Nothing to continue.');
}

/* ---------- people leaving ---------- */
function removePlayer(P, pid, now) {
  const idx = P.players.findIndex((p) => p.id === pid);
  if (idx < 0) return;
  P.players.splice(idx, 1);
  P.alive = P.alive.filter((id) => id !== pid);
  delete P.scores[pid];
  if (P.hostId === pid) electHost(P);
  checkEnd(P);
}
function electHost(P) {
  const next = P.players.filter((p) => p.connected).sort((a, b) => a.joined - b.joined)[0]
    || P.players.slice().sort((a, b) => a.joined - b.joined)[0];
  if (next) P.hostId = next.id;
}
function checkEnd(P) {
  if (!inRound(P)) return;
  if (!byId(P, P.imp)) { finishRound(P, 'crew', 'left'); return; }
  if ((P.phase === 'clue' || P.phase === 'vote') && aliveIds(P).length <= 2) finishRound(P, 'imp', 'two-left');
}

/* ---------- the clock: called every 500 ms and after every action ---------- */
function away(p, now, ms) { return !p.connected && p.discAt && now - p.discAt > ms; }

function drive(P, now) {
  let changed = false;
  for (let guard = 0; guard < 8; guard++) {
    const before = JSON.stringify([P.phase, P.lap, P.turn, P.alive, P.hostId, P.players.length]);
    step(P, now);
    if (before === JSON.stringify([P.phase, P.lap, P.turn, P.alive, P.hostId, P.players.length])) break;
    changed = true;
  }
  return changed;
}

function step(P, now) {
  checkEnd(P);
  // the host is away for a while: hand the party to someone who is here
  const host = byId(P, P.hostId);
  if ((!host || away(host, now, 15000)) && P.players.some((p) => p.connected && p.id !== P.hostId)) electHost(P);
  switch (P.phase) {
    case 'lobby':
    case 'result':
      // players who stay gone for a minute are dropped between rounds
      P.players.filter((p) => away(p, now, 60000)).forEach((p) => removePlayer(P, p.id, now));
      break;
    case 'deal': {
      if (P.players.length < MIN_PLAYERS) { toLobby(P); break; }
      const here = P.players.filter((p) => p.connected);
      if ((here.length && here.every((p) => p.ready === P.round)) || (P.dealEnd && now > P.dealEnd)) startClues(P, now);
      break;
    }
    case 'clue': {
      const cur = byId(P, P.order[P.turn]);
      const sent = cur && cur.clues.length >= P.lap;
      if (!cur || sent) { advanceTurn(P, now); break; }
      if ((P.turnEnd && now > P.turnEnd) || away(cur, now, AWAY_SKIP_MS)) skipTurn(P, now);
      break;
    }
    case 'vote': {
      const al = aliveIds(P).map((id) => byId(P, id));
      const here = al.filter((p) => p.connected);
      const responded = (p) => p.vote && p.vote.l === P.lap;
      const allIn = here.length > 0 && here.every(responded);
      if (allIn || (P.voteEnd && now > P.voteEnd)) endVote(P, now);
      break;
    }
    case 'tally':
      if (P.nextAt && now > P.nextAt) afterTally(P, now);
      break;
    case 'guess': {
      const ip = byId(P, P.imp);
      if (!ip || ip.guess || (P.guessEnd && now > P.guessEnd) || away(ip, now, AWAY_SKIP_MS)) finishGuess(P);
      break;
    }
  }
  // players who stay gone for 3 minutes in the middle of a round leave the party
  if (inRound(P)) P.players.filter((p) => away(p, now, 180000)).forEach((p) => removePlayer(P, p.id, now));
}

/* ---------- what each player is allowed to see ---------- */
function viewFor(P, pid, now) {
  const isImp = P.imp === pid && P.phase !== 'lobby';
  const hintsOn = P.settings.hint !== false;
  let secret = null;
  if (inRound(P) && P.secret) {
    secret = isImp
      ? { word: '', cat: hintsOn ? P.secret.cat : '', hint: hintsOn ? P.secret.hint : '' }
      : { word: P.secret.word, cat: P.secret.cat, hint: '' };
  }
  const showImp = isImp || P.phase === 'guess' || P.phase === 'result';
  const party = {
    code: P.code, host: P.hostId, phase: P.phase, round: P.round, lap: P.lap, turn: P.turn,
    order: P.order, alive: P.alive, settings: P.settings,
    turnEnd: P.turnEnd, voteEnd: P.voteEnd, nextAt: P.nextAt, guessEnd: P.guessEnd,
    tally: P.tally, result: P.result, scores: P.scores,
    imp: showImp ? P.imp : null, secret, now
  };
  const players = P.players.map((p) => {
    let v = null, g = null;
    if (P.phase === 'vote' && p.vote && p.vote.l === P.lap) v = { r: P.round, l: P.lap, t: p.id === pid ? p.vote.t : '?' };
    if (p.guess) g = { r: P.round, t: p.id === pid || P.phase === 'result' ? p.guess.t : '' };
    return { id: p.id, name: p.name, connected: p.connected, joined: p.joined,
      cl: { r: P.round, a: p.clues }, v, g, rdy: p.ready };
  });
  return { me: pid, party, players };
}

module.exports = {
  MAX_PLAYERS, MIN_PLAYERS, CLUE_TIMES, VOTE_TIMES, TALLY_MS,
  genCode, newId, cleanName, newPlayer, newParty, byId, uniqueName,
  setSettings, startRound, toLobby, setReady, startClues, submitClue, skipTurn, submitVote,
  submitGuess, forceNext, removePlayer, electHost, drive, viewFor, aliveIds
};
