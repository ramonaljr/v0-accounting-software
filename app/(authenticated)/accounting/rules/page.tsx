import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Zap } from "lucide-react";

export default function RulesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorization Rules</h1>
          <p className="text-gray-600 mt-1">Automate transaction categorization with custom rules</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Rules</CardDescription>
            <CardTitle className="text-2xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Rules in effect</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">156</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Auto-categorized</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Accuracy</CardDescription>
            <CardTitle className="text-2xl">98%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Rule match rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Your Rules
          </CardTitle>
          <CardDescription>Create rules to automatically categorize transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No rules created yet</p>
            <p className="text-sm mt-2">Create rules to save time categorizing similar transactions</p>
            <Button className="mt-4" variant="outline">Create Your First Rule</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
