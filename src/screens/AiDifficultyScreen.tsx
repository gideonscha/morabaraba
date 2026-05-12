import { ScreenHeader, PrimaryButton } from '../components/ui/Primitives';
import { useGameStore } from '../store/gameStore';

interface Props { onBack: () => void; onStart: () => void; }
export function AiDifficultyScreen({ onBack, onStart }: Props) {
  const newGame = useGameStore((s) => s.newGame);

  const start = (mode: 'ai_easy' | 'ai_medium' | 'ai_hard') => {
    newGame(mode, 'p1');
    onStart();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ScreenHeader title="Play vs AI" onBack={onBack} />
      <div className="px-5 mt-4 space-y-3">
        <Card title="Easy" desc="Random moves. Great for first games." reward="+5 coins per win" onSelect={() => start('ai_easy')} />
        <Card title="Medium" desc="Plays mills and blocks yours." reward="+10 coins per win" onSelect={() => start('ai_medium')} />
        <Card title="Hard" desc="Minimax — plays to win." reward="+20 coins per win" onSelect={() => start('ai_hard')} />
      </div>
    </div>
  );
}

function Card({ title, desc, reward, onSelect }: { title: string; desc: string; reward: string; onSelect: () => void }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="display-font text-xl text-gold">{title}</h2>
        <span className="text-cream/70 text-xs">{reward}</span>
      </div>
      <p className="text-cream/80 text-sm mb-3">{desc}</p>
      <PrimaryButton onClick={onSelect}>Start</PrimaryButton>
    </div>
  );
}
