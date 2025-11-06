'use client';

import React from 'react';
import { Layout } from '@/components/Layout';
import { ChampionRotationDashboard } from '@/components/analytics/ChampionRotationDashboard';

export default function ChampionRotationPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <ChampionRotationDashboard />
        </div>
      </div>
    </Layout>
  );
}