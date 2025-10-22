/**
 * AI Explainability Page
 * Shows detailed explanation of AI decision-making for a specific insight or action
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import Link from "next/link";
import { getAIExplanation } from "@/features/ai/explainability-actions";

interface AIExplanationPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Legacy mock function for fallback
function getExplanationData(id: string) {
  // Parse ID to get type and identifier
  // Format: {type}-{timestamp} e.g., "anomaly-1234567890"
  const [type, timestamp] = id.split("-");

  if (!type || !timestamp) {
    return null;
  }

  // Mock data based on type
  const explanations: Record<string, any> = {
    anomaly: {
      title: "Unusual Expense Pattern Detected",
      insightType: "Anomaly Detection",
      severity: "warning",
      confidence: 0.89,
      description: "Software expenses up 45% vs last month",
      reasoning: [
        {
          step: 1,
          title: "Historical Analysis",
          description: "Analyzed software expenses for the past 12 months",
          details: [
            "Average monthly software expenses: $3,000",
            "Standard deviation: $450",
            "Current month: $4,350",
            "Deviation: 3.0σ (statistically significant)",
          ],
        },
        {
          step: 2,
          title: "Pattern Recognition",
          description: "Identified new transactions contributing to variance",
          details: [
            "New subscription: Adobe Creative Cloud ($79.99/month)",
            "New subscription: Figma Professional ($45/month)",
            "Increased Slack seats: +15 seats ($225)",
            "Total new monthly recurring: $349.99",
          ],
        },
        {
          step: 3,
          title: "Risk Assessment",
          description: "Evaluated business impact and urgency",
          details: [
            "Budget category: Software & Technology",
            "Budget remaining: $8,500 (48% of annual budget)",
            "Trend: Upward trajectory",
            "Recommendation: Review subscription usage",
          ],
        },
      ],
      affectedTransactions: [
        { id: "tx1", date: "2025-01-15", merchant: "Adobe Systems", amount: 79.99 },
        { id: "tx2", date: "2025-01-15", merchant: "Figma", amount: 45.00 },
        { id: "tx3", date: "2025-01-18", merchant: "Slack Technologies", amount: 225.00 },
      ],
      recommendation: "Consider conducting a software audit to identify unused subscriptions and optimize spending.",
    },
    variance: {
      title: "Revenue Ahead of Forecast",
      insightType: "Variance Analysis",
      severity: "info",
      confidence: 0.95,
      description: "12% above projected revenue for this period",
      reasoning: [
        {
          step: 1,
          title: "Forecast Comparison",
          description: "Compared actual revenue to ML forecast model",
          details: [
            "Forecasted revenue: $50,000",
            "Actual revenue: $56,000",
            "Variance: +$6,000 (12%)",
            "Model accuracy: 95% confidence interval",
          ],
        },
        {
          step: 2,
          title: "Contributing Factors",
          description: "Identified key drivers of positive variance",
          details: [
            "New customer acquisitions: +8 customers",
            "Upsells to existing customers: +$3,500",
            "Seasonal trend: January typically +10% vs average",
            "No one-time events detected",
          ],
        },
        {
          step: 3,
          title: "Trend Analysis",
          description: "Assessed sustainability of growth",
          details: [
            "3-month trailing growth: +15%",
            "Year-over-year growth: +22%",
            "Customer retention: 94% (excellent)",
            "Pipeline health: Strong (projected to sustain)",
          ],
        },
      ],
      affectedTransactions: [],
      recommendation: "Capitalize on positive momentum by reviewing sales strategies that are working and scaling successful tactics.",
    },
    suggestion: {
      title: "Collections Opportunity",
      insightType: "AI Suggestion",
      severity: "info",
      confidence: 0.82,
      description: "3 invoices may be eligible for early payment discount",
      reasoning: [
        {
          step: 1,
          title: "Customer Payment Analysis",
          description: "Analyzed payment patterns across customer base",
          details: [
            "Identified 3 customers with strong payment history",
            "Average days to pay: 15 days (vs terms: 30 days)",
            "Payment reliability: 100% on-time",
            "Total outstanding: $8,500",
          ],
        },
        {
          step: 2,
          title: "Cash Flow Impact",
          description: "Calculated benefit of accelerated payment",
          details: [
            "Early payment discount: 2% for payment within 10 days",
            "Potential discount cost: $170",
            "Cash received 20 days earlier",
            "Opportunity cost saving: ~$50 (assuming 10% annual cost of capital)",
            "Net benefit: Improved cash flow position",
          ],
        },
        {
          step: 3,
          title: "Customer Relationship",
          description: "Assessed impact on customer satisfaction",
          details: [
            "All 3 customers are long-term (2+ years)",
            "High customer satisfaction scores",
            "Likely to appreciate early payment incentive",
            "Low risk of misinterpreting as desperation",
          ],
        },
      ],
      affectedTransactions: [],
      recommendation: "Offer 2% early payment discount to identified customers via email. Monitor acceptance rate and adjust strategy.",
    },
  };

  return explanations[type] || null;
}

export default async function AIExplanationPage({ params }: AIExplanationPageProps) {
  const { id } = await params;

  // Fetch real AI explanation data
  const result = await getAIExplanation(id);

  // Fall back to mock data if real data not found
  const explanation = result.success && result.data
    ? result.data
    : getExplanationData(id);

  if (!explanation) {
    notFound();
  }

  const severityColorMap: Record<string, string> = {
    info: "text-blue-600 bg-blue-50 border-blue-200",
    warning: "text-orange-600 bg-orange-50 border-orange-200",
    critical: "text-red-600 bg-red-50 border-red-200",
  };
  const severityColor = severityColorMap[explanation.severity] || severityColorMap.info;

  const severityIconMap: Record<string, React.ReactNode> = {
    info: <CheckCircle className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    critical: <XCircle className="h-5 w-5" />,
  };
  const severityIcon = severityIconMap[explanation.severity] || severityIconMap.info;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <h1 className="text-3xl font-bold">{explanation.title}</h1>
            </div>
            <p className="text-gray-600">{explanation.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {explanation.insightType}
            </Badge>
            <Badge className={`${severityColor} border`}>
              <span className="flex items-center gap-1">
                {severityIcon}
                {explanation.severity}
              </span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Confidence Score */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">AI Confidence Score</p>
              <p className="text-3xl font-bold text-purple-600">
                {(explanation.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-2">Was this helpful?</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Yes
                </Button>
                <Button variant="outline" size="sm">
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  No
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reasoning Steps */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          How We Arrived at This Insight
        </h2>

        <div className="space-y-4">
          {explanation.reasoning.map((step: any) => (
            <Card key={step.step}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {step.details.map((detail: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Affected Transactions */}
      {explanation.affectedTransactions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Affected Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {explanation.affectedTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{tx.merchant}</p>
                    <p className="text-sm text-gray-500">{tx.date}</p>
                  </div>
                  <p className="font-semibold">${tx.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{explanation.recommendation}</p>
        </CardContent>
      </Card>
    </div>
  );
}
