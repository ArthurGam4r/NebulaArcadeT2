import React, { useState, useEffect } from 'react';
import { CipherChallenge } from '../types';
import { generateCipherChallenge, removeApiKey } from '../services/geminiService';

const CipherGame: React.FC = () => {
    const [challenge, setChallenge] = useState<CipherChallenge | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'FAIL'>('IDLE');
    const [quotaError, setQuotaError] = useState(false);
    const [showRule, setShowRule] = useState(false);

    // Localization
    const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;
    const t = {
        title: isPt ? "Decodificador Críptico" : "Cryptic Decoder",
        desc: isPt ? "A IA bagunçou a frase. Use a lógica para consertar." : "AI messed up the phrase. Use logic to fix it.",
        loading: isPt ? "Encriptando dados..." : "Encrypting data...",
        category: isPt ? "Categoria:" : "Category:",
        rule: isPt ? "Regra de Encriptação:" : "Encryption Rule:",
        revealRule: isPt ? "Revelar Regra (Dica)" : "Reveal Rule (Hint)",
        placeholder: isPt ? "Digite a frase original..." : "Type original phrase...",
        submit: isPt ? "Decodificar" : "Decode",
        next: isPt ? "Próximo Arquivo" : "Next File",
        success: isPt ? "Acesso Concedido!" : "Access Granted!",
        fail: isPt ? "Acesso Negado." : "Access Denied.",
        giveUp: isPt ? "Desistir" : "Give Up",
        was: isPt ? "A frase era:" : "The phrase was:",
        quotaMsg: isPt ? "Limite diário da API atingido!" : "Daily API quota exceeded!",
        changeKey: isPt ? "Trocar Chave API" : "Change API Key"
    };

    const loadGame = async () => {
        setLoading(true);
        setStatus('IDLE');
        setInputValue('');
        setShowRule(false);
        setQuotaError(false);
        setChallenge(null);

        try {
            const data = await generateCipherChallenge();
            if (data) {
                setChallenge(data);
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

    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!challenge) return;

        const guess = normalize(inputValue);
        const answer = normalize(challenge.original);

        if (guess === answer) {
            setStatus('SUCCESS');
        } else {
            setStatus('FAIL');
        }
    };

    const handleGiveUp = () => {
        if (!challenge) return;
        setInputValue(challenge.original);
        setStatus('FAIL');
    }

    const handleChangeKey = () => {
        removeApiKey();
        window.location.reload();
    }

    if (quotaError) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto p-8 animate-fade-in text-center font-mono text-green-500">
               <div className="text-6xl mb-4">🛑</div>
               <h2 className="text-2xl font-bold text-red-500 mb-2">{t.quotaMsg}</h2>
               <button 
                  onClick={handleChangeKey}
                  className="bg-red-600 hover:bg-red-500 text-black font-bold py-3 px-8 rounded border border-red-400 transition-colors mt-4"
              >
                  {t.changeKey}
              </button>
          </div>
        )
    }

    return (
        <div className="flex flex-col items-center h-full max-w-3xl mx-auto p-6 animate-fade-in font-mono">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-green-500 tracking-wider uppercase border-b border-green-500/30 pb-2 inline-block">
                    {t.title}
                </h2>
                <p className="text-green-500/60 text-sm mt-2">{t.desc}</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-12">
                     <div className="font-mono text-green-500 animate-pulse text-xl">
                        {t.loading}
                        <br/>
                        <span className="text-xs">Processing...</span>
                     </div>
                </div>
            ) : challenge ? (
                <div className="w-full bg-black border border-green-500/50 p-6 rounded-sm shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                    
                    {/* Metadata Header */}
                    <div className="flex justify-between items-center border-b border-green-500/30 pb-4 mb-6">
                        <span className="text-xs text-green-500/50 uppercase tracking-widest">{t.category} <span className="text-green-400">{challenge.category}</span></span>
                        <div className="flex gap-2">
                             <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                             <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                             <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                    </div>

                    {/* The Encrypted Text */}
                    <div className="bg-green-900/10 p-6 mb-6 rounded border-l-4 border-green-500">
                        <p className="text-2xl md:text-3xl font-bold text-green-300 font-mono break-words leading-relaxed select-none">
                            {challenge.encrypted}
                        </p>
                    </div>

                    {/* Rule/Hint Toggle */}
                    <div className="mb-6 flex justify-center">
                        {showRule ? (
                            <div className="bg-green-500/10 px-4 py-2 rounded border border-green-500/30 text-green-400 text-sm animate-fade-in">
                                <span className="font-bold mr-2">root@system:~$</span>
                                {t.rule} <span className="text-white bg-green-900/50 px-2 py-0.5 rounded">{challenge.rule}</span>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setShowRule(true)}
                                className="text-xs text-green-500/70 hover:text-green-400 border border-green-500/30 px-3 py-1 rounded hover:bg-green-500/10 transition-colors"
                            >
                                [ {t.revealRule} ]
                            </button>
                        )}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500/50 font-bold">{">"}</span>
                            <input 
                                type="text"
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    if (status !== 'IDLE') setStatus('IDLE');
                                }}
                                disabled={status === 'SUCCESS'}
                                placeholder={t.placeholder}
                                className={`w-full bg-black border ${status === 'FAIL' ? 'border-red-500 text-red-400' : 'border-green-500/50 text-green-400'} rounded p-4 pl-8 focus:outline-none focus:border-green-400 focus:shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all font-mono text-lg`}
                                autoFocus
                            />
                        </div>

                        {status === 'SUCCESS' && (
                            <div className="text-center p-4 bg-green-500/20 border border-green-500 text-green-300 rounded animate-bounce-short">
                                {t.success}
                            </div>
                        )}

                        {status === 'FAIL' && inputValue.length > 0 && (
                             <div className="text-center text-red-400 text-sm font-bold animate-shake">
                                {t.fail}
                             </div>
                        )}

                        <div className="flex gap-3 justify-center mt-2">
                             {status === 'SUCCESS' ? (
                                <button 
                                    type="button"
                                    onClick={loadGame}
                                    className="bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-8 rounded shadow-lg transition-transform hover:scale-105"
                                >
                                    {t.next}
                                </button>
                             ) : (
                                <>
                                    <button 
                                        type="button"
                                        onClick={handleGiveUp}
                                        className="text-green-500/50 hover:text-red-400 text-sm px-4 py-3"
                                    >
                                        {t.giveUp}
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={!inputValue.trim()}
                                        className="bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/50 font-bold py-3 px-8 rounded transition-all disabled:opacity-50"
                                    >
                                        {t.submit}
                                    </button>
                                </>
                             )}
                        </div>
                    </form>
                </div>
            ) : (
                <div className="text-red-500">Error. System Failure.</div>
            )}
        </div>
    );
};

export default CipherGame;