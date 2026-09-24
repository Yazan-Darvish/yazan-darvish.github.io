/* Мини-игры: блок «Python».
   Механики и тексты трёх языков лежат рядом: домен владеет и поведением,
   и своими словами. Регистрируется в ядре через SkillGames.add(). */

(function () {
  "use strict";

  var S = window.SkillGames;
  var add = S.add, t = S.t, ui = S.ui;
  var row = S.row, lead = S.lead, count = S.count, on = S.on, later = S.later;

  /* ======================================================== блок Python === */

  /* OpenAI API — «Спроси у всезнайки». Одна и та же загадка, три источника
     ответа: сосед не знает, словарь ищет буквы, всезнайка отвечает сразу. */
  add("openai", function (area, api) {
    var asked = [];

    function render(answer) {
      area.innerHTML =
        '<div class="sg__riddle">🐙</div>' +
        lead(t("openai", "riddle")) +
        row(["neighbour", "book", "ai"].map(function (k) {
          return '<button class="sg__step' + (asked.indexOf(k) >= 0 ? " is-done" : "") +
                 '" data-k="' + k + '">' + t("openai", "src_" + k) + "</button>";
        }).join("")) +
        (answer ? '<p class="sg__answer">' + answer + "</p>" : "");

      on(area, ".sg__step", function (b) {
        var k = b.dataset.k;
        if (asked.indexOf(k) < 0) asked.push(k);
        render(t("openai", "ans_" + k));
        if (k === "ai") api.finish();
      });
    }
    render("");
  }, {
    en: { title: "Ask the know-it-all",
          task: "You found this creature in a picture. Nobody around knows what it is. Ask three sources.",
          riddle: "What is it, and how many hearts does it have?",
          src_neighbour: "ask a neighbour", src_book: "look in a dictionary", src_ai: "ask the know-it-all",
          ans_neighbour: "“Some sea thing. No idea about hearts.”",
          ans_book: "The dictionary lists words by letter. You do not know the word, so there is nothing to look up.",
          ans_ai: "“An octopus. It has three hearts: two pump blood through the gills, one through the body.”",
          done: "This is the OpenAI API. You ask in plain words — even without knowing the right word — and get an answer back in plain words." },
    ru: { title: "Спроси у всезнайки",
          task: "Ты нашёл это существо на картинке. Никто вокруг не знает, кто это. Спроси у трёх источников.",
          riddle: "Кто это и сколько у него сердец?",
          src_neighbour: "спросить соседа", src_book: "посмотреть в словаре", src_ai: "спросить у всезнайки",
          ans_neighbour: "«Какая-то морская штука. Про сердца не знаю.»",
          ans_book: "В словаре слова стоят по буквам. Ты не знаешь слова — искать нечего.",
          ans_ai: "«Осьминог. У него три сердца: два гонят кровь через жабры, одно — по телу.»",
          done: "Это OpenAI API. Спрашиваешь обычными словами — даже не зная нужного слова — и обычными словами получаешь ответ." },
    ro: { title: "Întreabă atoateștiutorul",
          task: "Ai găsit creatura asta într-o poză. Nimeni din jur nu știe ce e. Întreabă trei surse.",
          riddle: "Ce este și câte inimi are?",
          src_neighbour: "întreabă vecinul", src_book: "caută în dicționar", src_ai: "întreabă atoateștiutorul",
          ans_neighbour: "„Ceva din mare. Despre inimi nu știu.”",
          ans_book: "Dicționarul ține cuvintele pe litere. Nu știi cuvântul, deci nu ai ce căuta.",
          ans_ai: "„O caracatiță. Are trei inimi: două trimit sânge prin branhii, una prin corp.”",
          done: "Acesta este OpenAI API. Întrebi cu vorbe obișnuite — chiar fără să știi cuvântul — și primești răspuns tot în vorbe obișnuite." },
  });

  /* RAG — «Шпаргалка». По памяти всезнайка отвечает наугад: про этот магазин
     он ничего не знает. Дай ему папку с документами — ответит точно. */
  add("rag", function (area, api) {
    var DOCS = ["menu", "prices", "hours"];
    var stage = "memory";

    function render(answer, wrong) {
      area.innerHTML =
        lead(t("rag", "question")) +
        (stage === "memory"
          ? row('<button class="sg__step is-next" data-guess>' + t("rag", "fromMemory") + "</button>")
          : '<p class="sg__lead">' + t("rag", "pickDoc") + "</p>" +
            row(DOCS.map(function (k) {
              return '<button class="sg__step" data-k="' + k + '">📄 ' + t("rag", "doc_" + k) + "</button>";
            }).join(""))) +
        (answer ? '<p class="sg__answer' + (wrong ? " is-wrong" : "") + '">' + answer + "</p>" : "");

      on(area, "[data-guess]", function () {
        stage = "docs";
        render(t("rag", "guess"), true);
      });
      on(area, "[data-k]", function (b) {
        if (b.dataset.k !== "prices") return render(t("rag", "wrongDoc"), true);
        render(t("rag", "right"), false);
        api.finish();
      });
    }
    render("", false);
  }, {
    en: { title: "The cheat sheet",
          task: "A customer asks about your shop. The know-it-all has never heard of your shop.",
          question: "“How much is delivery to Bălți?”",
          fromMemory: "answer from memory",
          guess: "“Usually somewhere around 50–200 lei.” — A guess. It has never seen your price list.",
          pickDoc: "Now hand it the folder. Which paper holds the answer?",
          doc_menu: "product list", doc_prices: "delivery prices", doc_hours: "opening hours",
          wrongDoc: "The answer is not on that paper.",
          right: "“Delivery to Bălți — 79 lei, free over 1500 lei.” — Straight out of your own document.",
          done: "This is RAG. The know-it-all is handed your papers before it answers, so it stops guessing and quotes your facts." },
    ru: { title: "Шпаргалка",
          task: "Покупатель спрашивает про твой магазин. Всезнайка про твой магазин ничего не слышал.",
          question: "«Сколько стоит доставка в Бельцы?»",
          fromMemory: "ответить по памяти",
          guess: "«Обычно где-то 50–200 лей.» — Это догадка. Твой прайс он никогда не видел.",
          pickDoc: "Теперь дай ему папку. В какой бумаге лежит ответ?",
          doc_menu: "список товаров", doc_prices: "цены доставки", doc_hours: "часы работы",
          wrongDoc: "В этой бумаге ответа нет.",
          right: "«Доставка в Бельцы — 79 лей, от 1500 лей бесплатно.» — Прямо из твоего документа.",
          done: "Это RAG. Всезнайке сначала дают твои бумаги, и он перестаёт гадать — отвечает твоими фактами." },
    ro: { title: "Fițuica",
          task: "Un client întreabă despre magazinul tău. Atoateștiutorul n-a auzit niciodată de el.",
          question: "„Cât costă livrarea la Bălți?”",
          fromMemory: "răspunde din memorie",
          guess: "„De obicei undeva la 50–200 lei.” — O presupunere. Nu ți-a văzut niciodată lista de prețuri.",
          pickDoc: "Acum dă-i dosarul. În care hârtie stă răspunsul?",
          doc_menu: "lista produselor", doc_prices: "prețurile de livrare", doc_hours: "programul",
          wrongDoc: "În hârtia aceea nu e răspunsul.",
          right: "„Livrare la Bălți — 79 lei, gratuit peste 1500 lei.” — Direct din documentul tău.",
          done: "Acesta este RAG. Atoateștiutorului i se dau întâi hârtiile tale, așa că nu mai ghicește — citează faptele tale." },
  });

  /* Векторный поиск — «Похожие вещи». По буквам рядом оказывается чужое,
     по смыслу — то, что человек и правда искал. */
  add("vector", function (area, api) {
    var ITEMS = [
      { k: "cupRed", near: true }, { k: "lace" }, { k: "cupboard" },
      { k: "mugRed", near: true }, { k: "cupcake" }, { k: "hammer" },
    ];
    var mode = null;

    function render(msg) {
      var hi = mode === "smart" ? function (i) { return i.near; }
             : mode === "letters" ? function (i) { return /^cup/.test(i.k); }
             : function () { return false; };
      area.innerHTML =
        '<div class="sg__sample">' + t("vector", "sample") + "</div>" +
        '<div class="sg__grid">' + ITEMS.map(function (i) {
          return '<div class="sg__part' + (hi(i) ? " is-on" : "") + '">' +
                 t("vector", "it_" + i.k) + "</div>";
        }).join("") + "</div>" +
        row('<button class="sg__step' + (mode === "letters" ? " is-done" : "") + '" data-m="letters">' +
              t("vector", "byLetters") + "</button>" +
            '<button class="sg__step' + (mode === "smart" ? " is-done" : "") + '" data-m="smart">' +
              t("vector", "byMeaning") + "</button>") +
        (msg ? '<p class="sg__answer">' + msg + "</p>" : "");

      on(area, ".sg__step", function (b) {
        mode = b.dataset.m;
        render(t("vector", mode === "letters" ? "letters" : "meaning"));
        if (mode === "smart") api.finish();
      });
    }
    render("");
  }, {
    en: { title: "Similar things",
          task: "You are looking for something like the red cup. Try both ways of searching.",
          sample: "looking for: 🔴 a red cup",
          it_cupRed: "red cup", it_lace: "lace", it_cupboard: "cupboard",
          it_mugRed: "red mug", it_cupcake: "cupcake", it_hammer: "hammer",
          byLetters: "search by letters", byMeaning: "search by meaning",
          letters: "By letters you get cupboard and cupcake — same three letters, nothing else in common.",
          meaning: "By meaning you get the red mug: different word, same thing in your hand.",
          done: "This is vector search. It compares what things are, not how they are spelled." },
    ru: { title: "Похожие вещи",
          task: "Ты ищешь что-то вроде красной кружки. Попробуй оба способа искать.",
          sample: "ищем: 🔴 красная кружка",
          it_cupRed: "красная кружка", it_lace: "кружево", it_cupboard: "кружок",
          it_mugRed: "красная чашка", it_cupcake: "кружка пива", it_hammer: "молоток",
          byLetters: "искать по буквам", byMeaning: "искать по смыслу",
          letters: "По буквам выпадают кружево и кружок — те же буквы, и больше ничего общего.",
          meaning: "По смыслу выпадает красная чашка: слово другое, а вещь в руке та же.",
          done: "Это векторный поиск. Он сравнивает, чем вещи являются, а не как они пишутся." },
    ro: { title: "Lucruri asemănătoare",
          task: "Cauți ceva ca ceașca roșie. Încearcă ambele feluri de căutare.",
          sample: "căutăm: 🔴 o ceașcă roșie",
          it_cupRed: "ceașcă roșie", it_lace: "dantelă", it_cupboard: "dulap",
          it_mugRed: "cană roșie", it_cupcake: "brioșă", it_hammer: "ciocan",
          byLetters: "caută după litere", byMeaning: "caută după înțeles",
          letters: "După litere ies dulap și brioșă — aceleași litere și nimic altceva în comun.",
          meaning: "După înțeles iese cana roșie: alt cuvânt, același lucru în mână.",
          done: "Aceasta este căutarea vectorială. Compară ce sunt lucrurile, nu cum se scriu." },
  });

  /* LLM в продакшене — «Ночная смена». В демо три вопроса, на настоящем
     сайте они идут потоком и не прекращаются. */
  add("llmprod", function (area, api) {
    var TOTAL = 12, shown = 0, answered = 0, missed = 0, live = null;

    function render() {
      area.innerHTML =
        lead(t("llmprod", "shift")) +
        '<div class="sg__stage">' +
          (live ? '<button class="sg__bubble" data-q>' + live + "</button>"
                : '<span class="sg__empty">…</span>') +
        "</div>" +
        count(t("llmprod", "score")
          .replace("{a}", answered).replace("{m}", missed).replace("{t}", TOTAL));

      on(area, "[data-q]", function () { answered++; live = null; render(); });
    }

    function step() {
      if (shown >= TOTAL) {
        area.innerHTML = lead(t("llmprod", answered >= TOTAL - 2 ? "win" : "lose")
          .replace("{a}", answered).replace("{m}", missed));
        return api.finish();
      }
      if (live) missed++;
      shown++;
      live = t("llmprod", "q" + ((shown % 4) + 1));
      render();
      later(step, Math.max(420, 900 - shown * 40));   // поток ускоряется
    }

    render();
    later(step, 500);
  }, {
    en: { title: "The night shift",
          task: "Questions keep coming. Answer each one before the next arrives.",
          shift: "03:40. The shop is closed, the questions are not.",
          q1: "“Is it in stock?”", q2: "“When will it arrive?”",
          q3: "“Can I pay by card?”", q4: "“Does it fit my model?”",
          score: "Answered {a}, missed {m}, of {t}",
          win: "{a} answered, {m} missed. You held the night — and this is every night.",
          lose: "{a} answered, {m} missed. A person cannot keep this up until morning.",
          done: "This is an LLM in production. Not three questions in a demo — a stream that never stops, all night, every night." },
    ru: { title: "Ночная смена",
          task: "Вопросы идут один за другим. Успевай ответить до того, как придёт следующий.",
          shift: "03:40. Магазин закрыт, а вопросы — нет.",
          q1: "«Есть в наличии?»", q2: "«Когда привезут?»",
          q3: "«Картой можно?»", q4: "«К моей модели подойдёт?»",
          score: "Отвечено {a}, упущено {m}, всего {t}",
          win: "Отвечено {a}, упущено {m}. Ночь выдержана — и так каждую ночь.",
          lose: "Отвечено {a}, упущено {m}. Человек столько до утра не вытянет.",
          done: "Это LLM в продакшене. Не три вопроса в демо, а поток, который не прекращается всю ночь и каждую ночь." },
    ro: { title: "Tura de noapte",
          task: "Întrebările vin una după alta. Răspunde înainte să apară următoarea.",
          shift: "03:40. Magazinul e închis, întrebările nu.",
          q1: "„Este în stoc?”", q2: "„Când se aduce?”",
          q3: "„Pot plăti cu cardul?”", q4: "„Se potrivește la modelul meu?”",
          score: "Răspunse {a}, ratate {m}, din {t}",
          win: "{a} răspunse, {m} ratate. Ai ținut noaptea — și așa în fiecare noapte.",
          lose: "{a} răspunse, {m} ratate. Un om nu rezistă așa până dimineață.",
          done: "Acesta este un LLM în producție. Nu trei întrebări într-un demo, ci un flux care nu se oprește toată noaptea, în fiecare noapte." },
  });

  /* AI-ассистент — «Ночной покупатель». Один и тот же диалог с живым
     продавцом, который спит, и с помощником, который не спит. */
  add("aiassist", function (area, api) {
    var chat = [], stage = 0;

    function say(who, key) { chat.push({ who: who, text: t("aiassist", key) }); }

    function render(buttons) {
      area.innerHTML =
        '<div class="sg__chat">' + chat.map(function (m) {
          return '<div class="sg__msg sg__msg--' + m.who + '">' + m.text + "</div>";
        }).join("") + "</div>" + row(buttons);
      on(area, ".sg__step", function (b) { pick(b.dataset.k); });
    }

    function pick(k) {
      if (stage === 0) {
        if (k === "sleep") {
          say("shop", "morning"); say("buyer", "gone");
          stage = 1;
          return render('<button class="sg__step is-next" data-k="retry">' +
                        t("aiassist", "retry") + "</button>");
        }
        say("shop", "answer"); say("buyer", "buys");
        render("");
        return api.finish();
      }
      chat = []; stage = 0; start();
    }

    function start() {
      say("buyer", "ask");
      render('<button class="sg__step" data-k="sleep">' + t("aiassist", "btnSleep") + "</button>" +
             '<button class="sg__step is-next" data-k="bot">' + t("aiassist", "btnBot") + "</button>");
    }
    start();
  }, {
    en: { title: "The night customer",
          task: "Someone is writing at 02:15. The seller is asleep. You decide what happens.",
          ask: "“Hi! Is the blue one in stock, and does it fit a 2019 model?”",
          btnSleep: "let the seller sleep", btnBot: "let the helper answer",
          morning: "“Good morning! Yes, it is in stock.” — sent at 09:40",
          gone: "“Thanks, I already bought it somewhere else last night.”",
          answer: "“Yes, the blue one is in stock, and it fits the 2019 model. Shall I reserve it?”",
          buys: "“Great, reserve it!” — 02:16, order placed",
          retry: "try the other way",
          done: "This is an AI assistant. The customer does not wait until morning, because somebody answers at two in the morning." },
    ru: { title: "Ночной покупатель",
          task: "Человек пишет в 02:15. Продавец спит. Решать тебе.",
          ask: "«Здравствуйте! Синий есть в наличии и подойдёт к модели 2019 года?»",
          btnSleep: "дать продавцу поспать", btnBot: "пусть ответит помощник",
          morning: "«Доброе утро! Да, в наличии есть.» — отправлено в 09:40",
          gone: "«Спасибо, я уже ночью купил в другом месте.»",
          answer: "«Да, синий в наличии и к модели 2019 подходит. Отложить для вас?»",
          buys: "«Отлично, откладывайте!» — 02:16, заказ оформлен",
          retry: "попробовать по-другому",
          done: "Это AI-ассистент. Покупатель не ждёт до утра, потому что в два часа ночи ему кто-то отвечает." },
    ro: { title: "Clientul de noapte",
          task: "Cineva scrie la 02:15. Vânzătorul doarme. Tu decizi ce urmează.",
          ask: "„Bună! Cel albastru este în stoc și se potrivește la modelul din 2019?”",
          btnSleep: "lasă vânzătorul să doarmă", btnBot: "lasă asistentul să răspundă",
          morning: "„Bună dimineața! Da, este în stoc.” — trimis la 09:40",
          gone: "„Mulțumesc, am cumpărat deja azi-noapte din altă parte.”",
          answer: "„Da, cel albastru este în stoc și se potrivește la modelul din 2019. Îl rezerv?”",
          buys: "„Perfect, rezervă-l!” — 02:16, comandă plasată",
          retry: "încearcă altfel",
          done: "Acesta este un asistent AI. Clientul nu așteaptă până dimineața, pentru că la două noaptea cineva îi răspunde." },
  });

  /* AI-поиск — «Найди по описанию». Человек не помнит названия, зато знает,
     чего хочет: обычный поиск на это не отвечает, умный — отвечает. */
  add("aisearch", function (area, api) {
    var QUERY = "";

    function render(mode) {
      var found =
        mode === "plain"
          ? '<p class="sg__answer is-wrong">' + t("aisearch", "nothing") + "</p>"
          : mode === "smart"
            ? '<div class="sg__grid">' + ["hat", "scarf", "socks"].map(function (k) {
                return '<div class="sg__part is-on">' + t("aisearch", "it_" + k) + "</div>";
              }).join("") + "</div>"
            : "";

      area.innerHTML =
        lead(t("aisearch", "shelf")) +
        '<div class="sg__search">' + (QUERY || t("aisearch", "query")) + "</div>" +
        row('<button class="sg__step' + (mode === "plain" ? " is-done" : "") + '" data-m="plain">' +
              t("aisearch", "plain") + "</button>" +
            '<button class="sg__step' + (mode === "smart" ? " is-done" : "") + '" data-m="smart">' +
              t("aisearch", "smart") + "</button>") +
        found;

      on(area, ".sg__step", function (b) {
        render(b.dataset.m);
        if (b.dataset.m === "smart") api.finish();
      });
    }
    render(null);
  }, {
    en: { title: "Find it by description",
          task: "You do not remember what the thing is called. You only know what you want it for.",
          shelf: "The shop has 1.5 million items. None of them is called “something warm”.",
          query: "“something warm for winter”",
          plain: "ordinary search", smart: "smart search",
          nothing: "Nothing found. No product has those words in its name.",
          it_hat: "wool hat", it_scarf: "scarf", it_socks: "thermal socks",
          done: "This is AI search. The customer describes the need in their own words, and the shop still understands." },
    ru: { title: "Найди по описанию",
          task: "Ты не помнишь, как эта вещь называется. Ты знаешь только, зачем она нужна.",
          shelf: "В магазине полтора миллиона товаров. Ни один не называется «что-нибудь тёплое».",
          query: "«что-нибудь тёплое на зиму»",
          plain: "обычный поиск", smart: "умный поиск",
          nothing: "Ничего не найдено. Ни у одного товара таких слов в названии нет.",
          it_hat: "шапка шерстяная", it_scarf: "шарф", it_socks: "термоноски",
          done: "Это AI-поиск. Покупатель описывает нужду своими словами, а магазин всё равно понимает." },
    ro: { title: "Găsește după descriere",
          task: "Nu mai știi cum se numește lucrul. Știi doar la ce îți trebuie.",
          shelf: "Magazinul are 1,5 milioane de produse. Niciunul nu se numește „ceva cald”.",
          query: "„ceva cald pentru iarnă”",
          plain: "căutare obișnuită", smart: "căutare inteligentă",
          nothing: "Nimic găsit. Niciun produs nu are cuvintele astea în denumire.",
          it_hat: "căciulă de lână", it_scarf: "fular", it_socks: "șosete termice",
          done: "Aceasta este căutarea AI. Clientul descrie nevoia cu vorbele lui, iar magazinul tot înțelege." },
  });
})();
