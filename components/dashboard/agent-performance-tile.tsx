/**
 * Agent Performance Tile
 * Shows AI agent performance metrics and accuracy
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Bot, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface AgentMetrics {
  name: string;
  tasksCompleted: number;
  accuracy: number;
  timesSaved: number;
  status: 'active' | 'learning' | 'paused';
}

export function AgentPerformanceTile() {
  const agents: AgentMetrics[] = [
    {
      name: 'LedgerBot',
      tasksCompleted: 1847,
      accuracy: 94.2,
      timesSaved: 126,
      status: 'active',
    },
    {
      name: 'ReconAI',
      tasksCompleted: 982,
      accuracy: 97.8,
      timesSaved: 84,
      status: 'active',
    },
    {
      name: 'InsightAI',
      tasksCompleted: 423,
      accuracy: 89.5,
      timesSaved: 31,
      status: 'learning',
    },
    {
      name: 'TaxAI',
      tasksCompleted: 156,
      accuracy: 99.1,
      timesSaved: 48,
      status: 'active',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'learning':
        return <TrendingUp className="h-3 w-3 text-yellow-500" />;
      default:
        return <AlertCircle className="h-3 w-3 text-gray-400" />;
    }
  };

  const totalTimesSaved = agents.reduce((sum, agent) => sum + agent.timesSaved, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Bot className="h-4 w-4 text-purple-600" />
          Agent Performance
        </CardTitle>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">{totalTimesSaved}h</p>
          <p className="text-xs text-gray-500">saved this month</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents.map((agent) => (
            <div key={agent.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{agent.name}</span>
                  {getStatusIcon(agent.status)}
                </div>
                <span className="text-xs text-gray-500">
                  {agent.tasksCompleted} tasks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={agent.accuracy} className="flex-1 h-2" />
                <span className="text-xs font-medium text-gray-600">
                  {agent.accuracy}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}