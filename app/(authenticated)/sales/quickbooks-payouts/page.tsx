import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, Download } from 'lucide-react'

export default function PaymentPayoutsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Payouts</h1>
          <p className="text-gray-600 mt-1">Track payouts from Accunza Payments</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Payouts</CardDescription>
            <CardTitle className="text-2xl">$3,200</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">In processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">$18,450</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>12% increase</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Next Payout</CardDescription>
            <CardTitle className="text-2xl">Jan 15</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">$2,500 estimated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Processing Fee</CardDescription>
            <CardTitle className="text-2xl">2.9%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">+ $0.25 per transaction</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payout History
          </CardTitle>
          <CardDescription>Accunza Payments deposits to your bank account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No payouts yet</p>
            <p className="text-sm mt-2">
              Start accepting payments through Accunza to see payouts here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
