'use strict';
/*
 * Wordfox online server: Express (serves the page) + Socket.IO (live play) + MongoDB (saved parties).
 * The server decides everything. Phones only send requests ("I send this clue") and display what
 * the server sends back, so the secret word and the imposter's identity never reach a phone
 * that is not supposed to see them.
 * This file is only wiring. The game rules are in lib/game.js and the party handling is in lib/hub.js.
 */
const path = require('path');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const { Server } = require('socket.io');
const { createHub } = require('./lib/hub');
const store = require('./lib/store');

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || ''; // leave empty when the page and server share one address

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'wss:', 'ws:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"]
    }
  }
}));
app.get('/healthz', (req, res) => res.type('text').send('ok'));
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache') // always revalidate so updates show immediately
}));

const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 10 * 1024,
  pingInterval: 10000,
  pingTimeout: 12000,
  cors: ALLOWED_ORIGIN ? { origin: ALLOWED_ORIGIN } : undefined
});

const hub = createHub({
  emitTo: (sid, event, data) => io.to(sid).emit(event, data),
  emitRoom: (room, event, data) => io.to(room).emit(event, data),
  getSocket: (sid) => io.sockets.sockets.get(sid)
}, store, { maxParties: process.env.MAX_PARTIES });

io.on('connection', (socket) => hub.onConnection(socket));
setInterval(() => hub.tick(), 500);
setInterval(() => hub.sweepLimits(), 60 * 1000).unref();

async function main() {
  try { await store.connect(process.env.MONGODB_URI, process.env.MONGODB_DB); }
  catch (e) { console.error('[store] could not connect to MongoDB, running in memory only:', e.message); }
  const restored = hub.restore(await store.loadRecent(6 * 60 * 60 * 1000));
  if (restored) console.log('[store] restored', restored, 'parties');
  server.listen(PORT, () => console.log('Wordfox online listening on port ' + PORT));
}

async function shutdown() {
  console.log('Shutting down, saving parties...');
  await hub.flush();
  await store.close();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e && e.message));

main();
