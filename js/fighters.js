// ============================================================
// fighters.js v3 — 6 personajes con diseño visual en Canvas
// Cada personaje tiene: stats, colores, efectos y función draw
// ============================================================

const FIGHTERS = [

  // ──────────────────────────────────────────────
  // 0. RYU — Equilibrado
  // ──────────────────────────────────────────────
  {
    id: 0, name: "RYU", emoji: "🥋", role: "Equilibrado",
    color: "#4488ff", colorDark: "#1144aa", colorLight: "#88bbff",
    damage: 3, speed: 3, defense: 3,
    moveSpeed: 4, defMod: 1.0, knockback: 5,
    attacks: { normal: 12, special: 25 },
    specialName: "Hadoken",
    description: "Equilibrado. Bueno en todo, ideal para aprender.",
    // Dibuja el personaje en canvas (cx,cy = centro base de los pies)
    draw(c, cx, cy, facing, state) {
      const f = facing; // 1 = derecha, -1 = izquierda
      c.save(); c.translate(cx, cy);

      // Piernas
      c.fillStyle = "#223366";
      c.fillRect(-18, -45, 14, 45);
      c.fillRect(4,   -45, 14, 45);

      // Cuerpo / gi blanco
      c.fillStyle = "#ddeeff";
      c.fillRect(-22, -95, 44, 55);

      // Cinturón negro
      c.fillStyle = "#111";
      c.fillRect(-22, -52, 44, 10);

      // Brazos
      c.fillStyle = "#ddeeff";
      if (state.attacking) {
        // Brazo extendido
        c.fillRect(f > 0 ? 22 : -50, -90, 28, 12);
        // Puño
        c.fillStyle = "#ffcc99";
        c.beginPath(); c.arc(f > 0 ? 54 : -54, -84, 10, 0, Math.PI*2); c.fill();
      } else {
        c.fillRect(-32, -90, 12, 35);
        c.fillRect(20,  -90, 12, 35);
      }

      // Cabeza
      c.fillStyle = "#ffcc99";
      c.beginPath(); c.arc(0, -105, 18, 0, Math.PI*2); c.fill();

      // Pelo negro
      c.fillStyle = "#111";
      c.fillRect(-18, -124, 36, 16);
      c.beginPath(); c.arc(0, -123, 18, Math.PI, 0); c.fill();

      // Ojos
      c.fillStyle = "#111";
      c.fillRect(-8 * f - 3, -112, 5, 4);
      c.fillRect( 8 * f - 3, -112, 5, 4);  // solo se ve el que mira

      // Efecto especial: Hadoken (bola de energía)
      if (state.specialAttack) {
        const grd = c.createRadialGradient(f*70, -80, 5, f*70, -80, 28);
        grd.addColorStop(0, "#ffffff");
        grd.addColorStop(0.5, "#88aaff");
        grd.addColorStop(1, "rgba(0,80,255,0)");
        c.fillStyle = grd;
        c.beginPath(); c.arc(f*70, -80, 28, 0, Math.PI*2); c.fill();
      }

      c.restore();
    }
  },

  // ──────────────────────────────────────────────
  // 1. TANK — Tanque
  // ──────────────────────────────────────────────
  {
    id: 1, name: "TANK", emoji: "🛡️", role: "Tanque",
    color: "#888888", colorDark: "#444444", colorLight: "#cccccc",
    damage: 1, speed: 1, defense: 5,
    moveSpeed: 2, defMod: 0.45, knockback: 2,
    attacks: { normal: 7, special: 18 },
    specialName: "Escudo Absoluto",
    description: "Casi indestructible. Su bloqueo absorbe casi todo el daño.",
    draw(c, cx, cy, facing, state) {
      const f = facing;
      c.save(); c.translate(cx, cy);

      // Piernas gruesas con armadura
      c.fillStyle = "#555";
      c.fillRect(-22, -50, 18, 50);
      c.fillRect(4,   -50, 18, 50);
      // Rodilleras
      c.fillStyle = "#888";
      c.fillRect(-24, -28, 20, 14);
      c.fillRect(4,   -28, 20, 14);

      // Cuerpo armadura
      c.fillStyle = "#777";
      c.fillRect(-28, -100, 56, 55);
      // Detalle pecho
      c.fillStyle = "#999";
      c.fillRect(-20, -95, 40, 20);
      c.fillStyle = "#aaa";
      c.fillRect(-14, -92, 28, 12);

      // Hombreras
      c.fillStyle = "#666";
      c.beginPath(); c.arc(-28, -97, 16, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc( 28, -97, 16, 0, Math.PI*2); c.fill();

      // Brazos
      c.fillStyle = "#777";
      if (state.attacking) {
        c.fillRect(f > 0 ? 28 : -64, -98, 36, 18);
      } else {
        c.fillRect(-42, -98, 16, 42);
        c.fillRect(26,  -98, 16, 42);
      }

      // Escudo (lado izquierdo si mira derecha)
      if (state.blocking || !state.attacking) {
        c.fillStyle = "#cc4400";
        c.fillRect(f > 0 ? -54 : 26, -106, 22, 70);
        c.fillStyle = "#ff6600";
        c.fillRect(f > 0 ? -50 : 30, -100, 14, 56);
        // Cruz del escudo
        c.fillStyle = "#ffaa00";
        c.fillRect(f > 0 ? -44 : 34, -88, 2, 30);
        c.fillRect(f > 0 ? -50 : 30, -76, 14, 4);
      }

      // Cabeza / casco
      c.fillStyle = "#666";
      c.beginPath(); c.arc(0, -112, 22, 0, Math.PI*2); c.fill();
      c.fillStyle = "#888";
      c.fillRect(-22, -120, 44, 14);
      // Visera
      c.fillStyle = "#ff8800";
      c.fillRect(-14, -116, 28, 8);

      // Efecto especial: aura de escudo
      if (state.specialAttack) {
        c.strokeStyle = "#ffcc00";
        c.lineWidth = 6;
        c.globalAlpha = 0.7;
        c.beginPath(); c.arc(0, -60, 55, 0, Math.PI*2); c.stroke();
        c.globalAlpha = 0.3;
        c.fillStyle = "#ffcc00";
        c.beginPath(); c.arc(0, -60, 55, 0, Math.PI*2); c.fill();
        c.globalAlpha = 1;
      }

      c.restore();
    }
  },

  // ──────────────────────────────────────────────
  // 2. STRIKER — Destructor
  // ──────────────────────────────────────────────
  {
    id: 2, name: "STRIKER", emoji: "👊", role: "Destructor",
    color: "#ff4400", colorDark: "#aa1100", colorLight: "#ff8855",
    damage: 5, speed: 1, defense: 2,
    moveSpeed: 2.5, defMod: 1.35, knockback: 9,
    attacks: { normal: 24, special: 50 },
    specialName: "Uppercut",
    description: "El más poderoso. Un golpe puede cambiar la pelea.",
    draw(c, cx, cy, facing, state) {
      const f = facing;
      c.save(); c.translate(cx, cy);

      // Piernas
      c.fillStyle = "#221100";
      c.fillRect(-20, -50, 16, 50);
      c.fillRect(4,   -50, 16, 50);
      // Botas
      c.fillStyle = "#330000";
      c.fillRect(-22, -18, 18, 18);
      c.fillRect(4,   -18, 18, 18);

      // Cuerpo musculoso
      c.fillStyle = "#cc2200";
      c.fillRect(-28, -105, 56, 60);
      // Músculos del torso
      c.fillStyle = "#ee3300";
      c.beginPath(); c.arc(-12, -85, 14, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc( 12, -85, 14, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(-12, -65, 12, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc( 12, -65, 12, 0, Math.PI*2); c.fill();

      // Brazos musculosos
      c.fillStyle = "#cc2200";
      if (state.attacking) {
        // Uppercut: brazo hacia arriba
        c.fillRect(f > 0 ? 24 : -52, -150, 18, 70);
        c.fillStyle = "#ffaa00";
        c.beginPath(); c.arc(f > 0 ? 33 : -43, -155, 14, 0, Math.PI*2); c.fill();
      } else {
        c.fillRect(-44, -105, 18, 50);
        c.fillRect(26,  -105, 18, 50);
      }

      // Cabeza
      c.fillStyle = "#ffcc99";
      c.beginPath(); c.arc(0, -116, 20, 0, Math.PI*2); c.fill();
      // Cicatriz
      c.strokeStyle = "#cc6644"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(f > 0 ? 4 : -8, -122); c.lineTo(f > 0 ? 10 : -2, -110); c.stroke();
      // Pelo corto
      c.fillStyle = "#111";
      c.fillRect(-18, -136, 36, 18);

      // Efecto especial: llamarada del uppercut
      if (state.specialAttack) {
        c.fillStyle = "rgba(255,100,0,0.85)";
        c.beginPath();
        c.moveTo(f > 0 ? 30 : -30, -130);
        c.lineTo(f > 0 ? 70 : -70, -200);
        c.lineTo(f > 0 ? 10 : -10, -210);
        c.lineTo(f > 0 ? -10 : 10, -140);
        c.fill();
        c.fillStyle = "rgba(255,220,0,0.6)";
        c.beginPath(); c.arc(f > 0 ? 45 : -45, -170, 28, 0, Math.PI*2); c.fill();
      }

      c.restore();
    }
  },

  // ──────────────────────────────────────────────
  // 3. SPEEDY — Velocista
  // ──────────────────────────────────────────────
  {
    id: 3, name: "SPEEDY", emoji: "⚡", role: "Velocista",
    color: "#ffee00", colorDark: "#aa9900", colorLight: "#ffff88",
    damage: 2, speed: 5, defense: 2,
    moveSpeed: 7.5, defMod: 1.2, knockback: 4,
    attacks: { normal: 8, special: 16 },
    specialName: "Dash Kick",
    description: "El más rápido del juego. Golpea y escapa.",
    draw(c, cx, cy, facing, state) {
      const f = facing;
      c.save(); c.translate(cx, cy);

      // Piernas delgadas
      c.fillStyle = "#336600";
      c.fillRect(-14, -50, 10, 50);
      c.fillRect(4,   -50, 10, 50);
      // Zapatillas
      c.fillStyle = "#ffee00";
      c.fillRect(-16, -14, 12, 14);
      c.fillRect(4,   -14, 12, 14);

      // Cuerpo delgado
      c.fillStyle = "#ffcc00";
      c.fillRect(-18, -100, 36, 55);
      // Raya lateral (estilo corredor)
      c.fillStyle = "#ff8800";
      c.fillRect(f > 0 ? 10 : -16, -98, 6, 50);

      // Brazos
      c.fillStyle = "#ffcc00";
      if (state.attacking) {
        // Patada lateral
        c.fillStyle = "#336600";
        c.fillRect(f > 0 ? 18 : -60, -70, 42, 12);
        c.fillStyle = "#ffee00";
        c.beginPath(); c.arc(f > 0 ? 64 : -64, -64, 10, 0, Math.PI*2); c.fill();
      } else {
        c.fillRect(-28, -98, 11, 35);
        c.fillRect(17,  -98, 11, 35);
      }

      // Cabeza
      c.fillStyle = "#ffcc99";
      c.beginPath(); c.arc(0, -110, 16, 0, Math.PI*2); c.fill();
      // Pelo rubio/rayos
      c.fillStyle = "#ffee00";
      c.fillRect(-16, -128, 32, 16);
      // Rayos del pelo
      c.beginPath();
      c.moveTo(-8, -128); c.lineTo(-14, -142); c.lineTo(-4, -130);
      c.moveTo( 0, -128); c.lineTo(  0, -144); c.lineTo( 5, -130);
      c.moveTo( 8, -128); c.lineTo( 14, -142); c.lineTo( 4, -130);
      c.fillStyle = "#ffee00"; c.fill();

      // Estela de velocidad
      if (state.vx && Math.abs(state.vx) > 3) {
        c.globalAlpha = 0.3;
        c.fillStyle = "#ffee00";
        for (let i = 1; i <= 3; i++) {
          c.fillRect(-18 - (f * i * 12), -100, 36, 55);
        }
        c.globalAlpha = 1;
      }

      // Efecto especial: rayo
      if (state.specialAttack) {
        c.strokeStyle = "#ffffff"; c.lineWidth = 4;
        c.beginPath();
        c.moveTo(0, -80);
        c.lineTo(f*30, -90); c.lineTo(f*50, -70); c.lineTo(f*80, -85);
        c.stroke();
        c.fillStyle = "rgba(255,240,0,0.7)";
        c.beginPath(); c.arc(f*80, -85, 18, 0, Math.PI*2); c.fill();
      }

      c.restore();
    }
  },

  // ──────────────────────────────────────────────
  // 4. COMBO — Comboísta
  // ──────────────────────────────────────────────
  {
    id: 4, name: "COMBO", emoji: "🌀", role: "Comboísta",
    color: "#cc00ff", colorDark: "#660088", colorLight: "#ee88ff",
    damage: 4, speed: 3, defense: 1,
    moveSpeed: 4.5, defMod: 1.45, knockback: 3,
    attacks: { normal: 11, special: 22 },
    specialName: "Tornado",
    description: "Combos devastadores. Extremadamente frágil.",
    draw(c, cx, cy, facing, state) {
      const f = facing;
      c.save(); c.translate(cx, cy);

      // Piernas con pantalón oscuro
      c.fillStyle = "#1a0033";
      c.fillRect(-16, -50, 12, 50);
      c.fillRect(4,   -50, 12, 50);

      // Cuerpo — traje morado
      c.fillStyle = "#9900cc";
      c.fillRect(-22, -100, 44, 55);
      // Detalle energía en el pecho
      const grdPecho = c.createRadialGradient(0, -75, 2, 0, -75, 16);
      grdPecho.addColorStop(0, "#ffffff");
      grdPecho.addColorStop(1, "rgba(200,0,255,0)");
      c.fillStyle = grdPecho;
      c.beginPath(); c.arc(0, -75, 16, 0, Math.PI*2); c.fill();

      // Brazos
      c.fillStyle = "#9900cc";
      if (state.attacking) {
        // Combo: dos puños
        c.fillRect(f > 0 ? 22 : -52, -96, 30, 12);
        c.fillRect(f > 0 ? 22 : -52, -76, 30, 12);
        c.fillStyle = "#ee88ff";
        c.beginPath(); c.arc(f > 0 ? 56 : -56, -90, 10, 0, Math.PI*2); c.fill();
        c.beginPath(); c.arc(f > 0 ? 56 : -56, -70, 10, 0, Math.PI*2); c.fill();
      } else {
        c.fillRect(-34, -100, 14, 38);
        c.fillRect(20,  -100, 14, 38);
      }

      // Cabeza
      c.fillStyle = "#ffcc99";
      c.beginPath(); c.arc(0, -112, 17, 0, Math.PI*2); c.fill();
      // Pelo morado estilo manga
      c.fillStyle = "#6600aa";
      c.beginPath(); c.arc(0, -120, 17, Math.PI, 0); c.fill();
      c.fillRect(-17, -128, 34, 10);
      // Flequillo
      c.fillRect(-20, -126, 8, 16);
      c.fillRect( 12, -126, 8, 16);

      // Efecto especial: tornado
      if (state.specialAttack) {
        for (let i = 0; i < 3; i++) {
          c.strokeStyle = `rgba(200,0,255,${0.8 - i * 0.25})`;
          c.lineWidth = 4 - i;
          c.beginPath();
          c.ellipse(f*30, -70 - i*25, 30 + i*15, 15 + i*8, 0, 0, Math.PI*2);
          c.stroke();
        }
        c.fillStyle = "rgba(220,0,255,0.4)";
        c.beginPath(); c.arc(f*30, -70, 35, 0, Math.PI*2); c.fill();
      }

      c.restore();
    }
  },

  // ──────────────────────────────────────────────
  // 5. GUARDIAN — Contraataque
  // ──────────────────────────────────────────────
  {
    id: 5, name: "GUARDIAN", emoji: "🗿", role: "Contraataque",
    color: "#00cc88", colorDark: "#006644", colorLight: "#66ffcc",
    damage: 2, speed: 2, defense: 4,
    moveSpeed: 3, defMod: 0.7, knockback: 6,
    attacks: { normal: 10, special: 34 },
    specialName: "Contraataque",
    description: "El especial más poderoso. Bloquea y castiga.",
    draw(c, cx, cy, facing, state) {
      const f = facing;
      c.save(); c.translate(cx, cy);

      // Piernas — hakama japonés
      c.fillStyle = "#004433";
      c.fillRect(-22, -55, 48, 55);
      // Pliegues del hakama
      c.fillStyle = "#006655";
      c.fillRect(-16, -50, 4, 50);
      c.fillRect( -6, -50, 4, 50);
      c.fillRect(  4, -50, 4, 50);
      c.fillRect( 14, -50, 4, 50);

      // Cuerpo — kimono verde oscuro
      c.fillStyle = "#005533";
      c.fillRect(-24, -100, 48, 50);
      // Solapa del kimono
      c.fillStyle = "#007755";
      c.beginPath();
      c.moveTo(-24, -100); c.lineTo(0, -70); c.lineTo(-24, -50); c.fill();
      c.beginPath();
      c.moveTo( 24, -100); c.lineTo(0, -70); c.lineTo( 24, -50); c.fill();

      // Brazos
      c.fillStyle = "#005533";
      if (state.attacking) {
        // Golpe de palma
        c.fillRect(f > 0 ? 24 : -58, -98, 34, 16);
        c.fillStyle = "#00ffaa";
        c.globalAlpha = 0.7;
        c.beginPath(); c.arc(f > 0 ? 62 : -62, -90, 18, 0, Math.PI*2); c.fill();
        c.globalAlpha = 1;
      } else {
        c.fillRect(-36, -98, 14, 40);
        c.fillRect(22,  -98, 14, 40);
      }

      // Cabeza — asiática, seria
      c.fillStyle = "#cc9966";
      c.beginPath(); c.arc(0, -112, 18, 0, Math.PI*2); c.fill();
      // Cabello blanco/gris (maestro anciano)
      c.fillStyle = "#cccccc";
      c.beginPath(); c.arc(0, -120, 18, Math.PI, 0); c.fill();
      // Barba larga
      c.fillStyle = "#cccccc";
      c.beginPath();
      c.moveTo(-10, -100);
      c.quadraticCurveTo(0, -72, 10, -100);
      c.fill();
      // Ojos cerrados / concentrado
      c.fillStyle = "#664422";
      c.fillRect(-10, -116, 8, 3);
      c.fillRect(  2, -116, 8, 3);

      // Efecto especial: contraataque — onda de energía verde
      if (state.specialAttack) {
        for (let r = 20; r <= 70; r += 18) {
          c.strokeStyle = `rgba(0,255,150,${1 - r/80})`;
          c.lineWidth = 5;
          c.beginPath(); c.arc(f*40, -75, r, 0, Math.PI*2); c.stroke();
        }
        c.fillStyle = "rgba(0,255,100,0.3)";
        c.beginPath(); c.arc(f*40, -75, 50, 0, Math.PI*2); c.fill();
      }

      c.restore();
    }
  }

];