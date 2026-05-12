import { useState } from 'react';
import { ScreenHeader, PrimaryButton } from '../components/ui/Primitives';

const STEPS = [
  {
    title: 'Place your 12 cows',
    body: 'Each player takes turns placing one of their 12 cows on any empty intersection. No moving yet — just placing.',
  },
  {
    title: 'Form mills to capture',
    body: 'Three of your cows in a straight line — along a square edge or a midpoint connector — forms a mill. There are no diagonals.',
  },
  {
    title: 'Move along the lines',
    body: 'After all 24 cows are placed, slide one cow per turn along a connected line to an empty spot. Mills you form let you take an opponent\'s cow.',
  },
  {
    title: 'Fly when you have 3',
    body: 'When you\'re down to 3 cows, you can fly — move to any empty spot. Reduce your opponent to 2 to win.',
  },
];

export function TutorialScreen({ onBack }: { onBack: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];

  return (
    <div className="min-h-screen flex flex-col">
      <ScreenHeader title="How to play" onBack={onBack} />
      <div className="flex-1 px-5 mt-2 flex flex-col">
        <div className="flex gap-1 justify-center mb-6">
          {STEPS.map((_, idx) => (
            <span key={idx} className={`h-1 w-8 rounded-full ${idx === i ? 'bg-gold' : 'bg-cream/25'}`} />
          ))}
        </div>

        <div className="card p-6 flex-1 flex flex-col">
          <div className="text-gold display-font text-xs uppercase tracking-wider">Step {i + 1} of {STEPS.length}</div>
          <h2 className="display-font text-2xl text-cream mt-2">{step.title}</h2>
          <p className="text-cream/85 mt-3 leading-relaxed">{step.body}</p>
        </div>

        <div className="pt-5 pb-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setI((p) => Math.max(0, p - 1))}
            disabled={i === 0}
            className="btn-secondary disabled:opacity-40"
          >
            Back
          </button>
          {i < STEPS.length - 1 ? (
            <PrimaryButton onClick={() => setI((p) => p + 1)}>Next</PrimaryButton>
          ) : (
            <PrimaryButton onClick={onBack}>Got it</PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
