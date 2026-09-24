/* Мини-игры: блок «Платёжное железо».
   Механики и тексты трёх языков лежат рядом: домен владеет и поведением,
   и своими словами. Регистрируется в ядре через SkillGames.add(). */

(function () {
  "use strict";

  var S = window.SkillGames;
  var add = S.add, t = S.t, ui = S.ui;
  var row = S.row, lead = S.lead, count = S.count, on = S.on, later = S.later;

  /* =========================================== блок Платёжное железо ===== */

  /* SerialPort — «Провод и договор». Провод воткнут, но пока обе стороны не
     условятся о скорости, из него лезет каша вместо слов. */
  add("serialport", function (area, api) {
    var SPEEDS = [1200, 9600, 115200];
    var RIGHT = 9600;
    var speed = null;

    function render() {
      var ok = speed === RIGHT;
      area.innerHTML =
        '<div class="sg__wire">🖥 ——— 🖨</div>' +
        '<div class="sg__terminal' + (ok ? " is-ok" : "") + '">' +
          (speed === null ? t("serialport", "silent")
            : ok ? t("serialport", "clear") : t("serialport", "garble")) +
        "</div>" +
        lead(t("serialport", speed === null ? "intro" : ok ? "match" : "mismatch")) +
        row(SPEEDS.map(function (s) {
          return '<button class="sg__step' + (speed === s ? " is-done" : "") + '" data-s="' + s + '">' +
                 s + "</button>";
        }).join(""));

      on(area, ".sg__step", function (b) {
        speed = Number(b.dataset.s); render();
        if (speed === RIGHT) api.finish();
      });
    }
    render();
  }, {
    en: { title: "The wire and the agreement",
          task: "The printer is plugged in. Make it say something you can read.",
          silent: "— nothing yet —",
          garble: "Ð¿Ñ\u0080Ð¸Ð²Ñ â–’ â–“ ?? \u0001\u0016 Ð½Ð¸Ðµ",
          clear: "READY · PAPER OK · 58mm",
          intro: "The wire is in. Choose how fast the two sides talk.",
          mismatch: "The wire is fine, the words are not. One side speaks faster than the other listens.",
          match: "Both sides agreed on the speed, and the letters became words.",
          done: "This is SerialPort. A cable alone is not enough — both ends must agree how fast to speak, or only noise comes through." },
    ru: { title: "Провод и договор",
          task: "Принтер подключён. Сделай так, чтобы он сказал что-нибудь читаемое.",
          silent: "— пока тишина —",
          garble: "Ð¿Ñ\u0080Ð¸Ð²Ñ â–’ â–“ ?? \u0001\u0016 Ð½Ð¸Ðµ",
          clear: "ГОТОВ · БУМАГА ЕСТЬ · 58мм",
          intro: "Провод воткнут. Выбери, с какой скоростью говорят обе стороны.",
          mismatch: "С проводом всё хорошо, со словами нет. Одна сторона говорит быстрее, чем вторая слушает.",
          match: "Стороны сошлись на скорости, и буквы сложились в слова.",
          done: "Это SerialPort. Одного кабеля мало — оба конца должны условиться, с какой скоростью говорить, иначе идёт только шум." },
    ro: { title: "Firul și înțelegerea",
          task: "Imprimanta e conectată. Fă-o să spună ceva ce se poate citi.",
          silent: "— încă liniște —",
          garble: "Ð¿Ñ\u0080Ð¸Ð²Ñ â–’ â–“ ?? \u0001\u0016 Ð½Ð¸Ðµ",
          clear: "GATA · HÂRTIE OK · 58mm",
          intro: "Firul e băgat. Alege cu ce viteză vorbesc cele două părți.",
          mismatch: "Firul e bun, cuvintele nu. O parte vorbește mai repede decât ascultă cealaltă.",
          match: "Părțile s-au înțeles la viteză, iar literele au devenit cuvinte.",
          done: "Acesta este SerialPort. Un cablu nu e de ajuns — ambele capete trebuie să convină cu ce viteză vorbesc, altfel trece doar zgomot." },
  });

  /* Arcus — «Терминал думает». Пока банк не ответил, трогать терминал
     нельзя: нажал второй раз — списал дважды, отменил — деньги повисли. */
  add("arcus", function (area, api) {
    var stage = "idle", result = null;

    function render() {
      area.innerHTML =
        '<div class="sg__pos sg__pos--' + stage + '">' +
          '<div class="sg__pos-screen">' + t("arcus", "scr_" + stage) + "</div>" +
          (stage === "wait" ? '<div class="sg__dots-anim">● ● ●</div>' : "") +
        "</div>" +
        lead(t("arcus", result ? "r_" + result : stage === "wait" ? "waiting" : "intro")) +
        row(stage === "idle"
          ? '<button class="sg__step is-next" data-tap>' + t("arcus", "tap") + "</button>"
          : stage === "wait"
            ? '<button class="sg__step" data-press2>' + t("arcus", "pressAgain") + "</button>" +
              '<button class="sg__step" data-cancel>' + t("arcus", "cancel") + "</button>" +
              '<button class="sg__step is-next" data-wait>' + t("arcus", "justWait") + "</button>"
            : (result === "ok" ? "" :
               '<button class="sg__step is-next" data-reset>' + t("arcus", "retry") + "</button>"));

      on(area, "[data-tap]", function () { stage = "wait"; render(); });
      on(area, "[data-press2]", function () { stage = "done"; result = "double"; render(); });
      on(area, "[data-cancel]", function () { stage = "done"; result = "stuck"; render(); });
      on(area, "[data-wait]", function () {
        render();
        later(function () { stage = "done"; result = "ok"; render(); api.finish(); }, 1500);
      });
      on(area, "[data-reset]", function () { stage = "idle"; result = null; render(); });
    }
    render();
  }, {
    en: { title: "The terminal is thinking",
          task: "The customer tapped the card. The terminal went quiet. Decide what to do.",
          scr_idle: "PRESENT CARD", scr_wait: "PLEASE WAIT", scr_done: "—",
          intro: "A normal purchase, 349 lei. Let the customer tap.",
          waiting: "The bank is deciding. Three seconds feel like a minute with a queue behind you.",
          tap: "customer taps the card",
          pressAgain: "press it again", cancel: "cancel it", justWait: "wait for the answer",
          r_double: "Charged twice. 698 lei off one card, and now somebody has to give 349 back by hand.",
          r_stuck: "You cancelled, the bank did not. The money left the card and hangs in the air for days.",
          r_ok: "APPROVED · 349 MDL. The receipt is printing.",
          retry: "try again",
          done: "This is Arcus. The card terminal answers in its own time, and the code must wait for its word instead of guessing." },
    ru: { title: "Терминал думает",
          task: "Покупатель приложил карту. Терминал замолчал. Решай, что делать.",
          scr_idle: "ПРИЛОЖИТЕ КАРТУ", scr_wait: "ЖДИТЕ", scr_done: "—",
          intro: "Обычная покупка, 349 лей. Пусть покупатель приложит карту.",
          waiting: "Банк принимает решение. Три секунды кажутся минутой, когда за спиной очередь.",
          tap: "покупатель прикладывает карту",
          pressAgain: "нажать ещё раз", cancel: "отменить", justWait: "дождаться ответа",
          r_double: "Списано дважды. 698 лей с одной карты, и теперь кто-то должен вернуть 349 руками.",
          r_stuck: "Ты отменил, банк — нет. Деньги ушли с карты и висят в воздухе несколько дней.",
          r_ok: "ОДОБРЕНО · 349 MDL. Печатается чек.",
          retry: "попробовать снова",
          done: "Это Arcus. Банковский терминал отвечает в своём темпе, и программа обязана дождаться его слова, а не угадывать." },
    ro: { title: "Terminalul se gândește",
          task: "Clientul a apropiat cardul. Terminalul a amuțit. Decide ce faci.",
          scr_idle: "APROPIAȚI CARDUL", scr_wait: "AȘTEPTAȚI", scr_done: "—",
          intro: "O cumpărătură obișnuită, 349 de lei. Lasă clientul să apropie cardul.",
          waiting: "Banca decide. Trei secunde par un minut când ai coadă în spate.",
          tap: "clientul apropie cardul",
          pressAgain: "apasă din nou", cancel: "anulează", justWait: "așteaptă răspunsul",
          r_double: "Taxat de două ori. 698 de lei de pe un card, iar acum cineva trebuie să dea 349 înapoi manual.",
          r_stuck: "Tu ai anulat, banca nu. Banii au plecat de pe card și atârnă în aer zile întregi.",
          r_ok: "APROBAT · 349 MDL. Se tipărește bonul.",
          retry: "încearcă din nou",
          done: "Acesta este Arcus. Terminalul bancar răspunde în ritmul lui, iar programul trebuie să-i aștepte cuvântul, nu să ghicească." },
  });

  /* CashCode — «Купюроприёмник». Машина берёт не всякую бумажку: мятую
     выплюнет, поддельную не пропустит, и сдачу надо посчитать. */
  add("cashcode", function (area, api) {
    var PRICE = 349;
    var NOTES = [
      { k: "n100", v: 100 }, { k: "n200", v: 200 }, { k: "n500", v: 500 },
      { k: "crumpled", v: 0 }, { k: "fake", v: 0 },
    ];
    var paid = 0;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__slot-machine">' +
          '<div class="sg__slot-mouth">' + t("cashcode", "slot") + "</div>" +
          '<div class="sg__slot-sum">' + paid + " / " + PRICE + " MDL</div>" +
        "</div>" +
        lead(msg || t("cashcode", "intro")) +
        row(NOTES.map(function (n) {
          return '<button class="sg__step" data-k="' + n.k + '">' +
                 t("cashcode", "n_" + n.k) + "</button>";
        }).join(""));

      on(area, ".sg__step", function (b) {
        var n = NOTES.filter(function (x) { return x.k === b.dataset.k; })[0];
        if (!n.v) return render(t("cashcode", "rej_" + n.k));
        paid += n.v;
        if (paid < PRICE) return render(t("cashcode", "taken").replace("{n}", n.v));
        area.innerHTML = lead(t("cashcode", "change")
          .replace("{p}", paid).replace("{c}", paid - PRICE));
        api.finish();
      });
    }
    render("");
  }, {
    en: { title: "The note acceptor",
          task: "The purchase costs 349 lei. Feed notes into the machine until it is paid.",
          slot: "▤ insert a note",
          intro: "Five notes in hand. Not all of them will go in.",
          n_n100: "100 lei", n_n200: "200 lei", n_n500: "500 lei",
          n_crumpled: "a crumpled note", n_fake: "a suspicious note",
          rej_crumpled: "Spat back out. The rollers cannot pull a crumpled note straight.",
          rej_fake: "Not accepted. The machine checks the paper itself, not the drawing on it.",
          taken: "{n} lei accepted.",
          change: "Paid {p}. Change: {c} lei, counted out by the machine.",
          done: "This is CashCode. The acceptor decides for itself what is real money, and the code has to handle every refusal it makes." },
    ru: { title: "Купюроприёмник",
          task: "Покупка стоит 349 лей. Скорми машине купюры, пока не хватит.",
          slot: "▤ вставьте купюру",
          intro: "Пять бумажек в руке. Пройдут не все.",
          n_n100: "100 лей", n_n200: "200 лей", n_n500: "500 лей",
          n_crumpled: "мятая купюра", n_fake: "подозрительная купюра",
          rej_crumpled: "Выплюнуло обратно. Ролики не могут протянуть мятую бумажку ровно.",
          rej_fake: "Не приняло. Машина проверяет саму бумагу, а не рисунок на ней.",
          taken: "Принято {n} лей.",
          change: "Внесено {p}. Сдача: {c} лей, машина отсчитала сама.",
          done: "Это CashCode. Приёмник сам решает, что перед ним настоящие деньги, и программа обязана отработать каждый его отказ." },
    ro: { title: "Acceptorul de bancnote",
          task: "Cumpărătura costă 349 de lei. Bagă bancnote în aparat până se acoperă.",
          slot: "▤ introduceți o bancnotă",
          intro: "Cinci bancnote în mână. Nu toate vor intra.",
          n_n100: "100 de lei", n_n200: "200 de lei", n_n500: "500 de lei",
          n_crumpled: "o bancnotă mototolită", n_fake: "o bancnotă suspectă",
          rej_crumpled: "A scuipat-o afară. Rolele nu pot trage dreaptă o bancnotă mototolită.",
          rej_fake: "Nu a acceptat-o. Aparatul verifică hârtia în sine, nu desenul de pe ea.",
          taken: "S-au acceptat {n} lei.",
          change: "Introdus {p}. Rest: {c} lei, numărați de aparat.",
          done: "Acesta este CashCode. Acceptorul decide singur ce sunt bani adevărați, iar programul trebuie să trateze fiecare refuz al lui." },
  });

  /* Datecs — «Чек уже в памяти». Фискальный принтер пишет навсегда:
     ошибку нельзя стереть, её можно только исправить вторым чеком. */
  add("datecs", function (area, api) {
    var printed = false, tried = false, fixed = false;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__receipt' + (printed ? " is-printed" : "") + '">' +
          (printed
            ? "<b>" + t("datecs", "shop") + "</b>" +
              "<span>" + t("datecs", "line") + "</span>" +
              "<span>" + t("datecs", "wrong") + "</span>" +
              "<i>" + t("datecs", "fiscal") + "</i>"
            : '<span class="sg__empty">' + t("datecs", "blank") + "</span>") +
          (fixed ? '<div class="sg__receipt-2"><b>' + t("datecs", "refundTitle") + "</b><span>" +
                   t("datecs", "refundLine") + "</span></div>" : "") +
        "</div>" +
        lead(msg || t("datecs", printed ? "oops" : "intro")) +
        row(!printed
          ? '<button class="sg__step is-next" data-print>' + t("datecs", "print") + "</button>"
          : fixed ? ""
            : '<button class="sg__step" data-erase>' + t("datecs", "erase") + "</button>" +
              (tried ? '<button class="sg__step is-next" data-refund>' + t("datecs", "refund") + "</button>" : ""));

      on(area, "[data-print]", function () { printed = true; render(""); });
      on(area, "[data-erase]", function () { tried = true; render(t("datecs", "cannot")); });
      on(area, "[data-refund]", function () { fixed = true; render(t("datecs", "fixedNote")); api.finish(); });
    }
    render("");
  }, {
    en: { title: "The receipt is already in memory",
          task: "Print a receipt. Then notice that the price on it is wrong.",
          blank: "no receipt yet",
          shop: "SHOP · CHIȘINĂU",
          line: "Winter jacket ........ 1 pc",
          wrong: "TOTAL ............ 3490 MDL",
          fiscal: "FISCAL RECEIPT №004182",
          intro: "One purchase, one receipt. Print it.",
          oops: "A zero too many: 3490 instead of 349. The customer is still at the counter.",
          print: "print the receipt", erase: "erase it and reprint", refund: "print a refund receipt",
          cannot: "There is no erase. The moment it printed, it went into a memory that only accepts new lines — the tax office reads the same memory.",
          refundTitle: "REFUND RECEIPT №004183",
          refundLine: "Winter jacket ..... −3490 MDL",
          fixedNote: "The mistake is not gone — it is answered. Two receipts, and the books add up to zero.",
          done: "This is Datecs. A fiscal printer writes into memory that cannot be rewritten, so a mistake is corrected by a second receipt, never by erasing the first." },
    ru: { title: "Чек уже в памяти",
          task: "Напечатай чек. А потом заметь, что цена в нём неверная.",
          blank: "чека пока нет",
          shop: "МАГАЗИН · КИШИНЁВ",
          line: "Зимняя куртка ........ 1 шт",
          wrong: "ИТОГО ............ 3490 MDL",
          fiscal: "ФИСКАЛЬНЫЙ ЧЕК №004182",
          intro: "Одна покупка, один чек. Напечатай его.",
          oops: "Лишний ноль: 3490 вместо 349. Покупатель ещё стоит у кассы.",
          print: "напечатать чек", erase: "стереть и напечатать заново", refund: "напечатать чек возврата",
          cannot: "Стирания нет. В момент печати чек ушёл в память, которая принимает только новые строки — и эту же память читает налоговая.",
          refundTitle: "ЧЕК ВОЗВРАТА №004183",
          refundLine: "Зимняя куртка ..... −3490 MDL",
          fixedNote: "Ошибка никуда не делась — на неё дан ответ. Два чека, и в книге ноль.",
          done: "Это Datecs. Фискальный принтер пишет в память, которую нельзя переписать, поэтому ошибку исправляют вторым чеком, а не стиранием первого." },
    ro: { title: "Bonul e deja în memorie",
          task: "Tipărește un bon. Apoi observă că prețul de pe el e greșit.",
          blank: "încă niciun bon",
          shop: "MAGAZIN · CHIȘINĂU",
          line: "Geacă de iarnă ........ 1 buc",
          wrong: "TOTAL ............ 3490 MDL",
          fiscal: "BON FISCAL nr. 004182",
          intro: "O cumpărătură, un bon. Tipărește-l.",
          oops: "Un zero în plus: 3490 în loc de 349. Clientul încă e la casă.",
          print: "tipărește bonul", erase: "șterge și tipărește din nou", refund: "tipărește bon de retur",
          cannot: "Ștergere nu există. În clipa tipăririi, bonul a intrat într-o memorie care acceptă doar rânduri noi — și aceeași memorie o citește fiscul.",
          refundTitle: "BON DE RETUR nr. 004183",
          refundLine: "Geacă de iarnă ..... −3490 MDL",
          fixedNote: "Greșeala n-a dispărut — i s-a dat un răspuns. Două bonuri, iar în registru iese zero.",
          done: "Acesta este Datecs. Imprimanta fiscală scrie într-o memorie care nu poate fi rescrisă, așa că greșeala se corectează cu un al doilea bon, nu ștergându-l pe primul." },
  });
})();
