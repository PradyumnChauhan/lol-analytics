'use client';

import { Card } from '@/components/ui/card';
import { Award, Target } from 'lucide-react';

interface StrengthWeaknessCardProps {
  strengths: string;
  weaknesses: string;
}

export function StrengthWeaknessCard({ strengths, weaknesses }: StrengthWeaknessCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-lg text-green-800">Strengths</h3>
        </div>
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-700">
            {strengths || 'No strengths identified yet.'}
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-orange-50 border-orange-200">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-lg text-orange-800">Weaknesses</h3>
        </div>
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-700">
            {weaknesses || 'No weaknesses identified yet.'}
          </div>
        </div>
      </Card>
    </div>
  );
}

