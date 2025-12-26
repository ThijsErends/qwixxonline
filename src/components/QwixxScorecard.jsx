import { useState } from 'react';
import { RefreshCw, Lock, AlertCircle, Trophy } from 'lucide-react';

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
      if (number === lastMarked) {

        // Als dit het slotnummer was, haal slot eraf
        const isEndNumber = (rowType === 'asc' && number === 12) || (rowType === 'desc' && number === 2);
        if (isEndNumber && isLocked) {
           setLocks(prev => ({ ...prev, [color]: false }));
        }

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

    // Validatie: Slotnummer (12 of 2) vereist minimaal 5 eerdere kruisjes
    const isEndNumber = (rowType === 'asc' && number === 12) || (rowType === 'desc' && number === 2);
    if (isEndNumber) {
      if (currentMarks.length < 5) {
        alert("Je hebt minimaal 5 kruisjes nodig in deze rij om het slotje te mogen sluiten!");
        return;
      }
      // Rij op slot zetten
      setLocks(prev => ({ ...prev, [color]: true }));
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
    <div className="min-h-screen bg-slate-100 p-4 font-sans max-w-2xl mx-auto shadow-xl">
      <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          Qwixx <span className="text-sm font-normal text-slate-500 hidden sm:inline-block">Digitale Scorekaart</span>
        </h1>
        <button
          onClick={() => setShowConfirmReset(true)}
          className="p-2 text-slate-500 hover:text-red-500 transition-colors"
          title="Nieuw Spel"
        >
          <RefreshCw size={24} />
        </button>
      </header>

      {/* Reset Bevestiging Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Nieuw spel starten?</h3>
            <p className="text-slate-600 mb-6">Alle huidige scores worden gewist.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 text-slate-600 font-medium"
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

      <div className="space-y-4 mb-8">
        {Object.entries(rowConfig).map(([colorKey, config]) => {
          const isRowLocked = locks[colorKey];
          const rowMarks = marks[colorKey];
          const lastMarked = rowMarks.length > 0 ? rowMarks[rowMarks.length - 1] : null;

          return (
            <div key={colorKey} className={`rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white`}>
              {/* Row Header */}
              <div className={`${config.color} ${config.text} p-2 px-3 flex justify-between items-center`}>
                <span className="font-bold uppercase tracking-wider text-sm">{config.label}</span>
                <div className="flex items-center gap-2">
                   {isRowLocked && <Lock size={16} className="opacity-80" />}
                   <span className="font-mono font-bold text-lg">{scores[colorKey]}</span>
                </div>
              </div>

              {/* Numbers Grid */}
              <div className="p-2 grid grid-cols-6 sm:grid-cols-12 gap-1.5 bg-slate-50">
                {config.numbers.map((num) => {
                  const isMarked = rowMarks.includes(num);
                  // Logic voor disable visualisatie
                  let isDisabled = false;

                  if (isRowLocked && !isMarked) isDisabled = true;

                  // Als niet aangekruist, mag het alleen als het rechts van de laatste staat
                  if (!isMarked && lastMarked !== null) {
                    if (config.type === 'asc' && num < lastMarked) isDisabled = true;
                    if (config.type === 'desc' && num > lastMarked) isDisabled = true;
                  }

                  // Speciale styling voor het slot-nummer (12 of 2)
                  const isEndNumber = (config.type === 'asc' && num === 12) || (config.type === 'desc' && num === 2);

                  return (
                    <button
                      key={num}
                      onClick={() => handleToggle(colorKey, num)}
                      disabled={isDisabled}
                      className={`
                        aspect-square rounded-md flex items-center justify-center font-bold text-lg transition-all
                        ${isMarked
                          ? `${config.color} ${config.text} ring-2 ring-offset-1 ring-slate-300 transform scale-95`
                          : 'bg-white text-slate-400 hover:bg-slate-100'}
                        ${isDisabled && !isMarked ? 'opacity-30 cursor-not-allowed bg-slate-100' : 'shadow-sm'}
                        ${isEndNumber ? 'rounded-full' : ''}
                      `}
                    >
                      {isMarked ? 'X' : num}
                    </button>
                  );
                })}

                {/* Het fysieke slotje aan het einde van de rij */}
                <div className={`
                    aspect-square rounded-full flex items-center justify-center border-2
                    ${isRowLocked ? `${config.color} border-transparent text-white` : 'border-slate-300 text-slate-300'}
                  `}>
                  <Lock size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Penalties Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-8 border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-slate-700 flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20}/>
            Mislukte Worpen (-5)
          </span>
          <span className="font-mono text-xl text-red-600 font-bold">
            -{scores.penalties}
          </span>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <button
              key={i}
              onClick={() => i <= penalties ? removePenalty() : handlePenalty()}
              className={`
                flex-1 aspect-square max-w-[60px] rounded-lg border-2 flex items-center justify-center transition-all
                ${i <= penalties
                  ? 'bg-slate-800 border-slate-800 text-white'
                  : 'border-slate-200 hover:border-slate-400 text-transparent'}
              `}
            >
              X
            </button>
          ))}
        </div>
      </div>

      {/* Total Score Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Totaal Score</span>
            <div className="text-xs text-slate-400">
              ({scores.red} + {scores.yellow} + {scores.green} + {scores.blue}) - {scores.penalties}
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Trophy className="text-yellow-500" size={28} />
             <span className="text-4xl font-black text-slate-800">{totalScore}</span>
          </div>
        </div>
      </div>

      {/* Spacer for fixed footer */}
      <div className="h-24"></div>
    </div>
  );
};

export default QwixxScorecard;
