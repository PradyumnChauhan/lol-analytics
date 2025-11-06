'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Share2, 
  Copy, 
  Twitter, 
  MessageCircle,
  Users,
  FileText,
  Image as ImageIcon,
  BarChart3,
  Trophy,
  Crown,
  Star,
  TrendingUp,
  Check
} from 'lucide-react';
import { 
  exportShareService, 
  ShareableProfile, 
  ComparisonData 
} from '@/lib/export-share';

interface ExportShareDashboardProps {
  className?: string;
  playerData?: unknown;
  matchHistory?: unknown[];
  statsData?: unknown;
}

export function ExportShareDashboard({ 
  className,
  playerData,
  matchHistory = [],
  statsData
}: ExportShareDashboardProps) {
  const [shareableProfile, setShareableProfile] = useState<ShareableProfile | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const generateProfile = async () => {
    try {
      setLoading(true);
      const profile = await exportShareService.createShareableProfile(
        playerData,
        matchHistory,
        statsData
      );
      setShareableProfile(profile);
      const url = exportShareService.generateShareableLink(profile);
      setShareUrl(url);
    } catch (error) {
      console.error('Error generating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportMatchHistory = async (format: 'json' | 'csv') => {
    try {
      const exportData = await exportShareService.exportMatchHistory(matchHistory, format);
      exportShareService.downloadFile(exportData);
    } catch (error) {
      console.error('Error exporting match history:', error);
    }
  };

  const exportPlayerStats = async (format: 'json' | 'csv') => {
    try {
      const exportData = await exportShareService.exportPlayerStats(statsData, format);
      exportShareService.downloadFile(exportData);
    } catch (error) {
      console.error('Error exporting player stats:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const shareOnSocial = (platform: 'twitter' | 'discord' | 'reddit') => {
    if (!shareableProfile) return;

    const shareUrl = exportShareService.shareOnSocialMedia(platform, shareableProfile);
    
    if (platform === 'discord') {
      copyToClipboard(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  const compareWithMockPlayer = async () => {
    if (!shareableProfile) return;

    const mockPlayer2: ShareableProfile = {
      summoner: {
        name: 'Comparison Player',
        level: 120,
        rank: 'Silver I',
        region: 'NA'
      },
      stats: {
        winRate: 0.58,
        kda: 2.3,
        mainRole: 'Mid',
        favoriteChampions: ['Yasuo', 'Zed', 'Katarina']
      },
      achievements: [
        'Solo Carry',
        'Pentakill Expert',
        'Mid Lane Master'
      ],
      matchHistory: [
        { champion: 'Yasuo', result: 'Win', kda: '18/7/5', date: '2024-01-15' },
        { champion: 'Zed', result: 'Loss', kda: '12/8/3', date: '2024-01-14' }
      ],
      createdAt: new Date().toISOString()
    };

    const comparison = await exportShareService.compareProfiles(shareableProfile, mockPlayer2);
    setComparisonData(comparison);
  };

  const getWinnerBadge = (winner: 'player1' | 'player2' | 'tie') => {
    if (winner === 'tie') return <Badge variant="outline" className="text-yellow-600">Tie</Badge>;
    if (winner === 'player1') return <Badge className="bg-green-100 text-green-800">You Win</Badge>;
    return <Badge className="bg-red-100 text-red-800">They Win</Badge>;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-6 h-6" />
            Export & Share
          </h2>
          <p className="text-gray-400">Export your data and share your achievements</p>
        </div>
        <Button
          onClick={generateProfile}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Generating...' : 'Generate Profile'}
        </Button>
      </div>

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="export" className="data-[state=active]:bg-gray-700">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </TabsTrigger>
          <TabsTrigger value="share" className="data-[state=active]:bg-gray-700">
            <Share2 className="w-4 h-4 mr-2" />
            Share Profile
          </TabsTrigger>
          <TabsTrigger value="compare" className="data-[state=active]:bg-gray-700">
            <Users className="w-4 h-4 mr-2" />
            Compare Players
          </TabsTrigger>
        </TabsList>

        {/* Export Data Tab */}
        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Match History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Export your complete match history with detailed statistics
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => exportMatchHistory('json')}
                    variant="outline"
                    size="sm"
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    JSON
                  </Button>
                  <Button
                    onClick={() => exportMatchHistory('csv')}
                    variant="outline"
                    size="sm"
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Includes champion, KDA, CS, damage, and game duration
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Player Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Export comprehensive player statistics and analytics
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => exportPlayerStats('json')}
                    variant="outline"
                    size="sm"
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    JSON
                  </Button>
                  <Button
                    onClick={() => exportPlayerStats('csv')}
                    variant="outline"
                    size="sm"
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Includes rank, KDA, champion stats, and role performance
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Features */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Additional Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                  <ImageIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <h4 className="font-medium text-white mb-1">Share Image</h4>
                  <p className="text-xs text-gray-400 mb-3">Generate shareable stat image</p>
                  <Button size="sm" variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
                <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                  <FileText className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h4 className="font-medium text-white mb-1">PDF Report</h4>
                  <p className="text-xs text-gray-400 mb-3">Comprehensive PDF report</p>
                  <Button size="sm" variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
                <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <h4 className="font-medium text-white mb-1">Analytics Export</h4>
                  <p className="text-xs text-gray-400 mb-3">ML insights and predictions</p>
                  <Button size="sm" variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Share Profile Tab */}
        <TabsContent value="share" className="space-y-6">
          {shareableProfile ? (
            <>
              {/* Profile Preview */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    Your Shareable Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {shareableProfile.summoner.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{shareableProfile.summoner.name}</h3>
                      <p className="text-gray-400">Level {shareableProfile.summoner.level} • {shareableProfile.summoner.rank}</p>
                      <p className="text-sm text-gray-500">{shareableProfile.summoner.region}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {Math.round(shareableProfile.stats.winRate * 100)}%
                      </div>
                      <div className="text-sm text-gray-400">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{shareableProfile.stats.kda}</div>
                      <div className="text-sm text-gray-400">KDA</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{shareableProfile.stats.mainRole}</div>
                      <div className="text-sm text-gray-400">Main Role</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{shareableProfile.achievements.length}</div>
                      <div className="text-sm text-gray-400">Achievements</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Favorite Champions
                    </h4>
                    <div className="flex gap-2">
                      {shareableProfile.stats.favoriteChampions.map((champion) => (
                        <Badge key={champion} variant="outline" className="border-gray-600 text-gray-300">
                          {champion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Share Options */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Share Your Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">
                      Shareable Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-md text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(shareUrl)}
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white mb-3 block">
                      Share on Social Media
                    </label>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => shareOnSocial('twitter')}
                        variant="outline"
                        className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                      >
                        <Twitter className="w-4 h-4 mr-2" />
                        Twitter
                      </Button>
                      <Button
                        onClick={() => shareOnSocial('discord')}
                        variant="outline"
                        className="bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Discord
                      </Button>
                      <Button
                        onClick={() => shareOnSocial('reddit')}
                        variant="outline"
                        className="bg-orange-600 border-orange-500 text-white hover:bg-orange-700"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Reddit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">No Profile Generated</h3>
                <p className="text-gray-400 mb-4">Generate your shareable profile to start sharing</p>
                <Button onClick={generateProfile} disabled={loading}>
                  {loading ? 'Generating...' : 'Generate Profile'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Compare Players Tab */}
        <TabsContent value="compare" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">Player Comparison</h3>
              <p className="text-gray-400">Compare your stats with other players</p>
            </div>
            <Button
              onClick={compareWithMockPlayer}
              disabled={!shareableProfile}
              variant="outline"
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <Users className="w-4 h-4 mr-2" />
              Compare with Sample Player
            </Button>
          </div>

          {comparisonData ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Comparison Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Player Headers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-900/30 rounded-lg">
                    <h4 className="font-bold text-white">{comparisonData.player1.summoner.name}</h4>
                    <p className="text-blue-400">{comparisonData.player1.summoner.rank}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-900/30 rounded-lg">
                    <h4 className="font-bold text-white">{comparisonData.player2.summoner.name}</h4>
                    <p className="text-purple-400">{comparisonData.player2.summoner.rank}</p>
                  </div>
                </div>

                {/* Comparison Metrics */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex-1 text-center">
                      <div className="text-lg font-bold text-white">
                        {Math.round(comparisonData.comparison.winRate.player1 * 100)}%
                      </div>
                      <div className="text-sm text-gray-400">Win Rate</div>
                    </div>
                    <div className="flex-shrink-0 px-4">
                      {getWinnerBadge(comparisonData.comparison.winRate.winner)}
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-lg font-bold text-white">
                        {Math.round(comparisonData.comparison.winRate.player2 * 100)}%
                      </div>
                      <div className="text-sm text-gray-400">Win Rate</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex-1 text-center">
                      <div className="text-lg font-bold text-white">
                        {comparisonData.comparison.kda.player1}
                      </div>
                      <div className="text-sm text-gray-400">KDA</div>
                    </div>
                    <div className="flex-shrink-0 px-4">
                      {getWinnerBadge(comparisonData.comparison.kda.winner)}
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-lg font-bold text-white">
                        {comparisonData.comparison.kda.player2}
                      </div>
                      <div className="text-sm text-gray-400">KDA</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex-1 text-center">
                      <div className="text-lg font-bold text-white">
                        {comparisonData.comparison.level.player1}
                      </div>
                      <div className="text-sm text-gray-400">Level</div>
                    </div>
                    <div className="flex-shrink-0 px-4">
                      {getWinnerBadge(comparisonData.comparison.level.winner)}
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-lg font-bold text-white">
                        {comparisonData.comparison.level.player2}
                      </div>
                      <div className="text-sm text-gray-400">Level</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">No Comparison Available</h3>
                <p className="text-gray-400">Generate your shareable profile first to compare with others</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}