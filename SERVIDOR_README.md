# 🖥️ Servidor Node.js — Railway / Render / Localhost

## ¿Para qué sirve este servidor?
El juego ya funciona online con PeerJS (sin servidor).
Este servidor Node.js es **opcional** y te da más control,
estabilidad y un modo online con Socket.io.

---

## 📁 Crea la carpeta `server/` con estos 2 archivos:

---

### server/package.json
```json
{
  "name": "fightgame-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

### server/server.js
```js
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

// Sirve los archivos del juego
app.use(express.static(path.join(__dirname, '..')));

const rooms = {};

io.on('connection', (socket) => {
  console.log('Jugador conectado:', socket.id);

  socket.on('create-room', ({ code, fighter }) => {
    rooms[code] = { host: socket.id, hostFighter: fighter };
    socket.join(code);
    socket.emit('room-created', { code });
    console.log('Sala creada:', code);
  });

  socket.on('join-room', ({ code, fighter }) => {
    const room = rooms[code];
    if (!room)       { socket.emit('room-error', 'Sala no encontrada'); return; }
    if (room.guest)  { socket.emit('room-error', 'Sala llena');         return; }
    room.guest       = socket.id;
    room.guestFighter= fighter;
    socket.join(code);
    io.to(code).emit('game-start', {
      hostFighter : room.hostFighter,
      guestFighter: room.guestFighter
    });
  });

  socket.on('game-state', ({ code, state }) => {
    socket.to(code).emit('opponent-state', state);
  });

  socket.on('disconnect', () => {
    Object.keys(rooms).forEach(code => {
      const r = rooms[code];
      if (r.host === socket.id || r.guest === socket.id) {
        io.to(code).emit('opponent-disconnected');
        delete rooms[code];
        console.log('Sala eliminada:', code);
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('✅ Servidor corriendo en http://localhost:' + PORT));
```

---

## 🚀 Cómo correrlo

### Localhost:
```bash
cd server
npm install
node server.js
```
Luego abre: **http://localhost:3000**

### Con recarga automática (desarrollo):
```bash
npm install -g nodemon
nodemon server.js
```

### Railway (gratis):
1. Sube todo a GitHub
2. Entra a https://railway.app → New Project → Deploy from GitHub
3. Selecciona tu repo
4. Railway detecta `package.json` automáticamente
5. En Settings → Root Directory → pon `server`
6. Te da una URL pública gratis tipo `https://tuapp.up.railway.app`

### Render (gratis):
1. Entra a https://render.com → New → Web Service
2. Conecta tu GitHub
3. Build Command: `cd server && npm install`
4. Start Command: `node server/server.js`
5. Te da URL pública gratis

---

## ⚡ Resumen
| Modo       | Necesita servidor | Funciona en         |
|------------|------------------|---------------------|
| vs Bot     | ❌ No            | index.html directo  |
| Local 2J   | ❌ No            | index.html directo  |
| Online P2P | ❌ No (PeerJS)   | GitHub Pages/Vercel |
| Online WS  | ✅ Sí (este)     | Railway / Render    |