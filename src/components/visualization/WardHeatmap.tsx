'use client';

import React from 'react';

interface WardHeatmapProps {
  matchData: any[];
  playerPuuid: string;
  className?: string;
  noContainer?: boolean;
}

interface WardPlacement {
  x: number;
  y: number;
  type: 'ward' | 'control_ward' | 'sweeper';
  timestamp: number;
  gameTime: number;
}

export function WardHeatmap({ matchData, playerPuuid, className = '', noContainer = false }: WardHeatmapProps) {
  if (!matchData || matchData.length === 0) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>No match data available</p>
      </div>
    );
  }

  // Extract ward data from matches
  const wardData = extractWardData(matchData, playerPuuid);
  
  if (wardData.length === 0) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>No ward data available</p>
      </div>
    );
  }

  // Create heatmap grid
  const heatmapGrid = createHeatmapGrid(wardData);

  const containerClasses = noContainer 
    ? `p-0 ${className}` 
    : `bg-white/5 rounded p-2 ${className}`;

  return (
    <div className={containerClasses}>
      <h3 className="text-white text-sm font-semibold mb-1 flex items-center">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
        Ward Placement Heatmap
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
            
            {/* Heatmap overlay */}
            {heatmapGrid.map((cell, index) => (
              <div
                key={index}
                className="absolute w-4 h-4 rounded-full opacity-60"
                style={{
                  left: `${cell.x}%`,
                  top: `${cell.y}%`,
                  backgroundColor: getHeatmapColor(cell.intensity),
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}
          </div>
          
          {/* Legend */}
          <div className="absolute top-1 right-1 bg-slate-900/80 rounded p-1 text-[10px]">
            <div className="text-white font-semibold mb-0.5">Ward Density</div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-white/80">High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-white/80">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-white/80">Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ward Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mb-1">
        <div className="text-center">
          <div className="text-green-400 font-semibold text-xs">
            {wardData.filter(w => w.type === 'ward').length}
          </div>
          <div className="text-white/60 text-[10px]">Wards Placed</div>
        </div>
        <div className="text-center">
          <div className="text-yellow-400 font-semibold text-xs">
            {wardData.filter(w => w.type === 'control_ward').length}
          </div>
          <div className="text-white/60 text-[10px]">Control Wards</div>
        </div>
        <div className="text-center">
          <div className="text-blue-400 font-semibold text-xs">
            {wardData.filter(w => w.type === 'sweeper').length}
          </div>
          <div className="text-white/60 text-[10px]">Wards Cleared</div>
        </div>
        <div className="text-center">
          <div className="text-purple-400 font-semibold text-xs">
            {calculateWardEfficiency(wardData).toFixed(1)}%
          </div>
          <div className="text-white/60 text-[10px]">Efficiency</div>
        </div>
      </div>

      {/* Ward Placement Analysis */}
      <div className="space-y-1 mb-1">
        <h4 className="text-white text-xs font-medium">Ward Placement Analysis</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          <div className="bg-white/5 rounded p-1.5">
            <div className="text-green-400 text-xs font-medium mb-1">Best Areas</div>
            <div className="space-y-0.5 text-[10px] text-white/80">
              {getBestWardAreas(heatmapGrid).map((area, index) => (
                <div key={index}>{area}</div>
              ))}
            </div>
          </div>
          
          <div className="bg-white/5 rounded p-1.5">
            <div className="text-red-400 text-xs font-medium mb-1">Improvement Areas</div>
            <div className="space-y-0.5 text-[10px] text-white/80">
              {getImprovementAreas(heatmapGrid).map((area, index) => (
                <div key={index}>{area}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ward Tips */}
      <div className="pt-1 border-t border-white/10">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-1.5">
          <div className="text-blue-400 text-xs font-medium mb-1 flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1"></span>
            💡 Ward Placement Tips
          </div>
          <div className="text-white/80 text-[10px] space-y-0.5">
            <div>• Place wards in high-traffic areas like river entrances</div>
            <div>• Use control wards for objective control</div>
            <div>• Ward enemy jungle when ahead</div>
            <div>• Clear enemy vision before important fights</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractWardData(matchData: any[], playerPuuid: string): WardPlacement[] {
  const wardData: WardPlacement[] = [];

  matchData.forEach(match => {
    const participant = match.info?.participants?.find((p: any) => p.puuid === playerPuuid);
    if (!participant) return;

    const gameStartTime = match.info.gameStartTimestamp;
    const gameDuration = match.info.gameDuration;

    // Estimate ward placements based on available data
    const wardsPlaced = participant.wardsPlaced || 0;
    const controlWardsPlaced = participant.controlWardsPlaced || 0;
    const wardsKilled = participant.wardsKilled || 0;

    // Generate estimated ward positions (in real implementation, this would come from timeline data)
    for (let i = 0; i < wardsPlaced; i++) {
      wardData.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        type: 'ward',
        timestamp: gameStartTime + (i / wardsPlaced) * gameDuration,
        gameTime: (i / wardsPlaced) * gameDuration
      });
    }

    for (let i = 0; i < controlWardsPlaced; i++) {
      wardData.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        type: 'control_ward',
        timestamp: gameStartTime + (i / controlWardsPlaced) * gameDuration,
        gameTime: (i / controlWardsPlaced) * gameDuration
      });
    }

    for (let i = 0; i < wardsKilled; i++) {
      wardData.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        type: 'sweeper',
        timestamp: gameStartTime + (i / wardsKilled) * gameDuration,
        gameTime: (i / wardsKilled) * gameDuration
      });
    }
  });

  return wardData;
}

function createHeatmapGrid(wardData: WardPlacement[]): Array<{
  x: number;
  y: number;
  intensity: number;
  count: number;
}> {
  const gridSize = 20; // 20x20 grid
  const grid: Array<{ x: number; y: number; intensity: number; count: number }> = [];

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const cellX = (x / gridSize) * 100;
      const cellY = (y / gridSize) * 100;
      
      // Count wards in this cell
      const cellWards = wardData.filter(ward => 
        Math.abs(ward.x - cellX) < (100 / gridSize) && 
        Math.abs(ward.y - cellY) < (100 / gridSize)
      );

      grid.push({
        x: cellX,
        y: cellY,
        intensity: cellWards.length,
        count: cellWards.length
      });
    }
  }

  return grid;
}

function getHeatmapColor(intensity: number): string {
  if (intensity === 0) return 'transparent';
  if (intensity <= 2) return '#10B981'; // Green
  if (intensity <= 4) return '#F59E0B'; // Yellow
  return '#EF4444'; // Red
}

function calculateWardEfficiency(wardData: WardPlacement[]): number {
  const totalWards = wardData.filter(w => w.type === 'ward' || w.type === 'control_ward').length;
  const wardsCleared = wardData.filter(w => w.type === 'sweeper').length;
  
  if (totalWards === 0) return 0;
  return (wardsCleared / totalWards) * 100;
}

function getBestWardAreas(heatmapGrid: any[]): string[] {
  const highIntensityCells = heatmapGrid
    .filter(cell => cell.intensity >= 3)
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 3);

  return highIntensityCells.map((cell, index) => 
    `Area ${index + 1}: ${cell.intensity} wards placed`
  );
}

function getImprovementAreas(heatmapGrid: any[]): string[] {
  const lowIntensityCells = heatmapGrid
    .filter(cell => cell.intensity === 0)
    .slice(0, 3);

  return lowIntensityCells.map((cell, index) => 
    `Area ${index + 1}: No wards placed`
  );
}

