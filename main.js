"use strict";

// ============================================================
// AMESEA utilities
// ============================================================
const TAU = Math.PI * 2;
const SAVE_KEY = "amesea_neon_abyss_save_v2";
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => Math.random() * (max - min) + min;
const pick = array => array[(Math.random() * array.length) | 0];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const formatTime = seconds => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const TREE_ROUTES = [
  {
    id: "roland",
    name: "ローランドルート",
    theme: "ポジティブ・自己肯定感・ネオン",
    color: "#45f7ff",
    nodes: [
      { id: "roland_duration", name: "ポジティブ長期契約", desc: "ネオン持続時間 +0.8秒", cost: 3 },
      { id: "roland_power", name: "肯定感、火力換算", desc: "ネオン中の攻撃力 +18%", cost: 6 },
      { id: "roland_stun", name: "登場だけで黙らせる", desc: "ネオン発動時の怯み +0.7秒", cost: 10 }
    ]
  },
  {
    id: "ikemen",
    name: "イケメンルート",
    theme: "回避・カウンター・魅了",
    color: "#67a7ff",
    nodes: [
      { id: "ikemen_cooldown", name: "華麗なる離脱", desc: "ダッシュ再使用 -15%", cost: 3 },
      { id: "ikemen_invuln", name: "残像すらイケメン", desc: "ダッシュ無敵時間 +0.12秒", cost: 6 },
      { id: "ikemen_charm", name: "深海も見惚れる", desc: "接触ダメージを8%で無効化", cost: 10 }
    ]
  },
  {
    id: "baka",
    name: "バカルート",
    theme: "突進・爆発・勢い",
    color: "#ff8c48",
    nodes: [
      { id: "baka_shockwave", name: "考える前に衝撃波", desc: "ダッシュ時に周囲へダメージ", cost: 3 },
      { id: "baka_explosion", name: "弾はたまに爆発する", desc: "弾が10%で小爆発", cost: 6 },
      { id: "baka_crisis", name: "ピンチはだいたい好機", desc: "HP35%以下で攻撃力 +30%", cost: 10 }
    ]
  },
  {
    id: "kindness",
    name: "優しさルート",
    theme: "回復・守護・家族",
    color: "#ffe58d",
    nodes: [
      { id: "kindness_memory", name: "家族のぬくもり", desc: "家族の記憶の回復量 +16", cost: 3 },
      { id: "kindness_hp", name: "帰るまで倒れない", desc: "最大HP +20", cost: 6 },
      { id: "kindness_guard", name: "約束の守護", desc: "1プレイに1度、致命傷を耐える", cost: 10 }
    ]
  },
  {
    id: "abyss",
    name: "深海生物ルート",
    theme: "水圧耐性・暗闇適応・探索",
    color: "#9b75ff",
    nodes: [
      { id: "abyss_vision", name: "暗闇と友達", desc: "深度による視界悪化を40%軽減", cost: 3 },
      { id: "abyss_magnet", name: "触手級コレクター", desc: "アイテム吸引範囲 +55", cost: 6 },
      { id: "abyss_rare", name: "深海の目利き", desc: "レアドロップ率アップ", cost: 10 }
    ]
  }
];

const DEFAULT_SAVE = () => ({
  version: 2,
  dreams: 0,
  permanent: {},
  maxDepth: 0,
  totalKills: 0,
  totalPlays: 0,
  unlocks: { dreamTree: true, jellyKingDefeated: false },
  settings: { volume: 0.7 },
  records: { bestKills: 0, bestTime: 0, bossKills: 0 }
});

// ============================================================
// Safe localStorage save data
// ============================================================
class SaveSystem {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return DEFAULT_SAVE();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || parsed.version !== 2) throw new Error("invalid save version");
      const safe = DEFAULT_SAVE();
      safe.dreams = this.number(parsed.dreams);
      safe.maxDepth = this.number(parsed.maxDepth);
      safe.totalKills = this.number(parsed.totalKills);
      safe.totalPlays = this.number(parsed.totalPlays);
      safe.settings.volume = clamp(Number(parsed.settings?.volume) || 0.7, 0, 1);
      safe.unlocks.jellyKingDefeated = Boolean(parsed.unlocks?.jellyKingDefeated);
      safe.records.bestKills = this.number(parsed.records?.bestKills);
      safe.records.bestTime = this.number(parsed.records?.bestTime);
      safe.records.bossKills = this.number(parsed.records?.bossKills);
      const validIds = new Set(TREE_ROUTES.flatMap(route => route.nodes.map(node => node.id)));
      for (const [id, owned] of Object.entries(parsed.permanent || {})) {
        if (validIds.has(id) && owned === true) safe.permanent[id] = true;
      }
      return safe;
    } catch (error) {
      console.warn("AMESEA: セーブデータを安全に初期化しました。", error);
      const fresh = DEFAULT_SAVE();
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(fresh)); } catch (_) {}
      return fresh;
    }
  }

  number(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      return true;
    } catch (error) {
      console.warn("AMESEA: セーブに失敗しました。", error);
      return false;
    }
  }

  reset() {
    this.data = DEFAULT_SAVE();
    this.save();
  }

  owns(id) {
    return this.data.permanent[id] === true;
  }
}

// ============================================================
// Input
// ============================================================
class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: innerWidth * 0.65, y: innerHeight * 0.5, down: false };
    addEventListener("keydown", event => {
      const key = event.key.toLowerCase();
      if (!this.keys.has(key)) this.pressed.add(key);
      this.keys.add(key);
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(key)) event.preventDefault();
    });
    addEventListener("keyup", event => this.keys.delete(event.key.toLowerCase()));
    canvas.addEventListener("pointermove", event => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = event.clientX - rect.left;
      this.mouse.y = event.clientY - rect.top;
    });
    canvas.addEventListener("pointerdown", event => {
      if (event.button === 0) this.mouse.down = true;
    });
    addEventListener("pointerup", event => {
      if (event.button === 0) this.mouse.down = false;
    });
    canvas.addEventListener("contextmenu", event => event.preventDefault());
    addEventListener("blur", () => {
      this.keys.clear();
      this.mouse.down = false;
    });
  }

  isDown(...keys) { return keys.some(key => this.keys.has(key)); }
  consume(key) {
    const normalized = key.toLowerCase();
    const has = this.pressed.has(normalized);
    this.pressed.delete(normalized);
    return has;
  }
  endFrame() { this.pressed.clear(); }
}

// ============================================================
// Particles and projectiles
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
    this.line = options.line ?? null;
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
    if (this.line) {
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.line.x, this.line.y);
      ctx.stroke();
    } else if (this.ring) {
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

class EnemyProjectile {
  constructor(x, y, angle, speed, damage, color = "#ff55ce") {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.radius = 7;
    this.life = 5;
    this.color = color;
    this.dead = false;
  }

  update(dt, game) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.life <= 0 || this.x < -50 || this.x > game.width + 50 || this.y < -50 || this.y > game.height + 50) this.dead = true;
    if (!this.dead && distance(this, game.player) < this.radius + game.player.radius) {
      this.dead = true;
      game.player.takeDamage(this.damage, game, "projectile");
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "#fff2ff";
    ctx.strokeStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

class Projectile {
  constructor(x, y, angle, player) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * player.projectileSpeed;
    this.vy = Math.sin(angle) * player.projectileSpeed;
    this.radius = player.burstActive ? 7 : 5;
    const neonMultiplier = player.neonActive ? player.neonDamageMultiplier : 1;
    const crisis = player.hp / player.maxHp <= 0.35 ? player.lowHpMultiplier : 1;
    this.damage = player.attackDamage * neonMultiplier * crisis * (player.burstActive ? 1.75 : 1);
    this.life = player.projectileRange / player.projectileSpeed;
    this.dead = false;
    this.pierce = player.burstActive ? 1 : 0;
    this.color = player.burstActive ? "#ff55d5" : "#55f7ff";
    this.hit = new Set();
    this.explosionChance = player.explosionChance;
  }

  update(dt, game) {
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const hostiles = game.boss && !game.boss.dead ? [...game.enemies, game.boss] : game.enemies;
    for (const enemy of hostiles) {
      if (enemy.dead || this.hit.has(enemy)) continue;
      if (distance(this, enemy) < this.radius + enemy.radius) {
        this.hit.add(enemy);
        enemy.takeDamage(this.damage, game);
        game.spark(this.x, this.y, this.color, 5);
        if (Math.random() < this.explosionChance) game.explode(this.x, this.y, this.damage * 0.6, enemy);
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
// Items
// ============================================================
const MEMORY_QUOTES = [
  "家族の声が聞こえた。まだ沈むな。",
  "優しさが、深海の底で光った。",
  "夢は沈まない。ユウタがそう決めた。",
  "誰かのために光るとき、ユウタは少し強くなる。",
  "帰る場所がある。それだけで、深海は少し浅くなる。"
];

class Item {
  constructor(x, y, type = "xp", value = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.value = value;
    this.radius = type === "memory" ? 11 : type === "dream" ? 8 : 5;
    this.life = 24;
    this.phase = rand(0, TAU);
    this.dead = false;
    this.pullFx = 0;
  }

  update(dt, game) {
    this.life -= dt;
    this.phase += dt * 3;
    this.pullFx -= dt;
    if (this.life <= 0) this.dead = true;
    const player = game.player;
    const d = distance(this, player);
    const magnet = player.magnetRange * (player.neonActive ? 2.35 : 1) * (player.burstActive ? 1.25 : 1);
    if (d < magnet && d > 1) {
      const speed = lerp(95, 650, 1 - d / magnet);
      this.x += (player.x - this.x) / d * speed * dt;
      this.y += (player.y - this.y) / d * speed * dt;
      if (this.pullFx <= 0) {
        this.pullFx = 0.1;
        game.particles.push(new Particle(this.x, this.y, {
          vx: 0, vy: 0, life: 0.15, color: this.type === "memory" ? "#fff1a6" : "#5cf8ff",
          line: { x: player.x, y: player.y }, drag: 0, glow: 8
        }));
      }
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
      game.save.data.dreams += this.value;
      game.save.save();
      game.showMessage(`夢の欠片 +${this.value}`, "#d66cff");
    } else {
      const heal = Math.min(34 + player.memoryHealBonus, player.maxHp - player.hp);
      player.hp += heal;
      if (player.memoryBlessing) {
        player.memoryShield = 8;
        if (player.fatalGuardMax) player.fatalGuard = 1;
      }
      game.showQuote(pick(MEMORY_QUOTES));
      game.showMessage(`家族の記憶 HP +${Math.ceil(heal)}`, "#fff1a6");
    }
    game.spark(this.x, this.y, this.type === "xp" ? "#42f5ff" : this.type === "dream" ? "#cf55ff" : "#ffefad", 10);
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
// Normal enemies
// ============================================================
const ENEMY_DATA = {
  fish: { name: "ネガフィッシュ", hp: 28, speed: 72, damage: 10, radius: 17, color: "#317dff", xp: 1 },
  jelly: { name: "承認欲求クラゲ", hp: 44, speed: 53, damage: 13, radius: 21, color: "#ff4fd1", xp: 3 },
  blob: { name: "夢喰いニュウドウ", hp: 88, speed: 64, damage: 17, radius: 27, color: "#a055ff", xp: 5 }
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
    this.speed = data.speed * (1 + (difficulty - 1) * 0.2) * (elite ? 1.1 : 1);
    this.damage = data.damage * Math.sqrt(difficulty) * (elite ? 1.32 : 1);
    this.color = elite ? "#ffce54" : data.color;
    this.xp = data.xp + (elite ? 3 : 0);
    this.phase = rand(0, TAU);
    this.hitFlash = 0;
    this.attackCooldown = rand(0, 0.5);
    this.wanderAngle = rand(0, TAU);
    this.stunned = 0;
    this.dead = false;
  }

  update(dt, game) {
    const player = game.player;
    this.phase += dt * (this.type === "jelly" ? 5 : 2);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.attackCooldown -= dt;
    this.stunned = Math.max(0, this.stunned - dt);
    if (game.activeEvent?.id === "current") this.x += game.eventDirection * 82 * dt;
    if (this.stunned > 0) return;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
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
        speed *= 0.75 + light * 1.42;
        moveX += Math.cos(this.phase * 1.7) * 0.18;
        moveY += Math.sin(this.phase * 1.7) * 0.18;
      } else if (this.type === "blob") {
        const preferred = 225 + Math.sin(this.phase) * 80;
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
      this.attackCooldown = 0.78;
      player.takeDamage(this.damage, game, "contact");
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
      ctx.ellipse(0, 0, this.radius, this.radius * 0.62, 0, 0, TAU);
      ctx.moveTo(-this.radius * 0.75, 0);
      ctx.lineTo(-this.radius * 1.45, -this.radius * 0.65);
      ctx.lineTo(-this.radius * 1.3, this.radius * 0.65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ff63d7";
      ctx.beginPath();
      ctx.arc(this.radius * 0.42, -3, 2.8, 0, TAU);
      ctx.fill();
    } else if (this.type === "jelly") {
      ctx.beginPath();
      ctx.arc(0, -4, this.radius, Math.PI, 0);
      ctx.quadraticCurveTo(this.radius * 0.65, this.radius * 0.7, this.radius * 0.35, this.radius * 0.32);
      ctx.quadraticCurveTo(0, this.radius, -this.radius * 0.35, this.radius * 0.32);
      ctx.quadraticCurveTo(-this.radius * 0.7, this.radius * 0.7, -this.radius, -4);
      ctx.fill();
      ctx.stroke();
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * this.radius * 0.42, this.radius * 0.3);
        ctx.quadraticCurveTo(i * this.radius * 0.65 + Math.sin(this.phase + i) * 7, this.radius, i * this.radius * 0.3, this.radius * 1.35);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const angle = i / 16 * TAU;
        const radius = this.radius * (1 + Math.sin(angle * 5 + this.phase) * 0.1);
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius * 0.82;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
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
      ctx.arc(0, 7, 9, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }
    if (this.stunned > 0) {
      ctx.strokeStyle = "#fff6a2";
      ctx.beginPath();
      ctx.arc(0, -this.radius - 9, this.radius * 0.45, 0, TAU);
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
// Boss: 承認欲求クラゲ・キング
// ============================================================
class JellyKing {
  constructor(game) {
    this.x = game.width / 2;
    this.y = -95;
    this.radius = 66;
    this.maxHp = 1050 + game.player.level * 38;
    this.hp = this.maxHp;
    this.speed = 34;
    this.damage = 19;
    this.phase = 0;
    this.radialTimer = 2.2;
    this.summonTimer = 5.8;
    this.contactCooldown = 0;
    this.hitFlash = 0;
    this.dead = false;
    this.entering = true;
  }

  update(dt, game) {
    this.phase += dt;
    this.radialTimer -= dt;
    this.summonTimer -= dt;
    this.contactCooldown -= dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    const player = game.player;
    const light = player.lightLevel;
    if (this.entering) {
      this.y += 72 * dt;
      if (this.y >= Math.min(150, game.height * 0.24)) this.entering = false;
      return;
    }
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const reactiveSpeed = this.speed * (0.75 + light * 1.35);
    const preferred = 260 - light * 65;
    const toward = d > preferred ? 1 : -0.55;
    this.x += (dx / d * toward + Math.sin(this.phase * 1.3) * 0.55) * reactiveSpeed * dt;
    this.y += (dy / d * toward + Math.cos(this.phase * 1.1) * 0.2) * reactiveSpeed * dt;
    this.x = clamp(this.x, this.radius, game.width - this.radius);
    this.y = clamp(this.y, this.radius, game.height - this.radius);
    if (this.radialTimer <= 0) {
      this.radialTimer = lerp(3.1, 1.65, light);
      this.fireRing(game, 10 + Math.floor(light * 4));
    }
    if (this.summonTimer <= 0) {
      this.summonTimer = lerp(8.5, 5.4, light);
      const count = light > 0.75 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        game.enemies.push(new Enemy(this.x + rand(-80, 80), this.y + rand(-45, 45), "jelly", 1.35, false));
      }
      game.showMessage("キングの承認待ちが増えた", "#ff73d5");
    }
    if (d < this.radius + player.radius && this.contactCooldown <= 0) {
      this.contactCooldown = 0.9;
      player.takeDamage(this.damage, game, "contact");
    }
  }

  fireRing(game, count) {
    const offset = this.phase * 0.7;
    const speed = 175 + game.player.lightLevel * 65;
    for (let i = 0; i < count; i++) {
      game.enemyProjectiles.push(new EnemyProjectile(this.x, this.y, offset + i / count * TAU, speed, 12, "#ff45c7"));
    }
    game.ring(this.x, this.y, "#ff49c8", 40);
    game.shake = 7;
  }

  takeDamage(amount, game) {
    this.hp -= amount;
    this.hitFlash = 0.1;
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      game.onBossKilled(this);
    }
  }

  draw(ctx, visibility = 1) {
    ctx.save();
    ctx.globalAlpha = clamp(visibility + (this.hitFlash ? 0.25 : 0), 0, 1);
    ctx.translate(this.x, this.y);
    const pulse = 1 + Math.sin(this.phase * 3) * 0.04;
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = this.hitFlash ? "#fff" : "#ff54cf";
    ctx.fillStyle = this.hitFlash ? "#fff" : "rgba(134, 32, 190, .44)";
    ctx.shadowColor = "#ff37c7";
    ctx.shadowBlur = 42;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -8, this.radius, Math.PI, 0);
    ctx.quadraticCurveTo(this.radius, this.radius * 0.55, this.radius * 0.52, this.radius * 0.45);
    ctx.quadraticCurveTo(0, this.radius * 1.15, -this.radius * 0.52, this.radius * 0.45);
    ctx.quadraticCurveTo(-this.radius, this.radius * 0.55, -this.radius, -8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff5a3";
    ctx.beginPath();
    ctx.arc(-23, -13, 7, 0, TAU);
    ctx.arc(23, -13, 7, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#72f8ff";
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 23, this.radius * 0.28);
      ctx.quadraticCurveTo(i * 31 + Math.sin(this.phase * 3 + i) * 16, this.radius, i * 18, this.radius * 1.55);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffdd63";
    ctx.strokeStyle = "#fff6b0";
    ctx.beginPath();
    ctx.moveTo(-32, -this.radius * 0.8);
    ctx.lineTo(-15, -this.radius * 1.2);
    ctx.lineTo(0, -this.radius * 0.82);
    ctx.lineTo(18, -this.radius * 1.22);
    ctx.lineTo(34, -this.radius * 0.76);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// ============================================================
// Player and permanent growth
// ============================================================
class Player {
  constructor(game) {
    this.x = game.width / 2;
    this.y = game.height / 2;
    this.radius = 20;
    this.maxHp = 100;
    this.hp = 100;
    this.moveSpeed = 235;
    this.attackDamage = 22;
    this.attackRate = 3.65;
    this.projectileSpeed = 760;
    this.projectileRange = 700;
    this.projectileCount = 1;
    this.attackTimer = 0;
    this.dashCooldownMax = 2;
    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.dashDuration = 0.2;
    this.dashDx = 1;
    this.dashDy = 0;
    this.invulnerable = 0;
    this.neonActive = false;
    this.neonDuration = 4.2;
    this.neonTimer = 0;
    this.neonCooldownMax = 9.2;
    this.neonCooldown = 0;
    this.neonPower = 1;
    this.neonDamageMultiplier = 1.55;
    this.neonStun = 0.55;
    this.afterglow = 0;
    this.magnetRange = 105;
    this.burst = 0;
    this.burstGain = 1;
    this.burstActive = false;
    this.burstTimer = 0;
    this.level = 1;
    this.xp = 0;
    this.xpNeeded = 7;
    this.aimAngle = 0;
    this.anim = 0;
    this.neonKillChain = 0;
    this.neonChainTimer = 0;
    this.contactEvade = 0;
    this.dashShockwave = false;
    this.explosionChance = 0;
    this.lowHpMultiplier = 1;
    this.memoryHealBonus = 0;
    this.memoryBlessing = false;
    this.memoryShield = 0;
    this.fatalGuardMax = 0;
    this.fatalGuard = 0;
    this.darknessAdapt = 0;
    this.rareBonus = 0;
    this.trailTimer = 0;
    this.applyPermanent(game.save);
    this.hp = this.maxHp;
  }

  applyPermanent(save) {
    if (save.owns("roland_duration")) this.neonDuration += 0.8;
    if (save.owns("roland_power")) this.neonDamageMultiplier += 0.18;
    if (save.owns("roland_stun")) this.neonStun += 0.7;
    if (save.owns("ikemen_cooldown")) this.dashCooldownMax *= 0.85;
    if (save.owns("ikemen_invuln")) this.dashDuration += 0.12;
    if (save.owns("ikemen_charm")) this.contactEvade = 0.08;
    if (save.owns("baka_shockwave")) this.dashShockwave = true;
    if (save.owns("baka_explosion")) this.explosionChance = 0.1;
    if (save.owns("baka_crisis")) this.lowHpMultiplier = 1.3;
    if (save.owns("kindness_memory")) this.memoryHealBonus = 16;
    if (save.owns("kindness_hp")) this.maxHp += 20;
    if (save.owns("kindness_guard")) {
      this.fatalGuardMax = 1;
      this.fatalGuard = 1;
      this.memoryBlessing = true;
    }
    if (save.owns("abyss_vision")) this.darknessAdapt = 0.4;
    if (save.owns("abyss_magnet")) this.magnetRange += 55;
    if (save.owns("abyss_rare")) this.rareBonus = 0.035;
  }

  get lightLevel() {
    if (this.burstActive) return 1;
    if (this.neonActive) return clamp(0.8 + this.neonPower * 0.12, 0, 1);
    if (this.afterglow > 0) return 0.14;
    return clamp(0.26 + (this.neonPower - 1) * 0.08, 0.2, 0.52);
  }

  update(dt, game) {
    const input = game.input;
    this.anim += dt;
    this.attackTimer -= dt;
    this.trailTimer -= dt;
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.neonCooldown = Math.max(0, this.neonCooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.afterglow = Math.max(0, this.afterglow - dt);
    this.memoryShield = Math.max(0, this.memoryShield - dt);
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
      this.x += this.dashDx * 845 * dt;
      this.y += this.dashDy * 845 * dt;
      if (this.trailTimer <= 0) {
        this.trailTimer = 0.035;
        game.particles.push(new Particle(this.x, this.y, {
          vx: -this.dashDx * 40, vy: -this.dashDy * 40, life: 0.32, size: rand(7, 13),
          color: this.burstActive ? "#ff55cf" : "#55eaff", glow: 22, ring: true
        }));
      }
    } else {
      const speed = this.moveSpeed * (this.burstActive ? 1.38 : 1);
      this.x += mx * speed * dt;
      this.y += my * speed * dt;
    }
    if (game.activeEvent?.id === "current") this.x += game.eventDirection * 72 * dt;
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
    this.dashTimer = this.dashDuration;
    this.invulnerable = this.dashDuration + 0.09;
    this.dashCooldown = this.dashCooldownMax;
    let closeCall = false;
    for (const enemy of game.enemies) if (distance(this, enemy) < enemy.radius + 76) closeCall = true;
    if (game.boss && !game.boss.dead && distance(this, game.boss) < game.boss.radius + 90) closeCall = true;
    if (closeCall) {
      this.addBurst(9);
      game.showMessage("ギリギリ？ 予定通り。", "#65ecff");
    }
    if (this.dashShockwave) {
      game.ring(this.x, this.y, "#ffad55", 24);
      game.damageArea(this.x, this.y, 115, this.attackDamage * 0.7);
    }
    game.shake = Math.max(game.shake, 4);
  }

  startNeon(game) {
    this.neonActive = true;
    this.neonTimer = this.neonDuration;
    this.neonCooldown = this.neonCooldownMax;
    this.neonKillChain = 0;
    this.neonChainTimer = this.neonDuration;
    game.showMessage("ポジティブ・ネオン！", "#55f8ff");
    game.shake = 6;
    const hostiles = game.boss && !game.boss.dead ? [...game.enemies, game.boss] : game.enemies;
    for (const enemy of hostiles) {
      const d = distance(this, enemy);
      if (d < 265) {
        const nx = (enemy.x - this.x) / Math.max(d, 1);
        const ny = (enemy.y - this.y) / Math.max(d, 1);
        enemy.x += nx * 28;
        enemy.y += ny * 28;
        if ("stunned" in enemy) enemy.stunned = Math.max(enemy.stunned, this.neonStun);
        if ("attackCooldown" in enemy) enemy.attackCooldown = Math.max(enemy.attackCooldown, this.neonStun);
      }
    }
    game.ring(this.x, this.y, "#4cffff", 28);
  }

  startBurst(game) {
    this.burst = 0;
    this.burstActive = true;
    this.burstTimer = 6;
    this.invulnerable = 0.7;
    game.shake = 18;
    game.flash = 0.9;
    game.showMessage("自意識、限界突破。", "#ff5bd4");
    const hostiles = game.boss && !game.boss.dead ? [...game.enemies, game.boss] : game.enemies;
    for (const enemy of hostiles) {
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
    const spread = 0.16;
    for (let i = 0; i < this.projectileCount; i++) {
      const offset = (i - (this.projectileCount - 1) / 2) * spread;
      const angle = this.aimAngle + offset;
      game.projectiles.push(new Projectile(this.x + Math.cos(angle) * 23, this.y + Math.sin(angle) * 23, angle, this));
    }
    game.particles.push(new Particle(
      this.x + Math.cos(this.aimAngle) * 24,
      this.y + Math.sin(this.aimAngle) * 24,
      { vx: Math.cos(this.aimAngle) * 80, vy: Math.sin(this.aimAngle) * 80, life: 0.18, size: 8, color: "#8ffcff" }
    ));
  }

  takeDamage(amount, game, source = "contact") {
    if (this.invulnerable > 0 || this.dashTimer > 0) return;
    if (source === "contact" && Math.random() < this.contactEvade) {
      this.invulnerable = 0.25;
      this.addBurst(8);
      game.showMessage("深海が見惚れて外した", "#75c8ff");
      return;
    }
    const burstReduction = this.burstActive ? 0.48 : 1;
    const memoryReduction = this.memoryShield > 0 ? 0.65 : 1;
    this.hp -= amount * burstReduction * memoryReduction;
    if (this.hp <= 0 && this.fatalGuard > 0) {
      this.fatalGuard -= 1;
      this.hp = Math.max(18, this.maxHp * 0.18);
      this.invulnerable = 1.4;
      game.flash = 0.75;
      game.showQuote("帰る約束が、致命傷を押し返した。");
      game.showMessage("約束の守護", "#fff0a4");
      return;
    }
    this.invulnerable = 0.55;
    game.shake = Math.min(17, 8 + amount * 0.25);
    game.flash = 0.22;
    game.spark(this.x, this.y, "#ff3f84", 12);
    if (this.hp <= 0) game.gameOver();
  }

  addBurst(amount) { this.burst = clamp(this.burst + amount * this.burstGain, 0, 100); }

  draw(ctx) {
    const light = this.burstActive ? "#ff54cd" : "#4df5ff";
    const pulse = 1 + Math.sin(this.anim * 4) * 0.035;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.sin(this.anim * 1.5) * 0.025);
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = this.invulnerable > 0 && Math.sin(this.anim * 35) > 0 ? 0.45 : 1;
    ctx.shadowColor = light;
    ctx.shadowBlur = this.neonActive || this.burstActive ? 40 : 18;
    ctx.fillStyle = "rgba(13,35,65,.94)";
    ctx.strokeStyle = light;
    ctx.lineWidth = this.burstActive ? 4 : 2.5;
    ctx.beginPath();
    ctx.moveTo(-20, -8);
    ctx.bezierCurveTo(-15, -30, 15, -31, 23, -8);
    ctx.bezierCurveTo(33, 7, 17, 23, 0, 22);
    ctx.bezierCurveTo(-19, 25, -33, 7, -20, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = this.burstActive ? "#fff19b" : "#ac68ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-14, -20);
    ctx.quadraticCurveTo(0, -36, 17, -21);
    ctx.stroke();
    ctx.strokeStyle = "#dbfaff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-13, -7); ctx.lineTo(-4, -9);
    ctx.moveTo(4, -9); ctx.lineTo(14, -7);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-8, -3, 2.2, 0, TAU);
    ctx.arc(8, -3, 2.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#ff70d6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 7, 10, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.rotate(this.aimAngle);
    ctx.strokeStyle = "#ffffff";
    ctx.globalAlpha *= 0.75;
    ctx.beginPath();
    ctx.moveTo(22, 0); ctx.lineTo(31, 0);
    ctx.stroke();
    ctx.restore();
  }
}

// ============================================================
// In-run level upgrades
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
      { icon: "☼", name: "ネオン過剰供給", desc: "通常光量とネオン範囲アップ", apply: p => p.neonPower += 0.32 },
      { icon: "∞", name: "ポジティブ長持ち", desc: "ネオン持続時間 +1.2秒", apply: p => p.neonDuration += 1.2 },
      { icon: "✦", name: "一発では足りない", desc: "発射する弾 +1", apply: p => p.projectileCount = Math.min(5, p.projectileCount + 1) },
      { icon: "↯", name: "逃げ足も才能", desc: "ダッシュ再使用 -18%", apply: p => p.dashCooldownMax *= 0.82 },
      { icon: "100", name: "自意識、急速充電", desc: "バースト獲得量 +28%", apply: p => p.burstGain *= 1.28 },
      { icon: "◎", name: "全部、俺のもの", desc: "アイテム吸引範囲 +45", apply: p => p.magnetRange += 45 },
      { icon: "➹", name: "ネオン超特急", desc: "弾速 +20%、射程 +12%", apply: p => { p.projectileSpeed *= 1.2; p.projectileRange *= 1.12; } },
      { icon: "E", name: "再点灯が早すぎる", desc: "ネオン再使用 -16%", apply: p => p.neonCooldownMax *= 0.84 }
    ];
  }

  show() {
    this.game.state = "levelup";
    const choices = [...this.pool].sort(() => Math.random() - 0.5).slice(0, 3);
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
        this.game.flash = 0.6;
        this.game.ring(this.game.player.x, this.game.player.y, "#80fbff", 34);
        this.game.showMessage(choice.name, "#76f7ff");
      }, { once: true });
      this.container.append(button);
    }
    this.screen.classList.remove("hidden");
  }
}

// ============================================================
// Permanent Dream Tree UI
// ============================================================
class DreamTreeUI {
  constructor(game) {
    this.game = game;
    this.screen = document.querySelector("#dream-tree-screen");
    this.container = document.querySelector("#tree-routes");
    this.feedback = document.querySelector("#tree-feedback");
    this.returnState = "start";
  }

  open(from) {
    this.returnState = from === "gameover" ? "gameover" : "start";
    this.game.state = "tree";
    document.querySelector("#start-screen").classList.add("hidden");
    document.querySelector("#gameover-screen").classList.add("hidden");
    this.render();
    this.screen.classList.remove("hidden");
  }

  close() {
    this.screen.classList.add("hidden");
    this.game.state = this.returnState;
    const selector = this.returnState === "gameover" ? "#gameover-screen" : "#start-screen";
    document.querySelector(selector).classList.remove("hidden");
    this.game.refreshTitle();
  }

  render() {
    document.querySelector("#tree-dreams").textContent = this.game.save.data.dreams;
    this.container.replaceChildren();
    for (const route of TREE_ROUTES) {
      const section = document.createElement("section");
      section.className = "tree-route";
      section.style.setProperty("--route-color", route.color);
      const title = document.createElement("div");
      title.className = "route-title";
      title.innerHTML = `<b>${route.name}</b><small>${route.theme}</small>`;
      const nodes = document.createElement("div");
      nodes.className = "route-nodes";
      route.nodes.forEach((node, index) => {
        const owned = this.game.save.owns(node.id);
        const previousOwned = index === 0 || this.game.save.owns(route.nodes[index - 1].id);
        const affordable = this.game.save.data.dreams >= node.cost;
        const button = document.createElement("button");
        button.className = `tree-node${owned ? " owned" : ""}`;
        button.disabled = owned || !previousOwned || !affordable;
        let reason = `${node.cost} 欠片`;
        if (owned) reason = "取得済み";
        else if (!previousOwned) reason = "前段階の取得が必要";
        else if (!affordable) reason = "夢の欠片が足りません";
        button.innerHTML = `<b>${index + 1}. ${node.name}</b><small>${node.desc}</small><em>${reason}</em>`;
        button.addEventListener("click", () => this.buy(route, node, index));
        nodes.append(button);
      });
      section.append(title, nodes);
      this.container.append(section);
    }
  }

  buy(route, node, index) {
    if (this.game.save.owns(node.id)) return this.say("すでに取得済みです。");
    if (index > 0 && !this.game.save.owns(route.nodes[index - 1].id)) return this.say("前段階の強化が必要です。");
    if (this.game.save.data.dreams < node.cost) return this.say("夢の欠片が足りません。");
    this.game.save.data.dreams -= node.cost;
    this.game.save.data.permanent[node.id] = true;
    this.game.save.save();
    this.say(`${node.name} を取得。次のダイブから反映されます。`, route.color);
    this.render();
  }

  say(text, color = "#ffd17d") {
    this.feedback.textContent = text;
    this.feedback.style.color = color;
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
    this.save = new SaveSystem();
    this.state = "start";
    this.width = 0;
    this.height = 0;
    this.depth = 0;
    this.elapsed = 0;
    this.lastTime = performance.now();
    this.resize();
    this.makeAmbient();
    this.tree = new DreamTreeUI(this);
    this.bindUI();
    this.refreshTitle();
    addEventListener("resize", () => this.resize());
    addEventListener("beforeunload", () => this.save.save());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.save.save();
      this.lastTime = performance.now();
    });
    requestAnimationFrame(time => this.loop(time));
  }

  bindUI() {
    document.querySelector("#start-button").addEventListener("click", () => this.start());
    document.querySelector("#restart-button").addEventListener("click", () => this.start());
    document.querySelector("#title-tree-button").addEventListener("click", () => this.tree.open("start"));
    document.querySelector("#result-tree-button").addEventListener("click", () => this.tree.open("gameover"));
    document.querySelector("#tree-close-button").addEventListener("click", () => this.tree.close());
    document.querySelector("#title-button").addEventListener("click", () => this.toTitle());
    document.querySelector("#reset-save-button").addEventListener("click", () => {
      if (!confirm("夢の欠片・永続強化・全記録を初期化します。元に戻せません。よろしいですか？")) return;
      this.save.reset();
      this.tree.say("セーブデータを初期化しました。", "#ff9db9");
      this.tree.render();
      this.refreshTitle();
    });
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
    this.ambient = Array.from({ length: 72 }, () => ({
      x: rand(0, this.width), y: rand(0, this.height),
      size: rand(0.5, 2.8), speed: rand(4, 18), phase: rand(0, TAU)
    }));
  }

  refreshTitle() {
    const data = this.save.data;
    document.querySelector("#title-record").innerHTML =
      `所持欠片 <b>${data.dreams}</b>　最高深度 <b>${data.maxDepth}m</b>　累計撃破 <b>${data.totalKills}</b>　ダイブ <b>${data.totalPlays}</b>回`;
  }

  start() {
    this.state = "running";
    this.player = new Player(this);
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.items = [];
    this.particles = [];
    this.boss = null;
    this.bossTriggered = false;
    this.elapsed = 0;
    this.depth = 0;
    this.kills = 0;
    this.dreams = 0;
    this.spawnTimer = 0.55;
    this.shake = 0;
    this.flash = 0;
    this.activeEvent = null;
    this.eventTimer = 0;
    this.nextEvent = rand(22, 34);
    this.eventDirection = Math.random() < 0.5 ? -1 : 1;
    this.eventSpawnTimer = 0;
    this.upgrades = new UpgradeSystem(this);
    this.save.data.totalPlays += 1;
    this.save.save();
    this.lastTime = performance.now();
    for (const selector of ["#start-screen", "#gameover-screen", "#upgrade-screen", "#dream-tree-screen"]) {
      document.querySelector(selector).classList.add("hidden");
    }
    document.querySelector("#boss-hud").classList.add("hidden");
    document.querySelector("#event-status").classList.add("hidden");
    document.querySelector("#hud").classList.remove("hidden");
    this.showMessage("深海？ 俺には青いレッドカーペット。", "#6ffaff");
  }

  toTitle() {
    this.state = "start";
    document.querySelector("#gameover-screen").classList.add("hidden");
    document.querySelector("#hud").classList.add("hidden");
    document.querySelector("#start-screen").classList.remove("hidden");
    this.refreshTitle();
  }

  loop(time) {
    const dt = Math.min(0.033, Math.max(0, (time - this.lastTime) / 1000));
    this.lastTime = time;
    if (this.state === "running") this.update(dt);
    else if (this.state === "gameover" && this.input.consume("r")) this.start();
    this.draw(time / 1000);
    this.input.endFrame();
    requestAnimationFrame(next => this.loop(next));
  }

  update(dt) {
    this.elapsed += dt;
    this.depth = Math.floor(this.elapsed * 5.2);
    this.shake = Math.max(0, this.shake - dt * 25);
    this.flash = Math.max(0, this.flash - dt * 1.8);
    this.updateAmbient(dt);
    this.updateEvent(dt);
    this.player.update(dt, this);
    if (!this.bossTriggered && this.depth >= 300) this.spawnBoss();
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      const danger = this.player.lightLevel + (this.player.burstActive ? 0.7 : 0);
      const depthPressure = Math.min(1.15, this.depth / 900);
      const eventFactor = this.activeEvent?.spawnFactor ?? 1;
      const bossFactor = this.boss && !this.boss.dead ? 1.8 : 1;
      this.spawnTimer = Math.max(0.26, 0.88 - depthPressure * 0.31 - danger * 0.26) * rand(0.78, 1.24) * bossFactor / eventFactor;
    }
    for (const enemy of this.enemies) enemy.update(dt, this);
    if (this.boss && !this.boss.dead) this.boss.update(dt, this);
    for (const projectile of this.projectiles) projectile.update(dt, this);
    for (const projectile of this.enemyProjectiles) projectile.update(dt, this);
    for (const item of this.items) item.update(dt, this);
    for (const particle of this.particles) particle.update(dt);
    this.enemies = this.enemies.filter(enemy => !enemy.dead && enemy.x > -250 && enemy.x < this.width + 250 && enemy.y > -250 && enemy.y < this.height + 250);
    this.projectiles = this.projectiles.filter(projectile => !projectile.dead);
    this.enemyProjectiles = this.enemyProjectiles.filter(projectile => !projectile.dead);
    this.items = this.items.filter(item => !item.dead);
    this.particles = this.particles.filter(particle => particle.life > 0);
    if (this.enemies.length > 115) this.enemies.splice(0, this.enemies.length - 115);
    if (this.particles.length > 420) this.particles.splice(0, this.particles.length - 420);
    if (this.depth > this.save.data.maxDepth && this.depth % 10 === 0) {
      this.save.data.maxDepth = this.depth;
      this.save.save();
    }
    this.updateHUD();
  }

  updateAmbient(dt) {
    const eventBoost = this.activeEvent?.id === "storm" ? 2.2 : 1;
    for (const mote of this.ambient) {
      mote.y -= mote.speed * dt * eventBoost;
      mote.x += Math.sin(this.elapsed * 0.35 + mote.phase) * dt * 7;
      if (this.activeEvent?.id === "current") mote.x += this.eventDirection * 110 * dt;
      if (mote.y < -5 || mote.x < -10 || mote.x > this.width + 10) {
        mote.y = this.height + 5;
        mote.x = rand(0, this.width);
      }
    }
  }

  updateEvent(dt) {
    if (this.activeEvent) {
      this.eventTimer -= dt;
      this.eventSpawnTimer -= dt;
      if (this.activeEvent.id === "bubbles" && this.eventSpawnTimer <= 0) {
        this.eventSpawnTimer = 0.38;
        this.items.push(new Item(rand(45, this.width - 45), rand(70, this.height - 45), "xp", 1));
        if (Math.random() < 0.22) this.spawnEnemy("blob");
      } else if (this.activeEvent.id === "storm" && this.eventSpawnTimer <= 0) {
        this.eventSpawnTimer = 0.7;
        this.items.push(new Item(rand(45, this.width - 45), rand(70, this.height - 45), Math.random() < 0.15 ? "dream" : "xp", 1));
      }
      if (this.eventTimer <= 0) this.endEvent();
    } else if (!this.boss || this.boss.dead) {
      this.nextEvent -= dt;
      if (this.nextEvent <= 0) this.startRandomEvent();
    }
  }

  startRandomEvent(forceId = null) {
    const events = [
      { id: "current", name: "暗流", duration: 13, spawnFactor: 1 },
      { id: "storm", name: "ネオン嵐", duration: 12, spawnFactor: 1.55 },
      { id: "silence", name: "静寂の層", duration: 14, spawnFactor: 0.35 },
      { id: "bubbles", name: "夢の泡群", duration: 12, spawnFactor: 1.25 }
    ];
    this.activeEvent = forceId ? events.find(event => event.id === forceId) || pick(events) : pick(events);
    this.eventTimer = this.activeEvent.duration;
    this.eventSpawnTimer = 0;
    this.eventDirection = Math.random() < 0.5 ? -1 : 1;
    document.querySelector("#event-status").classList.remove("hidden");
    this.showMessage(`深海イベント：${this.activeEvent.name}`, "#ff83dd");
    this.flash = 0.42;
  }

  endEvent() {
    this.showMessage(`${this.activeEvent.name}、通過`, "#89a7c9");
    this.activeEvent = null;
    this.nextEvent = rand(30, 48);
    document.querySelector("#event-status").classList.add("hidden");
  }

  spawnEnemy(forcedType = null) {
    const side = (Math.random() * 4) | 0;
    const margin = 55;
    let x;
    let y;
    if (side === 0) { x = rand(0, this.width); y = -margin; }
    else if (side === 1) { x = this.width + margin; y = rand(0, this.height); }
    else if (side === 2) { x = rand(0, this.width); y = this.height + margin; }
    else { x = -margin; y = rand(0, this.height); }
    const danger = this.player.lightLevel + (this.player.burstActive ? 0.65 : 0);
    const progress = clamp(this.depth / 1000, 0, 1);
    const roll = Math.random();
    let type = forcedType || "fish";
    if (!forcedType) {
      if (roll < 0.09 + progress * 0.2 + danger * 0.09) type = "blob";
      else if (roll < 0.34 + danger * 0.22 + progress * 0.1) type = "jelly";
    }
    const difficulty = 1 + this.depth / 900;
    const eliteChance = clamp(0.012 + progress * 0.075 + danger * 0.035, 0, 0.16);
    this.enemies.push(new Enemy(x, y, type, difficulty, Math.random() < eliteChance));
  }

  spawnBoss() {
    this.bossTriggered = true;
    if (this.activeEvent) this.endEvent();
    this.boss = new JellyKing(this);
    this.enemyProjectiles.length = 0;
    document.querySelector("#boss-hud").classList.remove("hidden");
    const warning = document.querySelector("#boss-warning");
    warning.classList.remove("hidden");
    warning.style.animation = "none";
    void warning.offsetWidth;
    warning.style.animation = "";
    setTimeout(() => warning.classList.add("hidden"), 2800);
    this.shake = 16;
    this.flash = 0.65;
  }

  onEnemyKilled(enemy) {
    this.kills += 1;
    this.save.data.totalKills += 1;
    if (this.kills % 5 === 0) this.save.save();
    const player = this.player;
    player.addBurst(7 + enemy.xp * 1.4);
    if (player.neonActive) {
      player.neonKillChain += 1;
      player.neonChainTimer = 1.5;
      player.addBurst(2 + player.neonKillChain * 0.65);
      if (player.neonKillChain === 4) this.showMessage("輝きの連鎖 ×4", "#5ffcff");
      if (player.neonKillChain === 8) this.showMessage("深海が俺を見ている ×8", "#ff5bd5");
    }
    for (let i = 0; i < enemy.xp; i++) this.items.push(new Item(enemy.x + rand(-12, 12), enemy.y + rand(-12, 12), "xp", 1));
    if (enemy.type === "blob" && Math.random() < 0.56 + player.rareBonus) this.items.push(new Item(enemy.x, enemy.y, "dream", 1));
    const rareBoost = clamp(this.depth / 3000, 0, 0.08) + player.rareBonus;
    if (Math.random() < 0.012 + rareBoost) this.items.push(new Item(enemy.x + 8, enemy.y, "memory", 1));
    if (enemy.elite && Math.random() < 0.42 + player.rareBonus) this.items.push(new Item(enemy.x - 8, enemy.y, "dream", 1));
    this.spark(enemy.x, enemy.y, enemy.color, enemy.elite ? 23 : 13);
    this.ring(enemy.x, enemy.y, enemy.color, enemy.elite ? 15 : 9);
  }

  onBossKilled(boss) {
    document.querySelector("#boss-hud").classList.add("hidden");
    this.enemyProjectiles.length = 0;
    this.save.data.records.bossKills += 1;
    const first = !this.save.data.unlocks.jellyKingDefeated;
    this.save.data.unlocks.jellyKingDefeated = true;
    const reward = first ? 10 : 7;
    this.dreams += reward;
    this.save.data.dreams += reward;
    this.save.save();
    this.addXp(28);
    this.items.push(new Item(boss.x, boss.y, "memory", 1));
    for (let i = 0; i < 16; i++) this.items.push(new Item(boss.x + rand(-75, 75), boss.y + rand(-55, 55), "xp", 1));
    this.spark(boss.x, boss.y, "#ff52ce", 70);
    for (let i = 0; i < 5; i++) this.ring(boss.x, boss.y, i % 2 ? "#ffe56d" : "#ff4fce", 32 + i * 16);
    this.shake = 24;
    this.flash = 1;
    this.showMessage(`クラゲ・キング撃破！ 夢の欠片 +${reward}`, "#ffe676");
    if (first) setTimeout(() => this.showQuote("王を越えた光が、夢ツリーに記録された。"), 900);
  }

  addXp(amount) {
    const player = this.player;
    player.xp += amount;
    if (player.xp >= player.xpNeeded && this.state === "running") {
      player.xp -= player.xpNeeded;
      player.level += 1;
      player.xpNeeded = Math.floor(7 + player.level * 4.5);
      player.hp = Math.min(player.maxHp, player.hp + 9);
      this.flash = 0.52;
      this.upgrades.show();
    }
  }

  damageArea(x, y, radius, damage, ignored = null) {
    const hostiles = this.boss && !this.boss.dead ? [...this.enemies, this.boss] : this.enemies;
    for (const enemy of hostiles) {
      if (enemy !== ignored && !enemy.dead && Math.hypot(x - enemy.x, y - enemy.y) < radius + enemy.radius) enemy.takeDamage(damage, this);
    }
  }

  explode(x, y, damage, ignored) {
    this.damageArea(x, y, 82, damage, ignored);
    this.ring(x, y, "#ff944d", 18);
    this.spark(x, y, "#ffb74f", 15);
    this.shake = Math.max(this.shake, 5);
  }

  spark(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, TAU);
      const speed = rand(35, 185);
      this.particles.push(new Particle(x, y, {
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        color, life: rand(0.25, 0.75), size: rand(1.5, 4.5)
      }));
    }
  }

  ring(x, y, color, size) {
    this.particles.push(new Particle(x, y, { vx: 0, vy: 0, color, life: 0.65, size, ring: true, drag: 0, glow: 22 }));
  }

  showMessage(text, color = "#55f8ff") {
    const element = document.querySelector("#message");
    element.textContent = text;
    element.style.color = color;
    element.classList.remove("hidden");
    element.style.animation = "none";
    void element.offsetWidth;
    element.style.animation = "";
    clearTimeout(this.messageTimeout);
    this.messageTimeout = setTimeout(() => element.classList.add("hidden"), 1700);
  }

  showQuote(text) {
    const element = document.querySelector("#quote");
    element.textContent = `「${text}」`;
    element.classList.remove("hidden");
    element.style.animation = "none";
    void element.offsetWidth;
    element.style.animation = "";
    clearTimeout(this.quoteTimeout);
    this.quoteTimeout = setTimeout(() => element.classList.add("hidden"), 2600);
  }

  resultRank() {
    const score = this.depth + this.kills * 4 + (this.boss?.dead ? 250 : 0);
    if (score >= 700) return { rank: "S", comment: "ネオン深海の主役" };
    if (score >= 480) return { rank: "A", comment: "深海のイケメン" };
    if (score >= 280) return { rank: "B", comment: "けっこう光ってた" };
    if (score >= 130) return { rank: "C", comment: "まだ沈みがち" };
    return { rank: "D", comment: "海にツッコんだだけ" };
  }

  gameOver() {
    if (this.state !== "running") return;
    this.state = "gameover";
    this.player.hp = 0;
    this.save.data.maxDepth = Math.max(this.save.data.maxDepth, this.depth);
    this.save.data.records.bestKills = Math.max(this.save.data.records.bestKills, this.kills);
    this.save.data.records.bestTime = Math.max(this.save.data.records.bestTime, Math.floor(this.elapsed));
    this.save.save();
    document.querySelector("#hud").classList.add("hidden");
    const result = this.resultRank();
    document.querySelector("#result-rank").textContent = result.rank;
    document.querySelector("#result-quote").textContent = `「${result.comment}」`;
    document.querySelector("#result-depth").textContent = `${this.depth}m`;
    document.querySelector("#result-best-depth").textContent = `${this.save.data.maxDepth}m`;
    document.querySelector("#result-kills").textContent = this.kills;
    document.querySelector("#result-total-kills").textContent = this.save.data.totalKills;
    document.querySelector("#result-level").textContent = this.player.level;
    document.querySelector("#result-dreams").textContent = this.dreams;
    document.querySelector("#result-total-dreams").textContent = this.save.data.dreams;
    document.querySelector("#result-time").textContent = formatTime(this.elapsed);
    document.querySelector("#gameover-screen").classList.remove("hidden");
  }

  updateHUD() {
    const player = this.player;
    document.querySelector("#hp-bar").style.width = `${clamp(player.hp / player.maxHp * 100, 0, 100)}%`;
    document.querySelector("#hp-text").textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
    document.querySelector("#xp-bar").style.width = `${player.xp / player.xpNeeded * 100}%`;
    document.querySelector("#level-text").textContent = `LV.${player.level}`;
    document.querySelector("#neon-bar").style.width = `${player.lightLevel * 100}%`;
    document.querySelector("#neon-text").textContent = player.burstActive ? "MAXIMUM" : player.neonActive ? "HIGH RISK" : player.afterglow > 0 ? "DIM" : "LOW";
    document.querySelector("#burst-bar").style.width = `${player.burst}%`;
    document.querySelector("#burst-text").textContent = `${Math.floor(player.burst)}%`;
    document.querySelector("#depth-text").textContent = `深度：${this.depth}m`;
    document.querySelector("#time-text").textContent = formatTime(this.elapsed);
    document.querySelector("#dream-text").textContent = this.dreams;
    document.querySelector("#kill-text").textContent = this.kills;
    this.setAbility("#ability-neon", player.neonActive ? `${player.neonTimer.toFixed(1)}s` : player.neonCooldown > 0 ? `${player.neonCooldown.toFixed(1)}s` : "READY", player.neonCooldown <= 0 && !player.neonActive);
    this.setAbility("#ability-dash", player.dashCooldown > 0 ? `${player.dashCooldown.toFixed(1)}s` : "READY", player.dashCooldown <= 0);
    this.setAbility("#ability-burst", player.burstActive ? `${player.burstTimer.toFixed(1)}s` : `${Math.floor(player.burst)}%`, player.burst >= 100);
    if (this.activeEvent) document.querySelector("#event-status").textContent = `${this.activeEvent.name} ${Math.ceil(this.eventTimer)}s`;
    if (this.boss && !this.boss.dead) document.querySelector("#boss-bar").style.width = `${clamp(this.boss.hp / this.boss.maxHp * 100, 0, 100)}%`;
  }

  setAbility(selector, text, ready) {
    const element = document.querySelector(selector);
    element.querySelector("small").textContent = text;
    element.classList.toggle("ready", ready);
    element.classList.toggle("cooling", !ready);
  }

  visibilityAt(entity) {
    if (!this.player) return 0.15;
    const baseDarkness = clamp(this.depth / 1300, 0, 0.34);
    const adaptedDarkness = baseDarkness * (1 - this.player.darknessAdapt);
    const silence = this.activeEvent?.id === "silence" ? 0.62 : 1;
    const radius = (145 + this.player.lightLevel * 395 * this.player.neonPower) * (1 - adaptedDarkness) * silence;
    const d = distance(entity, this.player);
    return clamp(1 - (d - radius * 0.55) / (radius * 0.65), 0.06, 1);
  }

  draw(time) {
    const ctx = this.ctx;
    const depthShade = this.depth ? clamp(this.depth / 1250, 0, 0.56) : 0;
    const bossTint = this.boss && !this.boss.dead ? 13 : 0;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, `rgb(${3 + bossTint}, ${13 - depthShade * 7}, ${31 + bossTint})`);
    gradient.addColorStop(1, `rgb(${1 + bossTint * 0.4}, ${5 - depthShade * 3}, ${18 + bossTint * 0.6})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    this.drawBackground(ctx, time);
    if (!this.player) return;
    const sx = this.shake ? rand(-this.shake, this.shake) : 0;
    const sy = this.shake ? rand(-this.shake, this.shake) : 0;
    ctx.save();
    ctx.translate(sx, sy);
    const lightRadius = 150 + this.player.lightLevel * 390 * this.player.neonPower;
    const glow = ctx.createRadialGradient(this.player.x, this.player.y, 10, this.player.x, this.player.y, lightRadius);
    glow.addColorStop(0, this.player.burstActive ? "rgba(255,60,200,.19)" : "rgba(45,220,255,.16)");
    glow.addColorStop(0.55, "rgba(18,82,145,.06)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, this.width, this.height);
    for (const item of this.items) item.draw(ctx, this.visibilityAt(item));
    for (const enemy of this.enemies) enemy.draw(ctx, this.visibilityAt(enemy));
    if (this.boss && !this.boss.dead) this.boss.draw(ctx, Math.max(0.25, this.visibilityAt(this.boss)));
    for (const projectile of this.projectiles) projectile.draw(ctx);
    for (const projectile of this.enemyProjectiles) projectile.draw(ctx);
    for (const particle of this.particles) particle.draw(ctx);
    this.player.draw(ctx);
    this.drawAim(ctx);
    ctx.restore();
    if (this.player.burstActive) {
      const wash = ctx.createRadialGradient(this.player.x, this.player.y, 20, this.player.x, this.player.y, Math.max(this.width, this.height));
      wash.addColorStop(0, "rgba(255,80,215,.12)");
      wash.addColorStop(0.55, "rgba(45,175,255,.045)");
      wash.addColorStop(1, "rgba(125,30,180,.08)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    if (this.activeEvent?.id === "silence") {
      ctx.fillStyle = "rgba(0,0,18,.2)";
      ctx.fillRect(0, 0, this.width, this.height);
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(${this.boss && !this.boss.dead ? "255,80,205" : "110,240,255"},${this.flash * 0.28})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawBackground(ctx, time) {
    ctx.save();
    const storm = this.activeEvent?.id === "storm";
    for (const mote of this.ambient) {
      const alpha = (storm ? 0.28 : 0.12) + Math.sin(time + mote.phase) * 0.05;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = storm && mote.size > 1.5 ? "#ff57d4" : mote.size > 1.8 ? "#43b9de" : "#607aab";
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.size * (storm ? 1.45 : 1), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = this.boss && !this.boss.dead ? 0.16 : 0.08;
    ctx.strokeStyle = this.boss && !this.boss.dead ? "#ff42c7" : "#40d6f2";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (i * 190 + time * (7 + i)) % (this.height + 200) - 100;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(this.width * 0.3, y + 25, this.width * 0.7, y - 20, this.width, y + 5);
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

const game = new Game();
// Small test surface for smoke tests and future balancing tools.
window.AMESEA = {
  game,
  version: "2.0.0",
  forceDepth(value) {
    game.elapsed = Math.max(0, Number(value) || 0) / 5.2;
    game.depth = Math.floor(game.elapsed * 5.2);
  },
  forceEvent(id) {
    if (game.state === "running") game.startRandomEvent(id);
  }
};
