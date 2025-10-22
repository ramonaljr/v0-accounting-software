/**
 * AI Explainability Landing Page
 * Browse and search AI decision explanations
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileQuestion, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function AIExplainPage() {
  const recentExplanations = [
    {
      id: 'cat-1234',
      action: 'Transaction Categorization',
      description: 'Classified $892 payment to "ABC Corp" as Office Supplies',
      agent: 'LedgerBot',
      confidence: 94.2,
      date: '2 hours ago',
    },
    {
      id: 'recon-5678',
      action: 'Reconciliation Match',
      description: 'Matched bank transaction to invoice #INV-1001',
      agent: 'ReconAI',
      confidence: 97.8,
      date: '3 hours ago',
    },
    {
      id: 'anom-9012',
      action: 'Anomaly Detection',
      description: 'Flagged $15,000 payment as unusual',
      agent: 'InsightAI',
      confidence: 89.5,
      date: '5 hours ago',
    },
    {
      id: 'tax-3456',
      action: 'Tax Calculation',
      description: 'Calculated sales tax for invoice #INV-1002',
      agent: 'TaxAI',
      confidence: 99.1,
      date: '1 day ago',
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileQuestion className="h-8 w-8 text-blue-600" />
            AI Explainability
          </h1>
          <p className="text-gray-500 mt-1">
            Understand how AI agents make decisions and see their reasoning
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Explanations</CardTitle>
            <CardDescription>
              Search for AI decisions by transaction, action type, or agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by transaction ID, merchant, or action..."
                  className="pl-10"
                />
              </div>
              <Button>Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Explanations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">1,247</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Confidence</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">95.2%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Agents Active</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">5</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Explanations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Explanations</CardTitle>
            <CardDescription>
              Latest AI decisions with explanations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentExplanations.map((explanation) => (
              <Link
                key={explanation.id}
                href={`/ai/explain/${explanation.id}`}
                className="block"
              >
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium text-gray-900">
                          {explanation.action}
                        </p>
                        <Badge variant="outline">{explanation.agent}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {explanation.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {explanation.date}
                        </span>
                        <span>Confidence: {explanation.confidence}%</span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileQuestion className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  How AI Explainability Works
                </h3>
                <p className="text-sm text-blue-800">
                  Every AI decision made by our agents includes a detailed explanation
                  showing the reasoning, data sources, and confidence level. Click on any
                  action above to see the full explanation with step-by-step logic.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
