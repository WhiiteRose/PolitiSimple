import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  Gavel,
  RotateCcw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import financesData from './data/finances.json';
import politiciansData from './data/politicians.json';
import quizData from './data/quiz.json';

import './index.css';

// ─────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────

const ICON_STROKE = 1.6;

const LEGAL_STATUS_META = {
  clean: {
    label: 'Aucune procédure',
    short: '✓ Casier vide',
    icon: ShieldCheck,
    color: 'green',
  },
  investigation: {
    label: 'Enquête en cours',
    short: '! Enquête',
    icon: AlertTriangle,
    color: 'red',
  },
  indicted: {
    label: 'Mis en examen',
    short: '! Mis en examen',
    icon: AlertTriangle,
    color: 'red',
  },
  convicted: {
    label: 'Condamné',
    short: '✗ Condamné',
    icon: Gavel,
    color: 'red',
  },
};

const FR_MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const FR_MONTH_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

const IMPORTANCE_LABELS = ['Aucune', 'Faible', 'Moyenne', 'Forte', 'Cruciale'];
const IMPORTANCE_WEIGHTS = [0.25, 0.6, 1, 1.5, 2];

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

function formatFrenchDate(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${parseInt(m[3], 10)} ${FR_MONTH_NAMES[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

function formatShortDate(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${parseInt(m[3], 10)} ${FR_MONTH_SHORT[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

function formatDotDate(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function formatMillions(amount) {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1).replace('.', ',')} M€`;
  if (abs >= 1_000) return `${Math.round(abs / 1_000)} K€`;
  return `${abs} €`;
}

function partyShort(party) {
  return party.split(/[/(]/)[0].trim();
}

// Famille politique → clé de couleur ('red', 'blue', 'green', 'white').
// — rouge : gauche (LFI, PCF, PS, NFP, NUPES, place publique)
// — bleu  : droite + extrême-droite (RN, LR, Reconquête, Debout la France…)
// — vert  : écologistes (EELV, Les Écologistes)
// — blanc : centre (Renaissance, MoDem, Horizons, Ensemble)
function partyFamily(party) {
  if (!party) return 'white';
  const p = party.toLowerCase();
  if (
    p.includes('insoumise') || p.includes('lfi') ||
    p.includes('communiste') || p.includes('pcf') ||
    p.includes('socialiste') || /\bps\b/.test(p) ||
    p.includes('place publique') ||
    p.includes('nfp') || p.includes('nupes') ||
    p.includes('the left')
  ) return 'red';
  if (
    p.includes('rassemblement national') || /\brn\b/.test(p) ||
    p.includes('reconquête') || p.includes('reconquete') ||
    p.includes('républicains') || /\blr\b/.test(p) ||
    p.includes('debout la france') || p.includes('patriotes') ||
    p.includes('identité') || p.includes('zemmour')
  ) return 'blue';
  if (
    p.includes('écolo') || p.includes('ecolo') ||
    p.includes('eelv') || p.includes('verts')
  ) return 'green';
  return 'white'; // centre / ensemble / renaissance / modem / horizons / divers
}

const FAMILY_COLORS = {
  red:   { hex: '#d6321f', bg: '#d6321f', fg: '#ffffff', border: '#d6321f' },
  blue:  { hex: '#1d4ed8', bg: '#1d4ed8', fg: '#ffffff', border: '#1d4ed8' },
  green: { hex: '#1a7a4e', bg: '#1a7a4e', fg: '#ffffff', border: '#1a7a4e' },
  white: { hex: '#ffffff', bg: '#ffffff', fg: '#0a0a0a', border: '#0a0a0a' },
};

// ─────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────

function Logo({ size = 22, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-display font-extrabold leading-none select-none bg-transparent border-0 p-0 cursor-pointer text-ink"
      style={{ fontSize: size, letterSpacing: '-0.04em' }}
    >
      politisimple<span style={{ color: 'var(--ink-red)' }}>.</span>
    </button>
  );
}

function Eyebrow({ children, color = 'red', className = '' }) {
  const colorVar = color === 'blue' ? 'var(--ink-blue)' : color === 'green' ? 'var(--ink-green)' : 'var(--ink-red)';
  return (
    <span
      className={`font-display font-bold tracking-[0.1em] uppercase ${className}`}
      style={{ color: colorVar, fontSize: 13 }}
    >
      {children}
    </span>
  );
}

function SourceLink({ source }) {
  if (!source.url) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-[10px] font-semibold tracking-[0.05em] uppercase border border-ink text-ink-mute" style={{ borderRadius: 999 }}>
        {source.name}
      </span>
    );
  }
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold tracking-[0.05em] uppercase border border-ink text-ink hover:bg-ink hover:text-paper transition-colors"
      style={{ borderRadius: 999 }}
    >
      {source.name} ↗
    </a>
  );
}

function PhotoFrame({ politician, ratio = '4/5', children, bordered = false }) {
  return (
    <div
      className="photo-wrap"
      style={{ aspectRatio: ratio, width: '100%', border: bordered ? '1.5px solid var(--ink)' : 'none' }}
    >
      <img
        src={politician.image}
        alt={politician.name}
        className="photo"
        referrerPolicy="no-referrer"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(politician.name)}&background=0a0a0a&color=ffffff&size=400&bold=true`;
        }}
      />
      {children}
    </div>
  );
}

function SectionHead({ kicker, kickerColor = 'red', title, count, right, subtitle }) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-4 flex-wrap">
          {kicker && <Eyebrow color={kickerColor}>§ {kicker}</Eyebrow>}
          <h2 className="font-display font-extrabold text-ink leading-none text-4xl sm:text-5xl lg:text-6xl" style={{ letterSpacing: '-0.04em' }}>
            {title}
          </h2>
          {count != null && <span className="text-sm text-ink-mute">· {count}</span>}
        </div>
        {right}
      </div>
      {subtitle && <p className="text-base text-ink-mute mt-3 max-w-2xl">{subtitle}</p>}
      <hr className="rule rule--thick mt-4" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────

function Header({ activeRoute, onGoHome, searchTerm, onSearch, showSearch = true }) {
  return (
    <header className="sticky top-0 z-40 bg-paper" style={{ borderBottom: '1.5px solid var(--ink)' }}>
      <div className="flex items-center gap-3 sm:gap-6 px-4 sm:px-6 lg:px-12 py-3.5">
        <Logo size={22} onClick={onGoHome} />
        <nav className="hidden md:flex items-center gap-1 ml-2">
          <HeaderLink href="#" active={activeRoute === 'home' || activeRoute === 'profile'}>Personnalités</HeaderLink>
          <HeaderLink href="#chiffres-assemblee" active={activeRoute === 'chiffres'}>Assemblée</HeaderLink>
          <HeaderLink href="#quiz" active={activeRoute === 'quiz'}>Quiz</HeaderLink>
        </nav>

        {showSearch && (
          <div className="input ml-auto" style={{ flex: '1 1 280px', maxWidth: 420, padding: '8px 14px' }}>
            <Search className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={ICON_STROKE} />
            <input
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Rechercher une personnalité, un parti…"
            />
            <span className="kbd hidden lg:inline">⌘ K</span>
          </div>
        )}
        {!showSearch && <div className="flex-1" />}

        <a href="#quiz" className="btn btn--sm btn--solid hidden sm:inline-flex">
          Faire le quiz →
        </a>
      </div>
    </header>
  );
}

function HeaderLink({ href, active, children }) {
  return (
    <a
      href={href}
      className="px-3 py-2 font-display font-medium text-[13px] transition-colors"
      style={{
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--paper)' : 'var(--ink)',
      }}
    >
      {children}
    </a>
  );
}

// ─────────────────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────────────────

function HomeHero() {
  return (
    <section className="px-4 sm:px-6 lg:px-12 pt-14 lg:pt-20">
      <div className="hand text-2xl sm:text-3xl mb-4" style={{ color: 'var(--ink-red)', transform: 'rotate(-2deg)' }}>
        avant de voter, lisez. ↓
      </div>
      <h1
        className="font-display font-extrabold text-ink"
        style={{ fontSize: 'clamp(56px, 11vw, 156px)', letterSpacing: '-0.055em', lineHeight: 0.86 }}
      >
        La vraie <span className="marker">fiche</span><br />
        <em style={{ fontStyle: 'italic', fontWeight: 400 }}>de chaque</em> politique<span style={{ color: 'var(--ink-red)' }}>.</span>
      </h1>
      <p className="text-lg sm:text-xl mt-8 max-w-3xl leading-snug text-ink">
        Programmes, votes, parcours, financement. <span className="text-ink-mute">Tout en une page. Sourcé. Sans interprétation.</span>
      </p>
      <div className="flex gap-3 mt-8 flex-wrap">
        <a href="#" className="btn btn--solid">Parcourir les fiches →</a>
        <a href="#quiz" className="btn">Faire le quiz</a>
      </div>
      <hr className="rule rule--thick mt-14 lg:mt-20" />
    </section>
  );
}

function PortraitTile({ politician, onSelect, isLastCol, isFirstRow, badgeColor, annotation, dark = false }) {
  const borderColor = dark ? 'rgba(255,255,255,0.15)' : 'rgba(128,128,128,0.18)';
  // Si badgeColor n'est pas explicitement forcé (ex: 'red' pour procédures),
  // on utilise la couleur de famille politique.
  const family = badgeColor || partyFamily(politician.party);
  const fc = FAMILY_COLORS[family] || FAMILY_COLORS.white;
  const needsBorder = family === 'white';

  return (
    <button
      onClick={() => onSelect(politician.id)}
      className="group text-left p-5 sm:p-7 relative w-full transition-colors"
      style={{
        background: 'transparent',
        borderRight: isLastCol ? 'none' : `1px solid ${borderColor}`,
        borderTop: isFirstRow ? 'none' : `1px solid ${borderColor}`,
        color: dark ? 'var(--paper)' : 'var(--ink)',
      }}
    >
      <PhotoFrame politician={politician} ratio="4/5">
        <span
          className="absolute left-2.5 bottom-2.5 px-2 py-1 font-display font-bold uppercase"
          style={{
            background: fc.bg,
            color: fc.fg,
            border: needsBorder ? `1px solid ${fc.border}` : 'none',
            fontSize: 10,
            letterSpacing: '0.15em',
          }}
        >
          {partyShort(politician.party)}
        </span>
      </PhotoFrame>
      <h3
        className="font-display font-bold mt-5"
        style={{ fontSize: 22, letterSpacing: '-0.03em' }}
      >
        {politician.name}
      </h3>
      <div className="mt-1 text-xs" style={{ color: dark ? 'rgba(255,255,255,0.7)' : 'var(--ink-mute)' }}>
        {politician.role || politician.bio?.split('.')[0]}
      </div>
      <div
        className="mt-4 flex items-center justify-between font-display font-semibold uppercase"
        style={{ fontSize: 11, letterSpacing: '0.1em' }}
      >
        <span>Lire la fiche</span>
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
      </div>
      {annotation && (
        <div
          className="hand absolute pointer-events-none"
          style={{
            top: annotation.top,
            right: annotation.right,
            color: 'var(--ink-red)',
            fontSize: annotation.size || 22,
            transform: `rotate(${annotation.rotate || -4}deg)`,
          }}
        >
          {annotation.text}
        </div>
      )}
    </button>
  );
}

function HomePersonalities({ politicians, onSelect, searchTerm }) {
  const featured = useMemo(() => {
    const want = ['emmanuel-macron', 'manon-aubry', 'jordan-bardella', 'marine-tondelier'];
    const found = want.map((id) => politicians.find((p) => p.id === id)).filter(Boolean);
    if (found.length === 4) return found;
    return politicians.slice(0, 4);
  }, [politicians]);

  const annotations = {
    'emmanuel-macron': { text: 'en exercice ↓', top: 8, right: -4, size: 22, rotate: -8 },
  };

  const [filter, setFilter] = useState('exercice');
  const [showAll, setShowAll] = useState(false);

  const isSearching = !!searchTerm;
  const expanded = showAll || isSearching;

  const filtered = useMemo(() => {
    let list = politicians;
    if (isSearching) {
      const q = searchTerm.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.party.toLowerCase().includes(q) ||
        (p.bio || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [politicians, isSearching, searchTerm]);

  const tiles = expanded ? filtered : featured;

  return (
    <section className="px-4 sm:px-6 lg:px-12 pt-14 lg:pt-20">
      <SectionHead
        kicker="À LA UNE"
        title="Personnalités"
        right={
          !expanded && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                className="btn btn--sm"
                style={filter === 'exercice' ? { background: 'var(--ink)', color: 'var(--paper)' } : {}}
                onClick={() => setFilter('exercice')}
              >
                En exercice
              </button>
              <button
                className="btn btn--sm"
                style={filter === 'candidats' ? { background: 'var(--ink)', color: 'var(--paper)' } : {}}
                onClick={() => setFilter('candidats')}
              >
                Candidats
              </button>
              <button
                className="btn btn--sm"
                style={filter === 'maires' ? { background: 'var(--ink)', color: 'var(--paper)' } : {}}
                onClick={() => setFilter('maires')}
              >
                Maires
              </button>
            </div>
          )
        }
      />

      <div
        className="grid grid-cols-2 lg:grid-cols-4"
        style={{ borderBottom: '1.5px solid var(--ink)' }}
      >
        {tiles.map((p, i) => {
          const cols = expanded ? 4 : 4;
          return (
            <PortraitTile
              key={p.id}
              politician={p}
              onSelect={onSelect}
              isLastCol={(i + 1) % cols === 0}
              isFirstRow={i < cols}
              annotation={annotations[p.id]}
            />
          );
        })}

        {tiles.length === 0 && (
          <div className="col-span-2 lg:col-span-4 py-24 text-center">
            <p className="text-lg text-ink-mute">Aucune fiche ne correspond à votre recherche.</p>
          </div>
        )}
      </div>

      {!expanded && (
        <div className="flex justify-center pt-8">
          <button className="btn" onClick={() => setShowAll(true)}>
            Voir les {politicians.length} fiches →
          </button>
        </div>
      )}
      {expanded && !isSearching && (
        <div className="flex justify-center pt-8">
          <button className="btn btn--ghost" onClick={() => setShowAll(false)}>
            ← Réduire
          </button>
        </div>
      )}
    </section>
  );
}

function HomeQuizCTA() {
  return (
    <section className="px-4 sm:px-6 lg:px-12 pt-14 lg:pt-20">
      <div
        className="relative px-6 sm:px-10 lg:px-14 py-10 lg:py-12 grid lg:grid-cols-[1.2fr_auto] gap-8 items-center"
        style={{ background: 'var(--ink)', color: 'var(--paper)' }}
      >
        <div>
          <h2
            className="font-display font-extrabold"
            style={{ fontSize: 'clamp(40px, 6vw, 64px)', letterSpacing: '-0.04em', lineHeight: 0.95 }}
          >
            Vous votez<br />comme qui<span style={{ color: 'var(--ink-red)' }}>?</span>
          </h2>
          <p className="text-base sm:text-lg mt-4 max-w-md leading-snug" style={{ opacity: 0.8 }}>
            À la fin : votre proximité chiffrée avec chaque personnalité, basée sur leurs vrais votes.
          </p>
        </div>
        <a
          href="#quiz"
          className="btn"
          style={{ background: 'var(--paper)', color: 'var(--ink)', border: 'none', fontSize: 18, padding: '20px 28px' }}
        >
          Commencer →
        </a>
        <div
          className="hand absolute pointer-events-none"
          style={{ top: -26, right: 60, color: 'var(--ink-red)', fontSize: 28, transform: 'rotate(-6deg)' }}
        >
          le préféré des lecteurs
        </div>
      </div>
    </section>
  );
}

function aggregateRecentVotes(limit = 3) {
  const grouped = new Map();
  politiciansData.forEach((p) => {
    (p.votes?.items || []).forEach((v) => {
      const key = v.law;
      if (!grouped.has(key)) {
        grouped.set(key, {
          law: v.law,
          date: v.date,
          summary: v.summary,
          instance: p.votes.instance,
          positions: [],
        });
      }
      grouped.get(key).positions.push(v.position);
    });
  });
  return Array.from(grouped.values())
    .filter((v) => v.date)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, limit)
    .map((v) => {
      const pour = v.positions.filter((x) => x === 'pour').length;
      const contre = v.positions.filter((x) => x === 'contre').length;
      const abs = v.positions.filter((x) => x === 'abstention').length;
      const total = pour + contre + abs || 1;
      return {
        ...v,
        pour, contre, abs,
        pourPct: (pour / total) * 100,
        contrePct: (contre / total) * 100,
        absPct: (abs / total) * 100,
        adopted: pour >= contre,
      };
    });
}

function HomeDerniersVotes() {
  const recent = useMemo(() => aggregateRecentVotes(3), []);
  if (recent.length === 0) return null;
  return (
    <section className="px-4 sm:px-6 lg:px-12 pt-14 lg:pt-20">
      <SectionHead
        kicker="EN DIRECT"
        title="Derniers votes"
        right={
          <a href="#chiffres-assemblee" className="font-display font-semibold uppercase tracking-[0.1em] inline-flex items-center gap-2 text-xs hover:text-ink-red transition-colors">
            Toute l'Assemblée <ArrowRight className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
          </a>
        }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ borderBottom: '1.5px solid var(--ink)' }}>
        {recent.map((v, i) => (
          <article
            key={v.law}
            className="p-6 sm:p-8 relative"
            style={{
              borderRight: i < 2 ? '1px solid rgba(128,128,128,0.18)' : 'none',
            }}
          >
            <div className="flex justify-between items-start mb-5">
              <span
                className="font-display font-bold uppercase px-2.5 py-1"
                style={{
                  background: v.adopted ? 'var(--ink-green)' : 'var(--ink-red)',
                  color: '#fff',
                  fontSize: 11,
                  letterSpacing: '0.15em',
                }}
              >
                {v.adopted ? '✓ Adopté' : '✗ Rejeté'}
              </span>
              <span className="text-[11px] text-ink-mute tracking-[0.1em]">{formatDotDate(v.date)}</span>
            </div>
            <h3
              className="font-display font-bold leading-tight"
              style={{ fontSize: 22, letterSpacing: '-0.02em', minHeight: 80 }}
            >
              {v.law}
            </h3>
            {v.summary && (
              <p className="text-sm text-ink-mute leading-relaxed mt-3">{v.summary}</p>
            )}
            <div className="mt-5 flex items-center" style={{ height: 6 }}>
              <div style={{ width: `${v.pourPct}%`, height: '100%', background: 'var(--ink-green)' }} />
              <div style={{ width: `${v.contrePct}%`, height: '100%', background: 'var(--ink-red)' }} />
              <div style={{ width: `${v.absPct}%`, height: '100%', background: 'rgba(128,128,128,0.2)' }} />
            </div>
            <div className="mt-3 flex gap-4 text-[11px] text-ink-mute">
              <span><strong style={{ color: 'var(--ink-green)' }}>{v.pour}</strong> pour</span>
              <span><strong style={{ color: 'var(--ink-red)' }}>{v.contre}</strong> contre</span>
              <span>{v.abs} abs.</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// PROFILE VIEW
// ─────────────────────────────────────────────────────────

function ProfileView({ politician, allPoliticians, onSelectPolitician }) {
  const legalMeta = LEGAL_STATUS_META[politician.legal?.globalStatus] || LEGAL_STATUS_META.clean;
  const isClean = politician.legal?.globalStatus === 'clean';
  const amendmentsWritten = politician.stats?.amendmentsWritten ?? null;
  const votesCount = politician.votes?.items?.length || 0;
  const firstMandate = politician.timeline?.[0]?.year || '—';

  const others = useMemo(() => {
    return allPoliticians.filter((p) => p.id !== politician.id).slice(0, 4);
  }, [allPoliticians, politician.id]);

  return (
    <article className="fade-in">
      {/* BREADCRUMB MASTHEAD */}
      <div className="px-4 sm:px-6 lg:px-12 pt-4">
        <div className="flex items-baseline justify-between gap-4 flex-wrap text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.15em] text-ink-mute">
          <span>
            <a href="#" className="hover:text-ink">Personnalités</a> · {politician.party} · <span className="text-ink">{politician.name}</span>
          </span>
          <span>Mise à jour le {formatDotDate(politician.lastUpdate)}</span>
        </div>
        <hr className="rule rule--thick mt-2" />
      </div>

      {/* HERO PORTRAIT + IDENTITÉ */}
      <section className="px-4 sm:px-6 lg:px-12 pt-6 lg:pt-8">
        <div className="grid lg:grid-cols-[420px_1fr] gap-10 lg:gap-16 items-start relative">
          <div>
            <PhotoFrame politician={politician} ratio="4/5" bordered>
              {(() => {
                const fam = partyFamily(politician.party);
                const fc = FAMILY_COLORS[fam];
                const needsBorder = fam === 'white';
                return (
                  <span
                    className="absolute font-display font-bold tracking-[0.1em] uppercase"
                    style={{
                      left: 16, bottom: 16,
                      fontSize: 11,
                      padding: '5px 12px',
                      background: fc.bg,
                      color: fc.fg,
                      border: needsBorder ? `1px solid ${fc.border}` : 'none',
                      borderRadius: 999,
                    }}
                  >
                    {politician.party}
                  </span>
                );
              })()}
            </PhotoFrame>
            <div className="flex justify-between items-center mt-3 px-1 text-[10px] tracking-[0.1em] uppercase text-ink-mute">
              <span>Photo · {politician.votes?.instance || 'Public'}</span>
              <span>N&B éditorial</span>
            </div>
          </div>

          <div className="relative">
            <div className="text-[11px] tracking-[0.15em] uppercase text-ink-mute mb-4">
              <span
                className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                style={{ background: isClean ? 'var(--ink-green)' : 'var(--ink-red)' }}
              />
              Actualisé · {formatFrenchDate(politician.lastUpdate)}
            </div>
            <h1
              className="font-display font-extrabold text-ink"
              style={{ fontSize: 'clamp(56px, 9vw, 128px)', letterSpacing: '-0.05em', lineHeight: 0.85 }}
            >
              {politician.name.split(' ').slice(0, -1).join(' ')}<br />
              <em style={{ fontStyle: 'italic', fontWeight: 400 }}>
                {politician.name.split(' ').slice(-1)[0]}<span style={{ color: 'var(--ink-red)' }}>.</span>
              </em>
            </h1>
            <p className="text-lg sm:text-xl mt-8 max-w-2xl leading-snug text-ink">
              {politician.bio}
            </p>

            {/* Stats clés en ligne */}
            <div
              className="mt-8 grid grid-cols-2 sm:grid-cols-4"
              style={{ borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)', padding: '20px 0' }}
            >
              <ProfileStatBlock label="1er mandat" value={firstMandate} />
              {amendmentsWritten !== null && (
                <ProfileStatBlock
                  label="amendements"
                  value={amendmentsWritten.toLocaleString('fr-FR')}
                  color="red"
                />
              )}
              {votesCount > 0 && <ProfileStatBlock label="votes suivis" value={votesCount} />}
              <ProfileStatBlock
                label={legalMeta.label}
                value={isClean ? '✓' : '!'}
                color={isClean ? 'green' : 'red'}
              />
            </div>

            <div className="flex gap-3 mt-6 flex-wrap">
              <a href="#programme" className="btn btn--solid">Dossier complet →</a>
              <a href="#quiz" className="btn">Comparer</a>
            </div>

            <div
              className="hand pointer-events-none hidden lg:block"
              style={{
                position: 'absolute', top: 32, right: -8,
                color: 'var(--ink-red)', fontSize: 26,
                transform: 'rotate(6deg)', lineHeight: 1.1,
              }}
            >
              fiche en cours →
            </div>
          </div>
        </div>

        {/* Sommaire ancré */}
        <div
          className="mt-12 py-4 flex flex-wrap items-center gap-6"
          style={{ borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)' }}
        >
          <span className="text-[11px] tracking-[0.2em] uppercase font-semibold">Sommaire</span>
          {[
            ['01', 'Programme', '#programme'],
            ['02', 'Votes & positions', '#votes'],
            ['03', 'Justice & légalité', '#justice'],
            ['04', 'Parcours', '#parcours'],
            ['05', 'Financement', '#financement'],
          ].map(([n, t, href]) => (
            <a key={n} href={href} className="flex items-baseline gap-2 hover:text-ink-red transition-colors">
              <span className="font-display font-bold text-[11px]" style={{ color: 'var(--ink-red)' }}>§ {n}</span>
              <span className="font-display font-medium text-[13px]">{t}</span>
            </a>
          ))}
          <span className="ml-auto text-xs text-ink-mute">≈ 6 min de lecture</span>
        </div>
      </section>

      <ProfileProgramme politician={politician} />
      <ProfileVotes politician={politician} />
      <ProfileJustice politician={politician} legalMeta={legalMeta} />
      <ProfileParcours politician={politician} />
      <ProfileFinancement politician={politician} />
      <ProfileOthers others={others} onSelect={onSelectPolitician} />
    </article>
  );
}

function ProfileStatBlock({ label, value, color }) {
  const colorVar = color === 'red' ? 'var(--ink-red)' : color === 'green' ? 'var(--ink-green)' : 'var(--ink)';
  return (
    <div>
      <div className="numeral font-extrabold" style={{ fontSize: 36, color: colorVar }}>
        {value}
      </div>
      <div className="text-[11px] tracking-[0.1em] uppercase text-ink-mute mt-1">{label}</div>
    </div>
  );
}

function ProfileProgramme({ politician }) {
  if (!politician.program || politician.program.length === 0) return null;
  return (
    <section id="programme" className="px-4 sm:px-6 lg:px-12 pt-16 lg:pt-24">
      <div className="flex items-baseline gap-5 flex-wrap">
        <Eyebrow>§ 01</Eyebrow>
        <h2 className="font-display font-extrabold text-ink" style={{ fontSize: 'clamp(40px, 6vw, 80px)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          Le programme
        </h2>
      </div>
      <p className="text-base sm:text-lg text-ink-mute mt-3 max-w-3xl">
        Les positions affichées par la personnalité dans ses prises de parole publiques et ses propositions législatives. Synthèse, sans interprétation.
      </p>
      <hr className="rule rule--thick mt-6" />

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        style={{ borderBottom: '1.5px solid var(--ink)' }}
      >
        {politician.program.map((p, i) => (
          <div
            key={p.category}
            className="p-6 sm:p-8"
            style={{
              borderRight: (i + 1) % 3 !== 0 ? '1px solid rgba(128,128,128,0.18)' : 'none',
              borderTop: i >= 3 ? '1px solid rgba(128,128,128,0.18)' : 'none',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                className="inline-flex items-center justify-center font-display font-extrabold"
                style={{
                  width: 28, height: 28,
                  background: 'var(--ink)', color: 'var(--paper)',
                  fontSize: 13,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display font-bold uppercase tracking-[0.05em]" style={{ fontSize: 17 }}>
                {p.category}
              </h3>
            </div>
            <ul className="flex flex-col gap-3">
              {p.points.map((pt, j) => (
                <li key={j} className="flex gap-3 text-sm leading-relaxed">
                  <span className="font-display font-bold shrink-0" style={{ color: 'var(--ink-red)' }}>—</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfileVotes({ politician }) {
  const [showAll, setShowAll] = useState(false);
  const votes = politician.votes;
  if (!votes || !votes.items || votes.items.length === 0) return null;
  const items = showAll ? votes.items : votes.items.slice(0, 4);

  return (
    <section id="votes" className="px-4 sm:px-6 lg:px-12 pt-16 lg:pt-24">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-5 flex-wrap">
          <Eyebrow>§ 02</Eyebrow>
          <h2 className="font-display font-extrabold text-ink" style={{ fontSize: 'clamp(40px, 6vw, 80px)', letterSpacing: '-0.04em', lineHeight: 1 }}>
            Votes & positions
          </h2>
        </div>
        {votes.instance && <span className="tag tag--blue">{votes.instance}</span>}
      </div>
      <hr className="rule rule--thick mt-6" />

      <div>
        {items.map((item, idx) => {
          const isPour = item.position === 'pour';
          const isContre = item.position === 'contre';
          const isAbs = item.position === 'abstention';
          let bg = 'var(--ink)';
          let symbol = '·';
          let label = 'ABS.';
          if (isPour) { bg = 'var(--ink-green)'; symbol = '✓'; label = 'POUR'; }
          else if (isContre) { bg = 'var(--ink-red)'; symbol = '✗'; label = 'CONTRE'; }
          else if (isAbs) { bg = 'var(--ink-mute)'; symbol = '—'; label = 'ABS.'; }
          else { bg = '#888'; symbol = '·'; label = 'ABSENT'; }

          return (
            <div
              key={idx}
              className="grid grid-cols-[90px_1fr] sm:grid-cols-[120px_1fr_120px] gap-4 sm:gap-8 py-6 items-center"
              style={{ borderBottom: '1px solid rgba(128,128,128,0.18)' }}
            >
              <div>
                <div className="font-display font-bold text-[13px] tracking-[0.05em]">{formatDotDate(item.date)}</div>
                {votes.instance && (
                  <div className="text-[10px] text-ink-mute tracking-[0.05em] uppercase mt-1">{votes.instance}</div>
                )}
              </div>
              <div>
                <h3 className="font-display font-bold leading-snug" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>
                  {item.law}
                </h3>
                {item.summary && (
                  <p className="text-sm text-ink-mute mt-2 leading-relaxed max-w-3xl">{item.summary}</p>
                )}
                {item.sources && item.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.sources.map((s, i) => <SourceLink key={i} source={s} />)}
                  </div>
                )}
              </div>
              <div
                className="hidden sm:flex flex-col items-center justify-center text-paper"
                style={{ width: 120, height: 120, background: bg }}
              >
                <div style={{ fontSize: 32, lineHeight: 1 }}>{symbol}</div>
                <div className="font-display font-extrabold mt-1" style={{ fontSize: 18, letterSpacing: '0.1em' }}>{label}</div>
              </div>
              <div className="sm:hidden col-span-2">
                <span
                  className="inline-block font-display font-bold uppercase px-3 py-1"
                  style={{ background: bg, color: '#fff', fontSize: 11, letterSpacing: '0.15em' }}
                >
                  {symbol} {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {votes.items.length > 4 && (
        <button onClick={() => setShowAll(!showAll)} className="btn mt-6">
          {showAll ? 'Voir moins' : `Voir tous les votes (${votes.items.length})`}
        </button>
      )}
    </section>
  );
}

function ProfileJustice({ politician, legalMeta }) {
  const isClean = politician.legal?.globalStatus === 'clean';
  const Icon = legalMeta.icon;
  const accentColor = isClean ? 'var(--ink-green)' : 'var(--ink-red)';

  return (
    <section id="justice" className="px-4 sm:px-6 lg:px-12 pt-16 lg:pt-24">
      <div className="flex items-baseline gap-5 flex-wrap">
        <Eyebrow>§ 03</Eyebrow>
        <h2 className="font-display font-extrabold text-ink" style={{ fontSize: 'clamp(40px, 6vw, 80px)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          Justice & légalité
        </h2>
      </div>
      <hr className="rule rule--thick mt-6" />

      <div
        className="mt-8 relative p-8 sm:p-12"
        style={{ background: 'var(--ink-cream)', border: '1.5px solid var(--ink)' }}
      >
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span
            className="inline-flex items-center gap-2 font-display font-bold uppercase px-3 py-1.5"
            style={{ background: accentColor, color: '#fff', fontSize: 12, letterSpacing: '0.15em' }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
            {isClean ? '✓ ' : '✗ '}{legalMeta.label}
          </span>
          <h3 className="font-display font-bold text-xl sm:text-2xl" style={{ letterSpacing: '-0.02em' }}>
            {politician.legal.status}
          </h3>
        </div>

        <ul className="flex flex-col gap-4">
          {politician.legal.details.map((d, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0" style={{ width: 3, background: accentColor }} />
              <span className="text-base sm:text-lg leading-snug font-medium">{d}</span>
            </li>
          ))}
        </ul>

        {politician.legal.sources && politician.legal.sources.length > 0 && (
          <div
            className="mt-7 pt-5 flex flex-wrap justify-between items-center gap-3"
            style={{ borderTop: '1px solid rgba(0,0,0,0.15)' }}
          >
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-ink-mute text-[10px] tracking-[0.1em] uppercase font-semibold">Sources :</span>
              {politician.legal.sources.map((s, i) => <SourceLink key={i} source={s} />)}
            </div>
            <span className="text-xs italic text-ink-mute">
              Présomption d'innocence respectée · <a href="#mentions-legales" className="underline text-ink">Droit de réponse</a>
            </span>
          </div>
        )}

        <div
          className="hand pointer-events-none absolute"
          style={{
            top: -16, right: 28,
            color: accentColor, fontSize: 24,
            transform: 'rotate(-3deg)',
            background: 'var(--ink-cream)',
            padding: '0 8px',
          }}
        >
          {isClean ? 'casier vide ✓' : 'à surveiller !'}
        </div>
      </div>
    </section>
  );
}

function ProfileParcours({ politician }) {
  if (!politician.timeline || politician.timeline.length === 0) return null;
  const last = politician.timeline.length - 1;
  return (
    <section id="parcours" className="px-4 sm:px-6 lg:px-12 pt-16 lg:pt-24">
      <div className="flex items-baseline gap-5 flex-wrap">
        <Eyebrow>§ 04</Eyebrow>
        <h2 className="font-display font-extrabold text-ink" style={{ fontSize: 'clamp(40px, 6vw, 80px)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          Parcours
        </h2>
      </div>
      <hr className="rule rule--thick mt-6" />

      <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[140px_1fr] mt-8">
        {politician.timeline.map((p, i) => {
          const isLast = i === last;
          return (
            <Fragment key={i}>
              <div
                className="font-display font-extrabold relative pt-4 pb-8"
                style={{
                  fontSize: 'clamp(32px, 5vw, 56px)',
                  letterSpacing: '-0.04em',
                  color: isLast ? 'var(--ink-red)' : 'var(--ink)',
                  borderRight: '1.5px solid var(--ink)',
                }}
              >
                {p.year}
                <span
                  className="absolute"
                  style={{
                    right: -8, top: 36,
                    width: 14, height: 14, borderRadius: '50%',
                    background: isLast ? 'var(--ink-red)' : 'var(--ink)',
                  }}
                />
              </div>
              <div className="pl-6 sm:pl-8 pt-4 pb-8">
                <h3 className="font-display font-bold" style={{ fontSize: 'clamp(20px, 2.5vw, 26px)', letterSpacing: '-0.02em' }}>
                  {p.title}
                </h3>
                {p.description && (
                  <p className="text-sm sm:text-base text-ink-mute mt-2 max-w-2xl leading-relaxed">{p.description}</p>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}

function ProfileFinancement({ politician }) {
  const partyName = partyShort(politician.party);
  const partyFinance = useMemo(() => {
    const all = [
      ...financesData.surplus.map((e) => ({ ...e, kind: 'surplus' })),
      ...financesData.deficit.map((e) => ({ ...e, kind: 'deficit' })),
    ];
    return all.find((f) => f.name.toLowerCase().includes(partyName.toLowerCase()))
        || all.find((f) => partyName.toLowerCase().includes(f.name.toLowerCase().split(/[ /]/)[0]));
  }, [partyName]);

  return (
    <section id="financement" className="px-4 sm:px-6 lg:px-12 pt-16 lg:pt-24">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-5 flex-wrap">
          <Eyebrow>§ 05</Eyebrow>
          <h2 className="font-display font-extrabold text-ink" style={{ fontSize: 'clamp(40px, 6vw, 80px)', letterSpacing: '-0.04em', lineHeight: 1 }}>
            Financement
          </h2>
        </div>
        <span className="tag tag--blue">Données {financesData.source.name} · {financesData.year}</span>
      </div>
      <hr className="rule rule--thick mt-6" />

      <div className="grid sm:grid-cols-2 gap-8 lg:gap-12 mt-8">
        <div>
          <div className="text-xs uppercase tracking-[0.1em] text-ink-mute mb-3">
            Parti d'attache · {politician.party}
          </div>
          {partyFinance ? (
            <>
              <div
                className="numeral font-extrabold"
                style={{
                  fontSize: 'clamp(56px, 8vw, 88px)',
                  letterSpacing: '-0.04em',
                  color: partyFinance.amount >= 0 ? 'var(--ink-green)' : 'var(--ink-red)',
                }}
              >
                {partyFinance.amount >= 0 ? '+' : '−'}{formatMillions(partyFinance.amount)}
              </div>
              <div className="text-sm text-ink-mute mt-2">
                {partyFinance.amount >= 0 ? 'Excédent' : 'Déficit'} comptable du parti pour l'exercice {financesData.year}.
              </div>
            </>
          ) : (
            <div className="text-base text-ink-mute italic">Données non disponibles pour ce parti.</div>
          )}
          <a href="#chiffres-assemblee" className="btn btn--sm mt-6">Voir tous les comptes →</a>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.1em] text-ink-mute mb-3">Déclaration HATVP</div>
          <ul className="flex flex-col">
            {[
              ['Patrimoine déclaré', '— public'],
              ['Intérêts privés', 'Voir HATVP'],
              ['Activités annexes', 'Voir HATVP'],
              ['Dons reçus (2024)', '—'],
            ].map(([k, v]) => (
              <li
                key={k}
                className="flex justify-between py-3 text-sm"
                style={{ borderBottom: '1px solid rgba(128,128,128,0.18)' }}
              >
                <span className="text-ink-mute">{k}</span>
                <strong className="font-display">{v}</strong>
              </li>
            ))}
          </ul>
          <a
            href="https://www.hatvp.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-[0.1em] font-semibold inline-flex items-center gap-1.5 mt-4 hover:text-ink-blue transition-colors"
            style={{ color: 'var(--ink-blue)' }}
          >
            Consulter sur HATVP <ExternalLink className="h-3 w-3" strokeWidth={ICON_STROKE} />
          </a>
        </div>
      </div>
    </section>
  );
}

function ProfileOthers({ others, onSelect }) {
  return (
    <section
      className="mt-20 lg:mt-32 px-4 sm:px-6 lg:px-12 py-12 lg:py-16"
      style={{ background: 'var(--ink)', color: 'var(--paper)' }}
    >
      <div className="flex items-baseline justify-between flex-wrap gap-4">
        <h2 className="font-display font-extrabold" style={{ fontSize: 'clamp(40px, 6vw, 56px)', letterSpacing: '-0.04em' }}>
          D'autres fiches
        </h2>
        <a href="#" className="font-display font-semibold uppercase tracking-[0.1em] text-xs inline-flex items-center gap-2">
          Toutes les {politiciansData.length} fiches <ArrowRight className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
        </a>
      </div>
      <hr className="rule rule--thick mt-4" style={{ borderTopColor: 'var(--paper)' }} />

      <div className="grid grid-cols-2 lg:grid-cols-4 mt-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        {others.map((p, i) => (
          <PortraitTile
            key={p.id}
            politician={p}
            onSelect={onSelect}
            isLastCol={(i + 1) % 4 === 0}
            isFirstRow
            dark
          />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// CHIFFRES ASSEMBLÉE
// ─────────────────────────────────────────────────────────

function ChiffresAssemblee({ onSelectPolitician }) {
  const surplus = financesData.surplus;
  const deficit = financesData.deficit;
  const maxSurplus = Math.max(...surplus.map((e) => Math.abs(e.amount)));
  const maxDeficit = Math.max(...deficit.map((e) => Math.abs(e.amount)));

  const aggregatedVotes = useMemo(() => {
    const grouped = new Map();
    politiciansData.forEach((p) => {
      (p.votes?.items || []).forEach((v) => {
        if (!grouped.has(v.law)) {
          grouped.set(v.law, {
            law: v.law,
            date: v.date,
            summary: v.summary,
            instance: p.votes.instance,
            byPosition: { pour: [], contre: [], abstention: [], absent: [] },
          });
        }
        const bucket = grouped.get(v.law).byPosition[v.position];
        if (bucket) bucket.push(p);
      });
    });
    return Array.from(grouped.values())
      .filter((v) => v.date)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .map((v) => {
        const pour = v.byPosition.pour.length;
        const contre = v.byPosition.contre.length;
        const abs = v.byPosition.abstention.length;
        const total = pour + contre + abs || 1;
        return {
          ...v,
          pour, contre, abs,
          pourPct: (pour / total) * 100,
          contrePct: (contre / total) * 100,
          absPct: (abs / total) * 100,
          adopted: pour >= contre,
        };
      });
  }, []);

  const stats = useMemo(() => {
    const allVotes = politiciansData.flatMap((p) => p.votes?.items || []);
    const uniqueLaws = new Set(allVotes.map((v) => v.law)).size;
    const uniqueDates = new Set(allVotes.map((v) => v.date)).size;
    const uniqueParties = new Set(politiciansData.map((p) => partyShort(p.party))).size;
    const adopted = aggregatedVotes.filter((v) => v.adopted).length;
    const rate = aggregatedVotes.length > 0 ? Math.round((adopted / aggregatedVotes.length) * 100) : 0;
    return [
      [uniqueLaws.toLocaleString('fr-FR'), 'votes', 'suivis', false],
      [uniqueDates.toLocaleString('fr-FR'), 'sessions', 'plénières couvertes', false],
      [uniqueParties.toString(), 'partis', 'analysés', false],
      [`↗ ${rate} %`, 'taux', "d'adoption moyen", true],
    ];
  }, [aggregatedVotes]);

  const [voteFilter, setVoteFilter] = useState('all');
  const [expandedKey, setExpandedKey] = useState(null);
  const filteredVotes = useMemo(() => {
    if (voteFilter === 'all') return aggregatedVotes.slice(0, 8);
    return aggregatedVotes
      .filter((v) => (v.instance || '').toLowerCase().includes(voteFilter))
      .slice(0, 8);
  }, [aggregatedVotes, voteFilter]);

  return (
    <div className="fade-in">
      {/* HERO */}
      <section className="px-4 sm:px-6 lg:px-12 pt-10 lg:pt-12">
        <div className="hand mb-4" style={{ color: 'var(--ink-blue)', fontSize: 30, transform: 'rotate(-2deg)' }}>
          qui vote quoi, qui finance qui. ↓
        </div>
        <h1
          className="font-display font-extrabold text-ink"
          style={{ fontSize: 'clamp(56px, 10vw, 144px)', letterSpacing: '-0.055em', lineHeight: 0.86 }}
        >
          L'<em style={{ fontStyle: 'italic', fontWeight: 400 }}>Assemblée</em><br />
          sans <span className="marker">filtre</span><span style={{ color: 'var(--ink-red)' }}>.</span>
        </h1>
        <p className="text-lg sm:text-xl mt-8 max-w-3xl leading-snug text-ink">
          Chaque vote européen et national, expliqué en deux phrases. Les finances des partis. <span className="text-ink-mute">Mis à jour quotidiennement.</span>
        </p>

        {/* Stats noir */}
        <div
          className="mt-12 grid grid-cols-2 lg:grid-cols-4"
          style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '32px 24px sm:px-10' }}
        >
          {stats.map(([n, label, sub, highlight], i) => (
            <div
              key={label}
              className="px-4 sm:px-6 py-4"
              style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}
            >
              <div
                className="numeral font-extrabold"
                style={{
                  fontSize: 'clamp(36px, 5vw, 64px)',
                  letterSpacing: '-0.04em',
                  color: highlight ? 'var(--ink-yellow)' : 'var(--paper)',
                }}
              >
                {n}
              </div>
              <div className="font-display font-bold mt-1" style={{ fontSize: 16 }}>{label}</div>
              <div className="text-xs mt-1" style={{ opacity: 0.6 }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* § 01 DERNIERS VOTES TABLE */}
      <section className="px-4 sm:px-6 lg:px-12 pt-16 lg:pt-24">
        <SectionHead
          kicker="01"
          title="Derniers votes"
          right={
            <div className="flex gap-2 flex-wrap">
              {[['all', 'Tous'], ['européen', 'Parl. EU'], ['nationale', 'AN'], ['sénat', 'Sénat']].map(([k, label]) => (
                <button
                  key={k}
                  className="btn btn--sm"
                  style={voteFilter === k ? { background: 'var(--ink)', color: 'var(--paper)' } : {}}
                  onClick={() => setVoteFilter(k)}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: 14, minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--ink)' }}>
                <th className="text-left py-3 text-[11px] tracking-[0.15em] uppercase font-semibold" style={{ width: 120 }}>Date</th>
                <th className="text-left py-3 px-4 text-[11px] tracking-[0.15em] uppercase font-semibold">Objet du vote</th>
                <th className="text-left py-3 px-4 text-[11px] tracking-[0.15em] uppercase font-semibold" style={{ width: 220 }}>Répartition</th>
                <th className="text-left py-3 px-4 text-[11px] tracking-[0.15em] uppercase font-semibold" style={{ width: 140 }}>Résultat</th>
                <th className="py-3" style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredVotes.map((v) => {
                const isOpen = expandedKey === v.law;
                return (
                  <Fragment key={v.law}>
                    <tr
                      onClick={() => setExpandedKey(isOpen ? null : v.law)}
                      style={{
                        borderBottom: isOpen ? '1px solid rgba(128,128,128,0.18)' : '1px solid rgba(128,128,128,0.18)',
                        cursor: 'pointer',
                        background: isOpen ? 'var(--ink-cream)' : 'transparent',
                      }}
                      className="hover:bg-paper-2 transition-colors"
                    >
                      <td className="py-5 align-top">
                        <div className="font-display font-bold text-[13px]">{formatDotDate(v.date)}</div>
                        <div className="text-[10px] text-ink-mute tracking-[0.05em] mt-1 uppercase">{v.instance || '—'}</div>
                      </td>
                      <td className="py-5 px-4 align-top">
                        <div className="font-display font-bold leading-snug" style={{ fontSize: 17, letterSpacing: '-0.01em' }}>{v.law}</div>
                        {v.summary && (
                          <div className="text-xs text-ink-mute mt-1 max-w-xl leading-relaxed">{v.summary}</div>
                        )}
                      </td>
                      <td className="py-5 px-4 align-top">
                        <div className="flex" style={{ height: 8 }}>
                          <div style={{ width: `${v.pourPct}%`, background: 'var(--ink)' }} />
                          <div style={{ width: `${v.contrePct}%`, background: 'var(--ink-red)' }} />
                          <div style={{ width: `${v.absPct}%`, background: 'rgba(128,128,128,0.35)' }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-ink-mute mt-1.5 tracking-[0.05em]">
                          <span><strong className="text-ink">{v.pour}</strong> P.</span>
                          <span><strong style={{ color: 'var(--ink-red)' }}>{v.contre}</strong> C.</span>
                          <span>{v.abs} A.</span>
                        </div>
                      </td>
                      <td className="py-5 px-4 align-top">
                        <span
                          className="inline-flex font-display font-bold uppercase items-center"
                          style={{
                            background: v.adopted ? 'var(--ink)' : 'var(--ink-red)',
                            color: '#fff',
                            fontSize: 11,
                            letterSpacing: '0.1em',
                            padding: '5px 11px',
                          }}
                        >
                          {v.adopted ? '✓ Adopté' : '✗ Rejeté'}
                        </span>
                      </td>
                      <td className="py-5 px-2 align-top text-ink-mute">
                        <ChevronDown
                          className="h-4 w-4 transition-transform"
                          strokeWidth={ICON_STROKE}
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr style={{ borderBottom: '1px solid rgba(128,128,128,0.18)', background: 'var(--ink-cream)' }}>
                        <td colSpan={5} className="py-6 px-4">
                          <VoteBreakdown vote={v} onSelectPolitician={onSelectPolitician} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filteredVotes.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-ink-mute italic">
                    Aucun vote correspondant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* § 02 FINANCES */}
      <section className="px-4 sm:px-6 lg:px-12 pt-16 lg:pt-24">
        <SectionHead
          kicker="02"
          title="Finances des partis"
          right={<span className="tag tag--blue">{financesData.source.name} · {financesData.year}</span>}
          subtitle="Qui termine l'année dans le vert, qui plonge dans le rouge."
        />

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          <FinanceColumn
            label="Excédentaires"
            count={surplus.length}
            color="green"
            entries={surplus}
            max={maxSurplus}
          />
          <FinanceColumn
            label="Déficitaires"
            count={deficit.length}
            color="red"
            entries={deficit}
            max={maxDeficit}
          />
        </div>
      </section>

      {/* § 03 COMPOSITION */}
      <section className="px-4 sm:px-6 lg:px-12 pt-16 lg:pt-24">
        <SectionHead
          kicker="03"
          title="Composition"
          subtitle="Assemblée nationale · 577 sièges · Législature en cours."
        />
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-16">
          <div>
            <Hemicycle />
            <div className="hand text-center mt-3" style={{ color: 'var(--ink-red)', fontSize: 22, transform: 'rotate(-1deg)' }}>
              ↑ 577 sièges, vue de dessus
            </div>
          </div>
          <div>
            {COMPOSITION_GROUPS.map((c, i) => (
              <div
                key={c.group}
                className="py-3.5"
                style={{
                  borderTop: i === 0 ? '1.5px solid var(--ink)' : '1px solid rgba(128,128,128,0.18)',
                  borderBottom: i === COMPOSITION_GROUPS.length - 1 ? '1.5px solid var(--ink)' : 'none',
                }}
              >
                <div className="grid grid-cols-[20px_1fr_60px_60px] gap-4 items-center">
                  <span
                    className="block w-3.5 h-3.5 rounded-full"
                    style={{
                      background: c.color,
                      border: c.color === '#ffffff' ? '1px solid var(--ink)' : 'none',
                    }}
                  />
                  <div>
                    <div className="text-sm font-semibold">{c.group}</div>
                    <div className="text-[11px] text-ink-mute">{c.parties}</div>
                  </div>
                  <div className="numeral font-bold text-right" style={{ fontSize: 20 }}>{c.seats}</div>
                  <div className="text-[11px] text-ink-mute text-right">{(c.seats / 577 * 100).toFixed(1)} %</div>
                </div>
              </div>
            ))}
            <div className="hand mt-5 text-ink-mute" style={{ fontSize: 20 }}>
              total : 577 sièges · majorité absolue à 289
            </div>
          </div>
        </div>
      </section>

      {/* PROCÉDURES */}
      <ProceduresGrid onSelectPolitician={onSelectPolitician} />
    </div>
  );
}

function VoteBreakdown({ vote, onSelectPolitician }) {
  const cols = [
    { key: 'pour', label: '✓ POUR', list: vote.byPosition.pour, color: 'var(--ink)', textColor: 'var(--paper)' },
    { key: 'contre', label: '✗ CONTRE', list: vote.byPosition.contre, color: 'var(--ink-red)', textColor: 'var(--paper)' },
    { key: 'abstention', label: '— ABSTENTION', list: vote.byPosition.abstention, color: 'rgba(128,128,128,0.25)', textColor: 'var(--ink)' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {cols.map((c) => (
        <div key={c.key}>
          <div
            className="font-display font-bold uppercase mb-3 px-2 py-1.5 inline-block"
            style={{
              background: c.color,
              color: c.textColor,
              fontSize: 11,
              letterSpacing: '0.15em',
            }}
          >
            {c.label} <span style={{ opacity: 0.7 }}>· {c.list.length}</span>
          </div>
          {c.list.length === 0 ? (
            <div className="text-xs text-ink-mute italic">Aucun</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {c.list.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPolitician(p.id);
                    }}
                    className="w-full flex items-center gap-3 text-left p-1.5 hover:bg-paper transition-colors"
                    style={{ border: '1px solid transparent' }}
                  >
                    <div
                      className="photo-wrap shrink-0"
                      style={{ width: 32, height: 40 }}
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        className="photo"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0a0a0a&color=ffffff&size=80&bold=true`;
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-semibold text-[13px] leading-tight truncate">{p.name}</div>
                      <div className="text-[10px] text-ink-mute tracking-[0.05em] uppercase truncate">
                        {partyShort(p.party)}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function FinanceColumn({ label, count, color, entries, max }) {
  const colorVar = color === 'green' ? 'var(--ink-green)' : 'var(--ink-red)';
  const sign = color === 'green' ? '+' : '−';
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="block w-4 h-4" style={{ background: colorVar }} />
        <h3 className="font-display font-bold" style={{ fontSize: 24, letterSpacing: '-0.02em' }}>
          {label} <span className="text-ink-mute font-normal">({count})</span>
        </h3>
      </div>
      {entries.map((f) => {
        const pct = (Math.abs(f.amount) / max) * 100;
        return (
          <div key={f.name} className="py-3.5" style={{ borderBottom: '1px solid rgba(128,128,128,0.18)' }}>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-sm font-semibold">{f.name}</span>
              <span className="numeral font-bold" style={{ fontSize: 20, color: colorVar }}>
                {sign}{formatMillions(f.amount)}
              </span>
            </div>
            <div className="relative" style={{ height: 4, background: 'rgba(128,128,128,0.15)' }}>
              <div className="absolute top-0 left-0 bottom-0" style={{ width: `${pct}%`, background: colorVar }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProceduresGrid({ onSelectPolitician }) {
  const flagged = politiciansData.filter((p) =>
    ['convicted', 'indicted', 'investigation'].includes(p.legal?.globalStatus),
  );
  if (flagged.length === 0) return null;
  return (
    <section className="px-4 sm:px-6 lg:px-12 pt-16 lg:pt-24">
      <SectionHead
        kicker="04"
        title="Procédures judiciaires"
        count={`${flagged.length} fiches`}
        subtitle="Présomption d'innocence respectée. Statut au moment de la dernière mise à jour."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ borderBottom: '1.5px solid var(--ink)' }}>
        {flagged.map((p, i) => (
          <PortraitTile
            key={p.id}
            politician={p}
            onSelect={onSelectPolitician}
            isLastCol={(i + 1) % 3 === 0}
            isFirstRow={i < 3}
            badgeColor="red"
          />
        ))}
      </div>
    </section>
  );
}

const COMPOSITION_GROUPS = [
  { group: 'NUPES / NFP', parties: 'LFI · PS · EELV · PCF', seats: 207, color: '#d6321f' },
  { group: 'Ensemble', parties: 'Renaissance · MoDem · Horizons', seats: 182, color: '#ffffff' },
  { group: 'Rassemblement National', parties: 'RN · alliés', seats: 89, color: '#1d4ed8' },
  { group: 'Les Républicains', parties: 'LR · DVD', seats: 47, color: '#1d4ed8' },
  { group: 'LIOT', parties: 'Indépendants', seats: 32, color: '#ffffff' },
  { group: 'Non-inscrits', parties: 'Divers', seats: 20, color: '#0a0a0a' },
];

function Hemicycle() {
  // Couleurs par famille politique :
  // gauche (LFI/PCF/EELV/PS) en rouge (EELV en vert),
  // centre (MoDem/Renaissance/Horizons) en blanc/ivoire,
  // droite (LR) et RN en bleu, divers en noir.
  const groups = [
    { color: '#a52020', count: 75 },  // LFI
    { color: '#d6321f', count: 31 },  // PCF
    { color: '#1a7a4e', count: 35 },  // EELV (vert)
    { color: '#e89090', count: 66 },  // PS (rouge clair)
    { color: '#ffffff', count: 36 },  // MoDem (centre = blanc)
    { color: '#faf7f0', count: 99 },  // Renaissance (centre = ivoire)
    { color: '#e8e2c2', count: 47 },  // Horizons (centre)
    { color: '#5a6f8c', count: 47 },  // LR (bleu-gris droite)
    { color: '#1d4ed8', count: 89 },  // RN (bleu)
    { color: '#0a0a0a', count: 52 },  // Non-inscrits / divers
  ];
  const rows = 8;
  const points = [];
  let groupIdx = 0;
  let inGroup = 0;
  for (let r = 0; r < rows; r++) {
    const radius = 80 + r * 22;
    const seatCount = Math.floor(577 / rows) + (r < 577 % rows ? 1 : 0);
    for (let s = 0; s < seatCount; s++) {
      const t = seatCount > 1 ? s / (seatCount - 1) : 0.5;
      const angle = Math.PI - t * Math.PI;
      const cx = 220 + radius * Math.cos(angle);
      const cy = 220 - radius * Math.sin(angle);
      while (groupIdx < groups.length - 1 && inGroup >= groups[groupIdx].count) {
        groupIdx++;
        inGroup = 0;
      }
      points.push({ cx, cy, color: groups[Math.min(groupIdx, groups.length - 1)].color });
      inGroup++;
    }
  }
  return (
    <svg viewBox="0 0 440 240" style={{ width: '100%', display: 'block' }}>
      {points.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r="4" fill={p.color} stroke="#0a0a0a" strokeWidth="0.5" />
      ))}
      <line x1="40" y1="220" x2="400" y2="220" stroke="#0a0a0a" strokeWidth="1.5" />
      <text
        x="220" y="235" textAnchor="middle"
        fontFamily="var(--font-display)" fontSize="11"
        letterSpacing="2" fill="#0a0a0a"
      >
        — PERCHOIR —
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// QUIZ
// ─────────────────────────────────────────────────────────

function calculateQuizResults(answers, importance) {
  const results = quizData.parties.map((party) => {
    let totalDistance = 0;
    let totalWeight = 0;
    quizData.questions.forEach((q) => {
      const userVal = answers[q.id];
      if (userVal === undefined) return;
      const w = IMPORTANCE_WEIGHTS[importance[q.id] ?? 2];
      const partyVal = q.positions[party.id] ?? 0;
      totalDistance += Math.abs(userVal - partyVal) * w;
      totalWeight += w;
    });
    const maxDistance = totalWeight * 4;
    const match = maxDistance > 0 ? 100 - (totalDistance / maxDistance) * 100 : 0;
    return { party, match: Math.round(match) };
  });
  return results.sort((a, b) => b.match - a.match);
}

function QuizIntro({ onStart, hasInProgress, onResume }) {
  return (
    <div className="fade-in px-4 sm:px-6 lg:px-12 pt-8 lg:pt-10 max-w-6xl mx-auto">
      <div className="relative">
        <div className="hand mb-4" style={{ color: 'var(--ink-red)', fontSize: 30, transform: 'rotate(-2deg)' }}>
          sans compte. sans email. ↓
        </div>
        <h1
          className="font-display font-extrabold text-ink"
          style={{ fontSize: 'clamp(56px, 11vw, 160px)', letterSpacing: '-0.055em', lineHeight: 0.85 }}
        >
          Vous votez<br />comme<br />
          <em style={{ fontStyle: 'italic', fontWeight: 400 }}>qui</em><span style={{ color: 'var(--ink-red)' }}>?</span>
        </h1>
      </div>

      <div
        className="grid sm:grid-cols-2 gap-10 lg:gap-16 mt-16 pt-8"
        style={{ borderTop: '1.5px solid var(--ink)' }}
      >
        <div>
          <h2 className="font-display font-bold mb-4" style={{ fontSize: 24, letterSpacing: '-0.02em' }}>Comment ça marche</h2>
          <ol className="flex flex-col gap-5">
            {[
              [`Vous répondez à ${quizData.questions.length} questions sur des sujets de société réels — climat, fiscalité, droit du travail, sécurité, Europe…`],
              ["Chaque question est tirée d'un vote réel du Parlement européen ou de l'Assemblée nationale."],
              ["À la fin : un classement chiffré des personnalités dont vous êtes le plus proche, sourcé sur leurs votes."],
            ].map(([t], i) => (
              <li key={i} className="flex gap-4">
                <span
                  className="font-display font-extrabold shrink-0"
                  style={{ fontSize: 22, color: 'var(--ink-blue)', minWidth: 36 }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-base leading-relaxed">{t}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="font-display font-bold mb-4" style={{ fontSize: 24, letterSpacing: '-0.02em' }}>Ce que vous obtiendrez</h2>
          <div
            className="p-6 sm:p-7 relative"
            style={{ background: 'var(--ink-cream)', border: '1.5px solid var(--ink)' }}
          >
            <div className="text-xs tracking-[0.15em] uppercase text-ink-mute font-semibold mb-4">
              Aperçu de votre résultat
            </div>
            {[
              ['Manon Aubry', 87, 'green'],
              ['Marine Tondelier', 72, 'green'],
              ['Gabriel Attal', 34, null],
              ['Marine Le Pen', 12, 'red'],
            ].map(([name, pct, c]) => {
              const colorVar = c === 'green' ? 'var(--ink-green)' : c === 'red' ? 'var(--ink-red)' : 'var(--ink)';
              return (
                <div key={name} className="mb-3">
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span>{name}</span>
                    <span className="numeral" style={{ color: colorVar }}>{pct} %</span>
                  </div>
                  <div className="relative" style={{ height: 4, background: 'rgba(0,0,0,0.08)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: colorVar }} />
                  </div>
                </div>
              );
            })}
            <div className="hand mt-3 text-ink-mute" style={{ fontSize: 16 }}>↑ exemple — vos résultats varieront</div>
          </div>
        </div>
      </div>

      <div
        className="flex flex-col sm:flex-row sm:items-center gap-4 mt-14 py-8"
        style={{ borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)' }}
      >
        <button onClick={onStart} className="btn btn--blue" style={{ fontSize: 18, padding: '18px 32px' }}>
          {hasInProgress ? 'Recommencer le quiz' : 'Commencer le quiz'} →
        </button>
        {hasInProgress && (
          <button onClick={onResume} className="btn">
            Reprendre où j'en étais
          </button>
        )}
        <span className="hand sm:ml-auto text-ink-mute" style={{ fontSize: 22 }}>
          {quizData.meta.estimatedMinutes} min. promis.
        </span>
      </div>

      <div className="flex gap-6 mt-6 text-xs text-ink-mute flex-wrap">
        <span>✓ Aucun compte requis</span>
        <span>✓ Aucune donnée stockée</span>
        <span>✓ Vous pouvez reprendre</span>
      </div>
    </div>
  );
}

function QuizQuestion({ question, current, total, onAnswer, onBack, currentAnswer, currentImportance, onImportance }) {
  const progress = (current / total) * 100;
  const remaining = total - current;
  return (
    <div className="fade-in">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-12 pt-6 flex-wrap">
        <span className="text-[11px] tracking-[0.15em] uppercase font-semibold">
          Question {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <span className="text-[11px] text-ink-mute tracking-[0.1em] uppercase">· {question.theme}</span>
      </div>
      <div className="relative mt-3" style={{ height: 4, background: 'rgba(0,0,0,0.08)' }}>
        <div className="absolute top-0 left-0 bottom-0 transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--ink-blue)' }} />
      </div>

      <section className="px-4 sm:px-6 lg:px-12 pt-10 lg:pt-14 max-w-5xl">
        <div className="hand mb-3" style={{ color: 'var(--ink-blue)', fontSize: 24, transform: 'rotate(-2deg)' }}>
          basé sur des votes réels ↓
        </div>
        <div className="stamp stamp--solid mb-6" style={{ borderColor: 'var(--ink)' }}>
          {question.theme}
        </div>
        <h1
          className="font-display font-extrabold text-ink"
          style={{ fontSize: 'clamp(32px, 6vw, 64px)', letterSpacing: '-0.04em', lineHeight: 0.95 }}
        >
          « {question.text} »<span style={{ color: 'var(--ink-red)' }}>.</span>
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-10">
          {quizData.answerOptions.map((opt) => {
            const isPour = opt.value > 0;
            const isContre = opt.value < 0;
            const isStrong = Math.abs(opt.value) === 2;
            const selected = currentAnswer === opt.value;
            let accentColor = 'var(--ink)';
            if (isPour) accentColor = 'var(--ink-green)';
            if (isContre) accentColor = 'var(--ink-red)';
            const symbol = opt.value === 2 ? '✓✓' : opt.value === 1 ? '✓' : opt.value === 0 ? '·' : opt.value === -1 ? '✗' : '✗✗';
            return (
              <button
                key={opt.value}
                onClick={() => onAnswer(opt.value)}
                style={{
                  padding: '20px 12px',
                  border: `1.5px solid ${selected ? accentColor : 'var(--ink)'}`,
                  background: selected ? accentColor : 'var(--paper)',
                  color: selected ? '#fff' : 'var(--ink)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                <div className="font-display font-extrabold mb-2" style={{ fontSize: 28 }}>{symbol}</div>
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Importance slider */}
        <div className="mt-10 py-5" style={{ borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)' }}>
          <div className="flex justify-between items-baseline mb-3 flex-wrap gap-2">
            <span className="text-[11px] tracking-[0.15em] uppercase font-semibold">Importance pour vous</span>
            <span className="hand text-ink-red" style={{ fontSize: 18 }}>pondère votre résultat →</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {IMPORTANCE_LABELS.map((l, i) => (
              <button
                key={l}
                onClick={() => onImportance(i)}
                style={{
                  padding: '10px 6px',
                  border: '1.5px solid var(--ink)',
                  background: currentImportance === i ? 'var(--ink)' : 'var(--paper)',
                  color: currentImportance === i ? 'var(--paper)' : 'var(--ink)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center gap-4 flex-wrap pb-12">
          <button onClick={onBack} className="btn btn--ghost" disabled={current === 1}>
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
            Précédent
          </button>
          <span className="text-xs text-ink-mute tracking-[0.1em] uppercase">
            {remaining} question{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''}
          </span>
        </div>
      </section>
    </div>
  );
}

function QuizResults({ answers, importance, onRestart, onSelectPolitician }) {
  const partyResults = useMemo(() => calculateQuizResults(answers, importance), [answers, importance]);
  const top3Parties = partyResults.slice(0, 3);

  const topPoliticians = useMemo(() => {
    const picks = [];
    partyResults.forEach(({ party, match }) => {
      const m = politiciansData.find(
        (p) => p.party.includes(party.matchPattern) && !picks.some((pk) => pk.id === p.id),
      );
      if (m && picks.length < 8) picks.push({ politician: m, party, match });
    });
    return picks;
  }, [partyResults]);

  const top3 = topPoliticians.slice(0, 3);
  const rest = topPoliticians.slice(3);
  const top1Name = top3[0]?.politician?.name || top3[0]?.party?.name || '—';

  return (
    <div className="fade-in">
      <section className="px-4 sm:px-6 lg:px-12 pt-10 lg:pt-12 max-w-6xl">
        <div className="flex items-baseline justify-between text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.15em] text-ink-mute flex-wrap gap-2">
          <span>§ Résultats</span>
          <span>{Object.keys(answers).length} / {quizData.questions.length} questions</span>
        </div>
        <hr className="rule rule--thick mt-3" />

        <div className="pt-12 lg:pt-16">
          <div className="hand mb-4" style={{ color: 'var(--ink-green)', fontSize: 30, transform: 'rotate(-2deg)' }}>
            voilà votre verdict. ↓
          </div>
          <h1
            className="font-display font-extrabold text-ink"
            style={{ fontSize: 'clamp(48px, 9vw, 124px)', letterSpacing: '-0.055em', lineHeight: 0.86 }}
          >
            Vous votez<br />
            comme<br />
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--ink-red)' }}>
              {top1Name}<span style={{ color: 'var(--ink-red)' }}>.</span>
            </em>
          </h1>
          {top3.length >= 2 && (
            <p className="text-lg mt-6 max-w-3xl text-ink-mute leading-snug">
              Sur {Object.keys(answers).length} votes réels, vos positions concordent à{' '}
              <strong style={{ color: 'var(--ink-green)' }}>{top3[0].match} %</strong> avec {top3[0].politician.name}
              {top3[1] && <>, <strong>{top3[1].match} %</strong> avec {top3[1].politician.name}</>}
              {top3[2] && <> et <strong>{top3[2].match} %</strong> avec {top3[2].politician.name}</>}.
            </p>
          )}
        </div>

        {/* Podium 3 */}
        {top3.length > 0 && (
          <div
            className="grid sm:grid-cols-3 mt-14"
            style={{ borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)' }}
          >
            {top3.map((entry, i) => (
              <div
                key={entry.politician.id}
                className="p-6 sm:p-8 relative"
                style={{
                  borderRight: i < 2 ? '1px solid rgba(128,128,128,0.18)' : 'none',
                }}
              >
                <div className="flex items-start gap-5">
                  <div style={{ width: 100, flexShrink: 0 }}>
                    <PhotoFrame politician={entry.politician} ratio="4/5" />
                  </div>
                  <div>
                    <div
                      className="font-display font-extrabold leading-none"
                      style={{ fontSize: 64, color: 'var(--ink-mute)', letterSpacing: '-0.04em' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 className="font-display font-bold mt-1" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>
                      {entry.politician.name}
                    </h3>
                    <div className="text-[11px] text-ink-mute tracking-[0.05em] uppercase mt-1">
                      {entry.party.name}
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <div
                    className="numeral font-extrabold"
                    style={{ fontSize: 48, color: 'var(--ink-green)', letterSpacing: '-0.04em' }}
                  >
                    {entry.match}<span style={{ fontSize: 24, marginLeft: 4 }}>%</span>
                  </div>
                  <div className="text-[11px] text-ink-mute tracking-[0.1em] uppercase">de concordance</div>
                </div>
                <button
                  onClick={() => onSelectPolitician(entry.politician.id)}
                  className="btn btn--sm mt-4"
                >
                  Voir la fiche →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Reste du classement */}
        {rest.length > 0 && (
          <>
            <h2 className="font-display font-extrabold mt-14 mb-4" style={{ fontSize: 32, letterSpacing: '-0.03em' }}>
              Le reste du classement
            </h2>
            <hr className="rule rule--thin" />
            <div>
              {rest.map((entry, i) => {
                const color = entry.match > 50 ? 'var(--ink-green)' : entry.match < 30 ? 'var(--ink-red)' : 'var(--ink)';
                return (
                  <button
                    key={entry.politician.id}
                    onClick={() => onSelectPolitician(entry.politician.id)}
                    className="w-full grid grid-cols-[40px_1fr_1fr_80px] gap-3 sm:gap-4 py-4 items-center text-left hover:bg-paper-2 transition-colors"
                    style={{ borderBottom: '1px solid rgba(128,128,128,0.18)' }}
                  >
                    <span className="numeral font-bold text-ink-mute" style={{ fontSize: 18 }}>
                      {String(i + 4).padStart(2, '0')}
                    </span>
                    <span className="text-sm sm:text-base font-semibold">
                      {entry.politician.name}{' '}
                      <span className="text-ink-mute font-normal">· {entry.party.name}</span>
                    </span>
                    <div className="relative" style={{ height: 6, background: 'rgba(128,128,128,0.15)' }}>
                      <div style={{ width: `${entry.match}%`, height: '100%', background: color }} />
                    </div>
                    <span className="numeral font-bold text-right" style={{ fontSize: 18 }}>{entry.match} %</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="flex gap-3 mt-12 pt-8 pb-12 flex-wrap" style={{ borderTop: '1.5px solid var(--ink)' }}>
          {top3[0] && (
            <button onClick={() => onSelectPolitician(top3[0].politician.id)} className="btn btn--solid">
              Voir la fiche de {top3[0].politician.name.split(' ').slice(-1)[0]} →
            </button>
          )}
          <button onClick={onRestart} className="btn">
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
            Refaire le quiz
          </button>
        </div>
      </section>
    </div>
  );
}

function Quiz({ onSelectPolitician }) {
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem('quiz-answers');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [importance, setImportance] = useState(() => {
    try {
      const saved = localStorage.getItem('quiz-importance');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState('intro');

  useEffect(() => {
    try {
      localStorage.setItem('quiz-answers', JSON.stringify(answers));
      localStorage.setItem('quiz-importance', JSON.stringify(importance));
    } catch { /* ignore */ }
  }, [answers, importance]);

  const handleStart = () => {
    setAnswers({});
    setImportance({});
    setCurrentIdx(0);
    setPhase('question');
  };

  const handleResume = () => {
    const answered = Object.keys(answers).length;
    const nextIdx = Math.min(answered, quizData.questions.length - 1);
    setCurrentIdx(nextIdx);
    setPhase(answered >= quizData.questions.length ? 'results' : 'question');
  };

  const handleAnswer = (value) => {
    const q = quizData.questions[currentIdx];
    setAnswers((a) => ({ ...a, [q.id]: value }));
    if (currentIdx + 1 >= quizData.questions.length) {
      setPhase('results');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      setCurrentIdx(currentIdx + 1);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleImportance = (value) => {
    const q = quizData.questions[currentIdx];
    setImportance((m) => ({ ...m, [q.id]: value }));
  };

  const handleBack = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const handleRestart = () => {
    setAnswers({});
    setImportance({});
    setCurrentIdx(0);
    setPhase('intro');
    try {
      localStorage.removeItem('quiz-answers');
      localStorage.removeItem('quiz-importance');
    } catch { /* ignore */ }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const hasInProgress = Object.keys(answers).length > 0;

  if (phase === 'intro') {
    return <QuizIntro onStart={handleStart} hasInProgress={hasInProgress} onResume={handleResume} />;
  }
  if (phase === 'results') {
    return <QuizResults answers={answers} importance={importance} onRestart={handleRestart} onSelectPolitician={onSelectPolitician} />;
  }
  const question = quizData.questions[currentIdx];
  return (
    <QuizQuestion
      question={question}
      current={currentIdx + 1}
      total={quizData.questions.length}
      onAnswer={handleAnswer}
      onBack={handleBack}
      currentAnswer={answers[question.id]}
      currentImportance={importance[question.id] ?? 2}
      onImportance={handleImportance}
    />
  );
}

// ─────────────────────────────────────────────────────────
// MENTIONS LÉGALES
// ─────────────────────────────────────────────────────────

function MentionsLegales() {
  const sections = [
    { title: 'Nature du site', body: `PolitiSimple est un site d'information non officiel à vocation citoyenne. Son but est de rassembler et présenter de manière synthétique des informations publiques relatives à des personnalités politiques françaises.` },
    { title: 'Sources & vérification', body: `Les informations publiées proviennent de sources publiques : open data des assemblées, presse française (Le Monde, Le Figaro, Libération, Mediapart, Le Canard Enchaîné), publications officielles (HATVP, Cour de cassation). Chaque information sensible est sourcée.` },
    { title: "Présomption d'innocence", body: `Les informations relatives à des procédures judiciaires sont présentées dans le strict respect de la présomption d'innocence (art. 9-1 du Code civil). Une mise en examen ne vaut pas culpabilité.` },
    { title: 'Droit de réponse', body: `Conformément à la loi du 29 juillet 1881, toute personne nommée dispose d'un droit de réponse. Les demandes de rectification peuvent être adressées via le dépôt public du projet.` },
    { title: 'Responsabilité', body: `Malgré le soin apporté à la qualité des informations, des erreurs peuvent subsister. Les opinions politiques exprimées dans les programmes restent celles de leurs auteurs respectifs.` },
    { title: 'Hébergement & technique', body: `Site statique, sans collecte de données personnelles, sans cookie de suivi, sans inscription. Code source ouvert sous licence MIT.` },
  ];

  return (
    <div className="fade-in px-4 sm:px-6 lg:px-12 pt-10 lg:pt-12 max-w-4xl mx-auto pb-16">
      <div className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.15em] text-ink-mute">
        § Information légale
      </div>
      <hr className="rule rule--thick mt-3" />

      <div className="mt-10">
        <h1
          className="font-display font-extrabold text-ink"
          style={{ fontSize: 'clamp(48px, 9vw, 120px)', letterSpacing: '-0.05em', lineHeight: 0.9 }}
        >
          Mentions<br />
          <em style={{ fontStyle: 'italic', fontWeight: 400 }}>légales<span style={{ color: 'var(--ink-red)' }}>.</span></em>
        </h1>
      </div>

      <div className="mt-10" style={{ borderTop: '1.5px solid var(--ink)' }}>
        {sections.map((s, i) => (
          <section
            key={i}
            className="py-7"
            style={{ borderBottom: '1px solid rgba(128,128,128,0.18)' }}
          >
            <div className="grid sm:grid-cols-[140px_1fr] gap-4 sm:gap-8">
              <span className="numeral font-display font-extrabold" style={{ fontSize: 28, color: 'var(--ink-red)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display font-bold uppercase" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
                  {s.title}
                </h3>
                <p className="text-base mt-3 leading-relaxed">{s.body}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────

function Footer({ onGoHome }) {
  return (
    <footer className="mt-20 lg:mt-32 px-4 sm:px-6 lg:px-12 pt-12 pb-8">
      <div className="grid lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-12">
        <div>
          <Logo size={28} onClick={onGoHome} />
          <p className="mt-4 text-sm text-ink-mute leading-relaxed max-w-sm">
            L'information politique simplifiée. Une fiche par personnalité, vérifiée et sourcée.
          </p>
          <div
            className="mt-6 hand"
            style={{ color: 'var(--ink-red)', fontSize: 24, transform: 'rotate(-1deg)' }}
          >
            merci de votre lecture.
          </div>
        </div>
        {[
          ['Explorer', [['Personnalités', '#'], ['Assemblée', '#chiffres-assemblee'], ['Quiz', '#quiz']]],
          ['À propos', [['Méthode', '#mentions-legales'], ['Sources', '#mentions-legales']]],
          ['Légal', [['Mentions légales', '#mentions-legales'], ['Droit de réponse', '#mentions-legales']]],
        ].map(([title, links]) => (
          <div key={title}>
            <div className="text-[11px] tracking-[0.15em] uppercase font-semibold mb-4">{title}</div>
            <ul className="flex flex-col gap-2 text-sm">
              {links.map(([label, href]) => (
                <li key={label}><a href={href} className="text-ink-mute hover:text-ink">{label}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <hr className="rule rule--thin mt-10" />
      <div className="flex flex-wrap justify-between items-center gap-3 pt-4 text-[10px] sm:text-[11px] tracking-[0.1em] uppercase text-ink-mute">
        <span>© {new Date().getFullYear()} PolitiSimple</span>
        <span className="hidden sm:inline">Présomption d'innocence respectée</span>
        <span>politisimple.fr</span>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [showChiffres, setShowChiffres] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const hash = window.location.hash.replace('#', '');
      if (hash === 'mentions-legales') {
        setShowMentions(true); setShowChiffres(false); setShowQuiz(false); setSelectedId(null);
      } else if (hash === 'chiffres-assemblee') {
        setShowChiffres(true); setShowMentions(false); setShowQuiz(false); setSelectedId(null);
      } else if (hash === 'quiz') {
        setShowQuiz(true); setShowMentions(false); setShowChiffres(false); setSelectedId(null);
      } else if (hash && politiciansData.some((p) => p.id === hash)) {
        setShowMentions(false); setShowChiffres(false); setShowQuiz(false); setSelectedId(hash);
      } else {
        setShowMentions(false); setShowChiffres(false); setShowQuiz(false); setSelectedId(null);
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
    setSearchTerm('');
  };

  const selectedPolitician = useMemo(
    () => politiciansData.find((p) => p.id === selectedId),
    [selectedId],
  );

  const showProfile = !!selectedId && !!selectedPolitician;
  const showList = !showMentions && !showChiffres && !showQuiz && !showProfile;

  let activeRoute = 'home';
  if (showProfile) activeRoute = 'profile';
  else if (showChiffres) activeRoute = 'chiffres';
  else if (showQuiz) activeRoute = 'quiz';
  else if (showMentions) activeRoute = 'mentions';

  return (
    <div className="min-h-screen bg-paper text-ink antialiased">
      <Header
        activeRoute={activeRoute}
        onGoHome={goHome}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
      />

      <main>
        {showList && (
          <>
            <HomeHero />
            <HomePersonalities
              politicians={politiciansData}
              onSelect={handleSelectPolitician}
              searchTerm={searchTerm}
            />
            <HomeQuizCTA />
            <HomeDerniersVotes />
          </>
        )}

        {showProfile && (
          <ProfileView
            politician={selectedPolitician}
            allPoliticians={politiciansData}
            onSelectPolitician={handleSelectPolitician}
          />
        )}
        {showChiffres && <ChiffresAssemblee onSelectPolitician={handleSelectPolitician} />}
        {showQuiz && <Quiz onSelectPolitician={handleSelectPolitician} />}
        {showMentions && <MentionsLegales />}
      </main>

      <Footer onGoHome={goHome} />
    </div>
  );
}

export default App;
