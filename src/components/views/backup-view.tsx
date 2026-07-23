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
import { UpgradeDialog } from '@/components/upgrade-dialog'

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

  const [exporting, setExporting] = useState(false)
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [restorePreview, setRestorePreview] = useState<ExportData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load last backup date from localStorage
  useState(() => {
    const stored = localStorage.getItem('reunify-last-backup')
    if (stored) setLastBackupDate(stored)
  })

  // Export case data as JSON and download
  const handleExportJSON = async () => {
    if (!isPro) {
      proFeature.showUpgrade()
      return
    }
    if (!activeCaseId) {
      toast.error('No active case to backup')
      return
    }

    setExporting(true)
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
      setExporting(false)
    }
  }

  // Export as printable PDF-style report (opens print dialog)
  const handleExportPDF = async () => {
    if (!isPro) {
      proFeature.showUpgrade()
      return
    }
    if (!activeCaseId) {
      toast.error('No active case to backup')
      return
    }

    setExporting(true)
    try {
      const res = await fetch(`/api/export?caseId=${activeCaseId}`)
      if (!res.ok) throw new Error('Export failed')
      const data: ExportData = await res.json()

      // Generate a printable HTML report
      const reportHTML = generatePrintReport(data)
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(reportHTML)
        printWindow.document.close()
        // Wait a moment for content to render then trigger print
        setTimeout(() => {
          printWindow.print()
        }, 500)
        toast.success('Report ready!', { description: 'Use the print dialog to save as PDF or print.' })
      } else {
        toast.error('Could not open print window', { description: 'Please allow popups for this site.' })
      }
    } catch {
      toast.error('Report generation failed', { description: 'Could not generate your report. Please try again.' })
    } finally {
      setExporting(false)
    }
  }

  // Email backup to caseworker/attorney/self
  const handleEmailBackup = async () => {
    if (!isPro) {
      proFeature.showUpgrade()
      return
    }
    if (!activeCaseId) {
      toast.error('No active case to backup')
      return
    }

    setExporting(true)
    try {
      const res = await fetch(`/api/export?caseId=${activeCaseId}`)
      if (!res.ok) throw new Error('Export failed')
      const data: ExportData = await res.json()

      // Generate a plain text summary for email body
      const subject = `Reunify Case Progress Report — ${data.case.caseNumber || 'Case'}`
      const body = generateEmailBody(data)

      // Open mailto link
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
      setExporting(false)
    }
  }

  // Handle file upload for restore
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPro) {
      proFeature.showUpgrade()
      return
    }

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

      // Validate it's a Reunify backup
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
      // Send each category of data to the appropriate API endpoint
      const caseData = restorePreview.case

      // Update the case info first
      await fetch(`/api/cases/${activeCaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      })

      // Restore each data category
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

      // Restore NA steps
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
        <UpgradeDialog />
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
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
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
        <Card className="hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer" onClick={handleExportJSON}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
              <Download className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Download Backup File</p>
              <p className="text-xs text-muted-foreground">
                Save all your case data as a file on your phone. You can restore it later if you switch devices.
              </p>
            </div>
            <div className="shrink-0">
              {exporting ? (
                <Loader2 className="size-5 animate-spin text-emerald-600" />
              ) : (
                <Button size="sm" variant="outline" className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30">
                  <Download className="size-4" />
                  Save
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email to Caseworker */}
        <Card className="hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer" onClick={handleEmailBackup}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/30 shrink-0">
              <Mail className="size-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Email to Caseworker</p>
              <p className="text-xs text-muted-foreground">
                Open an email with your progress summary. Add your caseworker's or attorney's email and send it directly.
              </p>
            </div>
            <div className="shrink-0">
              {exporting ? (
                <Loader2 className="size-5 animate-spin text-sky-600" />
              ) : (
                <Button size="sm" variant="outline" className="gap-1.5 text-sky-700 border-sky-200 hover:bg-sky-50 dark:text-sky-400 dark:border-sky-800 dark:hover:bg-sky-950/30">
                  <Mail className="size-4" />
                  Email
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Print Court Report */}
        <Card className="hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer" onClick={handleExportPDF}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30 shrink-0">
              <FileText className="size-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Print Court Report</p>
              <p className="text-xs text-muted-foreground">
                Generate a professional progress report you can print and bring to court. Save as PDF from the print dialog.
              </p>
            </div>
            <div className="shrink-0">
              {exporting ? (
                <Loader2 className="size-5 animate-spin text-rose-600" />
              ) : (
                <Button size="sm" variant="outline" className="gap-1.5 text-rose-700 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950/30">
                  <FileText className="size-4" />
                  Print
                </Button>
              )}
            </div>
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
              {restoring ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
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
                  onClick={() => {
                    setConfirmRestore(false)
                    setRestorePreview(null)
                  }}
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

// Generate a printable HTML report for court/caseworker
function generatePrintReport(data: ExportData): string {
  const c = data.case
  const s = data.summary as Record<string, number>

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reunify Progress Report — ${c.caseNumber || 'Case'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.5; }
    h1 { font-size: 24px; margin-bottom: 4px; color: #059669; }
    h2 { font-size: 18px; margin: 20px 0 10px; border-bottom: 2px solid #059669; color: #047857; }
    h3 { font-size: 14px; margin: 12px 0 6px; color: #065f46; }
    .header { margin-bottom: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; }
    .header p { font-size: 12px; color: #6b7280; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .info-item { font-size: 12px; }
    .info-item strong { color: #374151; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
    .stat-card { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-card .number { font-size: 20px; font-weight: bold; color: #059669; }
    .stat-card .label { font-size: 11px; color: #065f46; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; }
    th { background: #ecfdf5; color: #065f46; font-size: 12px; text-align: left; padding: 8px; border: 1px solid #a7f3d0; }
    td { font-size: 11px; padding: 6px 8px; border: 1px solid #e5e7eb; }
    .completed { color: #059669; font-weight: bold; }
    .pending { color: #d97706; }
    .negative { color: #059669; font-weight: bold; }
    .positive { color: #dc2626; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 11px; color: #6b7280; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Reunify Progress Report</h1>
    <p>CPS Reunification Case Compliance Documentation</p>
    <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  </div>

  <h2>Case Information</h2>
  <div class="info-grid">
    <div class="info-item"><strong>Case Number:</strong> ${c.caseNumber || 'N/A'}</div>
    <div class="info-item"><strong>Court:</strong> ${c.court || 'N/A'}</div>
    <div class="info-item"><strong>Caseworker:</strong> ${c.caseworker || 'N/A'}</div>
    <div class="info-item"><strong>Caseworker Phone:</strong> ${c.caseworkerPhone || 'N/A'}</div>
    <div class="info-item"><strong>Judge:</strong> ${c.judge || 'N/A'}</div>
    <div class="info-item"><strong>Attorney:</strong> ${c.attorney || 'N/A'}</div>
    <div class="info-item"><strong>Removal Date:</strong> ${formatDate(c.removalDate as string)}</div>
    <div class="info-item"><strong>Target Reunification:</strong> ${formatDate(c.targetReunificationDate as string)}</div>
    <div class="info-item"><strong>Case Status:</strong> ${c.status || 'Active'}</div>
  </div>

  <h2>Compliance Summary</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="number">${s.completedRequirements || 0}/${s.totalRequirements || 0}</div>
      <div class="label">Requirements Completed</div>
    </div>
    <div class="stat-card">
      <div class="number">${s.negativeDrugTests || 0}/${s.totalDrugTests || 0}</div>
      <div class="label">Clean Drug Tests</div>
    </div>
    <div class="stat-card">
      <div class="number">${s.completedNASteps || 0}/12</div>
      <div class="label">NA Steps Completed</div>
    </div>
    <div class="stat-card">
      <div class="number">${s.completedMilestones || 0}</div>
      <div class="label">Milestones Achieved</div>
    </div>
  </div>

  ${data.requirements.length > 0 ? `
  <h2>Case Plan Requirements</h2>
  <table>
    <tr><th>Category</th><th>Requirement</th><th>Frequency</th><th>Status</th><th>Completed</th></tr>
    ${data.requirements.map(r => `
    <tr>
      <td>${r.category || ''}</td>
      <td>${r.title || ''}</td>
      <td>${r.frequency || 'N/A'}</td>
      <td>${r.isCompleted ? '<span class="completed">Completed</span>' : '<span class="pending">In Progress</span>'}</td>
      <td>${formatDate(r.completedAt as string)}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${data.counselingSessions.length > 0 ? `
  <h2>Counseling Sessions</h2>
  <table>
    <tr><th>Date</th><th>Counselor</th><th>Type</th><th>Duration</th><th>Status</th></tr>
    ${data.counselingSessions.map(s => `
    <tr>
      <td>${formatDate(s.date as string)}</td>
      <td>${s.counselor || 'N/A'}</td>
      <td>${s.type || 'N/A'}</td>
      <td>${s.duration || 'N/A'}</td>
      <td>${s.completed ? '<span class="completed">Completed</span>' : '<span class="pending">Scheduled</span>'}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${data.drugTests.length > 0 ? `
  <h2>Drug Tests</h2>
  <table>
    <tr><th>Date</th><th>Type</th><th>Random</th><th>Result</th><th>Facility</th></tr>
    ${data.drugTests.map(t => `
    <tr>
      <td>${formatDate(t.date as string)}</td>
      <td>${t.type || 'N/A'}</td>
      <td>${t.random ? 'Yes' : 'No'}</td>
      <td>${t.result === 'negative' ? '<span class="negative">Negative</span>' : t.result === 'positive' ? '<span class="positive">Positive</span>' : t.result || 'Pending'}</td>
      <td>${t.facility || 'N/A'}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${data.naMeetings.length > 0 ? `
  <h2>NA/AA Meetings</h2>
  <table>
    <tr><th>Date</th><th>Meeting</th><th>Location</th><th>Topic</th><th>Verified</th></tr>
    ${data.naMeetings.map(m => `
    <tr>
      <td>${formatDate(m.date as string)}</td>
      <td>${m.name || 'N/A'}</td>
      <td>${m.location || 'N/A'}</td>
      <td>${m.topic || 'N/A'}</td>
      <td>${m.verified ? '<span class="completed">Verified</span>' : 'Unverified'}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${data.supervisedVisits.length > 0 ? `
  <h2>Supervised Visits</h2>
  <table>
    <tr><th>Date</th><th>Type</th><th>Location</th><th>Supervisor</th><th>Duration</th><th>Status</th></tr>
    ${data.supervisedVisits.map(v => `
    <tr>
      <td>${formatDate(v.date as string)}</td>
      <td>${v.type || 'N/A'}</td>
      <td>${v.location || 'N/A'}</td>
      <td>${v.supervisor || 'N/A'}</td>
      <td>${v.duration || 'N/A'}</td>
      <td>${v.completed ? '<span class="completed">Completed</span>' : '<span class="pending">Scheduled</span>'}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${data.parentingClasses.length > 0 ? `
  <h2>Parenting Classes</h2>
  <table>
    <tr><th>Date</th><th>Class</th><th>Provider</th><th>Topic</th><th>Status</th><th>Certificate</th></tr>
    ${data.parentingClasses.map(p => `
    <tr>
      <td>${formatDate(p.date as string)}</td>
      <td>${p.name || 'N/A'}</td>
      <td>${p.provider || 'N/A'}</td>
      <td>${p.topic || 'N/A'}</td>
      <td>${p.completed ? '<span class="completed">Completed</span>' : '<span class="pending">Upcoming</span>'}</td>
      <td>${p.hasCertificate ? 'Yes' : 'No'}</td>
    </tr>`).join('')}
  </table>` : ''}

  ${data.courtDates.length > 0 ? `
  <h2>Court Dates</h2>
  <table>
    <tr><th>Date</th><th>Hearing Type</th><th>Outcome</th><th>Next Steps</th></tr>
    ${data.courtDates.map(cd => `
    <tr>
      <td>${formatDate(cd.date as string)}</td>
      <td>${cd.type || 'N/A'}</td>
      <td>${cd.outcome || 'Pending'}</td>
      <td>${cd.nextSteps || 'N/A'}</td>
    </tr>`).join('')}
  </table>` : ''}

  <div class="footer">
    <p>This report was generated by Reunify — CPS Reunification Progress Tracker</p>
    <p>Every step brings you closer to your kids</p>
  </div>
</body>
</html>`
}

// Generate a plain text email body with progress summary
function generateEmailBody(data: ExportData): string {
  const c = data.case
  const s = data.summary as Record<string, number>

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'

  let body = `REUNIFY PROGRESS REPORT\n`
  body += `========================\n\n`
  body += `Case Number: ${c.caseNumber || 'N/A'}\n`
  body += `Court: ${c.court || 'N/A'}\n`
  body += `Caseworker: ${c.caseworker || 'N/A'}\n`
  body += `Judge: ${c.judge || 'N/A'}\n`
  body += `Attorney: ${c.attorney || 'N/A'}\n`
  body += `Case Status: ${c.status || 'Active'}\n`
  body += `Removal Date: ${formatDate(c.removalDate as string)}\n`
  body += `Target Reunification: ${formatDate(c.targetReunificationDate as string)}\n\n`

  body += `COMPLIANCE SUMMARY\n`
  body += `------------------\n`
  body += `Requirements: ${s.completedRequirements || 0}/${s.totalRequirements || 0} completed\n`
  body += `Drug Tests: ${s.negativeDrugTests || 0}/${s.totalDrugTests || 0} clean\n`
  body += `NA Steps: ${s.completedNASteps || 0}/12 completed\n`
  body += `Counseling Sessions: ${s.totalCounselingSessions || 0} attended\n`
  body += `Supervised Visits: ${s.completedVisits || 0} completed\n`
  body += `Milestones: ${s.completedMilestones || 0} achieved\n\n`

  if (data.drugTests.length > 0) {
    body += `DRUG TEST RESULTS\n`
    body += `-----------------\n`
    data.drugTests.forEach(t => {
      body += `${formatDate(t.date as string)} — ${t.type || 'Test'} — Result: ${t.result || 'Pending'}\n`
    })
    body += `\n`
  }

  if (data.naMeetings.length > 0) {
    body += `NA/AA MEETINGS\n`
    body += `--------------\n`
    data.naMeetings.forEach(m => {
      body += `${formatDate(m.date as string)} — ${m.name || 'Meeting'} at ${m.location || 'N/A'} — Verified: ${m.verified ? 'Yes' : 'No'}\n`
    })
    body += `\n`
  }

  if (data.parentingClasses.length > 0) {
    body += `PARENTING CLASSES\n`
    body += `-----------------\n`
    data.parentingClasses.forEach(p => {
      body += `${formatDate(p.date as string)} — ${p.name || 'Class'} — ${p.completed ? 'Completed' : 'Upcoming'}${p.hasCertificate ? ' (Certificate)' : ''}\n`
    })
    body += `\n`
  }

  body += `Report generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`
  body += `Generated by Reunify — CPS Reunification Progress Tracker\n`

  return body
}
