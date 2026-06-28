"use strict";

// ============================================================
// AMESEA Development 3
// Additive systems layered over the Development 2 game.
// ============================================================
(() => {
  const baseGame = window.AMESEA?.game;
  if (!baseGame) {
    console.error("AMESEA Development 3: main.js was not initialized.");
    return;
  }

  const PHASE3_KEY = "amesea_neon_abyss_phase3_v1";
  const P3_VERSION = 1;

  const DIFFICULTIES = {
    casual: {
      id: "casual", name: "CASUAL", hp: 0.74, speed: 0.87, damage: 0.72,
      spawn: 0.82, dreamDrop: 0.72, rare: -0.006, xp: 1.14, playerHp: 1.16
    },
    normal: {
      id: "normal", name: "NORMAL", hp: 1, speed: 1, damage: 1,
      spawn: 1, dreamDrop: 1, rare: 0, xp: 1, playerHp: 1
    },
    deep: {
      id: "deep", name: "DEEP", hp: 1.42, speed: 1.18, damage: 1.32,
      spawn: 1.34, dreamDrop: 1.42, rare: 0.038, xp: 0.96, playerHp: 0.94
    }
  };

  const ZONES = [
    {
      id: "neon_shallows", name: "ネオン浅層", range: "0m〜299m",
      min: 0, max: 299, accent: "#55f7ff",
      colors: ["#051b35", "#020918"], visibility: 1, events: 0.9,
      message: "光の欠片が漂う、最初の海。",
      weights: { fish: 57, jelly: 20, blob: 6, mirror: 10, angler: 4, eel: 3, clown: 0 }
    },
    {
      id: "silent_mid", name: "沈黙中層", range: "300m〜699m",
      min: 300, max: 699, accent: "#4f8dff",
      colors: ["#061329", "#01040f"], visibility: 0.76, events: 1.28,
      message: "音が消え、敵だけがこちらを見る。",
      weights: { fish: 30, jelly: 33, blob: 8, mirror: 10, angler: 13, eel: 6, clown: 0 }
    },
    {
      id: "dream_eater_deep", name: "夢喰い深層", range: "700m〜1199m",
      min: 700, max: 1199, accent: "#ba5cff",
      colors: ["#160a31", "#02000e"], visibility: 0.68, events: 1.65,
      message: "夢は餌になる。先に拾え。",
      weights: { fish: 18, jelly: 19, blob: 27, mirror: 11, angler: 11, eel: 9, clown: 5 }
    },
    {
      id: "family_abyss", name: "家族記憶の最深層", range: "1200m〜",
      min: 1200, max: Infinity, accent: "#ff5ed8",
      colors: ["#14051d", "#000006"], visibility: 0.58, events: 1.82,
      message: "暗闇の底で、帰る場所だけが光る。",
      weights: { fish: 12, jelly: 19, blob: 22, mirror: 13, angler: 13, eel: 11, clown: 10 }
    }
  ];

  const NEW_ENEMY_DATA = {
    mirror: {
      name: "ミラーネオン", hp: 54, speed: 112, damage: 13, radius: 19,
      color: "#5dfff4", xp: 3, desc: "少し前のプレイヤー位置を追う。光が強いほど複製を作りやすい。"
    },
    angler: {
      name: "水圧アンコウ", hp: 74, speed: 56, damage: 16, radius: 24,
      color: "#ffb74f", xp: 4, desc: "遠距離で予兆線を出し、高速の水圧弾を撃つ。"
    },
    eel: {
      name: "ネオン喰いウツボ", hp: 68, speed: 126, damage: 14, radius: 21,
      color: "#78ff72", xp: 4, desc: "落ちている欠片を奪う。倒せば食べたものを吐き出す。"
    },
    clown: {
      name: "深海ピエロクラゲ", hp: 92, speed: 68, damage: 18, radius: 25,
      color: "#ff63d8", xp: 6, desc: "ワープと偽物で狙いを惑わせる。レアドロップを持つ。"
    }
  };

  const SYNERGIES = {
    neon: {
      id: "neon", name: "ネオン過剰", icon: "☼", color: "#55f8ff", threshold: 2,
      desc: "光量に応じて攻撃力最大+35%。敵の出現も増える。"
    },
    baka: {
      id: "baka", name: "バカ突進", icon: "↯", color: "#ff9b50", threshold: 2,
      desc: "ダッシュ終了時に爆発。撃破でダッシュ再使用を短縮。"
    },
    kindness: {
      id: "kindness", name: "優しさ守護", icon: "♥", color: "#ffe999", threshold: 2,
      desc: "瀕死時に守護バリア。家族の記憶で敵を減速。"
    },
    ikemen: {
      id: "ikemen", name: "イケメン回避", icon: "◇", color: "#75aaff", threshold: 2,
      desc: "ギリギリ回避でカウンター弾とバーストを得る。"
    },
    abyss: {
      id: "abyss", name: "深海適応", icon: "◎", color: "#b37aff", threshold: 2,
      desc: "視界悪化を軽減し、レアアイテム率を上げる。"
    }
  };

  const MISSION_DEFS = [
    { id: "depth300", label: "300mに到達する", target: 300, dream: 2, xp: 7, progress: g => g.depth },
    { id: "fish30", label: "ネガフィッシュを30体倒す", target: 30, dream: 2, xp: 8, progress: g => g.phase3.metrics.fishKills },
    { id: "neon10", label: "ポジティブ・ネオン中に10体倒す", target: 10, dream: 2, xp: 7, progress: g => g.phase3.metrics.neonKills },
    { id: "dash5", label: "ダッシュで敵を5体すり抜ける", target: 5, dream: 2, xp: 6, progress: g => g.phase3.metrics.dashPasses },
    { id: "memory2", label: "家族の記憶を2個拾う", target: 2, dream: 3, xp: 7, progress: g => g.phase3.metrics.memories },
    { id: "dream3", label: "夢の欠片を3個集める", target: 3, dream: 2, xp: 5, progress: g => g.phase3.metrics.dreamCollected },
    { id: "boss1", label: "ボスを1体倒す", target: 1, dream: 3, xp: 10, progress: g => g.phase3.metrics.bosses },
    { id: "low30", label: "HP30%以下で30秒生き残る", target: 30, dream: 3, xp: 9, progress: g => g.phase3.metrics.lowHpSeconds }
  ];

  const ACHIEVEMENTS = [
    { id: "depth100", name: "まだ浅い顔", desc: "初めて100mに到達", reward: 1, test: (g, s) => Math.max(g.depth, s.records.maxEverDepth) >= 100 },
    { id: "depth300", name: "沈黙へようこそ", desc: "初めて300mに到達", reward: 2, test: (g, s) => Math.max(g.depth, s.records.maxEverDepth) >= 300 },
    { id: "depth1000", name: "夢の底を見た", desc: "初めて1000mに到達", reward: 3, test: (g, s) => Math.max(g.depth, s.records.maxEverDepth) >= 1000 },
    { id: "kills100", name: "ネオン掃除人", desc: "累計100体撃破", reward: 1, test: g => g.save.data.totalKills >= 100 },
    { id: "kills1000", name: "深海の生態系変更", desc: "累計1000体撃破", reward: 3, test: g => g.save.data.totalKills >= 1000 },
    { id: "treeFirst", name: "夢は根を張る", desc: "夢ツリーを初めて解放", reward: 1, test: g => Object.values(g.save.data.permanent).some(Boolean) },
    { id: "jellyKing", name: "承認、不要", desc: "承認欲求クラゲ・キングを撃破", reward: 2, test: (g, s) => s.stats.jellyBossKills >= 1 || g.save.data.unlocks.jellyKingDefeated },
    { id: "burst50", name: "自意識の嵐", desc: "自意識バースト中に累計50体撃破", reward: 2, test: (g, s) => s.stats.burstKills >= 50 },
    { id: "memory20", name: "帰る場所の光", desc: "家族の記憶を累計20個拾う", reward: 3, test: (g, s) => s.stats.memories >= 20 },
    { id: "runDream10", name: "夢を抱えすぎた男", desc: "1プレイで夢の欠片を10個拾う", reward: 2, test: g => (g.phase3?.metrics.dreamCollected || 0) >= 10 },
    { id: "abyssBoss", name: "夢喰いを喰う", desc: "夢喰いニュウドウ・アビスを撃破", reward: 4, test: (g, s) => s.stats.abyssBossKills >= 1 },
    { id: "deep700", name: "水圧は飾り", desc: "DEEPで700mに到達", reward: 3, test: (g, s) => s.records.deep.maxDepth >= 700 || (g.difficultyId === "deep" && g.depth >= 700) },
    { id: "fiveSynergies", name: "全部盛りユウタ", desc: "1プレイで5シナジーを発動", reward: 4, test: g => (g.phase3?.activeSynergies.size || 0) >= 5 }
  ];

  const CATALOG = {
    enemies: [
      { id: "enemy_fish", name: "ネガフィッシュ", color: "#4b8cff", desc: "群れで寄ってくる基本敵。まっすぐだが油断は禁物。" },
      { id: "enemy_jelly", name: "承認欲求クラゲ", color: "#ff55d4", desc: "プレイヤーの光に敏感に反応するクラゲ。" },
      { id: "enemy_blob", name: "夢喰いニュウドウ", color: "#a85fff", desc: "不規則な間合いを取り、夢の欠片を落としやすい。" },
      ...Object.entries(NEW_ENEMY_DATA).map(([id, data]) => ({
        id: `enemy_${id}`, name: data.name, color: data.color, desc: data.desc
      }))
    ],
    bosses: [
      { id: "boss_jelly", name: "承認欲求クラゲ・キング", color: "#ff55cd", desc: "300mで出現。弾幕と配下召喚で承認を迫る。" },
      { id: "boss_abyss", name: "夢喰いニュウドウ・アビス", color: "#b45cff", desc: "700mで出現。吸引、暗闇、突進を操る夢喰いの王。" }
    ],
    items: [
      { id: "item_xp", name: "ネオン欠片", color: "#4df6ff", desc: "経験値を得る。ネオン浅層では多めに出現。" },
      { id: "item_dream", name: "夢の欠片", color: "#c957ff", desc: "夢ツリーに使う永続通貨。" },
      { id: "item_memory", name: "家族の記憶", color: "#fff0a2", desc: "HPを回復し、守護系効果を呼び起こす。" }
    ],
    events: [
      { id: "event_current", name: "暗流", color: "#4ea7ff", desc: "海流が全員を横へ押し流す。" },
      { id: "event_storm", name: "ネオン嵐", color: "#ff56d4", desc: "敵と欠片が増える、危険な稼ぎ時。" },
      { id: "event_silence", name: "静寂の層", color: "#6c79aa", desc: "視界と出現が絞られる静かな層。" },
      { id: "event_bubbles", name: "夢の泡群", color: "#a65cff", desc: "経験値と夢喰いが次々に現れる。" }
    ],
    synergies: Object.values(SYNERGIES).map(s => ({
      id: `synergy_${s.id}`, name: s.name, color: s.color, desc: s.desc
    }))
  };

  const makePhase3Save = () => ({
    version: P3_VERSION,
    achievements: {},
    encounters: {},
    records: {
      casual: { maxDepth: 0, bestKills: 0, bestTime: 0 },
      normal: { maxDepth: 0, bestKills: 0, bestTime: 0 },
      deep: { maxDepth: 0, bestKills: 0, bestTime: 0 },
      maxEverDepth: 0
    },
    stats: {
      burstKills: 0, memories: 0, jellyBossKills: 0, abyssBossKills: 0,
      missionsCompleted: 0
    },
    settings: { difficulty: "normal" }
  });

  function sanitizedPhase3Save(parsed) {
    const fresh = makePhase3Save();
    if (!parsed || typeof parsed !== "object") return fresh;
    for (const id of ACHIEVEMENTS.map(item => item.id)) fresh.achievements[id] = parsed.achievements?.[id] === true;
    for (const category of Object.values(CATALOG)) {
      for (const entry of category) fresh.encounters[entry.id] = parsed.encounters?.[entry.id] === true;
    }
    for (const id of Object.keys(DIFFICULTIES)) {
      const source = parsed.records?.[id] || {};
      fresh.records[id].maxDepth = safeNumber(source.maxDepth);
      fresh.records[id].bestKills = safeNumber(source.bestKills);
      fresh.records[id].bestTime = safeNumber(source.bestTime);
    }
    fresh.records.maxEverDepth = safeNumber(parsed.records?.maxEverDepth);
    for (const key of Object.keys(fresh.stats)) fresh.stats[key] = safeNumber(parsed.stats?.[key]);
    fresh.settings.difficulty = DIFFICULTIES[parsed.settings?.difficulty] ? parsed.settings.difficulty : "normal";
    return fresh;
  }

  function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
  }

  function loadPhase3Save() {
    try {
      return sanitizedPhase3Save(JSON.parse(localStorage.getItem(PHASE3_KEY) || "null"));
    } catch (error) {
      console.warn("AMESEA Development 3: 追加セーブを初期化しました。", error);
      return makePhase3Save();
    }
  }

  let phase3Save = loadPhase3Save();

  function savePhase3() {
    try {
      localStorage.setItem(PHASE3_KEY, JSON.stringify(phase3Save));
      return true;
    } catch (error) {
      console.warn("AMESEA Development 3: 追加セーブに失敗しました。", error);
      return false;
    }
  }

  function resetPhase3Save() {
    phase3Save = makePhase3Save();
    savePhase3();
  }

  function zoneAt(depth) {
    return ZONES.find(zone => depth >= zone.min && depth <= zone.max) || ZONES[ZONES.length - 1];
  }

  function weightedPick(weights) {
    const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;
    for (const [id, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return id;
    }
    return entries[0]?.[0] || "fish";
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function encounter(id) {
    if (phase3Save.encounters[id]) return;
    phase3Save.encounters[id] = true;
    savePhase3();
  }

  function notify(title, text, color = "#5df5ff") {
    const stack = document.querySelector("#notification-stack");
    if (!stack) return;
    const note = document.createElement("div");
    note.className = "phase3-notification";
    note.style.setProperty("--note-color", color);
    note.innerHTML = `<b>${title}</b><span>${text}</span>`;
    stack.prepend(note);
    while (stack.children.length > 3) stack.lastElementChild.remove();
    setTimeout(() => {
      note.classList.add("out");
      setTimeout(() => note.remove(), 300);
    }, 2600);
  }

  // ============================================================
  // New enemy family
  // ============================================================
  class Phase3Enemy extends Enemy {
    constructor(x, y, type, difficulty, difficultyConfig, elite = false, options = {}) {
      super(x, y, "fish", Math.max(1, difficulty), elite);
      const data = NEW_ENEMY_DATA[type];
      this.type = type;
      this.radius = data.radius * (elite ? 1.16 : 1);
      this.maxHp = data.hp * difficulty * difficultyConfig.hp * (elite ? 1.65 : 1);
      this.hp = this.maxHp;
      this.speed = data.speed * difficultyConfig.speed * (1 + Math.max(0, difficulty - 1) * 0.12);
      this.damage = data.damage * difficultyConfig.damage * Math.sqrt(difficulty) * (elite ? 1.28 : 1);
      this.color = elite ? "#ffe06a" : data.color;
      this.xp = data.xp + (elite ? 3 : 0);
      this.p3Scaled = true;
      this.depthBorn = options.depth || 0;
      this.history = [];
      this.skillTimer = rand(1.2, 3);
      this.chargeTimer = 0;
      this.chargeTarget = null;
      this.warpTimer = rand(2.2, 4.2);
      this.decoys = [];
      this.eaten = [];
      this.mirrorClone = Boolean(options.mirrorClone);
      this.noReward = this.mirrorClone;
      this.cloneCooldown = rand(4, 7);
      if (this.mirrorClone) {
        this.maxHp *= 0.34;
        this.hp = this.maxHp;
        this.radius *= 0.78;
        this.color = "#6da9bb";
      }
      encounter(`enemy_${type}`);
    }

    update(dt, game) {
      const player = game.player;
      const slow = game.phase3?.kindnessSlowTimer > 0 ? 0.52 : 1;
      this.phase += dt * (this.type === "clown" ? 5.2 : 2.4);
      this.hitFlash = Math.max(0, this.hitFlash - dt);
      this.attackCooldown -= dt;
      this.stunned = Math.max(0, this.stunned - dt);
      if (game.activeEvent?.id === "current") this.x += game.eventDirection * 82 * dt;
      if (this.stunned > 0) return;
      if (this.type === "mirror") this.updateMirror(dt, game, slow);
      else if (this.type === "angler") this.updateAngler(dt, game, slow);
      else if (this.type === "eel") this.updateEel(dt, game, slow);
      else this.updateClown(dt, game, slow);
      const d = distance(this, player);
      if (d < this.radius + player.radius && this.attackCooldown <= 0) {
        this.attackCooldown = this.type === "clown" ? 1.15 : 0.78;
        player.takeDamage(this.damage, game, "contact");
      }
    }

    moveToward(targetX, targetY, speed, dt, orbit = 0) {
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      this.x += (dx / d + Math.cos(this.phase) * orbit) * speed * dt;
      this.y += (dy / d + Math.sin(this.phase) * orbit) * speed * dt;
      return d;
    }

    updateMirror(dt, game, slow) {
      this.history.push({ x: game.player.x, y: game.player.y });
      if (this.history.length > 34) this.history.shift();
      const delayed = this.history[0] || game.player;
      this.moveToward(delayed.x, delayed.y, this.speed * slow, dt, 0.08);
      this.cloneCooldown -= dt;
      if (!this.mirrorClone && game.player.lightLevel > 0.72 && this.cloneCooldown <= 0 && game.enemies.length < 100) {
        this.cloneCooldown = rand(6, 9);
        const chance = 0.38 + game.player.lightLevel * 0.3;
        if (Math.random() < chance) {
          const clone = new Phase3Enemy(
            this.x + rand(-28, 28), this.y + rand(-28, 28), "mirror",
            1 + game.depth / 1000, game.difficulty, false,
            { mirrorClone: true, depth: game.depth }
          );
          game.enemies.push(clone);
          game.ring(this.x, this.y, "#59fff0", 17);
        }
      }
    }

    updateAngler(dt, game, slow) {
      const player = game.player;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      if (this.chargeTimer > 0) {
        this.chargeTimer -= dt;
        if (this.chargeTimer <= 0 && this.chargeTarget) {
          const angle = Math.atan2(this.chargeTarget.y - this.y, this.chargeTarget.x - this.x);
          const depthSpeed = 235 + Math.min(230, game.depth * 0.13);
          game.enemyProjectiles.push(new EnemyProjectile(
            this.x, this.y, angle, depthSpeed * game.difficulty.speed,
            this.damage * 0.9, "#ffbd54"
          ));
          game.ring(this.x, this.y, "#ffbd54", 13);
          this.skillTimer = rand(2.5, 4);
          this.chargeTarget = null;
        }
        return;
      }
      const desired = 340;
      const direction = d < desired - 55 ? -1 : d > desired + 70 ? 1 : 0;
      this.x += (dx / d * direction + Math.cos(this.phase * .7) * .45) * this.speed * slow * dt;
      this.y += (dy / d * direction + Math.sin(this.phase * .8) * .45) * this.speed * slow * dt;
      this.skillTimer -= dt;
      if (this.skillTimer <= 0 && d < 650) {
        this.chargeTarget = { x: player.x, y: player.y };
        this.chargeTimer = Math.max(.42, 1.18 - game.depth / 2300) / game.difficulty.speed;
      }
    }

    updateEel(dt, game, slow) {
      const edible = game.items
        .filter(item => !item.dead && (item.type === "xp" || item.type === "dream"))
        .sort((a, b) => distance(this, a) - distance(this, b))[0];
      const target = edible && distance(this, edible) < 510 ? edible : game.player;
      const d = this.moveToward(target.x, target.y, this.speed * slow, dt, .1);
      if (edible && target === edible && d < this.radius + edible.radius + 6) {
        edible.dead = true;
        this.eaten.push({ type: edible.type, value: edible.value });
        game.spark(this.x, this.y, edible.type === "dream" ? "#ce62ff" : "#55f7ff", 6);
      }
    }

    updateClown(dt, game, slow) {
      this.warpTimer -= dt;
      this.decoys = this.decoys.filter(decoy => (decoy.life -= dt) > 0);
      if (this.warpTimer <= 0) {
        const oldX = this.x;
        const oldY = this.y;
        const angle = rand(0, TAU);
        const radius = rand(150, 310);
        this.x = clamp(game.player.x + Math.cos(angle) * radius, 40, game.width - 40);
        this.y = clamp(game.player.y + Math.sin(angle) * radius, 60, game.height - 40);
        this.warpTimer = rand(2.5, 4.4);
        this.decoys = Array.from({ length: Math.random() < .55 ? 3 : 2 }, (_, index) => ({
          x: clamp(oldX + Math.cos(index / 3 * TAU) * rand(30, 90), 25, game.width - 25),
          y: clamp(oldY + Math.sin(index / 3 * TAU) * rand(30, 90), 25, game.height - 25),
          life: rand(1.2, 2.1)
        }));
        game.ring(oldX, oldY, "#ff62d7", 18);
        game.ring(this.x, this.y, "#64dcff", 18);
      } else {
        this.moveToward(game.player.x, game.player.y, this.speed * slow, dt, .68);
      }
    }

    draw(ctx, visibility) {
      ctx.save();
      ctx.globalAlpha = clamp(visibility + (this.hitFlash > 0 ? .35 : 0), 0, 1);
      for (const decoy of this.decoys) this.drawBody(ctx, decoy.x, decoy.y, .28 * (decoy.life / 2), true);
      this.drawBody(ctx, this.x, this.y, 1, false);
      if (this.type === "angler" && this.chargeTimer > 0 && this.chargeTarget) {
        const pulse = .35 + Math.sin(performance.now() * .025) * .18;
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = "#ffcb64";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 7]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.chargeTarget.x, this.chargeTarget.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    drawBody(ctx, x, y, alpha, decoy) {
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(x, y);
      ctx.strokeStyle = this.hitFlash > 0 && !decoy ? "#fff" : this.color;
      ctx.fillStyle = this.hitFlash > 0 && !decoy ? "#efffff" : `${this.color}31`;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.elite ? 28 : 16;
      ctx.lineWidth = this.elite ? 3 : 2;
      if (this.type === "mirror") {
        ctx.rotate(Math.PI / 4 + Math.sin(this.phase) * .08);
        ctx.beginPath();
        ctx.rect(-this.radius * .72, -this.radius * .72, this.radius * 1.44, this.radius * 1.44);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-this.radius * .5, 0);
        ctx.lineTo(this.radius * .5, 0);
        ctx.moveTo(0, -this.radius * .5);
        ctx.lineTo(0, this.radius * .5);
        ctx.stroke();
      } else if (this.type === "angler") {
        ctx.beginPath();
        ctx.ellipse(0, 2, this.radius, this.radius * .66, 0, 0, TAU);
        ctx.moveTo(-this.radius * .7, 0);
        ctx.lineTo(-this.radius * 1.4, -this.radius * .65);
        ctx.lineTo(-this.radius * 1.28, this.radius * .68);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(2, -this.radius * .5);
        ctx.quadraticCurveTo(this.radius * .45, -this.radius * 1.45, this.radius * .9, -this.radius * .75);
        ctx.stroke();
        ctx.fillStyle = "#fff19b";
        ctx.beginPath();
        ctx.arc(this.radius * .9, -this.radius * .75, 4.5, 0, TAU);
        ctx.fill();
      } else if (this.type === "eel") {
        ctx.beginPath();
        for (let i = 0; i <= 14; i++) {
          const px = (i / 14 - .5) * this.radius * 2.5;
          const py = Math.sin(i / 14 * Math.PI * 2 + this.phase * 2) * this.radius * .28;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.lineWidth = this.radius * .7;
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#d9ff87";
        ctx.stroke();
        ctx.fillStyle = "#ff4ebc";
        ctx.beginPath();
        ctx.arc(this.radius * 1.03, -3, 3, 0, TAU);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, -3, this.radius, Math.PI, 0);
        ctx.quadraticCurveTo(this.radius, this.radius * .45, this.radius * .55, this.radius * .3);
        ctx.quadraticCurveTo(0, this.radius * 1.15, -this.radius * .55, this.radius * .3);
        ctx.quadraticCurveTo(-this.radius, this.radius * .45, -this.radius, -3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-8, -3, 3, 0, TAU);
        ctx.arc(8, -3, 3, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#ffe36b";
        ctx.beginPath();
        ctx.arc(0, 8, 9, Math.PI + .2, TAU - .2);
        ctx.stroke();
      }
      if (!decoy && this.hp < this.maxHp) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(0,0,0,.7)";
        ctx.fillRect(-this.radius, -this.radius - 14, this.radius * 2, 3);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.radius, -this.radius - 14, this.radius * 2 * clamp(this.hp / this.maxHp, 0, 1), 3);
      }
      ctx.restore();
    }
  }

  // ============================================================
  // 700m boss
  // ============================================================
  class AbyssBoss {
    constructor(game) {
      this.x = game.width / 2;
      this.y = -125;
      this.radius = 84;
      this.maxHp = (1900 + game.player.level * 62) * game.difficulty.hp;
      this.hp = this.maxHp;
      this.damage = 23 * game.difficulty.damage;
      this.speed = 52 * game.difficulty.speed;
      this.dead = false;
      this.entering = true;
      this.phase = 0;
      this.hitFlash = 0;
      this.contactCooldown = 0;
      this.ringTimer = 2.5;
      this.darkTimer = 5.5;
      this.chargeCooldown = 3.8;
      this.chargeTelegraph = 0;
      this.chargeTime = 0;
      this.chargeVector = { x: 0, y: 1 };
      this.enraged = false;
      this.name = "夢喰いニュウドウ・アビス";
      encounter("boss_abyss");
    }

    update(dt, game) {
      this.phase += dt;
      this.hitFlash = Math.max(0, this.hitFlash - dt);
      this.contactCooldown -= dt;
      if (this.entering) {
        this.y += 92 * dt;
        if (this.y >= Math.min(165, game.height * .24)) this.entering = false;
        return;
      }
      if (!this.enraged && this.hp <= this.maxHp * .48) {
        this.enraged = true;
        this.speed *= 1.24;
        this.ringTimer = .5;
        game.flash = .72;
        game.shake = 18;
        game.showMessage("アビスが夢を吐き捨てた", "#dc65ff");
        notify("BOSS PHASE", "夢喰いニュウドウ・アビス：暴食形態", "#dc65ff");
      }
      this.suckDreams(dt, game);
      if (this.chargeTelegraph > 0) {
        this.chargeTelegraph -= dt;
        if (this.chargeTelegraph <= 0) {
          const dx = game.player.x - this.x;
          const dy = game.player.y - this.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          this.chargeVector = { x: dx / d, y: dy / d };
          this.chargeTime = this.enraged ? .62 : .48;
          game.shake = 10;
        }
      } else if (this.chargeTime > 0) {
        this.chargeTime -= dt;
        const velocity = (this.enraged ? 760 : 625) * game.difficulty.speed;
        this.x += this.chargeVector.x * velocity * dt;
        this.y += this.chargeVector.y * velocity * dt;
      } else {
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        const preferred = this.enraged ? 215 : 285;
        const toward = d > preferred ? 1 : -.35;
        this.x += (dx / d * toward + Math.sin(this.phase * 1.35) * .72) * this.speed * dt;
        this.y += (dy / d * toward + Math.cos(this.phase * .9) * .36) * this.speed * dt;
      }
      this.x = clamp(this.x, -this.radius * .2, game.width + this.radius * .2);
      this.y = clamp(this.y, -this.radius * .2, game.height + this.radius * .2);
      this.ringTimer -= dt;
      this.darkTimer -= dt;
      this.chargeCooldown -= dt;
      if (this.ringTimer <= 0 && this.chargeTime <= 0) {
        this.ringTimer = this.enraged ? 1.55 : 2.55;
        this.fireSpiral(game, this.enraged ? 16 : 12);
      }
      if (this.darkTimer <= 0) {
        this.darkTimer = this.enraged ? 5.2 : 7.3;
        game.phase3.abyssDarkness = this.enraged ? 4.8 : 3.7;
        game.ring(game.player.x, game.player.y, "#6e2ca8", 44);
        game.showMessage("夢喰いの暗闇", "#a867e8");
      }
      if (this.chargeCooldown <= 0 && this.chargeTime <= 0) {
        this.chargeCooldown = this.enraged ? rand(2.3, 3.4) : rand(3.6, 5);
        this.chargeTelegraph = this.enraged ? .5 : .82;
      }
      if (distance(this, game.player) < this.radius + game.player.radius && this.contactCooldown <= 0) {
        this.contactCooldown = .82;
        game.player.takeDamage(this.damage, game, "contact");
      }
    }

    suckDreams(dt, game) {
      for (const item of game.items) {
        if (item.dead || item.type !== "dream") continue;
        const d = distance(this, item);
        if (d < 410 && d > 1) {
          const force = 95 + (1 - d / 410) * 360;
          item.x += (this.x - item.x) / d * force * dt;
          item.y += (this.y - item.y) / d * force * dt;
          if (d < this.radius * .66) {
            item.dead = true;
            this.hp = Math.min(this.maxHp, this.hp + 18);
          }
        }
      }
    }

    fireSpiral(game, count) {
      const offset = this.phase * 1.7;
      for (let i = 0; i < count; i++) {
        const angle = offset + i / count * TAU;
        game.enemyProjectiles.push(new EnemyProjectile(
          this.x, this.y, angle, (this.enraged ? 240 : 190) * game.difficulty.speed,
          this.damage * .62, i % 2 ? "#a85cff" : "#ff55cd"
        ));
      }
      game.ring(this.x, this.y, "#a75cff", 35);
    }

    takeDamage(amount, game) {
      this.hp -= amount;
      this.hitFlash = .1;
      if (this.hp <= 0 && !this.dead) {
        this.dead = true;
        game.onAbyssBossKilled(this);
      }
    }

    draw(ctx, visibility) {
      ctx.save();
      ctx.globalAlpha = clamp(visibility + (this.hitFlash > 0 ? .4 : 0), .3, 1);
      if (this.chargeTelegraph > 0) {
        const angle = Math.atan2(game.player.y - this.y, game.player.x - this.x);
        ctx.strokeStyle = `rgba(223,98,255,${.45 + Math.sin(this.phase * 28) * .2})`;
        ctx.lineWidth = 5;
        ctx.setLineDash([16, 12]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(angle) * 1200, this.y + Math.sin(angle) * 1200);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.sin(this.phase * .8) * .08);
      ctx.strokeStyle = this.hitFlash > 0 ? "#fff" : this.enraged ? "#ff4fce" : "#a95dff";
      ctx.fillStyle = this.hitFlash > 0 ? "#fff" : "rgba(74, 19, 105, .68)";
      ctx.shadowColor = this.enraged ? "#ff4fce" : "#9a55ff";
      ctx.shadowBlur = this.enraged ? 46 : 32;
      ctx.lineWidth = this.enraged ? 5 : 3;
      ctx.beginPath();
      for (let i = 0; i <= 28; i++) {
        const angle = i / 28 * TAU;
        const wobble = 1 + Math.sin(angle * 7 + this.phase * 2.4) * .1;
        const px = Math.cos(angle) * this.radius * wobble;
        const py = Math.sin(angle) * this.radius * .72 * wobble;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = this.enraged ? "#ffe36b" : "#58efff";
      ctx.beginPath();
      ctx.arc(-24, -10, 7, 0, TAU);
      ctx.arc(24, -10, 7, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#ff5bcb";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 18, 32, .12, Math.PI - .12);
      ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const angle = i / 7 * TAU + this.phase * .22;
        ctx.strokeStyle = i % 2 ? "#5eeaff" : "#d05cff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * this.radius * .7, Math.sin(angle) * this.radius * .55);
        ctx.quadraticCurveTo(
          Math.cos(angle + .35) * this.radius * 1.3,
          Math.sin(angle + .35) * this.radius,
          Math.cos(angle) * this.radius * 1.55,
          Math.sin(angle) * this.radius * 1.18
        );
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ============================================================
  // Runtime state, missions, synergies, achievements
  // ============================================================
  function permanentTagCounts(game) {
    const owns = id => game.save.owns(id) ? 1 : 0;
    return {
      neon: owns("roland_duration") + owns("roland_power") + owns("roland_stun"),
      baka: owns("baka_shockwave") + owns("baka_explosion") + owns("ikemen_cooldown"),
      kindness: owns("kindness_memory") + owns("kindness_hp") + owns("kindness_guard"),
      ikemen: owns("ikemen_cooldown") + owns("ikemen_invuln") + owns("ikemen_charm"),
      abyss: owns("abyss_vision") + owns("abyss_magnet") + owns("abyss_rare")
    };
  }

  function createRunState(game) {
    const selected = shuffle(MISSION_DEFS).slice(0, 3).map(def => ({ ...def, complete: false, rewarded: false }));
    return {
      zone: ZONES[0],
      zoneIndex: 0,
      missions: selected,
      tags: permanentTagCounts(game),
      activeSynergies: new Set(),
      activatedHistory: new Set(),
      metrics: {
        fishKills: 0, neonKills: 0, dashPasses: 0, memories: 0,
        dreamCollected: 0, bosses: 0, lowHpSeconds: 0
      },
      kindnessBarrierCooldown: 0,
      kindnessSlowTimer: 0,
      abyssDarkness: 0,
      abyssTriggered: false,
      lastMissionRender: 0
    };
  }

  function instrumentUpgrades(game) {
    const tagByName = new Map([
      ["俺の輝き、増量", "neon"],
      ["ネオン過剰供給", "neon"],
      ["ポジティブ長持ち", "neon"],
      ["再点灯が早すぎる", "neon"],
      ["海より速い男", "ikemen"],
      ["逃げ足も才能", "baka"],
      ["家族級の生命力", "kindness"],
      ["全部、俺のもの", "abyss"]
    ]);
    const additions = [
      { icon: "盾", name: "優しさは防具", desc: "最大HP +15、家族の記憶の回復 +8", p3Tag: "kindness", apply: p => { p.maxHp += 15; p.hp += 15; p.memoryHealBonus += 8; } },
      { icon: "瞬", name: "イケメン残像", desc: "移動速度 +8%、ダッシュ無敵 +0.06秒", p3Tag: "ikemen", apply: p => { p.moveSpeed *= 1.08; p.dashDuration += .06; } },
      { icon: "圧", name: "水圧との和解", desc: "視界悪化軽減、吸引範囲 +25", p3Tag: "abyss", apply: p => { p.darknessAdapt = Math.min(.78, p.darknessAdapt + .12); p.magnetRange += 25; } },
      { icon: "爆", name: "勢いだけは深海級", desc: "ダッシュ再使用 -12%、衝撃波を強化", p3Tag: "baka", apply: p => { p.dashCooldownMax *= .88; p.dashShockwave = true; } },
      { icon: "光", name: "光量、盛れるだけ", desc: "ネオン威力と通常光量アップ", p3Tag: "neon", apply: p => { p.neonPower += .2; p.neonDamageMultiplier += .1; } }
    ];
    game.upgrades.pool.push(...additions);
    for (const choice of game.upgrades.pool) {
      if (choice.__phase3Wrapped) continue;
      const tag = choice.p3Tag || tagByName.get(choice.name);
      if (!tag) continue;
      const originalApply = choice.apply;
      choice.apply = player => {
        originalApply(player);
        game.phase3.tags[tag] = (game.phase3.tags[tag] || 0) + 1;
        evaluateSynergies(game);
      };
      choice.__phase3Wrapped = true;
    }
  }

  function evaluateSynergies(game) {
    if (!game.phase3) return;
    for (const synergy of Object.values(SYNERGIES)) {
      if ((game.phase3.tags[synergy.id] || 0) < synergy.threshold) continue;
      if (game.phase3.activeSynergies.has(synergy.id)) continue;
      game.phase3.activeSynergies.add(synergy.id);
      game.phase3.activatedHistory.add(synergy.id);
      encounter(`synergy_${synergy.id}`);
      if (synergy.id === "abyss") {
        game.player.darknessAdapt = Math.min(.8, game.player.darknessAdapt + .15);
        game.player.rareBonus += .025;
      }
      if (synergy.id === "kindness") game.player.memoryBlessing = true;
      game.flash = .55;
      game.ring(game.player.x, game.player.y, synergy.color, 40);
      notify("SYNERGY ACTIVE", `${synergy.icon} ${synergy.name}`, synergy.color);
      game.showMessage(`${synergy.name} 発動`, synergy.color);
      renderSynergies(game);
    }
    checkAchievements(game);
  }

  function renderSynergies(game) {
    const target = document.querySelector("#synergy-list");
    if (!target || !game.phase3) return;
    const active = [...game.phase3.activeSynergies].map(id => SYNERGIES[id]);
    target.innerHTML = active.length
      ? active.map(s => `<span class="synergy-chip" style="--chip-color:${s.color}">${s.icon} ${s.name}</span>`).join("")
      : '<span class="empty">未発動</span>';
  }

  function missionProgress(mission, game) {
    return Math.min(mission.target, Math.max(0, mission.progress(game)));
  }

  function updateMissions(game) {
    if (!game.phase3) return;
    for (const mission of game.phase3.missions) {
      const progress = missionProgress(mission, game);
      if (progress < mission.target || mission.complete) continue;
      mission.complete = true;
      mission.rewarded = true;
      phase3Save.stats.missionsCompleted += 1;
      game.dreams += mission.dream;
      game.save.data.dreams += mission.dream;
      game.save.save();
      savePhase3();
      game.addXp(mission.xp);
      notify("MISSION COMPLETE", `${mission.label}　夢の欠片 +${mission.dream}`, "#ffe77a");
    }
    if (performance.now() - game.phase3.lastMissionRender > 180) {
      game.phase3.lastMissionRender = performance.now();
      renderMissions(game);
    }
  }

  function renderMissions(game) {
    const list = document.querySelector("#mission-list");
    if (!list || !game.phase3) return;
    list.innerHTML = game.phase3.missions.map(mission => {
      const value = missionProgress(mission, game);
      const display = mission.id === "low30" ? Math.floor(value) : Math.floor(value);
      const percent = clamp(value / mission.target * 100, 0, 100);
      return `<div class="mission-row${mission.complete ? " complete" : ""}">
        <span>${mission.complete ? "✓ " : ""}${mission.label}</span>
        <small>${display}/${mission.target}</small>
        <div class="mission-progress"><i style="width:${percent}%"></i></div>
      </div>`;
    }).join("");
  }

  function checkAchievements(game) {
    for (const achievement of ACHIEVEMENTS) {
      if (phase3Save.achievements[achievement.id]) continue;
      if (!achievement.test(game, phase3Save)) continue;
      phase3Save.achievements[achievement.id] = true;
      game.save.data.dreams += achievement.reward;
      if (game.state === "running") game.dreams += achievement.reward;
      game.save.save();
      savePhase3();
      notify("ACHIEVEMENT", `${achievement.name}　夢の欠片 +${achievement.reward}`, "#ffdf69");
    }
  }

  function updatePhase3(game, dt) {
    if (!game.phase3 || game.state !== "running") return;
    const state = game.phase3;
    state.kindnessBarrierCooldown = Math.max(0, state.kindnessBarrierCooldown - dt);
    state.kindnessSlowTimer = Math.max(0, state.kindnessSlowTimer - dt);
    state.abyssDarkness = Math.max(0, state.abyssDarkness - dt);
    if (game.player.hp / game.player.maxHp <= .3) state.metrics.lowHpSeconds += dt;
    if (state.activeSynergies.has("kindness") && game.player.hp / game.player.maxHp <= .28 && state.kindnessBarrierCooldown <= 0) {
      state.kindnessBarrierCooldown = 24;
      game.player.memoryShield = Math.max(game.player.memoryShield, 7);
      game.player.invulnerable = Math.max(game.player.invulnerable, .55);
      game.ring(game.player.x, game.player.y, "#ffe99a", 34);
      notify("優しさ守護", "家族の光が自動バリアを展開", "#ffe99a");
    }
    if (state.activeSynergies.has("neon")) {
      game.spawnTimer -= dt * (.18 + game.player.lightLevel * .34);
    }
    const nextZone = zoneAt(game.depth);
    if (nextZone.id !== state.zone.id) {
      state.zone = nextZone;
      state.zoneIndex = ZONES.indexOf(nextZone);
      announceZone(game, nextZone);
    }
    if (game.depth >= 700 && !state.abyssTriggered && (!game.boss || game.boss.dead)) spawnAbyssBoss(game);
    updateMissions(game);
    checkAchievements(game);
  }

  function announceZone(game, zone) {
    const banner = document.querySelector("#zone-banner");
    document.documentElement.style.setProperty("--zone-accent", zone.accent);
    document.documentElement.style.setProperty("--zone-shadow", `${zone.accent}55`);
    banner.innerHTML = `<b>${zone.name}</b><small>${zone.range} / ${zone.message}</small>`;
    banner.classList.remove("hidden");
    banner.style.animation = "none";
    void banner.offsetWidth;
    banner.style.animation = "";
    setTimeout(() => banner.classList.add("hidden"), 2700);
    game.flash = .4;
    game.shake = 8;
  }

  function spawnAbyssBoss(game) {
    game.phase3.abyssTriggered = true;
    if (game.activeEvent) game.endEvent();
    game.boss = new AbyssBoss(game);
    game.enemyProjectiles.length = 0;
    const hud = document.querySelector("#boss-hud");
    hud.classList.remove("hidden");
    document.querySelector("#boss-name").textContent = game.boss.name;
    const warning = document.querySelector("#boss-warning");
    warning.querySelector("small").textContent = "WARNING / DEPTH 700m";
    warning.querySelector("b").textContent = game.boss.name;
    warning.classList.remove("hidden");
    warning.style.animation = "none";
    void warning.offsetWidth;
    warning.style.animation = "";
    setTimeout(() => warning.classList.add("hidden"), 3100);
    game.shake = 22;
    game.flash = .85;
  }

  // ============================================================
  // Patch Development 2 behavior
  // ============================================================
  const originalEnemyUpdate = Enemy.prototype.update;
  Enemy.prototype.update = function phase3ScaledEnemyUpdate(dt, game) {
    if (!this.p3Scaled && game.difficulty) {
      this.p3Scaled = true;
      this.maxHp *= game.difficulty.hp;
      this.hp *= game.difficulty.hp;
      this.speed *= game.difficulty.speed;
      this.damage *= game.difficulty.damage;
      encounter(`enemy_${this.type}`);
    }
    const slowed = game.phase3?.kindnessSlowTimer > 0;
    const originalSpeed = this.speed;
    if (slowed) this.speed *= .52;
    originalEnemyUpdate.call(this, dt, game);
    this.speed = originalSpeed;
  };

  const originalPlayerUpdate = Player.prototype.update;
  Player.prototype.update = function phase3PlayerUpdate(dt, game) {
    const wasDashing = this.dashTimer > 0;
    originalPlayerUpdate.call(this, dt, game);
    if (wasDashing && this.dashTimer <= 0 && game.phase3?.activeSynergies.has("baka")) {
      game.explode(this.x, this.y, this.attackDamage * .82);
      game.ring(this.x, this.y, "#ff9c50", 28);
    }
  };

  const originalStartDash = Player.prototype.startDash;
  Player.prototype.startDash = function phase3StartDash(mx, my, game) {
    const closeEnemies = game.enemies.filter(enemy => !enemy.dead && distance(this, enemy) < enemy.radius + 104);
    const closeBoss = game.boss && !game.boss.dead && distance(this, game.boss) < game.boss.radius + 114;
    originalStartDash.call(this, mx, my, game);
    if (game.phase3 && (closeEnemies.length || closeBoss)) {
      game.phase3.metrics.dashPasses += Math.max(1, closeEnemies.length + (closeBoss ? 1 : 0));
    }
    if (game.phase3?.activeSynergies.has("ikemen") && (closeEnemies.length || closeBoss)) {
      this.addBurst(11);
      const targets = [...closeEnemies, ...(closeBoss ? [game.boss] : [])]
        .sort((a, b) => distance(this, a) - distance(this, b)).slice(0, 3);
      const oldAim = this.aimAngle;
      for (const target of targets) {
        this.aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        const projectile = new Projectile(
          this.x + Math.cos(this.aimAngle) * 24,
          this.y + Math.sin(this.aimAngle) * 24,
          this.aimAngle, this
        );
        projectile.damage *= .7;
        projectile.color = "#83b8ff";
        game.projectiles.push(projectile);
      }
      this.aimAngle = oldAim;
      game.showMessage("イケメン・カウンター", "#7faeff");
    }
  };

  const originalShoot = Player.prototype.shoot;
  Player.prototype.shoot = function phase3Shoot(game) {
    if (!game.phase3?.activeSynergies.has("neon")) return originalShoot.call(this, game);
    const originalDamage = this.attackDamage;
    this.attackDamage *= 1 + this.lightLevel * .35;
    originalShoot.call(this, game);
    this.attackDamage = originalDamage;
  };

  const originalItemCollect = Item.prototype.collect;
  Item.prototype.collect = function phase3ItemCollect(game) {
    if (this.dead) return;
    const type = this.type;
    encounter(`item_${type}`);
    originalItemCollect.call(this, game);
    if (!game.phase3) return;
    if (type === "dream") {
      game.phase3.metrics.dreamCollected += this.value;
      if (game.difficultyId === "deep" && Math.random() < .38) {
        game.dreams += 1;
        game.save.data.dreams += 1;
        game.phase3.metrics.dreamCollected += 1;
        game.save.save();
      }
    } else if (type === "memory") {
      game.phase3.metrics.memories += 1;
      phase3Save.stats.memories += 1;
      if (game.phase3.activeSynergies.has("kindness")) {
        game.phase3.kindnessSlowTimer = Math.max(game.phase3.kindnessSlowTimer, 6);
        notify("優しさ守護", "家族の記憶が周囲の敵を減速", "#ffe99a");
      }
      savePhase3();
    }
    checkAchievements(game);
  };

  const originalGameStart = Game.prototype.start;
  Game.prototype.start = function phase3Start() {
    this.difficultyId = phase3Save.settings.difficulty;
    this.difficulty = DIFFICULTIES[this.difficultyId];
    originalGameStart.call(this);
    this.phase3 = createRunState(this);
    this.player.maxHp = Math.round(this.player.maxHp * this.difficulty.playerHp);
    this.player.hp = this.player.maxHp;
    this.player.rareBonus = Math.max(0, this.player.rareBonus + this.difficulty.rare);
    instrumentUpgrades(this);
    evaluateSynergies(this);
    renderMissions(this);
    renderSynergies(this);
    document.querySelector("#boss-name").textContent = "承認欲求クラゲ・キング";
    document.querySelector("#boss-phase").textContent = "";
    document.documentElement.style.setProperty("--zone-accent", ZONES[0].accent);
    document.querySelector("#zone-name").textContent = ZONES[0].name;
    encounter("item_xp");
    checkAchievements(this);
  };

  const originalSpawnEnemy = Game.prototype.spawnEnemy;
  Game.prototype.spawnEnemy = function phase3SpawnEnemy(forcedType = null) {
    if (!this.phase3 || !this.difficulty) return originalSpawnEnemy.call(this, forcedType);
    if (this.enemies.length >= 108) return;
    const side = (Math.random() * 4) | 0;
    const margin = 58;
    let x;
    let y;
    if (side === 0) { x = rand(0, this.width); y = -margin; }
    else if (side === 1) { x = this.width + margin; y = rand(0, this.height); }
    else if (side === 2) { x = rand(0, this.width); y = this.height + margin; }
    else { x = -margin; y = rand(0, this.height); }
    const zone = this.phase3.zone;
    const weights = { ...zone.weights };
    const light = this.player.lightLevel;
    weights.mirror *= .7 + light * 1.1;
    weights.jelly *= .85 + light * .65;
    const type = forcedType || weightedPick(weights);
    const depthDifficulty = 1 + this.depth / 1050;
    const eliteChance = clamp(.012 + this.depth / 10000 + light * .025 + (this.difficultyId === "deep" ? .035 : 0), 0, .18);
    let enemy;
    if (NEW_ENEMY_DATA[type]) {
      enemy = new Phase3Enemy(x, y, type, depthDifficulty, this.difficulty, Math.random() < eliteChance, { depth: this.depth });
    } else {
      enemy = new Enemy(x, y, type, depthDifficulty, Math.random() < eliteChance);
      enemy.maxHp *= this.difficulty.hp;
      enemy.hp = enemy.maxHp;
      enemy.speed *= this.difficulty.speed;
      enemy.damage *= this.difficulty.damage;
      enemy.p3Scaled = true;
      encounter(`enemy_${type}`);
    }
    this.enemies.push(enemy);
  };

  const originalUpdate = Game.prototype.update;
  Game.prototype.update = function phase3Update(dt) {
    const enemiesBefore = this.enemies?.length || 0;
    const timerBefore = this.spawnTimer;
    originalUpdate.call(this, dt);
    if (this.difficulty && this.enemies?.length > enemiesBefore && timerBefore <= dt && this.spawnTimer > 0) {
      this.spawnTimer /= this.difficulty.spawn;
    }
    updatePhase3(this, dt);
  };

  const originalOnEnemyKilled = Game.prototype.onEnemyKilled;
  Game.prototype.onEnemyKilled = function phase3OnEnemyKilled(enemy) {
    if (enemy.noReward) {
      this.spark(enemy.x, enemy.y, enemy.color, 8);
      this.ring(enemy.x, enemy.y, enemy.color, 8);
      return;
    }
    if (this.phase3) {
      if (enemy.type === "fish") this.phase3.metrics.fishKills += 1;
      if (this.player.neonActive) this.phase3.metrics.neonKills += 1;
      if (this.player.burstActive) {
        phase3Save.stats.burstKills += 1;
        savePhase3();
      }
    }
    const itemsBefore = this.items.length;
    originalOnEnemyKilled.call(this, enemy);
    const freshItems = this.items.slice(itemsBefore);
    if (enemy.type === "blob" && this.difficultyId === "casual" && Math.random() < .28) {
      const dream = freshItems.find(item => item.type === "dream");
      if (dream) dream.dead = true;
    } else if (enemy.type === "blob" && this.difficultyId === "deep" && Math.random() < .34) {
      this.items.push(new Item(enemy.x + rand(-10, 10), enemy.y + rand(-10, 10), "dream", 1));
    }
    if (enemy.type === "mirror") this.player.addBurst(13);
    if (enemy.type === "eel" && enemy.eaten?.length) {
      enemy.eaten.forEach((item, index) => {
        this.items.push(new Item(enemy.x + Math.cos(index) * 18, enemy.y + Math.sin(index) * 18, item.type, item.value));
      });
      this.showMessage(`奪われた欠片 ×${enemy.eaten.length} 回収`, "#9dff75");
    }
    if (enemy.type === "clown" && Math.random() < .23 + this.player.rareBonus + this.difficulty.rare) {
      this.items.push(new Item(enemy.x, enemy.y, Math.random() < .68 ? "dream" : "memory", 1));
    }
    const zone = this.phase3?.zone;
    if (zone?.id === "neon_shallows" && Math.random() < .22) this.items.push(new Item(enemy.x + rand(-8, 8), enemy.y, "xp", 1));
    if (zone?.id === "dream_eater_deep" && Math.random() < .055 * this.difficulty.dreamDrop) this.items.push(new Item(enemy.x, enemy.y, "dream", 1));
    if (zone?.id === "family_abyss" && Math.random() < .024 + this.player.rareBonus) this.items.push(new Item(enemy.x, enemy.y, "memory", 1));
    if (this.phase3?.activeSynergies.has("baka")) this.player.dashCooldown = Math.max(0, this.player.dashCooldown - .14);
    checkAchievements(this);
  };

  const originalSpawnBoss = Game.prototype.spawnBoss;
  Game.prototype.spawnBoss = function phase3SpawnJellyBoss() {
    originalSpawnBoss.call(this);
    if (!this.boss || !this.difficulty) return;
    this.boss.maxHp *= this.difficulty.hp;
    this.boss.hp = this.boss.maxHp;
    this.boss.speed *= this.difficulty.speed;
    this.boss.damage *= this.difficulty.damage;
    this.boss.p3Scaled = true;
    encounter("boss_jelly");
    document.querySelector("#boss-name").textContent = "承認欲求クラゲ・キング";
    document.querySelector("#boss-phase").textContent = "承認弾幕";
    const warning = document.querySelector("#boss-warning");
    warning.querySelector("small").textContent = "WARNING / DEPTH 300m";
    warning.querySelector("b").textContent = "承認欲求クラゲ・キング";
  };

  const originalOnBossKilled = Game.prototype.onBossKilled;
  Game.prototype.onBossKilled = function phase3OnJellyBossKilled(boss) {
    originalOnBossKilled.call(this, boss);
    if (this.phase3) this.phase3.metrics.bosses += 1;
    const adjustment = this.difficultyId === "deep" ? 3 : this.difficultyId === "casual" ? -2 : 0;
    if (adjustment) {
      this.dreams = Math.max(0, this.dreams + adjustment);
      this.save.data.dreams = Math.max(0, this.save.data.dreams + adjustment);
      this.save.save();
    }
    phase3Save.stats.jellyBossKills += 1;
    savePhase3();
    checkAchievements(this);
  };

  Game.prototype.onAbyssBossKilled = function onAbyssBossKilled(boss) {
    document.querySelector("#boss-hud").classList.add("hidden");
    this.enemyProjectiles.length = 0;
    this.phase3.metrics.bosses += 1;
    phase3Save.stats.abyssBossKills += 1;
    const reward = this.difficultyId === "deep" ? 13 : this.difficultyId === "casual" ? 7 : 10;
    this.dreams += reward;
    this.save.data.dreams += reward;
    this.addXp(44);
    for (let i = 0; i < 9; i++) {
      this.items.push(new Item(boss.x + rand(-105, 105), boss.y + rand(-75, 75), "dream", 1));
    }
    this.items.push(new Item(boss.x, boss.y, "memory", 1));
    this.spark(boss.x, boss.y, "#c05cff", 105);
    for (let i = 0; i < 7; i++) this.ring(boss.x, boss.y, i % 2 ? "#ff55ce" : "#55eaff", 34 + i * 18);
    this.shake = 29;
    this.flash = 1;
    this.save.save();
    savePhase3();
    this.showMessage(`アビス撃破！ 夢の欠片 +${reward}`, "#ffe572");
    notify("ABYSS CLEARED", "夢喰いニュウドウ・アビス撃破", "#dd66ff");
    checkAchievements(this);
  };

  const originalAddXp = Game.prototype.addXp;
  Game.prototype.addXp = function phase3AddXp(amount) {
    return originalAddXp.call(this, amount * (this.difficulty?.xp || 1));
  };

  const originalStartRandomEvent = Game.prototype.startRandomEvent;
  Game.prototype.startRandomEvent = function phase3StartRandomEvent(forceId = null) {
    let selected = forceId;
    if (!selected && this.phase3) {
      const zoneId = this.phase3.zone.id;
      const weights = zoneId === "silent_mid"
        ? { silence: 48, current: 21, storm: 13, bubbles: 18 }
        : zoneId === "dream_eater_deep"
          ? { silence: 18, current: 19, storm: 29, bubbles: 34 }
          : zoneId === "family_abyss"
            ? { silence: 28, current: 22, storm: 28, bubbles: 22 }
            : { silence: 20, current: 31, storm: 24, bubbles: 25 };
      selected = weightedPick(weights);
    }
    originalStartRandomEvent.call(this, selected);
    if (this.activeEvent) {
      encounter(`event_${this.activeEvent.id}`);
      const multiplier = this.phase3?.zone.events || 1;
      this.activeEvent = { ...this.activeEvent, spawnFactor: this.activeEvent.spawnFactor * Math.min(1.28, multiplier) };
    }
  };

  const originalEndEvent = Game.prototype.endEvent;
  Game.prototype.endEvent = function phase3EndEvent() {
    originalEndEvent.call(this);
    if (this.phase3) this.nextEvent /= this.phase3.zone.events;
  };

  const originalVisibilityAt = Game.prototype.visibilityAt;
  Game.prototype.visibilityAt = function phase3VisibilityAt(entity) {
    const base = originalVisibilityAt.call(this, entity);
    if (!this.phase3) return base;
    const adapted = lerp(this.phase3.zone.visibility, 1, this.player.darknessAdapt);
    const bossDark = this.phase3.abyssDarkness > 0 ? .55 : 1;
    return clamp(base * adapted * bossDark, .035, 1);
  };

  const originalDrawBackground = Game.prototype.drawBackground;
  Game.prototype.drawBackground = function phase3DrawBackground(ctx, time) {
    if (this.phase3) {
      const zone = this.phase3.zone;
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, zone.colors[0]);
      gradient.addColorStop(1, zone.colors[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalAlpha = .12;
      ctx.strokeStyle = zone.accent;
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const y = (i * 230 + time * (5 + i)) % (this.height + 250) - 120;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(this.width * .34, y + 30, this.width * .67, y - 22, this.width, y + 8);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    originalDrawBackground.call(this, ctx, time);
  };

  const originalUpdateHUD = Game.prototype.updateHUD;
  Game.prototype.updateHUD = function phase3UpdateHUD() {
    originalUpdateHUD.call(this);
    if (!this.phase3) return;
    document.querySelector("#zone-name").textContent = this.phase3.zone.name;
    if (this.boss && !this.boss.dead) {
      document.querySelector("#boss-name").textContent = this.boss.name || "承認欲求クラゲ・キング";
      document.querySelector("#boss-phase").textContent = this.boss instanceof AbyssBoss
        ? this.boss.enraged ? "PHASE 2 / 暴食形態" : "PHASE 1 / 夢吸引"
        : "承認弾幕";
    }
  };

  const originalGameOver = Game.prototype.gameOver;
  Game.prototype.gameOver = function phase3GameOver() {
    if (this.state !== "running") return;
    originalGameOver.call(this);
    const records = phase3Save.records[this.difficultyId];
    records.maxDepth = Math.max(records.maxDepth, this.depth);
    records.bestKills = Math.max(records.bestKills, this.kills);
    records.bestTime = Math.max(records.bestTime, Math.floor(this.elapsed));
    phase3Save.records.maxEverDepth = Math.max(phase3Save.records.maxEverDepth, this.depth);
    savePhase3();
    checkAchievements(this);
    document.querySelector("#result-difficulty").textContent = this.difficulty.name;
    document.querySelector("#result-zone").textContent = this.phase3.zone.name;
    document.querySelector("#result-best-depth").textContent = `${records.maxDepth}m`;
    document.querySelector("#result-missions").innerHTML = this.phase3.missions.map(mission => {
      const value = Math.floor(missionProgress(mission, this));
      return `<div class="result-mission${mission.complete ? " complete" : ""}"><span>${mission.complete ? "✓" : "·"} ${mission.label}</span><b>${value}/${mission.target}</b></div>`;
    }).join("");
    const activated = [...this.phase3.activatedHistory].map(id => SYNERGIES[id]);
    document.querySelector("#result-synergies").innerHTML = activated.length
      ? activated.map(s => `<span class="result-chip" style="--chip-color:${s.color}">${s.icon} ${s.name}</span>`).join("")
      : '<span class="empty">今回は未発動</span>';
  };

  const originalRefreshTitle = Game.prototype.refreshTitle;
  Game.prototype.refreshTitle = function phase3RefreshTitle() {
    originalRefreshTitle.call(this);
    const target = document.querySelector("#difficulty-records");
    if (target) {
      target.innerHTML = Object.values(DIFFICULTIES).map(diff => {
        const record = phase3Save.records[diff.id];
        return `<span>${diff.name} ${record.maxDepth}m / ${record.bestKills}撃破</span>`;
      }).join("");
    }
  };

  const originalToTitle = Game.prototype.toTitle;
  Game.prototype.toTitle = function phase3ToTitle() {
    originalToTitle.call(this);
    document.querySelector("#archive-screen").classList.add("hidden");
    this.refreshTitle();
  };

  // Reset both save layers from the existing reset button.
  const originalSaveReset = baseGame.save.reset.bind(baseGame.save);
  baseGame.save.reset = () => {
    originalSaveReset();
    resetPhase3Save();
  };

  // ============================================================
  // Title menus: difficulty, achievements, encyclopedia
  // ============================================================
  let archiveMode = "achievements";
  let catalogTab = "enemies";

  function selectDifficulty(id) {
    if (!DIFFICULTIES[id]) return;
    phase3Save.settings.difficulty = id;
    savePhase3();
    document.querySelectorAll(".difficulty-option").forEach(button => {
      const selected = button.dataset.difficulty === id;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-checked", String(selected));
    });
  }

  function openArchive(mode) {
    archiveMode = mode;
    baseGame.state = "archive";
    document.querySelector("#start-screen").classList.add("hidden");
    document.querySelector("#gameover-screen").classList.add("hidden");
    document.querySelector("#archive-screen").classList.remove("hidden");
    renderArchive();
  }

  function closeArchive() {
    document.querySelector("#archive-screen").classList.add("hidden");
    document.querySelector("#start-screen").classList.remove("hidden");
    baseGame.state = "start";
    baseGame.refreshTitle();
  }

  function renderArchive() {
    const title = document.querySelector("#archive-title");
    const eyebrow = document.querySelector("#archive-eyebrow");
    const progress = document.querySelector("#archive-progress");
    const tabs = document.querySelector("#archive-tabs");
    const content = document.querySelector("#archive-content");
    if (archiveMode === "achievements") {
      title.textContent = "実績";
      eyebrow.textContent = "LONG-TERM RECORDS";
      const unlocked = ACHIEVEMENTS.filter(item => phase3Save.achievements[item.id]).length;
      progress.textContent = `${unlocked} / ${ACHIEVEMENTS.length}`;
      tabs.classList.add("hidden");
      content.innerHTML = ACHIEVEMENTS.map(achievement => {
        const done = phase3Save.achievements[achievement.id];
        return `<article class="archive-card ${done ? "unlocked" : "locked"}" style="--card-color:#ffe36f">
          <b>${done ? "✓ " : "◇ "}${achievement.name}</b>
          <small>${done ? "達成済み" : "未達成"} / 報酬 ${achievement.reward}欠片</small>
          <p>${achievement.desc}</p>
        </article>`;
      }).join("");
      return;
    }
    title.textContent = "深海図鑑";
    eyebrow.textContent = "ENCOUNTER ARCHIVE";
    tabs.classList.remove("hidden");
    const tabNames = { enemies: "敵", bosses: "ボス", items: "アイテム", events: "深海イベント", synergies: "シナジー" };
    tabs.innerHTML = Object.entries(tabNames).map(([id, label]) =>
      `<button data-tab="${id}" class="${catalogTab === id ? "active" : ""}">${label}</button>`
    ).join("");
    tabs.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
      catalogTab = button.dataset.tab;
      renderArchive();
    }));
    const entries = CATALOG[catalogTab];
    const found = entries.filter(entry => phase3Save.encounters[entry.id]).length;
    progress.textContent = `${found} / ${entries.length}`;
    content.innerHTML = entries.map(entry => {
      const seen = phase3Save.encounters[entry.id];
      return `<article class="archive-card ${seen ? "unlocked" : "locked"}" style="--card-color:${entry.color}">
        <b>${seen ? entry.name : "？？？"}</b>
        <small>${seen ? "ENCOUNTERED" : "UNDISCOVERED"}</small>
        <p>${seen ? entry.desc : "深海で遭遇すると詳細が記録されます。"}</p>
      </article>`;
    }).join("");
  }

  document.querySelectorAll(".difficulty-option").forEach(button => {
    button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty));
  });
  document.querySelector("#achievements-button").addEventListener("click", () => openArchive("achievements"));
  document.querySelector("#bestiary-button").addEventListener("click", () => openArchive("catalog"));
  document.querySelector("#archive-close-button").addEventListener("click", closeArchive);
  selectDifficulty(phase3Save.settings.difficulty);

  // Ensure title refresh uses the patched method immediately.
  baseGame.refreshTitle();
  checkAchievements(baseGame);

  // Public test/balance surface. No cheats are exposed in the visible UI.
  window.AMESEA.version = "3.0.0";
  window.AMESEA3 = {
    version: "3.0.0",
    zones: ZONES,
    difficulties: DIFFICULTIES,
    synergies: SYNERGIES,
    achievements: ACHIEVEMENTS,
    get save() { return phase3Save; },
    snapshot() {
      const game = baseGame;
      return {
        state: game.state,
        difficulty: game.difficultyId || phase3Save.settings.difficulty,
        depth: game.depth,
        zone: game.phase3?.zone.id || zoneAt(game.depth).id,
        enemies: game.enemies?.map(enemy => enemy.type) || [],
        boss: game.boss && !game.boss.dead ? (game.boss.name || "jellyKing") : null,
        missions: game.phase3?.missions.map(mission => ({
          id: mission.id, progress: missionProgress(mission, game), complete: mission.complete
        })) || [],
        synergies: game.phase3 ? [...game.phase3.activeSynergies] : [],
        records: phase3Save.records
      };
    },
    selectDifficulty,
    forceDepth(value) {
      const depth = Math.max(0, Number(value) || 0);
      baseGame.elapsed = depth / 5.2;
      baseGame.depth = Math.floor(depth);
    },
    spawnEnemy(type) {
      if (baseGame.state === "running") baseGame.spawnEnemy(type);
    },
    activateSynergy(id) {
      if (!baseGame.phase3 || !SYNERGIES[id]) return;
      baseGame.phase3.tags[id] = SYNERGIES[id].threshold;
      evaluateSynergies(baseGame);
    },
    completeMissions() {
      if (!baseGame.phase3) return;
      baseGame.phase3.metrics.fishKills = 30;
      baseGame.phase3.metrics.neonKills = 10;
      baseGame.phase3.metrics.dashPasses = 5;
      baseGame.phase3.metrics.memories = 2;
      baseGame.phase3.metrics.dreamCollected = 10;
      baseGame.phase3.metrics.bosses = 1;
      baseGame.phase3.metrics.lowHpSeconds = 30;
      baseGame.depth = Math.max(baseGame.depth, 300);
      updateMissions(baseGame);
    },
    defeatBoss() {
      if (baseGame.boss && !baseGame.boss.dead) baseGame.boss.takeDamage(baseGame.boss.hp + 1, baseGame);
    },
    resetPhase3: resetPhase3Save
  };

  // Opt-in browser smoke-test controls. They exist only with ?amesea-test=1.
  if (new URLSearchParams(location.search).has("amesea-test")) {
    const panel = document.createElement("div");
    panel.id = "phase3-test-panel";
    panel.setAttribute("aria-label", "AMESEA test controls");
    panel.style.cssText = "position:fixed;left:8px;top:8px;z-index:9999;display:flex;gap:4px;padding:5px;background:#020713;border:1px solid #49eaff";
    panel.innerHTML = `
      <button data-test-action="depth300">TEST 300m</button>
      <button data-test-action="defeat">TEST 撃破</button>
      <button data-test-action="depth700">TEST 700m</button>
      <button data-test-action="depth1200">TEST 1200m</button>
      <button data-test-action="enemies">TEST ENEMIES</button>
      <button data-test-action="systems">TEST SYSTEMS</button>
      <button data-test-action="result">TEST RESULT</button>
      <output id="phase3-test-state"></output>`;
    document.body.append(panel);
    panel.addEventListener("click", event => {
      const action = event.target?.dataset?.testAction;
      if (!action || baseGame.state !== "running" && action !== "result") return;
      if (action === "depth300") {
        baseGame.elapsed = 300 / 5.2;
        baseGame.depth = 300;
      } else if (action === "defeat") {
        if (baseGame.boss && !baseGame.boss.dead) baseGame.boss.takeDamage(baseGame.boss.hp + 1, baseGame);
      } else if (action === "depth700") {
        if (baseGame.boss && !baseGame.boss.dead) baseGame.boss.takeDamage(baseGame.boss.hp + 1, baseGame);
        baseGame.bossTriggered = true;
        baseGame.elapsed = 700 / 5.2;
        baseGame.depth = 700;
      } else if (action === "depth1200") {
        if (baseGame.boss && !baseGame.boss.dead) baseGame.boss.takeDamage(baseGame.boss.hp + 1, baseGame);
        baseGame.bossTriggered = true;
        baseGame.phase3.abyssTriggered = true;
        baseGame.elapsed = 1200 / 5.2;
        baseGame.depth = 1200;
      } else if (action === "enemies") {
        for (const type of Object.keys(NEW_ENEMY_DATA)) baseGame.spawnEnemy(type);
        document.querySelector("#phase3-test-state").textContent =
          baseGame.enemies.filter(enemy => NEW_ENEMY_DATA[enemy.type]).map(enemy => enemy.type).join(",");
      } else if (action === "systems") {
        for (const synergy of Object.values(SYNERGIES)) baseGame.phase3.tags[synergy.id] = synergy.threshold;
        evaluateSynergies(baseGame);
        baseGame.phase3.metrics.fishKills = 30;
        baseGame.phase3.metrics.neonKills = 10;
        baseGame.phase3.metrics.dashPasses = 5;
        baseGame.phase3.metrics.memories = 2;
        baseGame.phase3.metrics.dreamCollected = 10;
        baseGame.phase3.metrics.bosses = 1;
        baseGame.phase3.metrics.lowHpSeconds = 30;
        baseGame.depth = Math.max(baseGame.depth, 300);
        updateMissions(baseGame);
      } else if (action === "result") {
        if (baseGame.state === "running") baseGame.gameOver();
      }
    });
    setInterval(() => {
      if (baseGame.state === "running" && baseGame.player) {
        baseGame.player.invulnerable = Math.max(baseGame.player.invulnerable, .24);
      }
    }, 90);
  }
})();
