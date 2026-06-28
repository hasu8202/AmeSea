"use strict";

// ============================================================
// AMESEA Development 4
// Tutorial, narrative, long-term quests, generated audio,
// settings, accessibility, pause flow and defensive polish.
// ============================================================
(() => {
  const game = window.AMESEA?.game;
  if (!game || !window.AMESEA3) {
    console.error("AMESEA Development 4: Development 3 was not initialized.");
    return;
  }

  const SAVE_KEY_V4 = "amesea_neon_abyss_phase4_v1";
  const VERSION = 1;
  const particleFactors = { low: .35, medium: .68, high: 1 };
  const now = () => performance.now();

  const DEFAULT_SETTINGS = () => ({
    master: .75,
    bgm: .42,
    sfx: .72,
    mute: false,
    shake: .65,
    particles: "medium",
    damageNumbers: true,
    colorSupport: false,
    autoAttack: false
  });

  const MEMORY_LOGS = [
    {
      id: "fall",
      title: "深海に落ちた日",
      hint: "初めてダイブする",
      text: "落ちた。かなり落ちた。でもユウタは髪型を直した。帰るなら、格好よく帰る。"
    },
    {
      id: "light",
      title: "光れば見える。光れば狙われる。",
      hint: "300mに到達する",
      text: "ネオンは道を照らし、敵にも住所を教える。つまり人気者は忙しい。"
    },
    {
      id: "jelly",
      title: "承認欲求クラゲ・キング",
      hint: "クラゲ・キングを撃破する",
      text: "承認は、もらうものじゃない。自分で勝手に満タンにするものだ。たぶん。"
    },
    {
      id: "eater",
      title: "夢を食うもの",
      hint: "700mに到達する",
      text: "夢を食う影がいた。ならば夢を増やせばいい。算数は苦手だが、勢いは合っている。"
    },
    {
      id: "family",
      title: "家族の声",
      hint: "アビスを撃破する",
      text: "暗闇の向こうから、帰っておいでと聞こえた。強がりの奥で、その声だけは離さない。"
    },
    {
      id: "armor",
      title: "自意識は、鎧にもなる",
      hint: "1000mに到達する",
      text: "自意識は重い。でも水圧よりは軽い。ユウタは今日も、それを鎧にして沈む。"
    },
    {
      id: "fool",
      title: "バカだから進める場所",
      hint: "家族の記憶を累計10個拾う",
      text: "怖さを知らないのではない。怖さより先に『行ける』が口から出てしまうだけだ。"
    },
    {
      id: "home",
      title: "帰る場所",
      hint: "夢ツリーを5個解放する",
      text: "帰る場所は、弱さではない。遠くまで光を伸ばすための、見えない根っこだ。"
    },
    {
      id: "never_off",
      title: "ネオンは消えない",
      hint: "1200mに到達する",
      text: "光は小さくなる。迷う日もある。それでも消えない。誰かが覚えていてくれるから。"
    },
    {
      id: "my_stage",
      title: "深海？ いや、ここは俺のステージ。",
      hint: "DEEPで700mに到達する",
      text: "深海はもう落ちる場所じゃない。夢も家族も連れて、ユウタが自分で立つステージだ。"
    }
  ];

  const QUESTS = [
    {
      id: "fish200", title: "ネガティブの大群", target: 200, stat: "fishKills",
      desc: "ネガフィッシュを累計200体倒す", reward: "夢の欠片 6",
      grant: save => addDreams(6)
    },
    {
      id: "dream50", title: "夢の密漁ではない", target: 50, stat: "dreamsCollected",
      desc: "夢の欠片を累計50個拾う", reward: "夢の欠片 8",
      grant: save => addDreams(8)
    },
    {
      id: "memory30", title: "家族の電波、良好", target: 30, stat: "memories",
      desc: "家族の記憶を累計30個拾う", reward: "永続強化：帰還の灯（最大HP +10）",
      grant: save => { save.unlockedPerks.returnLight = true; }
    },
    {
      id: "jelly3", title: "承認は足りています", target: 3, stat: "jellyKills",
      desc: "承認欲求クラゲ・キングを3回倒す", reward: "夢の欠片 7",
      grant: save => addDreams(7)
    },
    {
      id: "abyss2", title: "夢喰い、おかわり", target: 2, stat: "abyssKills",
      desc: "夢喰いニュウドウ・アビスを2回倒す", reward: "夢の欠片 10",
      grant: save => addDreams(10)
    },
    {
      id: "deep300", title: "高水圧デビュー", target: 1, stat: "deep300",
      desc: "DEEP難易度で300mに到達する", reward: "記憶ログ『自意識は、鎧にもなる』",
      grant: save => unlockLog("armor", true)
    },
    {
      id: "synergy20", title: "全部、つながっている", target: 20, stat: "synergies",
      desc: "シナジーを累計20回発動する", reward: "永続強化：連鎖の火花（バースト獲得 +8%）",
      grant: save => { save.unlockedPerks.chainSpark = true; }
    },
    {
      id: "tutorial", title: "準備はだいたい完璧", target: 1, stat: "tutorial",
      desc: "チュートリアルをクリアする", reward: "夢の欠片 3",
      grant: save => addDreams(3)
    }
  ];

  function defaultSave() {
    const phase3 = window.AMESEA3?.save;
    return {
      version: VERSION,
      tutorialCompleted: false,
      settings: DEFAULT_SETTINGS(),
      stats: {
        fishKills: 0,
        dreamsCollected: 0,
        memories: safeNumber(phase3?.stats?.memories),
        jellyKills: safeNumber(phase3?.stats?.jellyBossKills),
        abyssKills: safeNumber(phase3?.stats?.abyssBossKills),
        synergies: 0,
        deep300: phase3?.records?.deep?.maxDepth >= 300 ? 1 : 0,
        tutorial: 0
      },
      logs: {},
      quests: Object.fromEntries(QUESTS.map(quest => [quest.id, { progress: 0, claimed: false, notified: false }])),
      unlockedPerks: {}
    };
  }

  function safeNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  function loadSave() {
    const fresh = defaultSave();
    try {
      const raw = localStorage.getItem(SAVE_KEY_V4);
      if (!raw) return fresh;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return fresh;
      fresh.tutorialCompleted = Boolean(parsed.tutorialCompleted);
      for (const [key, value] of Object.entries(DEFAULT_SETTINGS())) {
        const incoming = parsed.settings?.[key];
        if (typeof value === "boolean") fresh.settings[key] = typeof incoming === "boolean" ? incoming : value;
        else if (typeof value === "number") {
          const numeric = Number(incoming);
          fresh.settings[key] = Number.isFinite(numeric) ? clamp(numeric, 0, 1) : value;
        }
        else fresh.settings[key] = particleFactors[incoming] ? incoming : value;
      }
      for (const key of Object.keys(fresh.stats)) {
        fresh.stats[key] = Math.max(fresh.stats[key], safeNumber(parsed.stats?.[key]));
      }
      for (const log of MEMORY_LOGS) fresh.logs[log.id] = parsed.logs?.[log.id] === true;
      for (const quest of QUESTS) {
        fresh.quests[quest.id] = {
          progress: safeNumber(parsed.quests?.[quest.id]?.progress),
          claimed: parsed.quests?.[quest.id]?.claimed === true,
          notified: parsed.quests?.[quest.id]?.notified === true
        };
      }
      fresh.unlockedPerks.returnLight = parsed.unlockedPerks?.returnLight === true;
      fresh.unlockedPerks.chainSpark = parsed.unlockedPerks?.chainSpark === true;
      return fresh;
    } catch (error) {
      console.warn("AMESEA Development 4: 追加セーブを安全に初期化しました。", error);
      return fresh;
    }
  }

  let save = loadSave();
  let sessionNewLogs = [];
  let questRenderAt = 0;
  let settingsOrigin = "title";
  let helpOrigin = "pause";
  let pausedFrom = "running";
  let previousSynergyCount = 0;
  let lastProgressCheck = 0;
  let tutorial = null;

  function saveNow() {
    syncQuestProgress();
    try {
      localStorage.setItem(SAVE_KEY_V4, JSON.stringify(save));
      return true;
    } catch (error) {
      console.warn("AMESEA Development 4: セーブに失敗しました。", error);
      return false;
    }
  }

  function addDreams(amount) {
    const value = Math.max(0, Math.floor(amount));
    game.save.data.dreams += value;
    if (game.state === "running") game.dreams += value;
    game.save.save();
  }

  function syncQuestProgress() {
    for (const quest of QUESTS) {
      const state = save.quests[quest.id];
      state.progress = Math.max(state.progress, Math.min(quest.target, safeNumber(save.stats[quest.stat])));
    }
  }

  // ============================================================
  // Generated audio
  // ============================================================
  class AudioEngine {
    constructor() {
      this.context = null;
      this.master = null;
      this.bgm = null;
      this.sfx = null;
      this.started = false;
      this.beat = 0;
      this.timer = null;
    }

    ensure() {
      try {
        if (!this.context) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextClass) return false;
          this.context = new AudioContextClass();
          this.master = this.context.createGain();
          this.bgm = this.context.createGain();
          this.sfx = this.context.createGain();
          this.bgm.connect(this.master);
          this.sfx.connect(this.master);
          this.master.connect(this.context.destination);
        }
        if (this.context.state === "suspended") this.context.resume().catch(() => {});
        this.started = true;
        this.apply();
        if (!this.timer) this.timer = setInterval(() => this.musicTick(), 720);
        return true;
      } catch (error) {
        console.warn("AMESEA: 音声を開始できませんでした。", error);
        return false;
      }
    }

    apply() {
      if (!this.context || !this.master) return;
      const s = save.settings;
      const at = this.context.currentTime;
      this.master.gain.setTargetAtTime(s.mute ? 0 : s.master, at, .02);
      this.bgm.gain.setTargetAtTime(s.bgm * .23, at, .02);
      this.sfx.gain.setTargetAtTime(s.sfx * .32, at, .02);
    }

    tone(frequency, duration, options = {}) {
      if (!this.started || save.settings.mute || !this.context) return;
      try {
        const at = this.context.currentTime + (options.delay || 0);
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = options.type || "sine";
        osc.frequency.setValueAtTime(Math.max(30, frequency), at);
        if (options.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, options.slide), at + duration);
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(options.volume || .18, at + .012);
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        osc.connect(gain);
        gain.connect(options.channel === "bgm" ? this.bgm : this.sfx);
        osc.start(at);
        osc.stop(at + duration + .03);
      } catch (_) {
        // Audio must never be allowed to break gameplay.
      }
    }

    play(name) {
      if (!this.ensure()) return;
      const sounds = {
        attack: () => this.tone(520, .08, { type: "square", slide: 780, volume: .08 }),
        kill: () => { this.tone(190, .11, { type: "sawtooth", slide: 80, volume: .12 }); this.tone(760, .07, { delay: .035, volume: .06 }); },
        item: () => { this.tone(650, .09, { volume: .09 }); this.tone(960, .1, { delay: .055, volume: .07 }); },
        level: () => [0, 1, 2].forEach((i) => this.tone([440, 660, 880][i], .18, { delay: i * .08, volume: .1 })),
        neon: () => { this.tone(180, .28, { type: "sawtooth", slide: 760, volume: .13 }); this.tone(880, .2, { delay: .12, volume: .08 }); },
        burst: () => { this.tone(80, .45, { type: "sawtooth", slide: 520, volume: .17 }); this.tone(1040, .32, { delay: .08, volume: .1 }); },
        dash: () => this.tone(360, .12, { type: "triangle", slide: 90, volume: .12 }),
        hurt: () => this.tone(145, .2, { type: "sawtooth", slide: 75, volume: .15 }),
        boss: () => [0, 1, 2].forEach((i) => this.tone(90 - i * 10, .34, { type: "sawtooth", delay: i * .17, volume: .13 })),
        achievement: () => [0, 1, 2, 3].forEach((i) => this.tone([523, 659, 784, 1047][i], .2, { delay: i * .07, volume: .09 })),
        quest: () => { this.tone(392, .18, { volume: .1 }); this.tone(784, .24, { delay: .1, volume: .11 }); },
        ui: () => this.tone(720, .055, { type: "triangle", volume: .055 })
      };
      sounds[name]?.();
    }

    musicTick() {
      if (!this.started || !this.context || save.settings.mute || game.state !== "running") return;
      const boss = game.boss && !game.boss.dead;
      const burst = game.player?.burstActive;
      const bass = boss ? [73, 82, 69, 92] : [55, 65, 73, 49];
      const neon = burst ? [440, 587, 659, 784] : [220, 277, 330, 247];
      const index = this.beat++ % 4;
      this.tone(bass[index], .62, { type: "sine", volume: boss ? .075 : .055, channel: "bgm" });
      if (index % 2 === 0 || burst) {
        this.tone(neon[index], .2, { type: "triangle", delay: .08, volume: boss ? .045 : .032, channel: "bgm" });
      }
    }
  }

  const audio = new AudioEngine();

  // ============================================================
  // UI construction
  // ============================================================
  function addButton(id, label, className = "secondary") {
    const button = document.createElement("button");
    button.id = id;
    button.className = `${className} phase4-title-button`;
    button.textContent = label;
    return button;
  }

  const titleActions = document.querySelector(".title-actions");
  const treeButton = document.querySelector("#title-tree-button");
  const tutorialButton = addButton("tutorial-button", "チュートリアル", "secondary");
  titleActions.insertBefore(tutorialButton, treeButton);
  titleActions.append(
    addButton("memory-log-button", "記憶ログ"),
    addButton("quests-button", "クエスト"),
    addButton("settings-button", "設定")
  );
  const tutorialStatus = document.createElement("div");
  tutorialStatus.id = "tutorial-status";
  document.querySelector("#title-record").before(tutorialStatus);

  const objective = document.createElement("aside");
  objective.id = "tutorial-objective";
  objective.className = "hidden";
  objective.setAttribute("aria-live", "assertive");
  document.querySelector("#game-shell").append(objective);

  const damageLayer = document.createElement("div");
  damageLayer.id = "damage-layer";
  damageLayer.setAttribute("aria-hidden", "true");
  document.querySelector("#game-shell").append(damageLayer);

  const memoryScreen = createOverlay("memory-log-screen", `
    <div class="phase4-panel">
      <header class="phase4-header">
        <div><div class="eyebrow">DEEP SEA MEMORY LOG</div><h2>深海記憶ログ</h2></div>
        <div id="memory-log-progress" class="phase4-progress"></div>
      </header>
      <div id="memory-log-grid" class="phase4-grid"></div>
      <div class="phase4-panel-actions"><button class="primary" data-close-menu>タイトルへ戻る</button></div>
    </div>`);

  const questScreen = createOverlay("quest-screen", `
    <div class="phase4-panel">
      <header class="phase4-header">
        <div><div class="eyebrow">LONG-TERM QUESTS</div><h2>長期クエスト</h2></div>
        <div id="quest-progress" class="phase4-progress"></div>
      </header>
      <p class="tree-lead">複数のダイブをまたいで進行します。達成後は報酬を受け取ってください。</p>
      <div id="quest-grid" class="phase4-grid"></div>
      <div class="phase4-panel-actions"><button class="primary" data-close-menu>タイトルへ戻る</button></div>
    </div>`);

  const settingsScreen = createOverlay("settings-screen", `
    <div class="phase4-panel compact">
      <header class="phase4-header">
        <div><div class="eyebrow">COMFORT & ACCESSIBILITY</div><h2>設定</h2></div>
      </header>
      <div class="settings-list">
        ${rangeSetting("master", "マスター音量")}
        ${rangeSetting("bgm", "BGM音量")}
        ${rangeSetting("sfx", "効果音音量")}
        ${toggleSetting("mute", "ミュート")}
        ${rangeSetting("shake", "画面揺れの強さ")}
        <div class="settings-row"><label for="setting-particles">パーティクル量</label>
          <select id="setting-particles" data-setting="particles">
            <option value="low">少ない</option><option value="medium">標準</option><option value="high">多い</option>
          </select>
        </div>
        ${toggleSetting("damageNumbers", "ダメージ表示")}
        ${toggleSetting("colorSupport", "色覚サポートモード")}
        ${toggleSetting("autoAttack", "自動攻撃")}
      </div>
      <div class="phase4-panel-actions">
        <button id="settings-defaults" class="secondary">初期値に戻す</button>
        <button id="settings-reset-save" class="danger">セーブデータ初期化</button>
        <button id="settings-close" class="primary">戻る</button>
      </div>
    </div>`);

  const pauseScreen = createOverlay("pause-screen", `
    <div class="phase4-panel compact">
      <div class="eyebrow">DIVE PAUSED</div>
      <h2>一時停止</h2>
      <p class="tree-lead">深海もユウタを待っている。たぶん。</p>
      <div class="pause-actions">
        <button id="pause-resume" class="primary">再開</button>
        <button id="pause-help" class="secondary">操作説明</button>
        <button id="pause-settings" class="secondary">設定</button>
        <button id="pause-title" class="danger">タイトルへ戻る</button>
      </div>
    </div>`);

  const helpScreen = createOverlay("help-screen", `
    <div class="phase4-panel">
      <header class="phase4-header">
        <div><div class="eyebrow">HOW TO SHINE</div><h2>操作説明</h2></div>
      </header>
      <div class="help-grid">
        ${helpCard("WASD / 矢印", "移動", "敵との距離を保ち、落ちた欠片へ近づきます。")}
        ${helpCard("マウス / Space", "攻撃", "カーソル方向へ通常攻撃。設定で自動攻撃も使えます。")}
        ${helpCard("Shift", "ネオン・ダッシュ", "高速移動＋短い無敵。危険をすり抜けます。")}
        ${helpCard("E", "ポジティブ・ネオン", "火力と吸引が上がる一方、敵に見つかりやすくなります。")}
        ${helpCard("Q", "自意識バースト", "100%で発動。攻撃・速度・防御を一時強化します。")}
        ${helpCard("Esc", "一時停止", "ゲーム時間、敵、弾、イベントを止めます。")}
      </div>
      <div class="phase4-panel-actions"><button id="help-close" class="primary">戻る</button></div>
    </div>`);

  const tutorialCompleteScreen = createOverlay("tutorial-complete-screen", `
    <div class="phase4-panel compact">
      <div class="eyebrow">TUTORIAL COMPLETE</div>
      <h2>深海デビュー、完了。</h2>
      <p id="tutorial-reward-text" class="tree-lead"></p>
      <div class="pause-actions">
        <button id="tutorial-normal-play" class="primary">通常プレイへ</button>
        <button id="tutorial-to-title" class="secondary">タイトルへ戻る</button>
      </div>
    </div>`);

  function createOverlay(id, html) {
    const screen = document.createElement("section");
    screen.id = id;
    screen.className = "overlay phase4-overlay hidden";
    screen.innerHTML = html;
    document.querySelector("#game-shell").append(screen);
    return screen;
  }

  function rangeSetting(id, label) {
    return `<div class="settings-row"><label for="setting-${id}">${label}</label>
      <input id="setting-${id}" data-setting="${id}" type="range" min="0" max="100" step="1">
      <output class="setting-value" data-setting-value="${id}"></output></div>`;
  }

  function toggleSetting(id, label) {
    return `<div class="settings-row"><label for="setting-${id}">${label}</label>
      <span class="toggle"><input id="setting-${id}" data-setting="${id}" type="checkbox"><span>ON</span></span></div>`;
  }

  function helpCard(key, title, description) {
    return `<article class="help-card"><b><kbd>${key}</kbd>${title}</b><p>${description}</p></article>`;
  }

  const resultStory = document.createElement("section");
  resultStory.id = "result-story-unlocks";
  resultStory.className = "hidden";
  document.querySelector(".result-detail-columns").after(resultStory);

  // ============================================================
  // Menus, settings and pause
  // ============================================================
  function hideTitleAndResults() {
    document.querySelector("#start-screen").classList.add("hidden");
    document.querySelector("#gameover-screen").classList.add("hidden");
  }

  function openTitleMenu(screen) {
    hideTitleAndResults();
    document.querySelectorAll(".phase4-overlay").forEach(item => item.classList.add("hidden"));
    screen.classList.remove("hidden");
    game.state = "phase4-menu";
  }

  function closeTitleMenu() {
    document.querySelectorAll(".phase4-overlay").forEach(item => item.classList.add("hidden"));
    document.querySelector("#start-screen").classList.remove("hidden");
    game.state = "start";
    game.refreshTitle();
    refreshTitleV4();
  }

  function openSettings(origin = "title") {
    settingsOrigin = origin;
    if (origin === "title") hideTitleAndResults();
    pauseScreen.classList.add("hidden");
    settingsScreen.classList.remove("hidden");
    game.state = origin === "pause" ? "paused-settings" : "settings";
    renderSettings();
  }

  function closeSettings() {
    settingsScreen.classList.add("hidden");
    if (settingsOrigin === "pause") {
      pauseScreen.classList.remove("hidden");
      game.state = "paused";
    } else {
      closeTitleMenu();
    }
  }

  function openHelp(origin = "pause") {
    helpOrigin = origin;
    pauseScreen.classList.add("hidden");
    helpScreen.classList.remove("hidden");
    game.state = origin === "pause" ? "paused-help" : "phase4-menu";
  }

  function closeHelp() {
    helpScreen.classList.add("hidden");
    if (helpOrigin === "pause") {
      pauseScreen.classList.remove("hidden");
      game.state = "paused";
    } else {
      closeTitleMenu();
    }
  }

  function pauseGame() {
    if (game.state !== "running") return;
    pausedFrom = "running";
    game.state = "paused";
    game.input.keys.clear();
    game.input.mouse.down = false;
    pauseScreen.classList.remove("hidden");
  }

  function resumeGame() {
    if (!["paused", "paused-settings", "paused-help"].includes(game.state)) return;
    document.querySelectorAll("#pause-screen, #settings-screen, #help-screen").forEach(item => item.classList.add("hidden"));
    game.state = pausedFrom;
    game.lastTime = now();
  }

  function applySettings() {
    document.body.classList.toggle("color-support", save.settings.colorSupport);
    document.body.classList.toggle("reduced-motion", save.settings.shake === 0);
    audio.apply();
  }

  function renderSettings() {
    for (const input of settingsScreen.querySelectorAll("[data-setting]")) {
      const key = input.dataset.setting;
      const value = save.settings[key];
      if (input.type === "checkbox") input.checked = Boolean(value);
      else if (input.type === "range") input.value = Math.round(value * 100);
      else input.value = value;
    }
    settingsScreen.querySelectorAll("[data-setting-value]").forEach(output => {
      const key = output.dataset.settingValue;
      output.textContent = `${Math.round(save.settings[key] * 100)}%`;
    });
  }

  settingsScreen.addEventListener("input", event => {
    const input = event.target.closest("[data-setting]");
    if (!input) return;
    const key = input.dataset.setting;
    if (input.type === "checkbox") save.settings[key] = input.checked;
    else if (input.type === "range") save.settings[key] = Number(input.value) / 100;
    else save.settings[key] = input.value;
    applySettings();
    renderSettings();
    saveNow();
  });

  document.querySelector("#settings-defaults").addEventListener("click", () => {
    save.settings = DEFAULT_SETTINGS();
    applySettings();
    renderSettings();
    saveNow();
    notify("SETTINGS", "設定を初期値に戻しました。", "#79f5ff");
  });

  document.querySelector("#settings-reset-save").addEventListener("click", () => {
    if (!confirm("夢の欠片・永続強化・実績・図鑑・クエスト・記憶ログをすべて初期化します。元に戻せません。よろしいですか？")) return;
    game.save.reset();
    closeSettings();
    game.toTitle();
    notify("SAVE RESET", "すべてのセーブデータを初期化しました。", "#ff9db9");
  });

  document.querySelector("#settings-close").addEventListener("click", closeSettings);
  document.querySelector("#pause-resume").addEventListener("click", resumeGame);
  document.querySelector("#pause-help").addEventListener("click", () => openHelp("pause"));
  document.querySelector("#pause-settings").addEventListener("click", () => openSettings("pause"));
  document.querySelector("#pause-title").addEventListener("click", () => {
    if (!confirm("現在のダイブを終了してタイトルへ戻りますか？")) return;
    game.toTitle();
  });
  document.querySelector("#help-close").addEventListener("click", closeHelp);

  memoryScreen.querySelector("[data-close-menu]").addEventListener("click", closeTitleMenu);
  questScreen.querySelector("[data-close-menu]").addEventListener("click", closeTitleMenu);
  tutorialButton.addEventListener("click", startTutorial);
  document.querySelector("#memory-log-button").addEventListener("click", () => {
    renderMemoryLogs();
    openTitleMenu(memoryScreen);
  });
  document.querySelector("#quests-button").addEventListener("click", () => {
    renderQuests();
    openTitleMenu(questScreen);
  });
  document.querySelector("#settings-button").addEventListener("click", () => openSettings("title"));
  document.querySelector("#tutorial-normal-play").addEventListener("click", () => {
    tutorialCompleteScreen.classList.add("hidden");
    game.mode = "normal";
    game.start();
  });
  document.querySelector("#tutorial-to-title").addEventListener("click", () => game.toTitle());

  addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (game.state === "running") pauseGame();
    else if (game.state === "paused") resumeGame();
    else if (game.state === "paused-settings") closeSettings();
    else if (game.state === "paused-help") closeHelp();
    else if (["settings", "phase4-menu"].includes(game.state)) {
      settingsScreen.classList.add("hidden");
      memoryScreen.classList.add("hidden");
      questScreen.classList.add("hidden");
      helpScreen.classList.add("hidden");
      closeTitleMenu();
    }
  }, true);

  addEventListener("keydown", event => {
    if (!tutorial || tutorial.step !== 0) return;
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(event.key.toLowerCase())) {
      advanceTutorial();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && game.state === "running") pauseGame();
  });

  // Audio can only begin after a user gesture.
  const unlockAudio = () => audio.ensure();
  addEventListener("pointerdown", unlockAudio, { capture: true });
  addEventListener("keydown", unlockAudio, { capture: true });
  document.addEventListener("click", event => {
    if (event.target.closest("button")) audio.play("ui");
  });

  // ============================================================
  // Memory logs and quests
  // ============================================================
  function unlockLog(id, fromReward = false) {
    const log = MEMORY_LOGS.find(item => item.id === id);
    if (!log || save.logs[id]) return false;
    save.logs[id] = true;
    sessionNewLogs.push(id);
    saveNow();
    notify("NEW MEMORY LOG", log.title, fromReward ? "#ffe578" : "#8cf7ff");
    audio.play("achievement");
    refreshTitleV4();
    return true;
  }

  function checkMemoryLogs() {
    const p3 = window.AMESEA3.save;
    const ownedTreeNodes = Object.values(game.save.data.permanent || {}).filter(Boolean).length;
    const currentDepth = safeNumber(game.depth);
    if (game.save.data.totalPlays > 0) unlockLog("fall");
    if (Math.max(currentDepth, p3.records.maxEverDepth) >= 300) unlockLog("light");
    if (Math.max(save.stats.jellyKills, p3.stats.jellyBossKills) >= 1) unlockLog("jelly");
    if (Math.max(currentDepth, p3.records.maxEverDepth) >= 700) unlockLog("eater");
    if (Math.max(save.stats.abyssKills, p3.stats.abyssBossKills) >= 1) unlockLog("family");
    if (Math.max(currentDepth, p3.records.maxEverDepth) >= 1000) unlockLog("armor");
    if (Math.max(save.stats.memories, p3.stats.memories) >= 10) unlockLog("fool");
    if (ownedTreeNodes >= 5) unlockLog("home");
    if (Math.max(currentDepth, p3.records.maxEverDepth) >= 1200) unlockLog("never_off");
    if (p3.records.deep.maxDepth >= 700 || (game.difficultyId === "deep" && currentDepth >= 700)) unlockLog("my_stage");
  }

  function renderMemoryLogs() {
    const unlocked = MEMORY_LOGS.filter(log => save.logs[log.id]).length;
    document.querySelector("#memory-log-progress").textContent = `${unlocked} / ${MEMORY_LOGS.length}`;
    document.querySelector("#memory-log-grid").innerHTML = MEMORY_LOGS.map((log, index) => {
      const found = save.logs[log.id];
      return `<article class="memory-card ${found ? "unlocked" : "locked"}">
        <div class="log-top"><b>${String(index + 1).padStart(2, "0")} / ${found ? log.title : "？？？"}</b>
          <small>${found ? "RECOVERED" : "LOCKED"}</small></div>
        <p>${found ? log.text : `解放条件：${log.hint}`}</p>
      </article>`;
    }).join("");
  }

  function updateQuestNotifications() {
    syncQuestProgress();
    for (const quest of QUESTS) {
      const state = save.quests[quest.id];
      if (state.progress < quest.target || state.notified) continue;
      state.notified = true;
      notify("QUEST COMPLETE", `${quest.title}　報酬を受取可能`, "#ffe776");
      audio.play("quest");
      saveNow();
    }
  }

  function renderQuests() {
    syncQuestProgress();
    const completed = QUESTS.filter(quest => save.quests[quest.id].progress >= quest.target).length;
    document.querySelector("#quest-progress").textContent = `${completed} / ${QUESTS.length}`;
    document.querySelector("#quest-grid").innerHTML = QUESTS.map(quest => {
      const state = save.quests[quest.id];
      const done = state.progress >= quest.target;
      const percent = clamp(state.progress / quest.target * 100, 0, 100);
      const label = state.claimed ? "受取済み" : done ? "達成済み" : "進行中";
      return `<article class="quest-card ${done ? "complete" : ""} ${state.claimed ? "claimed" : ""}">
        <div class="quest-top"><div><b>${quest.title}</b><small>${quest.desc}</small></div><span class="quest-state">${label}</span></div>
        <div class="quest-meter"><i style="width:${percent}%"></i></div>
        <div class="quest-footer"><span>${Math.floor(state.progress)} / ${quest.target}</span><span>${quest.reward}</span>
          ${done && !state.claimed ? `<button class="quest-claim primary" data-claim="${quest.id}">報酬受取</button>` : ""}
        </div>
      </article>`;
    }).join("");
  }

  questScreen.addEventListener("click", event => {
    const button = event.target.closest("[data-claim]");
    if (!button) return;
    const quest = QUESTS.find(item => item.id === button.dataset.claim);
    const state = save.quests[quest?.id];
    if (!quest || !state || state.claimed || state.progress < quest.target) return;
    state.claimed = true;
    saveNow();
    try {
      quest.grant(save);
    } catch (error) {
      console.warn("AMESEA: クエスト報酬の適用に失敗しました。", error);
      state.claimed = false;
      saveNow();
      return;
    }
    saveNow();
    game.refreshTitle();
    notify("QUEST REWARD", `${quest.title}　${quest.reward}`, "#ffe776");
    audio.play("quest");
    renderQuests();
  });

  function notify(title, text, color = "#5df5ff") {
    const stack = document.querySelector("#notification-stack");
    if (!stack) return;
    const note = document.createElement("div");
    note.className = "phase3-notification phase4-toast";
    note.style.setProperty("--note-color", color);
    note.style.setProperty("--toast-color", color);
    const heading = document.createElement("b");
    const body = document.createElement("span");
    heading.textContent = title;
    body.textContent = text;
    note.append(heading, body);
    stack.prepend(note);
    while (stack.children.length > 3) stack.lastElementChild.remove();
    setTimeout(() => {
      note.classList.add("out");
      setTimeout(() => note.remove(), 300);
    }, 2800);
  }

  // Listen to Development 3 achievement notices and give them sound.
  const notices = document.querySelector("#notification-stack");
  new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        const label = node.querySelector("b")?.textContent || "";
        if (label.includes("ACHIEVEMENT")) audio.play("achievement");
      }
    }
  }).observe(notices, { childList: true });

  // ============================================================
  // Interactive tutorial
  // ============================================================
  const TUTORIAL_STEPS = [
    { title: "移動する", detail: "WASD または矢印キーで少し移動しよう。" },
    { title: "攻撃する", detail: "マウス左クリック、または Space で弾を撃とう。" },
    { title: "ダッシュする", detail: "Shift でネオン・ダッシュ。短時間だけ無敵になる。" },
    { title: "ネオン欠片を拾う", detail: "水色のひし形へ近づき、経験値を回収しよう。" },
    { title: "ポジティブ・ネオン", detail: "E で点灯。火力と吸引力が上がる。" },
    { title: "光のリスクを知る", detail: "明るいほど遠くの敵が気づいて寄ってくる。少し観察しよう。" },
    { title: "自意識バースト", detail: "Q で100%の自意識を解放しよう。" },
    { title: "家族の記憶を拾う", detail: "金色のハートはHPを回復する。" },
    { title: "強化を選ぶ", detail: "欠片を拾ってレベルアップし、3択から1つ選ぼう。" },
    { title: "小型ボスを倒す", detail: "仕上げだ。光るネガフィッシュ・キャプテンを倒そう。" }
  ];

  function startTutorial() {
    sessionNewLogs = [];
    game.mode = "tutorial";
    game.start();
    game.mode = "tutorial";
    tutorial = {
      step: 0,
      startX: game.player.x,
      startY: game.player.y,
      lightWatch: 0,
      advancing: false
    };
    game.difficultyId = "casual";
    game.difficulty = window.AMESEA3.difficulties.casual;
    game.player.hp = game.player.maxHp;
    game.player.fatalGuard = 99;
    game.spawnTimer = 999;
    game.nextEvent = 999;
    game.bossTriggered = true;
    if (game.phase3) game.phase3.abyssTriggered = true;
    enterTutorialStep(0);
    unlockLog("fall");
  }

  function enterTutorialStep(index) {
    if (!tutorial) return;
    tutorial.step = index;
    tutorial.advancing = false;
    tutorial.lightWatch = 0;
    const step = TUTORIAL_STEPS[index];
    objective.innerHTML = `<small>TUTORIAL ${index + 1} / ${TUTORIAL_STEPS.length}</small><b>${step.title}</b><span>${step.detail}</span>`;
    objective.classList.remove("hidden");
    game.enemies.length = 0;
    game.enemyProjectiles.length = 0;
    if (game.boss && !game.boss.dead) game.boss.dead = true;
    game.boss = null;
    document.querySelector("#boss-hud").classList.add("hidden");

    if (index === 1) spawnTutorialDummy();
    if (index === 3) spawnTutorialItem("xp", 1);
    if (index === 4) game.player.neonCooldown = 0;
    if (index === 5) spawnAttractionEnemy();
    if (index === 6) {
      game.player.burst = 100;
      game.player.neonActive = false;
    }
    if (index === 7) spawnTutorialItem("memory", 1);
    if (index === 8) {
      game.player.xp = Math.max(0, game.player.xpNeeded - 1);
      spawnTutorialItem("xp", 1);
    }
    if (index === 9) spawnTutorialBoss();
    game.showMessage(`目標：${step.title}`, "#ffe678");
  }

  function spawnTutorialDummy() {
    const enemy = new Enemy(Math.min(game.width - 80, game.player.x + 260), game.player.y, "fish", .45, false);
    enemy.speed = 0;
    enemy.damage = 0;
    enemy.hp = enemy.maxHp = 999;
    enemy.noReward = true;
    enemy.tutorialDummy = true;
    game.enemies.push(enemy);
  }

  function spawnAttractionEnemy() {
    const enemy = new Enemy(Math.min(game.width - 60, game.player.x + 360), Math.max(70, game.player.y - 90), "jelly", .42, false);
    enemy.damage = 0;
    enemy.speed = 62;
    enemy.noReward = true;
    enemy.tutorialAttraction = true;
    game.enemies.push(enemy);
    game.ring(enemy.x, enemy.y, "#ffe575", 18);
  }

  function spawnTutorialItem(type, value) {
    game.items.push(new Item(Math.min(game.width - 50, game.player.x + 95), game.player.y, type, value));
  }

  function spawnTutorialBoss() {
    const boss = new Enemy(Math.min(game.width - 90, game.player.x + 300), game.player.y, "fish", .65, true);
    boss.name = "ネガフィッシュ・キャプテン";
    boss.isTutorialBoss = true;
    boss.maxHp = 150;
    boss.hp = 150;
    boss.speed = 48;
    boss.damage = 4;
    boss.xp = 1;
    game.boss = boss;
    document.querySelector("#boss-name").textContent = boss.name;
    document.querySelector("#boss-phase").textContent = "FINAL LESSON";
    document.querySelector("#boss-hud").classList.remove("hidden");
    audio.play("boss");
  }

  function advanceTutorial() {
    if (!tutorial || tutorial.advancing) return;
    tutorial.advancing = true;
    game.showMessage("CLEAR！ 次のレッスンへ", "#76ffca");
    audio.play("item");
    const next = tutorial.step + 1;
    if (next >= TUTORIAL_STEPS.length) finishTutorial();
    else setTimeout(() => {
      if (tutorial) enterTutorialStep(next);
    }, 420);
  }

  function updateTutorial(dt) {
    if (!tutorial || game.mode !== "tutorial" || game.state !== "running") return;
    game.spawnTimer = 999;
    game.nextEvent = 999;
    game.depth = Math.min(game.depth, 99);
    game.player.hp = Math.max(game.player.hp, Math.min(game.player.maxHp, 35));
    if (tutorial.step === 0 && Math.hypot(game.player.x - tutorial.startX, game.player.y - tutorial.startY) >= 55) {
      advanceTutorial();
    } else if (tutorial.step === 5) {
      tutorial.lightWatch += dt;
      if (tutorial.lightWatch > 1.45) advanceTutorial();
    }
  }

  function finishTutorial() {
    const first = !save.tutorialCompleted;
    const reward = first ? 3 : 1;
    save.tutorialCompleted = true;
    save.stats.tutorial = 1;
    addDreams(reward);
    saveNow();
    tutorial = null;
    game.mode = "tutorial-complete";
    game.state = "tutorial-complete";
    objective.classList.add("hidden");
    document.querySelector("#hud").classList.add("hidden");
    document.querySelector("#boss-hud").classList.add("hidden");
    document.querySelector("#tutorial-reward-text").textContent =
      `全10レッスン達成。${first ? "初回" : "再挑戦"}報酬として夢の欠片 +${reward}。`;
    tutorialCompleteScreen.classList.remove("hidden");
    updateQuestNotifications();
    refreshTitleV4();
    audio.play("achievement");
  }

  document.addEventListener("click", event => {
    if (!tutorial || tutorial.step !== 8 || !event.target.closest(".upgrade-card")) return;
    setTimeout(() => {
      if (tutorial?.step === 8) advanceTutorial();
    }, 80);
  });

  // ============================================================
  // Gameplay instrumentation and stability guards
  // ============================================================
  const previousStart = Game.prototype.start;
  Game.prototype.start = function phase4Start() {
    const requestedMode = this.mode || "normal";
    previousStart.call(this);
    this.mode = requestedMode;
    sessionNewLogs = [];
    const startSynergies = this.phase3?.activeSynergies?.size || 0;
    if (requestedMode === "normal" && startSynergies > 0) {
      save.stats.synergies += startSynergies;
      saveNow();
    }
    previousSynergyCount = startSynergies;
    if (save.unlockedPerks.returnLight) {
      this.player.maxHp += 10;
      this.player.hp += 10;
    }
    if (save.unlockedPerks.chainSpark) this.player.burstGain *= 1.08;
    this.damageTexts = [];
    document.querySelectorAll(".phase4-overlay").forEach(screen => screen.classList.add("hidden"));
    objective.classList.toggle("hidden", requestedMode !== "tutorial");
    unlockLog("fall");
    checkMemoryLogs();
    refreshTitleV4();
  };

  const previousPlayerUpdate = Player.prototype.update;
  Player.prototype.update = function phase4PlayerUpdate(dt, currentGame) {
    if (save.settings.autoAttack && currentGame.state === "running" && this.attackTimer <= 0) {
      const candidates = [...(currentGame.enemies || [])];
      if (currentGame.boss && !currentGame.boss.dead) candidates.push(currentGame.boss);
      const target = candidates.filter(enemy => !enemy.dead)
        .sort((a, b) => distance(this, a) - distance(this, b))[0];
      if (target && distance(this, target) <= this.projectileRange * 1.12) {
        this.aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        currentGame.input.mouse.x = target.x;
        currentGame.input.mouse.y = target.y;
        this.shoot(currentGame);
      }
    }
    previousPlayerUpdate.call(this, dt, currentGame);
  };

  const previousShoot = Player.prototype.shoot;
  Player.prototype.shoot = function phase4Shoot(currentGame) {
    previousShoot.call(this, currentGame);
    audio.play("attack");
    if (tutorial?.step === 1) advanceTutorial();
  };

  const previousDash = Player.prototype.startDash;
  Player.prototype.startDash = function phase4Dash(mx, my, currentGame) {
    previousDash.call(this, mx, my, currentGame);
    audio.play("dash");
    if (tutorial?.step === 2) advanceTutorial();
  };

  const previousNeon = Player.prototype.startNeon;
  Player.prototype.startNeon = function phase4Neon(currentGame) {
    previousNeon.call(this, currentGame);
    audio.play("neon");
    if (tutorial?.step === 4) advanceTutorial();
  };

  const previousBurst = Player.prototype.startBurst;
  Player.prototype.startBurst = function phase4Burst(currentGame) {
    previousBurst.call(this, currentGame);
    audio.play("burst");
    if (tutorial?.step === 6) advanceTutorial();
  };

  const previousDamage = Player.prototype.takeDamage;
  Player.prototype.takeDamage = function phase4PlayerDamage(amount, currentGame, source) {
    const before = this.hp;
    previousDamage.call(this, amount, currentGame, source);
    if (this.hp < before) {
      audio.play("hurt");
      addDamageNumber(this.x, this.y - 18, Math.ceil(before - this.hp), true);
    }
  };

  const previousItemCollect = Item.prototype.collect;
  Item.prototype.collect = function phase4ItemCollect(currentGame) {
    if (this.dead) return;
    const type = this.type;
    const value = this.value;
    previousItemCollect.call(this, currentGame);
    audio.play("item");
    if (type === "dream") save.stats.dreamsCollected += value;
    if (type === "memory") save.stats.memories += 1;
    if (tutorial?.step === 3 && type === "xp") advanceTutorial();
    if (tutorial?.step === 7 && type === "memory") advanceTutorial();
    updateQuestNotifications();
    checkMemoryLogs();
    saveNow();
  };

  const previousEnemyDamage = Enemy.prototype.takeDamage;
  Enemy.prototype.takeDamage = function phase4EnemyDamage(amount, currentGame) {
    if (save.settings.damageNumbers && !this.dead) addDamageNumber(this.x, this.y - this.radius, amount, false);
    previousEnemyDamage.call(this, amount, currentGame);
  };

  const previousEnemyKilled = Game.prototype.onEnemyKilled;
  Game.prototype.onEnemyKilled = function phase4EnemyKilled(enemy) {
    previousEnemyKilled.call(this, enemy);
    audio.play("kill");
    if (!enemy.noReward && enemy.type === "fish") save.stats.fishKills += 1;
    if (enemy.isTutorialBoss && tutorial?.step === 9) advanceTutorial();
    updateQuestNotifications();
    saveNow();
  };

  const previousAddXp = Game.prototype.addXp;
  Game.prototype.addXp = function phase4AddXp(amount) {
    const level = this.player?.level || 0;
    previousAddXp.call(this, amount);
    if ((this.player?.level || 0) > level) audio.play("level");
  };

  const previousSpawnBoss = Game.prototype.spawnBoss;
  Game.prototype.spawnBoss = function phase4SpawnBoss() {
    previousSpawnBoss.call(this);
    instrumentBoss(this.boss);
    audio.play("boss");
  };

  const previousJellyKilled = Game.prototype.onBossKilled;
  Game.prototype.onBossKilled = function phase4JellyKilled(boss) {
    previousJellyKilled.call(this, boss);
    save.stats.jellyKills += 1;
    updateQuestNotifications();
    checkMemoryLogs();
    saveNow();
  };

  const previousAbyssKilled = Game.prototype.onAbyssBossKilled;
  Game.prototype.onAbyssBossKilled = function phase4AbyssKilled(boss) {
    previousAbyssKilled.call(this, boss);
    save.stats.abyssKills += 1;
    updateQuestNotifications();
    checkMemoryLogs();
    saveNow();
  };

  const previousUpdateHUD = Game.prototype.updateHUD;
  Game.prototype.updateHUD = function phase4UpdateHUD() {
    const timestamp = now();
    if (timestamp - (this.__phase4HudAt || 0) < 48) return;
    this.__phase4HudAt = timestamp;
    previousUpdateHUD.call(this);
  };

  const previousUpdate = Game.prototype.update;
  Game.prototype.update = function phase4Update(dt) {
    if (tutorial && this.mode === "tutorial") {
      this.elapsed = 0;
      this.depth = 0;
      this.spawnTimer = 999;
      this.nextEvent = 999;
    }
    previousUpdate.call(this, dt);
    if (tutorial && this.mode === "tutorial") {
      this.elapsed = 0;
      this.depth = 0;
      document.querySelector("#depth-text").textContent = "深度：訓練海域";
      document.querySelector("#time-text").textContent = "TUTORIAL";
    }
    if (this.boss && !this.boss.dead) instrumentBoss(this.boss);
    const activeSynergies = this.phase3?.activeSynergies?.size || 0;
    if (activeSynergies > previousSynergyCount) {
      save.stats.synergies += activeSynergies - previousSynergyCount;
      previousSynergyCount = activeSynergies;
      saveNow();
    }
    if (this.difficultyId === "deep" && this.depth >= 300) save.stats.deep300 = 1;
    updateTutorial(dt);
    enforceCaps(this);
    if (now() - lastProgressCheck > 240) {
      lastProgressCheck = now();
      updateQuestNotifications();
      checkMemoryLogs();
    }
  };

  function instrumentBoss(boss) {
    if (!boss || boss.__phase4Instrumented) return;
    boss.__phase4Instrumented = true;
    if (boss instanceof Enemy) return;
    const takeDamage = boss.takeDamage;
    if (typeof takeDamage !== "function") return;
    boss.takeDamage = function phase4BossDamage(amount, currentGame) {
      if (save.settings.damageNumbers && !this.dead) addDamageNumber(this.x, this.y - this.radius, amount, false);
      return takeDamage.call(this, amount, currentGame);
    };
  }

  function enforceCaps(currentGame) {
    const factor = particleFactors[save.settings.particles] || .68;
    const trim = (array, limit) => {
      if (array?.length > limit) array.splice(0, array.length - limit);
    };
    trim(currentGame.enemies, factor < .5 ? 84 : 108);
    trim(currentGame.projectiles, factor < .5 ? 120 : 190);
    trim(currentGame.enemyProjectiles, factor < .5 ? 105 : 170);
    trim(currentGame.items, factor < .5 ? 120 : 180);
    trim(currentGame.particles, Math.round(420 * factor));
  }

  const previousSpark = Game.prototype.spark;
  Game.prototype.spark = function phase4Spark(x, y, color, count) {
    const factor = particleFactors[save.settings.particles] || .68;
    return previousSpark.call(this, x, y, color, Math.max(1, Math.round(count * factor)));
  };

  const previousRing = Game.prototype.ring;
  Game.prototype.ring = function phase4Ring(x, y, color, size) {
    if (save.settings.particles === "low" && Math.random() < .35) return;
    return previousRing.call(this, x, y, color, size);
  };

  function addDamageNumber(x, y, amount, playerHit) {
    if (!save.settings.damageNumbers || !Number.isFinite(amount) || amount <= 0) return;
    const element = document.createElement("span");
    element.className = `damage-number${playerHit ? " player-hit" : ""}`;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.textContent = Math.max(1, Math.round(amount));
    damageLayer.append(element);
    while (damageLayer.children.length > 28) damageLayer.firstElementChild.remove();
    setTimeout(() => element.remove(), 620);
  }

  const previousDraw = Game.prototype.draw;
  Game.prototype.draw = function phase4Draw(time) {
    const rawShake = this.shake || 0;
    this.shake = rawShake * save.settings.shake;
    previousDraw.call(this, time);
    this.shake = rawShake;
    if (save.settings.colorSupport && this.player) drawAccessibilityMarks(this);
  };

  function drawAccessibilityMarks(currentGame) {
    const ctx = currentGame.ctx;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 11px ui-monospace, monospace";
    ctx.lineWidth = 2;
    for (const enemy of currentGame.enemies) {
      if (enemy.dead) continue;
      const marks = { fish: "▲", jelly: "○", blob: "■", mirror: "◇", angler: "!", eel: "≈", clown: "×" };
      ctx.fillStyle = "#07101e";
      ctx.strokeStyle = "#fff";
      ctx.strokeText(marks[enemy.type] || "!", enemy.x, enemy.y);
      ctx.fillText(marks[enemy.type] || "!", enemy.x, enemy.y);
    }
    for (const item of currentGame.items) {
      const marks = { xp: "+", dream: "◆", memory: "♥" };
      ctx.fillStyle = "#001421";
      ctx.strokeStyle = "#fff";
      ctx.strokeText(marks[item.type] || "+", item.x, item.y);
      ctx.fillText(marks[item.type] || "+", item.x, item.y);
    }
    ctx.strokeStyle = "#fff";
    for (const projectile of currentGame.projectiles) {
      ctx.beginPath();
      ctx.moveTo(projectile.x - 7, projectile.y - 5);
      ctx.lineTo(projectile.x + 3, projectile.y);
      ctx.lineTo(projectile.x - 7, projectile.y + 5);
      ctx.stroke();
    }
    for (const projectile of currentGame.enemyProjectiles) {
      ctx.beginPath();
      ctx.moveTo(projectile.x - 5, projectile.y - 5);
      ctx.lineTo(projectile.x + 5, projectile.y + 5);
      ctx.moveTo(projectile.x + 5, projectile.y - 5);
      ctx.lineTo(projectile.x - 5, projectile.y + 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  const previousGameOver = Game.prototype.gameOver;
  Game.prototype.gameOver = function phase4GameOver() {
    previousGameOver.call(this);
    if (this.state !== "gameover") return;
    checkMemoryLogs();
    updateQuestNotifications();
    renderResultUnlocks();
    saveNow();
  };

  function renderResultUnlocks() {
    const newLogs = sessionNewLogs.map(id => MEMORY_LOGS.find(log => log.id === id)).filter(Boolean);
    const readyQuests = QUESTS.filter(quest => {
      const state = save.quests[quest.id];
      return state.progress >= quest.target && !state.claimed;
    });
    if (!newLogs.length && !readyQuests.length) {
      resultStory.classList.add("hidden");
      resultStory.replaceChildren();
      return;
    }
    resultStory.classList.remove("hidden");
    resultStory.innerHTML = `<h3>今回の新規解放</h3>
      ${newLogs.map(log => `<div class="result-unlock">記憶ログ：${log.title}</div>`).join("")}
      ${readyQuests.map(quest => `<div class="result-unlock">報酬受取可能：${quest.title}</div>`).join("")}`;
  }

  const previousRefreshTitle = Game.prototype.refreshTitle;
  Game.prototype.refreshTitle = function phase4RefreshTitle() {
    previousRefreshTitle.call(this);
    refreshTitleV4();
  };

  function refreshTitleV4() {
    tutorialStatus.textContent = save.tutorialCompleted ? "✓ チュートリアル済み" : "初回はチュートリアルがおすすめ";
    tutorialStatus.classList.toggle("done", save.tutorialCompleted);
    const newCount = sessionNewLogs.filter(id => save.logs[id]).length;
    document.querySelector("#memory-log-button").innerHTML = `記憶ログ${newCount ? '<span class="new-dot" aria-label="新着あり"></span>' : ""}`;
  }

  const previousToTitle = Game.prototype.toTitle;
  Game.prototype.toTitle = function phase4ToTitle() {
    tutorial = null;
    this.mode = "normal";
    objective.classList.add("hidden");
    document.querySelectorAll(".phase4-overlay").forEach(screen => screen.classList.add("hidden"));
    document.querySelector("#upgrade-screen").classList.add("hidden");
    document.querySelector("#boss-hud").classList.add("hidden");
    document.querySelector("#event-status").classList.add("hidden");
    damageLayer.replaceChildren();
    if (this.enemies) this.enemies.length = 0;
    if (this.projectiles) this.projectiles.length = 0;
    if (this.enemyProjectiles) this.enemyProjectiles.length = 0;
    if (this.items) this.items.length = 0;
    if (this.particles) this.particles.length = 0;
    previousToTitle.call(this);
    refreshTitleV4();
  };

  // Reset all three save layers through the already wrapped reset function.
  const previousReset = game.save.reset.bind(game.save);
  game.save.reset = () => {
    previousReset();
    save = defaultSave();
    sessionNewLogs = [];
    saveNow();
    applySettings();
    renderSettings();
    renderMemoryLogs();
    renderQuests();
    refreshTitleV4();
  };

  applySettings();
  syncQuestProgress();
  checkMemoryLogs();
  updateQuestNotifications();
  refreshTitleV4();

  window.AMESEA.version = "4.0.0";
  window.AMESEA4 = {
    version: "4.0.0",
    logs: MEMORY_LOGS,
    quests: QUESTS,
    get save() { return save; },
    snapshot() {
      syncQuestProgress();
      return {
        state: game.state,
        mode: game.mode || "normal",
        tutorialStep: tutorial?.step ?? null,
        tutorialCompleted: save.tutorialCompleted,
        settings: { ...save.settings },
        stats: { ...save.stats },
        quests: Object.fromEntries(QUESTS.map(quest => [quest.id, { ...save.quests[quest.id] }])),
        unlockedLogs: MEMORY_LOGS.filter(log => save.logs[log.id]).map(log => log.id)
      };
    },
    startTutorial,
    completeTutorial() {
      if (!tutorial) startTutorial();
      finishTutorial();
    },
    setQuestProgress(id, progress) {
      const quest = QUESTS.find(item => item.id === id);
      if (!quest) return false;
      save.stats[quest.stat] = Math.max(save.stats[quest.stat], Number(progress) || 0);
      updateQuestNotifications();
      saveNow();
      return true;
    },
    unlockLog,
    openSettings: () => openSettings("title"),
    resetPhase4() {
      save = defaultSave();
      saveNow();
      applySettings();
      refreshTitleV4();
    }
  };
})();
