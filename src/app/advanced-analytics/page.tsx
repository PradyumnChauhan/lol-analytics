'use client';

import React from 'react';
import { Layout } from '@/components/Layout';
import { AdvancedAnalyticsDashboard } from '@/components/analytics/AdvancedAnalyticsDashboard';

export default function AdvancedAnalyticsPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <AdvancedAnalyticsDashboard />
        </div>
      </div>
    </Layout>
  );
}