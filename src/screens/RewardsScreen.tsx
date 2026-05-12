import { ScreenHeader, CoinBar } from '../components/ui/Primitives';
import { useProfileStore } from '../store/profileStore';

export function RewardsScreen({ onBack }: { onBack: () => void }) {
  const profile = useProfileStore((s) => s.profile);
  return (
    <div className="min-h-screen flex flex-col">
      <ScreenHeader title="Rewards" onBack={onBack} />
      <div className="px-5 mt-4">
        <div className="card p-6 text-center">
          <p className="text-cream/70 text-sm">Your balance</p>
          <div className="display-font text-5xl text-gold mt-2">{profile?.coins.toLocaleString() ?? 0}</div>
          <div className="mt-3 flex justify-center"><CoinBar coins={profile?.coins ?? 0} /></div>
        </div>

        <div className="card p-5 mt-4">
          <h2 className="display-font text-xl text-gold mb-2">Earn coins</h2>
          <ul className="space-y-2 text-sm text-cream/85">
            <li className="flex justify-between"><span>Win vs AI Easy</span><span>+5</span></li>
            <li className="flex justify-between"><span>Win vs AI Medium</span><span>+10</span></li>
            <li className="flex justify-between"><span>Win vs AI Hard</span><span>+20</span></li>
            <li className="flex justify-between"><span>Win Local PvP</span><span>+15</span></li>
            <li className="flex justify-between"><span>Win Online PvP</span><span>+25</span></li>
            <li className="flex justify-between"><span>Daily login</span><span>+10</span></li>
            <li className="flex justify-between"><span>Streak 3+ bonus</span><span>+5</span></li>
          </ul>
        </div>

        <div className="card p-5 mt-4 opacity-90">
          <h2 className="display-font text-xl text-gold mb-2">Coming soon</h2>
          <p className="text-cream/80 text-sm">Redeem your coins for airtime and data bundles.</p>
        </div>
      </div>
    </div>
  );
}
