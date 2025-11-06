'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Sword, Crown, Ban } from 'lucide-react';

interface LiveGameParticipant {
  puuid: string;
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  championId: number;
  profileIconId: number;
  riotId: string;
  bot: boolean;
}

interface BannedChampion {
  championId: number;
  teamId: number;
  pickTurn: number;
}

interface TeamCompositionProps {
  title: string;
  participants: LiveGameParticipant[];
  teamId: number;
  playerPuuid: string;
  bannedChampions: BannedChampion[];
}

const SUMMONER_SPELLS: Record<number, { name: string; icon: string }> = {
  1: { name: 'Cleanse', icon: 'SummonerBoost' },
  3: { name: 'Exhaust', icon: 'SummonerExhaust' },
  4: { name: 'Flash', icon: 'SummonerFlash' },
  6: { name: 'Ghost', icon: 'SummonerHaste' },
  7: { name: 'Heal', icon: 'SummonerHeal' },
  11: { name: 'Smite', icon: 'SummonerSmite' },
  12: { name: 'Teleport', icon: 'SummonerTeleport' },
  13: { name: 'Clarity', icon: 'SummonerMana' },
  14: { name: 'Ignite', icon: 'SummonerDot' },
  21: { name: 'Barrier', icon: 'SummonerBarrier' },
  32: { name: 'Mark', icon: 'SummonerSnowball' }
};

// Common role assignments based on typical positions
const getRoleFromPosition = (index: number): { role: string; icon: React.ReactElement; color: string } => {
  const roles = [
    { role: 'Top', icon: <Sword className="h-3 w-3" />, color: 'text-red-400' },
    { role: 'Jungle', icon: <Shield className="h-3 w-3" />, color: 'text-green-400' },
    { role: 'Mid', icon: <Crown className="h-3 w-3" />, color: 'text-yellow-400' },
    { role: 'ADC', icon: <Sword className="h-3 w-3" />, color: 'text-blue-400' },
    { role: 'Support', icon: <Shield className="h-3 w-3" />, color: 'text-purple-400' }
  ];
  return roles[index] || { role: 'Player', icon: <Users className="h-3 w-3" />, color: 'text-white' };
};

export function TeamComposition({ 
  title, 
  participants, 
  teamId, 
  playerPuuid, 
  bannedChampions 
}: TeamCompositionProps) {
  const isBlueTeam = teamId === 100;
  
  const getPlayerDisplayName = (riotId: string) => {
    if (riotId.includes('#')) {
      const [gameName] = riotId.split('#');
      return gameName.length > 12 ? `${gameName.substring(0, 12)}...` : gameName;
    }
    return riotId.length > 12 ? `${riotId.substring(0, 12)}...` : riotId;
  };

  const getSummonerSpell = (spellId: number) => {
    return SUMMONER_SPELLS[spellId] || { name: `Spell ${spellId}`, icon: 'SummonerFlash' };
  };

  return (
    <Card className={`${
      isBlueTeam 
        ? 'bg-blue-500/10 border-blue-500/20' 
        : 'bg-red-500/10 border-red-500/20'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center space-x-2 ${
          isBlueTeam ? 'text-blue-400' : 'text-red-400'
        }`}>
          <Users className="h-5 w-5" />
          <span>{title}</span>
          <Badge variant="secondary" className="text-xs">
            {participants.length} players
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Team Participants */}
        <div className="space-y-3">
          {participants.map((participant, index) => {
            const isCurrentPlayer = participant.puuid === playerPuuid;
            const roleInfo = getRoleFromPosition(index);
            
            return (
              <div 
                key={participant.puuid}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  isCurrentPlayer 
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {/* Champion Image */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={`https://ddragon.leagueoflegends.com/cdn/14.19.1/img/champion/Champion${participant.championId}.png`}
                      alt={`Champion ${participant.championId}`}
                      className="w-full h-full rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-white text-xs font-bold">${participant.championId}</span>`;
                        }
                      }}
                    />
                  </div>
                  {isCurrentPlayer && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Crown className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-sm font-semibold ${isCurrentPlayer ? 'text-yellow-400' : 'text-white'}`}>
                      {getPlayerDisplayName(participant.riotId)}
                    </span>
                    {isCurrentPlayer && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-xs border-yellow-500/30">
                        YOU
                      </Badge>
                    )}
                    {participant.bot && (
                      <Badge variant="secondary" className="text-xs">
                        BOT
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs flex items-center space-x-1 ${roleInfo.color}`}>
                      {roleInfo.icon}
                      <span>{roleInfo.role}</span>
                    </span>
                    <span className="text-white/60 text-xs">Champion {participant.championId}</span>
                  </div>
                </div>

                {/* Summoner Spells */}
                <div className="flex space-x-1">
                  {[participant.spell1Id, participant.spell2Id].map((spellId, spellIndex) => {
                    const spell = getSummonerSpell(spellId);
                    return (
                      <div key={spellIndex} className="w-6 h-6 bg-slate-700 rounded border border-slate-600">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                          src={`https://ddragon.leagueoflegends.com/cdn/14.19.1/img/spell/${spell.icon}.png`}
                          alt={spell.name}
                          className="w-full h-full rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-slate-800 rounded flex items-center justify-center text-xs text-white">${spellId}</div>`;
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Banned Champions */}
        {bannedChampions.length > 0 && (
          <div className="border-t border-white/10 pt-3">
            <div className="flex items-center space-x-2 mb-2">
              <Ban className="h-4 w-4 text-red-400" />
              <span className="text-white/60 text-sm font-medium">Enemy Bans</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {bannedChampions
                .sort((a, b) => a.pickTurn - b.pickTurn)
                .map((ban, index) => (
                <div key={index} className="relative">
                  <div className="w-8 h-8 bg-slate-700 rounded border border-red-500/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={`https://ddragon.leagueoflegends.com/cdn/14.19.1/img/champion/Champion${ban.championId}.png`}
                      alt={`Banned Champion ${ban.championId}`}
                      className="w-full h-full rounded object-cover opacity-60"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full bg-slate-800 rounded flex items-center justify-center text-xs text-white opacity-60">${ban.championId}</div>`;
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Ban className="h-3 w-3 text-red-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}