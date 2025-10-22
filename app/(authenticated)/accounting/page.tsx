import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const accountingModules = [
  { title: 'Chart of Accounts', href: '/accounts', description: 'Manage your chart of accounts' },
  { title: 'Journal Entries', href: '/journal-entries', description: 'Create and view journal entries' },
  { title: 'Bank Reconciliation', href: '/accounting/reconcile', description: 'Reconcile bank accounts' },
  { title: 'Bank Transactions', href: '/accounting/bank-transactions', description: 'View bank transactions' },
];

export default function AccountingPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Accounting</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {accountingModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{module.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{module.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}