'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FolderHeart, Plus, ArrowRight, RotateCcw, Sparkles, Check } from 'lucide-react'

const ONBOARDING_KEY = 'reunify-onboarding-seen'

const steps = [
  {
    icon: FolderHeart,
    title: 'Welcome to Reunify',
    description: 'Your personal CPS reunification progress tracker. Stay organized, stay focused, and bring your kids home.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    icon: Plus,
    title: 'Enter Your Case Details',
    description: 'Add your case number, court info, caseworker, and attorney. Then start tracking each requirement — counseling, drug tests, visits, and more.',
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    icon: ArrowRight,
    title: 'Track Everything',
    description: 'Log every session, test, meeting, and visit. The more you track, the better your progress picture becomes. Check in daily to stay on top of it.',
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    icon: RotateCcw,
    title: 'Start Fresh Anytime',
    description: 'The app loads with demo data so you can explore. When you\'re ready, hit "Start Fresh" in the sidebar to erase it all and enter your own real info.',
    color: 'text-rose-600',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
  },
  {
    icon: Sparkles,
    title: 'Go Pro for Court',
    description: 'Need a professional report for your judge, attorney, or caseworker? Upgrade to Pro for court-ready PDF reports, detailed summaries, and more.',
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
]

export function OnboardingDialog() {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem(ONBOARDING_KEY)
  })
  const [step, setStep] = useState(0)

  const currentStep = steps[step]
  const isFirst = step === 0
  const isLast = step === steps.length - 1

  function handleClose() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center items-center">
          <div className={`flex size-16 items-center justify-center rounded-full ${currentStep.bg} mb-2`}>
            <currentStep.icon className={`size-8 ${currentStep.color}`} />
          </div>
          <DialogTitle className="text-xl">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 my-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-emerald-600' : i < step ? 'w-1.5 bg-emerald-300' : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 mt-2">
          {!isFirst ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <div />
          )}
          {isLast ? (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={handleClose}
            >
              <Check className="size-4" />
              Got it, let&apos;s go!
            </Button>
          ) : (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={() => setStep(step + 1)}
            >
              Next
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={handleClose}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
          >
            Skip tour
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}
