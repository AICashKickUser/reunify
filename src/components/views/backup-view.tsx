'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { forceBackup, getServerBackupStatus, restoreFromCloud, type BackupStatus } from '@/lib/cloud-backup'
import { exportAllData, importAllData, createCase as dbCreateCase, updateCase as dbUpdateCase, createItemByEndpoint, resetCaseData, clearAllData } from '@/lib/client-db'
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
  Cloud,
  CloudOff,
  Check,
} from 'lucide-react'

interface ExportData {
  exportDate: string
  exportType: string
  case: {
    caseNumber?: string
    courtName?: string
    caseworkerName?: string
    caseworkerPhone?: string
    judgeName?: string
    attorneyName?: string
    attorneyPhone?: string
    removalDate?: string | null
    targetReunificationDate?: string | null
    caseStatus?: string
    notes?: string | null
    // Legacy field names (from old export format)
    court?: string
    caseworker?: string
    judge?: string
    attorney?: string
    status?: string
    [key: string]: unknown
  }
  requirements: unknown[]
  counselingSessions: unknown[]
  drugTests: unknown[]
  naSteps: unknown[]
  naMeetings: unknown[]
  supervisedVisits: unknown[]
  courtDates: unknown[]
  parentingClasses: unknown[]
  milestones: unknown[]
  dailyCheckIns: unknown[]
  summary: Record<string, unknown>
}

export function BackupView() {
  const { activeCaseId, setActiveCaseId } = useAppStore()
  const queryClient = useQueryClient()

  const [exporting, setExporting] = useState<string | null>(null) // 'json', 'pdf', 'email', 'cloud'
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [restorePreview, setRestorePreview] = useState<ExportData | null>(null)
  const [cloudStatus, setCloudStatus] = useState<BackupStatus | null>(null)
  const [cloudRestoring, setCloudRestoring] = useState(false)
  const [confirmCloudRestore, setConfirmCloudRestore] = useState(false)
  const [cloudRestoreData, setCloudRestoreData] = useState<ExportData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load last backup date from localStorage
  useState(() => {
    try {
      const stored = localStorage.getItem('reunify-last-backup')
      if (stored) setLastBackupDate(stored)
    } catch { /* ignore */ }
  })

  // Load cloud backup status
  const refreshCloudStatus = useCallback(async () => {
    if (!activeCaseId) return
    try {
      const status = await getServerBackupStatus(activeCaseId)
      setCloudStatus(status)
    } catch { /* ignore */ }
  }, [activeCaseId])

  useEffect(() => {
    refreshCloudStatus()
  }, [refreshCloudStatus])

  // Cloud backup handler
  const handleCloudBackup = async () => {
    if (!activeCaseId) { toast.error('No active case to backup'); return }

    setExporting('cloud')
    try {
      const result = await forceBackup(activeCaseId)
      if (result.success) {
        toast.success('Cloud backup complete!', {
          description: 'Your data has been safely backed up to the cloud.',
        })
        refreshCloudStatus()
      } else {
        toast.error('Cloud backup failed', { description: result.error || 'Please try again.' })
      }
    } catch {
      toast.error('Cloud backup failed', { description: 'Network error. Please check your connection.' })
    } finally {
      setExporting(null)
    }
  }

  // Cloud restore handler
  const handleCloudRestore = async () => {
    if (!activeCaseId) return
    setCloudRestoring(true)
    try {
      const result = await restoreFromCloud(activeCaseId)
      if (result.success && result.data) {
        setCloudRestoreData(result.data as unknown as ExportData)
        setConfirmCloudRestore(true)
      } else {
        toast.error('Cloud restore failed', { description: result.error || 'No backup found.' })
      }
    } catch {
      toast.error('Cloud restore failed', { description: 'Could not download your backup.' })
    } finally {
      setCloudRestoring(false)
    }
  }

  // Save JSON download (available to all users, including free)
  const handleExportJSON = async () => {
    if (!activeCaseId) { toast.error('No active case to backup'); return }

    setExporting('json')
    try {
      const dbData = await exportAllData()
      // Find the active case in the exported data
      const activeCase = dbData.cases.find(c => c.id === activeCaseId)
      const data: ExportData = {
        exportDate: dbData.exportedAt,
        exportType: 'reunify-full',
        case: activeCase ? {
          caseNumber: activeCase.caseNumber,
          courtName: activeCase.courtName,
          caseworkerName: activeCase.caseworkerName,
          caseworkerPhone: activeCase.caseworkerPhone,
          judgeName: activeCase.judgeName,
          attorneyName: activeCase.attorneyName,
          attorneyPhone: activeCase.attorneyPhone,
          removalDate: activeCase.removalDate,
          targetReunificationDate: activeCase.targetReunificationDate,
          caseStatus: activeCase.caseStatus,
          notes: activeCase.notes,
        } : {},
        requirements: dbData.requirements.filter(r => r.caseId === activeCaseId),
        counselingSessions: dbData.counselingSessions.filter(s => s.caseId === activeCaseId),
        drugTests: dbData.drugTests.filter(t => t.caseId === activeCaseId),
        naSteps: dbData.naSteps.filter(s => s.caseId === activeCaseId),
        naMeetings: dbData.naMeetings.filter(m => m.caseId === activeCaseId),
        supervisedVisits: dbData.supervisedVisits.filter(v => v.caseId === activeCaseId),
        courtDates: dbData.courtDates.filter(d => d.caseId === activeCaseId),
        parentingClasses: dbData.parentingClasses.filter(c => c.caseId === activeCaseId),
        milestones: dbData.milestones.filter(m => m.caseId === activeCaseId),
        dailyCheckIns: dbData.dailyCheckIns.filter(c => c.caseId === activeCaseId),
        summary: {},
      }

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

  // Email backup - generates PDF report and shares via native share sheet (with PDF file attachment)
  const handleEmailBackup = async () => {
    if (!activeCaseId) { toast.error('No active case to backup'); return }

    setExporting('email')
    try {
      // Fetch the beautifully formatted PDF report HTML
      const res = await fetch(`/api/export/pdf?caseId=${activeCaseId}`)
      if (!res.ok) throw new Error('Report failed')
      const html = await res.text()

      // Get case info for the filename from IndexedDB
      const dbData = await exportAllData()
      const activeCase = dbData.cases.find(c => c.id === activeCaseId)
      const caseNumber = activeCase?.caseNumber || 'case'

      // Create a temporary container to render the HTML
      const container = document.createElement('div')
      container.innerHTML = html
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '210mm' // A4 width for consistent rendering
      container.style.background = 'white'
      document.body.appendChild(container)

      // Wait a moment for images/styles to load
      await new Promise(resolve => setTimeout(resolve, 300))

      // Generate PDF using html2pdf.js (dynamic import for client-side only)
      const html2pdf = (await import('html2pdf.js')).default
      const pdfBlob: Blob = await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `Reunify-Progress-Report-${caseNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .outputPdf('blob')

      // Clean up the temporary container
      document.body.removeChild(container)

      // Create a PDF file for sharing
      const file = new File([pdfBlob], `Reunify-Progress-Report-${caseNumber}.pdf`, { type: 'application/pdf' })

      // Try Web Share API first (works great on Android - opens share sheet with email option)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Reunify Progress Report — ${caseNumber}`,
            text: 'Attached is my Reunify progress report as a PDF. You can view or print it directly.',
            files: [file],
          })
          toast.success('Report shared!', {
            description: 'Your PDF progress report has been shared via email.',
          })
        } catch (err) {
          // User cancelled the share sheet - not an error
          if (err instanceof Error && err.name !== 'AbortError') {
            throw err
          }
        }
      } else {
        // Fallback: download the PDF file directly
        const url = URL.createObjectURL(pdfBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Reunify-Progress-Report-${caseNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success('PDF report downloaded!', {
          description: 'Attach the downloaded PDF to your email to your caseworker.',
        })
      }

      const now = new Date().toISOString()
      localStorage.setItem('reunify-last-backup', now)
      setLastBackupDate(now)
    } catch {
      toast.error('PDF generation failed', { description: 'Could not generate your PDF report. Please try again.' })
    } finally {
      setExporting(null)
    }
  }

  // Handle file upload for restore (available to all users, including free)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {

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
    if (!restorePreview) return

    setRestoring(true)
    try {
      // Generate a new case ID for the restored case
      const now = new Date().toISOString()
      const newCaseId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`

      // Build the case object from the backup
      const caseData = {
        id: newCaseId,
        caseNumber: restorePreview.case.caseNumber || 'CPS-RESTORED',
        courtName: restorePreview.case.courtName || restorePreview.case.court || null,
        caseworkerName: restorePreview.case.caseworkerName || restorePreview.case.caseworker || null,
        caseworkerPhone: restorePreview.case.caseworkerPhone || null,
        judgeName: restorePreview.case.judgeName || restorePreview.case.judge || null,
        attorneyName: restorePreview.case.attorneyName || restorePreview.case.attorney || null,
        attorneyPhone: restorePreview.case.attorneyPhone || null,
        removalDate: restorePreview.case.removalDate || null,
        targetReunificationDate: restorePreview.case.targetReunificationDate || null,
        caseStatus: restorePreview.case.caseStatus || restorePreview.case.status || 'active',
        notes: restorePreview.case.notes || null,
        createdAt: now,
        updatedAt: now,
      }

      // Helper to remap caseId and strip old IDs for clean import
      const remapItems = (items: unknown[]): unknown[] =>
        items.map((item) => {
          const rec = { ...(item as Record<string, unknown>) }
          // Always remap caseId to the new case
          rec.caseId = newCaseId
          // Remove old id so IndexedDB generates a fresh one (avoids conflicts)
          delete rec.id
          // Ensure timestamps exist
          if (!rec.createdAt) rec.createdAt = now
          rec.updatedAt = now
          return rec
        })

      // Build the full import data structure that importAllData expects
      const importData = {
        version: 1,
        exportedAt: now,
        cases: [caseData],
        requirements: remapItems(restorePreview.requirements || []),
        counselingSessions: remapItems(restorePreview.counselingSessions || []),
        drugTests: remapItems(restorePreview.drugTests || []),
        naSteps: remapItems(restorePreview.naSteps || []),
        naMeetings: remapItems(restorePreview.naMeetings || []),
        supervisedVisits: remapItems(restorePreview.supervisedVisits || []),
        courtDates: remapItems(restorePreview.courtDates || []),
        parentingClasses: remapItems(restorePreview.parentingClasses || []),
        milestones: remapItems(restorePreview.milestones || []),
        dailyCheckIns: remapItems(restorePreview.dailyCheckIns || []),
      }

      // Count total items for the success message
      const totalItems =
        importData.requirements.length +
        importData.counselingSessions.length +
        importData.drugTests.length +
        importData.naSteps.length +
        importData.naMeetings.length +
        importData.supervisedVisits.length +
        importData.courtDates.length +
        importData.parentingClasses.length +
        importData.milestones.length +
        importData.dailyCheckIns.length

      // If user has an existing case, keep it — just add the restored case
      // importAllData clears everything first, so we need a different approach
      // to preserve existing data. We'll use a direct bulk import instead.
      if (activeCaseId) {
        // User has existing data — just add the restored case alongside it
        // Use the low-level importAllData but we need to preserve existing data
        const existingData = await exportAllData()
        // Merge: keep existing data + add restored data
        const mergedData = {
          version: 1,
          exportedAt: now,
          cases: [...existingData.cases, caseData],
          requirements: [...existingData.requirements, ...importData.requirements],
          counselingSessions: [...existingData.counselingSessions, ...importData.counselingSessions],
          drugTests: [...existingData.drugTests, ...importData.drugTests],
          naSteps: [...existingData.naSteps, ...importData.naSteps],
          naMeetings: [...existingData.naMeetings, ...importData.naMeetings],
          supervisedVisits: [...existingData.supervisedVisits, ...importData.supervisedVisits],
          courtDates: [...existingData.courtDates, ...importData.courtDates],
          parentingClasses: [...existingData.parentingClasses, ...importData.parentingClasses],
          milestones: [...existingData.milestones, ...importData.milestones],
          dailyCheckIns: [...existingData.dailyCheckIns, ...importData.dailyCheckIns],
        }
        await importAllData(mergedData)
      } else {
        // No existing data — just import the restored data
        await importAllData(importData)
      }

      // Set the restored case as the active case
      setActiveCaseId(newCaseId)

      // Invalidate ALL query keys to force a complete refresh
      const allQueryKeys = [
        'cases', 'case', 'requirements', 'counseling', 'drug-tests',
        'na-steps', 'na-meetings', 'supervised-visits', 'court-dates',
        'parenting-classes', 'milestones', 'daily-checkins',
      ]
      for (const key of allQueryKeys) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }

      // Also reset React Query cache completely for this data
      queryClient.resetQueries({ queryKey: ['cases'] })
      queryClient.resetQueries({ queryKey: ['case'] })

      toast.success('Data restored!', {
        description: `${totalItems} items imported successfully. Your case "${caseData.caseNumber}" is now active.`,
      })
      setConfirmRestore(false)
      setRestorePreview(null)
    } catch (err) {
      console.error('Restore failed:', err)
      toast.error('Restore failed', { description: 'Some data could not be restored. Please try again.' })
    } finally {
      setRestoring(false)
    }
  }

  // Main backup view (all features available)
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
                Share your professional progress report as a PDF email attachment. Your caseworker will get a beautifully formatted PDF they can view or print.
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

      {/* Cloud Backup Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Cloud className="size-4" />
          Cloud Backup
        </h3>

        {/* Cloud Sync Status */}
        {cloudStatus && !cloudStatus.hasNeverSynced && (
          <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${cloudStatus.isStale ? 'bg-yellow-500' : 'bg-emerald-500'} shrink-0`} />
                <Cloud className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Last cloud sync</p>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                  {cloudStatus.lastBackupAgo || 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {cloudStatus?.hasNeverSynced && (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <CloudOff className="size-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Not yet synced to cloud</p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                  Your data is only stored on this device. Sync to the cloud to keep it safe.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sync Now Card */}
        <Card className="hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer" onClick={exporting ? undefined : handleCloudBackup}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
              {exporting === 'cloud' ? <Loader2 className="size-6 animate-spin text-emerald-600" /> : <Cloud className="size-6 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Sync to Cloud</p>
              <p className="text-xs text-muted-foreground">
                Back up all your case data to the cloud. Auto-syncs every 5 minutes when you make changes.
              </p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30" disabled={exporting === 'cloud'}>
              {exporting === 'cloud' ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Sync
            </Button>
          </CardContent>
        </Card>

        {/* Restore from Cloud Card */}
        <Card className="hover:border-sky-300 dark:hover:border-sky-700 transition-colors cursor-pointer" onClick={cloudRestoring ? undefined : handleCloudRestore}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/30 shrink-0">
              {cloudRestoring ? <Loader2 className="size-6 animate-spin text-sky-600" /> : <Cloud className="size-6 text-sky-600 dark:text-sky-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Restore from Cloud</p>
              <p className="text-xs text-muted-foreground">
                Download your latest cloud backup and restore it to this device.
              </p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-sky-700 border-sky-200 hover:bg-sky-50 dark:text-sky-400 dark:border-sky-800 dark:hover:bg-sky-950/30" disabled={cloudRestoring || !cloudStatus || cloudStatus.hasNeverSynced}>
              {cloudRestoring ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Restore
            </Button>
          </CardContent>
        </Card>

        {/* Cloud Restore Confirmation */}
        {confirmCloudRestore && cloudRestoreData && (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-600" />
                Confirm Cloud Restore
              </CardTitle>
              <CardDescription>
                This will add the cloud-backed-up data to your current case. Existing data will not be removed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {cloudRestoreData.case && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Case: <strong>{cloudRestoreData.case.caseNumber || 'Unknown'}</strong></span>
                  </div>
                )}
                {cloudRestoreData.exportDate && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Backed up: <strong>{new Date(cloudRestoreData.exportDate as string).toLocaleDateString()}</strong></span>
                  </div>
                )}
                {cloudRestoreData.counselingSessions && Array.isArray(cloudRestoreData.counselingSessions) && cloudRestoreData.counselingSessions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Counseling: <strong>{cloudRestoreData.counselingSessions.length} sessions</strong></span>
                  </div>
                )}
                {cloudRestoreData.drugTests && Array.isArray(cloudRestoreData.drugTests) && cloudRestoreData.drugTests.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Drug Tests: <strong>{cloudRestoreData.drugTests.length} tests</strong></span>
                  </div>
                )}
                {cloudRestoreData.naMeetings && Array.isArray(cloudRestoreData.naMeetings) && cloudRestoreData.naMeetings.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">NA Meetings: <strong>{cloudRestoreData.naMeetings.length} meetings</strong></span>
                  </div>
                )}
                {cloudRestoreData.parentingClasses && Array.isArray(cloudRestoreData.parentingClasses) && cloudRestoreData.parentingClasses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Classes: <strong>{cloudRestoreData.parentingClasses.length} classes</strong></span>
                  </div>
                )}
                {cloudRestoreData.supervisedVisits && Array.isArray(cloudRestoreData.supervisedVisits) && cloudRestoreData.supervisedVisits.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Visits: <strong>{cloudRestoreData.supervisedVisits.length} visits</strong></span>
                  </div>
                )}
                {cloudRestoreData.courtDates && Array.isArray(cloudRestoreData.courtDates) && cloudRestoreData.courtDates.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Court Dates: <strong>{cloudRestoreData.courtDates.length} dates</strong></span>
                  </div>
                )}
                {cloudRestoreData.milestones && Array.isArray(cloudRestoreData.milestones) && cloudRestoreData.milestones.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span className="text-muted-foreground">Milestones: <strong>{cloudRestoreData.milestones.length} milestones</strong></span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={async () => {
                    if (!cloudRestoreData) return
                    setCloudRestoring(true)
                    try {
                      const now = new Date().toISOString()
                      const targetCaseId = activeCaseId || `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}`

                      // Build case object from cloud backup
                      const caseObj = {
                        id: targetCaseId,
                        caseNumber: (cloudRestoreData.case as Record<string, unknown>)?.caseNumber || 'CPS-RESTORED',
                        courtName: (cloudRestoreData.case as Record<string, unknown>)?.courtName || (cloudRestoreData.case as Record<string, unknown>)?.court || null,
                        caseworkerName: (cloudRestoreData.case as Record<string, unknown>)?.caseworkerName || (cloudRestoreData.case as Record<string, unknown>)?.caseworker || null,
                        caseworkerPhone: (cloudRestoreData.case as Record<string, unknown>)?.caseworkerPhone || null,
                        judgeName: (cloudRestoreData.case as Record<string, unknown>)?.judgeName || (cloudRestoreData.case as Record<string, unknown>)?.judge || null,
                        attorneyName: (cloudRestoreData.case as Record<string, unknown>)?.attorneyName || (cloudRestoreData.case as Record<string, unknown>)?.attorney || null,
                        attorneyPhone: (cloudRestoreData.case as Record<string, unknown>)?.attorneyPhone || null,
                        removalDate: (cloudRestoreData.case as Record<string, unknown>)?.removalDate || null,
                        targetReunificationDate: (cloudRestoreData.case as Record<string, unknown>)?.targetReunificationDate || null,
                        caseStatus: (cloudRestoreData.case as Record<string, unknown>)?.caseStatus || (cloudRestoreData.case as Record<string, unknown>)?.status || 'active',
                        notes: (cloudRestoreData.case as Record<string, unknown>)?.notes || null,
                        createdAt: now,
                        updatedAt: now,
                      }

                      // Remap items: strip old IDs, assign new caseId
                      const remapItems = (items: unknown[] | undefined): unknown[] =>
                        (items || []).map((item) => {
                          const rec = { ...(item as Record<string, unknown>) }
                          rec.caseId = targetCaseId
                          delete rec.id
                          if (!rec.createdAt) rec.createdAt = now
                          rec.updatedAt = now
                          return rec
                        })

                      const importPayload = {
                        version: 1,
                        exportedAt: now,
                        cases: [caseObj],
                        requirements: remapItems(cloudRestoreData.requirements as unknown[] | undefined),
                        counselingSessions: remapItems(cloudRestoreData.counselingSessions as unknown[] | undefined),
                        drugTests: remapItems(cloudRestoreData.drugTests as unknown[] | undefined),
                        naSteps: remapItems(cloudRestoreData.naSteps as unknown[] | undefined),
                        naMeetings: remapItems(cloudRestoreData.naMeetings as unknown[] | undefined),
                        supervisedVisits: remapItems(cloudRestoreData.supervisedVisits as unknown[] | undefined),
                        courtDates: remapItems(cloudRestoreData.courtDates as unknown[] | undefined),
                        parentingClasses: remapItems(cloudRestoreData.parentingClasses as unknown[] | undefined),
                        milestones: remapItems(cloudRestoreData.milestones as unknown[] | undefined),
                        dailyCheckIns: remapItems(cloudRestoreData.dailyCheckIns as unknown[] | undefined),
                      }

                      // Merge with existing data if user has other cases
                      const existingData = await exportAllData()
                      const mergedData = {
                        version: 1,
                        exportedAt: now,
                        cases: [...existingData.cases, caseObj],
                        requirements: [...existingData.requirements, ...importPayload.requirements],
                        counselingSessions: [...existingData.counselingSessions, ...importPayload.counselingSessions],
                        drugTests: [...existingData.drugTests, ...importPayload.drugTests],
                        naSteps: [...existingData.naSteps, ...importPayload.naSteps],
                        naMeetings: [...existingData.naMeetings, ...importPayload.naMeetings],
                        supervisedVisits: [...existingData.supervisedVisits, ...importPayload.supervisedVisits],
                        courtDates: [...existingData.courtDates, ...importPayload.courtDates],
                        parentingClasses: [...existingData.parentingClasses, ...importPayload.parentingClasses],
                        milestones: [...existingData.milestones, ...importPayload.milestones],
                        dailyCheckIns: [...existingData.dailyCheckIns, ...importPayload.dailyCheckIns],
                      }
                      await importAllData(mergedData)

                      setActiveCaseId(targetCaseId)

                      // Invalidate ALL query keys
                      const allQueryKeys = [
                        'cases', 'case', 'requirements', 'counseling', 'drug-tests',
                        'na-steps', 'na-meetings', 'supervised-visits', 'court-dates',
                        'parenting-classes', 'milestones', 'daily-checkins',
                      ]
                      for (const key of allQueryKeys) {
                        queryClient.invalidateQueries({ queryKey: [key] })
                      }
                      queryClient.resetQueries({ queryKey: ['cases'] })
                      queryClient.resetQueries({ queryKey: ['case'] })

                      toast.success('Cloud data restored!', {
                        description: 'Your cloud backup has been imported successfully.',
                      })
                      setConfirmCloudRestore(false)
                      setCloudRestoreData(null)
                    } catch (err) {
                      console.error('Cloud restore failed:', err)
                      toast.error('Restore failed', { description: 'Some data could not be restored.' })
                    } finally {
                      setCloudRestoring(false)
                    }
                  }}
                  disabled={cloudRestoring}
                >
                  {cloudRestoring ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  {cloudRestoring ? 'Restoring...' : 'Restore from Cloud'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setConfirmCloudRestore(false); setCloudRestoreData(null) }}
                  disabled={cloudRestoring}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
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
              suppressHydrationWarning
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

export default BackupView
