'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Heart, Umbrella, Briefcase, Users } from 'lucide-react'
import type { LeaveType } from './types'

interface LeaveTypesGridProps {
  leaveTypes: LeaveType[];
  loading: boolean;
}

function getLeaveIcon(typeName: string) {
  const name = typeName.toLowerCase();
  if (name.includes('sick') || name.includes('medical')) return <Heart className="h-4 w-4" />;
  if (name.includes('vacation') || name.includes('annual')) return <Umbrella className="h-4 w-4" />;
  if (name.includes('maternity') || name.includes('paternity')) return <Users className="h-4 w-4" />;
  return <Briefcase className="h-4 w-4" />;
}

export function LeaveTypesGrid({
  leaveTypes,
  loading,
}: LeaveTypesGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Types</CardTitle>
        <CardDescription>Configured leave categories</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : leaveTypes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No leave types configured. Contact administrator to set up leave types.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveTypes.map((type) => (
              <Card key={type.id} className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full">
                      {getLeaveIcon(type.leave_type_name)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{type.leave_type_name}</h4>
                      <p className="text-sm text-gray-600">
                        {type.max_leaves_allowed} days/year
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant={type.is_paid ? 'default' : 'outline'} className="text-xs">
                        {type.is_paid ? 'Paid' : 'Unpaid'}
                      </Badge>
                      {type.is_carry_forward && (
                        <Badge variant="secondary" className="text-xs">
                          Carry Forward
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
