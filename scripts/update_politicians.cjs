const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/politicians.json');

const socialSections = {
  gauche: [
    {
      category: "Droits des Femmes",
      points: [
        "Loi intégrale contre les violences sexistes (1 md €).",
        "Abrogation de l'écart salarial sous peine de sanctions.",
        "Remboursement total des moyens de contraception."
      ]
    },
    {
      category: "Droits LGBT+",
      points: [
        "Changement d'état civil libre et gratuit.",
        "PMA pour toutes et accès facilité à la transition.",
        "Lutte radicale contre les discriminations à l'embauche."
      ]
    },
    {
      category: "Environnement & Énergie",
      points: [
        "Planification écologique radicale (100% renouvelables).",
        "Rénovation thermique globale des logements publics.",
        "Taxe carbone sur les super-profits industriels."
      ]
    },
    {
      category: "Étudiants",
      points: [
        "Revenu d'autonomie pour tous les étudiants (1100€/mois).",
        "Gratuité totale des transports publics régionaux.",
        "Garantie du repas à 1€ universel dans tous les RU."
      ]
    }
  ],
  centre: [
    {
      category: "Droits des Femmes",
      points: [
        "Constitutionnalisation de l'IVG (Protection renforcée).",
        "Renforcement de l'index égalité professionnelle.",
        "Prévention massive contre les violences sexistes."
      ]
    },
    {
      category: "Droits LGBT+",
      points: [
        "Défense du mariage pour tous et de la PMA.",
        "Plan de lutte contre les haines anti-LGBT+ 2026.",
        "Soutien aux centres d'accueil spécialisés."
      ]
    },
    {
      category: "Environnement & Énergie",
      points: [
        "Relance du nucléaire (EPR2) et mix électrique stable.",
        "Accélération du déploiement de l'éolien en mer.",
        "Soutien à l'hydrogène vert et décarbonation de l'industrie."
      ]
    },
    {
      category: "Étudiants",
      points: [
        "Réforme des bourses pour inclure davantage de classes moyennes.",
        "Développement du service national universel (SNU).",
        "Prêt à taux zéro garanti par l'État pour les projets jeunes."
      ]
    }
  ],
  droite: [
    {
      category: "Droits des Femmes",
      points: [
        "Boutons d'alerte pour les femmes victimes de violences.",
        "Promotion de la méritocratie féminine en entreprise.",
        "Revalorisation des pensions de réversion pour les veuves."
      ]
    },
    {
      category: "Droits LGBT+",
      points: [
        "Maintien de l'égalité devant la loi pour tous.",
        "Refus du militantisme de genre dans les écoles.",
        "Fermeté contre toute agression, sans distinction."
      ]
    },
    {
      category: "Environnement & Énergie",
      points: [
        "Souveraineté énergétique via le parc nucléaire existant.",
        "Écologie pragmatique sans hausse de la fiscalité.",
        "Soutien au transport ferroviaire et fret national."
      ]
    },
    {
      category: "Étudiants",
      points: [
        "Priorité à l'insertion professionnelle et à l'alternance.",
        "Soutien aux bourses basées sur le mérite et l'effort.",
        "Plan logement étudiant via la rénovation du parc CROUS."
      ]
    }
  ],
  extreme_droite: [
    {
      category: "Droits des Femmes",
      points: [
        "Priorité à la sécurité des femmes dans l'espace public.",
        "Aides fiscales ciblées pour les mères de familles.",
        "Lutte contre le fondamentalisme religieux sexiste."
      ]
    },
    {
      category: "Droits LGBT+",
      points: [
        "Respect du cadre légal du mariage civil actuel.",
        "Fermeté pénale contre toutes les agressions physiques.",
        "Neutralité idéologique dans les institutions publiques."
      ]
    },
    {
      category: "Environnement & Énergie",
      points: [
        "Défense du 'Made in France' et circuits courts territoriaux.",
        "Moratoire sur l'éolien terrestre pour protéger les paysages.",
        "Baisse de la TVA sur l'énergie pour le pouvoir d'achat."
      ]
    },
    {
      category: "Étudiants",
      points: [
        "Priorité nationale pour l'accès aux résidences universitaires.",
        "Rétablissement de l'autorité et de la discipline à l'université.",
        "Bourse d'excellence liée à l'assiduité et aux résultats."
      ]
    }
  ]
};

function getBlock(p) {
  const party = p.party.toLowerCase();
  const id = p.id;
  if (party.includes('insoumise') || party.includes('écologistes') || party.includes('pcf') || party.includes('nfp') || id.includes('ruffin') || id.includes('glucksmann') || id.includes('rousseau') || id.includes('doucet') || id.includes('payan') || id.includes('gregoire') || id.includes('guiraud') || id.includes('bagayoko')) return 'gauche';
  if (party.includes('renaissance') || party.includes('ensemble') || id === 'emmanuel-macron' || id.includes('thevenot') || id.includes('le-maire') || id.includes('attal')) return 'centre';
  if (party.includes('rassemblement national') || party.includes('rn') || party.includes('reconquête') || id.includes('ciotti') || id.includes('menard') || id.includes('zemmour') || id.includes('marine')) return 'extreme_droite';
  return 'droite';
}

const politicians = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const updated = politicians.map(p => {
  const block = getBlock(p);
  const sections = socialSections[block];
  
  // Clean potential duplicates or existing new categories to avoid bloat
  const cleanProgram = p.program.filter(s => 
    !["Droits des Femmes", "Droits LGBT+", "Environnement & Énergie", "Étudiants"].includes(s.category)
  );

  // Re-add them cleanly
  p.program = [...cleanProgram, ...sections];
  
  return p;
});

fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
console.log('Base de données PolitiSimple mise à jour avec 7 catégories par profil.');
