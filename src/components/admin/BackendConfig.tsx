'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Settings, Key, Cookie } from 'lucide-react';
import LOLBackendAPI from '@/lib/lol-backend-api';
import { getBackendUrl } from '@/lib/utils/backend-url';

interface AuthStatus {
  isConfigured: boolean;
  hasApiKey: boolean;
  hasCookies: boolean;
  lastUpdated: string | null;
  cookieCount: number;
}

interface TestResult {
  success: boolean;
  error?: string;
  testData?: {
    gameName: string;
    tagLine: string;
    puuid: string;
  };
}

export default function BackendConfig() {
  const [api] = useState(new LOLBackendAPI());
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await api.getAuthStatus();
      setAuthStatus(status);
      setError(null);
      } catch {
      const backendUrl = getBackendUrl();
      setError(`Failed to connect to backend server. Make sure it's running on ${backendUrl}`);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const configureApiKey = async () => {
    if (!apiKey.trim()) return;

    try {
      setLoading(true);
      await api.configureAuth(apiKey.trim());
      await checkAuthStatus();
      setApiKey('');
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to configure API key');
    } finally {
      setLoading(false);
    }
  };

  const testAuthentication = async () => {
    try {
      setLoading(true);
      const result = await api.testAuth();
      setTestResult(result);
      setError(null);
    } catch (err: unknown) {
      setTestResult({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!authStatus) return <Badge variant="secondary">Unknown</Badge>;
    
    if (authStatus.hasApiKey) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Configured</Badge>;
    }
    
    return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Not Configured</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Backend Server Configuration
          </CardTitle>
          <CardDescription>
            Configure authentication for the LOL Analytics backend server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Backend Status</h3>
              <p className="text-sm text-gray-600">Connection to backend server</p>
            </div>
            {getStatusBadge()}
          </div>

          {authStatus && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>API Key:</span>
                <span>{authStatus.hasApiKey ? '✅ Configured' : '❌ Not configured'}</span>
              </div>
              <div className="flex justify-between">
                <span>Cookies:</span>
                <span>{authStatus.hasCookies ? `✅ ${authStatus.cookieCount} cookies` : '❌ Not configured'}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span>{authStatus.lastUpdated ? new Date(authStatus.lastUpdated).toLocaleString() : 'Never'}</span>
              </div>
            </div>
          )}

          <Button onClick={checkAuthStatus} disabled={loading} size="sm">
            {loading ? 'Checking...' : 'Refresh Status'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key Configuration
          </CardTitle>
          <CardDescription>
            Enter your Riot Games API key from developer.riotgames.com
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="RGAPI-your-api-key-here"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Get your API key from <a href="https://developer.riotgames.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">developer.riotgames.com</a>
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={configureApiKey} disabled={loading || !apiKey.trim()}>
              {loading ? 'Configuring...' : 'Configure API Key'}
            </Button>
            
            {authStatus?.hasApiKey && (
              <Button onClick={testAuthentication} variant="outline" disabled={loading}>
                {loading ? 'Testing...' : 'Test Authentication'}
              </Button>
            )}
          </div>

          {testResult && (
            <div className={`p-3 rounded border ${testResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {testResult.success ? (
                <div>
                  <p className="font-medium">✅ Authentication successful!</p>
                  {testResult.testData && (
                    <p className="text-sm mt-1">
                      Test account: {testResult.testData.gameName}#{testResult.testData.tagLine}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-medium">❌ Authentication failed</p>
                  <p className="text-sm mt-1">{testResult.error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="w-5 h-5" />
            Match-V5 API Access
          </CardTitle>
          <CardDescription>
            Why you might need browser session cookies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-medium text-yellow-800">⚠️ Match-V5 API Limitation</p>
              <p className="text-yellow-700 mt-1">
                Development API keys don&apos;t have access to Match-V5 endpoints (match history). 
                You&apos;ll get 403 Forbidden errors when trying to fetch match data.
              </p>
            </div>

            <div className="space-y-2">
              <p><strong>Options to access Match-V5:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Apply for production API access from Riot Games</li>
                <li>Use browser session cookies (temporary solution)</li>
                <li>Use the app without match history (basic analytics only)</li>
              </ul>
            </div>

            <p className="text-xs text-gray-500">
              The backend server will gracefully handle Match-V5 errors and provide analytics using available data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}