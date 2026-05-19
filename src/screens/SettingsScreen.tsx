import { useState } from 'react';
import { PhoneFrame, TopBar } from '../components/ui/Primitives';
import { useProfileStore } from '../store/profileStore';
import { useAudioSettings } from '../store/audioStore';
import { audio } from '../lib/audio';
import { supabase, SUPABASE_ENABLED } from '../lib/supabase';

const REGIONS: { code: string; flag: string; label: string }[] = [
  { code: 'ZA', flag: '🇿🇦', label: 'South Africa' },
  { code: 'LS', flag: '🇱🇸', label: 'Lesotho' },
  { code: 'BW', flag: '🇧🇼', label: 'Botswana' },
  { code: 'ZW', flag: '🇿🇼', label: 'Zimbabwe' },
];

export function SettingsScreen({ onBack, onTutorial }: { onBack: () => void; onTutorial: () => void }) {
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const sound = useAudioSettings((s) => s.soundEnabled);
  const music = useAudioSettings((s) => s.musicEnabled);
  const setSoundPref = useAudioSettings((s) => s.setSound);
  const setMusicPref = useAudioSettings((s) => s.setMusic);
  const [showRegions, setShowRegions] = useState(false);
  const currentRegion = REGIONS.find((r) => r.code === profile?.region) ?? REGIONS[0];

  const persistAudio = async (patch: { sound_enabled?: boolean; music_enabled?: boolean }) => {
    if (!SUPABASE_ENABLED || !supabase || !profile?.id) return;
    await supabase.from('profiles').update(patch).eq('id', profile.id);
  };

  const toggleSound = () => {
    const next = !sound;
    setSoundPref(next);
    if (next) audio.playSound('button');
    persistAudio({ sound_enabled: next });
  };
  const toggleMusic = () => {
    const next = !music;
    setMusicPref(next);
    audio.setMusicEnabled(next);
    persistAudio({ music_enabled: next });
  };
  const pickRegion = (code: string) => {
    updateProfile({ region: code });
    setShowRegions(false);
  };

  if (!profile) return null;

  return (
    <PhoneFrame>
      <div className="screen settings" style={{ flex: 1 }}>
        <TopBar back={onBack} username={profile.username} tier={profile.tier} coins={profile.coins} />

        <div style={{
          width: '100%', padding: '12px 24px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <h1 style={{
            fontSize: 28, letterSpacing: '0.1em', color: 'var(--gold)',
            margin: '8px 0 22px', textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,.4)',
            fontWeight: 900, textTransform: 'uppercase',
          }}>
            SETTINGS
          </h1>

          <div style={{
            width: 327, background: '#8B3A14',
            borderRadius: 'var(--radius-card)', overflow: 'hidden',
            boxShadow: '0 4px 0 rgba(0,0,0,.2), 0 10px 24px rgba(0,0,0,.35)',
          }}>
            <Row icon="🔊" label="Sound Effects">
              <Toggle on={sound} onToggle={toggleSound} />
            </Row>
            <Row icon="🎵" label="Background Music">
              <Toggle on={music} onToggle={toggleMusic} />
            </Row>
            <Row icon="🌍" label="Region">
              <button
                onClick={() => setShowRegions((v) => !v)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: 'var(--cream)', fontSize: 14, cursor: 'pointer',
                  background: 'transparent', border: 0, padding: 0,
                  fontFamily: 'inherit',
                }}
              >
                {currentRegion.flag} {currentRegion.label}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9 L12 15 L18 9" />
                </svg>
              </button>
            </Row>
            {showRegions && (
              <div style={{ background: 'rgba(0,0,0,.18)' }}>
                {REGIONS.map((r) => (
                  <button
                    key={r.code}
                    onClick={() => pickRegion(r.code)}
                    style={{
                      width: '100%', padding: '10px 16px',
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: r.code === currentRegion.code ? 'rgba(232,160,32,.12)' : 'transparent',
                      color: 'var(--cream)', border: 0, cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 13,
                      borderBottom: '1px solid rgba(232,160,32,.18)',
                    }}
                  >
                    {r.flag} {r.label}
                  </button>
                ))}
              </div>
            )}
            <Row icon="📖" label="Tutorial">
              <button
                onClick={onTutorial}
                style={{
                  width: 100, height: 32,
                  background: 'transparent', border: '1px solid var(--gold)',
                  borderRadius: 6, color: 'var(--cream)',
                  fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                }}
              >
                Reset Tutorial
              </button>
            </Row>
            <Row icon="📋" label="Version">
              <span style={{ color: 'var(--sand)', fontSize: 12 }}>v1.0.0</span>
            </Row>
            <Row icon="🔒" label="Privacy Policy" clickable>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sand)"
                   strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5 L16 12 L9 19" />
              </svg>
            </Row>
            <Row icon="✉️" label="Contact Us" clickable last>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sand)"
                   strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5 L16 12 L9 19" />
              </svg>
            </Row>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Row({
  icon, label, children, clickable, last,
}: { icon: string; label: string; children: React.ReactNode; clickable?: boolean; last?: boolean }) {
  return (
    <div style={{
      minHeight: 52, padding: '0 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: last ? 0 : '1px solid rgba(232,160,32,.25)',
      cursor: clickable ? 'pointer' : 'default',
    }}>
      <span style={{ fontSize: 18, width: 22, textAlign: 'center' }} aria-hidden>{icon}</span>
      <span style={{ flex: 1, fontSize: 14, color: 'var(--cream)' }}>{label}</span>
      {children}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      style={{
        width: 40, height: 22, borderRadius: 999,
        background: on ? 'var(--gold)' : '#2A1E14',
        border: `1px solid ${on ? 'var(--gold-dark)' : 'rgba(232,160,32,.4)'}`,
        position: 'relative', cursor: 'pointer',
        transition: 'background .15s', flexShrink: 0,
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2,
        left: on ? 20 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: on ? '#2A1E14' : 'var(--cream)',
        transition: 'left .18s ease',
      }} />
    </button>
  );
}
