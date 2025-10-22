'use client';

/**
 * AI Insights & Anomalies Page
 * Financial insights, anomalies, and predictive analytics for accounting
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Lightbulb, TrendingUp, AlertTriangle, Info, Sparkles, ArrowRight,
  DollarSign, TrendingDown, Target, Calendar, BarChart3, Activity,
  AlertCircle, CheckCircle, Clock, FileText, Calculator
} from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AIInsightsPage() {
  const insights = [
    {
      id: 'INS-001',
      type: 'cash_flow' as const,
      severity: 'critical' as const,
      title: 'Cash flow constraint detected in 45 days',
      description: 'Based on current AR collection patterns and upcoming AP obligations, cash position may go negative',
      details: {
        currentCash: 125000,
        projectedLow: -18000,
        daysUntilLow: 45,
        primaryDrivers: ['Large Q1 tax payment due', 'Slow January collections', 'Annual insurance renewal'],
        arOutstanding: 285000,
        apDue30Days: 195000
      },
      agent: 'InsightAI',
      confidence: 92.3,
      action: 'Accelerate collections',
      recommendation: 'Offer 2/10 net 30 payment terms to top 5 customers with outstanding invoices over 30 days. This could bring in $85,000 within 10 days.',
      potentialImpact: 85000,
      timestamp: '15 minutes ago'
    },
    {
      id: 'INS-002',
      type: 'expense_trend' as const,
      severity: 'warning' as const,
      title: 'Marketing expenses 45% over budget YTD',
      description: 'Marketing spend is significantly exceeding planned budget with lower than expected ROI',
      details: {
        budgetedYTD: 125000,
        actualYTD: 181250,
        variance: 56250,
        variancePercent: 45,
        topVendors: [
          { name: 'Google Ads', spend: 62000, roi: 2.1 },
          { name: 'Facebook Ads', spend: 38000, roi: 1.8 },
          { name: 'LinkedIn Ads', spend: 28000, roi: 1.2 }
        ],
        projectedAnnualOverage: 135000
      },
      agent: 'InsightAI',
      confidence: 88.5,
      action: 'Review marketing efficiency',
      recommendation: 'Pause LinkedIn Ads (lowest ROI) and reallocate budget to Google Ads. Set up weekly spend alerts.',
      potentialSavings: 28000,
      timestamp: '2 hours ago'
    },
    {
      id: 'INS-003',
      type: 'revenue_opportunity' as const,
      severity: 'info' as const,
      title: 'Seasonal revenue opportunity identified',
      description: 'Historical data shows 35% revenue increase potential in Q2 with targeted campaigns',
      details: {
        historicalQ2Lift: 35,
        topProducts: ['Tax Preparation Services', 'Quarterly Filing Support', 'Audit Defense'],
        estimatedRevenue: 425000,
        requiredInvestment: 25000,
        expectedROI: 17
      },
      agent: 'InsightAI',
      confidence: 85.2,
      action: 'Plan Q2 campaign',
      recommendation: 'Launch tax season campaign by March 1st targeting SMBs with 1-10 employees',
      potentialRevenue: 425000,
      timestamp: '4 hours ago'
    },
    {
      id: 'INS-004',
      type: 'cost_saving' as const,
      severity: 'info' as const,
      title: 'Duplicate software subscriptions detected',
      description: 'Multiple departments subscribing to similar or overlapping software services',
      details: {
        duplicateServices: [
          { service: 'Project Management', vendors: ['Asana', 'Monday.com', 'Trello'], monthlyCost: 850 },
          { service: 'Cloud Storage', vendors: ['Dropbox', 'Box', 'Google Drive'], monthlyCost: 420 },
          { service: 'Communication', vendors: ['Slack', 'Teams', 'Discord'], monthlyCost: 380 }
        ],
        totalMonthlySavings: 1650,
        annualSavings: 19800
      },
      agent: 'ExpenseBot',
      confidence: 94.7,
      action: 'Consolidate subscriptions',
      recommendation: 'Standardize on Microsoft 365 suite (includes Teams, OneDrive) and Asana for project management',
      potentialSavings: 19800,
      timestamp: '6 hours ago'
    },
    {
      id: 'INS-005',
      type: 'working_capital' as const,
      severity: 'warning' as const,
      title: 'DSO increased by 12 days month-over-month',
      description: 'Days Sales Outstanding has deteriorated from 42 to 54 days, impacting working capital',
      details: {
        currentDSO: 54,
        previousDSO: 42,
        industryAverage: 38,
        topDelayedCustomers: [
          { name: 'Tech Corp', outstanding: 45000, daysOverdue: 35 },
          { name: 'Global Industries', outstanding: 38000, daysOverdue: 42 },
          { name: 'Retail Plus', outstanding: 28000, daysOverdue: 28 }
        ],
        cashImpact: 185000
      },
      agent: 'CollectBot',
      confidence: 96.8,
      action: 'Implement collection strategy',
      recommendation: 'Initiate collection calls for accounts over 30 days. Consider offering payment plans for large balances.',
      potentialRecovery: 111000,
      timestamp: '3 hours ago'
    },
    {
      id: 'INS-006',
      type: 'tax_optimization' as const,
      severity: 'info' as const,
      title: 'R&D tax credit opportunity identified',
      description: 'Eligible R&D expenses not being tracked for potential tax credit claim',
      details: {
        eligibleExpenses: 285000,
        estimatedCredit: 28500,
        qualifyingActivities: ['Software development', 'Process improvement', 'Technical design'],
        documentationNeeded: ['Time tracking records', 'Project descriptions', 'Technical specifications'],
        filingDeadline: 'April 15, 2024'
      },
      agent: 'TaxAI',
      confidence: 89.3,
      action: 'Document R&D activities',
      recommendation: 'Start tracking engineering time on qualifying projects. Engage R&D tax credit specialist by March 1st.',
      potentialCredit: 28500,
      timestamp: '8 hours ago'
    },
    {
      id: 'INS-007',
      type: 'budget_variance' as const,
      severity: 'warning' as const,
      title: 'Q1 operating expenses 18% over budget',
      description: 'Multiple expense categories exceeding budget with 2 months remaining in quarter',
      details: {
        budgetedQ1: 450000,
        currentSpend: 385000,
        projectedQ1: 531000,
        topVariances: [
          { category: 'Salaries', variance: 25000, percent: 8 },
          { category: 'Marketing', variance: 35000, percent: 45 },
          { category: 'Travel', variance: 18000, percent: 60 },
          { category: 'Software', variance: 12000, percent: 20 }
        ]
      },
      agent: 'InsightAI',
      confidence: 91.2,
      action: 'Implement spending controls',
      recommendation: 'Freeze non-essential travel and require VP approval for purchases over $1,000',
      potentialSavings: 45000,
      timestamp: '5 hours ago'
    },
    {
      id: 'INS-008',
      type: 'fraud_risk' as const,
      severity: 'critical' as const,
      title: 'Unusual pattern in employee expense reports',
      description: 'Multiple expense reports with similar amounts and vendors from different employees',
      details: {
        suspiciousPattern: 'Round dollar amounts to same vendor',
        affectedEmployees: 3,
        totalAmount: 8500,
        vendorName: 'Business Supplies Inc',
        commonAmount: 850,
        frequency: 'Weekly for past month'
      },
      agent: 'InsightAI',
      confidence: 78.9,
      action: 'Investigate immediately',
      recommendation: 'Request original receipts and conduct vendor verification. Consider forensic audit if pattern confirmed.',
      potentialLoss: 8500,
      timestamp: '1 hour ago'
    }
  ];

  const cashFlowProjection = [
    { month: 'Jan', actual: 125000, projected: 125000 },
    { month: 'Feb', actual: null, projected: 98000 },
    { month: 'Mar', actual: null, projected: 45000 },
    { month: 'Apr', actual: null, projected: -18000 },
    { month: 'May', actual: null, projected: 25000 },
    { month: 'Jun', actual: null, projected: 85000 },
  ];

  const insightTrend = [
    { week: 'W1', critical: 2, warning: 5, info: 8 },
    { week: 'W2', critical: 3, warning: 7, info: 12 },
    { week: 'W3', critical: 1, warning: 6, info: 10 },
    { week: 'W4', critical: 3, warning: 8, info: 15 },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cash_flow':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'expense_trend':
        return <TrendingUp className="h-5 w-5 text-orange-500" />;
      case 'revenue_opportunity':
        return <Target className="h-5 w-5 text-purple-500" />;
      case 'cost_saving':
        return <TrendingDown className="h-5 w-5 text-blue-500" />;
      case 'working_capital':
        return <Activity className="h-5 w-5 text-indigo-500" />;
      case 'tax_optimization':
        return <Calculator className="h-5 w-5 text-green-600" />;
      case 'budget_variance':
        return <BarChart3 className="h-5 w-5 text-yellow-600" />;
      case 'fraud_risk':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;
  const infoCount = insights.filter(i => i.severity === 'info').length;
  const totalPotentialValue = insights.reduce((sum, i) => {
    return sum + (i.potentialImpact || i.potentialSavings || i.potentialRevenue || i.potentialCredit || 0);
  }, 0);

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-600" />
              AI Insights & Anomalies
            </h1>
            <p className="text-gray-500 mt-1">
              AI-powered financial insights, predictions, and optimization opportunities
            </p>
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Value Summary Card */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Insights</p>
                <p className="text-3xl font-bold text-gray-900">
                  {insights.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-3xl font-bold text-red-600">
                  {criticalCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {warningCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Opportunities</p>
                <p className="text-3xl font-bold text-blue-600">
                  {infoCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Potential Value</p>
                <p className="text-3xl font-bold text-green-600">
                  ${(totalPotentialValue / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Projection</CardTitle>
              <CardDescription>6-month forecast with critical point detection</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={cashFlowProjection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `$${(value as number / 1000).toFixed(0)}K`} />
                  <Line
                    type="monotone"
                    dataKey="projected"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#8B5CF6', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insight Trend</CardTitle>
              <CardDescription>Weekly insight generation by severity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={insightTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="critical" fill="#EF4444" />
                  <Bar dataKey="warning" fill="#F59E0B" />
                  <Bar dataKey="info" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Insights ({insights.length})</TabsTrigger>
            <TabsTrigger value="critical">Critical ({criticalCount})</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="cost">Cost Optimization</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {getTypeIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs text-gray-500 font-mono">{insight.id}</span>
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <Badge variant={getSeverityColor(insight.severity)}>
                            {insight.severity}
                          </Badge>
                          <Badge variant="outline">
                            {getTypeLabel(insight.type)}
                          </Badge>
                        </div>
                        <CardDescription className="text-base">
                          {insight.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      {(insight.potentialImpact || insight.potentialSavings || insight.potentialRevenue) && (
                        <div>
                          <p className="text-xs text-gray-500">Potential Value</p>
                          <p className="text-2xl font-bold text-green-600">
                            ${((insight.potentialImpact || insight.potentialSavings || insight.potentialRevenue || 0) / 1000).toFixed(0)}K
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">{insight.timestamp}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recommendation Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-1">Recommendation</p>
                        <p className="text-sm text-blue-800">{insight.recommendation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Detected By</p>
                      <p className="text-sm font-medium text-gray-900">{insight.agent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Confidence</p>
                      <p className="text-sm font-medium text-gray-900">{insight.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Action Required</p>
                      <p className="text-sm font-medium text-gray-900">{insight.action}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Impact Type</p>
                      <p className="text-sm font-medium text-gray-900">
                        {insight.potentialSavings ? 'Cost Savings' :
                         insight.potentialRevenue ? 'Revenue' :
                         insight.potentialCredit ? 'Tax Credit' : 'Cash Flow'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      View Analysis
                    </Button>
                    <Link href={`/ai/explain/${insight.id}`}>
                      <Button size="sm" variant="outline">
                        Why? (Explain)
                      </Button>
                    </Link>
                    {insight.severity === 'critical' && (
                      <Button size="sm" className="flex-1">
                        Take Action
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="critical" className="space-y-4">
            {insights.filter(i => i.severity === 'critical').map((insight) => (
              <Card key={insight.id} className="border-red-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getTypeIcon(insight.type)}
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-4">
            {insights.filter(i => ['revenue_opportunity', 'tax_optimization'].includes(i.type)).map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getTypeIcon(insight.type)}
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="cost" className="space-y-4">
            {insights.filter(i => ['cost_saving', 'expense_trend', 'budget_variance'].includes(i.type)).map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getTypeIcon(insight.type)}
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            {insights.filter(i => ['revenue_opportunity', 'working_capital', 'cash_flow'].includes(i.type)).map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getTypeIcon(insight.type)}
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}