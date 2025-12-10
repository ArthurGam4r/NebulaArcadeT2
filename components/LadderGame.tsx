import React, { useState, useEffect, useRef } from 'react';
import { LadderChallenge } from '../types';
import { generateLadderChallenge, validateLadderStep } from '../services/geminiService';

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
    const [won, setWon] = useState(false);

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
        error: isPt ? "Erro ao conectar" : "Connection failed"
    };

    const loadGame = async () => {
        setLoading(true);
        setWon(false);
        setSteps([]);
        setFeedback(null);
        setInputValue('');
        const data = await generateLadderChallenge();
        if (data) {
            setChallenge(data);
            setSteps([{ word: data.startWord, emoji: data.startEmoji }]);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadGame();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [steps]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !challenge || validating || won) return;

        setValidating(true);
        setFeedback(null);

        const currentWord = steps[steps.length - 1].word;
        const guess = inputValue.trim();

        // Check if direct win
        if (guess.toLowerCase() === challenge.endWord.toLowerCase()) {
            setSteps(prev => [...prev, { word: challenge.endWord, emoji: challenge.endEmoji }]);
            setWon(true);
            setValidating(false);
            setInputValue('');
            return;
        }

        const result = await validateLadderStep(currentWord, challenge.endWord, guess);

        if (result.isValid) {
            setSteps(prev => [...prev, { word: guess, emoji: result.emoji || '🔗' }]);
            setInputValue('');
        } else {
            setFeedback(result.message);
        }

        setValidating(false);
    };

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
                    <div className="flex flex-col gap-2 min-h-[300px] pb-32">
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
                                    <button 
                                        type="submit" 
                                        disabled={!inputValue.trim() || validating}
                                        className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {validating ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : '➜'}
                                    </button>
                                </form>
                            )}
                            
                            {feedback && (
                                <div className="text-red-400 text-center text-sm mt-2 font-medium animate-shake bg-red-900/20 py-2 rounded-lg">
                                    {feedback}
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