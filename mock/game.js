(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const ui = {
    hud: document.getElementById('hud'),
    title: document.getElementById('titleScreen'),
    items: document.getElementById('itemScreen'),
    pause: document.getElementById('pauseScreen'),
    over: document.getElementById('gameOverScreen'),
    guide: document.getElementById('touchGuide'),
    height: document.getElementById('heightValue'),
    rank: document.getElementById('rankValue'),
    gameOverLine: document.getElementById('gameOverLine'),
    pauseLine: document.getElementById('pauseLine'),
    ranking: document.getElementById('rankingScreen'),
    rankingList: document.getElementById('rankingList'),
    rankingTabs: document.querySelectorAll('.ranking-tabs button'),
    globalRank: document.getElementById('globalRank'),
    speed: document.getElementById('speedValue'),
    finalHeight: document.getElementById('finalHeight'),
    finalRank: document.getElementById('finalRank'),
    bestTitle: document.getElementById('bestTitle'),
    screen: document.getElementById('screen'),
    modeSelect: document.getElementById('modeSelect'),
    modeLocked: document.getElementById('modeLocked'),
    modeButtons: document.querySelectorAll('#modeSelect button'),
    modeTagline: document.getElementById('modeTagline'),
    stretchUnlocked: document.getElementById('stretchUnlocked'),
    newBest: document.getElementById('newBest'),
    effectChip: document.getElementById('effectChip'),
    effectIcon: document.getElementById('effectIcon'),
    effectText: document.getElementById('effectText'),
    pickupToast: document.getElementById('pickupToast'),
    soundButton: document.getElementById('soundButton'),
    failureCaptureBox: document.getElementById('failureCaptureBox'),
    failureCapture: document.getElementById('failureCapture'),
    captureActions: document.getElementById('captureActions')
  };

  const assetSources = {
    character: 'assets/character-noboru.png',
    coffee: 'assets/item-energy-coffee.png',
    headphones: 'assets/item-noise-cancel.png',
    paidLeave: 'assets/item-paid-leave.png',
    book: 'assets/item-self-help-book.png',
    meeting: 'assets/obstacle-meeting.png',
    notification: 'assets/obstacle-notification.png',
    fire: 'assets/obstacle-fire-project.png',
    revision: 'assets/obstacle-revision.png'
  };
  const images = Object.fromEntries(Object.entries(assetSources).map(([key, src]) => {
    const image = new Image();
    image.src = src;
    return [key, image];
  }));
  const collisionMasks = {};

  function buildCollisionMask(key, image) {
    if (!image.naturalWidth || !image.naturalHeight || !document.createElement) return;
    const maxSize = 128;
    const scale = Math.min(maxSize / image.naturalWidth, maxSize / image.naturalHeight);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
    maskContext.clearRect(0, 0, width, height);
    maskContext.drawImage(image, 0, 0, width, height);
    const rgba = maskContext.getImageData(0, 0, width, height).data;
    const solid = new Uint8Array(width * height);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        const alpha = rgba[index * 4 + 3];
        const left = rgba[(index - 1) * 4 + 3];
        const right = rgba[(index + 1) * 4 + 3];
        const up = rgba[(index - width) * 4 + 3];
        const down = rgba[(index + width) * 4 + 3];
        if (alpha >= 112 && left >= 48 && right >= 48 && up >= 48 && down >= 48) solid[index] = 1;
      }
    }
    collisionMasks[key] = { width, height, solid };
  }

  Object.entries(images).forEach(([key, image]) => {
    if (image.complete && image.naturalWidth) buildCollisionMask(key, image);
    else image.addEventListener('load', () => buildCollisionMask(key, image), { once: true });
  });
  const itemInfo = {
    coffee: { name: 'エナジーコーヒー', icon: assetSources.coffee },
    headphones: { name: 'ノイズキャンセリング', icon: assetSources.headphones },
    paidLeave: { name: '有給休暇', icon: assetSources.paidLeave },
    book: { name: '自己啓発本', icon: assetSources.book }
  };

  // アゲ田ノボルのセリフ（意識高い系の口癖）
  const noboruLines = {
    pickup: {
      coffee: ['カフェインは自己投資。', '覚醒、完了。', '朝活3周目、いけます。'],
      headphones: ['ノイズはミュート。集中はマスト。', '雑音はスコープ外です。'],
      paidLeave: ['休むのも戦略的リソース配分。', 'あえての、ウェルビーイング。'],
      book: ['帯だけで学びを最大化。', '要約で読了しました。', '視座が250m上がった。']
    },
    promotion: {
      主任: '主任。ここからが僕のフェーズ1。',
      係長: '係長。チームにシナジーを。',
      課長: '課長。視座がまた一段上がった。',
      部長: '部長。もうビジョンしか見えない。',
      CGO: 'CGO。成長そのものが僕の役職。',
      CEO: 'CEO。次は世界にコミットする。',
      エバンジェリスト: '肩書きは、もう概念です。'
    },
    gameOver: [
      'これは失敗ではない。学びのピボットだ。',
      'いったん持ち帰って、振り返りMTGします。',
      '挫折もポートフォリオの一部。',
      'この経験、SNSに長文で書きます。',
      '次のスプリントで巻き返す。',
      '止まったのではない。踊り場で内省している。'
    ],
    pause: ['戦略的休息中。', 'インプットの時間です。', '止まっているのではない。充電している。']
  };
  const pickLine = lines => lines[Math.floor(Math.random() * lines.length)];

  // ランキング（モック）：実機ではGame Centerのリーダーボードに置き換える
  const mockLeaderboards = {
    alltime: [
      ['シナジー太郎', 24810], ['朝活の鬼', 18320], ['視座タカシ', 15060], ['PDCA回し子', 12040],
      ['ブランディング中', 9780], ['コミット山', 8120], ['意識だけ部長', 6400],
      ['自己投資マン', 5020], ['インプット過多', 3150], ['有給ためこみ', 1620]
    ],
    overtime: [
      ['終電ハンター', 14200], ['視座タカシ', 11050], ['シナジー太郎', 8030], ['深夜のPDCA', 4210]
    ],
    stretch: [
      ['視座タカシ', 21400], ['シナジー太郎', 16820], ['朝活の鬼', 12300],
      ['ハードシングス愛読', 9050], ['ピボット職人', 7110]
    ],
    weekly: [
      ['朝活の鬼', 9120], ['シナジー太郎', 7400], ['エビデンス重視', 5330], ['視座タカシ', 4210],
      ['ピボット職人', 3080], ['PDCA回し子', 2200], ['定時ダッシュ', 1340], ['新卒3日目', 610]
    ]
  };
  let weeklyBest = 0;
  let rankingBoard = 'alltime';

  function leaderboardEntries(board) {
    const mine = { alltime: best, weekly: weeklyBest, stretch: stretchBest, overtime: overtimeBest }[board];
    const entries = mockLeaderboards[board].map(([name, score]) => ({ name, score, me: false }));
    if (mine > 0) entries.push({ name: 'あなた', score: mine, me: true });
    return entries.sort((a, b) => b.score - a.score);
  }

  function myGlobalRank(board = 'alltime') {
    const index = leaderboardEntries(board).findIndex(entry => entry.me);
    return index >= 0 ? index + 1 : null;
  }

  function renderRanking() {
    ui.rankingTabs.forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.board === rankingBoard)));
    ui.rankingList.replaceChildren(...leaderboardEntries(rankingBoard).map((entry, index) => {
      const item = document.createElement('li');
      item.classList.toggle('me', entry.me);
      const position = document.createElement('b');
      position.textContent = index + 1;
      const name = document.createElement('span');
      name.textContent = entry.name;
      const title = document.createElement('small');
      title.textContent = getRank(entry.score);
      name.append(title);
      const score = document.createElement('strong');
      score.textContent = `${entry.score.toLocaleString()}m`;
      item.append(position, name, score);
      return item;
    }));
  }

  function openRanking() {
    sound.playSfx('select');
    renderRanking();
    ui.ranking.classList.remove('hidden');
  }

  // Game Center送信のモック：実機では両リーダーボードへsubmitScoreする
  function submitScoreMock(score) {
    if (mode === 'normal') weeklyBest = Math.max(weeklyBest, score);
    rankingBoard = mode === 'normal' ? 'alltime' : mode;
    const rank = myGlobalRank(rankingBoard);
    ui.globalRank.classList.toggle('hidden', !rank);
    if (rank) ui.globalRank.querySelector('strong').textContent = `${rank}位`;
  }

  const audioSources = {
    bgmTitle: '../audio/preview/bgm-title.m4a',
    bgmGameplay: '../audio/preview/bgm-gameplay.mp3',
    select: '../audio/preview/sfx-ui-select.m4a',
    back: '../audio/preview/sfx-ui-back.m4a',
    pause: '../audio/preview/sfx-pause.m4a',
    coffee: '../audio/preview/sfx-item-coffee.m4a',
    headphones: '../audio/preview/sfx-item-headphones.m4a',
    paidLeave: '../audio/preview/sfx-item-paid-leave.m4a',
    book: '../audio/preview/sfx-item-book.m4a',
    shieldBreak: '../audio/preview/sfx-shield-break.m4a',
    hit: '../audio/preview/sfx-hit.m4a',
    gameOver: '../audio/preview/sfx-game-over.m4a',
    promotion: '../audio/preview/sfx-promotion.m4a'
  };
  const sfxVolumes = {
    select: .58, back: .48, pause: .48, coffee: .52, headphones: .56,
    paidLeave: .56, book: .56, shieldBreak: .7, hit: .72, gameOver: .66, promotion: .48
  };

  function createBgm(src) {
    const track = new Audio(src);
    track.loop = true;
    track.preload = 'auto';
    return track;
  }

  const sound = {
    muted: localStorage.getItem('mugen-shoshin-muted') === '1',
    currentName: null,
    currentTrack: null,
    fadeToken: 0,
    lastSfx: {},
    bgm: {
      title: createBgm(audioSources.bgmTitle),
      gameplay: createBgm(audioSources.bgmGameplay)
    },
    bgmVolumes: { title: .28, gameplay: .24 },

    updateButton() {
      ui.soundButton.textContent = this.muted ? '×' : '♪';
      ui.soundButton.setAttribute('aria-pressed', String(this.muted));
      ui.soundButton.setAttribute('aria-label', this.muted ? '音声をオン' : '音声をオフ');
    },

    playSfx(name) {
      if (this.muted || !audioSources[name]) return;
      const now = performance.now();
      const cooldown = ['hit', 'shieldBreak'].includes(name) ? 100 : 50;
      if (now - (this.lastSfx[name] ?? -Infinity) < cooldown) return;
      this.lastSfx[name] = now;
      const clip = new Audio(audioSources[name]);
      clip.volume = sfxVolumes[name] ?? .55;
      clip.play().catch(() => {});
    },

    playBgm(name, restart = false) {
      this.currentName = name;
      if (this.muted) return;
      const next = this.bgm[name];
      if (!next) return;
      if (this.currentTrack === next) {
        if (restart) next.currentTime = 0;
        next.volume = this.bgmVolumes[name];
        next.play().catch(() => {});
        return;
      }

      const previous = this.currentTrack;
      const targetVolume = this.bgmVolumes[name];
      const token = ++this.fadeToken;
      this.currentTrack = next;
      if (restart) next.currentTime = 0;
      next.volume = 0;
      next.play().catch(() => {});
      const startedAt = performance.now();

      const fade = now => {
        if (token !== this.fadeToken) return;
        const progress = Math.max(0, Math.min(1, (now - startedAt) / 350));
        next.volume = targetVolume * progress;
        if (previous) previous.volume = Math.max(0, .26 * (1 - progress));
        if (progress < 1) requestAnimationFrame(fade);
        else if (previous) { previous.pause(); previous.currentTime = 0; }
      };
      requestAnimationFrame(fade);
    },

    setPaused(paused) {
      if (!this.currentTrack || this.muted) return;
      const base = this.bgmVolumes[this.currentName] || .24;
      this.currentTrack.volume = paused ? base * .38 : base;
    },

    endRun() {
      if (!this.currentTrack || this.muted) return;
      this.currentTrack.volume = .05;
      const endingTrack = this.currentTrack;
      setTimeout(() => {
        if (this.currentTrack === endingTrack && state === 'over') endingTrack.pause();
      }, 900);
    },

    toggle() {
      this.muted = !this.muted;
      localStorage.setItem('mugen-shoshin-muted', this.muted ? '1' : '0');
      this.updateButton();
      if (this.muted) {
        this.fadeToken++;
        Object.values(this.bgm).forEach(track => track.pause());
      } else {
        this.playSfx('select');
        this.playBgm(state === 'playing' || state === 'paused' ? 'gameplay' : 'title');
      }
    }
  };
  sound.updateButton();

  const W = 390;
  const H = 844;
  const player = { x: W / 2, targetX: W / 2, y: 600, w: 32, h: 58, vx: 0 };
  const keys = { left: false, right: false };
  const drag = { active: false, pointerId: null, startClientX: 0, startPlayerX: 0 };
  let state = 'title';
  let obstacles = [];
  let pickups = [];
  let particles = [];
  let height = 0;
  let elapsed = 0;
  let spawnDistance = 0;
  let nextRowSpacing = 0;
  let previousRow = null;

  // 理不尽な配置を防ぐための通過保証パラメータ
  const LANE_CENTERS = [66, 195, 324];
  const LANE_GAP = LANE_CENTERS[1] - LANE_CENTERS[0];
  const PLAYER_HEIGHT = 72;
  const ROW_MARGIN = 14;          // 揺れ・回転・判定誤差の余裕（px）
  const KEYBOARD_SPEED = 600;     // キー操作時の横移動速度（px/s）
  const LANE_SLACK = 20;          // 安全レーン内で中心からずれてもよい幅（px）
  const BASE_OBSTACLE_HEIGHT = 97;
  const BASE_SCROLL = 150;        // 速度×1.0時の流速（px/s）
  // 難易度は上限なし。d = 1 + DIFFICULTY_GAIN × ln(1 + t / DIFFICULTY_SCALE) で、終盤ほど上昇が緩やかになる
  const DIFFICULTY_GAIN = 1.7;
  const DIFFICULTY_SCALE = 22;
  // 列が出てから自分に届くまで（最大約4秒）に速度が上がる分を見込んだ最悪値
  const worstDifficulty = d => d + .4 * (modeSettings[mode].speedMultiplier || 1);

  // ストレッチモード（高難度）：通常モードで部長（5,000m）到達で解放
  const STRETCH_UNLOCK_HEIGHT = 5000;
  const modeSettings = {
    // reachSpeed / reactionTime：通過保証で想定する横移動速度と反応猶予。小さい値ほど列の間隔が広がる
    normal: {
      timeOffset: 0, speedMultiplier: 1.15, singleExitBase: .78, itemRate: .1, obstacleScale: 1, edgeRate: .04,
      reachSpeed: 400, reactionTime: .1, allKindsAfter: 12, movingFireAfter: 18
    },
    stretch: {
      timeOffset: 80, speedMultiplier: 1.4, singleExitBase: .97, itemRate: .06, obstacleScale: 1.12, edgeRate: .06,
      reachSpeed: 490, reactionTime: .08, allKindsAfter: 0, movingFireAfter: 0
    },
    // 無限残業編（最終モード）：ストレッチで課長（3,000m）到達まで存在自体を隠す
    overtime: {
      // 速度はストレッチの2.4倍（無理ゲー枠）。配置の通過保証だけは維持する
      // 1フレームで約25px進むため、反応猶予に2〜3フレーム分の余裕を含める
      // maxDifficulty：列が見えてから隣レーンへ移れる物理限界。これ以上速いと配置が一直線になってしまう
      timeOffset: 80, speedMultiplier: 2.4, maxDifficulty: 10.8, singleExitBase: 1, itemRate: .04, obstacleScale: 1.15, edgeRate: .08,
      reachSpeed: 520, reactionTime: .1, allKindsAfter: 0, movingFireAfter: 0
    }
  };
  const OVERTIME_UNLOCK_HEIGHT = 3000;
  // 稀に出す「端から端」列で想定する、素早いフリック1回の所要時間（反応＋指の移動＋追従）
  const EDGE_MOVE_TIME = .28;
  const modeLabels = { normal: 'SPEED', stretch: 'STRETCH', overtime: 'OVERTIME' };
  const modeTaglines = {
    normal: '意識、高く。',
    stretch: 'コンフォートゾーンを、抜け出せ。',
    overtime: '定時という概念を、手放せ。'
  };
  const settings = () => modeSettings[mode];
  const maxObstacleHeight = () => Math.ceil(BASE_OBSTACLE_HEIGHT * settings().obstacleScale);

  function laneMoveTime(laneDistance) {
    if (laneDistance === 0) return 0;
    const { reachSpeed, reactionTime } = settings();
    return reactionTime + (laneDistance * LANE_GAP - LANE_SLACK) / reachSpeed;
  }

  // 列の縦間隔（px）。隣のレーンへは常に移れる間隔を下限にする
  function rowSpacing(d) {
    const scroll = BASE_SCROLL * d;
    const preferred = (Math.max(.7, 1.32 - d * .16) + Math.random() * .22) * scroll;
    const adjacentMinimum = maxObstacleHeight() + PLAYER_HEIGHT + ROW_MARGIN + laneMoveTime(1) * BASE_SCROLL * worstDifficulty(d);
    return Math.max(preferred, adjacentMinimum);
  }
  let lastTime = 0;
  let guideTimer = 0;
  let coffeeTimer = 0;
  let slowTimer = 0;
  let shield = 0;
  let toastTimer = 0;
  let currentRank = '新人';
  let latestFailureCapture = '';
  let latestGameOverLine = '';
  let latestCaptureFilename = 'mugen-shoshin-failure.jpg';
  function readStorage(key, fallback) {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  }
  function writeStorage(key, value) {
    try { localStorage.setItem(key, value); } catch {}
  }
  let best = Number(readStorage('mugen-shoshin-best', 0));
  let stretchBest = Number(readStorage('mugen-shoshin-best-stretch', 0));
  let overtimeBest = Number(readStorage('mugen-shoshin-best-overtime', 0));
  const isStretchUnlocked = () => best >= STRETCH_UNLOCK_HEIGHT;
  const isOvertimeUnlocked = () => isStretchUnlocked() && stretchBest >= OVERTIME_UNLOCK_HEIGHT;
  const isModeUnlocked = name => name === 'normal'
    || (name === 'stretch' && isStretchUnlocked())
    || (name === 'overtime' && isOvertimeUnlocked());
  let mode = readStorage('mugen-shoshin-mode', 'normal');
  if (!modeSettings[mode] || !isModeUnlocked(mode)) mode = 'normal';
  const bestKeys = { normal: 'mugen-shoshin-best', stretch: 'mugen-shoshin-best-stretch', overtime: 'mugen-shoshin-best-overtime' };
  const currentBest = () => ({ normal: best, stretch: stretchBest, overtime: overtimeBest })[mode];

  function updateModeUi() {
    const unlocked = isStretchUnlocked();
    ui.modeSelect.classList.toggle('hidden', !unlocked);
    ui.modeLocked.classList.toggle('hidden', unlocked);
    const overtimeUnlocked = isOvertimeUnlocked();
    ui.modeSelect.classList.toggle('three', overtimeUnlocked);
    ui.modeButtons.forEach(button => {
      button.classList.toggle('hidden', !isModeUnlocked(button.dataset.mode));
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    });
    ui.rankingTabs.forEach(tab => tab.classList.toggle('hidden', tab.dataset.board === 'overtime' && !overtimeUnlocked));
    document.querySelector('.ranking-tabs')?.classList.toggle('four', overtimeUnlocked);
    ui.screen.classList.toggle('stretch-mode', mode === 'stretch');
    ui.screen.classList.toggle('overtime-mode', mode === 'overtime');
    ui.bestTitle.textContent = `${currentBest()}m`;
    ui.modeTagline.textContent = modeTaglines[mode];
  }
  updateModeUi();

  const ranks = [
    [18000, 'エバンジェリスト'], [12000, 'CEO'], [8000, 'CGO'], [5000, '部長'], [3000, '課長'],
    [1500, '係長'], [500, '主任'], [0, '新人']
  ];

  function getRank(score) {
    return (ranks.find(([limit]) => score >= limit) || ranks[ranks.length - 1])[1];
  }

  function difficulty() {
    const { timeOffset, speedMultiplier = 1, maxDifficulty = Infinity } = modeSettings[mode];
    const t = elapsed + timeOffset;
    return Math.min(maxDifficulty, (1 + DIFFICULTY_GAIN * Math.log(1 + t / DIFFICULTY_SCALE)) * speedMultiplier);
  }

  function resetGame() {
    height = 0;
    elapsed = 0;
    spawnDistance = 0;
    nextRowSpacing = 50;
    previousRow = null;
    obstacles = [];
    pickups = [];
    particles = [];
    player.x = W / 2;
    player.targetX = W / 2;
    player.vx = 0;
    drag.active = false;
    guideTimer = 3.2;
    coffeeTimer = 0;
    slowTimer = 0;
    shield = 0;
    toastTimer = 0;
    currentRank = '新人';
    ui.effectChip.classList.add('hidden');
    ui.pickupToast.classList.add('hidden');
    updateHud();
  }

  function startGame() {
    resetGame();
    state = 'playing';
    ui.title.classList.add('hidden');
    ui.items.classList.add('hidden');
    ui.pause.classList.add('hidden');
    ui.over.classList.add('hidden');
    ui.hud.classList.remove('hidden');
    ui.guide.classList.remove('hidden');
    ui.failureCaptureBox.classList.add('hidden');
    ui.captureActions.classList.add('hidden');
    lastTime = performance.now();
  }

  function showTitle() {
    state = 'title';
    ui.title.classList.remove('hidden');
    ui.items.classList.add('hidden');
    ui.pause.classList.add('hidden');
    ui.over.classList.add('hidden');
    ui.hud.classList.add('hidden');
    ui.guide.classList.add('hidden');
    ui.effectChip.classList.add('hidden');
    updateModeUi();
  }

  function showItemBriefing() {
    state = 'briefing';
    ui.title.classList.add('hidden');
    ui.items.classList.remove('hidden');
  }

  function togglePause(forceResume = false) {
    if (state === 'playing' && !forceResume) {
      state = 'paused';
      keys.left = keys.right = false;
      ui.pauseLine.textContent = `「${pickLine(noboruLines.pause)}」`;
      ui.pause.classList.remove('hidden');
      sound.setPaused(true);
    } else if (state === 'paused') {
      state = 'playing';
      ui.pause.classList.add('hidden');
      sound.setPaused(false);
      lastTime = performance.now();
    }
  }

  function gameOver() {
    state = 'over';
    keys.left = keys.right = false;
    const score = Math.floor(height);
    const wasStretchUnlocked = isStretchUnlocked();
    const wasOvertimeUnlocked = isOvertimeUnlocked();
    const isBest = score > currentBest();
    if (isBest) {
      if (mode === 'stretch') stretchBest = score;
      else if (mode === 'overtime') overtimeBest = score;
      else best = score;
      writeStorage(bestKeys[mode], String(score));
    }
    let unlockNotice = '';
    if (!wasStretchUnlocked && isStretchUnlocked()) unlockNotice = '🔥 ストレッチモード解放！ タイトルで選べます';
    if (!wasOvertimeUnlocked && isOvertimeUnlocked()) unlockNotice = '🌙 隠しモード「無限残業編」が解放されました…';
    ui.stretchUnlocked.textContent = unlockNotice;
    ui.stretchUnlocked.classList.toggle('overtime', unlockNotice.startsWith('🌙'));
    ui.stretchUnlocked.classList.toggle('hidden', !unlockNotice);
    ui.finalHeight.textContent = `${score}m`;
    const rank = getRank(score);
    ui.finalRank.textContent = rank;
    ui.newBest.classList.toggle('hidden', !isBest);
    submitScoreMock(score);
    latestGameOverLine = pickLine(noboruLines.gameOver);
    ui.gameOverLine.textContent = `「${latestGameOverLine}」`;
    ui.guide.classList.add('hidden');
    ui.effectChip.classList.add('hidden');
    sound.endRun();
    requestAnimationFrame(() => captureFailure(score, rank));
    setTimeout(() => sound.playSfx('gameOver'), 220);
    setTimeout(() => ui.over.classList.remove('hidden'), 250);
  }

  function captureFailure(score, rank) {
    const capture = document.createElement('canvas');
    const captureHeight = H - 76;
    capture.width = W;
    capture.height = captureHeight;
    const captureContext = capture.getContext('2d');
    captureContext.drawImage(canvas, 0, 0, W, captureHeight, 0, 0, W, captureHeight);

    const topGradient = captureContext.createLinearGradient(0, 0, 0, 155);
    topGradient.addColorStop(0, 'rgba(5,14,24,.9)');
    topGradient.addColorStop(1, 'rgba(5,14,24,0)');
    captureContext.fillStyle = topGradient;
    captureContext.fillRect(0, 0, W, 155);
    captureContext.fillStyle = 'rgba(5,14,24,.84)';
    captureContext.fillRect(0, captureHeight - 150, W, 150);

    captureContext.textAlign = 'left';
    captureContext.fillStyle = '#d9ff43';
    captureContext.font = '900 11px -apple-system, BlinkMacSystemFont, sans-serif';
    captureContext.fillText({ normal: 'ENDLESS CAREER CLIMBER', stretch: 'STRETCH MODE', overtime: '無限残業編 — OVERTIME' }[mode], 22, 38);
    captureContext.fillStyle = '#ffffff';
    captureContext.font = '950 29px -apple-system, BlinkMacSystemFont, sans-serif';
    captureContext.fillText('無限昇進', 22, 74);
    captureContext.textAlign = 'right';
    captureContext.font = '900 22px -apple-system, BlinkMacSystemFont, sans-serif';
    captureContext.fillText(`${score}m`, W - 22, 72);

    captureContext.textAlign = 'center';
    captureContext.fillStyle = '#ff5b4d';
    captureContext.font = '950 27px -apple-system, BlinkMacSystemFont, sans-serif';
    captureContext.fillText('成長が止まりました', W / 2, captureHeight - 98);
    captureContext.fillStyle = '#d9ff43';
    captureContext.font = '900 14px -apple-system, BlinkMacSystemFont, sans-serif';
    captureContext.fillText(`「${latestGameOverLine}」— アゲ田ノボル`, W / 2, captureHeight - 64, W - 32);
    captureContext.fillStyle = '#ffffff';
    captureContext.font = '800 13px -apple-system, BlinkMacSystemFont, sans-serif';
    captureContext.fillText(`今回の役職：${rank}　#無限昇進`, W / 2, captureHeight - 35);

    try {
      latestFailureCapture = capture.toDataURL('image/jpeg', .88);
      latestCaptureFilename = `mugen-shoshin-${score}m.jpg`;
      ui.failureCapture.src = latestFailureCapture;
      ui.failureCaptureBox.classList.remove('hidden');
      ui.captureActions.classList.remove('hidden');
      localStorage.setItem('mugen-shoshin-last-failure', latestFailureCapture);
    } catch (error) {
      console.warn('失敗画面のキャプチャを保存できませんでした。', error);
    }
  }

  function downloadFailureCapture() {
    if (!latestFailureCapture) return;
    const link = document.createElement('a');
    link.href = latestFailureCapture;
    link.download = latestCaptureFilename;
    link.click();
  }

  async function shareFailureCapture() {
    if (!latestFailureCapture) return;
    try {
      const blob = await (await fetch(latestFailureCapture)).blob();
      const file = new File([blob], latestCaptureFilename, { type: 'image/jpeg' });
      const shareData = { title: '無限昇進', text: `成長が止まりました。「${latestGameOverLine}」#無限昇進`, files: [file] };
      if (!navigator.share || (navigator.canShare && !navigator.canShare(shareData))) throw new Error('share unavailable');
      await navigator.share(shareData);
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      downloadFailureCapture();
    }
  }

  function updateHud() {
    const score = Math.floor(height);
    ui.height.textContent = score;
    const nextRank = getRank(score);
    ui.rank.textContent = nextRank;
    if (state === 'playing' && nextRank !== currentRank) {
      currentRank = nextRank;
      sound.playSfx('promotion');
      showToast(`昇進！ ${noboruLines.promotion[nextRank]}`, 2.2);
    }
    ui.speed.textContent = `${modeLabels[mode]} ×${difficulty().toFixed(1)}`;
    let effect = null;
    const effectLabels = [];
    if (coffeeTimer > 0) effectLabels.push(`無敵 ${coffeeTimer.toFixed(1)}s`);
    if (slowTimer > 0) effectLabels.push(`スロー ${slowTimer.toFixed(1)}s`);
    if (shield > 0) effectLabels.push('防御 ×1');
    if (effectLabels.length) effect = [coffeeTimer > 0 ? 'coffee' : slowTimer > 0 ? 'paidLeave' : 'headphones', effectLabels.join('・')];
    ui.effectChip.classList.toggle('hidden', !effect);
    if (effect) {
      ui.effectIcon.src = itemInfo[effect[0]].icon;
      ui.effectText.textContent = effect[1];
    }
  }

  function spawnObstacle(spacing) {
    const d = difficulty();
    const laneCenters = LANE_CENTERS;
    const laneIndexes = [0, 1, 2];
    const singleExitRate = Math.min(Math.max(.9, settings().singleExitBase), settings().singleExitBase + elapsed / 150);

    // 前の列を抜けてから次の列に触れるまでに、横移動へ使える時間（有給休暇のスローは考慮しない＝最悪値）
    const worstScroll = BASE_SCROLL * worstDifficulty(d);
    const gapTime = previousRow
      ? (spacing - previousRow.maxHeight - PLAYER_HEIGHT - ROW_MARGIN) / worstScroll
      : Infinity;
    // 列は画面上端に出現してから見えるので、出現〜自分に届くまでの時間も上限になる（高速時に効く）
    const visibleTime = (player.y - 41 + 18) / worstScroll;
    const windowTime = Math.min(gapTime, visibleTime);
    // 前の列のどの安全レーンにいても、次の列の安全レーンのどれかへ間に合うか
    const nearestLane = LANE_CENTERS.reduce((b, c, i) => Math.abs(c - player.x) < Math.abs(LANE_CENTERS[b] - player.x) ? i : b, 0);
    const fromLanes = previousRow ? previousRow.free : [nearestLane];
    const isReachable = freeLanes => fromLanes.every(from =>
      freeLanes.some(to => laneMoveTime(Math.abs(from - to)) <= windowTime));
    const patterns = {
      single: laneIndexes.map(lane => [lane]),
      double: laneIndexes.map(blocked => laneIndexes.filter(lane => lane !== blocked))
    };
    const preferred = Math.random() < singleExitRate ? 'single' : 'double';
    const fallback = preferred === 'single' ? 'double' : 'single';
    let candidates = patterns[preferred].filter(isReachable);
    if (!candidates.length) candidates = patterns[fallback].filter(isReachable);
    if (!candidates.length) candidates = patterns.double;
    let free = candidates[Math.floor(Math.random() * candidates.length)];
    // 稀に、端の抜け道から反対側の端への大移動を要求する（フリックなら間に合う時間がある時だけ）
    const fromEdge = previousRow && previousRow.free.length === 1 && previousRow.free[0] !== 1 ? previousRow.free[0] : null;
    if (fromEdge !== null && Math.random() < settings().edgeRate && EDGE_MOVE_TIME <= windowTime) free = [2 - fromEdge];
    const occupied = laneIndexes.filter(lane => !free.includes(lane));
    const specs = {
      meeting: { label: '定例会議', w: 95, h: 48 },
      notification: { label: '鬼通知', w: 95, h: 88 },
      fire: { label: '炎上案件', w: 95, h: 86 },
      revision: { label: '差し戻し', w: 92, h: 97 }
    };
    const scale = settings().obstacleScale;
    for (const spec of Object.values(specs)) {
      spec.w = Math.round(spec.w * scale);
      spec.h = Math.round(spec.h * scale);
    }
    const availableKinds = elapsed >= settings().allKindsAfter ? Object.keys(specs) : ['meeting', 'notification', 'revision'];
    let rowMaxHeight = 0;

    for (const laneIndex of occupied) {
      const kind = availableKinds[Math.floor(Math.random() * availableKinds.length)];
      const spec = specs[kind];
      rowMaxHeight = Math.max(rowMaxHeight, spec.h);
      const x = laneCenters[laneIndex] - spec.w / 2;
      const moving = kind === 'fire' && elapsed >= settings().movingFireAfter;
      obstacles.push({
        x, originX: x, y: -spec.h - 18, w: spec.w, h: spec.h,
        label: spec.label, kind,
        vx: moving ? (Math.random() > .5 ? 1 : -1) * (20 + d * 4) : 0,
        travel: moving ? 14 : 0
      });
    }
    previousRow = { free, maxHeight: rowMaxHeight };
    if (pickups.length === 0 && Math.random() < modeSettings[mode].itemRate) {
      const types = Object.keys(itemInfo);
      const itemLane = free[Math.floor(Math.random() * free.length)];
      pickups.push({ x: laneCenters[itemLane], y: -142, w: 42, h: 42, type: types[Math.floor(Math.random() * types.length)], phase: Math.random() * Math.PI * 2 });
    }
  }

  function burst(x, y, color, count = 14) {
    for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - .5) * 240, vy: (Math.random() - .5) * 240, life: 1, color });
  }

  function collectItem(pickup) {
    if (pickup.type === 'coffee') coffeeTimer = 5;
    if (pickup.type === 'headphones') shield = 1;
    if (pickup.type === 'paidLeave') slowTimer = 5;
    if (pickup.type === 'book') height += 250;
    sound.playSfx(pickup.type);
    pickup.dead = true;
    burst(pickup.x, pickup.y, pickup.type === 'paidLeave' ? '#55c3ff' : '#d9ff43', 22);
    showToast(`${itemInfo[pickup.type].name}！ ${pickLine(noboruLines.pickup[pickup.type])}`, 1.8);
  }

  function showToast(text, duration) {
    ui.pickupToast.textContent = text;
    ui.pickupToast.classList.remove('hidden');
    ui.pickupToast.style.animation = 'none';
    void ui.pickupToast.offsetWidth;
    ui.pickupToast.style.animation = '';
    toastTimer = duration;
  }

  function playerRotation() {
    return Math.max(-.3, Math.min(.3, player.vx / 1100));
  }

  function playerSprite() {
    const bob = Math.sin(lastTime / 90) * 3;
    return { imageKey: 'character', x: player.x - 30, y: player.y + bob - 38, w: 60, h: 72, rotation: playerRotation() };
  }

  function spriteBounds(sprite) {
    const rotation = sprite.rotation || 0;
    if (!rotation) return { left: sprite.x, top: sprite.y, right: sprite.x + sprite.w, bottom: sprite.y + sprite.h };
    const cosine = Math.abs(Math.cos(rotation));
    const sine = Math.abs(Math.sin(rotation));
    const halfWidth = (sprite.w * cosine + sprite.h * sine) / 2;
    const halfHeight = (sprite.w * sine + sprite.h * cosine) / 2;
    const centerX = sprite.x + sprite.w / 2;
    const centerY = sprite.y + sprite.h / 2;
    return { left: centerX - halfWidth, top: centerY - halfHeight, right: centerX + halfWidth, bottom: centerY + halfHeight };
  }

  function maskContains(sprite, screenX, screenY) {
    const mask = collisionMasks[sprite.imageKey];
    if (!mask) return false;
    const centerX = sprite.x + sprite.w / 2;
    const centerY = sprite.y + sprite.h / 2;
    const dx = screenX - centerX;
    const dy = screenY - centerY;
    const rotation = -(sprite.rotation || 0);
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    const localX = dx * cosine - dy * sine + sprite.w / 2;
    const localY = dx * sine + dy * cosine + sprite.h / 2;
    const unitX = localX / sprite.w;
    const unitY = localY / sprite.h;
    if (unitX < 0 || unitX >= 1 || unitY < 0 || unitY >= 1) return false;
    const maskX = Math.min(mask.width - 1, Math.floor(unitX * mask.width));
    const maskY = Math.min(mask.height - 1, Math.floor(unitY * mask.height));
    return mask.solid[maskY * mask.width + maskX] === 1;
  }

  function conservativeOverlap(a, b) {
    const aCenterX = a.x + a.w / 2;
    const aCenterY = a.y + a.h / 2;
    const bCenterX = b.x + b.w / 2;
    const bCenterY = b.y + b.h / 2;
    const radiusX = a.w * .26 + b.w * .32;
    const radiusY = a.h * .28 + b.h * .32;
    const normalizedX = (aCenterX - bCenterX) / radiusX;
    const normalizedY = (aCenterY - bCenterY) / radiusY;
    return normalizedX * normalizedX + normalizedY * normalizedY < 1;
  }

  function spritesOverlap(a, b) {
    const aBounds = spriteBounds(a);
    const bBounds = spriteBounds(b);
    const left = Math.max(aBounds.left, bBounds.left);
    const top = Math.max(aBounds.top, bBounds.top);
    const right = Math.min(aBounds.right, bBounds.right);
    const bottom = Math.min(aBounds.bottom, bBounds.bottom);
    if (left >= right || top >= bottom) return false;

    if (!collisionMasks[a.imageKey] || !collisionMasks[b.imageKey]) return conservativeOverlap(a, b);

    const step = 3;
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    if (maskContains(a, centerX, centerY) && maskContains(b, centerX, centerY)) return true;
    for (let y = top + step / 2; y < bottom; y += step) {
      for (let x = left + step / 2; x < right; x += step) {
        if (maskContains(a, x, y) && maskContains(b, x, y)) return true;
      }
    }
    return false;
  }

  function update(dt) {
    if (state !== 'playing') return;
    elapsed += dt;
    coffeeTimer = Math.max(0, coffeeTimer - dt);
    slowTimer = Math.max(0, slowTimer - dt);
    toastTimer = Math.max(0, toastTimer - dt);
    if (toastTimer === 0) ui.pickupToast.classList.add('hidden');
    const d = difficulty();
    const worldScale = slowTimer > 0 ? .65 : 1;
    const scroll = BASE_SCROLL * d * worldScale;
    height += dt * scroll * .37 * (coffeeTimer > 0 ? 1.25 : 1);
    spawnDistance += scroll * dt;
    guideTimer -= dt;
    if (guideTimer <= 0) ui.guide.classList.add('hidden');

    const direction = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (direction) player.targetX += direction * KEYBOARD_SPEED * dt;
    const minX = player.w / 2 + 12;
    const maxX = W - player.w / 2 - 12;
    player.targetX = Math.max(minX, Math.min(maxX, player.targetX));
    const previousX = player.x;
    player.x += (player.targetX - player.x) * Math.min(1, dt * 17);
    player.vx = dt > 0 ? (player.x - previousX) / dt : 0;

    if (spawnDistance >= nextRowSpacing) {
      spawnObstacle(spawnDistance);
      spawnDistance = 0;
      nextRowSpacing = rowSpacing(d);
    }

    for (const o of obstacles) {
      o.y += scroll * dt;
      o.x += o.vx * dt;
      if (o.vx && (o.x < o.originX - o.travel || o.x > o.originX + o.travel)) o.vx *= -1;
      const obstacleSprite = { imageKey: o.kind, x: o.x, y: o.y, w: o.w, h: o.h, rotation: 0 };
      if (!o.dead && spritesOverlap(playerSprite(), obstacleSprite)) {
        burst(player.x, player.y, coffeeTimer > 0 ? '#d9ff43' : '#ff5b4d', 18);
        if (coffeeTimer > 0) o.dead = true;
        else if (shield > 0) { shield = 0; o.dead = true; sound.playSfx('shieldBreak'); }
        else { sound.playSfx('hit'); gameOver(); break; }
      }
    }
    for (const p of pickups) {
      p.y += scroll * dt;
      p.phase += dt * 4;
      const pickupSprite = { imageKey: p.type, x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h, rotation: 0 };
      if (!p.dead && spritesOverlap(playerSprite(), pickupSprite)) collectItem(p);
    }
    obstacles = obstacles.filter(o => !o.dead && o.y < H + 70);
    pickups = pickups.filter(p => !p.dead && p.y < H + 70);
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 2; }
    particles = particles.filter(p => p.life > 0);
    updateHud();
  }

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function drawBackground(time) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    const sky = {
      normal: ['#42bdf7', '#8fddfa', '#d6f1f8'],
      stretch: ['#5b4596', '#ff8a65', '#ffd09a'],   // ストレッチモード：夕焼け
      overtime: ['#060b1f', '#16214a', '#2d2f63']   // 無限残業編：深夜
    }[mode];
    grad.addColorStop(0, sky[0]);
    grad.addColorStop(.58, sky[1]);
    grad.addColorStop(1, sky[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const offset = state === 'playing' ? (height * 2.8) % 180 : (time * .012) % 180;
    ctx.globalAlpha = mode === 'overtime' ? .08 : .34;
    ctx.fillStyle = '#ffffff';
    for (let row = -1; row < 7; row++) {
      const y = row * 180 + offset;
      const x = (row % 2 ? 245 : 45);
      ctx.beginPath();
      ctx.ellipse(x, y, 66, 19, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 38, y - 10, 40, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const night = mode === 'overtime';
    ctx.fillStyle = night ? 'rgba(3,6,18,.75)' : 'rgba(7,35,55,.08)';
    for (let x = 0; x < W; x += 52) {
      const buildingH = 100 + ((x * 17) % 110);
      ctx.fillRect(x, H - buildingH, 44, buildingH);
    }
    if (night) {
      // まだ誰かが残っているオフィスの窓あかり
      ctx.fillStyle = 'rgba(255,214,110,.55)';
      for (let x = 0; x < W; x += 52) {
        const buildingH = 100 + ((x * 17) % 110);
        for (let wy = H - buildingH + 10; wy < H - 12; wy += 16) {
          for (let wx = 6; wx < 40; wx += 12) {
            if ((x * 7 + wx * 13 + wy * 3) % 5 < 2) ctx.fillRect(x + wx, wy, 6, 8);
          }
        }
      }
    }
  }

  function drawSpeedLines() {
    if (state !== 'playing') return;
    const count = Math.min(8, Math.floor((difficulty() - 1) * 2.5));
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < count; i++) {
      const x = (i * 73 + elapsed * 91) % W;
      const y = (i * 113 + height * 5) % H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 22 + difficulty() * 10);
      ctx.stroke();
    }
  }

  function drawObstacles() {
    for (const o of obstacles) {
      const art = images[o.kind];
      if (art?.complete && art.naturalWidth) {
        ctx.save();
        ctx.shadowColor = 'rgba(8,20,33,.24)';
        ctx.shadowBlur = 7;
        ctx.shadowOffsetY = 5;
        ctx.drawImage(art, o.x, o.y, o.w, o.h);
        ctx.restore();
      }
    }
  }

  function drawPickups(time) {
    for (const p of pickups) {
      const pulse = 1 + Math.sin(p.phase) * .08;
      const size = p.w * pulse;
      ctx.save();
      ctx.globalAlpha = .35 + Math.sin(time / 130) * .1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(p.x, p.y, 29, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      const art = images[p.type];
      if (art?.complete && art.naturalWidth) ctx.drawImage(art, p.x - size / 2, p.y - size / 2, size, size);
      ctx.restore();
    }
  }

  function drawPlayer(time) {
    const bob = state === 'playing' ? Math.sin(time / 90) * 3 : 0;
    const x = player.x;
    const y = player.y + bob;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(playerRotation());

    if (coffeeTimer > 0 || shield > 0) {
      ctx.globalAlpha = .35 + Math.sin(time / 80) * .12;
      ctx.fillStyle = coffeeTimer > 0 ? '#d9ff43' : '#55c3ff';
      ctx.beginPath(); ctx.arc(0, 0, 43, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 10, 34);
      ctx.lineTo(i * 15, 63 + Math.random() * 10);
      ctx.stroke();
    }

    if (images.character.complete && images.character.naturalWidth) {
      ctx.drawImage(images.character, -30, -38, 60, 72);
      ctx.restore();
      return;
    }

    ctx.fillStyle = '#15283b';
    roundedRect(-15, -6, 30, 42, 7);
    ctx.fill();
    ctx.strokeStyle = '#081421'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(7, -4); ctx.lineTo(0, 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff5b4d';
    ctx.beginPath(); ctx.moveTo(-2, 1); ctx.lineTo(2, 1); ctx.lineTo(4, 19); ctx.lineTo(0, 23); ctx.lineTo(-4, 19); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f1b184';
    ctx.beginPath(); ctx.arc(0, -21, 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#081421'; ctx.stroke();
    ctx.fillStyle = '#081421';
    ctx.beginPath(); ctx.arc(-5, -23, 1.6, 0, Math.PI * 2); ctx.arc(5, -23, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -30, 15, Math.PI, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(7, -34); ctx.lineTo(20, -28); ctx.lineTo(10, -25); ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#d9ff43';
    ctx.font = '900 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NOBORU', x, y + 51);
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color || '#d9ff43';
      ctx.fillRect(p.x, p.y, 5, 5);
    }
    ctx.globalAlpha = 1;
  }

  function render(time) {
    drawBackground(time);
    drawSpeedLines();
    drawObstacles();
    drawPickups(time);
    if (state !== 'title' && state !== 'briefing') drawPlayer(time);
    drawParticles();
  }

  function loop(time) {
    const dt = Math.max(0, Math.min(.034, (time - lastTime) / 1000 || 0));
    lastTime = time;
    // 例外が出てもループを止めない（止まると当たり判定ごと動かなくなるため）
    try { update(dt); } catch (error) { console.error('[update]', error); }
    try { render(time); } catch (error) { console.error('[render]', error); }
    requestAnimationFrame(loop);
  }

  document.getElementById('startButton').addEventListener('click', () => {
    sound.playSfx('select');
    sound.playBgm('title');
    showItemBriefing();
  });
  document.getElementById('briefingStartButton').addEventListener('click', () => {
    sound.playSfx('select');
    sound.playBgm('gameplay', true);
    startGame();
  });
  document.getElementById('briefingBackButton').addEventListener('click', () => {
    sound.playSfx('back');
    sound.playBgm('title');
    showTitle();
  });
  document.getElementById('retryButton').addEventListener('click', () => {
    sound.playSfx('select');
    sound.playBgm('gameplay', true);
    startGame();
  });
  document.getElementById('pauseButton').addEventListener('click', () => { sound.playSfx('pause'); togglePause(); });
  document.getElementById('resumeButton').addEventListener('click', () => { sound.playSfx('pause'); togglePause(true); });
  document.getElementById('pauseToTitle').addEventListener('click', () => {
    sound.playSfx('back');
    sound.playBgm('title', true);
    showTitle();
  });
  document.getElementById('overToTitle').addEventListener('click', () => {
    sound.playSfx('back');
    sound.playBgm('title', true);
    showTitle();
  });
  ui.modeButtons.forEach(button => button.addEventListener('click', () => {
    if (!isModeUnlocked(button.dataset.mode)) return;
    sound.playSfx('select');
    mode = button.dataset.mode;
    writeStorage('mugen-shoshin-mode', mode);
    updateModeUi();
  }));
  document.getElementById('titleRankingButton').addEventListener('click', openRanking);
  document.getElementById('overRankingButton').addEventListener('click', openRanking);
  document.getElementById('rankingCloseButton').addEventListener('click', () => {
    sound.playSfx('back');
    ui.ranking.classList.add('hidden');
  });
  ui.rankingTabs.forEach(tab => tab.addEventListener('click', () => {
    sound.playSfx('select');
    rankingBoard = tab.dataset.board;
    renderRanking();
  }));
  document.getElementById('saveCaptureButton').addEventListener('click', downloadFailureCapture);
  document.getElementById('shareCaptureButton').addEventListener('click', shareFailureCapture);
  ui.soundButton.addEventListener('click', () => sound.toggle());

  const screen = document.getElementById('screen');
  screen.addEventListener('pointerdown', e => {
    if (state !== 'playing' || e.target.closest('button')) return;
    const rect = screen.getBoundingClientRect();
    if (e.clientY > rect.bottom - 76) return;
    screen.setPointerCapture(e.pointerId);
    drag.active = true;
    drag.pointerId = e.pointerId;
    drag.startClientX = e.clientX;
    drag.startPlayerX = player.targetX;
  });
  screen.addEventListener('pointermove', e => {
    if (state !== 'playing' || !drag.active || drag.pointerId !== e.pointerId) return;
    const rect = canvas.getBoundingClientRect();
    const deltaX = (e.clientX - drag.startClientX) * (W / rect.width);
    player.targetX = drag.startPlayerX + deltaX * 1.12;
    if (Math.abs(deltaX) > 5) ui.guide.classList.add('hidden');
  });
  function endDrag() {
    drag.active = false;
    drag.pointerId = null;
  }
  screen.addEventListener('pointerup', endDrag);
  screen.addEventListener('pointercancel', endDrag);

  window.addEventListener('keydown', e => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.left = true;
    if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.right = true;
    if (e.key === 'Escape') togglePause();
  });
  window.addEventListener('keyup', e => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.left = false;
    if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.right = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') togglePause();
  });

  requestAnimationFrame(loop);
})();
