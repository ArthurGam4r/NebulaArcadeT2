
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;

  // Ultra-robust detection for AI Studio platform selector
  const getAiStudio = () => {
      try {
          // Check current window, then parent, then top to cover all iframe nesting scenarios
          const found = (window as any).aistudio || 
                        (window.parent as any)?.aistudio || 
                        (window.top as any)?.aistudio;
          return found;
      } catch (e) {
          // Fallback if cross-origin policy prevents parent/top access
          return (window as any).aistudio;
      }
  };

  const checkAuth = async () => {
    setIsChecking(true);
    setAuthError(null);

    // 1. Check if Key is already injected (Automatic bypass for production)
    if (process.env.API_KEY && process.env.API_KEY.length > 5) {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }

    // 2. Check for AI Studio platform selector presence
    const aiStudio = getAiStudio();
    if (aiStudio) {
      try {
        const hasKey = await aiStudio.hasSelectedApiKey();
        setIsAuthenticated(hasKey);
      } catch (e) {
        console.error("Auth check failed:", e);
      }
    }
    setIsChecking(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async () => {
    const aiStudio = getAiStudio();
    
    if (aiStudio) {
      try {
        await aiStudio.openSelectKey();
        // Assume success to proceed immediately as per platform rules
        setIsAuthenticated(true);
      } catch (e) {
        setAuthError(isPt ? "Ocorreu um erro ao abrir o seletor oficial." : "An error occurred opening the official selector.");
      }
    } else {
        setAuthError(isPt 
            ? "O seletor oficial não foi detectado. Para permitir que jogadores acessem o site, configure a 'API_KEY' nas variáveis de ambiente do seu projeto." 
            : "Official selector not detected. To allow players to access, set 'API_KEY' in your project environment variables.");
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                {isPt ? "Sincronizando..." : "Synchronizing..."}
            </p>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-40"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

        <div className="max-w-md w-full text-center relative z-10 space-y-10 animate-fade-in">
          <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 flex items-center justify-center text-5xl mb-6 animate-bounce-slow">
                🌌
              </div>
              <h1 className="text-5xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                Nebula Arcade
              </h1>
              <p className="text-slate-400 text-lg">
                {isPt ? "Diversão infinita movida por IA." : "Infinite AI-powered fun."}
              </p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-3xl border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="space-y-3">
                <p className="text-sm font-medium text-slate-300">
                    {isPt ? "Conecte-se para liberar o acesso" : "Connect to unlock access"}
                </p>
                {authError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 leading-relaxed animate-shake text-left">
                        <strong>Erro de Conexão:</strong> {authError}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <button 
                  onClick={handleLogin}
                  className="w-full bg-white text-black font-black py-4 px-8 rounded-2xl hover:bg-slate-200 transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-3 text-lg"
                >
                  <span className="text-xl">✨</span>
                  {isPt ? "Acessar com Gemini" : "Access with Gemini"}
                </button>
                
                <button 
                  onClick={checkAuth}
                  className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-bold py-3 px-8 rounded-2xl border border-slate-700 transition-all text-sm"
                >
                  {isPt ? "Tentar Novamente" : "Try Again"}
                </button>
            </div>
          </div>

          <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
              {isPt 
                ? "Este arcade requer uma conexão com a API Gemini para gerar conteúdos em tempo real." 
                : "This arcade requires a Gemini API connection to generate content in real-time."}
          </p>
        </div>
      </div>
    );
  }

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
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    API ATIVA
                </div>

                {activeGame !== GameType.NONE && (
                    <button 
                        onClick={() => setActiveGame(GameType.NONE)}
                        className="text-sm font-medium text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-3 py-1.5 rounded-md hover:bg-slate-700 border border-slate-700"
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
