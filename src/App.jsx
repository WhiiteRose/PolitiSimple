import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Gavel,
  Info,
  Landmark,
  Minus,
  Moon,
  ScrollText,
  Search,
  ShieldCheck,
  Slash,
  Sun,
  Vote,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import financesData from './data/finances.json';
import politiciansData from './data/politicians.json';

import './index.css';

const LEGAL_STATUS_META = {
  clean: {
    label: 'Aucune procédure',
    color: '#16a34a',
    icon: ShieldCheck,
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30',
    textClass: 'text-emerald-700 dark:text-emerald-400',
  },
  investigation: {
    label: 'Enquête en cours',
    color: '#eab308',
    icon: AlertTriangle,
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/30',
    textClass: 'text-yellow-700 dark:text-yellow-400',
  },
  indicted: {
    label: 'Mis en examen / Procès en cours',
    color: '#ea580c',
    icon: AlertTriangle,
    bgClass: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30',
    textClass: 'text-orange-700 dark:text-orange-400',
  },
  convicted: {
    label: 'Condamné',
    color: '#dc2626',
    icon: Gavel,
    bgClass: 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/30',
    textClass: 'text-red-700 dark:text-red-400',
  },
};

const VOTE_POSITION_META = {
  pour: {
    label: 'POUR',
    icon: Check,
    classes:
      'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30',
  },
  contre: {
    label: 'CONTRE',
    icon: X,
    classes: 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-500/30',
  },
  abstention: {
    label: 'ABS.',
    icon: Minus,
    classes:
      'bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md shadow-yellow-500/30',
  },
  absent: {
    label: 'ABSENT',
    icon: Slash,
    classes:
      'bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-md shadow-slate-500/20',
  },
};

const INSTANCE_FLAG = {
  'Assemblée Nationale': '🇫🇷',
  Sénat: '🇫🇷',
  'Parlement européen': '🇪🇺',
};

const FR_MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

function formatFrenchDate(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const day = parseInt(m[3], 10);
  const month = FR_MONTH_NAMES[parseInt(m[2], 10) - 1];
  return `${day} ${month} ${m[1]}`;
}

function SourceLink({ source }) {
  if (!source.url) {
    return (
      <span className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black rounded-lg border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
        {source.name}
      </span>
    );
  }
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[10px] font-black rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors uppercase tracking-wider"
    >
      {source.name}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}

function VotesSection({ politician }) {
  const [showAll, setShowAll] = useState(false);
  const votes = politician.votes;
  if (!votes || !votes.items || votes.items.length === 0) return null;

  const items = showAll ? votes.items : votes.items.slice(0, 3);
  const flag = INSTANCE_FLAG[votes.instance] || '';

  return (
    <section>
      <div className="flex items-center gap-4 mb-10">
        <div
          className="p-4 text-white rounded-[1.5rem] shadow-xl"
          style={{
            backgroundColor: politician.partyColor,
            boxShadow: `0 10px 25px -5px ${politician.partyColor}33`,
          }}
        >
          <Vote className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase">
            Votes & Positions
          </h3>
          {votes.instance && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider">
              <span>{flag}</span>
              <span>{votes.instance}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const meta = VOTE_POSITION_META[item.position] || VOTE_POSITION_META.absent;
          const PositionIcon = meta.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex gap-4 sm:gap-5 items-stretch"
            >
              <div
                className={`shrink-0 flex flex-col items-center justify-center gap-1 w-20 sm:w-24 rounded-xl ${meta.classes}`}
              >
                <PositionIcon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={3} />
                <span className="text-[10px] font-black tracking-widest">{meta.label}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  {item.date}
                </div>
                <h4 className="text-sm sm:text-base font-black uppercase tracking-tight leading-snug mb-1.5">
                  {item.law}
                </h4>
                {item.summary && (
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-2">
                    {item.summary}
                  </p>
                )}
                {item.sources && item.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.sources.map((s, i) => (
                      <SourceLink key={i} source={s} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {votes.items.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
        >
          {showAll ? 'Voir moins' : `Voir tous les votes (${votes.items.length})`}
          <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
        </button>
      )}
    </section>
  );
}

function MentionsLegales() {
  return (
    <div className="max-w-3xl mx-auto py-12 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-[1.5rem] shadow-xl">
          <ScrollText className="h-6 w-6" />
        </div>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase">
          Mentions légales
        </h2>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300">
        <section>
          <h3 className="text-xl font-black uppercase tracking-tight mb-3">Nature du site</h3>
          <p>
            PolitiSimple est un site d'information non officiel à vocation citoyenne. Son but est de
            rassembler et présenter de manière synthétique des informations publiques relatives à
            des personnalités politiques françaises (programmes, votes parlementaires, procédures
            judiciaires).
          </p>
        </section>

        <section>
          <h3 className="text-xl font-black uppercase tracking-tight mb-3">
            Sources & vérification
          </h3>
          <p>
            Les informations publiées proviennent de sources publiques diversifiées : open data des
            assemblées (Assemblée Nationale, Parlement européen), presse française (Le Monde, Le
            Figaro, Libération, Mediapart, Le Canard Enchaîné, etc.), publications officielles
            (HATVP, Cour de cassation). Chaque information sensible est sourcée. Aucune source
            unique n'est privilégiée.
          </p>
          <p>
            Les votes et positions sont reconstitués à partir des registres officiels des assemblées
            et de sites de transparence (datan.fr, howtheyvote.eu). Une étiquette « À vérifier »
            signale les données en cours de validation.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-black uppercase tracking-tight mb-3">
            Présomption d'innocence
          </h3>
          <p>
            Les informations relatives à des procédures judiciaires sont présentées dans le strict
            respect de la <strong>présomption d'innocence</strong> (art. 9-1 du Code civil). Une
            mise en examen, une enquête préliminaire ou une plainte ne valent pas culpabilité. Le
            statut judiciaire affiché (« Enquête en cours », « Mis en examen », « Condamné »)
            reflète l'état connu de la procédure au moment de la dernière mise à jour de la fiche.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-black uppercase tracking-tight mb-3">
            Droit de réponse & corrections
          </h3>
          <p>
            Conformément à la loi du 29 juillet 1881 sur la liberté de la presse, toute personne
            nommée sur ce site dispose d'un droit de réponse. Les demandes de rectification, de mise
            à jour ou de suppression peuvent être adressées via le dépôt d'une issue sur le dépôt
            public du projet ou par tout autre canal mis à disposition. Toute demande légitime est
            traitée dans les meilleurs délais.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-black uppercase tracking-tight mb-3">Responsabilité</h3>
          <p>
            Malgré le soin apporté à la qualité des informations, des erreurs peuvent subsister.
            PolitiSimple ne saurait être tenu pour responsable de l'usage qui serait fait des
            informations publiées. Les opinions politiques exprimées dans les programmes restent
            celles de leurs auteurs respectifs.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-black uppercase tracking-tight mb-3">
            Hébergement & technique
          </h3>
          <p>
            Site statique, sans collecte de données personnelles, sans cookie de suivi, sans
            inscription. Le code source est ouvert sous licence MIT.
          </p>
        </section>
      </div>
    </div>
  );
}

function FinanceBar({ entry, max, kind }) {
  const pct = Math.max(2, (Math.abs(entry.amount) / max) * 100);
  const isSurplus = kind === 'surplus';
  const formatted = (entry.amount > 0 ? '+' : '') + entry.amount.toLocaleString('fr-FR') + ' €';
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 truncate">
          {entry.name}
        </div>
        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              isSurplus
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                : 'bg-gradient-to-r from-red-400 to-red-600'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div
        className={`shrink-0 text-xs sm:text-sm font-black tabular-nums ${
          isSurplus ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
        }`}
      >
        {formatted}
      </div>
    </div>
  );
}

function ChiffresAssemblee({ onSelectPolitician }) {
  const maxSurplus = Math.max(...financesData.surplus.map((e) => Math.abs(e.amount)));
  const maxDeficit = Math.max(...financesData.deficit.map((e) => Math.abs(e.amount)));
  const convicted = politiciansData.filter((p) => p.legal?.globalStatus === 'convicted');
  const indicted = politiciansData.filter((p) => p.legal?.globalStatus === 'indicted');

  return (
    <div className="max-w-5xl mx-auto pt-6 pb-12 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-[1.5rem] shadow-xl">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase">
            Chiffres Assemblée
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 italic">
            Données agrégées sur le paysage politique français.
          </p>
        </div>
      </div>

      <section className="mb-20">
        <div className="flex items-baseline justify-between mb-8 flex-wrap gap-2">
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
            Finances des partis · {financesData.year}
          </h3>
          <a
            href={financesData.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Source · {financesData.source.name}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
            <h4 className="text-base font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-6 flex items-center gap-2">
              <span className="h-1.5 w-6 bg-emerald-500 rounded-full" />
              Excédentaires ({financesData.surplus.length})
            </h4>
            <div className="space-y-4">
              {financesData.surplus.map((e, i) => (
                <FinanceBar key={i} entry={e} max={maxSurplus} kind="surplus" />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-sm">
            <h4 className="text-base font-black uppercase tracking-widest text-red-700 dark:text-red-400 mb-6 flex items-center gap-2">
              <span className="h-1.5 w-6 bg-red-500 rounded-full" />
              Déficitaires ({financesData.deficit.length})
            </h4>
            <div className="space-y-4">
              {financesData.deficit.map((e, i) => (
                <FinanceBar key={i} entry={e} max={maxDeficit} kind="deficit" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl sm:text-3xl font-black tracking-tight uppercase mb-2">
          Personnalités condamnées ou poursuivies
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 italic">
          Présomption d'innocence respectée. Statut au moment de la dernière mise à jour de chaque
          fiche.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...convicted, ...indicted].map((p) => {
            const meta = LEGAL_STATUS_META[p.legal.globalStatus];
            const Icon = meta.icon;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPolitician(p.id)}
                className={`text-left p-5 rounded-2xl border ${meta.bgClass} hover:shadow-md transition-all`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-[9px] font-black uppercase tracking-widest"
                    style={{ backgroundColor: meta.color }}
                  >
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                </div>
                <div className="font-black uppercase tracking-tight text-base mb-1">{p.name}</div>
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {p.party}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug line-clamp-3">
                  {p.legal.status}
                </p>
              </button>
            );
          })}
        </div>

        {convicted.length + indicted.length === 0 && (
          <p className="text-slate-500 italic">Aucune fiche correspondante pour le moment.</p>
        )}
      </section>
    </div>
  );
}

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [showChiffres, setShowChiffres] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', isDark ? '#0f172a' : '#ffffff');
  }, [isDark]);

  useEffect(() => {
    const handleHashChange = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const hash = window.location.hash.replace('#', '');
      if (hash === 'mentions-legales') {
        setShowMentions(true);
        setShowChiffres(false);
        setSelectedId(null);
      } else if (hash === 'chiffres-assemblee') {
        setShowChiffres(true);
        setShowMentions(false);
        setSelectedId(null);
      } else if (hash && politiciansData.some((p) => p.id === hash)) {
        setShowMentions(false);
        setShowChiffres(false);
        setSelectedId(hash);
      } else {
        setShowMentions(false);
        setShowChiffres(false);
        setSelectedId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectPolitician = (id) => {
    window.location.hash = id || '';
  };

  const goHome = () => {
    window.location.hash = '';
  };

  const filteredPoliticians = useMemo(() => {
    return politiciansData.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.bio.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  const selectedPolitician = useMemo(() => {
    return politiciansData.find((p) => p.id === selectedId);
  }, [selectedId]);

  const handleLogoClick = () => {
    goHome();
    setSearchTerm('');
  };

  const showProfile = !!selectedId && !!selectedPolitician;
  const showList = !showMentions && !showChiffres && !showProfile;

  return (
    <div className="min-h-screen font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="w-1/4">
            <h1
              onClick={handleLogoClick}
              className="text-2xl sm:text-3xl font-black tracking-tighter cursor-pointer hover:opacity-80 transition-opacity select-none shrink-0"
            >
              PolitiSimple<span className="text-blue-600">.</span>
            </h1>
          </div>

          <div className="hidden md:flex flex-1 justify-center items-center gap-3 max-w-2xl">
            {showList && (
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une personnalité, un parti, une ville..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm font-medium shadow-sm hover:shadow-md"
                />
              </div>
            )}
          </div>

          <div className="w-1/4 flex justify-end items-center gap-3">
            <a
              href="#chiffres-assemblee"
              className="inline-flex items-center gap-2 px-2.5 py-2.5 sm:px-3.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-800/40 hover:scale-105 transition-all whitespace-nowrap"
            >
              <Landmark className="h-5 w-5" strokeWidth={2} />
              <span className="hidden sm:inline">Assemblée</span>
            </a>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:scale-105 transition-transform"
              aria-label="Changer de thème"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-white" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
            </button>

            {(showProfile || showMentions || showChiffres) && (
              <button
                onClick={goHome}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Retour</span>
              </button>
            )}
          </div>
        </div>

        {showList && (
          <div className="md:hidden px-4 pb-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-base"
              />
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showMentions && <MentionsLegales />}

        {showChiffres && <ChiffresAssemblee onSelectPolitician={handleSelectPolitician} />}

        {showList && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {filteredPoliticians.map((p) => (
              <div
                key={p.id}
                className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 cursor-pointer"
                onClick={() => handleSelectPolitician(p.id)}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=400&bold=true`;
                    }}
                  />
                  <div
                    className="absolute bottom-4 left-4 px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-lg"
                    style={{ backgroundColor: p.partyColor }}
                  >
                    {p.party}
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold mb-3 uppercase tracking-wider">
                    <Clock className="h-3 w-3" />
                    Mise à jour : {formatFrenchDate(p.lastUpdate)}
                  </div>
                  <h3 className="text-2xl font-black mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">
                    {p.name}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 italic">
                    "{p.bio}"
                  </p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest">
                    Découvrir le profil{' '}
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-2 transition-all" />
                  </div>
                </div>
              </div>
            ))}

            {filteredPoliticians.length === 0 && (
              <div className="col-span-full py-32 text-center">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-xl font-bold text-slate-400">
                  Aucun profil ne correspond à votre recherche.
                </p>
              </div>
            )}
          </div>
        )}

        {showProfile && <ProfileView politician={selectedPolitician} />}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-16 mt-32 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h4 className="text-xl font-black tracking-tighter mb-4 opacity-70">POLITISIMPLE.</h4>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            L'information politique simplifiée — © 2026
          </p>
          <a
            href="#mentions-legales"
            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            Mentions légales & droit de réponse
          </a>
        </div>
      </footer>
    </div>
  );
}

function ProfileView({ politician }) {
  const legalMeta = LEGAL_STATUS_META[politician.legal?.globalStatus] || LEGAL_STATUS_META.clean;
  const LegalIcon = legalMeta.icon;
  const amendmentsWritten = politician.stats?.amendmentsWritten ?? null;
  const formattedAmendments =
    amendmentsWritten !== null ? amendmentsWritten.toLocaleString('fr-FR') : null;

  return (
    <div className="max-w-4xl mx-auto space-y-16 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
        <div className="relative shrink-0">
          <img
            src={politician.image}
            alt={politician.name}
            className="w-48 h-48 sm:w-64 sm:h-64 rounded-[3.5rem] object-cover ring-8 ring-white dark:ring-slate-900 shadow-2xl"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(politician.name)}&background=random&size=400&bold=true`;
            }}
          />
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-2xl whitespace-nowrap"
            style={{ backgroundColor: politician.partyColor }}
          >
            {politician.party}
          </div>
        </div>
        <div className="text-center md:text-left flex-1 py-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 text-[10px] font-black uppercase tracking-wider mb-6">
            <Clock className="h-3 w-3" />
            Actualisé le {formatFrenchDate(politician.lastUpdate)}
          </div>
          <h2 className="text-5xl sm:text-7xl font-black mb-6 tracking-tighter leading-none uppercase">
            {politician.name}
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black rounded-xl uppercase tracking-widest border border-blue-100 dark:border-blue-900/50">
              Dossier complet
            </span>
            {formattedAmendments !== null && (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                <ScrollText className="h-3.5 w-3.5" />
                {formattedAmendments} amendements écrits
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-16">
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-xl shadow-blue-500/20">
              <Info className="h-6 w-6" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase">
              Le Programme
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {politician.program.map((cat, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all"
              >
                <h4 className="text-xl font-black mb-8 text-blue-600 dark:text-blue-400 uppercase tracking-tight flex items-center gap-3">
                  <span className="h-1.5 w-6 bg-blue-600 rounded-full" />
                  {cat.category}
                </h4>
                <ul className="space-y-6">
                  {cat.points.map((pt, i) => (
                    <li
                      key={i}
                      className="flex gap-4 text-slate-600 dark:text-slate-400 font-semibold leading-relaxed group"
                    >
                      <ChevronRight className="h-5 w-5 shrink-0 text-blue-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[15px]">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <VotesSection politician={politician} />

        <section>
          <div className="flex items-center gap-4 mb-10">
            <div
              className="p-4 text-white rounded-[1.5rem] shadow-xl"
              style={{
                backgroundColor: legalMeta.color,
                boxShadow: `0 10px 25px -5px ${legalMeta.color}33`,
              }}
            >
              <LegalIcon className="h-6 w-6" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase">
              Justice & Légalité
            </h3>
          </div>

          <div className={`border ${legalMeta.bgClass} p-8 sm:p-12 rounded-[3.5rem] shadow-sm`}>
            <div className="pb-8 border-b border-current/10 mb-10 flex flex-wrap items-center gap-4">
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-lg"
                style={{ backgroundColor: legalMeta.color }}
              >
                <LegalIcon className="h-4 w-4" />
                {legalMeta.label}
              </span>
              <p
                className={`text-lg sm:text-xl font-black uppercase tracking-tighter ${legalMeta.textClass}`}
              >
                {politician.legal.status}
              </p>
            </div>

            <div className="space-y-8 mb-12">
              {politician.legal.details.map((detail, idx) => (
                <div key={idx} className="flex gap-6 items-start group">
                  <div
                    className="h-10 w-1.5 rounded-full opacity-30 group-hover:opacity-100 transition-all duration-500"
                    style={{ backgroundColor: legalMeta.color }}
                  />
                  <p className="text-slate-800 dark:text-slate-200 font-bold text-lg leading-snug">
                    {detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-current/10">
              <span
                className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ${legalMeta.textClass}`}
              >
                Sources citées
              </span>
              {politician.legal.sources.map((s, i) => (
                <SourceLink key={i} source={s} />
              ))}
            </div>

            <p className="mt-8 text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
              Présomption d'innocence respectée. Les informations sont publiques et sourcées.{' '}
              <a
                href="#mentions-legales"
                className="underline hover:text-blue-600 dark:hover:text-blue-400"
              >
                Droit de réponse
              </a>
              .
            </p>
          </div>
        </section>

        {politician.timeline && politician.timeline.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-10">
              <div
                className="p-4 text-white rounded-[1.5rem] shadow-xl"
                style={{
                  backgroundColor: politician.partyColor,
                  boxShadow: `0 10px 25px -5px ${politician.partyColor}33`,
                }}
              >
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase">
                Parcours & Expérience
              </h3>
            </div>

            <div className="relative pl-8 sm:pl-12 space-y-12 before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
              {politician.timeline.map((item, idx) => (
                <div key={idx} className="relative group">
                  <div
                    className="absolute -left-[30px] sm:-left-[38px] top-1.5 h-4 w-4 rounded-full border-4 border-white dark:border-slate-900 group-hover:scale-150 transition-all duration-300"
                    style={{ backgroundColor: politician.partyColor }}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                    <span
                      className="font-black text-lg tracking-tighter uppercase shrink-0 min-w-[100px]"
                      style={{ color: politician.partyColor }}
                    >
                      {item.year}
                    </span>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black uppercase tracking-tight leading-none group-hover:opacity-70 transition-opacity">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic text-sm">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
