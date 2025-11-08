'use client';

import React from 'react';

interface ItemBuildTimelineProps {
  match: {
    info?: {
      participants?: Array<{ puuid: string; item0?: number; item1?: number; item2?: number; item3?: number; item4?: number; item5?: number; item6?: number; goldEarned?: number; itemsPurchased?: number; [key: string]: unknown }>;
      gameStartTimestamp?: number;
      gameDuration?: number;
    };
  };
  playerPuuid: string;
  className?: string;
}

interface ItemEvent {
  timestamp: number;
  time: string;
  itemId: number;
  itemName: string;
  slot: number;
  cost: number;
  description: string;
}

export function ItemBuildTimeline({ match, playerPuuid, className = '' }: ItemBuildTimelineProps) {
  if (!match?.info?.participants) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>Match data not available</p>
      </div>
    );
  }

  const participant = match.info.participants.find((p: { puuid: string }) => p.puuid === playerPuuid);
  if (!participant) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>Player not found in match</p>
      </div>
    );
  }

  const gameStartTime = match.info.gameStartTimestamp ?? 0;
  const gameDuration = match.info.gameDuration ?? 0;

  // Extract final items
  const finalItems = [
    { slot: 0, itemId: participant.item0 ?? 0, name: getItemName(participant.item0 ?? 0) },
    { slot: 1, itemId: participant.item1 ?? 0, name: getItemName(participant.item1 ?? 0) },
    { slot: 2, itemId: participant.item2 ?? 0, name: getItemName(participant.item2 ?? 0) },
    { slot: 3, itemId: participant.item3 ?? 0, name: getItemName(participant.item3 ?? 0) },
    { slot: 4, itemId: participant.item4 ?? 0, name: getItemName(participant.item4 ?? 0) },
    { slot: 5, itemId: participant.item5 ?? 0, name: getItemName(participant.item5 ?? 0) },
    { slot: 6, itemId: participant.item6 ?? 0, name: getItemName(participant.item6 ?? 0) }, // Trinket
  ].filter(item => item.itemId > 0 && typeof item.itemId === 'number');

  // Estimate item purchase times based on gold progression
  const totalGold = participant.goldEarned || 0;
  // const itemsPurchased = participant.itemsPurchased || 0;

  // Create estimated timeline
  const itemEvents: ItemEvent[] = [];
  let currentGold = 0;

  finalItems.forEach((item) => {
    if (item.itemId > 0 && typeof item.itemId === 'number' && gameStartTime > 0 && gameDuration > 0) {
      const itemCost = getItemCost(item.itemId);
      currentGold += itemCost;
      
      // Estimate purchase time based on gold progression
      const timeProgress = totalGold > 0 ? Math.min(currentGold / totalGold, 0.95) : 0; // Cap at 95% of game
      const estimatedTimestamp = gameStartTime + (gameDuration * timeProgress);
      
      itemEvents.push({
        timestamp: estimatedTimestamp,
        time: formatTime(estimatedTimestamp, gameStartTime),
        itemId: item.itemId,
        itemName: item.name,
        slot: item.slot,
        cost: itemCost,
        description: `${item.name} (${itemCost} gold)`
      });
    }
  });

  // Sort by estimated time
  itemEvents.sort((a, b) => a.timestamp - b.timestamp);

  // Calculate build phases
  const buildPhases = gameDuration > 0 ? calculateBuildPhases(itemEvents, gameDuration) : [];

  return (
    <div className={`bg-white/5 rounded-xl p-4 ${className}`}>
      <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
        Item Build Timeline
      </h3>
      
      {/* Build Phases */}
      <div className="mb-6">
        <h4 className="text-white text-sm font-medium mb-3">Build Phases</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {buildPhases.map((phase, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-3">
              <div className="text-slate-300 text-sm font-medium mb-2">{phase.name}</div>
              <div className="text-slate-400 text-xs mb-2">{phase.timeRange}</div>
              <div className="flex flex-wrap gap-1">
                {phase.items.map((item, itemIndex) => (
                  <span
                    key={itemIndex}
                    className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Item Timeline */}
      <div className="space-y-3">
        <h4 className="text-white text-sm font-medium">Item Purchases</h4>
        {itemEvents.map((event, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-xs font-mono">
                {event.itemId}
              </div>
              <div>
                <div className="text-white text-sm font-medium">{event.itemName}</div>
                <div className="text-slate-400 text-xs">Slot {event.slot}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-300 text-sm">{event.time}</div>
              <div className="text-slate-400 text-xs">{event.cost} gold</div>
            </div>
          </div>
        ))}
      </div>

      {/* Final Build Summary */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <h4 className="text-white text-sm font-medium mb-3">Final Build</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {finalItems.map((item, index) => (
            <div
              key={index}
              className="bg-slate-800 rounded-lg p-2 text-center"
            >
              <div className="w-8 h-8 bg-slate-700 rounded mx-auto mb-1 flex items-center justify-center text-xs font-mono">
                {item.itemId}
              </div>
              <div className="text-slate-300 text-xs truncate">{item.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Build Statistics */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="text-yellow-400 font-semibold">
            {finalItems.reduce((sum, item) => {
              const itemId = typeof item.itemId === 'number' ? item.itemId : 0;
              return sum + getItemCost(itemId);
            }, 0).toLocaleString()}
          </div>
          <div className="text-slate-400">Total Cost</div>
        </div>
        <div className="text-center">
          <div className="text-blue-400 font-semibold">
            {itemEvents.length}
          </div>
          <div className="text-slate-400">Items Purchased</div>
        </div>
        <div className="text-center">
          <div className="text-green-400 font-semibold">
            {participant.itemsPurchased || 0}
          </div>
          <div className="text-slate-400">Total Purchases</div>
        </div>
        <div className="text-center">
          <div className="text-purple-400 font-semibold">
            {participant.goldSpent?.toLocaleString() || 0}
          </div>
          <div className="text-slate-400">Gold Spent</div>
        </div>
      </div>
    </div>
  );
}

function getItemName(itemId: number): string {
  // This would ideally use a static data file
  const itemNames: Record<number, string> = {
    3078: 'Trinity Force',
    3161: 'Spear of Shojin',
    6665: 'Crown of the Shattered Queen',
    1054: 'Doran\'s Shield',
    3111: 'Mercury\'s Treads',
    3065: 'Spirit Visage',
    3363: 'Farsight Alteration',
    // Add more items as needed
  };
  
  return itemNames[itemId] || `Item ${itemId}`;
}

function getItemCost(itemId: number): number {
  // This would ideally use a static data file
  const itemCosts: Record<number, number> = {
    3078: 3333,
    3161: 3300,
    6665: 3200,
    1054: 450,
    3111: 1100,
    3065: 2900,
    3363: 0,
    // Add more items as needed
  };
  
  return itemCosts[itemId] || 0;
}

function formatTime(timestamp: number, gameStartTime: number): string {
  const minutes = Math.floor((timestamp - gameStartTime) / 60000);
  const seconds = Math.floor(((timestamp - gameStartTime) % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function calculateBuildPhases(events: ItemEvent[], gameDuration: number): Array<{
  name: string;
  timeRange: string;
  items: Array<{ name: string; cost: number }>;
}> {
  const phases = [
    {
      name: 'Early Game',
      timeRange: '0-15 min',
      items: events.filter(e => e.timestamp <= gameDuration * 0.25).map(e => ({ name: e.itemName, cost: e.cost }))
    },
    {
      name: 'Mid Game',
      timeRange: '15-30 min',
      items: events.filter(e => e.timestamp > gameDuration * 0.25 && e.timestamp <= gameDuration * 0.5).map(e => ({ name: e.itemName, cost: e.cost }))
    },
    {
      name: 'Late Game',
      timeRange: '30+ min',
      items: events.filter(e => e.timestamp > gameDuration * 0.5).map(e => ({ name: e.itemName, cost: e.cost }))
    }
  ];

  return phases.filter(phase => phase.items.length > 0);
}

