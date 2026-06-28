"use strict";

// ============================================================
// AMESEA utilities
// ============================================================
const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (array) => array[(Math.random() * array.length) | 0];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// ============================================================
// InputManager
// ============================================================
class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: innerWidth * 0.65, y: innerHeight * 0.5, down: false };

    addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (!this.keys.has(key)) this.pressed.add(key);
      this.keys.add(key);
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(key)) {
        event.preventDefault();
      }
    });
    addEventListener("keyup", (event) => this.keys.delete(event.key.toLowerCase()));
    canvas.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = event.clientX - rect.left;
      this.mouse.y = event.clientY - rect.top;
    });
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button === 0) this.mouse.down = true;
    });
    addEventListener("pointerup", (event) => {
      if (event.button === 0) this.mouse.down = false;
    });
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    addEventListener("blur", () => {
      this.keys.clear();
      this.mouse.down = false;
    });
  }

  isDown(...keys) {
    return keys.some((key) => this.keys.has(key));
  }

  consume(key) {
    key = key.toLowerCase();
    const has = this.pressed.has(key);
    this.pressed.delete(key);
    return has;
  }

  endFrame() {
    this.pressed.clear();
  }
}

// ============================================================
// Particle
// ============================================================
class Particle {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = options.vx ?? rand(-80, 80);
    this.vy = options.vy ?? rand(-80, 80);
    this.life = options.life ?? rand(0.35, 0.8);
    this.maxLife = this.life;
    this.size = options.size ?? rand(2, 5);
    this.color = options.color ?? "#44f6ff";
    this.drag = options.drag ?? 2.5;
    this.glow = options.glow ?? 12;
    this.ring = options.ring ?? false;
  }

  update(dt) {
    this.life -= dt;
    const drag = Math.exp(-this.drag * dt);
    this.vx *= drag;
    this.vy *= drag;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    const alpha = clamp(this.life / this.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.glow;
    if (this.ring) {
      const radius = this.size * (1 + (1 - alpha) * 4);
      ctx.lineWidth = Math.max(1, alpha * 3);
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, TAU);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (0.5 + alpha * 0.5), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ============================================================
// Projectile
// ============================================================
class Projectile {
  constructor(x, y, angle, player) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * player.projectileSpeed;
    this.vy = Math.sin(angle) * player.projectileSpeed;
    this.radius = player.burstActive ? 7 : 5;
    this.damage = player.attackDamage * (player.neonActive ? 1.55 : 1) * (player.burstActive ? 1.75 : 1);
    this.life = player.projectileRange / player.projectileSpeed;
    this.dead = false;
    this.pierce = player.burstActive ? 1 : 0;
    this.color = player.burstActive ? "#ff55d5" : "#55f7ff";
    this.hit = new Set();
  }

  update(dt, game) {
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    for (const enemy of game.enemies) {
      if (enemy.dead || this.hit.has(enemy)) continue;
      if (Math.hypot(this.x - enemy.x, this.y - enemy.y) < this.radius + enemy.radius) {
        this.hit.add(enemy);
        enemy.takeDamage(this.damage, game);
        game.spark(this.x, this.y, this.color, 5);
        if (this.pierce > 0) this.pierce -= 1;
        else {
          this.dead = true;
          break;
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = "#eaffff";
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 18;
    ctx.lineWidth = this.radius * 1.1;
    ctx.beginPath();
    ctx.moveTo(this.x - this.vx * 0.018, this.y - this.vy * 0.018);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.65, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================
// Item
// ============================================================
class Item {
  constructor(x, y, type = "xp", value = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.value = value;
    this.radius = type === "memory" ? 11 : type === "dream" ? 8 : 5;
    this.life = 22;
    this.phase = rand(0, TAU);
    this.dead = false;
  }

  update(dt, game) {
    this.life -= dt;
    this.phase += dt * 3;
    if (this.life <= 0) this.dead = true;

    const player = game.player;
    const d = distance(this, player);
    const magnet = player.magnetRange * (player.neonActive ? 2.35 : 1) * (player.burstActive ? 1.25 : 1);
    if (d < magnet && d > 1) {
      const speed = lerp(80, 620, 1 - d / magnet);
      this.x += (player.x - this.x) / d * speed * dt;
      this.y += (player.y - this.y) / d * speed * dt;
    }

    if (d < this.radius + player.radius + 5) this.collect(game);
  }

  collect(game) {
    if (this.dead) return;
    this.dead = true;
    const player = game.player;
    if (this.type === "xp") {
      game.addXp(this.value);
    } else if (this.type === "dream") {
      game.dreams += this.value;
      game.showMessage("夢の欠片 +1", "#d66cff");
    } else {
      const heal = Math.min(34, player.maxHp - player.hp);
      player.hp += heal;
      game.showQuote(pick([
        "家族の声が聞こえた。まだ沈むな。",
        "優しさが、深海の底で光った。",
        "夢は沈まない。ユウタがそう決めた。"
      ]));
    }
    game.spark(this.x, this.y, this.type === "xp" ? "#42f5ff" : this.type === "dream" ? "#cf55ff" : "#ffefad", 9);
  }

  draw(ctx, visibility) {
    const bob = Math.sin(this.phase) * 3;
    const color = this.type === "xp" ? "#4cf8ff" : this.type === "dream" ? "#c050ff" : "#fff2a4";
    ctx.save();
    ctx.globalAlpha = visibility;
    ctx.translate(this.x, this.y + bob);
    ctx.rotate(this.phase * 0.35);
    ctx.fillStyle = color;
    ctx.strokeStyle = "#ffffff";
    ctx.shadowColor = color;
    ctx.shadowBlur = this.type === "memory" ? 26 : 15;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (this.type === "memory") {
      ctx.moveTo(0, 11);
      ctx.bezierCurveTo(-17, 1, -10, -10, 0, -4);
      ctx.bezierCurveTo(10, -10, 17, 1, 0, 11);
    } else {
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius * 0.8, 0);
      ctx.lineTo(0, this.radius);
      ctx.lineTo(-this.radius * 0.8, 0);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// ============================================================
// Enemy
// ============================================================
const ENEMY_DATA = {
  fish: { name: "ネガフィッシュ", hp: 28, speed: 76, damage: 12, radius: 17, color: "#317dff", xp: 1 },
  jelly: { name: "承認欲求クラゲ", hp: 45, speed: 55, damage: 15, radius: 21, color: "#ff4fd1", xp: 3 },
  blob: { name: "夢喰いニュウドウ", hp: 92, speed: 67, damage: 19, radius: 27, color: "#a055ff", xp: 5 }
};

class Enemy {
  constructor(x, y, type, difficulty, elite = false) {
    const data = ENEMY_DATA[type];
    this.x = x;
    this.y = y;
    this.type = type;
    this.elite = elite;
    this.radius = data.radius * (elite ? 1.18 : 1);
    this.maxHp = data.hp * difficulty * (elite ? 1.7 : 1);
    this.hp = this.maxHp;
    this.speed = data.speed * (1 + (difficulty - 1) * 0.22) * (elite ? 1.12 : 1);
    this.damage = data.damage * Math.sqrt(difficulty) * (elite ? 1.35 : 1);
    this.color = elite ? "#ffce54" : data.color;
    this.xp = data.xp + (elite ? 3 : 0);
    this.phase = rand(0, TAU);
    this.hitFlash = 0;
    this.attackCooldown = rand(0, 0.5);
    this.wanderAngle = rand(0, TAU);
    this.dead = false;
  }

  update(dt, game) {
    const player = game.player;
    this.phase += dt * (this.type === "jelly" ? 5 : 2);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.attackCooldown -= dt;

    let dx = player.x - this.x;
    let dy = player.y - this.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const light = player.lightLevel;
    const awareness = 170 + light * 560 + (player.burstActive ? 330 : 0);
    let moveX;
    let moveY;
    let speed = this.speed;

    if (d < awareness) {
      moveX = dx / d;
      moveY = dy / d;
      if (this.type === "jelly") {
        speed *= 0.75 + light * 1.45;
        moveX += Math.cos(this.phase * 1.7) * 0.18;
        moveY += Math.sin(this.phase * 1.7) * 0.18;
      } else if (this.type === "blob") {
        const preferred = 230 + Math.sin(this.phase) * 85;
        const direction = d < preferred ? -1 : 1;
        moveX = dx / d * direction + Math.cos(this.phase * 1.2) * 0.58;
        moveY = dy / d * direction + Math.sin(this.phase * 1.2) * 0.58;
      }
    } else {
      this.wanderAngle += rand(-0.7, 0.7) * dt;
      moveX = Math.cos(this.wanderAngle);
      moveY = Math.sin(this.wanderAngle);
      speed *= 0.24;
    }

    const len = Math.max(1, Math.hypot(moveX, moveY));
    this.x += moveX / len * speed * dt;
    this.y += moveY / len * speed * dt;

    if (d < this.radius + player.radius && this.attackCooldown <= 0) {
      this.attackCooldown = 0.72;
      player.takeDamage(this.damage, game);
    }
  }

  takeDamage(amount, game) {
    this.hp -= amount;
    this.hitFlash = 0.09;
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      game.onEnemyKilled(this);
    }
  }

  draw(ctx, visibility) {
    ctx.save();
    ctx.globalAlpha = clamp(visibility + (this.hitFlash > 0 ? 0.35 : 0), 0, 1);
    ctx.translate(this.x, this.y);
    const pulse = 1 + Math.sin(this.phase * 2) * 0.045;
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = this.hitFlash > 0 ? "#fff" : this.color;
    ctx.fillStyle = this.hitFlash > 0 ? "#dfffff" : `${this.color}38`;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.elite ? 27 : 13;
    ctx.lineWidth = this.elite ? 3 : 2;

    if (this.type === "fish") {
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius, this.radius * .62, 0, 0, TAU);
      ctx.moveTo(-this.radius * .75, 0);
      ctx.lineTo(-this.radius * 1.45, -this.radius * .65);
      ctx.lineTo(-this.radius * 1.3, this.radius * .65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ff63d7";
      ctx.beginPath();
      ctx.arc(this.radius * .42, -3, 2.8, 0, TAU);
      ctx.fill();
    } else if (this.type === "jelly") {
      ctx.beginPath();
      ctx.arc(0, -4, this.radius, Math.PI, 0);
      ctx.quadraticCurveTo(this.radius * .65, this.radius * .7, this.radius * .35, this.radius * .32);
      ctx.quadraticCurveTo(0, this.radius, -this.radius * .35, this.radius * .32);
      ctx.quadraticCurveTo(-this.radius * .7, this.radius * .7, -this.radius, -4);
      ctx.fill();
      ctx.stroke();
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * this.radius * .42, this.radius * .3);
        ctx.quadraticCurveTo(i * this.radius * .65 + Math.sin(this.phase + i) * 7, this.radius, i * this.radius * .3, this.radius * 1.35);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const a = i / 16 * TAU;
        const r = this.radius * (1 + Math.sin(a * 5 + this.phase) * .1);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r * .82;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#55ecff";
      ctx.beginPath();
      ctx.arc(-8, -4, 3, 0, TAU);
      ctx.arc(8, -4, 3, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#ff64c8";
      ctx.beginPath();
      ctx.arc(0, 7, 9, .15, Math.PI - .15);
      ctx.stroke();
    }

    if (this.hp < this.maxHp) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(0,0,0,.65)";
      ctx.fillRect(-this.radius, -this.radius - 12, this.radius * 2, 3);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.radius, -this.radius - 12, this.radius * 2 * clamp(this.hp / this.maxHp, 0, 1), 3);
    }
    ctx.restore();
  }
}

// ============================================================
// Player
// ============================================================
class Player {
  constructor(game) {
    this.x = game.width / 2;
    this.y = game.height / 2;
    this.radius = 20;
    this.maxHp = 100;
    this.hp = 100;
    this.moveSpeed = 230;
    this.attackDamage = 22;
    this.attackRate = 3.4;
    this.projectileSpeed = 720;
    this.projectileRange = 680;
    this.projectileCount = 1;
    this.attackTimer = 0;
    this.dashCooldownMax = 2.1;
    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.dashDx = 1;
    this.dashDy = 0;
    this.invulnerable = 0;
    this.neonActive = false;
    this.neonDuration = 4.2;
    this.neonTimer = 0;
    this.neonCooldownMax = 9.5;
    this.neonCooldown = 0;
    this.neonPower = 1;
    this.afterglow = 0;
    this.magnetRange = 100;
    this.burst = 0;
    this.burstGain = 1;
    this.burstActive = false;
    this.burstTimer = 0;
    this.level = 1;
    this.xp = 0;
    this.xpNeeded = 8;
    this.aimAngle = 0;
    this.anim = 0;
    this.neonKillChain = 0;
    this.neonChainTimer = 0;
  }

  get lightLevel() {
    if (this.burstActive) return 1;
    if (this.neonActive) return clamp(.8 + this.neonPower * .12, 0, 1);
    if (this.afterglow > 0) return .14;
    return clamp(.26 + (this.neonPower - 1) * .08, .2, .52);
  }

  update(dt, game) {
    const input = game.input;
    this.anim += dt;
    this.attackTimer -= dt;
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.neonCooldown = Math.max(0, this.neonCooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.afterglow = Math.max(0, this.afterglow - dt);
    this.neonChainTimer -= dt;
    if (this.neonChainTimer <= 0) this.neonKillChain = 0;

    this.aimAngle = Math.atan2(input.mouse.y - this.y, input.mouse.x - this.x);

    let mx = (input.isDown("d", "arrowright") ? 1 : 0) - (input.isDown("a", "arrowleft") ? 1 : 0);
    let my = (input.isDown("s", "arrowdown") ? 1 : 0) - (input.isDown("w", "arrowup") ? 1 : 0);
    const moveLength = Math.hypot(mx, my);
    if (moveLength) {
      mx /= moveLength;
      my /= moveLength;
    }

    if (input.consume("shift") && this.dashCooldown <= 0) this.startDash(mx, my, game);
    if (input.consume("e") && this.neonCooldown <= 0 && !this.neonActive) this.startNeon(game);
    if (input.consume("q") && this.burst >= 100 && !this.burstActive) this.startBurst(game);

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.x += this.dashDx * 820 * dt;
      this.y += this.dashDy * 820 * dt;
      if (Math.random() < .8) {
        game.particles.push(new Particle(this.x, this.y, {
          vx: rand(-25, 25), vy: rand(-25, 25), life: .35, size: rand(8, 14),
          color: "#55eaff", glow: 22, ring: true
        }));
      }
    } else {
      const speed = this.moveSpeed * (this.burstActive ? 1.38 : 1);
      this.x += mx * speed * dt;
      this.y += my * speed * dt;
    }
    this.x = clamp(this.x, this.radius + 8, game.width - this.radius - 8);
    this.y = clamp(this.y, this.radius + 8, game.height - this.radius - 8);

    if ((input.mouse.down || input.isDown(" ")) && this.attackTimer <= 0) this.shoot(game);

    if (this.neonActive) {
      this.neonTimer -= dt;
      if (this.neonTimer <= 0) this.neonActive = false;
    }
    if (this.burstActive) {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0) {
        this.burstActive = false;
        this.afterglow = 3.2;
        game.showMessage("眩しすぎた。少し休む。", "#8aa5d9");
      }
    }
  }

  startDash(mx, my, game) {
    if (!mx && !my) {
      mx = Math.cos(this.aimAngle);
      my = Math.sin(this.aimAngle);
    }
    this.dashDx = mx;
    this.dashDy = my;
    this.dashTimer = .19;
    this.invulnerable = .28;
    this.dashCooldown = this.dashCooldownMax;
    let closeCall = false;
    for (const enemy of game.enemies) {
      if (distance(this, enemy) < enemy.radius + 76) closeCall = true;
    }
    if (closeCall) {
      this.addBurst(9);
      game.showMessage("ギリギリ？ 予定通り。", "#65ecff");
    }
  }

  startNeon(game) {
    this.neonActive = true;
    this.neonTimer = this.neonDuration;
    this.neonCooldown = this.neonCooldownMax;
    this.neonKillChain = 0;
    this.neonChainTimer = this.neonDuration;
    game.showMessage("ポジティブ・ネオン！", "#55f8ff");
    game.shake = 6;
    for (const enemy of game.enemies) {
      const d = distance(this, enemy);
      if (d < 250) {
        const nx = (enemy.x - this.x) / Math.max(d, 1);
        const ny = (enemy.y - this.y) / Math.max(d, 1);
        enemy.x += nx * 28;
        enemy.y += ny * 28;
        enemy.attackCooldown = Math.max(enemy.attackCooldown, .65);
      }
    }
    game.ring(this.x, this.y, "#4cffff", 28);
  }

  startBurst(game) {
    this.burst = 0;
    this.burstActive = true;
    this.burstTimer = 6;
    this.invulnerable = .7;
    game.shake = 18;
    game.flash = .65;
    game.showMessage("自意識、限界突破。", "#ff5bd4");
    for (const enemy of game.enemies) {
      const d = distance(this, enemy);
      if (d < 340) {
        const force = 185 * (1 - d / 500);
        enemy.x += (enemy.x - this.x) / Math.max(1, d) * force;
        enemy.y += (enemy.y - this.y) / Math.max(1, d) * force;
        enemy.takeDamage(this.attackDamage * 1.25, game);
      }
    }
    for (let i = 0; i < 4; i++) game.ring(this.x, this.y, i % 2 ? "#ff49c8" : "#52efff", 35 + i * 9);
  }

  shoot(game) {
    this.attackTimer = 1 / (this.attackRate * (this.burstActive ? 1.35 : 1));
    const spread = .16;
    for (let i = 0; i < this.projectileCount; i++) {
      const offset = (i - (this.projectileCount - 1) / 2) * spread;
      const angle = this.aimAngle + offset;
      game.projectiles.push(new Projectile(
        this.x + Math.cos(angle) * 23,
        this.y + Math.sin(angle) * 23,
        angle,
        this
      ));
    }
    game.particles.push(new Particle(
      this.x + Math.cos(this.aimAngle) * 24,
      this.y + Math.sin(this.aimAngle) * 24,
      { vx: Math.cos(this.aimAngle) * 80, vy: Math.sin(this.aimAngle) * 80, life: .18, size: 8, color: "#8ffcff" }
    ));
  }

  takeDamage(amount, game) {
    if (this.invulnerable > 0 || this.dashTimer > 0) return;
    const reduction = this.burstActive ? .48 : 1;
    this.hp -= amount * reduction;
    this.invulnerable = .55;
    game.shake = Math.min(16, 7 + amount * .25);
    game.flash = .18;
    game.spark(this.x, this.y, "#ff3f84", 12);
    if (this.hp <= 0) game.gameOver();
  }

  addBurst(amount) {
    this.burst = clamp(this.burst + amount * this.burstGain, 0, 100);
  }

  draw(ctx) {
    const light = this.burstActive ? "#ff54cd" : "#4df5ff";
    const pulse = 1 + Math.sin(this.anim * 4) * .035;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.sin(this.anim * 1.5) * .025);
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = this.invulnerable > 0 && Math.sin(this.anim * 35) > 0 ? .45 : 1;

    ctx.shadowColor = light;
    ctx.shadowBlur = this.neonActive || this.burstActive ? 40 : 18;
    ctx.fillStyle = "rgba(13, 35, 65, .94)";
    ctx.strokeStyle = light;
    ctx.lineWidth = this.burstActive ? 4 : 2.5;

    // Round blobfish silhouette.
    ctx.beginPath();
    ctx.moveTo(-20, -8);
    ctx.bezierCurveTo(-15, -30, 15, -31, 23, -8);
    ctx.bezierCurveTo(33, 7, 17, 23, 0, 22);
    ctx.bezierCurveTo(-19, 25, -33, 7, -20, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // A suspiciously handsome quiff and eyebrows.
    ctx.strokeStyle = this.burstActive ? "#fff19b" : "#ac68ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-14, -20);
    ctx.quadraticCurveTo(0, -36, 17, -21);
    ctx.stroke();
    ctx.strokeStyle = "#dbfaff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-13, -7);
    ctx.lineTo(-4, -9);
    ctx.moveTo(4, -9);
    ctx.lineTo(14, -7);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-8, -3, 2.2, 0, TAU);
    ctx.arc(8, -3, 2.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#ff70d6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 7, 10, .2, Math.PI - .2);
    ctx.stroke();

    // Aim accent.
    ctx.rotate(this.aimAngle);
    ctx.strokeStyle = "#ffffff";
    ctx.globalAlpha *= .75;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(31, 0);
    ctx.stroke();
    ctx.restore();
  }
}

// ============================================================
// UpgradeSystem
// ============================================================
class UpgradeSystem {
  constructor(game) {
    this.game = game;
    this.screen = document.querySelector("#upgrade-screen");
    this.container = document.querySelector("#upgrade-options");
    this.pool = [
      { icon: "◆", name: "俺の輝き、増量", desc: "攻撃力 +25%", apply: p => p.attackDamage *= 1.25 },
      { icon: "»", name: "口より弾が速い", desc: "攻撃速度 +22%", apply: p => p.attackRate *= 1.22 },
      { icon: "➤", name: "海より速い男", desc: "移動速度 +12%", apply: p => p.moveSpeed *= 1.12 },
      { icon: "♥", name: "家族級の生命力", desc: "最大HP +25、HPを25回復", apply: p => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
      { icon: "☼", name: "ネオン過剰供給", desc: "通常光量とネオン範囲アップ", apply: p => p.neonPower += .32 },
      { icon: "∞", name: "ポジティブ長持ち", desc: "ネオン持続時間 +1.2秒", apply: p => p.neonDuration += 1.2 },
      { icon: "✦", name: "一発では足りない", desc: "発射する弾 +1", apply: p => p.projectileCount = Math.min(5, p.projectileCount + 1) },
      { icon: "↯", name: "逃げ足も才能", desc: "ダッシュクールダウン -18%", apply: p => p.dashCooldownMax *= .82 },
      { icon: "100", name: "自意識、急速充電", desc: "バースト獲得量 +28%", apply: p => p.burstGain *= 1.28 },
      { icon: "◎", name: "全部、俺のもの", desc: "アイテム吸引範囲 +45", apply: p => p.magnetRange += 45 },
      { icon: "➹", name: "ネオン超特急", desc: "弾速 +20%、射程 +12%", apply: p => { p.projectileSpeed *= 1.2; p.projectileRange *= 1.12; } },
      { icon: "E", name: "再点灯が早すぎる", desc: "ネオンのクールダウン -16%", apply: p => p.neonCooldownMax *= .84 }
    ];
  }

  show() {
    this.game.state = "levelup";
    const choices = [...this.pool].sort(() => Math.random() - .5).slice(0, 3);
    this.container.replaceChildren();
    for (const choice of choices) {
      const button = document.createElement("button");
      button.className = "upgrade-card";
      button.innerHTML = `<span class="icon">${choice.icon}</span><b>${choice.name}</b><small>${choice.desc}</small>`;
      button.addEventListener("click", () => {
        choice.apply(this.game.player);
        this.screen.classList.add("hidden");
        this.game.state = "running";
        this.game.lastTime = performance.now();
        this.game.showMessage(choice.name, "#76f7ff");
      }, { once: true });
      this.container.append(button);
    }
    this.screen.classList.remove("hidden");
  }
}

// ============================================================
// Game
// ============================================================
class Game {
  constructor() {
    this.canvas = document.querySelector("#game");
    this.ctx = this.canvas.getContext("2d");
    this.input = new InputManager(this.canvas);
    this.state = "start";
    this.width = 0;
    this.height = 0;
    this.lastTime = performance.now();
    this.resize();
    this.makeAmbient();
    this.bindUI();
    addEventListener("resize", () => this.resize());
    requestAnimationFrame((time) => this.loop(time));
  }

  bindUI() {
    document.querySelector("#start-button").addEventListener("click", () => this.start());
    document.querySelector("#restart-button").addEventListener("click", () => this.start());
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.width = innerWidth;
    this.height = innerHeight;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.player) {
      this.player.x = clamp(this.player.x, 30, this.width - 30);
      this.player.y = clamp(this.player.y, 30, this.height - 30);
    }
  }

  makeAmbient() {
    this.ambient = Array.from({ length: 70 }, () => ({
      x: rand(0, this.width), y: rand(0, this.height),
      size: rand(.5, 2.8), speed: rand(4, 18), phase: rand(0, TAU)
    }));
  }

  start() {
    this.state = "running";
    this.player = new Player(this);
    this.enemies = [];
    this.projectiles = [];
    this.items = [];
    this.particles = [];
    this.elapsed = 0;
    this.depth = 0;
    this.kills = 0;
    this.dreams = 0;
    this.spawnTimer = .8;
    this.shake = 0;
    this.flash = 0;
    this.upgrades = new UpgradeSystem(this);
    this.lastTime = performance.now();
    document.querySelector("#start-screen").classList.add("hidden");
    document.querySelector("#gameover-screen").classList.add("hidden");
    document.querySelector("#upgrade-screen").classList.add("hidden");
    document.querySelector("#hud").classList.remove("hidden");
    this.showMessage("深海？ 俺には青いレッドカーペット。", "#6ffaff");
  }

  loop(time) {
    const dt = Math.min(.033, Math.max(0, (time - this.lastTime) / 1000));
    this.lastTime = time;
    if (this.state === "running") this.update(dt);
    else if (this.state === "gameover" && this.input.consume("r")) this.start();
    this.draw(time / 1000);
    this.input.endFrame();
    requestAnimationFrame((next) => this.loop(next));
  }

  update(dt) {
    this.elapsed += dt;
    this.depth = Math.floor(this.elapsed * 8.5);
    this.shake = Math.max(0, this.shake - dt * 25);
    this.flash = Math.max(0, this.flash - dt * 1.5);
    this.updateAmbient(dt);
    this.player.update(dt, this);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      const danger = this.player.lightLevel + (this.player.burstActive ? .75 : 0);
      const depthPressure = Math.min(1.4, this.depth / 800);
      this.spawnTimer = Math.max(.16, 1.05 - depthPressure * .42 - danger * .44) * rand(.7, 1.25);
    }

    for (const enemy of this.enemies) enemy.update(dt, this);
    for (const projectile of this.projectiles) projectile.update(dt, this);
    for (const item of this.items) item.update(dt, this);
    for (const particle of this.particles) particle.update(dt);
    this.enemies = this.enemies.filter(e => !e.dead && e.x > -240 && e.x < this.width + 240 && e.y > -240 && e.y < this.height + 240);
    this.projectiles = this.projectiles.filter(p => !p.dead);
    this.items = this.items.filter(i => !i.dead);
    this.particles = this.particles.filter(p => p.life > 0);
    if (this.enemies.length > 125) this.enemies.splice(0, this.enemies.length - 125);
    this.updateHUD();
  }

  updateAmbient(dt) {
    for (const mote of this.ambient) {
      mote.y -= mote.speed * dt;
      mote.x += Math.sin(this.elapsed * .35 + mote.phase) * dt * 7;
      if (mote.y < -5) {
        mote.y = this.height + 5;
        mote.x = rand(0, this.width);
      }
    }
  }

  spawnEnemy() {
    const side = (Math.random() * 4) | 0;
    const margin = 55;
    let x;
    let y;
    if (side === 0) { x = rand(0, this.width); y = -margin; }
    else if (side === 1) { x = this.width + margin; y = rand(0, this.height); }
    else if (side === 2) { x = rand(0, this.width); y = this.height + margin; }
    else { x = -margin; y = rand(0, this.height); }

    const danger = this.player.lightLevel + (this.player.burstActive ? .65 : 0);
    const progress = clamp(this.depth / 1000, 0, 1);
    const roll = Math.random();
    let type = "fish";
    if (roll < .13 + progress * .22 + danger * .12) type = "blob";
    else if (roll < .38 + danger * .28 + progress * .12) type = "jelly";
    const difficulty = 1 + this.depth / 720;
    const eliteChance = clamp(.015 + progress * .09 + danger * .045, 0, .2);
    this.enemies.push(new Enemy(x, y, type, difficulty, Math.random() < eliteChance));
  }

  onEnemyKilled(enemy) {
    this.kills += 1;
    const player = this.player;
    player.addBurst(7 + enemy.xp * 1.4);
    if (player.neonActive) {
      player.neonKillChain += 1;
      player.neonChainTimer = 1.5;
      player.addBurst(2 + player.neonKillChain * .65);
      if (player.neonKillChain === 4) this.showMessage("輝きの連鎖 ×4", "#5ffcff");
      if (player.neonKillChain === 8) this.showMessage("深海が俺を見ている ×8", "#ff5bd5");
    }

    for (let i = 0; i < enemy.xp; i++) {
      this.items.push(new Item(enemy.x + rand(-12, 12), enemy.y + rand(-12, 12), "xp", 1));
    }
    if (enemy.type === "blob" && Math.random() < .72) this.items.push(new Item(enemy.x, enemy.y, "dream", 1));
    const rareBoost = clamp(this.depth / 3000, 0, .08);
    if (Math.random() < .012 + rareBoost) this.items.push(new Item(enemy.x + 8, enemy.y, "memory", 1));
    if (enemy.elite && Math.random() < .45) this.items.push(new Item(enemy.x - 8, enemy.y, "dream", 1));
    this.spark(enemy.x, enemy.y, enemy.color, enemy.elite ? 22 : 11);
  }

  addXp(amount) {
    const p = this.player;
    p.xp += amount;
    if (p.xp >= p.xpNeeded && this.state === "running") {
      p.xp -= p.xpNeeded;
      p.level += 1;
      p.xpNeeded = Math.floor(8 + p.level * 4.8);
      p.hp = Math.min(p.maxHp, p.hp + 8);
      this.flash = .35;
      this.upgrades.show();
    }
  }

  spark(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, TAU);
      const speed = rand(35, 180);
      this.particles.push(new Particle(x, y, {
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        color, life: rand(.25, .75), size: rand(1.5, 4.5)
      }));
    }
  }

  ring(x, y, color, size) {
    this.particles.push(new Particle(x, y, { vx: 0, vy: 0, color, life: .65, size, ring: true, drag: 0, glow: 22 }));
  }

  showMessage(text, color = "#55f8ff") {
    const el = document.querySelector("#message");
    el.textContent = text;
    el.style.color = color;
    el.classList.remove("hidden");
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
    clearTimeout(this.messageTimeout);
    this.messageTimeout = setTimeout(() => el.classList.add("hidden"), 1800);
  }

  showQuote(text) {
    const el = document.querySelector("#quote");
    el.textContent = `「${text}」`;
    el.classList.remove("hidden");
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
    clearTimeout(this.quoteTimeout);
    this.quoteTimeout = setTimeout(() => el.classList.add("hidden"), 2500);
  }

  gameOver() {
    if (this.state !== "running") return;
    this.state = "gameover";
    this.player.hp = 0;
    document.querySelector("#hud").classList.add("hidden");
    const quotes = [
      "深海？ いや、ここはユウタのステージだった。",
      "沈んだのではない。海が深すぎただけ。",
      "ネオンは消えていない。次の挑戦でまた光る。"
    ];
    document.querySelector("#result-quote").textContent = `「${pick(quotes)}」`;
    document.querySelector("#result-depth").textContent = `${this.depth}m`;
    document.querySelector("#result-kills").textContent = this.kills;
    document.querySelector("#result-level").textContent = this.player.level;
    document.querySelector("#result-dreams").textContent = this.dreams;
    document.querySelector("#result-time").textContent = formatTime(this.elapsed);
    document.querySelector("#gameover-screen").classList.remove("hidden");
  }

  updateHUD() {
    const p = this.player;
    document.querySelector("#hp-bar").style.width = `${clamp(p.hp / p.maxHp * 100, 0, 100)}%`;
    document.querySelector("#hp-text").textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
    document.querySelector("#xp-bar").style.width = `${p.xp / p.xpNeeded * 100}%`;
    document.querySelector("#level-text").textContent = `LV.${p.level}`;
    document.querySelector("#neon-bar").style.width = `${p.lightLevel * 100}%`;
    document.querySelector("#neon-text").textContent = p.burstActive ? "MAXIMUM" : p.neonActive ? "HIGH RISK" : p.afterglow > 0 ? "DIM" : "LOW";
    document.querySelector("#burst-bar").style.width = `${p.burst}%`;
    document.querySelector("#burst-text").textContent = `${Math.floor(p.burst)}%`;
    document.querySelector("#depth-text").textContent = `深度：${this.depth}m`;
    document.querySelector("#time-text").textContent = formatTime(this.elapsed);
    document.querySelector("#dream-text").textContent = this.dreams;
    document.querySelector("#kill-text").textContent = this.kills;
    this.setAbility("#ability-neon", p.neonActive ? `${p.neonTimer.toFixed(1)}s` : p.neonCooldown > 0 ? `${p.neonCooldown.toFixed(1)}s` : "READY", p.neonCooldown <= 0 && !p.neonActive);
    this.setAbility("#ability-dash", p.dashCooldown > 0 ? `${p.dashCooldown.toFixed(1)}s` : "READY", p.dashCooldown <= 0);
    this.setAbility("#ability-burst", p.burstActive ? `${p.burstTimer.toFixed(1)}s` : `${Math.floor(p.burst)}%`, p.burst >= 100);
  }

  setAbility(selector, text, ready) {
    const el = document.querySelector(selector);
    el.querySelector("small").textContent = text;
    el.classList.toggle("ready", ready);
    el.classList.toggle("cooling", !ready);
  }

  visibilityAt(entity) {
    if (!this.player) return .15;
    const radius = 135 + this.player.lightLevel * 390 * this.player.neonPower;
    const d = distance(entity, this.player);
    return clamp(1 - (d - radius * .55) / (radius * .65), .07, 1);
  }

  draw(time) {
    const ctx = this.ctx;
    const depthShade = this.depth ? clamp(this.depth / 1500, 0, .45) : 0;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, `rgb(${3 - depthShade * 2}, ${13 - depthShade * 7}, ${31 - depthShade * 12})`);
    gradient.addColorStop(1, `rgb(1, ${5 - depthShade * 3}, ${18 - depthShade * 8})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    this.drawBackground(ctx, time);
    if (!this.player) return;

    const sx = this.shake ? rand(-this.shake, this.shake) : 0;
    const sy = this.shake ? rand(-this.shake, this.shake) : 0;
    ctx.save();
    ctx.translate(sx, sy);

    // The player's living pool of light.
    const lightRadius = 150 + this.player.lightLevel * 390 * this.player.neonPower;
    const glow = ctx.createRadialGradient(this.player.x, this.player.y, 10, this.player.x, this.player.y, lightRadius);
    glow.addColorStop(0, this.player.burstActive ? "rgba(255,60,200,.19)" : "rgba(45,220,255,.16)");
    glow.addColorStop(.55, "rgba(18,82,145,.06)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, this.width, this.height);

    for (const item of this.items) item.draw(ctx, this.visibilityAt(item));
    for (const enemy of this.enemies) enemy.draw(ctx, this.visibilityAt(enemy));
    for (const projectile of this.projectiles) projectile.draw(ctx);
    for (const particle of this.particles) particle.draw(ctx);
    this.player.draw(ctx);
    this.drawAim(ctx);
    ctx.restore();

    if (this.player.burstActive) {
      const burstWash = ctx.createRadialGradient(this.player.x, this.player.y, 20, this.player.x, this.player.y, Math.max(this.width, this.height));
      burstWash.addColorStop(0, "rgba(255,80,215,.12)");
      burstWash.addColorStop(.55, "rgba(45,175,255,.045)");
      burstWash.addColorStop(1, "rgba(125,30,180,.08)");
      ctx.fillStyle = burstWash;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(110,240,255,${this.flash * .27})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawBackground(ctx, time) {
    ctx.save();
    for (const mote of this.ambient) {
      const alpha = .12 + Math.sin(time + mote.phase) * .05;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = mote.size > 1.8 ? "#43b9de" : "#607aab";
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = .08;
    ctx.strokeStyle = "#40d6f2";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (i * 190 + time * (7 + i)) % (this.height + 200) - 100;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(this.width * .3, y + 25, this.width * .7, y - 20, this.width, y + 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawAim(ctx) {
    const mouse = this.input.mouse;
    ctx.save();
    ctx.translate(mouse.x, mouse.y);
    ctx.strokeStyle = "rgba(130,250,255,.7)";
    ctx.shadowColor = "#3defff";
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, TAU);
    ctx.moveTo(-15, 0); ctx.lineTo(-5, 0);
    ctx.moveTo(15, 0); ctx.lineTo(5, 0);
    ctx.moveTo(0, -15); ctx.lineTo(0, -5);
    ctx.moveTo(0, 15); ctx.lineTo(0, 5);
    ctx.stroke();
    ctx.restore();
  }
}

new Game();
