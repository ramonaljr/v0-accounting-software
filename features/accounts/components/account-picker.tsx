'use client'

/**
 * Account Picker Component
 * Hierarchical dropdown for selecting accounts
 */

import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Database, AccountType } from '@/lib/supabase/database.types'

type Account = Database['public']['Tables']['accounts']['Row']

interface AccountPickerProps {
  accounts: Account[]
  value?: string
  onValueChange: (accountId: string) => void
  filterType?: AccountType
  placeholder?: string
  className?: string
  disabled?: boolean
  showInactive?: boolean
}

export function AccountPicker({
  accounts,
  value,
  onValueChange,
  filterType,
  placeholder = 'Select account...',
  className,
  disabled = false,
  showInactive = false,
}: AccountPickerProps) {
  const [open, setOpen] = useState(false)

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    let filtered = accounts

    // Filter by type if specified
    if (filterType) {
      filtered = filtered.filter((acc) => acc.account_type === filterType)
    }

    // Filter inactive accounts unless showInactive is true
    if (!showInactive) {
      filtered = filtered.filter((acc) => acc.is_active)
    }

    return filtered
  }, [accounts, filterType, showInactive])

  // Group accounts by type
  const groupedAccounts = useMemo(() => {
    const groups: Record<AccountType, Account[]> = {
      asset: [],
      liability: [],
      equity: [],
      revenue: [],
      expense: [],
    }

    filteredAccounts.forEach((account) => {
      groups[account.account_type].push(account)
    })

    return groups
  }, [filteredAccounts])

  // Find selected account
  const selectedAccount = accounts.find((acc) => acc.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled}
        >
          {selectedAccount ? (
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground">{selectedAccount.code}</span>
              <span>{selectedAccount.name}</span>
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search accounts..." />
          <CommandList>
            <CommandEmpty>No account found.</CommandEmpty>
            {(Object.keys(groupedAccounts) as AccountType[]).map((type) => {
              const accountsInGroup = groupedAccounts[type]
              if (accountsInGroup.length === 0) return null

              return (
                <CommandGroup
                  key={type}
                  heading={type.charAt(0).toUpperCase() + type.slice(1)}
                >
                  {accountsInGroup.map((account) => (
                    <CommandItem
                      key={account.id}
                      value={`${account.code} ${account.name}`}
                      onSelect={() => {
                        onValueChange(account.id)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === account.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">
                          {account.code}
                        </span>
                        <span className="flex-1">{account.name}</span>
                        {!account.is_active && (
                          <span className="text-xs text-muted-foreground">
                            (Inactive)
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
