import { useProfileStore } from '../store/profileStore';
import {
  PhoneFrame, TopBar, PrimaryButton, SecondaryButton, PatternStrip, CoinBarLarge,
} from '../components/ui/Primitives';
import { MorabarabaDisc } from '../components/ui/Logo';

interface Props {
  goAi: () => void;
  goLocal: () => void;
  goOnline: () => void;
  goLeaderboard: () => void;
  goProfile: () => void;
  goTutorial: () => void;
  goSettings: () => void;
  goRewards: () => void;
}

export function HomeScreen({ goAi, goLocal, goOnline, goLeaderboard, goProfile, goTutorial, goSettings, goRewards }: Props) {
  const profile = useProfileStore((s) => s.profile);
  if (!profile) return null;

  return (
    <PhoneFrame>
      <div className="screen home" style={{ flex: 1 }}>
        <TopBar username={profile.username} tier={profile.tier} coins={profile.coins} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 24px 24px', gap: 18 }}>
          <MorabarabaDisc size={140} markSize={86} />
          <div style={{
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: '0.18em',
            color: 'var(--gold)',
            lineHeight: 1,
            marginTop: 2,
            textShadow: '0 2px 6px rgba(0,0,0,.5)',
          }}>
            MORABARABA
          </div>

          <PatternStrip className="my-1" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
            <PrimaryButton onClick={goAi}>Play AI</PrimaryButton>
            <SecondaryButton onClick={goLocal}>Local Play</SecondaryButton>
            <SecondaryButton onClick={goOnline}>Online Play</SecondaryButton>
            <SecondaryButton onClick={goLeaderboard}>Leaderboard</SecondaryButton>
          </div>

          <CoinBarLarge coins={profile.coins} onClick={goRewards} />
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
