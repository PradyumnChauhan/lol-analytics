'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ObjectiveTimelineProps {
  match: any;
  playerPuuid: string;
  className?: string;
}

interface ObjectiveEvent {
  timestamp: number;
  time: string;
  type: 'dragon' | 'baron' | 'tower' | 'inhibitor' | 'rift_herald' | 'elder_dragon';
  team: 'blue' | 'red';
  playerInvolved: boolean;
  description: string;
}

export function ObjectiveTimeline({ match, playerPuuid, className = '' }: ObjectiveTimelineProps) {
  if (!match?.info?.participants) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>Match data not available</p>
      </div>
    );
  }

  const participant = match.info.participants.find((p: any) => p.puuid === playerPuuid);
  if (!participant) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>Player not found in match</p>
      </div>
    );
  }

  const teamId = participant.teamId;
  const gameDuration = match.info.gameDuration;
  const gameStartTime = match.info.gameStartTimestamp;

  // Extract objective events from match data
  const objectives: ObjectiveEvent[] = [];

  // Process team objectives
  if (match.info.teams) {
    match.info.teams.forEach((team: any) => {
      const isPlayerTeam = team.teamId === teamId;
      
      // Dragons
      if (team.objectives?.dragon?.kills > 0) {
        objectives.push({
          timestamp: gameStartTime + (team.objectives.dragon.first ? 300000 : 0), // Estimate timing
          time: formatTime(gameStartTime + (team.objectives.dragon.first ? 300000 : 0), gameStartTime),
          type: 'dragon',
          team: team.teamId === 100 ? 'blue' : 'red',
          playerInvolved: isPlayerTeam,
          description: `Dragon (${team.objectives.dragon.kills} kills)`
        });
      }

      // Baron
      if (team.objectives?.baron?.kills > 0) {
        objectives.push({
          timestamp: gameStartTime + (team.objectives.baron.first ? 1200000 : 0), // Estimate timing
          time: formatTime(gameStartTime + (team.objectives.baron.first ? 1200000 : 0), gameStartTime),
          type: 'baron',
          team: team.teamId === 100 ? 'blue' : 'red',
          playerInvolved: isPlayerTeam,
          description: `Baron (${team.objectives.baron.kills} kills)`
        });
      }

      // Towers
      if (team.objectives?.tower?.kills > 0) {
        objectives.push({
          timestamp: gameStartTime + (team.objectives.tower.first ? 600000 : 0), // Estimate timing
          time: formatTime(gameStartTime + (team.objectives.tower.first ? 600000 : 0), gameStartTime),
          type: 'tower',
          team: team.teamId === 100 ? 'blue' : 'red',
          playerInvolved: isPlayerTeam,
          description: `Towers (${team.objectives.tower.kills} destroyed)`
        });
      }

      // Inhibitors
      if (team.objectives?.inhibitor?.kills > 0) {
        objectives.push({
          timestamp: gameStartTime + (team.objectives.inhibitor.first ? 900000 : 0), // Estimate timing
          time: formatTime(gameStartTime + (team.objectives.inhibitor.first ? 900000 : 0), gameStartTime),
          type: 'inhibitor',
          team: team.teamId === 100 ? 'blue' : 'red',
          playerInvolved: isPlayerTeam,
          description: `Inhibitors (${team.objectives.inhibitor.kills} destroyed)`
        });
      }
    });
  }

  // Add player-specific objectives
  if (participant.dragonKills > 0) {
    objectives.push({
      timestamp: gameStartTime + 300000, // Estimate
      time: formatTime(gameStartTime + 300000, gameStartTime),
      type: 'dragon',
      team: teamId === 100 ? 'blue' : 'red',
      playerInvolved: true,
      description: `Dragon (Player involved)`
    });
  }

  if (participant.baronKills > 0) {
    objectives.push({
      timestamp: gameStartTime + 1200000, // Estimate
      time: formatTime(gameStartTime + 1200000, gameStartTime),
      type: 'baron',
      team: teamId === 100 ? 'blue' : 'red',
      playerInvolved: true,
      description: `Baron (Player involved)`
    });
  }

  if (participant.turretKills > 0) {
    objectives.push({
      timestamp: gameStartTime + 600000, // Estimate
      time: formatTime(gameStartTime + 600000, gameStartTime),
      type: 'tower',
      team: teamId === 100 ? 'blue' : 'red',
      playerInvolved: true,
      description: `Tower (Player involved)`
    });
  }

  if (participant.inhibitorKills > 0) {
    objectives.push({
      timestamp: gameStartTime + 900000, // Estimate
      time: formatTime(gameStartTime + 900000, gameStartTime),
      type: 'inhibitor',
      team: teamId === 100 ? 'blue' : 'red',
      playerInvolved: true,
      description: `Inhibitor (Player involved)`
    });
  }

  // Sort by timestamp
  objectives.sort((a, b) => a.timestamp - b.timestamp);

  // Create chart data
  const chartData = objectives.map((obj, index) => ({
    time: obj.time,
    type: obj.type,
    team: obj.team,
    playerInvolved: obj.playerInvolved,
    value: 1,
    description: obj.description,
    color: getObjectiveColor(obj.type, obj.team, obj.playerInvolved)
  }));

  if (objectives.length === 0) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>No objective data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 rounded-xl p-4 ${className}`}>
      <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
        Objective Timeline
      </h3>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              type="number"
              domain={[0, 1]}
              hide
            />
            <YAxis 
              dataKey="time" 
              type="category"
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
              width={60}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
                      <p className="text-white font-semibold">{data.description}</p>
                      <p className="text-slate-300 text-sm">
                        Team: {data.team === 'blue' ? 'Blue' : 'Red'}
                      </p>
                      <p className="text-slate-300 text-sm">
                        Player Involved: {data.playerInvolved ? 'Yes' : 'No'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="text-red-400 font-semibold">
            {objectives.filter(obj => obj.type === 'dragon' && obj.playerInvolved).length}
          </div>
          <div className="text-slate-400">Dragons</div>
        </div>
        <div className="text-center">
          <div className="text-purple-400 font-semibold">
            {objectives.filter(obj => obj.type === 'baron' && obj.playerInvolved).length}
          </div>
          <div className="text-slate-400">Barons</div>
        </div>
        <div className="text-center">
          <div className="text-yellow-400 font-semibold">
            {objectives.filter(obj => obj.type === 'tower' && obj.playerInvolved).length}
          </div>
          <div className="text-slate-400">Towers</div>
        </div>
        <div className="text-center">
          <div className="text-blue-400 font-semibold">
            {objectives.filter(obj => obj.type === 'inhibitor' && obj.playerInvolved).length}
          </div>
          <div className="text-slate-400">Inhibitors</div>
        </div>
      </div>
    </div>
  );
}

function formatTime(timestamp: number, gameStartTime: number): string {
  const minutes = Math.floor((timestamp - gameStartTime) / 60000);
  const seconds = Math.floor(((timestamp - gameStartTime) % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getObjectiveColor(type: string, team: string, playerInvolved: boolean): string {
  if (playerInvolved) {
    return team === 'blue' ? '#3B82F6' : '#EF4444'; // Blue or Red
  }
  
  switch (type) {
    case 'dragon':
      return team === 'blue' ? '#1E40AF' : '#DC2626'; // Darker blue or red
    case 'baron':
      return team === 'blue' ? '#7C3AED' : '#C026D3'; // Purple variants
    case 'tower':
      return team === 'blue' ? '#F59E0B' : '#F97316'; // Orange variants
    case 'inhibitor':
      return team === 'blue' ? '#10B981' : '#059669'; // Green variants
    default:
      return '#6B7280'; // Gray
  }
}

