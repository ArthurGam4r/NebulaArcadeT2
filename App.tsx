
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
  
  const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;

  // Check if API key is available or previously selected
  useEffect(() => {
    const checkAuth = async () => {
      // If key is already in env, we are good
      if (process.env.API_KEY) {
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      // Fix: Use type assertion for aistudio to avoid conflicts with environment-provided global declarations
      // This resolves "All declarations of 'aistudio' must have identical modifiers" and type mismatch errors.
      const aiStudio = (window as any).aistudio;
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
    checkAuth();
  }, []);

  const handleLogin = async () => {
    // Fix: Access aistudio via window casting to resolve redeclaration issues in the environment
    const aiStudio = (window as any).aistudio;
    if (aiStudio) {
      try {
        await aiStudio.openSelectKey();
        // Rule: Assume success after opening dialog to avoid race conditions
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to open key selector:", e);
      }
    } else {
        alert(isPt ? "Ambiente não suportado para seleção de chave." : "Environment doesn't support key selection.");
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-purple-900/20 pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full animate-pulse delay-700"></div>

        <div className="max-w-md w-full text-center relative z-10 space-y-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/20 animate-bounce-slow">
            <span className="text-5xl">🌌</span>
          </div>
          
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
              Nebula Arcade
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              {isPt 
                ? "Conecte sua inteligência artificial para começar a jogar." 
                : "Connect your artificial intelligence to start playing."}
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleLogin}
              className="w-full bg-white text-black font-bold py-4 px-8 rounded-2xl hover:bg-slate-200 transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-3 text-lg"
            >
              <span>🔑</span>
              {isPt ? "Conectar Chave Gemini" : "Connect Gemini Key"}
            </button>
            
            <div className="pt-4 border-t border-slate-800">
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs text-slate-500 hover:text-indigo-400 underline underline-offset-4 transition-colors"
              >
                {isPt ? "Informações sobre faturamento e limites da API" : "Billing and API limit information"}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Arcade Content
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
                    API ONLINE
                </div>

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
        tags: isPt ? ["Criatividade", "Alquimia", "Infinito"] : ["Creativity", "Alchemy", "Infinite"]
    },
    {
        id: GameType.EMOJI,
        title: isPt ? "Detetive de Emojis" : "Emoji Detective",
        description: isPt ? "Adivinhe o filme baseado nos emojis." : "Guess the movie based on emojis.",
        icon: "🕵️‍♂️",
        color: "from-yellow-400 to-orange-500",
        tags: isPt ? ["Quiz", "Filmes", "Cultura Pop"] : ["Quiz", "Movies", "Pop Culture"]
    },
    {
        id: GameType.DILEMMA,
        title: isPt ? "Dilema Absurdo" : "Absurd Dilemma",
        description: isPt ? "Escolhas morais impossíveis e hilárias." : "Impossible and hilarious moral choices.",
        icon: "⚖️",
        color: "from-pink-500 to-rose-500",
        tags: isPt ? ["Humor", "Social", "Moral"] : ["Humor", "Social", "Moral"]
    },
    {
        id: GameType.LADDER,
        title: isPt ? "Ponte Semântica" : "Semantic Bridge",
        description: isPt ? "Conecte duas palavras distantes degrau por degrau." : "Connect two distant words step by step.",
        icon: "🪜",
        color: "from-amber-700 to-orange-800",
        tags: isPt ? ["Lógica", "Palavras", "Bridge"] : ["Logic", "Words", "Bridge"]
    },
    {
        id: GameType.CIPHER,
        title: isPt ? "Decodificador" : "Cipher Decoder",
        description: isPt ? "Descifre frases famosas bagunçadas pela IA." : "Decipher famous quotes messed up by AI.",
        icon: "📟",
        color: "from-green-600 to-emerald-600",
        tags: isPt ? ["Mistério", "Lógica", "Ciber"] : ["Mystery", "Logic", "Cyber"],
        isNew: true
    },
    {
        id: GameType.ARENA,
        title: isPt ? "Arena de Sobrevivência" : "Survival Arena",
        description: isPt ? "Como você enfrentaria feras reais e mitológicas?" : "How would you face real and mythological beasts?",
        icon: "👹",
        color: "from-red-600 to-orange-600",
        tags: isPt ? ["RPG", "Combate", "Estratégia"] : ["RPG", "Combat", "Strategy"],
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
            <h2 className="text-4xl md:text-6xl font-black mb-4">
                {isPt ? "Explore o Infinito" : "Explore the Infinite"}
            </h2>
            <div className="relative max-w-xl mx-auto group">
                <input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={isPt ? "Buscar jogo..." : "Search game..."}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-full py-4 px-6 text-white outline-none focus:border-indigo-500/50 shadow-xl"
                />
            </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
                <button 
                    key={game.id}
                    onClick={() => onSelect(game.id)}
                    className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-2xl p-6 text-left transition-all hover:-translate-y-1 h-full flex flex-col"
                >
                    <div className="text-4xl mb-4 bg-slate-900 w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        {game.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
                    <p className="text-slate-400 text-sm mb-4 flex-1">{game.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                        {game.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/50 text-slate-500 border border-slate-700">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </button>
            ))}
        </div>
    </div>
  );
};

export default App;
