# ⚔️ Fight Game v3.0

Juego de pelea 2D en HTML5 Canvas puro. Sin frameworks, sin dependencias de build.
Online P2P con PeerJS (WebRTC) — no necesita servidor propio.

---

## 📁 Estructura del proyecto

```
fight-game/
├── index.html              ← Entrada principal
├── install.bat             ← Crea carpetas automáticamente (Windows)
├── install.sh              ← Crea carpetas automáticamente (Mac/Linux)
├── README.md               ← Este archivo
├── ARQUITECTURA.md         ← Mapa de dependencias entre archivos
│
├── css/
│   └── style.css           ← Todos los estilos
│
├── js/
│   ├── fighters.js         ← 6 personajes: stats + función draw()
│   ├── stages.js           ← 6 escenarios: dibujados en canvas
│   ├── bot.js              ← IA del bot (easy / medium / hard)
│   ├── audio.js            ← Música y efectos de sonido
│   ├── online.js           ← Modo online con PeerJS (WebRTC P2P)
│   └── game.js             ← Motor principal: loop, física, render
│
├── assets/
│   ├── images/
│   │   ├── stages/         ← (opcional) Fondos JPG 800×400 px
│   │   └── fighters/       ← (opcional) Sprites PNG por personaje
│   └── sounds/
│       ├── menu.mp3
│       ├── battle.mp3
│       ├── win.mp3
│       ├── ko.mp3
│       ├── hit.mp3
│       ├── special.mp3
│       ├── block.mp3
│       └── select.mp3
│
└── server/                 ← Solo si usas servidor propio
    ├── package.json
    └── server.js
```

---

## 🚀 Cómo ejecutar

### Opción A — Sin instalar nada (recomendado para empezar)

1. Crea las carpetas con `install.bat` (Windows) o `install.sh` (Mac/Linux)
2. Copia todos los archivos en sus carpetas
3. Abre `index.html` directo en Chrome o Firefox

> ⚠️ El modo online requiere un servidor local (ver abajo) porque Chrome bloquea WebRTC en `file://`

### Opción B — Servidor local (recomendado para online)

```bash
# Requiere Node.js instalado — https://nodejs.org (versión LTS)
npx serve .
# Luego abre: http://localhost:3000
```

### Opción C — Servidor propio con Socket.io

```bash
cd server
npm install
node server.js
# Luego abre: http://localhost:3000
```

---

## 🌐 Despliegue en internet (gratis)


| Plataforma       | Modo online  | Cómo                                 |
| ---------------- | ------------ | ------------------------------------- |
| **GitHub Pages** | ✅ PeerJS    | Settings → Pages → Branch: main     |
| **Vercel**       | ✅ PeerJS    | Importar repo desde vercel.com        |
| **Railway**      | ✅ Socket.io | Conectar repo → detecta package.json |
| **Render**       | ✅ Socket.io | New → Web Service → conectar repo   |

---

## 🎮 Controles


| Acción            | Jugador 1 | Jugador 2   |
| ------------------ | --------- | ----------- |
| Mover              | `A` / `D` | `←` / `→` |
| Saltar             | `W`       | `↑`        |
| Agachar / Bloquear | `S`       | `↓`        |
| Ataque normal      | `F`       | `K`         |
| Ataque especial    | `G`       | `L`         |

---

## 🧍 Personajes


| Nombre   | Rol          | Daño      | Velocidad  | Defensa    | Especial        |
| -------- | ------------ | ---------- | ---------- | ---------- | --------------- |
| RYU      | Equilibrado  | ★★★     | ★★★     | ★★★     | Hadoken         |
| TANK     | Tanque       | ★         | ★         | ★★★★★ | Escudo Absoluto |
| STRIKER  | Destructor   | ★★★★★ | ★         | ★★       | Uppercut        |
| SPEEDY   | Velocista    | ★★       | ★★★★★ | ★★       | Dash Kick       |
| COMBO    | Comboísta   | ★★★★   | ★★★     | ★         | Tornado         |
| GUARDIAN | Contraataque | ★★       | ★★       | ★★★★   | Contraataque    |

---

## 🗺️ Escenarios

Los escenarios se seleccionan **aleatoriamente** al inicio de cada round.


| # | Nombre             |
| - | ------------------ |
| 0 | Dojo Sagrado       |
| 1 | Ciudad Nocturna    |
| 2 | Templo Antiguo     |
| 3 | Arena del Desierto |
| 4 | Bosque Oscuro      |
| 5 | Estación Orbital  |

Para fijar un escenario específico, en `game.js` reemplaza:

```js
currentStage = getRandomStage();
```

por:

```js
currentStage = STAGES[2]; // 0-5
```

---

## ✏️ Cómo personalizar

### Cambiar stats de un personaje

Edita `js/fighters.js`:

```js
{
  name: "TANK",
  moveSpeed: 2,       // velocidad (1 lento → 8 rápido)
  defMod: 0.45,       // daño recibido (0.5 = mitad, 1.5 = más)
  knockback: 2,       // empuje al golpear
  attacks: {
    normal: 7,        // daño de F / K
    special: 18       // daño de G / L
  }
}
```

### Reemplazar personaje con sprite PNG

En la función `draw()` del personaje en `fighters.js`:

```js
draw(c, cx, cy, facing, state) {
  const img = new Image();
  img.src = 'assets/images/fighters/RYU.png';
  c.save();
  if (facing === -1) { c.scale(-1, 1); c.translate(-cx*2, 0); }
  c.drawImage(img, cx - 30, cy - 110, 60, 110);
  c.restore();
}
```

Tamaño recomendado del sprite: **60×110 px** con fondo transparente (PNG).

### Reemplazar escenario con imagen JPG

En la función `draw()` del escenario en `stages.js`:

```js
draw(c, W, H, GROUND) {
  const bg = new Image();
  bg.src = 'assets/images/stages/dojo.jpg';
  c.drawImage(bg, 0, 0, W, H);
  // Suelo opcional encima de la imagen:
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.fillRect(0, GROUND, W, H - GROUND);
}
```

Tamaño recomendado: **800×400 px** en JPG o PNG.

### Agregar música propia

Descarga archivos `.mp3` libres de derechos de:

- https://opengameart.org
- https://freesound.org
- https://pixabay.com/music

Ponlos en `assets/sounds/` con los nombres exactos del README.
Si un archivo no existe, el juego continúa sin error.

### Agregar un nuevo escenario

En `js/stages.js`, agrega un objeto al array `STAGES[]`:

```js
{
  id: 6,
  name: "Mi Escenario",
  groundColor: "#112233",
  groundLine: "#3366ff",
  draw(c, W, H, GROUND) {
    // Tu código de dibujo aquí
    c.fillStyle = '#112233';
    c.fillRect(0, 0, W, H);
    // ...
    c.fillStyle = this.groundLine;
    c.fillRect(0, GROUND, W, 4);
  }
}
```

---

## 🔧 Qué instalar


| Para qué                     | Qué instalar                                 |
| ----------------------------- | --------------------------------------------- |
| Solo jugar local y online P2P | **Nada** — abrir `index.html`                |
| Online en localhost           | **Node.js LTS** → `npx serve .`              |
| Servidor propio               | **Node.js LTS** → `cd server && npm install` |
| Deploy en Railway/Render      | Cuenta gratuita + repo en GitHub              |

---

## 🧩 Buenas prácticas del código

- **Separación de responsabilidades**: cada archivo tiene un único propósito.
- **Sin variables globales innecesarias**: el estado del juego vive en `game.js`.
- **Orden de carga explícito**: comentado en `index.html`.
- **Código sin build step**: abrir con el navegador, sin webpack ni bundler.
- **Escenarios intercambiables**: la función `draw()` recibe siempre `(c, W, H, GROUND)`.
- **Personajes intercambiables**: la función `draw()` recibe siempre `(c, cx, cy, facing, state)`.
- **Audio tolerante a fallos**: si el `.mp3` no existe, el juego no se rompe.
- **Online sin servidor propio**: PeerJS usa los servidores públicos de PeerJS.com.

---

## 📝 Licencia

Uso libre para proyectos personales y educativos.
