
import React, { useState, useMemo } from 'react';
import { GameType } from './types';
import AlchemyGame from './components/AlchemyGame';
import EmojiGame from './components/EmojiGame';
import DilemmaGame from './components/DilemmaGame';
import LadderGame from './components/LadderGame';
import CipherGame from './components/CipherGame';
import ArenaGame from './components/ArenaGame';

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>(GameType.NONE);
  const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;

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
             <a href="https://ai.google.dev/pricing" target="_blank" rel="noreferrer" className="text-slate-700 hover:text-blue-400 underline">
                {isPt ? 'Limites & Preços' : 'Limits & Pricing'}
            </a>
        </div>
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

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    gamesList.forEach(g => g.tags.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [gamesList]);

  const filteredGames = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return gamesList;
    return gamesList.filter(g => 
        g.title.toLowerCase().includes(q) || 
        g.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [search, gamesList]);

  const t = {
      heroTitle: isPt ? "Explore o Infinito" : "Explore the Infinite",
      heroSub: isPt ? "Mini-games gerados por IA. Cada jogada é única." : "AI-generated mini-games. Every playthrough is unique.",
      searchPlaceholder: isPt ? "Buscar jogo ou tag..." : "Search game or tag...",
      play: isPt ? "Jogar Agora" : "Play Now",
      noResults: isPt ? "Nenhum jogo encontrado espacialmente..." : "No games found in this sector..."
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in">
        <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                {t.heroTitle}
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
                {t.heroSub}
            </p>

            <div className="relative max-w-xl mx-auto group">
                <div className="absolute inset-0 bg-blue-500/10 blur-xl group-focus-within:bg-purple-500/20 transition-all duration-500"></div>
                <div className="relative flex flex-col gap-4">
                    <div className="flex items-center">
                        <span className="absolute left-4 text-slate-500">🔍</span>
                        <input 
                            type="text" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="w-full bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full py-4 pl-12 pr-6 text-white outline-none focus:border-indigo-500/50 transition-all shadow-xl"
                        />
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-2">
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSearch(search === tag ? '' : tag)}
                                className={`text-[10px] px-3 py-1 rounded-full border transition-all ${
                                    search.toLowerCase() === tag.toLowerCase() 
                                    ? 'bg-indigo-600 border-indigo-400 text-white' 
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                                }`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {filteredGames.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGames.map((game) => (
                    <GameCard 
                        key={game.id}
                        title={game.title}
                        description={game.description}
                        icon={game.icon}
                        color={game.color}
                        tags={game.tags}
                        isNew={game.isNew}
                        playText={t.play}
                        onClick={() => onSelect(game.id)}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 animate-pulse">
                <span className="text-6xl mb-4 block">🛸</span>
                <p className="text-slate-500 font-medium">{t.noResults}</p>
                <button onClick={() => setSearch('')} className="mt-4 text-blue-400 hover:underline">Ver todos / See all</button>
            </div>
        )}
    </div>
  );
};

interface GameCardProps {
    title: string;
    description: string;
    icon: string;
    color: string;
    tags: string[];
    isNew?: boolean;
    playText: string;
    onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ title, description, icon, color, tags, isNew, playText, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-2xl p-6 text-left transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden h-full flex flex-col"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 blur-2xl rounded-full transform translate-x-10 -translate-y-10 group-hover:opacity-20 transition-opacity`}></div>
            
            {isNew && (
                <div className="absolute top-4 right-4 animate-pulse">
                    <span className="bg-gradient-to-r from-yellow-400 to-amber-600 text-[10px] font-black px-2 py-1 rounded shadow-lg shadow-amber-900/50 text-black uppercase tracking-tighter">
                        Novo / New
                    </span>
                </div>
            )}

            <div className="text-4xl mb-4 bg-slate-900 w-16 h-16 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300">
                {title}
            </h3>
            
            <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">
                {description}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-6">
                {tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/50 text-slate-500 border border-slate-700 group-hover:border-slate-600 group-hover:text-slate-300 transition-colors">
                        #{tag}
                    </span>
                ))}
            </div>

            <div className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-white transition-colors mt-auto">
                {playText} <span className="ml-2">→</span>
            </div>
        </button>
    )
}

export default App;
