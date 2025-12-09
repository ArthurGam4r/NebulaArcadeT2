import React, { useState, useEffect } from 'react';
import { AlchemyElement, LoaderState } from '../types';
import { combineAlchemyElements } from '../services/geminiService';

const isPt = navigator.language.startsWith('pt');

const INITIAL_ELEMENTS: AlchemyElement[] = isPt ? [
  { id: '1', name: 'Água', emoji: '💧' },
  { id: '2', name: 'Fogo', emoji: '🔥' },
  { id: '3', name: 'Terra', emoji: '🌍' },
  { id: '4', name: 'Ar', emoji: '💨' },
] : [
  { id: '1', name: 'Water', emoji: '💧' },
  { id: '2', name: 'Fire', emoji: '🔥' },
  { id: '3', name: 'Earth', emoji: '🌍' },
  { id: '4', name: 'Air', emoji: '💨' },
];

const AlchemyGame: React.FC = () => {
  const [elements, setElements] = useState<AlchemyElement[]>(() => {
    const saved = localStorage.getItem('alchemy_elements');
    return saved ? JSON.parse(saved) : INITIAL_ELEMENTS;
  });
  
  const [selected, setSelected] = useState<AlchemyElement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [recentResult, setRecentResult] = useState<AlchemyElement | null>(null);

  // Localization
  const t = {
      title: isPt ? "Alquimia Neural" : "Neural Alchemy",
      subtitle: isPt ? "Combine elementos para criar o universo." : "Combine elements to create the universe.",
      cooking: isPt ? "A IA está cozinhando..." : "AI is cooking...",
      clear: isPt ? "Limpar" : "Clear",
      combine: isPt ? "Combinar" : "Combine",
      created: isPt ? "Você criou:" : "You created:",
      newDiscovery: isPt ? "NOVA DESCOBERTA" : "NEW DISCOVERY",
      yourElements: isPt ? "Seus Elementos" : "Your Elements",
      reset: isPt ? "Resetar" : "Reset",
      resetConfirm: isPt ? "Reiniciar todo o progresso?" : "Reset all progress?"
  };

  useEffect(() => {
    localStorage.setItem('alchemy_elements', JSON.stringify(elements));
  }, [elements]);

  const handleSelect = (el: AlchemyElement) => {
    if (selected.length < 2) {
      setSelected(prev => [...prev, el]);
    }
  };

  const handleClear = () => setSelected([]);

  const handleCombine = async () => {
    if (selected.length !== 2) return;
    
    setLoading(true);
    setRecentResult(null);

    // Check if combo exists in history (optional optimization, skipping for pure AI fun)
    
    const newEl = await combineAlchemyElements(selected[0].name, selected[1].name);
    
    if (newEl) {
      // Check for duplicates
      const exists = elements.find(e => e.name.toLowerCase() === newEl.name.toLowerCase());
      if (!exists) {
        setElements(prev => [newEl, ...prev]);
        setRecentResult(newEl);
      } else {
        setRecentResult({ ...exists, isNew: false });
      }
    }
    
    setLoading(false);
    setSelected([]);
  };

  const resetGame = () => {
    if(confirm(t.resetConfirm)) {
      setElements(INITIAL_ELEMENTS);
      setSelected([]);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          {t.title}
        </h2>
        <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
      </div>

      {/* Crafting Area */}
      <div className="bg-slate-800/50 rounded-xl p-6 mb-6 flex flex-col items-center justify-center min-h-[200px] border border-slate-700 relative overflow-hidden">
        
        {loading && (
            <div className="absolute inset-0 bg-slate-900/80 z-20 flex items-center justify-center flex-col">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-blue-300 animate-pulse">{t.cooking}</span>
            </div>
        )}

        <div className="flex items-center gap-8 z-10">
            {/* Slot 1 */}
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl border-2 transition-all ${selected[0] ? 'border-blue-500 bg-slate-700' : 'border-slate-600 border-dashed bg-slate-800/30'}`}>
                {selected[0]?.emoji}
                <div className="absolute mt-16 text-xs text-white font-medium bg-slate-900/60 px-2 rounded">{selected[0]?.name}</div>
            </div>

            <span className="text-2xl text-slate-500 font-bold">+</span>

            {/* Slot 2 */}
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl border-2 transition-all ${selected[1] ? 'border-purple-500 bg-slate-700' : 'border-slate-600 border-dashed bg-slate-800/30'}`}>
                {selected[1]?.emoji}
                <div className="absolute mt-16 text-xs text-white font-medium bg-slate-900/60 px-2 rounded">{selected[1]?.name}</div>
            </div>
        </div>

        <div className="flex gap-3 mt-8 z-10">
            <button 
                onClick={handleClear}
                disabled={selected.length === 0}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white disabled:opacity-30"
            >
                {t.clear}
            </button>
            <button 
                onClick={handleCombine}
                disabled={selected.length !== 2 || loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-2 px-8 rounded-full shadow-lg transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {t.combine}
            </button>
        </div>

        {recentResult && !loading && (
             <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 animate-bounce-short">
                <span className="text-3xl">{recentResult.emoji}</span>
                <div>
                    <p className="font-bold text-green-400">{t.created} {recentResult.name}!</p>
                    {recentResult.isNew && <span className="text-xs text-yellow-300 font-bold tracking-wider">{t.newDiscovery}</span>}
                </div>
             </div>
        )}
      </div>

      {/* Inventory */}
      <div className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-slate-800 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-300 font-semibold">{t.yourElements} ({elements.length})</h3>
            <button onClick={resetGame} className="text-xs text-red-400 hover:text-red-300">{t.reset}</button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 overflow-y-auto pr-2 pb-10">
            {elements.map((el) => (
                <button
                    key={el.id + el.name}
                    onClick={() => handleSelect(el)}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 transition-all group"
                >
                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{el.emoji}</span>
                    <span className="text-xs text-center text-slate-300 leading-tight">{el.name}</span>
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AlchemyGame;