'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalendarDays } from 'lucide-react'
import { getLocalDateString } from '@/lib/utils'

/**
 * A date input field that's optimized for documenting past events.
 * - Shows a clear label with helper text
 * - Defaults to today but encourages entering past dates
 * - Shows a visual indicator when the date is in the past
 * - Mobile-friendly: uses native date picker which works well on all devices
 */
export function DateInputField({
  id = 'date',
  label = 'Date',
  value,
  onChange,
  required = false,
  helperText,
  className,
}: {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  helperText?: string
  className?: string
}) {
  const today = getLocalDateString()
  const isPastDate = value && value < today
  const isFutureDate = value && value > today

  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      <Label htmlFor={id} className="text-xs font-medium flex items-center gap-1.5">
        <CalendarDays className="size-3.5 text-muted-foreground" />
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${isPastDate ? 'border-amber-300 dark:border-amber-700' : isFutureDate ? 'border-emerald-300 dark:border-emerald-700' : ''}`}
      />
      {helperText ? (
        <p className="text-[11px] text-muted-foreground">{helperText}</p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          {isPastDate
            ? '📋 Past date — this will be logged as a historical entry'
            : isFutureDate
              ? '📅 Future date — this will show as an upcoming event'
              : 'Enter the date this happened (past dates are OK)'}
        </p>
      )}
    </div>
  )
}
