
import React, { useState, useMemo, useEffect } from 'react';
import { GameType } from './types';
import AlchemyGame from './components/AlchemyGame';
import EmojiGame from './components/EmojiGame';
import DilemmaGame from './components/DilemmaGame';
import LadderGame from './components/LadderGame';
import CipherGame from './components/CipherGame';
import ArenaGame from './components/ArenaGame';

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>(GameType.NONE);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('nebula_api_key') || '');
  
  const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;

  const saveKey = (key: string) => {
    localStorage.setItem('nebula_api_key', key);
    setApiKey(key);
    setShowKeyInput(false);
    // Reload to ensure all services use the new key
    window.location.reload();
  };

  const hasKey = !!(process.env.GEMINI_API_KEY || process.env.API_KEY || apiKey);

  // ARCADE MAIN UI
  const renderGame = () => {
    switch (activeGame) {
      case GameType.ALCHEMY: return <AlchemyGame />;
      case GameType.EMOJI: return <EmojiGame />;
      case GameType.DILEMMA: return <DilemmaGame />;
      case GameType.LADDER: return <LadderGame />;
      case GameType.CIPHER: return <CipherGame />;
      case GameType.ARENA: return <ArenaGame />;
      default: return <HomeGrid onSelect={setActiveGame} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0f172a]/80 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Header Content */}
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
                <button 
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className={`p-2 rounded-full transition-colors ${hasKey ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10 animate-pulse'}`}
                    title={isPt ? "Configurar API Key" : "Configure API Key"}
                >
                    <span className="text-xl">🔑</span>
                </button>

                {activeGame !== GameType.NONE && (
                    <button 
                        onClick={() => setActiveGame(GameType.NONE)}
                        className="text-sm font-medium text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-3 py-1.5 rounded-md hover:bg-slate-700 border border-slate-700"
                    >
                        ← {isPt ? 'Início' : 'Home'}
                    </button>
                )}
            </div>
        </div>

        {/* API KEY PANEL */}
        {showKeyInput && (
            <div className="bg-slate-900 border-b border-slate-800 animate-fade-in">
                <div className="max-w-4xl mx-auto p-6 flex flex-col items-center gap-4">
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-bold text-white">{isPt ? "Configuração da API Gemini" : "Gemini API Configuration"}</h3>
                        <p className="text-xs text-slate-400">{isPt ? "Insira sua chave para habilitar os recursos de IA." : "Insert your key to enable AI features."}</p>
                    </div>
                    <div className="flex w-full max-w-md gap-2">
                        <input 
                            type="password"
                            placeholder={isPt ? "Cole sua chave aqui..." : "Paste your key here..."}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                        />
                        <button 
                            onClick={() => saveKey(apiKey)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors"
                        >
                            {isPt ? "Salvar" : "Save"}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                        {isPt ? "Pegue sua chave em" : "Get your key at"}{" "}
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 underline italic">aistudio.google.com</a>
                    </p>
                </div>
            </div>
        )}
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="h-full w-full overflow-y-auto">
            {!hasKey && activeGame === GameType.NONE && (
                <div className="max-w-4xl mx-auto mt-8 px-4">
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
                        <div className="text-4xl">⚠️</div>
                        <div className="flex-1 text-center md:text-left">
                            <h4 className="font-bold text-amber-500 mb-1">{isPt ? "Atenção: API Key Necessária" : "Attention: API Key Required"}</h4>
                            <p className="text-sm text-amber-200/70 leading-relaxed font-medium">
                                {isPt 
                                    ? "Para os jogos funcionarem, você precisa configurar sua chave do Google Gemini. Clique na chave dourada no cabeçalho acima para começar."
                                    : "For the games to work, you need to configure your Google Gemini key. Click the golden key in the header above to start."
                                }
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowKeyInput(true)}
                            className="whitespace-nowrap bg-amber-500 hover:bg-amber-400 text-amber-950 font-black px-6 py-3 rounded-xl text-sm shadow-xl transition-all"
                        >
                            {isPt ? "CONFIGURAR AGORA" : "CONFIGURE NOW"}
                        </button>
                    </div>
                </div>
            )}
            {renderGame()}
        </div>
      </main>

      <footer className="py-6 border-t border-slate-800 text-center text-slate-500 text-xs relative z-10 bg-[#0f172a]">
        <p>Nebula Arcade &copy; 2025 • Gemini Powered • 🌌</p>
      </footer>
    </div>
  );
};

interface HomeGridProps {
  onSelect: (game: GameType) => void;
}

const HomeGrid: React.FC<HomeGridProps> = ({ onSelect }) => {
  const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;
  const [search, setSearch] = useState('');
  
  const gamesList = useMemo(() => [
    {
        id: GameType.ALCHEMY,
        title: isPt ? "Alquimia Neural" : "Neural Alchemy",
        description: isPt ? "Combine elementos para criar o universo." : "Combine elements to create the universe.",
        icon: "⚗️",
        color: "from-blue-500 to-cyan-400",
        tags: isPt ? ["Criatividade", "Alquimia"] : ["Creativity", "Alchemy"]
    },
    {
        id: GameType.EMOJI,
        title: isPt ? "Detetive de Emojis" : "Emoji Detective",
        description: isPt ? "Adivinhe a obra baseada nos emojis." : "Guess the work based on emojis.",
        icon: "🕵️‍♂️",
        color: "from-yellow-400 to-orange-500",
        tags: isPt ? ["Quiz", "Cultura Pop"] : ["Quiz", "Pop Culture"]
    },
    {
        id: GameType.DILEMMA,
        title: isPt ? "Dilema Absurdo" : "Absurd Dilemma",
        description: isPt ? "Escolhas morais impossíveis e hilárias." : "Impossible and hilarious moral choices.",
        icon: "⚖️",
        color: "from-pink-500 to-rose-500",
        tags: isPt ? ["Humor", "Social"] : ["Humor", "Social"]
    },
    {
        id: GameType.LADDER,
        title: isPt ? "Ponte Semântica" : "Semantic Bridge",
        description: isPt ? "Conecte palavras distantes degrau por degrau." : "Connect distant words step by step.",
        icon: "🪜",
        color: "from-amber-700 to-orange-800",
        tags: isPt ? ["Lógica", "Palavras"] : ["Logic", "Words"]
    },
    {
        id: GameType.CIPHER,
        title: isPt ? "Decodificador" : "Cipher Decoder",
        description: isPt ? "Descifre frases famosas bagunçadas pela IA." : "Decipher famous quotes messed up by AI.",
        icon: "📟",
        color: "from-green-600 to-emerald-600",
        tags: isPt ? ["Mistério", "Cyber"] : ["Mystery", "Cyber"],
        isNew: true
    },
    {
        id: GameType.ARENA,
        title: isPt ? "Arena de Sobrevivência" : "Survival Arena",
        description: isPt ? "Enfrente feras reais e mitológicas com estratégia." : "Face real and mythological beasts with strategy.",
        icon: "👹",
        color: "from-red-600 to-orange-600",
        tags: isPt ? ["RPG", "Estratégia"] : ["RPG", "Strategy"],
        isNew: true
    }
  ], [isPt]);

  const filteredGames = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return gamesList;
    return gamesList.filter(g => 
        g.title.toLowerCase().includes(q) || 
        g.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [search, gamesList]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
        <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                {isPt ? "Explore o Infinito" : "Explore the Infinite"}
            </h2>
            <div className="relative max-w-xl mx-auto group">
                <input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={isPt ? "Buscar jogo ou tag..." : "Search game or tag..."}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-full py-4 px-6 text-white outline-none focus:border-indigo-500 shadow-2xl transition-all"
                />
                <span className="absolute right-6 top-4 opacity-30 text-xl">🔍</span>
            </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            {filteredGames.map((game) => (
                <GameCard 
                    key={game.id}
                    game={game}
                    onClick={() => onSelect(game.id)}
                />
            ))}
        </div>
    </div>
  );
};

interface GameCardProps {
    game: any;
    onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative bg-slate-800/30 hover:bg-slate-800/60 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-8 text-left transition-all hover:-translate-y-2 h-full flex flex-col shadow-lg overflow-hidden"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.color} opacity-5 blur-3xl`}></div>
            
            {/* NOVO / NEW BADGE - RESTORED & IMPROVED */}
            {game.isNew && (
                <div className="absolute top-4 right-4 z-20">
                    <span className="bg-gradient-to-r from-yellow-400 to-amber-600 text-[10px] font-black px-2.5 py-1 rounded shadow-lg shadow-amber-900/40 text-black uppercase tracking-tighter animate-pulse border border-yellow-300/50">
                        Novo / New
                    </span>
                </div>
            )}

            <div className="text-5xl mb-6 bg-slate-900 w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
                {game.icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{game.title}</h3>
            <p className="text-slate-400 text-sm mb-6 flex-1 leading-relaxed">{game.description}</p>
            <div className="flex flex-wrap gap-2 mt-auto">
                {game.tags.map((tag: string) => (
                    <span key={tag} className="text-[10px] px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-wider">
                        {tag}
                    </span>
                ))}
            </div>
        </button>
    );
};

export default App;
