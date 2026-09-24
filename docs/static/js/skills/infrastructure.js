/* Мини-игры: блок «Инфраструктура».
   Механики и тексты трёх языков лежат рядом: домен владеет и поведением,
   и своими словами. Регистрируется в ядре через SkillGames.add(). */

(function () {
  "use strict";

  var S = window.SkillGames;
  var add = S.add, t = S.t, ui = S.ui;
  var row = S.row, lead = S.lead, count = S.count, on = S.on, later = S.later;

  /* =============================================== блок Инфраструктура === */

  /* Docker — «Одинаковый ящик». У тебя работает, у коллеги нет: не совпало
     окружение. В ящик кладут не только код, но и всё, что ему нужно. */
  add("docker", function (area, api) {
    var DIFFS = ["php", "lib", "setting"];
    var boxed = false, tried = false;

    function render() {
      area.innerHTML =
        '<div class="sg__compare">' +
          '<div><b>' + t("docker", "mine") + "</b>" +
            '<div class="sg__gear">' + t("docker", "works") + "</div></div>" +
          '<div><b>' + t("docker", "theirs") + "</b>" +
            '<div class="sg__gear' + (boxed ? "" : tried ? " is-bad" : "") + '">' +
              t("docker", boxed ? "works" : tried ? "fails" : "unknown") + "</div></div>" +
        "</div>" +
        (tried && !boxed
          ? '<div class="sg__notes">' + DIFFS.map(function (k) {
              return '<div class="sg__note">≠ ' + t("docker", "d_" + k) + "</div>";
            }).join("") + "</div>"
          : "") +
        lead(t("docker", boxed ? "after" : tried ? "why" : "intro")) +
        row(boxed ? ""
          : '<button class="sg__step is-next" data-run>' + t("docker", "run") + "</button>" +
            (tried ? '<button class="sg__step" data-box>' + t("docker", "box") + "</button>" : ""));

      on(area, "[data-run]", function () { tried = true; render(); });
      on(area, "[data-box]", function () { boxed = true; render(); api.finish(); });
    }
    render();
  }, {
    en: { title: "The same box",
          task: "It runs on your machine. Try running the very same code on a colleague's.",
          mine: "your machine", theirs: "colleague's machine",
          works: "running", fails: "does not start", unknown: "not tried yet",
          d_php: "different language version", d_lib: "a library is missing",
          d_setting: "a setting is set differently",
          intro: "Same code, two machines. Run it on the other one.",
          why: "Three things do not match. The code is identical — the ground under it is not.",
          after: "Now the box carries the language, the libraries and the settings along with the code. It starts the same on both.",
          run: "run on the colleague's machine", box: "put it all in one box",
          done: "This is Docker. It packs the code together with everything it needs, so “works on my machine” stops being an excuse." },
    ru: { title: "Одинаковый ящик",
          task: "У тебя работает. Попробуй запустить тот же самый код у коллеги.",
          mine: "твоя машина", theirs: "машина коллеги",
          works: "работает", fails: "не запускается", unknown: "ещё не пробовали",
          d_php: "другая версия языка", d_lib: "не хватает библиотеки",
          d_setting: "настройка выставлена иначе",
          intro: "Код один, машины две. Запусти на второй.",
          why: "Три вещи не совпали. Код одинаковый — земля под ним разная.",
          after: "Теперь ящик везёт вместе с кодом и язык, и библиотеки, и настройки. Запускается одинаково на обеих.",
          run: "запустить у коллеги", box: "сложить всё в один ящик",
          done: "Это Docker. Он упаковывает код вместе со всем, что тому нужно, и «у меня работает» перестаёт быть отговоркой." },
    ro: { title: "Aceeași ladă",
          task: "La tine merge. Încearcă să rulezi exact același cod la un coleg.",
          mine: "mașina ta", theirs: "mașina colegului",
          works: "merge", fails: "nu pornește", unknown: "încă neîncercat",
          d_php: "altă versiune de limbaj", d_lib: "lipsește o bibliotecă",
          d_setting: "o setare e pusă altfel",
          intro: "Cod unul, mașini două. Rulează-l pe a doua.",
          why: "Trei lucruri nu se potrivesc. Codul e identic — pământul de sub el, nu.",
          after: "Acum lada duce odată cu codul și limbajul, și bibliotecile, și setările. Pornește la fel pe amândouă.",
          run: "rulează la coleg", box: "pune totul într-o ladă",
          done: "Acesta este Docker. Împachetează codul împreună cu tot ce îi trebuie, iar „la mine merge” încetează să mai fie o scuză." },
  });

  /* Kubernetes — «Смотритель». Домик падает ночью: без смотрителя он лежит
     до утра, со смотрителем поднимается сам за несколько секунд. */
  add("kube", function (area, api) {
    var HOUSES = [0, 1, 2, 3];
    var down = null, watcher = false, fellWithout = false;

    function render() {
      area.innerHTML =
        '<div class="sg__houses sg__houses--4">' + HOUSES.map(function (i) {
          return '<div class="sg__house' + (down === i ? " is-down" : "") + '">' +
                 (down === i ? "✗" : "✓") + "</div>";
        }).join("") + "</div>" +
        '<div class="sg__switch"><span>' + t("kube", "watcher") + "</span>" +
          '<button class="sg__toggle' + (watcher ? " is-on" : "") + '" data-w>' +
            t("kube", watcher ? "on" : "off") + "</button></div>" +
        lead(t("kube", down === null
          ? (fellWithout ? "backUp" : "calm")
          : (watcher ? "watching" : "lying"))) +
        row(down === null
          ? '<button class="sg__step is-next" data-fall>' + t("kube", "fall") + "</button>"
          : (watcher ? "" : '<button class="sg__step is-next" data-lift>' + t("kube", "lift") + "</button>"));

      on(area, "[data-w]", function () { watcher = !watcher; render(); });
      on(area, "[data-fall]", function () {
        down = 1 + Math.floor(Math.random() * 3);
        render();
        if (watcher) later(function () {
          down = null; render();
          area.insertAdjacentHTML("beforeend", '<p class="sg__answer">' + t("kube", "self") + "</p>");
          api.finish();
        }, 1400);
        else fellWithout = true;
      });
      on(area, "[data-lift]", function () { down = null; render(); });
    }
    render();
  }, {
    en: { title: "The keeper",
          task: "It is 03:00. A house falls over. See what happens with and without a keeper.",
          watcher: "Keeper on duty", on: "on duty", off: "asleep",
          calm: "Four houses, all standing. Knock one over.",
          lying: "The house is down and will stay down until somebody wakes up and lifts it.",
          watching: "The house is down. The keeper noticed…",
          backUp: "You lifted it yourself — after the phone call, at four in the morning.",
          self: "Back up in two seconds. Nobody was woken, nobody phoned.",
          fall: "knock a house over", lift: "get up and lift it",
          done: "This is Kubernetes. It watches the houses and stands them back up itself, so a night crash does not need a human." },
    ru: { title: "Смотритель",
          task: "Три часа ночи. Домик упал. Посмотри, что будет со смотрителем и без него.",
          watcher: "Смотритель на посту", on: "на посту", off: "спит",
          calm: "Четыре домика, все стоят. Урони один.",
          lying: "Домик лежит и будет лежать, пока кто-нибудь не проснётся и не поднимет.",
          watching: "Домик упал. Смотритель заметил…",
          backUp: "Поднял сам — после звонка, в четыре утра.",
          self: "Поднялся за две секунды. Никого не разбудили, никто не звонил.",
          fall: "уронить домик", lift: "встать и поднять",
          done: "Это Kubernetes. Он следит за домиками и поднимает их сам, поэтому ночное падение не требует человека." },
    ro: { title: "Paznicul",
          task: "Este ora 03:00. O casă cade. Vezi ce se întâmplă cu paznic și fără.",
          watcher: "Paznic de serviciu", on: "de serviciu", off: "doarme",
          calm: "Patru case, toate în picioare. Dărâmă una.",
          lying: "Casa e la pământ și rămâne acolo până se trezește cineva să o ridice.",
          watching: "Casa a căzut. Paznicul a observat…",
          backUp: "Ai ridicat-o tu — după telefon, la patru dimineața.",
          self: "S-a ridicat în două secunde. Nimeni nu a fost trezit, nimeni nu a sunat.",
          fall: "dărâmă o casă", lift: "scoală-te și ridic-o",
          done: "Acesta este Kubernetes. Veghează casele și le ridică singur, așa că o cădere de noapte nu are nevoie de un om." },
  });

  /* Kafka — «Лента на конвейере». Событие кладут на ленту, и его забирают
     все, кому нужно, каждый в своём темпе; звонком так не получится. */
  add("kafka", function (area, api) {
    var READERS = ["stock", "mail", "stats"];
    var mode = null, got = [];

    function render(msg) {
      area.innerHTML =
        '<div class="sg__belt' + (mode === "belt" ? " is-on" : "") + '">' +
          (mode ? "📦 " + t("kafka", "event") : t("kafka", "empty")) + "</div>" +
        '<div class="sg__zones sg__zones--3">' + READERS.map(function (k) {
          return '<div class="sg__zone' + (got.indexOf(k) >= 0 ? "" : " is-dead") + '"><b>' +
                 t("kafka", "r_" + k) + "</b><span>" +
                 t("kafka", got.indexOf(k) >= 0 ? "gotIt" : "waiting") + "</span></div>";
        }).join("") + "</div>" +
        lead(t("kafka", mode === "belt" ? "beltNote" : mode === "call" ? "callNote" : "intro")) +
        row(mode === "belt" ? "" :
          '<button class="sg__step' + (mode === "call" ? " is-done" : " is-next") + '" data-call>' +
            t("kafka", "byCall") + "</button>" +
          '<button class="sg__step is-next" data-belt>' + t("kafka", "byBelt") + "</button>") +
        (msg ? '<p class="sg__' + (mode === "belt" ? "answer" : "warn") + '">' + msg + "</p>" : "");

      on(area, "[data-call]", function () {
        mode = "call"; got = ["stock"];       // остальные были заняты — до них не дозвонились
        render(t("kafka", "lost"));
      });
      on(area, "[data-belt]", function () {
        mode = "belt"; got = [];
        render("");
        READERS.forEach(function (k, i) {
          later(function () {
            got.push(k); render(i === READERS.length - 1 ? t("kafka", "allGot") : "");
            if (i === READERS.length - 1) api.finish();
          }, 500 + i * 550);
        });
      });
    }
    render("");
  }, {
    en: { title: "The belt",
          task: "One order was placed. Three departments need to know. Get the news to all three.",
          event: "order #1841", empty: "nothing on the belt yet",
          r_stock: "warehouse", r_mail: "receipts", r_stats: "reports",
          gotIt: "knows about it", waiting: "does not know",
          intro: "Choose how to spread the news.",
          callNote: "You phoned around. Two lines were busy at that moment.",
          beltNote: "The order was put on the belt. Each department picks it up when it is free.",
          byCall: "phone each of them", byBelt: "put it on the belt",
          lost: "One picked up, two did not. Those two will never learn about this order.",
          allGot: "All three know. Nobody waited for anybody, and nothing was lost.",
          done: "This is Kafka. Events go onto a belt that everybody reads at their own pace, so a busy department misses nothing." },
    ru: { title: "Лента на конвейере",
          task: "Оформлен один заказ. Знать о нём должны три отдела. Донеси новость до всех.",
          event: "заказ №1841", empty: "на ленте пока пусто",
          r_stock: "склад", r_mail: "чеки", r_stats: "отчёты",
          gotIt: "знает", waiting: "не знает",
          intro: "Выбери, как разнести новость.",
          callNote: "Ты обзвонил всех. Две линии в этот момент были заняты.",
          beltNote: "Заказ положили на ленту. Каждый отдел забирает его, когда освободится.",
          byCall: "обзвонить каждого", byBelt: "положить на ленту",
          lost: "Один снял трубку, двое нет. Про этот заказ они уже не узнают.",
          allGot: "Знают все трое. Никто никого не ждал, и ничего не потерялось.",
          done: "Это Kafka. События кладут на ленту, и её читают все в своём темпе, поэтому занятый отдел ничего не пропускает." },
    ro: { title: "Banda rulantă",
          task: "S-a plasat o comandă. Trei departamente trebuie să afle. Du vestea la toate trei.",
          event: "comanda nr. 1841", empty: "pe bandă încă nu e nimic",
          r_stock: "depozit", r_mail: "bonuri", r_stats: "rapoarte",
          gotIt: "știe", waiting: "nu știe",
          intro: "Alege cum răspândești vestea.",
          callNote: "Ai sunat pe fiecare. Două linii erau ocupate în acel moment.",
          beltNote: "Comanda a fost pusă pe bandă. Fiecare departament o ia când se eliberează.",
          byCall: "sună-i pe fiecare", byBelt: "pune-o pe bandă",
          lost: "Unul a răspuns, doi nu. Despre comanda asta ei nu vor afla niciodată.",
          allGot: "Știu toți trei. Nimeni nu a așteptat pe nimeni și nimic nu s-a pierdut.",
          done: "Aceasta este Kafka. Evenimentele merg pe o bandă pe care toți o citesc în ritmul lor, așa că un departament ocupat nu pierde nimic." },
  });

  /* RabbitMQ — «Раздатчик заданий». В отличие от ленты задание достаётся
     ровно одному исполнителю и исчезает: добавил рук — разобрали быстрее. */
  add("rabbit", function (area, api) {
    var TOTAL = 12;
    var left = TOTAL, workers = 1, running = false, ticks = 0;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__queue">' +
          Array.apply(null, Array(left)).map(function () { return '<span class="sg__task">✉</span>'; }).join("") +
          (left ? "" : '<span class="sg__empty">' + t("rabbit", "empty") + "</span>") +
        "</div>" +
        '<div class="sg__switch"><span>' + t("rabbit", "workers") + "</span>" +
          '<span class="sg__qty"><button data-d="-1">−</button><b>' + workers +
          '</b><button data-d="1">+</button></span></div>' +
        count(t("rabbit", "counter").replace("{n}", left).replace("{t}", TOTAL)) +
        row(running ? "" : '<button class="sg__step is-next" data-go>' + t("rabbit", "start") + "</button>") +
        (msg ? '<p class="sg__answer">' + msg + "</p>" : lead(t("rabbit", "note")));

      on(area, "[data-d]", function (b) {
        if (running) return;
        workers = Math.min(4, Math.max(1, workers + Number(b.dataset.d)));
        render();
      });
      on(area, "[data-go]", function () {
        running = true; render();
        (function tick() {
          left = Math.max(0, left - workers);
          ticks++;
          if (!left) {
            render(t("rabbit", "done_").replace("{s}", ticks).replace("{w}", workers));
            return api.finish();
          }
          render();
          later(tick, 500);
        })();
      });
    }
    render("");
  }, {
    en: { title: "Handing out the work",
          task: "Twelve receipts to send. Decide how many hands take them, then start.",
          workers: "Workers", empty: "the queue is empty",
          counter: "Left in the queue: {n} of {t}",
          note: "Each receipt goes to exactly one worker and then leaves the queue.",
          start: "start",
          done_: "Done in {s} rounds with {w} worker(s). Nobody did the same receipt twice.",
          done: "This is RabbitMQ. Work waits in a queue and each item goes to exactly one worker — add hands and the queue drains faster." },
    ru: { title: "Раздатчик заданий",
          task: "Двенадцать чеков надо отправить. Реши, сколько рук их разбирают, и запускай.",
          workers: "Работников", empty: "очередь пуста",
          counter: "Осталось в очереди: {n} из {t}",
          note: "Каждый чек достаётся ровно одному работнику и уходит из очереди.",
          start: "запустить",
          done_: "Разобрали за {s} подход(а) силами {w} работник(ов). Никто не делал один и тот же чек дважды.",
          done: "Это RabbitMQ. Работа ждёт в очереди, каждое задание достаётся ровно одному исполнителю — добавил рук, очередь ушла быстрее." },
    ro: { title: "Împărțirea treburilor",
          task: "Douăsprezece bonuri de trimis. Hotărăște câte mâini le iau și pornește.",
          workers: "Lucrători", empty: "coada e goală",
          counter: "Rămase în coadă: {n} din {t}",
          note: "Fiecare bon ajunge la exact un lucrător și apoi iese din coadă.",
          start: "pornește",
          done_: "Gata în {s} runde cu {w} lucrător(i). Nimeni nu a făcut același bon de două ori.",
          done: "Acesta este RabbitMQ. Munca așteaptă la coadă și fiecare sarcină ajunge la exact un lucrător — adaugi mâini, coada se golește mai repede." },
  });

  /* CI/CD — «Конвейер вместо рук». Руками легко пропустить шаг и узнать
     об этом от покупателей; конвейер не забывает и не торопится. */
  add("cicd", function (area, api) {
    var STEPS = ["build", "test", "backup", "deploy"];
    var doneSteps = [], auto = false, blown = false;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__pipe">' + STEPS.map(function (k) {
          var ok = doneSteps.indexOf(k) >= 0;
          return '<div class="sg__pipe-step' + (ok ? " is-ok" : "") + '">' +
                 t("cicd", "s_" + k) + "</div>";
        }).join("") + "</div>" +
        lead(t("cicd", auto ? "autoNote" : "handNote")) +
        row(auto ? "" : STEPS.map(function (k) {
              var ok = doneSteps.indexOf(k) >= 0;
              return '<button class="sg__step' + (ok ? " is-done" : "") + '" data-k="' + k + '"' +
                     (ok ? " disabled" : "") + ">" + t("cicd", "s_" + k) + "</button>";
            }).join("") +
            '<button class="sg__step is-next" data-auto>' + t("cicd", "pipeline") + "</button>") +
        (msg ? '<p class="sg__' + (blown ? "warn" : "answer") + '">' + msg + "</p>" : "");

      on(area, "[data-k]", function (b) {
        if (b.disabled) return;
        var k = b.dataset.k;
        doneSteps.push(k);
        if (k !== "deploy") return render("");
        if (doneSteps.indexOf("test") < 0) {
          blown = true;
          return render(t("cicd", "skipped"));
        }
        blown = false;
        render(t("cicd", "byHandOk"));
      });
      on(area, "[data-auto]", function () {
        auto = true; doneSteps = []; blown = false; render("");
        STEPS.forEach(function (k, i) {
          later(function () {
            doneSteps.push(k);
            render(i === STEPS.length - 1 ? t("cicd", "pipeDone") : "");
            if (i === STEPS.length - 1) api.finish();
          }, 400 + i * 450);
        });
      });
    }
    render("");
  }, {
    en: { title: "A line instead of hands",
          task: "Put the new version on the site. Four steps — press them yourself, in any order you like.",
          s_build: "assemble", s_test: "run the checks", s_backup: "make a backup", s_deploy: "put it live",
          handNote: "Nothing stops you from putting it live straight away. Nothing reminds you either.",
          autoNote: "The line runs the steps itself, always in the same order.",
          pipeline: "let a line do it",
          skipped: "Live without checks. The customers found the bug before you did.",
          byHandOk: "It went fine this time. It goes fine most times — that is what makes skipping a step tempting.",
          pipeDone: "Four steps, one press, same order every time. Nothing to forget.",
          done: "This is CI/CD. Assembling, checking and releasing run as one line, so a step cannot be skipped because somebody was in a hurry." },
    ru: { title: "Конвейер вместо рук",
          task: "Выложи новую версию на сайт. Четыре шага — жми сам, в любом порядке.",
          s_build: "собрать", s_test: "прогнать проверки", s_backup: "сделать бэкап", s_deploy: "выложить",
          handNote: "Ничто не мешает выложить сразу. И ничто не напомнит, что ты забыл.",
          autoNote: "Конвейер проходит шаги сам, всегда в одном порядке.",
          pipeline: "поручить конвейеру",
          skipped: "Выложено без проверок. Ошибку нашли покупатели раньше тебя.",
          byHandOk: "В этот раз обошлось. Обходится почти всегда — потому и тянет пропустить шаг.",
          pipeDone: "Четыре шага, одно нажатие, порядок всегда один. Забыть нечего.",
          done: "Это CI/CD. Сборка, проверка и выкладка идут одной лентой, и шаг нельзя пропустить из-за спешки." },
    ro: { title: "O bandă în loc de mâini",
          task: "Pune versiunea nouă pe site. Patru pași — apasă-i tu, în ce ordine vrei.",
          s_build: "asamblează", s_test: "rulează verificările", s_backup: "fă o copie", s_deploy: "pune pe live",
          handNote: "Nimic nu te oprește să pui direct pe live. Și nimic nu-ți amintește că ai uitat ceva.",
          autoNote: "Banda trece pașii singură, mereu în aceeași ordine.",
          pipeline: "lasă banda să o facă",
          skipped: "Pus pe live fără verificări. Clienții au găsit eroarea înaintea ta.",
          byHandOk: "De data asta a mers. Merge aproape mereu — de asta e tentant să sari un pas.",
          pipeDone: "Patru pași, o apăsare, aceeași ordine de fiecare dată. Nu ai ce uita.",
          done: "Acesta este CI/CD. Asamblarea, verificarea și lansarea merg pe o singură bandă, iar un pas nu poate fi sărit din grabă." },
  });

  /* AWS S3 — «Склад для картинок». Диск сервера кончается быстрее, чем
     кажется: фотографии выносят на отдельный склад, и место возвращается. */
  add("s3", function (area, api) {
    var used = 20, moved = false;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__disk"><div class="sg__disk-fill' + (used > 90 ? " is-full" : "") +
          '" style="width:' + Math.min(100, used) + '%"></div></div>' +
        count(t("s3", "disk").replace("{n}", Math.min(100, used))) +
        lead(t("s3", moved ? "after" : used > 90 ? "full" : "intro")) +
        row(moved ? "" :
          '<button class="sg__step is-next" data-up>' + t("s3", "upload") + "</button>" +
          (used > 90 ? '<button class="sg__step" data-move>' + t("s3", "move") + "</button>" : "")) +
        (msg ? '<p class="sg__warn">' + msg + "</p>" : "");

      on(area, "[data-up]", function () {
        used += 25;
        render(used > 90 ? t("s3", "down") : "");
      });
      on(area, "[data-move]", function () {
        moved = true; used = 12; render("");
        api.finish();
      });
    }
    render("");
  }, {
    en: { title: "A warehouse for pictures",
          task: "Customers keep uploading photos of their orders. Watch the server's disk.",
          disk: "Server disk: {n}% full",
          intro: "Upload a batch of photos and see what happens.",
          full: "The disk is full. The site is not slow — it is down.",
          after: "The photos are all still there; they just live in a warehouse of their own now.",
          upload: "upload more photos", move: "move them to a warehouse",
          down: "No space left. Orders stopped going through.",
          done: "This is AWS S3. Files live in a warehouse built for files, so the server's own disk never fills up with pictures." },
    ru: { title: "Склад для картинок",
          task: "Покупатели грузят фотографии своих заказов. Следи за диском сервера.",
          disk: "Диск сервера занят на {n}%",
          intro: "Загрузи партию фотографий и посмотри, что будет.",
          full: "Диск кончился. Сайт не тормозит — он лежит.",
          after: "Фотографии никуда не делись, просто живут теперь на отдельном складе.",
          upload: "загрузить ещё фотографий", move: "вынести на склад",
          down: "Места нет. Заказы перестали проходить.",
          done: "Это AWS S3. Файлы лежат на складе, построенном под файлы, и диск сервера не забивается картинками." },
    ro: { title: "Un depozit pentru poze",
          task: "Clienții încarcă poze cu comenzile lor. Urmărește discul serverului.",
          disk: "Discul serverului e ocupat {n}%",
          intro: "Încarcă un lot de poze și vezi ce se întâmplă.",
          full: "Discul s-a umplut. Site-ul nu merge greu — e căzut.",
          after: "Pozele n-au dispărut, doar stau acum într-un depozit al lor.",
          upload: "încarcă mai multe poze", move: "mută-le în depozit",
          down: "Nu mai e loc. Comenzile nu mai trec.",
          done: "Acesta este AWS S3. Fișierele stau într-un depozit făcut pentru fișiere, iar discul serverului nu se umple cu poze." },
  });

  /* AWS SES — «Почтальон, которому верят». Письма с безымянного сервера
     падают в спам; отправитель с репутацией доносит их во «Входящие». */
  add("ses", function (area, api) {
    var LETTERS = [0, 1, 2, 3, 4];
    var sent = null;

    function render() {
      var spam = sent === "self" ? [1, 2, 3, 4] : [];
      area.innerHTML =
        '<div class="sg__boxes">' +
          '<div class="sg__box"><b>' + t("ses", "inbox") + "</b>" +
            (sent ? LETTERS.filter(function (i) { return spam.indexOf(i) < 0; })
              .map(function () { return "✉"; }).join(" ") : "—") + "</div>" +
          '<div class="sg__box sg__box--spam"><b>' + t("ses", "spam") + "</b>" +
            (sent ? (spam.map(function () { return "✉"; }).join(" ") || "—") : "—") + "</div>" +
        "</div>" +
        lead(t("ses", sent === "self" ? "bad" : sent === "ses" ? "good" : "intro")) +
        row(sent === "ses" ? "" :
          '<button class="sg__step' + (sent === "self" ? " is-done" : " is-next") + '" data-m="self">' +
            t("ses", "bySelf") + "</button>" +
          '<button class="sg__step is-next" data-m="ses">' + t("ses", "byPost") + "</button>");

      on(area, "[data-m]", function (b) {
        sent = b.dataset.m; render();
        if (sent === "ses") api.finish();
      });
    }
    render();
  }, {
    en: { title: "A postman they trust",
          task: "Five customers are waiting for their receipts. Send them.",
          inbox: "Inbox", spam: "Spam",
          intro: "Five receipts, ready to go. Choose who carries them.",
          bad: "One arrived, four went to spam. Nobody at the mail company knows your server, so it is treated as a stranger.",
          good: "All five landed in the inbox. The postman has a name the mail companies already trust.",
          bySelf: "send from our own server", byPost: "send through a known postman",
          done: "This is AWS SES. Letters go out through a sender with a reputation, so receipts land in the inbox instead of the spam folder." },
    ru: { title: "Почтальон, которому верят",
          task: "Пятеро покупателей ждут свои чеки. Отправь их.",
          inbox: "Входящие", spam: "Спам",
          intro: "Пять чеков готовы к отправке. Выбери, кто их понесёт.",
          bad: "Один дошёл, четыре упали в спам. Твой сервер почтовым службам незнаком, и с ним обращаются как с чужим.",
          good: "Все пять легли во «Входящие». У почтальона есть имя, которому почтовые службы уже доверяют.",
          bySelf: "отправить со своего сервера", byPost: "отправить через известного почтальона",
          done: "Это AWS SES. Письма уходят через отправителя с репутацией, и чеки попадают во «Входящие», а не в спам." },
    ro: { title: "Un poștaș în care au încredere",
          task: "Cinci clienți își așteaptă bonurile. Trimite-le.",
          inbox: "Inbox", spam: "Spam",
          intro: "Cinci bonuri gata de trimis. Alege cine le duce.",
          bad: "Unul a ajuns, patru au căzut în spam. Serverul tău nu e cunoscut de serviciile de mail, așa că e tratat ca un străin.",
          good: "Toate cinci au ajuns în inbox. Poștașul are un nume în care serviciile de mail au deja încredere.",
          bySelf: "trimite de pe serverul nostru", byPost: "trimite printr-un poștaș cunoscut",
          done: "Acesta este AWS SES. Scrisorile pleacă printr-un expeditor cu reputație, iar bonurile ajung în inbox, nu în spam." },
  });

  /* Sentry — «Сигнализация». Покупатель молча уходит и ничего не сообщает;
     сигнализация приносит поломку сама, с местом и временем. */
  add("sentry", function (area, api) {
    var alarm = false, happened = false;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__shop">' +
          '<div class="sg__customer' + (happened ? " is-gone" : "") + '">🧍</div>' +
          '<div class="sg__till">' + (happened ? "💥" : "🧾") + "</div>" +
        "</div>" +
        '<div class="sg__switch"><span>' + t("sentry", "alarm") + "</span>" +
          '<button class="sg__toggle' + (alarm ? " is-on" : "") + '" data-a>' +
            t("sentry", alarm ? "on" : "off") + "</button></div>" +
        lead(t("sentry", happened ? (alarm ? "told" : "silent") : "intro")) +
        row(happened ? "" :
          '<button class="sg__step is-next" data-break>' + t("sentry", "breakIt") + "</button>") +
        (msg ? '<p class="sg__answer">' + msg + "</p>" : "");

      on(area, "[data-a]", function () { alarm = !alarm; render(""); });
      on(area, "[data-break]", function () {
        happened = true;
        render(alarm ? t("sentry", "report") : "");
        if (alarm) api.finish();
      });
    }
    render("");
  }, {
    en: { title: "The alarm",
          task: "A customer is paying. Something is about to go wrong. Decide whether you will hear about it.",
          alarm: "Alarm", on: "on", off: "off",
          intro: "A normal evening. Break the payment and see what reaches you.",
          silent: "He left without a word. No letter, no call, no review. You will never know this happened.",
          told: "He left too — but this time you know.",
          report: "03:12 · payment page · “cannot read card response” · 4th time today · customer #118",
          breakIt: "break the payment",
          done: "This is Sentry. A break reports itself, with the place, the time and how often — instead of walking out of the door in silence." },
    ru: { title: "Сигнализация",
          task: "Покупатель оплачивает заказ. Сейчас что-то сломается. Реши, узнаешь ли ты об этом.",
          alarm: "Сигнализация", on: "включена", off: "выключена",
          intro: "Обычный вечер. Сломай оплату и посмотри, что до тебя дойдёт.",
          silent: "Он ушёл молча. Ни письма, ни звонка, ни отзыва. Ты об этом не узнаешь никогда.",
          told: "Он всё равно ушёл — но теперь ты знаешь.",
          report: "03:12 · страница оплаты · «не читается ответ терминала» · 4-й раз за сегодня · покупатель №118",
          breakIt: "сломать оплату",
          done: "Это Sentry. Поломка сама сообщает о себе — где, когда и сколько раз, — вместо того чтобы молча выйти за дверь." },
    ro: { title: "Alarma",
          task: "Un client plătește comanda. Acum se va strica ceva. Hotărăște dacă vei afla.",
          alarm: "Alarmă", on: "pornită", off: "oprită",
          intro: "O seară obișnuită. Strică plata și vezi ce ajunge la tine.",
          silent: "A plecat fără un cuvânt. Nicio scrisoare, niciun telefon, nicio recenzie. Nu vei afla niciodată.",
          told: "A plecat și de data asta — dar acum știi.",
          report: "03:12 · pagina de plată · „nu se citește răspunsul terminalului” · a 4-a oară azi · clientul nr. 118",
          breakIt: "strică plata",
          done: "Acesta este Sentry. Defectul se anunță singur — unde, când și de câte ori — în loc să iasă tăcut pe ușă." },
  });

  /* Bash — «Одна строчка вместо ста кликов». Команда с шаблоном достаёт
     из кучи ровно то, что подходит, и делает это со всеми разом. */
  add("bash", function (area, api) {
    var FILES = [
      "photo-1.jpg", "photo-2.jpg", "photo-3.jpg", "invoice.pdf",
      "photo-4.jpg", "notes.txt", "photo-5.jpg", "logo.png",
    ];
    var pattern = null, ran = false;

    function match(f) {
      if (pattern === "all") return true;
      if (pattern === "jpg") return /\.jpg$/.test(f);
      return false;
    }

    function render() {
      area.innerHTML =
        '<div class="sg__files">' + FILES.map(function (f) {
          return '<div class="sg__file' + (pattern && match(f) ? " is-hit" : "") + '">' +
                 (ran && match(f) ? f.replace(".jpg", "-small.jpg") : f) + "</div>";
        }).join("") + "</div>" +
        '<div class="sg__search">' + (pattern === "jpg" ? "resize *.jpg" :
          pattern === "all" ? "resize *" : t("bash", "prompt")) + "</div>" +
        lead(t("bash", ran ? "after" : pattern === "all" ? "tooWide" : pattern ? "picked" : "intro")) +
        row(ran ? "" :
          '<button class="sg__step' + (pattern === "all" ? " is-done" : "") + '" data-p="all">' +
            t("bash", "pAll") + "</button>" +
          '<button class="sg__step' + (pattern === "jpg" ? " is-done" : "") + '" data-p="jpg">' +
            t("bash", "pJpg") + "</button>" +
          (pattern === "jpg" ? '<button class="sg__step is-next" data-run>' + t("bash", "run") + "</button>" : ""));

      on(area, "[data-p]", function (b) { pattern = b.dataset.p; render(); });
      on(area, "[data-run]", function () { ran = true; render(); api.finish(); });
    }
    render();
  }, {
    en: { title: "One line instead of a hundred clicks",
          task: "Shrink every photo in the folder. The folder holds other things too.",
          prompt: "type a command…",
          intro: "Eight files. Only the photos should be touched. Choose what the command catches.",
          tooWide: "That catches everything — the invoice and the notes as well. Narrow it down.",
          picked: "Now only the photos are lit. Run it.",
          after: "Five photos renamed in one go. The invoice, the notes and the logo were not touched.",
          pAll: "catch everything", pJpg: "catch only .jpg", run: "run the command",
          done: "This is Bash. One line describes what to catch and what to do, and it happens to all of them at once." },
    ru: { title: "Одна строчка вместо ста кликов",
          task: "Уменьши все фотографии в папке. В папке лежит и другое.",
          prompt: "введите команду…",
          intro: "Восемь файлов. Тронуть нужно только фотографии. Выбери, что ловит команда.",
          tooWide: "Так ловится всё подряд — и счёт, и заметки. Сузь.",
          picked: "Теперь подсвечены только фотографии. Запускай.",
          after: "Пять фотографий переименованы разом. Счёт, заметки и логотип не тронуты.",
          pAll: "ловить всё", pJpg: "ловить только .jpg", run: "выполнить команду",
          done: "Это Bash. Одна строка описывает, что поймать и что сделать, и это происходит сразу со всеми." },
    ro: { title: "O linie în loc de o sută de clicuri",
          task: "Micșorează toate pozele din dosar. În dosar mai sunt și altele.",
          prompt: "scrie o comandă…",
          intro: "Opt fișiere. Trebuie atinse doar pozele. Alege ce prinde comanda.",
          tooWide: "Așa prinde tot — și factura, și notițele. Îngustează.",
          picked: "Acum sunt aprinse doar pozele. Rulează.",
          after: "Cinci poze redenumite dintr-o dată. Factura, notițele și logoul nu au fost atinse.",
          pAll: "prinde tot", pJpg: "prinde doar .jpg", run: "rulează comanda",
          done: "Acesta este Bash. O linie descrie ce să prindă și ce să facă, iar asta se întâmplă deodată cu toate." },
  });
})();
