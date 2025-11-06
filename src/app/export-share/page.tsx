'use client';

import React from 'react';
import { Layout } from '@/components/Layout';
import { ExportShareDashboard } from '@/components/analytics/ExportShareDashboard';

export default function ExportSharePage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <ExportShareDashboard />
        </div>
      </div>
    </Layout>
  );
}