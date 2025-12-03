'use client'

import { useRouter } from 'next/navigation'
import { Search, HelpCircle, Bell, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function QBOTopBarAccurate() {
  const router = useRouter()

  return (
    <header className="bg-white border-b border-gray-200 h-12 px-4 flex items-center justify-between">
      {/* Left section - Accunza logo and Company name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#D4AF37] rounded-sm flex items-center justify-center">
            <span className="text-[#0D0D0D] text-[10px] font-bold">AC</span>
          </div>
          <span className="text-sm font-semibold text-gray-700">Accunza</span>
        </div>
        <div className="h-4 w-px bg-gray-300" />
        <h1 className="text-sm font-medium text-gray-900">Vallejera Corp</h1>
      </div>

      {/* Center section - Search bar */}
      <div className="flex-1 max-w-2xl mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Navigate or search for transactions, contacts, reports, and more"
            className="pl-10 pr-4 h-9 text-sm bg-gray-50 border-gray-300 focus:bg-white"
          />
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-1">
        {/* Contact experts */}
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:bg-gray-100 h-8 px-3 text-sm"
        >
          Contact experts
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100">
          <Bell className="h-4 w-4" />
        </Button>

        {/* Help */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Help</DropdownMenuItem>
            <DropdownMenuItem>Contact support</DropdownMenuItem>
            <DropdownMenuItem>Keyboard shortcuts</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Privacy</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600 hover:bg-gray-100"
          onClick={() => router.push('/settings')}
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
