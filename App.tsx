import React, { useState, useEffect } from 'react';
import { GameType } from './types';
import AlchemyGame from './components/AlchemyGame';
import EmojiGame from './components/EmojiGame';
import DilemmaGame from './components/DilemmaGame';

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>(GameType.NONE);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const isPt = typeof navigator !== 'undefined' ? navigator.language.startsWith('pt') : true;

  // Verifica se já existe chave ao carregar
  useEffect(() => {
    const localKey = localStorage.getItem('gemini_api_key');
    const envKey = process.env.API_KEY; // Para desenvolvimento local
    if (localKey || (envKey && envKey.length > 0)) {
        setHasApiKey(true);
    }
  }, []);

  const handleSaveKey = (key: string) => {
      if (key && key.length > 10) {
          localStorage.setItem('gemini_api_key', key);
          setHasApiKey(true);
          window.location.reload(); // Recarrega para garantir que os serviços peguem a nova chave
      } else {
          alert(isPt ? "Chave inválida." : "Invalid Key.");
      }
  };

  if (!hasApiKey) {
      return <SetupScreen onSave={handleSaveKey} isPt={isPt} />;
  }

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
                {/* Botão para limpar a chave (Logout) */}
                <button 
                    onClick={() => {
                        localStorage.removeItem('gemini_api_key');
                        window.location.reload();
                    }}
                    className="text-xs text-slate-500 hover:text-red-400 underline"
                >
                    {isPt ? 'Mudar Chave API' : 'Change API Key'}
                </button>

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

// --- TELA DE SETUP ---
interface SetupScreenProps {
    onSave: (key: string) => void;
    isPt: boolean;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onSave, isPt }) => {
    const [inputKey, setInputKey] = useState('');

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
             
             <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl z-10 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mx-auto mb-4 text-3xl">
                        🌌
                    </div>
                    <h1 className="text-2xl font-bold text-white">Nebula Arcade</h1>
                    <p className="text-slate-400 text-sm mt-2">
                        {isPt ? "Configuração Inicial do Sistema" : "System Initial Setup"}
                    </p>
                </div>

                {/* Aviso para Streamers */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <h3 className="text-yellow-400 font-bold text-sm uppercase tracking-wider mb-1">
                            {isPt ? "Atenção: Gravando?" : "Warning: Recording?"}
                        </h3>
                        <p className="text-yellow-200/70 text-xs leading-relaxed">
                            {isPt 
                                ? "Se você estiver gravando ou transmitindo, oculte sua tela ou borre o campo abaixo. Sua chave API não deve ser compartilhada publicamente."
                                : "If you are recording or streaming, hide your screen or blur the field below. Your API Key should not be shared publicly."}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase mb-2 ml-1">
                            Google Gemini API Key
                        </label>
                        <input 
                            type="password" 
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono tracking-wider"
                        />
                         <p className="text-xs text-slate-500 mt-2 ml-1">
                            {isPt ? "A chave será salva no seu navegador." : "The key will be saved in your browser."}
                        </p>
                    </div>

                    <button 
                        onClick={() => onSave(inputKey)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg transform active:scale-95 transition-all"
                    >
                        {isPt ? "Salvar e Entrar" : "Save & Enter"}
                    </button>

                    <div className="text-center pt-4">
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                        >
                            {isPt ? "Obter chave gratuita no Google AI Studio →" : "Get free key at Google AI Studio →"}
                        </a>
                    </div>
                </div>
             </div>
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