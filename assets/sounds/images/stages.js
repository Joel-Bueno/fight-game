// ============================================================
// stages.js v1 — 6 escenarios dibujados en Canvas
// Se selecciona uno aleatorio al inicio de cada partida.
// Para reemplazar con imágenes propias: ver comentarios al final.
// ============================================================

const STAGES = [

  // ──────────────────────────────────────────────
  // 0. DOJO — Interior japonés
  // ──────────────────────────────────────────────
  {
    id: 0,
    name: "Dojo Sagrado",
    groundColor: "#3d1f00",
    groundLine: "#8B4513",
    draw(c, W, H, GROUND) {
      // Cielo interior / pared de madera
      const wall = c.createLinearGradient(0, 0, 0, GROUND);
      wall.addColorStop(0, "#1a0800");
      wall.addColorStop(1, "#3d1500");
      c.fillStyle = wall; c.fillRect(0, 0, W, GROUND);

      // Vigas de madera horizontales
      c.fillStyle = "#2a0d00";
      for (let y = 60; y < GROUND; y += 80) {
        c.fillRect(0, y, W, 10);
      }
      // Vigas verticales
      for (let x = 0; x < W; x += 100) {
        c.fillStyle = "#2a0d00";
        c.fillRect(x, 0, 8, GROUND);
      }

      // Ventana con luz del sol
      c.fillStyle = "rgba(255,200,80,0.12)";
      c.fillRect(300, 20, 200, 180);
      c.strokeStyle = "#5a2800"; c.lineWidth = 6;
      c.strokeRect(300, 20, 200, 180);
      // Cruz de la ventana
      c.beginPath(); c.moveTo(400,20); c.lineTo(400,200); c.stroke();
      c.beginPath(); c.moveTo(300,110); c.lineTo(500,110); c.stroke();

      // Linternas
      _lantern(c, 80, 50);
      _lantern(c, 720, 50);

      // Suelo de madera pulida
      c.fillStyle = "#5c2800";
      c.fillRect(0, GROUND, W, H - GROUND);
      // Tablones
      c.strokeStyle = "#3d1500"; c.lineWidth = 2;
      for (let x = 0; x < W; x += 60) {
        c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x, H); c.stroke();
      }
      // Reflejo en el suelo
      c.fillStyle = "rgba(255,180,80,0.06)";
      c.fillRect(0, GROUND, W, 20);

      // Línea del suelo
      c.fillStyle = "#8B4513"; c.fillRect(0, GROUND, W, 4);
    }
  },

  // ──────────────────────────────────────────────
  // 1. CIUDAD NOCTURNA — Rooftop urbano
  // ──────────────────────────────────────────────
  {
    id: 1,
    name: "Ciudad Nocturna",
    groundColor: "#111122",
    groundLine: "#4444ff",
    draw(c, W, H, GROUND) {
      // Cielo nocturno con degradado
      const sky = c.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, "#000011");
      sky.addColorStop(1, "#0a0022");
      c.fillStyle = sky; c.fillRect(0, 0, W, GROUND);

      // Estrellas
      c.fillStyle = "#ffffff";
      const starSeeds = [7,23,41,67,89,113,137,157,181,211,233,257,281];
      starSeeds.forEach(s => {
        c.globalAlpha = 0.4 + (s % 5) * 0.12;
        c.fillRect((s * 61) % W, (s * 37) % (GROUND - 60), 2, 2);
      });
      c.globalAlpha = 1;

      // Luna
      c.fillStyle = "#ffffcc";
      c.beginPath(); c.arc(680, 50, 30, 0, Math.PI*2); c.fill();
      c.fillStyle = "#000022";
      c.beginPath(); c.arc(690, 44, 26, 0, Math.PI*2); c.fill();

      // Edificios del fondo (silueta)
      const buildings = [
        {x:0,   w:70,  h:180}, {x:80,  w:50,  h:220}, {x:140, w:80,  h:150},
        {x:230, w:60,  h:200}, {x:300, w:40,  h:240}, {x:350, w:90,  h:160},
        {x:450, w:55,  h:210}, {x:515, w:70,  h:170}, {x:595, w:45,  h:230},
        {x:650, w:80,  h:190}, {x:740, w:60,  h:220}, {x:740, w:60,  h:220},
      ];
      buildings.forEach(b => {
        c.fillStyle = "#0a0a1a";
        c.fillRect(b.x, GROUND - b.h, b.w, b.h);
        // Ventanas iluminadas
        for (let wy = GROUND - b.h + 15; wy < GROUND - 20; wy += 22) {
          for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 16) {
            if ((wx + wy) % 3 !== 0) {
              c.fillStyle = `rgba(255,${180 + (wx*wy)%75},0,0.7)`;
              c.fillRect(wx, wy, 8, 10);
            }
          }
        }
      });

      // Neón de fondo
      c.strokeStyle = "rgba(0,150,255,0.4)"; c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, GROUND - 2); c.lineTo(W, GROUND - 2); c.stroke();

      // Suelo del techo
      c.fillStyle = "#1a1a2a";
      c.fillRect(0, GROUND, W, H - GROUND);
      // Grietas / azulejos
      c.strokeStyle = "#0a0a1a"; c.lineWidth = 1;
      for (let x = 0; x < W; x += 50) {
        c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x, H); c.stroke();
      }
      // Reflejo neón en el suelo
      c.fillStyle = "rgba(0,100,255,0.08)";
      c.fillRect(0, GROUND, W, 25);

      c.fillStyle = "#4444ff"; c.fillRect(0, GROUND, W, 4);
    }
  },

  // ──────────────────────────────────────────────
  // 2. TEMPLO ANTIGUO — Ruinas al atardecer
  // ──────────────────────────────────────────────
  {
    id: 2,
    name: "Templo Antiguo",
    groundColor: "#2d1a00",
    groundLine: "#cc6600",
    draw(c, W, H, GROUND) {
      // Cielo al atardecer
      const sky = c.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, "#1a0500");
      sky.addColorStop(0.4, "#cc3300");
      sky.addColorStop(0.7, "#ff6600");
      sky.addColorStop(1, "#ffaa00");
      c.fillStyle = sky; c.fillRect(0, 0, W, GROUND);

      // Sol
      const sunGrd = c.createRadialGradient(400, GROUND-40, 5, 400, GROUND-40, 80);
      sunGrd.addColorStop(0, "#ffffff");
      sunGrd.addColorStop(0.3, "#ffee44");
      sunGrd.addColorStop(1, "rgba(255,100,0,0)");
      c.fillStyle = sunGrd;
      c.beginPath(); c.arc(400, GROUND-40, 80, 0, Math.PI*2); c.fill();

      // Montañas de fondo
      c.fillStyle = "#1a0800";
      _mountain(c, 0, GROUND, 200, 160);
      _mountain(c, 150, GROUND, 250, 200);
      _mountain(c, 380, GROUND, 220, 180);
      _mountain(c, 560, GROUND, 260, 210);
      _mountain(c, 680, GROUND, 180, 150);

      // Columnas del templo
      const colColor = "#5a3a00";
      [60, 180, 580, 700].forEach(x => {
        c.fillStyle = colColor;
        c.fillRect(x, GROUND - 220, 35, 220);
        // Capitel
        c.fillRect(x - 8, GROUND - 225, 51, 14);
        // Detalle columna
        c.fillStyle = "#6a4a00";
        for (let y = GROUND-215; y < GROUND-20; y += 30)
          c.fillRect(x+2, y, 31, 6);
      });
      // Friso del templo
      c.fillStyle = "#4a2800";
      c.fillRect(45, GROUND - 240, 695, 22);

      // Suelo de piedra antigua
      c.fillStyle = "#3d2000";
      c.fillRect(0, GROUND, W, H - GROUND);
      c.strokeStyle = "#2a1500"; c.lineWidth = 2;
      for (let x = 0; x < W; x += 80) {
        c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x, H); c.stroke();
      }
      for (let y = GROUND + 30; y < H; y += 30) {
        c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
      }
      c.fillStyle = "#cc6600"; c.fillRect(0, GROUND, W, 4);
    }
  },

  // ──────────────────────────────────────────────
  // 3. ARENA — Desierto
  // ──────────────────────────────────────────────
  {
    id: 3,
    name: "Arena del Desierto",
    groundColor: "#c8860a",
    groundLine: "#e8a020",
    draw(c, W, H, GROUND) {
      // Cielo caliente
      const sky = c.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, "#001133");
      sky.addColorStop(0.5, "#cc4400");
      sky.addColorStop(1, "#ffaa00");
      c.fillStyle = sky; c.fillRect(0, 0, W, GROUND);

      // Dunas de fondo
      c.fillStyle = "#8B5000";
      _duna(c, -50, GROUND, 350, 120);
      _duna(c, 250, GROUND, 400, 90);
      _duna(c, 500, GROUND, 380, 110);

      // Pirámide
      c.fillStyle = "#6B3800";
      c.beginPath();
      c.moveTo(600, GROUND);
      c.lineTo(710, GROUND - 170);
      c.lineTo(820, GROUND);
      c.fill();
      c.fillStyle = "#7B4800";
      c.fillRect(600, GROUND - 5, 220, 5);

      // Cactus
      _cactus(c, 100, GROUND);
      _cactus(c, 680, GROUND);

      // Partículas de arena (puntos)
      c.fillStyle = "rgba(255,200,80,0.3)";
      for (let i = 0; i < 20; i++)
        c.fillRect((i * 41 + 10) % W, (i * 37 + 20) % (GROUND - 30), 3, 3);

      // Suelo arenoso
      const sand = c.createLinearGradient(0, GROUND, 0, H);
      sand.addColorStop(0, "#e8a020");
      sand.addColorStop(1, "#a06010");
      c.fillStyle = sand;
      c.fillRect(0, GROUND, W, H - GROUND);
      // Ondas de arena
      c.strokeStyle = "rgba(255,180,0,0.3)"; c.lineWidth = 2;
      for (let y = GROUND + 15; y < H; y += 20) {
        c.beginPath();
        for (let x = 0; x < W; x += 40)
          c.quadraticCurveTo(x+20, y-5, x+40, y);
        c.stroke();
      }
      c.fillStyle = "#e8a020"; c.fillRect(0, GROUND, W, 4);
    }
  },

  // ──────────────────────────────────────────────
  // 4. BOSQUE — Naturaleza oscura
  // ──────────────────────────────────────────────
  {
    id: 4,
    name: "Bosque Oscuro",
    groundColor: "#1a3300",
    groundLine: "#33aa00",
    draw(c, W, H, GROUND) {
      // Cielo entre árboles
      const sky = c.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, "#000a00");
      sky.addColorStop(1, "#0a2200");
      c.fillStyle = sky; c.fillRect(0, 0, W, GROUND);

      // Luna entre nubes
      c.fillStyle = "rgba(200,230,200,0.9)";
      c.beginPath(); c.arc(400, 45, 25, 0, Math.PI*2); c.fill();
      c.fillStyle = "#000a00";
      c.beginPath(); c.arc(410, 38, 22, 0, Math.PI*2); c.fill();

      // Niebla de fondo
      for (let x = 0; x < W; x += 120) {
        c.fillStyle = "rgba(100,200,100,0.04)";
        c.beginPath(); c.ellipse(x+60, GROUND-30, 100, 40, 0, 0, Math.PI*2); c.fill();
      }

      // Árboles de fondo (siluetas)
      const treePos = [20, 90, 170, 250, 320, 420, 510, 600, 670, 730];
      treePos.forEach((x, i) => {
        const h = 140 + (i * 23) % 80;
        _tree(c, x, GROUND, h, "#0a1a00");
      });
      // Árboles del frente
      [0, 760].forEach(x => _tree(c, x, GROUND, 220, "#0d2200"));

      // Luciérnagas
      c.fillStyle = "rgba(100,255,100,0.6)";
      [130,270,420,580,700].forEach((x,i) =>
        c.fillRect(x, 80 + i*30, 3, 3)
      );

      // Suelo — musgo y tierra
      const ground = c.createLinearGradient(0, GROUND, 0, H);
      ground.addColorStop(0, "#1a4400");
      ground.addColorStop(1, "#0d2200");
      c.fillStyle = ground;
      c.fillRect(0, GROUND, W, H - GROUND);
      // Hierba
      c.fillStyle = "#2a6600";
      for (let x = 0; x < W; x += 8)
        c.fillRect(x, GROUND, 4, 6 + (x*3)%8);

      c.fillStyle = "#33aa00"; c.fillRect(0, GROUND, W, 4);
    }
  },

  // ──────────────────────────────────────────────
  // 5. ESPACIO — Estación orbital
  // ──────────────────────────────────────────────
  {
    id: 5,
    name: "Estación Orbital",
    groundColor: "#0a0a1a",
    groundLine: "#00ddff",
    draw(c, W, H, GROUND) {
      // Espacio profundo
      c.fillStyle = "#020210";
      c.fillRect(0, 0, W, H);

      // Nebulosa de fondo
      const neb1 = c.createRadialGradient(200, 150, 10, 200, 150, 200);
      neb1.addColorStop(0, "rgba(80,0,150,0.15)");
      neb1.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = neb1;
      c.fillRect(0, 0, W, GROUND);

      const neb2 = c.createRadialGradient(600, 100, 10, 600, 100, 180);
      neb2.addColorStop(0, "rgba(0,80,180,0.18)");
      neb2.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = neb2;
      c.fillRect(0, 0, W, GROUND);

      // Estrellas
      const stars = [
        [45,30],[120,80],[200,20],[310,65],[380,30],[450,90],
        [510,15],[620,55],[700,25],[750,80],[60,130],[180,160],
        [280,110],[400,140],[520,120],[660,100],[730,150]
      ];
      stars.forEach(([x,y], i) => {
        c.fillStyle = `rgba(255,255,255,${0.3 + i%4 * 0.18})`;
        c.fillRect(x, y, i%3===0?2:1, i%3===0?2:1);
      });

      // Planeta en el fondo
      const planet = c.createRadialGradient(680, 80, 10, 670, 70, 70);
      planet.addColorStop(0, "#4488ff");
      planet.addColorStop(0.6, "#2244aa");
      planet.addColorStop(1, "#001133");
      c.fillStyle = planet;
      c.beginPath(); c.arc(680, 80, 70, 0, Math.PI*2); c.fill();
      // Anillo del planeta
      c.strokeStyle = "rgba(100,150,255,0.5)"; c.lineWidth = 8;
      c.beginPath(); c.ellipse(680, 80, 100, 20, -0.3, 0, Math.PI*2); c.stroke();

      // Estructura de la estación (plataforma metálica)
      c.fillStyle = "#151528";
      c.fillRect(0, GROUND, W, H - GROUND);
      // Paneles solares
      c.fillStyle = "#001a44";
      c.fillRect(0, GROUND + 10, 120, 50);
      c.fillRect(W-120, GROUND + 10, 120, 50);
      // Cuadrícula de paneles
      c.strokeStyle = "#003388"; c.lineWidth = 1;
      for (let x = 0; x < 120; x += 20) {
        c.beginPath(); c.moveTo(x, GROUND+10); c.lineTo(x, GROUND+60); c.stroke();
        c.beginPath(); c.moveTo(W-120+x, GROUND+10); c.lineTo(W-120+x, GROUND+60); c.stroke();
      }
      // Rejilla del suelo
      c.strokeStyle = "#0a0a22"; c.lineWidth = 1;
      for (let x = 0; x < W; x += 50) {
        c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x, H); c.stroke();
      }
      // Luz de borde de la plataforma
      c.fillStyle = "rgba(0,200,255,0.15)";
      c.fillRect(0, GROUND, W, 12);

      c.fillStyle = "#00ddff"; c.fillRect(0, GROUND, W, 4);
    }
  }

];

// ============================================================
// HELPERS DE DIBUJO
// ============================================================
function _lantern(c, x, y) {
  c.fillStyle = "#3d1500"; c.fillRect(x-5, y, 10, 40);
  c.fillStyle = "rgba(255,150,0,0.8)";
  c.beginPath(); c.ellipse(x, y+10, 14, 22, 0, 0, Math.PI*2); c.fill();
  c.fillStyle = "rgba(255,200,100,0.5)";
  c.beginPath(); c.ellipse(x, y+10, 8, 14, 0, 0, Math.PI*2); c.fill();
}

function _mountain(c, x, groundY, w, h) {
  c.beginPath();
  c.moveTo(x, groundY);
  c.lineTo(x + w/2, groundY - h);
  c.lineTo(x + w, groundY);
  c.fill();
}

function _duna(c, x, groundY, w, h) {
  c.beginPath();
  c.moveTo(x, groundY);
  c.quadraticCurveTo(x + w/2, groundY - h, x + w, groundY);
  c.fill();
}

function _cactus(c, x, groundY) {
  c.fillStyle = "#2a6600";
  c.fillRect(x-6, groundY-70, 12, 70);
  c.fillRect(x-20, groundY-50, 20, 8);
  c.fillRect(x-20, groundY-65, 8, 20);
  c.fillRect(x+6, groundY-40, 20, 8);
  c.fillRect(x+18, groundY-55, 8, 20);
}

function _tree(c, x, groundY, h, color) {
  c.fillStyle = color;
  // Tronco
  c.fillRect(x+14, groundY - h * 0.35, 12, h * 0.35);
  // Copa (triángulos)
  c.beginPath();
  c.moveTo(x,    groundY - h * 0.4);
  c.lineTo(x+20, groundY - h);
  c.lineTo(x+40, groundY - h * 0.4);
  c.fill();
  c.beginPath();
  c.moveTo(x+2,  groundY - h * 0.6);
  c.lineTo(x+20, groundY - h * 1.15);
  c.lineTo(x+38, groundY - h * 0.6);
  c.fill();
}

// ============================================================
// SELECCIÓN ALEATORIA
// ============================================================
function getRandomStage() {
  return STAGES[Math.floor(Math.random() * STAGES.length)];
}

// ============================================================
// REEMPLAZAR CON IMÁGENES PROPIAS (opcional)
// ============================================================
// Si quieres usar una imagen en lugar del código:
//
//   const bgImg = new Image();
//   bgImg.src = 'assets/images/stage_dojo.jpg';
//
//   // En la función draw del escenario:
//   draw(c, W, H, GROUND) {
//     c.drawImage(bgImg, 0, 0, W, H);
//   }
//
// Resolución recomendada: 800x400 px
// ============================================================