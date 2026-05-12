import { useProfileStore } from '../store/profileStore';
import { Avatar, CoinBar, PrimaryButton, SecondaryButton, TierBadge } from '../components/ui/Primitives';

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
    <div className="min-h-screen flex flex-col px-5 py-5">
      <header className="flex items-center justify-between">
        <button onClick={goProfile} className="flex items-center gap-2">
          <Avatar id={profile.avatar_id} size={44} />
          <div className="text-left">
            <div className="text-cream font-semibold text-sm">{profile.username}</div>
            <TierBadge tier={profile.tier} />
          </div>
        </button>
        <CoinBar coins={profile.coins} />
      </header>

      <div className="text-center mt-8 mb-8">
        <div className="display-font text-4xl text-gold tracking-wide">MORABARABA</div>
        <div className="text-cream/70 text-xs uppercase tracking-widest mt-1">12-piece edition</div>
      </div>

      <div className="space-y-3">
        <PrimaryButton onClick={goAi}>Play vs AI</PrimaryButton>
        <SecondaryButton onClick={goLocal}>Local 2-Player</SecondaryButton>
        <SecondaryButton onClick={goOnline}>Online PvP</SecondaryButton>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <SecondaryButton onClick={goLeaderboard}>Leaderboard</SecondaryButton>
        <SecondaryButton onClick={goRewards}>Rewards</SecondaryButton>
        <SecondaryButton onClick={goTutorial}>Tutorial</SecondaryButton>
        <SecondaryButton onClick={goSettings}>Settings</SecondaryButton>
      </div>

      <div className="mt-auto pt-6 text-center text-cream/40 text-[10px]">
        Wins {profile.wins} · Losses {profile.losses} · Streak {profile.streak}
      </div>
    </div>
  );
}
