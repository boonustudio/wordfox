'use strict';
/*
 * The hub holds every live party and answers what phones ask for.
 * It talks to the network only through the small transport object T, so it can be tested
 * without a real server:  T.emitTo(socketId, event, data), T.emitRoom(room, event, data), T.getSocket(socketId).
 */
const crypto = require('crypto');
const Game = require('./game');

function createHub(T, store, opts) {
  opts = opts || {};
  const MAX_PARTIES = Number(opts.maxParties || 2000);

  /* ---------- state ---------- */
  const parties = new Map(); // code -> party
  const sockets = new Map(); // socket.id -> { code, pid }
  const saveTimers = new Map();

  function hashToken(t) { return crypto.createHash('sha256').update(String(t)).digest('hex'); }
  function validToken(t) { return typeof t === 'string' && /^[a-f0-9]{32,64}$/.test(t); }
  function validCode(c) { return typeof c === 'string' && /^[A-Z0-9]{5}$/.test(c); }

  /* ---------- small rate limiters ---------- */
  function bucket(limit, windowMs) {
    const hits = new Map();
    const fn = (key) => {
      const now = Date.now();
      const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
      if (arr.length >= limit) { hits.set(key, arr); return false; }
      arr.push(now); hits.set(key, arr);
      return true;
    };
    fn.sweep = () => {
      const now = Date.now();
      for (const [k, arr] of hits) { if (!arr.length || now - arr[arr.length - 1] > windowMs) hits.delete(k); }
    };
    return fn;
  }
  const createLimit = bucket(15, 60 * 60 * 1000);  // 15 new parties per IP per hour
  const joinLimit = bucket(40, 10 * 60 * 1000);    // 40 join tries per IP per 10 minutes
  const eventLimit = bucket(40, 10 * 1000);        // 40 events per socket per 10 seconds
  const chatLimit = bucket(6, 5 * 1000);           // 6 chat messages per socket per 5 seconds
  function sweepLimits() { createLimit.sweep(); joinLimit.sweep(); eventLimit.sweep(); chatLimit.sweep(); }

  function ipOf(socket) {
    // behind Render's proxy the visitor's address is the first entry of X-Forwarded-For
    const xf = socket.handshake && socket.handshake.headers && socket.handshake.headers['x-forwarded-for'];
    if (xf) { const parts = String(xf).split(',').map((x) => x.trim()).filter(Boolean); return parts[0] || 'unknown'; }
    return (socket.handshake && socket.handshake.address) || 'unknown';
  }

  /* ---------- sending state ---------- */
  function broadcast(P) {
    const now = Date.now();
    P.players.forEach((p) => {
      if (p.sid && p.connected) T.emitTo(p.sid, 'state', Game.viewFor(P, p.id, now));
    });
  }
  function scheduleSave(P) {
    P.updated = Date.now();
    if (saveTimers.has(P.code)) return;
    saveTimers.set(P.code, setTimeout(() => { saveTimers.delete(P.code); store.save(P); }, 1500));
  }
  function commit(P) {
    Game.drive(P, Date.now());
    broadcast(P);
    scheduleSave(P);
  }
  function destroyParty(code) {
    const P = parties.get(code);
    if (!P) return;
    P.players.forEach((p) => { if (p.sid) T.emitTo(p.sid, 'closed'); });
    parties.delete(code);
    clearTimeout(saveTimers.get(code)); saveTimers.delete(code);
    store.remove(code);
  }

  /* ---------- socket handlers ---------- */
  function ctx(socket) {
    const c = sockets.get(socket.id);
    if (!c) return null;
    const P = parties.get(c.code);
    if (!P) return null;
    const me = Game.byId(P, c.pid);
    return me ? { P, me } : null;
  }
  function attach(socket, P, me) {
    me.sid = socket.id; me.connected = true; me.discAt = 0; P.emptySince = 0;
    sockets.set(socket.id, { code: P.code, pid: me.id });
    socket.join(P.code);
    socket.emit('chat:history', P.chat);
  }

  function onConnection(socket) {
    // wrap each event: rate limit, catch errors, always answer through the ack
    function on(event, fn, opts) {
      socket.on(event, (data, ack) => {
        if (typeof ack !== 'function') ack = () => {};
        try {
          if (!eventLimit(socket.id)) return ack({ err: 'Slow down a little.' });
          if (data !== undefined && data !== null && typeof data !== 'object') return ack({ err: 'Bad request.' });
          data = data || {};
          let c = null;
          if (!(opts && opts.open)) {
            c = ctx(socket);
            if (!c) return ack({ err: 'You are not in a party.', gone: true });
            if (opts && opts.host && c.P.hostId !== c.me.id) return ack({ err: 'Only the host can do that.' });
          }
          const res = fn(data, c, ack) || { ok: true };
          if (c && !res.err) commit(c.P);
          ack(res);
        } catch (e) {
          console.error('[socket]', event, e && e.message);
          ack({ err: 'Something went wrong. Try again.' });
        }
      });
    }

    on('party:create', (d) => {
      const name = Game.cleanName(d.name);
      if (!name) return { err: 'Enter your name first.' };
      if (!validToken(d.token)) return { err: 'Bad session. Reload the page.' };
      if (!createLimit(ipOf(socket))) return { err: 'Too many parties from your network. Try again later.' };
      if (parties.size >= MAX_PARTIES) return { err: 'The server is full right now. Try again soon.' };
      leaveCurrent(socket);
      let code; do { code = Game.genCode(); } while (parties.has(code));
      const me = Game.newPlayer(name, hashToken(d.token), Date.now());
      const P = Game.newParty(code, me, Date.now());
      parties.set(code, P);
      attach(socket, P, me);
      commit(P);
      return { ok: true, code, id: me.id };
    }, { open: true });

    on('party:join', (d) => {
      if (!joinLimit(ipOf(socket))) return { err: 'Too many tries. Wait a few minutes.' };
      const code = String(d.code || '').toUpperCase();
      if (!validCode(code)) return { err: 'Enter the 5-character party code.' };
      if (!validToken(d.token)) return { err: 'Bad session. Reload the page.' };
      const P = parties.get(code);
      if (!P) return { err: 'No party with that code. Check it and try again.', gone: true };
      const th = hashToken(d.token);
      let me = P.players.find((p) => p.tokenHash === th);
      if (me) { // same phone coming back: take the seat again
        if (me.sid && me.sid !== socket.id) { sockets.delete(me.sid); T.emitTo(me.sid, 'replaced'); }
        leaveCurrent(socket, P.code);
        attach(socket, P, me);
        commit(P);
        return { ok: true, code, id: me.id };
      }
      if ((P.banned || []).includes(th)) return { err: 'You were removed from that party.' };
      const name = Game.cleanName(d.name);
      if (!name) return { err: 'Enter your name first.' };
      if (P.phase !== 'lobby' && P.phase !== 'result') return { err: 'That game is already in progress. Join between rounds.' };
      if (P.players.length >= Game.MAX_PLAYERS) return { err: 'That party is full (12 players).' };
      leaveCurrent(socket);
      me = Game.newPlayer(Game.uniqueName(P, name), th, Date.now());
      P.players.push(me);
      attach(socket, P, me);
      commit(P);
      return { ok: true, code, id: me.id };
    }, { open: true });

    on('party:leave', (d, c) => { leaveCurrent(socket); return { ok: true, noCommit: true }; }, { open: true });

    on('settings', (d, c) => Game.setSettings(c.P, d), { host: true });
    on('kick', (d, c) => {
      if (typeof d.id !== 'string' || d.id === c.me.id) return { err: 'Bad request.' };
      if (c.P.phase !== 'lobby' && c.P.phase !== 'result') return { err: 'You can remove players only in the lobby or between rounds.' };
      const t = Game.byId(c.P, d.id);
      if (!t) return { ok: true };
      (c.P.banned = c.P.banned || []).push(t.tokenHash); // a removed player cannot walk back in with the same phone
      if (t.sid) { sockets.delete(t.sid); T.emitTo(t.sid, 'kicked'); const s = T.getSocket(t.sid); if (s) s.leave(c.P.code); }
      Game.removePlayer(c.P, t.id, Date.now());
      return { ok: true };
    }, { host: true });
    on('start', (d, c) => Game.startRound(c.P, Date.now()), { host: true });
    on('lobby', (d, c) => Game.toLobby(c.P), { host: true });
    on('next', (d, c) => Game.startRound(c.P, Date.now()), { host: true });

    on('ready', (d, c) => Game.setReady(c.P, c.me.id));
    on('clue', (d, c) => Game.submitClue(c.P, c.me.id, String(d.text || '').slice(0, 60), Date.now()));
    on('vote', (d, c) => Game.submitVote(c.P, c.me.id, typeof d.target === 'string' ? d.target : ''));
    on('guess', (d, c) => Game.submitGuess(c.P, c.me.id, String(d.text || '').slice(0, 60)));

    on('chat', (d, c) => {
      if (!chatLimit(socket.id)) return { err: 'You are sending messages too fast.' };
      const t = String(d.text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 300);
      if (!t) return { err: 'Type a message first.' };
      const msg = { n: c.me.name, t, id: c.me.id, at: Date.now() };
      c.P.chat.push(msg); if (c.P.chat.length > 60) c.P.chat.shift();
      T.emitRoom(c.P.code, 'chat', msg);
      return { ok: true };
    });

    socket.on('disconnect', () => { handleDisconnect(socket); });
  }

  function leaveCurrent(socket, exceptCode) {
    const c = sockets.get(socket.id);
    if (!c) return;
    sockets.delete(socket.id);
    const P = parties.get(c.code);
    socket.leave(c.code);
    if (!P || P.code === exceptCode) return;
    const me = Game.byId(P, c.pid);
    if (!me) return;
    Game.removePlayer(P, me.id, Date.now());
    if (!P.players.length) destroyParty(P.code);
    else commit(P);
  }

  function handleDisconnect(socket) {
    const c = sockets.get(socket.id);
    sockets.delete(socket.id);
    if (!c) return;
    const P = parties.get(c.code);
    const me = P && Game.byId(P, c.pid);
    if (!me || me.sid !== socket.id) return; // the seat already moved to a newer connection
    me.connected = false; me.discAt = Date.now(); me.sid = null;
    if (!P.players.some((p) => p.connected)) P.emptySince = Date.now();
    commit(P);
  }

  /* ---------- the clock: deadlines, away players, empty parties ---------- */
  function tick(nowOverride) {
    const now = nowOverride || Date.now();
    for (const P of parties.values()) {
      try {
        if (!P.players.length || (P.emptySince && now - P.emptySince > 15 * 60 * 1000)) { destroyParty(P.code); continue; }
        const before = JSON.stringify([P.phase, P.lap, P.turn, P.hostId, P.players.length]);
        Game.drive(P, now);
        if (before !== JSON.stringify([P.phase, P.lap, P.turn, P.hostId, P.players.length])) { broadcast(P); scheduleSave(P); }
      } catch (e) { console.error('[tick]', P.code, e && e.message); }
    }
  }



  function restore(list) {
    let n = 0;
    (list || []).forEach((P) => {
      if (!P || !P.code || !Array.isArray(P.players)) return;
      P.players.forEach((p) => { p.connected = false; p.discAt = Date.now(); p.sid = null; });
      P.emptySince = Date.now();
      parties.set(P.code, P); n++;
    });
    return n;
  }
  async function flush() {
    for (const t of saveTimers.values()) clearTimeout(t);
    saveTimers.clear();
    await Promise.all([...parties.values()].map((P) => store.save(P)));
  }
  return { onConnection, tick, sweepLimits, restore, flush, parties };
}

module.exports = { createHub };
