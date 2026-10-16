# Wordfox online

A family-friendly **Imposter word party game**. Play on one phone (pass and play) or online, each player on their own phone, with a party code or an invite link.

* **Page:** plain HTML, CSS and JavaScript in `public/` (no build step).
* **Server:** Node.js with Express and Socket.IO. It runs all the game rules.
* **Database:** MongoDB Atlas. Parties are saved so a restart does not lose a game in progress.
* **Host:** Render.

## Why it is secure

The server decides everything. A phone only asks ("I send this clue", "I vote for Sam") and shows what the server sends back.

* The secret word and who the imposter is are kept on the server. Crew phones receive the word, the imposter's phone receives only the category and hint, and nobody receives the imposter's identity until they are caught or the round ends. Opening developer tools shows nothing extra.
* Votes are private until the tally. Other players only see that you voted, not who for.
* The server checks every request: whose turn it is, host-only actions, input length, one word per clue, the secret word cannot be used as a clue.
* Player identity is a random secret token kept in the phone's local storage. The server stores only a hash of it. Someone who does not have your token cannot take your seat.
* Rate limits (per phone and per network), a cap on parties, small message sizes, security headers and a content security policy that only allows scripts from your own site.
* Parties untouched for 24 hours are deleted by MongoDB automatically.

## Project layout

```
server.js        wiring: Express + Socket.IO + MongoDB
lib/game.js      the game rules (turns, voting, majority, scoring, timers)
lib/hub.js       parties, players, requests, rate limits
lib/store.js     saving parties in MongoDB
public/          the web page (index.html, app.js, words.js)
test/            tests for the rules and the party handling (npm test)
```

Words live in `public/words.js` (11 categories, 200+ words each, every word has an imposter hint). Add or edit words there. Both the page and the server use that one file.

## Run it on your computer (optional)

1. Install Node.js 20 or newer.
2. In this folder: `npm install`
3. Copy `.env.example` to `.env` and paste your MongoDB connection string. (Without it the game still runs, but parties live in memory only.)
4. `npm run dev` and open http://localhost:3000
5. To try online mode alone, open the page in two or three different browser windows (use a private window for each, because the player identity is stored per browser).

`npm test` runs the rule and party tests (no database needed).

## Deploy: MongoDB Atlas

1. In Atlas, open your cluster. **Database Access** > **Add New Database User**. Make a username and a strong password (letters and numbers are easiest). Give it **Read and write to any database**.
2. **Network Access** > **Add IP Address** > **Allow access from anywhere** (`0.0.0.0/0`). Render's addresses change, and the password protects the database.
3. **Connect** > **Drivers** > copy the connection string. It looks like `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`. Put your real password in place of `PASSWORD`. If the password has symbols such as `@` or `#`, replace them with their URL codes (`%40`, `%23`) or choose a simpler password.

The server creates the `wordfox` database and a `parties` collection by itself.

## Deploy: Render

1. Put this folder in a GitHub repository (the files inside this folder at the top level: `server.js`, `package.json`, `lib`, `public`...). Do **not** upload `node_modules` or `.env`. The included `.gitignore` handles that.
2. In Render: **New** > **Web Service** > connect the repository.
3. Settings:
   * **Runtime:** Node
   * **Build command:** `npm install`
   * **Start command:** `node server.js`
   * **Health check path:** `/healthz`
4. **Environment** > add `MONGODB_URI` with your connection string. (Optional: `MONGODB_DB=wordfox`.)
5. Deploy. Open your `https://something.onrender.com` address and test: create a party, open the invite link in another browser, play.

`render.yaml` is included if you prefer a Blueprint.

Invite links are the page address plus `#CODE`, so they use your Render address (or your own domain if you add one in Render's **Custom Domains**) automatically.

### Good to know

* **Free plan sleeps.** After about 15 minutes with no visitors the free service sleeps, and the next visit takes 30 to 50 seconds to wake up. Games in progress are restored from MongoDB, players reconnect on their own. A paid instance (about 7 USD a month) never sleeps.
* **One server instance.** Live games are kept in the memory of one server, which is right for this game. Do not scale to several instances, because players of one party must reach the same server.
* **Capacity.** The messages are tiny. One small instance can hold hundreds of parties at the same time.
* **If a phone loses signal** the game waits: that player's turn is skipped after 20 seconds, they can reconnect at any time and get their seat back (it is matched by the token in their browser). After 3 minutes away during a round they are removed. If the host goes away for 15 seconds the host role moves to another player.
* **Joining:** new players can join only in the lobby or between rounds.

## Rules in this version

* The server gives the crew a secret word. The imposter gets the category and a loose hint word.
* Players take turns writing one clue word each lap (30, 45, 60 seconds or no timer). All clues are visible.
* After each lap there is a vote (30, 60, 90 seconds or no timer). Voting is optional.
* A player is out only with **more than half** of the players still in. With no majority another lap starts.
* Nobody, not even the host, can skip a turn or end a vote early. Timers and players decide.
* The host can remove a player in the lobby or between rounds (not mid-round). A removed phone cannot rejoin that party.
* If someone never taps ready on the word screen, the clues start by themselves after 45 seconds. After a vote the next lap starts automatically.
* Crew win by voting out the imposter, but the caught imposter gets one guess at the word to steal the win.
* The imposter wins when only two players are left.
* Scoring: crew +1 each on a crew win, imposter +2 on an imposter win.

## Troubleshooting

* **"Could not reach the game server"** on the page: the server is asleep or still starting. Wait a minute and reload. Check the Render logs.
* **Logs say "MONGODB_URI is not set" or "could not connect"**: the game still works but parties are not saved. Check the variable name, the password, and that Atlas Network Access allows your connection.
* **Party codes work but nobody can join from a link**: make sure the whole address, including the `#CODE` part, was copied.
