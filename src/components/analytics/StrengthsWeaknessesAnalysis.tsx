'use client';

import React from 'react';

interface StrengthsWeaknessesAnalysisProps {
  matchData: any[];
  championStats: any[];
  playerPuuid: string;
  className?: string;
}

interface AnalysisItem {
  category: string;
  strength: string;
  weakness: string;
  score: number;
  description: string;
  tip: string;
}

export function StrengthsWeaknessesAnalysis({ 
  matchData, 
  championStats, 
  playerPuuid, 
  className = '' 
}: StrengthsWeaknessesAnalysisProps) {
  if (!matchData || matchData.length === 0) {
    return (
      <div className={`p-4 text-center text-slate-400 ${className}`}>
        <p>No match data available for analysis</p>
      </div>
    );
  }

  const analysis = performStrengthsWeaknessesAnalysis(matchData, championStats, playerPuuid);

  return (
    <div className={`bg-white/5 rounded p-2 ${className}`}>
      <h3 className="text-white text-sm font-semibold mb-1 flex items-center">
        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1"></span>
        Strengths & Weaknesses Analysis
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
        {analysis.map((item, index) => (
          <div key={index} className="bg-white/5 rounded p-1.5">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-white font-semibold text-xs">{item.category}</h4>
              <div className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                item.score >= 70 ? 'bg-green-500 text-white' :
                item.score >= 50 ? 'bg-yellow-500 text-black' :
                'bg-red-500 text-white'
              }`}>
                {item.score.toFixed(0)}/100
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-1 mb-1">
              <div>
                <div className="text-green-400 text-xs font-medium mb-0.5 flex items-center">
                  <span className="w-1 h-1 bg-green-400 rounded-full mr-0.5"></span>
                  Strength
                </div>
                <div className="text-white/80 text-[10px]">{item.strength}</div>
              </div>
              <div>
                <div className="text-red-400 text-xs font-medium mb-0.5 flex items-center">
                  <span className="w-1 h-1 bg-red-400 rounded-full mr-0.5"></span>
                  Weakness
                </div>
                <div className="text-white/80 text-[10px]">{item.weakness}</div>
              </div>
            </div>
            
            <div className="mb-1">
              <div className="text-white/60 text-[10px] mb-0.5">Analysis</div>
              <div className="text-white/80 text-[10px]">{item.description}</div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-1">
              <div className="text-blue-400 text-xs font-medium mb-0.5 flex items-center">
                <span className="w-1 h-1 bg-blue-400 rounded-full mr-0.5"></span>
                💡 Pro Tip
              </div>
              <div className="text-white/80 text-[10px]">{item.tip}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Performance Summary */}
      <div className="mt-1 pt-1 border-t border-white/10">
        <h4 className="text-white font-semibold text-xs mb-1">Overall Performance Summary</h4>
        <div className="grid grid-cols-3 gap-1">
          <div className="text-center">
            <div className="text-green-400 font-semibold text-xs">
              {analysis.filter(a => a.score >= 70).length}
            </div>
            <div className="text-white/60 text-[10px]">Strong Areas</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-400 font-semibold text-xs">
              {analysis.filter(a => a.score >= 50 && a.score < 70).length}
            </div>
            <div className="text-white/60 text-[10px]">Average Areas</div>
          </div>
          <div className="text-center">
            <div className="text-red-400 font-semibold text-xs">
              {analysis.filter(a => a.score < 50).length}
            </div>
            <div className="text-white/60 text-[10px]">Improvement Areas</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function performStrengthsWeaknessesAnalysis(
  matchData: any[], 
  championStats: any[], 
  playerPuuid: string
): AnalysisItem[] {
  const playerMatches = matchData
    .map(match => match.info?.participants?.find((p: any) => p.puuid === playerPuuid))
    .filter(Boolean);

  if (playerMatches.length === 0) return [];

  // Calculate various metrics
  const metrics = calculatePlayerMetrics(playerMatches);
  const championMetrics = calculateChampionMetrics(championStats);

  return [
    analyzeCombatPerformance(metrics),
    analyzeMapControl(metrics),
    analyzeEconomy(metrics),
    analyzeChampionMastery(championMetrics),
    analyzeConsistency(metrics),
    analyzeTeamPlay(metrics)
  ];
}

function calculatePlayerMetrics(matches: any[]) {
  const totalMatches = matches.length;
  const wins = matches.filter(m => m.win).length;
  const winRate = (wins / totalMatches) * 100;

  // Combat metrics
  const avgKills = matches.reduce((sum, m) => sum + m.kills, 0) / totalMatches;
  const avgDeaths = matches.reduce((sum, m) => sum + m.deaths, 0) / totalMatches;
  const avgAssists = matches.reduce((sum, m) => sum + m.assists, 0) / totalMatches;
  const avgKDA = avgDeaths > 0 ? (avgKills + avgAssists) / avgDeaths : avgKills + avgAssists;
  const avgDamage = matches.reduce((sum, m) => sum + m.totalDamageDealtToChampions, 0) / totalMatches;
  const avgDamageShare = matches.reduce((sum, m) => sum + (m.teamDamagePercentage || 0), 0) / totalMatches;

  // Map control metrics
  const avgVisionScore = matches.reduce((sum, m) => sum + m.visionScore, 0) / totalMatches;
  const avgWardsPlaced = matches.reduce((sum, m) => sum + (m.wardsPlaced || 0), 0) / totalMatches;
  const avgWardsKilled = matches.reduce((sum, m) => sum + (m.wardsKilled || 0), 0) / totalMatches;
  const avgControlWards = matches.reduce((sum, m) => sum + (m.controlWardsPlaced || 0), 0) / totalMatches;

  // Economy metrics
  const avgGold = matches.reduce((sum, m) => sum + m.goldEarned, 0) / totalMatches;
  const avgCS = matches.reduce((sum, m) => sum + (m.totalMinionsKilled + (m.neutralMinionsKilled || 0)), 0) / totalMatches;
  const avgGoldShare = matches.reduce((sum, m) => sum + (m.goldPerMinute || 0), 0) / totalMatches;

  // Consistency metrics
  const kdaVariance = calculateVariance(matches.map(m => m.deaths > 0 ? (m.kills + m.assists) / m.deaths : m.kills + m.assists));
  const damageVariance = calculateVariance(matches.map(m => m.totalDamageDealtToChampions));

  return {
    totalMatches,
    wins,
    winRate,
    avgKills,
    avgDeaths,
    avgAssists,
    avgKDA,
    avgDamage,
    avgDamageShare,
    avgVisionScore,
    avgWardsPlaced,
    avgWardsKilled,
    avgControlWards,
    avgGold,
    avgCS,
    avgGoldShare,
    kdaVariance,
    damageVariance
  };
}

function calculateChampionMetrics(championStats: any[]) {
  const totalChampions = championStats.length;
  const championsWithGoodWR = championStats.filter(c => c.winRate >= 60).length;
  const avgWinRate = championStats.reduce((sum, c) => sum + c.winRate, 0) / totalChampions;
  const roleDiversity = new Set(championStats.flatMap(c => c.roles)).size;

  return {
    totalChampions,
    championsWithGoodWR,
    avgWinRate,
    roleDiversity
  };
}

function analyzeCombatPerformance(metrics: any): AnalysisItem {
  const kdaScore = Math.min(metrics.avgKDA * 20, 100);
  const damageScore = Math.min(metrics.avgDamage / 1000, 100);
  const score = (kdaScore + damageScore) / 2;

  return {
    category: 'Combat Performance',
    strength: kdaScore > damageScore 
      ? `Strong KDA performance (${metrics.avgKDA.toFixed(2)}) with good kill participation`
      : `High damage output (${metrics.avgDamage.toFixed(0)}) dealing significant damage to champions`,
    weakness: kdaScore < damageScore
      ? `KDA could be improved (${metrics.avgKDA.toFixed(2)}) - focus on staying alive longer`
      : `Damage output is lower (${metrics.avgDamage.toFixed(0)}) - work on dealing more damage`,
    score,
    description: `Your combat performance shows ${score >= 70 ? 'strong' : score >= 50 ? 'average' : 'room for improvement in'} fighting ability. ${score >= 70 ? 'Keep up the excellent work!' : 'Focus on improving your combat effectiveness.'}`,
    tip: score >= 70 
      ? 'Maintain your current combat level and consider helping teammates improve their fighting'
      : 'Practice last-hitting, positioning, and target selection to improve combat performance'
  };
}

function analyzeMapControl(metrics: any): AnalysisItem {
  const visionScore = Math.min(metrics.avgVisionScore * 2, 100);
  const wardScore = Math.min((metrics.avgWardsPlaced + metrics.avgWardsKilled) * 5, 100);
  const score = (visionScore + wardScore) / 2;

  return {
    category: 'Map Control & Vision',
    strength: visionScore > wardScore
      ? `Excellent vision score (${metrics.avgVisionScore.toFixed(1)}) providing great map awareness`
      : `Good ward control (${metrics.avgWardsPlaced.toFixed(1)} placed, ${metrics.avgWardsKilled.toFixed(1)} killed)`,
    weakness: visionScore < wardScore
      ? `Vision score needs improvement (${metrics.avgVisionScore.toFixed(1)}) - buy more control wards`
      : `Ward control could be better (${metrics.avgWardsPlaced.toFixed(1)} placed, ${metrics.avgWardsKilled.toFixed(1)} killed)`,
    score,
    description: `Your map control is ${score >= 70 ? 'excellent' : score >= 50 ? 'decent' : 'needs work'}. ${score >= 70 ? 'Great job maintaining vision!' : 'Vision wins games - focus on warding more.'}`,
    tip: score >= 70 
      ? 'Continue your excellent vision control and help teammates with ward placement'
      : 'Buy control wards every back, ward objectives before fights, and clear enemy vision'
  };
}

function analyzeEconomy(metrics: any): AnalysisItem {
  const goldScore = Math.min(metrics.avgGold / 100, 100);
  const csScore = Math.min(metrics.avgCS / 10, 100);
  const score = (goldScore + csScore) / 2;

  return {
    category: 'Economy & Farming',
    strength: goldScore > csScore
      ? `Strong gold income (${metrics.avgGold.toFixed(0)}) through good decision making`
      : `Excellent CS (${metrics.avgCS.toFixed(1)}) showing good farming skills`,
    weakness: goldScore < csScore
      ? `Gold income could be higher (${metrics.avgGold.toFixed(0)}) - focus on objectives and kills`
      : `CS needs improvement (${metrics.avgCS.toFixed(1)}) - practice last-hitting`,
    score,
    description: `Your economy is ${score >= 70 ? 'strong' : score >= 50 ? 'average' : 'weak'}. ${score >= 70 ? 'Great farming and gold management!' : 'Focus on improving your gold income.'}`,
    tip: score >= 70 
      ? 'Maintain your farming efficiency and help secure objectives for team gold'
      : 'Practice last-hitting, take jungle camps when safe, and prioritize objectives'
  };
}

function analyzeChampionMastery(championMetrics: any): AnalysisItem {
  const championScore = Math.min((championMetrics.championsWithGoodWR / championMetrics.totalChampions) * 100, 100);
  const diversityScore = Math.min(championMetrics.roleDiversity * 20, 100);
  const score = (championScore + diversityScore) / 2;

  return {
    category: 'Champion Pool & Mastery',
    strength: championScore > diversityScore
      ? `Strong win rates across ${championMetrics.championsWithGoodWR} champions (${championScore.toFixed(0)}% success rate)`
      : `Good role diversity (${championMetrics.roleDiversity} roles) showing flexibility`,
    weakness: championScore < diversityScore
      ? `Win rates need improvement (${championScore.toFixed(0)}% success) - focus on fewer champions`
      : `Limited role diversity (${championMetrics.roleDiversity} roles) - try different positions`,
    score,
    description: `Your champion mastery is ${score >= 70 ? 'excellent' : score >= 50 ? 'good' : 'developing'}. ${score >= 70 ? 'Great champion pool!' : 'Focus on mastering a few champions first.'}`,
    tip: score >= 70 
      ? 'Your champion pool is solid - consider learning meta champions for your main roles'
      : 'Focus on 2-3 champions per role, learn their matchups, and practice consistently'
  };
}

function analyzeConsistency(metrics: any): AnalysisItem {
  const kdaConsistency = Math.max(0, 100 - metrics.kdaVariance);
  const damageConsistency = Math.max(0, 100 - (metrics.damageVariance / 10000));
  const score = (kdaConsistency + damageConsistency) / 2;

  return {
    category: 'Consistency & Reliability',
    strength: kdaConsistency > damageConsistency
      ? `Consistent KDA performance with low variance (${metrics.kdaVariance.toFixed(2)})`
      : `Stable damage output with good consistency (${metrics.damageVariance.toFixed(0)} variance)`,
    weakness: kdaConsistency < damageConsistency
      ? `KDA inconsistency (${metrics.kdaVariance.toFixed(2)} variance) - work on consistent performance`
      : `Damage inconsistency (${metrics.damageVariance.toFixed(0)} variance) - focus on stable output`,
    score,
    description: `Your consistency is ${score >= 70 ? 'excellent' : score >= 50 ? 'good' : 'needs work'}. ${score >= 70 ? 'Very reliable player!' : 'Focus on consistent performance every game.'}`,
    tip: score >= 70 
      ? 'Your consistency is great - help teammates maintain their performance levels'
      : 'Focus on fundamentals, avoid risky plays, and maintain consistent farming patterns'
  };
}

function analyzeTeamPlay(metrics: any): AnalysisItem {
  const winRateScore = metrics.winRate;
  const damageShareScore = Math.min(metrics.avgDamageShare * 100, 100);
  const score = (winRateScore + damageShareScore) / 2;

  return {
    category: 'Team Play & Impact',
    strength: winRateScore > damageShareScore
      ? `Strong win rate (${metrics.winRate.toFixed(1)}%) showing good team impact`
      : `Good damage share (${(metrics.avgDamageShare * 100).toFixed(1)}%) contributing to team fights`,
    weakness: winRateScore < damageShareScore
      ? `Win rate needs improvement (${metrics.winRate.toFixed(1)}%) - focus on game impact`
      : `Damage share could be higher (${(metrics.avgDamageShare * 100).toFixed(1)}%) - deal more damage`,
    score,
    description: `Your team impact is ${score >= 70 ? 'excellent' : score >= 50 ? 'good' : 'needs improvement'}. ${score >= 70 ? 'Great team player!' : 'Focus on making bigger impact in games.'}`,
    tip: score >= 70 
      ? 'Continue your strong team play and help coordinate with teammates'
      : 'Focus on objectives, team fights, and making plays that help your team win'
  };
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
}

