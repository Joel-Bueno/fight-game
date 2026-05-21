// ============================================================
// bot.js — IA del bot (3 niveles de dificultad)
// ============================================================

class Bot {
  constructor(difficulty) {
    this.difficulty    = difficulty;
    this.timer         = 0;
    // Cada cuántos frames toma una decisión
    this.thinkTime     = { easy: 85, medium: 40, hard: 18 }[difficulty];
    // Probabilidad de bloquear cuando el rival está cerca
    this.blockChance   = { easy: 0.06, medium: 0.22, hard: 0.48 }[difficulty];
    // Probabilidad de usar especial
    this.specialChance = { easy: 0.05, medium: 0.18, hard: 0.32 }[difficulty];
    // Precisión de movimiento hacia el rival
    this.accuracy      = { easy: 0.38, medium: 0.70, hard: 0.96 }[difficulty];
    // Probabilidad de saltar para esquivar (solo difícil)
    this.dodgeChance   = { easy: 0.0,  medium: 0.05, hard: 0.28 }[difficulty];
    // Distancia de ataque (en píxeles)
    this.attackRange   = 95;
  }

  update(bot, player, keys) {
    this.timer++;
    if (this.timer < this.thinkTime) return;
    this.timer = 0;
    this._decide(bot, player, keys);
  }

  _decide(bot, player, keys) {
    const dist = Math.abs((bot.x + bot.w / 2) - (player.x + player.w / 2));
    const rng  = Math.random();

    // Limpiar todas las teclas del bot
    keys.ArrowLeft  = false;
    keys.ArrowRight = false;
    keys.ArrowUp    = false;
    keys.ArrowDown  = false;
    keys.k          = false;
    keys.l          = false;

    // 1. Bloquear si el rival está cerca y ataca
    if (dist < 110 && rng < this.blockChance) {
      keys.ArrowDown = true;
      return;
    }

    // 2. Esquivar saltando (dificultades altas)
    if (dist < 70 && Math.random() < this.dodgeChance && bot.onGround) {
      keys.ArrowUp = true;
      return;
    }

    // 3. Moverse hacia el rival
    if (rng < this.accuracy) {
      const cx_bot    = bot.x + bot.w / 2;
      const cx_player = player.x + player.w / 2;
      if      (cx_bot > cx_player + this.attackRange * 0.8) keys.ArrowLeft  = true;
      else if (cx_bot < cx_player - this.attackRange * 0.8) keys.ArrowRight = true;
    }

    // 4. Atacar si está en rango
    if (dist < this.attackRange) {
      if (Math.random() < this.specialChance) keys.l = true;
      else                                    keys.k = true;
    }
  }
}