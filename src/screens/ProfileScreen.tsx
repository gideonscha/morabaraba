import { useState } from 'react';
import { ScreenHeader, Avatar, AvatarPicker, PrimaryButton, TierBadge, CoinBar } from '../components/ui/Primitives';
import { useProfileStore } from '../store/profileStore';
import { upsertProfile } from '../lib/profile';

export function ProfileScreen({ onBack }: { onBack: () => void }) {
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const [editing, setEditing] = useState(false);
  const [avatarId, setAvatarId] = useState(profile?.avatar_id ?? 1);

  if (!profile) return null;

  const save = async () => {
    updateProfile({ avatar_id: avatarId });
    if (profile.id) await upsertProfile({ ...profile, avatar_id: avatarId }, profile.id);
    setEditing(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ScreenHeader title="Profile" onBack={onBack} />
      <div className="px-5 mt-4">
        <div className="card p-5 flex items-center gap-4">
          <Avatar id={profile.avatar_id} size={72} />
          <div className="flex-1">
            <div className="text-cream font-semibold text-lg">{profile.username}</div>
            <div className="flex items-center gap-2 mt-1"><TierBadge tier={profile.tier} /><span className="text-cream/60 text-xs">{profile.region}</span></div>
            <div className="mt-2"><CoinBar coins={profile.coins} /></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <Stat label="Wins" value={profile.wins} />
          <Stat label="Losses" value={profile.losses} />
          <Stat label="Streak" value={profile.streak} />
        </div>

        <div className="card p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-cream font-medium">Change avatar</p>
            <button onClick={() => setEditing((e) => !e)} className="text-gold text-sm">{editing ? 'Cancel' : 'Edit'}</button>
          </div>
          {editing && (
            <>
              <AvatarPicker value={avatarId} onChange={setAvatarId} />
              <div className="mt-4"><PrimaryButton onClick={save}>Save</PrimaryButton></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-cream display-font text-2xl">{value}</div>
      <div className="text-cream/60 text-[10px] uppercase tracking-wider">{label}</div>
    </div>
  );
}
