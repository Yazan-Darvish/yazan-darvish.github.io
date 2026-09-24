/* Мини-игры: блок «Языки».
   Механики и тексты трёх языков лежат рядом: домен владеет и поведением,
   и своими словами. Регистрируется в ядре через SkillGames.add(). */

(function () {
  "use strict";

  var S = window.SkillGames;
  var add = S.add, t = S.t, ui = S.ui;
  var row = S.row, lead = S.lead, count = S.count, on = S.on, later = S.later;

  /* ======================================================== блок Языки === */

  /* Русский — «Планёрка». Родной язык — это скорость: успеваешь не только
     понять сказанное, но и ответить, пока разговор ещё идёт. */
  add("lang_ru", function (area, api) {
    var LINES = ["l1", "l2", "l3"];
    var i = 0;

    function render() {
      area.innerHTML =
        '<div class="sg__chat">' +
          LINES.slice(0, i + 1).map(function (k, n) {
            return '<div class="sg__msg sg__msg--' + (n % 2 ? "shop" : "buyer") + '">' +
                   t("lang_ru", k) + "</div>";
          }).join("") +
        "</div>" +
        lead(t("lang_ru", i < LINES.length - 1 ? "fast" : "end")) +
        row(i < LINES.length - 1
          ? '<button class="sg__step is-next" data-next>' + t("lang_ru", "keepUp") + "</button>"
          : "");

      on(area, "[data-next]", function () {
        i++; render();
        if (i === LINES.length - 1) api.finish();
      });
    }
    render();
  }, {
    en: { title: "The stand-up",
          task: "A morning meeting in a Chișinău office. Everybody speaks Russian and nobody slows down.",
          l1: "“The warehouse says the counts are off again since Friday.”",
          l2: "“Since Friday is the import — it takes quantities before the returns are applied.”",
          l3: "“Then fix it by tonight, the inventory is tomorrow.”",
          fast: "Nobody repeats anything. Keep up.",
          end: "Three lines, no pauses, answered in the same breath. This is the language the team actually works in.",
          keepUp: "keep up",
          done: "This is Russian — a native language. Not “can read with a dictionary”, but talking at full speed in the room where decisions are made." },
    ru: { title: "Планёрка",
          task: "Утреннее совещание в кишинёвском офисе. Все говорят по-русски и никто не сбавляет темп.",
          l1: "«Склад говорит, с пятницы опять остатки не сходятся.»",
          l2: "«С пятницы — это импорт: он берёт количества до того, как применятся возвраты.»",
          l3: "«Тогда почини до вечера, завтра инвентаризация.»",
          fast: "Никто ничего не повторяет. Успевай.",
          end: "Три реплики без пауз, ответ на том же дыхании. Это язык, на котором команда действительно работает.",
          keepUp: "успевать",
          done: "Это русский — родной язык. Не «читаю со словарём», а разговор на полной скорости в комнате, где принимают решения." },
    ro: { title: "Ședința de dimineață",
          task: "Ședință de dimineață într-un birou din Chișinău. Toți vorbesc rusă și nimeni nu încetinește.",
          l1: "„Depozitul zice că de vineri iar nu se potrivesc stocurile.”",
          l2: "„De vineri e importul: ia cantitățile înainte să se aplice retururile.”",
          l3: "„Atunci repar-o până diseară, mâine e inventarul.”",
          fast: "Nimeni nu repetă nimic. Ține pasul.",
          end: "Trei replici fără pauze, răspuns în aceeași respirație. Aceasta e limba în care echipa chiar lucrează.",
          keepUp: "ține pasul",
          done: "Aceasta este rusa — limbă maternă. Nu „citesc cu dicționarul”, ci conversație la viteză maximă în camera unde se iau deciziile." },
  });

  /* Румынский — «Бумага из налоговой». Государственный язык Молдовы: без
     него приходится ждать перевода, а сроки ждать не будут. */
  add("lang_ro", function (area, api) {
    var read = false;

    function render() {
      area.innerHTML =
        '<div class="sg__doc">' +
          "<b>SERVICIUL FISCAL DE STAT</b>" +
          "<p>Vă informăm că, începând cu 1 martie, bonurile fiscale emise de " +
          "aparatele de casă trebuie să conțină codul fiscal al cumpărătorului " +
          "la solicitarea acestuia. Termen de conformare: 30 de zile.</p>" +
        "</div>" +
        (read ? '<p class="sg__answer">' + t("lang_ro", "meaning") + "</p>" : "") +
        lead(t("lang_ro", read ? "after" : "intro")) +
        row(read ? "" :
          '<button class="sg__step" data-wait>' + t("lang_ro", "translator") + "</button>" +
          '<button class="sg__step is-next" data-read>' + t("lang_ro", "readIt") + "</button>");

      on(area, "[data-wait]", function () {
        render();
        area.insertAdjacentHTML("beforeend", '<p class="sg__warn">' + t("lang_ro", "waiting") + "</p>");
      });
      on(area, "[data-read]", function () { read = true; render(); api.finish(); });
    }
    render();
  }, {
    en: { title: "A letter from the tax office",
          task: "This arrived this morning. It is in Romanian, because official letters in Moldova are.",
          intro: "There is a deadline in there somewhere.",
          translator: "send it to a translator", readIt: "read it yourself",
          waiting: "Three days for the translation. The deadline does not pause for those three days.",
          meaning: "From 1 March, the till must print the buyer's tax code on request. 30 days to comply.",
          after: "Read in a minute, and the work on the fiscal printer can start today.",
          done: "This is Romanian — the state language of Moldova. Laws, tax letters and fiscal rules arrive in it, and a deadline does not wait for a translator." },
    ru: { title: "Бумага из налоговой",
          task: "Пришло сегодня утром. На румынском — потому что официальные письма в Молдове такие.",
          intro: "Где-то там указан срок.",
          translator: "отдать переводчику", readIt: "прочитать самому",
          waiting: "Три дня на перевод. Срок эти три дня не ждёт.",
          meaning: "С 1 марта касса должна печатать фискальный код покупателя по его требованию. На приведение в порядок — 30 дней.",
          after: "Прочитано за минуту, и работу над фискальным принтером можно начинать сегодня.",
          done: "Это румынский — государственный язык Молдовы. На нём приходят законы, письма налоговой и правила фискализации, а срок переводчика не ждёт." },
    ro: { title: "O hârtie de la fisc",
          task: "A venit azi-dimineață. În română, pentru că scrisorile oficiale din Moldova așa sunt.",
          intro: "Undeva acolo e un termen.",
          translator: "trimite la traducător", readIt: "citește singur",
          waiting: "Trei zile pentru traducere. Termenul nu se oprește în aceste trei zile.",
          meaning: "De la 1 martie, casa trebuie să tipărească codul fiscal al cumpărătorului la cererea acestuia. 30 de zile pentru conformare.",
          after: "Citit într-un minut, iar munca la imprimanta fiscală poate începe azi.",
          done: "Aceasta este româna — limba de stat a Moldovei. În ea vin legile, scrisorile fiscului și regulile de fiscalizare, iar un termen nu așteaptă traducătorul." },
  });

  /* Английский — «Ошибка в три часа ночи». Ответ существует, но написан
     по-английски: без языка до него не добраться. */
  add("lang_en", function (area, api) {
    var opened = false;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__terminal">SerialPort: timeout waiting for ACK after 3000ms</div>' +
        (opened
          ? '<div class="sg__doc"><b>stackoverflow.com</b><p>The device answers only after the ' +
            'host raises DTR. Set DTR before opening the stream, then wait 200ms before the first ' +
            'write — otherwise the first ACK is lost and every read times out.</p></div>'
          : "") +
        lead(msg || t("lang_en", opened ? "solved" : "intro")) +
        row(opened ? "" :
          '<button class="sg__step" data-ru>' + t("lang_en", "searchRu") + "</button>" +
          '<button class="sg__step is-next" data-en>' + t("lang_en", "searchEn") + "</button>");

      on(area, "[data-ru]", function () { render(t("lang_en", "nothingRu")); });
      on(area, "[data-en]", function () { opened = true; render(""); api.finish(); });
    }
    render("");
  }, {
    en: { title: "An error at three in the morning",
          task: "The terminal will not answer and the shop opens at eight. Find out why.",
          intro: "Somebody has hit this before. The question is where they wrote it down.",
          searchRu: "search in your own language", searchEn: "search in English",
          nothingRu: "Four results, all of them somebody asking the same thing and nobody answering.",
          solved: "The answer was written six years ago by a stranger, in English, and it is exactly this case.",
          done: "This is English — the working language. Documentation, error messages and the one person who already solved your problem are all in it." },
    ru: { title: "Ошибка в три часа ночи",
          task: "Терминал не отвечает, а магазин открывается в восемь. Выясни почему.",
          intro: "Кто-то на это уже натыкался. Вопрос в том, где он это записал.",
          searchRu: "искать на своём языке", searchEn: "искать по-английски",
          nothingRu: "Четыре результата, и во всех кто-то спрашивает то же самое, а ответа нет.",
          solved: "Ответ написал незнакомый человек шесть лет назад, по-английски, и это ровно твой случай.",
          done: "Это английский — рабочий язык. На нём документация, на нём текст ошибки и на нём тот единственный человек, который уже решил твою задачу." },
    ro: { title: "O eroare la trei dimineața",
          task: "Terminalul nu răspunde, iar magazinul se deschide la opt. Află de ce.",
          intro: "Cineva s-a lovit deja de asta. Întrebarea e unde a scris-o.",
          searchRu: "caută în limba ta", searchEn: "caută în engleză",
          nothingRu: "Patru rezultate și în toate cineva întreabă același lucru, iar răspuns nu e.",
          solved: "Răspunsul a fost scris acum șase ani de un necunoscut, în engleză, și e exact cazul tău.",
          done: "Aceasta este engleza — limba de lucru. În ea sunt documentația, textul erorii și singurul om care ți-a rezolvat deja problema." },
  });

  /* Арабский — «Другая письменность». Базовый уровень честно показан как
     он есть: буквы узнаёшь и смысл ловишь, договор подписывать не берёшься. */
  add("lang_ar", function (area, api) {
    var WORDS = [
      { ar: "مطعم", k: "food" },
      { ar: "صيدلية", k: "pharm" },
      { ar: "مخرج", k: "exit" },
    ];
    var i = 0;

    function render(msg) {
      if (i >= WORDS.length) {
        area.innerHTML = lead(t("lang_ar", "limit"));
        return api.finish();
      }
      var cur = WORDS[i];
      area.innerHTML =
        '<div class="sg__sign-ar">' + cur.ar + "</div>" +
        lead(msg || t("lang_ar", "intro")) +
        row(["food", "pharm", "exit"].map(function (k) {
          return '<button class="sg__step" data-k="' + k + '">' + t("lang_ar", "w_" + k) + "</button>";
        }).join(""));

      on(area, ".sg__step", function (b) {
        if (b.dataset.k !== cur.k) return render(t("lang_ar", "nope"));
        i++; render(t("lang_ar", "yes"));
      });
    }
    render("");
  }, {
    en: { title: "A different alphabet",
          task: "Three signs on a street in the Gulf. Read them.",
          intro: "It runs right to left and none of the letters are familiar. What does this one say?",
          w_food: "restaurant", w_pharm: "pharmacy", w_exit: "exit",
          nope: "Not that one. Look at the shape again.",
          yes: "That one. Next.",
          limit: "Signs, menus, a greeting and a thank-you — that is the honest size of it. A contract in Arabic still goes to a translator.",
          done: "This is Arabic at a basic level. Enough to find the exit and be polite to a client from the Gulf; not enough to sign anything." },
    ru: { title: "Другая письменность",
          task: "Три вывески на улице в Персидском заливе. Прочитай их.",
          intro: "Читается справа налево, и ни одна буква не знакома. Что здесь написано?",
          w_food: "ресторан", w_pharm: "аптека", w_exit: "выход",
          nope: "Не эта. Посмотри на начертание ещё раз.",
          yes: "Она. Дальше.",
          limit: "Вывески, меню, поздороваться и поблагодарить — вот честный размер этого знания. Договор на арабском всё равно уходит переводчику.",
          done: "Это арабский на базовом уровне. Хватает найти выход и вежливо ответить клиенту из Залива; подписывать что-либо — не хватает." },
    ro: { title: "Alt alfabet",
          task: "Trei firme pe o stradă din Golf. Citește-le.",
          intro: "Se citește de la dreapta la stânga și nicio literă nu e cunoscută. Ce scrie aici?",
          w_food: "restaurant", w_pharm: "farmacie", w_exit: "ieșire",
          nope: "Nu aceea. Mai uită-te o dată la formă.",
          yes: "Aceea. Mai departe.",
          limit: "Firme, meniuri, un salut și o mulțumire — asta e mărimea cinstită a cunoștințelor. Un contract în arabă tot la traducător ajunge.",
          done: "Aceasta este araba la nivel de bază. Ajunge să găsești ieșirea și să răspunzi politicos unui client din Golf; să semnezi ceva — nu ajunge." },
  });

  /* Украинский — «Ложные друзья». Похоже на русский ровно настолько, чтобы
     ошибиться: базовый уровень — это узнавание ловушек, а не свободная речь. */
  add("lang_uk", function (area, api) {
    var TRAPS = [
      { w: "неділя", right: "sunday" },
      { w: "місто", right: "city" },
      { w: "година", right: "hour" },
    ];
    var i = 0;

    function render(msg) {
      if (i >= TRAPS.length) {
        area.innerHTML = lead(t("lang_uk", "limit"));
        return api.finish();
      }
      var cur = TRAPS[i];
      area.innerHTML =
        '<div class="sg__word">«' + cur.w + "»</div>" +
        lead(msg || t("lang_uk", "intro")) +
        row(["guess_" + cur.right, "wrong_" + cur.right].sort().map(function (k) {
          return '<button class="sg__step" data-k="' + k + '">' + t("lang_uk", k) + "</button>";
        }).join(""));

      on(area, ".sg__step", function (b) {
        if (b.dataset.k.indexOf("guess_") !== 0) return render(t("lang_uk", "trap_" + cur.right));
        i++; render(t("lang_uk", "yes"));
      });
    }
    render("");
  }, {
    en: { title: "False friends",
          task: "Ukrainian looks close enough to Russian to trip you up. Three words, three traps.",
          intro: "What does this word mean?",
          guess_sunday: "Sunday", wrong_sunday: "a week",
          guess_city: "a city", wrong_city: "a place",
          guess_hour: "an hour", wrong_hour: "a year",
          trap_sunday: "No — that is the trap. It looks like the Russian for “week”, but it means Sunday.",
          trap_city: "No — it looks like the Russian for “place”, but it means a city.",
          trap_hour: "No — it looks like the Russian for “year”, but it means an hour.",
          yes: "Right. Next.",
          limit: "Enough to read a letter and not book a meeting on the wrong day. Writing in it still needs checking.",
          done: "This is Ukrainian at a basic level. Close enough to Russian to read, and close enough to be dangerous — the value is knowing where it lies." },
    ru: { title: "Ложные друзья",
          task: "Украинский похож на русский ровно настолько, чтобы подставить. Три слова, три ловушки.",
          intro: "Что означает это слово?",
          guess_sunday: "воскресенье", wrong_sunday: "неделя",
          guess_city: "город", wrong_city: "место",
          guess_hour: "час", wrong_hour: "год",
          trap_sunday: "Нет — это и есть ловушка. Похоже на «неделю», а значит «воскресенье».",
          trap_city: "Нет — похоже на «место», а значит «город».",
          trap_hour: "Нет — похоже на «год», а значит «час».",
          yes: "Верно. Дальше.",
          limit: "Хватает прочитать письмо и не назначить встречу не на тот день. Писать самому — всё равно с проверкой.",
          done: "Это украинский на базовом уровне. Достаточно близок к русскому, чтобы читать, и достаточно близок, чтобы подвести — ценность в том, чтобы знать, где именно." },
    ro: { title: "Prieteni falși",
          task: "Ucraineana seamănă cu rusa exact atât cât să te încurce. Trei cuvinte, trei capcane.",
          intro: "Ce înseamnă cuvântul acesta?",
          guess_sunday: "duminică", wrong_sunday: "săptămână",
          guess_city: "oraș", wrong_city: "loc",
          guess_hour: "oră", wrong_hour: "an",
          trap_sunday: "Nu — asta e capcana. Seamănă cu „săptămână” în rusă, dar înseamnă duminică.",
          trap_city: "Nu — seamănă cu „loc” în rusă, dar înseamnă oraș.",
          trap_hour: "Nu — seamănă cu „an” în rusă, dar înseamnă oră.",
          yes: "Corect. Mai departe.",
          limit: "Ajunge să citești o scrisoare și să nu fixezi o întâlnire în ziua greșită. Scrisul tot cu verificare rămâne.",
          done: "Aceasta este ucraineana la nivel de bază. Destul de aproape de rusă cât să citești și destul de aproape cât să te încurce — valoarea e să știi exact unde." },
  });
})();
