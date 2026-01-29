
import React, { useState, useEffect } from 'react';
import { ArenaChallenge, ArenaResult } from '../types';
import { generateArenaChallenge, evaluateCombatStrategy } from '../services/geminiService';

const ArenaGame: React.FC = () => {
    const [challenge, setChallenge] = useState<ArenaChallenge | null>(null);
    const [strategy, setStrategy] = useState('');
    const [loading, setLoading] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [result, setResult] = useState<ArenaResult | null>(null);
    const [quotaError, setQuotaError] = useState(false);

    const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;
    const t = {
        title: isPt ? "Arena de Sobrevivência" : "Survival Arena",
        desc: isPt ? "Como você enfrentaria essa criatura?" : "How would you face this creature?",
        placeholder: isPt ? "Descreva sua estratégia de combate..." : "Describe your combat strategy...",
        submit: isPt ? "Executar Ação" : "Execute Action",
        loading: isPt ? "Invocando criatura..." : "Summoning creature...",
        evaluating: isPt ? "Analisando combate..." : "Analyzing combat...",
        next: isPt ? "Próximo Adversário" : "Next Opponent",
        victory: isPt ? "VITÓRIA" : "VICTORY",
        defeat: isPt ? "DERROTA" : "DEFEAT",
        survival: isPt ? "Chance de Sobrevivência" : "Survival Chance",
        damage: isPt ? "Dano Causado" : "Damage Dealt",
        difficulty: isPt ? "Nível de Perigo" : "Danger Level",
        quotaMsg: isPt ? "Limite da API atingido!" : "API quota exceeded!"
    };

    const loadNewChallenge = async () => {
        setLoading(true);
        setResult(null);
        setStrategy('');
        setQuotaError(false);
        try {
            const data = await generateArenaChallenge();
            if (data) setChallenge(data);
        } catch (e: any) {
            if (e.name === 'QuotaExceededError') setQuotaError(true);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadNewChallenge();
    }, []);

    const handleExecute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!strategy.trim() || !challenge || evaluating) return;

        setEvaluating(true);
        setResult(null);
        try {
            const res = await evaluateCombatStrategy(challenge.creature, strategy);
            if (res) setResult(res);
        } catch (e: any) {
            if (e.name === 'QuotaExceededError') setQuotaError(true);
        }
        setEvaluating(false);
    };

    const getDifficultyColor = (diff: string) => {
        switch(diff) {
            case 'Easy': return 'text-green-400';
            case 'Medium': return 'text-yellow-400';
            case 'Hard': return 'text-orange-400';
            case 'Legendary': return 'text-red-500 animate-pulse';
            default: return 'text-slate-400';
        }
    };

    if (quotaError) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="text-6xl mb-4">💀</div>
                <h2 className="text-2xl font-bold text-red-500 mb-4">{t.quotaMsg}</h2>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4 flex flex-col h-full animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500">
                    {t.title}
                </h2>
                <p className="text-slate-400 mt-2">{t.desc}</p>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-red-400 animate-pulse">{t.loading}</p>
                </div>
            ) : challenge ? (
                <div className="flex-1 flex flex-col gap-6">
                    <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <span className={`text-xs font-black uppercase tracking-widest ${getDifficultyColor(challenge.difficulty)}`}>
                                {t.difficulty}: {challenge.difficulty}
                            </span>
                        </div>
                        
                        <div className="flex flex-col items-center text-center">
                            <span className="text-8xl mb-4 animate-bounce-slow drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                                {challenge.emoji}
                            </span>
                            <h3 className="text-3xl font-bold text-white mb-2">{challenge.creature}</h3>
                            <p className="text-slate-300 max-w-lg leading-relaxed">{challenge.description}</p>
                        </div>
                    </div>

                    <div className="flex-1">
                        {result ? (
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 animate-fade-in">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className={`text-2xl font-black ${result.success ? 'text-green-400' : 'text-red-500'}`}>
                                        {result.success ? `✓ ${t.victory}` : `✗ ${t.defeat}`}
                                    </h4>
                                    <button onClick={loadNewChallenge} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                                        {t.next}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-800 p-4 rounded-xl">
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">{t.survival}</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${result.survivalChance}%` }}></div>
                                            </div>
                                            <span className="text-blue-400 font-mono font-bold">{result.survivalChance}%</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800 p-4 rounded-xl">
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">{t.damage}</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${result.damageDealt}%` }}></div>
                                            </div>
                                            <span className="text-red-400 font-mono font-bold">{result.damageDealt}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                    <p className="text-slate-300 italic leading-relaxed">
                                        {result.commentary}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleExecute} className="flex flex-col gap-4">
                                <textarea
                                    value={strategy}
                                    onChange={(e) => setStrategy(e.target.value)}
                                    placeholder={t.placeholder}
                                    disabled={evaluating}
                                    className="w-full h-32 bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 text-white focus:outline-none focus:border-red-500 transition-colors resize-none text-lg"
                                />
                                <button
                                    type="submit"
                                    disabled={!strategy.trim() || evaluating}
                                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-900/20 transform active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {evaluating ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            {t.evaluating}
                                        </div>
                                    ) : t.submit}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ArenaGame;
