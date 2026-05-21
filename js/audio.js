// ============================================================
// audio.js — Sistema de música y efectos de sonido
// ============================================================
// NO necesita API ni internet.
// Pon tus archivos .mp3 en assets/sounds/ con estos nombres:
//
//   menu.mp3      → música del menú
//   battle.mp3    → música de pelea
//   win.mp3       → fanfarria de victoria
//   ko.mp3        → sonido K.O.
//   hit.mp3       → golpe normal
//   special.mp3   → golpe especial
//   block.mp3     → bloqueo
//   select.mp3    → seleccionar personaje
//   countdown.mp3 → sonido del timer (opcional)
//
// Si un archivo no existe, el juego sigue funcionando sin él.
// Música gratis sin derechos:
//   https://opengameart.org
//   https://freesound.org
//   https://pixabay.com/music
// ============================================================

const AudioMgr = (() => {
  const cache  = {};
  let musicVol = 0.5;
  let sfxVol   = 0.7;
  let current  = null;   // pista de música activa
  let muted    = false;

  const TRACKS = {
    menu    : 'assets/sounds/menu.mp3',
    battle  : 'assets/sounds/battle.mp3',
    win     : 'assets/sounds/win.mp3',
    ko      : 'assets/sounds/ko.mp3',
    hit     : 'assets/sounds/hit.mp3',
    special : 'assets/sounds/special.mp3',
    block   : 'assets/sounds/block.mp3',
    select  : 'assets/sounds/select.mp3',
    countdown:'assets/sounds/countdown.mp3'
  };

  // Precargar todos los archivos al inicio
  function init() {
    Object.entries(TRACKS).forEach(([key, src]) => {
      const a = new window.Audio(src);
      a.preload = 'auto';
      a.onerror = () => {}; // silenciar error si el archivo no existe
      cache[key] = a;
    });
  }

  // Reproducir música en loop
  function playMusic(name) {
    if (muted) return;
    stopMusic();
    const a = cache[name];
    if (!a) return;
    a.loop        = true;
    a.volume      = musicVol;
    a.currentTime = 0;
    a.play().catch(() => {});
    current = a;
  }

  // Detener música activa
  function stopMusic() {
    if (!current) return;
    current.pause();
    current.currentTime = 0;
    current = null;
  }

  // Reproducir efecto de sonido (puede sonar varias veces a la vez)
  function sfx(name) {
    if (muted) return;
    const a = cache[name];
    if (!a) return;
    const clone    = a.cloneNode();
    clone.volume   = sfxVol;
    clone.play().catch(() => {});
  }

  // Silenciar / activar
  function toggle() {
    muted = !muted;
    if (muted) stopMusic();
    else if (current) current.play().catch(() => {});
    const btn = document.getElementById('mute-btn');
    if (btn) btn.textContent = muted ? '🔇' : '🔊';
    return muted;
  }

  function setMusicVol(v) {
    musicVol = v;
    if (current) current.volume = v;
  }
  function setSFXVol(v) { sfxVol = v; }

  return { init, playMusic, stopMusic, sfx, toggle, setMusicVol, setSFXVol };
})();

// Inicializar al cargar la página
window.addEventListener('DOMContentLoaded', () => AudioMgr.init());