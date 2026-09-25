/* Мини-игры по скиллам — ядро.

   Здесь живёт только оболочка: окно, реестр игр и общие помощники.
   Сами игры лежат по доменам в файлах skills/<домен>.js и регистрируются
   через SkillGames.add(). Ядро подключается первым, домены — после него.

   Правило жанра: внутри игры не должно быть ни одного термина. Сюжет
   бытовой, название технологии появляется только в финальной плашке. */

(function () {
  "use strict";


  /* ------------------------------------------------ подписи оболочки ------ */

  var UI = {
    en: { eyebrow: "Mini-game", close: "Close", again: "Play again",
          play: "Click to play", clicks: "Clicks", taken: "Picked",
          weight: "Weight", go: "Go" },
    ru: { eyebrow: "Мини-игра", close: "Закрыть", again: "Ещё раз",
          play: "Нажмите, чтобы поиграть", clicks: "Нажатий", taken: "Взято",
          weight: "Вес", go: "Идти" },
    ro: { eyebrow: "Mini-joc", close: "Închide", again: "Din nou",
          play: "Apasă pentru a juca", clicks: "Apăsări", taken: "Luate",
          weight: "Greutate", go: "Mergi" },
  };

  var lang = document.documentElement.lang || "en";
  if (!UI[lang]) lang = "en";

  var GAMES = {};
  var TEXTS = { en: {}, ru: {}, ro: {} };

  /* Регистрация игры: механика и тексты трёх языков в одном месте. */
  function add(id, fn, texts) {
    GAMES[id] = fn;
    Object.keys(texts).forEach(function (l) { TEXTS[l][id] = texts[l]; });
  }

  function t(id, key) {
    var g = TEXTS[lang][id] || TEXTS.en[id] || {};
    return g[key] || "";
  }

  function ui(key) { return UI[lang][key]; }

  /* -------------------------------------------------------------- окно ---- */

  var box, elTitle, elTask, elArea, elDone, elDoneText, current;

  function build() {
    box = document.createElement("div");
    box.className = "sg";
    box.hidden = true;
    box.innerHTML =
      '<div class="sg__back" data-close></div>' +
      '<div class="sg__win" role="dialog" aria-modal="true">' +
        '<button class="sg__x" data-close aria-label="' + ui("close") + '">✕</button>' +
        '<p class="sg__eyebrow">' + ui("eyebrow") + "</p>" +
        '<h2 class="sg__title"></h2>' +
        '<p class="sg__task"></p>' +
        '<div class="sg__area"></div>' +
        '<div class="sg__done" hidden>' +
          '<p class="sg__done-text"></p>' +
          '<div class="sg__btns">' +
            '<button class="chip" data-again></button>' +
            '<button class="chip" data-close></button>' +
          "</div>" +
        "</div>" +
      "</div>";
    document.body.appendChild(box);

    elTitle = box.querySelector(".sg__title");
    elTask = box.querySelector(".sg__task");
    elArea = box.querySelector(".sg__area");
    elDone = box.querySelector(".sg__done");
    elDoneText = box.querySelector(".sg__done-text");

    box.querySelector("[data-again]").textContent = ui("again");
    box.querySelector(".sg__btns [data-close]").textContent = ui("close");

    box.addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-again")) return open(current);
      if (e.target.hasAttribute("data-close")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box && !box.hidden) close();
    });
  }

  /* Отложенные шаги игр. Гасим при закрытии и перезапуске, иначе закрытая
     игра продолжает тикать в фоне и дорисовывает себя в чужое окно. */
  var timers = [];
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function stopTimers() { timers.forEach(clearTimeout); timers = []; }

  /* Счётчик — через помощник из main.js: какие игры открывают и какие
     доигрывают. main.js подключён раньше, но блокировщик может его не
     пустить, поэтому проверяем. */
  function track(name) { if (window.siteTrack) window.siteTrack(name, { game: current }); }

  function open(id) {
    if (!GAMES[id]) return;
    stopTimers();
    current = id;
    track("game-open");
    elTitle.textContent = t(id, "title");
    elTask.textContent = t(id, "task");
    elArea.innerHTML = "";
    elDone.hidden = true;
    box.hidden = false;
    document.body.style.overflow = "hidden";
    GAMES[id](elArea, { finish: finish });
  }

  function finish() {
    track("game-finish");
    elDoneText.textContent = t(current, "done");
    elDone.hidden = false;
  }

  function close() {
    stopTimers();
    box.hidden = true;
    elArea.innerHTML = "";
    document.body.style.overflow = "";
  }

  /* ------------------------------------------------------------ помощники - */

  function row(html) { return '<div class="sg__row">' + html + "</div>"; }
  function lead(text) { return '<p class="sg__lead">' + text + "</p>"; }
  function count(text) { return '<p class="sg__count">' + text + "</p>"; }
  function on(area, sel, fn) {
    area.querySelectorAll(sel).forEach(function (b) { b.addEventListener("click", function () { fn(b); }); });
  }


  /* Домены берут отсюда add() и помощники. Больше наружу ничего не торчит. */
  window.SkillGames = {
    add: add, t: t, ui: ui,
    row: row, lead: lead, count: count, on: on, later: later,
  };

  /* ------------------------------------------------------------- запуск --- */

  function init() {
    var pills = document.querySelectorAll("[data-game]");
    if (!pills.length) return;
    build();
    pills.forEach(function (el) {
      if (!GAMES[el.dataset.game]) return;
      el.classList.add("has-game");
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.title = ui("play");
      el.addEventListener("click", function () { open(el.dataset.game); });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(el.dataset.game); }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
