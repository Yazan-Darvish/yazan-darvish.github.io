/* Debug mode — мини-игра: отбиваемся от багов языками программирования.
   Каждый баг приходит из своего отдела — бэкенд, ИИ, база, фронтенд,
   мобильные приложения, DevOps — и берёт его только оружие этого отдела.
   Цвет бага совпадает с цветом оружия. Поведение багов подобрано под
   механику «своего» оружия, поэтому одним языком игру не пройти.
   Пять волн; со второй у каждой свой инцидент, после третьей и пятой — босс.
   Запуск: DebugGame.start(тексты). Выход: Esc, кнопка × или экран итогов. */

window.DebugGame = (function () {
  "use strict";

  /* rate — перезарядка в секундах на первом уровне;
     boss — во сколько раз удар сильнее по боссу, чтобы урон в секунду
     у всех шести был примерно равным */
  var WEAPONS = [
    { key: "PHP",     color: "#8a7dff", kind: "stream", rate: 0.15, boss: 1 },
    { key: "Python",  color: "#ffd24a", kind: "homing", rate: 1.6,  boss: 4 },
    { key: "SQL",     color: "#ff7ad4", kind: "query",  rate: 6,    boss: 10 },
    { key: "JS",      color: "#b6ff4a", kind: "trap",   rate: 0.9,  boss: 2 },
    { key: "Flutter", color: "#54c5f8", kind: "beam",   rate: 2.6,  boss: 6 },
    { key: "Docker",  color: "#2496ed", kind: "pods",   rate: 11,   boss: 1.5 }
  ];
  var ANY = -1;                   /* «любое оружие»: дедлайны босса и Deploy */

  /* w — каким оружием берётся баг. dmg — сколько аптайма он съедает,
     если дошёл до ядра. pts — очки до умножения на комбо. */
  var TYPES = {
    backend: { w: 0,   hp: 3, speed: 70,  r: 14, label: "500",           dmg: 7,  pts: 20 },
    ai:      { w: 1,   hp: 3, speed: 76,  r: 13, label: "hallucination", dmg: 8,  pts: 35 },
    db:      { w: 2,   hp: 2, speed: 62,  r: 10, label: "deadlock",      dmg: 4,  pts: 12 },
    front:   { w: 3,   hp: 2, speed: 98,  r: 12, label: "undefined",     dmg: 6,  pts: 25 },
    mobile:  { w: 4,   hp: 9, speed: 34,  r: 19, label: "crash",         dmg: 14, pts: 60 },
    devops:  { w: 5,   hp: 3, speed: 58,  r: 15, label: "OOM",           dmg: 7,  pts: 30 },
    pod:     { w: 5,   hp: 1, speed: 92,  r: 8,  label: "",              dmg: 3,  pts: 8 },
    orb:     { w: ANY, hp: 3, speed: 115, r: 10, label: "deadline",      dmg: 10, pts: 25 }
  };
  function colorOf(type) {
    var w = TYPES[type].w;
    return w === ANY ? "#ff3b3b" : WEAPONS[w].color;
  }
  function fits(type, wi) {
    var w = TYPES[type].w;
    return w === ANY || wi === ANY || w === wi;
  }

  /* кто появляется на волне: каждая добавляет новые отделы к прежним */
  var POOLS = (function () {
    var add = [
      ["backend", "backend", "backend", "front", "front"],
      ["db", "ai", "backend"],
      ["mobile", "ai", "front"],
      ["devops", "db", "mobile"],
      ["devops", "ai", "front", "mobile"]
    ], acc = [];
    return add.map(function (a) { acc = acc.concat(a); return acc.slice(); });
  })();

  var WAVES = 5;
  var WAVE_LEN = 28;
  var BOSS_AFTER = { 2: 0, 4: 1 };            /* номер волны → какой босс */
  /* босс уязвим только к одному отделу, и тот меняется каждые swap секунд */
  var BOSSES = [
    { hp: 150, r: 44, spin: 0.22, spawnEvery: 2.4, shotEvery: 4.2, shots: 1, swap: 6,
      doms: ["backend", "db"] },
    { hp: 260, r: 52, spin: 0.3,  spawnEvery: 2.0, shotEvery: 3.4, shots: 2, swap: 5,
      doms: ["backend", "ai", "db", "front", "mobile", "devops"] }
  ];
  var MODS = ["friday", "blackfriday", "night", "debt"];

  var DROPS = {
    hotfix: { color: "#7ee787", label: "hotfix +15%" },
    coffee: { color: "#d9a86c", label: "coffee ×2" },
    backup: { color: "#4ad9ff", label: "backup" }
  };

  var MAX_LVL = 5;
  var CHAIN_GAP = 2;          /* секунд между убийствами, чтобы серия не прервалась */

  function lvl(i) { return state.levels[i]; }
  function rateOf(i) {
    return WEAPONS[i].rate * Math.pow(0.88, lvl(i)) * (state.time < state.coffeeUntil ? 0.5 : 1);
  }

  var root, canvas, ctx, fog, fctx, els = {}, T = null;
  var W = 0, H = 0, dpr = 1, speedK = 1, sizeK = 1;
  /* палец вместо мыши: другая подсказка и кнопка выхода вместо Esc */
  var touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  var state = null, raf = null, built = false, flashTimer = null;

  /* ------------------------------------------------------------ разметка */

  function build() {
    root = document.createElement("div");
    root.className = "dbg";
    root.innerHTML =
      '<canvas class="dbg__canvas"></canvas>' +
      '<button type="button" class="dbg__quit">&times;</button>' +
      '<button type="button" class="dbg__info">i</button>' +
      '<div class="dbg__hud">' +
        '<div class="dbg__bar"><span class="dbg__bar-label"></span>' +
          '<div class="dbg__bar-track"><i></i></div><b></b></div>' +
        '<div class="dbg__meta"><span data-wave></span><span data-killed></span><span data-score></span></div>' +
      "</div>" +
      '<p class="dbg__mod" hidden></p>' +
      '<div class="dbg__boss" hidden><p class="dbg__boss-name"></p>' +
        '<div class="dbg__boss-track"><i></i></div><p class="dbg__boss-hint"></p></div>' +
      '<div class="dbg__dock"><div class="dbg__weapons"></div>' +
        '<button type="button" class="dbg__ult"><span></span><i></i></button></div>' +
      '<p class="dbg__controls"></p>' +
      '<div class="dbg__wave-flash" hidden><b></b><small></small></div>' +
      '<div class="dbg__brief" hidden>' +
        '<p class="dbg__brief-title"></p><p class="dbg__brief-sub"></p>' +
        '<div class="dbg__brief-cards"></div>' +
        '<p class="dbg__brief-tip"></p>' +
        '<button type="button" class="btn btn--accent dbg__brief-go"></button></div>' +
      '<div class="dbg__up" hidden>' +
        '<p class="dbg__up-title"></p><p class="dbg__up-hint"></p>' +
        '<div class="dbg__up-cards"></div></div>' +
      '<div class="dbg__over" hidden>' +
        '<p class="dbg__over-title"></p>' +
        '<div class="dbg__over-stats"></div>' +
        '<p class="dbg__over-best"></p>' +
        '<div class="dbg__over-actions">' +
          '<button type="button" class="btn btn--accent" data-again></button>' +
          '<button type="button" class="dbg__exit" data-close></button>' +
        "</div></div>";
    document.body.appendChild(root);

    canvas = root.querySelector(".dbg__canvas");
    ctx = canvas.getContext("2d");
    /* туман ночного дежурства рисуется на своём холсте: в нём вырезаются
       светлые пятна, и только потом он ложится поверх игры */
    fog = document.createElement("canvas");
    fctx = fog.getContext("2d");

    els.barLabel = root.querySelector(".dbg__bar-label");
    els.barFill = root.querySelector(".dbg__bar-track i");
    els.barValue = root.querySelector(".dbg__bar b");
    els.wave = root.querySelector("[data-wave]");
    els.killed = root.querySelector("[data-killed]");
    els.score = root.querySelector("[data-score]");
    els.mod = root.querySelector(".dbg__mod");
    els.boss = root.querySelector(".dbg__boss");
    els.bossName = root.querySelector(".dbg__boss-name");
    els.bossFill = root.querySelector(".dbg__boss-track i");
    els.bossHint = root.querySelector(".dbg__boss-hint");
    els.ult = root.querySelector(".dbg__ult");
    els.ultName = root.querySelector(".dbg__ult span");
    els.weapons = root.querySelector(".dbg__weapons");
    els.controls = root.querySelector(".dbg__controls");
    els.flash = root.querySelector(".dbg__wave-flash");
    els.flashTitle = root.querySelector(".dbg__wave-flash b");
    els.flashSub = root.querySelector(".dbg__wave-flash small");
    els.brief = root.querySelector(".dbg__brief");
    els.briefTitle = root.querySelector(".dbg__brief-title");
    els.briefSub = root.querySelector(".dbg__brief-sub");
    els.briefCards = root.querySelector(".dbg__brief-cards");
    els.briefTip = root.querySelector(".dbg__brief-tip");
    els.briefGo = root.querySelector(".dbg__brief-go");
    els.up = root.querySelector(".dbg__up");
    els.upTitle = root.querySelector(".dbg__up-title");
    els.upHint = root.querySelector(".dbg__up-hint");
    els.upCards = root.querySelector(".dbg__up-cards");
    els.over = root.querySelector(".dbg__over");
    els.overTitle = root.querySelector(".dbg__over-title");
    els.overStats = root.querySelector(".dbg__over-stats");
    els.overBest = root.querySelector(".dbg__over-best");
    els.again = root.querySelector("[data-again]");
    els.close = root.querySelector("[data-close]");
    els.quit = root.querySelector(".dbg__quit");
    els.info = root.querySelector(".dbg__info");

    els.again.addEventListener("click", function () { reset(false); });
    els.close.addEventListener("click", function () { stop(); });
    els.quit.addEventListener("click", function () { stop(); });
    els.ult.addEventListener("click", function () { deploy(); });
    els.briefGo.addEventListener("click", function () { begin(); });
    els.info.addEventListener("click", function () { openInfo(); });

    /* pointer-события покрывают и мышь, и палец: касание сразу целится
       и стреляет, пока палец на экране */
    canvas.addEventListener("pointermove", function (e) {
      state.aim.x = e.clientX;
      state.aim.y = e.clientY;
    });
    canvas.addEventListener("pointerdown", function (e) {
      state.aim.x = e.clientX;
      state.aim.y = e.clientY;
      state.firing = true;
      /* захват не критичен: без него палец просто не «уедет» за край */
      if (e.pointerType !== "mouse") try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });
    function release() { if (state) state.firing = false; }
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      pick(state.weapon + (e.deltaY > 0 ? 1 : -1));
    }, { passive: false });

    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", fit);
    built = true;
  }

  function onKey(e) {
    if (!state || root.hidden) return;
    if (e.key === "Escape") { stop(); return; }

    if (!els.brief.hidden) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); begin(); }
      return;
    }

    var upOpen = !els.up.hidden;
    if (!state.running && !upOpen) return;

    var n = parseInt(e.key, 10);
    if (upOpen) {
      var card = els.upCards.querySelectorAll(".dbg__up-card")[n - 1];
      if (card) card.click();
      return;
    }
    if (e.key === " " || e.code === "Space") { e.preventDefault(); deploy(); return; }
    if (n >= 1 && n <= WEAPONS.length) pick(n - 1);
  }

  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fog.width = W;
    fog.height = H;
    /* баланс рассчитан на экран ноутбука; на телефоне до ядра вдвое ближе,
       поэтому баги замедляются, чтобы им оставалось столько же времени */
    speedK = Math.max(0.6, Math.min(1, Math.hypot(W, H) / 2 / 740));
    sizeK = Math.max(0.7, Math.min(1, Math.min(W, H) / 700));
  }

  function wText(i) {
    return T.weapons[i] || { key: WEAPONS[i].key, role: "", area: "", desc: "", up: "", foe: "" };
  }

  function renderWeapons() {
    els.weapons.innerHTML = WEAPONS.map(function (w, i) {
      var t = wText(i);
      return '<button type="button" class="dbg__w" data-i="' + i + '" style="--wc:' + w.color + '"' +
        ' title="' + t.desc + " · " + t.foe + '">' +
        '<span class="dbg__w-key">' + (i + 1) + "</span>" +
        '<span class="dbg__w-name">' + t.key + "</span>" +
        '<span class="dbg__w-role">' + t.role + "</span>" +
        '<span class="dbg__w-lvl"></span>' +
        '<i class="dbg__w-cd"></i></button>';
    }).join("");
    els.weapons.querySelectorAll(".dbg__w").forEach(function (b) {
      b.addEventListener("click", function () { pick(parseInt(b.dataset.i, 10)); });
    });
    els.wEls = els.weapons.querySelectorAll(".dbg__w");
  }

  /* брифинг: кто в команде, за что отвечает и каких багов берёт */
  function renderBrief() {
    els.briefTitle.textContent = T.brief_title;
    els.briefSub.textContent = T.brief_sub;
    els.briefTip.textContent = T.brief_tip;
    els.briefGo.textContent = T.brief_start;
    els.briefCards.innerHTML = WEAPONS.map(function (w, i) {
      var t = wText(i);
      return '<div class="dbg__brief-card" style="--wc:' + w.color + '">' +
        '<b><kbd>' + (i + 1) + "</kbd>" + t.key + "</b>" +
        "<span>" + t.area + "</span><p>" + t.desc + "</p>" +
        '<p class="dbg__brief-foe">' + t.foe + "</p></div>";
    }).join("");
  }

  function pick(i) {
    if (i < 0) i = WEAPONS.length - 1;
    if (i >= WEAPONS.length) i = 0;
    state.weapon = i;
    els.wEls.forEach(function (el, n) { el.classList.toggle("is-on", n === i); });
  }

  /* подсветить кнопку оружия, которое нужно сейчас */
  function hint(w) {
    if (w === ANY) return;
    state.hintW = w;
    state.hintUntil = state.time + 0.9;
  }

  /* -------------------------------------------------------------- логика */

  function addBug(type, x, y) {
    var t = TYPES[type];
    var hp = t.hp + (state.mod === "debt" && type !== "orb" ? 1 : 0);
    var b = { type: type, x: x, y: y, hp: hp, maxHp: hp, r: t.r, phase: Math.random() * 6.28, hit: 0, lockUntil: 0 };
    state.bugs.push(b);
    return b;
  }

  function edgePoint() {
    var edge = (Math.random() * 4) | 0;
    if (edge === 0) return [Math.random() * W, -40];
    if (edge === 1) return [W + 40, Math.random() * H];
    if (edge === 2) return [Math.random() * W, H + 40];
    return [-40, Math.random() * H];
  }

  /* каждый отдел приходит по-своему: база — стаей, приложения —
     колонной, DevOps — сразу с нескольких сторон */
  function spawnGroup(type, x, y) {
    var i, n;
    if (type === "db") {
      for (i = 0, n = 4 + state.wave; i < n; i++) {
        addBug("db", x + (Math.random() - .5) * 80, y + (Math.random() - .5) * 80);
      }
    } else if (type === "mobile") {
      var d = Math.hypot(x - W / 2, y - H / 2) || 1;
      n = 1 + (state.wave >= 3 ? 1 : 0) + (Math.random() < .5 ? 1 : 0);
      for (i = 0; i < n; i++) addBug("mobile", x + (x - W / 2) / d * 52 * i, y + (y - H / 2) / d * 52 * i);
    } else if (type === "devops") {
      addBug("devops", x, y);
      for (i = 0, n = 1 + (state.wave >= 4 ? 1 : 0); i < n; i++) {
        var p = edgePoint();
        addBug("devops", p[0], p[1]);
      }
    } else {
      addBug(type, x, y);
    }
  }

  function spawn() {
    var pool = POOLS[state.wave];
    var p = edgePoint();
    spawnGroup(pool[(Math.random() * pool.length) | 0], p[0], p[1]);
  }

  /* баги ИИ видны меньше половины времени, но у самого ядра — всегда:
     иначе они били бы невидимками, и увернуться было бы нечем */
  function seen(b) {
    if (b.type !== "ai") return true;
    return Math.sin(state.time * 2.4 + b.phase) > 0.35 || Math.hypot(b.x - W / 2, b.y - H / 2) < 120;
  }

  function locked(b) { return b.lockUntil > state.time; }

  function comboMult() { return Math.min(5, 1 + Math.floor(state.chain / 6)); }

  function pop(x, y, text, color) {
    state.pops.push({ x: x, y: y, text: text, color: color, life: 1 });
  }

  function burst(x, y, color, n) {
    for (var p = 0; p < n; p++) {
      state.sparks.push({
        x: x, y: y, life: .45,
        vx: (Math.random() - .5) * 260, vy: (Math.random() - .5) * 260,
        color: color
      });
    }
  }

  /* урон одному багу по индексу. Чужое оружие бага не берёт: искра,
     а кнопка нужного оружия подсвечивается */
  function hurt(k, dmg, wi) {
    var b = state.bugs[k];
    if (!fits(b.type, wi)) {
      state.sparks.push({ x: b.x, y: b.y, life: .3, color: "#fff" });
      hint(TYPES[b.type].w);
      return false;
    }
    b.hp -= dmg;
    b.hit = 1;
    state.hitMark = .16;
    if (b.hp <= 0) kill(k);
    return true;
  }

  function dist(a, x, y) { return Math.hypot(a.x - x, a.y - y); }

  /* ближайшие к ядру баги, которых берёт это оружие */
  function targetsFor(wi, onlySeen) {
    var cx = W / 2, cy = H / 2;
    return state.bugs.filter(function (b) {
      return TYPES[b.type].w === wi || b.type === "orb" ? !onlySeen || seen(b) : false;
    }).sort(function (a, b) { return dist(a, cx, cy) - dist(b, cx, cy); });
  }

  function bossFits(wi) {
    var b = state.boss;
    return b && b.enter >= 1 && fits(BOSSES[b.i].doms[b.dom], wi);
  }

  function shoot(x, y, a, speed, dmg, wi, kind, target, turn) {
    state.shots.push({
      x: x, y: y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      dmg: dmg, w: wi, color: WEAPONS[wi].color, kind: kind, life: 2.4,
      target: target || null, turn: turn || 0
    });
  }

  function fire(now) {
    var i = state.weapon, w = WEAPONS[i], lv = lvl(i);
    if (now - state.lastShot[i] < rateOf(i)) return;

    var cx = W / 2, cy = H / 2;
    var ang = Math.atan2(state.aim.y - cy, state.aim.x - cx);

    /* запрос без подходящих багов не тратит перезарядку */
    if (w.kind === "query" && !query(lv)) return;
    state.lastShot[i] = now;
    /* отдача и вспышка у ствола: без них выстрел не ощущается */
    state.recoil = w.kind === "beam" ? 1.6 : w.kind === "stream" ? .6 : 1;
    state.muzzle = .08;

    if (w.kind === "stream") {
      /* бэкенд: с прокачкой поток запросов идёт в два и три канала */
      var n = lv >= 4 ? 3 : lv >= 2 ? 2 : 1;
      for (var k = 0; k < n; k++) {
        var off = (k - (n - 1) / 2) * 10;
        shoot(cx + Math.cos(ang) * 34 - Math.sin(ang) * off, cy + Math.sin(ang) * 34 + Math.cos(ang) * off,
          ang, 780, 1 + Math.floor(lv / 2), 0, "shot");
      }
    }
    if (w.kind === "homing") {
      /* ИИ: каждая ракета берёт свою цель, даже невидимую */
      var list = targetsFor(1, false), m = 1 + Math.floor(lv / 2);
      for (var r = 0; r < m; r++) {
        var a = ang + (r - (m - 1) / 2) * 0.4;
        var tgt = list[r] || list[0] || (bossFits(1) ? state.boss : null);
        shoot(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34, a, 520, 3 + Math.floor(lv / 2), 1, "homing", tgt, 4 + lv);
      }
    }
    if (w.kind === "trap") placeTrap();
    if (w.kind === "beam") beam(ang, 3 + lv);
    if (w.kind === "pods") launchPods(lv);
  }

  /* SQL: ищет стаю базы ближе всего к прицелу и бьёт по всем её багам
     разом, блокируя их на месте. По боссу бьёт, если прицел на нём */
  function query(lv) {
    var dmg = 2 + lv, lock = 1.5 + lv * 0.3, ax = state.aim.x, ay = state.aim.y;
    if (bossFits(2) && dist(state.boss, ax, ay) < state.boss.r + 60) {
      state.lines.push({ x: state.boss.x, y: state.boss.y, life: .45 });
      pop(ax, ay - 22, "UPDATE incident", WEAPONS[2].color);
      damageBoss(dmg, 2);
      return true;
    }
    var best = null, bd = 1e9;
    state.bugs.forEach(function (b) {
      if (!fits(b.type, 2)) return;
      var d = dist(b, ax, ay);
      if (d < bd) { bd = d; best = b; }
    });
    if (!best) {
      var under = bugUnderAim();
      if (under) hint(TYPES[under.type].w);
      return false;
    }
    var type = best.type;
    for (var k = state.bugs.length - 1; k >= 0; k--) {
      var b = state.bugs[k];
      if (b.type !== type) continue;
      state.lines.push({ x: b.x, y: b.y, life: .45 });
      b.lockUntil = state.time + lock;
      hurt(k, dmg, 2);
    }
    pop(ax, ay - 22, "WHERE bug = '" + TYPES[type].label + "'", WEAPONS[2].color);
    return true;
  }

  /* JS: обработчик события ставится туда, куда смотрит прицел,
     и ждёт, пока на него наступит баг фронтенда */
  function placeTrap() {
    var cx = W / 2, cy = H / 2;
    var dx = state.aim.x - cx, dy = state.aim.y - cy, d = Math.hypot(dx, dy) || 1;
    var r = Math.max(d, 70);
    state.traps.push({ x: cx + dx / d * r, y: cy + dy / d * r, life: 14, arm: 0.35 });
    while (state.traps.length > 2 + lvl(3)) state.traps.shift();
  }

  function explode(x, y) {
    var lv = lvl(3), R = 70 + lv * 10, dmg = 3 + Math.floor(lv / 2);
    state.blasts.push({ x: x, y: y, r: R, life: .35 });
    for (var k = state.bugs.length - 1; k >= 0; k--) {
      var b = state.bugs[k];
      if (dist(b, x, y) < R + b.r && fits(b.type, 3)) hurt(k, dmg, 3);
    }
    if (bossFits(3) && dist(state.boss, x, y) < R + state.boss.r) damageBoss(dmg, 3);
  }

  /* Flutter: мгновенный луч через весь экран, бьёт всю колонну разом */
  function beam(ang, dmg) {
    var cx = W / 2, cy = H / 2, ex = Math.cos(ang), ey = Math.sin(ang);
    function onRay(x, y, r) {
      var px = x - cx, py = y - cy;
      return px * ex + py * ey > 0 && Math.abs(px * ey - py * ex) < r;
    }
    state.beams.push({ ang: ang, life: .25 });
    for (var k = state.bugs.length - 1; k >= 0; k--) {
      var b = state.bugs[k];
      if (onRay(b.x, b.y, b.r + 7)) hurt(k, dmg, 4);
    }
    for (var g = state.drops.length - 1; g >= 0; g--) {
      if (onRay(state.drops[g].x, state.drops[g].y, 18)) collect(state.drops.splice(g, 1)[0]);
    }
    var bs = state.boss;
    if (bs && bs.enter >= 1 && onRay(bs.x, bs.y, bs.r + 8)) damageBoss(dmg, 4);
  }

  /* Docker: реплики кружат у ядра и сами отстреливают баги DevOps */
  function launchPods(lv) {
    var n = 2 + Math.floor(lv / 2);
    state.pods = [];
    for (var k = 0; k < n; k++) state.pods.push({ a: k * 6.283 / n, cd: k * 0.15, x: 0, y: 0 });
    state.podsUntil = state.time + 8 + lv;
  }

  function bugUnderAim() {
    var best = null, bd = 42;
    state.bugs.forEach(function (b) {
      if (!seen(b)) return;
      var d = dist(b, state.aim.x, state.aim.y) - b.r;
      if (d < bd) { bd = d; best = b; }
    });
    return best;
  }

  function kill(k) {
    var bug = state.bugs[k], t = TYPES[bug.type];
    state.bugs.splice(k, 1);
    state.kills++;

    state.chain = state.time - state.lastKill < CHAIN_GAP ? state.chain + 1 : 1;
    state.lastKill = state.time;
    var pts = t.pts * comboMult();
    state.score += pts;
    pop(bug.x, bug.y - bug.r - 8, "+" + pts, colorOf(bug.type));
    var small = bug.type === "db" || bug.type === "pod";
    state.charge = Math.min(100, state.charge + (small ? 1 : 3));
    burst(bug.x, bug.y, colorOf(bug.type), 7);

    /* упавший под нагрузкой сервис рассыпается на поды */
    if (bug.type === "devops") {
      addBug("pod", bug.x - 12, bug.y - 4);
      addBug("pod", bug.x + 12, bug.y + 6);
    }
    if (!small && bug.type !== "orb" && Math.random() < 0.08 + state.wave * 0.01) {
      drop(bug.x, bug.y);
    }
    /* каждый следующий апгрейд дороже предыдущего */
    if (state.kills >= state.nextUp) {
      state.pendingUp = true;
      state.upCount++;
      state.nextUp += 12 + state.upCount * 3;
    }
    updateHud();
  }

  function drop(x, y) {
    var r = Math.random();
    var kind = r < .4 ? "hotfix" : r < .75 ? "coffee" : "backup";
    var a = Math.random() * 6.28;
    state.drops.push({ kind: kind, x: x, y: y, vx: Math.cos(a) * 18, vy: Math.sin(a) * 18, life: 8 });
  }

  function collect(d) {
    if (d.kind === "hotfix") state.uptime = Math.min(100, state.uptime + 15);
    if (d.kind === "coffee") state.coffeeUntil = state.time + 6;
    if (d.kind === "backup") state.shield = 3;
    pop(d.x, d.y - 18, DROPS[d.kind].label, DROPS[d.kind].color);
    burst(d.x, d.y, DROPS[d.kind].color, 10);
    updateHud();
  }

  function hitCore(i) {
    var b = state.bugs[i];
    state.bugs.splice(i, 1);
    burst(b.x, b.y, colorOf(b.type), 6);
    if (state.shield > 0) {
      state.shield--;
      pop(W / 2, H / 2 - 58, "backup", DROPS.backup.color);
      return;
    }
    state.uptime = Math.max(0, state.uptime - TYPES[b.type].dmg);
    state.chain = 0;
    state.shake = 14;
    updateHud();
  }

  /* Deploy: волна от ядра бьёт всех на экране, какого бы отдела ни были */
  function deploy() {
    if (!state || !state.running || state.charge < 100 || state.deploy) return;
    state.charge = 0;
    state.deploy = { r: 0, id: Math.random() };
    state.shake = 10;
    updateHud();
  }

  function pickMod() {
    var left = MODS.filter(function (m) { return state.usedMods.indexOf(m) === -1; });
    var m = left[(Math.random() * left.length) | 0];
    state.usedMods.push(m);
    return m;
  }

  function nextWave() {
    if (state.wave >= WAVES - 1) return finish(true);
    state.wave++;
    state.waveTime = 0;
    state.phase = "wave";
    state.uptime = Math.min(100, state.uptime + 10);
    state.mod = pickMod();
    flashWave();
    updateHud();
  }

  /* ---------------------------------------------------------------- босс */

  function startBoss(i) {
    state.bossSeen[state.wave] = true;
    state.phase = "boss";
    state.boss = {
      i: i, hp: BOSSES[i].hp, maxHp: BOSSES[i].hp, r: BOSSES[i].r * sizeK,
      ang: Math.random() * 6.28, dom: 0, swapAcc: 0, spawnAcc: 0, shotAcc: 0,
      hit: 0, enter: 0, x: -200, y: -200, rage: false, dep: null
    };
    els.bossName.textContent = T.boss_names[i];
    els.boss.hidden = false;
    flash(T.boss, T.boss_names[i]);
    updateHud();
  }

  function bossColor() {
    return colorOf(BOSSES[state.boss.i].doms[state.boss.dom]);
  }

  function orbitR() {
    return Math.min(300, Math.min(W, H) / 2 - state.boss.r - 18);
  }

  function updateBoss(dt) {
    var b = state.boss, cfg = BOSSES[b.i];
    if (b.hit > 0) b.hit -= dt * 5;
    b.enter = Math.min(1, b.enter + dt / 2.2);

    var k = b.rage ? 1.6 : 1;
    b.ang += cfg.spin * k * dt;
    if (b.enter >= 1) {
      /* уязвимость переходит к следующему отделу */
      b.swapAcc += dt;
      if (b.swapAcc >= cfg.swap / k) {
        b.swapAcc = 0;
        b.dom = (b.dom + 1) % cfg.doms.length;
        var wi = TYPES[cfg.doms[b.dom]].w;
        pop(b.x, b.y - b.r - 18, "→ " + WEAPONS[wi].key, WEAPONS[wi].color);
        updateHud();
      }
      b.spawnAcc += dt * k;
      b.shotAcc += dt * k;
      if (b.spawnAcc >= cfg.spawnEvery) {
        b.spawnAcc = 0;
        /* приспешники — из того отдела, к которому босс сейчас уязвим */
        var type = cfg.doms[b.dom];
        if (type === "db") { for (var q = 0; q < 3; q++) addBug("db", b.x + (Math.random() - .5) * 50, b.y + (Math.random() - .5) * 50); }
        else addBug(type === "devops" ? "pod" : type, b.x, b.y);
      }
      if (b.shotAcc >= cfg.shotEvery) {
        b.shotAcc = 0;
        for (var n = 0; n < cfg.shots + (b.rage ? 1 : 0); n++) {
          addBug("orb", b.x + (Math.random() - .5) * 40, b.y + (Math.random() - .5) * 40);
        }
      }
    }
    /* заходит издалека по сужающейся спирали */
    var e = 1 - Math.pow(1 - b.enter, 3);
    var R = orbitR() * (1 + (1 - e) * 1.4);
    b.x = W / 2 + Math.cos(b.ang) * R;
    b.y = H / 2 + Math.sin(b.ang) * R;
  }

  /* true — выстрел упёрся в босса и дальше не летит */
  function hitBoss(sh) {
    var b = state.boss;
    if (!b || b.enter < 1) return false;
    if (dist(b, sh.x, sh.y) > b.r + 4) return false;
    damageBoss(sh.dmg, sh.w);
    return true;
  }

  function damageBoss(d, wi) {
    var b = state.boss;
    if (!b) return;
    if (!fits(BOSSES[b.i].doms[b.dom], wi)) {
      state.sparks.push({ x: b.x + (Math.random() - .5) * b.r, y: b.y + (Math.random() - .5) * b.r, life: .3, color: "#fff" });
      hint(TYPES[BOSSES[b.i].doms[b.dom]].w);
      return;
    }
    d *= wi === ANY ? 1 : WEAPONS[wi].boss;
    b.hp -= d;
    b.hit = 1;
    state.hitMark = .16;
    state.score += Math.round(d * 5);
    state.charge = Math.min(100, state.charge + d * 0.4);
    if (!b.rage && b.hp < b.maxHp / 2) {
      b.rage = true;
      state.shake = 18;
      pop(b.x, b.y - b.r - 30, T.boss_rage, "#ff3b3b");
    }
    if (b.hp <= 0) bossDown();
    else updateHud();
  }

  function bossDown() {
    var b = state.boss, bonus = 1000 * (b.i + 1);
    state.score += bonus;
    pop(b.x, b.y, "+" + bonus, "#fff");
    burst(b.x, b.y, bossColor(), 40);
    state.shake = 24;
    /* дедлайны гаснут вместе с боссом */
    state.bugs = state.bugs.filter(function (x) { return x.type !== "orb"; });
    state.boss = null;
    els.boss.hidden = true;
    nextWave();
  }

  /* ---------------------------------------------------------- обновление */

  function update(dt, now) {
    var cx = W / 2, cy = H / 2;

    state.time += dt;

    if (state.phase === "wave") {
      state.waveTime += dt;
      if (state.waveTime >= WAVE_LEN) {
        if (BOSS_AFTER[state.wave] !== undefined && !state.bossSeen[state.wave]) startBoss(BOSS_AFTER[state.wave]);
        else nextWave();
        if (!state.running) return;
      }
    }

    /* прицел на баге чужого отдела — подсказываем, чем его брать */
    var under = bugUnderAim();
    if (under && !fits(under.type, state.weapon)) hint(TYPES[under.type].w);

    if (state.firing) fire(now);
    if (!state.running) return;

    /* серия прерывается, если долго никого не убивать */
    if (state.chain && state.time - state.lastKill > CHAIN_GAP) state.chain = 0;

    state.spawnAcc += dt;
    var every = Math.max(0.4, 1.35 - state.wave * 0.15 - state.waveTime * 0.006);
    if (state.mod === "blackfriday") every /= 1.6;
    if (state.phase === "boss") every *= 2.2;
    if (state.spawnAcc >= every) { state.spawnAcc = 0; spawn(); }

    if (state.boss) updateBoss(dt);

    /* баги */
    var speedMul = speedK * (1 + state.wave * 0.08) * (state.mod === "friday" ? 1.35 : 1);
    for (var i = state.bugs.length - 1; i >= 0; i--) {
      var b = state.bugs[i];
      var t = TYPES[b.type];
      if (b.hit > 0) b.hit -= dt * 5;

      if (!locked(b)) {
        var dx = cx - b.x, dy = cy - b.y;
        var d = Math.hypot(dx, dy) || 1;
        var sp = t.speed * speedMul;
        var nx = dx / d, ny = dy / d;
        if (b.type === "front") {
          /* фронтенд петляет — в него трудно попасть, проще подставить ловушку */
          b.phase += dt * 6;
          var px = -ny, py = nx;
          b.x += (nx * sp + px * Math.sin(b.phase) * 90) * dt;
          b.y += (ny * sp + py * Math.sin(b.phase) * 90) * dt;
        } else {
          b.x += nx * sp * dt;
          b.y += ny * sp * dt;
        }
      }

      if (Math.hypot(cx - b.x, cy - b.y) < 32 + b.r) {
        hitCore(i);
        if (state.uptime <= 0) return finish(false);
      }
    }

    /* обработчики событий срабатывают только на то, что могут взять */
    for (var tI = state.traps.length - 1; tI >= 0; tI--) {
      var tr = state.traps[tI];
      tr.life -= dt;
      tr.arm -= dt;
      var fired = false;
      if (tr.arm <= 0) {
        fired = state.bugs.some(function (bb) { return fits(bb.type, 3) && dist(bb, tr.x, tr.y) < 30 + bb.r; }) ||
          (bossFits(3) && dist(state.boss, tr.x, tr.y) < 30 + state.boss.r);
      }
      if (fired) {
        state.traps.splice(tI, 1);
        explode(tr.x, tr.y);
        if (!state.running) return;
      } else if (tr.life <= 0) {
        state.traps.splice(tI, 1);
      }
    }

    /* реплики Docker */
    if (state.pods.length) {
      if (state.time > state.podsUntil) state.pods = [];
      var podDmg = 1 + Math.floor(lvl(5) / 3);
      state.pods.forEach(function (p) {
        p.a += dt * 1.6;
        p.x = cx + Math.cos(p.a) * 74;
        p.y = cy + Math.sin(p.a) * 74;
        p.cd -= dt;
        if (p.cd > 0) return;
        var tgt = null, td = 420;
        targetsFor(5, true).forEach(function (bb) {
          var dd = dist(bb, p.x, p.y);
          if (dd < td) { td = dd; tgt = bb; }
        });
        if (!tgt && bossFits(5)) tgt = state.boss;
        if (!tgt) return;
        p.cd = 0.45;
        shoot(p.x, p.y, Math.atan2(tgt.y - p.y, tgt.x - p.x), 700, podDmg, 5, "shot");
      });
    }

    /* волна деплоя */
    if (state.deploy) {
      var dp = state.deploy;
      dp.r += 1300 * dt;
      for (var j = state.bugs.length - 1; j >= 0; j--) {
        var bj = state.bugs[j];
        if (bj.dep === dp.id || dist(bj, cx, cy) > dp.r) continue;
        bj.dep = dp.id;
        hurt(j, bj.type === "orb" ? 99 : 6, ANY);
      }
      if (state.boss && state.boss.dep !== dp.id && dist(state.boss, cx, cy) < dp.r) {
        state.boss.dep = dp.id;
        damageBoss(20, ANY);
        if (!state.running) return;
      }
      if (dp.r > Math.hypot(W, H)) state.deploy = null;
    }

    /* выстрелы */
    for (var s = state.shots.length - 1; s >= 0; s--) {
      var sh = state.shots[s];
      sh.life -= dt;
      if (sh.life <= 0) { state.shots.splice(s, 1); continue; }

      if (sh.kind === "homing") {
        var alive = sh.target && (sh.target === state.boss || state.bugs.indexOf(sh.target) !== -1);
        if (!alive) sh.target = targetsFor(1, false)[0] || (bossFits(1) ? state.boss : null);
        var best = sh.target;
        if (best) {
          var ta = Math.atan2(best.y - sh.y, best.x - sh.x);
          var ca = Math.atan2(sh.vy, sh.vx);
          var tr2 = sh.turn * dt;
          var na = ca + Math.max(-tr2, Math.min(tr2, Math.atan2(Math.sin(ta - ca), Math.cos(ta - ca))));
          var sp2 = Math.hypot(sh.vx, sh.vy);
          sh.vx = Math.cos(na) * sp2;
          sh.vy = Math.sin(na) * sp2;
        }
      }

      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;
      if (sh.x < -60 || sh.x > W + 60 || sh.y < -60 || sh.y > H + 60) {
        state.shots.splice(s, 1);
        continue;
      }

      /* бонусы подбираются выстрелом, пуля летит дальше */
      for (var g = state.drops.length - 1; g >= 0; g--) {
        var dr = state.drops[g];
        if (dist(dr, sh.x, sh.y) < 18) {
          state.drops.splice(g, 1);
          collect(dr);
        }
      }

      if (hitBoss(sh)) {
        state.shots.splice(s, 1);
        if (!state.running) return;
        continue;
      }

      for (var k = state.bugs.length - 1; k >= 0; k--) {
        var bug = state.bugs[k];
        /* невидимых ИИ-багов достают только ракеты Python */
        if (!seen(bug) && sh.kind !== "homing") continue;
        if (dist(bug, sh.x, sh.y) > bug.r + 7) continue;
        /* лёгкий отброс по направлению пули — видно, что попал */
        if (fits(bug.type, sh.w)) {
          var sv = Math.hypot(sh.vx, sh.vy) || 1;
          bug.x += sh.vx / sv * 5;
          bug.y += sh.vy / sv * 5;
        }
        hurt(k, sh.dmg, sh.w);
        state.shots.splice(s, 1);
        break;
      }
    }

    for (var g2 = state.drops.length - 1; g2 >= 0; g2--) {
      var d2 = state.drops[g2];
      d2.life -= dt;
      d2.x += d2.vx * dt;
      d2.y += d2.vy * dt;
      if (d2.life <= 0) state.drops.splice(g2, 1);
    }

    fade(state.sparks, dt, true);
    fade(state.pops, dt, false);
    fade(state.lines, dt, false);
    fade(state.beams, dt, false);
    fade(state.blasts, dt, false);
    state.pops.forEach(function (p) { p.y -= dt * 34; });

    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 45);
    state.recoil = Math.max(0, state.recoil - dt * 9);
    state.muzzle = Math.max(0, state.muzzle - dt);
    state.hitMark = Math.max(0, state.hitMark - dt);

    if (state.pendingUp) { state.pendingUp = false; openUpgrade(); }
  }

  function fade(list, dt, move) {
    for (var q = list.length - 1; q >= 0; q--) {
      var it = list[q];
      it.life -= dt;
      if (move && it.vx) { it.x += it.vx * dt; it.y += it.vy * dt; }
      if (it.life <= 0) list.splice(q, 1);
    }
  }

  /* ------------------------------------------------------------- отрисовка */

  function legs(r, phase, n, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (var l = 0; l < n; l++) {
      var a = l * 6.283 / n + phase * .2;
      ctx.moveTo(Math.cos(a) * r * .7, Math.sin(a) * r * .7);
      ctx.lineTo(Math.cos(a) * (r + 7), Math.sin(a) * (r + 7));
    }
    ctx.stroke();
  }

  function poly(n, r, rot) {
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var a = rot + i * 6.283 / n;
      if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
  }

  /* у каждого отдела своя форма — различимы и без цвета */
  function drawBug(b) {
    var t = TYPES[b.type], col = colorOf(b.type), r = b.r;
    ctx.save();
    ctx.translate(b.x, b.y);
    if (!seen(b)) ctx.globalAlpha = .07;
    var fill = b.hit > 0 ? "#fff" : col;

    if (b.type === "orb") {
      /* дедлайн — пульсирующий красный шар */
      var pr = r + Math.sin(state.time * 12) * 2;
      ctx.fillStyle = "rgba(255,59,59,.25)";
      ctx.beginPath(); ctx.arc(0, 0, pr + 6, 0, 6.3); ctx.fill();
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.arc(0, 0, pr, 0, 6.3); ctx.fill();
    } else if (b.type === "db") {
      /* база — цилиндр */
      legs(r, b.phase, 4, col);
      ctx.fillStyle = fill;
      ctx.fillRect(-r * .8, -r * .6, r * 1.6, r * 1.2);
      ctx.beginPath(); ctx.ellipse(0, -r * .6, r * .8, r * .35, 0, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, r * .6, r * .8, r * .35, 0, 0, 6.3); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.4)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, -r * .6, r * .8, r * .35, 0, 0, 3.14); ctx.stroke();
    } else if (b.type === "front") {
      /* фронтенд — ромб */
      legs(r, b.phase, 6, col);
      ctx.fillStyle = fill;
      poly(4, r * 1.1, 0);
      ctx.fill();
    } else if (b.type === "mobile") {
      /* приложение — корпус телефона в броне */
      legs(r, b.phase, 6, col);
      ctx.fillStyle = fill;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-r * .7, -r, r * 1.4, r * 2, 5);
      else ctx.rect(-r * .7, -r, r * 1.4, r * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,.4)";
      ctx.fillRect(-r * .5, -r * .75, r, r * 1.35);
      ctx.strokeStyle = "rgba(255,255,255,.75)";
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, 6.3); ctx.stroke();
    } else if (b.type === "devops" || b.type === "pod") {
      /* DevOps — шестигранник-контейнер */
      if (b.type === "devops") legs(r, b.phase, 6, col);
      ctx.fillStyle = fill;
      poly(6, r, b.phase * .1);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-r * .5, 0); ctx.lineTo(r * .5, 0); ctx.stroke();
    } else {
      /* бэкенд и ИИ — классический жук */
      legs(r, b.phase, 6, col);
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.ellipse(0, 0, r * .78, r, 0, 0, 6.3); ctx.fill();
      if (b.type === "ai") {
        ctx.fillStyle = "rgba(0,0,0,.5)";
        ctx.beginPath(); ctx.arc(-r * .3, -r * .3, 2.5, 0, 6.3); ctx.arc(r * .3, -r * .3, 2.5, 0, 6.3); ctx.fill();
      }
    }

    /* заблокирован запросом SQL */
    if (locked(b)) {
      ctx.strokeStyle = WEAPONS[2].color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(0, 0, r + 9, 0, 6.3); ctx.stroke();
      ctx.setLineDash([]);
    }

    if (t.label) {
      ctx.fillStyle = col;
      ctx.globalAlpha *= .8;
      ctx.font = "10px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(t.label, 0, r + 20);
    }

    if (b.hp < b.maxHp) {
      ctx.fillStyle = "rgba(255,255,255,.2)";
      ctx.fillRect(-r, -r - 12, r * 2, 3);
      ctx.fillStyle = col;
      ctx.fillRect(-r, -r - 12, r * 2 * (b.hp / b.maxHp), 3);
    }
    ctx.restore();
  }

  function drawBoss() {
    var b = state.boss, cfg = BOSSES[b.i], col = bossColor();
    ctx.save();
    ctx.translate(b.x, b.y);

    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (var l = 0; l < 10; l++) {
      var a = l * 0.628 + state.time * (b.rage ? 1.4 : .6);
      ctx.moveTo(Math.cos(a) * b.r * .8, Math.sin(a) * b.r * .8);
      ctx.lineTo(Math.cos(a) * (b.r + 14), Math.sin(a) * (b.r + 14));
    }
    ctx.stroke();

    ctx.fillStyle = b.hit > 0 ? "#fff" : col;
    ctx.beginPath(); ctx.arc(0, 0, b.r, 0, 6.3); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.beginPath(); ctx.arc(0, 0, b.r * .55, 0, 6.3); ctx.fill();

    /* в центре — чем его сейчас бить */
    var wi = TYPES[cfg.doms[b.dom]].w;
    ctx.fillStyle = "#fff";
    ctx.font = "700 " + Math.round(b.r * .32) + "px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(WEAPONS[wi].key, 0, 0);
    ctx.textBaseline = "alphabetic";

    /* сколько осталось до смены уязвимости */
    var left = 1 - b.swapAcc / (cfg.swap / (b.rage ? 1.6 : 1));
    ctx.strokeStyle = "rgba(255,255,255,.8)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, b.r + 6, -1.571, -1.571 + left * 6.283); ctx.stroke();
    ctx.restore();
  }

  function draw(now) {
    var cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random() - .5) * state.shake, (Math.random() - .5) * state.shake);
    }

    /* сетка */
    ctx.strokeStyle = "rgba(255,255,255,.045)";
    ctx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += 56) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = 0; gy < H; gy += 56) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    /* волна деплоя */
    if (state.deploy) {
      ctx.strokeStyle = "rgba(126,231,135,.85)";
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(cx, cy, state.deploy.r, 0, 6.3); ctx.stroke();
    }

    /* ответ на SQL-запрос: линии от ядра к каждой найденной строке */
    ctx.strokeStyle = WEAPONS[2].color;
    ctx.lineWidth = 1.5;
    state.lines.forEach(function (l) {
      ctx.globalAlpha = l.life / .45;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(l.x, l.y); ctx.stroke();
    });
    ctx.globalAlpha = 1;

    /* ловушки-обработчики */
    state.traps.forEach(function (tr) {
      var armed = tr.arm <= 0;
      if (tr.life < 2 && Math.sin(tr.life * 18) < 0) return;
      ctx.strokeStyle = WEAPONS[3].color;
      ctx.fillStyle = WEAPONS[3].color;
      ctx.globalAlpha = armed ? 1 : .4;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.arc(tr.x, tr.y, 30, 0, 6.3); ctx.stroke();
      ctx.setLineDash([]);
      ctx.save();
      ctx.translate(tr.x, tr.y);
      ctx.rotate(.785);
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();
      ctx.font = "9px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText("on('bug')", tr.x, tr.y + 44);
      ctx.globalAlpha = 1;
    });

    state.blasts.forEach(function (bl) {
      var k = 1 - bl.life / .35;
      ctx.strokeStyle = WEAPONS[3].color;
      ctx.globalAlpha = 1 - k;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(bl.x, bl.y, bl.r * (.4 + k * .6), 0, 6.3); ctx.stroke();
    });
    ctx.globalAlpha = 1;

    /* ядро */
    if (state.time < state.coffeeUntil) {
      ctx.fillStyle = "rgba(217,168,108,.18)";
      ctx.beginPath(); ctx.arc(cx, cy, 48 + Math.sin(state.time * 10) * 3, 0, 6.3); ctx.fill();
    }
    ctx.fillStyle = "#12121a";
    ctx.strokeStyle = state.uptime > 40 ? "#4ad9ff" : "#ff5a5a";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 6.3); ctx.fill(); ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(now * 0.8);
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.setLineDash([9, 9]);
    ctx.beginPath(); ctx.arc(0, 0, 42, 0, 6.3); ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);

    /* щит резервной копии: по дуге на каждый оставшийся удар */
    if (state.shield > 0) {
      ctx.strokeStyle = DROPS.backup.color;
      ctx.lineWidth = 3;
      for (var sI = 0; sI < state.shield; sI++) {
        var a0 = sI * 2.094 + now * 1.2;
        ctx.beginPath(); ctx.arc(cx, cy, 52, a0, a0 + 1.7); ctx.stroke();
      }
    }

    /* реплики Docker: контейнеры на орбите вокруг ядра */
    if (state.pods.length) {
      var left = Math.max(0, state.podsUntil - state.time);
      ctx.strokeStyle = "rgba(36,150,237,.25)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, 74, 0, 6.3); ctx.stroke();
      state.pods.forEach(function (p) {
        if (left < 1.5 && Math.sin(left * 20) < 0) return;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.fillStyle = WEAPONS[5].color;
        ctx.fillRect(-7, -7, 14, 14);
        ctx.strokeStyle = "rgba(255,255,255,.7)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-7, -7, 14, 14);
        ctx.restore();
      });
    }

    /* ствол с отдачей и вспышкой */
    var ang = Math.atan2(state.aim.y - cy, state.aim.x - cx);
    var wc = WEAPONS[state.weapon].color;
    var tip = 44 - state.recoil * 7;
    ctx.strokeStyle = wc;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * 20, cy + Math.sin(ang) * 20);
    ctx.lineTo(cx + Math.cos(ang) * tip, cy + Math.sin(ang) * tip);
    ctx.stroke();
    ctx.lineCap = "butt";
    if (state.muzzle > 0) {
      var mk = state.muzzle / .08, mx = cx + Math.cos(ang) * (tip + 6), my = cy + Math.sin(ang) * (tip + 6);
      ctx.globalAlpha = mk * .5;
      ctx.fillStyle = wc;
      ctx.beginPath(); ctx.arc(mx, my, 14 * mk, 0, 6.3); ctx.fill();
      ctx.globalAlpha = mk;
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(mx, my, 5 * mk, 0, 6.3); ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* бонусы */
    state.drops.forEach(function (d) {
      var c = DROPS[d.kind];
      if (d.life < 2 && Math.sin(d.life * 20) < 0) return;
      ctx.strokeStyle = c.color;
      ctx.fillStyle = c.color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(d.x, d.y, 11 + Math.sin(state.time * 6) * 2, 0, 6.3); ctx.stroke();
      ctx.beginPath(); ctx.arc(d.x, d.y, 5, 0, 6.3); ctx.fill();
      ctx.font = "10px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(c.label, d.x, d.y + 28);
    });

    state.bugs.forEach(drawBug);

    /* выстрелы со свечением */
    state.shots.forEach(function (sh) {
      var tail = sh.kind === "homing" ? .05 : .03;
      ctx.strokeStyle = sh.color;
      ctx.globalAlpha = .28;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x - sh.vx * tail, sh.y - sh.vy * tail);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = sh.kind === "homing" ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x - sh.vx * tail * .6, sh.y - sh.vy * tail * .6);
      ctx.stroke();
      ctx.lineCap = "butt";
      if (sh.kind === "homing") {
        ctx.fillStyle = sh.color;
        ctx.beginPath(); ctx.arc(sh.x, sh.y, 3.5, 0, 6.3); ctx.fill();
      }
    });

    /* луч Flutter */
    state.beams.forEach(function (bm) {
      var k = bm.life / .25, len = Math.hypot(W, H);
      var x0 = cx + Math.cos(bm.ang) * 30, y0 = cy + Math.sin(bm.ang) * 30;
      var x1 = cx + Math.cos(bm.ang) * len, y1 = cy + Math.sin(bm.ang) * len;
      ctx.globalAlpha = k * .35;
      ctx.strokeStyle = WEAPONS[4].color;
      ctx.lineWidth = 18 * k;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.globalAlpha = k;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3 * k;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    });
    ctx.globalAlpha = 1;

    /* искры */
    state.sparks.forEach(function (s) {
      ctx.globalAlpha = Math.max(0, s.life * 2.2);
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    /* ночное дежурство: светло только у ядра и у прицела */
    if (state.mod === "night") {
      fctx.globalCompositeOperation = "source-over";
      fctx.clearRect(0, 0, W, H);
      fctx.fillStyle = "rgba(4,4,8,.95)";
      fctx.fillRect(0, 0, W, H);
      fctx.globalCompositeOperation = "destination-out";
      [[cx, cy, 170], [state.aim.x, state.aim.y, 115]].forEach(function (l) {
        var gr = fctx.createRadialGradient(l[0], l[1], l[2] * .35, l[0], l[1], l[2]);
        gr.addColorStop(0, "rgba(0,0,0,1)");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        fctx.fillStyle = gr;
        fctx.beginPath(); fctx.arc(l[0], l[1], l[2], 0, 6.3); fctx.fill();
      });
      ctx.drawImage(fog, 0, 0, W, H);
    }

    /* босс и прицел поверх тумана: их должно быть видно всегда */
    if (state.boss) drawBoss();

    /* прицел в цвете оружия; кольцо вокруг — сколько осталось до выстрела.
       Если под прицелом баг чужого отдела — крестик его цвета и подсказка */
    var ax = state.aim.x, ay = state.aim.y;
    var ready = Math.min(1, (now - state.lastShot[state.weapon]) / rateOf(state.weapon));
    var under = bugUnderAim();
    var wrong = under && !fits(under.type, state.weapon);
    ctx.strokeStyle = wrong ? colorOf(under.type) : "rgba(255,255,255,.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ax, ay, 11, 0, 6.3); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax - 17, ay); ctx.lineTo(ax - 6, ay);
    ctx.moveTo(ax + 6, ay); ctx.lineTo(ax + 17, ay);
    ctx.moveTo(ax, ay - 17); ctx.lineTo(ax, ay - 6);
    ctx.moveTo(ax, ay + 6); ctx.lineTo(ax, ay + 17);
    ctx.stroke();
    if (wrong) {
      var need = TYPES[under.type].w;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ax - 5, ay - 5); ctx.lineTo(ax + 5, ay + 5);
      ctx.moveTo(ax + 5, ay - 5); ctx.lineTo(ax - 5, ay + 5);
      ctx.stroke();
      ctx.fillStyle = colorOf(under.type);
      ctx.font = "600 11px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText((touch ? "" : "[" + (need + 1) + "] ") + WEAPONS[need].key, ax, ay - 30);
    } else if (ready < 1) {
      ctx.strokeStyle = wc;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(ax, ay, 21, -1.571, -1.571 + ready * 6.283); ctx.stroke();
    } else {
      ctx.fillStyle = wc;
      ctx.beginPath(); ctx.arc(ax, ay, 2.5, 0, 6.3); ctx.fill();
    }
    if (state.hitMark > 0) {
      var hk = state.hitMark / .16, h1 = 8, h2 = 14 + (1 - hk) * 4;
      ctx.globalAlpha = hk;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) {
        ctx.moveTo(ax + d[0] * h1, ay + d[1] * h1);
        ctx.lineTo(ax + d[0] * h2, ay + d[1] * h2);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /* всплывающие очки */
    ctx.textAlign = "center";
    ctx.font = "600 12px ui-monospace, Menlo, monospace";
    state.pops.forEach(function (p) {
      ctx.globalAlpha = Math.min(1, p.life * 1.6);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    });
    ctx.globalAlpha = 1;

    /* множитель серии над ядром */
    var mult = comboMult();
    if (mult > 1) {
      ctx.fillStyle = "#ffb03a";
      ctx.font = "700 " + (18 + mult * 2) + "px ui-monospace, Menlo, monospace";
      ctx.fillText("×" + mult, cx, cy - 64);
      ctx.font = "10px ui-monospace, Menlo, monospace";
      ctx.fillStyle = "rgba(255,176,58,.7)";
      ctx.fillText(state.chain + " " + T.combo, cx, cy - 50);
    }

    ctx.restore();
  }

  /* ----------------------------------------------------------------- HUD */

  function updateHud() {
    els.barValue.textContent = Math.round(state.uptime) + "%";
    els.barFill.style.width = state.uptime + "%";
    els.barFill.style.background = state.uptime > 40 ? "#4ad9ff" : "#ff5a5a";
    els.wave.textContent = T.wave + " " + (state.wave + 1) + "/" + WAVES;
    els.killed.textContent = T.killed + " " + state.kills;
    els.score.textContent = T.score + " " + state.score;

    var ready = state.charge >= 100;
    els.ult.style.setProperty("--p", (state.charge / 100).toFixed(3));
    els.ult.classList.toggle("is-ready", ready);
    els.ult.disabled = !ready;

    var m = state.mod && T.mods[state.mod];
    els.mod.hidden = !m || !!state.boss;
    if (m) els.mod.textContent = m.name;

    if (state.boss) {
      var wi = TYPES[BOSSES[state.boss.i].doms[state.boss.dom]].w;
      els.bossFill.style.width = Math.max(0, state.boss.hp / state.boss.maxHp * 100) + "%";
      els.bossFill.style.background = WEAPONS[wi].color;
      els.bossHint.textContent = T.boss_weak + " " + WEAPONS[wi].key + " (" + wText(wi).role + ") · " + T.boss_swap;
      els.bossHint.style.color = WEAPONS[wi].color;
    }
  }

  function flash(title, sub) {
    els.flashTitle.textContent = title;
    els.flashSub.textContent = sub || "";
    els.flash.hidden = false;
    els.flash.classList.remove("is-on");
    void els.flash.offsetWidth;
    els.flash.classList.add("is-on");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { els.flash.hidden = true; }, 2300);
  }

  /* на заставке волны — какие отделы в ней появились впервые */
  function flashWave() {
    var m = state.mod && T.mods[state.mod];
    var parts = [];
    if (state.wave > 0) parts.push(T.wave_clear);
    var prev = state.wave ? POOLS[state.wave - 1] : [];
    var fresh = POOLS[state.wave].filter(function (t, i, a) { return prev.indexOf(t) === -1 && a.indexOf(t) === i; });
    if (fresh.length) {
      parts.push(T.new_bugs + " " + fresh.map(function (t) {
        return TYPES[t].label + " → " + WEAPONS[TYPES[t].w].key;
      }).join(", "));
    }
    if (m) parts.push(m.name + " — " + m.desc);
    flash(T.wave_start + " " + (state.wave + 1), parts.join(" · "));
  }

  function openUpgrade() {
    var avail = [];
    for (var i = 0; i < WEAPONS.length; i++) if (state.levels[i] < MAX_LVL) avail.push(i);
    if (!avail.length) return;

    var list = [];
    while (list.length < Math.min(3, avail.length)) {
      var c = avail[(Math.random() * avail.length) | 0];
      if (list.indexOf(c) === -1) list.push(c);
    }

    state.running = false;
    state.firing = false;
    els.upTitle.textContent = T.upgrade_title;
    els.upHint.textContent = T.upgrade_hint;
    els.upCards.innerHTML = list.map(function (i, n) {
      var t = wText(i);
      return '<button type="button" class="dbg__up-card" data-w="' + i + '" style="--wc:' + WEAPONS[i].color + '">' +
        '<span class="dbg__up-key">' + (n + 1) + "</span>" +
        '<span class="dbg__up-name">' + t.key + "</span>" +
        '<span class="dbg__up-lvl">' + t.role + " · " + T.level + " " + (state.levels[i] + 1) + " → " + (state.levels[i] + 2) + "</span>" +
        '<span class="dbg__up-desc">' + (t.up || "") + "</span></button>";
    }).join("");

    els.upCards.querySelectorAll(".dbg__up-card").forEach(function (card) {
      card.addEventListener("click", function () { applyUpgrade(parseInt(card.dataset.w, 10)); });
    });
    els.up.hidden = false;
  }

  function applyUpgrade(i) {
    state.levels[i] = Math.min(MAX_LVL, state.levels[i] + 1);
    els.up.hidden = true;
    state.running = true;
    state.last = performance.now() / 1000;
    state.lastShot[i] = -99;
    renderLevels();
  }

  function renderLevels() {
    els.wEls.forEach(function (el, i) {
      var badge = el.querySelector(".dbg__w-lvl");
      var lv = state.levels[i];
      badge.textContent = lv >= MAX_LVL ? T.maxed : T.level + " " + (lv + 1);
      badge.classList.toggle("is-max", lv >= MAX_LVL);
    });
  }

  function cooldownTick(now) {
    var hinted = state.time < state.hintUntil ? state.hintW : -1;
    els.wEls.forEach(function (el, i) {
      var ready = Math.min(1, (now - state.lastShot[i]) / rateOf(i));
      el.querySelector(".dbg__w-cd").style.transform = "scaleX(" + ready.toFixed(3) + ")";
      el.classList.toggle("is-hint", i === hinted && i !== state.weapon);
    });
  }

  /* --------------------------------------------------------------- цикл */

  function loop(ms) {
    var now = ms / 1000;
    var dt = Math.min(0.05, now - state.last);
    state.last = now;
    if (state.running) {
      update(dt, now);
      cooldownTick(now);
    }
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  function finish(won) {
    state.running = false;
    state.firing = false;
    var bestKey = "dbgBestScore";
    var best = 0;
    try { best = parseInt(localStorage.getItem(bestKey) || "0", 10); } catch (e) {}
    if (state.score > best) {
      best = state.score;
      try { localStorage.setItem(bestKey, String(best)); } catch (e) {}
    }
    els.boss.hidden = true;
    els.overTitle.textContent = won ? T.win : T.lose;
    els.overTitle.className = "dbg__over-title " + (won ? "is-win" : "is-lose");
    els.overStats.innerHTML =
      "<div><b>" + state.score + "</b><span>" + T.result_score + "</span></div>" +
      "<div><b>" + state.kills + "</b><span>" + T.result_kills + "</span></div>" +
      "<div><b>" + (won ? Math.round(state.uptime) + "%" : (state.wave + 1) + "/" + WAVES) + "</b><span>" +
        (won ? T.result_uptime : T.wave) + "</span></div>";
    els.overBest.textContent = T.best + ": " + best;
    els.over.hidden = false;
  }

  /* brief — показать брифинг: при входе в игру да, при «Ещё раз» нет */
  function reset(brief) {
    state = {
      bugs: [], shots: [], sparks: [], drops: [], pops: [],
      traps: [], blasts: [], beams: [], lines: [], pods: [], podsUntil: 0,
      aim: { x: window.innerWidth / 2, y: window.innerHeight / 3 },
      weapon: 0, lastShot: WEAPONS.map(function () { return -99; }),
      levels: WEAPONS.map(function () { return 0; }),
      pendingUp: false, nextUp: 10, upCount: 0,
      uptime: 100, kills: 0, score: 0, chain: 0, lastKill: -99, charge: 0,
      wave: 0, waveTime: 0, time: 0, phase: "wave", mod: null, usedMods: [],
      boss: null, bossSeen: {}, spawnAcc: 0,
      coffeeUntil: 0, shield: 0, deploy: null, hintW: -1, hintUntil: 0,
      shake: 0, recoil: 0, muzzle: 0, hitMark: 0, firing: false,
      running: false, last: performance.now() / 1000
    };
    els.over.hidden = true;
    els.up.hidden = true;
    els.boss.hidden = true;
    els.flash.hidden = true;
    pick(0);
    renderLevels();
    updateHud();
    if (brief) els.brief.hidden = false;
    else begin();
  }

  function begin() {
    els.brief.hidden = true;
    state.running = true;
    state.last = performance.now() / 1000;
    if (state.paused) {
      state.paused = false;
      els.briefGo.textContent = T.brief_start;
      return;
    }
    flashWave();
  }

  /* кнопка «i»: пауза и тот же брифинг — описания оружия не занимают
     место на кнопках */
  function openInfo() {
    if (!state || !state.running) return;
    state.running = false;
    state.firing = false;
    state.paused = true;
    els.briefGo.textContent = T.resume;
    els.brief.hidden = false;
  }

  /* ------------------------------------------------------------ публичное */

  function start(texts) {
    T = texts;
    if (!built) build();
    els.barLabel.textContent = T.uptime;
    els.controls.textContent = touch && T.controls_touch ? T.controls_touch : T.controls;
    els.quit.setAttribute("aria-label", T.close);
    els.info.setAttribute("aria-label", T.info);
    els.info.title = T.info;
    els.ultName.textContent = T.deploy;
    els.again.textContent = T.again;
    els.close.textContent = T.close;
    renderWeapons();
    renderBrief();

    document.documentElement.classList.add("is-negative");
    document.body.classList.add("is-gaming");
    root.hidden = false;
    fit();
    reset(true);
    requestAnimationFrame(function () { root.classList.add("is-on"); });
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (state) { state.running = false; state.firing = false; }
    if (els.up) els.up.hidden = true;
    if (root) root.classList.remove("is-on");

    /* сначала гаснет игровой слой, следом сайт плавно возвращает цвет */
    setTimeout(function () {
      document.documentElement.classList.remove("is-negative");
      document.body.classList.remove("is-gaming");
    }, 260);

    setTimeout(function () {
      cancelAnimationFrame(raf);
      raf = null;
      if (root) root.hidden = true;
    }, 460);
  }

  return { start: start, stop: stop };
})();
