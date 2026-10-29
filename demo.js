// Demo des Marketing-Agenten – laeuft komplett im Browser. Nichts wird verbunden, nichts veroeffentlicht.
// Alle Namen und Zahlen gehoeren zum erfundenen Beispiel-Betrieb «Café Muster».

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const ico = (id, style = '') => `<svg class="ico"${style ? ` style="${style}"` : ''}><use href="#i-${id}"/></svg>`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = n => Math.round(n).toLocaleString('de-CH');
const chf = n => 'CHF ' + n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uhrzeit = () => new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
const MONAT = new Date().toLocaleDateString('de-CH', { month: 'long' });
// Werbe-Zahlen laufen mit dem Kalender mit: am 23. eines 31-Tage-Monats sind CHF 412.30 von 600 ausgegeben
const HEUTE = new Date();
const TAGE_IM_MONAT = new Date(HEUTE.getFullYear(), HEUTE.getMonth() + 1, 0).getDate();
const TAGE_VORBEI = Math.max(HEUTE.getDate() - 1, 1);
const STAND = HEUTE.getHours() >= 7 ? 'heute' : 'gestern';

// ---------- Zustand (nur in diesem Browser-Tab) ----------

const STORE = 'lup-agent-demo';
const state = Object.assign({
  step: 1,
  site: '',
  siteRead: false,
  connected: {},
  goals: ['anrufe'],
  budget: 600,
  anrede: 'du',
  taboo: '',
  plan: 'komplett',
  onboarded: false,
  seeded: false,
  trialStart: 0,
  handled: {},
  edits: {},
  maxStep: 20,
  notify: { daily: true, urgent: true, weekly: true },
}, load());

function load() { try { return JSON.parse(sessionStorage.getItem(STORE)) || {}; } catch { return {}; } }
function save() { try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch { /* Demo laeuft auch ohne Speicher */ } }

// ---------- Daten ----------

const CONNECTIONS = [
  { id: 'gbp', area: 'google', icon: 'pin', provider: 'Google', short: 'Google-Profil', name: 'Google-Unternehmensprofil', desc: 'Posts, Rezensionen und Aufrufe', account: 'Café Muster · Luzern',
    scopes: ['Profil, Rezensionen und Kennzahlen lesen', 'Posts und Antworten veröffentlichen, die du freigibst'] },
  { id: 'meta', area: 'werbung', icon: 'mega', provider: 'Meta', short: 'Meta Ads', name: 'Meta Ads Manager', desc: 'Werbung auf Facebook und Instagram', account: 'Werbekonto Café Muster',
    scopes: ['Kampagnen, Anzeigen und Kosten lesen', 'Budgets und Anzeigen ändern, die du freigibst'] },
  { id: 'gads', area: 'werbung', icon: 'search', provider: 'Google', short: 'Google Ads', name: 'Google Ads', desc: 'Suchanzeigen bei Google', account: 'Google-Ads-Konto Café Muster',
    scopes: ['Kampagnen, Suchbegriffe und Kosten lesen', 'Änderungen ausführen, die du freigibst'] },
];

const GOALS = [
  ['anrufe', 'Mehr Anrufe'], ['reservationen', 'Mehr Reservationen'], ['laufkundschaft', 'Mehr Laufkundschaft'],
  ['anfragen', 'Mehr Online-Anfragen'], ['bewerbungen', 'Mehr Bewerbungen'],
];

const REASONS = ['Passt nicht zu uns', 'Falscher Zeitpunkt', 'Stimmt so nicht'];

const SUGGESTIONS = [
  { id: 'rev2', conn: 'gbp', kind: 'review', urgent: true, label: 'Rezension', title: 'Kritische Rezension beantworten',
    who: 'Marco B.', stars: 2, ago: 'vor 3 Stunden', review: 'Am Samstag 25 Minuten auf den Kaffee gewartet. Schade, sonst mag ich das Café.',
    text: 'Hallo Marco, danke für die ehrliche Rückmeldung. 25 Minuten sind zu lang, da hast du recht, und das tut uns leid. Wir schauen uns die Abläufe am Samstag an. Wir freuen uns, wenn du uns noch eine Chance gibst.',
    textSie: 'Guten Tag, danke für Ihre ehrliche Rückmeldung. 25 Minuten sind zu lang, da haben Sie recht, und das tut uns leid. Wir schauen uns die Abläufe am Samstag an. Wir freuen uns, wenn Sie uns noch eine Chance geben.',
    why: () => 'Eine kritische Rezension ohne Antwort liest jeder, der dich sucht. Eine ruhige, ehrliche Antwort innert 24 Stunden wirkt besser als jede Rechtfertigung. Der Agent hat keinen Grund erfunden. Kennst du ihn, ergänze ihn mit «Ändern».',
    done: 'Die Antwort ist online.' },
  { id: 'post', conn: 'gbp', kind: 'post', label: 'Google-Profil · Post', title: 'Post für Samstag: die Herbstkarte',
    photo: 'herbstkarte-tisch.jpg', when: 'Samstag, 09:00', button: 'Mehr erfahren',
    text: 'Die Herbstkarte ist da. Kürbissuppe mit gerösteten Kernen, Marroni-Tiramisu und unser Apfelkuchen nach Grossmutters Rezept. Ab Samstag bei uns in der Altstadt.',
    why: () => 'Dein letzter Post ist 9 Tage alt. Samstag ist bei dir der Tag mit den meisten Routen-Anfragen über Google, darum geht der Post Samstag um 09:00 raus. Das Foto stammt aus deiner Ablage. Der Agent erfindet keine Bilder.',
    done: 'Der Post geht am Samstag um 09:00 online.' },
  { id: 'rev5', conn: 'gbp', kind: 'review', label: 'Rezension', title: 'Danke sagen für fünf Sterne',
    who: 'Sandra K.', stars: 5, ago: 'vor 1 Tag', review: 'Bester Cappuccino der Stadt und so ein herzliches Team. Komme wieder!',
    text: 'Merci vielmal, Sandra! Das freut unser ganzes Team. Bis zum nächsten Cappuccino.',
    textSie: 'Herzlichen Dank für Ihre schöne Bewertung! Das freut unser ganzes Team. Bis zum nächsten Cappuccino.',
    why: () => `Auf jede Rezension antworten zeigt neuen Gästen, dass hier jemand zuhört. Die Antwort ist in deinem Ton geschrieben: ${state.anrede === 'sie' ? 'per Sie' : 'per Du'}, herzlich, kurz.`,
    done: 'Die Antwort ist online.' },
  { id: 'metaB', conn: 'meta', kind: 'ads', label: 'Meta Ads', title: 'Anzeige B im «Mittagsmenü» pausieren',
    text: 'Seit drei Tagen kostet ein Klick auf Anzeige B CHF 1.24 statt 0.81. Anzeige A läuft stabil. Vorschlag: Anzeige B pausieren. Das Budget bleibt in der Kampagne und geht an Anzeige A.',
    creatives: [['Anzeige A', 'Foto', false], ['Anzeige B', 'Video, 15 s', true]],
    table: [['', 'Klicks, 3 Tage', 'Pro Klick'], ['Anzeige A', '96', 'CHF 0.79'], ['Anzeige B', '31', 'CHF 1.24']],
    why: () => 'Gemessen über drei Tage, nicht über einen. Die Kampagne behält ihr Budget, nur die schwächere Anzeige stoppt. Ein frisches Bild für Anzeige B kannst du jederzeit nachliefern.',
    done: 'Anzeige B ist pausiert. Der Agent prüft die Kampagne am Montag wieder.' },
  { id: 'neg', conn: 'gads', kind: 'ads', label: 'Google Ads', title: '7 Suchbegriffe ausschliessen',
    text: 'Diese Suchen haben diesen Monat CHF 38.40 gekostet und keine einzige Anfrage gebracht:',
    terms: ['kaffeemaschine kaufen', 'kaffee kapseln', 'café rezept', 'café jobs luzern', 'kaffeebohnen online', 'latte art kurs', 'café de paris sauce'],
    why: () => 'Wer «Kaffeemaschine kaufen» sucht, will keinen Tisch. Ausgeschlossen erscheint deine Anzeige dort nicht mehr, und das Geld bleibt für Suchen wie «Café Luzern Altstadt».',
    done: '7 Suchbegriffe sind ausgeschlossen.' },
  { id: 'budget', conn: 'gads', kind: 'ads', label: 'Google Ads · Budget', title: 'Tagesbudget «Café Luzern» um 15 % erhöhen',
    text: 'Die Kampagne hat ihr Tagesbudget an den letzten fünf Tagen jeweils um 14 Uhr aufgebraucht. Danach sieht dich bei Google niemand mehr. Vorschlag: von CHF 8.00 auf 9.20 pro Tag.',
    why: () => `Am Nachmittag suchen am meisten Leute nach «Café Luzern», genau dann ist deine Anzeige weg. Der Schritt bleibt unter ${state.maxStep} %. Dein Monatsbudget von CHF ${num(state.budget)} hält trotzdem, weil die Meta-Kampagne «Herbstkarte» Ende Monat ausläuft.`,
    done: 'Das Tagesbudget steht auf CHF 9.20.' },
];

const LOG = [
  { area: 'google', when: 'Gestern, 11:30', text: 'Post veröffentlicht: «Mittagsmenü dieser Woche»' },
  { area: 'google', when: 'Gestern, 07:14', text: 'Antwort auf eine Rezension mit vier Sternen veröffentlicht' },
  { area: 'werbung', when: 'Vor 3 Tagen', text: 'Google Ads: 4 Suchbegriffe ausgeschlossen' },
  { area: 'google', when: 'Vor 4 Tagen', text: 'Google-Platz für 5 Suchbegriffe gemessen' },
  { area: 'werbung', when: 'Vor 4 Tagen', text: 'Meta: Tagesbudget «Herbstkarte» von CHF 10 auf 12 erhöht (+20 %)' },
];

const RANKS = [
  ['café altstadt luzern', 3, 4],
  ['café luzern', 7, 9],
  ['brunch luzern', 12, 12],
  ['kuchen luzern', 15, 13],
  ['mittagstisch luzern', null, null],
];

const SEARCHES = [['café luzern', 412], ['café muster', 288], ['brunch luzern', 140], ['kaffee in der nähe', 96], ['café altstadt', 71]];

// Werbe-Zahlen gelten fuer CHF 600 im Monat und wachsen mit dem gewaehlten Budget mit.
const CAMPAIGNS = [
  { conn: 'meta', name: 'Mittagsmenü', ziel: 'Traffic', spend: 168.20, result: 214, unit: 'Link-Klicks', per: 'CHF 0.79 pro Klick',
    note: () => state.handled.metaB?.how === 'ok' ? 'Anzeige B heute pausiert' : 'Anzeige B schwächelt, Vorschlag liegt bereit' },
  { conn: 'meta', name: 'Herbstkarte', ziel: 'Reichweite', spend: 96.50, result: 41200, unit: 'erreichte Personen', per: 'CHF 2.34 pro 1000',
    note: () => 'Läuft bis Ende Monat' },
  { conn: 'gads', name: 'Café Luzern', ziel: 'Suche', spend: 147.60, result: 31, unit: 'Anrufe', per: 'CHF 4.76 pro Anruf',
    note: () => state.handled.budget?.how === 'ok' ? 'Tagesbudget neu CHF 9.20'
      : state.handled.neg?.how === 'ok' ? '7 Suchbegriffe heute ausgeschlossen'
      : 'Budget um 14 Uhr aufgebraucht, Vorschlag liegt bereit' },
];

const PAGES = [
  ['heute', 'Heute', 'Heute', 'home'],
  ['google', 'Google-Profil', 'Google', 'pin'],
  ['werbung', 'Werbung', 'Werbung', 'mega'],
  ['berichte', 'Berichte', 'Berichte', 'chart'],
  ['einstellungen', 'Einstellungen', 'Konto', 'gear'],
];

// ---------- Hilfen ----------

const planOf = () => AGENT_PLANS.find(p => p.id === state.plan) || AGENT_PLANS[AGENT_PLANS.length - 1];
const areas = () => ({ google: ['google'], werbung: ['werbung'] }[state.plan] || ['google', 'werbung']);
const conn = id => CONNECTIONS.find(c => c.id === id);
const sichtbar = s => state.connected[s.conn] && areas().includes(conn(s.conn).area);
const offen = () => SUGGESTIONS.filter(s => sichtbar(s) && !state.handled[s.id]);
const offeneRezensionen = () => SUGGESTIONS.filter(s => s.kind === 'review' && state.handled[s.id]?.how !== 'ok').length;
const faktor = () => state.budget / 600;
// Laufender Monat: Budget-Faktor mal Anteil der vergangenen Tage
const adScale = () => faktor() * (TAGE_VORBEI / TAGE_IM_MONAT) / (22 / 31);
const textOf = s => state.edits[s.id] ?? ((state.anrede === 'sie' && s.textSie) || s.text);
const stars = n => `<span class="stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span>`;
const datumIn = tage => new Date((state.trialStart || Date.now()) + tage * 864e5).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

function openModal(html) {
  const m = $('#modal');
  const box = $('.modal-box', m);
  box.onclick = null;
  box.innerHTML = html;
  m.hidden = false;
  ($('[data-autofocus]', box) || $('button', box))?.focus();
  return box;
}
function closeModal() { $('#modal').hidden = true; }
$('#modal').addEventListener('click', e => {
  const c = e.target.closest('[data-close]');
  if (e.target.id === 'modal' || c) {
    closeModal();
    if (c?.dataset.msg) toast(c.dataset.msg);
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

function connectModal(id, after) {
  const c = conn(id);
  const box = openModal(`
    <p class="date">Anmeldung bei ${c.provider} · Demo</p>
    <h3 id="modalTitle">«LUP Marketing-Agent» möchte auf «${c.name}» zugreifen</h3>
    <p>Du meldest dich bei ${c.provider} an, nicht bei uns. Der Agent bekommt danach nur diese Rechte:</p>
    <ul>${c.scopes.map(s => `<li>${ico('check')}<span>${s}</span></li>`).join('')}</ul>
    <p>Der Agent sieht nie dein Passwort. Den Zugriff entziehst du jederzeit, in den Einstellungen oder direkt bei ${c.provider}.</p>
    <div class="modal-actions"><button class="btn btn-ghost btn-sm" data-close>Abbrechen</button><button class="btn btn-primary btn-sm" data-allow data-autofocus>Zulassen</button></div>`);
  $('[data-allow]', box).onclick = () => {
    state.connected[id] = true;
    save();
    closeModal();
    toast(`${c.name} ist verbunden.`);
    after?.();
  };
}

function disconnectModal(id) {
  const c = conn(id);
  const box = openModal(`
    <h3 id="modalTitle">Zugriff auf «${c.name}» entziehen?</h3>
    <p>Der Agent sieht dieses Konto danach nicht mehr und macht dafür keine Vorschläge. Verbinden kannst du es jederzeit wieder.</p>
    <div class="modal-actions"><button class="btn btn-ghost btn-sm" data-close data-autofocus>Abbrechen</button><button class="btn btn-primary btn-sm" data-yes>Entziehen</button></div>`);
  $('[data-yes]', box).onclick = () => {
    state.connected[id] = false;
    save();
    closeModal();
    renderApp();
    toast('Zugriff entzogen.');
  };
}

function planModal() {
  const box = openModal(`
    <h3 id="modalTitle">Paket wechseln</h3>
    <p>Der Wechsel gilt sofort. Abgerechnet wird anteilig.</p>
    <div class="plan-pick" style="grid-template-columns:1fr">${AGENT_PLANS.map(p => `
      <button type="button" class="pp" data-plan="${p.id}" aria-pressed="${p.id === state.plan}">
        <b>${p.name}</b><span class="p">${p.price}<small>CHF / Monat</small></span><span class="hint">${p.for}</span>
      </button>`).join('')}</div>
    <div class="modal-actions"><button class="btn btn-ghost btn-sm" data-close>Schliessen</button></div>`);
  box.onclick = e => {
    const b = e.target.closest('[data-plan]');
    if (!b) return;
    state.plan = b.dataset.plan;
    save();
    closeModal();
    renderApp();
    toast(`Paket ${planOf().name} ist aktiv.`);
  };
}

function cancelModal() {
  openModal(`
    <h3 id="modalTitle">Abo kündigen?</h3>
    <p>Der Agent läuft bis Ende Monat weiter, danach wird nichts mehr abgebucht. Deine Konten bei Google und Meta bleiben, wie sie sind.</p>
    <div class="modal-actions"><button class="btn btn-ghost btn-sm" data-close data-autofocus>Behalten</button><button class="btn btn-primary btn-sm" data-close data-msg="Demo: Das Abo wäre jetzt auf Ende Monat gekündigt.">Kündigen</button></div>`);
}

// ---------- Diagramme: eine Achse, Fadenkreuz mit Tooltip, Werte auch als Tabelle ----------

const kurzDatum = d => d.toLocaleDateString('de-CH', { day: 'numeric', month: 'short' });
const langDatum = d => d.toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'long' });

// Profilaufrufe der letzten 4 Wochen bis gestern; die Wochensummen passen zu Berichten und Kennzahlen
function viewsSeries() {
  const sums = [1040, 1081, 1146, 1284];
  const wochentag = [0.13, 0.12, 0.13, 0.14, 0.16, 0.19, 0.13]; // Mo bis So, Samstag am stärksten
  const ende = new Date(HEUTE);
  ende.setHours(0, 0, 0, 0);
  ende.setDate(ende.getDate() - 1);
  const out = [];
  sums.forEach((summe, w) => {
    const tage = Array.from({ length: 7 }, (_, i) => { const d = new Date(ende); d.setDate(ende.getDate() - (27 - (w * 7 + i))); return d; });
    const gewicht = tage.map(d => wochentag[(d.getDay() + 6) % 7] * (1 + 0.08 * Math.sin(d.getDate() * 1.7)));
    const total = gewicht.reduce((a, b) => a + b, 0);
    const werte = gewicht.map(g => Math.round(g / total * summe));
    werte[6] += summe - werte.reduce((a, b) => a + b, 0);
    tage.forEach((d, i) => out.push({ d, v: werte[i] }));
  });
  return out;
}

// Ausgaben im laufenden Monat, aufsummiert, und die Plan-Linie bis Monatsende
function budgetSeries() {
  const spent = 412.3 * adScale();
  const roh = Array.from({ length: TAGE_VORBEI }, (_, i) => 1 + 0.25 * Math.sin((i + 1) * 2.3));
  const total = roh.reduce((a, b) => a + b, 0);
  let summe = 0;
  const ist = roh.map(r => Math.round((summe += r / total * spent) * 100) / 100);
  const plan = Array.from({ length: TAGE_IM_MONAT }, (_, i) => Math.round(state.budget * (i + 1) / TAGE_IM_MONAT * 100) / 100);
  const tage = Array.from({ length: TAGE_IM_MONAT }, (_, i) => new Date(HEUTE.getFullYear(), HEUTE.getMonth(), i + 1));
  return { ist, plan, tage };
}

function niceStep(x) {
  const p = 10 ** Math.floor(Math.log10(x));
  return [1, 2, 2.5, 5, 10].map(m => m * p).find(s => s >= x);
}

let CHARTS = {};

function lineChart(host, { labels, series, fmt, axis, label, height = 210 }) {
  const W = Math.max(260, host.clientWidth), H = height;
  const m = { t: 12, r: 14, b: 26, l: 46 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b, n = labels.length;
  const max = Math.max(...series.flatMap(s => s.values)) || 1;
  const step = niceStep(max / 3), top = Math.ceil(max / step) * step;
  const X = i => m.l + (n < 2 ? iw / 2 : i / (n - 1) * iw);
  const Y = v => m.t + ih - v / top * ih;
  let g = '';
  for (let v = 0; v <= top + 1e-9; v += step) {
    g += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${axis(v)}</text>`;
  }
  [0, Math.round((n - 1) / 2), n - 1].forEach((i, k) => {
    g += `<text class="tick" x="${X(i)}" y="${H - 6}" text-anchor="${['start', 'middle', 'end'][k]}">${kurzDatum(labels[i])}</text>`;
  });
  // Referenzlinien zuerst, damit die echten Werte obenauf liegen
  [...series].sort((a, b) => (b.ref ? 1 : 0) - (a.ref ? 1 : 0)).forEach(s => {
    const pts = s.values.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('L');
    if (s.area) g += `<path class="wash" d="M${pts}L${X(s.values.length - 1)},${Y(0)}L${X(0)},${Y(0)}Z"/>`;
    g += `<path class="ln ${s.ref ? 'ref' : 'main'}" d="M${pts}"/>`;
    if (!s.ref) { const i = s.values.length - 1; g += `<circle class="dot" cx="${X(i)}" cy="${Y(s.values[i])}" r="4"/>`; }
  });
  g += `<line class="cross" y1="${m.t}" y2="${m.t + ih}" visibility="hidden"/>`;
  series.forEach((s, k) => { g += `<circle class="dot hov${s.ref ? ' ref' : ''}" data-k="${k}" r="4" visibility="hidden"/>`; });
  g += `<rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent"/>`;
  host.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" tabindex="0" role="img" aria-label="${esc(label)}. Mit den Pfeiltasten durch die Tage gehen.">${g}</svg><div class="tip" hidden></div>`;

  const svg = $('svg', host), tip = $('.tip', host), cross = $('.cross', svg);
  let cur = null;
  const show = i => {
    cur = Math.max(0, Math.min(n - 1, i));
    cross.setAttribute('x1', X(cur));
    cross.setAttribute('x2', X(cur));
    cross.setAttribute('visibility', 'visible');
    const kopf = document.createElement('div');
    kopf.className = 'tip-d';
    kopf.textContent = langDatum(labels[cur]);
    tip.replaceChildren(kopf);
    series.forEach((s, k) => {
      const dot = $(`.hov[data-k="${k}"]`, svg);
      const v = s.values[cur];
      if (v == null) { dot.setAttribute('visibility', 'hidden'); return; }
      dot.setAttribute('cx', X(cur));
      dot.setAttribute('cy', Y(v));
      dot.setAttribute('visibility', 'visible');
      const row = document.createElement('div');
      row.className = 'tip-r';
      const key = document.createElement('span');
      key.className = 'key' + (s.ref ? ' ref' : '');
      const wert = document.createElement('b');
      wert.textContent = fmt(v);
      const name = document.createElement('span');
      name.textContent = s.name;
      row.append(key, wert, name);
      tip.append(row);
    });
    tip.hidden = false;
    tip.style.left = Math.min(Math.max(X(cur), 80), W - 80) + 'px';
  };
  const hide = () => {
    cross.setAttribute('visibility', 'hidden');
    $$('.hov', svg).forEach(d => d.setAttribute('visibility', 'hidden'));
    tip.hidden = true;
  };
  svg.addEventListener('pointermove', e => {
    const r = svg.getBoundingClientRect();
    show(Math.round((e.clientX - r.left - m.l) / iw * (n - 1)));
  });
  svg.addEventListener('pointerleave', hide);
  svg.addEventListener('blur', hide);
  svg.addEventListener('focus', () => show(cur ?? n - 1));
  svg.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    show((cur ?? n - 1) + (e.key === 'ArrowLeft' ? -1 : 1));
  });
}

function drawCharts() {
  $$('[data-chart]').forEach(host => { if (CHARTS[host.dataset.chart]) lineChart(host, CHARTS[host.dataset.chart]); });
}
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawCharts, 150); });

function viewsCard() {
  const data = viewsSeries();
  CHARTS.views = {
    labels: data.map(x => x.d), label: 'Profilaufrufe bei Google pro Tag, letzte 4 Wochen',
    series: [{ name: 'Aufrufe', values: data.map(x => x.v), area: true }],
    fmt: v => num(v), axis: v => num(v),
  };
  return `
    <div class="card panel">
      <div class="chart-head"><h3>Profilaufrufe bei Google, letzte 4 Wochen</h3><span class="meta-line">pro Tag, bis gestern</span></div>
      <div class="chart" data-chart="views"></div>
      <details class="chart-table"><summary>Werte als Tabelle</summary><div class="table-wrap"><table class="table">
        <tr><th>Tag</th><th>Aufrufe</th></tr>
        ${data.slice().reverse().map(x => `<tr><td>${langDatum(x.d)}</td><td>${num(x.v)}</td></tr>`).join('')}
      </table></div></details>
    </div>`;
}

function budgetCard() {
  const { ist, plan, tage } = budgetSeries();
  CHARTS.budget = {
    labels: tage, label: `Werbebudget im ${MONAT}: ausgegeben und Plan, aufsummiert`,
    series: [{ name: 'Ausgegeben', values: ist, area: true }, { name: 'Plan', values: plan, ref: true }],
    fmt: v => chf(v), axis: v => num(v),
  };
  return `
    <div class="card panel">
      <div class="chart-head"><h3>Budget-Verlauf im ${MONAT}</h3>
        <div class="legend"><span><i class="key"></i>Ausgegeben</span><span><i class="key ref"></i>Plan</span></div></div>
      <div class="chart" data-chart="budget"></div>
      <details class="chart-table"><summary>Werte als Tabelle</summary><div class="table-wrap"><table class="table">
        <tr><th>Tag</th><th>Ausgegeben</th><th>Plan</th></tr>
        ${ist.map((v, i) => `<tr><td>${langDatum(tage[i])}</td><td>${chf(v)}</td><td>${chf(plan[i])}</td></tr>`).reverse().join('')}
      </table></div></details>
    </div>`;
}

// ---------- Anmeldung ----------

const readingLines = domain => [
  `Startseite gelesen: ${domain}`,
  'Angebot erkannt: Kaffee, Mittagsmenü, Kuchen, Brunch',
  'Ort erkannt: Luzern, Altstadt',
  'Öffnungszeiten übernommen',
  'Tonalität erkannt: herzlich, per Du',
];

function renderOnboarding() {
  $('#onboarding').hidden = false;
  $('#app').hidden = true;
  $$('#stepper li').forEach((li, i) => { li.className = i + 1 === state.step ? 'on' : i + 1 < state.step ? 'ok' : ''; });
  $$('.ob-step').forEach(s => { s.hidden = +s.dataset.step !== state.step; });
  if (state.step === 1 && state.siteRead) {
    $('#site').value = state.site;
    $('#reading').innerHTML = readingLines(state.site).map(l => `<li>${ico('check')}${esc(l)}</li>`).join('');
    $('#understood').hidden = false;
  }
  if (state.step === 2) renderConnects();
  if (state.step === 3) renderGoals();
  if (state.step === 4) renderPlanPick();
}

$('#f-site').addEventListener('submit', e => {
  e.preventDefault();
  const raw = $('#site').value.trim() || 'www.dein-geschaeft.ch';
  const domain = raw.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').slice(0, 60);
  const btn = $('button', e.currentTarget);
  const ul = $('#reading');
  state.site = domain;
  ul.innerHTML = '';
  $('#understood').hidden = true;
  btn.disabled = true;
  readingLines(domain).forEach((l, i, all) => setTimeout(() => {
    ul.insertAdjacentHTML('beforeend', `<li>${ico('check')}${esc(l)}</li>`);
    if (i === all.length - 1) setTimeout(() => {
      $('#understood').hidden = false;
      btn.disabled = false;
      state.siteRead = true;
      save();
    }, 400);
  }, 450 * (i + 1)));
});

function renderConnects() {
  $('#connects').innerHTML = CONNECTIONS.map(c => `
    <div class="card connect">
      <div class="ic-box">${ico(c.icon)}</div>
      <div class="txt"><b>${c.name}</b><small>${state.connected[c.id] ? esc(c.account) : c.desc}</small></div>
      ${state.connected[c.id]
        ? `<span class="ok-text">${ico('check')}Verbunden</span>`
        : `<button class="btn btn-ghost btn-sm" data-connect="${c.id}">Verbinden</button>`}
    </div>`).join('');
  $('#to3').disabled = !Object.values(state.connected).some(Boolean);
}
$('#connects').addEventListener('click', e => {
  const b = e.target.closest('[data-connect]');
  if (b) connectModal(b.dataset.connect, renderConnects);
});

function renderGoals() {
  $('#goals').innerHTML = GOALS.map(([id, label]) =>
    `<button type="button" class="pill" data-goal="${id}" aria-pressed="${state.goals.includes(id)}">${label}</button>`).join('');
  $('#budget').value = state.budget;
  $('#budgetOut').textContent = 'CHF ' + num(state.budget);
  $$('#anrede button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === state.anrede));
  $('#taboo').value = state.taboo;
}
$('#goals').addEventListener('click', e => {
  const b = e.target.closest('[data-goal]');
  if (!b) return;
  const g = b.dataset.goal;
  state.goals = state.goals.includes(g) ? state.goals.filter(x => x !== g) : [...state.goals, g].slice(-2);
  save();
  renderGoals();
});
$('#budget').addEventListener('input', e => {
  state.budget = +e.target.value;
  $('#budgetOut').textContent = 'CHF ' + num(state.budget);
  save();
});
$('#anrede').addEventListener('click', e => {
  const b = e.target.closest('[data-v]');
  if (!b) return;
  state.anrede = b.dataset.v;
  save();
  renderGoals();
});
$('#taboo').addEventListener('input', e => { state.taboo = e.target.value; save(); });

function renderPlanPick() {
  const tick = ico('check', 'width:13px;height:13px;display:inline;vertical-align:-2px;margin-right:6px;color:var(--hook)');
  $('#planPick').innerHTML = AGENT_PLANS.map(p => `
    <button type="button" class="pp" data-plan="${p.id}" aria-pressed="${p.id === state.plan}">
      <b>${p.name}</b><span class="p">${p.price}<small>CHF / Monat</small></span>
      <span class="hint">${p.for}</span>
      <ul>${p.items.slice(0, 4).map(i => `<li>${tick}${i}</li>`).join('')}</ul>
    </button>`).join('');
}
$('#planPick').addEventListener('click', e => {
  const b = e.target.closest('[data-plan]');
  if (!b) return;
  state.plan = b.dataset.plan;
  save();
  renderPlanPick();
});

$('#startTrial').addEventListener('click', () => {
  const p = planOf();
  state.trialStart = Date.now();
  const box = openModal(`
    <p class="date">Zahlung · Demo</p>
    <h3 id="modalTitle">Paket ${p.name}, 14 Tage gratis</h3>
    <p>Im echten Produkt hinterlegst du hier deine Zahlungsart. Abgebucht wird erst am ${datumIn(14)}: CHF ${p.price} pro Monat, exkl. MWST.</p>
    <p>Kündigst du vorher, zahlst du nichts.</p>
    <div class="modal-actions"><button class="btn btn-ghost btn-sm" data-close>Zurück</button><button class="btn btn-primary btn-sm" data-go-app data-autofocus>Zu meinem Agenten</button></div>`);
  $('[data-go-app]', box).onclick = () => {
    state.onboarded = true;
    save();
    closeModal();
    location.hash = '#heute';
  };
});

$('#onboarding').addEventListener('click', e => {
  const next = e.target.closest('[data-next]');
  const back = e.target.closest('[data-back]');
  if (!next && !back) return;
  state.step = Math.min(4, Math.max(1, state.step + (next ? 1 : -1)));
  save();
  renderOnboarding();
  scrollTo(0, 0);
});

// ---------- App ----------

let page = 'heute';
let gebootet = false;

function renderApp(enter = false) {
  $('#onboarding').hidden = true;
  $('#app').hidden = false;
  const n = offen().length;
  const link = ([id, label, short, icon], kurz) =>
    `<a href="#${id}" class="${id === page ? 'on' : ''}"${id === page ? ' aria-current="page"' : ''}>${ico(icon)}<span>${kurz ? short : label}</span>${id === 'heute' && n ? `<span class="count">${n}</span>` : ''}</a>`;
  $('#menu').innerHTML = PAGES.map(p => `<li>${link(p)}</li>`).join('');
  $('#tabbar').innerHTML = PAGES.map(p => link(p, true)).join('');
  $('#planBadge').textContent = $('#planBadgeM').textContent = `Paket ${planOf().name}`;
  const render = { heute: pageHeute, google: pageGoogle, werbung: pageWerbung, berichte: pageBerichte, einstellungen: pageEinstellungen }[page];
  CHARTS = {};
  $('#main').innerHTML = `${appbar()}<div class="page${enter ? ' enter' : ''}">${render()}</div>`;
  drawCharts();
}

function appbar() {
  const dringend = offen().filter(s => s.urgent).length;
  const quellen = CONNECTIONS.filter(c => state.connected[c.id] && areas().includes(c.area)).map(c => c.short).join(', ');
  return `
    <div class="appbar">
      <span class="sync"><i></i>Stand ${STAND}, 07:00${quellen ? `<span> · ${quellen}</span>` : ''}</span>
      <div class="appbar-r">
        <button class="icon-btn" data-bell aria-label="Meldungen${dringend ? `, ${dringend} dringend` : ''}">${ico('bell')}${dringend ? `<span class="count">${dringend}</span>` : ''}</button>
        <span class="me" title="Café Muster" aria-hidden="true">CM</span>
      </div>
    </div>`;
}

// Beim ersten Oeffnen kurz zeigen, dass der Agent die Zahlen holt
function bootScreen() {
  return `
    <div class="boot" aria-busy="true">
      <p>${ico('home')}Der Agent holt die Zahlen von Google und Meta …</p>
      <div class="skel" style="height:34px;width:min(320px,70%)"></div>
      <div class="kpis">${'<div class="skel" style="height:96px"></div>'.repeat(4)}</div>
      <div class="skel" style="height:200px"></div>
      <div class="skel" style="height:160px"></div>
    </div>`;
}

const connectGate = id => `
  <div class="card gate">
    <div><h3>${conn(id).name} ist nicht verbunden</h3><p class="muted">${conn(id).desc}. Verbinde das Konto, dann legt der Agent morgen früh los.</p></div>
    <button class="btn btn-primary btn-sm" data-connect="${id}">Verbinden</button>
  </div>`;

function planGate(area) {
  if (areas().includes(area)) return '';
  const was = area === 'google' ? 'Das Google-Profil ist in den Paketen Google und Komplett' : 'Die Werbung ist in den Paketen Werbung und Komplett';
  return `<div class="card gate"><div><h3>Nicht in deinem Paket</h3><p class="muted">${was} enthalten.</p></div><button class="btn btn-primary btn-sm" data-go="plan">Paket wechseln</button></div>`;
}

function kpiTiles() {
  const a = adScale();
  const offenR = offeneRezensionen();
  const T = {
    views: ['Profilaufrufe, 7 Tage', num(1284), '+12 % zur Vorwoche'],
    calls: ['Anrufe über Google, 7 Tage', '23', '+4 zur Vorwoche'],
    reviews: ['Rezensionen', '4.6 ★', offenR ? `${offenR} ohne Antwort` : 'alle beantwortet', true],
    rank: ['Platz bei «café luzern»', '7', '2 Plätze besser'],
    budget: [`Werbebudget ${MONAT}`, 'CHF ' + num(412.3 * a), `von ${num(state.budget)} · im Plan`, true],
    clicks: ['Link-Klicks auf Meta, Monat', num(214 * a), 'Monat läuft noch', true],
    adcalls: ['Anrufe aus Google Ads, Monat', num(31 * a), 'Monat läuft noch', true],
    cpa: ['Kosten pro Anruf', 'CHF 4.76', 'CHF 0.38 günstiger'],
  };
  const pick = { google: ['views', 'calls', 'reviews', 'rank'], werbung: ['budget', 'clicks', 'adcalls', 'cpa'] }[state.plan] || ['views', 'calls', 'budget', 'reviews'];
  return pick.map(k => {
    const [label, value, delta, neutral] = T[k];
    return `<div class="card kpi"><small>${label}</small><b>${value}</b><span${neutral ? ' class="neutral"' : ''}>${delta}</span></div>`;
  }).join('');
}

function sugBody(s) {
  if (s.kind === 'post') return `
    <div class="gpost">
      <div class="gpost-head"><span class="biz-av">CM</span><div><b>Café Muster</b><small>Vorschau: so erscheint der Post bei Google</small></div></div>
      <div class="photo"><span>${ico('image', 'width:14px;height:14px')}Dein Foto: ${esc(s.photo)}</span></div>
      <p>${esc(textOf(s))}</p>
      <span class="gpost-btn">${s.button}</span>
    </div>
    <p class="meta-line">Geplant: ${s.when}</p>`;
  if (s.kind === 'review') return `
    <div class="quote"><div class="who"><b>${esc(s.who)}</b><span>${stars(s.stars)} · ${s.ago}</span></div>«${esc(s.review)}»</div>
    <div class="reply"><small>Antwort-Entwurf</small>${esc(textOf(s))}</div>`;
  const table = s.table ? `<div class="table-wrap"><table class="table">
      <tr>${s.table[0].map(h => `<th>${h}</th>`).join('')}</tr>
      ${s.table.slice(1).map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
    </table></div>` : '';
  const terms = s.terms ? `<div class="terms">${s.terms.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : '';
  const creatives = s.creatives ? `<div class="creatives">${s.creatives.map(([name, art, schwach]) => `
      <figure class="cr${schwach ? ' weak' : ''}"><div class="cr-img${schwach ? ' b' : ''}"></div><figcaption><b>${name}</b><span>${art}</span></figcaption></figure>`).join('')}</div>` : '';
  return `<p>${esc(s.text)}</p>${creatives}${table}${terms}`;
}

function sugCard(s, mode = '') {
  let extra = '';
  if (mode === 'edit' && s.kind !== 'ads') extra = `
    <div class="editor">
      <textarea class="input" aria-label="Text bearbeiten">${esc(textOf(s))}</textarea>
      <div class="sug-actions" style="margin-top:0"><button class="btn btn-primary btn-sm" data-act="save">Speichern und freigeben</button><button class="btn-link" data-act="cancel">Abbrechen</button></div>
    </div>`;
  if (mode === 'edit' && s.kind === 'ads') extra = `
    <div class="editor">
      <textarea class="input" placeholder="Sag dem Agenten, was anders sein soll. Zum Beispiel: Budget nur um 10 % erhöhen." aria-label="Rückmeldung an den Agenten"></textarea>
      <div class="sug-actions" style="margin-top:0"><button class="btn btn-primary btn-sm" data-act="send">Zurück an den Agenten</button><button class="btn-link" data-act="cancel">Abbrechen</button></div>
    </div>`;
  if (mode === 'no') extra = `
    <p class="meta-line" style="margin-top:16px">Warum nicht? Der Agent merkt es sich für die nächsten Vorschläge.</p>
    <div class="reasons">${REASONS.map(r => `<button class="pill" data-reason="${esc(r)}">${esc(r)}</button>`).join('')}<button class="btn-link" data-act="cancel">Abbrechen</button></div>`;
  const actions = mode ? '' : `
    <div class="sug-actions">
      <button class="btn btn-primary btn-sm" data-act="ok">Freigeben</button>
      <button class="btn btn-ghost btn-sm" data-act="edit">Ändern</button>
      <button class="btn-link" data-act="no">Ablehnen</button>
    </div>`;
  return `
    <article class="card sug${s.urgent ? ' urgent' : ''}" data-id="${s.id}">
      <div class="sug-top"><span class="chip">${ico(conn(s.conn).icon)}${esc(s.label)}</span>${s.urgent ? '<span class="chip chip-urgent">Dringend</span>' : ''}<span class="by-agent"><img class="t-av" src="assets/lup-mono.png" alt="" width="22" height="22">Agent · ${STAND}, 07:00</span></div>
      <h3>${esc(s.title)}</h3>
      <div class="sug-body">${sugBody(s)}</div>
      <details class="why"><summary>Warum?</summary><p>${esc(s.why())}</p></details>
      ${actions}${extra}
    </article>`;
}

function doneItems() {
  return Object.entries(state.handled)
    .map(([id, h]) => ({ s: SUGGESTIONS.find(x => x.id === id), ...h }))
    .filter(d => d.s && sichtbar(d.s))
    .sort((a, b) => b.t - a.t)
    .map(d => {
      const text = d.how === 'ok' ? `Freigegeben um ${d.at}${d.edited ? ', mit deiner Änderung' : ''}. ${d.s.done}`
        : d.how === 'rework' ? `Um ${d.at} an den Agenten zurückgegeben${d.note ? `: «${esc(d.note)}»` : ''}. Die neue Fassung liegt morgen um 07:00 bereit.`
        : `Abgelehnt um ${d.at}. Der Agent merkt sich: ${esc(d.reason)}.`;
      const icon = { ok: 'check', no: 'x', rework: 'pen' }[d.how];
      return `
        <div class="card done-item${d.how === 'ok' ? '' : ' muted-item'}">
          <span class="dot">${ico(icon)}</span>
          <div><b>${esc(d.s.title)}</b><small>${text}</small></div>
          <button class="btn-link" data-undo="${d.s.id}" title="Rückgängig (nur in der Demo)" aria-label="Rückgängig">${ico('undo', 'width:16px;height:16px')}</button>
        </div>`;
    });
}

function pageHeute() {
  const o = offen().sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
  const h = new Date().getHours();
  const gruss = h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
  const datum = new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' });
  const min = Math.max(1, Math.ceil(o.length / 2));
  const relevant = CONNECTIONS.filter(c => areas().includes(c.area));
  const keinKonto = !relevant.some(c => state.connected[c.id]);
  const lead = keinKonto ? 'Verbinde ein Konto, dann legt der Agent morgen um 07:00 los.'
    : o.length ? `Der Agent hat ${o.length} ${o.length === 1 ? 'Vorschlag' : 'Vorschläge'} für dich. Dauer: etwa ${min} ${min === 1 ? 'Minute' : 'Minuten'}.`
    : 'Alles erledigt. Der Agent meldet sich morgen um 07:00 wieder.';
  const queue = keinKonto ? relevant.map(c => connectGate(c.id)).join('')
    : o.length ? o.map(s => sugCard(s)).join('')
    : `<div class="card empty">${ico('check', 'color:var(--ok);margin:0 auto 8px;width:26px;height:26px')}Nichts mehr offen. Danke!</div>`;
  const erledigt = doneItems();
  return `
    <p class="date">${datum}</p>
    <h1>${gruss}.</h1>
    <p class="lead">${lead}</p>
    <div class="kpis">${kpiTiles()}</div>
    <h2 class="sec">Wartet auf dich</h2>
    ${queue}
    ${erledigt.length ? `<h2 class="sec">Heute erledigt</h2>${erledigt.join('')}` : ''}
    ${entwicklung()}
    <h2 class="sec">Was der Agent zuletzt gemacht hat</h2>
    <ul class="log">${LOG.filter(l => areas().includes(l.area)).map(l => `<li><time>${l.when}</time><span>${esc(l.text)}</span></li>`).join('')}</ul>`;
}

// Auf «Heute» das passende Diagramm zum Paket: Google-Aufrufe, sonst der Budget-Verlauf
function entwicklung() {
  if (areas().includes('google') && state.connected.gbp) return `<h2 class="sec">Entwicklung</h2>${viewsCard()}`;
  if (areas().includes('werbung') && (state.connected.meta || state.connected.gads)) return `<h2 class="sec">Entwicklung</h2>${budgetCard()}`;
  return '';
}

function pageGoogle() {
  const head = `<p class="date">Google-Unternehmensprofil</p><h1>Café Muster, Luzern</h1><p class="lead">So sieht dich Google diese Woche.</p>`;
  const gate = planGate('google') || (state.connected.gbp ? '' : connectGate('gbp'));
  if (gate) return head + gate;
  const postGeplant = state.handled.post?.how === 'ok';
  const offenR = offeneRezensionen();
  const max = Math.max(...SEARCHES.map(s => s[1]));
  const ranks = state.plan === 'google' ? RANKS.slice(0, 3) : RANKS;
  const trend = (jetzt, vorher) => {
    if (jetzt == null) return '<span class="same">nicht unter den ersten 20</span>';
    const d = vorher - jetzt;
    return d > 0 ? `<span class="up">▲ ${d}</span>` : d < 0 ? `<span class="down">▼ ${-d}</span>` : '<span class="same">gleich</span>';
  };
  return `${head}
    <div class="grid2">
      <div class="card panel">
        <h3>Profil</h3>
        <div class="stat"><span>Status</span><span class="ok-text">${ico('check')}Geöffnet, keine Warnung</span></div>
        <div class="stat"><span>Vollständig</span><b>82 %</b></div>
        <div class="bar"><i style="width:82%"></i></div>
        <p class="meta-line">Fehlt: Leistungen, Fotos vom Innenraum, das Merkmal «Brunch». Diese Felder ändert der Agent nie selbst. Er sagt dir, was fehlt.</p>
      </div>
      <div class="card panel">
        <h3>Posts</h3>
        <div class="stat"><span>Letzter Post</span><b>vor 9 Tagen</b></div>
        <div class="stat"><span>Nächster Post</span><b>${postGeplant ? 'Samstag, 09:00' : 'wartet auf deine Freigabe'}</b></div>
        <div class="stat"><span>Im Paket</span><b>3 Vorschläge pro Woche</b></div>
      </div>
      <div class="card panel">
        <h3>Rezensionen</h3>
        <div class="big">4.6 <span class="stars" style="font-size:20px">★</span></div>
        <div class="stat"><span>Total</span><b>128</b></div>
        <div class="stat"><span>Neu im ${MONAT}</span><b>7</b></div>
        <div class="stat"><span>Ohne Antwort</span><b>${offenR}</b></div>
      </div>
      <div class="card panel">
        <h3>So suchen dich die Leute</h3>
        ${SEARCHES.map(([q, n]) => `<div class="stat"><span>${esc(q)}</span><b>${num(n)}</b></div><div class="bar" style="margin:0 0 4px;height:4px"><i style="width:${Math.round(n / max * 100)}%"></i></div>`).join('')}
        <p class="meta-line" style="margin-top:10px">Letzter ganzer Monat, Zahlen von Google.</p>
      </div>
    </div>
    <div class="card panel" style="margin-top:14px">
      <h3>Dein Platz bei Google</h3>
      <div class="table-wrap"><table class="table">
        <tr><th>Suchbegriff</th><th>Platz</th><th>Zur Vorwoche</th></tr>
        ${ranks.map(([q, jetzt, vorher]) => `<tr><td>${esc(q)}</td><td><b>${jetzt ?? '–'}</b></td><td>${trend(jetzt, vorher)}</td></tr>`).join('')}
      </table></div>
      <p class="meta-line" style="margin-top:12px">Gemessen jeden Montag in der Google-Suche Schweiz.</p>
    </div>
    <div class="honest"><b>Ehrlich gesagt:</b> Posts allein bringen keinen Platz 1. Bei «café luzern» zählen vor allem die Nähe zum Suchenden, Zahl und Qualität der Rezensionen und die richtige Kategorie. Der Agent zeigt dir, wo dein Hebel liegt.</div>`;
}

function pageWerbung() {
  const head = `<p class="date">Meta Ads und Google Ads</p><h1>Werbung im ${MONAT}</h1><p class="lead">Was ausgegeben wurde und was es gebracht hat.</p>`;
  const gate = planGate('werbung');
  if (gate) return head + gate;
  const rows = CAMPAIGNS.filter(c => state.connected[c.conn]);
  const fehlt = ['meta', 'gads'].filter(id => !state.connected[id]);
  if (!rows.length) return head + fehlt.map(connectGate).join('');
  const f = adScale();
  const sum = id => rows.filter(c => !id || c.conn === id).reduce((a, c) => a + c.spend * f, 0);
  const spent = sum();
  const hochgerechnet = spent / TAGE_VORBEI * TAGE_IM_MONAT;
  return `${head}
    <div class="card panel">
      <h3>Monatsbudget</h3>
      <div class="big">${chf(spent)}</div>
      <p class="meta-line">von ${chf(state.budget)} ausgegeben</p>
      <div class="bar"><i style="width:${Math.min(100, Math.round(spent / state.budget * 100))}%"></i></div>
      ${state.connected.meta ? `<div class="stat"><span>Meta Ads</span><b>${chf(sum('meta'))}</b></div>` : ''}
      ${state.connected.gads ? `<div class="stat"><span>Google Ads</span><b>${chf(sum('gads'))}</b></div>` : ''}
      <div class="stat"><span>Hochgerechnet bis Ende Monat</span><span class="ok-text">${chf(hochgerechnet)} · im Plan</span></div>
    </div>
    <div style="margin-top:14px">${budgetCard()}</div>
    <div class="card panel" style="margin-top:14px">
      <h3>Kampagnen</h3>
      <div class="table-wrap"><table class="table">
        <tr><th>Kampagne</th><th>Ausgegeben</th><th>Ergebnis</th><th>Hinweis</th></tr>
        ${rows.map(c => `<tr>
          <td><b>${esc(c.name)}</b><small>${c.conn === 'meta' ? 'Meta' : 'Google Ads'} · ${c.ziel}</small></td>
          <td>${chf(c.spend * f)}</td>
          <td>${num(c.result * f)} ${c.unit}<small>${c.per}</small></td>
          <td>${esc(c.note())}</td>
        </tr>`).join('')}
      </table></div>
    </div>
    ${fehlt.map(connectGate).join('')}
    <p class="hint" style="margin-top:14px">Der Agent fasst nie an: Kampagnenziele, Pixel, Lead-Formulare. Er löscht nichts.</p>`;
}

function pageBerichte() {
  const f = faktor();
  const total = SUGGESTIONS.filter(sichtbar).length;
  const erledigt = total - offen().length;
  const R = [
    { t: 'Diese Woche', sub: 'läuft noch, kommt am Montag um 07:00', open: true, items: [
      ['google', `Profilaufrufe: ${num(1284)} in den letzten 7 Tagen`],
      ['google', '23 Anrufe über Google'],
      ['werbung', `Werbung im ${MONAT} bisher CHF ${num(412.3 * adScale())} von ${num(state.budget)}`],
      ['all', `Heute ${erledigt} von ${total} Vorschlägen erledigt`],
    ] },
    { t: 'Letzte Woche', sub: 'per E-Mail am Montag', items: [
      ['google', `Profilaufrufe: ${num(1146)}, 6 % mehr als in der Woche davor`],
      ['google', '19 Anrufe und 41 Routen über Google'],
      ['google', '3 Posts veröffentlicht, 4 Rezensionen beantwortet'],
      ['werbung', `Werbung: ${chf(131.2 * f)} ausgegeben, ${num(58 * f)} Link-Klicks auf Meta, ${num(8 * f)} Anrufe aus Google Ads`],
      ['all', 'Der Agent hat 9 Vorschläge gemacht. Du hast 8 freigegeben und einen abgelehnt.'],
      ['google', 'Wichtigster Punkt: Bei «café luzern» von Platz 11 auf 9'],
    ] },
    { t: 'Vor zwei Wochen', sub: 'per E-Mail', items: [
      ['google', `Profilaufrufe: ${num(1081)}`],
      ['google', '16 Anrufe und 37 Routen über Google'],
      ['werbung', `Werbung: ${chf(127.9 * f)} ausgegeben, ${num(49 * f)} Link-Klicks, ${num(7 * f)} Anrufe`],
      ['all', 'Der Agent hat 7 Vorschläge gemacht. Du hast alle freigegeben.'],
      ['werbung', 'Wichtigster Punkt: Kampagne «Herbstkarte» gestartet, von dir im Ads Manager'],
    ] },
  ];
  const pdf = state.plan === 'komplett'
    ? `<button class="btn btn-ghost btn-sm" data-toast="Demo: Hier lädst du den Monatsbericht als PDF herunter.">Monatsbericht als PDF</button>`
    : '';
  return `
    <p class="date">Berichte</p><h1>Was der Agent gemacht hat</h1>
    <p class="lead">Jeden Montag um 07:00 per E-Mail. Hier alle auf einen Blick.</p>
    <div style="margin:22px 0 18px">${pdf}</div>
    ${R.map(r => `
      <details class="card report"${r.open ? ' open' : ''}>
        <summary><span>${r.t}</span><small>${r.sub}</small></summary>
        <ul>${r.items.filter(([a]) => a === 'all' || areas().includes(a)).map(([, t]) => `<li>${t}</li>`).join('')}</ul>
      </details>`).join('')}`;
}

function pageEinstellungen() {
  const p = planOf();
  const notify = [
    ['daily', 'Tägliche Zusammenfassung per E-Mail', 'Um 07:00, wenn Vorschläge bereitliegen'],
    ['urgent', 'Sofort-Meldung bei kritischen Rezensionen', 'Bei einem oder zwei Sternen'],
    ['weekly', 'Wochenbericht', 'Jeden Montag um 07:00'],
  ];
  return `
    <p class="date">Einstellungen</p><h1>Dein Agent</h1>
    <h2 class="sec">Verbundene Konten</h2>
    <div class="card panel">
      ${CONNECTIONS.map(c => `
        <div class="setting">
          <div><b>${c.name}</b><small>${state.connected[c.id] ? `Verbunden: ${esc(c.account)}` : 'Nicht verbunden'}</small></div>
          ${state.connected[c.id]
            ? `<button class="btn btn-ghost btn-sm" data-disconnect="${c.id}">Zugriff entziehen</button>`
            : `<button class="btn btn-primary btn-sm" data-connect="${c.id}">Verbinden</button>`}
        </div>`).join('')}
    </div>

    <h2 class="sec">Leitplanken</h2>
    <div class="card panel">
      <div class="setting">
        <div><b>Freigabe für jeden Vorschlag</b><small>Der Agent handelt nie ohne dein OK.</small></div>
        <span class="locked">${ico('lock')}Immer an</span>
      </div>
      <div class="setting">
        <div><b>Grösster Budgetschritt</b><small>Um so viel darf der Agent ein Budget auf einmal ändern.</small></div>
        <select class="input input-sm" id="set-step" aria-label="Grösster Budgetschritt">
          ${[10, 15, 20].map(v => `<option value="${v}"${v === state.maxStep ? ' selected' : ''}>${v} %</option>`).join('')}
        </select>
      </div>
      <div class="setting">
        <div><b>Werbebudget pro Monat</b><small>Der Agent plant alle Vorschläge innerhalb dieses Budgets.</small></div>
        <input class="input input-sm" id="set-budget" type="number" min="100" max="10000" step="50" value="${state.budget}" style="width:110px" aria-label="Werbebudget pro Monat in CHF">
      </div>
      <div class="setting">
        <div><b>Anrede</b><small>In Posts und Antworten auf Rezensionen</small></div>
        <div class="seg" id="set-anrede"><button type="button" data-v="du" aria-pressed="${state.anrede === 'du'}">Du</button><button type="button" data-v="sie" aria-pressed="${state.anrede === 'sie'}">Sie</button></div>
      </div>
      <div class="setting">
        <div><b>Diese Wörter nie verwenden</b><small>Mit Komma getrennt</small></div>
        <input class="input input-sm" id="set-taboo" value="${esc(state.taboo)}" placeholder="billig, Rabatt" style="width:180px" aria-label="Verbotene Wörter">
      </div>
    </div>

    <h2 class="sec">Benachrichtigungen</h2>
    <div class="card panel">
      ${notify.map(([k, t, s]) => `
        <label class="setting" style="cursor:pointer">
          <div><b>${t}</b><small>${s}</small></div>
          <input type="checkbox" data-notify="${k}"${state.notify[k] ? ' checked' : ''}>
        </label>`).join('')}
    </div>

    <h2 class="sec">Abo</h2>
    <div class="card panel">
      <div class="stat"><span>Paket</span><b>${p.name} · CHF ${p.price} pro Monat</b></div>
      <div class="stat"><span>Gratis bis</span><b>${datumIn(14)}</b></div>
      <div class="stat"><span>Kündigung</span><b>monatlich, auf Ende Monat</b></div>
      <div class="sug-actions"><button class="btn btn-ghost btn-sm" data-go="plan">Paket wechseln</button><button class="btn-link" data-cancel-sub>Abo kündigen</button></div>
    </div>`;
}

// Ein Vorschlag wurde entschieden
function act(id, how, extra = {}) {
  state.handled[id] = { how, at: uhrzeit(), t: Date.now(), ...extra };
  save();
  renderApp();
}

$('#main').addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  const card = t.closest('.sug');
  const s = card && SUGGESTIONS.find(x => x.id === card.dataset.id);
  const a = t.dataset.act;
  const swap = mode => {
    card.outerHTML = sugCard(s, mode);
    $(`.sug[data-id="${s.id}"] textarea`)?.focus();
  };

  if (s && a === 'ok') { act(s.id, 'ok'); toast(`Freigegeben. ${s.done}`); }
  else if (s && a === 'edit') swap('edit');
  else if (s && a === 'no') swap('no');
  else if (s && a === 'cancel') swap('');
  else if (s && a === 'save') {
    const v = $('textarea', card).value.trim();
    if (v) state.edits[s.id] = v;
    act(s.id, 'ok', { edited: true });
    toast('Gespeichert und freigegeben.');
  }
  else if (s && a === 'send') { act(s.id, 'rework', { note: $('textarea', card).value.trim() }); toast('Der Agent überarbeitet den Vorschlag.'); }
  else if (s && t.dataset.reason) { act(s.id, 'no', { reason: t.dataset.reason }); toast('Abgelehnt. Der Agent merkt sich das.'); }
  else if (t.dataset.undo) {
    delete state.handled[t.dataset.undo];
    delete state.edits[t.dataset.undo];
    save();
    renderApp();
  }
  else if ('bell' in t.dataset) {
    const u = offen().find(x => x.urgent);
    if (!u) toast('Keine dringenden Meldungen.');
    else {
      if (page !== 'heute') location.hash = '#heute';
      setTimeout(() => $(`.sug[data-id="${u.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    }
  }
  else if (t.dataset.connect) connectModal(t.dataset.connect, renderApp);
  else if (t.dataset.disconnect) disconnectModal(t.dataset.disconnect);
  else if (t.dataset.go === 'plan') planModal();
  else if ('cancelSub' in t.dataset) cancelModal();
  else if (t.dataset.toast) toast(t.dataset.toast);
  else if (t.dataset.v && t.closest('#set-anrede')) { state.anrede = t.dataset.v; save(); renderApp(); toast('Gespeichert.'); }
});

$('#main').addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'set-step') state.maxStep = +t.value;
  else if (t.id === 'set-budget') state.budget = Math.min(10000, Math.max(100, Math.round(+t.value / 50) * 50 || 600));
  else if (t.id === 'set-taboo') state.taboo = t.value;
  else if (t.dataset.notify) state.notify[t.dataset.notify] = t.checked;
  else return;
  save();
  if (t.id === 'set-budget') renderApp();
  toast('Gespeichert.');
});

// ---------- Start ----------

// Jede Ansicht hat einen schlichten Anker (#start, #heute, #google …), damit Links auch im Artifact funktionieren
function route() {
  const h = location.hash.slice(1);
  if (PAGES.some(x => x[0] === h)) {
    // Wer direkt in die Demo springt, sieht den Beispiel-Betrieb mit allen Konten
    if (!state.onboarded && !state.seeded) {
      state.connected = { gbp: true, meta: true, gads: true };
      state.seeded = true;
    }
    if (!state.trialStart) state.trialStart = Date.now();
    save();
    page = h;
    renderApp(true);
    if (!gebootet) {
      gebootet = true;
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        $('#main').innerHTML = appbar() + bootScreen();
        setTimeout(() => renderApp(true), 700);
      }
    }
  } else {
    renderOnboarding();
  }
  scrollTo(0, 0);
}

$('#reset').addEventListener('click', () => {
  try { sessionStorage.removeItem(STORE); } catch { /* egal */ }
  location.hash = '#start';
  location.reload();
});

history.scrollRestoration = 'manual';
window.addEventListener('hashchange', route);
route();
