import { useState } from 'react';
import { PhoneFrame, PrimaryButton } from '../components/ui/Primitives';

type Step = 'placing' | 'mill' | 'moving' | 'flying';
const STEPS: Step[] = ['placing', 'mill', 'moving', 'flying'];

const COPY: Record<Step, { title: string; body: string }> = {
  placing: {
    title: 'Place Your Pieces',
    body: 'Tap any empty point to place your cow on the board. Each player has 12 cows to place.',
  },
  mill: {
    title: 'Form A Mill',
    body: "Get 3 in a row to form a mill, then remove one of your opponent's cows from the board.",
  },
  moving: {
    title: 'Move Your Pieces',
    body: 'Once all pieces are placed, slide your cows along the lines to adjacent empty spots to keep forming mills.',
  },
  flying: {
    title: 'Flying',
    body: 'When reduced to 3 cows, a desperate warrior may jump to any empty point on the board.',
  },
};

export function TutorialScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>('placing');
  const idx = STEPS.indexOf(step);
  const isLast = idx === STEPS.length - 1;

  return (
    <PhoneFrame>
      <div className="screen tutorial"
           style={{
             padding: '60px 24px 24px', flex: 1,
             alignItems: 'center', justifyContent: 'flex-start',
           }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }} aria-hidden>
          {STEPS.map((s) => {
            const active = s === step;
            return (
              <span key={s} style={{
                width: 10, height: 10, borderRadius: '50%',
                border: '1.5px solid var(--sand)',
                background: active ? 'var(--gold)' : 'transparent',
                borderColor: active ? 'var(--gold)' : 'var(--sand)',
                boxShadow: active ? '0 0 8px rgba(232,160,32,.6)' : 'none',
                transition: 'background .2s, border-color .2s',
              }} />
            );
          })}
        </div>

        <div style={{
          width: 327, minHeight: 400,
          background: '#8B3A14',
          border: '1.5px solid var(--gold)',
          borderRadius: 'var(--radius-card)',
          padding: '24px 22px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          boxShadow: '0 4px 0 rgba(0,0,0,.2), 0 12px 28px rgba(0,0,0,.4)',
        }}>
          <TutSvg step={step} />
          <h2 style={{
            fontSize: 20, letterSpacing: '0.08em', color: 'var(--gold)',
            margin: '0 0 10px', textAlign: 'center',
            textShadow: step === 'flying'
              ? '0 0 12px rgba(200,80,60,.7), 0 2px 6px rgba(0,0,0,.4)'
              : '0 2px 6px rgba(0,0,0,.4)',
            textTransform: 'uppercase', fontWeight: 900,
          }}>
            {COPY[step].title}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--cream)', textAlign: 'center', margin: 0, lineHeight: 1.45 }}>
            {COPY[step].body}
          </p>
        </div>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <PrimaryButton onClick={() => {
            if (isLast) onBack();
            else setStep(STEPS[idx + 1]);
          }}>
            {isLast ? 'Done' : 'Next'}
          </PrimaryButton>
          <button onClick={onBack} style={{
            fontSize: 13, color: 'var(--sand)', cursor: 'pointer',
            textDecoration: 'underline', textUnderlineOffset: 3,
            letterSpacing: '0.04em',
            background: 'none', border: 'none', fontFamily: 'inherit',
          }}>
            Skip Tutorial
          </button>
        </div>
      </div>

      <style>{`
        .tut-pulse circle, .tut-pulse-c { animation: tut-pulse 1.4s ease-in-out infinite; }
        @keyframes tut-pulse { 0%,100% { opacity: 0.45; } 50% { opacity: 1; } }
      `}</style>
    </PhoneFrame>
  );
}

function TutSvg({ step }: { step: Step }) {
  const baseBoard = (
    <>
      <rect x="14" y="14" width="140" height="140"/>
      <rect x="42" y="42" width="84" height="84"/>
      <rect x="70" y="70" width="28" height="28"/>
      <line x1="84" y1="14" x2="84" y2="70"/>
      <line x1="84" y1="98" x2="84" y2="154"/>
      <line x1="14" y1="84" x2="70" y2="84"/>
      <line x1="98" y1="84" x2="154" y2="84"/>
    </>
  );

  return (
    <svg viewBox="0 0 168 168" fill="none" stroke="var(--gold)"
         strokeWidth="2.4" strokeLinecap="round"
         style={{ width: 200, height: 200, marginBottom: 18 }}>
      {baseBoard}
      {step === 'placing' && (
        <g className="tut-pulse" fill="var(--gold)" stroke="none">
          <circle cx="14" cy="14" r="5"/>
          <circle cx="84" cy="42" r="5"/>
          <circle cx="154" cy="84" r="5"/>
          <circle cx="42" cy="126" r="5"/>
          <circle cx="98" cy="98" r="5"/>
        </g>
      )}
      {step === 'mill' && (
        <>
          <line x1="42" y1="42" x2="126" y2="42" stroke="var(--gold)" strokeWidth="4" opacity="0.85" />
          <g fill="#F5EFE4" stroke="#000" strokeWidth="0.8">
            <circle cx="42" cy="42" r="7" />
            <circle cx="84" cy="42" r="7" />
            <circle cx="126" cy="42" r="7" />
          </g>
          <circle cx="84" cy="126" r="11" fill="none" stroke="#C8503C" strokeWidth="2" strokeDasharray="3 2" />
          <circle cx="84" cy="126" r="7" fill="#1F140C" stroke="#000" strokeWidth="0.8" />
        </>
      )}
      {step === 'moving' && (
        <>
          <g fill="#F5EFE4" stroke="#000" strokeWidth="0.8">
            <circle cx="14" cy="14" r="7"/>
            <circle cx="84" cy="14" r="7"/>
            <circle cx="42" cy="126" r="7"/>
            <circle cx="84" cy="126" r="7"/>
            <circle cx="14" cy="154" r="7"/>
            <circle cx="70" cy="98" r="7"/>
            <circle cx="98" cy="84" r="7"/>
          </g>
          <g fill="#1F140C" stroke="#000" strokeWidth="0.8">
            <circle cx="154" cy="14" r="7"/>
            <circle cx="126" cy="42" r="7"/>
            <circle cx="42" cy="42" r="7"/>
            <circle cx="14" cy="84" r="7"/>
            <circle cx="126" cy="126" r="7"/>
            <circle cx="154" cy="154" r="7"/>
          </g>
          <circle cx="84" cy="70" r="11" fill="none" stroke="var(--gold)" strokeWidth="2.5" />
          <circle cx="84" cy="70" r="7" fill="#1F140C" stroke="#000" strokeWidth="0.8" />
          <g className="tut-pulse" fill="var(--gold)" stroke="none">
            <circle cx="70" cy="70" r="5"/>
            <circle cx="98" cy="70" r="5"/>
            <circle cx="84" cy="42" r="5"/>
          </g>
        </>
      )}
      {step === 'flying' && (
        <>
          <g className="tut-pulse" fill="var(--gold)" stroke="none">
            <circle cx="14" cy="14" r="5"/>
            <circle cx="154" cy="14" r="5"/>
            <circle cx="14" cy="84" r="5"/>
            <circle cx="154" cy="84" r="5"/>
            <circle cx="14" cy="154" r="5"/>
            <circle cx="84" cy="154" r="5"/>
            <circle cx="154" cy="154" r="5"/>
            <circle cx="42" cy="42" r="5"/>
            <circle cx="126" cy="42" r="5"/>
            <circle cx="42" cy="84" r="5"/>
            <circle cx="126" cy="84" r="5"/>
            <circle cx="42" cy="126" r="5"/>
            <circle cx="84" cy="126" r="5"/>
            <circle cx="126" cy="126" r="5"/>
            <circle cx="70" cy="70" r="5"/>
            <circle cx="98" cy="70" r="5"/>
            <circle cx="70" cy="84" r="5"/>
            <circle cx="98" cy="84" r="5"/>
            <circle cx="70" cy="98" r="5"/>
            <circle cx="84" cy="98" r="5"/>
            <circle cx="98" cy="98" r="5"/>
          </g>
          <g fill="#1F140C" stroke="#000" strokeWidth="0.8">
            <circle cx="84" cy="14" r="7"/>
            <circle cx="126" cy="126" r="7"/>
          </g>
          <circle cx="84" cy="42" r="11" fill="none" stroke="var(--gold)" strokeWidth="2.5" />
          <circle cx="84" cy="42" r="7" fill="#1F140C" stroke="#000" strokeWidth="0.8" />
        </>
      )}
    </svg>
  );
}
