/* ============================================================================
 * Lueurs — moteur de jeu multijoueur (original, mécanique d'association)
 * - Supabase Realtime pour sync
 * - 60 cartes SVG procédurales générées à la volée
 * - Mots fournis par Djibril
 * ============================================================================ */

const SUPABASE_URL = 'https://nbnbsljqtolzzuqnkyae.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ibmJzbGpxdG9senp1cW5reWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODk2MDYsImV4cCI6MjA4Mzk2NTYwNn0.0Io_TLbntyxYeUUcv_krbcl4txHp6wSwdMy_BzORmV4';

// Init Supabase client
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }
});

// ── WORD POOL (fournie par Djibril, 120 mots) ─────────────────────────────
const WORDS = [
  // Émotions / sensations
  "Joie","Tristesse","Colère","Peur","Courage","Honte","Solitude","Nostalgie","Espoir","Jalousie",
  "Sérénité","Surprise","Désir","Mélancolie","Passion","Calme","Stress","Liberté","Folie","Innocence",
  // Fantastique / rêve
  "Magie","Dragon","Fantôme","Rêve","Illusion","Malédiction","Royaume","Sorcier","Monstre","Fée",
  "Labyrinthe","Métamorphose","Chimère","Secret","Miracle","Sortilège","Créature","Énigme","Légende","Portail",
  // Temps / espace
  "Futur","Passé","Éternité","Mémoire","Voyage","Temps","Infini","Horloge","Crépuscule","Aube",
  "Nuit","Hier","Demain","Univers","Constellation","Éclipse","Dimension","Vitesse","Cycle","Destin",
  // Actions / concepts
  "Chute","Ascension","Transformation","Rencontre","Fuite","Combat","Danse","Création","Destruction","Découverte",
  "Sacrifice","Renaissance","Explosion","Réunion","Quête","Oubli","Protection","Tentation","Victoire","Défaite",
  // Objets / symboles
  "Clef","Miroir","Masque","Couronne","Livre","Bougie","Épée","Porte","Marionnette","Ballon",
  "Valise","Carte","Échelle","Cage","Lanterne","Fil","Boussole","Parapluie","Coffre","Étoile",
  // Ambiances
  "Silence","Chaos","Harmonie","Mystère","Fête","Ruine","Luxe","Pauvreté","Ombre","Lumière",
  "Vide","Bruit","Cauchemar","Paradis","Enfer","Fragilité","Abandon","Révolution","Prison","Refuge"
];

// ── PROCEDURAL CARD GENERATOR (60 cartes uniques, abstraites) ──────────────
const CARD_PALETTES = [
  ['#1a1426','#4a3c8c','#9b6dd9'],
  ['#0f0c1c','#d4145a','#f5c54a'],
  ['#241936','#1d8a6f','#3ec98a'],
  ['#0f1a2c','#3b82f6','#f5c54a'],
  ['#2a0e1c','#c73e3a','#ffb085'],
  ['#0e1f1a','#10b981','#fbbf24'],
  ['#1a0e2a','#a855f7','#ec4899'],
  ['#1f1410','#e85d2c','#facc15'],
  ['#0e1820','#06b6d4','#a7f3d0'],
  ['#1a1a2e','#fb923c','#fecaca'],
];

const CARD_SYMBOLS = [
  '✦','☾','✧','❋','◈','◊','◉','◎','⌬','⌖','✿','❀','⚘','☀','✺','✹','❂','✻','✽','❅',
  '♆','♅','♄','♃','♀','☿','🜂','🜁','🜄','🜃','⚛','☯','⚕','♾','∞','◬','▲','▽','◇','○',
  '☉','☽','♔','♛','♜','♝','♞','♟','♚','✣','✤','✥','✜','✞','✟','✠','✡','✢','✦','✧'
];

function seedRand(seed){
  // Mulberry32 simple PRNG
  let t = seed | 0;
  return function(){
    t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Nombre de cartes IA disponibles (00.jpg → 39.jpg)
const AI_CARDS_COUNT = 40;

function generateCardVisual(cardId){
  // Si on a une image IA pour cet ID, on l'utilise. Sinon SVG procédural.
  if(cardId < AI_CARDS_COUNT){
    const idx = String(cardId).padStart(2,'0');
    return `<div class="card-img" style="background-image:url('cards/${idx}.jpg');background-size:cover;background-position:center;width:100%;height:100%"></div>`;
  }
  return generateCardSVG(cardId);
}

function generateCardSVG(cardId){
  // cardId = 0..59 : génère une carte SVG reproducible
  const rng = seedRand(cardId * 7919 + 1234567);
  const palette = CARD_PALETTES[cardId % CARD_PALETTES.length];
  const sym = CARD_SYMBOLS[(cardId * 13) % CARD_SYMBOLS.length];
  const symRot = Math.floor(rng() * 360);
  const cx = 30 + rng() * 40;
  const cy = 30 + rng() * 40;
  const r1 = 30 + rng() * 30;
  const r2 = 20 + rng() * 20;
  const gradAngle = Math.floor(rng() * 360);
  const stops = palette.map((c,i)=>`<stop offset="${i*50}%" stop-color="${c}"/>`).join('');
  // Random shapes
  const shapes = [];
  for(let i=0;i<3;i++){
    const sx = rng() * 100, sy = rng() * 140;
    const sr = 10 + rng() * 30;
    const op = .15 + rng() * .25;
    const fill = palette[1 + (i % 2)];
    if(rng() > .5){
      shapes.push(`<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${sr.toFixed(1)}" fill="${fill}" opacity="${op.toFixed(2)}"/>`);
    } else {
      // Star polygon
      const pts = [];
      const spikes = 5 + Math.floor(rng() * 3);
      const outer = sr, inner = sr*.4;
      for(let k=0;k<spikes*2;k++){
        const rr = k%2===0 ? outer : inner;
        const a = (k * Math.PI / spikes) - Math.PI/2;
        pts.push(`${(sx+rr*Math.cos(a)).toFixed(1)},${(sy+rr*Math.sin(a)).toFixed(1)}`);
      }
      shapes.push(`<polygon points="${pts.join(' ')}" fill="${fill}" opacity="${op.toFixed(2)}"/>`);
    }
  }
  // Random lines / waves
  const lines = [];
  for(let i=0;i<2;i++){
    const y = 20 + rng() * 120;
    const path = `M -10 ${y} Q ${rng()*100} ${y - 20 + rng()*40} ${rng()*100+30} ${y + rng()*30} T 110 ${y}`;
    lines.push(`<path d="${path}" stroke="${palette[2]}" stroke-width="${(.5 + rng()*1).toFixed(2)}" fill="none" opacity="${(.3+rng()*.3).toFixed(2)}"/>`);
  }
  // Big symbol
  const symSize = 60 + rng() * 30;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g${cardId}" gradientTransform="rotate(${gradAngle})">
        ${stops}
      </linearGradient>
      <radialGradient id="r${cardId}" cx="${cx}%" cy="${cy}%" r="${r1}%">
        <stop offset="0%" stop-color="${palette[2]}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${palette[0]}" stop-opacity="0"/>
      </radialGradient>
      <filter id="noise${cardId}" x="0" y="0">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${cardId}"/>
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.07 0"/>
        <feComposite in2="SourceGraphic" operator="in"/>
      </filter>
    </defs>
    <rect width="100" height="140" fill="url(#g${cardId})"/>
    <rect width="100" height="140" fill="url(#r${cardId})"/>
    ${shapes.join('\n')}
    ${lines.join('\n')}
    <text x="50" y="${60 + rng()*30}" font-family="Georgia" font-size="${symSize}" fill="${palette[2]}" opacity="${(.55 + rng()*.25).toFixed(2)}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${symRot} 50 70)">${sym}</text>
    <rect width="100" height="140" filter="url(#noise${cardId})"/>
  </svg>`;
}

// ── STATE ──────────────────────────────────────────────────────────────────
let state = {
  player: null,         // {id, name, color, room_id, is_host}
  room: null,           // current room object
  players: [],          // all players in room
  selectedColor: null,
  channel: null,        // realtime channel
  myStars: 0,           // round-local stars
  myFallen: false,
};

// ── HELPERS ────────────────────────────────────────────────────────────────
function $(id){ return document.getElementById(id); }
function $$(s){ return document.querySelectorAll(s); }
function showScreen(name){
  $$('.screen').forEach(s => s.classList.remove('is-active'));
  $(`screen-${name}`).classList.add('is-active');
  window.scrollTo({top:0,behavior:'smooth'});
}
function toast(msg, cls){
  const div = document.createElement('div');
  div.className = 'toast' + (cls ? ' '+cls : '');
  div.textContent = msg;
  $('toasts').appendChild(div);
  setTimeout(()=>div.remove(), 2400);
}
function eventToast(text, type){
  const div = document.createElement('div');
  div.className = 'event-toast ' + (type || '');
  div.innerHTML = text;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(), 2600);
}
function colorHex(c){
  return {violet:'#9b6dd9',orange:'#e85d2c',bleu:'#3b82f6',rose:'#ec4899',vert:'#10b981',or:'#f5c54a'}[c] || '#fff';
}
function pickColor(picker, target){
  picker.querySelectorAll('.color-dot').forEach(d=>{
    d.addEventListener('click', ()=>{
      picker.querySelectorAll('.color-dot').forEach(x=>x.classList.remove('is-active'));
      d.classList.add('is-active');
      target.value = d.dataset.c;
    });
  });
}
function genCode(){
  const ch = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for(let i=0;i<4;i++) s += ch[Math.floor(Math.random()*ch.length)];
  return s;
}
function pickN(arr, n){
  const copy = [...arr];
  const out = [];
  for(let i=0;i<n && copy.length;i++){
    const idx = Math.floor(Math.random()*copy.length);
    out.push(copy.splice(idx,1)[0]);
  }
  return out;
}

// ── BIND lobby color pickers ───────────────────────────────────────────────
const hostColorInput = document.createElement('input');
hostColorInput.type='hidden'; hostColorInput.id='host-color-val';
document.body.appendChild(hostColorInput);
const joinColorInput = document.createElement('input');
joinColorInput.type='hidden'; joinColorInput.id='join-color-val';
document.body.appendChild(joinColorInput);
pickColor($('host-colors'), hostColorInput);
pickColor($('join-colors'), joinColorInput);

// ── CREATE ROOM ────────────────────────────────────────────────────────────
$('btn-create').addEventListener('click', async () => {
  const name = $('host-name').value.trim();
  const color = hostColorInput.value;
  if(!name){ toast('Prénom requis'); return; }
  if(!color){ toast('Choisis une couleur'); return; }
  $('btn-create').disabled = true; $('btn-create').textContent = 'Création…';

  // Generate unique code
  let code, attempts = 0;
  while(attempts < 5){
    code = genCode();
    const { data } = await sb.from('lueurs_rooms').select('id').eq('code', code).maybeSingle();
    if(!data) break;
    attempts++;
  }

  const { data: room, error } = await sb.from('lueurs_rooms').insert({
    code, state:'lobby', round_n:0
  }).select().single();
  if(error){ toast('Erreur : '+error.message); $('btn-create').disabled = false; $('btn-create').textContent = 'Créer le salon ✦'; return; }

  const { data: player, error: e2 } = await sb.from('lueurs_players').insert({
    room_id: room.id, name, color, is_host: true
  }).select().single();
  if(e2){ toast('Erreur joueur : '+e2.message); return; }

  await sb.from('lueurs_rooms').update({ host_id: player.id }).eq('id', room.id);

  state.player = player;
  state.room = room;
  localStorage.setItem('lueurs_player_id', player.id);
  localStorage.setItem('lueurs_room_id', room.id);
  joinRoomRealtime(room.id);
  $('lobby-code-big').textContent = code;
  $('room-code-display').textContent = code;
  $('room-chip').style.display = '';
  $('lobby-host-controls').style.display = '';
  $('lobby-wait-msg').style.display = 'none';
  showScreen('waiting');
  await refreshPlayers();
});

// ── JOIN ROOM ──────────────────────────────────────────────────────────────
$('btn-join').addEventListener('click', async () => {
  const code = $('join-code').value.trim().toUpperCase();
  const name = $('join-name').value.trim();
  const color = joinColorInput.value;
  if(!code || code.length !== 4){ toast('Code 4 caractères'); return; }
  if(!name){ toast('Prénom requis'); return; }
  if(!color){ toast('Choisis une couleur'); return; }
  $('btn-join').disabled = true; $('btn-join').textContent = 'Connexion…';
  const { data: room } = await sb.from('lueurs_rooms').select('*').eq('code', code).maybeSingle();
  if(!room){ toast('Salon introuvable'); $('btn-join').disabled=false; $('btn-join').textContent='Rejoindre →'; return; }
  if(room.state !== 'lobby'){ toast('Partie déjà commencée'); $('btn-join').disabled=false; $('btn-join').textContent='Rejoindre →'; return; }

  // Check color not taken
  const { data: existing } = await sb.from('lueurs_players').select('color').eq('room_id', room.id);
  if(existing && existing.some(p=>p.color===color)){ toast('Couleur déjà prise'); $('btn-join').disabled=false; $('btn-join').textContent='Rejoindre →'; return; }
  if(existing && existing.length >= 6){ toast('Salon plein (6 max)'); $('btn-join').disabled=false; $('btn-join').textContent='Rejoindre →'; return; }

  const { data: player } = await sb.from('lueurs_players').insert({
    room_id: room.id, name, color, is_host: false
  }).select().single();

  state.player = player;
  state.room = room;
  localStorage.setItem('lueurs_player_id', player.id);
  localStorage.setItem('lueurs_room_id', room.id);
  joinRoomRealtime(room.id);
  $('lobby-code-big').textContent = code;
  $('room-code-display').textContent = code;
  $('room-chip').style.display = '';
  $('lobby-wait-msg').style.display = '';
  showScreen('waiting');
  await refreshPlayers();
});

// ── REALTIME CHANNEL ───────────────────────────────────────────────────────
function joinRoomRealtime(roomId){
  if(state.channel) state.channel.unsubscribe();
  state.channel = sb.channel('lueurs:'+roomId)
    .on('postgres_changes', { event:'*', schema:'public', table:'lueurs_rooms', filter:`id=eq.${roomId}` }, (payload) => {
      state.room = payload.new;
      handleRoomUpdate();
    })
    .on('postgres_changes', { event:'*', schema:'public', table:'lueurs_players', filter:`room_id=eq.${roomId}` }, async () => {
      await refreshPlayers();
      // Si je suis sur announce et tout le monde a déclaré, host peut avancer
      if(state.room && state.room.state === 'associate' && state.player.is_host){
        await maybeAdvanceToAnnounce();
      }
    })
    .subscribe();
}

async function refreshPlayers(){
  if(!state.room) return;
  const { data } = await sb.from('lueurs_players').select('*').eq('room_id', state.room.id).order('joined_at');
  state.players = data || [];
  // Update lobby UI
  $('lobby-count').textContent = state.players.length;
  $('lobby-players').innerHTML = state.players.map(p => `
    <div class="player-row">
      <div class="pdot" style="background:${colorHex(p.color)}"></div>
      <div class="pname">${escapeHTML(p.name)}</div>
      ${p.is_host ? '<div class="ptag">HOST</div>' : ''}
    </div>
  `).join('');
  $('btn-start').disabled = state.players.length < 3;
  // Re-render announce list if visible
  if(state.room.state === 'announce'){ renderAnnounce(); }
  if(state.room.state === 'reveal'){ renderRevealBoard(); renderEclaireurBanner(); }
  if(state.room.state === 'scoring'){ renderScoring(); }
  if(state.room.state === 'finished'){ renderFinished(); }
}

function escapeHTML(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── HOST: START GAME ────────────────────────────────────────────────────────
$('btn-start').addEventListener('click', async () => {
  if(!state.player.is_host) return;
  $('btn-start').disabled = true; $('btn-start').textContent = 'Lancement…';
  await startRound(1);
});

async function startRound(n){
  // Pick word + 15 unique cards
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const board = pickN([...Array(60).keys()], 15);
  // Choose first eclaireur randomly (or rotate)
  const fe = state.players[Math.floor(Math.random() * state.players.length)].id;
  await sb.from('lueurs_rooms').update({
    state:'associate', round_n:n, word, board_cards:board,
    obscurity_player:null, reveal_order:[], reveal_pointer:0,
    fallen_players:[], revealed_cards:[], first_eclaireur: fe
  }).eq('id', state.room.id);
  // Reset all players: selections=[], declared_count=0, stars_round=0
  await sb.from('lueurs_players').update({
    selections:[], declared_count:0, stars_round:0
  }).eq('room_id', state.room.id);
}

// ── HANDLE ROOM STATE TRANSITIONS ──────────────────────────────────────────
async function handleRoomUpdate(){
  if(!state.room) return;
  $('round-chip').style.display = '';
  $('round-n').textContent = state.room.round_n;

  switch(state.room.state){
    case 'lobby':
      showScreen('waiting');
      break;
    case 'associate':
      showScreen('associate');
      renderAssociateBoard();
      // Reset my local selections from server
      await loadMySelections();
      break;
    case 'announce':
      showScreen('announce');
      renderAnnounce();
      break;
    case 'reveal':
      showScreen('reveal');
      renderRevealBoard();
      renderEclaireurBanner();
      break;
    case 'scoring':
      showScreen('scoring');
      renderScoring();
      break;
    case 'finished':
      showScreen('finished');
      renderFinished();
      break;
  }
}

// ── PHASE 1 — ASSOCIATE (private selection) ───────────────────────────────
async function loadMySelections(){
  const { data: me } = await sb.from('lueurs_players').select('selections').eq('id', state.player.id).maybeSingle();
  if(!me) return;
  // Re-mark cards
  const sels = me.selections || [];
  document.querySelectorAll('#board-associate .card').forEach(c => {
    const id = parseInt(c.dataset.cardId);
    if(sels.includes(id)) c.classList.add('is-picked');
    else c.classList.remove('is-picked');
  });
  updateSelCounter(sels.length);
}

function renderAssociateBoard(){
  $('word-display').textContent = state.room.word || '—';
  const board = state.room.board_cards || [];
  $('board-associate').innerHTML = board.map((cid,i) => `
    <div class="card" data-card-id="${cid}" data-board-idx="${i}">${generateCardVisual(cid)}
      <div class="card-num">${i+1}</div>
    </div>
  `).join('');
  document.querySelectorAll('#board-associate .card').forEach(c => {
    c.addEventListener('click', () => toggleSelect(c));
  });
}

function updateSelCounter(n){
  $('sel-count').innerHTML = n + '<small> /10</small>';
  $('btn-validate-sel').disabled = (n < 1);
  $('sel-hint').textContent = n === 0 ? 'Choisis au moins 1 carte pour valider'
    : (n < 10 ? `${n} carte${n>1?'s':''} sélectionnée${n>1?'s':''}. Tu peux en choisir plus, mais attention à ne pas être trop ambitieux !`
    : 'Maximum atteint (10).');
}

function toggleSelect(cardEl){
  const id = parseInt(cardEl.dataset.cardId);
  const picked = cardEl.classList.toggle('is-picked');
  let sels = Array.from(document.querySelectorAll('#board-associate .card.is-picked')).map(c => parseInt(c.dataset.cardId));
  if(sels.length > 10){
    cardEl.classList.remove('is-picked');
    sels = sels.filter(x => x !== id);
    toast('Max 10 cartes');
  }
  updateSelCounter(sels.length);
  // Persist (debounced)
  clearTimeout(window._selPersistTimer);
  window._selPersistTimer = setTimeout(async () => {
    await sb.from('lueurs_players').update({ selections: sels, declared_count: sels.length }).eq('id', state.player.id);
  }, 300);
}

$('btn-validate-sel').addEventListener('click', async () => {
  const sels = Array.from(document.querySelectorAll('#board-associate .card.is-picked')).map(c => parseInt(c.dataset.cardId));
  if(sels.length < 1){ toast('Minimum 1 carte'); return; }
  $('btn-validate-sel').disabled = true;
  $('btn-validate-sel').textContent = 'Validé ✓';
  await sb.from('lueurs_players').update({ selections: sels, declared_count: sels.length }).eq('id', state.player.id);
  toast('Sélection validée ✦', 'ok');
  document.querySelectorAll('#board-associate .card').forEach(c => c.style.pointerEvents = 'none');
  // Mark me as locked
  state.player.declared_count = sels.length;
  // Host check
  if(state.player.is_host){
    setTimeout(maybeAdvanceToAnnounce, 500);
  } else {
    $('sel-hint').textContent = 'En attente des autres joueurs…';
  }
});

async function maybeAdvanceToAnnounce(){
  // All players must have declared (declared_count > 0)
  await refreshPlayers();
  const allDeclared = state.players.every(p => (p.declared_count || 0) >= 1);
  if(allDeclared && state.room.state === 'associate'){
    // Determine obscurity: player with strictly highest declared_count
    const counts = state.players.map(p=>p.declared_count);
    const max = Math.max(...counts);
    const leaders = state.players.filter(p => p.declared_count === max);
    const obscurity = (leaders.length === 1) ? leaders[0].id : null;
    await sb.from('lueurs_rooms').update({ state:'announce', obscurity_player: obscurity }).eq('id', state.room.id);
  }
}

// ── PHASE 2 — ANNOUNCE ────────────────────────────────────────────────────
function renderAnnounce(){
  const list = $('announce-list');
  list.innerHTML = state.players.map(p => `
    <div class="announce-row ${state.room.obscurity_player===p.id?'obscurity':''}">
      <div class="pdot" style="background:${colorHex(p.color)}"></div>
      <div>
        <div class="pname">${escapeHTML(p.name)}${p.is_host?' <span style="font-family:var(--mono);font-size:9px;color:rgba(243,236,223,.4);letter-spacing:.08em">HOST</span>':''}</div>
        ${state.room.obscurity_player===p.id?'<div class="ptag">⚠ EN OBSCURITÉ</div>':''}
      </div>
      <div class="pcount">${p.declared_count} <span style="font-family:var(--serif);font-style:italic;color:rgba(243,236,223,.5);font-weight:400;font-size:.7em">cartes</span></div>
    </div>
  `).join('');
  $('btn-go-reveal').style.display = state.player.is_host ? '' : 'none';
  $('announce-wait-msg').style.display = state.player.is_host ? 'none' : '';
}

$('btn-go-reveal').addEventListener('click', async () => {
  // Reveal order: clockwise from first_eclaireur. But first_eclaireur stays for whole round.
  // Simple : ordre = joueurs dans l'ordre joined_at, à partir de first_eclaireur, en boucle.
  const fe = state.room.first_eclaireur;
  const sortedJoined = [...state.players].sort((a,b)=> new Date(a.joined_at) - new Date(b.joined_at));
  const startIdx = Math.max(0, sortedJoined.findIndex(p => p.id === fe));
  const order = [];
  for(let i=0;i<sortedJoined.length;i++){
    order.push(sortedJoined[(startIdx + i) % sortedJoined.length].id);
  }
  await sb.from('lueurs_rooms').update({
    state:'reveal', reveal_order: order, reveal_pointer: 0,
    fallen_players: [], revealed_cards: []
  }).eq('id', state.room.id);
});

// ── PHASE 3 — REVEAL ──────────────────────────────────────────────────────
function currentEclaireurId(){
  const order = state.room.reveal_order || [];
  const ptr = state.room.reveal_pointer || 0;
  if(ptr >= order.length) return null;
  return order[ptr];
}

function renderEclaireurBanner(){
  $('word-reveal').textContent = state.room.word || '—';
  const eid = currentEclaireurId();
  if(!eid){ return; }
  const ec = state.players.find(p => p.id === eid);
  $('eclaireur-name').textContent = ec ? ec.name : '—';
  if(state.player.id === eid){
    $('eclaireur-action').innerHTML = `<span style="color:var(--gold-bright)">✦ C'est à toi ! Désigne une de tes cartes.</span>`;
    $('reveal-wait-msg').style.display = 'none';
    $('reveal-mine-pending').style.display = '';
  } else {
    $('eclaireur-action').textContent = 'Choisit une de ses cartes…';
    $('reveal-wait-msg').style.display = '';
    $('reveal-mine-pending').style.display = 'none';
  }
}

function renderRevealBoard(){
  const board = state.room.board_cards || [];
  const revealed = state.room.revealed_cards || [];
  const revealedIds = new Set(revealed.map(r => r.card_id));
  const me = state.players.find(p => p.id === state.player.id);
  const mySels = new Set(me?.selections || []);
  const myFallen = (state.room.fallen_players || []).includes(state.player.id);
  const isMyTurn = currentEclaireurId() === state.player.id;

  $('board-reveal').innerHTML = board.map((cid, i) => {
    const revInfo = revealed.find(r => r.card_id === cid);
    const isRevealed = !!revInfo;
    const revType = revInfo?.type;
    const inMySels = mySels.has(cid);
    const playable = isMyTurn && inMySels && !isRevealed && !myFallen;
    let cls = 'card';
    if(isRevealed){
      if(revType === 'fall') cls += ' is-revealed-fall';
      else cls += ' is-revealed';
    }
    if(playable) cls += ' playable';
    if(myFallen && !isRevealed) cls += ' is-fallen';
    return `<div class="${cls}" data-card-id="${cid}" data-board-idx="${i}" ${playable?'data-clickable="1"':''}>
      ${generateCardVisual(cid)}
      <div class="card-num">${i+1}</div>
      ${isRevealed?`<div class="card-spark">${revType==='super'?'✦✦':revType==='spark'?'✦':'✗'}</div>`:''}
    </div>`;
  }).join('');
  document.querySelectorAll('#board-reveal .card[data-clickable="1"]').forEach(c => {
    c.addEventListener('click', () => designateCard(parseInt(c.dataset.cardId)));
  });
}

async function designateCard(cardId){
  if(currentEclaireurId() !== state.player.id) return;
  // Determine spark type
  const otherPlayers = state.players.filter(p => p.id !== state.player.id);
  const fallenIds = state.room.fallen_players || [];
  const validOthers = otherPlayers.filter(p => !fallenIds.includes(p.id) && (p.selections || []).includes(cardId));
  // Spark / Super Spark / Fall
  let type, matchedIds = [];
  if(validOthers.length === 0){
    type = 'fall';
  } else if(validOthers.length === 1){
    type = 'super';
    matchedIds = validOthers.map(p => p.id);
  } else {
    type = 'spark';
    matchedIds = validOthers.map(p => p.id);
  }

  // Build new state
  const revealed = [...(state.room.revealed_cards || [])];
  revealed.push({ card_id: cardId, eclaireur_id: state.player.id, type, matched_players: matchedIds });

  // Update fallen + advance pointer
  let fallen = [...fallenIds];
  if(type === 'fall' && !fallen.includes(state.player.id)) fallen.push(state.player.id);

  // Award stars : for spark/super, eclaireur and matched players gain
  // 2 stars each (spark) or 3 stars each (super). For fall, eclaireur gets 0 BUT also penalize obscurity later.
  // ALSO : players already fallen during this round don't gain stars even if they had the card.
  // Apply to lueurs_players.stars_round
  if(type !== 'fall'){
    const benefitIds = [state.player.id, ...matchedIds].filter(pid => !fallen.includes(pid) || pid === state.player.id);
    // L'éclaireur n'est pas dans fallen ici sauf si fall (donc ok)
    const reward = (type === 'super') ? 3 : 2;
    for(const pid of benefitIds){
      const p = state.players.find(x => x.id === pid);
      if(!p) continue;
      await sb.from('lueurs_players').update({ stars_round: (p.stars_round||0) + reward }).eq('id', pid);
    }
  }

  // Advance pointer until a non-fallen player with remaining selections
  let ptr = state.room.reveal_pointer + 1;
  const order = state.room.reveal_order;
  // Check end condition AFTER eclaireur tour
  // Compute new pointer = next valid eclaireur
  let endRound = false;
  let tries = 0;
  while(tries < order.length * 2){
    if(ptr >= order.length) ptr = 0;
    const candId = order[ptr];
    if(!fallen.includes(candId)){
      // Has remaining un-revealed selections?
      const cand = state.players.find(p => p.id === candId);
      const revealedCardIds = new Set(revealed.map(r => r.card_id));
      const remaining = (cand?.selections || []).filter(c => !revealedCardIds.has(c));
      if(remaining.length > 0) break;
    }
    ptr++;
    tries++;
    if(tries >= order.length){
      // No valid eclaireur left → fin reveal
      endRound = true;
      break;
    }
  }

  if(endRound){
    // All players fallen or out of cards → advance to scoring
    await sb.from('lueurs_rooms').update({
      revealed_cards: revealed, fallen_players: fallen,
      state:'scoring'
    }).eq('id', state.room.id);
    // Apply obscurity penalty
    await applyObscurityPenalty(revealed, fallen);
  } else {
    await sb.from('lueurs_rooms').update({
      revealed_cards: revealed, fallen_players: fallen, reveal_pointer: ptr
    }).eq('id', state.room.id);
  }

  // Toast event
  if(type === 'super') eventToast('✦✦ Super Étincelle !', 'super');
  else if(type === 'spark') eventToast('✦ Étincelle !', 'spark');
  else eventToast('✗ Chute', 'fall');
}

async function applyObscurityPenalty(revealed, fallen){
  // For obscurity player who fell, malus -1 per spark made
  const obs = state.room.obscurity_player;
  if(!obs) return;
  if(!fallen.includes(obs)) return; // no penalty if didn't fall
  // Count sparks (revealed entries) by obscurity player (as eclaireur) that didn't end in fall
  const sparks = revealed.filter(r => r.eclaireur_id === obs && r.type !== 'fall').length;
  if(sparks > 0){
    const p = state.players.find(pp => pp.id === obs);
    if(p){
      const newScore = Math.max(0, (p.stars_round || 0) - sparks);
      await sb.from('lueurs_players').update({ stars_round: newScore }).eq('id', obs);
    }
  }
}

// ── PHASE 4 — SCORING ─────────────────────────────────────────────────────
async function renderScoring(){
  $('scoring-round-n').textContent = state.room.round_n;
  // Compute stars_total update locally if host (to persist)
  // But the round-side stars are already in lueurs_players.stars_round
  // Apply stars_round → stars_total once
  if(state.player.is_host && !state.room._scoring_applied){
    // We need a flag to prevent double-apply. We use first reveal to check.
    // Easier: every host calls this on entry, but only persist once per round.
    // Better: store a marker in localstorage per round.
    const flagKey = `lueurs_scored_${state.room.id}_${state.room.round_n}`;
    if(!localStorage.getItem(flagKey)){
      for(const p of state.players){
        const newTot = (p.stars_total || 0) + (p.stars_round || 0);
        await sb.from('lueurs_players').update({ stars_total: newTot }).eq('id', p.id);
      }
      localStorage.setItem(flagKey, '1');
      await refreshPlayers(); // reload with new totals
    }
  }

  $('scoring-list').innerHTML = state.players.map(p => `
    <div class="player-row">
      <div class="pdot" style="background:${colorHex(p.color)}"></div>
      <div class="pname">${escapeHTML(p.name)} ${state.room.obscurity_player===p.id?'<span class="ptag" style="color:var(--magenta)">obscurité</span>':''}</div>
      <div class="pscore">+${p.stars_round||0} ✦</div>
    </div>
  `).join('');

  $('scoring-total-list').innerHTML = [...state.players].sort((a,b)=>(b.stars_total||0)-(a.stars_total||0)).map((p,i) => `
    <div class="player-row">
      <div style="font-family:var(--mono);font-size:11px;color:rgba(243,236,223,.5);min-width:18px">${i+1}.</div>
      <div class="pdot" style="background:${colorHex(p.color)}"></div>
      <div class="pname">${escapeHTML(p.name)}</div>
      <div class="pscore">${p.stars_total||0} ✦</div>
    </div>
  `).join('');

  $('btn-next-round').style.display = state.player.is_host ? '' : 'none';
  $('scoring-wait-msg').style.display = state.player.is_host ? 'none' : '';
  if(state.room.round_n >= 4){
    $('btn-next-round').textContent = 'Voir le vainqueur ✦';
  } else {
    $('btn-next-round').textContent = `Manche ${state.room.round_n + 1} →`;
  }
}

$('btn-next-round').addEventListener('click', async () => {
  if(state.room.round_n >= 4){
    await sb.from('lueurs_rooms').update({ state: 'finished' }).eq('id', state.room.id);
  } else {
    await startRound(state.room.round_n + 1);
  }
});

// ── FINISHED ──────────────────────────────────────────────────────────────
function renderFinished(){
  const sorted = [...state.players].sort((a,b)=>(b.stars_total||0)-(a.stars_total||0));
  const winner = sorted[0];
  $('winner-name').textContent = winner ? winner.name : '—';
  $('winner-name').style.color = winner ? colorHex(winner.color) : '';
  $('winner-score').textContent = (winner?.stars_total || 0) + ' étoiles';
  $('final-list').innerHTML = sorted.map((p,i) => `
    <div class="player-row">
      <div style="font-family:var(--mono);font-size:11px;color:rgba(243,236,223,.5);min-width:18px">${i+1}.</div>
      <div class="pdot" style="background:${colorHex(p.color)}"></div>
      <div class="pname">${escapeHTML(p.name)}</div>
      <div class="pscore">${p.stars_total||0} ✦</div>
    </div>
  `).join('');
}

// ── UTIL ──────────────────────────────────────────────────────────────────
window.copyRoomCode = function(){
  const code = state.room?.code;
  if(!code) return;
  navigator.clipboard.writeText(code).then(()=>toast('Code copié ✓','ok'));
};
window.showRules = function(){ $('modal-rules').classList.add('is-on'); };
window.hideRules = function(){ $('modal-rules').classList.remove('is-on'); };

// ═══════════════════════════════════════════════════════════════════════════
// LEAVE / DISSOLVE / NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════
function showConfirm(title, msg, onOk){
  $('confirm-title').textContent = title;
  $('confirm-msg').textContent = msg;
  $('modal-confirm').classList.add('is-on');
  const okBtn = $('confirm-ok');
  const cancelBtn = $('confirm-cancel');
  const close = () => { $('modal-confirm').classList.remove('is-on'); okBtn.replaceWith(okBtn.cloneNode(true)); };
  cancelBtn.onclick = close;
  $('confirm-ok').onclick = () => { close(); onOk && onOk(); };
}

window.askLeave = function(){
  if(!state.room){ goHome(); return; }
  if(state.player && state.player.is_host && state.room.state === 'lobby'){
    showConfirm('Dissoudre le salon ?',
      `Le salon ${state.room.code} sera fermé et tous les joueurs déconnectés.`,
      dissolveRoom);
  } else if(state.room.state === 'lobby' || state.room.state === 'finished'){
    showConfirm('Quitter le salon ?',
      `Tu sortiras du salon ${state.room.code}. Tu peux revenir avec le code.`,
      leaveRoom);
  } else {
    showConfirm('Quitter la partie ?',
      'Tu abandonnes cette partie en cours. Les autres joueurs continueront sans toi.',
      leaveRoom);
  }
  haptic(20);
};

window.goHome = function(){
  if(state.room) {
    askLeave();
    return;
  }
  cleanupLocal();
  showScreen('home');
  $('btn-back').style.display = 'none';
  $('round-chip').style.display = 'none';
  $('room-chip').style.display = 'none';
};

async function leaveRoom(){
  if(!state.player || !state.room) return cleanupLocal();
  try {
    await sb.from('lueurs_players').delete().eq('id', state.player.id);
  } catch(e){ console.warn('leave err', e); }
  cleanupLocal();
  showScreen('home');
  $('btn-back').style.display = 'none';
  $('round-chip').style.display = 'none';
  $('room-chip').style.display = 'none';
  toast('Tu as quitté le salon', 'ok');
}

async function dissolveRoom(){
  if(!state.room) return cleanupLocal();
  try {
    // Delete cascades to players via ON DELETE CASCADE
    await sb.from('lueurs_rooms').delete().eq('id', state.room.id);
  } catch(e){ console.warn('dissolve err', e); }
  cleanupLocal();
  showScreen('home');
  $('btn-back').style.display = 'none';
  $('round-chip').style.display = 'none';
  $('room-chip').style.display = 'none';
  toast('Salon dissout', 'ok');
}

function cleanupLocal(){
  if(state.channel){ try{ state.channel.unsubscribe(); }catch(e){} }
  state.player = null; state.room = null; state.players = []; state.channel = null;
  localStorage.removeItem('lueurs_player_id');
  localStorage.removeItem('lueurs_room_id');
  // Reset locked sels visuals
  document.querySelectorAll('#board-associate .card').forEach(c => {
    c.style.pointerEvents = '';
    c.classList.remove('is-picked');
  });
  $('btn-validate-sel').disabled = false;
  $('btn-validate-sel').textContent = 'Valider';
}

// Bind leave/dissolve buttons (lobby)
document.addEventListener('DOMContentLoaded', () => {
  const bd = $('btn-dissolve'); if(bd) bd.addEventListener('click', () => askLeave());
  const bl = $('btn-leave');    if(bl) bl.addEventListener('click', () => askLeave());
});
// Also bind right now (script loaded after DOM)
setTimeout(()=>{
  const bd = $('btn-dissolve'); if(bd && !bd._bound){ bd._bound=1; bd.addEventListener('click', () => askLeave()); }
  const bl = $('btn-leave');    if(bl && !bl._bound){ bl._bound=1; bl.addEventListener('click', () => askLeave()); }
}, 100);

// Hook showScreen to manage back button visibility + lobby leave buttons
const _origShowScreen = showScreen;
showScreen = function(name){
  _origShowScreen(name);
  $('btn-back').style.display = (name === 'home' || name === 'finished') ? 'none' : 'flex';
  // Show "Quitter" button to non-host in waiting screen
  if(name === 'waiting' && state.player){
    if(!state.player.is_host) $('btn-leave').style.display = '';
    else $('btn-leave').style.display = 'none';
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HAPTIC + SOUND (Web Audio API génératif)
// ═══════════════════════════════════════════════════════════════════════════
function haptic(ms){ if(navigator.vibrate) navigator.vibrate(ms); }

let _audioCtx = null;
function audioCtx(){
  if(!_audioCtx) try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
  return _audioCtx;
}
function tone(freq, duration, type='sine', gain=0.08){
  const ctx = audioCtx(); if(!ctx) return;
  if(ctx.state === 'suspended') ctx.resume();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  o.start();
  o.stop(ctx.currentTime + duration);
}
function sfxSpark(){
  // Cristallin: 3 tons ascendants courts
  tone(700, 0.12, 'sine', 0.06);
  setTimeout(()=>tone(900, 0.12, 'sine', 0.06), 80);
  setTimeout(()=>tone(1200, 0.18, 'sine', 0.07), 160);
  haptic(15);
}
function sfxSuper(){
  // Cristallin 5 tons + vibrato
  [600,800,1000,1200,1500].forEach((f,i)=>setTimeout(()=>tone(f,0.16,'triangle',0.07), i*60));
  haptic([20,40,20]);
}
function sfxFall(){
  // Descente sombre
  tone(220, 0.3, 'sawtooth', 0.06);
  setTimeout(()=>tone(150, 0.35, 'sawtooth', 0.05), 100);
  haptic([30,50,30]);
}
function sfxClick(){ tone(880, 0.05, 'square', 0.04); }
function sfxWin(){
  // Fanfare 8 notes
  const notes = [523,587,659,784,659,784,988,1175];
  notes.forEach((f,i)=>setTimeout(()=>tone(f, 0.18, 'triangle', 0.08), i*100));
  haptic([40,30,40,30,40,30,80]);
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLES CANVAS (étincelles flottantes en arrière-plan)
// ═══════════════════════════════════════════════════════════════════════════
(function initParticles(){
  const canvas = document.getElementById('particles-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W = 0, H = 0;
  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function spawn(n){
    for(let i=0;i<n;i++){
      particles.push({
        x: Math.random()*W,
        y: H + Math.random()*40,
        vx: (Math.random()-.5)*.3,
        vy: -.3 - Math.random()*.8,
        r: .5 + Math.random()*1.6,
        life: 1,
        decay: .003 + Math.random()*.005,
        hue: [40, 30, 320, 280, 200][Math.floor(Math.random()*5)],
      });
    }
  }

  function step(){
    ctx.clearRect(0,0,W,H);
    spawn(0.3); // densité subtile
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.life -= p.decay;
      if(p.life <= 0 || p.y < -20) { particles.splice(i,1); continue; }
      const alpha = p.life * .8;
      ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${alpha})`;
      ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, ${alpha})`;
      ctx.shadowBlur = 6 + p.r*4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    requestAnimationFrame(step);
  }
  // Spawn initial puis loop
  spawn(40);
  step();
})();

// Burst de particules localisé (clic sur carte etc.)
function burstParticles(x, y, color='#f5c54a'){
  const canvas = document.getElementById('particles-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const N = 16;
  for(let i=0;i<N;i++){
    const angle = (i / N) * Math.PI * 2;
    const speed = 2 + Math.random()*3;
    let px = x, py = y, vx = Math.cos(angle)*speed, vy = Math.sin(angle)*speed;
    let life = 1;
    function tick(){
      ctx.fillStyle = color + Math.floor(life*255).toString(16).padStart(2,'0');
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 2 + life*2, 0, Math.PI*2);
      ctx.fill();
      px += vx; py += vy; vy += 0.06;
      vx *= 0.97; vy *= 0.98;
      life -= 0.025;
      if(life > 0) requestAnimationFrame(tick);
    }
    tick();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFETTI HOOK (utilise canvas-confetti loaded via CDN)
// ═══════════════════════════════════════════════════════════════════════════
function celebrateWinner(){
  if(typeof confetti !== 'function') return;
  // Multi-burst over 2s
  confetti({ particleCount: 80, spread: 70, origin: { y: .6 }, colors:['#f5c54a','#e85d2c','#d4145a','#9b6dd9','#3ec98a','#3b82f6'] });
  setTimeout(()=>confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors:['#f5c54a','#e85d2c'] }), 250);
  setTimeout(()=>confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors:['#9b6dd9','#3ec98a'] }), 400);
  setTimeout(()=>confetti({ particleCount: 100, spread: 120, origin: { y: .45 }, scalar: 1.4, colors:['#f5c54a','#fff','#e85d2c'] }), 800);
  sfxWin();
}

// Hook sur fin de partie
const _origRenderFinished = renderFinished;
renderFinished = function(){
  _origRenderFinished();
  setTimeout(celebrateWinner, 400);
};

// Hook sur événements de reveal pour SFX + burst particles
const _origEventToast = eventToast;
eventToast = function(text, type){
  _origEventToast(text, type);
  if(type === 'super') sfxSuper();
  else if(type === 'spark') sfxSpark();
  else if(type === 'fall') sfxFall();
};

// Click feedback : sound + haptic léger sur boutons importants
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn, .card, .color-dot, .room-chip, .btn-back');
  if(btn){
    sfxClick();
    haptic(8);
    // Burst particles sur card click
    if(btn.classList.contains('card')){
      const r = btn.getBoundingClientRect();
      burstParticles(r.left + r.width/2, r.top + r.height/2, '#f5c54a');
    }
  }
}, { capture: true });

// ── RECONNECT (refresh page) ──────────────────────────────────────────────
(async function tryReconnect(){
  const pid = localStorage.getItem('lueurs_player_id');
  const rid = localStorage.getItem('lueurs_room_id');
  if(!pid || !rid) return;
  const { data: room } = await sb.from('lueurs_rooms').select('*').eq('id', rid).maybeSingle();
  if(!room) return;
  const { data: player } = await sb.from('lueurs_players').select('*').eq('id', pid).maybeSingle();
  if(!player) return;
  state.player = player;
  state.room = room;
  $('lobby-code-big').textContent = room.code;
  $('room-code-display').textContent = room.code;
  $('room-chip').style.display = '';
  if(player.is_host) $('lobby-host-controls').style.display = '';
  else $('lobby-wait-msg').style.display = '';
  joinRoomRealtime(rid);
  await refreshPlayers();
  await handleRoomUpdate();
})();
