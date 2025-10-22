'use client'

/**
 * New Account Dialog - QBO Style Slide-over
 * Form for creating new accounts
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { createAccount } from '../actions'
import { AccountPicker } from './account-picker'
import type { Database, AccountType } from '@/lib/supabase/database.types'

type Account = Database['public']['Tables']['accounts']['Row']

const formSchema = z.object({
  code: z.string().min(1, 'Account number is required'),
  name: z.string().min(1, 'Account name is required'),
  account_type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  parent_id: z.string().optional(),
  currency: z.string(),
  description: z.string().optional(),
  is_subaccount: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface NewAccountDialogProps {
  accounts: Account[]
  trigger?: React.ReactNode
}

export function NewAccountDialog({ accounts, trigger }: NewAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      account_type: 'expense',
      currency: 'USD',
      is_subaccount: false,
    },
  })

  const isSubaccount = form.watch('is_subaccount')
  const selectedType = form.watch('account_type')

  async function onSubmit(values: FormValues) {
    setIsLoading(true)

    try {
      const result = await createAccount({
        code: values.code,
        name: values.name,
        account_type: values.account_type,
        parent_id: values.is_subaccount ? values.parent_id : undefined,
        currency: values.currency,
        description: values.description,
      })

      if (result.success) {
        toast({
          title: 'Account created',
          description: `${values.code} - ${values.name} has been created.`,
        })
        setOpen(false)
        form.reset()
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create account',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || <Button>New Account</Button>}
      </SheetTrigger>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Account</SheetTitle>
          <SheetDescription>
            Add a new account to your chart of accounts
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Account Type */}
            <FormField
              control={form.control}
              name="account_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="asset">Asset</SelectItem>
                      <SelectItem value="liability">Liability</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="revenue">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Office Supplies" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account Number */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 6060" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional - Leave blank for auto-generation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Subaccount Checkbox */}
            <FormField
              control={form.control}
              name="is_subaccount"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Make this a subaccount</FormLabel>
                    <FormDescription>
                      Subaccounts are nested under a parent account
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Parent Account Picker (shown when is_subaccount is true) */}
            {isSubaccount && (
              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Account</FormLabel>
                    <FormControl>
                      <AccountPicker
                        accounts={accounts}
                        value={field.value}
                        onValueChange={field.onChange}
                        filterType={selectedType}
                        placeholder="Select parent account..."
                      />
                    </FormControl>
                    <FormDescription>
                      Choose an account of the same type
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Currency */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="PHP">PHP - Philippine Peso</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes about this account..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Account
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
