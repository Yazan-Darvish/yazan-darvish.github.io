/* Мини-игры: блок «JavaScript».
   Механики и тексты трёх языков лежат рядом: домен владеет и поведением,
   и своими словами. Регистрируется в ядре через SkillGames.add(). */

(function () {
  "use strict";

  var S = window.SkillGames;
  var add = S.add, t = S.t, ui = S.ui;
  var row = S.row, lead = S.lead, count = S.count, on = S.on, later = S.later;

  /* ==================================================== блок JavaScript === */

  /* HTML/CSS — «Скелет и одежда». Разметка держит содержимое, стили его
     одевают: слои надеваются по одному, и страница оживает на глазах. */
  add("htmlcss", function (area, api) {
    var LAYERS = ["font", "color", "space"];
    var worn = [];

    function render() {
      area.innerHTML =
        '<div class="sg__site' + worn.map(function (k) { return " has-" + k; }).join("") + '">' +
          "<h3>" + t("htmlcss", "h") + "</h3>" +
          "<p>" + t("htmlcss", "p") + "</p>" +
          '<span class="sg__site-btn">' + t("htmlcss", "btn") + "</span>" +
        "</div>" +
        lead(t("htmlcss", worn.length ? "dressed" : "bones")) +
        row(LAYERS.map(function (k) {
          var on = worn.indexOf(k) >= 0;
          return '<button class="sg__step' + (on ? " is-done" : "") + '" data-k="' + k + '"' +
                 (on ? " disabled" : "") + ">+ " + t("htmlcss", "l_" + k) + "</button>";
        }).join(""));

      on(area, ".sg__step", function (b) {
        if (b.disabled) return;
        worn.push(b.dataset.k);
        render();
        if (worn.length === LAYERS.length) api.finish();
      });
    }
    render();
  }, {
    en: { title: "Bones and clothes",
          task: "The page below has content but nothing else. Put the clothes on it.",
          h: "Winter jacket", p: "Warm, windproof, sizes S to XXL.", btn: "Buy",
          bones: "This is the bare structure: a heading, a paragraph, a button. All there, all ugly.",
          dressed: "Same words, same buttons. Only the clothes changed.",
          l_font: "typeface", l_color: "colour", l_space: "spacing",
          done: "This is HTML and CSS. HTML is the bones that hold the content, CSS is the clothes it wears." },
    ru: { title: "Скелет и одежда",
          task: "У страницы ниже есть содержимое и больше ничего. Одень её.",
          h: "Зимняя куртка", p: "Тёплая, не продувается, размеры от S до XXL.", btn: "Купить",
          bones: "Это голая структура: заголовок, абзац, кнопка. Всё на месте и всё некрасиво.",
          dressed: "Слова те же, кнопка та же. Изменилась только одежда.",
          l_font: "шрифт", l_color: "цвет", l_space: "отступы",
          done: "Это HTML и CSS. HTML — скелет, который держит содержимое, CSS — одежда, которую он носит." },
    ro: { title: "Schelet și haine",
          task: "Pagina de mai jos are conținut și nimic altceva. Îmbrac-o.",
          h: "Geacă de iarnă", p: "Caldă, nu lasă vântul, mărimi de la S la XXL.", btn: "Cumpără",
          bones: "Aceasta e structura goală: titlu, paragraf, buton. Totul e acolo și totul e urât.",
          dressed: "Aceleași cuvinte, același buton. S-au schimbat doar hainele.",
          l_font: "font", l_color: "culoare", l_space: "spațiere",
          done: "Acestea sunt HTML și CSS. HTML e scheletul care ține conținutul, CSS sunt hainele pe care le poartă." },
  });

  /* Vue.js — «Ценник сам меняется». По-старому за новой суммой надо было
     перезагружать страницу, теперь она пересчитывается на месте. */
  add("vue", function (area, api) {
    var PRICE = 349;
    var qty = 1, live = false, reloading = false, shownQty = 1;

    function render() {
      area.innerHTML =
        '<div class="sg__cart' + (reloading ? " is-loading" : "") + '">' +
          '<div class="sg__cart-row"><span>' + t("vue", "item") + "</span><b>" + PRICE + " MDL</b></div>" +
          '<div class="sg__cart-row"><span>' + t("vue", "qty") + "</span>" +
            '<span class="sg__qty">' +
              '<button data-d="-1">−</button><b>' + qty + "</b><button data-d=\"1\">+</button>" +
            "</span>" +
          "</div>" +
          '<div class="sg__cart-total"><span>' + t("vue", "total") + "</span><b>" +
            (reloading ? "…" : shownQty * PRICE + " MDL") + "</b></div>" +
        "</div>" +
        lead(t("vue", live ? "liveNote" : "oldNote")) +
        row(live ? "" :
          '<button class="sg__step is-next" data-reload>' + t("vue", "reload") + "</button>" +
          '<button class="sg__step" data-live>' + t("vue", "goLive") + "</button>");

      on(area, "[data-d]", function (b) {
        qty = Math.max(1, qty + Number(b.dataset.d));
        if (live) shownQty = qty;
        render();
      });
      on(area, "[data-reload]", function () {
        reloading = true; render();
        later(function () { reloading = false; shownQty = qty; render(); }, 900);
      });
      on(area, "[data-live]", function () {
        live = true; shownQty = qty; render();
        api.finish();
      });
    }
    render();
  }, {
    en: { title: "The price tag that keeps up",
          task: "Change the quantity and watch the total. Then make it keep up by itself.",
          item: "Winter jacket", qty: "Quantity", total: "Total",
          oldNote: "The total is stale: the page has to be reloaded to catch up.",
          liveNote: "Now the total follows the quantity instantly — nothing reloads.",
          reload: "reload the page", goLive: "make it live",
          done: "This is Vue.js. It keeps what you see in step with the numbers underneath, without reloading anything." },
    ru: { title: "Ценник, который успевает",
          task: "Поменяй количество и посмотри на сумму. Потом сделай так, чтобы она успевала сама.",
          item: "Зимняя куртка", qty: "Количество", total: "Итого",
          oldNote: "Сумма отстала: чтобы она догнала, страницу приходится перезагружать.",
          liveNote: "Теперь сумма следует за количеством мгновенно — ничего не перезагружается.",
          reload: "перезагрузить страницу", goLive: "сделать живым",
          done: "Это Vue.js. Он держит то, что ты видишь, в ногу с числами под капотом — без перезагрузок." },
    ro: { title: "Eticheta care ține pasul",
          task: "Schimbă cantitatea și privește totalul. Apoi fă-l să țină pasul singur.",
          item: "Geacă de iarnă", qty: "Cantitate", total: "Total",
          oldNote: "Totalul a rămas în urmă: ca să se actualizeze, pagina trebuie reîncărcată.",
          liveNote: "Acum totalul urmează cantitatea instantaneu — nu se reîncarcă nimic.",
          reload: "reîncarcă pagina", goLive: "fă-l viu",
          done: "Acesta este Vue.js. Ține ce vezi în pas cu cifrele de dedesubt, fără nicio reîncărcare." },
  });

  /* React — «Один кирпич, много стен». Карточка описана один раз: правка
     в кирпиче меняет все стены разом, а не по одной. */
  add("react", function (area, api) {
    var TOTAL = 12;
    var fixed = 0, brickFixed = false;

    function render() {
      area.innerHTML =
        '<div class="sg__cards">' +
          Array.apply(null, Array(TOTAL)).map(function (_, i) {
            var ok = brickFixed || i < fixed;
            return '<div class="sg__card' + (ok ? " is-ok" : "") + '">' +
                   '<span class="sg__card-btn">' + t("react", ok ? "btnNew" : "btnOld") + "</span></div>";
          }).join("") +
        "</div>" +
        lead(t("react", brickFixed ? "afterBrick" : "before")) +
        count(t("react", "counter")
          .replace("{n}", brickFixed ? TOTAL : fixed).replace("{t}", TOTAL)) +
        row(brickFixed ? "" :
          '<button class="sg__step is-next" data-one>' + t("react", "fixOne") + "</button>" +
          '<button class="sg__step" data-brick>' + t("react", "fixBrick") + "</button>");

      on(area, "[data-one]", function () { if (fixed < TOTAL) fixed++; render(); });
      on(area, "[data-brick]", function () { brickFixed = true; render(); api.finish(); });
    }
    render();
  }, {
    en: { title: "One brick, many walls",
          task: "Twelve product cards, all with an old grey button. Make them all green.",
          before: "Every card carries its own copy of the button. Fixing them one by one is twelve edits.",
          afterBrick: "One edit to the brick, and every wall built from it changed at once.",
          btnOld: "Buy", btnNew: "Buy ✓",
          counter: "Cards fixed: {n} of {t}",
          fixOne: "fix one card", fixBrick: "fix the brick itself",
          done: "This is React. The card is described once as a brick — change the brick and every place built from it changes." },
    ru: { title: "Один кирпич, много стен",
          task: "Двенадцать карточек товара, у всех старая серая кнопка. Сделай их зелёными.",
          before: "У каждой карточки своя копия кнопки. Править по одной — двенадцать правок.",
          afterBrick: "Одна правка в кирпиче — и все стены, сложенные из него, поменялись разом.",
          btnOld: "Купить", btnNew: "Купить ✓",
          counter: "Исправлено карточек: {n} из {t}",
          fixOne: "исправить одну", fixBrick: "исправить сам кирпич",
          done: "Это React. Карточка описана один раз как кирпич — правишь кирпич, и меняется всё, что из него сложено." },
    ro: { title: "O cărămidă, multe ziduri",
          task: "Douăsprezece carduri de produs, toate cu un buton gri vechi. Fă-le verzi.",
          before: "Fiecare card are propria copie a butonului. Reparate una câte una — douăsprezece modificări.",
          afterBrick: "O singură modificare în cărămidă și toate zidurile făcute din ea s-au schimbat deodată.",
          btnOld: "Cumpără", btnNew: "Cumpără ✓",
          counter: "Carduri reparate: {n} din {t}",
          fixOne: "repară un card", fixBrick: "repară cărămida",
          done: "Acesta este React. Cardul e descris o dată ca o cărămidă — schimbi cărămida și se schimbă tot ce e construit din ea." },
  });

  /* Node.js — «Зал и кухня». Раньше на сервере нужен был другой язык;
     теперь один и тот же работает и в браузере, и за кулисами. */
  add("nodejs", function (area, api) {
    var JOBS = [
      { k: "button", zone: "front" }, { k: "menu", zone: "front" },
      { k: "charge", zone: "back" }, { k: "mail", zone: "back" },
      { k: "stock", zone: "back" },
    ];
    var placed = {}, wrong = null;

    function render() {
      var left = JOBS.filter(function (j) { return !placed[j.k]; });
      area.innerHTML =
        '<div class="sg__zones">' +
          ["front", "back"].map(function (z) {
            return '<div class="sg__zone" data-z="' + z + '"><b>' + t("nodejs", "z_" + z) + "</b>" +
              JOBS.filter(function (j) { return placed[j.k] === z; }).map(function (j) {
                return '<span class="sg__job">' + t("nodejs", "j_" + j.k) + "</span>";
              }).join("") + "</div>";
          }).join("") +
        "</div>" +
        (left.length
          ? lead(t("nodejs", "put").replace("{job}", t("nodejs", "j_" + left[0].k))) +
            row('<button class="sg__step is-next" data-z="front">' + t("nodejs", "z_front") + "</button>" +
                '<button class="sg__step is-next" data-z="back">' + t("nodejs", "z_back") + "</button>")
          : lead(t("nodejs", "same"))) +
        (wrong ? '<p class="sg__warn">' + wrong + "</p>" : "");

      on(area, "[data-z]", function (b) {
        var job = JOBS.filter(function (j) { return !placed[j.k]; })[0];
        if (!job) return;
        if (b.dataset.z !== job.zone) { wrong = t("nodejs", "nope"); return render(); }
        wrong = null;
        placed[job.k] = job.zone;
        render();
        if (!JOBS.filter(function (j) { return !placed[j.k]; }).length) api.finish();
      });
    }
    render();
  }, {
    en: { title: "The floor and the kitchen",
          task: "Send each job where it belongs: to the room the guest sees, or behind the scenes.",
          z_front: "the room", z_back: "behind the scenes",
          j_button: "make the button click", j_menu: "open the menu",
          j_charge: "take the payment", j_mail: "send the receipt by mail",
          j_stock: "check the warehouse",
          put: "Where does this go: {job}?",
          nope: "Not that side. Think about who sees it.",
          same: "Five different jobs, two different sides — and one and the same language wrote them all.",
          done: "This is Node.js. It lets the language of the browser work behind the scenes too, so one person covers both sides." },
    ru: { title: "Зал и кухня",
          task: "Отправь каждое дело туда, где оно живёт: в зал, который видит гость, или за кулисы.",
          z_front: "зал", z_back: "за кулисами",
          j_button: "чтобы кнопка нажималась", j_menu: "открыть меню",
          j_charge: "принять оплату", j_mail: "отправить чек на почту",
          j_stock: "проверить склад",
          put: "Куда это: {job}?",
          nope: "Не та сторона. Подумай, кто это видит.",
          same: "Пять разных дел, две разные стороны — и написаны они одним и тем же языком.",
          done: "Это Node.js. Он пускает язык браузера работать и за кулисами, так что обе стороны тянет один человек." },
    ro: { title: "Sala și bucătăria",
          task: "Trimite fiecare treabă unde îi e locul: în sala pe care o vede clientul sau în culise.",
          z_front: "sala", z_back: "în culise",
          j_button: "ca butonul să se apese", j_menu: "deschide meniul",
          j_charge: "încasează plata", j_mail: "trimite bonul pe mail",
          j_stock: "verifică depozitul",
          put: "Unde merge asta: {job}?",
          nope: "Nu partea aceea. Gândește-te cine o vede.",
          same: "Cinci treburi diferite, două părți diferite — și toate scrise în același limbaj.",
          done: "Acesta este Node.js. Duce limbajul browserului și în culise, așa că un singur om acoperă ambele părți." },
  });

  /* Electron — «Сайт в рамке». Та же страница, но без адресной строки и
     вкладок: она становится программой с иконкой в доке. */
  add("electron", function (area, api) {
    var mode = "browser";

    function render() {
      area.innerHTML =
        '<div class="sg__frame sg__frame--' + mode + '">' +
          (mode === "browser"
            ? '<div class="sg__bar"><span class="sg__tab">' + t("electron", "tab") + "</span>" +
              '<span class="sg__url">https://shop.example/app</span></div>'
            : '<div class="sg__bar sg__bar--app"><span class="sg__dots"></span>' +
              "<b>" + t("electron", "appName") + "</b></div>") +
          '<div class="sg__screen">' + t("electron", "screen") + "</div>" +
        "</div>" +
        lead(t("electron", mode === "browser" ? "inBrowser" : "inApp")) +
        row(mode === "browser"
          ? '<button class="sg__step is-next" data-wrap>' + t("electron", "wrap") + "</button>"
          : '<button class="sg__step is-done" disabled>' + t("electron", "wrapped") + "</button>");

      on(area, "[data-wrap]", function () { mode = "app"; render(); api.finish(); });
    }
    render();
  }, {
    en: { title: "A site in a frame",
          task: "The same screen, twice. Look at what is around it.",
          tab: "Shop — terminal", appName: "Terminal",
          screen: "🧾 Checkout · card · receipt",
          inBrowser: "In a browser there is a tab, an address bar and a back button. A customer can close the tab or type a different address.",
          inApp: "The same screen with nothing around it. No address bar, no tabs — it is a program now.",
          wrap: "wrap it in a window", wrapped: "it is a program",
          done: "This is Electron. It takes a page built for the browser and turns it into a program that runs on its own." },
    ru: { title: "Сайт в рамке",
          task: "Один и тот же экран дважды. Смотри на то, что вокруг него.",
          tab: "Магазин — терминал", appName: "Терминал",
          screen: "🧾 Оплата · карта · чек",
          inBrowser: "В браузере есть вкладка, адресная строка и кнопка «назад». Покупатель может закрыть вкладку или вбить другой адрес.",
          inApp: "Тот же экран, и вокруг ничего. Ни адресной строки, ни вкладок — это уже программа.",
          wrap: "завернуть в окно", wrapped: "это программа",
          done: "Это Electron. Он берёт страницу, сделанную для браузера, и превращает её в программу, которая работает сама по себе." },
    ro: { title: "Un site într-o ramă",
          task: "Același ecran, de două ori. Uită-te la ce e în jurul lui.",
          tab: "Magazin — terminal", appName: "Terminal",
          screen: "🧾 Plată · card · bon",
          inBrowser: "În browser sunt o filă, o bară de adrese și un buton „înapoi”. Clientul poate închide fila sau scrie altă adresă.",
          inApp: "Același ecran și nimic în jur. Fără bară de adrese, fără file — acum e un program.",
          wrap: "împachetează în fereastră", wrapped: "este un program",
          done: "Acesta este Electron. Ia o pagină făcută pentru browser și o transformă într-un program care rulează de unul singur." },
  });

  /* Десктоп (.exe) — «Когда интернет пропал». Касса в магазине не имеет
     права останавливаться из-за оборванного провода. */
  add("exe", function (area, api) {
    var online = true, tried = false;

    function render() {
      area.innerHTML =
        '<div class="sg__switch">' +
          "<span>" + t("exe", "net") + "</span>" +
          '<button class="sg__toggle' + (online ? " is-on" : "") + '" data-net>' +
            t("exe", online ? "on" : "off") + "</button>" +
        "</div>" +
        '<div class="sg__zones">' +
          '<div class="sg__zone' + (online ? "" : " is-dead") + '"><b>' + t("exe", "site") + "</b>" +
            "<span>" + t("exe", online ? "siteOk" : "siteDead") + "</span></div>" +
          '<div class="sg__zone"><b>' + t("exe", "app") + "</b>" +
            "<span>" + t("exe", "appOk") + "</span></div>" +
        "</div>" +
        lead(t("exe", online ? "ask" : "cut"));

      on(area, "[data-net]", function () {
        online = !online;
        if (!online) tried = true;
        render();
        if (tried && !online) api.finish();
      });
    }
    render();
  }, {
    en: { title: "When the internet dies",
          task: "A shop till at the busiest hour. Pull the plug and see who keeps working.",
          net: "Internet", on: "connected", off: "cut off",
          site: "Shop in a browser", siteOk: "working", siteDead: "no connection — blank page",
          app: "Program on the till", appOk: "working, receipts printing",
          ask: "Everything works. Now cut the wire.",
          cut: "The browser went blank; the till carries on. The queue never noticed.",
          done: "This is a desktop program — an .exe. It is installed on the machine itself, so a torn wire does not stop the queue." },
    ru: { title: "Когда пропал интернет",
          task: "Касса в магазине в час пик. Выдерни провод и посмотри, кто продолжит работать.",
          net: "Интернет", on: "есть", off: "оборван",
          site: "Магазин в браузере", siteOk: "работает", siteDead: "нет связи — белый экран",
          app: "Программа на кассе", appOk: "работает, чеки печатаются",
          ask: "Всё работает. Теперь оборви провод.",
          cut: "Браузер побелел, касса продолжает. Очередь этого даже не заметила.",
          done: "Это десктопная программа — файл .exe. Она стоит на самой машине, поэтому оборванный провод не останавливает очередь." },
    ro: { title: "Când cade internetul",
          task: "O casă de marcat la ora de vârf. Trage de fir și vezi cine continuă să lucreze.",
          net: "Internet", on: "conectat", off: "tăiat",
          site: "Magazin în browser", siteOk: "funcționează", siteDead: "fără conexiune — ecran alb",
          app: "Program pe casă", appOk: "funcționează, bonurile se tipăresc",
          ask: "Totul merge. Acum taie firul.",
          cut: "Browserul s-a albit, casa merge mai departe. Coada nici nu a observat.",
          done: "Acesta este un program desktop — un fișier .exe. Stă pe mașina însăși, așa că un fir rupt nu oprește coada." },
  });
})();
