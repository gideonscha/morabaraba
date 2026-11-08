import { useState } from 'react';
import { PhoneFrame, PatternStrip, PrimaryButton, SecondaryButton } from '../components/ui/Primitives';
import { BRAND } from '../brand';
import type { AccessRecord } from '../lib/access';

interface Props {
  access: AccessRecord;
  onRetry: () => Promise<void>;
}

/**
 * Shown on gated instances to anyone we have no subscribe notification
 * for: direct visitors, declined/unsubscribed numbers, or a hand-off
 * that landed before Worldplay's notification did.
 */
export function LockedScreen({ access, onRetry }: Props) {
  const [busy, setBusy] = useState(false);
  const subscribeUrl = BRAND.subscribeUrl;
  const headline = access.status === 'denied' && access.reason === 'status_unsubscribed'
    ? 'Your subscription has ended'
    : access.msisdn ? 'Almost there' : 'Subscribers only';
  const body = access.status === 'denied' && access.reason === 'status_unsubscribed'
    ? `Re-subscribe on ${BRAND.operator} to get back on the board.`
    : access.msisdn
      ? `We haven't received your ${BRAND.operator} subscription yet. It usually arrives within a minute — try again below.`
      : `${BRAND.shortName} is part of the ${BRAND.operator} games bundle. Subscribe on ${BRAND.operator} and you'll be sent straight here.`;

  return (
    <PhoneFrame>
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: '80px 24px 48px', textAlign: 'center', gap: 18 }}>
        <img src={BRAND.logo} alt={BRAND.name} width={BRAND.logoWidthHome} style={{ width: BRAND.logoWidthHome, height: 'auto' }} />
        <PatternStrip opacity={0.25} />
        <h1 className="h-display" style={{ fontSize: 30, marginTop: 8 }}>{headline}</h1>
        <p style={{ color: 'var(--cream)', fontSize: 15, lineHeight: 1.5, maxWidth: 300, margin: 0 }}>{body}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14, width: '100%', alignItems: 'center' }}>
          {subscribeUrl && (
            <PrimaryButton onClick={() => { location.href = subscribeUrl; }}>Subscribe on {BRAND.operator}</PrimaryButton>
          )}
          <SecondaryButton disabled={busy} onClick={async () => { setBusy(true); try { await onRetry(); } finally { setBusy(false); } }}>
            {busy ? 'Checking…' : "I've subscribed — try again"}
          </SecondaryButton>
        </div>
        <p style={{ color: 'var(--sand)', fontSize: 12, marginTop: 12 }}>
          Opened this from a link? Use the link {BRAND.operator} sent you so we can recognise your number.
        </p>
      </div>
    </PhoneFrame>
  );
}
