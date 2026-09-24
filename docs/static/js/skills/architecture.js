/* Мини-игры: блок «Архитектура».
   Механики и тексты трёх языков лежат рядом: домен владеет и поведением,
   и своими словами. Регистрируется в ядре через SkillGames.add(). */

(function () {
  "use strict";

  var S = window.SkillGames;
  var add = S.add, t = S.t, ui = S.ui;
  var row = S.row, lead = S.lead, count = S.count, on = S.on, later = S.later;

  /* ================================================== блок Архитектура === */

  /* DDD — «Говори словами склада». Пока программист зовёт вещи по-своему,
     кладовщик не понимает; общий язык убирает переводчика между ними. */
  add("ddd", function (area, api) {
    var WORDS = ["order", "item", "ship", "client"];
    var warehouse = {};

    function render() {
      var all = WORDS.every(function (k) { return warehouse[k]; });
      area.innerHTML =
        lead(t("ddd", all ? "understood" : "confused")) +
        '<div class="sg__notes">' + WORDS.map(function (k) {
          var w = warehouse[k];
          return '<button class="sg__note' + (w ? " is-ok" : "") + '" data-k="' + k + '">' +
                 (w ? "🧑‍🏭 " : "💻 ") + t("ddd", (w ? "w_" : "c_") + k) + "</button>";
        }).join("") + "</div>" +
        count(t("ddd", "counter")
          .replace("{n}", WORDS.filter(function (k) { return warehouse[k]; }).length)
          .replace("{t}", WORDS.length));

      on(area, ".sg__note", function (b) {
        warehouse[b.dataset.k] = true;
        render();
        if (WORDS.every(function (k) { return warehouse[k]; })) api.finish();
      });
    }
    render();
  }, {
    en: { title: "Speak the warehouse's words",
          task: "The storekeeper does not follow you. Click each word to say it his way instead.",
          c_order: "Entity#42", c_item: "row in table goods", c_ship: "status = 3", c_client: "user_id 118",
          w_order: "order", w_item: "goods on the shelf", w_ship: "shipped", w_client: "the customer",
          confused: "“I do not know what any of that means,” says the storekeeper.",
          understood: "“Now I follow you.” Same things — only the names changed.",
          counter: "Words he understands: {n} of {t}",
          done: "This is DDD. The code is named with the words of the business, so the storekeeper and the programmer mean the same thing." },
    ru: { title: "Говори словами склада",
          task: "Кладовщик тебя не понимает. Нажми на каждое слово, чтобы сказать его по-складски.",
          c_order: "Entity#42", c_item: "строка в таблице goods", c_ship: "status = 3", c_client: "user_id 118",
          w_order: "заказ", w_item: "товар на полке", w_ship: "отгружено", w_client: "покупатель",
          confused: "«Я не понимаю ни одного из этих слов», — говорит кладовщик.",
          understood: "«Вот теперь понятно.» Вещи те же — изменились только названия.",
          counter: "Понятных ему слов: {n} из {t}",
          done: "Это DDD. Код называют словами дела, и тогда кладовщик с программистом говорят об одном и том же." },
    ro: { title: "Vorbește pe limba depozitului",
          task: "Magazinerul nu te înțelege. Apasă pe fiecare cuvânt ca să-l spui pe limba lui.",
          c_order: "Entity#42", c_item: "rând în tabelul goods", c_ship: "status = 3", c_client: "user_id 118",
          w_order: "comandă", w_item: "marfă pe raft", w_ship: "livrat", w_client: "clientul",
          confused: "„Nu înțeleg niciunul dintre cuvintele astea”, spune magazinerul.",
          understood: "„Acum înțeleg.” Aceleași lucruri — s-au schimbat doar numele.",
          counter: "Cuvinte pe care le înțelege: {n} din {t}",
          done: "Acesta este DDD. Codul poartă cuvintele afacerii, așa că magazinerul și programatorul vorbesc despre același lucru." },
  });

  /* Микросервисы — «Башня и домики». Один и тот же удар: башня валится
     целиком, посёлок теряет один дом и живёт дальше. */
  add("micro", function (area, api) {
    var FLOORS = ["pay", "cart", "search", "photo"];
    var towerDown = false, downs = [];

    function render() {
      area.innerHTML =
        '<div class="sg__compare">' +
          '<div class="sg__tower' + (towerDown ? " is-down" : "") + '"><b>' + t("micro", "tower") + "</b>" +
            FLOORS.map(function (k) {
              return '<div class="sg__floor">' + t("micro", "f_" + k) + "</div>";
            }).join("") + "</div>" +
          '<div class="sg__village"><b>' + t("micro", "village") + "</b>" +
            '<div class="sg__houses">' + FLOORS.map(function (k) {
              return '<div class="sg__house' + (downs.indexOf(k) >= 0 ? " is-down" : "") + '">' +
                     t("micro", "f_" + k) + "</div>";
            }).join("") + "</div></div>" +
        "</div>" +
        lead(t("micro", towerDown ? "after" : "before")) +
        row('<button class="sg__step is-next" data-break>' + t("micro", "break") + "</button>");

      on(area, "[data-break]", function () {
        towerDown = true;
        if (downs.indexOf("photo") < 0) downs.push("photo");
        render();
        api.finish();
      });
    }
    render();
  }, {
    en: { title: "The tower and the village",
          task: "The same shop built two ways. Break the photo search and watch both.",
          tower: "One tower", village: "Four houses",
          f_pay: "payment", f_cart: "basket", f_search: "search", f_photo: "photo search",
          before: "Both are standing. Now break the same thing in each.",
          after: "The tower is dark all the way down — payment went with it. In the village one house went out; people still pay and still buy.",
          break: "break the photo search",
          done: "These are microservices. The shop is built as separate houses, so one of them falling does not take the money with it." },
    ru: { title: "Башня и домики",
          task: "Один и тот же магазин, построенный двумя способами. Сломай поиск по фото и смотри на оба.",
          tower: "Одна башня", village: "Четыре домика",
          f_pay: "оплата", f_cart: "корзина", f_search: "поиск", f_photo: "поиск по фото",
          before: "Оба стоят. Теперь сломай в каждом одно и то же.",
          after: "Башня погасла целиком — вместе с ней ушла оплата. В посёлке погас один домик; люди по-прежнему платят и покупают.",
          break: "сломать поиск по фото",
          done: "Это микросервисы. Магазин построен отдельными домиками, и падение одного не уносит с собой деньги." },
    ro: { title: "Turnul și sătucul",
          task: "Același magazin construit în două feluri. Strică căutarea după poză și privește la amândouă.",
          tower: "Un turn", village: "Patru case",
          f_pay: "plată", f_cart: "coș", f_search: "căutare", f_photo: "căutare după poză",
          before: "Amândouă stau în picioare. Acum strică același lucru în fiecare.",
          after: "Turnul s-a stins tot — a luat cu el și plata. În sat s-a stins o casă; oamenii plătesc și cumpără mai departe.",
          break: "strică căutarea după poză",
          done: "Acestea sunt microserviciile. Magazinul e construit din case separate, iar căderea uneia nu ia banii cu ea." },
  });

  /* SOLID — «Один винт — одна деталь». Пока всё склеено, правка кнопки
     отрывает корзину; после разделения винт крутит только своё. */
  add("solid", function (area, api) {
    var split = false, turned = 0;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__machine' + (split ? " is-split" : "") + '">' +
          ["btn", "cart", "mail"].map(function (k) {
            return '<div class="sg__gear" data-g="' + k + '">' + t("solid", "p_" + k) + "</div>";
          }).join("") +
        "</div>" +
        lead(t("solid", split ? "clean" : "glued")) +
        row('<button class="sg__step is-next" data-turn>' + t("solid", "turn") + "</button>" +
            (split ? "" : '<button class="sg__step" data-split>' + t("solid", "split") + "</button>")) +
        (msg ? '<p class="sg__' + (split ? "answer" : "warn") + '">' + msg + "</p>" : "");

      on(area, "[data-turn]", function () {
        turned++;
        render(t("solid", split ? "onlyBtn" : "broke"));
        if (split) api.finish();
      });
      on(area, "[data-split]", function () { split = true; render(t("solid", "nowSplit")); });
    }
    render("");
  }, {
    en: { title: "One screw, one part",
          task: "You only want to change the colour of the Buy button. Turn the screw and see what else moves.",
          p_btn: "Buy button", p_cart: "basket", p_mail: "receipt by mail",
          glued: "All three parts sit on one shaft. Nothing here can be touched on its own.",
          clean: "Now each part has its own screw.",
          turn: "turn the screw", split: "put them on separate screws",
          broke: "The button changed colour — and the basket fell off with it. Neither was asked for.",
          nowSplit: "Three parts, three screws. Try turning it again.",
          onlyBtn: "The button changed colour. The basket and the receipt did not move at all.",
          done: "This is SOLID. Each part gets its own screw, so changing one thing stops breaking three others." },
    ru: { title: "Один винт — одна деталь",
          task: "Ты хочешь поменять только цвет кнопки «Купить». Крутни винт и посмотри, что ещё сдвинется.",
          p_btn: "кнопка «Купить»", p_cart: "корзина", p_mail: "чек на почту",
          glued: "Все три детали сидят на одном валу. Тронуть что-то по отдельности здесь нельзя.",
          clean: "Теперь у каждой детали свой винт.",
          turn: "крутить винт", split: "развести по разным винтам",
          broke: "Кнопка поменяла цвет — и вместе с ней отвалилась корзина. Ни того, ни другого не просили.",
          nowSplit: "Три детали, три винта. Попробуй крутнуть ещё раз.",
          onlyBtn: "Кнопка поменяла цвет. Корзина и чек даже не шелохнулись.",
          done: "Это SOLID. У каждой детали свой винт, и правка одного перестаёт ломать три соседних." },
    ro: { title: "Un șurub, o piesă",
          task: "Vrei doar să schimbi culoarea butonului „Cumpără”. Răsucește șurubul și vezi ce se mai mișcă.",
          p_btn: "butonul „Cumpără”", p_cart: "coșul", p_mail: "bonul pe mail",
          glued: "Toate trei piesele stau pe același ax. Aici nu poți atinge nimic separat.",
          clean: "Acum fiecare piesă are șurubul ei.",
          turn: "răsucește șurubul", split: "pune-le pe șuruburi separate",
          broke: "Butonul și-a schimbat culoarea — și odată cu el a căzut coșul. Nimeni nu a cerut nici una, nici alta.",
          nowSplit: "Trei piese, trei șuruburi. Mai încearcă o dată.",
          onlyBtn: "Butonul și-a schimbat culoarea. Coșul și bonul nici nu s-au clintit.",
          done: "Acesta este SOLID. Fiecare piesă are șurubul ei, așa că o modificare nu mai strică alte trei." },
  });

  /* ООП — «Форма для печенья». Форма одна, печений много, и у каждого своя
     начинка: общий чертёж не мешает им быть разными. */
  add("oop", function (area, api) {
    var COLORS = ["choc", "berry", "mint", "caramel"];
    var cookies = [];

    function render() {
      area.innerHTML =
        '<div class="sg__mould">🍪 ' + t("oop", "mould") + "</div>" +
        '<div class="sg__cookies">' + (cookies.length
          ? cookies.map(function (c, i) {
              return '<button class="sg__cookie is-' + c + '" data-i="' + i + '">🍪</button>';
            }).join("")
          : '<span class="sg__empty">' + t("oop", "none") + "</span>") +
        "</div>" +
        lead(t("oop", cookies.length >= 4 ? "same" : "bake")) +
        count(t("oop", "counter").replace("{n}", cookies.length)) +
        row('<button class="sg__step is-next" data-bake>' + t("oop", "bakeBtn") + "</button>");

      on(area, "[data-bake]", function () {
        cookies.push(COLORS[cookies.length % COLORS.length]);
        render();
        if (cookies.length === 4) api.finish();
      });
      on(area, ".sg__cookie", function (b) {
        var i = Number(b.dataset.i);
        cookies[i] = COLORS[(COLORS.indexOf(cookies[i]) + 1) % COLORS.length];
        render();
      });
    }
    render();
  }, {
    en: { title: "The cookie mould",
          task: "One mould, cut once. Press out cookies and give each its own filling.",
          mould: "the mould — cut once",
          none: "no cookies yet",
          bake: "Press out a cookie. Then click it to change its filling.",
          same: "Four cookies of the same shape, each with its own filling. One mould behind all of them.",
          counter: "Cookies: {n}",
          bakeBtn: "press out a cookie",
          done: "This is object-oriented programming. One mould describes the shape, and every cookie pressed from it carries its own filling." },
    ru: { title: "Форма для печенья",
          task: "Форма одна, вырезана один раз. Штампуй печенья и дай каждому свою начинку.",
          mould: "форма — вырезана один раз",
          none: "печений пока нет",
          bake: "Выштампуй печенье. Потом нажми на него, чтобы поменять начинку.",
          same: "Четыре печенья одной формы, у каждого своя начинка. И одна форма за всеми ними.",
          counter: "Печений: {n}",
          bakeBtn: "выштамповать печенье",
          done: "Это ООП. Одна форма описывает вид, а каждое выштампованное печенье несёт свою собственную начинку." },
    ro: { title: "Forma de biscuiți",
          task: "O singură formă, tăiată o dată. Ștanțează biscuiți și dă-i fiecăruia umplutura lui.",
          mould: "forma — tăiată o dată",
          none: "încă niciun biscuite",
          bake: "Ștanțează un biscuite. Apoi apasă pe el ca să-i schimbi umplutura.",
          same: "Patru biscuiți de aceeași formă, fiecare cu umplutura lui. Și o singură formă în spatele tuturor.",
          counter: "Biscuiți: {n}",
          bakeBtn: "ștanțează un biscuite",
          done: "Aceasta este programarea orientată pe obiecte. O formă descrie înfățișarea, iar fiecare biscuite ștanțat își poartă propria umplutură." },
  });

  /* PHPUnit — «Какая правка сломала». Без проверок поломка всплывает в конце
     и виноватого ищут вслепую; с проверкой после каждой правки видно сразу. */
  add("phpunit", function (area, api) {
    var EDITS = ["price", "cart", "mail"];
    var BROKEN = "cart";
    var stage = "blind", done_ = [], found = null;

    function render(msg) {
      area.innerHTML =
        lead(t("phpunit", stage === "blind" ? "blindNote" : "testNote")) +
        '<div class="sg__notes">' + EDITS.map(function (k) {
          var made = done_.indexOf(k) >= 0;
          var bad = stage === "tests" && made && k === BROKEN;
          return '<button class="sg__note' + (bad ? "" : made ? " is-ok" : "") + '" data-k="' + k + '"' +
                 (made ? " disabled" : "") + ">" +
                 (bad ? "✗ " : made ? "✓ " : "• ") + t("phpunit", "e_" + k) + "</button>";
        }).join("") + "</div>" +
        (msg ? '<p class="sg__' + (found ? "answer" : "warn") + '">' + msg + "</p>" : "");

      on(area, ".sg__note", function (b) {
        if (b.disabled) return;
        var k = b.dataset.k;
        done_.push(k);
        if (stage === "blind") {
          if (done_.length < EDITS.length) return render("");
          stage = "tests"; done_ = []; found = null;
          return render(t("phpunit", "broke"));
        }
        if (k === BROKEN) {
          found = k;
          return render(t("phpunit", "caught").replace("{e}", t("phpunit", "e_" + k)));
        }
        if (done_.length < EDITS.length) return render(t("phpunit", "pass"));
        area.innerHTML = lead(t("phpunit", "caught").replace("{e}", t("phpunit", "e_" + BROKEN)));
        api.finish();
      });

      if (found) {
        area.insertAdjacentHTML("beforeend",
          row('<button class="sg__step is-next" data-ok>' + t("phpunit", "fix") + "</button>"));
        on(area, "[data-ok]", function () {
          area.innerHTML = lead(t("phpunit", "fixed"));
          api.finish();
        });
      }
    }
    render("");
  }, {
    en: { title: "Which change broke it",
          task: "Three changes in a row. Make them and find out what happens at the end.",
          e_price: "change the price", e_cart: "tidy up the basket", e_mail: "reword the receipt",
          blindNote: "No checks here. Make all three changes.",
          testNote: "Now the same three, but a check runs after each one.",
          broke: "Something is broken in the shop. Three changes were made — which one did it? Nobody knows. Try again with checks.",
          pass: "Check passed. Nothing broke.",
          caught: "Check failed right after “{e}”. Caught in seconds, not in the shop.",
          fix: "fix it and carry on",
          fixed: "Fixed on the spot. The other two changes were never in doubt.",
          done: "This is PHPUnit. The check runs after every change, so a break points at the change that caused it instead of hiding until the end." },
    ru: { title: "Какая правка сломала",
          task: "Три правки подряд. Сделай их и посмотри, чем всё кончится.",
          e_price: "поменять цену", e_cart: "причесать корзину", e_mail: "переписать текст чека",
          blindNote: "Проверок нет. Сделай все три правки.",
          testNote: "Теперь те же три, но после каждой запускается проверка.",
          broke: "В магазине что-то сломалось. Правок было три — какая виновата? Никто не знает. Попробуй заново, с проверками.",
          pass: "Проверка прошла. Ничего не сломалось.",
          caught: "Проверка упала сразу после «{e}». Поймано за секунды, а не в магазине.",
          fix: "починить и идти дальше",
          fixed: "Починено на месте. Две другие правки под подозрение даже не попали.",
          done: "Это PHPUnit. Проверка идёт после каждой правки, и поломка сразу показывает пальцем на виновную, а не прячется до конца." },
    ro: { title: "Care modificare a stricat",
          task: "Trei modificări la rând. Fă-le și vezi cum se termină.",
          e_price: "schimbă prețul", e_cart: "aranjează coșul", e_mail: "rescrie textul bonului",
          blindNote: "Aici nu sunt verificări. Fă toate trei modificările.",
          testNote: "Acum aceleași trei, dar după fiecare rulează o verificare.",
          broke: "Ceva s-a stricat în magazin. Au fost trei modificări — care e vinovată? Nimeni nu știe. Încearcă din nou, cu verificări.",
          pass: "Verificarea a trecut. Nu s-a stricat nimic.",
          caught: "Verificarea a picat imediat după „{e}”. Prins în secunde, nu în magazin.",
          fix: "repară și mergi mai departe",
          fixed: "Reparat pe loc. Celelalte două modificări nici nu au intrat la bănuieli.",
          done: "Acesta este PHPUnit. Verificarea rulează după fiecare modificare, iar defectul arată direct spre vinovat, în loc să se ascundă până la final." },
  });

  /* PSR — «Общая тетрадь». Пятеро пишут по-своему, и тетрадь не читается;
     один общий формат — и записи снова понятны всем. */
  add("psr", function (area, api) {
    var LINES = ["a", "b", "c", "d", "e"];
    var agreed = false;

    function render() {
      area.innerHTML =
        '<div class="sg__book' + (agreed ? " is-tidy" : "") + '">' +
          LINES.map(function (k) {
            return '<div class="sg__line sg__line--' + k + '">' +
                   t("psr", (agreed ? "t_" : "m_") + k) + "</div>";
          }).join("") +
        "</div>" +
        lead(t("psr", agreed ? "tidy" : "mess")) +
        row(agreed
          ? '<button class="sg__step is-done" disabled>' + t("psr", "agreed") + "</button>"
          : '<button class="sg__step is-next" data-agree>' + t("psr", "agree") + "</button>");

      on(area, "[data-agree]", function () { agreed = true; render(); api.finish(); });
    }
    render();
  }, {
    en: { title: "The shared notebook",
          task: "Five people write in one notebook. Read it.",
          m_a: "12.03 — Ivanov — 200 lei", m_b: "PETROV / 14 march / 150",
          m_c: "sidorova,15-03-2026,320 MDL", m_d: "16/3 K. 90",
          m_e: "     17.03.2026        Popescu        410",
          t_a: "12.03.2026 · Ivanov · 200 MDL", t_b: "14.03.2026 · Petrov · 150 MDL",
          t_c: "15.03.2026 · Sidorova · 320 MDL", t_d: "16.03.2026 · Kovalenko · 90 MDL",
          t_e: "17.03.2026 · Popescu · 410 MDL",
          mess: "Every line is written another way. Adding them up means deciphering each one first.",
          tidy: "Same five entries. Now the eye runs down the column without stopping.",
          agree: "agree on one format", agreed: "one format agreed",
          done: "This is PSR. Everyone writes code the same agreed way, so a stranger reads it without deciphering it first." },
    ru: { title: "Общая тетрадь",
          task: "Пять человек пишут в одну тетрадь. Прочитай её.",
          m_a: "12.03 — Иванов — 200 лей", m_b: "ПЕТРОВ / 14 марта / 150",
          m_c: "сидорова,15-03-2026,320 MDL", m_d: "16/3 К. 90",
          m_e: "     17.03.2026        Popescu        410",
          t_a: "12.03.2026 · Иванов · 200 MDL", t_b: "14.03.2026 · Петров · 150 MDL",
          t_c: "15.03.2026 · Сидорова · 320 MDL", t_d: "16.03.2026 · Коваленко · 90 MDL",
          t_e: "17.03.2026 · Попеску · 410 MDL",
          mess: "Каждая строка написана по-своему. Чтобы их сложить, сначала надо каждую расшифровать.",
          tidy: "Те же пять записей. Теперь глаз бежит по столбцу не спотыкаясь.",
          agree: "договориться об одном формате", agreed: "формат общий",
          done: "Это PSR. Все пишут код одинаково, по общему уговору, и чужой человек читает его сразу, а не расшифровывает." },
    ro: { title: "Caietul comun",
          task: "Cinci oameni scriu într-un singur caiet. Citește-l.",
          m_a: "12.03 — Ivanov — 200 lei", m_b: "PETROV / 14 martie / 150",
          m_c: "sidorova,15-03-2026,320 MDL", m_d: "16/3 K. 90",
          m_e: "     17.03.2026        Popescu        410",
          t_a: "12.03.2026 · Ivanov · 200 MDL", t_b: "14.03.2026 · Petrov · 150 MDL",
          t_c: "15.03.2026 · Sidorova · 320 MDL", t_d: "16.03.2026 · Kovalenko · 90 MDL",
          t_e: "17.03.2026 · Popescu · 410 MDL",
          mess: "Fiecare rând e scris altfel. Ca să le aduni, întâi trebuie să descifrezi fiecare rând.",
          tidy: "Aceleași cinci însemnări. Acum ochiul coboară pe coloană fără să se poticnească.",
          agree: "înțelegeți-vă pe un format", agreed: "format comun",
          done: "Acesta este PSR. Toți scriu codul la fel, după o înțelegere comună, iar un străin îl citește direct, fără să-l descifreze." },
  });
})();
