import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Lock, AlertCircle, Trophy, Sun, Moon, Monitor, Menu, X, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

const QwixxScorecard = () => {
  // Configuratie van de rijen
  const rowConfig = {
    red: { color: 'bg-red-500', text: 'text-white', label: 'Rood', type: 'asc', numbers: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    yellow: { color: 'bg-yellow-400', text: 'text-black', label: 'Geel', type: 'asc', numbers: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    green: { color: 'bg-green-600', text: 'text-white', label: 'Groen', type: 'desc', numbers: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2] },
    blue: { color: 'bg-blue-600', text: 'text-white', label: 'Blauw', type: 'desc', numbers: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2] }
  };

  // State
  const [marks, setMarks] = useState({
    red: [],
    yellow: [],
    green: [],
    blue: []
  });

  const [locks, setLocks] = useState({
    red: false,
    yellow: false,
    green: false,
    blue: false
  });

  const [penalties, setPenalties] = useState(0);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Theme state: 'system', 'light', or 'dark'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('qwixx-theme') || 'system';
    }
    return 'system';
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('qwixx-theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme(current => {
      if (current === 'system') return 'light';
      if (current === 'light') return 'dark';
      return 'system';
    });
  };

  const ThemeIcon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon;

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('qwixx-fullscreen') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('qwixx-fullscreen', isFullscreen.toString());
  }, [isFullscreen]);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const drawerRef = useRef(null);

  // Gesture handling for drawer
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchCurrentX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      touchCurrentX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const diff = touchCurrentX.current - touchStartX.current;
      const threshold = 50;

      // Swipe right from left edge to open
      if (!drawerOpen && touchStartX.current < 30 && diff > threshold) {
        setDrawerOpen(true);
      }
      // Swipe left to close
      if (drawerOpen && diff < -threshold) {
        setDrawerOpen(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [drawerOpen]);

  // Scorecard types for future expansion
  const scorecardTypes = [
    { id: 'standard', label: 'Standaard', active: true },
    { id: 'quick', label: 'Snel Spel', active: false, comingSoon: true },
    { id: 'duo', label: 'Duo Modus', active: false, comingSoon: true },
  ];

  // Score berekening helper (1=1, 2=3, 3=6, etc.)
  const calculateRowScore = (count) => {
    return (count * (count + 1)) / 2;
  };

  // Toggle een nummer
  const handleToggle = (color, number) => {
    const currentMarks = marks[color];
    const isLocked = locks[color];
    const rowType = rowConfig[color].type;

    // Check of nummer al aangekruist is
    const isMarked = currentMarks.includes(number);

    if (isMarked) {
      // Logic voor uitvinken (mag alleen als het de laatste is)
      const lastMarked = currentMarks[currentMarks.length - 1];
      if (number === lastMarked && !isLocked) {
        setMarks(prev => ({
          ...prev,
          [color]: prev[color].filter(n => n !== number)
        }));
      }
      return;
    }

    // Logic voor aanvinken
    if (isLocked) return; // Rij is dicht

    // Validatie: Nummer moet rechts staan van het laatste kruisje
    if (currentMarks.length > 0) {
      const lastMarked = currentMarks[currentMarks.length - 1];
      if (rowType === 'asc' && number < lastMarked) return;
      if (rowType === 'desc' && number > lastMarked) return;
    }

    setMarks(prev => ({
      ...prev,
      [color]: [...prev[color], number]
    }));
  };

  const handlePenalty = () => {
    if (penalties < 4) setPenalties(penalties + 1);
  };

  const removePenalty = () => {
    if (penalties > 0) setPenalties(penalties - 1);
  };

  // Toggle lock on a row (lock requires 5+ marks and end number marked)
  const handleLock = (color) => {
    // If already locked, unlock it
    if (locks[color]) {
      setLocks(prev => ({ ...prev, [color]: false }));
      return;
    }

    // To lock: need 5+ marks and end number marked
    const rowMarks = marks[color];
    const rowType = rowConfig[color].type;
    const endNumber = rowType === 'asc' ? 12 : 2;

    if (rowMarks.length >= 5 && rowMarks.includes(endNumber)) {
      setLocks(prev => ({ ...prev, [color]: true }));
    }
  };

  const resetGame = () => {
    setMarks({ red: [], yellow: [], green: [], blue: [] });
    setLocks({ red: false, yellow: false, green: false, blue: false });
    setPenalties(0);
    setShowConfirmReset(false);
  };

  // Bereken totaalscores
  const scores = {
    red: calculateRowScore(marks.red.length + (locks.red ? 1 : 0)),
    yellow: calculateRowScore(marks.yellow.length + (locks.yellow ? 1 : 0)),
    green: calculateRowScore(marks.green.length + (locks.green ? 1 : 0)),
    blue: calculateRowScore(marks.blue.length + (locks.blue ? 1 : 0)),
    penalties: penalties * 5
  };

  const totalScore = scores.red + scores.yellow + scores.green + scores.blue - scores.penalties;

  return (
    <div className={`h-full bg-slate-100 dark:bg-slate-900 p-2 font-sans mx-auto flex flex-col overflow-hidden ${isFullscreen ? 'max-w-none px-4' : 'max-w-2xl'}`}>
      {/* Slide-out Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setDrawerOpen(false)}
        />
        {/* Drawer Panel */}
        <div
          ref={drawerRef}
          className={`absolute top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 shadow-xl transform transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Menu</h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="p-2">
            <p className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Scorekaarten
            </p>
            {scorecardTypes.map((type) => (
              <button
                key={type.id}
                disabled={type.comingSoon}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                  type.active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                    : type.comingSoon
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{type.label}</span>
                {type.comingSoon && (
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
                {type.active && <ChevronRight size={16} />}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Minimal header with icons only */}
      <header className="flex justify-between items-center px-1 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            title="Menu"
          >
            <Menu size={18} />
          </button>
          <h1 className="text-base font-bold text-slate-600 dark:text-slate-400">
            Qwixx
          </h1>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            title={isFullscreen ? 'Compacte weergave' : 'Volledig scherm'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            onClick={cycleTheme}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            title={`Thema: ${theme === 'system' ? 'Systeem' : theme === 'light' ? 'Licht' : 'Donker'}`}
          >
            <ThemeIcon size={18} />
          </button>
          <button
            onClick={() => setShowConfirmReset(true)}
            className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
            title="Nieuw Spel"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Reset Bevestiging Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-100">Nieuw spel starten?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Alle huidige scores worden gewist.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium"
              >
                Annuleren
              </button>
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
              >
                Start Nieuw Spel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color rows - flex to fill available space */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 min-h-0 py-1 max-h-[500px]">
        {Object.entries(rowConfig).map(([colorKey, config]) => {
          const isRowLocked = locks[colorKey];
          const rowMarks = marks[colorKey];
          const lastMarked = rowMarks.length > 0 ? rowMarks[rowMarks.length - 1] : null;

          return (
            <div key={colorKey} className="flex-1 max-h-[100px] rounded-lg overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col min-h-0">
              {/* Row Header */}
              <div className={`${config.color} ${config.text} py-1 px-2 flex justify-between items-center shrink-0`}>
                <span className="font-bold uppercase tracking-wider text-xs">{config.label}</span>
                <div className="flex items-center gap-1.5">
                   {isRowLocked && <Lock size={12} className="opacity-80" />}
                   <span className="font-mono font-bold text-sm">{scores[colorKey]}</span>
                </div>
              </div>

              {/* Numbers Grid */}
              <div className="flex-1 p-1 grid grid-cols-12 gap-0.5 bg-slate-50 dark:bg-slate-800/50 min-h-0">
                {config.numbers.map((num) => {
                  const isMarked = rowMarks.includes(num);
                  let isDisabled = false;

                  if (isRowLocked && !isMarked) isDisabled = true;

                  if (!isMarked && lastMarked !== null) {
                    if (config.type === 'asc' && num < lastMarked) isDisabled = true;
                    if (config.type === 'desc' && num > lastMarked) isDisabled = true;
                  }

                  return (
                    <button
                      key={num}
                      onClick={() => handleToggle(colorKey, num)}
                      disabled={isDisabled}
                      className={`
                        rounded flex items-center justify-center font-bold text-sm sm:text-base transition-all
                        ${isMarked
                          ? `${config.color} ${config.text} ring-1 ring-offset-1 ring-slate-300 dark:ring-slate-600 dark:ring-offset-slate-800`
                          : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}
                        ${isDisabled && !isMarked ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-700' : 'shadow-sm'}
                      `}
                    >
                      {isMarked ? 'X' : num}
                    </button>
                  );
                })}

                {/* Lock button at end of row */}
                {(() => {
                  const endNumber = config.type === 'asc' ? 12 : 2;
                  const canLock = rowMarks.length >= 5 && rowMarks.includes(endNumber);
                  return (
                    <button
                      onClick={() => handleLock(colorKey)}
                      disabled={!isRowLocked && !canLock}
                      className={`
                        rounded flex items-center justify-center border-2 transition-all
                        ${isRowLocked
                          ? `${config.color} border-transparent text-white hover:opacity-80 cursor-pointer`
                          : canLock
                            ? 'border-slate-400 dark:border-slate-500 text-slate-400 dark:text-slate-500 hover:border-slate-600 dark:hover:border-slate-400 cursor-pointer'
                            : 'border-slate-300 dark:border-slate-600 text-slate-300 dark:text-slate-600 cursor-not-allowed'}
                      `}
                      title={isRowLocked ? 'Klik om te ontgrendelen' : canLock ? 'Klik om rij af te sluiten' : 'Minimaal 5 kruisjes + eindnummer nodig'}
                    >
                      <Lock size={12} />
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom section: Penalties + Total Score */}
      <div className="shrink-0 pt-1 flex gap-2">
        {/* Penalties */}
        <div className="flex-1 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle className="text-red-500" size={14}/>
            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Mislukt</span>
            <span className="font-mono text-sm text-red-500 font-bold ml-auto">-{scores.penalties}</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <button
                key={i}
                onClick={() => i <= penalties ? removePenalty() : handlePenalty()}
                className={`
                  flex-1 h-8 rounded border-2 flex items-center justify-center transition-all font-bold text-xs
                  ${i <= penalties
                    ? 'bg-slate-800 dark:bg-slate-200 border-slate-800 dark:border-slate-200 text-white dark:text-slate-800'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-transparent'}
                `}
              >
                X
              </button>
            ))}
          </div>
        </div>

        {/* Total Score */}
        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <Trophy className="text-yellow-500" size={20} />
          <div className="flex flex-col items-end">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{totalScore}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">totaal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QwixxScorecard;
