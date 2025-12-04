'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, AlertCircle, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { Bill, Supplier } from './types'

interface BillsTableProps {
  bills: Bill[];
  suppliers: Supplier[];
  loading: boolean;
  isPending: boolean;
  onSubmit: (id: string) => void;
  onCancel: (id: string) => void;
  onAddVendor: () => void;
  onAddBill: () => void;
  formatCurrency: (amount: number, currency?: string) => string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Paid':
      return <Badge variant="default">Paid</Badge>;
    case 'Submitted':
      return <Badge className="bg-blue-500">Submitted</Badge>;
    case 'Cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Draft</Badge>;
  }
}

function isOverdue(dueDate: string, status: string) {
  if (status === 'Paid' || status === 'Cancelled') return false;
  return new Date(dueDate) < new Date();
}

function isDueSoon(dueDate: string, status: string) {
  if (status === 'Paid' || status === 'Cancelled') return false;
  const due = new Date(dueDate);
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return due >= now && due <= sevenDays;
}

export function BillsTable({
  bills,
  suppliers,
  loading,
  isPending,
  onSubmit,
  onCancel,
  onAddVendor,
  onAddBill,
  formatCurrency,
}: BillsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Bills ({bills.length})
        </CardTitle>
        <CardDescription>Vendor bills and purchase invoices</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Add vendors to start creating bills</p>
            <Button className="mt-4" variant="outline" onClick={onAddVendor}>
              Add Your First Vendor
            </Button>
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No bills found</p>
            <Button className="mt-4" variant="outline" onClick={onAddBill}>
              Create Your First Bill
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id} className={isOverdue(bill.dueDate, bill.status) ? 'bg-red-50' : isDueSoon(bill.dueDate, bill.status) ? 'bg-yellow-50' : ''}>
                    <TableCell className="font-mono text-sm">{bill.invoiceNo}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bill.supplierName}</div>
                        {bill.supplierInvoiceNo && (
                          <div className="text-sm text-gray-500">Ref: {bill.supplierInvoiceNo}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(bill.postingDate).toLocaleDateString('en-PH')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isOverdue(bill.dueDate, bill.status) && <AlertCircle className="h-4 w-4 text-red-600" />}
                        {isDueSoon(bill.dueDate, bill.status) && <Clock className="h-4 w-4 text-yellow-600" />}
                        <span className={isOverdue(bill.dueDate, bill.status) ? 'text-red-600' : isDueSoon(bill.dueDate, bill.status) ? 'text-yellow-700' : ''}>
                          {new Date(bill.dueDate).toLocaleDateString('en-PH')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(bill.grandTotal, bill.currency)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(bill.outstandingAmount, bill.currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {bill.status === 'Draft' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600"
                              onClick={() => onSubmit(bill.id)}
                              disabled={isPending}
                              title="Submit Bill"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => onCancel(bill.id)}
                              disabled={isPending}
                              title="Cancel Bill"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {bill.status === 'Submitted' && bill.outstandingAmount > 0 && (
                          <Button size="sm" variant="outline" disabled>
                            Pay
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
