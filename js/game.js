// ============================================================
// game.js v5
// FIXES: selección de personaje, más tipos de ataque
// NUEVO: puño, patada, golpe bajo, salto+ataque, combo
// ============================================================

// ── CONSTANTES ──────────────────────────────────────────────
const W         = 800;
const H         = 400;
const GROUND    = H - 120;
const MAX_HP    = 200;
const ROUND_SEC = 60;
const WINS_NEED = 2;

// ── ESTADO GLOBAL ───────────────────────────────────────────
let gameMode        = null;
let botInst         = null;
let currentStage    = null;
let selectedChars   = [];
let selectingPlayer = 1;
let gameRunning     = false;
let animFrame       = null;
let p1 = {}, p2    = {};
let round           = 1;
let p1Wins          = 0;
let p2Wins          = 0;
let roundTimer      = ROUND_SEC;
let timerInterval   = null;
const hits          = [];

// ── TECLADO ─────────────────────────────────────────────────
const keys     = {};
const justPressed = {};   // solo el frame en que se presiona
window.addEventListener('keydown', e => {
  if (!keys[e.key]) justPressed[e.key] = true;
  keys[e.key] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))
    e.preventDefault();
});
window.addEventListener('keyup', e => {
  keys[e.key] = false;
  justPressed[e.key] = false;
});

// Limpiar justPressed al final de cada frame
function clearJustPressed() {
  Object.keys(justPressed).forEach(k => { justPressed[k] = false; });
}

// ── TIPOS DE ATAQUE ──────────────────────────────────────────
// J1: F=puño  H=patada  V=golpe bajo  (en aire: F=patada aérea)
// J2: K=puño  I=patada  N=golpe bajo  (en aire: K=patada aérea)
// Especial: J1=G  J2=L
const ATK = {
  PUNCH:      'punch',      // F / K      — daño normal, rápido
  KICK:       'kick',       // H / I      — daño medio, más alcance
  LOW:        'low',        // V / N      — golpe bajo, rompe bloqueo
  AIR:        'air',        // F/K en aire— patada aérea
  SPECIAL:    'special',    // G / L      — especial del personaje
  COMBO:      'combo',      // F→F→H      — combo de 3 golpes
};

// ════════════════════════════════════════════════════════════
// UI
// ════════════════════════════════════════════════════════════
const UI = {
  show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  },
  goMenu()    { UI.show('screen-menu');    if(typeof AudioMgr!=='undefined') AudioMgr.playMusic('menu'); },
  goMode()    { UI.show('screen-mode');    },
  goOptions() { UI.show('screen-options'); },
  goCredits() { UI.show('screen-credits'); }
};
window.UI = UI;

// ════════════════════════════════════════════════════════════
// GAME
// ════════════════════════════════════════════════════════════
const Game = {

  selectMode(mode) {
    gameMode = mode;
    if      (mode === 'bot')          { UI.show('screen-difficulty'); }
    else if (mode === 'local')        { Game.startCharSelect(); }
    else if (mode === 'online')       { UI.show('screen-online'); }
    else if (mode === 'online-ready') { Game.startCharSelect(); }
  },

  selectDifficulty(d) {
    botInst  = new Bot(d);
    gameMode = 'bot';
    Game.startCharSelect();
  },

  backFromCharSelect() {
    selectedChars   = [];
    selectingPlayer = 1;
    if (gameMode === 'bot') UI.show('screen-difficulty');
    else                    UI.show('screen-mode');
  },

  // ── Selección de personaje ─────────────────────────────
  startCharSelect() {
    selectedChars   = [];
    selectingPlayer = 1;
    _renderCharGrid();
    const title = document.getElementById('char-select-title');
    if (title) title.textContent = 'JUGADOR 1 — ELIGE TU PERSONAJE';
    UI.show('screen-characters');
    if(typeof AudioMgr!=='undefined') AudioMgr.sfx('select');
  },

  // ── FIX PRINCIPAL: confirmChar ahora funciona correctamente ──
  confirmChar(idx) {
    if(typeof AudioMgr!=='undefined') AudioMgr.sfx('select');

    // Evitar seleccionar el mismo personaje en modo local
    if (gameMode === 'local' && selectingPlayer === 2 && selectedChars[0] === idx) {
      _showMsg('¡Ya elegido!');
      return;
    }

    selectedChars.push(idx);

    if (gameMode === 'local' && selectingPlayer === 1) {
      // J1 eligió → ahora elige J2
      selectingPlayer = 2;
      const title = document.getElementById('char-select-title');
      if (title) title.textContent = 'JUGADOR 2 — ELIGE TU PERSONAJE';
      // Marcar el elegido por J1
      const cards = document.querySelectorAll('.char-card');
      cards.forEach((c, i) => {
        c.classList.remove('selected', 'disabled');
        if (i === idx) c.classList.add('selected');
      });
      return;  // ← esperar que J2 elija
    }

    // Bot elige personaje aleatorio diferente al del jugador
    if (gameMode === 'bot') {
      let bi;
      do { bi = Math.floor(Math.random() * FIGHTERS.length); }
      while (bi === selectedChars[0]);
      selectedChars.push(bi);
    }

    // Online: ambos eligieron o el guest eligió
    // En cualquier otro caso: arrancar
    if (selectedChars.length >= 2) {
      _startMatch();
    }
  }
};
window.Game = Game;

// ── Renderizar grilla ──────────────────────────────────────
function _renderCharGrid() {
  const grid = document.getElementById('char-grid');
  if (!grid) return;
  grid.innerHTML = '';

  FIGHTERS.forEach((f, i) => {
    const card = document.createElement('div');
    card.className = 'char-card';

    // Miniatura con canvas
    const thumb    = document.createElement('canvas');
    thumb.width    = 80;
    thumb.height   = 100;
    thumb.style.display = 'block';
    thumb.style.margin  = '0 auto 6px';
    const tc = thumb.getContext('2d');
    tc.translate(40, 95);
    try {
      f.draw(tc, 0, 0, 1, { attacking:false, specialAttack:false, blocking:false, vx:0 });
    } catch(e) {
      // Si draw falla, mostrar emoji
      tc.font = '40px Arial';
      tc.textAlign = 'center';
      tc.fillText(f.emoji, 0, -30);
    }

    card.innerHTML =
      `<div class="char-name">${f.name}</div>
       <div class="char-role-tag">${f.role}</div>
       <div class="stat-row">
         <span class="stat-label">DMG</span>
         <div class="stat-bar"><div class="stat-fill stat-dmg" style="width:${f.damage*20}%"></div></div>
       </div>
       <div class="stat-row">
         <span class="stat-label">VEL</span>
         <div class="stat-bar"><div class="stat-fill stat-spd" style="width:${f.speed*20}%"></div></div>
       </div>
       <div class="stat-row">
         <span class="stat-label">DEF</span>
         <div class="stat-bar"><div class="stat-fill stat-def" style="width:${f.defense*20}%"></div></div>
       </div>`;

    card.insertBefore(thumb, card.firstChild);

    // ── FIX: usar closure correcto con let ──
    const charIdx = i;
    card.addEventListener('click', () => {
      Game.confirmChar(charIdx);
    });

    card.addEventListener('mouseenter', () => {
      const info = document.getElementById('selected-info');
      if (info) info.textContent =
        `${f.name} — ${f.description} | ✨ ${f.specialName}`;
    });

    grid.appendChild(card);
  });
}

// ════════════════════════════════════════════════════════════
// INICIAR MATCH
// ════════════════════════════════════════════════════════════
function _startMatch() {
  const f1 = FIGHTERS[selectedChars[0]];
  const f2 = FIGHTERS[selectedChars[1]];

  currentStage = (typeof getRandomStage === 'function') ? getRandomStage() : null;

  const sn = document.getElementById('stage-name');
  if (sn && currentStage) {
    sn.textContent = currentStage.name;
    sn.classList.add('show');
    setTimeout(() => sn.classList.remove('show'), 3000);
  }

  p1 = _makePlayer(f1, 160,     GROUND, 1);
  p2 = _makePlayer(f2, W - 220, GROUND, -1);

  const n1 = document.getElementById('p1-name');
  const n2 = document.getElementById('p2-name');
  if (n1) n1.textContent = f1.name;
  if (n2) n2.textContent = f2.name;

  round = 1; p1Wins = 0; p2Wins = 0;
  hits.length = 0;

  UI.show('screen-game');
  if(typeof AudioMgr!=='undefined') AudioMgr.playMusic('battle');

  _showMsg('ROUND ' + round);
  setTimeout(() => { _startTimer(); gameRunning = true; _loop(); }, 2200);
}

function _makePlayer(fighter, x, y, facing) {
  return {
    x, y, w: 60, h: 110,
    hp: MAX_HP, maxHp: MAX_HP,
    vx: 0, vy: 0,
    onGround: true, facing,
    // Estados de ataque
    atkType: null,    // tipo de ataque activo
    atkTimer: 0,      // frames restantes del ataque
    atkCooldown: 0,   // cooldown entre ataques
    specialTimer: 0,  // cooldown del especial
    blocking: false,
    crouching: false,
    hitFlash: 0,
    lastHitTime: 0,
    // Sistema de combo
    comboBuffer: [],  // teclas recientes para combo
    comboTimer: 0,
    fighter,
    name: fighter.name,
    // Propiedades calculadas para draw()
    get attacking()    { return this.atkType !== null; },
    get specialAttack(){ return this.atkType === ATK.SPECIAL; },
  };
}

// ════════════════════════════════════════════════════════════
// TIMER
// ════════════════════════════════════════════════════════════
function _startTimer() {
  clearInterval(timerInterval);
  roundTimer = ROUND_SEC;
  _setTimerDisplay(roundTimer);
  timerInterval = setInterval(() => {
    roundTimer--;
    _setTimerDisplay(roundTimer);
    if (roundTimer <= 0) _endRound('time');
  }, 1000);
}

function _setTimerDisplay(v) {
  const el = document.getElementById('timer-display');
  if (!el) return;
  el.textContent = v;
  el.style.color = v <= 10 ? '#ff2200' : '#ffaa00';
}

// ════════════════════════════════════════════════════════════
// GAME LOOP
// ════════════════════════════════════════════════════════════
function _loop() {
  if (!gameRunning) return;
  _update();
  _render();
  clearJustPressed();
  animFrame = requestAnimationFrame(_loop);
}

// ── Update ────────────────────────────────────────────────
function _update() {
  if (gameMode === 'bot' && botInst) botInst.update(p2, p1, keys);

  if (gameMode === 'online' && typeof Online !== 'undefined' && Online.isReady()) {
    const mine = Online.isHost()
      ? { d:keys['d'],a:keys['a'],w:keys['w'],s:keys['s'],
          f:keys['f'],g:keys['g'],h:keys['h'],v:keys['v'] }
      : { d:keys['ArrowRight'],a:keys['ArrowLeft'],w:keys['ArrowUp'],s:keys['ArrowDown'],
          f:keys['k'],g:keys['l'],h:keys['i'],v:keys['n'] };
    Online.send({ type:'keys', keys:mine });
  }

  _movePlayer(p1, 'd','a','w','s','f','g','h','v');
  _movePlayer(p2, 'ArrowRight','ArrowLeft','ArrowUp','ArrowDown','k','l','i','n');

  p1.facing = p2.x >= p1.x ?  1 : -1;
  p2.facing = p1.x >= p2.x ?  1 : -1;

  _checkHit(p1, p2);
  _checkHit(p2, p1);

  if (p1.hitFlash > 0) p1.hitFlash--;
  if (p2.hitFlash > 0) p2.hitFlash--;

  _updateHUD();
  if (p1.hp <= 0 || p2.hp <= 0) _endRound('ko');
}

// ── Mover jugador ─────────────────────────────────────────
function _movePlayer(p, right, left, up, down, punch, special, kick, low) {
  const spd = p.fighter.moveSpeed;

  // Agacharse
  p.crouching = !!keys[down] && p.onGround;
  p.blocking  = p.crouching;   // agacharse = bloquear golpes bajos

  // Movimiento horizontal (no si está agachado o atacando fuerte)
  if (!p.crouching) {
    if      (keys[right]) p.vx =  spd;
    else if (keys[left])  p.vx = -spd;
    else                  p.vx *= 0.6;
  } else {
    p.vx *= 0.5;
  }

  // Salto
  if (keys[up] && p.onGround) { p.vy = -13.5; p.onGround = false; }

  // ── Ataques (solo si no hay cooldown activo) ──
  if (p.atkCooldown <= 0) {

    // COMBO: detectar F→F→H rápido
    if (p.comboTimer > 0) p.comboTimer--;
    if (justPressed[punch]) {
      p.comboBuffer.push('p');
      p.comboTimer = 18;
    }
    if (justPressed[kick]) {
      p.comboBuffer.push('k');
      p.comboTimer = 18;
    }
    if (p.comboTimer === 0) p.comboBuffer = [];

    // Detectar combo P-P-K
    if (p.comboBuffer.length >= 3) {
      const last3 = p.comboBuffer.slice(-3).join('');
      if (last3 === 'ppk') {
        p.atkType    = ATK.COMBO;
        p.atkTimer   = 30;
        p.atkCooldown= 35;
        p.comboBuffer= [];
      }
    }

    // Especial (G / L)
    if (justPressed[special] && p.specialTimer <= 0) {
      p.atkType     = ATK.SPECIAL;
      p.atkTimer    = 28;
      p.atkCooldown = 65;
      p.specialTimer= 65;
    }
    // Patada (H / I)
    else if (justPressed[kick] && p.atkType !== ATK.COMBO) {
      p.atkType    = p.onGround ? ATK.KICK : ATK.AIR;
      p.atkTimer   = 22;
      p.atkCooldown= 26;
    }
    // Golpe bajo (V / N) — rompe bloqueo normal
    else if (justPressed[low]) {
      p.atkType    = ATK.LOW;
      p.atkTimer   = 18;
      p.atkCooldown= 28;
    }
    // Puño (F / K)
    else if (justPressed[punch] && p.atkType !== ATK.COMBO) {
      p.atkType    = p.onGround ? ATK.PUNCH : ATK.AIR;
      p.atkTimer   = 20;
      p.atkCooldown= 22;
    }
  }

  // Reducir timers
  if (p.atkTimer   > 0) p.atkTimer--;   else p.atkType = null;
  if (p.atkCooldown> 0) p.atkCooldown--;
  if (p.specialTimer>0) p.specialTimer--;

  // Física
  p.x  += p.vx;
  p.vy += 0.55;
  p.y  += p.vy;

  if (p.y >= GROUND) { p.y = GROUND; p.vy = 0; p.onGround = true; }
  p.x = Math.max(5, Math.min(W - p.w - 5, p.x));
}

// ── Detección de golpes ───────────────────────────────────
function _checkHit(att, def) {
  if (!att.atkType || att.atkTimer <= 0) return;

  // Alcance según tipo de ataque
  const reach = {
    [ATK.PUNCH]:   80,
    [ATK.KICK]:   105,
    [ATK.LOW]:     75,
    [ATK.AIR]:     90,
    [ATK.SPECIAL]: 130,
    [ATK.COMBO]:   95,
  }[att.atkType] || 80;

  const cx_att = att.x + att.w / 2;
  const cx_def = def.x + def.w / 2;
  if (Math.abs(cx_att - cx_def) > reach) return;

  // Golpe bajo solo conecta si rival NO está agachado
  const distY = att.y - def.y;
  if (att.atkType === ATK.AIR && !(!def.onGround || Math.abs(distY) < 60)) return;
  if (Math.abs(distY) > 100) return;

  const now = Date.now();
  if (now - att.lastHitTime < 380) return;

  // Daño base según tipo
  const baseDmg = {
    [ATK.PUNCH]:  att.fighter.attacks.normal,
    [ATK.KICK]:   Math.round(att.fighter.attacks.normal * 1.4),
    [ATK.LOW]:    Math.round(att.fighter.attacks.normal * 0.9),
    [ATK.AIR]:    Math.round(att.fighter.attacks.normal * 1.2),
    [ATK.SPECIAL]:att.fighter.attacks.special,
    [ATK.COMBO]:  Math.round(att.fighter.attacks.normal * 2.2),
  }[att.atkType] || att.fighter.attacks.normal;

  let dmg = Math.round(baseDmg * def.fighter.defMod);

  // Bloqueo
  let blocked = false;
  if (def.blocking) {
    if (att.atkType === ATK.LOW) {
      // Golpe bajo ROMPE bloqueo estándar — daño completo
      blocked = false;
    } else if (att.atkType === ATK.AIR && !def.onGround) {
      blocked = false; // no bloquea en el aire
    } else {
      dmg     = Math.round(dmg * 0.18);
      blocked = true;
    }
  }

  def.hp          = Math.max(0, def.hp - dmg);
  def.hitFlash    = 8;
  att.lastHitTime = now;

  // Knockback
  const kb  = att.fighter.knockback * (att.atkType === ATK.SPECIAL ? 1.8 : att.atkType === ATK.COMBO ? 1.5 : 1);
  def.vx    = (cx_def > cx_att ? 1 : -1) * kb;
  if (att.atkType === ATK.AIR) def.vy = -5; // lanzar hacia arriba

  // Sonido
  if (typeof AudioMgr !== 'undefined') {
    if (blocked)                         AudioMgr.sfx('block');
    else if (att.atkType===ATK.SPECIAL)  AudioMgr.sfx('special');
    else                                 AudioMgr.sfx('hit');
  }

  // Número flotante
  hits.push({
    x: cx_def, y: def.y - 20,
    dmg, blocked,
    type: att.atkType,
    t: 50
  });

  // Solo limpiar el ataque si NO es combo (el combo tiene su propio timer)
  if (att.atkType !== ATK.COMBO) att.atkType = null;
}

// ════════════════════════════════════════════════════════════
// RENDER
// ════════════════════════════════════════════════════════════
function _render() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const c = canvas.getContext('2d');

  // Escenario
  if (currentStage && typeof currentStage.draw === 'function') {
    currentStage.draw(c, W, H, GROUND);
  } else {
    const g = c.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#12123a'); g.addColorStop(1,'#050510');
    c.fillStyle = g; c.fillRect(0,0,W,H);
    c.fillStyle = '#1a1005'; c.fillRect(0,GROUND+110,W,H-GROUND-110);
    c.fillStyle = '#ff6600'; c.fillRect(0,GROUND+110,W,3);
  }

  _drawShadow(c, p1);
  _drawShadow(c, p2);
  _drawPlayer(c, p1);
  _drawPlayer(c, p2);
  _drawWinMarkers(c);
  _drawHitNumbers(c);

  // Indicador de combo activo
  if (p1.comboBuffer.length > 0) _drawComboIndicator(c, p1, 'left');
  if (p2.comboBuffer.length > 0) _drawComboIndicator(c, p2, 'right');
}

function _drawShadow(c, p) {
  c.save();
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.beginPath();
  c.ellipse(p.x + p.w/2, GROUND + p.h + 4, 28, 8, 0, 0, Math.PI*2);
  c.fill();
  c.restore();
}

function _drawPlayer(c, p) {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h;
  c.save();
  if (p.hitFlash > 0) c.filter = 'brightness(4) saturate(0)';
  if (p.facing === -1) { c.translate(cx*2, 0); c.scale(-1,1); }

  try {
    p.fighter.draw(c, cx, cy, 1, {
      attacking:     !!p.atkType,
      specialAttack: p.atkType === ATK.SPECIAL,
      blocking:      p.blocking,
      crouching:     p.crouching,
      atkType:       p.atkType,
      vx:            p.vx
    });
  } catch(e) {
    // Fallback: rectángulo coloreado
    c.fillStyle = p.fighter.color || '#ff4400';
    c.fillRect(cx-20, cy-100, 40, 100);
    c.font = '28px Arial'; c.textAlign='center';
    c.fillText(p.fighter.emoji||'?', cx, cy-50);
  }

  c.filter = 'none';
  _drawHealthBarAbove(c, p, cx, p.y - 18);
  c.restore();
}

function _drawHealthBarAbove(c, p, cx, y) {
  const bw = 72, bh = 8;
  const pct = p.hp / p.maxHp;
  c.fillStyle = '#111'; c.fillRect(cx-bw/2, y, bw, bh);
  c.fillStyle = pct > 0.55 ? '#00dd55' : pct > 0.28 ? '#ffaa00' : '#ff2200';
  c.fillRect(cx-bw/2, y, bw*pct, bh);
  c.strokeStyle='#000'; c.lineWidth=1;
  c.strokeRect(cx-bw/2, y, bw, bh);
}

function _drawWinMarkers(c) {
  c.font='bold 16px Arial'; c.textAlign='center';
  for(let i=0;i<p1Wins;i++){c.fillStyle='#ffcc00';c.fillText('★',90+i*24,28);}
  for(let i=0;i<p2Wins;i++){c.fillStyle='#00aaff';c.fillText('★',W-90-i*24,28);}
}

function _drawHitNumbers(c) {
  hits.forEach((h, i) => {
    if (h.t <= 0) { hits.splice(i, 1); return; }
    const alpha = Math.min(1, h.t / 18);
    c.globalAlpha = alpha;
    const colors = {
      [ATK.SPECIAL]:'#ff4400',
      [ATK.COMBO]:  '#ff00ff',
      [ATK.KICK]:   '#ffaa00',
      [ATK.LOW]:    '#00ffff',
      [ATK.AIR]:    '#88ffff',
    };
    c.fillStyle  = h.blocked ? '#aaaaff' : (colors[h.type] || '#ffff00');
    c.font       = `bold ${h.type===ATK.SPECIAL||h.type===ATK.COMBO?22:16}px Arial Black`;
    c.textAlign  = 'center';
    const labels = { [ATK.KICK]:'PATADA!', [ATK.LOW]:'LOW!', [ATK.AIR]:'AÉREO!', [ATK.COMBO]:'COMBO!!' };
    const label  = h.blocked ? '🛡BLOQ' : (labels[h.type]||'');
    if (label) {
      c.font = 'bold 11px Arial'; c.fillText(label, h.x, h.y - (50-h.t)*0.9 - 14);
    }
    c.font = `bold ${h.type===ATK.SPECIAL||h.type===ATK.COMBO?22:16}px Arial Black`;
    c.fillText('-' + h.dmg, h.x, h.y - (50-h.t)*0.9);
    h.t--;
    c.globalAlpha = 1;
  });
}

function _drawComboIndicator(c, p, side) {
  const x = side === 'left' ? 20 : W - 100;
  const symbols = { 'p':'👊', 'k':'🦵' };
  c.font = '18px Arial'; c.globalAlpha = 0.8;
  p.comboBuffer.slice(-3).forEach((s, i) => {
    c.fillText(symbols[s]||'?', x + i*28, H - 20);
  });
  c.globalAlpha = 1;
}

// ── HUD ──────────────────────────────────────────────────
function _updateHUD() {
  const b1 = document.getElementById('health-bar-p1');
  const b2 = document.getElementById('health-bar-p2');
  const h1 = document.getElementById('hp-p1');
  const h2 = document.getElementById('hp-p2');
  if(b1) b1.style.width = (p1.hp/p1.maxHp*100)+'%';
  if(b2) b2.style.width = (p2.hp/p2.maxHp*100)+'%';
  if(h1) h1.textContent = Math.max(0,p1.hp);
  if(h2) h2.textContent = Math.max(0,p2.hp);
}

// ════════════════════════════════════════════════════════════
// FIN DE ROUND
// ════════════════════════════════════════════════════════════
function _endRound(reason) {
  if (!gameRunning) return;
  gameRunning = false;
  clearInterval(timerInterval);
  cancelAnimationFrame(animFrame);

  if (reason === 'ko') {
    if      (p2.hp<=0 && p1.hp>0) p1Wins++;
    else if (p1.hp<=0 && p2.hp>0) p2Wins++;
    if(typeof AudioMgr!=='undefined') AudioMgr.sfx('ko');
  } else {
    if (p1.hp >= p2.hp) p1Wins++; else p2Wins++;
  }

  _showMsg(reason==='ko' ? 'K.O.!' : '¡TIEMPO!');

  setTimeout(() => {
    if (p1Wins>=WINS_NEED || p2Wins>=WINS_NEED) {
      const champ = p1Wins>=WINS_NEED ? p1.name : p2.name;
      if(typeof AudioMgr!=='undefined') AudioMgr.sfx('win');
      _showMsg('🏆 ' + champ);
      setTimeout(() => { p1Wins=0; p2Wins=0; round=1; UI.goMenu(); }, 3200);
    } else {
      round++;
      if (typeof getRandomStage==='function') {
        currentStage = getRandomStage();
        const sn = document.getElementById('stage-name');
        if(sn){ sn.textContent=currentStage.name; sn.classList.add('show'); setTimeout(()=>sn.classList.remove('show'),2500); }
      }
      p1.hp=MAX_HP; p2.hp=MAX_HP;
      p1.x=160;     p2.x=W-220;
      p1.vy=0;      p2.vy=0;
      hits.length=0;
      _showMsg('ROUND '+round);
      setTimeout(()=>{ _startTimer(); gameRunning=true; _loop(); }, 2600);
    }
  }, 2000);
}

function _showMsg(msg) {
  const el = document.getElementById('round-message');
  if (!el) return;
  el.textContent     = msg;
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = '';
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2300);
}

// ════════════════════════════════════════════════════════════
// ONLINE
// ════════════════════════════════════════════════════════════
window._onlineReceive = function(data) {
  if (data.type !== 'keys') return;
  const k = data.keys;
  if (window._onlineIsHost) {
    keys['ArrowRight']=k.d; keys['ArrowLeft']=k.a;
    keys['ArrowUp']=k.w;    keys['ArrowDown']=k.s;
    keys['k']=k.f;          keys['l']=k.g;
    keys['i']=k.h;          keys['n']=k.v;
  } else {
    keys['d']=k.d; keys['a']=k.a;
    keys['w']=k.w; keys['s']=k.s;
    keys['f']=k.f; keys['g']=k.g;
    keys['h']=k.h; keys['v']=k.v;
  }
};

// ════════════════════════════════════════════════════════════
// ARRANQUE
// ════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', () => {
    const menu = document.getElementById('screen-menu');
    if (menu && menu.classList.contains('active') && typeof AudioMgr!=='undefined')
      AudioMgr.playMusic('menu');
  }, { once: true });
});