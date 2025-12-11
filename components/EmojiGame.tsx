import React, { useState, useEffect, useRef } from 'react';
import { EmojiChallenge } from '../types';
import { generateEmojiChallengeBatch, removeApiKey } from '../services/geminiService';

const EmojiGame: React.FC = () => {
  const [challenge, setChallenge] = useState<EmojiChallenge | null>(null);
  const [guess, setGuess] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'WRONG' | 'REVEAL' | 'QUOTA'>('IDLE');
  
  // Game State - Load history
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('emoji_history');
        return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // --- QUEUE SYSTEM ---
  // Stores prefetched challenges to avoid API calls on every next
  const [queue, setQueue] = useState<EmojiChallenge[]>([]);
  const queueRef = useRef<EmojiChallenge[]>([]); // Ref to access current queue in async funcs

  const [streak, setStreak] = useState(0);
  const [hintsRevealedCount, setHintsRevealedCount] = useState(0);
  const [xp, setXp] = useState(0);

  const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;
  const t = {
      title: isPt ? "Detetive de Emojis" : "Emoji Detective",
      rank: isPt ? "Rank" : "Rank",
      debt: isPt ? "Devedor" : "Debtor",
      beginner: isPt ? "Iniciante" : "Beginner",
      observer: isPt ? "Observador" : "Observer",
      movieBuff: isPt ? "Cinéfilo" : "Movie Buff",
      detective: isPt ? "Detetive" : "Detective",
      master: isPt ? "Mestre" : "Master",
      negativeWarning: isPt ? "Sua reputação está negativa! Acerte para recuperar." : "Your reputation is negative! Guess right to recover.",
      loading: isPt ? "Criando enigma inédito..." : "Creating unique puzzle...",
      correct: isPt ? "Correto!" : "Correct!",
      was: isPt ? "A resposta era:" : "The answer was:",
      next: isPt ? "Próximo Nível (+20 XP)" : "Next Level (+20 XP)",
      nextLose: isPt ? "Próximo Desafio" : "Next Challenge",
      placeholder: isPt ? "Que obra é essa?" : "What title is this?",
      wrong: isPt ? "Incorreto! Tente novamente ou peça uma dica." : "Wrong! Try again or buy a hint.",
      buyHint: isPt ? "Comprar Dica" : "Buy Hint",
      answerBtn: isPt ? "Responder" : "Submit Answer",
      skip: isPt ? "Desistir e Pular (-20 XP)" : "Give up & Skip (-20 XP)",
      error: isPt ? "Erro ao carregar. Tente recarregar." : "Error loading. Try reloading.",
      failTitle: isPt ? "Que pena!" : "Too bad!",
      resetHistory: isPt ? "Limpar Histórico" : "Clear History",
      quotaMsg: isPt ? "Limite diário da API atingido!" : "Daily API quota exceeded!",
      changeKey: isPt ? "Trocar Chave API" : "Change API Key"
  };

  useEffect(() => {
      localStorage.setItem('emoji_history', JSON.stringify(history));
  }, [history]);

  // Keep ref synced
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const loadNextChallenge = async (currentHistory: string[] = history) => {
    setStatus('LOADING');
    setHintsRevealedCount(0);
    setGuess('');
    
    // 1. Check Queue first
    if (queueRef.current.length > 0) {
        console.log("Serving from Cache/Queue. Items left:", queueRef.current.length - 1);
        const next = queueRef.current[0];
        setChallenge(next);
        setQueue(prev => prev.slice(1));
        setStatus('IDLE');
        return;
    }

    // 2. Fetch Batch if queue empty
    console.log("Queue empty. Fetching batch from API...");
    try {
        const batch = await generateEmojiChallengeBatch(currentHistory);
        
        if (batch && batch.length > 0) {
            // Check duplicates against history just in case
            const validBatch = batch.filter(item => !currentHistory.includes(item.answer));
            
            if (validBatch.length > 0) {
                const first = validBatch[0];
                const rest = validBatch.slice(1);
                
                setChallenge(first);
                setQueue(rest);
                setStatus('IDLE');
            } else {
                // Rare case: AI returned all duplicates. Retry once.
                 setStatus('IDLE'); // Simple failover
            }
        } else {
             setStatus('IDLE');
        }
    } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
            setStatus('QUOTA');
        } else {
            console.error(e);
            setStatus('IDLE');
        }
    }
  };

  useEffect(() => {
    loadNextChallenge(history);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleNextLevel = () => {
      loadNextChallenge(history);
  }

  const adjustXp = (amount: number) => {
    setXp(prev => prev + amount);
  };

  const getLevelTitle = (currentXp: number) => {
    if (currentXp < 0) return t.debt;
    if (currentXp < 100) return t.beginner;
    if (currentXp < 300) return t.observer;
    if (currentXp < 600) return t.movieBuff;
    if (currentXp < 1000) return t.detective;
    return t.master;
  };

  const getNextHintCost = () => {
    return (hintsRevealedCount + 1) * 5;
  }

  const handleHint = () => {
    if (challenge && hintsRevealedCount < challenge.hints.length) {
        const cost = getNextHintCost();
        adjustXp(-cost);
        setHintsRevealedCount(prev => prev + 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    if (!guess.trim()) return;

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (normalize(guess).includes(normalize(challenge.answer)) || normalize(challenge.answer).includes(normalize(guess))) {
      setStatus('SUCCESS');
      setStreak(s => s + 1);
      
      setHistory(prev => {
          if (!prev.includes(challenge.answer)) {
              return [...prev, challenge.answer];
          }
          return prev;
      });

      adjustXp(20);
    } else {
      setStatus('WRONG');
      setStreak(0);
      adjustXp(-10);
    }
  };

  const handleSkip = () => {
      if (!challenge) return;
      setStreak(0);
      adjustXp(-20);
      setStatus('REVEAL');
      
      setHistory(prev => {
        if (!prev.includes(challenge.answer)) {
            return [...prev, challenge.answer];
        }
        return prev;
    });
  }

  const clearHistory = () => {
      setHistory([]);
      localStorage.removeItem('emoji_history');
      window.location.reload();
  }

  const handleChangeKey = () => {
      removeApiKey();
      window.location.reload();
  }

  const levelTitle = getLevelTitle(xp);
  const barPercentage = xp < 0 ? 0 : (xp % 100); 

  const getBarColor = () => {
      if (xp < 0) return 'bg-red-600';
      if (xp < 200) return 'bg-slate-500';
      if (xp < 500) return 'bg-yellow-500';
      if (xp < 800) return 'bg-orange-500';
      return 'bg-purple-500';
  };

  if (status === 'QUOTA') {
      return (
        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto p-8 animate-fade-in text-center">
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
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-4 animate-fade-in">
      <div className="text-center mb-6 w-full relative">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
          {t.title}
        </h2>

        <button onClick={clearHistory} className="absolute top-0 right-0 text-[10px] text-slate-600 hover:text-slate-400 uppercase tracking-widest">
            {t.resetHistory}
        </button>
        
        <div className="mt-4 max-w-md mx-auto">
            <div className="flex justify-between text-xs uppercase font-bold tracking-wider mb-1">
                <span className={xp < 0 ? "text-red-400" : "text-slate-400"}>
                    {t.rank}: <span className="text-white">{levelTitle}</span>
                </span>
                <span className={xp < 0 ? "text-red-500 font-bold" : "text-slate-400"}>
                    {xp} XP
                </span>
            </div>
            <div className={`h-3 w-full bg-slate-800 rounded-full overflow-hidden border ${xp < 0 ? 'border-red-900/50' : 'border-slate-700'}`}>
                <div 
                    className={`h-full transition-all duration-700 ease-out ${getBarColor()}`}
                    style={{ width: xp < 0 ? '100%' : `${barPercentage}%`, opacity: xp < 0 ? 0.3 : 1 }}
                ></div>
            </div>
             {xp < 0 && <p className="text-[10px] text-red-400 mt-1">{t.negativeWarning}</p>}
        </div>
      </div>

      <div className="w-full bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl relative">
        <div className="absolute top-4 right-4 bg-slate-900 px-3 py-1 rounded-full text-xs font-mono text-yellow-500 border border-yellow-500/30">
            Streak: {streak} 🔥
        </div>

        {status === 'LOADING' ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-400 animate-pulse">{t.loading}</p>
          </div>
        ) : challenge ? (
          <div className="flex flex-col items-center gap-6">
            <div className="text-5xl md:text-7xl tracking-widest animate-bounce-slow py-4 text-center leading-relaxed">
              {challenge.emojis}
            </div>

            <div className="w-full flex flex-col gap-2">
                {challenge.hints.slice(0, hintsRevealedCount).map((hint, idx) => (
                    <div key={idx} className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 px-4 py-2 rounded-lg text-sm flex items-start gap-2 animate-fade-in">
                        <span className="bg-yellow-500/20 text-yellow-500 text-xs font-bold px-1.5 py-0.5 rounded mt-0.5">{idx + 1}</span>
                        {hint}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
               {status === 'SUCCESS' ? (
                 <div className="bg-green-500/20 border border-green-500 rounded-lg p-6 text-center animate-fade-in">
                    <p className="text-green-400 font-bold text-2xl mb-2">{t.correct}</p>
                    <p className="text-white text-lg mb-4">{t.was} <span className="font-bold">{challenge.answer}</span></p>
                    <button 
                        type="button"
                        onClick={handleNextLevel}
                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-bold transition-transform transform hover:scale-105 shadow-lg shadow-green-900/50"
                    >
                        {t.next}
                    </button>
                 </div>
               ) : status === 'REVEAL' ? (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 text-center animate-fade-in">
                   <p className="text-red-400 font-bold text-2xl mb-2">{t.failTitle}</p>
                   <p className="text-white text-lg mb-4">{t.was} <span className="font-bold text-red-300">{challenge.answer}</span></p>
                   <button 
                       type="button"
                       onClick={handleNextLevel}
                       className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-full font-bold transition-transform transform hover:scale-105 shadow-lg shadow-red-900/50"
                   >
                       {t.nextLose}
                   </button>
                </div>
              ) : (
                 <>
                    <input 
                        type="text" 
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder={t.placeholder}
                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-yellow-500 transition-colors text-center text-lg"
                        autoFocus
                    />
                    
                    {status === 'WRONG' && (
                        <p className="text-red-400 text-center text-sm font-bold animate-shake">{t.wrong}</p>
                    )}

                    <div className="flex flex-col gap-3 mt-2">
                        {hintsRevealedCount < 5 && (
                            <button 
                                type="button" 
                                onClick={handleHint}
                                className="text-sm text-slate-400 hover:text-yellow-400 transition-colors flex items-center justify-center gap-2 py-2 border border-dashed border-slate-700 rounded-lg hover:border-yellow-500/50 hover:bg-yellow-500/5"
                            >
                                <span>💡 {t.buyHint} {hintsRevealedCount + 1}/5</span>
                                <span className="text-xs font-mono bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">-{getNextHintCost()} XP</span>
                            </button>
                        )}
                        
                        <div className="flex gap-2">
                             <button 
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold py-3 px-6 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-orange-900/20"
                            >
                                {t.answerBtn}
                            </button>
                        </div>

                         <button
                            type="button"
                            onClick={handleSkip}
                            className="text-slate-600 hover:text-slate-400 text-xs mt-2"
                        >
                            {t.skip}
                        </button>
                    </div>
                 </>
               )}
            </form>
          </div>
        ) : (
            <div className="text-center text-red-400">{t.error}</div>
        )}
      </div>
    </div>
  );
};

export default EmojiGame;