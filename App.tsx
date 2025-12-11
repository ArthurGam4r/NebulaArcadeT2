import React, { useState, useEffect } from 'react';
import { GameType } from './types';
import AlchemyGame from './components/AlchemyGame';
import EmojiGame from './components/EmojiGame';
import DilemmaGame from './components/DilemmaGame';
import LadderGame from './components/LadderGame';
import CipherGame from './components/CipherGame';
import { hasApiKey, setApiKey, removeApiKey } from './services/geminiService';

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>(GameType.NONE);
  const [apiKeySet, setApiKeySet] = useState<boolean>(false);
  
  const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;

  useEffect(() => {
    setApiKeySet(hasApiKey());
  }, []);

  const handleSetKey = (key: string) => {
    if (key.trim().length > 10) {
        setApiKey(key);
        setApiKeySet(true);
    }
  };

  const handleResetKey = () => {
      // Direct reset without window.confirm if possible, or simple reload
      removeApiKey();
      window.location.reload();
  };

  if (!apiKeySet) {
      return <SetupScreen onSave={handleSetKey} isPt={isPt} />;
  }

  const renderGame = () => {
    switch (activeGame) {
      case GameType.ALCHEMY:
        return <AlchemyGame />;
      case GameType.EMOJI:
        return <EmojiGame />;
      case GameType.DILEMMA:
        return <DilemmaGame />;
      case GameType.LADDER:
        return <LadderGame />;
      case GameType.CIPHER:
        return <CipherGame />;
      default:
        return <HomeGrid onSelect={setActiveGame} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0f172a]/80 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setActiveGame(GameType.NONE)}
            >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                    <span className="text-lg">🌌</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-purple-300 transition-colors">Nebula Arcade</h1>
            </div>
            
            <div className="flex items-center gap-4">
                {activeGame !== GameType.NONE && (
                    <button 
                        onClick={() => setActiveGame(GameType.NONE)}
                        className="text-sm font-medium text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-3 py-1.5 rounded-md hover:bg-slate-700"
                    >
                        ← {isPt ? 'Voltar' : 'Back'}
                    </button>
                )}
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="h-full w-full overflow-y-auto">
            {renderGame()}
        </div>
      </main>

      <footer className="py-6 border-t border-slate-800 text-center text-slate-500 text-xs relative z-10 bg-[#0f172a] flex flex-col gap-2 items-center">
        <p>Powered by Gemini API • {isPt ? 'Criado com React & Tailwind' : 'Built with React & Tailwind'}</p>
        <div className="flex gap-4">
            <button 
                onClick={handleResetKey}
                className="text-slate-700 hover:text-red-400 underline cursor-pointer"
            >
                {isPt ? 'Trocar Chave API' : 'Change API Key'}
            </button>
            <span className="text-slate-700">|</span>
             <a href="https://ai.google.dev/pricing" target="_blank" rel="noreferrer" className="text-slate-700 hover:text-blue-400 underline">
                {isPt ? 'Limites & Preços' : 'Limits & Pricing'}
            </a>
        </div>
      </footer>
    </div>
  );
};

// --- Setup Screen Component ---

const SetupScreen: React.FC<{onSave: (k: string) => void, isPt: boolean}> = ({ onSave, isPt }) => {
    const [input, setInput] = useState('');

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-2">🌌</div>
                    <h1 className="text-2xl font-bold text-white">Nebula Arcade</h1>
                    <p className="text-slate-400 text-sm mt-2">
                        {isPt ? 'Configuração Inicial' : 'Initial Setup'}
                    </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg mb-6">
                    <h3 className="text-yellow-500 font-bold text-sm mb-1 uppercase tracking-wide">
                        {isPt ? '⚠️ Atenção Streamers' : '⚠️ Streamer Warning'}
                    </h3>
                    <p className="text-yellow-200/80 text-xs leading-relaxed">
                        {isPt 
                         ? 'Se você estiver gravando, oculte esta tela. Sua chave API dá acesso à sua cota do Google Gemini.' 
                         : 'If recording, hide this screen. Your API key provides access to your Google Gemini quota.'}
                    </p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSave(input); }} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-xs uppercase font-bold mb-2">
                            Gemini API Key
                        </label>
                        <input 
                            type="password" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={input.length < 10}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-lg transition-all"
                    >
                        {isPt ? 'Salvar e Jogar' : 'Save & Play'}
                    </button>
                </form>

                <p className="text-center mt-6 text-xs text-slate-500">
                    {isPt ? 'A chave é salva apenas no seu navegador.' : 'Key is stored locally in your browser.'}
                    <br/>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline mt-1 inline-block">
                        {isPt ? 'Obter chave gratuita aqui' : 'Get free key here'}
                    </a>
                </p>
            </div>
        </div>
    )
}

interface HomeGridProps {
  onSelect: (game: GameType) => void;
}

const HomeGrid: React.FC<HomeGridProps> = ({ onSelect }) => {
  const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;
  
  const t = {
      heroTitle: isPt ? "Explore o Infinito" : "Explore the Infinite",
      heroSub: isPt ? "Mini-games gerados por inteligência artificial. Cada jogada é única." : "AI-generated mini-games. Every playthrough is unique.",
      alchemyTitle: isPt ? "Alquimia Neural" : "Neural Alchemy",
      alchemyDesc: isPt ? "Combine elementos para criar o universo." : "Combine elements to create the universe.",
      emojiTitle: isPt ? "Detetive de Emojis" : "Emoji Detective",
      emojiDesc: isPt ? "Adivinhe o filme baseado nos emojis." : "Guess the movie based on emojis.",
      dilemmaTitle: isPt ? "Dilema Absurdo" : "Absurd Dilemma",
      dilemmaDesc: isPt ? "Escolhas morais impossíveis e hilárias." : "Impossible and hilarious moral choices.",
      ladderTitle: isPt ? "Ponte Semântica" : "Semantic Bridge",
      ladderDesc: isPt ? "Conecte duas palavras distantes degrau por degrau." : "Connect two distant words step by step.",
      cipherTitle: isPt ? "Decodificador" : "Cipher Decoder",
      cipherDesc: isPt ? "Descifre frases famosas bagunçadas pela IA." : "Decipher famous quotes messed up by AI.",
      play: isPt ? "Jogar Agora" : "Play Now"
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
        <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                {t.heroTitle}
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                {t.heroSub}
            </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
            <GameCard 
                title={t.alchemyTitle}
                description={t.alchemyDesc}
                icon="⚗️"
                color="from-blue-500 to-cyan-400"
                playText={t.play}
                onClick={() => onSelect(GameType.ALCHEMY)}
            />
            <GameCard 
                title={t.emojiTitle}
                description={t.emojiDesc}
                icon="🕵️‍♂️"
                color="from-yellow-400 to-orange-500"
                playText={t.play}
                onClick={() => onSelect(GameType.EMOJI)}
            />
            <GameCard 
                title={t.dilemmaTitle}
                description={t.dilemmaDesc}
                icon="⚖️"
                color="from-pink-500 to-rose-500"
                playText={t.play}
                onClick={() => onSelect(GameType.DILEMMA)}
            />
            <GameCard 
                title={t.ladderTitle}
                description={t.ladderDesc}
                icon="🪜"
                color="from-amber-700 to-orange-800"
                playText={t.play}
                onClick={() => onSelect(GameType.LADDER)}
            />
            <GameCard 
                title={t.cipherTitle}
                description={t.cipherDesc}
                icon="📟"
                color="from-green-600 to-emerald-600"
                playText={t.play}
                onClick={() => onSelect(GameType.CIPHER)}
            />
        </div>
    </div>
  );
};

interface GameCardProps {
    title: string;
    description: string;
    icon: string;
    color: string;
    playText: string;
    onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ title, description, icon, color, playText, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-2xl p-6 text-left transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden h-full flex flex-col"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 blur-2xl rounded-full transform translate-x-10 -translate-y-10 group-hover:opacity-20 transition-opacity`}></div>
            
            <div className="text-4xl mb-4 bg-slate-900 w-16 h-16 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300">
                {title}
            </h3>
            
            <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">
                {description}
            </p>

            <div className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-white transition-colors mt-auto">
                {playText} <span className="ml-2">→</span>
            </div>
        </button>
    )
}

export default App;