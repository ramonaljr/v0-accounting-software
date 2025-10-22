/**
 * Review Queue Tile
 * Shows items that need human review
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, AlertCircle, Clock, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReviewItem {
  id: string;
  type: 'transaction' | 'reconciliation' | 'categorization' | 'anomaly';
  description: string;
  amount?: number;
  priority: 'high' | 'medium' | 'low';
  age: string;
}

export function ReviewQueueTile() {
  const router = useRouter();

  const reviewItems: ReviewItem[] = [
    {
      id: '1',
      type: 'anomaly',
      description: 'Unusual payment to new vendor',
      amount: 15000,
      priority: 'high',
      age: '2h ago',
    },
    {
      id: '2',
      type: 'reconciliation',
      description: 'Multiple matches found',
      amount: 3250,
      priority: 'medium',
      age: '5h ago',
    },
    {
      id: '3',
      type: 'categorization',
      description: 'Ambiguous merchant name',
      amount: 892,
      priority: 'low',
      age: '1d ago',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'reconciliation':
        return <CheckSquare className="h-4 w-4 text-blue-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Review Queue</CardTitle>
        <Badge variant="secondary">{reviewItems.length} pending</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reviewItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => router.push(`/review/${item.type}/${item.id}`)}
            >
              <div className="flex items-start gap-3">
                {getTypeIcon(item.type)}
                <div>
                  <p className="text-sm font-medium">{item.description}</p>
                  {item.amount && (
                    <p className="text-sm text-gray-600">
                      ${(item.amount / 100).toFixed(2)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getPriorityColor(item.priority)} className="text-xs">
                      {item.priority}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {item.age}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Review
              </Button>
            </div>
          ))}
        </div>
        {reviewItems.length > 3 && (
          <Button
            variant="link"
            className="w-full mt-3"
            onClick={() => router.push('/review')}
          >
            View all {reviewItems.length} items
          </Button>
        )}
      </CardContent>
    </Card>
  );
}