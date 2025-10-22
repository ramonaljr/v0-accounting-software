'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { updateAccount, deactivateAccount, reactivateAccount } from '../actions'
import type { Database } from '@/lib/supabase/database.types'

type Account = Database['public']['Tables']['accounts']['Row']

const formSchema = z.object({
  code: z.string().min(1, 'Account number is required'),
  name: z.string().min(1, 'Account name is required'),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface EditAccountDialogProps {
  account: Account
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditAccountDialog({ account, open, onOpenChange }: EditAccountDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: account.code,
      name: account.name,
      description: account.description || '',
      is_active: account.is_active,
    },
  })

  useEffect(() => {
    form.reset({
      code: account.code,
      name: account.name,
      description: account.description || '',
      is_active: account.is_active,
    })
  }, [account, form])

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      const result = await updateAccount(account.id, values)
      if (result.success) {
        toast({ title: 'Account updated', description: `${values.code} - ${values.name} has been updated.` })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to update account', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggleActive() {
    setIsLoading(true)
    try {
      const result = account.is_active ? await deactivateAccount(account.id) : await reactivateAccount(account.id)
      if (result.success) {
        toast({ title: account.is_active ? 'Account deactivated' : 'Account reactivated' })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Account</SheetTitle>
          <SheetDescription>Update account details</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField control={form.control} name="code" render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number</FormLabel>
                <FormControl><Input {...field} disabled={account.is_system} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormDescription>Inactive accounts are hidden by default</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={account.is_system} /></FormControl>
              </FormItem>
            )} />
            <div className="flex justify-between gap-3 pt-4">
              {!account.is_system && (
                <Button type="button" variant="destructive" onClick={handleToggleActive} disabled={isLoading}>
                  {account.is_active ? 'Deactivate' : 'Delete'}
                </Button>
              )}
              <div className="flex gap-3 ml-auto">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
