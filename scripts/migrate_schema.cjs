/*
 * Migration one-shot du schéma politicians.json
 * - sources: string[] -> { name, url }[]
 * - legal: ajout d'un globalStatus enum (clean|investigation|indicted|convicted)
 * - ajout d'un champ votes (instance + items) vide pour tous
 *
 * Usage: node scripts/migrate_schema.cjs
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'politicians.json');

// Mapping nom de média -> URL d'accueil. Pour les sources sans site web identifiable,
// on laisse url = null (la source restera affichée mais non cliquable).
const MEDIA_URLS = {
  'Le Monde': 'https://www.lemonde.fr',
  'Libération': 'https://www.liberation.fr',
  'La Provence': 'https://www.laprovence.com',
  'Le Parisien': 'https://www.leparisien.fr',
  'Le Figaro': 'https://www.lefigaro.fr',
  'Mediapart': 'https://www.mediapart.fr',
  'Public Sénat': 'https://www.publicsenat.fr',
  'BFMTV': 'https://www.bfmtv.com',
  "L'Express": 'https://www.lexpress.fr',
  'Le Point': 'https://www.lepoint.fr',
  'Marianne': 'https://www.marianne.net',
  "L'Humanité": 'https://www.humanite.fr',
  'La Croix': 'https://www.la-croix.com',
  'Le Progrès': 'https://www.leprogres.fr',
  'Sud Ouest': 'https://www.sudouest.fr',
  'La Voix du Nord': 'https://www.lavoixdunord.fr',
  'Les Échos': 'https://www.lesechos.fr',
  'La Tribune': 'https://www.latribune.fr',
  'Lyon Mag': 'https://www.lyonmag.com',
  'Marsactu': 'https://marsactu.fr',
  'Mediacités': 'https://www.mediacites.fr',
  'Le Journal Toulousain': 'https://www.lejournaltoulousain.fr',
  'Le Réveil du Midi': 'https://www.lereveildumidi.com',
  'Vert éco': 'https://vert.eco',
  'Reporterre': 'https://reporterre.net',
  'Blast': 'https://www.blast-info.fr',
  'Le Média': 'https://www.lemediatv.fr',
  'Le Media TV': 'https://www.lemediatv.fr',
  'Anticor': 'https://www.anticor.org',
  'HuffPost': 'https://www.huffingtonpost.fr',
  'France Inter': 'https://www.radiofrance.fr/franceinter',
  'France Info': 'https://www.franceinfo.fr',
  'TV5 Monde': 'https://www.tv5monde.com',
  'LCP': 'https://lcp.fr',
  'CNEWS': 'https://www.cnews.fr',
  'Sud Radio': 'https://www.sudradio.fr',
  'Cour de Cassation': 'https://www.courdecassation.fr',
  'HATVP': 'https://www.hatvp.fr',
  'Europarl': 'https://www.europarl.europa.eu',
  'Datan': 'https://datan.fr',
  'Renaissance Portal': 'https://parti-renaissance.fr',
  'Renaissance France': 'https://parti-renaissance.fr',
  'Horizons': 'https://horizons-le-parti.fr',
  'Fonds de dotation PP': 'https://www.placepublique.eu',
  'PNF Reports': 'https://www.economie.gouv.fr/pnf',
  'Orange News': 'https://actu.orange.fr',
  'Le Grand Continent': 'https://legrandcontinent.eu',
  'La Région Occitanie': 'https://www.laregion.fr',
  'Elle': 'https://www.elle.fr',
  "L'internaute": 'https://www.linternaute.com',
  'Actu.fr': 'https://actu.fr',
  // Sources sans site officiel ou inconnues -> null (non cliquables)
  'Le Canard Enchaîné': null,
  'Politique France': null,
  'Nous France': null,
  'Parlons Politique': null,
  'Ecom News': null,
};

// Override manuel par id (fiable, le texte n'est pas assez régulier pour une heuristique).
// Valeurs : clean | investigation | indicted | convicted
const STATUS_OVERRIDES = {
  'jordan-bardella': 'investigation',
  'emmanuel-macron': 'clean',
  'jean-luc-melenchon': 'convicted',
  'edouard-philippe': 'clean',
  'marine-le-pen': 'indicted',
  'gabriel-attal': 'clean',
  'raphael-glucksmann': 'clean',
  'fabien-roussel': 'clean',
  'emmanuel-gregoire': 'clean',
  'benoit-payan': 'investigation',
  'eric-ciotti': 'investigation',
  'jean-luc-moudenc': 'investigation',
  'gregory-doucet': 'clean',
  'david-guiraud': 'clean',
  'bally-bagayoko': 'clean',
  'rachida-dati': 'indicted',
  'francois-ruffin': 'clean',
  'sandrine-rousseau': 'clean',
  'eric-zemmour': 'convicted',
  'bruno-le-maire': 'clean',
  'prisca-thevenot': 'clean',
  'yannick-jadot': 'clean',
  'valerie-pecresse': 'investigation',
  'xavier-bertrand': 'clean',
  'laurent-wauquiez': 'investigation',
  'manuel-bompard': 'clean',
  'olivier-faure': 'clean',
  'carole-delga': 'clean',
  'robert-menard': 'indicted',
};

function deriveGlobalStatus(politician) {
  return STATUS_OVERRIDES[politician.id] || 'clean';
}

function migrateSources(sources) {
  if (!Array.isArray(sources)) return [];
  return sources.map((s) => {
    if (typeof s === 'object' && s !== null && 'name' in s) return s; // déjà migré
    const name = String(s).trim();
    const url = MEDIA_URLS[name] !== undefined ? MEDIA_URLS[name] : null;
    return { name, url };
  });
}

function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const politicians = JSON.parse(raw);

  for (const p of politicians) {
    // 1. Migration sources
    if (p.legal && p.legal.sources) {
      p.legal.sources = migrateSources(p.legal.sources);
    }
    // 2. globalStatus (toujours recalculé pour rester en phase avec l'override)
    if (p.legal) {
      p.legal.globalStatus = deriveGlobalStatus(p);
    }
    // 3. champ votes par défaut
    if (!p.votes) {
      p.votes = { instance: null, items: [] };
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(politicians, null, 2) + '\n', 'utf-8');
  console.log(`OK — ${politicians.length} fiches migrées.`);

  // Petit récap
  const counts = politicians.reduce((acc, p) => {
    const s = p.legal?.globalStatus || 'unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  console.log('Répartition globalStatus :', counts);

  const unknownSources = new Set();
  for (const p of politicians) {
    for (const s of p.legal?.sources || []) {
      if (s.url === null && !(s.name in MEDIA_URLS)) unknownSources.add(s.name);
    }
  }
  if (unknownSources.size > 0) {
    console.log('Sources sans URL connue (à compléter à la main si tu veux) :', [...unknownSources]);
  }
}

main();
