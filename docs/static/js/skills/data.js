/* Мини-игры: блок «Базы и поиск».
   Механики и тексты трёх языков лежат рядом: домен владеет и поведением,
   и своими словами. Регистрируется в ядре через SkillGames.add(). */

(function () {
  "use strict";

  var S = window.SkillGames;
  var add = S.add, t = S.t, ui = S.ui;
  var row = S.row, lead = S.lead, count = S.count, on = S.on, later = S.later;

  /* ================================================= блок Базы и поиск === */

  /* SQL — «Спроси у полки». Вместо того чтобы перебирать товары глазами,
     условие описывают словами, и полка сама отдаёт подходящее. */
  add("sql", function (area, api) {
    var GOODS = [
      { k: "a", price: 89, has: true }, { k: "b", price: 240, has: true },
      { k: "c", price: 55, has: false }, { k: "d", price: 99, has: true },
      { k: "e", price: 310, has: false }, { k: "f", price: 70, has: false },
    ];
    var cheap = false, inStock = false;

    function ok(g) { return (!cheap || g.price < 100) && (!inStock || g.has); }

    function render() {
      var picked = GOODS.filter(ok);
      var right = cheap && inStock;
      area.innerHTML =
        '<div class="sg__files">' + GOODS.map(function (g) {
          return '<div class="sg__file' + ((cheap || inStock) && ok(g) ? " is-hit" : "") + '">' +
                 t("sql", "g_" + g.k) + " · " + g.price + " · " +
                 t("sql", g.has ? "yes" : "no") + "</div>";
        }).join("") + "</div>" +
        '<div class="sg__search">' + t("sql", "ask") +
          (cheap ? " " + t("sql", "cCheap") : "") +
          (cheap && inStock ? " " + t("sql", "and") : "") +
          (inStock ? " " + t("sql", "cStock") : "") + "</div>" +
        lead(t("sql", right ? "exact" : "task2")) +
        count(t("sql", "found").replace("{n}", (cheap || inStock) ? picked.length : GOODS.length)) +
        row('<button class="sg__step' + (cheap ? " is-done" : "") + '" data-c="cheap">' +
              t("sql", "cCheap") + "</button>" +
            '<button class="sg__step' + (inStock ? " is-done" : "") + '" data-c="stock">' +
              t("sql", "cStock") + "</button>");

      on(area, "[data-c]", function (b) {
        if (b.dataset.c === "cheap") cheap = !cheap; else inStock = !inStock;
        render();
        if (cheap && inStock) api.finish();
      });
    }
    render();
  }, {
    en: { title: "Ask the shelf",
          task: "Six goods on the shelf. You need the cheap ones that are actually in stock.",
          g_a: "kettle", g_b: "blender", g_c: "lamp", g_d: "toaster", g_e: "oven", g_f: "mug",
          yes: "in stock", no: "none left",
          ask: "show goods",
          cCheap: "under 100", cStock: "in stock", and: "and",
          task2: "Add conditions and watch the shelf answer.",
          exact: "Two conditions, and the shelf handed over exactly what was asked for.",
          found: "Shown: {n}",
          done: "This is SQL. You describe what you want in conditions, and the storage hands it over — instead of you looking through everything." },
    ru: { title: "Спроси у полки",
          task: "Шесть товаров на полке. Нужны дешёвые и чтобы они правда были в наличии.",
          g_a: "чайник", g_b: "блендер", g_c: "лампа", g_d: "тостер", g_e: "духовка", g_f: "кружка",
          yes: "в наличии", no: "нет",
          ask: "покажи товары",
          cCheap: "дешевле 100", cStock: "в наличии", and: "и",
          task2: "Добавляй условия и смотри, как полка отвечает.",
          exact: "Два условия — и полка отдала ровно то, что просили.",
          found: "Показано: {n}",
          done: "Это SQL. Ты описываешь условиями, что тебе нужно, и хранилище само это отдаёт — вместо того чтобы ты пересматривал всё." },
    ro: { title: "Întreabă raftul",
          task: "Șase produse pe raft. Îți trebuie cele ieftine și care chiar sunt în stoc.",
          g_a: "ceainic", g_b: "blender", g_c: "lampă", g_d: "prăjitor", g_e: "cuptor", g_f: "cană",
          yes: "în stoc", no: "nu sunt",
          ask: "arată produsele",
          cCheap: "sub 100", cStock: "în stoc", and: "și",
          task2: "Adaugă condiții și privește cum răspunde raftul.",
          exact: "Două condiții — și raftul a dat exact ce s-a cerut.",
          found: "Afișate: {n}",
          done: "Acesta este SQL. Descrii prin condiții ce îți trebuie, iar depozitul îți dă exact asta — în loc să te uiți tu prin tot." },
  });

  /* PostgreSQL — «Всё или ничего». Перевод денег состоит из двух шагов;
     если свет погас между ними, деньги не должны исчезнуть. */
  add("postgres", function (area, api) {
    var safe = false, a = 500, b = 300, stage = 0, note = "";

    function render() {
      area.innerHTML =
        '<div class="sg__accounts">' +
          '<div class="sg__acc"><b>' + t("postgres", "anna") + "</b><span>" + a + " MDL</span></div>" +
          '<div class="sg__arrow">→ 200 →</div>' +
          '<div class="sg__acc"><b>' + t("postgres", "boris") + "</b><span>" + b + " MDL</span></div>" +
        "</div>" +
        '<div class="sg__switch"><span>' + t("postgres", "mode") + "</span>" +
          '<button class="sg__toggle' + (safe ? " is-on" : "") + '" data-mode>' +
            t("postgres", safe ? "allOrNone" : "stepByStep") + "</button></div>" +
        lead(note || t("postgres", "intro")) +
        row(stage === 2 ? "" :
          '<button class="sg__step is-next" data-go>' + t("postgres", "transfer") + "</button>");

      on(area, "[data-mode]", function () {
        if (stage) return;
        safe = !safe; render();
      });
      on(area, "[data-go]", function () {
        a -= 200; stage = 1; note = t("postgres", "blackout"); render();
        later(function () {
          if (safe) { a += 200; note = t("postgres", "rolled"); }
          else note = t("postgres", "lost");
          stage = 2; render();
          if (safe) api.finish();
          else {
            area.insertAdjacentHTML("beforeend",
              row('<button class="sg__step is-next" data-retry>' + t("postgres", "retry") + "</button>"));
            on(area, "[data-retry]", function () {
              a = 500; b = 300; stage = 0; note = ""; safe = true; render();
            });
          }
        }, 1200);
      });
    }
    render();
  }, {
    en: { title: "All or nothing",
          task: "Move 200 lei from Anna to Boris. The power will cut out halfway.",
          anna: "Anna", boris: "Boris",
          mode: "How it is written", stepByStep: "step by step", allOrNone: "all or nothing",
          intro: "Two steps: take from one, give to the other. Start the transfer.",
          blackout: "Taken from Anna… and the power goes out.",
          lost: "200 lei are gone. Taken from Anna, never reached Boris. Nobody has them now.",
          rolled: "Everything went back as it was. The money is with Anna, as if the transfer never started.",
          transfer: "transfer 200", retry: "try it the other way",
          done: "This is PostgreSQL. Steps that belong together either all happen or none do — money cannot vanish between them." },
    ru: { title: "Всё или ничего",
          task: "Переведи 200 лей от Анны к Борису. На середине погаснет свет.",
          anna: "Анна", boris: "Борис",
          mode: "Как записано", stepByStep: "по шагам", allOrNone: "всё или ничего",
          intro: "Два шага: снять у одного, зачислить другому. Запусти перевод.",
          blackout: "Снято у Анны… и гаснет свет.",
          lost: "200 лей пропали. У Анны сняли, до Бориса не дошло. Их нет ни у кого.",
          rolled: "Всё вернулось как было. Деньги у Анны, будто перевод и не начинался.",
          transfer: "перевести 200", retry: "попробовать иначе",
          done: "Это PostgreSQL. Шаги, которые идут вместе, либо случаются все, либо ни один — деньги не могут пропасть между ними." },
    ro: { title: "Tot sau nimic",
          task: "Mută 200 de lei de la Ana la Boris. La jumătate se va lua curentul.",
          anna: "Ana", boris: "Boris",
          mode: "Cum e scris", stepByStep: "pas cu pas", allOrNone: "tot sau nimic",
          intro: "Doi pași: iei de la unul, dai celuilalt. Pornește transferul.",
          blackout: "Luat de la Ana… și se ia curentul.",
          lost: "200 de lei au dispărut. De la Ana s-au luat, la Boris n-au ajuns. Nu îi are nimeni.",
          rolled: "Totul a revenit cum era. Banii sunt la Ana, de parcă transferul nici nu ar fi început.",
          transfer: "transferă 200", retry: "încearcă altfel",
          done: "Acesta este PostgreSQL. Pașii care merg împreună ori se întâmplă toți, ori niciunul — banii nu pot dispărea între ei." },
  });

  /* MySQL — «Копия для чтения». Сто человек смотрят и один пишет: если все
     идут в одну дверь, она не выдерживает; копия разводит потоки. */
  add("mysql", function (area, api) {
    var copy = false;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__db">' +
          '<div class="sg__db-node' + (!copy ? " is-hot" : "") + '"><b>' + t("mysql", "main") + "</b>" +
            "<span>" + t("mysql", copy ? "writesOnly" : "everything") + "</span></div>" +
          (copy ? '<div class="sg__db-node"><b>' + t("mysql", "copy") + "</b><span>" +
                  t("mysql", "readsOnly") + "</span></div>" : "") +
        "</div>" +
        count(t("mysql", "load").replace("{n}", copy ? "12" : "98")) +
        lead(t("mysql", copy ? "after" : "intro")) +
        row(copy ? "" :
          '<button class="sg__step is-next" data-rush>' + t("mysql", "rush") + "</button>" +
          '<button class="sg__step" data-copy>' + t("mysql", "addCopy") + "</button>") +
        (msg ? '<p class="sg__warn">' + msg + "</p>" : "");

      on(area, "[data-rush]", function () { render(t("mysql", "slow")); });
      on(area, "[data-copy]", function () { copy = true; render(""); api.finish(); });
    }
    render("");
  }, {
    en: { title: "A copy to read from",
          task: "A hundred people are browsing the catalogue. One seller is adding goods.",
          main: "the main book", copy: "a copy for readers",
          everything: "everyone writes and reads here",
          writesOnly: "only the seller writes here", readsOnly: "everyone reads here",
          load: "Load on the main book: {n}%",
          intro: "All hundred and one are queuing at the same book. Let the rush in and see.",
          after: "Readers went to the copy. The seller writes into the main book without a queue behind him.",
          rush: "let the rush in", addCopy: "make a copy for readers",
          slow: "The book cannot be turned fast enough. Pages load for seconds; people leave.",
          done: "This is MySQL. Reading is moved onto copies while writing stays in one place, so a crowd of browsers does not block the seller." },
    ru: { title: "Копия для чтения",
          task: "Сто человек смотрят каталог. Один продавец заводит товары.",
          main: "главная книга", copy: "копия для читателей",
          everything: "здесь и пишут, и читают",
          writesOnly: "здесь пишет только продавец", readsOnly: "здесь читают все",
          load: "Нагрузка на главную книгу: {n}%",
          intro: "Все сто один стоят к одной книге. Впусти наплыв и посмотри.",
          after: "Читатели ушли к копии. Продавец пишет в главную книгу, и за спиной у него никого.",
          rush: "впустить наплыв", addCopy: "сделать копию для читателей",
          slow: "Книгу не успевают листать. Страницы грузятся секундами, люди уходят.",
          done: "Это MySQL. Чтение уводят на копии, а запись остаётся в одном месте — и толпа смотрящих не мешает продавцу." },
    ro: { title: "O copie pentru citit",
          task: "O sută de oameni răsfoiesc catalogul. Un vânzător adaugă produse.",
          main: "cartea principală", copy: "o copie pentru cititori",
          everything: "aici și se scrie, și se citește",
          writesOnly: "aici scrie doar vânzătorul", readsOnly: "aici citesc toți",
          load: "Încărcarea cărții principale: {n}%",
          intro: "Toți o sută unu stau la aceeași carte. Lasă valul să intre și privește.",
          after: "Cititorii au trecut la copie. Vânzătorul scrie în cartea principală fără coadă în spate.",
          rush: "lasă valul să intre", addCopy: "fă o copie pentru cititori",
          slow: "Cartea nu poate fi răsfoită destul de repede. Paginile se încarcă secunde, oamenii pleacă.",
          done: "Acesta este MySQL. Cititul se mută pe copii, iar scrisul rămâne într-un loc — mulțimea de curioși nu blochează vânzătorul." },
  });

  /* Redis — «Записка под рукой». Один и тот же вопрос задают снова и снова:
     ответ кладут на видное место, и в подвал больше бегать не нужно. */
  add("redis", function (area, api) {
    var asked = 0, noted = false, busy = false;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__note-pad' + (noted ? " is-on" : "") + '">' +
          (noted ? "📝 " + t("redis", "written") : t("redis", "blank")) + "</div>" +
        count(t("redis", "asked").replace("{n}", asked)) +
        lead(msg || t("redis", noted ? "fast" : "intro")) +
        row(busy ? "" :
          '<button class="sg__step is-next" data-ask>' + t("redis", "ask") + "</button>" +
          (asked >= 2 && !noted ? '<button class="sg__step" data-note>' + t("redis", "write") + "</button>" : ""));

      on(area, "[data-ask]", function () {
        asked++;
        if (noted) { render(t("redis", "instant")); if (asked >= 4) api.finish(); return; }
        busy = true; render(t("redis", "goingDown"));
        later(function () { busy = false; render(t("redis", "cameBack")); }, 1200);
      });
      on(area, "[data-note]", function () { noted = true; render(""); });
    }
    render("");
  }, {
    en: { title: "A note within reach",
          task: "A customer asks the same question. Then another one. Then another.",
          blank: "the note is blank",
          written: "delivery to Bălți — 79 lei",
          asked: "Times asked: {n}",
          intro: "Every answer lives in the basement. Someone asks — you go down.",
          goingDown: "Going down to the basement…",
          cameBack: "Back with the answer. Two seconds gone, again.",
          fast: "The answer is on the note by the window.",
          instant: "Answered without getting up.",
          ask: "a customer asks", write: "write the answer on a note",
          done: "This is Redis. An answer asked for again and again is kept within reach, so the same trip is not made a hundred times." },
    ru: { title: "Записка под рукой",
          task: "Покупатель задаёт вопрос. Потом ещё один. Потом ещё.",
          blank: "записка пустая",
          written: "доставка в Бельцы — 79 лей",
          asked: "Спросили раз: {n}",
          intro: "Все ответы лежат в подвале. Спросили — идёшь вниз.",
          goingDown: "Спускаешься в подвал…",
          cameBack: "Вернулся с ответом. Две секунды снова ушли.",
          fast: "Ответ записан на листке у окна.",
          instant: "Ответил не вставая.",
          ask: "покупатель спрашивает", write: "записать ответ на листок",
          done: "Это Redis. Ответ, который спрашивают снова и снова, держат под рукой — и один и тот же путь не проделывают сто раз." },
    ro: { title: "Un bilet la îndemână",
          task: "Un client pune aceeași întrebare. Apoi încă unul. Apoi încă unul.",
          blank: "biletul e gol",
          written: "livrare la Bălți — 79 lei",
          asked: "Întrebat de: {n} ori",
          intro: "Toate răspunsurile stau în pivniță. Te întreabă — cobori.",
          goingDown: "Cobori în pivniță…",
          cameBack: "Te-ai întors cu răspunsul. Încă două secunde duse.",
          fast: "Răspunsul e scris pe biletul de la fereastră.",
          instant: "Ai răspuns fără să te ridici.",
          ask: "clientul întreabă", write: "scrie răspunsul pe bilet",
          done: "Acesta este Redis. Un răspuns cerut iar și iar e ținut la îndemână, ca să nu faci același drum de o sută de ori." },
  });

  /* Elasticsearch — «Что внутри книги». По названиям нужного не найти:
     искать приходится по словам, которые спрятаны внутри. */
  add("elastic", function (area, api) {
    var BOOKS = ["a", "b", "c", "d", "e", "f"];
    var HIT = ["b", "e"];
    var mode = null;

    function render() {
      area.innerHTML =
        '<div class="sg__search">« ' + t("elastic", "query") + " »</div>" +
        '<div class="sg__files">' + BOOKS.map(function (k) {
          var hit = mode === "inside" && HIT.indexOf(k) >= 0;
          return '<div class="sg__file' + (hit ? " is-hit" : "") + '">📕 ' +
                 t("elastic", "b_" + k) + (hit ? " — «…" + t("elastic", "q_" + k) + "…»" : "") + "</div>";
        }).join("") + "</div>" +
        lead(t("elastic", mode === "title" ? "noTitle" : mode === "inside" ? "found" : "intro")) +
        row('<button class="sg__step' + (mode === "title" ? " is-done" : "") + '" data-m="title">' +
              t("elastic", "byTitle") + "</button>" +
            '<button class="sg__step' + (mode === "inside" ? " is-done" : " is-next") + '" data-m="inside">' +
              t("elastic", "byInside") + "</button>");

      on(area, ".sg__step", function (b) {
        mode = b.dataset.m; render();
        if (mode === "inside") api.finish();
      });
    }
    render();
  }, {
    en: { title: "What is inside the book",
          task: "You remember a phrase from a book, not its title. Find the book.",
          query: "a red scarf",
          b_a: "Winter in the mountains", b_b: "The city in March", b_c: "Cooking for two",
          b_d: "Cars and roads", b_e: "Letters from home", b_f: "The garden book",
          q_b: "she wrapped a red scarf around her neck",
          q_e: "left me a red scarf and a note",
          byTitle: "search the titles", byInside: "search inside the pages",
          intro: "Six books on the shelf. Choose where to look.",
          noTitle: "No title contains those words. By titles alone the book cannot be found.",
          found: "Two books contain the phrase, right there in the middle of a page.",
          done: "This is Elasticsearch. It searches the words inside, not just the labels — so a half-remembered phrase is enough." },
    ru: { title: "Что внутри книги",
          task: "Ты помнишь фразу из книги, но не её название. Найди книгу.",
          query: "красный шарф",
          b_a: "Зима в горах", b_b: "Город в марте", b_c: "Готовим на двоих",
          b_d: "Машины и дороги", b_e: "Письма из дома", b_f: "Книга о саде",
          q_b: "она обмотала шею красным шарфом",
          q_e: "оставил мне красный шарф и записку",
          byTitle: "искать по названиям", byInside: "искать внутри страниц",
          intro: "Шесть книг на полке. Выбери, где искать.",
          noTitle: "Ни в одном названии этих слов нет. По названиям книгу не найти.",
          found: "В двух книгах эта фраза есть — прямо посреди страницы.",
          done: "Это Elasticsearch. Он ищет по словам внутри, а не только по вывескам — и полузабытой фразы достаточно." },
    ro: { title: "Ce e în carte",
          task: "Ții minte o frază dintr-o carte, nu titlul ei. Găsește cartea.",
          query: "un fular roșu",
          b_a: "Iarna la munte", b_b: "Orașul în martie", b_c: "Gătim în doi",
          b_d: "Mașini și drumuri", b_e: "Scrisori de acasă", b_f: "Cartea grădinii",
          q_b: "și-a înfășurat gâtul cu un fular roșu",
          q_e: "mi-a lăsat un fular roșu și un bilet",
          byTitle: "caută în titluri", byInside: "caută în interiorul paginilor",
          intro: "Șase cărți pe raft. Alege unde cauți.",
          noTitle: "Niciun titlu nu conține cuvintele astea. După titluri cartea nu poate fi găsită.",
          found: "Două cărți conțin fraza, chiar în mijlocul unei pagini.",
          done: "Acesta este Elasticsearch. Caută în cuvintele dinăuntru, nu doar pe etichete — iar o frază pe jumătate ținută minte e de ajuns." },
  });

  /* Algolia — «Дописывает за тебя». Подсказки появляются с каждой буквой,
     и покупателю не приходится ни дописывать слово, ни жать Enter. */
  add("algolia", function (area, api) {
    var ITEMS = ["ku", "ko", "kn", "kr", "ka"];
    var typed = "", live = false, finished = false;

    function matches() {
      if (!typed) return [];
      return ITEMS.filter(function (k) {
        return t("algolia", "i_" + k).toLowerCase().indexOf(typed.toLowerCase()) === 0;
      });
    }

    function render() {
      var hits = live ? matches() : [];
      area.innerHTML =
        '<div class="sg__typebox"><input type="text" data-in value="' + typed +
          '" placeholder="' + t("algolia", "ph") + '" maxlength="12"></div>' +
        '<div class="sg__hints">' +
          (live
            ? (typed
                ? (hits.length
                    ? hits.map(function (k) { return '<div class="sg__hint">' + t("algolia", "i_" + k) + "</div>"; }).join("")
                    : '<span class="sg__empty">' + t("algolia", "none") + "</span>")
                : '<span class="sg__empty">' + t("algolia", "typeHint") + "</span>")
            : '<span class="sg__empty">' + t("algolia", "waitEnter") + "</span>") +
        "</div>" +
        lead(t("algolia", live ? "liveNote" : "oldNote")) +
        row(live ? "" : '<button class="sg__step is-next" data-live>' + t("algolia", "turnOn") + "</button>");

      var input = area.querySelector("[data-in]");
      input.addEventListener("input", function () {
        typed = input.value; render();
        var el = area.querySelector("[data-in]");
        el.focus(); el.setSelectionRange(typed.length, typed.length);
        if (live && !finished && matches().length && typed.length >= 2) {
          finished = true; api.finish();
        }
      });
      on(area, "[data-live]", function () { live = true; render(); });
    }
    render();
  }, {
    en: { title: "It finishes your word",
          task: "Start typing what you are looking for. Two letters are enough.",
          ph: "start typing…",
          i_ku: "kettle", i_ko: "korma pan", i_kn: "knife set", i_kr: "kraft bags", i_ka: "kangaroo toy",
          waitEnter: "nothing yet — press Enter and wait two seconds",
          typeHint: "type a letter or two",
          none: "nothing starts with that",
          oldNote: "The old way: type the whole word, press Enter, wait.",
          liveNote: "Now every letter brings the answer with it.",
          turnOn: "turn on live hints",
          done: "This is Algolia. Hints appear with every keystroke, so the customer finds the thing before finishing the word." },
    ru: { title: "Дописывает за тебя",
          task: "Начни печатать, что ищешь. Двух букв достаточно.",
          ph: "начните печатать…",
          i_ku: "кухонный чайник", i_ko: "коврик для ванной", i_kn: "книжная полка",
          i_kr: "кресло складное", i_ka: "кастрюля 3 л",
          waitEnter: "пока ничего — нажмите Enter и подождите две секунды",
          typeHint: "введите букву-другую",
          none: "на это ничего не начинается",
          oldNote: "По-старому: напечатай слово целиком, нажми Enter, жди.",
          liveNote: "Теперь каждая буква приносит ответ с собой.",
          turnOn: "включить живые подсказки",
          done: "Это Algolia. Подсказки появляются с каждой нажатой буквой, и покупатель находит вещь, не дописав слово." },
    ro: { title: "Îți termină cuvântul",
          task: "Începe să scrii ce cauți. Două litere sunt de ajuns.",
          ph: "începe să scrii…",
          i_ku: "ceainic de bucătărie", i_ko: "covoraș de baie", i_kn: "raft de cărți",
          i_kr: "scaun pliant", i_ka: "cratiță de 3 l",
          waitEnter: "încă nimic — apasă Enter și așteaptă două secunde",
          typeHint: "scrie o literă-două",
          none: "nimic nu începe așa",
          oldNote: "Pe vechi: scrii cuvântul întreg, apeși Enter, aștepți.",
          liveNote: "Acum fiecare literă aduce răspunsul cu ea.",
          turnOn: "pornește sugestiile vii",
          done: "Aceasta este Algolia. Sugestiile apar la fiecare tastă, iar clientul găsește lucrul înainte să termine cuvântul." },
  });
})();
