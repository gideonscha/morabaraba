import { useEffect, useState } from 'react';
import { useProfileStore } from './store/profileStore';
import { useGameStore } from './store/gameStore';
import { useOnlineSync } from './hooks/useOnlineSync';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { AiDifficultyScreen } from './screens/AiDifficultyScreen';
import { GameScreen } from './screens/GameScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { RewardsScreen } from './screens/RewardsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TutorialScreen } from './screens/TutorialScreen';
import { OnlineMenuScreen, MatchmakingScreen } from './screens/OnlineScreens';

type Route =
  | 'splash'
  | 'onboarding'
  | 'home'
  | 'ai-pick'
  | 'game'
  | 'leaderboard'
  | 'profile'
  | 'rewards'
  | 'settings'
  | 'tutorial'
  | 'online'
  | 'matchmaking';

export default function App() {
  const init = useProfileStore((s) => s.init);
  const hydrated = useProfileStore((s) => s.hydrated);
  const profile = useProfileStore((s) => s.profile);
  const newGame = useGameStore((s) => s.newGame);

  const [route, setRoute] = useState<Route>('splash');
  const [room, setRoom] = useState<{ id: string; code: string; asPlayer: 'p1' | 'p2' } | null>(null);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      setRoute(profile ? 'home' : 'onboarding');
    }, 700);
    return () => clearTimeout(t);
  }, [hydrated, profile]);

  // Online sync (no-op when not in online game)
  useOnlineSync({
    roomId: room?.id ?? null,
    asPlayer: room?.asPlayer ?? null,
    enabled: route === 'game' && !!room,
  });

  if (route === 'splash') return <SplashScreen />;
  if (route === 'onboarding') return <OnboardingScreen onDone={() => setRoute('home')} />;

  const home = () => { setRoom(null); setRoute('home'); };

  if (route === 'home') {
    return (
      <HomeScreen
        goAi={() => setRoute('ai-pick')}
        goLocal={() => { newGame('local', 'p1'); setRoute('game'); }}
        goOnline={() => setRoute('online')}
        goLeaderboard={() => setRoute('leaderboard')}
        goProfile={() => setRoute('profile')}
        goTutorial={() => setRoute('tutorial')}
        goSettings={() => setRoute('settings')}
        goRewards={() => setRoute('rewards')}
      />
    );
  }
  if (route === 'ai-pick') return <AiDifficultyScreen onBack={home} onStart={() => setRoute('game')} />;
  if (route === 'game') return <GameScreen onExit={home} />;
  if (route === 'leaderboard') return <LeaderboardScreen onBack={home} />;
  if (route === 'profile') return <ProfileScreen onBack={home} onRewards={() => setRoute('rewards')} />;
  if (route === 'rewards') return <RewardsScreen onBack={home} />;
  if (route === 'settings') return <SettingsScreen onBack={home} onTutorial={() => setRoute('tutorial')} />;
  if (route === 'tutorial') return <TutorialScreen onBack={home} />;
  if (route === 'online') {
    return (
      <OnlineMenuScreen
        onBack={home}
        onMatched={(id, asPlayer, code) => {
          setRoom({ id, asPlayer, code });
          setRoute('matchmaking');
        }}
      />
    );
  }
  if (route === 'matchmaking' && room) {
    return (
      <MatchmakingScreen
        roomId={room.id}
        asPlayer={room.asPlayer}
        code={room.code}
        onCancel={home}
        onReady={() => setRoute('game')}
      />
    );
  }
  return null;
}
