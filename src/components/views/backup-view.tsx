'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { useSubscriptionStore, useProFeature } from '@/lib/subscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  HardDriveDownload,
  Download,
  Mail,
  FileText,
  Upload,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
} from 'lucide-react'

interface ExportData {
  exportDate: string
  exportType: string
  case: Record<string, unknown>
  requirements: Record<string, unknown>[]
  counselingSessions: Record<string, unknown>[]
  drugTests: Record<string, unknown>[]
  naSteps: Record<string, unknown>[]
  naMeetings: Record<string, unknown>[]
  supervisedVisits: Record<string, unknown>[]
  courtDates: Record<string, unknown>[]
  parentingClasses: Record<string, unknown>[]
  milestones: Record<string, unknown>[]
  dailyCheckIns: Record<string, unknown>[]
  summary: Record<string, unknown>
}

export function BackupView() {
  const { activeCaseId } = useAppStore()
  const { tier } = useSubscriptionStore()
  const proFeature = useProFeature('data_export')
  const isPro = tier === 'pro'

  const [exporting, setExporting] = useState<string | null>(null) // 'json', 'pdf', 'email'
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [restorePreview, setRestorePreview] = useState<ExportData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load last backup date from localStorage
  useState(() => {
    try {
      const stored = localStorage.getItem('reunify-last-backup')
      if (stored) setLastBackupDate(stored)
    } catch { /* ignore */ }
  })

  // Save JSON download
  const handleExportJSON = async () => {
    if (!isPro) { proFeature.showUpgrade(); return }
    if (!activeCaseId) { toast.error('No active case to backup'); return }

    setExporting('json')
    try {
      const res = await fetch(`/api/export?caseId=${activeCaseId}`)
      if (!res.ok) throw new Error('Export failed')
      const data: ExportData = await res.json()

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reunify-backup-${data.case.caseNumber || 'case'}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const now = new Date().toISOString()
      localStorage.setItem('reunify-last-backup', now)
      setLastBackupDate(now)

      toast.success('Backup downloaded!', {
        description: 'Your case data has been saved as a JSON file. Keep it somewhere safe!',
      })
    } catch {
      toast.error('Export failed', { description: 'Could not export your data. Please try again.' })
    } finally {
      setExporting(null)
    }
  }

  // Print court report (opens server-generated HTML in new tab)
  const handleExportPDF = async () => {
    if (!isPro) { proFeature.showUpgrade(); return }
    if (!activeCaseId) { toast.error('No active case to backup'); return }

    setExporting('pdf')
    try {
      const res = await fetch(`/api/export/pdf?caseId=${activeCaseId}`)
      if (!res.ok) throw new Error('Report failed')
      const html = await res.text()

      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        setTimeout(() => { printWindow.print() }, 500)
        toast.success('Report ready!', { description: 'Use the print dialog to save as PDF or print.' })
      } else {
        toast.error('Could not open print window', { description: 'Please allow popups for this site.' })
      }
    } catch {
      toast.error('Report generation failed', { description: 'Could not generate your report. Please try again.' })
    } finally {
      setExporting(null)
    }
  }

  // Email backup (server generates subject/body, opens mailto)
  const handleEmailBackup = async () => {
    if (!isPro) { proFeature.showUpgrade(); return }
    if (!activeCaseId) { toast.error('No active case to backup'); return }

    setExporting('email')
    try {
      const res = await fetch(`/api/export/email?caseId=${activeCaseId}`)
      if (!res.ok) throw new Error('Email failed')
      const { subject, body } = await res.json()

      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(mailtoUrl, '_self')

      const now = new Date().toISOString()
      localStorage.setItem('reunify-last-backup', now)
      setLastBackupDate(now)

      toast.success('Email draft opened!', {
        description: 'Add your caseworker\'s or attorney\'s email address and send.',
      })
    } catch {
      toast.error('Email generation failed', { description: 'Could not prepare your email. Please try again.' })
    } finally {
      setExporting(null)
    }
  }

  // Handle file upload for restore
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPro) { proFeature.showUpgrade(); return }

    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast.error('Invalid file', { description: 'Please select a Reunify backup JSON file.' })
      e.target.value = ''
      return
    }

    try {
      const text = await file.text()
      const data = JSON.parse(text) as ExportData

      if (!data.exportType || !data.case) {
        toast.error('Invalid backup file', { description: 'This file doesn\'t appear to be a Reunify backup.' })
        e.target.value = ''
        return
      }

      setRestorePreview(data)
      setConfirmRestore(true)
    } catch {
      toast.error('Could not read file', { description: 'The backup file appears to be corrupted.' })
    }
    e.target.value = ''
  }

  // Execute restore
  const handleRestore = async () => {
    if (!restorePreview || !activeCaseId) return

    setRestoring(true)
    try {
      const caseData = restorePreview.case

      await fetch(`/api/cases/${activeCaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      })

      const endpoints = [
        { data: restorePreview.counselingSessions, endpoint: 'counseling-sessions' },
        { data: restorePreview.drugTests, endpoint: 'drug-tests' },
        { data: restorePreview.naMeetings, endpoint: 'na-meetings' },
        { data: restorePreview.supervisedVisits, endpoint: 'supervised-visits' },
        { data: restorePreview.courtDates, endpoint: 'court-dates' },
        { data: restorePreview.parentingClasses, endpoint: 'parenting-classes' },
        { data: restorePreview.milestones, endpoint: 'milestones' },
        { data: restorePreview.dailyCheckIns, endpoint: 'daily-checkins' },
      ]

      for (const { data, endpoint } of endpoints) {
        if (data && data.length > 0) {
          for (const item of data) {
            await fetch(`/api/${endpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...item, caseId: activeCaseId }),
            })
          }
        }
      }

      if (restorePreview.naSteps && restorePreview.naSteps.length > 0) {
        for (const step of restorePreview.naSteps) {
          await fetch(`/api/na-steps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...step, caseId: activeCaseId }),
          })
        }
      }

      toast.success('Data restored!', {
        description: 'Your backup data has been imported. Refresh to see the updates.',
      })
      setConfirmRestore(false)
      setRestorePreview(null)
    } catch {
      toast.error('Restore failed', { description: 'Some data could not be restored. Please try again.' })
    } finally {
      setRestoring(false)
    }
  }

  // Pro-gated view
  if (!isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
              <HardDriveDownload className="size-10 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Backup & Restore</h2>
            <p className="text-muted-foreground">
              Save your progress to your phone, email it to your caseworker, or print a report for court.
              This is a Pro feature that keeps your data safe.
            </p>
          </div>
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-amber-800 dark:from-amber-950/20 dark:to-yellow-950/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Upgrade to Pro</p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                    Unlock backup, email export, court-ready PDF reports, and more
                  </p>
                </div>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0"
                onClick={() => proFeature.showUpgrade()}
              >
                <ShieldCheck className="size-4" />
                See Pro Features
              </Button>
            </CardContent>
          </Card>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <Download className="size-6 mx-auto text-amber-600" />
              <p className="text-xs text-muted-foreground">Download Backup</p>
            </div>
            <div className="space-y-1">
              <Mail className="size-6 mx-auto text-amber-600" />
              <p className="text-xs text-muted-foreground">Email to Caseworker</p>
            </div>
            <div className="space-y-1">
              <FileText className="size-6 mx-auto text-amber-600" />
              <p className="text-xs text-muted-foreground">Print for Court</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main backup view (Pro user)
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
          <HardDriveDownload className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Backup & Restore</h2>
          <p className="text-sm text-muted-foreground">Save your progress. Share with your caseworker. Never lose your data.</p>
        </div>
      </div>

      {/* Last Backup Info */}
      {lastBackupDate && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="size-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Last backup saved</p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                {new Date(lastBackupDate).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Archive className="size-4" />
          Save Your Data
        </h3>

        {/* JSON Download */}
        <Card className="hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer" onClick={exporting ? undefined : handleExportJSON}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
              {exporting === 'json' ? <Loader2 className="size-6 animate-spin text-emerald-600" /> : <Download className="size-6 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Download Backup File</p>
              <p className="text-xs text-muted-foreground">
                Save all your case data as a file on your phone. You can restore it later if you switch devices.
              </p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30" disabled={exporting === 'json'}>
              <Download className="size-4" />
              Save
            </Button>
          </CardContent>
        </Card>

        {/* Email to Caseworker */}
        <Card className="hover:border-sky-300 dark:hover:border-sky-700 transition-colors cursor-pointer" onClick={exporting ? undefined : handleEmailBackup}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/30 shrink-0">
              {exporting === 'email' ? <Loader2 className="size-6 animate-spin text-sky-600" /> : <Mail className="size-6 text-sky-600 dark:text-sky-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Email to Caseworker</p>
              <p className="text-xs text-muted-foreground">
                Open an email with your progress summary. Add your caseworker's or attorney's email and send it directly.
              </p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-sky-700 border-sky-200 hover:bg-sky-50 dark:text-sky-400 dark:border-sky-800 dark:hover:bg-sky-950/30" disabled={exporting === 'email'}>
              <Mail className="size-4" />
              Email
            </Button>
          </CardContent>
        </Card>

        {/* Print Court Report */}
        <Card className="hover:border-rose-300 dark:hover:border-rose-700 transition-colors cursor-pointer" onClick={exporting ? undefined : handleExportPDF}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30 shrink-0">
              {exporting === 'pdf' ? <Loader2 className="size-6 animate-spin text-rose-600" /> : <FileText className="size-6 text-rose-600 dark:text-rose-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Print Court Report</p>
              <p className="text-xs text-muted-foreground">
                Generate a professional progress report you can print and bring to court. Save as PDF from the print dialog.
              </p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-rose-700 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950/30" disabled={exporting === 'pdf'}>
              <FileText className="size-4" />
              Print
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Restore Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <RefreshCw className="size-4" />
          Restore from Backup
        </h3>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Upload className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Import a previous backup</p>
                <p className="text-xs text-muted-foreground">
                  Select a Reunify backup JSON file to restore your saved data.
                </p>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={restoring}
            >
              {restoring ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {restoring ? 'Restoring...' : 'Choose Backup File'}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Preview / Confirmation */}
        {confirmRestore && restorePreview && (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-600" />
                Confirm Data Restore
              </CardTitle>
              <CardDescription>
                This will add the backed-up data to your current case. Existing data will not be removed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span className="text-muted-foreground">Case: <strong>{restorePreview.case.caseNumber || 'Unknown'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span className="text-muted-foreground">Exported: <strong>{new Date(restorePreview.exportDate).toLocaleDateString()}</strong></span>
                </div>
                {restorePreview.counselingSessions?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Counseling: <strong>{restorePreview.counselingSessions.length} sessions</strong></span>
                  </div>
                )}
                {restorePreview.drugTests?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Drug Tests: <strong>{restorePreview.drugTests.length} tests</strong></span>
                  </div>
                )}
                {restorePreview.naMeetings?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">NA Meetings: <strong>{restorePreview.naMeetings.length} meetings</strong></span>
                  </div>
                )}
                {restorePreview.parentingClasses?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Classes: <strong>{restorePreview.parentingClasses.length} classes</strong></span>
                  </div>
                )}
                {restorePreview.supervisedVisits?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Visits: <strong>{restorePreview.supervisedVisits.length} visits</strong></span>
                  </div>
                )}
                {restorePreview.courtDates?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Court Dates: <strong>{restorePreview.courtDates.length} dates</strong></span>
                  </div>
                )}
                {restorePreview.milestones?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Milestones: <strong>{restorePreview.milestones.length} milestones</strong></span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleRestore}
                  disabled={restoring}
                >
                  {restoring ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  {restoring ? 'Restoring...' : 'Restore Data'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setConfirmRestore(false); setRestorePreview(null) }}
                  disabled={restoring}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tips */}
      <Card className="border-dashed">
        <CardContent className="p-4 space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            Backup Tips
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>Save a backup at least once a week so you never lose your progress</li>
            <li>Email your progress report to your caseworker before each court hearing</li>
            <li>Print the court report and bring it to hearings — judges love seeing documented progress</li>
            <li>Keep your backup JSON file in a safe place (Google Drive, email, etc.)</li>
            <li>If you get a new phone, use "Restore from Backup" to import your saved data</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
