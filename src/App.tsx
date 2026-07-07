import { useEffect, useState } from 'react';
import { useProfileStore } from './store/profileStore';
import { useGameStore } from './store/gameStore';
import { useAudioSettings } from './store/audioStore';
import { useOnlineSync } from './hooks/useOnlineSync';
import { audio } from './lib/audio';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { AiDifficultyScreen } from './screens/AiDifficultyScreen';
import { GameScreen } from './screens/GameScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { RewardsScreen } from './screens/RewardsScreen';
import { KraalScreen } from './screens/KraalScreen';
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
  | 'kraal'
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

  // Background music: starts on the first user interaction (browser autoplay
  // policy requires a gesture) and keeps playing across every screen,
  // including gameplay — only the in-Settings toggle stops it.
  const musicEnabled = useAudioSettings((s) => s.musicEnabled);
  const hydrateAudio = useAudioSettings((s) => s.hydrateFromProfile);
  useEffect(() => {
    if (!profile) return;
    const p = profile as unknown as { sound_enabled?: boolean; music_enabled?: boolean };
    hydrateAudio({ sound_enabled: p.sound_enabled, music_enabled: p.music_enabled });
  }, [profile, hydrateAudio]);

  // One-shot pointer listener: the first tap anywhere unlocks audio and
  // kicks off the music. After that the listener removes itself.
  useEffect(() => {
    const unlock = () => {
      audio.init();
      audio.playMusic();
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  // React to the music-enabled toggle in Settings.
  useEffect(() => {
    if (musicEnabled) audio.playMusic();
    else audio.stopMusic();
  }, [musicEnabled]);

  // Tear down on unmount
  useEffect(() => () => { audio.stopMusic(); }, []);

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
        goKraal={() => setRoute('kraal')}
      />
    );
  }
  if (route === 'ai-pick') return <AiDifficultyScreen onBack={home} onStart={() => setRoute('game')} />;
  if (route === 'game') return <GameScreen onExit={home} />;
  if (route === 'leaderboard') return <LeaderboardScreen onBack={home} />;
  if (route === 'profile') return <ProfileScreen onBack={home} onRewards={() => setRoute('rewards')} />;
  if (route === 'rewards') return <RewardsScreen onBack={home} />;
  if (route === 'kraal') return <KraalScreen onBack={home} />;
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
