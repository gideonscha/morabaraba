import { useState } from 'react';
import {
  PhoneFrame, TopBar, TierBadge, CoinBarLarge, AvatarPicker,
  PrimaryButton, SecondaryButton, AvatarDisplay,
} from '../components/ui/Primitives';
import { useProfileStore } from '../store/profileStore';
import { upsertProfile } from '../lib/profile';

export function ProfileScreen({ onBack, onRewards }: { onBack: () => void; onRewards: () => void }) {
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

  const total = profile.wins + profile.losses;
  const winRate = total > 0 ? Math.round((profile.wins / total) * 100) : 0;

  return (
    <PhoneFrame>
      <div className="screen profile" style={{ flex: 1 }}>
        <TopBar back={onBack} username={profile.username} tier={profile.tier} coins={profile.coins} />

        <div style={{
          padding: '20px 24px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          overflowY: 'auto',
        }}>
          <div style={{ position: 'relative', width: 96, height: 96, marginTop: 4 }}>
            <AvatarDisplay id={profile.avatar_id} size={96} initial={profile.username[0]?.toUpperCase()} />
            <span style={{
              position: 'absolute', right: -4, bottom: -2,
              transform: 'scale(1.05)', transformOrigin: 'bottom right',
              boxShadow: '0 2px 6px rgba(0,0,0,.5)',
            }}>
              <TierBadge tier={profile.tier} />
            </span>
          </div>

          <h2 style={{
            fontWeight: 900, fontSize: 24,
            color: 'var(--gold)', letterSpacing: '0.04em', textTransform: 'uppercase',
            margin: '8px 0 0', textAlign: 'center',
            textShadow: '0 0 14px rgba(232,160,32,.35)',
          }}>
            @{profile.username}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--sand)', margin: 0, textAlign: 'center' }}>
            🇿🇦 {profile.region === 'ZA' ? 'South Africa' : profile.region}
          </p>

          <CoinBarLarge coins={profile.coins} onClick={onRewards} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 155px)', gap: 10, marginTop: 12 }}>
            <Stat value={profile.wins} label="Wins" />
            <Stat value={profile.losses} label="Losses" />
            <Stat value={`${winRate}%`} label="Win Rate" />
            <Stat value={profile.streak} label="Streak" />
            <Stat value="—" label="Rank" />
            <Stat value={profile.coins} label="Coins Earned" />
          </div>

          {!editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 16, width: '100%' }}>
              <SecondaryButton onClick={() => setEditing(true)}>Change Avatar</SecondaryButton>
            </div>
          ) : (
            <div style={{ marginTop: 16, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <AvatarPicker value={avatarId} onChange={setAvatarId} />
              <PrimaryButton onClick={save}>Save</PrimaryButton>
              <button onClick={() => setEditing(false)} style={{
                fontSize: 13, color: 'var(--sand)', textDecoration: 'underline', textUnderlineOffset: 3,
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{
      width: 155, height: 72, background: 'var(--card)', borderRadius: 12,
      padding: '10px 14px',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2,
      border: '1px solid rgba(232,160,32,.18)',
    }}>
      <span style={{ fontWeight: 900, fontSize: 24, color: 'var(--gold)', letterSpacing: '0.02em', lineHeight: 1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span style={{ fontSize: 11, color: 'var(--sand)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
    </div>
  );
}
