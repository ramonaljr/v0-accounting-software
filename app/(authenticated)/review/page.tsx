/**
 * Review Queue Page
 * Items flagged by AI that require human review for accounting compliance
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Eye, AlertTriangle, Clock, CheckSquare, Filter, ArrowRight,
  FileText, DollarSign, Building, Calculator, AlertCircle,
  TrendingUp, Receipt, CreditCard, User, Calendar, Search
} from 'lucide-react';

export default function ReviewQueuePage() {
  const reviewItems = [
    {
      id: 'REV-001',
      type: 'duplicate' as const,
      title: 'Potential duplicate payment detected',
      description: 'Invoice #INV-2024-1847 from Acme Software Inc. may have been paid twice',
      details: {
        vendor: 'Acme Software Inc.',
        invoice: 'INV-2024-1847',
        amount: 15000,
        firstPayment: 'Jan 15, 2024 - Check #1234',
        secondPayment: 'Jan 18, 2024 - ACH Transfer',
        glAccount: '6150 - Software Expenses',
        department: 'IT Operations'
      },
      priority: 'critical' as const,
      age: '30 minutes',
      account: 'Operating Account',
      aiAgent: 'InsightAI',
      confidence: 94.2,
      reason: 'Same invoice number, amount, and vendor within 3 days',
      impact: 'Overpayment of $15,000 requiring vendor credit or refund',
      suggestedAction: 'Contact vendor for refund or credit memo'
    },
    {
      id: 'REV-002',
      type: 'tax' as const,
      title: 'Sales tax calculation discrepancy',
      description: 'California nexus threshold exceeded - sales tax collection required',
      details: {
        state: 'California',
        currentSales: 125000,
        threshold: 100000,
        taxRate: 8.25,
        uncollectedTax: 2062.50,
        affectedInvoices: 18,
        quarterlyFiling: 'Due Jan 31, 2024'
      },
      priority: 'critical' as const,
      age: '2 hours',
      account: 'Tax Liability',
      aiAgent: 'TaxAI',
      confidence: 99.1,
      reason: 'Economic nexus threshold exceeded by $25,000',
      impact: 'Compliance risk - potential penalties and interest',
      suggestedAction: 'Register for CA sales tax permit and update future invoices'
    },
    {
      id: 'REV-003',
      type: 'reconciliation' as const,
      title: 'Partial payment match uncertainty',
      description: 'Customer payment of $48,750 may cover multiple invoices',
      details: {
        customer: 'Global Manufacturing Corp',
        paymentAmount: 48750,
        possibleMatches: [
          { invoice: 'INV-2024-1823', amount: 25000, age: '45 days' },
          { invoice: 'INV-2024-1856', amount: 18750, age: '32 days' },
          { invoice: 'INV-2024-1892', amount: 5000, age: '15 days' }
        ],
        appliedDiscount: 'Possible 2% early payment discount',
        customerCredit: 1250
      },
      priority: 'high' as const,
      age: '4 hours',
      account: 'Business Checking',
      aiAgent: 'ReconAI',
      confidence: 78.5,
      reason: 'Multiple invoice combinations match payment amount',
      impact: 'AR aging report accuracy',
      suggestedAction: 'Review remittance advice or contact customer'
    },
    {
      id: 'REV-004',
      type: 'expense' as const,
      title: 'Unusual expense category change',
      description: 'AWS charges historically categorized differently',
      details: {
        vendor: 'Amazon Web Services',
        currentCategory: '6200 - Professional Services',
        historicalCategory: '6150 - Software Expenses',
        amount: 8924,
        frequency: 'Monthly recurring',
        lastCategoryChange: '6 months ago',
        affectedBudget: 'Technology'
      },
      priority: 'medium' as const,
      age: '6 hours',
      account: 'Corporate Credit Card',
      aiAgent: 'LedgerBot',
      confidence: 72.3,
      reason: 'Vendor typically categorized to different GL account',
      impact: 'Budget variance in Professional Services',
      suggestedAction: 'Confirm if service type changed or update categorization rule'
    },
    {
      id: 'REV-005',
      type: 'fraud' as const,
      title: 'Suspicious vendor payment pattern',
      description: 'New vendor with escalating payment amounts',
      details: {
        vendor: 'Tech Solutions LLC',
        firstPayment: { date: 'Dec 1, 2023', amount: 2500 },
        secondPayment: { date: 'Dec 15, 2023', amount: 7500 },
        thirdPayment: { date: 'Jan 5, 2024', amount: 25000 },
        vendorAge: '45 days',
        w9Status: 'Not on file',
        approver: 'John Smith'
      },
      priority: 'critical' as const,
      age: '1 hour',
      account: 'Operating Account',
      aiAgent: 'InsightAI',
      confidence: 88.7,
      reason: '10x payment increase to new vendor without W-9',
      impact: 'Potential fraud risk or 1099 compliance issue',
      suggestedAction: 'Verify vendor legitimacy and obtain W-9 before payment'
    },
    {
      id: 'REV-006',
      type: 'compliance' as const,
      title: '1099 threshold exceeded',
      description: 'Contractor payments exceed $600 reporting threshold',
      details: {
        contractor: 'Design Studios Inc.',
        ytdPayments: 4250,
        threshold: 600,
        taxId: 'Missing',
        paymentMethod: 'ACH',
        lastPayment: 'Jan 10, 2024'
      },
      priority: 'high' as const,
      age: '8 hours',
      account: 'Operating Account',
      aiAgent: 'TaxAI',
      confidence: 100,
      reason: '1099-NEC required for payments exceeding $600',
      impact: 'IRS compliance requirement',
      suggestedAction: 'Request W-9 form from contractor immediately'
    },
    {
      id: 'REV-007',
      type: 'categorization' as const,
      title: 'Ambiguous transaction description',
      description: 'Unable to auto-categorize "MISC PAYMENT - REF 78234"',
      details: {
        description: 'MISC PAYMENT - REF 78234',
        amount: 3457,
        date: 'Jan 18, 2024',
        possibleCategories: [
          { account: '6300 - Office Supplies', confidence: 45 },
          { account: '6400 - Equipment', confidence: 35 },
          { account: '6900 - Miscellaneous', confidence: 20 }
        ]
      },
      priority: 'low' as const,
      age: '12 hours',
      account: 'Business Checking',
      aiAgent: 'LedgerBot',
      confidence: 45,
      reason: 'Generic description with no vendor match',
      impact: 'Uncategorized transaction in GL',
      suggestedAction: 'Review bank statement details or receipt'
    },
    {
      id: 'REV-008',
      type: 'accrual' as const,
      title: 'Missing accrual for recurring expense',
      description: 'Monthly rent payment not accrued for period close',
      details: {
        vendor: 'Commercial Properties LLC',
        monthlyAmount: 12500,
        lastPayment: 'Dec 28, 2023',
        nextDue: 'Jan 1, 2024',
        glAccount: '6100 - Rent Expense',
        leaseTerm: 'Through Dec 2025'
      },
      priority: 'high' as const,
      age: '3 hours',
      account: 'Accrued Expenses',
      aiAgent: 'LedgerBot',
      confidence: 95.8,
      reason: 'Recurring expense pattern broken at period end',
      impact: 'Understated expenses for December close',
      suggestedAction: 'Post accrual entry for December rent'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'duplicate':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'tax':
        return <Calculator className="h-5 w-5 text-purple-500" />;
      case 'reconciliation':
        return <CheckSquare className="h-5 w-5 text-blue-500" />;
      case 'expense':
        return <Receipt className="h-5 w-5 text-green-500" />;
      case 'fraud':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'compliance':
        return <FileText className="h-5 w-5 text-yellow-600" />;
      case 'categorization':
        return <Eye className="h-5 w-5 text-gray-500" />;
      case 'accrual':
        return <TrendingUp className="h-5 w-5 text-indigo-500" />;
      default:
        return <Eye className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'duplicate':
        return 'Duplicate';
      case 'tax':
        return 'Tax Issue';
      case 'reconciliation':
        return 'Reconciliation';
      case 'expense':
        return 'Expense';
      case 'fraud':
        return 'Fraud Risk';
      case 'compliance':
        return 'Compliance';
      case 'categorization':
        return 'Categorization';
      case 'accrual':
        return 'Accrual';
      default:
        return 'Review';
    }
  };

  const criticalCount = reviewItems.filter(i => i.priority === 'critical').length;
  const highCount = reviewItems.filter(i => i.priority === 'high').length;
  const mediumCount = reviewItems.filter(i => i.priority === 'medium').length;
  const lowCount = reviewItems.filter(i => i.priority === 'low').length;

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Eye className="h-8 w-8 text-blue-600" />
              Review Queue
            </h1>
            <p className="text-gray-500 mt-1">
              Accounting items requiring manual review and approval
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Select defaultValue="priority">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="age">Age</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="confidence">AI Confidence</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by vendor, invoice, account, or description..."
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Pending</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {reviewItems.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">items to review</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardDescription>Critical</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {criticalCount}
              </p>
              <p className="text-xs text-red-600 mt-1">immediate action</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>High Priority</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {highCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">review soon</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>At Risk Amount</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                $42K
              </p>
              <p className="text-xs text-gray-500 mt-1">potential impact</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Resolution</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                2.4h
              </p>
              <p className="text-xs text-gray-500 mt-1">time to resolve</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              All Items ({reviewItems.length})
            </TabsTrigger>
            <TabsTrigger value="critical">
              Critical ({criticalCount})
            </TabsTrigger>
            <TabsTrigger value="tax">
              Tax & Compliance ({reviewItems.filter(i => ['tax', 'compliance'].includes(i.type)).length})
            </TabsTrigger>
            <TabsTrigger value="reconciliation">
              Reconciliation ({reviewItems.filter(i => i.type === 'reconciliation').length})
            </TabsTrigger>
            <TabsTrigger value="fraud">
              Risk & Fraud ({reviewItems.filter(i => ['fraud', 'duplicate'].includes(i.type)).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {reviewItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {getTypeIcon(item.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs text-gray-500 font-mono">{item.id}</span>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <Badge variant={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                          <Badge variant="outline">
                            {getTypeLabel(item.type)}
                          </Badge>
                        </div>
                        <CardDescription className="text-base">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      {item.details.amount && (
                        <p className="text-2xl font-bold text-gray-900">
                          ${(item.details.amount / 100).toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {item.age}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Impact Alert */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">Impact</p>
                        <p className="text-sm text-amber-800">{item.impact}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Account</p>
                      <p className="text-sm font-medium text-gray-900">{item.account}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Flagged By</p>
                      <p className="text-sm font-medium text-gray-900">{item.aiAgent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">AI Confidence</p>
                      <p className="text-sm font-medium text-gray-900">{item.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Suggested Action</p>
                      <p className="text-sm font-medium text-blue-600">{item.suggestedAction}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Review Details
                    </Button>
                    {item.priority === 'critical' && (
                      <Button size="sm" variant="destructive">
                        Take Action
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      Approve
                    </Button>
                    <Button size="sm" variant="outline">
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="critical" className="space-y-4">
            {reviewItems.filter(i => i.priority === 'critical').map((item) => (
              <Card key={item.id} className="border-red-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getTypeIcon(item.type)}
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            {reviewItems.filter(i => ['tax', 'compliance'].includes(i.type)).map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getTypeIcon(item.type)}
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="reconciliation" className="space-y-4">
            {reviewItems.filter(i => i.type === 'reconciliation').map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getTypeIcon(item.type)}
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="fraud" className="space-y-4">
            {reviewItems.filter(i => ['fraud', 'duplicate'].includes(i.type)).map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getTypeIcon(item.type)}
                    <CardTitle className="text-lg">{item.title}</CardTitle>
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