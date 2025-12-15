import React, { useState, useEffect, useRef } from 'react';
import { LadderChallenge } from '../types';
import { generateLadderChallenge, validateLadderStep, getLadderHint, removeApiKey } from '../services/geminiService';

interface Step {
    word: string;
    emoji: string;
}

const LadderGame: React.FC = () => {
    const [challenge, setChallenge] = useState<LadderChallenge | null>(null);
    const [steps, setSteps] = useState<Step[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [proximity, setProximity] = useState<number | null>(null); // 0-100
    const [won, setWon] = useState(false);
    const [quotaError, setQuotaError] = useState(false);
    
    // Hint State
    const [hintLoading, setHintLoading] = useState(false);
    const [activeHint, setActiveHint] = useState<{word: string, reason: string} | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Localization
    const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;
    const t = {
        title: isPt ? "Ponte Semântica" : "Semantic Bridge",
        desc: isPt ? "Conecte as palavras usando associações." : "Connect the words using associations.",
        start: isPt ? "Início" : "Start",
        target: isPt ? "Alvo" : "Target",
        placeholder: isPt ? "Digite a próxima associação..." : "Type the next association...",
        submit: isPt ? "Conectar" : "Connect",
        loading: isPt ? "Gerando desafio..." : "Generating challenge...",
        checking: isPt ? "Verificando..." : "Checking...",
        win: isPt ? "Você completou a ponte!" : "You built the bridge!",
        next: isPt ? "Próximo Desafio" : "Next Challenge",
        steps: isPt ? "Passos:" : "Steps:",
        error: isPt ? "Erro ao conectar" : "Connection failed",
        quotaMsg: isPt ? "Limite diário da API atingido!" : "Daily API quota exceeded!",
        changeKey: isPt ? "Trocar Chave API" : "Change API Key",
        hintBtn: isPt ? "Pedir Dica" : "Get Hint",
        hintLoading: isPt ? "Pensando..." : "Thinking...",
        hot: isPt ? "QUENTE 🔥" : "HOT 🔥",
        warm: isPt ? "MORNO 😐" : "WARM 😐",
        cold: isPt ? "FRIO ❄️" : "COLD ❄️",
        proximity: isPt ? "Proximidade:" : "Proximity:"
    };

    const loadGame = async () => {
        setLoading(true);
        setWon(false);
        setSteps([]);
        setFeedback(null);
        setProximity(null);
        setActiveHint(null);
        setInputValue('');
        setQuotaError(false);
        try {
            const data = await generateLadderChallenge();
            if (data) {
                setChallenge(data);
                setSteps([{ word: data.startWord, emoji: data.startEmoji }]);
            }
        } catch (e: any) {
            if (e.name === 'QuotaExceededError') {
                setQuotaError(true);
            } else {
                console.error(e);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        loadGame();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [steps, activeHint]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !challenge || validating || won) return;

        setValidating(true);
        setFeedback(null);
        setProximity(null);
        setActiveHint(null);
        setQuotaError(false);

        const currentWord = steps[steps.length - 1].word;
        const guess = inputValue.trim();

        try {
            // Logic change: We validate the step even if it IS the target word.
            // This prevents skipping the logic if the words aren't actually related.
            const result = await validateLadderStep(currentWord, challenge.endWord, guess);

            if (result.isValid) {
                setSteps(prev => [...prev, { word: guess, emoji: result.emoji || '🔗' }]);
                setInputValue('');
                setProximity(null);

                // Check win AFTER validation
                if (guess.toLowerCase() === challenge.endWord.toLowerCase()) {
                    setWon(true);
                }
            } else {
                setFeedback(result.message);
                if (result.proximity !== undefined) {
                    setProximity(result.proximity);
                }
            }
        } catch (e: any) {
             if (e.name === 'QuotaExceededError') {
                setQuotaError(true);
            } else {
                setFeedback("Error connecting to AI");
            }
        }

        setValidating(false);
    };

    const handleGetHint = async () => {
        if (!challenge || hintLoading || won) return;
        const currentWord = steps[steps.length - 1].word;
        
        setHintLoading(true);
        setActiveHint(null);
        setQuotaError(false);

        try {
            const hint = await getLadderHint(currentWord, challenge.endWord);
            if (hint) {
                setActiveHint(hint);
            }
        } catch (e: any) {
            if (e.name === 'QuotaExceededError') {
                setQuotaError(true);
            }
        }
        setHintLoading(false);
    };

    const handleChangeKey = () => {
      removeApiKey();
      window.location.reload();
    }

    const getProximityColor = (val: number) => {
        if (val < 25) return 'text-blue-300';
        if (val < 60) return 'text-yellow-300';
        return 'text-red-400';
    };

    const getProximityText = (val: number) => {
        if (val < 25) return t.cold;
        if (val < 60) return t.warm;
        return t.hot;
    };

    if (quotaError) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto p-8 animate-fade-in text-center">
               <div className="text-6xl mb-4">🛑</div>
               <h2 className="text-2xl font-bold text-red-400 mb-2">{t.quotaMsg}</h2>
               <button 
                  onClick={handleChangeKey}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-full transition-colors mt-4"
              >
                  {t.changeKey}
              </button>
          </div>
        )
    }

    return (
        <div className="flex flex-col items-center h-full max-w-2xl mx-auto p-4 animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                    {t.title}
                </h2>
                <p className="text-slate-400 text-sm mt-1">{t.desc}</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-12">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-emerald-300 animate-pulse">{t.loading}</p>
                </div>
            ) : challenge ? (
                <div className="w-full flex flex-col gap-4">
                    
                    {/* Target Display */}
                    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex justify-between items-center sticky top-0 z-10 shadow-lg backdrop-blur">
                        <div className="flex flex-col items-center opacity-50">
                             <span className="text-2xl">{challenge.startEmoji}</span>
                             <span className="text-xs text-slate-400">{t.start}</span>
                             <span className="font-bold text-slate-300 line-through decoration-slate-500">{challenge.startWord}</span>
                        </div>
                        
                        <div className="h-0.5 flex-1 bg-slate-700 mx-4 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 text-xs bg-slate-800 px-2">
                                {steps.length - 1} {t.steps}
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                             <span className="text-2xl animate-bounce-slow">{challenge.endEmoji}</span>
                             <span className="text-xs text-emerald-400 font-bold">{t.target}</span>
                             <span className="font-bold text-white text-lg">{challenge.endWord}</span>
                        </div>
                    </div>

                    {/* The Bridge (List of Steps) */}
                    <div className="flex flex-col gap-2 min-h-[300px] pb-40">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                                {idx > 0 && <div className="h-6 w-0.5 bg-slate-600 my-1"></div>}
                                <div className={`px-6 py-3 rounded-full border-2 text-lg font-bold flex items-center gap-3 shadow-lg w-full max-w-xs justify-center animate-fade-in
                                    ${idx === steps.length - 1 && !won ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300'}
                                    ${step.word === challenge.endWord ? 'bg-gradient-to-r from-yellow-500 to-amber-500 border-yellow-300 text-black scale-110' : ''}
                                `}>
                                    <span>{step.emoji}</span>
                                    <span>{step.word}</span>
                                </div>
                            </div>
                        ))}
                        
                        {/* Hint Display */}
                        {activeHint && (
                            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mx-auto max-w-sm text-center animate-fade-in my-4">
                                <p className="text-xs text-blue-300 uppercase font-bold mb-1">💡 DICA / HINT</p>
                                <p className="text-white text-lg font-bold mb-1">{activeHint.word}</p>
                                <p className="text-slate-400 text-sm italic">"{activeHint.reason}"</p>
                                <button 
                                    onClick={() => setInputValue(activeHint.word)} 
                                    className="mt-2 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded"
                                >
                                    Usar / Use
                                </button>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent z-20">
                        <div className="max-w-2xl mx-auto">
                            {won ? (
                                <button 
                                    onClick={loadGame}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/50 animate-bounce-short"
                                >
                                    {t.win} - {t.next}
                                </button>
                            ) : (
                                <div>
                                    {/* Feedback Area */}
                                    {(feedback || proximity !== null) && (
                                        <div className="mb-3 bg-slate-800 rounded-lg p-3 flex items-center justify-between border border-slate-700 animate-fade-in">
                                            <span className="text-slate-300 text-sm flex-1 mr-2">{feedback}</span>
                                            {proximity !== null && (
                                                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded">
                                                    <span className={`font-bold text-sm ${getProximityColor(proximity)}`}>
                                                        {getProximityText(proximity)}
                                                    </span>
                                                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full ${proximity < 25 ? 'bg-blue-500' : proximity < 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                            style={{ width: `${proximity}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="relative">
                                        <input 
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder={t.placeholder}
                                            disabled={validating}
                                            className="w-full bg-slate-800 border-2 border-slate-600 focus:border-emerald-500 text-white pl-4 pr-32 py-4 rounded-xl shadow-2xl focus:outline-none transition-colors"
                                            autoFocus
                                        />
                                        
                                        <div className="absolute right-2 top-2 bottom-2 flex gap-2">
                                            {!validating && (
                                                <button
                                                    type="button"
                                                    onClick={handleGetHint}
                                                    disabled={hintLoading}
                                                    className="bg-slate-700 hover:bg-slate-600 text-blue-300 px-3 rounded-lg font-bold text-lg disabled:opacity-50 transition-colors"
                                                    title={t.hintBtn}
                                                >
                                                    {hintLoading ? '...' : '💡'}
                                                </button>
                                            )}

                                            <button 
                                                type="submit" 
                                                disabled={!inputValue.trim() || validating}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                {validating ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : '➜'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            ) : (
                <div className="text-red-400 text-center">{t.error}</div>
            )}
        </div>
    );
};

export default LadderGame;