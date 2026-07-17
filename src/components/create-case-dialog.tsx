'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useCreateCase, useCreateItem } from '@/lib/data-hooks'
import { useAppStore } from '@/lib/store'
import { Loader2, CalendarIcon, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CreateCaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_REQUIREMENTS = [
  { title: 'Attend individual counseling sessions', category: 'counseling', frequency: 'weekly' },
  { title: 'Complete random drug testing', category: 'drug-testing', frequency: 'as-needed' },
  { title: 'Attend NA/AA meetings (3x per week minimum)', category: 'na-meetings', frequency: 'weekly' },
  { title: 'Complete 12-step program with sponsor', category: 'na-steps', frequency: 'one-time' },
  { title: 'Attend supervised visits (2x per week)', category: 'supervised-visits', frequency: 'weekly' },
  { title: 'Complete parenting classes', category: 'parenting-classes', frequency: 'one-time' },
  { title: 'Maintain stable housing', category: 'housing', frequency: 'monthly' },
  { title: 'Maintain employment or job search', category: 'employment', frequency: 'weekly' },
  { title: 'Attend all court hearings', category: 'legal', frequency: 'as-needed' },
  { title: 'Submit to random home visits', category: 'other', frequency: 'as-needed' },
]

export function CreateCaseDialog({ open, onOpenChange }: CreateCaseDialogProps) {
  const { setActiveCaseId } = useAppStore()
  const createCase = useCreateCase()
  const createRequirement = useCreateItem('requirements')

  const [caseNumber, setCaseNumber] = useState('')
  const [courtName, setCourtName] = useState('')
  const [caseworkerName, setCaseworkerName] = useState('')
  const [caseworkerPhone, setCaseworkerPhone] = useState('')
  const [judgeName, setJudgeName] = useState('')
  const [attorneyName, setAttorneyName] = useState('')
  const [attorneyPhone, setAttorneyPhone] = useState('')
  const [removalDate, setRemovalDate] = useState<Date | undefined>(undefined)
  const [targetReunificationDate, setTargetReunificationDate] = useState<Date | undefined>(undefined)
  const [notes, setNotes] = useState('')
  const [addDefaultReqs, setAddDefaultReqs] = useState(true)
  const [removalDateOpen, setRemovalDateOpen] = useState(false)
  const [targetDateOpen, setTargetDateOpen] = useState(false)

  const isSubmitting = createCase.isPending || createRequirement.isPending

  function resetForm() {
    setCaseNumber('')
    setCourtName('')
    setCaseworkerName('')
    setCaseworkerPhone('')
    setJudgeName('')
    setAttorneyName('')
    setAttorneyPhone('')
    setRemovalDate(undefined)
    setTargetReunificationDate(undefined)
    setNotes('')
    setAddDefaultReqs(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!caseNumber.trim()) {
      toast.error('Please enter a case number')
      return
    }

    try {
      // Create the case
      const caseData = await createCase.mutateAsync({
        caseNumber: caseNumber.trim(),
        courtName: courtName.trim() || null,
        caseworkerName: caseworkerName.trim() || null,
        caseworkerPhone: caseworkerPhone.trim() || null,
        judgeName: judgeName.trim() || null,
        attorneyName: attorneyName.trim() || null,
        attorneyPhone: attorneyPhone.trim() || null,
        removalDate: removalDate ? removalDate.toISOString() : null,
        targetReunificationDate: targetReunificationDate ? targetReunificationDate.toISOString() : null,
        caseStatus: 'active',
        notes: notes.trim() || null,
      })

      // Set the active case
      setActiveCaseId(caseData.id)

      // Auto-populate default requirements if checked
      if (addDefaultReqs && caseData.id) {
        const requirementPromises = DEFAULT_REQUIREMENTS.map((req, index) =>
          createRequirement.mutateAsync({
            caseId: caseData.id,
            category: req.category,
            title: req.title,
            frequency: req.frequency,
            isCompleted: false,
            sortOrder: index + 1,
          })
        )
        await Promise.all(requirementPromises)
      }

      toast.success('Case created successfully! Your journey begins now.')
      resetForm()
      onOpenChange(false)
    } catch {
      toast.error('Failed to create case. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-emerald-600" />
            Create New Case
          </DialogTitle>
          <DialogDescription>
            Enter your case details below. You can always edit these later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Case Number - Required */}
          <div className="space-y-2">
            <Label htmlFor="caseNumber">
              Case Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="caseNumber"
              placeholder="e.g., CPS-2024-0847"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              required
            />
          </div>

          {/* Court Name */}
          <div className="space-y-2">
            <Label htmlFor="courtName">Court Name</Label>
            <Input
              id="courtName"
              placeholder="e.g., Harris County Family Court - 313th District"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
            />
          </div>

          {/* Caseworker Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caseworkerName">Caseworker Name</Label>
              <Input
                id="caseworkerName"
                placeholder="e.g., Maria Santos"
                value={caseworkerName}
                onChange={(e) => setCaseworkerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caseworkerPhone">Caseworker Phone</Label>
              <Input
                id="caseworkerPhone"
                placeholder="e.g., (713) 555-0142"
                value={caseworkerPhone}
                onChange={(e) => setCaseworkerPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Judge Name */}
          <div className="space-y-2">
            <Label htmlFor="judgeName">Judge Name</Label>
            <Input
              id="judgeName"
              placeholder="e.g., Hon. Patricia Williams"
              value={judgeName}
              onChange={(e) => setJudgeName(e.target.value)}
            />
          </div>

          {/* Attorney Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attorneyName">Attorney Name</Label>
              <Input
                id="attorneyName"
                placeholder="e.g., David Chen"
                value={attorneyName}
                onChange={(e) => setAttorneyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attorneyPhone">Attorney Phone</Label>
              <Input
                id="attorneyPhone"
                placeholder="e.g., (713) 555-0298"
                value={attorneyPhone}
                onChange={(e) => setAttorneyPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Removal Date */}
            <div className="space-y-2">
              <Label>Removal Date</Label>
              <Popover open={removalDateOpen} onOpenChange={setRemovalDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !removalDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="size-4 mr-2" />
                    {removalDate ? format(removalDate, 'MMM d, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={removalDate}
                    onSelect={(date) => {
                      setRemovalDate(date)
                      setRemovalDateOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Target Reunification Date */}
            <div className="space-y-2">
              <Label>Target Reunification Date</Label>
              <Popover open={targetDateOpen} onOpenChange={setTargetDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !targetReunificationDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="size-4 mr-2" />
                    {targetReunificationDate ? format(targetReunificationDate, 'MMM d, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetReunificationDate}
                    onSelect={(date) => {
                      setTargetReunificationDate(date)
                      setTargetDateOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about your case..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Auto-populate requirements checkbox */}
          <div className="flex items-start space-x-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
            <Checkbox
              id="addDefaultReqs"
              checked={addDefaultReqs}
              onCheckedChange={(checked) => setAddDefaultReqs(checked === true)}
              className="mt-0.5"
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="addDefaultReqs" className="text-sm font-medium cursor-pointer">
                Add common CPS case plan requirements (recommended)
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically adds 10 typical CPS requirements (counseling, drug testing, NA meetings, supervised visits, parenting classes, and more) so you don&apos;t have to enter them manually. You can customize or remove them anytime.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating Case...
                </>
              ) : (
                'Create Case'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
