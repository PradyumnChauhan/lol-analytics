'use client';

import React from 'react';
import { Layout } from '@/components/Layout';
import { SettingsDashboard } from '@/components/analytics/SettingsDashboard';

export default function SettingsPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <SettingsDashboard />
        </div>
      </div>
    </Layout>
  );
}