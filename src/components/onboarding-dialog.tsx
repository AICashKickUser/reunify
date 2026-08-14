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
import { FolderHeart, Plus, ArrowRight, RotateCcw, Camera, Check, Shield, X, Eye, EyeOff, Lock } from 'lucide-react'

const ONBOARDING_KEY = 'reunify-onboarding-seen'

interface OnboardingStep {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
  bg: string
  isPrivacy?: boolean
}

const steps: OnboardingStep[] = [
  {
    icon: FolderHeart,
    title: 'Welcome to Reunify',
    description: 'Your personal CPS reunification progress tracker. Stay organized, stay focused, and bring your kids home.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    icon: Shield,
    title: 'Your Data is Private',
    description: '',
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    isPrivacy: true,
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
    icon: Camera,
    title: 'Scan Your Case Plan',
    description: 'Take a photo of your printed case plan and the AI will automatically extract all your requirements, court dates, and case info. No manual entry needed!',
    color: 'text-violet-600',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
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
      <DialogContent className="max-w-sm" showCloseButton={false}>
        {/* Custom close button — always visible so dialog is non-blocking */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
          aria-label="Close tour"
        >
          <X className="size-4" />
        </button>

        <DialogHeader className="text-center items-center">
          <div className={`flex size-16 items-center justify-center rounded-full ${currentStep.bg} mb-2`}>
            <currentStep.icon className={`size-8 ${currentStep.color}`} />
          </div>
          <DialogTitle className="text-xl">{currentStep.title}</DialogTitle>
          {currentStep.isPrivacy ? (
            <DialogDescription asChild>
              <div className="text-sm leading-relaxed space-y-3">
                {/* Prominent privacy callout */}
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 justify-center">
                    <Lock className="size-4 text-amber-600" />
                    <span className="font-semibold text-amber-700 dark:text-amber-400">Never shared with CPS</span>
                  </div>
                  <p className="text-amber-700/80 dark:text-amber-400/80 text-center text-xs">
                    Your data stays on YOUR phone. Not on our servers. Not accessible to your social worker, judge, or anyone else.
                  </p>
                </div>
                <div className="space-y-2 text-left">
                  <div className="flex items-start gap-2">
                    <EyeOff className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>No account or email required</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <EyeOff className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>All data stored locally on your device</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Eye className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>You choose what to export and share</span>
                  </div>
                </div>
              </div>
            </DialogDescription>
          ) : (
            <DialogDescription className="text-sm leading-relaxed">
              {currentStep.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Step indicators — clickable for non-blocking navigation */}
        <div className="flex items-center justify-center gap-2 my-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-emerald-600' : i < step ? 'w-1.5 bg-emerald-300 cursor-pointer hover:bg-emerald-400' : 'w-1.5 bg-muted cursor-pointer hover:bg-muted-foreground/30'
              }`}
              aria-label={`Go to step ${i + 1}`}
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
