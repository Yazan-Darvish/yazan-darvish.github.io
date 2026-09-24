/* Мини-игры: блок «Dart».
   Механики и тексты трёх языков лежат рядом: домен владеет и поведением,
   и своими словами. Регистрируется в ядре через SkillGames.add(). */

(function () {
  "use strict";

  var S = window.SkillGames;
  var add = S.add, t = S.t, ui = S.ui;
  var row = S.row, lead = S.lead, count = S.count, on = S.on, later = S.later;

  /* ========================================================== блок Dart === */

  /* Flutter — «Свои кнопки». Родные элементы в каждом телефоне свои, и вид
     расползается; Flutter рисует кнопку сам, поэтому она везде одинакова. */
  add("flutter", function (area, api) {
    var device = "ios", own = false, seen = {};

    function render() {
      seen[device + (own ? "-own" : "")] = true;
      area.innerHTML =
        '<div class="sg__phone sg__phone--' + device + (own ? " is-own" : "") + '">' +
          '<div class="sg__phone-top">' + t("flutter", "d_" + device) + "</div>" +
          '<div class="sg__phone-body">' +
            "<p>" + t("flutter", "screen") + "</p>" +
            '<span class="sg__phone-btn">' + t("flutter", "btn") + "</span>" +
          "</div>" +
        "</div>" +
        lead(t("flutter", own ? "sameLook" : "nativeLook")) +
        row(["ios", "android"].map(function (d) {
          return '<button class="sg__step' + (device === d ? " is-done" : "") + '" data-d="' + d + '">' +
                 t("flutter", "d_" + d) + "</button>";
        }).join("") +
        '<button class="sg__step' + (own ? " is-done" : " is-next") + '" data-own>' +
          t("flutter", own ? "ownOn" : "drawOwn") + "</button>");

      on(area, "[data-d]", function (b) { device = b.dataset.d; render(); });
      on(area, "[data-own]", function () {
        own = true; render();
        if (seen["ios-own"] || seen["android-own"]) api.finish();
      });
    }
    render();
  }, {
    en: { title: "Its own buttons",
          task: "The same screen on two phones. Switch between them and watch the button.",
          d_ios: "iPhone", d_android: "Android",
          screen: "Winter jacket · 349 MDL", btn: "Buy",
          nativeLook: "Each phone lends its own button. Different shape, different corners — the shop looks like two different shops.",
          sameLook: "Now the button is drawn by the app itself. Same shape on both phones.",
          drawOwn: "draw its own button", ownOn: "drawing its own",
          done: "This is Flutter. It draws every button itself instead of borrowing the phone's, so one design looks the same everywhere." },
    ru: { title: "Свои кнопки",
          task: "Один и тот же экран на двух телефонах. Переключайся и смотри на кнопку.",
          d_ios: "iPhone", d_android: "Android",
          screen: "Зимняя куртка · 349 MDL", btn: "Купить",
          nativeLook: "Каждый телефон даёт свою кнопку. Другая форма, другие углы — магазин выглядит как два разных магазина.",
          sameLook: "Теперь кнопку рисует само приложение. На обоих телефонах она одинаковая.",
          drawOwn: "рисовать свою кнопку", ownOn: "рисует свою",
          done: "Это Flutter. Он рисует каждую кнопку сам, а не берёт телефонную, поэтому один макет выглядит везде одинаково." },
    ro: { title: "Butoanele lui",
          task: "Același ecran pe două telefoane. Comută între ele și privește butonul.",
          d_ios: "iPhone", d_android: "Android",
          screen: "Geacă de iarnă · 349 MDL", btn: "Cumpără",
          nativeLook: "Fiecare telefon împrumută butonul lui. Altă formă, alte colțuri — magazinul arată ca două magazine diferite.",
          sameLook: "Acum butonul e desenat de aplicație. Pe ambele telefoane e la fel.",
          drawOwn: "desenează-ți butonul", ownOn: "își desenează butonul",
          done: "Acesta este Flutter. Desenează singur fiecare buton în loc să-l împrumute de la telefon, așa că un design arată la fel peste tot." },
  });

  /* App Store — «Проверка на входе». Приложение не попадает к людям, пока
     живой проверяющий не снимет все замечания. */
  add("appstore", function (area, api) {
    var NOTES = ["crash", "shot", "privacy"];
    var fixed = [], sent = 0;

    function render(verdict) {
      var open = NOTES.filter(function (k) { return fixed.indexOf(k) < 0; });
      area.innerHTML =
        lead(t("appstore", sent ? "back" : "first")) +
        '<div class="sg__notes">' + NOTES.map(function (k) {
          var ok = fixed.indexOf(k) >= 0;
          return '<button class="sg__note' + (ok ? " is-ok" : "") + '" data-k="' + k + '"' +
                 (ok ? " disabled" : "") + ">" + (ok ? "✓ " : "⚠ ") + t("appstore", "n_" + k) + "</button>";
        }).join("") + "</div>" +
        count(t("appstore", "open").replace("{n}", open.length)) +
        row('<button class="sg__step is-next" data-send>' + t("appstore", "send") + "</button>") +
        (verdict ? '<p class="sg__answer' + (open.length ? " is-wrong" : "") + '">' + verdict + "</p>" : "");

      on(area, "[data-k]", function (b) { if (!b.disabled) { fixed.push(b.dataset.k); render(); } });
      on(area, "[data-send]", function () {
        sent++;
        if (open.length) return render(t("appstore", "reject").replace("{n}", open.length));
        area.innerHTML = lead(t("appstore", "approved").replace("{n}", sent));
        api.finish();
      });
    }
    render("");
  }, {
    en: { title: "The check at the door",
          task: "Your app is ready. It still cannot reach anyone until a reviewer lets it through.",
          first: "Send it in and see what comes back.",
          back: "It came back with notes. Fix them and send it again.",
          n_crash: "crashes on an old iPhone", n_shot: "screenshot is the wrong size",
          n_privacy: "no note about what data you collect",
          open: "Notes still open: {n}",
          send: "send for review",
          reject: "Rejected. {n} note(s) left. Nobody has seen your app yet.",
          approved: "Approved on attempt {n}. Now it is on the shelf and people can install it.",
          done: "This is the App Store. Between “it works on my phone” and “people can install it” there is a live reviewer." },
    ru: { title: "Проверка на входе",
          task: "Приложение готово. К людям оно всё равно не попадёт, пока проверяющий не пропустит.",
          first: "Отправь и посмотри, что вернётся.",
          back: "Вернулось с замечаниями. Исправь их и отправь снова.",
          n_crash: "падает на старом iPhone", n_shot: "скриншот не того размера",
          n_privacy: "не написано, какие данные собираешь",
          open: "Замечаний осталось: {n}",
          send: "отправить на проверку",
          reject: "Отклонено. Осталось замечаний: {n}. Приложение пока никто не видел.",
          approved: "Одобрено с {n}-й попытки. Теперь оно на полке, и его можно установить.",
          done: "Это App Store. Между «работает у меня на телефоне» и «люди могут установить» стоит живой проверяющий." },
    ro: { title: "Verificarea la intrare",
          task: "Aplicația e gata. Tot nu ajunge la oameni până nu o lasă să treacă un verificator.",
          first: "Trimite-o și vezi ce se întoarce.",
          back: "S-a întors cu observații. Rezolvă-le și trimite din nou.",
          n_crash: "crapă pe un iPhone vechi", n_shot: "captura de ecran are altă mărime",
          n_privacy: "nu scrie ce date colectezi",
          open: "Observații rămase: {n}",
          send: "trimite la verificare",
          reject: "Respins. Au rămas {n} observații. Aplicația încă n-a văzut-o nimeni.",
          approved: "Aprobat din a {n}-a încercare. Acum e pe raft și poate fi instalată.",
          done: "Acesta este App Store. Între „merge pe telefonul meu” și „oamenii o pot instala” stă un verificator viu." },
  });

  /* Google Play — «Сначала для немногих». Обновление выкатывают частями:
     ошибку замечают на десяти людях, а не на миллионе. */
  add("googleplay", function (area, api) {
    var pct = 100, released = false, broke = false;

    function render() {
      var hit = Math.round(1000000 * pct / 100);
      area.innerHTML =
        '<div class="sg__slider">' +
          '<input type="range" min="1" max="100" value="' + pct + '" data-pct>' +
          '<b>' + pct + "%</b>" +
        "</div>" +
        count(t("googleplay", "reach").replace("{n}", hit.toLocaleString())) +
        (released
          ? '<p class="sg__answer' + (broke ? " is-wrong" : "") + '">' +
            t("googleplay", broke ? "boom" : "safe").replace("{n}", hit.toLocaleString()) + "</p>"
          : lead(t("googleplay", "bug"))) +
        row(released ? "" :
          '<button class="sg__step is-next" data-go>' + t("googleplay", "release") + "</button>");

      var range = area.querySelector("[data-pct]");
      if (range) range.addEventListener("input", function () { pct = Number(range.value); render(); });
      on(area, "[data-go]", function () {
        released = true;
        broke = pct > 20;
        render();
        api.finish();
      });
    }
    render();
  }, {
    en: { title: "First for a few",
          task: "A million people have your app. The new version has a bug you do not know about yet.",
          bug: "Choose how many people get the update, then release it.",
          reach: "The update reaches {n} people",
          release: "release the update",
          boom: "The bug hit {n} people at once. The store fills with one-star reviews before you finish your coffee.",
          safe: "The bug hit {n} people instead of a million. You saw it, pulled the update, and the rest never noticed.",
          done: "This is Google Play. An update can be poured out slowly — a bug is then caught on a few people instead of everyone." },
    ru: { title: "Сначала для немногих",
          task: "Приложение стоит у миллиона человек. В новой версии есть ошибка, о которой ты пока не знаешь.",
          bug: "Выбери, скольким людям уйдёт обновление, и выпусти его.",
          reach: "Обновление получат {n} человек",
          release: "выпустить обновление",
          boom: "Ошибка прилетела сразу {n} людям. Магазин наполняется единицами быстрее, чем ты допьёшь кофе.",
          safe: "Ошибка задела {n} человек вместо миллиона. Ты её увидел, откатил обновление, остальные ничего не заметили.",
          done: "Это Google Play. Обновление можно лить постепенно — тогда ошибку ловят на немногих, а не на всех сразу." },
    ro: { title: "Întâi pentru câțiva",
          task: "Un milion de oameni au aplicația. În versiunea nouă e o eroare despre care încă nu știi.",
          bug: "Alege câți oameni primesc actualizarea și lanseaz-o.",
          reach: "Actualizarea ajunge la {n} oameni",
          release: "lansează actualizarea",
          boom: "Eroarea a lovit {n} oameni deodată. Magazinul se umple de o stea mai repede decât îți bei cafeaua.",
          safe: "Eroarea a atins {n} oameni în loc de un milion. Ai văzut-o, ai retras actualizarea, restul n-au observat nimic.",
          done: "Acesta este Google Play. O actualizare poate fi turnată treptat — atunci eroarea e prinsă pe câțiva, nu pe toți." },
  });

  /* macOS — «Чужому не открою». Мак не запускает программу без подписи:
     сначала её надо заверить, и только потом она откроется у людей. */
  add("macos", function (area, api) {
    var signed = false, tried = false;

    function render() {
      area.innerHTML =
        '<div class="sg__mac' + (tried && !signed ? " is-blocked" : "") + (signed ? " is-open" : "") + '">' +
          '<div class="sg__mac-icon">' + (signed ? "🖥" : tried ? "🚫" : "📦") + "</div>" +
          "<b>" + t("macos", "app") + "</b>" +
          "<span>" + t("macos", signed ? "opened" : tried ? "blocked" : "ready") + "</span>" +
        "</div>" +
        lead(t("macos", signed ? "after" : tried ? "why" : "intro")) +
        row(signed ? ""
          : '<button class="sg__step is-next" data-open>' + t("macos", "open") + "</button>" +
            (tried ? '<button class="sg__step" data-sign>' + t("macos", "sign") + "</button>" : ""));

      on(area, "[data-open]", function () { tried = true; render(); });
      on(area, "[data-sign]", function () { signed = true; render(); api.finish(); });
    }
    render();
  }, {
    en: { title: "Not letting a stranger in",
          task: "You built the program and handed it to a customer with a Mac. Try opening it.",
          app: "Terminal.app",
          ready: "downloaded, not opened yet", blocked: "blocked", opened: "open and running",
          intro: "The file is on the desk. Double-click it.",
          why: "“This app is from an unidentified developer.” The Mac does not know you, so it will not run your file.",
          after: "Same file, same computer. Now it opens because the Mac can see who made it.",
          open: "open the program", sign: "get it signed",
          done: "This is macOS. A program has to be signed and stamped before it will open on someone else's Mac at all." },
    ru: { title: "Чужому не открою",
          task: "Ты собрал программу и отдал её заказчику с маком. Попробуй открыть.",
          app: "Terminal.app",
          ready: "скачано, ещё не открывали", blocked: "заблокировано", opened: "открыто и работает",
          intro: "Файл лежит на столе. Щёлкни по нему дважды.",
          why: "«Программа от неизвестного разработчика.» Мак тебя не знает и запускать твой файл не станет.",
          after: "Тот же файл, тот же компьютер. Теперь открывается, потому что мак видит, кто его сделал.",
          open: "открыть программу", sign: "заверить подписью",
          done: "Это macOS. Программу нужно подписать и заверить, иначе на чужом маке она просто не откроется." },
    ro: { title: "Pe străin nu-l las",
          task: "Ai construit programul și l-ai dat unui client cu Mac. Încearcă să-l deschizi.",
          app: "Terminal.app",
          ready: "descărcat, încă nedeschis", blocked: "blocat", opened: "deschis și funcțional",
          intro: "Fișierul e pe birou. Dă dublu clic pe el.",
          why: "„Aplicație de la un dezvoltator neidentificat.” Mac-ul nu te cunoaște și nu îți rulează fișierul.",
          after: "Același fișier, același calculator. Acum se deschide, pentru că Mac-ul vede cine l-a făcut.",
          open: "deschide programul", sign: "obține semnătura",
          done: "Acesta este macOS. Un program trebuie semnat și legalizat, altfel pe Mac-ul altcuiva pur și simplu nu se deschide." },
  });

  /* Десктоп в Dart — «Одна коробка, три полки». Исходник один, а собрать
     из него можно и файл для Windows, и для мака, и для телефона. */
  add("dartexe", function (area, api) {
    var TARGETS = ["win", "mac", "phone"];
    var built = [];

    function render() {
      area.innerHTML =
        '<div class="sg__source">📁 ' + t("dartexe", "source") + "</div>" +
        '<div class="sg__zones sg__zones--3">' + TARGETS.map(function (k) {
          var ok = built.indexOf(k) >= 0;
          return '<div class="sg__zone' + (ok ? "" : " is-dead") + '"><b>' + t("dartexe", "t_" + k) + "</b>" +
                 "<span>" + t("dartexe", ok ? "f_" + k : "empty") + "</span></div>";
        }).join("") + "</div>" +
        lead(t("dartexe", built.length === TARGETS.length ? "all" : "build")) +
        row(TARGETS.filter(function (k) { return built.indexOf(k) < 0; }).map(function (k) {
          return '<button class="sg__step is-next" data-k="' + k + '">' +
                 t("dartexe", "b_" + k) + "</button>";
        }).join(""));

      on(area, ".sg__step", function (b) {
        built.push(b.dataset.k);
        render();
        if (built.length === TARGETS.length) api.finish();
      });
    }
    render();
  }, {
    en: { title: "One box, three shelves",
          task: "One folder of work. Build it for each shelf and see what comes out.",
          source: "the project — written once",
          t_win: "Windows", t_mac: "Mac", t_phone: "Phone",
          f_win: "Terminal.exe", f_mac: "Terminal.app", f_phone: "Terminal (installed)",
          empty: "nothing here yet",
          build: "Pick a shelf and build for it.",
          all: "Three different files on three different shelves — and one folder behind all of them.",
          b_win: "build for Windows", b_mac: "build for Mac", b_phone: "build for phone",
          done: "This is a desktop build in Dart. The same written work turns into an .exe, a Mac app or a phone app — you do not write it three times." },
    ru: { title: "Одна коробка, три полки",
          task: "Одна папка с работой. Собери её под каждую полку и посмотри, что получится.",
          source: "проект — написан один раз",
          t_win: "Windows", t_mac: "Mac", t_phone: "Телефон",
          f_win: "Terminal.exe", f_mac: "Terminal.app", f_phone: "Terminal (установлено)",
          empty: "здесь пока пусто",
          build: "Выбери полку и собери под неё.",
          all: "Три разных файла на трёх разных полках — и одна папка за всеми ними.",
          b_win: "собрать под Windows", b_mac: "собрать под Mac", b_phone: "собрать под телефон",
          done: "Это десктопная сборка на Dart. Одна и та же работа превращается в .exe, в программу для мака или в приложение — писать трижды не нужно." },
    ro: { title: "O cutie, trei rafturi",
          task: "Un singur dosar de lucru. Construiește-l pentru fiecare raft și vezi ce iese.",
          source: "proiectul — scris o singură dată",
          t_win: "Windows", t_mac: "Mac", t_phone: "Telefon",
          f_win: "Terminal.exe", f_mac: "Terminal.app", f_phone: "Terminal (instalat)",
          empty: "aici încă e gol",
          build: "Alege un raft și construiește pentru el.",
          all: "Trei fișiere diferite pe trei rafturi diferite — și un singur dosar în spatele tuturor.",
          b_win: "construiește pentru Windows", b_mac: "construiește pentru Mac", b_phone: "construiește pentru telefon",
          done: "Aceasta este construcția desktop în Dart. Aceeași muncă devine un .exe, o aplicație de Mac sau una de telefon — nu o scrii de trei ori." },
  });
})();
