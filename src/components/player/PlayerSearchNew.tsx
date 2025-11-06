'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, BarChart3 } from 'lucide-react';

const REGIONS = [
  { value: 'br1', label: 'Brazil' },
  { value: 'na1', label: 'North America' },
  { value: 'euw1', label: 'Europe West' },
  { value: 'eun1', label: 'Europe Nordic & East' },
  { value: 'kr', label: 'Korea' },
  { value: 'jp1', label: 'Japan' },
];

export function PlayerSearch() {
  const router = useRouter();
  const [puuid, setPuuid] = useState('');
  const [region, setRegion] = useState('br1');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!puuid.trim()) return;
    
    setLoading(true);
    
    try {
      // First, validate that the PUUID exists by doing a quick summoner lookup
      console.log(`🔍 Validating PUUID: ${puuid.substring(0, 20)}... in ${region}`);
      
      const testResponse = await fetch(`/api/summoner/by-puuid?puuid=${encodeURIComponent(puuid.trim())}&region=${region}`);
      
      if (!testResponse.ok) {
        const error = await testResponse.json();
        console.error('❌ PUUID validation failed:', error);
        alert(`Error: ${error.error || 'Invalid PUUID or region'}`);
        setLoading(false);
        return;
      }

      const summonerData = await testResponse.json();
      console.log('✅ PUUID validated successfully:', summonerData);
      
      // Navigate to analytics page with PUUID and region
      const params = new URLSearchParams({
        puuid: puuid.trim(),
        region: region
      });
      
      router.push(`/analytics?${params.toString()}`);
    } catch (error) {
      console.error('❌ Validation error:', error);
      alert('Failed to validate PUUID. Please check your input and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Player Analytics Search</span>
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter a player&apos;s PUUID to view comprehensive analytics and statistics
            <br />
            <span className="text-xs text-slate-500">
              PUUID is the encrypted player identifier used by Riot API
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Player PUUID
              </label>
              <Input
                value={puuid}
                onChange={(e) => setPuuid(e.target.value)}
                placeholder="Enter PUUID (e.g., 0V4I8fDWIL24S7PbRBJMfGUIHt7hIaBSyQ1E-oQXdwF_XCUXztmB2Dro7t3T-IqtpGUfVQUyaiBkXw)"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 font-mono text-sm"
                disabled={loading}
              />
              <p className="text-xs text-slate-500 mt-1">
                Pre-filled with a working PUUID for testing
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
                disabled={loading}
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} ({r.value.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={loading || !puuid.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>{loading ? 'Loading...' : 'Analyze Player'}</span>
            </Button>
          </div>

          <div className="mt-4 p-3 bg-slate-700 rounded-lg">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Test PUUID</h4>
            <p className="text-xs text-slate-400 mb-2">
              Use this working PUUID for testing:
            </p>
            <code 
              className="text-xs bg-slate-800 p-2 rounded block text-green-400 cursor-pointer"
              onClick={() => setPuuid('0V4I8fDWIL24S7PbRBJMfGUIHt7hIaBSyQ1E-oQXdwF_XCUXztmB2Dro7t3T-IqtpGUfVQUyaiBkXw')}
            >
              0V4I8fDWIL24S7PbRBJMfGUIHt7hIaBSyQ1E-oQXdwF_XCUXztmB2Dro7t3T-IqtpGUfVQUyaiBkXw
            </code>
            <p className="text-xs text-slate-500 mt-1">
              Click to auto-fill (Level 591 player from BR1 region)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">
            Analytics Dashboard Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div>
              <h4 className="font-medium mb-2">📊 Player Statistics</h4>
              <ul className="space-y-1 text-slate-400">
                <li>• Summoner Level & Profile</li>
                <li>• Ranked Statistics</li>
                <li>• Champion Mastery</li>
                <li>• Match History Analysis</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">📈 Data Visualization</h4>
              <ul className="space-y-1 text-slate-400">
                <li>• Performance Charts</li>
                <li>• Win Rate Analysis</li>
                <li>• Champion Performance</li>
                <li>• Recent Match Trends</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}