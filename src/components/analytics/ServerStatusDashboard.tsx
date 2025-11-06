'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, Wrench, RefreshCw } from 'lucide-react';
import { serverStatusAPI, ServerStatusSummary, StatusDto } from '@/lib/api/server-status';

interface ServerStatusDashboardProps {
  className?: string;
}

export function ServerStatusDashboard({ className }: ServerStatusDashboardProps) {
  const [serverStatuses, setServerStatuses] = useState<ServerStatusSummary[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('na1');
  const [activeIssues, setActiveIssues] = useState<{
    maintenance: StatusDto[];
    incidents: StatusDto[];
  }>({ maintenance: [], incidents: [] });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadServerStatuses();
    const interval = setInterval(loadServerStatuses, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadActiveIssues();
  }, [selectedRegion, loadActiveIssues]);

  const loadServerStatuses = async () => {
    try {
      setLoading(true);
      const statuses = await serverStatusAPI.getServerStatusSummary();
      setServerStatuses(statuses);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading server statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveIssues = useCallback(async () => {
    try {
      const issues = await serverStatusAPI.getActiveIssues(selectedRegion);
      setActiveIssues(issues);
    } catch (error) {
      console.error('Error loading active issues:', error);
    }
  }, [selectedRegion]);

  const getStatusIcon = (status: ServerStatusSummary['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-blue-500" />;
      case 'incident':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ServerStatusSummary['status']) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'incident':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity?: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getContentByLocale = (contents: Array<{ locale: string; content: string }>, preferredLocale: string = 'en_US') => {
    const preferred = contents.find(c => c.locale === preferredLocale);
    return preferred?.content || contents[0]?.content || 'No content available';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Server Status</h2>
          <p className="text-gray-400">Real-time League of Legends server status across all regions</p>
        </div>
        <Button
          onClick={loadServerStatuses}
          disabled={loading}
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Last Update */}
      <div className="text-sm text-gray-400">
        Last updated: {lastUpdate.toLocaleString()}
      </div>

      {/* Server Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {serverStatuses.map((server) => (
          <Card
            key={server.platform}
            className={`bg-gray-800 border-gray-700 cursor-pointer transition-all hover:bg-gray-750 ${
              selectedRegion === server.platform.toLowerCase() ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedRegion(server.platform.toLowerCase())}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">{server.platform}</span>
                {getStatusIcon(server.status)}
              </div>
              
              <Badge className={`${getStatusColor(server.status)} mb-2`}>
                {server.status.toUpperCase()}
              </Badge>

              {server.severity && (
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${getSeverityColor(server.severity)}`} />
                  <span className="text-xs text-gray-400 capitalize">{server.severity}</span>
                </div>
              )}

              <div className="text-sm text-gray-400 space-y-1">
                {server.activeIncidents > 0 && (
                  <div>Incidents: {server.activeIncidents}</div>
                )}
                {server.activeMaintenance > 0 && (
                  <div>Maintenance: {server.activeMaintenance}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Issues Details */}
      {(activeIssues.incidents.length > 0 || activeIssues.maintenance.length > 0) && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              Active Issues - {selectedRegion.toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Incidents */}
            {activeIssues.incidents.map((incident) => (
              <div key={incident.id} className="border border-red-600 rounded-lg p-4 bg-red-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-white">
                    {getContentByLocale(incident.titles)}
                  </span>
                  {incident.incident_severity && (
                    <Badge className={`${getSeverityColor(incident.incident_severity)} text-white`}>
                      {incident.incident_severity.toUpperCase()}
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-300 mb-2">
                  Created: {formatTimestamp(incident.created_at)}
                </div>

                {incident.updates.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-200">Latest Updates:</span>
                    {incident.updates.slice(0, 2).map((update) => (
                      <div key={update.id} className="bg-gray-900/50 rounded p-3">
                        <div className="text-sm text-gray-300 mb-1">
                          {formatTimestamp(update.updated_at)} - {update.author}
                        </div>
                        <div className="text-sm text-white">
                          {getContentByLocale(update.translations)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Maintenance */}
            {activeIssues.maintenance.map((maintenance) => (
              <div key={maintenance.id} className="border border-blue-600 rounded-lg p-4 bg-blue-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-white">
                    {getContentByLocale(maintenance.titles)}
                  </span>
                  {maintenance.maintenance_status && (
                    <Badge className="bg-blue-500 text-white">
                      {maintenance.maintenance_status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-300 mb-2">
                  Created: {formatTimestamp(maintenance.created_at)}
                  {maintenance.archive_at && (
                    <span className="ml-4">
                      Expected completion: {formatTimestamp(maintenance.archive_at)}
                    </span>
                  )}
                </div>

                {maintenance.updates.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-200">Updates:</span>
                    {maintenance.updates.slice(0, 2).map((update) => (
                      <div key={update.id} className="bg-gray-900/50 rounded p-3">
                        <div className="text-sm text-gray-300 mb-1">
                          {formatTimestamp(update.updated_at)} - {update.author}
                        </div>
                        <div className="text-sm text-white">
                          {getContentByLocale(update.translations)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Issues Message */}
      {activeIssues.incidents.length === 0 && activeIssues.maintenance.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">All Systems Operational</h3>
            <p className="text-gray-400">
              No active incidents or maintenance for {selectedRegion.toUpperCase()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}