import { useProfileStore } from '../store/profileStore';
import { useHerdStore } from '../store/herdStore';
import { herdHealth, HEALTH_LABEL, careCompletedToday, todayString } from '../lib/herd';
import {
  PhoneFrame, TopBar, PrimaryButton, SecondaryButton, PatternStrip,
} from '../components/ui/Primitives';
import { KraalPrizeBanner } from '../components/KraalPrizeBanner';

interface Props {
  goAi: () => void;
  goLocal: () => void;
  goOnline: () => void;
  goLeaderboard: () => void;
  goProfile: () => void;
  goTutorial: () => void;
  goSettings: () => void;
  goRewards: () => void;
  goKraal: () => void;
}

const HEALTH_DOT: Record<string, string> = {
  thriving: '#4CAF50', healthy: '#CDDC39', hungry: '#FF9800', neglected: '#F44336',
};

export function HomeScreen({ goAi, goLocal, goOnline, goLeaderboard, goProfile, goTutorial, goSettings, goRewards, goKraal }: Props) {
  const profile = useProfileStore((s) => s.profile);
  const herd = useHerdStore((s) => s.herd);
  if (!profile) return null;

  const today = todayString();
  const health = herdHealth(herd, today);
  const tended = careCompletedToday(herd, today);

  return (
    <PhoneFrame>
      <div className="screen home" style={{ flex: 1 }}>
        <TopBar username={profile.username} tier={profile.tier} coins={profile.coins} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 24px 24px', gap: 14 }}>
          <KraalPrizeBanner onOpen={goRewards} />
          <img
            src="/logo-morabaraba.png"
            alt="Morabaraba"
            width={230}
            style={{ width: 230, height: 'auto', display: 'block' }}
          />

          <PatternStrip className="my-1" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', alignItems: 'center' }}>
            <ModeButton variant="primary" onClick={goAi}
              name="Play the Ancestors" tagline="Challenge the wisdom of generations." />
            <ModeButton variant="secondary" onClick={goLocal}
              name="Kasi Clash" tagline="Two players. One phone. One winner." />
            <ModeButton variant="secondary" onClick={goOnline}
              name="King of the Kraal" tagline="Take on players across Mzansi." />
            <SecondaryButton onClick={goLeaderboard}>Leaderboard</SecondaryButton>
          </div>

          <button onClick={goKraal} className="btn-press" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,0,0,.28)', border: '1.5px solid var(--gold-dark)',
            borderRadius: 999, padding: '8px 16px',
            color: 'var(--cream)', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.03em',
          }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>🐄</span>
            {tended ? 'Herd tended for today' : 'Tend Your Herd'}
            <span style={{
              width: 9, height: 9, borderRadius: '50%',
              background: HEALTH_DOT[health],
              boxShadow: `0 0 7px ${HEALTH_DOT[health]}`,
            }} title={HEALTH_LABEL[health]} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '14px 0 22px' }}>
          <button onClick={goProfile} style={footLinkStyle}>Profile</button>
          <span style={{ width: 1, height: 14, background: 'rgba(212,169,106,.35)' }} />
          <button onClick={goTutorial} style={footLinkStyle}>Tutorial</button>
          <span style={{ width: 1, height: 14, background: 'rgba(212,169,106,.35)' }} />
          <button onClick={goSettings} style={footLinkStyle}>Settings</button>
        </div>
      </div>
    </PhoneFrame>
  );
}

const footLinkStyle: React.CSSProperties = {
  color: 'var(--sand)',
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '0.06em',
  padding: '8px 4px',
  cursor: 'pointer',
  background: 'transparent',
  border: 0,
  fontFamily: 'inherit',
};

interface ModeButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  name: string;
  tagline: string;
}

/**
 * Mode buttons stack the name (existing primary/secondary button styling)
 * over a smaller Poppins tagline in sand colour. The button itself keeps
 * its original size and styling — only the tagline is added beneath.
 */
function ModeButton({ variant, onClick, name, tagline }: ModeButtonProps) {
  const Btn = variant === 'primary' ? PrimaryButton : SecondaryButton;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' }}>
      <Btn onClick={onClick}>{name}</Btn>
      <div style={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: 12,
        fontStyle: 'italic',
        color: 'var(--sand)',
        letterSpacing: '0.02em',
        textAlign: 'center',
      }}>
        {tagline}
      </div>
    </div>
  );
}
