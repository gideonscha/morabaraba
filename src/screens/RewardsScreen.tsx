import {
  PhoneFrame, TopBar, CoinBarLarge, TierBadge,
} from '../components/ui/Primitives';
import { useProfileStore } from '../store/profileStore';

export function RewardsScreen({ onBack }: { onBack: () => void }) {
  const profile = useProfileStore((s) => s.profile);
  if (!profile) return null;

  return (
    <PhoneFrame>
      <div className="screen rewards" style={{ flex: 1 }}>
        <TopBar back={onBack} username={profile.username} tier={profile.tier} coins={profile.coins} />

        <div style={{
          padding: '20px 24px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          overflowY: 'auto',
        }}>
          <h2 style={{
            fontWeight: 900, fontSize: 28, color: 'var(--gold)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            textAlign: 'center', margin: '4px 0 0',
            textShadow: '0 0 14px rgba(232,160,32,.4)',
          }}>
            Rewards
          </h2>

          <CoinBarLarge coins={profile.coins} progressPct={62} />

          <div style={{
            width: 327, minHeight: 200,
            background: 'var(--card)', border: '1.5px dashed var(--gold)',
            borderRadius: 16, padding: '16px 18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            boxShadow: '0 0 20px rgba(232,160,32,.12)',
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--gold-bright)"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                 style={{ filter: 'drop-shadow(0 0 8px rgba(232,160,32,.5))' }}>
              <path d="M6 2h12M6 22h12M6 2v4c0 3 3 4 6 6 3-2 6-3 6-6V2M6 22v-4c0-3 3-4 6-6 3 2 6 3 6 6v4"/>
            </svg>
            <h3 style={{
              fontWeight: 900, fontSize: 24, color: 'var(--sand)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              margin: '-2px 0 0', lineHeight: 1,
            }}>
              Coming Soon
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--cream)', textAlign: 'center', margin: 0, lineHeight: 1.35, maxWidth: 280 }}>
              Redeem your coins for airtime, data bundles, and exclusive in-game items.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              <Placeholder label="Airtime" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="12" y1="17" x2="12" y2="17.01"/></svg>} />
              <Placeholder label="Data" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8z"/><path d="M8 10h8M8 13h6"/></svg>} />
              <Placeholder label="Exclusive" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 9 22 9.5 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.5 9 9 12 2"/></svg>} />
            </div>
          </div>

          <div style={{
            width: 327, minHeight: 72,
            background: 'var(--card)', border: '1.5px solid var(--gold)',
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            boxShadow: '0 0 18px rgba(232,160,32,.2)',
          }}>
            <span style={{ fontSize: 13.5, color: 'var(--cream)', lineHeight: 1.3 }}>
              Upgrade to <strong style={{ color: 'var(--gold-bright)', fontWeight: 900, letterSpacing: '0.04em' }}>GOLD</strong> for more rewards
            </span>
            <TierBadge tier="gold" />
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Placeholder({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div style={{ width: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: 0.55 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 10,
        background: 'rgba(255,255,255,.04)',
        border: '1px solid rgba(167,165,156,.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--sand)', position: 'relative',
      }}>
        {icon}
        <span style={{
          position: 'absolute', right: -4, bottom: -4,
          width: 18, height: 18, borderRadius: '50%',
          background: 'rgba(0,0,0,.7)',
          border: '1px solid rgba(167,165,156,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--sand)',
        }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2"/>
            <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
          </svg>
        </span>
      </div>
      <span style={{ fontSize: 10, color: 'var(--sand)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}
