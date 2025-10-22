"use client";

/**
 * AI Insights Tile
 * Displays AI-powered insights, anomalies, and suggestions
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Info,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import type { AIInsight } from "@/features/dashboard/types";
import { getAIInsights, generateInsights } from "@/features/dashboard/ai-insights-actions";
import { toast } from "sonner";

interface AIInsightsTileProps {
  insights?: AIInsight[];
}

function getSeverityIcon(severity: AIInsight["severity"]) {
  switch (severity) {
    case "critical":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "warning":
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case "info":
      return <Info className="h-4 w-4 text-blue-500" />;
  }
}

function getSeverityColor(severity: AIInsight["severity"]) {
  switch (severity) {
    case "critical":
      return "bg-red-50 border-red-200";
    case "warning":
      return "bg-orange-50 border-orange-200";
    case "info":
      return "bg-blue-50 border-blue-200";
  }
}

function getAgentTypeBadge(agentType: AIInsight["agentType"]) {
  switch (agentType) {
    case "anomaly":
      return <Badge variant="outline" className="text-orange-600 border-orange-300">Anomaly</Badge>;
    case "variance":
      return <Badge variant="outline" className="text-purple-600 border-purple-300">Variance</Badge>;
    case "forecast":
      return <Badge variant="outline" className="text-blue-600 border-blue-300">Forecast</Badge>;
    case "suggestion":
      return <Badge variant="outline" className="text-green-600 border-green-300">Suggestion</Badge>;
  }
}

export function AIInsightsTile({ insights: propInsights }: AIInsightsTileProps) {
  const router = useRouter();
  const [insights, setInsights] = useState<AIInsight[]>(propInsights || []);
  const [isLoading, setIsLoading] = useState(!propInsights);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch insights on mount if not provided
  useEffect(() => {
    if (!propInsights) {
      loadInsights();
    }
  }, [propInsights]);

  async function loadInsights() {
    setIsLoading(true);
    try {
      const result = await getAIInsights({ limit: 5 });
      if (result.success && result.data) {
        setInsights(result.data);
      } else if (result.error) {
        console.error("Failed to load insights:", result.error);
      }
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateInsights() {
    setIsGenerating(true);
    try {
      const result = await generateInsights();
      if (result.success) {
        toast.success(`Generated ${result.generated} new AI insights`);
        await loadInsights(); // Reload insights
      } else {
        toast.error(result.error || "Failed to generate insights");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base font-medium">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <RefreshCw className="h-12 w-12 mx-auto mb-3 text-gray-300 animate-spin" />
            <p className="text-sm">Loading AI insights...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base font-medium">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm mb-3">No insights at this time</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateInsights}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI Insights
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-base font-medium">AI Insights</CardTitle>
        </div>
        <Badge variant="secondary" className="text-xs">
          {insights.length} new
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.slice(0, 3).map((insight) => (
          <div
            key={insight.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors hover:shadow-sm ${getSeverityColor(insight.severity)}`}
            onClick={() => insight.actionUrl && router.push(insight.actionUrl)}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getSeverityIcon(insight.severity)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getAgentTypeBadge(insight.agentType)}
                  <span className="text-xs text-gray-500">
                    {Math.round(insight.confidence * 100)}% confidence
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {insight.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
                <div className="flex items-center justify-between">
                  {insight.whyLink && (
                    <button
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(insight.whyLink!);
                      }}
                    >
                      Why? <Info className="h-3 w-3" />
                    </button>
                  )}
                  {insight.actionUrl && (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {insights.length > 3 && (
          <Button
            variant="link"
            className="w-full text-purple-600 hover:text-purple-700"
            onClick={() => router.push("/ai/insights")}
          >
            View all {insights.length} insights →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
