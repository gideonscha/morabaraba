import { PhoneFrame } from '../components/ui/Primitives';

export function SplashScreen() {
  return (
    <PhoneFrame>
      <div className="screen splash" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '96px 24px 56px', textAlign: 'center' }}>
        {/* decorative pattern strips behind everything */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden>
          <div className="pattern-strip" style={{ position: 'absolute', left: '-10%', width: '120%', top: '14%', opacity: 0.08 }} />
          <div className="pattern-strip" style={{ position: 'absolute', left: '-10%', width: '120%', top: '86%', opacity: 0.08 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'splash-rise 900ms cubic-bezier(.2,.7,.2,1) both' }}>
          <img
            src="/logo-morabaraba.png"
            alt="Morabaraba"
            width={300}
            style={{ width: 300, height: 'auto', display: 'block' }}
          />
          <div style={{
            marginTop: 14, fontStyle: 'italic', fontWeight: 400, fontSize: 16,
            color: 'var(--cream)', letterSpacing: '0.02em', opacity: 0.92,
          }}>
            The Ancient Game of Africa
          </div>
        </div>

        <div style={{ width: 240, textAlign: 'center' }}>
          <div style={{
            width: 240, height: 8,
            background: 'rgba(0,0,0,.35)',
            border: '1px solid var(--gold-dark)',
            borderRadius: 999,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: '100%',
              backgroundColor: 'var(--gold)',
              backgroundImage:
                'linear-gradient(135deg, rgba(255,255,255,.22) 25%, transparent 25%),' +
                'linear-gradient(225deg, rgba(255,255,255,.22) 25%, transparent 25%),' +
                'linear-gradient(315deg, rgba(0,0,0,.18) 25%, transparent 25%),' +
                'linear-gradient(45deg, rgba(0,0,0,.18) 25%, transparent 25%)',
              backgroundSize: '10px 10px',
              backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0',
              boxShadow: '0 0 8px rgba(232,160,32,.6)',
              animation: 'loader-fill 2000ms ease-out forwards',
            }} />
          </div>
          <div style={{
            marginTop: 12,
            fontSize: 11,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--sand)',
            opacity: 0.85,
          }}>
            Loading
          </div>
        </div>
      </div>

      <style>{`
        @keyframes splash-rise {
          0%   { opacity: 0; transform: translateY(14px) scale(.96); }
          60%  { opacity: 1; }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes loader-fill { 0% { width: 0%; } 100% { width: 100%; } }
        .logo-disc-pulse { animation: logo-disc-pulse 4.5s ease-in-out infinite; }
        @keyframes logo-disc-pulse {
          0%, 100% { filter: drop-shadow(0 0 0 rgba(232,160,32,0)); }
          50%      { filter: drop-shadow(0 0 22px rgba(232,160,32,.45)); }
        }
      `}</style>
    </PhoneFrame>
  );
}
