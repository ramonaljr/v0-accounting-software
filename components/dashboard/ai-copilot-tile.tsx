/**
 * AI Co-Pilot Tile
 * Interactive chat interface for natural language queries
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Sparkles } from 'lucide-react';

export function AICopilotTile() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessing(true);
    // TODO: Integrate with AI copilot API
    setTimeout(() => {
      setIsProcessing(false);
      setQuery('');
    }, 1500);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          AI Co-Pilot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Ask me anything about your finances...
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Show me unpaid invoices over 30 days"
              disabled={isProcessing}
              className="flex-1"
            />
            <Button type="submit" disabled={isProcessing || !query.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuery("What's my cash position?")}
            >
              Cash position
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuery("Show overdue invoices")}
            >
              Overdue invoices
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuery("Categorize recent transactions")}
            >
              Categorize
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}