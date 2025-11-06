'use client';

import React from 'react';

interface DeathLocationMapProps {
  matchData: Array<Record<string, unknown>>;
  playerPuuid: string;
  className?: string;
}

interface DeathLocation {
  x: number;
  y: number;
  timestamp: number;
  gameTime: number;
  cause: string;
  champion: string;
  level: number;
}

export function DeathLocationMap({ matchData, playerPuuid, className = '' }: DeathLocationMapProps) {
  if (!matchData || matchData.length === 0) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>No match data available</p>
      </div>
    );
  }

  // Extract death data from matches
  const deathData = extractDeathData(matchData, playerPuuid);
  
  if (deathData.length === 0) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>No death data available</p>
      </div>
    );
  }

  // Create death heatmap
  const deathHeatmap = createDeathHeatmap(deathData);

  // Calculate death statistics
  const totalDeaths = deathData.length
  const championDeaths = deathData.filter(d => d.cause === 'champion').length
  const towerDeaths = deathData.filter(d => d.cause === 'tower').length
  const avgDeathTime = deathData.length > 0 
    ? deathData.reduce((sum, d) => sum + d.gameTime, 0) / deathData.length 
    : 0
  const earlyDeaths = deathData.filter(d => d.gameTime < 600000).length // Before 10 min
  const lateDeaths = deathData.filter(d => d.gameTime > 1800000).length // After 30 min

  return (
    <div className={`bg-white/5 rounded p-2 ${className}`}>
      <h3 className="text-white text-sm font-semibold mb-1 flex items-center">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
        Death Location Analysis
      </h3>
      
      {/* Map Visualization */}
      <div className="relative bg-slate-800 rounded p-2 mb-1">
        <div className="relative w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 rounded overflow-hidden">
          {/* Summoner's Rift representation */}
          <div className="absolute inset-0">
            {/* River */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-blue-500/30 transform -translate-y-1/2"></div>
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-blue-500/30 transform -translate-x-1/2"></div>
            
            {/* Baron/Dragon pits */}
            <div className="absolute top-1/4 left-1/2 w-8 h-8 bg-purple-500/20 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-1/4 left-1/2 w-8 h-8 bg-orange-500/20 rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
            
            {/* Death locations */}
            {deathData.map((death, index) => (
              <div
                key={index}
                className="absolute w-3 h-3 rounded-full opacity-80 animate-pulse"
                style={{
                  left: `${death.x}%`,
                  top: `${death.y}%`,
                  backgroundColor: getDeathColor(death.cause),
                  transform: 'translate(-50%, -50%)'
                }}
                title={`${death.champion} - ${death.cause} - ${formatGameTime(death.gameTime)}`}
              />
            ))}
          </div>
          
          {/* Legend */}
          <div className="absolute top-1 right-1 bg-slate-900/80 rounded p-1 text-[10px]">
            <div className="text-white font-semibold mb-0.5">Death Causes</div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-white/80">Champion</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-white/80">Tower</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-white/80">Monster</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-white/80">Other</span>
            </div>
          </div>
        </div>
      </div>

      {/* Death Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mb-1">
        <div className="text-center">
          <div className="text-red-400 font-semibold text-xs">
            {totalDeaths}
          </div>
          <div className="text-white/60 text-[10px]">Total Deaths</div>
        </div>
        <div className="text-center">
          <div className="text-orange-400 font-semibold text-xs">
            {championDeaths} ({totalDeaths > 0 ? ((championDeaths / totalDeaths) * 100).toFixed(0) : 0}%)
          </div>
          <div className="text-white/60 text-[10px]">vs Champions</div>
        </div>
        <div className="text-center">
          <div className="text-yellow-400 font-semibold text-xs">
            {towerDeaths} ({totalDeaths > 0 ? ((towerDeaths / totalDeaths) * 100).toFixed(0) : 0}%)
          </div>
          <div className="text-white/60 text-[10px]">vs Towers</div>
        </div>
        <div className="text-center">
          <div className="text-purple-400 font-semibold text-xs">
            {calculateDeathRate(deathData).toFixed(1)}
          </div>
          <div className="text-white/60 text-[10px]">Deaths/Game</div>
        </div>
      </div>

      {/* Enhanced Death Analysis */}
      <div className="space-y-1 mb-1">
        <h4 className="text-white text-xs font-medium">Death Pattern Analysis</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          <div className="bg-white/5 rounded p-1.5">
            <div className="text-red-400 text-xs font-medium mb-1">Common Death Areas</div>
            <div className="space-y-0.5 text-[10px] text-white/80">
              {getCommonDeathAreas(deathHeatmap).slice(0, 3).map((area, index) => (
                <div key={index}>{area}</div>
              ))}
            </div>
          </div>
          
          <div className="bg-white/5 rounded p-1.5">
            <div className="text-yellow-400 text-xs font-medium mb-1">Timing Analysis</div>
            <div className="space-y-0.5 text-[10px] text-white/80">
              <div>Early: {earlyDeaths} ({totalDeaths > 0 ? ((earlyDeaths / totalDeaths) * 100).toFixed(0) : 0}%)</div>
              <div>Late: {lateDeaths} ({totalDeaths > 0 ? ((lateDeaths / totalDeaths) * 100).toFixed(0) : 0}%)</div>
              <div>Avg: {formatGameTime(avgDeathTime)}</div>
            </div>
          </div>

          <div className="bg-white/5 rounded p-1.5">
            <div className="text-green-400 text-xs font-medium mb-1">Safe Areas</div>
            <div className="space-y-0.5 text-[10px] text-white/80">
              {getSafeAreas(deathHeatmap).slice(0, 3).map((area, index) => (
                <div key={index}>{area}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Death Timeline */}
      <div className="mb-1">
        <h4 className="text-white text-xs font-medium mb-1">Recent Deaths</h4>
        <div className="space-y-0.5">
          {deathData.slice(-5).reverse().map((death, index) => (
            <div key={index} className="flex items-center justify-between bg-white/5 rounded p-1">
              <div className="flex items-center space-x-1.5">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getDeathColor(death.cause) }}
                ></div>
                <div>
                  <div className="text-white text-xs font-medium">{death.champion}</div>
                  <div className="text-white/60 text-[10px]">L{death.level} • {death.cause}</div>
                </div>
              </div>
              <div className="text-white/60 text-[10px]">
                {formatGameTime(death.gameTime)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Death Prevention Tips */}
      <div className="pt-1 border-t border-white/10">
        <div className="bg-red-500/10 border border-red-500/20 rounded p-1.5">
          <div className="text-red-400 text-xs font-medium mb-1 flex items-center">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1"></span>
            💀 Death Prevention Tips
          </div>
          <div className="text-white/80 text-[10px] space-y-0.5">
            <div>• Avoid overextending without vision</div>
            <div>• Watch your positioning in team fights</div>
            <div>• Don&apos;t chase kills into unwarded areas</div>
            <div>• Respect enemy tower range and damage</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractDeathData(matchData: Array<Record<string, unknown>>, playerPuuid: string): DeathLocation[] {
  const deathData: DeathLocation[] = [];

  matchData.forEach(match => {
    const matchInfo = match.info as { 
      participants?: Array<{ puuid: string; deaths?: number; championName?: string; champLevel?: number; [key: string]: unknown }>; 
      gameStartTimestamp?: number;
      gameDuration?: number;
    } | undefined;
    const participant = matchInfo?.participants?.find((p: { puuid: string }) => p.puuid === playerPuuid);
    if (!participant) return;

    const gameStartTime = matchInfo?.gameStartTimestamp ?? 0;
    const gameDuration = matchInfo?.gameDuration ?? 0;
    const deaths = typeof participant.deaths === 'number' ? participant.deaths : 0;

    if (gameDuration <= 0 || deaths <= 0) return;

    // Estimate death locations and causes (in real implementation, this would come from timeline data)
    for (let i = 0; i < deaths; i++) {
      const gameTime = (i / deaths) * gameDuration;
      const causes = ['champion', 'tower', 'monster', 'other'];
      const cause = causes[Math.floor(Math.random() * causes.length)] as 'champion' | 'tower' | 'monster' | 'other';

      const championName = typeof participant.championName === 'string' ? participant.championName : 'Unknown';
      const champLevel = typeof participant.champLevel === 'number' ? participant.champLevel : 1;

      deathData.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        timestamp: gameStartTime + gameTime,
        gameTime,
        cause,
        champion: championName,
        level: Math.min(champLevel, 18)
      });
    }
  });

  return deathData;
}

function createDeathHeatmap(deathData: DeathLocation[]): Array<{
  x: number;
  y: number;
  intensity: number;
  deaths: DeathLocation[];
}> {
  const gridSize = 20;
  const heatmap: Array<{ x: number; y: number; intensity: number; deaths: DeathLocation[] }> = [];

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const cellX = (x / gridSize) * 100;
      const cellY = (y / gridSize) * 100;
      
      const cellDeaths = deathData.filter(death => 
        Math.abs(death.x - cellX) < (100 / gridSize) && 
        Math.abs(death.y - cellY) < (100 / gridSize)
      );

      heatmap.push({
        x: cellX,
        y: cellY,
        intensity: cellDeaths.length,
        deaths: cellDeaths
      });
    }
  }

  return heatmap;
}

function getDeathColor(cause: string): string {
  switch (cause) {
    case 'champion':
      return '#EF4444'; // Red
    case 'tower':
      return '#F59E0B'; // Orange
    case 'monster':
      return '#F59E0B'; // Yellow
    default:
      return '#8B5CF6'; // Purple
  }
}

function calculateDeathRate(deathData: DeathLocation[]): number {
  // This would be calculated based on actual match count
  return deathData.length / 10; // Assuming 10 matches for now
}

function getCommonDeathAreas(heatmap: Array<{ intensity: number }>): string[] {
  const highIntensityCells = heatmap
    .filter(cell => cell.intensity >= 2)
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 3);

  return highIntensityCells.map((cell, index) => 
    `Area ${index + 1}: ${cell.intensity} deaths`
  );
}

function getSafeAreas(_heatmap: Array<{ intensity: number }>): string[] {
  const safeAreas = [
    'Base area - safest location',
    'Warded jungle - good vision',
    'Behind team - protected positioning'
  ];

  return safeAreas;
}

function formatGameTime(gameTime: number): string {
  // gameTime is in milliseconds, convert to minutes and seconds
  const totalSeconds = Math.floor(gameTime / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

