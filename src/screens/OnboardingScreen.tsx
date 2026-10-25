import { useState } from 'react';
import { useProfileStore } from '../store/profileStore';
import { PhoneFrame, PatternStrip, PrimaryButton, AvatarPicker } from '../components/ui/Primitives';
import { ensureAuthAndProfile, createRemoteProfile } from '../lib/profile';
import { BRAND } from '../brand';

interface Props {
  onDone: () => void;
}

export function OnboardingScreen({ onDone }: Props) {
  const setProfile = useProfileStore((s) => s.setProfile);
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Mirrors the server rule (profiles_username_check: 3–15 characters).
  const cleanLen = name.trim().length;
  const nameOk = cleanLen >= 3 && cleanLen <= 15;
  const canSubmit = nameOk && avatarId > 0;
  // Live guidance so a disabled button never feels like a dead end.
  const hint = cleanLen === 0 ? 'At least 3 characters'
    : cleanLen < 3 ? `${3 - cleanLen} more character${3 - cleanLen === 1 ? '' : 's'} needed`
    : !nameOk ? 'Maximum 15 characters'
    : avatarId === 0 ? 'Now choose an avatar below'
    : null;

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
        const { profile: remote, error } = await createRemoteProfile(local, id);
        if (error === 'username_taken') {
          setErr('That warrior name is already taken — please choose another.');
          return;
        }
        if (error === 'invalid_username') {
          setErr('Names must be 3–15 characters.');
          return;
        }
        // Server unavailable: play locally without claiming a server identity.
        setProfile(remote ? { ...local, ...remote, id } : local);
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
            {BRAND.onboarding.title}
          </h1>
          <p style={{ margin: '10px 0 0', color: 'var(--sand)', fontSize: 14, letterSpacing: '0.02em' }}>
            {BRAND.onboarding.subtitle}
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
              maxLength={15}
              autoComplete="off"
              placeholder={BRAND.onboarding.placeholder}
              aria-describedby="warrior-name-hint"
            />
            <div id="warrior-name-hint" aria-live="polite" style={{
              marginTop: 6, minHeight: 16, fontSize: 12, letterSpacing: '0.02em',
              color: cleanLen > 0 && cleanLen < 3 ? 'var(--gold)' : 'var(--sand)',
              fontWeight: cleanLen > 0 && cleanLen < 3 ? 700 : 500,
            }}>
              {hint ?? ' '}
            </div>
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
            {busy ? 'Setting up…' : BRAND.onboarding.cta}
          </PrimaryButton>
        </div>
      </div>
    </PhoneFrame>
  );
}
