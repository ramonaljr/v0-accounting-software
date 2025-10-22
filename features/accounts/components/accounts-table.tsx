'use client'

import { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import { MoreHorizontal, Search, Download, Eye, EyeOff, Edit, Trash2 } from 'lucide-react'
import { EditAccountDialog } from './edit-account-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { Database, AccountType } from '@/lib/supabase/database.types'

type Account = Database['public']['Tables']['accounts']['Row']

interface AccountsTableProps {
  accounts: Account[]
}

const accountTypeLabels: Record<AccountType, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  revenue: 'Income',
  expense: 'Expenses',
}

export function AccountsTable({ accounts }: AccountsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | AccountType>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const filteredAccounts = useMemo(() => {
    let filtered = accounts
    if (typeFilter !== 'all') filtered = filtered.filter((acc) => acc.account_type === typeFilter)
    if (!showInactive) filtered = filtered.filter((acc) => acc.is_active)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((acc) => acc.code.toLowerCase().includes(query) || acc.name.toLowerCase().includes(query))
    }
    return filtered
  }, [accounts, typeFilter, showInactive, searchQuery])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filter by name or number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
        </div>
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="asset">Assets</SelectItem>
            <SelectItem value="liability">Liabilities</SelectItem>
            <SelectItem value="equity">Equity</SelectItem>
            <SelectItem value="revenue">Income</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setShowInactive(!showInactive)}>
          {showInactive ? <><EyeOff className="mr-2 h-4 w-4" />Hide Inactive</> : <><Eye className="mr-2 h-4 w-4" />Show Inactive</>}
        </Button>
        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">No accounts found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono text-sm">{account.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{account.name}</span>
                      {account.is_system && <Badge variant="secondary" className="text-xs">System</Badge>}
                      {!account.is_active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{accountTypeLabels[account.account_type]}</span></TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(account.balance, account.currency)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Actions</span></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View Transactions</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingAccount(account)}><Edit className="mr-2 h-4 w-4" />Edit Account</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!account.is_system && (
                          <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />{account.is_active ? 'Deactivate' : 'Delete'}</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filteredAccounts.length} of {accounts.length} accounts</span>
        {typeFilter !== 'all' && <span>Filtered by: {accountTypeLabels[typeFilter]}</span>}
      </div>

      {editingAccount && (
        <EditAccountDialog account={editingAccount} open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)} />
      )}
    </div>
  )
}
