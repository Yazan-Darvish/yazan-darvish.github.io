/* Интерфейс сайта: тема, меню, появление блоков, превью работ, фильтр,
   форма с голосовым вводом и запуск игры. Контент рендерит Django. */

(function () {
  "use strict";

  var root = document.documentElement;
  var page = document.body.dataset.page;

  function $(sel) { return document.querySelector(sel); }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function json(id) {
    var el = document.getElementById(id);
    try { return el ? JSON.parse(el.textContent) : {}; } catch (e) { return {}; }
  }

  var F = json("ui-form");
  var G = json("ui-game");

  /* ---------------------------------------------------------------- тема */

  root.setAttribute("data-theme", read("theme") === "light" ? "light" : "dark");

  var themeBtn = $("[data-theme-toggle]");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      store("theme", next);
    });
  }

  /* -------------------------------------------------------- меню на телефоне */

  var burger = $("[data-burger]"), nav = $("[data-nav]");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  /* ------------------------------------------------- появление при скролле */

  var revealables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ------------------------------------------------ превью проекта у курсора */

  var preview = $("[data-preview]");
  var rows = document.querySelectorAll(".work-row");
  if (preview && rows.length && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var inner = preview.firstElementChild, mx = 0, my = 0, cx = 0, cy = 0, on = false;
    rows.forEach(function (row) {
      row.addEventListener("mouseenter", function () {
        inner.className = "preview__inner " + row.dataset.thumb;
        inner.textContent = row.dataset.letter;
        preview.classList.add("is-on");
        on = true;
      });
      row.addEventListener("mouseleave", function () {
        preview.classList.remove("is-on");
        on = false;
      });
    });
    document.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });
    (function loop() {
      cx += (mx - cx) * 0.14;
      cy += (my - cy) * 0.14;
      preview.style.transform =
        "translate(" + (cx - 145) + "px," + (cy - 100) + "px) scale(" + (on ? 1 : 0.85) + ")";
      requestAnimationFrame(loop);
    })();
  }

  /* --------------------------------------------------------- фильтр проектов */

  var chips = document.querySelectorAll("[data-filter]");
  var cards = document.querySelectorAll("[data-tags]");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
      cards.forEach(function (card) {
        card.hidden = !(chip.dataset.filter === "all" || card.dataset.tags === chip.dataset.filter);
      });
    });
  });

  /* ------------------------------------------------------------------ форма */

  var form = $("[data-form]");
  if (form) {
    var status = $("[data-form-status]");

    function errorBox(field) {
      var wrap = field.closest(".field");
      return wrap && wrap.querySelector(".field__err");
    }

    form.addEventListener("input", function (e) {
      var box = errorBox(e.target);
      if (box) box.hidden = true;
      e.target.classList.remove("is-bad");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var values = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        text: form.text.value.trim()
      };
      var errors = {
        name: values.name.length < 2 ? F.err_name : "",
        email: /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(values.email) ? "" : F.err_email,
        text: values.text.length < 10 ? F.err_message : ""
      };

      var bad = false;
      Object.keys(errors).forEach(function (key) {
        var field = form[key];
        var box = errorBox(field);
        box.textContent = errors[key];
        box.hidden = !errors[key];
        field.classList.toggle("is-bad", !!errors[key]);
        if (errors[key]) bad = true;
      });
      if (bad) { status.hidden = true; return; }

      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = F.sending;

      var body = new FormData(form);
      fetch(form.action, {
        method: "POST",
        body: body,
        headers: { "X-Requested-With": "XMLHttpRequest", "Accept": "application/json" }
      }).then(function (r) {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      }).then(function () {
        form.reset();
        status.textContent = F.ok;
      }).catch(function () {
        status.textContent = F.fail;
      }).then(function () {
        status.hidden = false;
        btn.disabled = false;
        btn.textContent = F.submit;
      });
    });

    /* ------------------------------------------------------ голосовой ввод */

    var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    var micBtn = $("[data-mic]");

    if (Rec && micBtn) {
      var micRow = $("[data-mic-row]");
      var micLabel = $("[data-mic-label]");
      var hint = $("[data-mic-hint]");
      var viz = $("[data-viz]");
      var bars = viz.querySelectorAll("i");
      var audioCtx = null, micStream = null, rafId = null;
      var listening = false, base = "";

      micRow.hidden = false;

      var rec = new Rec();
      rec.lang = F.mic_lang || "en-US";
      rec.continuous = true;
      rec.interimResults = true;

      function startViz() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          micStream = stream;
          var AC = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AC();
          var analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.72;
          audioCtx.createMediaStreamSource(stream).connect(analyser);
          var data = new Uint8Array(analyser.frequencyBinCount);
          viz.hidden = false;
          (function draw() {
            analyser.getByteFrequencyData(data);
            for (var i = 0; i < bars.length; i++) {
              var v = data[i + 1] / 255;
              bars[i].style.transform = "scaleY(" + Math.max(0.12, Math.min(1, v * 1.7)) + ")";
            }
            rafId = requestAnimationFrame(draw);
          })();
        }).catch(function () {});
      }

      function stopViz() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        if (micStream) micStream.getTracks().forEach(function (t) { t.stop(); });
        micStream = null;
        if (audioCtx) audioCtx.close();
        audioCtx = null;
        viz.hidden = true;
        bars.forEach(function (b) { b.style.transform = "scaleY(0.12)"; });
      }

      function uiStart() {
        listening = true;
        micBtn.classList.add("is-live");
        micLabel.textContent = F.mic_stop;
        hint.textContent = F.mic_listening;
        hint.classList.add("is-live");
      }

      function uiStop() {
        listening = false;
        micBtn.classList.remove("is-live");
        micLabel.textContent = F.mic_start;
        hint.textContent = F.mic_hint;
        hint.classList.remove("is-live");
        stopViz();
      }

      micBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (listening) {
          uiStop();
          try { rec.abort(); } catch (err) {}
          try { rec.stop(); } catch (err) {}
          return;
        }
        base = form.text.value.replace(/\s+$/, "");
        uiStart();
        startViz();
        try { rec.start(); } catch (err) { uiStop(); }
      });

      rec.onstart = function () { if (listening) uiStart(); };

      rec.onresult = function (e) {
        if (!listening) return;
        var text = "";
        for (var i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
        form.text.value = (base ? base + " " : "") + text.replace(/^\s+/, "");
        var box = errorBox(form.text);
        if (box) box.hidden = true;
      };

      rec.onerror = function (e) {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          status.textContent = F.mic_denied;
          status.hidden = false;
        }
        uiStop();
      };

      rec.onend = function () { uiStop(); };
    }
  }

  /* --------------------------------------------------------------- фото-игра */

  var photoEl = $("[data-photo]");
  if (photoEl && page === "home" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    photoEl.addEventListener("mousemove", function (e) {
      var r = photoEl.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      photoEl.style.transform =
        "perspective(700px) rotateY(" + (px * 9).toFixed(2) + "deg) rotateX(" + (-py * 9).toFixed(2) + "deg)";
    });
    photoEl.addEventListener("mouseleave", function () { photoEl.style.transform = ""; });
    photoEl.addEventListener("click", function () {
      photoEl.style.transform = "";
      if (window.DebugGame) window.DebugGame.start(G);
    });
  }
})();

/* ---------------------------------------------------------------- поиск --
   Обращаемся к Algolia напрямую через её REST API — без сторонних библиотек.
   Ключ здесь публичный, поисковый: он умеет только читать индекс. */

(function () {
  "use strict";

  var cfgEl = document.getElementById("algolia-config");
  var box = document.querySelector("[data-search]");
  if (!cfgEl || !box) return;

  var cfg = JSON.parse(cfgEl.textContent);
  var input = box.querySelector("[data-search-input]");
  var results = box.querySelector("[data-search-results]");
  var openBtn = document.querySelector("[data-search-open]");
  var closeBtn = box.querySelector("[data-search-close]");
  var lang = document.documentElement.lang || "en";
  var ui = JSON.parse(document.getElementById("ui-form").textContent);
  var timer = null;

  function open() {
    box.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(function () { input.focus(); }, 30);
  }

  function close() {
    box.hidden = true;
    document.body.style.overflow = "";
    input.value = "";
    results.innerHTML = "";
  }

  if (openBtn) openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  box.addEventListener("click", function (e) { if (e.target === box) close(); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !box.hidden) close();
    // Cmd/Ctrl+K — быстрый вызов поиска
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      box.hidden ? open() : close();
    }
  });

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function render(hits) {
    if (!hits.length) {
      results.innerHTML = '<p class="search__empty">' + esc(ui.nothing_found || "—") + "</p>";
      return;
    }
    results.innerHTML = hits.map(function (hit) {
      var title = (hit._highlightResult && hit._highlightResult.title)
        ? hit._highlightResult.title.value : esc(hit.title);
      var text = (hit._highlightResult && hit._highlightResult.text)
        ? hit._highlightResult.text.value : esc(hit.text || "");
      return '<a class="search__hit" href="' + esc(hit.url) + '">' +
        '<span class="search__kind">' + esc(hit.kind) + "</span>" +
        "<b>" + title + "</b>" +
        "<span>" + text.slice(0, 160) + "</span></a>";
    }).join("");
  }

  function search(query) {
    if (!query.trim()) { results.innerHTML = ""; return; }

    fetch("https://" + cfg.app_id + "-dsn.algolia.net/1/indexes/" + cfg.index + "/query", {
      method: "POST",
      headers: {
        "X-Algolia-Application-Id": cfg.app_id,
        "X-Algolia-API-Key": cfg.search_key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: query,
        hitsPerPage: 8,
        filters: "lang:" + lang
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) { render(data.hits || []); })
      .catch(function () { results.innerHTML = ""; });
  }

  input.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(function () { search(input.value); }, 180);
  });
})();
