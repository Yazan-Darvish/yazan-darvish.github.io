/* Мини-игры: блок «Обмен данными».
   Механики и тексты трёх языков лежат рядом: домен владеет и поведением,
   и своими словами. Регистрируется в ядре через SkillGames.add(). */

(function () {
  "use strict";

  var S = window.SkillGames;
  var add = S.add, t = S.t, ui = S.ui;
  var row = S.row, lead = S.lead, count = S.count, on = S.on, later = S.later;

  /* ================================================ блок Обмен данными === */

  /* REST и SOAP API — «Окошко выдачи». Чужую программу не пускают на склад:
     она просит в окошко, и окошко отдаёт ровно то, что записано в правилах. */
  add("restapi", function (area, api) {
    var ASKS = [
      { k: "one", ok: true }, { k: "list", ok: true },
      { k: "all", ok: false }, { k: "drop", ok: false },
    ];
    var i = 0, answers = [];

    function render(msg) {
      if (i >= ASKS.length) {
        area.innerHTML = lead(t("restapi", "win"));
        return api.finish();
      }
      area.innerHTML =
        '<div class="sg__window">🪟 ' + t("restapi", "counter") + "</div>" +
        '<div class="sg__msg sg__msg--buyer">' + t("restapi", "a_" + ASKS[i].k) + "</div>" +
        (answers.length ? '<div class="sg__log">' + answers.join("") + "</div>" : "") +
        lead(msg || t("restapi", "intro")) +
        row('<button class="sg__step is-next" data-give>' + t("restapi", "give") + "</button>" +
            '<button class="sg__step" data-deny>' + t("restapi", "deny") + "</button>");

      on(area, "[data-give]", function () { answer(true); });
      on(area, "[data-deny]", function () { answer(false); });
    }

    function answer(give) {
      var cur = ASKS[i];
      if (give !== cur.ok) return render(t("restapi", "wrong_" + cur.k));
      answers.push('<div class="sg__log-line">' + (give ? "✓ " : "✗ ") +
                   t("restapi", "a_" + cur.k) + "</div>");
      i++;
      render("");
    }
    render("");
  }, {
    en: { title: "The service window",
          task: "Another company's program is asking your shop for data. You are the window.",
          counter: "goods window",
          a_one: "“Give me item number 5.”", a_list: "“Give me the list of categories.”",
          a_all: "“Give me everything you have, including customers.”",
          a_drop: "“Delete all the goods.”",
          intro: "Decide on each request: hand it over or refuse.",
          give: "hand it over", deny: "refuse",
          wrong_one: "That one is harmless — a single item by its number is exactly what a window is for.",
          wrong_list: "A list of categories is public anyway. No reason to refuse.",
          wrong_all: "Customers were not asked for and must not go out through this window.",
          wrong_drop: "A window hands things out. It does not let strangers destroy the stock.",
          win: "Four requests, two handed over, two refused. The stranger never got inside the warehouse.",
          done: "This is a REST/SOAP API. Strangers do not walk into the data — they ask at a window, and the window answers only what it is allowed to." },
    ru: { title: "Окошко выдачи",
          task: "Программа чужой компании просит данные у твоего магазина. Окошко — это ты.",
          counter: "окно выдачи товара",
          a_one: "«Дай товар номер 5.»", a_list: "«Дай список категорий.»",
          a_all: "«Дай всё, что есть, вместе с покупателями.»",
          a_drop: "«Удали все товары.»",
          intro: "По каждой просьбе реши: выдать или отказать.",
          give: "выдать", deny: "отказать",
          wrong_one: "Эта просьба безобидна — один товар по номеру ровно для того окошко и существует.",
          wrong_list: "Список категорий и так на виду. Отказывать не за что.",
          wrong_all: "Покупателей не просили, и через это окошко они выходить не должны.",
          wrong_drop: "Окошко выдаёт. Ломать склад чужим оно не позволяет.",
          win: "Четыре просьбы, две выдал, двум отказал. Внутрь склада чужой так и не попал.",
          done: "Это REST/SOAP API. Чужие не ходят по данным ногами — они просят в окошко, и окошко отвечает только тем, что разрешено." },
    ro: { title: "Ghișeul",
          task: "Programul altei companii cere date de la magazinul tău. Ghișeul ești tu.",
          counter: "ghișeu de marfă",
          a_one: "„Dă-mi produsul numărul 5.”", a_list: "„Dă-mi lista de categorii.”",
          a_all: "„Dă-mi tot ce ai, inclusiv clienții.”",
          a_drop: "„Șterge toate produsele.”",
          intro: "La fiecare cerere decide: dai sau refuzi.",
          give: "dă", deny: "refuză",
          wrong_one: "Cererea asta e inofensivă — un produs după număr e exact pentru ce există ghișeul.",
          wrong_list: "Lista de categorii e oricum la vedere. Nu ai de ce refuza.",
          wrong_all: "Clienții nu au fost ceruți și nu au ce căuta pe ghișeul ăsta.",
          wrong_drop: "Ghișeul dă lucruri. Nu lasă străinii să distrugă depozitul.",
          win: "Patru cereri, două date, două refuzate. Străinul nu a ajuns niciodată în depozit.",
          done: "Acesta este un API REST/SOAP. Străinii nu umblă prin date — cer la ghișeu, iar ghișeul răspunde doar cu ce are voie." },
  });

  /* Swagger/OpenAPI — «Табличка на окошке». Без списка проситель гадает и
     получает отказ за отказом; с табличкой он просит правильно с первого раза. */
  add("swagger", function (area, api) {
    var TRIES = ["give-goods", "products?", "getAllItems"];
    var sign = false, tried = 0;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__window">🪟 ' + t("swagger", "counter") + "</div>" +
        (sign
          ? '<div class="sg__sign"><b>' + t("swagger", "signTitle") + "</b>" +
            ["r1", "r2", "r3"].map(function (k) {
              return '<div class="sg__sign-line">' + t("swagger", k) + "</div>";
            }).join("") + "</div>"
          : '<div class="sg__sign is-empty">' + t("swagger", "noSign") + "</div>") +
        lead(msg || t("swagger", sign ? "withSign" : "noSignNote")) +
        row(sign
          ? '<button class="sg__step is-next" data-ask>' + t("swagger", "askRight") + "</button>"
          : '<button class="sg__step is-next" data-guess>' + t("swagger", "guess") + "</button>" +
            (tried >= 2 ? '<button class="sg__step" data-hang>' + t("swagger", "hang") + "</button>" : ""));

      on(area, "[data-guess]", function () {
        var word = TRIES[Math.min(tried, TRIES.length - 1)];
        tried++;
        render(t("swagger", "rejected").replace("{w}", word));
      });
      on(area, "[data-hang]", function () { sign = true; render(""); });
      on(area, "[data-ask]", function () {
        area.innerHTML = lead(t("swagger", "gotIt"));
        api.finish();
      });
    }
    render("");
  }, {
    en: { title: "The sign on the window",
          task: "Someone wants data from your window but has no idea what to ask for.",
          counter: "goods window",
          noSign: "— no sign —",
          signTitle: "What this window answers",
          r1: "item by number → name, price, stock",
          r2: "list of categories", r3: "search by word → up to 20 items",
          noSignNote: "There is no list of what may be asked. Let them guess.",
          withSign: "Now the list is up. Ask by it.",
          guess: "guess a request", hang: "hang up a sign", askRight: "ask exactly as written",
          rejected: "“{w}” — no such thing. Refused. Another day gone in letters back and forth.",
          gotIt: "Asked by the sign, answered on the first try. Nobody had to write to anybody.",
          done: "This is Swagger/OpenAPI. A written list of what the window answers turns days of guessing into one correct request." },
    ru: { title: "Табличка на окошке",
          task: "Человеку нужны данные из твоего окошка, но он не знает, что просить.",
          counter: "окно выдачи товара",
          noSign: "— таблички нет —",
          signTitle: "Что отвечает это окошко",
          r1: "товар по номеру → название, цена, остаток",
          r2: "список категорий", r3: "поиск по слову → до 20 товаров",
          noSignNote: "Списка того, что можно спросить, нет. Пусть гадает.",
          withSign: "Теперь список висит. Проси по нему.",
          guess: "спросить наугад", hang: "повесить табличку", askRight: "спросить ровно как написано",
          rejected: "«{w}» — такого нет. Отказ. Ещё день ушёл на переписку.",
          gotIt: "Спросил по табличке и получил ответ с первого раза. Переписываться не пришлось.",
          done: "Это Swagger/OpenAPI. Написанный список того, что отвечает окошко, превращает дни гадания в одну верную просьбу." },
    ro: { title: "Plăcuța de pe ghișeu",
          task: "Cineva vrea date de la ghișeul tău, dar nu știe ce să ceară.",
          counter: "ghișeu de marfă",
          noSign: "— fără plăcuță —",
          signTitle: "La ce răspunde acest ghișeu",
          r1: "produs după număr → nume, preț, stoc",
          r2: "lista de categorii", r3: "căutare după cuvânt → până la 20 de produse",
          noSignNote: "Nu există o listă cu ce se poate cere. Lasă-l să ghicească.",
          withSign: "Acum lista e pusă. Cere după ea.",
          guess: "cere la nimereală", hang: "pune o plăcuță", askRight: "cere exact cum scrie",
          rejected: "„{w}” — așa ceva nu există. Refuzat. Încă o zi dusă pe corespondență.",
          gotIt: "A cerut după plăcuță și a primit răspuns din prima. Nu a mai fost nevoie de scrisori.",
          done: "Acesta este Swagger/OpenAPI. O listă scrisă cu ce răspunde ghișeul transformă zile de ghicit într-o singură cerere corectă." },
  });

  /* ERP-системы — «Чужие колонки». Партнёр присылает таблицу со своими
     заголовками; пока их не сопоставишь со своими, товар уедет не тот. */
  add("erp", function (area, api) {
    var THEIRS = ["ARTNR", "BEZ", "MENGE", "PREIS"];
    var MINE = ["sku", "name", "qty", "price"];
    var RIGHT = { ARTNR: "sku", BEZ: "name", MENGE: "qty", PREIS: "price" };
    var map = {}, picked = null;

    function render(msg) {
      var done_ = THEIRS.every(function (k) { return map[k]; });
      area.innerHTML =
        '<div class="sg__map">' +
          '<div class="sg__map-col"><b>' + t("erp", "theirs") + "</b>" +
            THEIRS.map(function (k) {
              return '<button class="sg__part' + (picked === k ? " is-on" : map[k] ? " is-done" : "") +
                     '" data-their="' + k + '">' + k + (map[k] ? " → " + map[k] : "") + "</button>";
            }).join("") + "</div>" +
          '<div class="sg__map-col"><b>' + t("erp", "mine") + "</b>" +
            MINE.map(function (k) {
              var used = Object.keys(map).some(function (x) { return map[x] === k; });
              return '<button class="sg__part' + (used ? " is-done" : "") + '" data-mine="' + k + '">' +
                     t("erp", "m_" + k) + "</button>";
            }).join("") + "</div>" +
        "</div>" +
        lead(msg || t("erp", done_ ? "ok" : "intro")) +
        count(t("erp", "counter").replace("{n}", Object.keys(map).length).replace("{t}", THEIRS.length));

      on(area, "[data-their]", function (b) { picked = b.dataset.their; render(""); });
      on(area, "[data-mine]", function (b) {
        if (!picked) return render(t("erp", "pickLeft"));
        var mine = b.dataset.mine;
        if (RIGHT[picked] !== mine) { var p = picked; picked = null; return render(t("erp", "nope").replace("{c}", p)); }
        map[picked] = mine; picked = null;
        if (Object.keys(map).length < THEIRS.length) return render("");
        area.innerHTML = lead(t("erp", "win"));
        api.finish();
      });
    }
    render("");
  }, {
    en: { title: "Somebody else's columns",
          task: "The supplier sends his stock list. His column names are not yours. Match them up.",
          theirs: "his columns", mine: "your columns",
          m_sku: "article number", m_name: "product name", m_qty: "quantity", m_price: "price",
          intro: "Click one of his columns, then the column of yours it means.",
          pickLeft: "Pick one of his columns first.",
          nope: "“{c}” does not mean that. Match it wrong and the wrong goods get ordered.",
          ok: "All four are matched.",
          counter: "Matched: {n} of {t}",
          win: "Four columns matched. His file now loads into your shop without anybody retyping it.",
          done: "This is ERP integration. Two companies keep their own names for the same things, and the work is teaching one system to read the other." },
    ru: { title: "Чужие колонки",
          task: "Поставщик прислал свой список товаров. Названия колонок у него свои. Сопоставь их.",
          theirs: "его колонки", mine: "твои колонки",
          m_sku: "артикул", m_name: "название товара", m_qty: "количество", m_price: "цена",
          intro: "Нажми на его колонку, потом на твою, которая это же и значит.",
          pickLeft: "Сначала выбери его колонку.",
          nope: "«{c}» значит не это. Ошибёшься — закажут не тот товар.",
          ok: "Все четыре сопоставлены.",
          counter: "Сопоставлено: {n} из {t}",
          win: "Четыре колонки сошлись. Его файл теперь грузится в твой магазин, и никто ничего не перепечатывает руками.",
          done: "Это интеграция с ERP. Две компании держат свои названия для одних и тех же вещей, и работа в том, чтобы научить одну систему читать другую." },
    ro: { title: "Coloanele altcuiva",
          task: "Furnizorul a trimis lista lui de marfă. Numele coloanelor lui nu sunt ale tale. Potrivește-le.",
          theirs: "coloanele lui", mine: "coloanele tale",
          m_sku: "cod articol", m_name: "denumire produs", m_qty: "cantitate", m_price: "preț",
          intro: "Apasă pe o coloană de-a lui, apoi pe a ta care înseamnă același lucru.",
          pickLeft: "Alege întâi o coloană de-a lui.",
          nope: "„{c}” nu înseamnă asta. Greșești — se comandă marfa greșită.",
          ok: "Toate patru sunt potrivite.",
          counter: "Potrivite: {n} din {t}",
          win: "Patru coloane s-au potrivit. Fișierul lui intră acum în magazinul tău fără ca nimeni să retasteze nimic.",
          done: "Aceasta este integrarea cu ERP. Două companii țin nume proprii pentru aceleași lucruri, iar munca e să înveți un sistem să-l citească pe celălalt." },
  });

  /* CSV/XML — «Одна запись в двух обёртках». Данные те же, разница только
     в упаковке: где-то запятые, где-то подписанные коробочки. */
  add("csvxml", function (area, api) {
    var view = "csv", found = {};

    function render(msg) {
      area.innerHTML =
        row('<button class="sg__step' + (view === "csv" ? " is-done" : "") + '" data-v="csv">CSV</button>' +
            '<button class="sg__step' + (view === "xml" ? " is-done" : "") + '" data-v="xml">XML</button>') +
        '<div class="sg__data">' +
          (view === "csv"
            ? '<div class="sg__data-line">sku,name,price</div>' +
              '<div class="sg__data-line">A-17,' + t("csvxml", "jacket") +
                ',<button class="sg__pick" data-p="csv">349</button></div>'
            : '<div class="sg__data-line">&lt;item&gt;</div>' +
              '<div class="sg__data-line">  &lt;sku&gt;A-17&lt;/sku&gt;</div>' +
              '<div class="sg__data-line">  &lt;name&gt;' + t("csvxml", "jacket") + '&lt;/name&gt;</div>' +
              '<div class="sg__data-line">  &lt;price&gt;<button class="sg__pick" data-p="xml">349</button>&lt;/price&gt;</div>' +
              '<div class="sg__data-line">&lt;/item&gt;</div>') +
        "</div>" +
        lead(msg || t("csvxml", view === "csv" ? "csvNote" : "xmlNote")) +
        count(t("csvxml", "counter")
          .replace("{n}", Object.keys(found).length).replace("{t}", 2));

      on(area, "[data-v]", function (b) { view = b.dataset.v; render(""); });
      on(area, "[data-p]", function (b) {
        found[b.dataset.p] = true;
        if (Object.keys(found).length < 2) return render(t("csvxml", "one"));
        area.innerHTML = lead(t("csvxml", "win"));
        api.finish();
      });
    }
    render("");
  }, {
    en: { title: "One record, two wrappings",
          task: "The same jacket written two ways. Find its price in each.",
          jacket: "Winter jacket",
          csvNote: "Commas and nothing else. You count the columns and hope nobody added one.",
          xmlNote: "Every value sits in a labelled box. Longer to write, harder to misread.",
          one: "Found in one of the two. Switch and find it in the other.",
          counter: "Prices found: {n} of {t}",
          win: "Same jacket, same price, two wrappings. Only the packaging differs.",
          done: "This is CSV and XML. Suppliers send the same data in different wrappings, and the work is unwrapping whatever arrives." },
    ru: { title: "Одна запись в двух обёртках",
          task: "Одна и та же куртка, записанная двумя способами. Найди её цену в каждом.",
          jacket: "Зимняя куртка",
          csvNote: "Запятые и больше ничего. Считаешь колонки и надеешься, что никто не добавил лишнюю.",
          xmlNote: "Каждое значение лежит в подписанной коробочке. Писать дольше, перепутать труднее.",
          one: "Нашёл в одном из двух. Переключись и найди во втором.",
          counter: "Найдено цен: {n} из {t}",
          win: "Та же куртка, та же цена, две обёртки. Различается только упаковка.",
          done: "Это CSV и XML. Поставщики шлют одни и те же данные в разных обёртках, и работа в том, чтобы разворачивать любую." },
    ro: { title: "O înregistrare, două ambalaje",
          task: "Aceeași geacă scrisă în două feluri. Găsește-i prețul în fiecare.",
          jacket: "Geacă de iarnă",
          csvNote: "Virgule și nimic altceva. Numeri coloanele și speri că nimeni nu a adăugat una.",
          xmlNote: "Fiecare valoare stă într-o cutiuță etichetată. Se scrie mai lung, se încurcă mai greu.",
          one: "Găsit într-unul din două. Comută și găsește-l în celălalt.",
          counter: "Prețuri găsite: {n} din {t}",
          win: "Aceeași geacă, același preț, două ambalaje. Diferă doar împachetarea.",
          done: "Acestea sunt CSV și XML. Furnizorii trimit aceleași date în ambalaje diferite, iar munca e să despachetezi orice sosește." },
  });

  /* Прямые подключения к БД — «Ключ от чужого склада». Быстро и удобно, пока
     хозяин не переставил полки: тогда падает всё, и предупредить забыли. */
  add("directdb", function (area, api) {
    var stage = "ok";

    function render() {
      area.innerHTML =
        '<div class="sg__zones">' +
          '<div class="sg__zone"><b>' + t("directdb", "you") + "</b><span>" +
            t("directdb", stage === "broken" ? "youDown" : "youOk") + "</span></div>" +
          '<div class="sg__zone' + (stage === "broken" ? " is-dead" : "") + '"><b>' +
            t("directdb", "partner") + "</b><span>" +
            t("directdb", stage === "ok" ? "pOk" : "pChanged") + "</span></div>" +
        "</div>" +
        lead(t("directdb", stage === "ok" ? "intro" : stage === "broken" ? "broke" : "after")) +
        row(stage === "ok"
          ? '<button class="sg__step is-next" data-change>' + t("directdb", "rename") + "</button>"
          : stage === "broken"
            ? '<button class="sg__step is-next" data-window>' + t("directdb", "throughWindow") + "</button>"
            : "");

      on(area, "[data-change]", function () { stage = "broken"; render(); });
      on(area, "[data-window]", function () { stage = "fixed"; render(); api.finish(); });
    }
    render();
  }, {
    en: { title: "A key to someone else's warehouse",
          task: "The partner gave you the key to his storage. You read it straight, no asking.",
          you: "your shop", partner: "partner's storage",
          youOk: "prices update every minute", youDown: "everything stopped at 06:00",
          pOk: "shelves as you know them", pChanged: "shelves rearranged overnight",
          intro: "It works, and it is fast. Now let the partner tidy up his storage.",
          broke: "He renamed one shelf. He did not have to tell anybody — it is his storage. Your shop went down with it.",
          after: "Now you ask at his window instead. He can move shelves all he likes; the window still answers the same way.",
          rename: "partner renames a shelf", throughWindow: "go through his window instead",
          done: "This is a direct database connection. It is the fastest way in and the easiest to break — the owner owes you no warning." },
    ru: { title: "Ключ от чужого склада",
          task: "Партнёр дал тебе ключ от своего хранилища. Ты читаешь его напрямую, ничего не спрашивая.",
          you: "твой магазин", partner: "хранилище партнёра",
          youOk: "цены обновляются каждую минуту", youDown: "всё встало в 06:00",
          pOk: "полки, какими ты их знаешь", pChanged: "полки за ночь переставили",
          intro: "Работает, и быстро. А теперь пусть партнёр приберётся у себя на складе.",
          broke: "Он переименовал одну полку. Предупреждать он не обязан — склад его. Твой магазин лёг вместе с ней.",
          after: "Теперь ты просишь у него в окошке. Он может переставлять полки сколько угодно — окошко отвечает по-прежнему.",
          rename: "партнёр переименовал полку", throughWindow: "перейти на его окошко",
          done: "Это прямое подключение к базе. Самый быстрый вход и самый ломкий: хозяин не обязан предупреждать, что переставил полки." },
    ro: { title: "O cheie de la depozitul altuia",
          task: "Partenerul ți-a dat cheia de la depozitul lui. Îl citești direct, fără să întrebi.",
          you: "magazinul tău", partner: "depozitul partenerului",
          youOk: "prețurile se actualizează în fiecare minut", youDown: "totul s-a oprit la 06:00",
          pOk: "rafturile așa cum le știi", pChanged: "rafturile rearanjate peste noapte",
          intro: "Merge, și e rapid. Acum lasă partenerul să facă ordine la el în depozit.",
          broke: "A redenumit un raft. Nu era obligat să anunțe pe nimeni — e depozitul lui. Magazinul tău a căzut odată cu el.",
          after: "Acum ceri la ghișeul lui. Poate muta rafturile cât vrea — ghișeul răspunde la fel.",
          rename: "partenerul redenumește un raft", throughWindow: "treci pe ghișeul lui",
          done: "Aceasta este conexiunea directă la baza de date. Cea mai rapidă intrare și cea mai fragilă: proprietarul nu îți datorează niciun avertisment." },
  });
})();
