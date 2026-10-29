// Die Pakete des Marketing-Agenten – eine Liste fuer Startseite und Demo.
// Preise sind ein Vorschlag und noch nicht freigegeben (siehe Strategische Entscheide Nr. 3).
const AGENT_PLANS = [
  {
    id: 'google',
    name: 'Google',
    price: 149,
    for: 'Für Geschäfte, die lokal gefunden werden wollen.',
    items: [
      'Google-Unternehmensprofil',
      '3 Post-Vorschläge pro Woche',
      'Antwort-Entwurf für jede Rezension',
      'Google-Platz für 3 Suchbegriffe, wöchentlich',
      'Wochenbericht per E-Mail',
    ],
  },
  {
    id: 'werbung',
    name: 'Werbung',
    price: 249,
    for: 'Für alle, die schon Werbung schalten.',
    items: [
      'Meta Ads und Google Ads',
      'Tägliche Kontrolle aller Kampagnen',
      'Budget- und Anzeigen-Vorschläge',
      'Budget-Wächter für dein Monatsbudget',
      'Wochenbericht per E-Mail',
    ],
  },
  {
    id: 'komplett',
    name: 'Komplett',
    price: 349,
    best: true,
    for: 'Google-Profil und Werbung, alles an einem Ort.',
    items: [
      'Alles aus Google und Werbung',
      'Google-Platz für 10 Suchbegriffe',
      'Website-Check für Google, monatlich',
      'Monatsbericht als PDF',
      'Sofort-Meldung bei kritischen Rezensionen',
    ],
  },
];
