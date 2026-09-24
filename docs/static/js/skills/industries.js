/* Мини-игры: блок «Отрасли».
   Механики и тексты трёх языков лежат рядом: домен владеет и поведением,
   и своими словами. Регистрируется в ядре через SkillGames.add(). */

(function () {
  "use strict";

  var S = window.SkillGames;
  var add = S.add, t = S.t, ui = S.ui;
  var row = S.row, lead = S.lead, count = S.count, on = S.on, later = S.later;

  /* ===================================================== блок Отрасли ==== */

  /* Отрасли — одна игра на весь блок: все 22 пилюли открывают её. Отдельная
     игра на каждую отрасль выродилась бы в одно и то же «угадай магазин»,
     поэтому здесь показывают другое: у каждой отрасли свои бумаги и слова. */
  add("industries", function (area, api) {
    var ROUNDS = [
      { k: "hotel", opts: ["hotel", "food", "estate"] },
      { k: "insur", opts: ["fintech", "insur", "subs"] },
      { k: "classi", opts: ["market", "classi", "whole"] },
      { k: "wareh", opts: ["beauty", "wareh", "market"] },
      { k: "horeca", opts: ["horeca", "events", "food"] },
      { k: "saas", opts: ["edu", "b2b", "saas"] },
      { k: "auto", opts: ["auto", "freight", "beauty"] },
    ];
    var i = 0, right = 0;

    function render(msg) {
      if (i >= ROUNDS.length) {
        area.innerHTML = lead(t("industries", "win").replace("{n}", right).replace("{t}", ROUNDS.length));
        return api.finish();
      }
      var r = ROUNDS[i];
      area.innerHTML =
        '<div class="sg__paper">' + t("industries", "p_" + r.k) + "</div>" +
        lead(msg || t("industries", "intro")) +
        count(t("industries", "counter").replace("{n}", i).replace("{t}", ROUNDS.length)) +
        row(r.opts.map(function (k) {
          return '<button class="sg__step" data-k="' + k + '">' + t("industries", "i_" + k) + "</button>";
        }).join(""));

      on(area, ".sg__step", function (b) {
        if (b.dataset.k !== r.k) return render(t("industries", "nope"));
        right++; i++;
        render(t("industries", "yes"));
      });
    }
    render("");
  }, {
    en: { title: "Whose paper is this?",
          task: "Seven documents, each from a different trade. Say where each one comes from.",
          intro: "Which business does this belong to?",
          counter: "Sorted: {n} of {t}",
          nope: "Not that one. Read it again — the words give it away.",
          yes: "Right. Next paper.",
          p_hotel: "Booking · 2 nights · double room · breakfast included · late check-out on request",
          p_insur: "Policy · screen damage covered · 12 months · excess 500 MDL",
          p_classi: "Ad · bicycle, used, good condition · price negotiable · pick up in person",
          p_wareh: "Delivery note · 40 pallets · store B · gate 3 · driver signs on arrival",
          p_horeca: "Table for four · 19:00 · by the window · one guest is vegetarian",
          p_saas: "Monthly invoice · 12 seats · “Team” plan · renews automatically",
          p_auto: "Service booking · mileage 84 000 km · oil and filters · 2 hours in the bay",
          i_hotel: "travel & hotels", i_food: "food delivery", i_estate: "real estate",
          i_fintech: "fintech & banking", i_insur: "insurance", i_subs: "subscriptions",
          i_market: "marketplaces", i_classi: "classifieds", i_whole: "wholesale",
          i_beauty: "beauty", i_wareh: "logistics & warehousing",
          i_horeca: "HoReCa & restaurants", i_events: "events & ticketing",
          i_edu: "education & EdTech", i_b2b: "B2B procurement", i_saas: "SaaS",
          i_auto: "automotive", i_freight: "freight transport",
          win: "{n} of {t}. Every trade has its own papers, its own words and its own rules.",
          done: "These are the industries. Knowing the words and the paperwork of a trade means the first weeks go into the work instead of into understanding what everyone is talking about." },
    ru: { title: "Чья это бумага?",
          task: "Семь документов, каждый из своего дела. Скажи, откуда каждый.",
          intro: "К какому делу это относится?",
          counter: "Разобрано: {n} из {t}",
          nope: "Не туда. Перечитай — слова сами себя выдают.",
          yes: "Верно. Следующая бумага.",
          p_hotel: "Бронь · 2 ночи · двухместный · завтрак включён · поздний выезд по запросу",
          p_insur: "Полис · покрытие повреждения экрана · 12 месяцев · франшиза 500 лей",
          p_classi: "Объявление · велосипед, б/у, хорошее состояние · торг уместен · самовывоз",
          p_wareh: "Накладная · 40 паллет · склад Б · ворота 3 · водитель расписывается на месте",
          p_horeca: "Столик на четверых · 19:00 · у окна · один гость вегетарианец",
          p_saas: "Счёт за месяц · 12 рабочих мест · тариф «Команда» · продление автоматом",
          p_auto: "Запись на обслуживание · пробег 84 000 км · масло и фильтры · 2 часа на подъёмнике",
          i_hotel: "туризм и отели", i_food: "доставка еды", i_estate: "недвижимость",
          i_fintech: "финтех и банки", i_insur: "страхование", i_subs: "подписочные сервисы",
          i_market: "маркетплейсы", i_classi: "классифайды", i_whole: "оптовая торговля",
          i_beauty: "косметика и красота", i_wareh: "логистика и склады",
          i_horeca: "HoReCa и рестораны", i_events: "мероприятия и билеты",
          i_edu: "образование и EdTech", i_b2b: "B2B-закупки", i_saas: "SaaS",
          i_auto: "автомобильный бизнес", i_freight: "грузоперевозки",
          win: "{n} из {t}. У каждого дела свои бумаги, свои слова и свои правила.",
          done: "Это отрасли. Когда слова и бумаги дела уже знакомы, первые недели уходят на работу, а не на то, чтобы понять, о чём вообще речь." },
    ro: { title: "A cui e hârtia asta?",
          task: "Șapte documente, fiecare din alt domeniu. Spune de unde vine fiecare.",
          intro: "Cărui domeniu îi aparține?",
          counter: "Sortate: {n} din {t}",
          nope: "Nu acolo. Mai citește o dată — cuvintele se dau de gol.",
          yes: "Corect. Următoarea hârtie.",
          p_hotel: "Rezervare · 2 nopți · cameră dublă · mic dejun inclus · check-out târziu la cerere",
          p_insur: "Poliță · acoperă ecranul spart · 12 luni · franșiză 500 de lei",
          p_classi: "Anunț · bicicletă, second-hand, stare bună · preț negociabil · ridicare personală",
          p_wareh: "Aviz de însoțire · 40 de paleți · depozit B · poarta 3 · șoferul semnează la fața locului",
          p_horeca: "Masă pentru patru · 19:00 · lângă fereastră · un invitat e vegetarian",
          p_saas: "Factură lunară · 12 locuri · plan „Echipă” · se reînnoiește automat",
          p_auto: "Programare service · 84 000 km · ulei și filtre · 2 ore pe elevator",
          i_hotel: "turism și hoteluri", i_food: "livrare de mâncare", i_estate: "imobiliare",
          i_fintech: "fintech și bănci", i_insur: "asigurări", i_subs: "servicii pe abonament",
          i_market: "marketplace-uri", i_classi: "anunțuri clasificate", i_whole: "comerț en-gros",
          i_beauty: "cosmetice", i_wareh: "logistică și depozite",
          i_horeca: "HoReCa și restaurante", i_events: "evenimente și bilete",
          i_edu: "educație și EdTech", i_b2b: "achiziții B2B", i_saas: "SaaS",
          i_auto: "auto", i_freight: "transport de marfă",
          win: "{n} din {t}. Fiecare domeniu are hârtiile lui, cuvintele lui și regulile lui.",
          done: "Acestea sunt domeniile. Când cuvintele și hârtiile unui domeniu îți sunt deja cunoscute, primele săptămâni se duc pe treabă, nu pe înțeles despre ce se vorbește." },
  });
})();
