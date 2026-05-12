import { useState } from 'react';
import { useProfileStore } from '../store/profileStore';
import { AvatarPicker, PrimaryButton } from '../components/ui/Primitives';
import { ensureAuthAndProfile, upsertProfile } from '../lib/profile';

interface Props {
  onDone: () => void;
}
export function OnboardingScreen({ onDone }: Props) {
  const setProfile = useProfileStore((s) => s.setProfile);
  const [username, setUsername] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = username.trim().length >= 3 && username.trim().length <= 15;

  const handleSubmit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setErr(null);
    const cleanUsername = username.trim();
    const local = {
      username: cleanUsername,
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
    <div className="min-h-screen flex flex-col px-6 py-10">
      <h1 className="display-font text-3xl text-gold text-center mb-1">Welcome</h1>
      <p className="text-cream/80 text-center text-sm mb-8">Choose a name and an avatar to begin.</p>

      <label className="text-cream/80 text-xs uppercase tracking-wider mb-1">Username</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        maxLength={15}
        placeholder="3-15 characters"
        className="w-full bg-black/30 border border-gold/50 rounded-xl px-3 py-3 text-cream placeholder:text-cream/40 focus:outline-none focus:border-gold"
      />

      <div className="mt-6">
        <p className="text-cream/80 text-xs uppercase tracking-wider mb-2">Avatar</p>
        <AvatarPicker value={avatarId} onChange={setAvatarId} />
      </div>

      {err && <p className="text-red-300 text-sm mt-4">{err}</p>}

      <div className="mt-auto pt-8">
        <PrimaryButton onClick={handleSubmit} disabled={!canSubmit || busy}>
          {busy ? 'Setting up…' : 'Start playing'}
        </PrimaryButton>
      </div>
    </div>
  );
}
