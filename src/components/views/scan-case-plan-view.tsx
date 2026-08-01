'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { ScanCasePlan } from '@/components/scan-case-plan'
import { ScanLine, Camera, Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ScanCasePlanView() {
  const { activeCaseId, setActiveView } = useAppStore()
  const [isScanning, setIsScanning] = useState(false)

  if (!activeCaseId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <ScanLine className="size-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-sm">Create a case first to scan your case plan.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
          <ScanLine className="size-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Scan Case Plan</h1>
          <p className="text-sm text-muted-foreground">
            Photograph your printed case plan and we'll set up your goals automatically
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <Camera className="size-8 text-emerald-600 mb-2" />
            <CardTitle className="text-sm">1. Photograph</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Take a photo of each page of your case plan. Most case plans are 1-2 pages.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <ScanLine className="size-8 text-violet-600 mb-2" />
            <CardTitle className="text-sm">2. Analyze</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              AI reads your case plan and extracts all the requirements, dates, and goals.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <FileText className="size-8 text-amber-600 mb-2" />
            <CardTitle className="text-sm">3. Review & Apply</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Review what was found, make any edits, then apply it all to your case.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
        <CardContent className="py-8 flex flex-col items-center text-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Camera className="size-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-1">Ready to scan?</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Have your printed case plan handy. You can photograph each page separately or all at once.
              The AI will extract your requirements, counseling schedule, drug testing, court dates, and more.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setIsScanning(true)}
            >
              <Camera className="size-5 mr-2" />
              Start Scanning
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Works best with clearly printed or typed documents
          </p>
        </CardContent>
      </Card>

      {/* Scan Dialog */}
      <ScanCasePlan
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        activeCaseId={activeCaseId}
        onComplete={() => {
          setIsScanning(false)
          setActiveView('case-plan')
        }}
      />
    </div>
  )
}
