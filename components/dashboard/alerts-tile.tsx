/**
 * Alerts Tile
 * Shows critical alerts and notifications
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, Bell, X } from 'lucide-react';
import { useState } from 'react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  actionUrl?: string;
}

export function AlertsTile() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'critical',
      title: 'Bank sync failed',
      description: 'Chase Business account sync failed. Reconnect required.',
      timestamp: '5 min ago',
      actionUrl: '/bank-feeds',
    },
    {
      id: '2',
      type: 'warning',
      title: 'Tax filing deadline',
      description: 'Q4 sales tax filing due in 3 days',
      timestamp: '1 hour ago',
      actionUrl: '/taxes',
    },
    {
      id: '3',
      type: 'info',
      title: 'New AI features available',
      description: 'ReconAI now supports multi-currency matching',
      timestamp: '2 hours ago',
    },
  ]);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Alerts</CardTitle>
        {alerts.length > 0 && (
          <span className="text-xs text-gray-500">{alerts.length} active</span>
        )}
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 border rounded-lg ${getAlertBgColor(alert.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500">
                          {alert.timestamp}
                        </span>
                        {alert.actionUrl && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                          >
                            Take action
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}