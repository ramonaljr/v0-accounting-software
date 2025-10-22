"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Download, Send, DollarSign, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { recordPayment } from "@/features/invoices/actions";

interface InvoiceDetail {
  id: string;
  invoice_number: string;
  customer: { id: string; name: string; email: string };
  invoice_date: string;
  due_date: string;
  status: string;
  terms: string;
  currency: string;
  subtotal: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  notes?: string;
  line_items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    tax_amount: number;
  }>;
  payments: Array<{
    id: string;
    date: string;
    amount: number;
    payment_method: string;
    reference?: string;
  }>;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  partial: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "cash" | "check" | "stripe" | "paypal" | "other">("bank");
  const [paymentReference, setPaymentReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement getInvoiceById action
      // Mock data for now
      const mockInvoice: InvoiceDetail = {
        id: invoiceId,
        invoice_number: "INV-0001",
        customer: {
          id: "1",
          name: "Acme Corporation",
          email: "billing@acme.com",
        },
        invoice_date: "2025-01-15",
        due_date: "2025-02-14",
        status: "sent",
        terms: "Net 30",
        currency: "USD",
        subtotal: 1000,
        tax_total: 100,
        total: 1100,
        amount_paid: 0,
        amount_due: 1100,
        notes: "Thank you for your business!",
        line_items: [
          {
            id: "1",
            description: "Web Design Services",
            quantity: 10,
            unit_price: 100,
            amount: 1000,
            tax_amount: 100,
          },
        ],
        payments: [],
      };
      setInvoice(mockInvoice);
      setPaymentAmount(mockInvoice.amount_due.toString());
    } catch (error) {
      console.error("[Invoice] Load error:", error);
      toast.error("Failed to load invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!invoice) return;

    setIsSubmitting(true);
    try {
      const result = await recordPayment({
        invoiceId: invoice.id,
        amount: parseFloat(paymentAmount),
        paymentDate,
        paymentMethod,
        reference: paymentReference || undefined,
      });

      if (result.success) {
        toast.success("Payment recorded successfully");
        setIsPaymentDialogOpen(false);
        loadInvoice(); // Reload invoice to show updated payment
      } else {
        toast.error(result.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("[Invoice] Payment error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoice?.currency || "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Invoice not found</h2>
        <Button onClick={() => router.push("/invoices")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/invoices")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-muted-foreground mt-1">
              Invoice to {invoice.customer.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Printer className="w-4 h-4" />
          </Button>
          {invoice.status === "draft" && (
            <Button>
              <Send className="w-4 h-4 mr-2" />
              Send Invoice
            </Button>
          )}
          {invoice.amount_due > 0 && invoice.status !== "cancelled" && (
            <Dialog
              open={isPaymentDialogOpen}
              onOpenChange={setIsPaymentDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>
                    Record a payment received for this invoice
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-amount">Amount</Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                    />
                    <p className="text-sm text-muted-foreground">
                      Amount due: {formatCurrency(invoice.amount_due)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment-date">Payment Date</Label>
                    <Input
                      id="payment-date"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}
                    >
                      <SelectTrigger id="payment-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment-reference">Reference (Optional)</Label>
                    <Input
                      id="payment-reference"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Transaction ID, check number, etc."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsPaymentDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleRecordPayment} disabled={isSubmitting}>
                    Record Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                BILL TO
              </h3>
              <p className="font-medium">{invoice.customer.name}</p>
              <p className="text-sm text-muted-foreground">
                {invoice.customer.email}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge
                  variant="secondary"
                  className={statusColors[invoice.status] || ""}
                >
                  {invoice.status.charAt(0).toUpperCase() +
                    invoice.status.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Invoice Date:
                </span>
                <span className="text-sm font-medium">
                  {formatDate(invoice.invoice_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Due Date:</span>
                <span className="text-sm font-medium">
                  {formatDate(invoice.due_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Terms:</span>
                <span className="text-sm font-medium">{invoice.terms}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Tax</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.line_items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unit_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.tax_amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-6" />

          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax:</span>
                <span className="font-medium">
                  {formatCurrency(invoice.tax_total)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(invoice.amount_paid)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Amount Due:</span>
                <span className="text-primary">
                  {formatCurrency(invoice.amount_due)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments History */}
      {invoice.payments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell className="capitalize">
                      {payment.payment_method.replace("_", " ")}
                    </TableCell>
                    <TableCell>{payment.reference || "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
