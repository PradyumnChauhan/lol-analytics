'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Calendar, Crown, Users, Star, Clock, History } from 'lucide-react';
import { 
  championRotationAPI, 
  ChampionRotationData, 
  ChampionBasicInfo, 
  ChampionRotationHistory 
} from '@/lib/api/champion-rotation';

interface ChampionRotationDashboardProps {
  className?: string;
}

export function ChampionRotationDashboard({ className }: ChampionRotationDashboardProps) {
  const [currentRotation, setCurrentRotation] = useState<ChampionRotationData | null>(null);
  const [allRegionsRotation, setAllRegionsRotation] = useState<ChampionRotationData[]>([]);
  const [freeChampions, setFreeChampions] = useState<ChampionBasicInfo[]>([]);
  const [newPlayerChampions, setNewPlayerChampions] = useState<ChampionBasicInfo[]>([]);
  const [rotationHistory, setRotationHistory] = useState<ChampionRotationHistory[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('na1');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');

  const loadCurrentRotation = useCallback(async () => {
    try {
      setLoading(true);
      const rotation = await championRotationAPI.getCurrentRotation(selectedRegion);
      if (rotation) {
        setCurrentRotation(rotation);
        
        // Load champion information
        const freeChampInfo = await championRotationAPI.getChampionInfo(rotation.currentRotation.freeChampionIds);
        const newPlayerChampInfo = await championRotationAPI.getChampionInfo(rotation.currentRotation.freeChampionIdsForNewPlayers);
        
        setFreeChampions(freeChampInfo);
        setNewPlayerChampions(newPlayerChampInfo);
      }
    } catch (error) {
      console.error('Error loading current rotation:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion]);

  const loadRotationHistory = useCallback(async () => {
    try {
      const history = await championRotationAPI.getRotationHistory(selectedRegion, 12);
      setRotationHistory(history);
    } catch (error) {
      console.error('Error loading rotation history:', error);
    }
  }, [selectedRegion]);

  useEffect(() => {
    loadCurrentRotation();
    loadRotationHistory();
    const interval = setInterval(loadCurrentRotation, 15 * 60 * 1000); // Update every 15 minutes
    return () => clearInterval(interval);
  }, [selectedRegion, loadCurrentRotation, loadRotationHistory]);

  const loadAllRegionsRotation = async () => {
    try {
      setLoading(true);
      const allRotations = await championRotationAPI.getAllRegionsRotation();
      setAllRegionsRotation(allRotations);
    } catch (error) {
      console.error('Error loading all regions rotation:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilRotation = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getRoleColor = (tags: string[]) => {
    const primaryRole = tags[0]?.toLowerCase();
    switch (primaryRole) {
      case 'assassin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'fighter':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'mage':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'marksman':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'support':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'tank':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    const stars = Math.min(Math.max(Math.round(difficulty / 2), 1), 5);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getRegionDisplayName = (region: string) => {
    const regionNames: Record<string, string> = {
      'na1': 'North America',
      'euw1': 'Europe West',
      'eun1': 'Europe Nordic & East',
      'kr': 'Korea',
      'jp1': 'Japan',
      'br1': 'Brazil',
      'la1': 'Latin America North',
      'la2': 'Latin America South',
      'oc1': 'Oceania',
      'tr1': 'Turkey',
      'ru': 'Russia'
    };
    return regionNames[region] || region.toUpperCase();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Champion Rotation</h2>
          <p className="text-gray-400">Free-to-play champions across all regions</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-md"
          >
            <option value="na1">North America</option>
            <option value="euw1">Europe West</option>
            <option value="eun1">Europe Nordic & East</option>
            <option value="kr">Korea</option>
            <option value="jp1">Japan</option>
            <option value="br1">Brazil</option>
            <option value="la1">Latin America North</option>
            <option value="la2">Latin America South</option>
            <option value="oc1">Oceania</option>
            <option value="tr1">Turkey</option>
            <option value="ru">Russia</option>
          </select>
          <Button
            onClick={activeTab === 'all-regions' ? loadAllRegionsRotation : loadCurrentRotation}
            disabled={loading}
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Rotation Status */}
      {currentRotation && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Calendar className="w-8 h-8 text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Current Rotation</h3>
                  <p className="text-gray-400">
                    {formatDate(currentRotation.rotationStart)} - {formatDate(currentRotation.rotationEnd)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {getDaysUntilRotation(currentRotation.rotationEnd)}
                </div>
                <div className="text-sm text-gray-400">days remaining</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="current" className="data-[state=active]:bg-gray-700">
            Current Rotation
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="all-regions" className="data-[state=active]:bg-gray-700">
            All Regions
          </TabsTrigger>
        </TabsList>

        {/* Current Rotation Tab */}
        <TabsContent value="current" className="space-y-6">
          {/* Free Champions */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">
                Free Champions ({freeChampions.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {freeChampions.map((champion) => (
                <Card key={champion.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {champion.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{champion.name}</h4>
                        <p className="text-sm text-gray-400">{champion.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-1">{getDifficultyStars(champion.difficulty)}</div>
                      <Badge className={getRoleColor(champion.tags)}>
                        {champion.tags[0]}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {champion.blurb}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* New Player Champions */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">
                New Player Champions ({newPlayerChampions.length})
              </h3>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Level {currentRotation?.currentRotation.maxNewPlayerLevel || 10} & Below
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {newPlayerChampions.map((champion) => (
                <Card key={champion.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {champion.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{champion.name}</h4>
                        <p className="text-sm text-gray-400">{champion.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-1">{getDifficultyStars(champion.difficulty)}</div>
                      <Badge className={getRoleColor(champion.tags)}>
                        {champion.tags[0]}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {champion.blurb}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-4">
            {rotationHistory.map((rotation) => (
              <Card key={rotation.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white">
                        Week of {formatShortDate(rotation.startDate)}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {formatShortDate(rotation.startDate)} - {formatShortDate(rotation.endDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">
                        {rotation.freeChampionIds.length}
                      </div>
                      <div className="text-xs text-gray-400">champions</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {rotation.freeChampionIds.slice(0, 10).map((championId) => (
                      <Badge key={championId} variant="outline" className="text-xs border-gray-600 text-gray-300">
                        #{championId}
                      </Badge>
                    ))}
                    {rotation.freeChampionIds.length > 10 && (
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                        +{rotation.freeChampionIds.length - 10} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* All Regions Tab */}
        <TabsContent value="all-regions" className="space-y-4">
          <Button
            onClick={loadAllRegionsRotation}
            disabled={loading}
            className="mb-4"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Load All Regions
          </Button>
          
          <div className="grid gap-4">
            {allRegionsRotation.map((rotation) => (
              <Card key={rotation.region} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    {getRegionDisplayName(rotation.region)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-white">Free Champions</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">
                        {rotation.currentRotation.freeChampionIds.length}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {rotation.currentRotation.freeChampionIds.slice(0, 8).map((id) => (
                          <Badge key={id} variant="outline" className="text-xs border-gray-600 text-gray-300">
                            #{id}
                          </Badge>
                        ))}
                        {rotation.currentRotation.freeChampionIds.length > 8 && (
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            +{rotation.currentRotation.freeChampionIds.length - 8}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-white">New Player</span>
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">
                        {rotation.currentRotation.freeChampionIdsForNewPlayers.length}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {rotation.currentRotation.freeChampionIdsForNewPlayers.slice(0, 6).map((id) => (
                          <Badge key={id} variant="outline" className="text-xs border-gray-600 text-gray-300">
                            #{id}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {getDaysUntilRotation(rotation.rotationEnd)} days remaining
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}