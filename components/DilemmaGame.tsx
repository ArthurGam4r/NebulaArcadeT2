import React, { useState, useEffect } from 'react';
import { DilemmaScenario } from '../types';
import { generateDilemma } from '../services/geminiService';

const DilemmaGame: React.FC = () => {
  const [scenario, setScenario] = useState<DilemmaScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'A' | 'B' | null>(null);

  // Localization
  const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;
  const t = {
      title: isPt ? "Dilema Absurdo" : "Absurd Dilemma",
      subtitle: isPt ? "O que você faria nessa situação?" : "What would you do in this situation?",
      loading: isPt ? "A IA está criando um caos moral..." : "AI is creating moral chaos...",
      next: isPt ? "Próximo Dilema" : "Next Dilemma",
      error: isPt ? "Falha ao carregar." : "Failed to load."
  };

  const loadScenario = async () => {
    setLoading(true);
    setResult(null);
    const data = await generateDilemma();
    if (data) {
      setScenario(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadScenario();
  }, []);

  const handleChoice = (choice: 'A' | 'B') => {
    setResult(choice);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full max-w-4xl mx-auto p-4 animate-fade-in">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-500">
            {t.title}
            </h2>
            <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
        </div>

        {loading ? (
            <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-pink-300 animate-pulse text-lg">{t.loading}</p>
            </div>
        ) : scenario ? (
            <div className="w-full flex flex-col items-center gap-6">
                
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl max-w-2xl w-full text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">{scenario.title}</h3>
                    <p className="text-slate-300 text-lg leading-relaxed">{scenario.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 w-full mt-4">
                    {/* Option A */}
                    <div 
                        onClick={() => !result && handleChoice('A')}
                        className={`group relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between min-h-[250px]
                        ${result === 'A' ? 'border-pink-500 bg-pink-500/10' : result === 'B' ? 'border-slate-700 opacity-50 bg-slate-800' : 'border-slate-600 bg-slate-800 hover:border-pink-400 hover:shadow-pink-500/20'}
                        `}
                    >
                        <div className="absolute top-4 left-4 text-4xl font-black text-slate-700 group-hover:text-pink-500/30 transition-colors">A</div>
                        <p className="text-xl font-medium text-center text-white z-10">{scenario.optionA}</p>
                        
                        {result === 'A' && (
                            <div className="mt-4 pt-4 border-t border-pink-500/30 animate-fade-in">
                                <p className="text-pink-300 text-sm italic">"{scenario.consequenceA}"</p>
                            </div>
                        )}
                    </div>

                    {/* Option B */}
                    <div 
                        onClick={() => !result && handleChoice('B')}
                        className={`group relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-between min-h-[250px]
                        ${result === 'B' ? 'border-indigo-500 bg-indigo-500/10' : result === 'A' ? 'border-slate-700 opacity-50 bg-slate-800' : 'border-slate-600 bg-slate-800 hover:border-indigo-400 hover:shadow-indigo-500/20'}
                        `}
                    >
                        <div className="absolute top-4 left-4 text-4xl font-black text-slate-700 group-hover:text-indigo-500/30 transition-colors">B</div>
                        <p className="text-xl font-medium text-center text-white z-10">{scenario.optionB}</p>
                         
                         {result === 'B' && (
                            <div className="mt-4 pt-4 border-t border-indigo-500/30 animate-fade-in">
                                <p className="text-indigo-300 text-sm italic">"{scenario.consequenceB}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {result && (
                    <button 
                        onClick={loadScenario}
                        className="mt-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-full transition-all animate-bounce-short"
                    >
                        {t.next}
                    </button>
                )}
            </div>
        ) : (
            <div className="text-red-500">{t.error}</div>
        )}
    </div>
  );
};

export default DilemmaGame;