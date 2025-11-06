import { PlayerSearch } from '@/components/player/PlayerSearchNew';

export default function PlayerPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Player Search & Analysis</h1>
        <PlayerSearch />
      </div>
    </div>
  );
}