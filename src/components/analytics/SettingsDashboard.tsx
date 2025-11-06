'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Bell, 
  Database, 
  Trash2, 
  Download, 
  Upload,
  Monitor,
  Moon,
  Sun,
  BarChart3,
  RefreshCw,
  Star
} from 'lucide-react';
import { useUserPreferences, useCacheStats, localStorageManager } from '@/lib/storage';

interface SettingsDashboardProps {
  className?: string;
}

export function SettingsDashboard({ className }: SettingsDashboardProps) {
  const { preferences, updatePreferences } = useUserPreferences();
  const { stats, refreshStats, clearExpired, clearAll } = useCacheStats();
  const [exportData, setExportData] = useState<string>('');
  const [importData, setImportData] = useState<string>('');

  const handleRegionChange = (region: string) => {
    updatePreferences({ preferredRegion: region });
  };

  const handleThemeChange = (theme: 'dark' | 'light' | 'auto') => {
    updatePreferences({ theme });
  };

  const handleNotificationToggle = (type: keyof typeof preferences.notifications) => {
    updatePreferences({
      notifications: {
        ...preferences.notifications,
        [type]: !preferences.notifications[type]
      }
    });
  };

  const handleAnalyticsToggle = (setting: keyof typeof preferences.analytics, value: boolean) => {
    updatePreferences({
      analytics: {
        ...preferences.analytics,
        [setting]: value
      }
    });
  };

  const handleTimeRangeChange = (range: '7d' | '30d' | '3m' | '1y') => {
    updatePreferences({
      analytics: {
        ...preferences.analytics,
        defaultTimeRange: range
      }
    });
  };

  const exportSettings = () => {
    const data = {
      preferences,
      searchHistory: localStorageManager.getSearchHistory(),
      favoritePlayers: localStorageManager.getFavoritePlayers(),
      exportDate: new Date().toISOString()
    };
    setExportData(JSON.stringify(data, null, 2));
  };

  const importSettings = () => {
    try {
      const data = JSON.parse(importData);
      if (data.preferences) {
        updatePreferences(data.preferences);
      }
      if (data.searchHistory) {
        // Clear existing and import new search history
        localStorageManager.clearSearchHistory();
        data.searchHistory.forEach((term: string) => {
          localStorageManager.addToSearchHistory(term);
        });
      }
      if (data.favoritePlayers) {
        // Import favorite players
        data.favoritePlayers.forEach((puuid: string) => {
          localStorageManager.addFavoritePlayer(puuid);
        });
      }
      setImportData('');
      alert('Settings imported successfully!');
    } catch {
      alert('Error importing settings. Please check the format.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-gray-400">Manage your preferences and data</p>
        </div>
        <Button
          onClick={refreshStats}
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="general" className="data-[state=active]:bg-gray-700">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-gray-700">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="data" className="data-[state=active]:bg-gray-700">
            <Database className="w-4 h-4 mr-2" />
            Data & Cache
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                General Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Region Selection */}
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Preferred Region
                </label>
                <select
                  value={preferences.preferredRegion}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-md"
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
                <p className="text-xs text-gray-400 mt-1">
                  Currently set to: {getRegionDisplayName(preferences.preferredRegion)}
                </p>
              </div>

              {/* Theme Selection */}
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Theme
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={preferences.theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('dark')}
                    className="flex items-center gap-2"
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </Button>
                  <Button
                    variant={preferences.theme === 'light' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('light')}
                    className="flex items-center gap-2"
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </Button>
                  <Button
                    variant={preferences.theme === 'auto' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('auto')}
                    className="flex items-center gap-2"
                  >
                    <Monitor className="w-4 h-4" />
                    Auto
                  </Button>
                </div>
              </div>

              {/* Favorite Champions */}
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Favorite Champions
                </label>
                <div className="flex flex-wrap gap-2">
                  {preferences.favoriteChampions.length > 0 ? (
                    preferences.favoriteChampions.map((championId) => (
                      <Badge key={championId} variant="outline" className="border-gray-600 text-gray-300">
                        <Star className="w-3 h-3 mr-1" />
                        Champion #{championId}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No favorite champions selected</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Champion Rotation Updates</label>
                  <p className="text-xs text-gray-400">Get notified when free champion rotation changes</p>
                </div>
                <Switch
                  checked={preferences.notifications.championRotation}
                  onCheckedChange={() => handleNotificationToggle('championRotation')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Server Status Alerts</label>
                  <p className="text-xs text-gray-400">Get notified about server issues and maintenance</p>
                </div>
                <Switch
                  checked={preferences.notifications.serverStatus}
                  onCheckedChange={() => handleNotificationToggle('serverStatus')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Match Updates</label>
                  <p className="text-xs text-gray-400">Get notified about recent match results</p>
                </div>
                <Switch
                  checked={preferences.notifications.matchUpdates}
                  onCheckedChange={() => handleNotificationToggle('matchUpdates')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Settings */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">Show Advanced Statistics</label>
                  <p className="text-xs text-gray-400">Display detailed performance metrics and ML insights</p>
                </div>
                <Switch
                  checked={preferences.analytics.showAdvancedStats}
                  onCheckedChange={(checked: boolean) => handleAnalyticsToggle('showAdvancedStats', checked)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Default Time Range
                </label>
                <div className="flex gap-2">
                  {(['7d', '30d', '3m', '1y'] as const).map((range) => (
                    <Button
                      key={range}
                      variant={preferences.analytics.defaultTimeRange === range ? 'default' : 'outline'}
                      onClick={() => handleTimeRangeChange(range)}
                      size="sm"
                    >
                      {range === '7d' && '7 Days'}
                      {range === '30d' && '30 Days'}
                      {range === '3m' && '3 Months'}
                      {range === '1y' && '1 Year'}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Preferred Charts
                </label>
                <div className="flex flex-wrap gap-2">
                  {preferences.analytics.preferredCharts.map((chart) => (
                    <Badge key={chart} variant="outline" className="border-gray-600 text-gray-300">
                      {chart}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Cache Settings */}
        <TabsContent value="data" className="space-y-6">
          {/* Cache Statistics */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5" />
                Cache Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.totalItems}</div>
                  <div className="text-sm text-gray-400">Total Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{formatBytes(stats.totalSize)}</div>
                  <div className="text-sm text-gray-400">Total Size</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{Object.keys(stats.cacheTypes).length}</div>
                  <div className="text-sm text-gray-400">Cache Types</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{localStorageManager.getFavoritePlayers().length}</div>
                  <div className="text-sm text-gray-400">Favorites</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const cleared = clearExpired();
                    alert(`Cleared ${cleared} expired items`);
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Expired
                </Button>
                <Button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all cached data?')) {
                      clearAll();
                      alert('All cache cleared');
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-red-800 border-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Cache
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import/Export Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Import/Export Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button
                  onClick={exportSettings}
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 mb-2"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Settings
                </Button>
                {exportData && (
                  <textarea
                    value={exportData}
                    readOnly
                    className="w-full h-32 bg-gray-700 border border-gray-600 text-white p-3 rounded-md text-sm font-mono"
                    placeholder="Exported settings will appear here..."
                  />
                )}
              </div>

              <div>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="w-full h-32 bg-gray-700 border border-gray-600 text-white p-3 rounded-md text-sm font-mono mb-2"
                  placeholder="Paste your settings JSON here to import..."
                />
                <Button
                  onClick={importSettings}
                  disabled={!importData.trim()}
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}