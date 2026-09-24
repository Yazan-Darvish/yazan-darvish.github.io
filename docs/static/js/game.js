/* Debug mode — мини-игра: отбиваемся от багов языками программирования.
   Запуск: DebugGame.start(тексты). Выход: Esc или кнопка. */

window.DebugGame = (function () {
  "use strict";

  var WEAPONS = [
    { key: "PHP",     color: "#8a7dff", rate: 0.16, dmg: 1, speed: 760,  kind: "shot" },
    { key: "Python",  color: "#ffd24a", rate: 2.0,  dmg: 3, speed: 520,  kind: "homing" },
    { key: "SQL",     color: "#ff7ad4", rate: 8.0,  dmg: 0, speed: 0,    kind: "freeze" },
    { key: "JS",      color: "#b6ff4a", rate: 0.5,  dmg: 1, speed: 700,  kind: "spread" },
    { key: "Flutter", color: "#54c5f8", rate: 3.0,  dmg: 3, speed: 1100, kind: "pierce" }
  ];

  var TYPES = {
    "null":   { hp: 1, speed: 78,  r: 11, color: "#ff5a5a", label: "null" },
    leak:     { hp: 5, speed: 34,  r: 17, color: "#ff9f1c", label: "leak" },
    race:     { hp: 2, speed: 92,  r: 13, color: "#4ad9ff", label: "race" },
    legacy:   { hp: 8, speed: 28,  r: 20, color: "#9b8f7a", label: "legacy", armored: true }
  };

  var WAVE_LEN = 30;
  var MAX_LVL = 5;
  var KILLS_PER_UPGRADE = 10;

  /* характеристики оружия с учётом прокачки */
  function stat(i) {
    var w = WEAPONS[i], lv = state.levels[i];
    return {
      key: w.key, color: w.color, kind: w.kind, speed: w.speed,
      rate: w.rate * Math.pow(0.86, lv),
      dmg: w.dmg + (w.kind === "shot" || w.kind === "spread" ? Math.floor(lv / 2) : lv),
      freeze: 2 + lv * 0.4,
      pellets: 5 + lv,
      turn: 3 + lv * 0.8
    };
  }
  var root, canvas, ctx, hud, els = {}, T = null;
  var W = 0, H = 0, dpr = 1;
  var state = null, raf = null, built = false;

  /* ------------------------------------------------------------ разметка */

  function build() {
    root = document.createElement("div");
    root.className = "dbg";
    root.innerHTML =
      '<canvas class="dbg__canvas"></canvas>' +
      '<div class="dbg__hud">' +
        '<div class="dbg__bar"><span class="dbg__bar-label"></span>' +
          '<div class="dbg__bar-track"><i></i></div><b></b></div>' +
        '<div class="dbg__meta"><span data-wave></span><span data-killed></span></div>' +
      "</div>" +
      '<div class="dbg__weapons"></div>' +
      '<p class="dbg__controls"></p>' +
      '<div class="dbg__wave-flash" hidden></div>' +
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
    hud = root.querySelector(".dbg__hud");
    els.barLabel = root.querySelector(".dbg__bar-label");
    els.barFill = root.querySelector(".dbg__bar-track i");
    els.barValue = root.querySelector(".dbg__bar b");
    els.wave = root.querySelector("[data-wave]");
    els.killed = root.querySelector("[data-killed]");
    els.weapons = root.querySelector(".dbg__weapons");
    els.controls = root.querySelector(".dbg__controls");
    els.flash = root.querySelector(".dbg__wave-flash");
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

    els.again.addEventListener("click", function () { reset(); });
    els.close.addEventListener("click", function () { stop(); });

    canvas.addEventListener("mousemove", function (e) {
      state.aim.x = e.clientX;
      state.aim.y = e.clientY;
    });
    canvas.addEventListener("mousedown", function () { state.firing = true; });
    window.addEventListener("mouseup", function () { if (state) state.firing = false; });
    canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      pick(state.weapon + (e.deltaY > 0 ? 1 : -1));
    }, { passive: false });

    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", fit);
    built = true;
  }

  function onKey(e) {
    if (!state) return;
    if (e.key === "Escape") { stop(); return; }

    var upOpen = els.up && !els.up.hidden;
    if (!state.running && !upOpen) return;

    var n = parseInt(e.key, 10);
    if (!els.up.hidden) {
      var card = els.upCards.querySelectorAll(".dbg__up-card")[n - 1];
      if (card) card.click();
      return;
    }
    if (n >= 1 && n <= WEAPONS.length) pick(n - 1);
  }

  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function renderWeapons() {
    els.weapons.innerHTML = WEAPONS.map(function (w, i) {
      var t = T.weapons[i] || { key: w.key, desc: "" };
      return '<button type="button" class="dbg__w" data-i="' + i + '" style="--wc:' + w.color + '">' +
        '<span class="dbg__w-key">' + (i + 1) + "</span>" +
        '<span class="dbg__w-name">' + t.key + "</span>" +
        '<span class="dbg__w-desc">' + t.desc + "</span>" +
        '<span class="dbg__w-lvl"></span>' +
        '<i class="dbg__w-cd"></i></button>';
    }).join("");
    els.weapons.querySelectorAll(".dbg__w").forEach(function (b) {
      b.addEventListener("click", function () { pick(parseInt(b.dataset.i, 10)); });
    });
    els.wEls = els.weapons.querySelectorAll(".dbg__w");
  }

  function pick(i) {
    if (i < 0) i = WEAPONS.length - 1;
    if (i >= WEAPONS.length) i = 0;
    state.weapon = i;
    els.wEls.forEach(function (el, n) { el.classList.toggle("is-on", n === i); });
  }

  /* -------------------------------------------------------------- логика */

  function spawn() {
    var wave = state.wave;
    var pool = ["null", "null", "leak"];
    if (wave >= 1) pool.push("race", "race", "null");
    if (wave >= 2) pool.push("legacy", "leak", "race");
    var type = pool[(Math.random() * pool.length) | 0];
    var t = TYPES[type];

    var edge = (Math.random() * 4) | 0, x, y;
    if (edge === 0) { x = Math.random() * W; y = -40; }
    else if (edge === 1) { x = W + 40; y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = H + 40; }
    else { x = -40; y = Math.random() * H; }

    state.bugs.push({
      type: type, x: x, y: y, hp: t.hp, maxHp: t.hp, r: t.r,
      phase: Math.random() * 6.28, hit: 0
    });
  }

  function fire(now) {
    var w = stat(state.weapon);
    if (now - state.lastShot[state.weapon] < w.rate) return;
    state.lastShot[state.weapon] = now;

    var cx = W / 2, cy = H / 2;
    var ang = Math.atan2(state.aim.y - cy, state.aim.x - cx);

    if (w.kind === "freeze") {
      state.freezeUntil = now + w.freeze;
      state.pulse = 1;
      return;
    }
    if (w.kind === "spread") {
      var half = (w.pellets - 1) / 2;
      for (var i = -half; i <= half; i++) add(ang + i * 0.13);
      return;
    }
    add(ang);

    function add(a) {
      state.shots.push({
        x: cx + Math.cos(a) * 34, y: cy + Math.sin(a) * 34,
        vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed,
        dmg: w.dmg, color: w.color, kind: w.kind, life: 2.2,
        turn: w.turn, hits: []
      });
    }
  }

  function update(dt, now) {
    var cx = W / 2, cy = H / 2;
    var frozen = now < state.freezeUntil;

    state.time += dt;
    var waveNow = Math.min(2, Math.floor(state.time / WAVE_LEN));
    if (waveNow !== state.wave) {
      state.wave = waveNow;
      flashWave();
    }
    if (state.time >= WAVE_LEN * 3) return finish(true);

    if (state.firing) fire(now);

    state.spawnAcc += dt;
    var every = Math.max(0.32, 1.25 - state.wave * 0.28 - state.time * 0.008);
    if (state.spawnAcc >= every) { state.spawnAcc = 0; spawn(); }

    /* баги */
    for (var i = state.bugs.length - 1; i >= 0; i--) {
      var b = state.bugs[i];
      var t = TYPES[b.type];
      if (b.hit > 0) b.hit -= dt * 5;

      if (!frozen) {
        var dx = cx - b.x, dy = cy - b.y;
        var d = Math.hypot(dx, dy) || 1;
        var sp = t.speed * (1 + state.wave * 0.12);
        var nx = dx / d, ny = dy / d;
        if (b.type === "race") {
          b.phase += dt * 6;
          var px = -ny, py = nx;
          b.x += (nx * sp + px * Math.sin(b.phase) * 90) * dt;
          b.y += (ny * sp + py * Math.sin(b.phase) * 90) * dt;
        } else {
          b.x += nx * sp * dt;
          b.y += ny * sp * dt;
        }
        if (b.type === "leak") b.r = Math.min(26, b.r + dt * 0.7);
      }

      if (Math.hypot(cx - b.x, cy - b.y) < 32 + b.r) {
        state.bugs.splice(i, 1);
        state.uptime = Math.max(0, state.uptime - 7);
        state.shake = 14;
        updateHud();
        if (state.uptime <= 0) return finish(false);
      }
    }

    /* выстрелы */
    for (var s = state.shots.length - 1; s >= 0; s--) {
      var sh = state.shots[s];
      sh.life -= dt;
      if (sh.life <= 0) { state.shots.splice(s, 1); continue; }

      if (sh.kind === "homing") {
        var best = null, bd = 1e9;
        state.bugs.forEach(function (b) {
          var dd = Math.hypot(b.x - sh.x, b.y - sh.y);
          if (dd < bd) { bd = dd; best = b; }
        });
        if (best) {
          var ta = Math.atan2(best.y - sh.y, best.x - sh.x);
          var ca = Math.atan2(sh.vy, sh.vx);
          var tr = (sh.turn || 3) * dt;
          var na = ca + Math.max(-tr, Math.min(tr, Math.atan2(Math.sin(ta - ca), Math.cos(ta - ca))));
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

      for (var k = state.bugs.length - 1; k >= 0; k--) {
        var bug = state.bugs[k];
        if (sh.hits.indexOf(bug) !== -1) continue;
        if (Math.hypot(bug.x - sh.x, bug.y - sh.y) > bug.r + 5) continue;

        var armored = TYPES[bug.type].armored;
        var dmg = armored && sh.kind !== "pierce" ? 0 : sh.dmg;
        bug.hp -= dmg;
        bug.hit = 1;
        if (dmg === 0) state.sparks.push({ x: bug.x, y: bug.y, life: .3, color: "#fff" });

        if (bug.hp <= 0) {
          state.bugs.splice(k, 1);
          state.kills++;
          if (state.kills % KILLS_PER_UPGRADE === 0) state.pendingUp = true;
          for (var p = 0; p < 7; p++) {
            state.sparks.push({
              x: bug.x, y: bug.y, life: .45,
              vx: (Math.random() - .5) * 260, vy: (Math.random() - .5) * 260,
              color: TYPES[bug.type].color
            });
          }
          updateHud();
        }

        if (sh.kind === "pierce") sh.hits.push(bug);
        else { state.shots.splice(s, 1); break; }
      }
    }

    for (var q = state.sparks.length - 1; q >= 0; q--) {
      var sp3 = state.sparks[q];
      sp3.life -= dt;
      if (sp3.vx) { sp3.x += sp3.vx * dt; sp3.y += sp3.vy * dt; }
      if (sp3.life <= 0) state.sparks.splice(q, 1);
    }

    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 45);
    if (state.pulse > 0) state.pulse = Math.max(0, state.pulse - dt * 1.4);

    if (state.pendingUp) { state.pendingUp = false; openUpgrade(); }
  }

  /* ------------------------------------------------------------- отрисовка */

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

    /* волна заморозки */
    if (state.pulse > 0) {
      ctx.strokeStyle = "rgba(255,122,212," + state.pulse.toFixed(2) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, (1 - state.pulse) * Math.max(W, H), 0, 6.3);
      ctx.stroke();
    }

    /* ядро */
    var frozen = now < state.freezeUntil;
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

    /* ствол */
    var ang = Math.atan2(state.aim.y - cy, state.aim.x - cx);
    ctx.strokeStyle = WEAPONS[state.weapon].color;
    ctx.lineWidth = 5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * 20, cy + Math.sin(ang) * 20);
    ctx.lineTo(cx + Math.cos(ang) * 44, cy + Math.sin(ang) * 44);
    ctx.stroke();

    /* прицел */
    ctx.strokeStyle = "rgba(255,255,255,.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(state.aim.x, state.aim.y, 11, 0, 6.3); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(state.aim.x - 17, state.aim.y); ctx.lineTo(state.aim.x - 5, state.aim.y);
    ctx.moveTo(state.aim.x + 5, state.aim.y); ctx.lineTo(state.aim.x + 17, state.aim.y);
    ctx.stroke();

    /* баги */
    state.bugs.forEach(function (b) {
      var t = TYPES[b.type];
      ctx.save();
      ctx.translate(b.x, b.y);
      if (frozen) ctx.globalAlpha = .55;

      ctx.strokeStyle = t.color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (var l = 0; l < 6; l++) {
        var a = l * 1.047 + b.phase * .2;
        ctx.moveTo(Math.cos(a) * b.r * .7, Math.sin(a) * b.r * .7);
        ctx.lineTo(Math.cos(a) * (b.r + 7), Math.sin(a) * (b.r + 7));
      }
      ctx.stroke();

      ctx.fillStyle = b.hit > 0 ? "#fff" : t.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, b.r * .78, b.r, 0, 0, 6.3);
      ctx.fill();

      if (t.armored) {
        ctx.strokeStyle = "rgba(255,255,255,.75)";
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, b.r + 3, 0, 6.3); ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,255,255,.65)";
      ctx.font = "10px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(t.label, 0, b.r + 20);

      if (b.hp < b.maxHp) {
        ctx.fillStyle = "rgba(255,255,255,.2)";
        ctx.fillRect(-b.r, -b.r - 12, b.r * 2, 3);
        ctx.fillStyle = t.color;
        ctx.fillRect(-b.r, -b.r - 12, b.r * 2 * (b.hp / b.maxHp), 3);
      }
      ctx.restore();
    });

    /* выстрелы */
    state.shots.forEach(function (sh) {
      ctx.strokeStyle = sh.color;
      ctx.lineWidth = sh.kind === "pierce" ? 4 : 2.5;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x - sh.vx * .02, sh.y - sh.vy * .02);
      ctx.stroke();
    });

    /* искры */
    state.sparks.forEach(function (s) {
      ctx.globalAlpha = Math.max(0, s.life * 2.2);
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
      ctx.globalAlpha = 1;
    });

    ctx.restore();
  }

  /* ----------------------------------------------------------------- HUD */

  function updateHud() {
    els.barValue.textContent = Math.round(state.uptime) + "%";
    els.barFill.style.width = state.uptime + "%";
    els.barFill.style.background = state.uptime > 40 ? "#4ad9ff" : "#ff5a5a";
    els.wave.textContent = T.wave + " " + (state.wave + 1) + "/3";
    els.killed.textContent = T.killed + " " + state.kills;
  }

  function flashWave() {
    els.flash.textContent = T.wave_start + " " + (state.wave + 1);
    els.flash.hidden = false;
    els.flash.classList.remove("is-on");
    void els.flash.offsetWidth;
    els.flash.classList.add("is-on");
    setTimeout(function () { els.flash.hidden = true; }, 1400);
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
      var t = T.weapons[i] || { key: WEAPONS[i].key, up: "" };
      return '<button type="button" class="dbg__up-card" data-w="' + i + '" style="--wc:' + WEAPONS[i].color + '">' +
        '<span class="dbg__up-key">' + (n + 1) + "</span>" +
        '<span class="dbg__up-name">' + t.key + "</span>" +
        '<span class="dbg__up-lvl">' + T.level + " " + (state.levels[i] + 1) + " → " + (state.levels[i] + 2) + "</span>" +
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
    pick(i);
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
    els.wEls.forEach(function (el, i) {
      var w = WEAPONS[i];
      var ready = Math.min(1, (now - state.lastShot[i]) / stat(i).rate);
      el.querySelector(".dbg__w-cd").style.transform = "scaleX(" + ready.toFixed(3) + ")";
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
    var bestKey = "dbgBest";
    var best = parseInt(localStorage.getItem(bestKey) || "0", 10);
    if (state.kills > best) {
      best = state.kills;
      try { localStorage.setItem(bestKey, String(best)); } catch (e) {}
    }
    els.overTitle.textContent = won ? T.win : T.lose;
    els.overTitle.className = "dbg__over-title " + (won ? "is-win" : "is-lose");
    els.overStats.innerHTML =
      "<div><b>" + Math.round(state.uptime) + "%</b><span>" + T.result_uptime + "</span></div>" +
      "<div><b>" + state.kills + "</b><span>" + T.result_kills + "</span></div>";
    els.overBest.textContent = T.best + ": " + best;
    els.over.hidden = false;
  }

  function reset() {
    state = {
      bugs: [], shots: [], sparks: [],
      aim: { x: window.innerWidth / 2, y: window.innerHeight / 3 },
      weapon: 0, lastShot: WEAPONS.map(function () { return -99; }),
      levels: WEAPONS.map(function () { return 0; }), pendingUp: false,
      uptime: 100, kills: 0, wave: 0, time: 0, spawnAcc: 0,
      freezeUntil: 0, shake: 0, pulse: 0, firing: false,
      running: true, last: performance.now() / 1000
    };
    els.over.hidden = true;
    els.up.hidden = true;
    pick(0);
    renderLevels();
    updateHud();
    flashWave();
  }

  /* ------------------------------------------------------------ публичное */

  function start(texts) {
    T = texts;
    if (!built) build();
    els.barLabel.textContent = T.uptime;
    els.controls.textContent = T.controls;
    els.again.textContent = T.again;
    els.close.textContent = T.close;
    renderWeapons();

    document.documentElement.classList.add("is-negative");
    document.body.classList.add("is-gaming");
    root.hidden = false;
    fit();
    reset();
    requestAnimationFrame(function () { root.classList.add("is-on"); });
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (state) state.running = false;
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
