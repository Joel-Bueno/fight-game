# 📚 EXPLICACIÓN DEL CÓDIGO - Fight Game v3.0

Documentación técnica completa del juego de pelea. Explora cómo funciona internamente cada componente.

---

## 📖 Tabla de Contenidos

1. [Introducción General](#introducción-general)
2. [Arquitectura y Estructura](#arquitectura-y-estructura)
3. [Motor Principal (game.js)](#motor-principal-gamejs)
4. [Sistema de Personajes (fighters.js)](#sistema-de-personajes-fightersjs)
5. [Sistema de IA (bot.js)](#sistema-de-ia-botjs)
6. [Sistema de Audio (audio.js)](#sistema-de-audio-audiojs)
7. [Sistema de Combate](#sistema-de-combate)
8. [Personalización del Código](#personalización-del-código)
9. [Conceptos Técnicos](#conceptos-técnicos)

---

## Introducción General

### ¿Qué es Fight Game?

**Fight Game** es un **juego de pelea 2D en tiempo real** desarrollado 100% en **HTML5 Canvas puro**, sin frameworks ni dependencias externas (excepto PeerJS para el modo online).

### Características Técnicas

| Característica | Detalle |
|---|---|
| **Tecnología** | HTML5 Canvas, CSS3, JavaScript Vanilla |
| **Resolución** | 800×400 px (Canvas) |
| **FPS** | 60 FPS (requestAnimationFrame) |
| **Personajes** | 6 jugables + sistema modular |
| **Modos de Juego** | Solo (vs BOT), Local 2J, Online P2P |
| **Online** | WebRTC P2P con PeerJS (sin servidor centralizado) |
| **Audio** | Web Audio API nativa |
| **Licencia** | Uso libre para proyectos personales y educativos |

### Stack Tecnológico

```
Frontend
├── HTML5 (estructura)
├── CSS3 (estilos y animaciones)
├── JavaScript Vanilla (lógica del juego)
│   ├── Canvas 2D (renderizado)
│   ├── Web Audio API (sonidos)
│   └── WebRTC (online P2P)
└── PeerJS CDN (abstracciona WebRTC)
```

---

## Arquitectura y Estructura

### Diagrama de Dependencias

```
index.html (punto de entrada)
    ↓
    ├─→ css/style.css (estilos)
    │
    ├─→ fighters.js (personajes y stats)
    ├─→ stages.js (escenarios)
    │
    ├─→ bot.js (IA del bot)
    ├─→ audio.js (música y sonidos)
    ├─→ online.js (modo online P2P)
    │
    └─→ game.js (motor principal - orquesta todo)
```

### Orden de Carga (Crítico)

El archivo `index.html` carga los scripts en este **orden específico**:

```html
<!-- 1. PeerJS CDN (para online) -->
<script src="https://cdn.jsdelivr.net/npm/peerjs@1.3.5/dist/peerjs.min.js"></script>

<!-- 2. Datos: personajes y escenarios -->
<script src="js/fighters.js"></script>
<script src="js/stages.js"></script>

<!-- 3. Módulos: IA, audio, online -->
<script src="js/bot.js"></script>
<script src="js/audio.js"></script>
<script src="js/online.js"></script>

<!-- 4. Motor principal (lo orquesta todo) -->
<script src="js/game.js"></script>
```

**Por qué este orden:**
- `fighters.js` y `stages.js` primero (datos)
- Luego módulos (bot, audio, online) que operan sobre los datos
- Al final `game.js` que orquesta todo

### Responsabilidad de Cada Archivo

| Archivo | Líneas | Responsabilidad |
|---------|--------|-----------------|
| **game.js** | 723 | Motor del juego: loop, física, combate, UI, rounds |
| **fighters.js** | 470 | 6 personajes: stats, colores, función draw() en Canvas |
| **bot.js** | 68 | IA del bot con 3 dificultades |
| **audio.js** | 104 | Gestión de música y efectos de sonido |
| **stages.js** | ~300 | 6 escenarios dibujados en Canvas |
| **online.js** | ~200 | Modo online P2P con PeerJS |

---

## Motor Principal (game.js)

### Descripción General

`game.js` es el **corazón del juego**. Contiene:
- Game loop (actualización + renderizado)
- Sistema de física y movimiento
- Sistema de detección de golpes
- Sistema de daño y bloqueo
- Gestión de rounds y victoria
- Interfaz de usuario (UI)

### Constantes y Configuración

```javascript
// Dimensiones del canvas
const W         = 800;      // ancho
const H         = 400;      // alto
const GROUND    = H - 120;  // altura del suelo (280 px)

// Mecánica del juego
const MAX_HP    = 200;      // vida máxima por personaje
const ROUND_SEC = 60;       // duración de un round (60 segundos)
const WINS_NEED = 2;        // rounds ganados para ganar el match
```

### Estado Global

```javascript
let gameMode        = null;       // 'bot', 'local', 'online'
let botInst         = null;       // instancia del Bot (si aplica)
let currentStage    = null;       // escenario actual
let selectedChars   = [];         // índices de personajes seleccionados
let gameRunning     = false;      // el juego está corriendo
let p1 = {}, p2    = {};          // estado de ambos jugadores
let round           = 1;          // round actual
let p1Wins          = 0;          // rounds ganados por P1
let p2Wins          = 0;          // rounds ganados por P2
let roundTimer      = ROUND_SEC;  // contador de tiempo (60...0)
```

### Sistema de Input

```javascript
const keys        = {};           // teclas actualmente presionadas
const justPressed = {};           // solo el frame en que se presiona

window.addEventListener('keydown', e => {
  if (!keys[e.key]) justPressed[e.key] = true;  // solo marca como "just pressed" si no estaba
  keys[e.key] = true;
});

window.addEventListener('keyup', e => {
  keys[e.key] = false;
  justPressed[e.key] = false;
});

// Al final de cada frame se limpia justPressed
function clearJustPressed() {
  Object.keys(justPressed).forEach(k => { justPressed[k] = false; });
}
```

**¿Por qué `justPressed`?**
- `keys['w']` = true mientras se mantiene presionada W
- `justPressed['w']` = true solo el frame en que se presiona W

Esto permite detectar "pulsaciones únicas" (combos, ataques) vs "mantener presionado" (movimiento).

### Tipos de Ataque

```javascript
const ATK = {
  PUNCH:      'punch',      // F / K      — daño normal, rápido
  KICK:       'kick',       // H / I      — daño medio, más alcance
  LOW:        'low',        // V / N      — golpe bajo, rompe bloqueo
  AIR:        'air',        // F/K en aire— patada aérea
  SPECIAL:    'special',    // G / L      — especial del personaje
  COMBO:      'combo',      // F→F→H      — combo de 3 golpes
};
```

### Objeto Jugador (Player)

```javascript
function _makePlayer(fighter, x, y, facing) {
  return {
    // Posición y dimensiones
    x, y, w: 60, h: 110,
    
    // Salud
    hp: MAX_HP, maxHp: MAX_HP,
    
    // Velocidad (física)
    vx: 0,      // velocidad horizontal
    vy: 0,      // velocidad vertical
    onGround: true,
    
    // Estado de ataque
    atkType: null,    // tipo de ataque activo (PUNCH, KICK, etc.)
    atkTimer: 0,      // frames restantes del ataque
    atkCooldown: 0,   // cooldown entre ataques
    specialTimer: 0,  // cooldown del ataque especial
    
    // Estados
    blocking: false,     // está bloqueando
    crouching: false,    // está agachado
    hitFlash: 0,         // destello blanco cuando recibe daño
    lastHitTime: 0,      // timestamp del último golpe (evita hits múltiples)
    
    // Sistema de combo
    comboBuffer: [],     // teclas recientes para detectar combos
    comboTimer: 0,       // tiempo restante del combo
    
    // Referencia al personaje
    fighter,
    name: fighter.name,
    
    // Propiedades calculadas
    get attacking() { return this.atkType !== null; },
    get specialAttack() { return this.atkType === ATK.SPECIAL; },
  };
}
```

### Game Loop: `_loop()`

```javascript
function _loop() {
  if (!gameRunning) return;
  
  _update();           // actualizar estado
  _render();           // dibujar en canvas
  clearJustPressed();  // limpiar teclas pulsadas una sola vez
  
  animFrame = requestAnimationFrame(_loop);  // 60 FPS
}
```

**Flujo por frame:**
1. **Update** → calcula movimiento, ataques, daño
2. **Render** → dibuja en Canvas
3. **Clear justPressed** → prepara para el siguiente frame
4. **RequestAnimationFrame** → siguiente frame (60 FPS)

### Actualización: `_update()`

```javascript
function _update() {
  // 1. IA del bot (si aplica)
  if (gameMode === 'bot' && botInst) 
    botInst.update(p2, p1, keys);

  // 2. Sincronización online (si aplica)
  if (gameMode === 'online' && typeof Online !== 'undefined' && Online.isReady()) {
    const mine = Online.isHost() ? {...} : {...};
    Online.send({ type:'keys', keys:mine });
  }

  // 3. Mover ambos jugadores
  _movePlayer(p1, 'd','a','w','s','f','g','h','v');           // J1
  _movePlayer(p2, 'ArrowRight','ArrowLeft','ArrowUp','ArrowDown','k','l','i','n');  // J2

  // 4. Actualizar dirección de cara (mirar hacia el rival)
  p1.facing = p2.x >= p1.x ?  1 : -1;  // 1=derecha, -1=izquierda
  p2.facing = p1.x >= p2.x ?  1 : -1;

  // 5. Detección de golpes
  _checkHit(p1, p2);  // P1 golpea a P2
  _checkHit(p2, p1);  // P2 golpea a P1

  // 6. Efectos visuales
  if (p1.hitFlash > 0) p1.hitFlash--;  // parpadeo cuando recibe daño
  if (p2.hitFlash > 0) p2.hitFlash--;

  // 7. Actualizar HUD y verificar fin de round
  _updateHUD();
  if (p1.hp <= 0 || p2.hp <= 0) _endRound('ko');
}
```

### Movimiento del Jugador: `_movePlayer()`

```javascript
function _movePlayer(p, right, left, up, down, punch, special, kick, low) {
  const spd = p.fighter.moveSpeed;

  // Bloquear = agacharse en el suelo
  p.crouching = !!keys[down] && p.onGround;
  p.blocking  = p.crouching;

  // Movimiento horizontal
  if (keys[right])  p.vx = spd;
  else if (keys[left]) p.vx = -spd;
  else p.vx *= 0.85;  // desaceleración

  // Saltar
  if (justPressed[up] && p.onGround) {
    p.vy = -12;
    p.onGround = false;
  }

  // Ataques
  if (justPressed[special]) {
    // Ataque especial (daño máximo)
    p.atkType = ATK.SPECIAL;
    p.atkTimer = 30;
    p.atkCooldown = 40;
    p.specialTimer = 120;  // cooldown 2 segundos
  } 
  else if (justPressed[low]) {
    // Golpe bajo (rompe bloqueo)
    p.atkType = ATK.LOW;
    p.atkTimer = 18;
    p.atkCooldown = 28;
  } 
  else if (justPressed[punch]) {
    // Puño o patada aérea
    p.atkType = p.onGround ? ATK.PUNCH : ATK.AIR;
    p.atkTimer = 20;
    p.atkCooldown = 22;
  }

  // Reducir timers
  if (p.atkTimer > 0) p.atkTimer--;
  else p.atkType = null;
  if (p.atkCooldown > 0) p.atkCooldown--;
  if (p.specialTimer > 0) p.specialTimer--;

  // Física (gravedad)
  p.x  += p.vx;
  p.vy += 0.55;  // gravedad
  p.y  += p.vy;

  // Colisión con el suelo
  if (p.y >= GROUND) { 
    p.y = GROUND; 
    p.vy = 0; 
    p.onGround = true; 
  }

  // Mantener dentro de la pantalla
  p.x = Math.max(5, Math.min(W - p.w - 5, p.x));
}
```

### Detección de Golpes: `_checkHit()`

```javascript
function _checkHit(att, def) {  // att=atacante, def=defensor
  if (!att.atkType || att.atkTimer <= 0) return;

  // 1. Alcance según tipo de ataque
  const reach = {
    [ATK.PUNCH]:   80,
    [ATK.KICK]:   105,
    [ATK.LOW]:     75,
    [ATK.AIR]:     90,
    [ATK.SPECIAL]: 130,
    [ATK.COMBO]:   95,
  }[att.atkType] || 80;

  const cx_att = att.x + att.w / 2;  // centro X atacante
  const cx_def = def.x + def.w / 2;  // centro X defensor
  if (Math.abs(cx_att - cx_def) > reach) return;  // fuera de alcance

  // 2. Verificar altura (los ataques aéreos solo golpean en el aire)
  const distY = att.y - def.y;
  if (att.atkType === ATK.AIR && !(!def.onGround || Math.abs(distY) < 60)) return;
  if (Math.abs(distY) > 100) return;

  // 3. Cooldown de golpe (evita que el mismo ataque golpee 2 veces)
  const now = Date.now();
  if (now - att.lastHitTime < 380) return;

  // 4. Calcular daño
  const baseDmg = {
    [ATK.PUNCH]:   att.fighter.attacks.normal,
    [ATK.KICK]:    att.fighter.attacks.normal * 1.4,
    [ATK.LOW]:     att.fighter.attacks.normal * 0.9,
    [ATK.AIR]:     att.fighter.attacks.normal * 1.2,
    [ATK.SPECIAL]: att.fighter.attacks.special,
    [ATK.COMBO]:   att.fighter.attacks.normal * 2.2,
  }[att.atkType];

  let dmg = Math.round(baseDmg * def.fighter.defMod);

  // 5. Sistema de bloqueo
  let blocked = false;
  if (def.blocking) {
    if (att.atkType === ATK.LOW) {
      // GOLPE BAJO rompe bloqueo normal
      blocked = false;
    } else if (att.atkType === ATK.AIR && !def.onGround) {
      // No puedes bloquear en el aire
      blocked = false;
    } else {
      // Bloqueo exitoso: reduce daño a 18%
      dmg = Math.round(dmg * 0.18);
      blocked = true;
    }
  }

  // 6. Aplicar daño
  def.hp = Math.max(0, def.hp - dmg);
  def.hitFlash = 8;  // parpadeo blanco
  att.lastHitTime = now;

  // 7. Knockback (empuje)
  const kb = att.fighter.knockback * 
    (att.atkType === ATK.SPECIAL ? 1.8 : 
     att.atkType === ATK.COMBO ? 1.5 : 1);
  def.vx = (cx_def > cx_att ? 1 : -1) * kb;
  if (att.atkType === ATK.AIR) def.vy = -5;  // lanzar hacia arriba

  // 8. Reproducir sonido
  if (typeof AudioMgr !== 'undefined') {
    if (blocked) AudioMgr.sfx('block');
    else if (att.atkType === ATK.SPECIAL) AudioMgr.sfx('special');
    else AudioMgr.sfx('hit');
  }

  // 9. Mostrar número de daño flotante
  hits.push({
    x: cx_def, y: def.y - 20,
    dmg, blocked,
    type: att.atkType,
    t: 50  // tiempo visible
  });
}
```

### Sistema de Daño y Bloqueo

| Tipo de Ataque | Alcance | Daño Base | Con Bloqueo | Notas |
|---|---|---|---|---|
| **PUNCH** | 80 px | `normal` | 18% | Rápido |
| **KICK** | 105 px | `normal * 1.4` | 18% | Más alcance |
| **LOW** | 75 px | `normal * 0.9` | 100% | 🔓 Rompe bloqueo |
| **AIR** | 90 px | `normal * 1.2` | N/A | Solo en el aire |
| **SPECIAL** | 130 px | `special` | 18% | Máximo daño |
| **COMBO** | 95 px | `normal * 2.2` | 18% | Combo de 3 |

**Mecánica de bloqueo:**
- `S` (P1) o `↓` (P2) = agacharse = bloquear golpes normales
- **Golpe bajo rompe bloqueo** (100% daño)
- Bloqueo exitoso reduce daño a **18%**

### Renderizado: `_render()`

```javascript
function _render() {
  const canvas = document.getElementById('gameCanvas');
  const c = canvas.getContext('2d');

  // 1. Dibujar escenario
  if (currentStage && typeof currentStage.draw === 'function') {
    currentStage.draw(c, W, H, GROUND);
  }

  // 2. Dibujar sombras (efecto de profundidad)
  _drawShadow(c, p1);
  _drawShadow(c, p2);

  // 3. Dibujar personajes
  _drawPlayer(c, p1);
  _drawPlayer(c, p2);

  // 4. Dibujar ganadores (coronitas)
  _drawWinMarkers(c);

  // 5. Dibujar números de daño flotantes
  _drawHitNumbers(c);

  // 6. Indicadores de combo
  if (p1.comboBuffer.length > 0) _drawComboIndicator(c, p1, 'left');
  if (p2.comboBuffer.length > 0) _drawComboIndicator(c, p2, 'right');
}

function _drawPlayer(c, p) {
  const cx = p.x + p.w / 2;
  const cy = p.y;

  // Efecto de golpe (destello blanco)
  if (p.hitFlash > 0) {
    c.fillStyle = `rgba(255,255,255,${p.hitFlash * 0.1})`;
    c.fillRect(p.x, p.y, p.w, p.h);
  }

  // Llamar a la función draw() del personaje
  p.fighter.draw(c, cx, cy, p.facing, {
    attacking: p.attacking,
    specialAttack: p.specialAttack,
    crouching: p.crouching
  });
}
```

---

## Sistema de Personajes (fighters.js)

### Estructura de un Personaje

```javascript
{
  // Identificación
  id: 0,                    // índice único
  name: "RYU",              // nombre
  emoji: "🥋",              // emoji para UI
  role: "Equilibrado",      // rol descriptivo

  // Colores (para UI)
  color: "#4488ff",         // color principal
  colorDark: "#1144aa",     // color oscuro (sombra)
  colorLight: "#88bbff",    // color claro (brillo)

  // Stats de combate
  damage: 3,                // daño base (1-5)
  speed: 3,                 // velocidad de ataque (1-5)
  defense: 3,               // defensa (1-5)

  // Modificadores
  moveSpeed: 4,             // píxeles/frame (1-8)
  defMod: 1.0,              // multiplicador de daño recibido (0.45=tanque, 1.5=vidrio)
  knockback: 5,             // empuje al golpear (2-8)

  // Daño
  attacks: { 
    normal: 12,             // daño de puño/patada
    special: 25              // daño de ataque especial
  },

  // Habilidad especial
  specialName: "Hadoken",   // nombre del especial

  // Descripción
  description: "Equilibrado. Bueno en todo, ideal para aprender.",

  // Función de dibujo en Canvas (OBLIGATORIA)
  draw(c, cx, cy, facing, state) {
    // c = contexto 2D del canvas
    // cx, cy = posición central
    // facing = dirección (1=derecha, -1=izquierda)
    // state = {attacking, specialAttack, crouching}
    
    c.save();
    c.translate(cx, cy);  // mover origen

    // Dibujar piernas, cuerpo, brazos, cabeza...
    c.fillStyle = "#223366";
    c.fillRect(-18, -45, 14, 45);

    // Efecto especial si está atacando
    if (state.specialAttack) {
      const grd = c.createRadialGradient(0, 0, 5, 0, 0, 28);
      grd.addColorStop(0, "#ffffff");
      grd.addColorStop(1, "rgba(0,80,255,0)");
      c.fillStyle = grd;
      c.beginPath();
      c.arc(facing*70, -80, 28, 0, Math.PI*2);
      c.fill();
    }

    c.restore();
  }
}
```

### Los 6 Personajes

#### 1. **RYU** — Equilibrado 🥋

```javascript
{
  name: "RYU",
  damage: 3, speed: 3, defense: 3,
  moveSpeed: 4, defMod: 1.0, knockback: 5,
  attacks: { normal: 12, special: 25 },
  specialName: "Hadoken",
  description: "Equilibrado. Bueno en todo, ideal para aprender."
}
```

- **Rol**: Personaje versátil
- **Fortaleza**: Buen balance en todo
- **Debilidad**: Ninguna crítica
- **Especial**: Hadoken - bola de energía azul

#### 2. **TANK** — Tanque 🛡️

```javascript
{
  name: "TANK",
  damage: 1, speed: 1, defense: 5,
  moveSpeed: 2, defMod: 0.45, knockback: 2,
  attacks: { normal: 7, special: 18 },
  specialName: "Escudo Absoluto"
}
```

- **Rol**: Defensa máxima
- **Fortaleza**: Recibe 55% menos daño (`defMod: 0.45`)
- **Debilidad**: Muy lento, poco daño
- **Especial**: Escudo que bloquea casi todo

#### 3. **STRIKER** — Destructor ⚡

```javascript
{
  name: "STRIKER",
  damage: 5, speed: 1, defense: 2,
  moveSpeed: 2, defMod: 1.3, knockback: 8,
  attacks: { normal: 18, special: 35 },
  specialName: "Uppercut"
}
```

- **Rol**: Daño máximo
- **Fortaleza**: Daño muy alto, knockback fuerte
- **Debilidad**: Lento, recibe más daño
- **Especial**: Uppercut que lanza al aire

#### 4. **SPEEDY** — Velocista 💨

```javascript
{
  name: "SPEEDY",
  damage: 2, speed: 5, defense: 2,
  moveSpeed: 7, defMod: 1.3, knockback: 3,
  attacks: { normal: 10, special: 22 },
  specialName: "Dash Kick"
}
```

- **Rol**: Velocidad máxima
- **Fortaleza**: Se mueve 7 píxeles/frame (vs 4 de RYU)
- **Debilidad**: Frágil, poco daño
- **Especial**: Dash Kick - patada rápida

#### 5. **COMBO** — Comboísta 👊

```javascript
{
  name: "COMBO",
  damage: 4, speed: 4, defense: 1,
  moveSpeed: 5, defMod: 1.4, knockback: 4,
  attacks: { normal: 14, special: 28 },
  specialName: "Tornado"
}
```

- **Rol**: Combos encadenados
- **Fortaleza**: Daño medio-alto, atacante rápido
- **Debilidad**: Muy frágil
- **Especial**: Tornado - rotación de ataques

#### 6. **GUARDIAN** — Contraataque 🛡️⚔️

```javascript
{
  name: "GUARDIAN",
  damage: 2, speed: 2, defense: 4,
  moveSpeed: 3, defMod: 0.65, knockback: 6,
  attacks: { normal: 10, special: 24 },
  specialName: "Contraataque"
}
```

- **Rol**: Defensa con contraataque
- **Fortaleza**: Defensa buena, knockback alto
- **Debilidad**: Lento, daño bajo
- **Especial**: Contraataque - refleja el daño

### Función `draw()` — Ejemplo RYU

```javascript
draw(c, cx, cy, facing, state) {
  const f = facing;  // 1=derecha, -1=izquierda
  c.save();
  c.translate(cx, cy);  // trasladar origen al personaje

  // PIERNAS
  c.fillStyle = "#223366";
  c.fillRect(-18, -45, 14, 45);  // pierna izquierda
  c.fillRect(4,   -45, 14, 45);  // pierna derecha

  // CUERPO / GI BLANCO
  c.fillStyle = "#ddeeff";
  c.fillRect(-22, -95, 44, 55);

  // CINTURÓN NEGRO
  c.fillStyle = "#111";
  c.fillRect(-22, -52, 44, 10);

  // BRAZOS
  if (state.attacking) {
    // Brazo extendido cuando ataca
    c.fillRect(f > 0 ? 22 : -50, -90, 28, 12);
    // Puño
    c.fillStyle = "#ffcc99";
    c.beginPath();
    c.arc(f > 0 ? 54 : -54, -84, 10, 0, Math.PI*2);
    c.fill();
  } else {
    // Brazos relajados
    c.fillRect(-32, -90, 12, 35);
    c.fillRect(20,  -90, 12, 35);
  }

  // CABEZA
  c.fillStyle = "#ffcc99";
  c.beginPath();
  c.arc(0, -105, 18, 0, Math.PI*2);
  c.fill();

  // PELO NEGRO
  c.fillStyle = "#111";
  c.fillRect(-18, -124, 36, 16);
  c.beginPath();
  c.arc(0, -123, 18, Math.PI, 0);
  c.fill();

  // OJOS
  c.fillStyle = "#111";
  c.fillRect(-8 * f - 3, -112, 5, 4);  // ojo izquierdo (espejado por facing)
  c.fillRect( 8 * f - 3, -112, 5, 4);  // ojo derecho

  // EFECTO ESPECIAL: HADOKEN (bola de energía)
  if (state.specialAttack) {
    const grd = c.createRadialGradient(
      f*70, -80, 5,      // centro interior
      f*70, -80, 28      // radio exterior
    );
    grd.addColorStop(0, "#ffffff");
    grd.addColorStop(0.5, "#88aaff");
    grd.addColorStop(1, "rgba(0,80,255,0)");  // transparente al borde
    c.fillStyle = grd;
    c.beginPath();
    c.arc(f*70, -80, 28, 0, Math.PI*2);
    c.fill();
  }

  c.restore();
}
```

**Notas técnicas:**
- `c.save()` / `c.restore()` guardan/restauran el estado del canvas
- `c.translate(cx, cy)` mueve el origen (facilita dibujar centrado)
- `facing` = 1 o -1 para espejo horizontal
- `state.attacking` y `state.specialAttack` permite animar el ataque

---

## Sistema de IA (bot.js)

### Clase Bot

```javascript
class Bot {
  constructor(difficulty) {
    this.difficulty = difficulty;
    this.timer = 0;
    
    // Cada cuántos frames toma una decisión
    this.thinkTime = { 
      easy: 85,      // cada 85 frames = ~1.4 seg
      medium: 40,    // cada 40 frames = ~0.67 seg
      hard: 18       // cada 18 frames = ~0.3 seg
    }[difficulty];

    // Probabilidad de bloquear cuando el rival está cerca
    this.blockChance = { 
      easy: 0.06,    // 6%
      medium: 0.22,  // 22%
      hard: 0.48     // 48%
    }[difficulty];

    // Probabilidad de usar especial
    this.specialChance = { 
      easy: 0.05,    // 5%
      medium: 0.18,  // 18%
      hard: 0.32     // 32%
    }[difficulty];

    // Precisión de movimiento hacia el rival
    this.accuracy = { 
      easy: 0.38,    // 38% de acierto
      medium: 0.70,  // 70%
      hard: 0.96     // 96%
    }[difficulty];

    // Probabilidad de saltar para esquivar (solo dificultad alta)
    this.dodgeChance = { 
      easy: 0.0,     // nunca
      medium: 0.05,  // 5%
      hard: 0.28     // 28%
    }[difficulty];

    this.attackRange = 95;  // distancia para atacar
  }

  update(bot, player, keys) {
    this.timer++;
    if (this.timer < this.thinkTime) return;  // aún no toma decisión
    this.timer = 0;
    this._decide(bot, player, keys);  // toma decisión
  }

  _decide(bot, player, keys) {
    // Calcular distancia
    const dist = Math.abs(
      (bot.x + bot.w / 2) - (player.x + player.w / 2)
    );
    const rng = Math.random();  // 0.0 a 1.0

    // Limpiar todas las teclas
    keys.ArrowLeft  = false;
    keys.ArrowRight = false;
    keys.ArrowUp    = false;
    keys.ArrowDown  = false;
    keys.k          = false;  // ataque
    keys.l          = false;  // especial

    // PRIORIDAD 1: Bloquear si el rival está muy cerca
    if (dist < 110 && rng < this.blockChance) {
      keys.ArrowDown = true;  // agacharse = bloquear
      return;
    }

    // PRIORIDAD 2: Esquivar saltando (dificultades altas)
    if (dist < 70 && Math.random() < this.dodgeChance && bot.onGround) {
      keys.ArrowUp = true;
      return;
    }

    // PRIORIDAD 3: Moverse hacia el rival
    if (rng < this.accuracy) {
      const cx_bot    = bot.x + bot.w / 2;
      const cx_player = player.x + player.w / 2;
      if (cx_bot > cx_player + this.attackRange * 0.8) 
        keys.ArrowLeft = true;
      else if (cx_bot < cx_player - this.attackRange * 0.8) 
        keys.ArrowRight = true;
    }

    // PRIORIDAD 4: Atacar si está en rango
    if (dist < this.attackRange) {
      if (Math.random() < this.specialChance) 
        keys.l = true;  // ataque especial
      else 
        keys.k = true;  // ataque normal
    }
  }
}
```

### Dificultades Comparadas

| Parámetro | Easy | Medium | Hard |
|---|---|---|---|
| **thinkTime** | 85 frames | 40 frames | 18 frames |
| **blockChance** | 6% | 22% | 48% |
| **specialChance** | 5% | 18% | 32% |
| **accuracy** | 38% | 70% | 96% |
| **dodgeChance** | 0% | 5% | 28% |
| **Tiempo entre decisiones** | ~1.4 seg | ~0.67 seg | ~0.3 seg |

**Interpretación:**
- **Easy**: Lento, impreciso, poco bloquea
- **Medium**: Equilibrado
- **Hard**: Reacciona rápido, bloquea a menudo, esquiva

### Cómo Funciona la IA

1. **Cada `thinkTime` frames**, el bot toma una decisión
2. **Calcula distancia** al jugador
3. **Ejecuta prioridades:**
   - Si muy cerca → bloquear
   - Si muy cercano → esquivar saltando
   - Si no está en rango → moverse hacia jugador
   - Si en rango → atacar
4. **Modifica las teclas** del objeto `keys` (simulando pulsaciones)

---

## Sistema de Audio (audio.js)

### Arquitectura

```javascript
const AudioMgr = (() => {
  const cache  = {};      // almacena Audio objects
  let musicVol = 0.5;     // volumen de música (0-1)
  let sfxVol   = 0.7;     // volumen de efectos (0-1)
  let current  = null;    // pista de música activa
  let muted    = false;   // silenciado

  const TRACKS = {
    menu:      'assets/sounds/menu.mp3',
    battle:    'assets/sounds/battle.mp3',
    win:       'assets/sounds/win.mp3',
    ko:        'assets/sounds/ko.mp3',
    hit:       'assets/sounds/hit.mp3',
    special:   'assets/sounds/special.mp3',
    block:     'assets/sounds/block.mp3',
    select:    'assets/sounds/select.mp3',
    countdown: 'assets/sounds/countdown.mp3'
  };

  // ... funciones públicas
})();
```

### Funciones Principales

#### `init()`
```javascript
function init() {
  Object.entries(TRACKS).forEach(([key, src]) => {
    const a = new window.Audio(src);
    a.preload = 'auto';
    a.onerror = () => {};  // silenciar error si no existe
    cache[key] = a;
  });
}
```
- Se llama al cargar `index.html`
- Precarga todos los archivos de audio
- Si un archivo no existe, lo ignora sin error

#### `playMusic(name)`
```javascript
function playMusic(name) {
  if (muted) return;
  stopMusic();  // detener anterior
  const a = cache[name];
  if (!a) return;
  a.loop = true;      // repetir infinito
  a.volume = musicVol;
  a.currentTime = 0;
  a.play().catch(() => {});
  current = a;
}
```
- Reproduce música en **loop infinito**
- Solo una pista a la vez (para música de fondo)

#### `sfx(name)`
```javascript
function sfx(name) {
  if (muted) return;
  const a = cache[name];
  if (!a) return;
  const clone = a.cloneNode();  // clonar para permitir sonidos simultaneos
  clone.volume = sfxVol;
  clone.play().catch(() => {});
}
```
- Reproduce **efectos de sonido**
- Clona el audio para permitir **múltiples sonidos simultáneos**
- Ejemplo: 3 golpes pegados = 3 sonidos de "hit" juntos

#### `toggle()`
```javascript
function toggle() {
  muted = !muted;
  if (muted) stopMusic();
  else if (current) current.play().catch(() => {});
  const btn = document.getElementById('mute-btn');
  if (btn) btn.textContent = muted ? '🔇' : '🔊';
  return muted;
}
```
- Alterna silencio/sonido
- Cambia el icono del botón mute

#### `setMusicVol(v)` y `setSFXVol(v)`
```javascript
function setMusicVol(v) {
  musicVol = v;
  if (current) current.volume = v;
}

function setSFXVol(v) { sfxVol = v; }
```
- Controlan volumen desde UI (sliders)

### Archivos de Audio Esperados

| Archivo | Cuándo se usa |
|---------|---|
| `menu.mp3` | Pantalla principal (loop) |
| `battle.mp3` | Durante el combate (loop) |
| `win.mp3` | Al ganar un round |
| `ko.mp3` | Cuando alguien recibe KO |
| `hit.mp3` | Golpe normal |
| `special.mp3` | Ataque especial |
| `block.mp3` | Bloqueo exitoso |
| `select.mp3` | Seleccionar personaje |
| `countdown.mp3` | (Opcional) Timer en 0 |

### Dónde Conseguir Música Gratis

```
https://opengameart.org          ← Mejora calidad
https://freesound.org             ← Más variado
https://pixabay.com/music         ← Muy fácil
```

---

## Sistema de Combate

### Flujo de un Ataque

```
1. Jugador presiona F (puño)
   ↓
2. justPressed['f'] = true
   ↓
3. En _movePlayer(), se detecta:
   p.atkType = ATK.PUNCH
   p.atkTimer = 20 (durará 20 frames)
   ↓
4. Cada frame mientras atkTimer > 0:
   - Se llama _checkHit(p1, p2)
   - Si hay contacto y está en rango:
     * Se calcula daño
     * Se aplica bloqueo si aplica
     * Se resta HP
     * Se aplica knockback
     * Se emite sonido
   ↓
5. Cuando atkTimer llega a 0:
   p.atkType = null (fin del ataque)
```

### Sistema de Alcance (Reach)

El alcance depende del tipo de ataque:

```javascript
const reach = {
  [ATK.PUNCH]:   80,    // corto
  [ATK.KICK]:   105,    // medio
  [ATK.LOW]:     75,    // corto
  [ATK.AIR]:     90,    // medio
  [ATK.SPECIAL]: 130,   // largo
  [ATK.COMBO]:   95,    // medio
}
```

**Visualización:**
```
Personaje A        Personaje B
[====o====]        [====o====]
         |<-- 80 px (PUNCH) -->|
         |<-- 105 px (KICK) -->|
         |<-- 130 px (SPECIAL) -->|
```

### Cálculo de Daño

```javascript
// 1. Daño base según tipo de ataque
const baseDmg = {
  [ATK.PUNCH]:   fighter.attacks.normal,           // 100%
  [ATK.KICK]:    fighter.attacks.normal * 1.4,     // 140%
  [ATK.LOW]:     fighter.attacks.normal * 0.9,     // 90%
  [ATK.AIR]:     fighter.attacks.normal * 1.2,     // 120%
  [ATK.SPECIAL]: fighter.attacks.special,          // máximo
  [ATK.COMBO]:   fighter.attacks.normal * 2.2,     // 220%
};

// 2. Aplicar modificador de defensa
let dmg = Math.round(baseDmg * defender.fighter.defMod);

// 3. Aplicar bloqueo (si aplica)
if (defender.blocking && !isLowAttack) {
  dmg = Math.round(dmg * 0.18);  // solo 18% del daño
}
```

**Ejemplo con RYU vs TANK:**
- RYU puño: 12 daño
- TANK defMod: 0.45
- Daño recibido: 12 * 0.45 = **5.4 ≈ 5 daño**
- Con bloqueo: 5 * 0.18 = **0.9 ≈ 1 daño**

### Sistema de Bloqueo

```
Presionar S (P1) o ↓ (P2) en el suelo
  ↓
p.crouching = true
p.blocking = true
  ↓
Golpe normal conecta
  ↓
¿Es golpe bajo (LOW)? 
  - SÍ: Rompe bloqueo, daño 100%
  - NO: Bloqueo exitoso, daño 18%
  ↓
¿Es golpe aéreo (AIR)?
  - SÍ: No se puede bloquear (golpea arriba)
  - NO: Bloqueo aplicado
```

### Sistema de Knockback

```javascript
// Calcular knockback (empuje)
const kb = fighter.knockback * 
  (atkType === ATK.SPECIAL ? 1.8 :  // 180% de empuje
   atkType === ATK.COMBO ? 1.5 :    // 150%
   1);                               // 100%

// Aplicar al defensor
def.vx = (cx_def > cx_att ? 1 : -1) * kb;

// Si es ataque aéreo, lanzar hacia arriba
if (atkType === ATK.AIR) def.vy = -5;
```

### Ejemplo Práctico de Daño

**Escenario: STRIKER golpea a GUARDIAN con puño**

```javascript
// Datos
STRIKER = { damage: 5, attacks: { normal: 18 }, knockback: 8 }
GUARDIAN = { defMod: 0.65, knockback: 6 }

// Cálculo
baseDmg = 18                        // puño de STRIKER
dmg = 18 * 0.65 = 11.7 ≈ 12       // GUARDIAN recibe 65% de daño

// Si GUARDIAN bloquea
dmg = 12 * 0.18 = 2.16 ≈ 2        // solo 2 de daño

// Knockback
kb = 8 * 1 = 8 píxeles            // GUARDIAN se empuja 8 px
```

---

## Personalización del Código

### 1. Agregar un Nuevo Personaje

**Paso 1:** Editar `js/fighters.js`

```javascript
// Al final del array FIGHTERS[], agregar:
{
  id: 6,  // nuevo ID
  name: "NINJA",
  emoji: "🥷",
  role: "Asesino",
  color: "#333333",
  colorDark: "#000000",
  colorLight: "#666666",
  
  damage: 4,
  speed: 5,
  defense: 1,
  
  moveSpeed: 6,
  defMod: 1.2,
  knockback: 4,
  
  attacks: { normal: 15, special: 30 },
  specialName: "Shuriken",
  description: "Rápido y mortal. Ataca y desaparece.",
  
  draw(c, cx, cy, facing, state) {
    const f = facing;
    c.save();
    c.translate(cx, cy);
    
    // Dibujar NINJA aquí
    c.fillStyle = "#333";
    c.fillRect(-20, -50, 40, 50);  // cuerpo
    
    // Ojos rojos
    c.fillStyle = "#ff0000";
    c.fillRect(-8*f-3, -105, 4, 4);
    c.fillRect(8*f-3, -105, 4, 4);
    
    c.restore();
  }
}
```

**Paso 2:** Actualizar `index.html` si tiene más de 6 personajes

```html
<!-- En la selección de personajes, asegurarse que el grid es lo suficientemente grande -->
<div class="character-grid" id="char-grid"></div>
```

### 2. Modificar Stats de un Personaje

**Editar `js/fighters.js`:**

```javascript
// Hacer que RYU sea más lento pero más fuerte
{
  name: "RYU",
  damage: 4,        // antes: 3 (más daño)
  speed: 2,         // antes: 3 (más lento)
  defense: 3,
  moveSpeed: 3,     // antes: 4 (más lento)
  defMod: 1.0,
  knockback: 6,     // antes: 5 (más empuje)
  attacks: { 
    normal: 15,     // antes: 12 (más daño)
    special: 30     // antes: 25
  },
  // ...
}
```

### 3. Cambiar Física del Juego

**En `js/game.js`:**

```javascript
// Gravedad (línea ~421)
p.vy += 0.55;  // cambiar este número
// Valores típicos:
// 0.35 = gravedad baja (salta alto)
// 0.55 = gravedad normal (actual)
// 0.75 = gravedad alta (cae rápido)

// Velocidad máxima horizontal
// En _movePlayer(), línea ~346
if (keys[right])  p.vx = spd;  // spd viene de fighter.moveSpeed
else if (keys[left]) p.vx = -spd;
else p.vx *= 0.85;  // desaceleración

// Velocidad de salto (línea ~354)
if (justPressed[up] && p.onGround) {
  p.vy = -12;  // cambiar este número
  // Valores:
  // -8  = salto bajo
  // -12 = salto normal (actual)
  // -16 = salto alto
}
```

### 4. Agregar un Nuevo Tipo de Ataque

**En `js/game.js`:**

```javascript
// 1. Agregar a constantes (línea ~54)
const ATK = {
  // ... existentes ...
  THROW:  'throw',  // nuevo tipo
};

// 2. En _movePlayer(), agregar tecla para THROW
else if (justPressed['t']) {  // tecla 'T'
  p.atkType = ATK.THROW;
  p.atkTimer = 25;
  p.atkCooldown = 35;
}

// 3. En _checkHit(), agregar al objeto reach
const reach = {
  // ... existentes ...
  [ATK.THROW]: 110,
};

// 4. En _checkHit(), agregar al objeto baseDmg
const baseDmg = {
  // ... existentes ...
  [ATK.THROW]: att.fighter.attacks.normal * 1.5,
};
```

### 5. Cambiar Dificultad del Bot

**En `js/bot.js`:**

```javascript
// Hacer el bot más difícil en nivel HARD
this.blockChance = { 
  easy: 0.06,
  medium: 0.22,
  hard: 0.70  // antes: 0.48 (bloquea más)
}[difficulty];

this.specialChance = { 
  easy: 0.05,
  medium: 0.18,
  hard: 0.50  // antes: 0.32 (usa especial más)
}[difficulty];
```

### 6. Cambiar Sonidos

**En `js/audio.js`:**

```javascript
const TRACKS = {
  menu:      'assets/sounds/menu_theme.mp3',      // cambiar nombre
  battle:    'assets/sounds/fight_battle.mp3',
  win:       'assets/sounds/victory_fanfare.mp3',
  // ... etc
};
```

Luego **descarga archivos .mp3** de:
- https://opengameart.org
- https://freesound.org
- https://pixabay.com/music

Y **ponlos en `assets/sounds/`** con los nombres exactos.

---

## Conceptos Técnicos

### Canvas 2D

```javascript
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');

// Dibujar rectángulo
c.fillStyle = '#ff0000';
c.fillRect(x, y, width, height);

// Dibujar círculo
c.fillStyle = '#00ff00';
c.beginPath();
c.arc(cx, cy, radius, 0, Math.PI*2);
c.fill();

// Guardar estado y aplicar transformación
c.save();
c.translate(x, y);      // mover origen
c.scale(sx, sy);        // escalar
c.rotate(angle);        // rotar
c.restore();            // restaurar estado anterior
```

### RequestAnimationFrame Loop

```javascript
function gameLoop() {
  // 1. Actualizar lógica
  updateGame();
  
  // 2. Renderizar
  renderGame();
  
  // 3. Solicitar siguiente frame (60 FPS en navegadores)
  requestAnimationFrame(gameLoop);
}

// Iniciar
requestAnimationFrame(gameLoop);
```

- **60 FPS** = 60 frames por segundo = 16.67 ms por frame
- Más eficiente que `setInterval()` (sincroniza con refresh del monitor)

### Detección de Colisiones

```javascript
// Colisión rectángulo vs punto (círculo pequeño)
function isPointInRect(px, py, rx, ry, rw, rh) {
  return px > rx && px < rx + rw &&
         py > ry && py < ry + rh;
}

// Colisión distancia (lo que usamos)
function distancia(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx*dx + dy*dy);
}

if (distancia(p1.x, p1.y, p2.x, p2.y) < alcance) {
  // golpea
}
```

En Fight Game usamos distancia en eje X únicamente (alcance horizontal).

### Sistema de Estado

El juego mantiene todo en objetos globales:

```javascript
// Jugador
let p1 = {
  x, y, w, h,           // física
  hp, maxHp,            // salud
  vx, vy,               // velocidad
  atkType, atkTimer,    // ataque
  fighter,              // referencia al personaje
  // ...
};

// Al atacar, cambiar atkType
p1.atkType = ATK.PUNCH;

// En checkHit, leer atkType para calcular daño
if (p1.atkType === ATK.SPECIAL) dmg = baseDmg_special;

// En render, leer atkType para animar
if (p1.attacking) drawFistExtended();
```

### Timers y Cooldowns

```javascript
// Ataque
p.atkTimer = 20;    // durará 20 frames
p.atkCooldown = 22; // esperar 22 frames antes del próximo

// Cada frame
if (p.atkTimer > 0) p.atkTimer--;
if (p.atkCooldown > 0) p.atkCooldown--;

// Cuando expira
if (p.atkTimer <= 0) p.atkType = null;  // fin del ataque
if (p.atkCooldown <= 0) canAttack = true;
```

### Knockback (Empuje)

```javascript
// Calcular dirección
const direction = defender.x > attacker.x ? 1 : -1;

// Aplicar velocidad
defender.vx = direction * knockbackAmount;

// Se aplica automáticamente en física
defender.x += defender.vx;
```

---

## Conclusión

Este documento cubre toda la arquitectura de **Fight Game v3.0**. El código es modular, extensible y está diseñado para ser fácil de personalizar.

**Puntos clave:**
- ✅ 60 FPS game loop con Canvas
- ✅ Sistema de combate con alcance y daño
- ✅ 6 personajes con stats únicos
- ✅ IA adaptativa del bot
- ✅ Audio sin API externa
- ✅ Modo online P2P con PeerJS
- ✅ Código vanilla (sin frameworks)

¡Ahora puedes entender y modificar cualquier parte del juego! 🎮⚔️
