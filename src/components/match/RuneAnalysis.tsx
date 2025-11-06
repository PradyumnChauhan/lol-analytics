'use client';

import React from 'react';

interface RuneAnalysisProps {
  participant: any;
  className?: string;
}

interface RuneData {
  id: number;
  name: string;
  description: string;
  icon: string;
  tier: 'primary' | 'secondary' | 'stat';
  path?: string;
}

export function RuneAnalysis({ participant, className = '' }: RuneAnalysisProps) {
  if (!participant) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>Participant data not available</p>
      </div>
    );
  }

  // Extract rune data from participant
  const primaryRunes = extractPrimaryRunes(participant);
  const secondaryRunes = extractSecondaryRunes(participant);
  const statRunes = extractStatRunes(participant);

  return (
    <div className={`bg-white/5 rounded-xl p-4 ${className}`}>
      <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
        Rune Analysis
      </h3>
      
      {/* Primary Runes */}
      <div className="mb-6">
        <h4 className="text-white text-sm font-medium mb-3">Primary Path</h4>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
              <span className="text-2xl">{getRuneIcon(primaryRunes.keystone?.id)}</span>
            </div>
            <div>
              <div className="text-white font-semibold">{primaryRunes.keystone?.name || 'Unknown'}</div>
              <div className="text-slate-400 text-sm">{primaryRunes.path || 'Unknown Path'}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {primaryRunes.slots.map((rune, index) => (
              <div key={index} className="text-center">
                <div className="w-8 h-8 bg-slate-700 rounded mx-auto mb-1 flex items-center justify-center text-sm">
                  {getRuneIcon(rune.id)}
                </div>
                <div className="text-slate-300 text-xs">{rune.name || `Rune ${index + 1}`}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Runes */}
      <div className="mb-6">
        <h4 className="text-white text-sm font-medium mb-3">Secondary Path</h4>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
              <span className="text-2xl">{getRuneIcon(secondaryRunes.pathId)}</span>
            </div>
            <div>
              <div className="text-white font-semibold">{secondaryRunes.path || 'Unknown'}</div>
              <div className="text-slate-400 text-sm">Secondary Path</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {secondaryRunes.slots.map((rune, index) => (
              <div key={index} className="text-center">
                <div className="w-8 h-8 bg-slate-700 rounded mx-auto mb-1 flex items-center justify-center text-sm">
                  {getRuneIcon(rune.id)}
                </div>
                <div className="text-slate-300 text-xs">{rune.name || `Rune ${index + 1}`}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Runes */}
      <div className="mb-6">
        <h4 className="text-white text-sm font-medium mb-3">Stat Modifiers</h4>
        <div className="grid grid-cols-3 gap-3">
          {statRunes.map((stat, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-3 text-center">
              <div className="w-8 h-8 bg-slate-700 rounded mx-auto mb-2 flex items-center justify-center text-sm">
                {getStatIcon(stat.id)}
              </div>
              <div className="text-slate-300 text-xs">{stat.name || `Stat ${index + 1}`}</div>
              <div className="text-slate-400 text-xs">{stat.description || ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rune Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="text-yellow-400 font-semibold">
            {primaryRunes.keystone?.name ? '1' : '0'}
          </div>
          <div className="text-slate-400">Keystone</div>
        </div>
        <div className="text-center">
          <div className="text-blue-400 font-semibold">
            {primaryRunes.slots.length}
          </div>
          <div className="text-slate-400">Primary Runes</div>
        </div>
        <div className="text-center">
          <div className="text-green-400 font-semibold">
            {secondaryRunes.slots.length}
          </div>
          <div className="text-slate-400">Secondary Runes</div>
        </div>
        <div className="text-center">
          <div className="text-purple-400 font-semibold">
            {statRunes.length}
          </div>
          <div className="text-slate-400">Stat Mods</div>
        </div>
      </div>
    </div>
  );
}

function extractPrimaryRunes(participant: any): {
  keystone: RuneData | null;
  path: string;
  slots: RuneData[];
} {
  // Extract from perks (if available)
  const perks = participant.perks;
  if (!perks) {
    return { keystone: null, path: 'Unknown', slots: [] };
  }

  const keystone = perks.styles?.[0]?.selections?.[0]?.perk;
  const path = perks.styles?.[0]?.style || 'Unknown';
  const slots = perks.styles?.[0]?.selections?.slice(1)?.map((selection: any) => ({
    id: selection.perk,
    name: getRuneName(selection.perk),
    description: '',
    icon: '',
    tier: 'primary' as const
  })) || [];

  return {
    keystone: keystone ? {
      id: keystone,
      name: getRuneName(keystone),
      description: '',
      icon: '',
      tier: 'primary'
    } : null,
    path: getRunePathName(path),
    slots
  };
}

function extractSecondaryRunes(participant: any): {
  path: string;
  pathId: number;
  slots: RuneData[];
} {
  const perks = participant.perks;
  if (!perks || !perks.styles?.[1]) {
    return { path: 'Unknown', pathId: 0, slots: [] };
  }

  const pathId = perks.styles[1].style;
  const path = getRunePathName(pathId);
  const slots = perks.styles[1].selections?.map((selection: any) => ({
    id: selection.perk,
    name: getRuneName(selection.perk),
    description: '',
    icon: '',
    tier: 'secondary' as const
  })) || [];

  return { path, pathId, slots };
}

function extractStatRunes(participant: any): RuneData[] {
  const perks = participant.perks;
  if (!perks || !perks.statPerks) {
    return [];
  }

  const statPerks = perks.statPerks;
  return [
    {
      id: statPerks.defense || 0,
      name: getStatRuneName(statPerks.defense),
      description: getStatRuneDescription(statPerks.defense),
      icon: '',
      tier: 'stat'
    },
    {
      id: statPerks.flex || 0,
      name: getStatRuneName(statPerks.flex),
      description: getStatRuneDescription(statPerks.flex),
      icon: '',
      tier: 'stat'
    },
    {
      id: statPerks.offense || 0,
      name: getStatRuneName(statPerks.offense),
      description: getStatRuneDescription(statPerks.offense),
      icon: '',
      tier: 'stat'
    }
  ].filter(stat => stat.id > 0);
}

function getRuneName(runeId: number): string {
  // This would ideally use a static data file
  const runeNames: Record<number, string> = {
    8000: 'Precision',
    8100: 'Domination',
    8200: 'Sorcery',
    8300: 'Inspiration',
    8400: 'Resolve',
    // Add more runes as needed
  };
  
  return runeNames[runeId] || `Rune ${runeId}`;
}

function getRunePathName(pathId: number): string {
  const pathNames: Record<number, string> = {
    8000: 'Precision',
    8100: 'Domination',
    8200: 'Sorcery',
    8300: 'Inspiration',
    8400: 'Resolve',
  };
  
  return pathNames[pathId] || 'Unknown';
}

function getRuneIcon(runeId: number): string {
  // Return emoji or icon representation
  const icons: Record<number, string> = {
    8000: '⚔️',
    8100: '🔥',
    8200: '⚡',
    8300: '💡',
    8400: '🛡️',
  };
  
  return icons[runeId] || '❓';
}

function getStatRuneName(statId: number): string {
  const statNames: Record<number, string> = {
    5001: '+9 Adaptive Force',
    5002: '+9 Adaptive Force',
    5003: '+8 Magic Resist',
    5005: '+10% Attack Speed',
    5007: '+1-10% CDR',
    5008: '+6 Armor',
  };
  
  return statNames[statId] || `Stat ${statId}`;
}

function getStatRuneDescription(statId: number): string {
  const descriptions: Record<number, string> = {
    5001: 'Adaptive Force',
    5002: 'Adaptive Force',
    5003: 'Magic Resist',
    5005: 'Attack Speed',
    5007: 'Cooldown Reduction',
    5008: 'Armor',
  };
  
  return descriptions[statId] || '';
}

function getStatIcon(statId: number): string {
  const icons: Record<number, string> = {
    5001: '⚔️',
    5002: '⚔️',
    5003: '🛡️',
    5005: '🏹',
    5007: '⏱️',
    5008: '🛡️',
  };
  
  return icons[statId] || '❓';
}

