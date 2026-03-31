import { useState, useMemo, useEffect } from 'react'
import politiciansData from './data/politicians.json'
import { 
  Search, 
  Moon, 
  Sun, 
  ArrowLeft, 
  Gavel, 
  Clock, 
  ChevronRight,
  Info 
} from 'lucide-react'

// Utilisation du CDN Tailwind configuré dans index.html
import './index.css'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      if (saved) return saved === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Synchronisation du thème avec la classe "dark" sur l'élément htlm (requis par Tailwind CDN)
  useEffect(() => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  // Gestion de la navigation par Hash (Bouton retour du navigateur)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash && politiciansData.some(p => p.id === hash)) {
        setSelectedId(hash)
      } else {
        setSelectedId(null)
      }
    }

    // Init au chargement
    handleHashChange()

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Mise à jour du hash quand on sélectionne un politique
  const handleSelectPolitician = (id) => {
    window.location.hash = id || ''
  }

  const filteredPoliticians = useMemo(() => {
    return politiciansData.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bio.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  const selectedPolitician = useMemo(() => {
    return politiciansData.find(p => p.id === selectedId)
  }, [selectedId])

  const handleLogoClick = () => {
    handleSelectPolitician(null)
    setSearchTerm('')
  }

  return (
    <div className="min-h-screen font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header Premium Centré */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo (Gauche) */}
          <div className="w-1/4">
            <h1 
              onClick={handleLogoClick} 
              className="text-2xl sm:text-3xl font-black tracking-tighter cursor-pointer hover:opacity-80 transition-opacity select-none shrink-0"
            >
              PolitiSimple<span className="text-blue-600">.</span>
            </h1>
          </div>

          {/* Desktop Search Center (Milieu) */}
          {!selectedId && (
            <div className="hidden md:flex flex-1 justify-center max-w-lg">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher une personnalité, un parti, une ville..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm font-medium shadow-sm hover:shadow-md"
                />
              </div>
            </div>
          )}

          {/* Boutons (Droite) */}
          <div className="w-1/4 flex justify-end items-center gap-3">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:scale-105 transition-transform"
              aria-label="Changer de thème"
            >
              {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
            </button>
            
            {selectedId && (
              <button 
                onClick={() => handleSelectPolitician(null)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Retour</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Mobile Search Input */}
        {!selectedId && (
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!selectedId ? (
          /* Liste des Candidats */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {filteredPoliticians.map(p => (
              <div 
                key={p.id} 
                className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 cursor-pointer"
                onClick={() => handleSelectPolitician(p.id)}
              >
...
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
                    Mise à jour : {p.lastUpdate}
                  </div>
                  <h3 className="text-2xl font-black mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">{p.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 italic">"{p.bio}"</p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest">
                    Découvrir le programme <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-2 transition-all" />
                  </div>
                </div>
              </div>
            ))}
            
            {filteredPoliticians.length === 0 && (
              <div className="col-span-full py-32 text-center">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-xl font-bold text-slate-400">Aucun profil ne correspond à votre recherche.</p>
              </div>
            )}
          </div>
        ) : (
          /* Vue Profil Détailée */
          <div className="max-w-4xl mx-auto space-y-16 animate-[fadeIn_0.5s_ease-out_forwards]">
            {/* Header Profil */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
              <div className="relative shrink-0">
                <img 
                  src={selectedPolitician.image} 
                  alt={selectedPolitician.name} 
                  className="w-48 h-48 sm:w-64 sm:h-64 rounded-[3.5rem] object-cover ring-8 ring-white dark:ring-slate-900 shadow-2xl"
                  referrerPolicy="no-referrer"
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPolitician.name)}&background=random&size=400&bold=true`; 
                  }} 
                />
                <div 
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-2xl whitespace-nowrap"
                  style={{ backgroundColor: selectedPolitician.partyColor }}
                >
                  {selectedPolitician.party}
                </div>
              </div>
              <div className="text-center md:text-left flex-1 py-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 text-[10px] font-black uppercase tracking-wider mb-6">
                  <Clock className="h-3 w-3" />
                  Actualisé le {selectedPolitician.lastUpdate}
                </div>
                <h2 className="text-5xl sm:text-7xl font-black mb-6 tracking-tighter leading-none uppercase">{selectedPolitician.name}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black rounded-xl uppercase tracking-widest border border-blue-100 dark:border-blue-900/50">
                    PROGRAMME DISPONIBLE
                  </span>
                </div>
              </div>
            </div>

            {/* Sections de Contenu */}
            <div className="grid grid-cols-1 gap-16">
              {/* Le Programme résumé */}
              <section>
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-xl shadow-blue-500/20">
                    <Info className="h-6 w-6" />
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase">Le Programme</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {selectedPolitician.program.map((cat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all">
                      <h4 className="text-xl font-black mb-8 text-blue-600 dark:text-blue-400 uppercase tracking-tight flex items-center gap-3">
                        <span className="h-1.5 w-6 bg-blue-600 rounded-full" />
                        {cat.category}
                      </h4>
                      <ul className="space-y-6">
                        {cat.points.map((pt, i) => (
                          <li key={i} className="flex gap-4 text-slate-600 dark:text-slate-400 font-semibold leading-relaxed group">
                            <ChevronRight className="h-5 w-5 shrink-0 text-blue-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[15px]">{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Dossier Judiciaire */}
              <section>
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 bg-red-600 text-white rounded-[1.5rem] shadow-xl shadow-red-500/20">
                    <Gavel className="h-6 w-6" />
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase">Justice & Parcours</h3>
                </div>

                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-8 sm:p-12 rounded-[3.5rem] shadow-sm">
                  <div className="pb-8 border-b border-red-200/50 dark:border-red-900/50 mb-10">
                    <p className="text-2xl font-black text-red-700 dark:text-red-400 uppercase tracking-tighter">
                      <span className="opacity-40">Statut :</span> {selectedPolitician.legal.status}
                    </p>
                  </div>
                  
                  <div className="space-y-8 mb-16">
                    {selectedPolitician.legal.details.map((detail, idx) => (
                      <div key={idx} className="flex gap-6 items-start group">
                        <div className="h-10 w-1.5 bg-red-600/10 dark:bg-red-900/30 rounded-full group-hover:bg-red-600 transition-all duration-500" />
                        <p className="text-slate-800 dark:text-slate-200 font-bold text-lg leading-snug">{detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-8 border-t border-red-200/50 dark:border-red-900/50">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-700 dark:text-red-400 opacity-50">Sources citées</span>
                    {selectedPolitician.legal.sources.map((s, i) => (
                      <span key={i} className="px-4 py-1.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm uppercase tracking-wider">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Footer Minimal */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-16 mt-32 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h4 className="text-xl font-black tracking-tighter mb-4 opacity-70">POLITISIMPLE.</h4>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">L'information politique simplifiée — © 2026</p>
        </div>
      </footer>
    </div>
  )
}

export default App
