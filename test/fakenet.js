'use strict';
/* A tiny in-memory stand-in for Socket.IO so the hub can be tested without a network. */
const { EventEmitter } = require('events');
let nextId = 1;
class FakeSocket {
  constructor(net, ip) {
    this.id = 'S' + (nextId++); this.net = net; this.handlers = {}; this.rooms = new Set(); this.inbox = [];
    this.handshake = { headers: {}, address: ip || '1.1.1.' + this.id.slice(1) };
    this.listeners = new EventEmitter();
    net.sockets.set(this.id, this);
  }
  on(ev, fn) { this.handlers[ev] = fn; }
  join(r) { this.rooms.add(r); }
  leave(r) { this.rooms.delete(r); }
  // server -> client
  emit(ev, data) { this.receive(ev, data); }
  receive(ev, data) { this.inbox.push({ ev, data }); this.listeners.emit(ev, data); }
  // client -> server (returns the ack)
  call(ev, data) {
    return new Promise((resolve) => {
      const h = this.handlers[ev];
      if (!h) return resolve({ err: 'no handler ' + ev });
      h(data, resolve);
    });
  }
  disconnect() { const h = this.handlers.disconnect; this.net.sockets.delete(this.id); if (h) h(); }
  last(ev) { for (let i = this.inbox.length - 1; i >= 0; i--) if (this.inbox[i].ev === ev) return this.inbox[i].data; return null; }
}
class FakeNet {
  constructor() { this.sockets = new Map(); }
  transport() {
    return {
      emitTo: (sid, ev, data) => { const s = this.sockets.get(sid); if (s) s.receive(ev, data); },
      emitRoom: (room, ev, data) => { for (const s of this.sockets.values()) if (s.rooms.has(room)) s.receive(ev, data); },
      getSocket: (sid) => this.sockets.get(sid)
    };
  }
  connect(hub, ip) { const s = new FakeSocket(this, ip); hub.onConnection(s); return s; }
}
module.exports = { FakeNet, FakeSocket };
