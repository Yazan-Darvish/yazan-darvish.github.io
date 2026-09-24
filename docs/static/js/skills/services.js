/* Мини-игры: блок «Внешние сервисы».
   Механики и тексты трёх языков лежат рядом: домен владеет и поведением,
   и своими словами. Регистрируется в ядре через SkillGames.add(). */

(function () {
  "use strict";

  var S = window.SkillGames;
  var add = S.add, t = S.t, ui = S.ui;
  var row = S.row, lead = S.lead, count = S.count, on = S.on, later = S.later;

  /* ============================================== блок Внешние сервисы === */

  /* Twilio/SMS — «Докажи, что номер твой». Ввести чужой номер может каждый;
     код в SMS приходит только тому, у кого телефон в руках. */
  add("twilio", function (area, api) {
    var CODE = "4712";
    var stage = "phone", typed = "";

    function render(msg) {
      area.innerHTML =
        '<div class="sg__phone-sms">' +
          '<div class="sg__sms-head">' + t("twilio", "phoneHead") + "</div>" +
          '<div class="sg__sms-body">' +
            (stage === "code" ? t("twilio", "sms").replace("{c}", CODE)
                              : t("twilio", "noSms")) +
          "</div>" +
        "</div>" +
        (stage === "phone"
          ? lead(t("twilio", "intro")) +
            row('<button class="sg__step is-next" data-send>' + t("twilio", "sendCode") + "</button>")
          : stage === "code"
            ? lead(t("twilio", "enter")) +
              '<div class="sg__typebox"><input data-in maxlength="4" value="' + typed +
                '" placeholder="____"></div>' +
              row('<button class="sg__step is-next" data-ok>' + t("twilio", "confirm") + "</button>")
            : lead(t("twilio", "in"))) +
        (msg ? '<p class="sg__warn">' + msg + "</p>" : "");

      on(area, "[data-send]", function () { stage = "code"; render(""); });
      var input = area.querySelector("[data-in]");
      if (input) input.addEventListener("input", function () { typed = input.value; });
      on(area, "[data-ok]", function () {
        if (typed !== CODE) return render(t("twilio", "wrong"));
        stage = "done"; render(""); api.finish();
      });
    }
    render("");
  }, {
    en: { title: "Prove the number is yours",
          task: "Anyone can type someone else's phone number. Prove this one is really yours.",
          phoneHead: "📱 +373 6• ••• ••",
          noSms: "no messages",
          sms: "Shop: your code is {c}. Do not tell it to anyone.",
          intro: "The number is typed in. Nothing proves it belongs to you yet.",
          enter: "The code came to the phone. Type it in.",
          wrong: "Wrong code. Whoever does not hold this phone does not get in.",
          in: "Confirmed. The number is yours — and now the shop can write to it.",
          sendCode: "send the code", confirm: "confirm",
          done: "This is Twilio. A message sent to a phone proves the number belongs to the person holding it — nothing else does that so simply." },
    ru: { title: "Докажи, что номер твой",
          task: "Чужой номер может вписать кто угодно. Докажи, что этот и правда твой.",
          phoneHead: "📱 +373 6• ••• ••",
          noSms: "сообщений нет",
          sms: "Магазин: ваш код {c}. Никому его не сообщайте.",
          intro: "Номер вписан. Того, что он твой, пока ничто не подтверждает.",
          enter: "Код пришёл на телефон. Введи его.",
          wrong: "Код неверный. Кто не держит этот телефон в руках, тот и не войдёт.",
          in: "Подтверждено. Номер твой — и теперь магазину есть куда тебе писать.",
          sendCode: "отправить код", confirm: "подтвердить",
          done: "Это Twilio. Сообщение на телефон доказывает, что номер принадлежит тому, кто держит трубку — ничто другое не делает этого так просто." },
    ro: { title: "Dovedește că numărul e al tău",
          task: "Numărul altcuiva îl poate scrie oricine. Dovedește că acesta e chiar al tău.",
          phoneHead: "📱 +373 6• ••• ••",
          noSms: "niciun mesaj",
          sms: "Magazin: codul tău este {c}. Nu-l spune nimănui.",
          intro: "Numărul e scris. Nimic nu dovedește încă faptul că e al tău.",
          enter: "Codul a venit pe telefon. Scrie-l.",
          wrong: "Cod greșit. Cine nu ține telefonul ăsta în mână nu intră.",
          in: "Confirmat. Numărul e al tău — iar acum magazinul are unde să-ți scrie.",
          sendCode: "trimite codul", confirm: "confirmă",
          done: "Acesta este Twilio. Un mesaj trimis pe telefon dovedește că numărul aparține celui care ține aparatul — nimic altceva nu face asta la fel de simplu." },
  });

  /* OneSignal — «Спроси разрешения». Уведомление приходит и при закрытом
     приложении, но только если человек сам это позволил. */
  add("onesignal", function (area, api) {
    var allowed = false, asked = false, sent = 0;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__lockscreen">' +
          '<div class="sg__clock">21:40</div>' +
          (sent && allowed
            ? '<div class="sg__push"><b>' + t("onesignal", "appName") + "</b>" +
              "<span>" + t("onesignal", "text") + "</span></div>"
            : '<span class="sg__empty">' + t("onesignal", "quiet") + "</span>") +
        "</div>" +
        (asked && !allowed
          ? '<div class="sg__ask"><span>' + t("onesignal", "askText") + "</span>" +
            row('<button class="sg__step" data-no>' + t("onesignal", "no") + "</button>" +
                '<button class="sg__step is-next" data-yes>' + t("onesignal", "yes") + "</button>") +
            "</div>"
          : lead(msg || t("onesignal", allowed ? "after" : "intro")) +
            row(allowed
              ? '<button class="sg__step is-next" data-send>' + t("onesignal", "send") + "</button>"
              : '<button class="sg__step is-next" data-send>' + t("onesignal", "send") + "</button>" +
                '<button class="sg__step" data-ask>' + t("onesignal", "askBtn") + "</button>"));

      on(area, "[data-send]", function () {
        sent++;
        if (!allowed) return render(t("onesignal", "blocked"));
        render(""); api.finish();
      });
      on(area, "[data-ask]", function () { asked = true; render(""); });
      on(area, "[data-yes]", function () { allowed = true; asked = false; render(""); });
      on(area, "[data-no]", function () { asked = false; render(t("onesignal", "refused")); });
    }
    render("");
  }, {
    en: { title: "Ask first",
          task: "The app is closed and the phone is in a pocket. Get a message onto that screen.",
          quiet: "the screen stays dark",
          appName: "Shop", text: "Your order is at the pick-up point until Friday",
          intro: "Send the notification and see whether it arrives.",
          blocked: "Sent — and stopped by the phone. Nobody ever allowed this app to show anything.",
          askBtn: "ask the customer", askText: "“Shop” would like to send you notifications",
          yes: "allow", no: "not now",
          refused: "He said no. That is his right, and now this channel is closed for good.",
          after: "Permission given. Now the message can reach the locked screen.",
          send: "send the notification",
          done: "This is OneSignal. A notification reaches a closed app on a locked phone — but only after the person has allowed it." },
    ru: { title: "Сначала спроси",
          task: "Приложение закрыто, телефон в кармане. Донеси сообщение до этого экрана.",
          quiet: "экран остаётся тёмным",
          appName: "Магазин", text: "Ваш заказ ждёт в пункте выдачи до пятницы",
          intro: "Отправь уведомление и посмотри, дойдёт ли.",
          blocked: "Отправлено — и остановлено телефоном. Показывать что-либо этому приложению никто не разрешал.",
          askBtn: "спросить покупателя", askText: "«Магазин» хочет присылать вам уведомления",
          yes: "разрешить", no: "не сейчас",
          refused: "Он отказал. Это его право, и теперь этот канал закрыт насовсем.",
          after: "Разрешение получено. Теперь сообщение может дойти до заблокированного экрана.",
          send: "отправить уведомление",
          done: "Это OneSignal. Уведомление доходит до закрытого приложения на заблокированном телефоне — но только после того, как человек это разрешил." },
    ro: { title: "Întreabă întâi",
          task: "Aplicația e închisă, telefonul e în buzunar. Du un mesaj pe ecranul acela.",
          quiet: "ecranul rămâne întunecat",
          appName: "Magazin", text: "Comanda ta te așteaptă la punctul de ridicare până vineri",
          intro: "Trimite notificarea și vezi dacă ajunge.",
          blocked: "Trimisă — și oprită de telefon. Nimeni nu a permis vreodată acestei aplicații să arate ceva.",
          askBtn: "întreabă clientul", askText: "„Magazin” dorește să vă trimită notificări",
          yes: "permite", no: "nu acum",
          refused: "A refuzat. E dreptul lui, iar acum canalul ăsta e închis definitiv.",
          after: "Permisiunea a fost dată. Acum mesajul poate ajunge pe ecranul blocat.",
          send: "trimite notificarea",
          done: "Acesta este OneSignal. O notificare ajunge la o aplicație închisă pe un telefon blocat — dar doar după ce omul a permis asta." },
  });

  /* SendGrid/Mailgun — «Кто вообще открыл письмо». Тысяча писем ушла, и без
     сервиса это всё, что известно; с ним видно, что было дальше. */
  add("sendgrid", function (area, api) {
    var stats = false;

    function render() {
      area.innerHTML =
        '<div class="sg__stats">' +
          '<div class="sg__stat"><b>1000</b><span>' + t("sendgrid", "sent") + "</span></div>" +
          (stats
            ? '<div class="sg__stat"><b>962</b><span>' + t("sendgrid", "delivered") + "</span></div>" +
              '<div class="sg__stat"><b>318</b><span>' + t("sendgrid", "opened") + "</span></div>" +
              '<div class="sg__stat"><b>47</b><span>' + t("sendgrid", "clicked") + "</span></div>"
            : '<div class="sg__stat"><b>?</b><span>' + t("sendgrid", "unknown") + "</span></div>") +
        "</div>" +
        lead(t("sendgrid", stats ? "after" : "intro")) +
        row(stats ? "" :
          '<button class="sg__step is-next" data-stats>' + t("sendgrid", "turnOn") + "</button>");

      on(area, "[data-stats]", function () { stats = true; render(); api.finish(); });
    }
    render();
  }, {
    en: { title: "Who actually opened it",
          task: "A thousand letters about the winter sale went out this morning.",
          sent: "sent", delivered: "delivered", opened: "opened", clicked: "clicked the button",
          unknown: "everything after that",
          intro: "They left the building. Whether anybody read them is anybody's guess.",
          after: "38 never arrived at all. A third were opened. 47 people came to the shop from that button.",
          turnOn: "see what happened next",
          done: "This is SendGrid/Mailgun. Sending a thousand letters is the easy half; knowing which of them arrived, were opened and worked is the useful half." },
    ru: { title: "Кто вообще открыл письмо",
          task: "Тысяча писем про зимнюю распродажу ушла сегодня утром.",
          sent: "отправлено", delivered: "доставлено", opened: "открыли", clicked: "нажали кнопку",
          unknown: "всё, что было дальше",
          intro: "Они ушли из здания. Прочитал ли их кто-нибудь — можно только гадать.",
          after: "38 не дошли вовсе. Треть открыли. 47 человек пришли в магазин с той кнопки.",
          turnOn: "посмотреть, что было дальше",
          done: "Это SendGrid/Mailgun. Отправить тысячу писем — лёгкая половина; знать, какие дошли, какие открыли и какие сработали — полезная." },
    ro: { title: "Cine a deschis-o de fapt",
          task: "O mie de scrisori despre reducerile de iarnă au plecat azi-dimineață.",
          sent: "trimise", delivered: "livrate", opened: "deschise", clicked: "au apăsat butonul",
          unknown: "tot ce a urmat",
          intro: "Au plecat din clădire. Dacă le-a citit cineva, rămâne de ghicit.",
          after: "38 nu au ajuns deloc. O treime au fost deschise. 47 de oameni au venit în magazin de la acel buton.",
          turnOn: "vezi ce a urmat",
          done: "Acesta este SendGrid/Mailgun. Trimiterea a o mie de scrisori e jumătatea ușoară; a ști care au ajuns, care au fost deschise și care au funcționat e jumătatea utilă." },
  });

  /* Resend — «Пока домен не подтверждён». Письма уходят только самому себе:
     так сервис не даёт рассылать от чужого имени. */
  add("resend", function (area, api) {
    var RECS = ["spf", "dkim", "mx"];
    var done_ = [], delivered = false;

    function render(msg) {
      var ready = RECS.every(function (k) { return done_.indexOf(k) >= 0; });
      area.innerHTML =
        '<div class="sg__domain">' + t("resend", "domain") +
          '<span class="sg__badge' + (ready ? " is-ok" : "") + '">' +
          t("resend", ready ? "verified" : "unverified") + "</span></div>" +
        '<div class="sg__notes">' + RECS.map(function (k) {
          var ok = done_.indexOf(k) >= 0;
          return '<button class="sg__note' + (ok ? " is-ok" : "") + '" data-k="' + k + '"' +
                 (ok ? " disabled" : "") + ">" + (ok ? "✓ " : "• ") + t("resend", "r_" + k) + "</button>";
        }).join("") + "</div>" +
        lead(msg || t("resend", ready ? "ready" : "intro")) +
        row(delivered ? "" :
          '<button class="sg__step is-next" data-send>' + t("resend", "send") + "</button>");

      on(area, "[data-k]", function (b) { if (!b.disabled) { done_.push(b.dataset.k); render(""); } });
      on(area, "[data-send]", function () {
        if (!ready) return render(t("resend", "toSelf"));   // домен не доказан — письмо себе
        delivered = true;
        render(t("resend", "toCustomer"));
        api.finish();
      });
    }
    render("");
  }, {
    en: { title: "Until the domain is proven",
          task: "Send a receipt to a customer from shop.md. Try it right away.",
          domain: "shop.md", unverified: "not proven", verified: "proven",
          r_spf: "add the sending record", r_dkim: "add the signature key", r_mx: "confirm the mailbox",
          intro: "The address looks right. Nobody has checked that the domain is yours.",
          toSelf: "The letter went out — to your own inbox and nowhere else. Anyone could type shop.md; until it is proven, letters go no further.",
          ready: "The domain is proven. Now send it again.",
          toCustomer: "Delivered to the customer, from shop.md, signed.",
          send: "send the receipt",
          done: "This is Resend. A sender must prove the domain is his before letters leave the building — which is exactly what stops strangers writing in your name." },
    ru: { title: "Пока домен не подтверждён",
          task: "Отправь покупателю чек с адреса shop.md. Попробуй прямо сейчас.",
          domain: "shop.md", unverified: "не подтверждён", verified: "подтверждён",
          r_spf: "добавить запись об отправителе", r_dkim: "добавить ключ подписи",
          r_mx: "подтвердить почтовый ящик",
          intro: "Адрес выглядит правильно. Что домен твой, никто не проверял.",
          toSelf: "Письмо ушло — в твой собственный ящик и никуда больше. Вписать shop.md может кто угодно, и пока это не доказано, письма дальше не идут.",
          ready: "Домен подтверждён. Теперь отправь ещё раз.",
          toCustomer: "Доставлено покупателю, с адреса shop.md, с подписью.",
          send: "отправить чек",
          done: "Это Resend. Отправитель обязан доказать, что домен его, прежде чем письма покинут здание — именно это и мешает чужим писать от твоего имени." },
    ro: { title: "Până domeniul nu e dovedit",
          task: "Trimite un bon unui client de la adresa shop.md. Încearcă chiar acum.",
          domain: "shop.md", unverified: "nedovedit", verified: "dovedit",
          r_spf: "adaugă înregistrarea expeditorului", r_dkim: "adaugă cheia de semnătură",
          r_mx: "confirmă cutia poștală",
          intro: "Adresa pare corectă. Că domeniul e al tău nu a verificat nimeni.",
          toSelf: "Scrisoarea a plecat — în propria ta cutie și nicăieri altundeva. shop.md poate scrie oricine, iar până nu e dovedit, scrisorile nu merg mai departe.",
          ready: "Domeniul e dovedit. Acum trimite din nou.",
          toCustomer: "Livrat clientului, de la shop.md, cu semnătură.",
          send: "trimite bonul",
          done: "Acesta este Resend. Expeditorul trebuie să dovedească faptul că domeniul e al lui înainte ca scrisorile să plece — exact asta îi oprește pe străini să scrie în numele tău." },
  });

  /* SailPlay — «Копилка покупателя». Баллы накапливаются от покупки
     к покупке и однажды закрывают часть счёта. */
  add("sailplay", function (area, api) {
    var BUYS = [349, 180, 520];
    var i = 0, points = 0, spent = false;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__loyal">' +
          '<div class="sg__loyal-card"><b>' + t("sailplay", "card") + "</b>" +
            '<span class="sg__loyal-pts">' + points + "</span>" +
            '<i class="sg__loyal-cap">' + t("sailplay", "pts") + "</i></div>" +
        "</div>" +
        lead(msg || t("sailplay", i < BUYS.length ? "intro" : "enough")) +
        row(i < BUYS.length
          ? '<button class="sg__step is-next" data-buy>' + t("sailplay", "buy").replace("{n}", BUYS[i]) + "</button>"
          : (spent ? "" : '<button class="sg__step is-next" data-spend>' + t("sailplay", "spend") + "</button>"));

      on(area, "[data-buy]", function () {
        points += Math.round(BUYS[i] * 0.05);
        i++;
        render(t("sailplay", "got").replace("{n}", Math.round(BUYS[i - 1] * 0.05)));
      });
      on(area, "[data-spend]", function () {
        spent = true;
        render(t("sailplay", "paid").replace("{n}", points));
        api.finish();
      });
    }
    render("");
  }, {
    en: { title: "The customer's piggy bank",
          task: "The same customer comes back three times. Watch what builds up.",
          card: "loyalty card", pts: "points",
          intro: "Every purchase leaves something on the card.",
          buy: "buy for {n} MDL",
          got: "Points added: +{n}",
          enough: "Three visits later there is enough on the card to matter.",
          spend: "pay with points",
          paid: "Points spent: {n}. The fourth purchase cost less because of the first three.",
          done: "This is SailPlay. Purchases leave points behind, and the points are what bring the same customer back a fourth time." },
    ru: { title: "Копилка покупателя",
          task: "Один и тот же покупатель приходит трижды. Смотри, что накапливается.",
          card: "карта покупателя", pts: "баллов",
          intro: "Каждая покупка что-то оставляет на карте.",
          buy: "купить на {n} лей",
          got: "Начислено на карту: +{n}",
          enough: "После трёх визитов на карте накопилось достаточно, чтобы это было заметно.",
          spend: "заплатить баллами",
          paid: "Списано баллов: {n}. Четвёртая покупка обошлась дешевле из-за первых трёх.",
          done: "Это SailPlay. Покупки оставляют баллы, и именно баллы приводят того же покупателя в четвёртый раз." },
    ro: { title: "Pușculița clientului",
          task: "Același client revine de trei ori. Privește ce se adună.",
          card: "card de fidelitate", pts: "puncte",
          intro: "Fiecare cumpărătură lasă ceva pe card.",
          buy: "cumpără de {n} lei",
          got: "Puncte adăugate: +{n}",
          enough: "După trei vizite s-a adunat destul pe card cât să conteze.",
          spend: "plătește cu puncte",
          paid: "Puncte folosite: {n}. A patra cumpărătură a costat mai puțin datorită primelor trei.",
          done: "Acesta este SailPlay. Cumpărăturile lasă puncte, iar punctele sunt cele care aduc același client a patra oară." },
  });

  /* UDS — «Карту забыл дома». Скидка привязана к человеку, а не к куску
     пластика: назвал номер — и тебя узнали. */
  add("uds", function (area, api) {
    var stage = "start";

    function render() {
      area.innerHTML =
        '<div class="sg__till-row">' +
          '<div class="sg__till-item">' + t("uds", "bill") + "</div>" +
          '<div class="sg__till-sum' + (stage === "phone" ? " is-ok" : "") + '">' +
            (stage === "phone" ? "314 MDL" : "349 MDL") + "</div>" +
        "</div>" +
        lead(t("uds", stage === "start" ? "intro" : stage === "noCard" ? "noCard" : "found")) +
        row(stage === "start"
          ? '<button class="sg__step" data-card>' + t("uds", "showCard") + "</button>"
          : stage === "noCard"
            ? '<button class="sg__step is-next" data-phone>' + t("uds", "sayPhone") + "</button>"
            : "");

      on(area, "[data-card]", function () { stage = "noCard"; render(); });
      on(area, "[data-phone]", function () { stage = "phone"; render(); api.finish(); });
    }
    render();
  }, {
    en: { title: "Left the card at home",
          task: "A regular customer is at the till. His discount is on a plastic card he does not have.",
          bill: "Winter jacket · 1 pc",
          intro: "He is a regular here. Ask for the card.",
          noCard: "It is at home, in another jacket. With plastic alone, the discount is gone and so is his good mood.",
          found: "He said his phone number and the till recognised him. 10% off, same as always.",
          showCard: "ask for the card", sayPhone: "ask for his phone number",
          done: "This is UDS. The discount belongs to the person, not to a piece of plastic — so forgetting the card stops costing anybody anything." },
    ru: { title: "Карту забыл дома",
          task: "У кассы постоянный покупатель. Его скидка — на пластиковой карте, которой у него нет.",
          bill: "Зимняя куртка · 1 шт",
          intro: "Он здесь постоянный. Попроси карту.",
          noCard: "Она дома, в другой куртке. С одним пластиком скидки нет, и настроения у него тоже.",
          found: "Он назвал номер телефона, и касса его узнала. Минус 10%, как всегда.",
          showCard: "попросить карту", sayPhone: "спросить номер телефона",
          done: "Это UDS. Скидка принадлежит человеку, а не куску пластика — и забытая карта перестаёт кому-либо чего-то стоить." },
    ro: { title: "A uitat cardul acasă",
          task: "La casă e un client fidel. Reducerea lui e pe un card de plastic pe care nu îl are.",
          bill: "Geacă de iarnă · 1 buc",
          intro: "E client vechi aici. Cere-i cardul.",
          noCard: "E acasă, în altă geacă. Doar cu plasticul, reducerea a dispărut, iar buna dispoziție odată cu ea.",
          found: "A spus numărul de telefon, iar casa l-a recunoscut. Minus 10%, ca întotdeauna.",
          showCard: "cere cardul", sayPhone: "cere numărul de telefon",
          done: "Acesta este UDS. Reducerea aparține omului, nu unei bucăți de plastic — iar cardul uitat încetează să mai coste pe cineva ceva." },
  });

  /* Google Maps и OAuth — «Без анкеты и без опечаток». Вход чужими руками
     и адрес пальцем по карте: две вещи, которые убирают ручной ввод. */
  add("gmaps", function (area, api) {
    var logged = false, addr = false;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__form-row">' +
          '<div class="sg__field' + (logged ? " is-ok" : "") + '"><b>' + t("gmaps", "acc") + "</b>" +
            "<span>" + t("gmaps", logged ? "accOk" : "accEmpty") + "</span></div>" +
          '<div class="sg__field' + (addr ? " is-ok" : "") + '"><b>' + t("gmaps", "addr") + "</b>" +
            "<span>" + t("gmaps", addr ? "addrOk" : "addrTyped") + "</span></div>" +
        "</div>" +
        lead(msg || t("gmaps", logged && addr ? "both" : "intro")) +
        row((logged ? "" : '<button class="sg__step is-next" data-google>' + t("gmaps", "byGoogle") + "</button>") +
            (addr ? "" : '<button class="sg__step is-next" data-map>' + t("gmaps", "byMap") + "</button>"));

      on(area, "[data-google]", function () { logged = true; check(t("gmaps", "logged")); });
      on(area, "[data-map]", function () { addr = true; check(t("gmaps", "pinned")); });
      function check(msg2) { render(logged && addr ? "" : msg2); if (logged && addr) api.finish(); }
    }
    render("");
  }, {
    en: { title: "No form, no typos",
          task: "A customer is checking out. Two fields stand between him and the order.",
          acc: "Account", addr: "Delivery address",
          accEmpty: "invent a password, confirm the mail, remember it forever",
          accOk: "signed in as Ion · ion@gmail.com",
          addrTyped: "“str. Stefan cel Mare 14, ap 7, bloc 2, kv?”",
          addrOk: "📍 Str. Ștefan cel Mare 14, ap. 7 · Chișinău",
          intro: "This is where half of them give up and close the tab.",
          logged: "Signed in with one press. No new password in the world.",
          pinned: "A finger on the map, and the address is exact — no courier will have to phone about it.",
          both: "Two presses instead of two forms. Nothing was typed, so nothing was mistyped.",
          byGoogle: "sign in with Google", byMap: "pick the address on the map",
          done: "This is Google OAuth and Maps. One press instead of a password, a pin instead of a typed address — and the order does not get abandoned halfway." },
    ru: { title: "Без анкеты и без опечаток",
          task: "Покупатель оформляет заказ. Между ним и покупкой — два поля.",
          acc: "Учётная запись", addr: "Адрес доставки",
          accEmpty: "придумать пароль, подтвердить почту, запомнить навсегда",
          accOk: "вошёл как Ion · ion@gmail.com",
          addrTyped: "«ул. Штефан чел Маре 14, кв 7, блок 2, кв?»",
          addrOk: "📍 Str. Ștefan cel Mare 14, ap. 7 · Кишинёв",
          intro: "Вот здесь половина сдаётся и закрывает вкладку.",
          logged: "Вошёл одним нажатием. Ни одного нового пароля на свете.",
          pinned: "Палец по карте — и адрес точный, курьеру не придётся звонить и уточнять.",
          both: "Два нажатия вместо двух анкет. Ничего не набирали руками — значит, и опечататься было негде.",
          byGoogle: "войти через Google", byMap: "выбрать адрес на карте",
          done: "Это Google OAuth и Maps. Одно нажатие вместо пароля, точка на карте вместо набранного адреса — и заказ не бросают на полпути." },
    ro: { title: "Fără formular și fără greșeli",
          task: "Un client își face comanda. Între el și cumpărătură stau două câmpuri.",
          acc: "Cont", addr: "Adresa de livrare",
          accEmpty: "inventează o parolă, confirmă mailul, ține minte pe veci",
          accOk: "autentificat ca Ion · ion@gmail.com",
          addrTyped: "„str. Stefan cel Mare 14, ap 7, bloc 2, kv?”",
          addrOk: "📍 Str. Ștefan cel Mare 14, ap. 7 · Chișinău",
          intro: "Aici jumătate renunță și închid fila.",
          logged: "Autentificat dintr-o apăsare. Nicio parolă nouă pe lume.",
          pinned: "Un deget pe hartă și adresa e exactă — curierul nu va mai trebui să sune.",
          both: "Două apăsări în loc de două formulare. Nu s-a tastat nimic, deci nu s-a greșit nimic.",
          byGoogle: "intră cu Google", byMap: "alege adresa pe hartă",
          done: "Acestea sunt Google OAuth și Maps. O apăsare în loc de parolă, un punct pe hartă în loc de adresă tastată — iar comanda nu mai e abandonată la jumătate." },
  });

  /* Trello API — «Заявка сама легла на доску». Правило раскладывает
     обращения по колонкам, и ни одно не теряется в почте. */
  add("trello", function (area, api) {
    var TICKETS = [
      { k: "broken", col: "bug" }, { k: "where", col: "ask" },
      { k: "refund", col: "money" }, { k: "slow", col: "bug" },
    ];
    var placed = {}, auto = false, i = 0;

    function render(msg) {
      area.innerHTML =
        '<div class="sg__board">' + ["bug", "ask", "money"].map(function (c) {
          return '<div class="sg__col"><b>' + t("trello", "c_" + c) + "</b>" +
            TICKETS.filter(function (x) { return placed[x.k] === c; }).map(function (x) {
              return '<div class="sg__card-t">' + t("trello", "t_" + x.k) + "</div>";
            }).join("") + "</div>";
        }).join("") + "</div>" +
        (i < TICKETS.length
          ? lead(msg || t("trello", auto ? "autoNote" : "intro").replace("{t}", t("trello", "t_" + TICKETS[i].k))) +
            row(auto ? "" : ["bug", "ask", "money"].map(function (c) {
              return '<button class="sg__step" data-c="' + c + '">' + t("trello", "c_" + c) + "</button>";
            }).join("") +
            '<button class="sg__step is-next" data-auto>' + t("trello", "rule") + "</button>")
          : lead(t("trello", auto ? "winAuto" : "winHand")));

      on(area, "[data-c]", function (b) {
        var cur = TICKETS[i];
        if (b.dataset.c !== cur.col) return render(t("trello", "nope"));
        placed[cur.k] = cur.col; i++;
        render("");
        if (i >= TICKETS.length) api.finish();
      });
      on(area, "[data-auto]", function () {
        auto = true;
        TICKETS.slice(i).forEach(function (x, n) {
          later(function () {
            placed[x.k] = x.col; i++;
            render("");
            if (i >= TICKETS.length) api.finish();
          }, 350 + n * 400);
        });
      });
    }
    render("");
  }, {
    en: { title: "The ticket lands on the board",
          task: "Four messages came in from the site this morning. Each belongs in its own column.",
          c_bug: "broken", c_ask: "questions", c_money: "money",
          t_broken: "payment does not go through", t_where: "where is my order?",
          t_refund: "want my money back", t_slow: "the site hangs on mobile",
          intro: "“{t}” — put it on the board.",
          nope: "Wrong column. From there nobody will pick it up in time.",
          autoNote: "The rule is sorting them itself…",
          rule: "let a rule do it",
          winHand: "Four cards, placed by hand. Tomorrow there will be forty, and one of them will be missed.",
          winAuto: "All four landed by themselves, each in its own column, seconds after they were written.",
          done: "This is the Trello API. Messages become cards on the board by themselves, so nothing waits in somebody's mailbox to be noticed." },
    ru: { title: "Заявка сама легла на доску",
          task: "С сайта пришли четыре обращения. Каждому место в своей колонке.",
          c_bug: "сломалось", c_ask: "вопросы", c_money: "деньги",
          t_broken: "не проходит оплата", t_where: "где мой заказ?",
          t_refund: "хочу вернуть деньги", t_slow: "сайт виснет на телефоне",
          intro: "«{t}» — положи на доску.",
          nope: "Не та колонка. Оттуда её вовремя никто не возьмёт.",
          autoNote: "Правило раскладывает их само…",
          rule: "поручить правилу",
          winHand: "Четыре карточки, разложены руками. Завтра их будет сорок, и одну потеряют.",
          winAuto: "Все четыре легли сами, каждая в свою колонку, через секунды после того, как их написали.",
          done: "Это Trello API. Обращения сами становятся карточками на доске, и ничто не ждёт в чьём-то почтовом ящике, пока его заметят." },
    ro: { title: "Cererea ajunge singură pe tablă",
          task: "De pe site au venit patru mesaje. Fiecare își are coloana lui.",
          c_bug: "stricat", c_ask: "întrebări", c_money: "bani",
          t_broken: "nu trece plata", t_where: "unde e comanda mea?",
          t_refund: "vreau banii înapoi", t_slow: "site-ul se blochează pe telefon",
          intro: "„{t}” — pune-l pe tablă.",
          nope: "Coloana greșită. De acolo nu îl va lua nimeni la timp.",
          autoNote: "Regula le sortează singură…",
          rule: "lasă o regulă să o facă",
          winHand: "Patru cartonașe, puse cu mâna. Mâine vor fi patruzeci, iar unul se va pierde.",
          winAuto: "Toate patru au ajuns singure, fiecare în coloana ei, la secunde după ce au fost scrise.",
          done: "Acesta este Trello API. Mesajele devin singure cartonașe pe tablă, așa că nimic nu așteaptă în cutia poștală a cuiva să fie observat." },
  });
})();
