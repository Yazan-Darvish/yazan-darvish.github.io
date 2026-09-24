/* Мини-игры: блок «Аналитика и отчёты».
   Механики и тексты трёх языков лежат рядом: домен владеет и поведением,
   и своими словами. Регистрируется в ядре через SkillGames.add(). */

(function () {
  "use strict";

  var S = window.SkillGames;
  var add = S.add, t = S.t, ui = S.ui;
  var row = S.row, lead = S.lead, count = S.count, on = S.on, later = S.later;

  /* =========================================== блок Аналитика и отчёты === */

  /* Google Analytics 4 — «Где обрывается путь». Продаж мало — это всё, что
     видно без счётчика; со счётчиком видно, на какой ступени люди уходят. */
  add("ga4", function (area, api) {
    var STEPS = [
      { k: "came", n: 1000 }, { k: "card", n: 640 },
      { k: "cart", n: 410 }, { k: "form", n: 380 }, { k: "paid", n: 92 },
    ];
    var on_ = false;

    function render() {
      area.innerHTML =
        '<div class="sg__funnel">' + STEPS.map(function (s, i) {
          var drop = i > 0 ? STEPS[i - 1].n - s.n : 0;
          var worst = i === STEPS.length - 1;
          return '<div class="sg__step-row' + (on_ && worst ? " is-worst" : "") + '">' +
            '<span class="sg__step-name">' + t("ga4", "s_" + s.k) + "</span>" +
            '<span class="sg__step-bar" style="width:' + (on_ ? (s.n / 10) : 0) + '%"></span>' +
            '<span class="sg__step-num">' + (on_ ? s.n : "?") +
              (on_ && drop ? ' <i>−' + drop + "</i>" : "") + "</span></div>";
        }).join("") + "</div>" +
        lead(t("ga4", on_ ? "found" : "blind")) +
        row(on_ ? "" : '<button class="sg__step is-next" data-on>' + t("ga4", "turnOn") + "</button>");

      on(area, "[data-on]", function () { on_ = true; render(); api.finish(); });
    }
    render();
  }, {
    en: { title: "Where the path breaks",
          task: "A thousand people came to the shop today. Ninety-two bought something.",
          s_came: "came in", s_card: "opened a product", s_cart: "added to basket",
          s_form: "started checkout", s_paid: "paid",
          blind: "Sales are low — and that is everything you know. Which step loses them is a guess.",
          found: "288 gave up on the payment page alone. Not the prices, not the photos — one page.",
          turnOn: "turn the counter on",
          done: "This is Google Analytics 4. It shows the step where people walk out, so the fixing starts with the page that actually loses them." },
    ru: { title: "Где обрывается путь",
          task: "Сегодня в магазин зашла тысяча человек. Купили девяносто два.",
          s_came: "зашли", s_card: "открыли товар", s_cart: "положили в корзину",
          s_form: "начали оформлять", s_paid: "оплатили",
          blind: "Продаж мало — и это всё, что известно. На какой ступени их теряют, можно только гадать.",
          found: "288 человек сдались на одной только странице оплаты. Не цены, не фотографии — одна страница.",
          turnOn: "включить счётчик",
          done: "Это Google Analytics 4. Он показывает ступень, на которой люди уходят, и чинить начинают с той страницы, которая их и теряет." },
    ro: { title: "Unde se rupe drumul",
          task: "Azi au intrat în magazin o mie de oameni. Au cumpărat nouăzeci și doi.",
          s_came: "au intrat", s_card: "au deschis un produs", s_cart: "au pus în coș",
          s_form: "au început comanda", s_paid: "au plătit",
          blind: "Vânzările sunt puține — și asta e tot ce se știe. La ce treaptă se pierd, rămâne de ghicit.",
          found: "288 de oameni au renunțat doar pe pagina de plată. Nu prețurile, nu pozele — o singură pagină.",
          turnOn: "pornește contorul",
          done: "Acesta este Google Analytics 4. Arată treapta la care pleacă oamenii, iar reparația începe de la pagina care chiar îi pierde." },
  });

  /* Google Ads — «Билборд и объявление». За щит платят месяц вслепую;
     за объявление — только за пришедших, и видно, сколько из них купили. */
  add("googleads", function (area, api) {
    var choice = null;

    function render() {
      area.innerHTML =
        '<div class="sg__compare">' +
          ["board", "ads"].map(function (k) {
            var sel = choice === k;
            return '<div><b>' + t("googleads", "n_" + k) + "</b>" +
              '<div class="sg__gear' + (sel ? " is-sel" : "") + '">' +
                t("googleads", (sel ? "res_" : "pre_") + k) + "</div></div>";
          }).join("") +
        "</div>" +
        lead(t("googleads", choice === "ads" ? "afterAds"
              : choice === "board" ? "afterBoard" : "intro")) +
        row(choice === "ads" ? "" :
          '<button class="sg__step' + (choice === "board" ? " is-done" : "") + '" data-c="board">' +
            t("googleads", "buyBoard") + "</button>" +
          '<button class="sg__step is-next" data-c="ads">' + t("googleads", "buyAds") + "</button>");

      on(area, "[data-c]", function (b) {
        choice = b.dataset.c; render();
        if (choice === "ads") api.finish();
      });
    }
    render();
  }, {
    en: { title: "The billboard and the ad",
          task: "You have 6000 lei for a month of advertising. Spend it.",
          n_board: "billboard by the road", n_ads: "ad in the search",
          pre_board: "6000 lei for the month", pre_ads: "6000 lei, spent per visitor",
          res_board: "6000 lei spent. Visitors from it: unknown. Sales from it: unknown.",
          res_ads: "2400 visitors · 6000 lei spent · 71 orders · 2.5 lei per visitor",
          intro: "Both cost the same. The difference is what you know afterwards.",
          afterBoard: "The month is over. Somebody probably saw it. Nobody can say who, or whether they came.",
          afterAds: "Every visitor is counted, and 71 of them bought. Now the next 6000 can go where these 71 came from.",
          buyBoard: "buy the billboard", buyAds: "buy the ad",
          done: "This is Google Ads. You pay for people who actually came, and you can see which of them bought — so the next month's money is not spent blind." },
    ru: { title: "Билборд и объявление",
          task: "У тебя 6000 лей на месяц рекламы. Потрать их.",
          n_board: "щит у дороги", n_ads: "объявление в поиске",
          pre_board: "6000 лей за месяц", pre_ads: "6000 лей, списываются за посетителя",
          res_board: "Потрачено 6000 лей. Посетителей с него: неизвестно. Продаж с него: неизвестно.",
          res_ads: "2400 посетителей · потрачено 6000 лей · 71 заказ · 2,5 лея за посетителя",
          intro: "Стоят одинаково. Разница в том, что известно потом.",
          afterBoard: "Месяц прошёл. Кто-то, наверное, увидел. Кто именно и пришёл ли — сказать некому.",
          afterAds: "Каждый посетитель посчитан, и 71 из них купил. Теперь следующие 6000 можно направить туда, откуда пришёл этот 71.",
          buyBoard: "купить щит", buyAds: "купить объявление",
          done: "Это Google Ads. Платишь за тех, кто правда пришёл, и видно, кто из них купил — поэтому деньги следующего месяца тратят не вслепую." },
    ro: { title: "Panoul și anunțul",
          task: "Ai 6000 de lei pentru o lună de reclamă. Cheltuiește-i.",
          n_board: "panou lângă drum", n_ads: "anunț în căutare",
          pre_board: "6000 de lei pe lună", pre_ads: "6000 de lei, scăzuți pe vizitator",
          res_board: "Cheltuiți 6000 de lei. Vizitatori de la el: necunoscut. Vânzări de la el: necunoscut.",
          res_ads: "2400 de vizitatori · 6000 de lei cheltuiți · 71 de comenzi · 2,5 lei pe vizitator",
          intro: "Costă la fel. Diferența e ce știi după.",
          afterBoard: "Luna a trecut. Probabil l-a văzut cineva. Cine anume și dacă a venit nu are cine spune.",
          afterAds: "Fiecare vizitator e numărat, iar 71 dintre ei au cumpărat. Acum următorii 6000 pot merge de unde au venit acei 71.",
          buyBoard: "cumpără panoul", buyAds: "cumpără anunțul",
          done: "Acesta este Google Ads. Plătești pentru cei care chiar au venit și vezi care dintre ei au cumpărat — așa că banii lunii următoare nu se cheltuie orbește." },
  });

  /* Отчётные системы — «Собери свод». Директору нужен не список продаж,
     а разрез: по дням, по категориям, по филиалам — и сразу с итогами. */
  add("reports", function (area, api) {
    var by = null;
    var DATA = {
      day: [["Пн", 12400], ["Вт", 9800], ["Ср", 15200], ["Чт", 11100]],
      cat: [["c1", 21300], ["c2", 14600], ["c3", 8900], ["c4", 3700]],
      shop: [["s1", 26800], ["s2", 13900], ["s3", 7800]],
    };

    function render() {
      var rows = by ? DATA[by] : [];
      var total = rows.reduce(function (s, r) { return s + r[1]; }, 0);
      area.innerHTML =
        row(["day", "cat", "shop"].map(function (k) {
          return '<button class="sg__step' + (by === k ? " is-done" : "") + '" data-b="' + k + '">' +
                 t("reports", "b_" + k) + "</button>";
        }).join("")) +
        '<div class="sg__table">' +
          (by
            ? rows.map(function (r) {
                return '<div class="sg__tr"><span>' + (t("reports", "l_" + r[0]) || r[0]) +
                       "</span><b>" + r[1].toLocaleString() + " MDL</b></div>";
              }).join("") +
              '<div class="sg__tr sg__tr--total"><span>' + t("reports", "total") +
              "</span><b>" + total.toLocaleString() + " MDL</b></div>"
            : '<span class="sg__empty">' + t("reports", "empty") + "</span>") +
        "</div>" +
        lead(t("reports", by ? "ready" : "intro"));

      on(area, "[data-b]", function (b) {
        by = b.dataset.b; render();
        api.finish();
      });
    }
    render();
  }, {
    en: { title: "Build the summary",
          task: "The director does not want a list of 4000 sales. He wants it cut a certain way.",
          b_day: "by day", b_cat: "by category", b_shop: "by shop",
          l_c1: "Appliances", l_c2: "Electronics", l_c3: "Home", l_c4: "Toys",
          l_s1: "Chișinău", l_s2: "Bălți", l_s3: "Cahul",
          total: "Total",
          empty: "pick how to cut it",
          intro: "The same week of sales, three ways of looking at it.",
          ready: "Counted and summed. The next question takes one press, not another evening.",
          done: "This is a reporting system. The same sales are cut by day, by category or by shop on demand — so the answer arrives before the question gets old." },
    ru: { title: "Собери свод",
          task: "Директору не нужен список из 4000 продаж. Ему нужен разрез.",
          b_day: "по дням", b_cat: "по категориям", b_shop: "по магазинам",
          l_c1: "Бытовая техника", l_c2: "Электроника", l_c3: "Для дома", l_c4: "Игрушки",
          l_s1: "Кишинёв", l_s2: "Бельцы", l_s3: "Кагул",
          total: "Итого",
          empty: "выбери, как разрезать",
          intro: "Одна и та же неделя продаж, три способа на неё посмотреть.",
          ready: "Посчитано и просуммировано. Следующий вопрос — одно нажатие, а не ещё один вечер.",
          done: "Это отчётная система. Одни и те же продажи режут по дням, категориям или магазинам по требованию — и ответ успевает раньше, чем вопрос устареет." },
    ro: { title: "Construiește raportul",
          task: "Directorul nu vrea o listă cu 4000 de vânzări. Vrea o tăietură anume.",
          b_day: "pe zile", b_cat: "pe categorii", b_shop: "pe magazine",
          l_c1: "Electrocasnice", l_c2: "Electronice", l_c3: "Pentru casă", l_c4: "Jucării",
          l_s1: "Chișinău", l_s2: "Bălți", l_s3: "Cahul",
          total: "Total",
          empty: "alege cum tai",
          intro: "Aceeași săptămână de vânzări, trei feluri de a o privi.",
          ready: "Numărat și însumat. Următoarea întrebare ia o apăsare, nu încă o seară.",
          done: "Acesta este un sistem de raportare. Aceleași vânzări se taie pe zile, categorii sau magazine la cerere — iar răspunsul ajunge înainte ca întrebarea să se învechească." },
  });
})();
