import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Shield } from "lucide-react";

export default function BenefitsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Benefits</h1>
          <p className="text-gray-600 mt-1">Manage health insurance, 401(k), and other benefits</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Benefit Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Enrolled Employees</CardDescription>
            <CardTitle className="text-2xl">18</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Active participants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Monthly Cost</CardDescription>
            <CardTitle className="text-2xl">$12,400</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Employer contribution</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Plans</CardDescription>
            <CardTitle className="text-2xl">4</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Benefit offerings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Health Insurance
            </CardTitle>
            <CardDescription>Medical, dental, and vision coverage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enrolled employees</span>
                <span className="font-semibold">16</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Monthly premium</span>
                <span className="font-semibold">$8,500</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              401(k) Retirement Plan
            </CardTitle>
            <CardDescription>Employer-matched retirement savings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Participating employees</span>
                <span className="font-semibold">14</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Employer match</span>
                <span className="font-semibold">4%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
