import { useState } from 'react';
import { useProfileStore } from '../store/profileStore';
import { PhoneFrame, PatternStrip, PrimaryButton, AvatarPicker } from '../components/ui/Primitives';
import { ensureAuthAndProfile, upsertProfile } from '../lib/profile';

interface Props {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: Props) {
  const setProfile = useProfileStore((s) => s.setProfile);
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 2 && avatarId > 0;

  const handleSubmit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true); setErr(null);
    const cleanName = name.trim();
    const local = {
      username: cleanName,
      avatar_id: avatarId,
      region: 'ZA',
      coins: 0,
      tier: 'free',
      wins: 0,
      losses: 0,
      streak: 0,
    };
    try {
      const { id } = await ensureAuthAndProfile();
      if (id) {
        const remote = await upsertProfile(local, id);
        setProfile({ ...local, ...(remote ?? {}), id });
      } else {
        setProfile(local);
      }
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PhoneFrame>
      <div className="screen onboarding"
           style={{ padding: '76px 24px 36px', flex: 1, alignItems: 'stretch', justifyContent: 'flex-start' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="h-display" style={{ fontSize: 28, letterSpacing: '0.14em', textShadow: '0 2px 8px rgba(0,0,0,.4)' }}>
            Welcome Warrior
          </h1>
          <p style={{ margin: '10px 0 0', color: 'var(--sand)', fontSize: 14, letterSpacing: '0.02em' }}>
            Choose your name and avatar
          </p>
        </div>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
          <div>
            <label className="field-label" htmlFor="warrior-name">Your Name</label>
            <input
              id="warrior-name"
              className="text-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={18}
              autoComplete="off"
              placeholder="Enter your warrior name"
            />
          </div>

          <div>
            <span className="field-label">Choose Avatar</span>
            <AvatarPicker value={avatarId} onChange={setAvatarId} />
          </div>

          {err && <p style={{ color: '#FF6450', fontSize: 13, textAlign: 'center' }}>{err}</p>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 16 }}>
          <PatternStrip opacity={0.18} />
          <PrimaryButton onClick={handleSubmit} disabled={!canSubmit || busy}>
            {busy ? 'Setting up…' : 'Begin Your Journey'}
          </PrimaryButton>
        </div>
      </div>
    </PhoneFrame>
  );
}
