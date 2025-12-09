import React, { useState } from 'react';
import { GameType } from './types';
import AlchemyGame from './components/AlchemyGame';
import EmojiGame from './components/EmojiGame';
import DilemmaGame from './components/DilemmaGame';

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>(GameType.NONE);
  const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;

  const renderGame = () => {
    switch (activeGame) {
      case GameType.ALCHEMY:
        return <AlchemyGame />;
      case GameType.EMOJI:
        return <EmojiGame />;
      case GameType.DILEMMA:
        return <DilemmaGame />;
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

      <footer className="py-6 border-t border-slate-800 text-center text-slate-500 text-xs relative z-10 bg-[#0f172a]">
        <p>Powered by Gemini API • {isPt ? 'Criado com React & Tailwind' : 'Built with React & Tailwind'}</p>
      </footer>
    </div>
  );
};

interface HomeGridProps {
  onSelect: (game: GameType) => void;
}

const HomeGrid: React.FC<HomeGridProps> = ({ onSelect }) => {
  const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;
  
  const t = {
      heroTitle: isPt ? "Explore o Infinito" : "Explore the Infinite",
      heroSub: isPt ? "Mini-games gerados por inteligência artificial. Cada jogada é única." : "AI-generated mini-games. Every playthrough is unique.",
      alchemyTitle: isPt ? "Alquimia Neural" : "Neural Alchemy",
      alchemyDesc: isPt ? "Combine elementos para criar o universo. O que acontece se você misturar um Gato com um Computador?" : "Combine elements to create the universe. What happens if you mix a Cat with a Computer?",
      emojiTitle: isPt ? "Detetive de Emojis" : "Emoji Detective",
      emojiDesc: isPt ? "A IA transforma filmes e jogos em emojis. Você consegue decifrar o código?" : "AI transforms movies and games into emojis. Can you crack the code?",
      dilemmaTitle: isPt ? "Dilema Absurdo" : "Absurd Dilemma",
      dilemmaDesc: isPt ? "Escolhas morais impossíveis e hilárias geradas na hora. Descubra as consequências." : "Impossible and hilarious moral choices generated on the fly. Discover the consequences.",
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

        <div className="grid md:grid-cols-3 gap-6">
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
            className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-2xl p-6 text-left transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 blur-2xl rounded-full transform translate-x-10 -translate-y-10 group-hover:opacity-20 transition-opacity`}></div>
            
            <div className="text-4xl mb-4 bg-slate-900 w-16 h-16 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300">
                {title}
            </h3>
            
            <p className="text-slate-400 text-sm leading-relaxed">
                {description}
            </p>

            <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-white transition-colors">
                {playText} <span className="ml-2">→</span>
            </div>
        </button>
    )
}

export default App;