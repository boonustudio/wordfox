(function(){
'use strict';

/* ======================================================================
   1. DATA — categories, words, icons, how-to text
   ====================================================================== */
var CATEGORIES=WF_WORDS.CATEGORIES;
var MAX_PLAYERS=12,MIN_PLAYERS=3;
var TIMES=[1,2,3,5];
var USED={}; /* words already played this session, never cleared until the list runs out */

var ICONS={
 back:'<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
 play:'<polygon points="6 3 20 12 6 21 6 3"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
 eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 eyeOff:'<path d="M9.9 4.24A9.1 9.1 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.39-1.61"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="m2 2 20 20"/>',
 clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 vote:'<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
 crown:'<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/>',
 refresh:'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
 trophy:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
 star:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
 settings:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 minus:'<path d="M5 12h14"/>',
 trash:'<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
 share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 help:'<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
 check:'<path d="M20 6 9 17l-5-5"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 paw:'<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
 food:'<path d="M12 7c-1.5-2-5-2-6.5 1C4 11 5.5 17 8 19c1.5 1 2.5 1 4 0 1.5 1 2.5 1 4 0 2.5-2 4-8 2.5-11C17 5 13.5 5 12 7z"/><path d="M12 7c0-2 1-3 3-4"/>',
 pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
 briefcase:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
 ball:'<circle cx="12" cy="12" r="10"/><path d="M5 5c4 3 4 11 0 14M19 5c-4 3-4 11 0 14M2 12h20"/>',
 key:'<path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-3 3m-2-1 3 3"/>',
 landmark:'<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2 3 7h18L12 2z"/>',
 mountain:'<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
 sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
 chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
 send:'<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
 copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
 smile:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>',
 laugh:'<circle cx="12" cy="12" r="10"/><path d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5z"/><path d="M9 9h.01M15 9h.01"/>',
 film:'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4"/>',
 x:'<path d="M18 6 6 18M6 6l12 12"/>'
};
function icon(n,s){s=s||24;return '<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[n]||'')+'</svg>';}
var LOGO='<svg width="36" height="36" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lgr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#e11d48"/></linearGradient></defs><circle cx="20" cy="20" r="19" fill="url(#lgr)"/><path d="M7.5 20s4.6-7.5 12.5-7.5S32.5 20 32.5 20 27.9 27.5 20 27.5 7.5 20 7.5 20z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/><circle cx="20" cy="20" r="4.4" fill="#fff"/><circle cx="21.6" cy="18.4" r="1.4" fill="#e11d48"/></svg>';
var WATERMARK='<svg class="wm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS.eye+'</svg>';

var HOWTO=[
 ['users','Add the players','Enter 3 to 12 names, pick a category and set the discussion time.'],
 ['eye','Check your role in secret','Pass the phone. Press and hold the card to see your word. Let go to hide it. The imposter sees no word.'],
 ['clock','Give one-word clues','Take turns saying one word that hints at the secret word. Imposters must bluff without giving themselves away.'],
 ['vote','Vote','Everyone votes in secret, or the group picks together. The most votes are accused.'],
 ['trophy','Reveal and score','Crew +1 each if every imposter is caught. Imposter +2 if not caught. A caught imposter can still steal the win (+2) by guessing the word.']
];

/* ======================================================================
   2. STATE — settings (persisted) and game (in memory)
   ====================================================================== */
var KEY='wordfox.v1';
var app=document.getElementById('app');
var cfg=defaults();
var S={screen:'setup',prev:'setup',confirm:null,shareText:null,mode:'offline'};
var G=null;
var tickH=null,holding=false;

function defaults(){return {players:['Player 1','Player 2','Player 3'],imposters:1,minutes:2,cats:CATEGORIES.map(function(c){return c.id}),seesCat:true};}
function load(){
  try{
    var r=localStorage.getItem(KEY); if(!r)return;
    var o=JSON.parse(r); if(!o||typeof o!=='object')return;
    var d=defaults();
    if(Array.isArray(o.players)){var p=o.players.filter(function(x){return typeof x==='string'}).slice(0,MAX_PLAYERS);while(p.length<MIN_PLAYERS)p.push('Player '+(p.length+1));d.players=p;}
    if(o.imposters===2)d.imposters=2;
    if(TIMES.indexOf(o.minutes)>-1)d.minutes=o.minutes;
    if(Array.isArray(o.cats)){var c=o.cats.filter(function(x){return CATEGORIES.some(function(k){return k.id===x})});if(c.length)d.cats=c;}
    if(typeof o.seesCat==='boolean')d.seesCat=o.seesCat;
    if(d.players.length<5)d.imposters=1;
    cfg=d;
  }catch(e){}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(cfg));}catch(e){}}

/* ======================================================================
   3. HELPERS
   ====================================================================== */
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function rnd(n){return Math.floor(Math.random()*n);}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=rnd(i+1),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function fmt(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function norm(s){return String(s).toLowerCase().replace(/[^a-z0-9]/g,'');}
function buzz(p){try{if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}
function toast(m){var t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},2200);}
function catById(id){return CATEGORIES.filter(function(c){return c.id===id})[0];}
function wordCount(){var n=0;CATEGORIES.forEach(function(c){if(cfg.cats.indexOf(c.id)>-1)n+=c.words.length;});return n;}
function pname(id){for(var i=0;i<G.players.length;i++)if(G.players[i].id===id)return G.players[i].name;return '';}

/* pick a word that has not been used this session; reset when the pool is exhausted */
function pickWord(catIds){
  var pool=[];
  CATEGORIES.forEach(function(c){if(catIds.indexOf(c.id)>-1)c.words.forEach(function(w){pool.push({w:w,c:c.name});});});
  var avail=pool.filter(function(p){return !USED[p.w];});
  var reshuffled=false;
  if(!avail.length){pool.forEach(function(p){delete USED[p.w];});avail=pool;reshuffled=true;}
  var p=avail[rnd(avail.length)];
  USED[p.w]=1;
  return {word:p.w,cat:p.c,reshuffled:reshuffled};
}

function go(s){
  if(S.screen==='discuss')stopTick();
  holding=false;
  S.screen=s;S.shareText=null;
  render();
  try{window.scrollTo(0,0);}catch(e){}
}

/* ======================================================================
   4. GAME LOGIC
   ====================================================================== */
function startGame(){
  var seen={},players=[];
  cfg.players.forEach(function(raw,i){
    var n=String(raw).trim()||('Player '+(i+1));
    var base=n,k=2;
    while(seen[n.toLowerCase()]){n=base+' '+k;k++;}
    seen[n.toLowerCase()]=1;
    players.push({id:i,name:n});
  });
  cfg.players=players.map(function(p){return p.name;});
  save();
  G={players:players,scores:{},round:0};
  players.forEach(function(p){G.scores[p.id]=0;});
  startRound();
}
function startRound(){
  G.round++;
  var w=pickWord(cfg.cats);
  if(w.reshuffled)toast('All words used. Starting the list again.');
  var ids=G.players.map(function(p){return p.id;});
  var n=Math.min(cfg.imposters,Math.max(1,Math.floor((ids.length-1)/2)));
  G.imps=shuffle(ids).slice(0,n);
  G.word=w.word;G.cat=w.cat;
  G.idx=0;G.viewed=false;
  G.starter=G.players[rnd(G.players.length)].id;
  G.timer=null;G.vote=null;G.res=null;
  go('reveal');
}
function isImpO(id){return G.imps.indexOf(id)>-1;}

/* timer */
function initTimer(){var t=cfg.minutes*60;G.timer={total:t,end:Date.now()+t*1000,rem:t,paused:false,done:false};}
function timerRem(){var t=G.timer;return t.paused?t.rem:Math.max(0,Math.ceil((t.end-Date.now())/1000));}
function startTick(){stopTick();tick();tickH=setInterval(tick,250);}
function stopTick(){if(tickH){clearInterval(tickH);tickH=null;}}
function tick(){
  if(!G||!G.timer)return;
  var r=timerRem(),t=G.timer;
  var a=document.getElementById('tt'),b=document.getElementById('tb');
  if(a)a.textContent=r>0?fmt(r):"Time's up";
  if(b)b.style.width=(t.total?Math.min(100,r/t.total*100):0)+'%';
  if(r===0&&!t.done){t.done=true;buzz([200,100,200]);}
}

/* voting */
function newVote(mode){return {mode:mode||'group',sel:[],voter:0,stage:'handoff',ballots:[]};}
function needPicks(){return G.vote.mode==='group'?G.imps.length:1;}
function finishVote(){
  var V=G.vote,counts={};
  G.players.forEach(function(p){counts[p.id]=0;});
  if(V.mode==='group'){V.sel.forEach(function(id){counts[id]=1;});}
  else{V.ballots.forEach(function(b){counts[b.pick]+=1;});}
  var n=G.imps.length;
  var sorted=G.players.map(function(p){return {id:p.id,c:counts[p.id]};}).sort(function(a,b){return b.c-a.c;});
  var accused=[],tie=false;
  var cut=sorted[n-1]?sorted[n-1].c:0;
  if(sorted.length>n&&sorted[n].c===cut&&cut>0){
    tie=true;
    accused=sorted.filter(function(x){return x.c>cut;}).map(function(x){return x.id;});
  }else{
    accused=sorted.slice(0,n).filter(function(x){return x.c>0;}).map(function(x){return x.id;});
  }
  var caught=G.imps.filter(function(id){return accused.indexOf(id)>-1;});
  G.res={counts:counts,accused:accused,tie:tie,caught:caught,guesses:{},texts:{},gi:0,stage:'tally',applied:false,pts:{},crewWin:false};
  go('result');
}
function finalizeRound(){
  var R=G.res;
  if(R.applied)return;
  var caughtAll=G.imps.every(function(id){return R.caught.indexOf(id)>-1;});
  var stolen=R.caught.some(function(id){return R.guesses[id]===true;});
  R.crewWin=caughtAll&&!stolen;
  G.players.forEach(function(p){R.pts[p.id]=0;});
  G.imps.forEach(function(id){if(R.caught.indexOf(id)<0||R.guesses[id]===true)R.pts[id]=2;});
  if(R.crewWin)G.players.forEach(function(p){if(!isImpO(p.id))R.pts[p.id]=1;});
  G.players.forEach(function(p){G.scores[p.id]+=R.pts[p.id];});
  R.applied=true;R.stage='final';
  render();
  try{window.scrollTo(0,0);}catch(e){}
}
function scoreText(){
  var rows=G.players.slice().sort(function(a,b){return G.scores[b.id]-G.scores[a.id];});
  return 'Wordfox after round '+G.round+'\n'+rows.map(function(p,i){return (i+1)+'. '+p.name+' - '+G.scores[p.id];}).join('\n');
}

/* ======================================================================
   5. SCREENS — each returns an HTML string
   ====================================================================== */
function hdr(showHow){
  return '<header class="hdr"><div class="logo">'+LOGO+'<span>Word<span class="gt">fox</span></span></div>'+
    (showHow?'<button class="link" data-act="how">'+icon('help',18)+'How to play</button>':'')+'</header>';
}
function top(label,ic,act,extra){
  return '<div class="top"><button class="btn soft slim" data-act="'+act+'">'+icon(ic,20)+label+'</button>'+(extra||'')+'</div>';
}
function badge(t){return '<span class="cnt">'+t+'</span>';}

/* --- setup --- */
function catPicker(sel,tAct,aAct){
  var words=0,n=0;
  CATEGORIES.forEach(function(c){if(sel.indexOf(c.id)>-1){words+=c.words.length;n++;}});
  var all=n===CATEGORIES.length;
  return '<div class="grp"><div class="sec" style="margin:0"><span class="lbl">'+icon('star',16)+'Categories</span><button class="link" data-act="'+aAct+'" data-v="all"'+(all?' disabled':'')+'>Select all</button></div>'+
    '<p class="hint">'+n+' of '+CATEGORIES.length+' selected. Tap a card to switch it on or off.</p>'+
    '<div class="catgrid">'+CATEGORIES.map(function(c){
      var on=sel.indexOf(c.id)>-1;
      return '<button class="cat" data-act="'+tAct+'" data-v="'+c.id+'" aria-pressed="'+on+'"><span class="ct"><span class="ci">'+icon(c.icon,20)+'</span><span class="ck">'+icon('check',14)+'</span></span><span>'+esc(c.name)+'</span></button>';
    }).join('')+'</div></div>';
}
function screenSetup(){
  var n=cfg.players.length;
  var rows=cfg.players.map(function(nm,i){
    return '<div class="prow"><span class="bub">'+(i+1)+'</span>'+
      '<input class="inp pname" id="pn'+i+'" data-i="'+i+'" value="'+esc(nm)+'" maxlength="14" placeholder="Player '+(i+1)+'" autocomplete="off" aria-label="Name of player '+(i+1)+'">'+
      '<button class="iconbtn" data-act="delp" data-i="'+i+'" aria-label="Remove player '+(i+1)+'"'+(n<=MIN_PLAYERS?' disabled':'')+'>'+icon('trash',20)+'</button></div>';
  }).join('');
  var secs=TIMES.map(function(m){return '<button data-act="time" data-v="'+m+'" aria-pressed="'+(cfg.minutes===m)+'">'+m+' min</button>';}).join('');
  return '<section class="screen">'+
    '<div class="hero">'+WATERMARK+'<span class="tag">3 to 12 players · pass and play</span><h1>Who is bluffing?</h1><p>Everyone knows the word except the imposter. Give clues, spot the fake.</p>'+
    '<button class="btn pill" data-act="start">'+icon('play',20)+'Start game</button></div>'+
    modeSeg()+
    '<div class="sec"><span class="lbl">'+icon('users',16)+'Players</span>'+badge(n+' / '+MAX_PLAYERS)+'</div>'+
    '<div class="card"><div class="plist">'+rows+'</div>'+
    '<button class="btn soft" data-act="addp"'+(n>=MAX_PLAYERS?' disabled':'')+'>'+icon('plus',20)+'Add player</button></div>'+
    '<div class="sec"><span class="lbl">'+icon('eyeOff',16)+'Imposters</span></div>'+
    '<div class="seg" role="group" aria-label="Number of imposters"><button data-act="imp" data-v="1" aria-pressed="'+(cfg.imposters===1)+'">1 imposter</button>'+
    '<button data-act="imp" data-v="2" aria-pressed="'+(cfg.imposters===2)+'"'+(n<5?' disabled':'')+'>2 imposters</button></div>'+
    (n<5?'<p class="hint">Two imposters need at least 5 players.</p>':'')+
    catPicker(cfg.cats,'cat','cat')+
    '<div class="sec"><span class="lbl">'+icon('clock',16)+'Discussion time</span></div>'+
    '<div class="seg" role="group" aria-label="Discussion time">'+secs+'</div>'+
    '<div class="row"><span class="bub">'+icon('eye',22)+'</span><div class="t"><b>Imposter sees the category</b><span>A small hint to help them blend in</span></div>'+
    '<button class="sw" role="switch" aria-checked="'+cfg.seesCat+'" aria-label="Imposter sees the category" data-act="seecat"></button></div>'+
    '<div class="foot"><button class="btn primary" data-act="start">'+icon('play',20)+'Start game</button></div>'+
  '</section>';
}

/* --- role reveal --- */
function holdHidden(){
  return '<div class="hold-in"><div class="ring">'+icon('eyeOff',40)+'</div><h2>Press and hold</h2><p class="mute">Hold the card to see your role. Let go to hide it.</p></div>';
}
function holdShown(){
  var id=G.players[G.idx].id;
  if(isImpO(id)){
    return '<div class="hold-in">'+icon('eyeOff',44)+'<div class="word">You are the IMPOSTER</div><p class="sub">'+
      (cfg.seesCat?'Category: <b>'+esc(G.cat)+'</b>. Blend in.':'You do not know the word. Blend in.')+'</p></div>';
  }
  return '<div class="hold-in"><span class="lbl">Secret word</span><div class="word gt">'+esc(G.word)+'</div><span class="chip static">'+esc(G.cat)+'</span></div>';
}
function screenReveal(){
  var p=G.players[G.idx],last=G.idx===G.players.length-1;
  var pips=G.players.map(function(_,i){return '<span class="pip'+(i<G.idx?' on':(i===G.idx?' cur':''))+'"></span>';}).join('');
  return '<section class="screen">'+top('Menu','menu','leave',badge('Round '+G.round))+
    '<div class="pips" aria-label="Player '+(G.idx+1)+' of '+G.players.length+'">'+pips+'</div>'+
    '<div class="card center"><span class="lbl">Pass the phone to</span><h2 class="big gt">'+esc(p.name)+'</h2><p class="mute">Keep the screen hidden from everyone else.</p></div>'+
    '<div class="hold" id="hold" role="button" tabindex="0" aria-label="Hold to reveal your role">'+(G.viewed?'':'')+holdHidden()+'</div>'+
    '<div class="foot"><button class="btn primary" id="nextBtn" data-act="next"'+(G.viewed?'':' disabled')+'>'+(last?'Start discussion':'Pass to next player')+'</button></div>'+
  '</section>';
}
function showRole(on){
  var h=document.getElementById('hold');
  if(h&&S.screen==='oparty'){oShowRole(h,on);return;}
  if(!h||!G)return;
  holding=on;
  var id=G.players[G.idx].id;
  h.classList.toggle('on',on);
  h.classList.toggle('imp',on&&isImpO(id));
  h.innerHTML=on?holdShown():holdHidden();
  if(on&&!G.viewed){G.viewed=true;var nb=document.getElementById('nextBtn');if(nb)nb.disabled=false;}
}

/* --- discussion --- */
function screenDiscuss(){
  var si=0;G.players.forEach(function(p,i){if(p.id===G.starter)si=i;});
  var order=G.players.map(function(_,k){return G.players[(si+k)%G.players.length];});
  var chips=order.map(function(p,k){return '<span class="chip static'+(k===0?' first':'')+'">'+esc(p.name)+'</span>';}).join('');
  var t=G.timer,r=timerRem();
  return '<section class="screen">'+top('Menu','menu','leave',badge('Round '+G.round))+
    '<div class="card center"><span class="lbl">Starts the clues</span><h2 class="big gt">'+esc(pname(G.starter))+'</h2>'+
    '<p class="mute">Then clockwise. One word each.</p><div class="order">'+chips+'</div></div>'+
    '<div class="card center"><span class="lbl">'+icon('clock',16)+'Time left</span><div class="time fh gt" id="tt">'+(r>0?fmt(r):"Time\'s up")+'</div>'+
    '<div class="bar" style="width:100%"><i id="tb" style="width:'+(t.total?Math.min(100,r/t.total*100):0)+'%"></i></div>'+
    '<div class="duo" style="width:100%"><button class="btn soft" data-act="pause">'+(t.paused?icon('play',20)+'Resume':icon('pause',20)+'Pause')+'</button>'+
    '<button class="btn soft" data-act="plus30">'+icon('plus',20)+'30 sec</button></div></div>'+
    '<div class="row"><span class="bub">'+icon('help',22)+'</span><div class="t"><b>Give one-word clues</b><span>Not too obvious, not too vague. Imposters, listen closely.</span></div></div>'+
    '<div class="foot"><button class="btn primary" data-act="tovote">'+icon('vote',20)+'Start voting</button></div>'+
  '</section>';
}

/* --- voting --- */
function screenVote(){
  var V=G.vote,N=needPicks(),started=V.ballots.length>0;
  var seg='<div class="seg" role="group" aria-label="Voting style"><button data-act="vmode" data-v="group" aria-pressed="'+(V.mode==='group')+'"'+(started?' disabled':'')+'>Group pick</button>'+
    '<button data-act="vmode" data-v="secret" aria-pressed="'+(V.mode==='secret')+'"'+(started?' disabled':'')+'>Secret ballots</button></div>';
  var head=top('Menu','menu','leave',badge('Round '+G.round));
  if(V.mode==='secret'&&V.stage==='handoff'){
    var vp=G.players[V.voter];
    var pips=G.players.map(function(_,i){return '<span class="pip'+(i<V.voter?' on':(i===V.voter?' cur':''))+'"></span>';}).join('');
    return '<section class="screen">'+head+(started?'':seg)+'<div class="pips">'+pips+'</div>'+
      '<div class="card center"><span class="lbl">Pass the phone to</span><h2 class="big gt">'+esc(vp.name)+'</h2><p class="mute">Your vote stays secret. Tap below when you hold the phone.</p></div>'+
      '<div class="foot"><button class="btn primary" data-act="vready">'+icon('vote',20)+'I am '+esc(vp.name)+'. Vote.</button></div></section>';
  }
  var list=G.players.filter(function(p){return !(V.mode==='secret'&&p.id===G.players[V.voter].id);});
  var rows=list.map(function(p){
    var on=V.sel.indexOf(p.id)>-1;
    return '<button class="row'+(on?' sel':'')+'" data-act="vpick" data-id="'+p.id+'" aria-pressed="'+on+'"><span class="bub">'+(on?icon('check',22):esc(p.name.charAt(0).toUpperCase()))+'</span><div class="t"><b>'+esc(p.name)+'</b></div></button>';
  }).join('');
  var title=V.mode==='secret'?'<h2>'+esc(G.players[V.voter].name)+', who is the imposter?</h2>':'<h2>Who is the imposter?</h2>';
  var sub=V.mode==='group'?'Talk it over, then tap '+(N>1?N+' players':'one player')+'.':'Tap one player, then lock in your vote.';
  var last=V.mode==='secret'&&V.voter===G.players.length-1;
  var btn=V.mode==='group'?'Confirm vote':(last?'Lock in and see results':'Lock in vote');
  return '<section class="screen">'+head+(started||V.mode==='secret'&&V.stage==='ballot'?'':seg)+
    '<div class="center" style="display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center">'+title+'<p class="mute">'+sub+'</p></div>'+
    '<div style="display:grid;gap:10px">'+rows+'</div>'+
    '<div class="foot"><button class="btn primary" data-act="vconfirm"'+(V.sel.length===N?'':' disabled')+'>'+icon('check',20)+btn+'</button></div></section>';
}

/* --- result (tally -> guess -> final) --- */
function screenResult(){
  var R=G.res,head=top('Menu','menu','leave',badge('Round '+G.round));
  if(R.stage==='tally'){
    var max=1;G.players.forEach(function(p){if(R.counts[p.id]>max)max=R.counts[p.id];});
    var rows=G.players.slice().sort(function(a,b){return R.counts[b.id]-R.counts[a.id];}).map(function(p){
      var c=R.counts[p.id],hot=R.accused.indexOf(p.id)>-1;
      return '<div class="row"><span class="bub'+(hot?' red':'')+'">'+(hot?icon('vote',22):esc(p.name.charAt(0).toUpperCase()))+'</span><div class="t"><b>'+esc(p.name)+'</b><div class="vbar"><i class="'+(hot?'hot':'')+'" style="width:'+(c/max*100)+'%"></i></div></div><span class="pts'+(c?'':' zero')+'">'+c+'</span></div>';
    }).join('');
    var names=R.accused.map(function(id){return esc(pname(id));}).join(' and ');
    return '<section class="screen">'+head+
      '<div class="card center"><span class="lbl">The vote</span><h2 class="big gt">'+(R.accused.length?names:'No one')+'</h2>'+
      '<p class="mute">'+(R.accused.length?'got the most votes.':(R.tie?'A tie. The group could not decide.':'Nobody received a vote.'))+(R.accused.length&&R.tie?' The rest tied, so they are not accused.':'')+'</p></div>'+
      '<div style="display:grid;gap:10px">'+rows+'</div>'+
      '<div class="foot"><button class="btn primary" data-act="reveal">'+icon('eye',20)+'Reveal the truth</button></div></section>';
  }
  if(R.stage==='guess'){
    var gid=R.caught[R.gi],gn=esc(pname(gid));
    return '<section class="screen">'+head+
      '<div class="card center"><span class="lbl">Caught!</span><h2 class="big gt">'+gn+'</h2>'+
      '<p class="mute">Pass the phone to '+gn+'. One guess at the secret word steals the win.</p>'+(cfg.seesCat?'<span class="chip static">Category: '+esc(G.cat)+'</span>':'')+'</div>'+
      '<div class="card"><label class="lbl" for="guess">Your guess</label><input class="inp" id="guess" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="40" placeholder="Type the secret word">'+
      '<div class="duo"><button class="btn soft" data-act="skip">Skip</button><button class="btn primary" data-act="guess">'+icon('check',20)+'Guess</button></div></div>'+
      '<div class="foot"></div></section>';
  }
  /* final */
  var conf='';
  var cols=['#2563eb','#e11d48','#6ea0ff','#ff5c78','#1d4ed8','#fb7185'];
  for(var i=0;i<34;i++)conf+='<i style="--x:'+rnd(100)+'%;--d:'+(2.2+Math.random()*1.8).toFixed(2)+'s;--dl:'+(Math.random()*.8).toFixed(2)+'s;--r:'+(rnd(720)-360)+'deg;--c:'+cols[i%cols.length]+'"></i>';
  var imps=G.imps.map(function(id){
    var c=R.caught.indexOf(id)>-1,g=R.guesses[id];
    var sub=c?(g===true?'Caught, but guessed the word':(g===false?'Caught. Guessed "'+esc(R.texts[id]||'')+'"':'Caught')):'Not caught';
    return '<div class="row"><span class="bub red">'+icon('eyeOff',22)+'</span><div class="t"><b>'+esc(pname(id))+'</b><span>'+sub+'</span></div></div>';
  }).join('');
  var ptsRows=G.players.filter(function(p){return R.pts[p.id]>0;}).map(function(p){
    return '<div class="row"><span class="bub">'+esc(p.name.charAt(0).toUpperCase())+'</span><div class="t"><b>'+esc(p.name)+'</b></div><span class="pts">+'+R.pts[p.id]+'</span></div>';
  }).join('')||'<p class="mute">No points this round.</p>';
  return '<div class="confetti" aria-hidden="true">'+conf+'</div><section class="screen">'+head+
    '<div class="card center"><span class="lbl">Round '+G.round+' result</span><h2 class="big gt pop">'+(R.crewWin?'The crew wins!':(G.imps.length>1?'The imposters win!':'The imposter wins!'))+'</h2>'+
    '<p class="mute">'+(R.crewWin?'Every imposter was caught.':'The bluff worked.')+'</p></div>'+
    '<div class="sec"><span class="lbl">'+(G.imps.length>1?'The imposters were':'The imposter was')+'</span></div>'+imps+
    '<div class="card center"><span class="lbl">The secret word</span><div class="word-out gt">'+esc(G.word)+'</div><span class="chip static">'+esc(G.cat)+'</span></div>'+
    '<div class="sec"><span class="lbl">'+icon('star',16)+'Points this round</span></div><div style="display:grid;gap:10px">'+ptsRows+'</div>'+
    '<div class="foot"><button class="btn primary" data-act="score">'+icon('trophy',20)+'Scoreboard</button></div></section>';
}

/* --- scoreboard --- */
function screenScore(){
  var rows=G.players.slice().sort(function(a,b){return G.scores[b.id]-G.scores[a.id];});
  var best=G.scores[rows[0].id];
  var list=rows.map(function(p,i){
    var lead=best>0&&G.scores[p.id]===best;
    return '<div class="row"><span class="bub'+(lead?' red':'')+'">'+(lead?icon('crown',22):(i+1))+'</span><div class="t"><b>'+esc(p.name)+'</b></div><span class="pts'+(G.scores[p.id]?'':' zero')+'">'+G.scores[p.id]+'</span></div>';
  }).join('');
  return '<section class="screen">'+top('Back','back','back',badge('After round '+G.round))+
    '<div class="card center"><span class="lbl">'+icon('trophy',16)+'Scoreboard</span><h2 class="big gt">'+(best>0?esc(rows.filter(function(p){return G.scores[p.id]===best;}).map(function(p){return p.name;}).join(' & '))+' leads':'Everyone is level')+'</h2></div>'+
    '<div style="display:grid;gap:10px">'+list+'</div>'+
    (S.shareText?'<textarea class="inp" id="sharetxt" readonly aria-label="Scores to copy">'+esc(S.shareText)+'</textarea>':'')+
    '<div class="foot"><button class="btn primary" data-act="again">'+icon('refresh',20)+'Play again</button>'+
    '<div class="duo"><button class="btn soft" data-act="newgame">'+icon('settings',20)+'New game</button><button class="btn soft" data-act="copy">'+icon('share',20)+'Copy scores</button></div></div></section>';
}

/* --- how to play --- */
function screenHow(){
  var steps=HOWTO.map(function(s,i){
    return '<div class="row"><span class="bub">'+icon(s[0],22)+'</span><div class="t"><b>'+(i+1)+'. '+s[1]+'</b><span>'+s[2]+'</span></div></div>';
  }).join('');
  return '<section class="screen">'+top('Back','back','back')+
    '<div class="center" style="display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center"><h2 class="big">How to <span class="gt">play</span></h2><p class="mute">Five quick steps. One phone, passed around.</p></div>'+
    '<div style="display:grid;gap:10px">'+steps+
    '<div class="row"><span class="bub">'+icon('users',22)+'</span><div class="t"><b>Playing online?</b><span>Switch to Online party and share the code or invite link. Crew see the secret word, the imposter gets a hint. Take turns writing one clue word, then vote. More than half the votes sends a player out. Crew win by catching the imposter. The imposter wins when two players are left.</span></div></div></div>'+
    '<div class="foot"><button class="btn primary" data-act="back">'+icon('play',20)+'Got it</button></div></section>';
}

function confirmSheet(){
  if(!S.confirm)return '';
  var nm=S.confirm==='newgame',ol=S.confirm==='oleave';
  return '<div class="scrim" data-act="cancel"><div class="sheet" role="dialog" aria-modal="true" data-act="noop"><h3>'+(ol?'Leave this party?':(nm?'Start a new game?':'Leave this game?'))+'</h3>'+
    '<p class="mute">'+(ol?'You can rejoin later with the party code while the party is open.':(nm?'Scores will reset and you can change the players.':'Your current round and scores will be lost.'))+'</p>'+
    '<div class="duo"><button class="btn soft" data-act="cancel">Keep playing</button><button class="btn primary" data-act="yes">'+(nm?'New game':'Leave')+'</button></div></div></div>';
}

function render(){
  var s=S.screen,body='';
  if(s==='oparty'){app.innerHTML=hdr(false)+partyShell()+confirmSheet()+chatShell();afterShell();return;}
  if(s==='setup')body=S.mode==='online'?screenOnlineHome():screenSetup();
  else if(s==='how')body=screenHow();
  else if(!G)body=screenSetup();
  else if(s==='reveal')body=screenReveal();
  else if(s==='discuss')body=screenDiscuss();
  else if(s==='vote')body=screenVote();
  else if(s==='result')body=screenResult();
  else if(s==='score')body=screenScore();
  app.innerHTML=hdr(s!=='how')+body+confirmSheet();
  if(s==='discuss'&&G&&G.timer)startTick();
  if(s==='result'&&G&&G.res&&G.res.stage==='guess'){var g=document.getElementById('guess');if(g)g.focus();}
  if(s==='score'&&S.shareText){var t=document.getElementById('sharetxt');if(t){t.focus();t.select();}}
}

/* ======================================================================
   6. EVENTS — one delegated click handler plus input and hold handlers
   ====================================================================== */
app.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');if(!el||el.disabled)return;
  var a=el.getAttribute('data-act'),v=el.getAttribute('data-v'),i=parseInt(el.getAttribute('data-i'),10);
  if(onlineAct(a,el,v))return;
  switch(a){
    case 'noop':return;
    case 'how':if(S.screen==='discuss'&&G&&G.timer&&!G.timer.paused){G.timer.rem=timerRem();G.timer.paused=true;}S.prev=S.screen;go('how');return;
    case 'back':go(S.screen==='how'?S.prev:'result');return;
    case 'leave':S.confirm='leave';render();return;
    case 'cancel':S.confirm=null;render();return;
    case 'yes':
      if(S.confirm==='oleave'){S.confirm=null;leaveParty();return;}
      S.confirm=null;G=null;go('setup');return;
    case 'start':
      if(S.screen!=='setup')return;
      startGame();return;
    case 'addp':if(cfg.players.length<MAX_PLAYERS){cfg.players.push('Player '+(cfg.players.length+1));save();render();var ni=document.getElementById('pn'+(cfg.players.length-1));if(ni){ni.focus();ni.select();}}return;
    case 'delp':if(cfg.players.length>MIN_PLAYERS){cfg.players.splice(i,1);if(cfg.players.length<5)cfg.imposters=1;save();render();}return;
    case 'imp':cfg.imposters=parseInt(v,10);save();render();return;
    case 'time':cfg.minutes=parseInt(v,10);save();render();return;
    case 'seecat':cfg.seesCat=!cfg.seesCat;save();render();return;
    case 'cat':
      if(v==='all'){cfg.cats=CATEGORIES.map(function(c){return c.id;});}
      else{
        var k=cfg.cats.indexOf(v);
        if(k>-1){if(cfg.cats.length===1){toast('Keep at least one category.');return;}cfg.cats.splice(k,1);}
        else cfg.cats.push(v);
      }
      save();render();return;
    case 'next':
      if(!G.viewed)return;
      if(G.idx<G.players.length-1){G.idx++;G.viewed=false;render();}
      else{initTimer();go('discuss');}
      return;
    case 'pause':
      var t=G.timer;
      if(t.paused){t.end=Date.now()+t.rem*1000;t.paused=false;}
      else{t.rem=timerRem();t.paused=true;}
      render();return;
    case 'plus30':
      var tm=G.timer,r=timerRem();
      tm.total+=30;tm.done=false;
      if(tm.paused)tm.rem+=30;else tm.end+=30000;
      render();return;
    case 'tovote':G.vote=newVote('group');go('vote');return;
    case 'vmode':G.vote=newVote(v);render();return;
    case 'vready':G.vote.stage='ballot';render();return;
    case 'vpick':
      var id=parseInt(el.getAttribute('data-id'),10),V=G.vote,N=needPicks(),ix=V.sel.indexOf(id);
      if(ix>-1)V.sel.splice(ix,1);else{V.sel.push(id);while(V.sel.length>N)V.sel.shift();}
      render();return;
    case 'vconfirm':
      var W=G.vote;
      if(W.sel.length!==needPicks())return;
      if(W.mode==='group'){finishVote();return;}
      W.ballots.push({voter:G.players[W.voter].id,pick:W.sel[0]});
      W.sel=[];
      if(W.voter<G.players.length-1){W.voter++;W.stage='handoff';render();try{window.scrollTo(0,0);}catch(x){}}
      else finishVote();
      return;
    case 'reveal':
      G.res.gi=0;
      if(G.res.caught.length){G.res.stage='guess';render();}else finalizeRound();
      return;
    case 'guess':
    case 'skip':
      var R=G.res,gid=R.caught[R.gi],inp=document.getElementById('guess'),txt=(inp?inp.value:'').trim();
      if(a==='skip'||!txt){R.guesses[gid]=false;R.texts[gid]='';}
      else{
        var n1=norm(txt),n2=norm(G.word);
        R.texts[gid]=txt;
        R.guesses[gid]=(n1===n2||n1===n2+'s'||n1+'s'===n2);
      }
      R.gi++;
      if(R.gi>=R.caught.length)finalizeRound();else render();
      return;
    case 'score':go('score');return;
    case 'again':startRound();return;
    case 'newgame':S.confirm='newgame';render();return;
    case 'copy':
      var text=scoreText();
      try{
        navigator.clipboard.writeText(text).then(function(){toast('Scores copied');},function(){S.shareText=text;render();});
      }catch(err){S.shareText=text;render();}
      return;
  }
});
app.addEventListener('input',function(e){
  var el=e.target;
  if(el.classList&&el.classList.contains('pname')){cfg.players[parseInt(el.getAttribute('data-i'),10)]=el.value;save();}
  onInput(el);
});
app.addEventListener('keydown',function(e){
  if(onKey(e))return;
  if(e.target.id==='guess'&&e.key==='Enter'){e.preventDefault();var b=app.querySelector('[data-act="guess"]');if(b)b.click();return;}
  if(e.target.id==='hold'&&(e.key===' '||e.key==='Enter')){e.preventDefault();if(!holding)showRole(true);}
});
app.addEventListener('keyup',function(e){if(e.target.id==='hold'&&(e.key===' '||e.key==='Enter'))showRole(false);});
app.addEventListener('pointerdown',function(e){
  var h=e.target.closest('#hold');if(!h)return;
  e.preventDefault();
  try{h.setPointerCapture(e.pointerId);}catch(x){}
  showRole(true);
});
['pointerup','pointercancel','lostpointercapture'].forEach(function(t){
  app.addEventListener(t,function(){if(holding)showRole(false);});
});
app.addEventListener('contextmenu',function(e){if(e.target.closest('#hold'))e.preventDefault();});
document.addEventListener('visibilitychange',function(){if(document.hidden&&holding)showRole(false);});

/* ======================================================================
   6b. ONLINE MODE — party code or invite link, db-backed shared state, room chat
   Data layout (db):
     parties/<CODE>                 party doc, written by the host: phase, round, lap, turn, order, alive, settings, secret, tally, result, scores
     parties/<CODE>/players/<uid>   one doc per player: name, cl (clues), v (vote), g (guess), rdy; each tagged with the round (and lap)
   Round flow: lobby > deal > clue (turn by turn) > vote > tally > (next lap | guess > result | result)
   Chat uses the room capability (joined by party code), so it is live only.
   ====================================================================== */
/* a loose hint for the imposter, vaguer than a clue */

/* ---------- connection to the game server (Socket.IO) ---------- */
var OLKEY='wordfox.online.v2';
var CLUE_TIMES=[[30,'30 sec'],[45,'45 sec'],[60,'60 sec'],[0,'No timer']];
var VOTE_TIMES=[[30,'30 sec'],[60,'60 sec'],[90,'90 sec'],[0,'No timer']];
var MY=null,P=null,SOCK=null;
var O={state:'loading',nick:'',last:'',tok:'',codeIn:'',invite:'',err:'',busy:false,code:'',players:[],chat:[],unread:0,chatOpen:false,
  lastKey:'',gotPlayers:false,draft:{},tickH:null,viewedRound:-1,buzzKey:'',showWord:false,inviteBox:false,roundSeen:-1,
  skew:0,inParty:false,leaving:false,connected:false};

function mkToken(){
  var a=new Uint8Array(24),s='',i;
  try{crypto.getRandomValues(a);}catch(e){for(i=0;i<a.length;i++)a[i]=Math.floor(Math.random()*256);}
  for(i=0;i<a.length;i++)s+=('0'+a[i].toString(16)).slice(-2);
  return s;
}
function loadOL(){
  try{
    var o=JSON.parse(localStorage.getItem(OLKEY)||'{}');
    if(typeof o.nick==='string')O.nick=o.nick.slice(0,14);
    if(typeof o.last==='string')O.last=o.last.replace(/[^A-Z0-9]/g,'').slice(0,5);
    if(typeof o.tok==='string'&&/^[a-f0-9]{32,64}$/.test(o.tok))O.tok=o.tok;
  }catch(e){}
  if(!O.tok){O.tok=mkToken();saveOL();}
}
function saveOL(){try{localStorage.setItem(OLKEY,JSON.stringify({nick:O.nick,last:O.last,tok:O.tok}));}catch(e){}}

function refreshHome(){if(S.screen==='setup'&&S.mode==='online')render();}
function initOnline(){
  checkHash();
  if(typeof io!=='function'){O.state='off';return;}
  try{SOCK=io({reconnectionDelayMax:4000});}catch(e){O.state='off';return;}
  var failTimer=setTimeout(function(){if(O.state==='loading'){O.state='off';refreshHome();}},10000);
  SOCK.on('connect',function(){
    clearTimeout(failTimer);O.connected=true;
    if(O.state!=='ready'){O.state='ready';refreshHome();}
    if(O.inParty&&O.code){ /* the connection dropped and came back: take the seat again */
      req('party:join',{code:O.code,token:O.tok,name:nick()},function(res){if(res.err)partyGone(res.err);},true);
    }
  });
  SOCK.on('disconnect',function(){O.connected=false;if(O.inParty)toast('Connection lost. Reconnecting…');});
  SOCK.on('state',onState);
  SOCK.on('chat',onChat);
  SOCK.on('chat:history',onHistory);
  SOCK.on('closed',function(){partyGone('The party was closed.');});
  SOCK.on('kicked',function(){partyGone('You were removed from the party.');});
  SOCK.on('replaced',function(){partyGone('This party was opened on another device.');});
}
/* ask the server to do something; cb gets {ok:true,...} or {err:'message'} */
function req(ev,data,cb,quiet){
  if(!SOCK||!SOCK.connected){if(!quiet)toast('Not connected to the server.');if(cb)cb({err:'Not connected to the server.'});return;}
  var done=false,to=setTimeout(function(){
    if(done)return;done=true;
    if(!quiet)toast('The server is slow to answer. Try again.');
    if(cb)cb({err:'The server is slow to answer. Try again.'});
  },9000);
  SOCK.emit(ev,data||{},function(res){
    if(done)return;done=true;clearTimeout(to);
    if(cb)cb(res||{});
  });
}
function send(ev,data){
  req(ev,data,function(res){
    if(res.err){toast(res.err);if(res.gone)partyGone('You are not in that party anymore.');}
  });
}

/* ---------- helpers ---------- */
function fail(){toast('Something went wrong. Try again.');}
function setErr(m){O.err=m;if(S.screen==='setup')render();else toast(m);}
function nick(){return String(O.nick||'').replace(/\s+/g,' ').trim().slice(0,14);}
function sNow(){return Date.now()+O.skew;}
function resetParty(){
  if(O.tickH){clearInterval(O.tickH);O.tickH=null;}
  O.inParty=false;O.gotPlayers=false;O.code='';O.chat=[];O.unread=0;O.chatOpen=false;O.lastKey='';
  O.draft={};O.showWord=false;O.inviteBox=false;O.roundSeen=-1;O.viewedRound=-1;
  P=null;MY=null;O.players=[];holding=false;
}
function partyGone(msg){
  resetParty();O.last='';saveOL();
  if(msg)toast(msg);
  go('setup');
}

/* ---------- create / join / leave ---------- */
function createParty(){
  var n=nick();if(!n){setErr('Enter your name first.');return;}
  if(O.busy)return;O.busy=true;O.err='';render();
  req('party:create',{name:n,token:O.tok},function(res){
    O.busy=false;
    if(res.err){setErr(res.err);return;}
    O.invite='';
  });
}
function joinParty(raw,rejoin){
  var code=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  var n=nick();
  if(code.length!==5){setErr('Enter the 5-character party code.');return;}
  if(!n&&!rejoin){setErr('Enter your name first.');return;}
  if(O.busy)return;O.busy=true;O.err='';render();
  req('party:join',{code:code,name:n,token:O.tok},function(res){
    O.busy=false;
    if(res.err){
      if(res.gone&&O.last===code){O.last='';saveOL();}
      setErr(res.err);return;
    }
    O.invite='';
  });
}
function leaveParty(){
  O.leaving=true;
  var fin=function(){O.leaving=false;};
  if(SOCK&&SOCK.connected)SOCK.emit('party:leave',{},fin);else fin();
  resetParty();O.last='';saveOL();
  go('setup');
}

/* ---------- the server sends each phone its own private view of the party ---------- */
function onState(s){
  if(O.leaving||!s||!s.party)return;
  MY=s.me;P=s.party;O.players=s.players||[];O.gotPlayers=true;
  O.skew=(P.now||Date.now())-Date.now(); /* server clock minus this phone's clock */
  if(!O.inParty){
    O.inParty=true;O.code=P.code;O.last=P.code;O.invite='';saveOL();O.lastKey='';
    if(!O.tickH)O.tickH=setInterval(otick,500);
    go('oparty');
    return;
  }
  refreshParty();
}
function onChat(d){
  if(!d||typeof d.t!=='string')return;
  var it={n:String(d.n||'Player').slice(0,16),t:d.t.slice(0,300),me:d.id===MY};
  O.chat.push(it);if(O.chat.length>150)O.chat.shift();
  if(S.screen!=='oparty')return;
  if(O.chatOpen)addMsg(it);else if(!it.me){O.unread++;updBadge();}
}
function onHistory(list){
  O.chat=(list||[]).slice(-150).map(function(d){return {n:String(d.n||'Player').slice(0,16),t:String(d.t||'').slice(0,300),me:d.id===MY};});
  renderMsgs();
}
function sendChat(){
  var el=document.getElementById('chatIn');if(!el)return;
  var t=el.value.trim();if(!t)return;
  req('chat',{text:t.slice(0,300)},function(res){if(res.err)toast(res.err);});
  el.value='';O.draft.chatIn='';
}

/* ---------- timers shown on screen (the server owns the real clock) ---------- */
function otick(){
  if(!P)return;
  var ph=P.phase,end=0,total=0,now=sNow();
  if(ph==='clue'){end=P.turnEnd;total=clueSec();}
  else if(ph==='vote'){end=P.voteEnd;total=voteSec();}
  else if(ph==='guess'){end=P.guessEnd;total=clueSec();}
  var a=document.getElementById('tt'),b=document.getElementById('tb');
  var rem=0,sent=false;
  if(ph==='clue'){var cp=byId((P.order||[])[P.turn]);sent=!!cp&&clueAt(cp,P.lap)!==undefined;}
  if(a||b){
    if(sent){if(a)a.textContent='Clue sent';if(b)b.style.width='0%';}
    else if(total&&end){
      rem=Math.max(0,Math.ceil((end-now)/1000));
      if(a)a.textContent=rem>0?fmt(rem):"Time's up";
      if(b)b.style.width=Math.min(100,rem/total*100)+'%';
    }else{
      if(a)a.textContent='No timer';
      if(b)b.style.width='100%';
    }
  }
  if(!sent&&end&&total&&now>=end){
    var bk=ph+'|'+P.round+'|'+P.lap+'|'+P.turn;
    if(O.buzzKey!==bk){O.buzzKey=bk;if((ph==='clue'&&(P.order||[])[P.turn]===MY)||(ph==='guess'&&isImp(MY)))buzz([200,100,200]);}
  }
}

/* ---------- actions: every button just asks the server ---------- */
function isHost(){return !!P&&P.host===MY;}
function onlineAct(a,el,v){
  var id=el.getAttribute('data-id');
  switch(a){
    case 'mode':S.mode=v==='online'?'online':'offline';O.err='';render();return true;
    case 'ocreate':createParty();return true;
    case 'ojoin':joinParty(O.codeIn,false);return true;
    case 'orejoin':joinParty(O.last,true);return true;
    case 'oclearinv':O.invite='';O.codeIn='';O.err='';try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}render();return true;
    case 'copycode':copyText(O.code,'Code copied');return true;
    case 'copylink':copyText(inviteText(),'Invite copied',true);return true;
    case 'chat':openChat(true);return true;
    case 'chatclose':openChat(false);return true;
    case 'oleave':S.confirm='oleave';render();return true;
    case 'toggleword':{
      O.showWord=!O.showWord;
      var wc=document.getElementById('wordcard');
      if(wc)wc.outerHTML=wordCardHTML();
      return true;}
    case 'oclueT':send('settings',{clueSec:parseInt(v,10)});return true;
    case 'ovoteT':send('settings',{voteSec:parseInt(v,10)});return true;
    case 'ohint':if(isHost())send('settings',{hint:P.settings.hint===false});return true;
    case 'ocat':{
      if(!isHost())return true;
      if(v==='all'){send('settings',{cats:CATEGORIES.map(function(c){return c.id;})});return true;}
      var cs=(P.settings.cats||[]).slice(),k=cs.indexOf(v);
      if(k>-1){if(cs.length===1){toast('Keep at least one category.');return true;}cs.splice(k,1);}else cs.push(v);
      send('settings',{cats:cs});return true;}
    case 'okick':if(isHost()&&id&&id!==MY)send('kick',{id:id});return true;
    case 'ostart':if(isHost())send('start');return true;
    case 'oready':send('ready');return true;
    case 'oclue':{
      var cur=(P.order||[])[P.turn];
      if(cur!==MY||!isAlive(MY)||P.phase!=='clue'){toast('It is not your turn.');return true;}
      var ci=document.getElementById('clueIn'),t=cleanClue(ci?ci.value:'');
      if(!t){toast('Type one word first.');return true;}
      O.draft.clueIn='';
      req('clue',{text:t},function(res){if(res.err){toast(res.err);if(ci)ci.value=t;O.draft.clueIn=t;}});
      return true;}
    case 'ovote':if(isAlive(MY)&&P.phase==='vote')send('vote',{target:id});return true;
    case 'oskipvote':if(isAlive(MY)&&P.phase==='vote')send('vote',{target:''});return true;
    case 'oguess':
    case 'oskip':{
      var gi=document.getElementById('oguess'),gt=a==='oskip'?'':(gi?gi.value.trim():'');
      O.draft.oguess='';
      send('guess',{text:gt.slice(0,40)});return true;}
    case 'onext':if(isHost())send('next');return true;
    case 'olobby':if(isHost())send('lobby');return true;
  }
  return false;
}

/* an invite link carries the party code in the page address after the # */
function checkHash(){
  var h='';
  try{h=String(location.hash||'').replace(/^#/,'').toUpperCase().replace(/[^A-Z0-9]/g,'');}catch(e){}
  if(h.length!==5||h===O.code)return;
  O.invite=h;O.codeIn=h;S.mode='online';
  if(S.screen==='setup')render();
}
try{window.addEventListener('hashchange',checkHash);}catch(e){}

/* ---------- helpers ---------- */
function byId(id){for(var i=0;i<O.players.length;i++)if(O.players[i].id===id)return O.players[i];return null;}
function me(){return byId(MY);}
function nm(id){var p=byId(id);return p?p.name:'Former player';}
function initial(s){return esc(String(s||'?').charAt(0).toUpperCase());}
function isImp(id){return !!P&&P.imp===id;}
function isAlive(id){return !!P&&(P.alive||[]).indexOf(id)>-1;}
function aliveIds(){return ((P&&P.alive)||[]).filter(function(id){return !!byId(id);});}
function clueAt(p,l){return p&&p.cl&&P&&p.cl.r===P.round&&p.cl.a?p.cl.a[l-1]:undefined;}
function getV(p){return p&&p.v&&P&&p.v.r===P.round&&p.v.l===P.lap?p.v:null;}
function getG(p){return p&&p.g&&P&&p.g.r===P.round?p.g:null;}
function isRdy(p){return !!p&&!!P&&p.rdy===P.round;}
function isMatch(t,word){var a=norm(t),b=norm(word);return !!a&&(a===b||a===b+'s'||a+'s'===b);}
function clueSec(){return (P&&P.settings&&P.settings.clueSec)||0;}
function voteSec(){return (P&&P.settings&&P.settings.voteSec)||0;}
function shareLink(){var b='';try{b=String(location.href||'').split('#')[0];}catch(e){}return b?b+'#'+O.code:'';}
function inviteText(){var l=shareLink();return 'Join my Wordfox party! Code: '+O.code+(l?'\n'+l:'');}
function copyText(t,msg,boxOnFail){
  function fb(){if(boxOnFail){O.inviteBox=true;updDyn();}else toast(t.split('\n')[0]);}
  try{navigator.clipboard.writeText(t).then(function(){toast(msg||'Copied');},fb);}catch(e){fb();}
}
function modeSeg(){
  return '<div class="seg" role="group" aria-label="Play mode"><button data-act="mode" data-v="offline" aria-pressed="'+(S.mode!=='online')+'">One phone</button>'+
    '<button data-act="mode" data-v="online" aria-pressed="'+(S.mode==='online')+'">Online party</button></div>';
}

/* ---------- online home (before joining) ---------- */
function screenOnlineHome(){
  var h='<section class="screen"><div class="hero">'+WATERMARK+'<span class="tag">Online · up to 12 players</span><h1>Play from your own phone</h1><p>Create a party, share the code or link, and bluff your way through the clues.</p></div>'+modeSeg();
  if(O.state==='loading')return h+'<div class="card center"><p class="mute">Connecting…</p></div></section>';
  if(O.state!=='ready')return h+'<div class="card"><h3>Online play is not available here</h3><p class="mute">Could not reach the game server. Check your connection and reload, or play pass and play on one phone.</p></div></section>';
  var err=O.err?'<p class="err" role="alert">'+esc(O.err)+'</p>':'';
  if(O.invite){
    return h+'<div class="card center"><span class="lbl">You are invited</span><h2 class="big gt">Party '+esc(O.invite)+'</h2>'+
      '<label class="lbl" for="nick" style="align-self:flex-start">Your name</label><input class="inp" id="nick" value="'+esc(O.nick)+'" maxlength="14" placeholder="Name shown to everyone" autocomplete="off">'+
      '<button class="btn primary" data-act="ojoin"'+(O.busy?' disabled':'')+'>'+icon('users',20)+'Join party</button></div>'+err+
      '<button class="btn soft" data-act="oclearinv">Create my own party instead</button></section>';
  }
  return h+
    '<div class="card"><label class="lbl" for="nick">Your name</label><input class="inp" id="nick" value="'+esc(O.nick)+'" maxlength="14" placeholder="Name shown to everyone" autocomplete="off">'+
    '<button class="btn primary" data-act="ocreate"'+(O.busy?' disabled':'')+'>'+icon('plus',20)+'Create a party</button></div>'+
    '<div class="card"><label class="lbl" for="codeIn">Join with a code</label><input class="inp" id="codeIn" value="'+esc(O.codeIn)+'" maxlength="5" placeholder="5-letter code" autocomplete="off" autocapitalize="characters" spellcheck="false" style="letter-spacing:4px;font-weight:700">'+
    '<button class="btn soft" data-act="ojoin"'+(O.busy?' disabled':'')+'>'+icon('users',20)+'Join party</button></div>'+err+
    (O.last?'<button class="row" data-act="orejoin"><span class="bub">'+icon('refresh',22)+'</span><div class="t"><b>Rejoin party '+esc(O.last)+'</b><span>Pick up where you left off</span></div></button>':'')+
    '</section>';
}

/* ---------- create / join / leave ---------- */
/* ---------- snapshot handling and host-driven game flow ---------- */
/* ---------- party shell, views and dynamic regions ---------- */
function partyShell(){
  return '<section class="screen" id="pscreen"><div class="top"><button class="btn soft slim" data-act="oleave">'+icon('menu',20)+'Leave</button>'+
    '<div class="tr"><button class="btn soft slim" data-act="copycode" aria-label="Copy party code"><span class="fh">'+esc(O.code)+'</span>'+icon('copy',18)+'</button>'+
    '<button class="btn soft slim" data-act="chat" aria-label="Open chat">'+icon('chat',20)+'<span class="badge" id="chatBadge" hidden>0</span></button></div></div>'+
    '<div id="pmain" style="display:flex;flex-direction:column;gap:14px;flex:1"><div class="card center"><p class="mute">Joining the party…</p></div></div></section>';
}
function chatShell(){
  return '<div class="scrim" id="chatsheet"'+(O.chatOpen?'':' hidden')+' data-act="chatclose"><div class="sheet chat" role="dialog" aria-label="Party chat" data-act="noop">'+
    '<div class="top"><h3>Party chat</h3><button class="iconbtn" data-act="chatclose" aria-label="Close chat">'+icon('x',20)+'</button></div>'+
    '<div class="msgs" id="msgs" aria-live="polite"></div>'+
    '<form class="cform" id="chatForm"><input class="inp" id="chatIn" maxlength="300" placeholder="Message the party" autocomplete="off" aria-label="Message"><button class="btn primary" type="submit" aria-label="Send">'+icon('send',20)+'</button></form></div></div>';
}
function afterShell(){
  O.lastKey='';refreshParty();renderMsgs();updBadge();
  if(O.chatOpen){var c=document.getElementById('chatIn');if(c){c.value=O.draft.chatIn||'';}}
}
function viewKey(){
  var m=me();
  return [P.phase,P.round,P.lap,P.turn,P.host===MY?1:0,isAlive(MY)?1:0,isRdy(m)?1:0,getG(m)?1:0,(P.phase==='clue'&&m&&clueAt(m,P.lap)!==undefined)?1:0].join('|');
}
function refreshParty(){
  if(S.screen!=='oparty'||!P||!O.gotPlayers)return;
  var main=document.getElementById('pmain');if(!main)return;
  var k=viewKey();
  if(k!==O.lastKey){
    var prev=O.lastKey.split('|'),newScreen=prev[0]!==P.phase||prev[1]!==String(P.round);
    O.lastKey=k;holding=false;
    if(O.roundSeen!==P.round){O.roundSeen=P.round;O.showWord=false;}
    main.innerHTML=partyView();
    ['clueIn','oguess'].forEach(function(id){var el=document.getElementById(id);if(el&&O.draft[id]!==undefined)el.value=O.draft[id];});
    var ci=document.getElementById('clueIn');
    if(ci&&P.phase==='clue'){try{ci.focus();}catch(e){}}
    if(newScreen){try{window.scrollTo(0,0);}catch(e){}}
  }
  updDyn();
}
function partyView(){
  switch(P.phase){
    case 'lobby':return vLobby();
    case 'deal':return vDeal();
    case 'clue':return vClue();
    case 'vote':return vVote();
    case 'tally':return vTally();
    case 'guess':return vGuess();
    case 'result':return vResult();
  }
  return '';
}
var DYN={players:dynPlayers,settings:dynSettings,action:dynAction,status:dynStatus,vote:dynVote,clues:dynClues,invite:dynInvite};
function updDyn(){
  var els=document.querySelectorAll('#pmain [data-dyn]');
  for(var i=0;i<els.length;i++){
    var f=DYN[els[i].getAttribute('data-dyn')];
    if(f){var h=f();if(els[i]._h!==h){els[i].innerHTML=h;els[i]._h=h;}}
  }
}
function statusCard(label,fn,filter){
  var list=filter?O.players.filter(filter):O.players,done=list.filter(fn).length;
  return '<div class="card"><div class="sec" style="margin:0"><span class="lbl">'+label+'</span><span class="cnt">'+done+' / '+list.length+'</span></div><div class="plist">'+
    list.map(function(p){var ok=fn(p);return '<div class="row mini"><span class="bub sm">'+initial(p.name)+'</span><div class="t"><b>'+esc(p.name)+(p.id===MY?' (you)':'')+'</b></div><span class="st'+(ok?' ok':'')+'">'+icon(ok?'check':'clock',20)+'</span></div>';}).join('')+'</div></div>';
}
function heading(t,sub){return '<div class="center" style="display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center"><h2 class="big gt">'+t+'</h2>'+(sub?'<p class="mute">'+sub+'</p>':'')+'</div>';}
function timerCard(label){
  return '<div class="card center"><span class="lbl">'+icon('clock',16)+label+'</span><div class="time fh gt" id="tt">…</div><div class="bar" id="tbw" style="width:100%"><i id="tb" style="width:100%"></i></div></div>';
}
function wordCardHTML(){
  var imp=isImp(MY),s=P.secret||{},on=O.showWord,hs=P.settings.hint!==false;
  var body;
  if(!on)body='<b>Tap to show your secret</b><span>Hide it again before anyone sees your screen</span>';
  else if(imp)body='<b>You are the IMPOSTER</b><span>'+(hs?'Category: '+esc(s.cat)+' · Hint: '+esc(s.hint):'No hint this time. Blend in.')+'</span>';
  else body='<b>'+esc(s.word)+'</b><span>Category: '+esc(s.cat)+'</span>';
  return '<button class="row" id="wordcard" data-act="toggleword" aria-pressed="'+on+'"><span class="bub'+(on&&imp?' red':'')+'">'+icon(on?'eye':'eyeOff',22)+'</span><div class="t">'+body+'</div></button>';
}
function spectatorNote(){
  return isAlive(MY)?'':'<div class="row"><span class="bub red">'+icon('eyeOff',22)+'</span><div class="t"><b>You were voted out</b><span>You can still watch the round and chat.</span></div></div>';
}

/* lobby */
function vLobby(){
  return '<div class="card center"><span class="lbl">Party code</span><div class="code gt">'+esc(O.code)+'</div><p class="mute">Share the code or the invite link. Friends only need to type their name.</p>'+
    '<div class="duo" style="width:100%"><button class="btn soft" data-act="copylink">'+icon('share',20)+'Copy invite</button><button class="btn soft" data-act="copycode">'+icon('copy',20)+'Copy code</button></div><div data-dyn="invite" style="width:100%"></div></div>'+
    '<div data-dyn="players"></div><div data-dyn="settings"></div><div class="foot"><div data-dyn="action"></div></div>';
}
function dynInvite(){
  return O.inviteBox?'<textarea class="inp" id="invbox" readonly aria-label="Invite text" style="min-height:90px;resize:none;padding:12px 14px">'+esc(inviteText())+'</textarea>':'';
}
function dynPlayers(){
  var host=P.host===MY;
  return '<div class="sec"><span class="lbl">'+icon('users',16)+'Players</span><span class="cnt">'+O.players.length+' / '+MAX_PLAYERS+'</span></div><div class="plist" style="margin-top:10px;margin-bottom:6px">'+
    O.players.map(function(p){
      return '<div class="row mini"><span class="bub sm">'+initial(p.name)+'</span><div class="t"><b>'+esc(p.name)+(p.id===MY?' (you)':'')+'</b>'+(p.id===P.host?'<span>Host'+(p.connected===false?' · away':'')+'</span>':(p.connected===false?'<span>Away</span>':''))+'</div>'+
        (host&&p.id!==MY?'<button class="iconbtn" data-act="okick" data-id="'+esc(p.id)+'" aria-label="Remove '+esc(p.name)+'">'+icon('trash',18)+'</button>':'')+'</div>';
    }).join('')+'</div>';
}
function timeLabel(list,v){for(var i=0;i<list.length;i++)if(list[i][0]===v)return list[i][1];return v+' sec';}
function dynSettings(){
  var s=P.settings,host=P.host===MY;
  if(!host){
    return '<div class="card"><span class="lbl">'+icon('settings',16)+'Round settings</span><p>Clue turn: '+timeLabel(CLUE_TIMES,s.clueSec||0)+' · Voting: '+timeLabel(VOTE_TIMES,s.voteSec||0)+' · '+(s.hint===false?'No imposter hint':'Imposter gets a hint')+'</p></div>';
  }
  var ct=CLUE_TIMES.map(function(t){return '<button data-act="oclueT" data-v="'+t[0]+'" aria-pressed="'+((s.clueSec||0)===t[0])+'">'+t[1]+'</button>';}).join('');
  var vt=VOTE_TIMES.map(function(t){return '<button data-act="ovoteT" data-v="'+t[0]+'" aria-pressed="'+((s.voteSec||0)===t[0])+'">'+t[1]+'</button>';}).join('');
  return '<div class="grp"><div class="sec" style="margin:0"><span class="lbl">'+icon('clock',16)+'Time to write a clue</span></div><div class="seg" role="group" aria-label="Clue time">'+ct+'</div></div>'+
    '<div class="grp"><div class="sec" style="margin:0"><span class="lbl">'+icon('vote',16)+'Voting time</span></div><div class="seg" role="group" aria-label="Voting time">'+vt+'</div></div>'+
    catPicker(s.cats||[],'ocat','ocat')+
    '<div class="row"><span class="bub">'+icon('eye',22)+'</span><div class="t"><b>Imposter gets a hint</b><span>Category plus a loose clue word</span></div><button class="sw" role="switch" aria-checked="'+(s.hint!==false)+'" aria-label="Imposter gets a hint" data-act="ohint"></button></div>';
}

/* deal (role check) */
function oShowRole(h,on){
  holding=on;
  var imp=isImp(MY);
  h.classList.toggle('on',on);h.classList.toggle('imp',on&&imp);
  h.innerHTML=on?oHoldShown(imp):holdHidden();
  if(on&&P&&O.viewedRound!==P.round){O.viewedRound=P.round;var b=document.getElementById('readyBtn');if(b)b.disabled=false;}
}
function oHoldShown(imp){
  var s=P.secret;if(!s)return holdHidden();
  if(imp){
    var hs=P.settings.hint!==false;
    return '<div class="hold-in">'+icon('eyeOff',44)+'<div class="word">You are the IMPOSTER</div><p class="sub">'+(hs?'Category: <b>'+esc(s.cat)+'</b><br>Hint: <b>'+esc(s.hint)+'</b>':'You get no hint. Blend in.')+'</p></div>';
  }
  return '<div class="hold-in"><span class="lbl">Secret word</span><div class="word gt">'+esc(s.word)+'</div><span class="chip static">'+esc(s.cat)+'</span></div>';
}
function vDeal(){
  var rdy=isRdy(me());
  return heading('Check your role','Hold the card to see it. Crew see the word. The imposter gets a hint. Then write a clue close to the word when it is your turn.')+
    '<div class="hold" id="hold" role="button" tabindex="0" aria-label="Hold to reveal your role">'+holdHidden()+'</div>'+
    '<div data-dyn="status"></div><div class="foot">'+
    (rdy?'<button class="btn soft" disabled>'+icon('check',20)+'Waiting for the others</button>'
        :'<button class="btn primary" id="readyBtn" data-act="oready"'+(O.viewedRound===P.round?'':' disabled')+'>'+icon('check',20)+'I am ready</button>')+
    '<div data-dyn="action"></div></div>';
}

/* clue turns */
function vClue(){
  var cur=(P.order||[])[P.turn],mine=cur===MY&&isAlive(MY);
  var who=mine?'Your turn':esc(nm(cur))+"'s turn";
  var sentClue=mine?clueAt(me(),P.lap):undefined;
  var box=mine&&sentClue!==undefined
    ?'<div class="card center"><span class="lbl">Clue sent</span><div class="word gt">'+esc(sentClue||'no clue')+'</div><p class="mute">Waiting for the next player…</p></div>'
    :mine
    ?'<div class="card"><label class="lbl" for="clueIn">Write one word close to the secret</label><input class="inp" id="clueIn" maxlength="20" placeholder="One word" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn primary" data-act="oclue">'+icon('send',20)+'Send clue</button></div>'
    :'';
  return '<div class="center" style="display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center"><span class="lbl">Lap '+P.lap+' · writing clues</span><h2 class="big gt">'+who+'</h2></div>'+
    timerCard('Time to write')+wordCardHTML()+spectatorNote()+box+'<div data-dyn="clues"></div><div class="foot"><div data-dyn="action"></div></div>';
}
function dynClues(){
  var o=P.order||[],cur=o[P.turn],out='';
  for(var l=P.lap;l>=1;l--){
    var rows='';
    o.forEach(function(id){
      var p=byId(id);if(!p)return;
      var c=clueAt(p,l),typing=(l===P.lap&&P.phase==='clue'&&id===cur&&c===undefined);
      if(c===undefined&&!typing)return;
      var right=typing?'<span class="st">'+icon('clock',20)+'</span>':(c?'<span class="clue">'+esc(c)+'</span>':'<span class="nocl">no clue</span>');
      rows+='<div class="row mini'+(typing?' turn':'')+'"><span class="bub sm">'+initial(p.name)+'</span><div class="t"><b>'+esc(p.name)+(id===MY?' (you)':'')+(isAlive(id)?'':' · out')+'</b></div>'+right+'</div>';
    });
    if(rows)out+='<div class="card"><span class="lbl">Lap '+l+'</span><div class="plist">'+rows+'</div></div>';
  }
  return out;
}

/* voting */
function vVote(){
  return heading('Who is the imposter?','Voting is optional. A player is out only with more than half of the votes.')+
    timerCard('Voting time left')+wordCardHTML()+spectatorNote()+'<div data-dyn="clues"></div><div data-dyn="vote"></div><div class="foot"><div data-dyn="action"></div></div>';
}
function dynVote(){
  if(!isAlive(MY))return statusCard('Voted',function(p){return !!getV(p);},function(p){return isAlive(p.id);});
  var m=me(),mv=getV(m),mine=mv?mv.t:null;
  var rows=aliveIds().filter(function(id){return id!==MY;}).map(function(id){
    var on=mine===id;
    return '<button class="row'+(on?' sel':'')+'" data-act="ovote" data-id="'+esc(id)+'" aria-pressed="'+on+'"><span class="bub">'+(on?icon('check',22):initial(nm(id)))+'</span><div class="t"><b>'+esc(nm(id))+'</b></div></button>';
  }).join('');
  var al=aliveIds(),done=al.filter(function(id){return !!getV(byId(id));}).length;
  return '<div style="display:grid;gap:10px">'+rows+'</div>'+
    '<button class="btn soft" data-act="oskipvote"'+(mv&&mv.t===''?' aria-pressed="true"':'')+'>'+(mv&&mv.t===''?icon('check',20)+'You chose not to vote':'Skip voting')+'</button>'+
    '<p class="hint c">'+done+' of '+al.length+' players have responded. Tap your choice again to change it.</p>';
}

/* tally */
function vTally(){
  var T=P.tally||{ids:[],counts:{}},out=T.out;
  var max=1;(T.ids||[]).forEach(function(id){if((T.counts[id]||0)>max)max=T.counts[id];});
  var rows=(T.ids||[]).slice().sort(function(a,b){return (T.counts[b]||0)-(T.counts[a]||0);}).map(function(id){
    var c=T.counts[id]||0,hot=id===out;
    return '<div class="row"><span class="bub'+(hot?' red':'')+'">'+(hot?icon('vote',22):initial(nm(id)))+'</span><div class="t"><b>'+esc(nm(id))+'</b><div class="vbar"><i class="'+(hot?'hot':'')+'" style="width:'+(c/max*100)+'%"></i></div></div><span class="pts'+(c?'':' zero')+'">'+c+'</span></div>';
  }).join('');
  var head,sub;
  if(out){head=esc(nm(out));sub=T.wasImp?'was the imposter!':'was voted out. They were not the imposter.';}
  else{head='No one is out';sub='Nobody got more than half of the votes (needed '+T.need+' of '+T.n+'). The next lap starts.';}
  return '<div class="card center"><span class="lbl">Lap '+T.lap+' result</span><h2 class="big gt pop">'+head+'</h2><p class="mute">'+sub+'</p></div>'+
    '<div style="display:grid;gap:10px">'+rows+'</div><div class="foot"><div data-dyn="action"></div></div>';
}

/* guess */
function vGuess(){
  var imp=isImp(MY),g=getG(me());
  if(imp&&!g){
    var s=P.settings;
    return '<div class="card center"><span class="lbl">Caught!</span><h2 class="big gt">One guess left</h2><p class="mute">Guess the secret word to steal the win.</p>'+
      (s.hint!==false&&P.secret?'<span class="chip static">Category: '+esc(P.secret.cat)+'</span>':'')+'</div>'+timerCard('Time to guess')+
      '<div class="card"><label class="lbl" for="oguess">Your guess</label><input class="inp" id="oguess" maxlength="40" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the secret word">'+
      '<div class="duo"><button class="btn soft" data-act="oskip">Skip</button><button class="btn primary" data-act="oguess">'+icon('check',20)+'Guess</button></div></div><div class="foot"><div data-dyn="action"></div></div>';
  }
  return '<div class="card center"><span class="lbl">The imposter was caught</span><h2 class="big gt">'+esc(nm(P.imp))+'</h2><p class="mute">They get one guess at the secret word.</p></div>'+
    timerCard('Time to guess')+'<div class="foot"><div data-dyn="action"></div></div>';
}
function dynStatus(){
  if(P.phase==='deal')return statusCard('Ready',isRdy);
  return '';
}
function dynAction(){
  var host=P.host===MY,ph=P.phase,pl=O.players,n=pl.length;
  if(ph==='lobby'){
    if(!host)return '<p class="hint c">Waiting for the host to start the round.</p>';
    return '<button class="btn primary" data-act="ostart"'+(n<MIN_PLAYERS?' disabled':'')+'>'+icon('play',20)+'Start round</button>'+(n<MIN_PLAYERS?'<p class="hint c">Need at least '+MIN_PLAYERS+' players. Now: '+n+'.</p>':'');
  }
  /* nobody, not even the host, can skip a turn or end a vote early: timers and players decide */
  if(ph==='tally')return '<p class="hint c">The next lap starts in a moment.</p>';
  return '';
}

/* result */
function vResult(){
  var R=P.result;if(!R)return '';
  var cols=['#2563eb','#e11d48','#6ea0ff','#ff5c78','#1d4ed8','#fb7185'],conf='';
  for(var i=0;i<34;i++)conf+='<i style="--x:'+rnd(100)+'%;--d:'+(2.2+Math.random()*1.8).toFixed(2)+'s;--dl:'+(Math.random()*.8).toFixed(2)+'s;--r:'+(rnd(720)-360)+'deg;--c:'+cols[i%cols.length]+'"></i>';
  var why={caught:'The imposter was voted out and missed the word.',stolen:'The imposter was caught, then guessed the word.','two-left':'Only two players were left, so the imposter wins.',left:'The imposter left the game.'}[R.reason]||'';
  var pts=O.players.filter(function(p){return (R.pts||{})[p.id]>0;}).map(function(p){
    return '<div class="row mini"><span class="bub sm">'+initial(p.name)+'</span><div class="t"><b>'+esc(p.name)+'</b></div><span class="pts">+'+R.pts[p.id]+'</span></div>';
  }).join('')||'<p class="mute">No points this round.</p>';
  var sc=P.scores||{},ranked=O.players.slice().sort(function(a,b){return (sc[b.id]||0)-(sc[a.id]||0);}),best=ranked.length?(sc[ranked[0].id]||0):0;
  var board=ranked.map(function(p,i){
    var lead=best>0&&(sc[p.id]||0)===best;
    return '<div class="row mini"><span class="bub sm'+(lead?' red':'')+'">'+(lead?icon('crown',18):(i+1))+'</span><div class="t"><b>'+esc(p.name)+(p.id===MY?' (you)':'')+'</b></div><span class="pts'+(sc[p.id]?'':' zero')+'">'+(sc[p.id]||0)+'</span>'+
      (P.host===MY&&p.id!==MY?'<button class="iconbtn" data-act="okick" data-id="'+esc(p.id)+'" aria-label="Remove '+esc(p.name)+'">'+icon('trash',18)+'</button>':'')+'</div>';
  }).join('');
  return '<div class="confetti" aria-hidden="true">'+conf+'</div>'+
    '<div class="card center"><span class="lbl">Round '+P.round+' result</span><h2 class="big gt pop">'+(R.win==='crew'?'The crew wins!':'The imposter wins!')+'</h2><p class="mute">'+why+'</p></div>'+
    '<div class="sec"><span class="lbl">The imposter was</span></div>'+
    '<div class="row"><span class="bub red">'+icon('eyeOff',22)+'</span><div class="t"><b>'+esc(nm(R.imp))+'</b>'+(R.guess?'<span>Guessed "'+esc(R.guess)+'"</span>':'')+'</div></div>'+
    '<div class="card center"><span class="lbl">The secret word</span><div class="word-out gt">'+esc(R.word)+'</div><span class="chip static">'+esc(R.cat)+(R.hint?' · hint: '+esc(R.hint):'')+'</span></div>'+
    '<div class="card"><span class="lbl">'+icon('star',16)+'Points this round</span><div class="plist">'+pts+'</div></div>'+
    '<div class="card"><span class="lbl">'+icon('trophy',16)+'Scoreboard</span><div class="plist">'+board+'</div></div>'+
    '<div class="foot">'+(P.host===MY
      ?'<button class="btn primary" data-act="onext">'+icon('refresh',20)+'Next round</button><button class="btn soft" data-act="olobby">Back to lobby</button>'
      :'<button class="btn soft" disabled>Waiting for the host…</button>')+'</div>';
}

/* ---------- chat ---------- */
function msgNode(it){
  var d=document.createElement('div');d.className='msg'+(it.me?' me':'');
  var s=document.createElement('small');s.textContent=it.me?'You':it.n;
  var t=document.createElement('span');t.textContent=it.t;
  d.appendChild(s);d.appendChild(t);return d;
}
function renderMsgs(){
  var box=document.getElementById('msgs');if(!box)return;
  box.textContent='';
  if(!O.chat.length){var e=document.createElement('p');e.className='mute';e.textContent='No messages yet. Say hi.';box.appendChild(e);}
  else O.chat.forEach(function(it){box.appendChild(msgNode(it));});
  box.scrollTop=box.scrollHeight;
}
function addMsg(it){
  var box=document.getElementById('msgs');if(!box)return;
  var first=box.querySelector('p.mute');if(first)box.removeChild(first);
  box.appendChild(msgNode(it));box.scrollTop=box.scrollHeight;
}
function updBadge(){var b=document.getElementById('chatBadge');if(!b)return;b.hidden=!O.unread;b.textContent=O.unread>9?'9+':String(O.unread);}
function openChat(on){
  O.chatOpen=on;
  var sh=document.getElementById('chatsheet');if(!sh)return;
  sh.hidden=!on;
  if(on){O.unread=0;updBadge();renderMsgs();var c=document.getElementById('chatIn');if(c){c.value=O.draft.chatIn||'';try{c.focus();}catch(e){}}}
}
/* ---------- timers: turn clock, voting clock, guess clock, host duties ---------- */
/* ---------- input handling for online screens ---------- */
function onInput(el){
  var id=el.id;
  if(id==='nick'){O.nick=el.value;saveOL();}
  else if(id==='codeIn'){var c=el.value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(c!==el.value)el.value=c;O.codeIn=c;}
  else if(id==='clueIn'||id==='oguess'||id==='chatIn'){O.draft[id]=el.value;}
}
function onKey(e){
  if(e.key!=='Enter')return false;
  var map={codeIn:'ojoin',nick:O.invite?'ojoin':'ocreate',clueIn:'oclue',oguess:'oguess'};
  var act=map[e.target.id];
  if(!act)return false;
  e.preventDefault();
  var b=app.querySelector('[data-act="'+act+'"]');if(b&&!b.disabled)b.click();
  return true;
}
app.addEventListener('submit',function(e){
  if(e.target&&e.target.id==='chatForm'){e.preventDefault();sendChat();}
});

/* ---------- online actions ---------- */
function cleanClue(t){return String(t||'').trim().split(/\s+/)[0].replace(/[^\w'\-]/g,'').slice(0,20);}
/* ======================================================================
   7. BOOT
   ====================================================================== */
loadOL();
load();
render();
initOnline();
})();
