/**
 * Automation Center Tile
 * Shows active automation rules and their performance
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Zap, TrendingUp, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AutomationCenterTile() {
  const router = useRouter();

  const automations = [
    {
      name: 'Auto-categorization',
      status: 'active',
      processed: 847,
      accuracy: 94,
      icon: Zap,
    },
    {
      name: 'Bank reconciliation',
      status: 'active',
      processed: 1243,
      accuracy: 98,
      icon: TrendingUp,
    },
    {
      name: 'Invoice reminders',
      status: 'scheduled',
      processed: 56,
      accuracy: 100,
      icon: Clock,
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Automation Center</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/settings/automation')}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {automations.map((automation) => (
            <div
              key={automation.name}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
              onClick={() => router.push(`/automation/${automation.name.toLowerCase().replace(/\s+/g, '-')}`)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded">
                  <automation.icon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{automation.name}</p>
                  <p className="text-xs text-gray-500">
                    {automation.processed} processed
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-green-600">
                  {automation.accuracy}%
                </p>
                <p className="text-xs text-gray-500">accuracy</p>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="link"
          className="w-full mt-3"
          onClick={() => router.push('/automation')}
        >
          View all automations
        </Button>
      </CardContent>
    </Card>
  );
}