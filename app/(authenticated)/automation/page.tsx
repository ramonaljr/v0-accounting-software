/**
 * Automation Center Page
 * Manage accounting automation rules and workflows
 */

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Zap, TrendingUp, Clock, CheckCircle, AlertCircle, Settings,
  Receipt, FileText, CreditCard, Calculator, DollarSign, Building,
  ArrowRight, Activity, Pause, Play
} from 'lucide-react';

export default function AutomationCenterPage() {
  const automations = [
    {
      id: '1',
      name: 'Invoice Auto-Categorization',
      description: 'Automatically categorize incoming invoices based on vendor, description, and historical patterns',
      category: 'Accounts Payable',
      status: 'active' as const,
      processedToday: 284,
      processedTotal: 45_623,
      accuracy: 96.8,
      monthlySavings: 1250,
      lastRun: '2 minutes ago',
      agent: 'LedgerBot',
      icon: FileText,
      rules: [
        'Match vendor to chart of accounts',
        'Apply department allocation rules',
        'Flag amounts over $10,000 for review',
        'Auto-split recurring services'
      ]
    },
    {
      id: '2',
      name: 'Bank Feed Reconciliation',
      description: 'Match bank transactions to invoices, bills, and journal entries with ML-powered matching',
      category: 'Banking',
      status: 'active' as const,
      processedToday: 512,
      processedTotal: 89_234,
      accuracy: 98.2,
      monthlySavings: 2850,
      lastRun: '5 minutes ago',
      agent: 'ReconAI',
      icon: Building,
      rules: [
        'Exact amount and date matching',
        'Fuzzy matching for partial payments',
        'Handle bank fees and interest',
        'Multi-currency conversion'
      ]
    },
    {
      id: '3',
      name: 'Sales Tax Calculation',
      description: 'Calculate and apply correct sales tax rates based on jurisdiction and product type',
      category: 'Tax Compliance',
      status: 'active' as const,
      processedToday: 156,
      processedTotal: 23_456,
      accuracy: 99.7,
      monthlySavings: 1800,
      lastRun: '15 minutes ago',
      agent: 'TaxAI',
      icon: Calculator,
      rules: [
        'Multi-state nexus detection',
        'Product taxability matrix',
        'Exemption certificate validation',
        'Quarterly filing preparation'
      ]
    },
    {
      id: '4',
      name: 'Expense Report Processing',
      description: 'Process employee expense reports with receipt OCR and policy compliance checks',
      category: 'Expense Management',
      status: 'active' as const,
      processedToday: 89,
      processedTotal: 12_345,
      accuracy: 94.3,
      monthlySavings: 950,
      lastRun: '30 minutes ago',
      agent: 'ExpenseBot',
      icon: Receipt,
      rules: [
        'Receipt OCR and data extraction',
        'Policy compliance validation',
        'Mileage rate calculations',
        'Per diem limit enforcement'
      ]
    },
    {
      id: '5',
      name: 'AR Collections Workflow',
      description: 'Automate invoice reminders and dunning sequences based on customer payment history',
      category: 'Accounts Receivable',
      status: 'scheduled' as const,
      processedToday: 45,
      processedTotal: 8_234,
      accuracy: 100,
      monthlySavings: 750,
      lastRun: '2 hours ago',
      agent: 'CollectBot',
      icon: DollarSign,
      rules: [
        'Progressive reminder escalation',
        'Customer risk scoring',
        'Payment promise tracking',
        'Collections agency handoff'
      ]
    },
    {
      id: '6',
      name: 'Vendor Payment Optimization',
      description: 'Optimize payment timing to capture early payment discounts and manage cash flow',
      category: 'Accounts Payable',
      status: 'paused' as const,
      processedToday: 0,
      processedTotal: 5_678,
      accuracy: 97.1,
      monthlySavings: 2100,
      lastRun: '3 days ago',
      agent: 'PaymentBot',
      icon: CreditCard,
      rules: [
        '2/10 net 30 discount capture',
        'Cash flow optimization',
        'Payment batch processing',
        'ACH vs check decision logic'
      ]
    },
  ];

  const scheduledJobs = [
    {
      name: 'Daily Bank Sync',
      schedule: '4:00 AM EST daily',
      nextRun: 'Tomorrow at 4:00 AM',
      status: 'scheduled' as const,
      description: 'Sync transactions from all connected bank accounts',
      affectedAccounts: 12,
    },
    {
      name: 'Nightly GL Reconciliation',
      schedule: '11:00 PM EST daily',
      nextRun: 'Today at 11:00 PM',
      status: 'scheduled' as const,
      description: 'Reconcile general ledger against subsidiary ledgers',
      affectedAccounts: 'All',
    },
    {
      name: 'Weekly Tax Accruals',
      schedule: 'Fridays at 6:00 PM EST',
      nextRun: 'Friday at 6:00 PM',
      status: 'scheduled' as const,
      description: 'Calculate and post weekly tax accruals',
      affectedAccounts: 8,
    },
    {
      name: 'Monthly Close Checklist',
      schedule: 'Last day of month at 5:00 PM',
      nextRun: 'Jan 31 at 5:00 PM',
      status: 'scheduled' as const,
      description: 'Generate month-end close checklist and assignments',
      affectedAccounts: 'All',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Scheduled</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Paused</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  const totalMonthlySavings = automations.reduce((sum, a) => sum + a.monthlySavings, 0);
  const activeAutomations = automations.filter(a => a.status === 'active').length;
  const totalProcessedToday = automations.reduce((sum, a) => sum + a.processedToday, 0);
  const avgAccuracy = automations.filter(a => a.status === 'active').reduce((sum, a) => sum + a.accuracy, 0) / activeAutomations;

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              Automation Center
            </h1>
            <p className="text-gray-500 mt-1">
              Streamline accounting workflows with intelligent automation
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Automation
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Automations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {activeAutomations}
              </p>
              <p className="text-xs text-gray-500 mt-1">of {automations.length} total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Processed Today</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {totalProcessedToday.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average Accuracy</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {avgAccuracy.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">across all rules</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Monthly Savings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                ${totalMonthlySavings.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">in labor costs</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Rules</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Jobs</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {automations.map((automation) => (
              <Card key={automation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded">
                        <automation.icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{automation.name}</CardTitle>
                          {getStatusBadge(automation.status)}
                          <Badge variant="outline">{automation.category}</Badge>
                        </div>
                        <CardDescription className="mt-1">
                          {automation.description}
                        </CardDescription>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Powered by {automation.agent}</span>
                          <span>•</span>
                          <span>Last run: {automation.lastRun}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {automation.status === 'paused' ? (
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rules */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Active Rules:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {automation.rules.map((rule, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Today</p>
                      <p className="text-xl font-bold text-gray-900">
                        {automation.processedToday.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">All Time</p>
                      <p className="text-xl font-bold text-gray-900">
                        {automation.processedTotal.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Accuracy</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={automation.accuracy} className="flex-1 h-2" />
                        <span className="text-sm font-semibold text-green-600">
                          {automation.accuracy}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Monthly Savings</p>
                      <p className="text-xl font-bold text-purple-600">
                        ${automation.monthlySavings}
                      </p>
                    </div>
                    <div className="flex items-end">
                      <Button size="sm" variant="outline" className="w-full">
                        View Details
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            {scheduledJobs.map((job, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <CardTitle className="text-base">{job.name}</CardTitle>
                        <CardDescription>{job.description}</CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(job.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-500">Schedule: {job.schedule}</p>
                      <p className="text-gray-500">Next run: {job.nextRun}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">
                        Affects: {job.affectedAccounts === 'All' ? 'All accounts' : `${job.affectedAccounts} accounts`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Automation Performance Metrics</CardTitle>
                <CardDescription>
                  Track efficiency gains and accuracy across all automations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Activity className="h-12 w-12" />
                </div>
                <p className="text-center text-sm text-gray-500">
                  Performance analytics dashboard coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Automation History</CardTitle>
                <CardDescription>
                  View detailed logs of all automation executions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 text-center py-8">
                  Execution history will be available here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}