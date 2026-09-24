/* Мини-игры: блок «PHP».
   Механики и тексты трёх языков лежат рядом: домен владеет и поведением,
   и своими словами. Регистрируется в ядре через SkillGames.add(). */

(function () {
  "use strict";

  var S = window.SkillGames;
  var add = S.add, t = S.t, ui = S.ui;
  var row = S.row, lead = S.lead, count = S.count, on = S.on, later = S.later;

  /* =========================================================== блок PHP === */

  /* Laravel — «Кухня». Один заказ готовим дважды: в пустой комнате всё
     приходится смастерить самому, в готовой кухне сразу берёшься за еду. */
  add("laravel", function (area, api) {
    var STEPS = { empty: ["stove", "pan", "plate", "bun", "meat", "cheese"],
                  ready: ["bun", "meat", "cheese"] };
    var round = "empty", clicks = 0, results = {};

    function render() {
      area.innerHTML =
        lead(t("laravel", round === "empty" ? "round1" : "round2")) +
        row(STEPS[round].map(function (k, i) {
          var state = i < clicks ? " is-done" : (i === clicks ? " is-next" : "");
          return '<button class="sg__step' + state + '" data-i="' + i + '">' +
                 t("laravel", "step_" + k) + "</button>";
        }).join("")) +
        count(ui("clicks") + ": " + clicks + " / " + STEPS[round].length);

      on(area, ".sg__step", function (b) {
        if (Number(b.dataset.i) !== clicks) return;       // только следующий по порядку
        clicks++;
        if (clicks < STEPS[round].length) return render();
        results[round] = clicks;
        if (round === "empty") { round = "ready"; clicks = 0; return render(); }
        area.innerHTML = lead(t("laravel", "compare")
          .replace("{a}", results.empty).replace("{b}", results.ready));
        api.finish();
      });
    }
    render();
  }, {
    en: { title: "The kitchen",
          task: "An order came in: a burger. Cook it twice and compare.",
          round1: "Empty room. There is no stove and no plate yet — make everything first.",
          round2: "Now the same order in a kitchen that is already set up.",
          step_stove: "build a stove", step_pan: "make a pan", step_plate: "make a plate",
          step_bun: "bun", step_meat: "patty", step_cheese: "cheese",
          compare: "Empty room — {a} steps. Ready kitchen — {b} steps. The same burger.",
          done: "This is Laravel. The stove and the plates are already there, so you only cook the food." },
    ru: { title: "Кухня",
          task: "Пришёл заказ: бургер. Приготовь его дважды и сравни.",
          round1: "Пустая комната. Плиты и тарелки ещё нет — сначала сделай всё сам.",
          round2: "Теперь тот же заказ на кухне, где всё уже стоит.",
          step_stove: "сложить плиту", step_pan: "сделать сковороду", step_plate: "сделать тарелку",
          step_bun: "булка", step_meat: "котлета", step_cheese: "сыр",
          compare: "Пустая комната — {a} шагов. Готовая кухня — {b} шага. Бургер один и тот же.",
          done: "Это Laravel. Плита и посуда уже стоят, тебе остаётся только готовить еду." },
    ro: { title: "Bucătăria",
          task: "A venit o comandă: un burger. Gătește-l de două ori și compară.",
          round1: "Cameră goală. Nu există nici aragaz, nici farfurie — fă totul de la zero.",
          round2: "Acum aceeași comandă într-o bucătărie deja utilată.",
          step_stove: "construiește aragazul", step_pan: "fă o tigaie", step_plate: "fă o farfurie",
          step_bun: "chiflă", step_meat: "chiftea", step_cheese: "cașcaval",
          compare: "Cameră goală — {a} pași. Bucătărie gata — {b} pași. Același burger.",
          done: "Acesta este Laravel. Aragazul și vasele sunt deja acolo, tu doar gătești." },
  });

  /* Symfony — «Возьми только нужное». В ящике лежит лишнее: самокат
     собирается ровно из четырёх деталей, всё прочее тащить незачем. */
  add("symfony", function (area, api) {
    var PARTS = ["wheel", "wheel2", "deck", "handle", "kettle", "umbrella", "lamp", "book"];
    var NEED = ["wheel", "wheel2", "deck", "handle"];
    var taken = [];

    function render(warn) {
      area.innerHTML =
        '<div class="sg__grid">' + PARTS.map(function (k) {
          return '<button class="sg__part' + (taken.indexOf(k) >= 0 ? " is-on" : "") +
                 '" data-k="' + k + '">' + t("symfony", "part_" + k) + "</button>";
        }).join("") + "</div>" +
        count(ui("taken") + ": " + taken.length + " / " + NEED.length) +
        (warn ? '<p class="sg__warn">' + t("symfony", "extra") + "</p>" : "");

      on(area, ".sg__part", function (b) {
        var k = b.dataset.k, i = taken.indexOf(k);
        if (i >= 0) taken.splice(i, 1); else taken.push(k);
        var ok = NEED.every(function (n) { return taken.indexOf(n) >= 0; });
        var extra = taken.some(function (x) { return NEED.indexOf(x) < 0; });
        if (ok && !extra) { area.innerHTML = lead(t("symfony", "win")); return api.finish(); }
        render(extra);
      });
    }
    render(false);
  }, {
    en: { title: "Take only what you need",
          task: "Build a scooter. The box holds more than you need — take exactly four parts.",
          part_wheel: "wheel", part_wheel2: "second wheel", part_deck: "deck",
          part_handle: "handlebar", part_kettle: "kettle", part_umbrella: "umbrella",
          part_lamp: "lamp", part_book: "book",
          extra: "That one is not needed for a scooter — put it back.",
          win: "A scooter out of four parts, nothing extra carried along.",
          done: "This is Symfony. A box of separate parts: you take what the job needs and nothing more." },
    ru: { title: "Возьми только нужное",
          task: "Собери самокат. В ящике лежит лишнее — возьми ровно четыре детали.",
          part_wheel: "колесо", part_wheel2: "второе колесо", part_deck: "дека",
          part_handle: "руль", part_kettle: "чайник", part_umbrella: "зонт",
          part_lamp: "лампа", part_book: "книга",
          extra: "Эта деталь самокату не нужна — положи обратно.",
          win: "Самокат из четырёх деталей, ничего лишнего с собой не таскаешь.",
          done: "Это Symfony. Ящик с отдельными деталями: берёшь ровно то, что нужно для задачи." },
    ro: { title: "Ia doar ce îți trebuie",
          task: "Construiește o trotinetă. În ladă sunt și lucruri de prisos — ia exact patru piese.",
          part_wheel: "roată", part_wheel2: "a doua roată", part_deck: "platformă",
          part_handle: "ghidon", part_kettle: "ceainic", part_umbrella: "umbrelă",
          part_lamp: "lampă", part_book: "carte",
          extra: "Piesa asta nu trebuie la o trotinetă — pune-o înapoi.",
          win: "O trotinetă din patru piese, fără nimic în plus.",
          done: "Acesta este Symfony. O ladă cu piese separate: iei exact ce cere sarcina." },
  });

  /* Yii2 — «Штамповщик анкет». Три анкеты заполняем руками, остальные семь
     машина делает сама: типовая работа не должна повторяться вручную. */
  add("yii2", function (area, api) {
    var TOTAL = 10, MANUAL = 3;
    var filled = 0, auto = false;

    function render() {
      area.innerHTML =
        lead(t("yii2", auto ? "after" : "before")) +
        '<div class="sg__forms">' +
          Array.apply(null, Array(TOTAL)).map(function (_, i) {
            return '<div class="sg__form' + (i < filled ? " is-done" : "") + '">' +
                   (i < filled ? "✓" : i + 1) + "</div>";
          }).join("") +
        "</div>" +
        count(t("yii2", "counter").replace("{n}", filled).replace("{t}", TOTAL)) +
        row(filled < MANUAL
          ? '<button class="sg__step is-next" data-one>' + t("yii2", "byHand") + "</button>"
          : (filled < TOTAL
              ? '<button class="sg__step is-next" data-all>' + t("yii2", "generate") + "</button>"
              : ""));

      on(area, "[data-one]", function () { filled++; render(); });
      on(area, "[data-all]", function () {
        filled = TOTAL; auto = true; render();
        api.finish();
      });
    }
    render();
  }, {
    en: { title: "The form stamper",
          task: "Ten identical forms are needed. Fill three by hand, then look for a shortcut.",
          before: "Every form is the same: name, phone, address. Doing them one by one.",
          after: "The remaining seven were stamped out in one press.",
          counter: "Forms ready: {n} of {t}",
          byHand: "fill one by hand", generate: "stamp out the rest",
          done: "This is Yii2. Routine forms it writes itself — you describe one, the rest are generated." },
    ru: { title: "Штамповщик анкет",
          task: "Нужно десять одинаковых анкет. Заполни три руками, а потом поищи способ попроще.",
          before: "Анкеты одинаковые: имя, телефон, адрес. Делаешь их по одной.",
          after: "Оставшиеся семь отштамповались одним нажатием.",
          counter: "Готово анкет: {n} из {t}",
          byHand: "заполнить руками", generate: "отштамповать остальные",
          done: "Это Yii2. Типовые анкеты он пишет сам — ты описываешь одну, остальные штампуются." },
    ro: { title: "Ștanța de formulare",
          task: "Sunt necesare zece formulare identice. Completează trei manual, apoi caută o scurtătură.",
          before: "Formularele sunt la fel: nume, telefon, adresă. Le faci unul câte unul.",
          after: "Restul de șapte au fost ștanțate dintr-o singură apăsare.",
          counter: "Formulare gata: {n} din {t}",
          byHand: "completează manual", generate: "ștanțează restul",
          done: "Acesta este Yii2. Formularele tipice le scrie singur — descrii unul, restul se generează." },
  });

  /* CodeIgniter — «Лёгкий рюкзак». Мост держит мало: пройдёт только тот,
     кто взял самое необходимое и не тащит лишнего. */
  add("codeigniter", function (area, api) {
    var LIMIT = 3;
    var ITEMS = [
      { k: "letter", w: 1, need: true }, { k: "water", w: 1 },
      { k: "tent", w: 4 }, { k: "laptop", w: 3 },
      { k: "chair", w: 4 }, { k: "books", w: 3 },
    ];
    var taken = [];

    function weight() {
      return taken.reduce(function (s, k) {
        return s + ITEMS.filter(function (i) { return i.k === k; })[0].w;
      }, 0);
    }

    function render(msg) {
      var w = weight();
      area.innerHTML =
        lead(t("codeigniter", "bridge").replace("{limit}", LIMIT)) +
        '<div class="sg__grid">' + ITEMS.map(function (i) {
          return '<button class="sg__part' + (taken.indexOf(i.k) >= 0 ? " is-on" : "") +
                 '" data-k="' + i.k + '">' + t("codeigniter", "it_" + i.k) +
                 ' <b>' + i.w + "</b></button>";
        }).join("") + "</div>" +
        count(ui("weight") + ": " + w + " / " + LIMIT) +
        (msg ? '<p class="sg__warn">' + msg + "</p>" : "") +
        row('<button class="sg__step is-next" data-go>' + ui("go") + "</button>");

      on(area, ".sg__part", function (b) {
        var k = b.dataset.k, i = taken.indexOf(k);
        if (i >= 0) taken.splice(i, 1); else taken.push(k);
        render();
      });
      on(area, "[data-go]", function () {
        if (taken.indexOf("letter") < 0) return render(t("codeigniter", "noLetter"));
        if (weight() > LIMIT) return render(t("codeigniter", "tooHeavy"));
        area.innerHTML = lead(t("codeigniter", "win"));
        api.finish();
      });
    }
    render();
  }, {
    en: { title: "The light backpack",
          task: "Carry the letter across. The bridge is old — it holds very little.",
          bridge: "The bridge holds {limit} kg. The letter must get across; everything else is temptation.",
          it_letter: "letter", it_water: "water", it_tent: "tent",
          it_laptop: "laptop", it_chair: "folding chair", it_books: "books",
          noLetter: "You forgot the letter — that was the whole point.",
          tooHeavy: "Too heavy. The bridge creaks and you step back.",
          win: "Across, dry and whole. Only what the job needed came along.",
          done: "This is CodeIgniter. Very light: it takes the bare minimum and so runs where heavy ones cannot." },
    ru: { title: "Лёгкий рюкзак",
          task: "Отнеси письмо на тот берег. Мост старый — держит совсем мало.",
          bridge: "Мост выдерживает {limit} кг. Письмо донести обязательно, остальное — соблазн.",
          it_letter: "письмо", it_water: "вода", it_tent: "палатка",
          it_laptop: "ноутбук", it_chair: "раскладной стул", it_books: "книги",
          noLetter: "Ты забыл письмо — ради него всё и затевалось.",
          tooHeavy: "Слишком тяжело. Мост трещит, приходится отступить.",
          win: "Перешёл, сухой и целый. С собой только то, что было нужно для дела.",
          done: "Это CodeIgniter. Очень лёгкий: берёт самый минимум и потому бежит там, где тяжёлые не пройдут." },
    ro: { title: "Rucsacul ușor",
          task: "Du scrisoarea pe celălalt mal. Podul e vechi — ține foarte puțin.",
          bridge: "Podul ține {limit} kg. Scrisoarea trebuie dusă, restul e doar ispită.",
          it_letter: "scrisoare", it_water: "apă", it_tent: "cort",
          it_laptop: "laptop", it_chair: "scaun pliant", it_books: "cărți",
          noLetter: "Ai uitat scrisoarea — tocmai pentru ea ai pornit.",
          tooHeavy: "Prea greu. Podul scârțâie și dai înapoi.",
          win: "Ai trecut, uscat și întreg. Doar ce trebuia pentru treabă a venit cu tine.",
          done: "Acesta este CodeIgniter. Foarte ușor: ia strictul necesar și trece pe unde cele grele nu pot." },
  });

  /* OpenCart — «Магазин из коробки». Здание, касса и корзина уже стоят:
     работа хозяина — завезти товар на полки. */
  add("opencart", function (area, api) {
    var GOODS = ["tv", "phone", "kettle", "lamp", "shoes", "toy"];
    var shelf = [];

    function render() {
      area.innerHTML =
        lead(t("opencart", "ready")) +
        '<div class="sg__shelf">' + GOODS.map(function (k, i) {
          return '<div class="sg__slot' + (shelf.indexOf(k) >= 0 ? " is-full" : "") + '">' +
                 (shelf.indexOf(k) >= 0 ? t("opencart", "g_" + k) : i + 1) + "</div>";
        }).join("") + "</div>" +
        count(t("opencart", "counter").replace("{n}", shelf.length).replace("{t}", GOODS.length)) +
        row(GOODS.filter(function (k) { return shelf.indexOf(k) < 0; }).map(function (k) {
          return '<button class="sg__step is-next" data-k="' + k + '">' +
                 t("opencart", "g_" + k) + "</button>";
        }).join(""));

      on(area, ".sg__step", function (b) {
        shelf.push(b.dataset.k);
        if (shelf.length < GOODS.length) return render();
        area.innerHTML = lead(t("opencart", "win"));
        api.finish();
      });
    }
    render();
  }, {
    en: { title: "A shop out of the box",
          task: "The shop is already built. Put the goods on the shelves and it starts selling.",
          ready: "Counter, basket and card payment are already in place — nobody built them today.",
          g_tv: "TV", g_phone: "phone", g_kettle: "kettle",
          g_lamp: "lamp", g_shoes: "shoes", g_toy: "toy",
          counter: "Shelves filled: {n} of {t}",
          win: "Shelves full, the first customer is already at the counter.",
          done: "This is OpenCart. The shop comes assembled — checkout, basket and payment included. Your job is the goods." },
    ru: { title: "Магазин из коробки",
          task: "Магазин уже построен. Расставь товар по полкам — и он начнёт продавать.",
          ready: "Касса, корзина и оплата картой уже на месте — их сегодня никто не строил.",
          g_tv: "телевизор", g_phone: "телефон", g_kettle: "чайник",
          g_lamp: "лампа", g_shoes: "кроссовки", g_toy: "игрушка",
          counter: "Полок заполнено: {n} из {t}",
          win: "Полки полные, первый покупатель уже у кассы.",
          done: "Это OpenCart. Магазин приходит собранным — касса, корзина и оплата внутри. Твоё дело — товар." },
    ro: { title: "Un magazin la cheie",
          task: "Magazinul este deja construit. Pune marfa pe rafturi și începe să vândă.",
          ready: "Casa, coșul și plata cu cardul sunt deja acolo — nimeni nu le-a construit azi.",
          g_tv: "televizor", g_phone: "telefon", g_kettle: "ceainic",
          g_lamp: "lampă", g_shoes: "adidași", g_toy: "jucărie",
          counter: "Rafturi umplute: {n} din {t}",
          win: "Rafturile sunt pline, primul client e deja la casă.",
          done: "Acesta este OpenCart. Magazinul vine gata montat — casă, coș și plată incluse. Treaba ta e marfa." },
  });

  /* Bitrix — «Большой офис». Отделы работают порознь и теряют бумаги;
     соединённые в одну систему, они передают дела сами. */
  add("bitrix", function (area, api) {
    var DEPTS = ["shop", "stock", "books"];
    var PAIRS = [["shop", "stock"], ["stock", "books"], ["books", "shop"]];
    var linked = [], picked = null;

    function key(a, b) { return [a, b].sort().join("-"); }

    function render(msg) {
      area.innerHTML =
        lead(t("bitrix", "apart")) +
        '<div class="sg__row">' + DEPTS.map(function (k) {
          return '<button class="sg__part' + (picked === k ? " is-on" : "") +
                 '" data-k="' + k + '">' + t("bitrix", "d_" + k) + "</button>";
        }).join("") + "</div>" +
        count(t("bitrix", "counter").replace("{n}", linked.length).replace("{t}", PAIRS.length)) +
        (msg ? '<p class="sg__warn">' + msg + "</p>" : "");

      on(area, ".sg__part", function (b) {
        var k = b.dataset.k;
        if (!picked) { picked = k; return render(); }
        if (picked === k) { picked = null; return render(); }
        var id = key(picked, k);
        picked = null;
        if (linked.indexOf(id) >= 0) return render(t("bitrix", "already"));
        linked.push(id);
        if (linked.length < PAIRS.length) return render();
        area.innerHTML = lead(t("bitrix", "win"));
        api.finish();
      });
    }
    render();
  }, {
    en: { title: "The big office",
          task: "Three departments work apart and lose papers. Connect them: click one, then another.",
          apart: "The shop sells, the warehouse ships, accounting bills — and none of them knows the others.",
          d_shop: "shop", d_stock: "warehouse", d_books: "accounting",
          counter: "Connections made: {n} of {t}",
          already: "These two already talk to each other.",
          win: "An order came in and ran through all three by itself — nobody carried a single sheet of paper.",
          done: "This is Bitrix. Not just a website: shop, warehouse and accounting live in one system and hand work to each other." },
    ru: { title: "Большой офис",
          task: "Три отдела работают порознь и теряют бумаги. Соедини их: нажми один, потом другой.",
          apart: "Магазин продаёт, склад отгружает, бухгалтерия выставляет счета — и никто не знает про остальных.",
          d_shop: "магазин", d_stock: "склад", d_books: "бухгалтерия",
          counter: "Связей налажено: {n} из {t}",
          already: "Эти двое уже общаются между собой.",
          win: "Пришёл заказ и сам пробежал по всем трём — ни одной бумажки не пришлось нести руками.",
          done: "Это Bitrix. Не только сайт: магазин, склад и бухгалтерия живут в одной системе и передают дела друг другу." },
    ro: { title: "Biroul mare",
          task: "Trei departamente lucrează separat și pierd hârtii. Leagă-le: apasă unul, apoi altul.",
          apart: "Magazinul vinde, depozitul livrează, contabilitatea facturează — și niciunul nu știe de ceilalți.",
          d_shop: "magazin", d_stock: "depozit", d_books: "contabilitate",
          counter: "Legături făcute: {n} din {t}",
          already: "Aceștia doi deja vorbesc între ei.",
          win: "A venit o comandă și a trecut singură prin toate trei — nimeni nu a purtat nicio hârtie.",
          done: "Acesta este Bitrix. Nu doar un site: magazinul, depozitul și contabilitatea stau într-un singur sistem și își pasează treaba." },
  });

  /* WordPress — «Собери страницу мышкой». Страница складывается из готовых
     блоков, кода при этом не видно вовсе. */
  add("wordpress", function (area, api) {
    var BLOCKS = ["head", "photo", "text", "button"];
    var page = [];

    function render() {
      area.innerHTML =
        '<div class="sg__page">' +
          (page.length ? page.map(function (k) {
            return '<div class="sg__blk sg__blk--' + k + '">' + t("wordpress", "blk_" + k) + "</div>";
          }).join("") : '<span class="sg__empty">' + t("wordpress", "empty") + "</span>") +
        "</div>" +
        row(BLOCKS.map(function (k) {
          var used = page.indexOf(k) >= 0;
          return '<button class="sg__step' + (used ? " is-done" : "") + '" data-k="' + k + '"' +
                 (used ? " disabled" : "") + ">+ " + t("wordpress", "blk_" + k) + "</button>";
        }).join(""));

      on(area, ".sg__step", function (b) {
        if (b.disabled) return;
        page.push(b.dataset.k);
        render();
        if (page.length === BLOCKS.length) api.finish();
      });
    }
    render();
  }, {
    en: { title: "Build a page with the mouse",
          task: "Add the blocks one by one and watch the page appear.",
          blk_head: "heading", blk_photo: "photo", blk_text: "text", blk_button: "button",
          empty: "empty page",
          done: "This is WordPress. The page is assembled with the mouse — no code written at all." },
    ru: { title: "Собери страницу мышкой",
          task: "Добавляй блоки по одному и смотри, как появляется страница.",
          blk_head: "заголовок", blk_photo: "фото", blk_text: "текст", blk_button: "кнопка",
          empty: "пустая страница",
          done: "Это WordPress. Страница собирается мышкой — кода не написано ни строчки." },
    ro: { title: "Construiește pagina cu mouse-ul",
          task: "Adaugă blocurile pe rând și privește cum apare pagina.",
          blk_head: "titlu", blk_photo: "poză", blk_text: "text", blk_button: "buton",
          empty: "pagină goală",
          done: "Acesta este WordPress. Pagina se face cu mouse-ul — fără nicio linie de cod." },
  });
})();
