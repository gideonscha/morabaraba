import { useState } from 'react';
import { ScreenHeader, PrimaryButton, SecondaryButton } from '../components/ui/Primitives';
import { useProfileStore } from '../store/profileStore';

const SOUND_KEY = 'morabaraba.sound';

export function SettingsScreen({ onBack, onTutorial }: { onBack: () => void; onTutorial: () => void }) {
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const [sound, setSound] = useState(() => localStorage.getItem(SOUND_KEY) !== 'off');
  const [region, setRegion] = useState(profile?.region ?? 'ZA');

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    localStorage.setItem(SOUND_KEY, next ? 'on' : 'off');
  };

  const saveRegion = (r: string) => { setRegion(r); updateProfile({ region: r }); };

  return (
    <div className="min-h-screen flex flex-col">
      <ScreenHeader title="Settings" onBack={onBack} />
      <div className="px-5 mt-4 space-y-3">
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-cream font-medium">Sound</p>
            <p className="text-cream/60 text-xs">Effects and feedback</p>
          </div>
          <button onClick={toggleSound} className={`w-12 h-7 rounded-full transition ${sound ? 'bg-gold' : 'bg-charcoal'} relative border border-gold/60`}>
            <span className={`absolute top-0.5 ${sound ? 'right-0.5' : 'left-0.5'} w-6 h-6 rounded-full bg-cream transition-all`} />
          </button>
        </div>

        <div className="card p-4">
          <p className="text-cream font-medium mb-2">Region</p>
          <div className="flex gap-2 flex-wrap">
            {['ZA', 'LS', 'BW', 'ZW'].map((r) => (
              <button
                key={r}
                onClick={() => saveRegion(r)}
                className={`px-3 py-1.5 rounded-full text-sm ${region === r ? 'bg-gold text-charcoal font-bold' : 'border border-gold/50 text-cream'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <SecondaryButton onClick={onTutorial}>Replay tutorial</SecondaryButton>

        <div className="card p-4">
          <p className="text-cream font-medium mb-1">About</p>
          <p className="text-cream/70 text-sm">Morabaraba is an ancient two-player strategy game from Southern Africa. This is the 12-piece edition.</p>
        </div>
      </div>
    </div>
  );
}
