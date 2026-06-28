(() => {
  "use strict";

  const game = window.AMESEA?.game;
  if (!game || !window.AMESEA3 || !window.AMESEA4) {
    console.warn("AMESEA Development 5: 既存システムを読み込めませんでした。");
    return;
  }

  const SAVE_KEY = "amesea_neon_abyss_phase5_v1";
  const VERSION = 5;
  const TODAY = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const safeNumber = value => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
  };
  const unique = values => [...new Set(values)];
  const formatDuration = seconds => {
    const total = Math.floor(safeNumber(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor(total % 3600 / 60);
    const s = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ============================================================
  // Development 5 data
  // ============================================================
  const ZONE5 = {
    id: "neon_abyss", name: "ネオン奈落", range: "1500m〜1999m",
    min: 1500, max: 1999, accent: "#ff3bd4",
    colors: ["#17001f", "#010004"], visibility: .48, events: 2.08,
    message: "光は武器で、看板で、獲物の印になる。",
    weights: { fish: 6, jelly: 17, blob: 20, mirror: 16, angler: 14, eel: 11, clown: 16 }
  };
  const ZONE6 = {
    id: "dream_core", name: "夢核深淵", range: "2000m〜∞",
    min: 2000, max: Infinity, accent: "#ffdf5a",
    colors: ["#16061f", "#000002"], visibility: .42, events: 2.35,
    message: "夢の核心。ここから先は、記録そのものが報酬だ。",
    weights: { fish: 4, jelly: 13, blob: 22, mirror: 17, angler: 15, eel: 12, clown: 17 }
  };

  const ARTIFACTS = [
    { id: "neon_crown", icon: "♛", name: "ネオン王冠", rarity: "RARE", color: "#58f8ff",
      desc: "光量が高いほど攻撃力アップ。敵出現率も上昇。" },
    { id: "honest_engine", icon: "爆", name: "バカ正直エンジン", rarity: "RARE", color: "#ff9a4c",
      desc: "ダッシュ距離アップ、終了時に爆発。直後に短い隙。" },
    { id: "family_pendant", icon: "♥", name: "家族のペンダント", rarity: "EPIC", color: "#ffe99d",
      desc: "致命傷を1回耐え、少し回復する。" },
    { id: "dream_heart", icon: "夢", name: "夢見る心臓", rarity: "EPIC", color: "#d26bff",
      desc: "レベルアップ候補が4択になる。敵HPが少し上昇。" },
    { id: "deep_suit", icon: "圧", name: "深海スーツ", rarity: "COMMON", color: "#77a8ff",
      desc: "視界悪化を軽減。移動速度が少し低下。" },
    { id: "approval_mirror", icon: "◇", name: "承認欲求ミラー", rarity: "RARE", color: "#62fff0",
      desc: "敵撃破時、低確率で攻撃するネオン分身を生成。" },
    { id: "ikemen_afterimage", icon: "影", name: "イケメン残像", rarity: "COMMON", color: "#7caeff",
      desc: "ダッシュ後の残像が近くの敵を引きつける。" },
    { id: "kindness_barrier", icon: "守", name: "優しさバリア", rarity: "RARE", color: "#fff2a8",
      desc: "家族の記憶取得時、一定時間バリア。" },
    { id: "dream_return", icon: "返", name: "夢喰い返し", rarity: "COMMON", color: "#bc74ff",
      desc: "夢喰い系へのダメージと夢の欠片の吸引範囲アップ。" },
    { id: "roland_mic", icon: "声", name: "ローランド・マイク", rarity: "EPIC", color: "#ff65dc",
      desc: "ネオン発動時に周囲を吹き飛ばす。再使用は少し延長。" },
    { id: "abyss_shoes", icon: "靴", name: "深海王の靴", rarity: "COMMON", color: "#5fd7ff",
      desc: "移動速度アップ。暗流中はさらに速くなる。" },
    { id: "bright_card", icon: "名", name: "光りすぎた名刺", rarity: "EPIC", color: "#ffe45f",
      desc: "レア敵・報酬率アップ。敵出現率も上昇。" }
  ];

  const EVENTS = [
    { id: "memory_current", name: "記憶潮流", duration: 14, spawnFactor: 1.35, color: "#ffe99d",
      desc: "家族の記憶が増えるが、記憶狩りの影も灯を狙う。" },
    { id: "neon_overcharge", name: "ネオン過充電", duration: 12, spawnFactor: 2.05, color: "#55fbff",
      desc: "ポジティブ・ネオンが強化され、敵も大幅に増える。" },
    { id: "core_reaction", name: "夢核反応", duration: 13, spawnFactor: 1.85, color: "#ce6cff",
      desc: "夢の欠片が噴き出し、夢喰い系が急増する。" },
    { id: "lightless_pressure", name: "無光圧", duration: 12, spawnFactor: .92, color: "#727aab",
      desc: "視界が大幅に狭まる代わり、アーティファクト率が上がる。" }
  ];
  const EVENT_BY_ID = Object.fromEntries(EVENTS.map(item => [item.id, item]));

  const RULE_POOL = [
    { id: "enemy_rush", name: "敵影増幅", desc: "敵出現率 +28%" },
    { id: "healing_low", name: "回復枯渇", desc: "家族の記憶ドロップ減少" },
    { id: "neon_high", name: "常時発光", desc: "最低光量アップ／危険度上昇" },
    { id: "dash_fast", name: "軽圧ダッシュ", desc: "ダッシュ再使用 -30%" },
    { id: "boss_hp", name: "王の体力", desc: "ボスHP +22%" },
    { id: "dream_bonus", name: "夢の配当", desc: "夢の欠片取得量 +1" },
    { id: "vision_narrow", name: "狭窄視界", desc: "視界 -25%" },
    { id: "burst_gain", name: "自意識加速", desc: "バースト獲得 +45%" }
  ];

  const MEMORY_LOGS = [
    { id: "light_to_guard", title: "灯を守るということ", hint: "家族記憶の影を撃破",
      text: "守った光は、こちらを守り返した。優しさはたぶん、いちばん遅く届く反撃だ。" },
    { id: "abyss_business_card", title: "奈落の名刺交換", hint: "1500mに到達",
      text: "暗闇が深いほどネオンはよく目立つ。ユウタは奈落にも、堂々と名前を置いていった。" },
    { id: "roland_sun", title: "深海の太陽", hint: "ローランド・リヴァイアサンを撃破",
      text: "太陽は上にあるものだと思っていた。違う。光る覚悟がある場所に、太陽は生まれる。" },
    { id: "core_door", title: "夢核の扉", hint: "2000mに到達",
      text: "海の底に扉はない。だからユウタは、自意識で壁を扉だと言い張った。" },
    { id: "amesea_name", title: "アメシーという名前", hint: "夢核アメシーを撃破",
      text: "敵の名も、自分の名も、同じ音だった。倒すべきは自分ではなく、自分を終わりにする物語だ。" },
    { id: "artifact_voice", title: "拾った夢の声", hint: "アーティファクトを初取得",
      text: "誰かの夢が道具になって沈んでいる。借りた光は、次の誰かへ返せばいい。" },
    { id: "daily_sea", title: "今日だけの海", hint: "デイリーに挑戦",
      text: "海は毎日同じ顔をしない。ユウタもだ。前髪の角度だけは、だいたい同じだ。" },
    { id: "endless_after", title: "エンディングのあと", hint: "夢核アメシー撃破後に2100mへ",
      text: "終わりを越えても深度計は動いていた。なら続けよう。記録は、未来への短い手紙だ。" }
  ];

  const QUESTS = [
    { id: "q_depth2000", name: "夢核への航路", desc: "最高深度2000mに到達", target: 2000, stat: "maxDepth", reward: 18 },
    { id: "q_boss12", name: "王たちの残響", desc: "ボスを累計12体撃破", target: 12, stat: "bossKills", reward: 14 },
    { id: "q_artifact30", name: "夢の収集家", desc: "アーティファクトを累計30個取得", target: 30, stat: "artifactPickups", reward: 16 },
    { id: "q_daily7", name: "七日分の深海", desc: "デイリーに累計7回挑戦", target: 7, stat: "dailyPlays", reward: 12 },
    { id: "q_core3", name: "核心は三度光る", desc: "夢核アメシーを3回撃破", target: 3, stat: "ameseaKills", reward: 25 },
    { id: "q_tier2", name: "夢は枝になる", desc: "夢ツリー第2層を5個取得", target: 5, stat: "tier2Owned", reward: 20 }
  ];

  const NEW_ACHIEVEMENTS = [
    { id: "v5_depth1200", name: "守るための深度", desc: "1200mに到達", reward: 3, test: () => stats().maxDepth >= 1200 || game.depth >= 1200 },
    { id: "v5_depth1500", name: "ネオン奈落の主役", desc: "1500mに到達", reward: 4, test: () => stats().maxDepth >= 1500 || game.depth >= 1500 },
    { id: "v5_depth2000", name: "夢核到達", desc: "2000mに到達", reward: 6, test: () => stats().maxDepth >= 2000 || game.depth >= 2000 },
    { id: "v5_family", name: "灯を守る者", desc: "家族記憶の影を撃破", reward: 4, test: () => stats().familyBossKills >= 1 },
    { id: "v5_roland", name: "深海に太陽はいらない", desc: "現代ローランド・リヴァイアサンを撃破", reward: 5, test: () => stats().rolandKills >= 1 },
    { id: "v5_amesea", name: "夢の核心より先へ", desc: "夢核アメシーを撃破", reward: 8, test: () => stats().ameseaKills >= 1 },
    { id: "v5_artifact1", name: "拾った夢は強い", desc: "アーティファクトを初取得", reward: 2, test: () => stats().artifactPickups >= 1 },
    { id: "v5_artifact30", name: "十二の光、三十の記録", desc: "アーティファクトを累計30個取得", reward: 5, test: () => stats().artifactPickups >= 30 },
    { id: "v5_daily1", name: "今日の海へ", desc: "デイリーチャレンジを初めて遊ぶ", reward: 2, test: () => stats().dailyPlays >= 1 },
    { id: "v5_daily1000", name: "日課が深すぎる", desc: "デイリーで1000mに到達", reward: 5, test: () => stats().dailyBestDepth >= 1000 },
    { id: "v5_tier2", name: "夢の第二枝", desc: "夢ツリー第2層を初めて取得", reward: 3, test: () => stats().tier2Owned >= 1 }
  ];

  const CODEX_BOSSES = [
    { id: "family_shadow", name: "家族記憶の影", color: "#ffe798", desc: "1200m。記憶の灯を守る戦い。弾幕・接近・召喚を使う。" },
    { id: "roland_leviathan", name: "現代ローランド・リヴァイアサン", color: "#ff55d8", desc: "1500m。光量へ反応し、ポジティブ返しとネオンバーストを放つ。" },
    { id: "core_amesea", name: "夢核アメシー", color: "#ffe35c", desc: "2000m。過去の攻撃を束ねる3フェーズの夢核。" }
  ];

  function defaultSave() {
    const p3 = window.AMESEA3.save;
    return {
      version: VERSION,
      discoveredArtifacts: {},
      codex: { zones: {}, bosses: {}, events: {} },
      treeTier2: {},
      logs: {},
      quests: Object.fromEntries(QUESTS.map(q => [q.id, { claimed: false }])),
      records: {
        casual: { maxDepth: safeNumber(p3.records?.casual?.maxDepth), bestKills: safeNumber(p3.records?.casual?.bestKills), bestLevel: 0 },
        normal: { maxDepth: safeNumber(p3.records?.normal?.maxDepth), bestKills: safeNumber(p3.records?.normal?.bestKills), bestLevel: 0 },
        deep: { maxDepth: safeNumber(p3.records?.deep?.maxDepth), bestKills: safeNumber(p3.records?.deep?.bestKills), bestLevel: 0 }
      },
      daily: {},
      stats: {
        maxDepth: Math.max(safeNumber(game.save.data.maxDepth), safeNumber(p3.records?.maxEverDepth)),
        totalPlaySeconds: 0, bossKills: safeNumber(game.save.data.records?.bossKills),
        familyBossKills: 0, rolandKills: 0, ameseaKills: 0,
        artifactPickups: 0, dailyPlays: 0, dailyBestDepth: 0,
        tier2Owned: 0, highestZone: 1, synergyUse: {}
      },
      clearMark: false
    };
  }

  function loadSave() {
    const fresh = defaultSave();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return fresh;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return fresh;
      for (const artifact of ARTIFACTS) fresh.discoveredArtifacts[artifact.id] = parsed.discoveredArtifacts?.[artifact.id] === true;
      for (const group of ["zones", "bosses", "events"]) {
        for (const [id, found] of Object.entries(parsed.codex?.[group] || {})) if (found === true) fresh.codex[group][id] = true;
      }
      for (const route of TIER2_NODES) for (const node of route.nodes) fresh.treeTier2[node.id] = parsed.treeTier2?.[node.id] === true;
      for (const log of MEMORY_LOGS) fresh.logs[log.id] = parsed.logs?.[log.id] === true;
      for (const quest of QUESTS) fresh.quests[quest.id] = { claimed: parsed.quests?.[quest.id]?.claimed === true };
      for (const id of ["casual", "normal", "deep"]) {
        fresh.records[id].maxDepth = Math.max(fresh.records[id].maxDepth, safeNumber(parsed.records?.[id]?.maxDepth));
        fresh.records[id].bestKills = Math.max(fresh.records[id].bestKills, safeNumber(parsed.records?.[id]?.bestKills));
        fresh.records[id].bestLevel = safeNumber(parsed.records?.[id]?.bestLevel);
      }
      for (const [date, record] of Object.entries(parsed.daily || {})) {
        fresh.daily[date] = {
          maxDepth: safeNumber(record?.maxDepth), bestKills: safeNumber(record?.bestKills),
          bestDreams: safeNumber(record?.bestDreams), bestLevel: safeNumber(record?.bestLevel),
          plays: safeNumber(record?.plays)
        };
      }
      for (const key of Object.keys(fresh.stats)) {
        if (key === "synergyUse") continue;
        fresh.stats[key] = Math.max(fresh.stats[key], safeNumber(parsed.stats?.[key]));
      }
      for (const [id, count] of Object.entries(parsed.stats?.synergyUse || {})) fresh.stats.synergyUse[id] = safeNumber(count);
      fresh.clearMark = parsed.clearMark === true;
      fresh.version = VERSION;
      return fresh;
    } catch (error) {
      console.warn("AMESEA Development 5: 追加セーブを安全に移行しました。", error);
      return fresh;
    }
  }

  let save;
  function saveNow() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      return true;
    } catch (error) {
      console.warn("AMESEA Development 5: セーブに失敗しました。", error);
      return false;
    }
  }
  function stats() { return save.stats; }

  // Declared before loading because migration validates tier-two nodes.
  function tier2Route(id, nodes) { return { id, nodes }; }
  const TIER2_NODES = [
    tier2Route("roland", [
      { id: "roland_chainlight", name: "喝采はまだ終わらない", desc: "ネオン中の撃破で持続時間を少し延長", cost: 18, tier: 2 },
      { id: "roland_control", name: "眩しさの統率者", desc: "バースト中の敵増加リスクを軽減", cost: 26, tier: 2 }
    ]),
    tier2Route("ikemen", [
      { id: "ikemen_counter", name: "完璧なすれ違い", desc: "ジャスト回避時にカウンター弾", cost: 18, tier: 2 },
      { id: "ikemen_decoy", name: "残像まで主役", desc: "ダッシュ残像が敵を引きつける", cost: 25, tier: 2 }
    ]),
    tier2Route("baka", [
      { id: "baka_chain", name: "爆発は友達を呼ぶ", desc: "ダッシュ爆発撃破で連鎖爆発", cost: 19, tier: 2 },
      { id: "baka_frenzy", name: "瀕死ほど元気", desc: "HPが低いほど攻撃速度アップ", cost: 25, tier: 2 }
    ]),
    tier2Route("kindness", [
      { id: "kindness_slow", name: "記憶の静かな波", desc: "家族の記憶で周囲の敵を減速", cost: 18, tier: 2 },
      { id: "kindness_resolve", name: "約束はゲージになる", desc: "致命傷耐えでバーストゲージ獲得", cost: 27, tier: 2 }
    ]),
    tier2Route("abyss", [
      { id: "abyss_treasure", name: "深いほど目が利く", desc: "深度に応じてレア率アップ", cost: 20, tier: 2 },
      { id: "abyss_pressure", name: "暗闇を着こなす", desc: "視界が狭いほど被ダメージ軽減", cost: 27, tier: 2 }
    ])
  ];
  save = loadSave();

  // ============================================================
  // Deterministic daily rules
  // ============================================================
  function hashSeed(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function seededRandom(seed) {
    let state = seed >>> 0 || 1;
    return () => {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
  }
  function todayRules() {
    const random = seededRandom(hashSeed(TODAY()));
    const pool = [...RULE_POOL];
    const selected = [];
    while (selected.length < 3 && pool.length) selected.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    return selected;
  }
  const dailyRules = todayRules();

  // ============================================================
  // Zone configuration and dream tree tier two
  // ============================================================
  const zones = window.AMESEA3.zones;
  const familyZone = zones.find(zone => zone.id === "family_abyss");
  if (familyZone) {
    familyZone.range = "1200m〜1499m";
    familyZone.max = 1499;
  }
  if (!zones.some(zone => zone.id === ZONE5.id)) zones.push(ZONE5, ZONE6);

  for (const route of TREE_ROUTES) {
    const extra = TIER2_NODES.find(group => group.id === route.id);
    if (extra && !route.nodes.some(node => node.tier === 2)) route.nodes.push(...extra.nodes);
  }

  const originalOwns = game.save.owns.bind(game.save);
  game.save.owns = id => originalOwns(id) || save.treeTier2[id] === true;
  const originalTreeBuy = DreamTreeUI.prototype.buy;
  DreamTreeUI.prototype.buy = function phase5TreeBuy(route, node, index) {
    if (node.tier !== 2) return originalTreeBuy.call(this, route, node, index);
    if (game.save.owns(node.id)) return this.say("すでに取得済みです。");
    const firstTierOwned = route.nodes.slice(0, 3).filter(item => originalOwns(item.id)).length;
    const previous = route.nodes[index - 1];
    if (firstTierOwned < 3 || (previous && !game.save.owns(previous.id))) return this.say("第1層の完成と前段階の取得が必要です。");
    if (game.save.data.dreams < node.cost) return this.say("夢の欠片が足りません。");
    game.save.data.dreams -= node.cost;
    save.treeTier2[node.id] = true;
    save.stats.tier2Owned = Object.values(save.treeTier2).filter(Boolean).length;
    game.save.save();
    saveNow();
    checkPhase5Achievements();
    unlockLog("artifact_voice", false);
    this.say(`${node.name} を取得。第2層の光が次のダイブから反映されます。`, route.color);
    this.render();
  };
  const originalTreeRender = DreamTreeUI.prototype.render;
  DreamTreeUI.prototype.render = function phase5TreeRender() {
    originalTreeRender.call(this);
    this.container.querySelectorAll(".tree-route").forEach(section => {
      const nodes = section.querySelectorAll(".tree-node");
      nodes.forEach((node, index) => {
        if (index < 3) node.dataset.tier = "1";
        else {
          node.dataset.tier = "2";
          node.querySelector("b").prepend("第2層・");
        }
      });
    });
  };

  // ============================================================
  // UI
  // ============================================================
  function makeOverlay(id, html) {
    const section = document.createElement("section");
    section.id = id;
    section.className = "overlay phase5-overlay hidden";
    section.innerHTML = html;
    document.querySelector("#game-shell").append(section);
    return section;
  }

  const titleActions = document.querySelector(".title-actions");
  const dailyButton = document.createElement("button");
  dailyButton.id = "daily-button";
  dailyButton.className = "secondary phase5-title-button";
  dailyButton.textContent = "デイリーチャレンジ";
  const recordsButton = document.createElement("button");
  recordsButton.id = "records-button";
  recordsButton.className = "secondary phase5-title-button";
  recordsButton.textContent = "記録";
  const endgameButton = document.createElement("button");
  endgameButton.id = "endgame-button";
  endgameButton.className = "secondary phase5-title-button";
  endgameButton.textContent = "終盤ジャーナル";
  titleActions.append(dailyButton, recordsButton, endgameButton);

  const dailyCard = document.createElement("section");
  dailyCard.id = "daily-card";
  dailyCard.innerHTML = `<b>DAILY / ${TODAY()}</b><div>${dailyRules.map(rule => `<span title="${rule.desc}">${rule.name}</span>`).join("")}</div><small>今日のルールは日付シードで固定。何度でも最高記録を更新できます。</small>`;
  document.querySelector("#tutorial-status").after(dailyCard);

  const clearMark = document.createElement("span");
  clearMark.id = "phase5-clear-mark";
  clearMark.textContent = "✦ 夢核踏破";
  clearMark.classList.toggle("hidden", !save.clearMark);
  document.querySelector(".hero-panel h1").append(clearMark);

  const artifactHud = document.createElement("aside");
  artifactHud.id = "artifact-hud";
  artifactHud.innerHTML = `<b>ARTIFACT</b><div id="artifact-list"><span class="empty">未所持</span></div>`;
  document.querySelector("#hud").append(artifactHud);

  const recordsScreen = makeOverlay("records-screen", `
    <div class="phase5-panel">
      <header><div><div class="eyebrow">ENDLESS DIVE RECORDS</div><h2>深度記録</h2></div><b id="record-zone"></b></header>
      <div id="records-content"></div>
      <div class="phase5-actions"><button class="primary" data-phase5-close>タイトルへ戻る</button></div>
    </div>`);

  const journalScreen = makeOverlay("endgame-screen", `
    <div class="phase5-panel">
      <header><div><div class="eyebrow">DEVELOPMENT 5 ARCHIVE</div><h2>終盤ジャーナル</h2></div><div id="journal-progress"></div></header>
      <nav id="journal-tabs" class="phase5-tabs">
        <button data-journal="zones" class="active">ゾーン</button><button data-journal="bosses">ボス</button>
        <button data-journal="artifacts">アーティファクト</button><button data-journal="events">イベント</button>
        <button data-journal="quests">長期クエスト</button><button data-journal="logs">記憶ログ</button>
      </nav>
      <div id="journal-content" class="phase5-grid"></div>
      <div class="phase5-actions"><button class="primary" data-phase5-close>タイトルへ戻る</button></div>
    </div>`);

  const debugPanel = document.createElement("aside");
  debugPanel.id = "phase5-debug";
  debugPanel.className = "hidden";
  debugPanel.innerHTML = `
    <header><b>AMESEA DEV 5</b><button data-debug="close" aria-label="閉じる">×</button></header>
    <output id="debug-metrics">FPS --</output>
    <div class="debug-buttons">
      <button data-debug="dream">夢の欠片 +100</button><button data-debug="depth">深度 +100m</button>
      ${[300, 700, 1200, 1500, 2000].map(value => `<button data-jump="${value}">${value}m</button>`).join("")}
      ${EVENTS.map(item => `<button data-debug-event="${item.id}">${item.name}</button>`).join("")}
      <button data-debug="achievements">全実績解除</button><button data-debug="codex">全図鑑解放</button>
      <button data-debug="reset" class="danger">セーブ初期化</button>
    </div>`;
  document.body.append(debugPanel);

  const resultArtifacts = document.createElement("section");
  resultArtifacts.id = "result-artifacts";
  resultArtifacts.innerHTML = "<h3>取得アーティファクト</h3><div></div>";
  document.querySelector(".result-detail-columns").after(resultArtifacts);
  const resultRecords = document.createElement("div");
  resultRecords.id = "result-records";
  resultArtifacts.after(resultRecords);

  let journalTab = "zones";
  function openPhase5Screen(screen) {
    document.querySelector("#start-screen").classList.add("hidden");
    document.querySelector("#gameover-screen").classList.add("hidden");
    document.querySelectorAll(".phase5-overlay").forEach(item => item.classList.add("hidden"));
    screen.classList.remove("hidden");
    game.state = "phase5-menu";
  }
  function closePhase5Screens() {
    document.querySelectorAll(".phase5-overlay").forEach(item => item.classList.add("hidden"));
    document.querySelector("#start-screen").classList.remove("hidden");
    game.state = "start";
    game.refreshTitle();
  }
  recordsScreen.querySelector("[data-phase5-close]").addEventListener("click", closePhase5Screens);
  journalScreen.querySelector("[data-phase5-close]").addEventListener("click", closePhase5Screens);
  recordsButton.addEventListener("click", () => { renderRecords(); openPhase5Screen(recordsScreen); });
  endgameButton.addEventListener("click", () => { renderJournal(); openPhase5Screen(journalScreen); });
  journalScreen.addEventListener("click", event => {
    const tab = event.target.closest("[data-journal]");
    if (tab) {
      journalTab = tab.dataset.journal;
      renderJournal();
      return;
    }
    const claim = event.target.closest("[data-quest-claim]");
    if (claim) claimQuest(claim.dataset.questClaim);
  });

  function favoriteSynergy() {
    const entries = Object.entries(save.stats.synergyUse).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return "まだ記録なし";
    const synergy = window.AMESEA3.synergies[entries[0][0]];
    return `${synergy?.name || entries[0][0]} ×${entries[0][1]}`;
  }
  function renderRecords() {
    const daily = save.daily[TODAY()] || { maxDepth: 0, bestKills: 0, bestDreams: 0, bestLevel: 0, plays: 0 };
    const difficulties = window.AMESEA3.difficulties;
    document.querySelector("#record-zone").textContent = `最高到達：ZONE ${save.stats.highestZone} / ${zoneForDepth(save.stats.maxDepth).name}`;
    document.querySelector("#records-content").innerHTML = `
      <section class="record-difficulty">
        ${["casual", "normal", "deep"].map(id => {
          const record = save.records[id];
          return `<article><b>${difficulties[id].name}</b><span>最高深度 <strong>${Math.floor(record.maxDepth)}m</strong></span><span>最高撃破 <strong>${Math.floor(record.bestKills)}</strong></span><span>最高レベル <strong>LV.${Math.floor(record.bestLevel)}</strong></span></article>`;
        }).join("")}
      </section>
      <section class="record-summary">
        <article><small>今日のデイリー</small><b>${Math.floor(daily.maxDepth)}m / ${Math.floor(daily.bestKills)}撃破 / 欠片${Math.floor(daily.bestDreams)}</b></article>
        <article><small>累計プレイ時間</small><b>${formatDuration(save.stats.totalPlaySeconds)}</b></article>
        <article><small>累計ボス撃破</small><b>${Math.floor(save.stats.bossKills)}</b></article>
        <article><small>夢核アメシー撃破</small><b>${Math.floor(save.stats.ameseaKills)}</b></article>
        <article><small>よく使ったシナジー</small><b>${favoriteSynergy()}</b></article>
        <article><small>発見アーティファクト</small><b>${ARTIFACTS.filter(a => save.discoveredArtifacts[a.id]).length} / ${ARTIFACTS.length}</b></article>
      </section>`;
  }

  function journalEntries() {
    if (journalTab === "zones") {
      return zones.map((zone, index) => ({
        found: save.codex.zones[zone.id] || save.stats.maxDepth >= zone.min,
        color: zone.accent, name: `ZONE ${index + 1}：${zone.name}`, tag: zone.range, desc: zone.message
      }));
    }
    if (journalTab === "bosses") {
      return CODEX_BOSSES.map(item => ({ ...item, found: save.codex.bosses[item.id] }));
    }
    if (journalTab === "artifacts") {
      return ARTIFACTS.map(item => ({ ...item, found: save.discoveredArtifacts[item.id], tag: item.rarity }));
    }
    if (journalTab === "events") {
      return EVENTS.map(item => ({ ...item, found: save.codex.events[item.id], tag: `${item.duration}秒` }));
    }
    if (journalTab === "logs") {
      return MEMORY_LOGS.map(item => ({
        found: save.logs[item.id], color: "#ffe596", name: item.title, tag: item.hint, desc: item.text
      }));
    }
    return [];
  }
  function renderJournal() {
    document.querySelectorAll("#journal-tabs button").forEach(button => button.classList.toggle("active", button.dataset.journal === journalTab));
    const content = document.querySelector("#journal-content");
    if (journalTab === "quests") {
      const complete = QUESTS.filter(q => questProgress(q) >= q.target).length;
      document.querySelector("#journal-progress").textContent = `${complete} / ${QUESTS.length}`;
      content.innerHTML = QUESTS.map(quest => {
        const progress = Math.min(quest.target, questProgress(quest));
        const state = save.quests[quest.id];
        const completeNow = progress >= quest.target;
        return `<article class="phase5-card quest ${completeNow ? "found" : ""}">
          <b>${state.claimed ? "✓ " : ""}${quest.name}</b><small>${quest.desc}</small>
          <div class="quest-meter"><i style="width:${progress / quest.target * 100}%"></i></div>
          <p>${Math.floor(progress)} / ${quest.target}　報酬 ${quest.reward}欠片</p>
          ${completeNow && !state.claimed ? `<button class="primary" data-quest-claim="${quest.id}">報酬受取</button>` : ""}
        </article>`;
      }).join("");
      return;
    }
    const entries = journalEntries();
    const found = entries.filter(entry => entry.found).length;
    document.querySelector("#journal-progress").textContent = `${found} / ${entries.length}`;
    content.innerHTML = entries.map(entry => `<article class="phase5-card ${entry.found ? "found" : "locked"}" style="--card-color:${entry.color || "#65eaff"}">
      <b>${entry.found ? (entry.icon ? `${entry.icon} ` : "") + entry.name : "？？？"}</b>
      <small>${entry.found ? entry.tag || "DISCOVERED" : "UNDISCOVERED"}</small>
      <p>${entry.found ? entry.desc : journalTab === "logs" ? entry.tag : "深海で発見すると記録されます。"}</p>
    </article>`).join("");
  }
  function questProgress(quest) { return safeNumber(save.stats[quest.stat]); }
  function claimQuest(id) {
    const quest = QUESTS.find(item => item.id === id);
    const state = save.quests[id];
    if (!quest || !state || state.claimed || questProgress(quest) < quest.target) return;
    state.claimed = true;
    game.save.data.dreams += quest.reward;
    game.save.save();
    saveNow();
    notify("QUEST REWARD", `${quest.name}　夢の欠片 +${quest.reward}`, "#ffe56b");
    renderJournal();
  }

  // ============================================================
  // Artifacts
  // ============================================================
  function ownsArtifact(id, currentGame = game) {
    return Boolean(currentGame.phase5?.artifacts?.some(item => item.id === id));
  }
  function renderArtifactHud(currentGame = game) {
    const target = document.querySelector("#artifact-list");
    const artifacts = currentGame.phase5?.artifacts || [];
    target.innerHTML = artifacts.length
      ? artifacts.map(item => `<span style="--artifact-color:${item.color}" title="${item.name}：${item.desc}">${item.icon}<small>${item.name}</small></span>`).join("")
      : '<span class="empty">未所持</span>';
  }
  function applyArtifact(artifact, currentGame) {
    const player = currentGame.player;
    if (!player) return;
    if (artifact.id === "honest_engine") player.dashDuration += .075;
    else if (artifact.id === "family_pendant") {
      player.fatalGuardMax += 1; player.fatalGuard += 1;
    } else if (artifact.id === "deep_suit") {
      player.darknessAdapt = Math.min(.88, player.darknessAdapt + .25); player.moveSpeed *= .95;
    } else if (artifact.id === "dream_return") player.magnetRange += 55;
    else if (artifact.id === "roland_mic") player.neonCooldownMax *= 1.1;
    else if (artifact.id === "abyss_shoes") player.moveSpeed *= 1.08;
    else if (artifact.id === "bright_card") player.rareBonus += .055;
  }
  function acquireArtifact(id = null, source = "深海") {
    if (game.state !== "running" || !game.phase5) return false;
    const available = ARTIFACTS.filter(item => !ownsArtifact(item.id));
    const artifact = id ? ARTIFACTS.find(item => item.id === id) : pick(available);
    if (!artifact || ownsArtifact(artifact.id)) return false;
    game.phase5.artifacts.push(artifact);
    save.discoveredArtifacts[artifact.id] = true;
    save.stats.artifactPickups += 1;
    applyArtifact(artifact, game);
    renderArtifactHud();
    unlockLog("artifact_voice");
    game.flash = Math.max(game.flash, .5);
    game.ring(game.player.x, game.player.y, artifact.color, 35);
    notify("ARTIFACT GET", `${artifact.icon} ${artifact.name} / ${source}`, artifact.color);
    saveNow();
    checkPhase5Achievements();
    return artifact;
  }

  class ArtifactOrb {
    constructor(x, y, guaranteedRare = false) {
      this.x = x; this.y = y; this.radius = 15; this.dead = false;
      this.life = 24; this.phase = rand(0, TAU); this.guaranteedRare = guaranteedRare;
    }
    update(dt, currentGame) {
      this.life -= dt; this.phase += dt * 3;
      const player = currentGame.player;
      const d = distance(this, player);
      if (d < player.magnetRange * 1.45 && d > 1) {
        const force = 160 + (1 - d / Math.max(1, player.magnetRange * 1.45)) * 410;
        this.x += (player.x - this.x) / d * force * dt;
        this.y += (player.y - this.y) / d * force * dt;
      }
      if (d < this.radius + player.radius) {
        this.dead = true;
        acquireArtifact(null, this.guaranteedRare ? "無光圧レア報酬" : "アーティファクト・オーブ");
      }
      if (this.life <= 0) this.dead = true;
    }
    draw(ctx, visibility = 1) {
      ctx.save(); ctx.globalAlpha = Math.max(.2, visibility); ctx.translate(this.x, this.y);
      ctx.rotate(this.phase); ctx.shadowColor = "#ffe65f"; ctx.shadowBlur = 28;
      ctx.strokeStyle = "#ffe65f"; ctx.fillStyle = "rgba(255,229,89,.18)"; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = i / 8 * TAU; const radius = i % 2 ? 8 : 17;
        const px = Math.cos(angle) * radius; const py = Math.sin(angle) * radius;
        if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  }
  function dropArtifactOrb(x, y, rare = false) {
    if (!game.phase5 || game.phase5.artifacts.length >= ARTIFACTS.length) return false;
    game.items.push(new ArtifactOrb(clamp(x, 30, game.width - 30), clamp(y, 40, game.height - 30), rare));
    return true;
  }

  class NeonClone {
    constructor(x, y) { this.x = x; this.y = y; this.life = 5; this.timer = 0; this.phase = 0; }
    update(dt, currentGame) {
      this.life -= dt; this.timer -= dt; this.phase += dt * 4;
      this.x += Math.cos(this.phase) * 18 * dt; this.y += Math.sin(this.phase * .7) * 14 * dt;
      if (this.timer <= 0) {
        const targets = [...currentGame.enemies, ...(currentGame.boss && !currentGame.boss.dead ? [currentGame.boss] : [])]
          .filter(item => !item.dead).sort((a, b) => distance(this, a) - distance(this, b));
        const target = targets[0];
        if (target) {
          this.timer = .48;
          const angle = Math.atan2(target.y - this.y, target.x - this.x);
          const projectile = new Projectile(this.x, this.y, angle, currentGame.player);
          projectile.damage *= .42; projectile.color = "#62fff0";
          currentGame.projectiles.push(projectile);
        }
      }
    }
    draw(ctx) {
      ctx.save(); ctx.globalAlpha = clamp(this.life / 2, 0, .55); ctx.translate(this.x, this.y);
      ctx.strokeStyle = "#62fff0"; ctx.shadowColor = "#62fff0"; ctx.shadowBlur = 20; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.moveTo(-9, -3); ctx.lineTo(9, -3); ctx.stroke(); ctx.restore();
    }
  }

  // ============================================================
  // Phase 5 bosses and memory-defense enemy
  // ============================================================
  function pushEnemyBullet(currentGame, x, y, angle, speed, damage, color) {
    if (currentGame.enemyProjectiles.length >= 210) return;
    currentGame.enemyProjectiles.push(new EnemyProjectile(x, y, angle, speed, damage, color));
  }

  class MemoryHunter {
    constructor(x, y, owner, currentGame) {
      this.x = x; this.y = y; this.owner = owner; this.radius = 17;
      this.maxHp = 80 * currentGame.difficulty.hp; this.hp = this.maxHp;
      this.damage = 7 * currentGame.difficulty.damage; this.speed = 105 * currentGame.difficulty.speed;
      this.dead = false; this.noReward = false; this.type = "memory_hunter"; this.color = "#ff6b9d";
      this.xp = 3; this.elite = false; this.attackCooldown = 0; this.phase = rand(0, TAU);
    }
    update(dt, currentGame) {
      this.phase += dt * 3; this.attackCooldown -= dt;
      const light = this.owner.light;
      const target = light && !light.failed && light.timer > 0 ? light : currentGame.player;
      const dx = target.x - this.x; const dy = target.y - this.y; const d = Math.max(1, Math.hypot(dx, dy));
      this.x += dx / d * this.speed * dt; this.y += dy / d * this.speed * dt;
      if (target === light && d < this.radius + 22 && this.attackCooldown <= 0) {
        this.attackCooldown = .75; light.hp -= this.damage;
        currentGame.spark(light.x, light.y, "#ff6b9d", 7);
        if (light.hp <= 0) this.owner.breakLight(currentGame);
      } else if (target === currentGame.player && d < this.radius + target.radius && this.attackCooldown <= 0) {
        this.attackCooldown = .8; target.takeDamage(this.damage, currentGame, "contact");
      }
    }
    takeDamage(amount, currentGame) {
      this.hp -= amount;
      if (this.hp <= 0 && !this.dead) { this.dead = true; currentGame.onEnemyKilled(this); }
    }
    draw(ctx, visibility = 1) {
      ctx.save(); ctx.globalAlpha = Math.max(.12, visibility); ctx.translate(this.x, this.y);
      ctx.strokeStyle = "#ff6b9d"; ctx.fillStyle = "rgba(255,50,110,.2)"; ctx.shadowColor = "#ff4d91"; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, TAU); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke(); ctx.fill(); ctx.restore();
    }
  }

  class Phase5Boss {
    constructor(currentGame, config) {
      this.game = currentGame; this.id = config.id; this.name = config.name;
      this.x = currentGame.width / 2; this.y = -130; this.radius = config.radius;
      this.maxHp = (config.hp + currentGame.player.level * config.levelHp) * currentGame.difficulty.hp;
      if (currentGame.mode === "daily" && currentGame.phase5.dailyIds.has("boss_hp")) {
        this.maxHp *= 1.22;
        this.__p5DailyScaled = true;
      }
      this.hp = this.maxHp; this.damage = config.damage * currentGame.difficulty.damage;
      this.speed = config.speed * currentGame.difficulty.speed; this.dead = false; this.entering = true;
      this.time = 0; this.hitFlash = 0; this.contactCooldown = 0; this.phase = 1; this.bulletTimer = 1;
      this.chargeTimer = 0; this.chargeVector = { x: 0, y: 1 };
      save.codex.bosses[this.id] = true; saveNow();
    }
    enter(dt, targetY = 160) {
      if (!this.entering) return false;
      this.y += 95 * dt;
      if (this.y >= Math.min(targetY, this.game.height * .26)) this.entering = false;
      return true;
    }
    orbitPlayer(dt, preferred = 280, wobble = .5) {
      const player = this.game.player;
      const dx = player.x - this.x; const dy = player.y - this.y; const d = Math.max(1, Math.hypot(dx, dy));
      const toward = d > preferred + 45 ? 1 : d < preferred - 45 ? -.5 : 0;
      this.x += (dx / d * toward + Math.cos(this.time * 1.2) * wobble) * this.speed * dt;
      this.y += (dy / d * toward + Math.sin(this.time) * wobble) * this.speed * dt;
      this.x = clamp(this.x, this.radius * .35, this.game.width - this.radius * .35);
      this.y = clamp(this.y, this.radius * .35, this.game.height - this.radius * .35);
    }
    touchPlayer() {
      this.contactCooldown -= 1 / 60;
      if (distance(this, this.game.player) < this.radius + this.game.player.radius && this.contactCooldown <= 0) {
        this.contactCooldown = .8; this.game.player.takeDamage(this.damage, this.game, "contact");
      }
    }
    radial(count, speed, damageScale, color, offset = this.time) {
      for (let i = 0; i < count; i++) pushEnemyBullet(this.game, this.x, this.y, offset + i / count * TAU, speed * this.game.difficulty.speed, this.damage * damageScale, color);
    }
    aimed(spread = 0, count = 1, speed = 260, color = "#ff5dd8", damageScale = .6) {
      const angle = Math.atan2(this.game.player.y - this.y, this.game.player.x - this.x);
      for (let i = 0; i < count; i++) {
        const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
        pushEnemyBullet(this.game, this.x, this.y, angle + offset, speed * this.game.difficulty.speed, this.damage * damageScale, color);
      }
    }
    takeDamage(amount, currentGame) {
      let value = amount;
      if (ownsArtifact("dream_return", currentGame) && (this.id === "core_amesea" || this.id === "family_shadow")) value *= 1.18;
      this.hp -= value; this.hitFlash = .1;
      if (this.hp <= 0 && !this.dead) { this.dead = true; defeatPhase5Boss(this); }
    }
    drawCore(ctx, color, secondary, shape = "ellipse") {
      ctx.save(); ctx.translate(this.x, this.y);
      ctx.strokeStyle = this.hitFlash > 0 ? "#fff" : color; ctx.fillStyle = `${secondary}77`;
      ctx.shadowColor = color; ctx.shadowBlur = 35 + this.phase * 5; ctx.lineWidth = 3 + this.phase;
      ctx.beginPath();
      if (shape === "ellipse") ctx.ellipse(0, 0, this.radius, this.radius * .62, Math.sin(this.time) * .06, 0, TAU);
      else {
        for (let i = 0; i <= 12; i++) {
          const angle = i / 12 * TAU; const r = this.radius * (i % 2 ? .72 : 1);
          const x = Math.cos(angle) * r; const y = Math.sin(angle) * r;
          if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-this.radius * .28, -8, 6, 0, TAU); ctx.arc(this.radius * .28, -8, 6, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  class FamilyShadowBoss extends Phase5Boss {
    constructor(currentGame) {
      super(currentGame, { id: "family_shadow", name: "家族記憶の影", radius: 72, hp: 2550, levelHp: 64, damage: 19, speed: 62 });
      this.light = { x: currentGame.width / 2, y: currentGame.height * .72, hp: 240 * currentGame.difficulty.hp, maxHp: 240 * currentGame.difficulty.hp, timer: 15, failed: false, success: false };
      this.summonTimer = 3.4; this.approachTimer = 4.2; this.lightAnnounced = false;
    }
    update(dt, currentGame) {
      this.time += dt; this.hitFlash = Math.max(0, this.hitFlash - dt);
      if (this.enter(dt)) return;
      if (!this.lightAnnounced) {
        this.lightAnnounced = true;
        currentGame.showQuote("その灯を、帰る場所まで守って。");
        notify("MEMORY DEFENSE", "15秒間「記憶の灯」を守れ", "#ffe79b");
      }
      if (!this.light.failed && !this.light.success) {
        this.light.timer -= dt;
        if (this.light.timer <= 0) this.protectLight(currentGame);
      }
      this.bulletTimer -= dt; this.summonTimer -= dt; this.approachTimer -= dt;
      if (this.approachTimer <= 0) {
        this.approachTimer = this.phase === 2 ? 3 : 4.7;
        const dx = currentGame.player.x - this.x, dy = currentGame.player.y - this.y, d = Math.max(1, Math.hypot(dx, dy));
        this.chargeVector = { x: dx / d, y: dy / d }; this.chargeTimer = .55;
      }
      if (this.chargeTimer > 0) {
        this.chargeTimer -= dt; this.x += this.chargeVector.x * 470 * currentGame.difficulty.speed * dt; this.y += this.chargeVector.y * 470 * currentGame.difficulty.speed * dt;
      } else this.orbitPlayer(dt, 300, .42);
      if (this.bulletTimer <= 0) {
        this.bulletTimer = this.phase === 2 ? 1.25 : 1.8;
        this.radial(this.phase === 2 ? 14 : 10, 195, .48, "#ff72b1", this.time * .8);
        this.aimed(.17, 3, 275, "#ffe59a", .58);
      }
      if (this.summonTimer <= 0 && currentGame.enemies.length < 96) {
        this.summonTimer = this.phase === 2 ? 3.8 : 5;
        for (let i = 0; i < (this.phase === 2 ? 3 : 2); i++) {
          currentGame.enemies.push(new MemoryHunter(this.x + rand(-50, 50), this.y + rand(-40, 40), this, currentGame));
        }
        currentGame.showMessage("記憶狩りの影", "#ff78ad");
      }
      if (this.hp < this.maxHp * .5) this.phase = 2;
      if (distance(this, currentGame.player) < this.radius + currentGame.player.radius && this.contactCooldown <= 0) {
        this.contactCooldown = .85; currentGame.player.takeDamage(this.damage, currentGame, "contact");
      }
      this.contactCooldown -= dt;
    }
    breakLight(currentGame) {
      if (this.light.failed || this.light.success) return;
      this.light.failed = true; this.phase = 2; this.speed *= 1.2; this.damage *= 1.12;
      currentGame.flash = .8; currentGame.shake = 16;
      notify("MEMORY LOST", "灯が壊れ、家族記憶の影が強化", "#ff568f");
    }
    protectLight(currentGame) {
      if (this.light.failed || this.light.success) return;
      this.light.success = true;
      currentGame.player.hp = Math.min(currentGame.player.maxHp, currentGame.player.hp + currentGame.player.maxHp * .28);
      currentGame.player.memoryShield = Math.max(currentGame.player.memoryShield, 10);
      this.hp -= this.maxHp * .12;
      currentGame.flash = .65; currentGame.ring(this.light.x, this.light.y, "#fff0a1", 52);
      notify("MEMORY PROTECTED", "HP回復＋優しさバリア", "#fff0a1");
    }
    draw(ctx, visibility = 1) {
      const light = this.light;
      if (!light.failed) {
        ctx.save(); ctx.globalAlpha = light.success ? .55 : 1;
        ctx.shadowColor = "#fff2a0"; ctx.shadowBlur = 32; ctx.fillStyle = "#fff3aa";
        ctx.beginPath(); ctx.arc(light.x, light.y, 12 + Math.sin(this.time * 4) * 2, 0, TAU); ctx.fill();
        if (!light.success) {
          ctx.shadowBlur = 0; ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillRect(light.x - 42, light.y + 22, 84, 5);
          ctx.fillStyle = "#ffe99a"; ctx.fillRect(light.x - 42, light.y + 22, 84 * clamp(light.hp / light.maxHp, 0, 1), 5);
          ctx.fillStyle = "#fff"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center"; ctx.fillText(`記憶の灯 ${Math.max(0, light.timer).toFixed(1)}s`, light.x, light.y + 43);
        }
        ctx.restore();
      }
      this.drawCore(ctx, "#ffe18d", "#4d183b", "star");
    }
  }

  class RolandBoss extends Phase5Boss {
    constructor(currentGame) {
      super(currentGame, { id: "roland_leviathan", name: "現代ローランド・リヴァイアサン", radius: 106, hp: 4100, levelHp: 82, damage: 22, speed: 68 });
      this.neonBurstTimer = 5.2; this.returnTimer = 2.6; this.secondForm = false;
    }
    update(dt, currentGame) {
      this.time += dt; this.hitFlash = Math.max(0, this.hitFlash - dt);
      if (this.enter(dt, 180)) return;
      const light = currentGame.player.lightLevel;
      if (!this.secondForm && this.hp <= this.maxHp * .5) {
        this.secondForm = true; this.phase = 2; this.radius = 122; this.speed *= 1.18;
        currentGame.flash = 1; currentGame.shake = 24; currentGame.enemyProjectiles.length = 0;
        currentGame.showQuote("まだ半分？ つまり、ここから全部見せられる。");
        notify("SECOND FORM", "リヴァイアサン / ネオン・ロイヤル形態", "#ff55d7");
      }
      this.orbitPlayer(dt, light > .7 ? 370 : 260, .65);
      this.bulletTimer -= dt; this.returnTimer -= dt; this.neonBurstTimer -= dt;
      if (this.bulletTimer <= 0) {
        this.bulletTimer = (this.secondForm ? 1.05 : 1.45) - light * .18;
        if (light > .72) this.aimed(.13, this.secondForm ? 7 : 5, 310, "#55fbff", .52);
        else this.radial(this.secondForm ? 18 : 13, 205, .5, "#ff57d6", -this.time);
      }
      if (this.returnTimer <= 0 && light > .55) {
        this.returnTimer = this.secondForm ? 2.2 : 3.2;
        currentGame.showMessage("ポジティブ返し！", "#ffe365");
        const angle = Math.atan2(currentGame.player.y - this.y, currentGame.player.x - this.x);
        for (let i = -2; i <= 2; i++) pushEnemyBullet(currentGame, this.x, this.y, angle + i * .22, 360 * currentGame.difficulty.speed, this.damage * .62, "#ffe55c");
      }
      if (this.neonBurstTimer <= 0) {
        this.neonBurstTimer = this.secondForm ? 4.2 : 6;
        currentGame.flash = .8; currentGame.shake = 13;
        this.radial(this.secondForm ? 26 : 20, this.secondForm ? 250 : 220, .48, "#ff62db", this.time * .4);
        currentGame.showMessage("ローランド・ネオンバースト", "#ff62db");
      }
      this.contactCooldown -= dt;
      if (distance(this, currentGame.player) < this.radius + currentGame.player.radius && this.contactCooldown <= 0) {
        this.contactCooldown = .8; currentGame.player.takeDamage(this.damage, currentGame, "contact");
      }
    }
    draw(ctx) {
      ctx.save(); ctx.globalAlpha = .25; ctx.strokeStyle = this.secondForm ? "#ffe45d" : "#ff55d8"; ctx.lineWidth = 10; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.moveTo(this.x - this.radius * 1.7, this.y);
      ctx.bezierCurveTo(this.x - 60, this.y - 100, this.x + 70, this.y + 100, this.x + this.radius * 1.7, this.y); ctx.stroke(); ctx.restore();
      this.drawCore(ctx, this.secondForm ? "#ffe35c" : "#ff55d8", this.secondForm ? "#593010" : "#461347");
      ctx.save(); ctx.translate(this.x, this.y - this.radius * .62); ctx.fillStyle = "#ffe45c"; ctx.shadowColor = "#ffe45c"; ctx.shadowBlur = 25;
      ctx.fillRect(-30, -6, 60, 12); ctx.fillRect(-22, -20, 12, 20); ctx.fillRect(10, -20, 12, 20); ctx.restore();
    }
  }

  class CoreAmeseaBoss extends Phase5Boss {
    constructor(currentGame) {
      const synergyCount = currentGame.phase3?.activeSynergies?.size || 0;
      super(currentGame, { id: "core_amesea", name: "夢核アメシー", radius: 92, hp: 6200 * (1 + Math.min(.25, synergyCount * .045)), levelHp: 105, damage: 24, speed: 70 });
      this.synergyCount = synergyCount; this.specialTimer = 4; this.chargeTelegraph = 0;
    }
    update(dt, currentGame) {
      this.time += dt; this.hitFlash = Math.max(0, this.hitFlash - dt);
      if (this.enter(dt, 170)) return;
      const ratio = this.hp / this.maxHp;
      const nextPhase = ratio > .66 ? 1 : ratio > .33 ? 2 : 3;
      if (nextPhase !== this.phase) {
        this.phase = nextPhase; currentGame.enemyProjectiles.length = 0; currentGame.flash = 1; currentGame.shake = 23;
        const names = ["", "夢の鏡", "王たちの残響", "AMESEA CORE"];
        notify(`PHASE ${this.phase}`, names[this.phase], this.phase === 3 ? "#ffe45c" : "#d667ff");
        currentGame.showQuote(this.phase === 2 ? "ここまでの敵は、ぜんぶ君の夢だ。" : "名前を呼べ。ここから先へ行くために。");
      }
      this.orbitPlayer(dt, this.phase === 1 ? 310 : 250, .58);
      this.bulletTimer -= dt; this.specialTimer -= dt;
      if (this.bulletTimer <= 0) {
        this.bulletTimer = this.phase === 1 ? 1.45 : this.phase === 2 ? 1.05 : .78;
        if (this.phase === 1) {
          this.radial(14, 205, .46, "#b86aff", this.time * .75);
          this.aimed(.16, 3, 285, "#58efff", .55);
        } else if (this.phase === 2) {
          this.radial(18, 230, .48, "#ff59d4", -this.time);
          this.aimed(.12, 5, 330, "#ffe45e", .56);
        } else {
          this.radial(22, 245, .45, "#ffe25d", this.time * 1.3);
          this.aimed(.1, 7, 355, "#ff55d6", .56);
        }
      }
      if (this.specialTimer <= 0) {
        this.specialTimer = this.phase === 1 ? 5.2 : this.phase === 2 ? 4.1 : 3.2;
        if (this.phase === 1) {
          currentGame.phase3.abyssDarkness = Math.max(currentGame.phase3.abyssDarkness, 2.4);
          currentGame.showMessage("夢喰いの暗闇・再演", "#ad65ff");
        } else if (this.phase === 2) {
          const dx = currentGame.player.x - this.x, dy = currentGame.player.y - this.y, d = Math.max(1, Math.hypot(dx, dy));
          this.chargeVector = { x: dx / d, y: dy / d }; this.chargeTimer = .62;
          currentGame.showMessage("クラゲ・キングの承認突進", "#ff67d8");
        } else {
          currentGame.flash = .9; this.radial(30, 270, .42, "#ffe45d", this.time);
          currentGame.showMessage("夢核ネオン・オーバーフロー", "#ffe45d");
        }
      }
      if (this.chargeTimer > 0) {
        this.chargeTimer -= dt; this.x += this.chargeVector.x * 610 * currentGame.difficulty.speed * dt; this.y += this.chargeVector.y * 610 * currentGame.difficulty.speed * dt;
      }
      this.contactCooldown -= dt;
      if (distance(this, currentGame.player) < this.radius + currentGame.player.radius && this.contactCooldown <= 0) {
        this.contactCooldown = .8; currentGame.player.takeDamage(this.damage, currentGame, "contact");
      }
    }
    draw(ctx) {
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.time * .12);
      ctx.strokeStyle = this.phase === 3 ? "#ffe45d" : "#bd6aff"; ctx.globalAlpha = .42; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.strokeRect(-this.radius * 1.2, -this.radius * 1.2, this.radius * 2.4, this.radius * 2.4); }
      ctx.restore();
      this.drawCore(ctx, this.phase === 3 ? "#ffe45d" : this.phase === 2 ? "#ff58d4" : "#b86bff", "#25103f", "star");
      ctx.save(); ctx.fillStyle = "#fff"; ctx.font = "900 19px sans-serif"; ctx.textAlign = "center"; ctx.shadowColor = "#ffe45d"; ctx.shadowBlur = 18; ctx.fillText("A", this.x, this.y + 7); ctx.restore();
    }
  }

  function spawnPhase5Boss(type) {
    if (game.activeEvent) game.endEvent();
    game.enemyProjectiles.length = 0;
    game.enemies.splice(0, Math.max(0, game.enemies.length - 28));
    if (type === "family") game.boss = new FamilyShadowBoss(game);
    else if (type === "roland") game.boss = new RolandBoss(game);
    else game.boss = new CoreAmeseaBoss(game);
    document.querySelector("#boss-hud").classList.remove("hidden");
    document.querySelector("#boss-name").textContent = game.boss.name;
    const depth = type === "family" ? 1200 : type === "roland" ? 1500 : 2000;
    const warning = document.querySelector("#boss-warning");
    warning.querySelector("small").textContent = `WARNING / DEPTH ${depth}m`;
    warning.querySelector("b").textContent = game.boss.name;
    warning.classList.remove("hidden"); warning.style.animation = "none"; void warning.offsetWidth; warning.style.animation = "";
    setTimeout(() => warning.classList.add("hidden"), 3300);
    game.flash = .9; game.shake = 22;
    if (type === "roland") setTimeout(() => game.showQuote("深海に太陽はいらない。俺たちが光るからだ。"), 350);
    if (type === "amesea") setTimeout(() => game.showQuote("夢の核心へようこそ。君の名前で、最後を越えろ。"), 350);
  }

  function defeatPhase5Boss(boss) {
    document.querySelector("#boss-hud").classList.add("hidden");
    game.enemyProjectiles.length = 0;
    game.phase3.metrics.bosses += 1;
    save.stats.bossKills += 1;
    const rewardBase = boss.id === "family_shadow" ? 14 : boss.id === "roland_leviathan" ? 20 : 32;
    const reward = Math.round(rewardBase * (game.difficultyId === "deep" ? 1.25 : game.difficultyId === "casual" ? .8 : 1));
    game.dreams += reward; game.save.data.dreams += reward;
    if (boss.id === "family_shadow") {
      save.stats.familyBossKills += 1; unlockLog("light_to_guard");
      game.items.push(new Item(boss.x, boss.y, "memory", 1));
      game.showQuote("守った灯は、君の中でもう消えない。");
    } else if (boss.id === "roland_leviathan") {
      save.stats.rolandKills += 1; unlockLog("roland_sun");
      game.showQuote("いい光だ。次はもっと深い場所で目立ってこい。");
    } else {
      save.stats.ameseaKills += 1; save.clearMark = true; unlockLog("amesea_name");
      clearMark.classList.remove("hidden");
      game.showQuote("終わりじゃない。ここからは、君の最高記録だ。");
    }
    acquireArtifact(null, `${boss.name} 撃破報酬`);
    for (let i = 0; i < (boss.id === "core_amesea" ? 14 : 8); i++) {
      game.items.push(new Item(boss.x + rand(-115, 115), boss.y + rand(-80, 80), "dream", 1));
    }
    game.addXp(boss.id === "core_amesea" ? 72 : 52);
    game.spark(boss.x, boss.y, boss.id === "core_amesea" ? "#ffe45d" : "#ff5bd4", 90);
    game.shake = 28; game.flash = 1;
    notify("BOSS DEFEATED", `${boss.name}　夢の欠片 +${reward}`, "#ffe45d");
    game.save.save(); saveNow();
    checkPhase5Achievements();
  }

  // ============================================================
  // Gameplay wrappers
  // ============================================================
  const originalStart = Game.prototype.start;
  Game.prototype.start = function phase5Start() {
    const requestedMode = this.mode || "normal";
    originalStart.call(this);
    this.mode = requestedMode;
    this.phase5 = {
      artifacts: [], bossTriggered: { family: false, roland: false, amesea: false },
      clones: [], decoys: [], dailyIds: new Set(requestedMode === "daily" ? dailyRules.map(rule => rule.id) : []),
      playSaveTimer: 0, missionCompleted: 0, lastZone: this.phase3?.zone?.id,
      dashWasActive: false, dashRecovery: 0, chainExplosions: 0, eventTick: 0,
      abyssRareApplied: 0, updates: []
    };
    if (requestedMode === "daily") {
      save.stats.dailyPlays += 1;
      const record = save.daily[TODAY()] || { maxDepth: 0, bestKills: 0, bestDreams: 0, bestLevel: 0, plays: 0 };
      record.plays += 1; save.daily[TODAY()] = record;
      unlockLog("daily_sea");
      applyDailyStart(this);
      this.showMessage(`DAILY：${dailyRules.map(rule => rule.name).join(" / ")}`, "#ffe45f");
    }
    applyTier2Start(this);
    renderArtifactHud(this);
    saveNow();
    checkPhase5Achievements();
  };

  function applyDailyStart(currentGame) {
    const ids = currentGame.phase5.dailyIds;
    if (ids.has("dash_fast")) currentGame.player.dashCooldownMax *= .7;
    if (ids.has("burst_gain")) currentGame.player.burstGain *= 1.45;
    if (ids.has("neon_high")) currentGame.player.neonPower += 1.5;
  }
  function applyTier2Start(currentGame) {
    const owns = id => save.treeTier2[id] === true;
    currentGame.player.p5Tier2 = new Set(Object.keys(save.treeTier2).filter(id => save.treeTier2[id]));
    if (owns("abyss_treasure")) {
      currentGame.phase5.abyssRareApplied = .018;
      currentGame.player.rareBonus += currentGame.phase5.abyssRareApplied;
    }
  }

  const originalGameUpdate = Game.prototype.update;
  Game.prototype.update = function phase5Update(dt) {
    originalGameUpdate.call(this, dt);
    if (!this.phase5) return;
    const state = this.phase5;
    const completedMissions = this.phase3?.missions?.filter(mission => mission.complete).length || 0;
    if (completedMissions > state.missionCompleted) {
      const newlyCompleted = completedMissions - state.missionCompleted;
      state.missionCompleted = completedMissions;
      for (let i = 0; i < newlyCompleted; i++) {
        if (Math.random() < .08 + this.player.rareBonus * .15) {
          dropArtifactOrb(this.player.x + rand(-70, 70), this.player.y + rand(-70, 70));
        }
      }
    }
    if (this.state !== "running") return;
    state.playSaveTimer += dt; state.eventTick -= dt; state.dashRecovery = Math.max(0, state.dashRecovery - dt);
    save.stats.totalPlaySeconds += dt;
    save.stats.maxDepth = Math.max(save.stats.maxDepth, this.depth);
    const zone = zoneForDepth(this.depth);
    const zoneIndex = zones.indexOf(zone);
    save.stats.highestZone = Math.max(save.stats.highestZone, zoneIndex + 1);
    save.codex.zones[zone.id] = true;
    if (zone.id !== state.lastZone) {
      state.lastZone = zone.id;
      if (zone.id === "neon_abyss") unlockLog("abyss_business_card");
      if (zone.id === "dream_core") unlockLog("core_door");
      saveNow();
    }
    if (this.depth >= 1200 && !state.bossTriggered.family && (!this.boss || this.boss.dead)) {
      state.bossTriggered.family = true; spawnPhase5Boss("family");
    } else if (this.depth >= 1500 && !state.bossTriggered.roland && (!this.boss || this.boss.dead)) {
      state.bossTriggered.roland = true; spawnPhase5Boss("roland");
    } else if (this.depth >= 2000 && !state.bossTriggered.amesea && (!this.boss || this.boss.dead)) {
      state.bossTriggered.amesea = true; spawnPhase5Boss("amesea");
    }
    if (save.clearMark && this.depth >= 2100) unlockLog("endless_after");
    if (ownsArtifact("neon_crown") && this.player.lightLevel > .6) this.spawnTimer -= dt * (.14 + this.player.lightLevel * .18);
    if (ownsArtifact("bright_card")) this.spawnTimer -= dt * .14;
    if (this.mode === "daily" && state.dailyIds.has("enemy_rush")) this.spawnTimer -= dt * .28;
    if (this.mode === "daily" && state.dailyIds.has("boss_hp") && this.boss && !this.boss.__p5DailyScaled) {
      this.boss.__p5DailyScaled = true;
      this.boss.maxHp *= 1.22;
      this.boss.hp *= 1.22;
    }
    if (save.treeTier2.abyss_treasure) {
      const desired = Math.min(.065, .018 + this.depth / 50000);
      if (desired > state.abyssRareApplied) {
        this.player.rareBonus += desired - state.abyssRareApplied;
        state.abyssRareApplied = desired;
      }
    }
    if (save.treeTier2.roland_control && this.player.burstActive) this.spawnTimer += dt * .18;
    if (this.activeEvent?.id === "neon_overcharge" && this.player.neonActive) {
      this.player.neonTimer = Math.min(this.player.neonDuration + 1.4, this.player.neonTimer + dt * .28);
    }
    updatePhase5Event(this, dt);
    updateDecoys(this, dt);
    state.clones.forEach(clone => clone.update(dt, this));
    state.clones = state.clones.filter(clone => clone.life > 0);
    if (state.playSaveTimer >= 10) { state.playSaveTimer = 0; saveNow(); }
    enforcePhase5Caps(this);
  };

  function zoneForDepth(depth) {
    return zones.find(zone => depth >= zone.min && depth <= zone.max) || zones[zones.length - 1];
  }
  function updateDecoys(currentGame, dt) {
    const decoys = currentGame.phase5.decoys;
    for (const decoy of decoys) decoy.life -= dt;
    currentGame.phase5.decoys = decoys.filter(decoy => decoy.life > 0);
    for (const decoy of currentGame.phase5.decoys) {
      for (const enemy of currentGame.enemies) {
        if (enemy.dead || distance(decoy, enemy) > 250) continue;
        const dx = decoy.x - enemy.x, dy = decoy.y - enemy.y, d = Math.max(1, Math.hypot(dx, dy));
        enemy.x += dx / d * 42 * dt; enemy.y += dy / d * 42 * dt;
      }
    }
  }
  function enforcePhase5Caps(currentGame) {
    const trim = (array, limit) => { if (array?.length > limit) array.splice(0, array.length - limit); };
    trim(currentGame.enemies, 108); trim(currentGame.projectiles, 190);
    trim(currentGame.enemyProjectiles, 210); trim(currentGame.items, 180); trim(currentGame.particles, 340);
    trim(currentGame.phase5.clones, 5); trim(currentGame.phase5.decoys, 4);
  }

  const originalDraw = Game.prototype.draw;
  Game.prototype.draw = function phase5Draw(time) {
    originalDraw.call(this, time);
    if (!this.phase5) return;
    const ctx = this.ctx;
    for (const decoy of this.phase5.decoys) {
      ctx.save(); ctx.globalAlpha = clamp(decoy.life / 2, 0, .42); ctx.translate(decoy.x, decoy.y);
      ctx.strokeStyle = "#78b4ff"; ctx.shadowColor = "#78b4ff"; ctx.shadowBlur = 22; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.stroke(); ctx.restore();
    }
    for (const clone of this.phase5.clones) clone.draw(ctx);
  };

  const originalPlayerUpdate = Player.prototype.update;
  Player.prototype.update = function phase5PlayerUpdate(dt, currentGame) {
    const wasDashing = this.dashTimer > 0;
    const currentSpeed = this.moveSpeed;
    if (currentGame.phase5?.dashRecovery > 0) this.moveSpeed *= .3;
    if (ownsArtifact("abyss_shoes", currentGame) && currentGame.activeEvent?.id === "current") this.moveSpeed *= 1.25;
    originalPlayerUpdate.call(this, dt, currentGame);
    this.moveSpeed = currentSpeed;
    if (wasDashing && this.dashTimer <= 0 && currentGame.phase5) {
      if (ownsArtifact("honest_engine", currentGame)) {
        currentGame.explode(this.x, this.y, this.attackDamage * .72);
        currentGame.phase5.dashRecovery = .16;
      }
      if (ownsArtifact("ikemen_afterimage", currentGame) || save.treeTier2.ikemen_decoy) {
        currentGame.phase5.decoys.push({ x: this.x, y: this.y, life: 3 });
      }
    }
  };

  const originalShoot = Player.prototype.shoot;
  Player.prototype.shoot = function phase5Shoot(currentGame) {
    const damage = this.attackDamage;
    const rate = this.attackRate;
    if (ownsArtifact("neon_crown", currentGame)) this.attackDamage *= 1 + this.lightLevel * .32;
    if (save.treeTier2.baka_frenzy && this.hp / this.maxHp < .45) this.attackRate *= 1 + (.45 - this.hp / this.maxHp) * 1.15;
    originalShoot.call(this, currentGame);
    this.attackDamage = damage; this.attackRate = rate;
  };

  const originalStartDash = Player.prototype.startDash;
  Player.prototype.startDash = function phase5StartDash(mx, my, currentGame) {
    const close = [...currentGame.enemies, ...(currentGame.boss && !currentGame.boss.dead ? [currentGame.boss] : [])]
      .filter(enemy => !enemy.dead && distance(this, enemy) < enemy.radius + 105);
    originalStartDash.call(this, mx, my, currentGame);
    if (save.treeTier2.ikemen_counter && close.length) {
      const oldAim = this.aimAngle;
      close.slice(0, 5).forEach(target => {
        this.aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        const projectile = new Projectile(this.x, this.y, this.aimAngle, this);
        projectile.damage *= .62; projectile.color = "#8bbcff"; currentGame.projectiles.push(projectile);
      });
      this.aimAngle = oldAim; currentGame.showMessage("第2層・イケメンカウンター", "#8bbcff");
    }
  };

  const originalStartNeon = Player.prototype.startNeon;
  Player.prototype.startNeon = function phase5StartNeon(currentGame) {
    originalStartNeon.call(this, currentGame);
    if (ownsArtifact("roland_mic", currentGame)) {
      currentGame.damageArea(this.x, this.y, 250, this.attackDamage * .35);
      for (const enemy of currentGame.enemies) {
        const d = Math.max(1, distance(this, enemy));
        if (d < 280) { enemy.x += (enemy.x - this.x) / d * 85; enemy.y += (enemy.y - this.y) / d * 85; }
      }
      currentGame.showMessage("ローランド・ボイス！", "#ff65dc");
    }
  };

  const originalTakeDamage = Player.prototype.takeDamage;
  Player.prototype.takeDamage = function phase5TakeDamage(amount, currentGame, source) {
    let adjusted = amount;
    if (save.treeTier2.abyss_pressure && currentGame.visibilityAt(this) < .34) adjusted *= .82;
    const guardBefore = this.fatalGuard;
    originalTakeDamage.call(this, adjusted, currentGame, source);
    if (save.treeTier2.kindness_resolve && this.fatalGuard < guardBefore) {
      this.addBurst(35); currentGame.showMessage("約束が自意識を満たした", "#ffe99d");
    }
  };

  const originalEnemyTakeDamage = Enemy.prototype.takeDamage;
  Enemy.prototype.takeDamage = function phase5EnemyTakeDamage(amount, currentGame) {
    let adjusted = amount;
    if (ownsArtifact("dream_return", currentGame) && ["blob", "eel"].includes(this.type)) adjusted *= 1.22;
    return originalEnemyTakeDamage.call(this, adjusted, currentGame);
  };

  const originalItemCollect = Item.prototype.collect;
  Item.prototype.collect = function phase5ItemCollect(currentGame) {
    if (this.dead) return;
    const type = this.type; const value = this.value;
    originalItemCollect.call(this, currentGame);
    if (!currentGame.phase5) return;
    if (type === "memory") {
      if (ownsArtifact("kindness_barrier", currentGame)) this.player.memoryShield = Math.max(this.player.memoryShield, 8);
      if (save.treeTier2.kindness_slow) currentGame.phase3.kindnessSlowTimer = Math.max(currentGame.phase3.kindnessSlowTimer, 6);
    }
    if (type === "dream") {
      if (currentGame.mode === "daily" && currentGame.phase5.dailyIds.has("dream_bonus")) {
        currentGame.dreams += value; currentGame.save.data.dreams += value; currentGame.save.save();
      }
      const eventBonus = currentGame.activeEvent?.id === "lightless_pressure" ? .022 : 0;
      if (currentGame.depth >= 700 && Math.random() < .004 + currentGame.player.rareBonus * .06 + eventBonus) {
        dropArtifactOrb(this.x, this.y, eventBonus > 0);
      }
    }
  };

  const originalSpawnEnemy = Game.prototype.spawnEnemy;
  Game.prototype.spawnEnemy = function phase5SpawnEnemy(forcedType = null) {
    const before = this.enemies?.length || 0;
    originalSpawnEnemy.call(this, forcedType);
    if (!this.phase5 || this.enemies.length <= before) return;
    const enemy = this.enemies[this.enemies.length - 1];
    if (ownsArtifact("dream_heart", this) && !enemy.__p5HeartScaled) {
      enemy.__p5HeartScaled = true; enemy.maxHp *= 1.06; enemy.hp *= 1.06;
    }
    if (ownsArtifact("bright_card", this) && Math.random() < .08) {
      enemy.elite = true; enemy.maxHp *= 1.18; enemy.hp *= 1.18; enemy.xp += 1;
    }
    if (this.depth >= 1500 && Math.random() < (this.depth >= 2000 ? .065 : .04)) {
      enemy.elite = true;
      enemy.__p5BossGrade = true;
      enemy.maxHp *= 1.55; enemy.hp *= 1.55; enemy.damage *= 1.12; enemy.radius *= 1.18; enemy.xp += 3;
      enemy.color = this.depth >= 2000 ? "#ffe35c" : "#ff55d5";
    }
  };

  const originalOnEnemyKilled = Game.prototype.onEnemyKilled;
  Game.prototype.onEnemyKilled = function phase5EnemyKilled(enemy) {
    const itemsBefore = this.items.length;
    originalOnEnemyKilled.call(this, enemy);
    if (!this.phase5 || enemy.noReward) return;
    const zoneId = zoneForDepth(this.depth).id;
    if (zoneId === "neon_abyss" && Math.random() < .036) this.items.push(new Item(enemy.x, enemy.y, "dream", 1));
    if (zoneId === "dream_core") {
      if (Math.random() < .055) this.items.push(new Item(enemy.x, enemy.y, "dream", 1));
      if (Math.random() < .012) this.items.push(new Item(enemy.x + 8, enemy.y, "memory", 1));
    }
    if (this.mode === "daily" && this.phase5.dailyIds.has("healing_low")) {
      for (const item of this.items.slice(itemsBefore)) {
        if (item.type === "memory" && Math.random() < .68) item.dead = true;
      }
    }
    if (save.treeTier2.roland_chainlight && this.player.neonActive) {
      this.player.neonTimer = Math.min(this.player.neonDuration + 1.5, this.player.neonTimer + .14);
    }
    if (ownsArtifact("approval_mirror", this) && Math.random() < .085 && this.phase5.clones.length < 5) {
      this.phase5.clones.push(new NeonClone(enemy.x, enemy.y));
    }
    const artifactChance = (enemy.elite ? .012 : .0012) + this.player.rareBonus * .025 +
      (save.treeTier2.abyss_treasure ? Math.min(.01, this.depth / 250000) : 0) +
      (this.activeEvent?.id === "lightless_pressure" ? .015 : 0) + (ownsArtifact("bright_card", this) ? .004 : 0);
    if (Math.random() < artifactChance) dropArtifactOrb(enemy.x, enemy.y, this.activeEvent?.id === "lightless_pressure");
  };

  const originalExplode = Game.prototype.explode;
  Game.prototype.explode = function phase5Explode(x, y, damage, ignored) {
    const killsBefore = this.kills;
    originalExplode.call(this, x, y, damage, ignored);
    if (save.treeTier2.baka_chain && this.kills > killsBefore && this.phase5 && this.phase5.chainExplosions < 2) {
      this.phase5.chainExplosions += 1;
      originalExplode.call(this, x + rand(-45, 45), y + rand(-45, 45), damage * .55, ignored);
      queueMicrotask(() => { if (this.phase5) this.phase5.chainExplosions = 0; });
    }
  };

  const originalVisibilityAt = Game.prototype.visibilityAt;
  Game.prototype.visibilityAt = function phase5Visibility(entity) {
    let value = originalVisibilityAt.call(this, entity);
    if (this.phase5?.dailyIds.has("vision_narrow")) value *= .75;
    if (this.activeEvent?.id === "lightless_pressure") value *= .46;
    if (ownsArtifact("deep_suit", this)) value = Math.min(1, value * 1.22 + .08);
    return clamp(value, .025, 1);
  };

  // Upgrade choice count: Dream Heart adds a fourth option.
  UpgradeSystem.prototype.show = function phase5UpgradeShow() {
    this.game.state = "levelup";
    const count = ownsArtifact("dream_heart", this.game) ? 4 : 3;
    const choices = [...this.pool].sort(() => Math.random() - .5).slice(0, count);
    this.container.replaceChildren();
    for (const choice of choices) {
      const button = document.createElement("button");
      button.className = "upgrade-card";
      button.innerHTML = `<span class="icon">${choice.icon}</span><b>${choice.name}</b><small>${choice.desc}</small>`;
      button.addEventListener("click", () => {
        choice.apply(this.game.player);
        this.screen.classList.add("hidden"); this.game.state = "running"; this.game.lastTime = performance.now();
        this.game.flash = .6; this.game.ring(this.game.player.x, this.game.player.y, "#80fbff", 34); this.game.showMessage(choice.name, "#76f7ff");
      }, { once: true });
      this.container.append(button);
    }
    this.container.classList.toggle("four-choices", count === 4);
    this.screen.classList.remove("hidden");
  };

  // ============================================================
  // New events
  // ============================================================
  const originalStartRandomEvent = Game.prototype.startRandomEvent;
  Game.prototype.startRandomEvent = function phase5StartEvent(forceId = null) {
    let selected = forceId;
    if (!selected && this.phase5 && this.depth >= 1200) {
      const chance = this.depth >= 2000 ? .66 : this.depth >= 1500 ? .52 : .34;
      if (Math.random() < chance) selected = pick(EVENTS).id;
    }
    if (!EVENT_BY_ID[selected]) return originalStartRandomEvent.call(this, selected);
    const data = EVENT_BY_ID[selected];
    this.activeEvent = { ...data };
    this.eventTimer = data.duration; this.eventSpawnTimer = 0; this.eventDirection = Math.random() < .5 ? -1 : 1;
    document.querySelector("#event-status").classList.remove("hidden");
    this.showMessage(`深海イベント：${data.name}`, data.color);
    this.flash = .48;
    save.codex.events[data.id] = true; saveNow();
  };

  function updatePhase5Event(currentGame, dt) {
    const event = currentGame.activeEvent;
    if (!event || !EVENT_BY_ID[event.id] || currentGame.phase5.eventTick > 0) return;
    currentGame.phase5.eventTick = event.id === "core_reaction" ? .46 : .72;
    if (event.id === "memory_current") {
      if (Math.random() < .24) currentGame.items.push(new Item(rand(40, currentGame.width - 40), rand(60, currentGame.height - 40), "memory", 1));
      else if (currentGame.boss instanceof FamilyShadowBoss && currentGame.enemies.length < 100) currentGame.enemies.push(new MemoryHunter(rand(0, currentGame.width), -30, currentGame.boss, currentGame));
    } else if (event.id === "neon_overcharge") {
      if (Math.random() < .68) currentGame.spawnEnemy();
    } else if (event.id === "core_reaction") {
      if (Math.random() < .45) currentGame.items.push(new Item(rand(40, currentGame.width - 40), rand(60, currentGame.height - 40), "dream", 1));
      currentGame.spawnEnemy(Math.random() < .55 ? "blob" : "eel");
    }
  }
  const originalEndEvent = Game.prototype.endEvent;
  Game.prototype.endEvent = function phase5EndEvent() {
    const ended = this.activeEvent?.id;
    originalEndEvent.call(this);
    if (ended === "lightless_pressure" && Math.random() < .48) dropArtifactOrb(this.player.x + rand(-90, 90), this.player.y + rand(-90, 90), true);
  };

  // ============================================================
  // HUD, records, results, achievements
  // ============================================================
  const originalUpdateHUD = Game.prototype.updateHUD;
  Game.prototype.updateHUD = function phase5UpdateHUD() {
    originalUpdateHUD.call(this);
    if (!this.phase5) return;
    if (this.boss && !this.boss.dead && this.boss instanceof Phase5Boss) {
      document.querySelector("#boss-name").textContent = this.boss.name;
      let phase = `PHASE ${this.boss.phase}`;
      if (this.boss instanceof FamilyShadowBoss) phase += this.boss.light.failed ? " / 灯喪失" : this.boss.light.success ? " / 灯守護" : ` / 灯 ${Math.ceil(this.boss.light.timer)}s`;
      if (this.boss instanceof RolandBoss && this.boss.secondForm) phase = "PHASE 2 / NEON ROYAL";
      if (this.boss instanceof CoreAmeseaBoss) phase += " / DREAM CORE";
      document.querySelector("#boss-phase").textContent = phase;
      document.querySelector("#boss-bar").style.width = `${clamp(this.boss.hp / this.boss.maxHp * 100, 0, 100)}%`;
    }
  };

  const originalGameOver = Game.prototype.gameOver;
  Game.prototype.gameOver = function phase5GameOver() {
    if (this.state !== "running") return originalGameOver.call(this);
    const before = this.phase5 ? {
      record: { ...save.records[this.difficultyId] },
      daily: { ...(save.daily[TODAY()] || { maxDepth: 0, bestKills: 0, bestDreams: 0, bestLevel: 0 }) }
    } : null;
    originalGameOver.call(this);
    if (!this.phase5 || !before) return;
    const record = save.records[this.difficultyId];
    record.maxDepth = Math.max(record.maxDepth, this.depth);
    record.bestKills = Math.max(record.bestKills, this.kills);
    record.bestLevel = Math.max(record.bestLevel, this.player.level);
    const updates = [];
    if (record.maxDepth > before.record.maxDepth) updates.push(`${this.difficulty.name} 最高深度`);
    if (record.bestKills > before.record.bestKills) updates.push(`${this.difficulty.name} 最高撃破`);
    if (record.bestLevel > before.record.bestLevel) updates.push(`${this.difficulty.name} 最高レベル`);
    if (this.mode === "daily") {
      const daily = save.daily[TODAY()] || { maxDepth: 0, bestKills: 0, bestDreams: 0, bestLevel: 0, plays: 1 };
      daily.maxDepth = Math.max(daily.maxDepth, this.depth);
      daily.bestKills = Math.max(daily.bestKills, this.kills);
      daily.bestDreams = Math.max(daily.bestDreams, this.dreams);
      daily.bestLevel = Math.max(daily.bestLevel, this.player.level);
      save.daily[TODAY()] = daily;
      save.stats.dailyBestDepth = Math.max(save.stats.dailyBestDepth, daily.maxDepth);
      if (daily.maxDepth > before.daily.maxDepth) updates.push("今日のデイリー最高深度");
      if (daily.bestKills > before.daily.bestKills) updates.push("今日のデイリー最高撃破");
      if (daily.bestDreams > before.daily.bestDreams) updates.push("今日のデイリー夢の欠片");
    }
    for (const id of this.phase3?.activatedHistory || []) save.stats.synergyUse[id] = safeNumber(save.stats.synergyUse[id]) + 1;
    document.querySelector("#result-artifacts div").innerHTML = this.phase5.artifacts.length
      ? this.phase5.artifacts.map(item => `<span style="--artifact-color:${item.color}">${item.icon} ${item.name}</span>`).join("")
      : '<span class="empty">今回は未取得</span>';
    resultRecords.innerHTML = updates.length
      ? `<b>記録更新！</b>${updates.map(text => `<span>${text}</span>`).join("")}`
      : this.mode === "daily" ? `<span>今日のデイリー最高：${Math.floor(save.daily[TODAY()].maxDepth)}m</span>` : "";
    if (updates.length) notify("NEW RECORD", updates.join(" / "), "#ffe45d");
    saveNow();
    checkPhase5Achievements();
  };

  const originalRefreshTitle = Game.prototype.refreshTitle;
  Game.prototype.refreshTitle = function phase5RefreshTitle() {
    originalRefreshTitle.call(this);
    dailyCard.querySelector("b").textContent = `DAILY / ${TODAY()}`;
    clearMark.classList.toggle("hidden", !save.clearMark);
  };

  function unlockLog(id, announce = true) {
    const log = MEMORY_LOGS.find(item => item.id === id);
    if (!log || save.logs[id]) return false;
    save.logs[id] = true; saveNow();
    if (announce) notify("MEMORY LOG", log.title, "#ffe69b");
    return true;
  }
  function notify(title, text, color = "#5df5ff") {
    const stack = document.querySelector("#notification-stack");
    const note = document.createElement("div");
    note.className = "notification phase5-notification"; note.style.setProperty("--notice-color", color);
    note.innerHTML = `<b>${title}</b><span>${text}</span>`;
    stack.append(note); setTimeout(() => note.remove(), 3500);
  }

  if (!window.AMESEA3.achievements.some(item => item.id === NEW_ACHIEVEMENTS[0].id)) {
    window.AMESEA3.achievements.push(...NEW_ACHIEVEMENTS);
  }
  function checkPhase5Achievements() {
    const p3 = window.AMESEA3.save;
    let changed = false;
    for (const achievement of NEW_ACHIEVEMENTS) {
      if (p3.achievements[achievement.id] || !achievement.test(game, p3)) continue;
      p3.achievements[achievement.id] = true;
      game.save.data.dreams += achievement.reward;
      notify("ACHIEVEMENT", `${achievement.name}　夢の欠片 +${achievement.reward}`, "#ffe45d");
      changed = true;
    }
    if (!changed) return false;
    game.save.save();
    try { localStorage.setItem("amesea_neon_abyss_phase3_v1", JSON.stringify(p3)); } catch (_) {}
    return true;
  }

  // ============================================================
  // Daily start and normal-mode separation
  // ============================================================
  document.querySelector("#start-button").addEventListener("click", () => { game.mode = "normal"; }, { capture: true });
  dailyButton.addEventListener("click", () => {
    game.mode = "daily";
    game.start();
  });

  // ============================================================
  // Debug / balance panel
  // ============================================================
  let fps = 0, fpsFrames = 0, fpsStart = performance.now();
  const baseLoopDraw = Game.prototype.draw;
  Game.prototype.draw = function phase5FpsDraw(time) {
    baseLoopDraw.call(this, time);
    fpsFrames += 1;
    const now = performance.now();
    if (now - fpsStart >= 500) {
      fps = Math.round(fpsFrames * 1000 / (now - fpsStart)); fpsFrames = 0; fpsStart = now;
    }
  };

  function toggleDebug(force) {
    const visible = force ?? debugPanel.classList.contains("hidden");
    debugPanel.classList.toggle("hidden", !visible);
  }
  addEventListener("keydown", event => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
      event.preventDefault(); event.stopImmediatePropagation(); toggleDebug();
    }
  }, { capture: true });
  setInterval(() => {
    if (debugPanel.classList.contains("hidden")) return;
    const player = game.player;
    const zone = zoneForDepth(game.depth || 0);
    document.querySelector("#debug-metrics").textContent =
      `FPS ${fps}\n敵 ${game.enemies?.length || 0} / 弾 ${(game.projectiles?.length || 0) + (game.enemyProjectiles?.length || 0)} / 粒子 ${game.particles?.length || 0}\n` +
      `深度 ${game.depth || 0}m / ${zone.name}\n` +
      (player ? `HP ${Math.ceil(player.hp)}/${player.maxHp}　LV.${player.level}\n攻撃 ${player.attackDamage.toFixed(1)} / 速度 ${player.moveSpeed.toFixed(0)} / 光量 ${Math.round(player.lightLevel * 100)}%` : "プレイヤー未生成");
  }, 250);

  function ensureRunningForDebug() {
    if (game.state === "running") return;
    game.mode = "normal"; game.start();
    game.player.invulnerable = 2;
  }
  function debugJump(depth) {
    ensureRunningForDebug();
    if (game.boss && !game.boss.dead) game.boss.dead = true;
    game.boss = null; game.enemyProjectiles.length = 0;
    game.state = "running";
    document.querySelector("#upgrade-screen").classList.add("hidden");
    game.bossTriggered = depth >= 300;
    game.phase3.abyssTriggered = depth >= 700;
    game.phase5.bossTriggered.family = depth > 1200;
    game.phase5.bossTriggered.roland = depth > 1500;
    game.phase5.bossTriggered.amesea = depth > 2000;
    game.elapsed = depth / 5.2; game.depth = depth; game.player.invulnerable = 3;
    game.phase3.zone = zoneForDepth(depth);
    if (depth === 300) {
      game.bossTriggered = false;
      game.update(.001);
    } else if (depth === 700) {
      game.phase3.abyssTriggered = false;
      game.update(.001);
    } else if (depth === 1200) {
      game.phase5.bossTriggered.family = true;
      spawnPhase5Boss("family");
    } else if (depth === 1500) {
      game.phase5.bossTriggered.roland = true;
      spawnPhase5Boss("roland");
    } else if (depth === 2000) {
      game.phase5.bossTriggered.amesea = true;
      spawnPhase5Boss("amesea");
    }
  }
  debugPanel.addEventListener("click", event => {
    const jump = event.target.closest("[data-jump]");
    if (jump) { debugJump(Number(jump.dataset.jump)); return; }
    const debugEvent = event.target.closest("[data-debug-event]");
    if (debugEvent) {
      ensureRunningForDebug();
      if (game.activeEvent) game.endEvent();
      game.startRandomEvent(debugEvent.dataset.debugEvent);
      return;
    }
    const action = event.target.closest("[data-debug]")?.dataset.debug;
    if (!action) return;
    if (action === "close") toggleDebug(false);
    else if (action === "dream") {
      game.save.data.dreams += 100; game.save.save();
      if (game.state === "running") game.dreams += 100;
      notify("DEBUG", "夢の欠片 +100", "#ffe45d");
    } else if (action === "depth") {
      ensureRunningForDebug(); debugJump((game.depth || 0) + 100);
    } else if (action === "achievements") {
      for (const achievement of window.AMESEA3.achievements) window.AMESEA3.save.achievements[achievement.id] = true;
      localStorage.setItem("amesea_neon_abyss_phase3_v1", JSON.stringify(window.AMESEA3.save));
      notify("DEBUG", "全実績を解除", "#ffe45d");
    } else if (action === "codex") {
      const ids = ["enemy_fish", "enemy_jelly", "enemy_blob", "enemy_mirror", "enemy_angler", "enemy_eel", "enemy_clown",
        "boss_jelly", "boss_abyss", "item_xp", "item_dream", "item_memory",
        "event_current", "event_storm", "event_silence", "event_bubbles",
        "synergy_neon", "synergy_baka", "synergy_kindness", "synergy_ikemen", "synergy_abyss"];
      ids.forEach(id => { window.AMESEA3.save.encounters[id] = true; });
      zones.forEach(zone => { save.codex.zones[zone.id] = true; });
      CODEX_BOSSES.forEach(boss => { save.codex.bosses[boss.id] = true; });
      EVENTS.forEach(item => { save.codex.events[item.id] = true; });
      ARTIFACTS.forEach(item => { save.discoveredArtifacts[item.id] = true; });
      MEMORY_LOGS.forEach(item => { save.logs[item.id] = true; });
      localStorage.setItem("amesea_neon_abyss_phase3_v1", JSON.stringify(window.AMESEA3.save));
      saveNow(); notify("DEBUG", "全図鑑を解放", "#ffe45d");
    } else if (action === "reset") {
      if (!confirm("開発用：全セーブデータを初期化します。よろしいですか？")) return;
      game.save.reset(); game.toTitle(); toggleDebug(false);
    }
  });

  // Reset all layers while preserving the existing chained reset behavior.
  const previousReset = game.save.reset.bind(game.save);
  game.save.reset = () => {
    previousReset();
    save = defaultSave();
    saveNow();
    renderArtifactHud();
    clearMark.classList.add("hidden");
  };

  // ============================================================
  // Public test and balance surface
  // ============================================================
  window.AMESEA.version = "5.0.0";
  window.AMESEA5 = {
    version: "5.0.0",
    zones, artifacts: ARTIFACTS, events: EVENTS, quests: QUESTS, logs: MEMORY_LOGS,
    daily: { date: TODAY(), rules: dailyRules },
    get save() { return save; },
    snapshot() {
      return {
        state: game.state, mode: game.mode || "normal", depth: game.depth,
        zone: zoneForDepth(game.depth || 0).id,
        boss: game.boss && !game.boss.dead ? game.boss.id || game.boss.name : null,
        artifacts: game.phase5?.artifacts.map(item => item.id) || [],
        event: game.activeEvent?.id || null,
        records: save.records, today: save.daily[TODAY()] || null,
        clearMark: save.clearMark
      };
    },
    startDaily() { game.mode = "daily"; game.start(); },
    jump: debugJump,
    acquireArtifact,
    forceEvent(id) { if (EVENT_BY_ID[id] && game.state === "running") game.startRandomEvent(id); },
    defeatBoss() { if (game.boss && !game.boss.dead) game.boss.takeDamage(game.boss.hp + 1, game); },
    unlockTier2(id) {
      if (!TIER2_NODES.flatMap(route => route.nodes).some(node => node.id === id)) return false;
      save.treeTier2[id] = true; save.stats.tier2Owned = Object.values(save.treeTier2).filter(Boolean).length; saveNow(); return true;
    },
    saveNow, renderRecords, renderJournal
  };

  // Initial data reconciliation.
  save.stats.tier2Owned = Object.values(save.treeTier2).filter(Boolean).length;
  zones.forEach(zone => { if (save.stats.maxDepth >= zone.min) save.codex.zones[zone.id] = true; });
  checkPhase5Achievements();
  game.refreshTitle();
  saveNow();
})();
