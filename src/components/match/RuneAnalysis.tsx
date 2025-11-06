'use client';

import React from 'react';

interface RuneAnalysisProps {
  participant: {
    perks?: {
      styles?: Array<{
        style?: number;
        selections?: Array<{
          perk?: number;
        }>;
      }>;
      statPerks?: {
        defense?: number;
        flex?: number;
        offense?: number;
      };
    };
    [key: string]: unknown;
  };
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
              <span className="text-2xl">{getRuneIcon(primaryRunes.keystone?.id ?? 0)}</span>
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

function extractPrimaryRunes(participant: { perks?: { styles?: Array<{ style?: number; selections?: Array<{ perk?: number }> }> } }): {
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
  const path = perks.styles?.[0]?.style;
  const slots = perks.styles?.[0]?.selections?.slice(1)?.map((selection: { perk?: number }) => {
    const perkId = typeof selection.perk === 'number' ? selection.perk : 0;
    return {
      id: perkId,
      name: getRuneName(perkId),
      description: '',
      icon: '',
      tier: 'primary' as const
    };
  }).filter(rune => rune.id > 0) || [];

  return {
    keystone: typeof keystone === 'number' && keystone > 0 ? {
      id: keystone,
      name: getRuneName(keystone),
      description: '',
      icon: '',
      tier: 'primary'
    } : null,
    path: typeof path === 'number' ? getRunePathName(path) : 'Unknown',
    slots
  };
}

function extractSecondaryRunes(participant: { perks?: { styles?: Array<{ style?: number; selections?: Array<{ perk?: number }> }> } }): {
  path: string;
  pathId: number;
  slots: RuneData[];
} {
  const perks = participant.perks;
  if (!perks || !perks.styles?.[1]) {
    return { path: 'Unknown', pathId: 0, slots: [] };
  }

  const pathId = typeof perks.styles[1].style === 'number' ? perks.styles[1].style : 0;
  const path = pathId > 0 ? getRunePathName(pathId) : 'Unknown';
  const slots = perks.styles[1].selections?.map((selection: { perk?: number }) => {
    const perkId = typeof selection.perk === 'number' ? selection.perk : 0;
    return {
      id: perkId,
      name: getRuneName(perkId),
      description: '',
      icon: '',
      tier: 'secondary' as const
    };
  }).filter(rune => rune.id > 0) || [];

  return { path, pathId, slots };
}

function extractStatRunes(participant: { perks?: { statPerks?: { defense?: number; flex?: number; offense?: number } } }): RuneData[] {
  const perks = participant.perks;
  if (!perks || !perks.statPerks) {
    return [];
  }

  const statPerks = perks.statPerks;
  const defense = typeof statPerks.defense === 'number' ? statPerks.defense : 0;
  const flex = typeof statPerks.flex === 'number' ? statPerks.flex : 0;
  const offense = typeof statPerks.offense === 'number' ? statPerks.offense : 0;
  return [
    {
      id: defense,
      name: getStatRuneName(defense),
      description: getStatRuneDescription(defense),
      icon: '',
      tier: 'stat' as const
    },
    {
      id: flex,
      name: getStatRuneName(flex),
      description: getStatRuneDescription(flex),
      icon: '',
      tier: 'stat' as const
    },
    {
      id: offense,
      name: getStatRuneName(offense),
      description: getStatRuneDescription(offense),
      icon: '',
      tier: 'stat' as const
    }
  ].filter(stat => stat.id > 0);
}

function getRuneName(runeId: number | undefined): string {
  if (typeof runeId !== 'number' || runeId <= 0) return 'Unknown';
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

function getRunePathName(pathId: number | string | undefined): string {
  if (typeof pathId !== 'number' || pathId <= 0) return 'Unknown';
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

function getStatRuneName(statId: number | undefined): string {
  if (typeof statId !== 'number' || statId <= 0) return 'Unknown';
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

function getStatRuneDescription(statId: number | undefined): string {
  if (typeof statId !== 'number' || statId <= 0) return '';
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

function getStatIcon(statId: number | undefined): string {
  if (typeof statId !== 'number' || statId <= 0) return '❓';
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

