'use client';

import { Card } from '@/components/ui/card';
import { Trophy, AlertCircle } from 'lucide-react';

interface ChampionRecommendationsProps {
  insights: string;
  topChampions: Array<{
    championName: string;
    games: number;
    winRate: number;
    avgKDA: number;
  }>;
}

export function ChampionRecommendations({ insights, topChampions }: ChampionRecommendationsProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-yellow-600" />
        <h3 className="font-semibold text-lg">Champion Recommendations</h3>
      </div>

      <div className="prose max-w-none mb-6">
        <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg">
          {insights || 'No champion recommendations available yet.'}
        </div>
      </div>

      {topChampions.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Your Top Champions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topChampions.slice(0, 6).map((champ, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  champ.winRate >= 55
                    ? 'bg-green-50 border-green-200'
                    : champ.winRate < 45
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{champ.championName}</span>
                  {champ.winRate >= 55 ? (
                    <Trophy className="h-4 w-4 text-green-600" />
                  ) : champ.winRate < 45 ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : null}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {champ.games} games • {champ.winRate.toFixed(1)}% WR • {champ.avgKDA.toFixed(2)} KDA
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

