'use client';

/**
 * Agent Performance Page
 * Monitor and manage AI agents specialized for accounting tasks
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Bot, TrendingUp, AlertCircle, CheckCircle, Activity, Award, Clock,
  FileText, Building, Calculator, DollarSign, Receipt, TrendingDown,
  BarChart3, Settings, Info, ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function AgentPerformancePage() {
  const agents = [
    {
      name: 'LedgerBot',
      fullName: 'Transaction Categorization Agent',
      description: 'Automatically categorizes bank transactions based on vendor patterns, historical data, and GL mapping rules',
      category: 'General Ledger',
      status: 'active' as const,
      model: 'GPT-4o',
      tasksCompleted: 45623,
      tasksToday: 284,
      accuracy: 96.8,
      avgProcessingTime: 0.8,
      monthlyCost: 125,
      monthlySavings: 4500,
      confidence: 94.2,
      errorRate: 1.2,
      specialties: [
        'Vendor recognition',
        'Expense categorization',
        'Department allocation',
        'Project coding'
      ],
      recentImprovements: [
        'Improved construction vendor recognition by 15%',
        'Added support for multi-currency transactions',
        'Enhanced split transaction handling'
      ]
    },
    {
      name: 'ReconAI',
      fullName: 'Reconciliation Matching Agent',
      description: 'Matches bank transactions to invoices, bills, and journal entries using advanced pattern recognition',
      category: 'Banking',
      status: 'active' as const,
      model: 'GPT-4o',
      tasksCompleted: 89234,
      tasksToday: 512,
      accuracy: 98.2,
      avgProcessingTime: 1.2,
      monthlyCost: 280,
      monthlySavings: 8500,
      confidence: 97.5,
      errorRate: 0.8,
      specialties: [
        'Partial payment matching',
        'Bank fee identification',
        'Multi-invoice matching',
        'Deposit reconciliation'
      ],
      recentImprovements: [
        'Added support for batch ACH matching',
        'Improved handling of foreign currency transactions',
        'Enhanced duplicate detection algorithm'
      ]
    },
    {
      name: 'TaxAI',
      fullName: 'Tax Compliance Agent',
      description: 'Calculates sales tax, VAT, and other tax obligations based on jurisdiction and product rules',
      category: 'Tax & Compliance',
      status: 'active' as const,
      model: 'GPT-4o',
      tasksCompleted: 23456,
      tasksToday: 156,
      accuracy: 99.7,
      avgProcessingTime: 2.1,
      monthlyCost: 195,
      monthlySavings: 6200,
      confidence: 99.1,
      errorRate: 0.3,
      specialties: [
        'Multi-state nexus',
        'Product taxability',
        'Exemption handling',
        'Rate determination'
      ],
      recentImprovements: [
        'Updated for 2024 tax rate changes',
        'Added economic nexus threshold monitoring',
        'Improved exemption certificate validation'
      ]
    },
    {
      name: 'ExpenseBot',
      fullName: 'Expense Processing Agent',
      description: 'Processes expense reports with receipt OCR, policy validation, and approval routing',
      category: 'Expense Management',
      status: 'active' as const,
      model: 'GPT-4o-vision',
      tasksCompleted: 12345,
      tasksToday: 89,
      accuracy: 94.3,
      avgProcessingTime: 3.5,
      monthlyCost: 150,
      monthlySavings: 3200,
      confidence: 92.8,
      errorRate: 2.4,
      specialties: [
        'Receipt OCR',
        'Policy compliance',
        'Mileage tracking',
        'Per diem validation'
      ],
      recentImprovements: [
        'Improved receipt image quality handling',
        'Added support for 15 new languages',
        'Enhanced itemization extraction'
      ]
    },
    {
      name: 'InsightAI',
      fullName: 'Anomaly Detection Agent',
      description: 'Identifies unusual transactions, spending patterns, and potential errors or fraud',
      category: 'Risk & Analytics',
      status: 'learning' as const,
      model: 'GPT-4o',
      tasksCompleted: 6734,
      tasksToday: 67,
      accuracy: 89.5,
      avgProcessingTime: 5.2,
      monthlyCost: 95,
      monthlySavings: 2100,
      confidence: 87.3,
      errorRate: 4.2,
      specialties: [
        'Duplicate detection',
        'Fraud indicators',
        'Spending anomalies',
        'Vendor changes'
      ],
      recentImprovements: [
        'Reduced false positive rate by 20%',
        'Added seasonal pattern recognition',
        'Improved vendor risk scoring'
      ]
    },
    {
      name: 'CollectBot',
      fullName: 'AR Collections Agent',
      description: 'Manages customer collections with automated reminders and payment prediction',
      category: 'Accounts Receivable',
      status: 'active' as const,
      model: 'GPT-3.5-turbo',
      tasksCompleted: 8234,
      tasksToday: 45,
      accuracy: 92.1,
      avgProcessingTime: 1.5,
      monthlyCost: 75,
      monthlySavings: 1800,
      confidence: 90.5,
      errorRate: 1.8,
      specialties: [
        'Payment prediction',
        'Reminder timing',
        'Customer segmentation',
        'Dispute handling'
      ],
      recentImprovements: [
        'Improved payment prediction accuracy',
        'Added customer sentiment analysis',
        'Enhanced dispute resolution workflow'
      ]
    },
  ];

  const performanceTrend = [
    { month: 'Aug', accuracy: 91.2, tasks: 8450, cost: 680 },
    { month: 'Sep', accuracy: 92.8, tasks: 9200, cost: 720 },
    { month: 'Oct', accuracy: 94.1, tasks: 10500, cost: 750 },
    { month: 'Nov', accuracy: 95.3, tasks: 11800, cost: 810 },
    { month: 'Dec', accuracy: 96.2, tasks: 13200, cost: 890 },
    { month: 'Jan', accuracy: 96.8, tasks: 14500, cost: 920 },
  ];

  const taskDistribution = [
    { category: 'Categorization', value: 45, color: '#8B5CF6' },
    { category: 'Reconciliation', value: 30, color: '#3B82F6' },
    { category: 'Tax Calc', value: 12, color: '#10B981' },
    { category: 'Expenses', value: 8, color: '#F59E0B' },
    { category: 'Other', value: 5, color: '#6B7280' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'learning':
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
      case 'learning':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Learning</Badge>;
      default:
        return <Badge variant="secondary">Paused</Badge>;
    }
  };

  const totalMonthlySavings = agents.reduce((sum, agent) => sum + agent.monthlySavings, 0);
  const totalMonthlyCost = agents.reduce((sum, agent) => sum + agent.monthlyCost, 0);
  const totalTasksCompleted = agents.reduce((sum, agent) => sum + agent.tasksCompleted, 0);
  const averageAccuracy = agents.reduce((sum, agent) => sum + agent.accuracy, 0) / agents.length;
  const roi = ((totalMonthlySavings - totalMonthlyCost) / totalMonthlyCost * 100).toFixed(0);

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bot className="h-8 w-8 text-purple-600" />
              Agent Performance
            </h1>
            <p className="text-gray-500 mt-1">
              Monitor AI agents specialized for accounting and finance tasks
            </p>
          </div>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configure Agents
          </Button>
        </div>

        {/* ROI Summary */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div>
                <p className="text-sm text-gray-600">Monthly Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalMonthlySavings.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalMonthlyCost.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Benefit</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${(totalMonthlySavings - totalMonthlyCost).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ROI</p>
                <p className="text-2xl font-bold text-blue-600">
                  {roi}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {averageAccuracy.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Active Agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {agents.filter(a => a.status === 'active').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">of {agents.length} total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Tasks Completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {(totalTasksCompleted / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                1.8s
              </p>
              <p className="text-xs text-gray-500 mt-1">per task</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                +12.3%
              </p>
              <p className="text-xs text-gray-500 mt-1">vs last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>Accuracy and task volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
                    name="Accuracy %"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="tasks"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', r: 4 }}
                    name="Tasks"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Distribution</CardTitle>
              <CardDescription>By category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={taskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {taskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {taskDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-600">{item.category}</span>
                    </div>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Details */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Agents</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="specialties">Specialties</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {agents.map((agent) => (
              <Card key={agent.name} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-50 rounded">
                        <Bot className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{agent.fullName}</CardTitle>
                          {getStatusBadge(agent.status)}
                          <Badge variant="outline">{agent.category}</Badge>
                          <Badge variant="outline" className="text-xs">{agent.model}</Badge>
                        </div>
                        <CardDescription className="mt-1">
                          {agent.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{agent.accuracy}%</p>
                      <p className="text-xs text-gray-500">Accuracy</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Specialties */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Specialties:</p>
                    <div className="flex flex-wrap gap-2">
                      {agent.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Tasks Today</p>
                      <p className="text-lg font-bold text-gray-900">
                        {agent.tasksToday.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">All Time</p>
                      <p className="text-lg font-bold text-gray-900">
                        {(agent.tasksCompleted / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Speed</p>
                      <p className="text-lg font-bold text-gray-900">
                        {agent.avgProcessingTime}s
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Error Rate</p>
                      <p className="text-lg font-bold text-red-600">
                        {agent.errorRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Monthly Cost</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${agent.monthlyCost}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Savings</p>
                      <p className="text-lg font-bold text-green-600">
                        ${agent.monthlySavings}
                      </p>
                    </div>
                  </div>

                  {/* Recent Improvements */}
                  {agent.recentImprovements && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Recent Improvements:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {agent.recentImprovements.map((improvement, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <Button size="sm" variant="outline">
                      <Info className="h-4 w-4 mr-2" />
                      Documentation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {agents.filter(a => a.status === 'active').map((agent) => (
              <Card key={agent.name}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Bot className="h-6 w-6 text-purple-600" />
                    <div>
                      <CardTitle className="text-lg">{agent.fullName}</CardTitle>
                      <CardDescription>{agent.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="learning" className="space-y-4">
            {agents.filter(a => a.status === 'learning').map((agent) => (
              <Card key={agent.name}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Bot className="h-6 w-6 text-purple-600" />
                    <div>
                      <CardTitle className="text-lg">{agent.fullName}</CardTitle>
                      <CardDescription>{agent.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="specialties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agent Capabilities Matrix</CardTitle>
                <CardDescription>
                  Specialized capabilities across all agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {agents.map((agent) => (
                    <div key={agent.name} className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-900">{agent.name}</h4>
                      <div className="space-y-1">
                        {agent.specialties.map((specialty, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-gray-600">{specialty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}