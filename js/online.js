// ============================================================
// online.js — Modo online P2P con PeerJS (WebRTC)
// No necesita servidor propio. Funciona en:
//   - localhost (abre index.html directo)
//   - GitHub Pages
//   - Vercel / Netlify
// ============================================================

const Online = (() => {
  let peer        = null;
  let conn        = null;
  let _isHost     = false;
  let _ready      = false;

  function _setStatus(msg) {
    const el = document.getElementById('online-status');
    if (el) el.textContent = msg;
  }

  function _generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin letras confusas
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  // ---- CREAR SALA ----
  function createRoom() {
    _cleanup();
    const code   = _generateCode();
    const roomId = 'fightgame2-' + code;

    _setStatus('Conectando al servidor PeerJS...');
    peer    = new Peer(roomId);
    _isHost = true;

    peer.on('open', () => {
      const info = document.getElementById('room-info');
      if (info) {
        info.innerHTML =
          'Comparte este código con tu rival:<br>' +
          '<strong>' + code + '</strong>';
        info.classList.remove('hidden');
      }
      _setStatus('⏳ Esperando que alguien se una...');
    });

    peer.on('connection', (c) => {
      conn = c;
      _setupConn();
      _setStatus('✅ ¡Rival conectado! Iniciando...');
      setTimeout(() => _startGame(), 1500);
    });

    peer.on('error', (e) => _setStatus('❌ Error: ' + e.type));
  }

  // ---- UNIRSE A SALA ----
  function joinRoom() {
    _cleanup();
    const input = document.getElementById('room-code-input');
    const code  = input ? input.value.toUpperCase().replace(/\s/g, '') : '';
    if (code.length < 6) { alert('El código debe tener 6 caracteres.'); return; }

    const roomId = 'fightgame2-' + code;
    _isHost      = false;
    _setStatus('Conectando a la sala ' + code + '...');

    peer = new Peer();

    peer.on('open', () => {
      conn = peer.connect(roomId, { reliable: true });
      _setupConn();
    });

    peer.on('error', (e) => {
      const msg = e.type === 'peer-unavailable'
        ? '❌ Sala no encontrada. Verifica el código.'
        : '❌ Error: ' + e.type;
      _setStatus(msg);
    });
  }

  // ---- CONFIGURAR CONEXIÓN ----
  function _setupConn() {
    conn.on('open',  ()  => {
      _ready = true;
      if (!_isHost) _setStatus('✅ Conectado. Iniciando partida...');
      if (!_isHost) setTimeout(() => _startGame(), 1000);
    });
    conn.on('data',  (d) => { if (window._onlineReceive) window._onlineReceive(d); });
    conn.on('close', ()  => {
      _ready = false;
      alert('❌ El rival se desconectó.');
    });
    conn.on('error', ()  => _setStatus('❌ Error de conexión.'));
  }

  // ---- INICIAR JUEGO ONLINE ----
  function _startGame() {
    window._onlineIsHost = _isHost;
    Game.selectMode('online-ready');
  }

  // ---- ENVIAR ESTADO ----
  function send(data) {
    if (conn && _ready) conn.send(data);
  }

  // ---- LIMPIAR CONEXIÓN ANTERIOR ----
  function _cleanup() {
    if (conn)  { conn.close();    conn  = null; }
    if (peer)  { peer.destroy();  peer  = null; }
    _ready = false;
    const info = document.getElementById('room-info');
    if (info) info.classList.add('hidden');
    _setStatus('');
  }

  function isReady()  { return _ready; }
  function isHost()   { return _isHost; }

  return { createRoom, joinRoom, send, isReady, isHost };
})();