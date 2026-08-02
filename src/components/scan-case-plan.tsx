'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Camera,
  Upload,
  ScanLine,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
  Trash2,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createItemByEndpoint,
  updateCase,
  invalidateQueries,
} from '@/lib/client-db'

// ============================================================
// Types
// ============================================================

interface ScanCasePlanProps {
  isOpen: boolean
  onClose: () => void
  activeCaseId: string
  onComplete?: () => void
}

interface CapturedPage {
  id: string
  dataUrl: string
  thumbnail: string
  name: string
}

interface CaseInfoExtracted {
  caseNumber: string | null
  courtName: string | null
  judgeName: string | null
  caseworkerName: string | null
  caseworkerPhone: string | null
  attorneyName: string | null
  attorneyPhone: string | null
  removalDate: string | null
  targetReunificationDate: string | null
}

interface RequirementExtracted {
  category: string
  title: string
  description: string | null
  frequency: string | null
  dueDate: string | null
}

interface CounselingExtracted {
  sessionType: string | null
  frequency: string | null
  counselorName: string | null
  duration: number | null
  notes: string | null
}

interface DrugTestingExtracted {
  testType: string | null
  frequency: string | null
  testingFacility: string | null
  isRandom: boolean
  notes: string | null
}

interface NAMeetingsExtracted {
  frequency: string | null
  notes: string | null
}

interface SupervisedVisitsExtracted {
  frequency: string | null
  location: string | null
  supervisorName: string | null
  duration: number | null
  visitType: string | null
  notes: string | null
}

interface ParentingClassesExtracted {
  className: string | null
  provider: string | null
  frequency: string | null
  notes: string | null
}

interface CourtDateExtracted {
  date: string | null
  hearingType: string | null
  notes: string | null
}

interface MilestoneExtracted {
  title: string
  category: string
  targetDate: string | null
  description: string | null
}

interface ExtractedData {
  caseInfo: CaseInfoExtracted
  requirements: RequirementExtracted[]
  counseling: CounselingExtracted
  drugTesting: DrugTestingExtracted
  naMeetings: NAMeetingsExtracted
  supervisedVisits: SupervisedVisitsExtracted
  parentingClasses: ParentingClassesExtracted
  courtDates: CourtDateExtracted[]
  milestones: MilestoneExtracted[]
  additionalNotes: string
}

interface SectionToggle {
  caseInfo: boolean
  requirements: boolean
  counseling: boolean
  drugTesting: boolean
  naMeetings: boolean
  supervisedVisits: boolean
  parentingClasses: boolean
  courtDates: boolean
  milestones: boolean
}

type Phase = 'capture' | 'analyzing' | 'review' | 'applying'

// ============================================================
// Image compression utility with EXIF orientation support
// ============================================================

/**
 * Read EXIF orientation from a JPEG file's binary data.
 * Returns the orientation value (1-8) or 1 if not found.
 * Orientation mapping:
 *  1 = normal, 2 = flipped horizontal, 3 = rotated 180°, 4 = flipped vertical
 *  5 = rotated 90° CCW + flipped, 6 = rotated 90° CW
 *  7 = rotated 90° CW + flipped, 8 = rotated 90° CCW
 */
function getExifOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const view = new DataView(e.target?.result as ArrayBuffer)
        // Check for JPEG SOI marker
        if (view.getUint16(0, false) !== 0xFFD8) {
          resolve(1)
          return
        }
        let offset = 2
        while (offset < view.byteLength - 2) {
          const marker = view.getUint16(offset, false)
          offset += 2
          // APP1 marker (EXIF)
          if (marker === 0xFFE1) {
            const length = view.getUint16(offset, false)
            // Check for "Exif" string
            if (length > 8 && view.getUint32(offset + 2, false) === 0x45786966) {
              // TIFF header starts at offset + 8
              const tiffOffset = offset + 8
              const isLittleEndian = view.getUint16(tiffOffset, false) === 0x4949
              // IFD0 offset
              const ifdOffset = view.getUint32(tiffOffset + 4, isLittleEndian)
              const ifdStart = tiffOffset + ifdOffset
              const numEntries = view.getUint16(ifdStart, isLittleEndian)
              // Search for orientation tag (0x0112)
              for (let i = 0; i < numEntries; i++) {
                const entryOffset = ifdStart + 2 + i * 12
                if (entryOffset + 12 > view.byteLength) break
                const tag = view.getUint16(entryOffset, isLittleEndian)
                if (tag === 0x0112) {
                  const orientation = view.getUint16(entryOffset + 8, isLittleEndian)
                  resolve(orientation)
                  return
                }
              }
            }
            offset += length
          } else if ((marker & 0xFF00) === 0xFF00) {
            // Skip other markers
            offset += view.getUint16(offset, false)
          } else {
            break
          }
        }
      } catch {
        // If EXIF parsing fails, just use default orientation
      }
      resolve(1)
    }
    reader.onerror = () => resolve(1)
    // Only read first 64KB for EXIF data
    reader.readAsArrayBuffer(file.slice(0, 65536))
  })
}

/**
 * Apply EXIF orientation correction to canvas context.
 * Transforms the canvas to account for the orientation.
 */
function applyExifOrientation(
  ctx: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number
): { width: number; height: number } {
  switch (orientation) {
    case 2: ctx.transform(-1, 0, 0, 1, width, 0); break
    case 3: ctx.transform(-1, 0, 0, -1, width, height); break
    case 4: ctx.transform(1, 0, 0, -1, 0, height); break
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); return { width: height, height: width }
    case 6: ctx.transform(0, 1, -1, 0, height, 0); return { width: height, height: width }
    case 7: ctx.transform(0, -1, -1, 0, height, width); return { width: height, height: width }
    case 8: ctx.transform(0, -1, 1, 0, 0, width); return { width: height, height: width }
    default: break
  }
  return { width, height }
}

/**
 * Compress an image file with EXIF orientation correction and size limits.
 * Uses createImageBitmap with imageOrientation when available (modern browsers),
 * falls back to manual EXIF correction for older browsers.
 * Handles the common mobile camera issues:
 * - EXIF orientation data (stripped by canvas, causing distortion)
 * - Very large images (12-20MP) that exceed canvas limits
 * - Memory constraints on mobile devices
 */
async function compressImage(file: File, maxWidth = 1200, quality = 0.6): Promise<string> {
  // Try createImageBitmap with imageOrientation first (handles EXIF automatically)
  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      try {
        let width = bitmap.width
        let height = bitmap.height

        // Scale down if needed
        const maxDim = Math.min(maxWidth, 1200)
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        }
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }

        // Ensure even dimensions
        width = Math.round(width / 2) * 2
        height = Math.round(height / 2) * 2

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, width, height)
          bitmap.close()
          return canvas.toDataURL('image/jpeg', quality)
        }
        bitmap.close()
      } catch {
        bitmap.close()
      }
    }
  } catch {
    // createImageBitmap not supported or failed, fall through to manual method
  }

  // Fallback: manual EXIF orientation correction
  return new Promise(async (resolve, reject) => {
    try {
      const orientation = await getExifOrientation(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = document.createElement('img')
        img.onload = () => {
          try {
            // Get original pixel dimensions
            let width = img.naturalWidth || img.width
            let height = img.naturalHeight || img.height

            // Scale down if needed
            const maxDim = Math.min(maxWidth, 1200)
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            }
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }

            // Ensure even dimensions
            width = Math.round(width / 2) * 2
            height = Math.round(height / 2) * 2

            // For orientations 5-8, swap canvas dimensions
            const needsSwap = orientation >= 5 && orientation <= 8
            const canvasWidth = needsSwap ? height : width
            const canvasHeight = needsSwap ? width : height

            const canvas = document.createElement('canvas')
            canvas.width = canvasWidth
            canvas.height = canvasHeight

            const ctx = canvas.getContext('2d')
            if (!ctx) {
              reject(new Error('Could not get canvas context'))
              return
            }

            // Apply EXIF orientation correction
            applyExifOrientation(ctx, orientation, width, height)

            // Draw the image with original dimensions
            ctx.drawImage(img, 0, 0, width, height)

            resolve(canvas.toDataURL('image/jpeg', quality))
          } catch {
            reject(new Error('Failed to process image'))
          }
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    } catch {
      reject(new Error('Failed to process image'))
    }
  })
}

function createThumbnail(dataUrl: string, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = Math.round(width)
        canvas.height = Math.round(height)

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      } catch {
        reject(new Error('Failed to create thumbnail'))
      }
    }
    img.onerror = () => reject(new Error('Failed to create thumbnail'))
    img.src = dataUrl
  })
}

function generatePageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

// ============================================================
// Section config
// ============================================================

const SECTION_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  caseInfo: { label: 'Case Information', icon: '📋', color: 'emerald' },
  requirements: { label: 'Requirements', icon: '✅', color: 'emerald' },
  counseling: { label: 'Counseling', icon: '🧠', color: 'emerald' },
  drugTesting: { label: 'Drug Testing', icon: '🧪', color: 'amber' },
  naMeetings: { label: 'NA/AA Meetings', icon: '🤝', color: 'violet' },
  supervisedVisits: { label: 'Supervised Visits', icon: '👨‍👩‍👧', color: 'sky' },
  parentingClasses: { label: 'Parenting Classes', icon: '📖', color: 'rose' },
  courtDates: { label: 'Court Dates', icon: '⚖️', color: 'slate' },
  milestones: { label: 'Milestones', icon: '🏆', color: 'emerald' },
}

// ============================================================
// Main Component
// ============================================================

export function ScanCasePlan({ isOpen, onClose, activeCaseId, onComplete }: ScanCasePlanProps) {
  // Phase state
  const [phase, setPhase] = useState<Phase>('capture')

  // Phase 1: Capture state
  const [pages, setPages] = useState<CapturedPage[]>([])
  const [analyzeProgress, setAnalyzeProgress] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Phase 2: Review state
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [sectionToggles, setSectionToggles] = useState<SectionToggle>({
    caseInfo: true,
    requirements: true,
    counseling: true,
    drugTesting: true,
    naMeetings: true,
    supervisedVisits: true,
    parentingClasses: true,
    courtDates: true,
    milestones: true,
  })
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    caseInfo: true,
    requirements: true,
    counseling: true,
    drugTesting: true,
    naMeetings: true,
    supervisedVisits: true,
    parentingClasses: true,
    courtDates: true,
    milestones: true,
  })

  // Phase 3: Apply state
  const [applyProgress, setApplyProgress] = useState('')
  const [applyError, setApplyError] = useState<string | null>(null)

  // ============================================================
  // Phase 1: Image capture handlers
  // ============================================================

  const handleFilesSelected = useCallback(async (files: FileList | null, isCamera = false) => {
    if (!files || files.length === 0) return

    const remaining = 5 - pages.length
    if (remaining <= 0) {
      toast.error('Maximum 5 pages allowed')
      return
    }

    const filesToProcess = Array.from(files).slice(0, remaining)

    for (const file of filesToProcess) {
      try {
        // Validate file size (max 20MB)
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`Image too large (${Math.round(file.size / 1024 / 1024)}MB). Max 20MB.`)
          continue
        }
        // Use more aggressive compression for server upload (lower quality, smaller max)
        const dataUrl = await compressImage(file, 1000, 0.45)
        const thumbnail = await createThumbnail(dataUrl)
        const newPage: CapturedPage = {
          id: generatePageId(),
          dataUrl,
          thumbnail,
          name: isCamera ? `Page ${pages.length + 1}` : file.name,
        }
        setPages((prev) => [...prev, newPage])
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        toast.error(`Failed to process image: ${msg}. Try a different photo.`)
      }
    }
  }, [pages.length])

  const removePage = useCallback((pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId))
  }, [])

  const handleCameraClick = useCallback(() => {
    // Reset the input to ensure the same file can be selected again
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
    cameraInputRef.current?.click()
  }, [])

  const handleGalleryClick = useCallback(() => {
    // Reset the input to ensure the same file can be selected again
    if (galleryInputRef.current) {
      galleryInputRef.current.value = ''
    }
    galleryInputRef.current?.click()
  }, [])

  // Drag-and-drop handlers for fallback photo upload
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files, false)
    }
  }, [handleFilesSelected])

  // ============================================================
  // Phase 1 → Phase 2: Analyze
  // ============================================================

  const handleAnalyze = useCallback(async () => {
    if (pages.length === 0) {
      toast.error('Please capture at least one page')
      return
    }

    setPhase('analyzing')
    setAnalyzeProgress(`Analyzing page 1 of ${pages.length}...`)

    try {
      const images = pages.map((p) => p.dataUrl)

      // Log total payload size for debugging
      const totalSize = images.reduce((sum, img) => sum + img.length, 0)
      console.log(`[scan-case-plan] Sending ${images.length} images, total payload: ${(totalSize / 1024 / 1024).toFixed(2)}MB`)

      // Simulate progress messages while waiting
      let progressInterval: ReturnType<typeof setInterval> | null = null
      let currentProgressPage = 1

      progressInterval = setInterval(() => {
        currentProgressPage = Math.min(currentProgressPage + 1, pages.length)
        setAnalyzeProgress(`Analyzing page ${currentProgressPage} of ${pages.length}...`)
      }, 5000)

      // Add a timeout (90 seconds) for the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 90000)

      let response: Response
      try {
        response = await fetch('/api/scan-case-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images }),
          signal: controller.signal,
        })
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (progressInterval) clearInterval(progressInterval)
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          throw new Error('Analysis timed out. Please try again with fewer or smaller photos.')
        }
        throw new Error('Network error. Please check your connection and try again.')
      }
      clearTimeout(timeoutId)

      if (progressInterval) clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || `Server error: ${response.status}`
        if (response.status === 413) {
          throw new Error('Photos are too large for the server. Please retake photos from further away, or use fewer pages.')
        }
        throw new Error(errorMsg)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }

      let data: ExtractedData

      if (result.raw) {
        // Try to parse raw content
        try {
          data = JSON.parse(result.content)
        } catch {
          throw new Error('Could not parse the AI response. Please try again with clearer photos.')
        }
      } else {
        data = result.data
      }

      // Validate and set defaults
      const validatedData: ExtractedData = {
        caseInfo: {
          caseNumber: data.caseInfo?.caseNumber || null,
          courtName: data.caseInfo?.courtName || null,
          judgeName: data.caseInfo?.judgeName || null,
          caseworkerName: data.caseInfo?.caseworkerName || null,
          caseworkerPhone: data.caseInfo?.caseworkerPhone || null,
          attorneyName: data.caseInfo?.attorneyName || null,
          attorneyPhone: data.caseInfo?.attorneyPhone || null,
          removalDate: data.caseInfo?.removalDate || null,
          targetReunificationDate: data.caseInfo?.targetReunificationDate || null,
        },
        requirements: Array.isArray(data.requirements) ? data.requirements : [],
        counseling: data.counseling || { sessionType: null, frequency: null, counselorName: null, duration: null, notes: null },
        drugTesting: data.drugTesting || { testType: null, frequency: null, testingFacility: null, isRandom: false, notes: null },
        naMeetings: data.naMeetings || { frequency: null, notes: null },
        supervisedVisits: data.supervisedVisits || { frequency: null, location: null, supervisorName: null, duration: null, visitType: null, notes: null },
        parentingClasses: data.parentingClasses || { className: null, provider: null, frequency: null, notes: null },
        courtDates: Array.isArray(data.courtDates) ? data.courtDates : [],
        milestones: Array.isArray(data.milestones) ? data.milestones : [],
        additionalNotes: data.additionalNotes || '',
      }

      setExtractedData(validatedData)
      setPhase('review')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze case plan'
      toast.error(message)
      setPhase('capture')
    }
  }, [pages])

  // ============================================================
  // Phase 2: Section toggle helpers
  // ============================================================

  const toggleSection = useCallback((section: string) => {
    setSectionToggles((prev) => ({
      ...prev,
      [section]: !prev[section as keyof SectionToggle],
    }))
  }, [])

  const toggleExpanded = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }, [])

  // Update extracted data fields
  const updateCaseInfoField = useCallback((field: keyof CaseInfoExtracted, value: string | null) => {
    setExtractedData((prev) => {
      if (!prev) return prev
      return { ...prev, caseInfo: { ...prev.caseInfo, [field]: value } }
    })
  }, [])

  const updateCounselingField = useCallback((field: keyof CounselingExtracted, value: string | number | boolean | null) => {
    setExtractedData((prev) => {
      if (!prev) return prev
      return { ...prev, counseling: { ...prev.counseling, [field]: value } }
    })
  }, [])

  const updateDrugTestingField = useCallback((field: keyof DrugTestingExtracted, value: string | number | boolean | null) => {
    setExtractedData((prev) => {
      if (!prev) return prev
      return { ...prev, drugTesting: { ...prev.drugTesting, [field]: value } }
    })
  }, [])

  const updateNAMeetingsField = useCallback((field: keyof NAMeetingsExtracted, value: string | null) => {
    setExtractedData((prev) => {
      if (!prev) return prev
      return { ...prev, naMeetings: { ...prev.naMeetings, [field]: value } }
    })
  }, [])

  const updateSupervisedVisitsField = useCallback((field: keyof SupervisedVisitsExtracted, value: string | number | null) => {
    setExtractedData((prev) => {
      if (!prev) return prev
      return { ...prev, supervisedVisits: { ...prev.supervisedVisits, [field]: value } }
    })
  }, [])

  const updateParentingClassesField = useCallback((field: keyof ParentingClassesExtracted, value: string | null) => {
    setExtractedData((prev) => {
      if (!prev) return prev
      return { ...prev, parentingClasses: { ...prev.parentingClasses, [field]: value } }
    })
  }, [])

  const updateRequirement = useCallback((index: number, field: keyof RequirementExtracted, value: string | null) => {
    setExtractedData((prev) => {
      if (!prev) return prev
      const newReqs = [...prev.requirements]
      newReqs[index] = { ...newReqs[index], [field]: value }
      return { ...prev, requirements: newReqs }
    })
  }, [])

  const removeRequirement = useCallback((index: number) => {
    setExtractedData((prev) => {
      if (!prev) return prev
      return { ...prev, requirements: prev.requirements.filter((_, i) => i !== index) }
    })
  }, [])

  const updateCourtDate = useCallback((index: number, field: keyof CourtDateExtracted, value: string | null) => {
    setExtractedData((prev) => {
      if (!prev) return prev
      const newDates = [...prev.courtDates]
      newDates[index] = { ...newDates[index], [field]: value }
      return { ...prev, courtDates: newDates }
    })
  }, [])

  const removeCourtDate = useCallback((index: number) => {
    setExtractedData((prev) => {
      if (!prev) return prev
      return { ...prev, courtDates: prev.courtDates.filter((_, i) => i !== index) }
    })
  }, [])

  const updateMilestone = useCallback((index: number, field: keyof MilestoneExtracted, value: string | null) => {
    setExtractedData((prev) => {
      if (!prev) return prev
      const newMilestones = [...prev.milestones]
      newMilestones[index] = { ...newMilestones[index], [field]: value }
      return { ...prev, milestones: newMilestones }
    })
  }, [])

  const removeMilestone = useCallback((index: number) => {
    setExtractedData((prev) => {
      if (!prev) return prev
      return { ...prev, milestones: prev.milestones.filter((_, i) => i !== index) }
    })
  }, [])

  // ============================================================
  // Phase 3: Apply data to case
  // ============================================================

  const handleApply = useCallback(async () => {
    if (!extractedData || !activeCaseId) return

    setPhase('applying')
    setApplyError(null)

    const errors: string[] = []

    try {
      // 1. Update case info (uses upsert — will create the case if it doesn't exist)
      if (sectionToggles.caseInfo) {
        setApplyProgress('Updating case information...')
        const ci = extractedData.caseInfo
        try {
          await updateCase(activeCaseId, {
            caseNumber: ci.caseNumber || undefined,
            courtName: ci.courtName,
            judgeName: ci.judgeName,
            caseworkerName: ci.caseworkerName,
            caseworkerPhone: ci.caseworkerPhone,
            attorneyName: ci.attorneyName,
            attorneyPhone: ci.attorneyPhone,
            removalDate: ci.removalDate,
            targetReunificationDate: ci.targetReunificationDate,
          })
        } catch {
          errors.push('Case information update')
        }
      }

      // 2. Create requirements
      if (sectionToggles.requirements && extractedData.requirements.length > 0) {
        setApplyProgress('Creating requirements...')
        for (let i = 0; i < extractedData.requirements.length; i++) {
          const req = extractedData.requirements[i]
          try {
            await createItemByEndpoint('requirements', {
              caseId: activeCaseId,
              category: req.category || 'other',
              title: req.title || 'Untitled requirement',
              description: req.description,
              frequency: req.frequency,
              dueDate: req.dueDate,
              isCompleted: false,
              sortOrder: i + 1,
            })
          } catch {
            errors.push(`Requirement: ${req.title}`)
          }
        }
      }

      // 3. Create counseling
      if (sectionToggles.counseling && extractedData.counseling) {
        setApplyProgress('Creating counseling sessions...')
        const c = extractedData.counseling
        if (c.frequency || c.sessionType || c.counselorName) {
          try {
            await createItemByEndpoint('counseling', {
              caseId: activeCaseId,
              date: new Date().toISOString().split('T')[0],
              sessionType: c.sessionType,
              counselorName: c.counselorName,
              duration: c.duration,
              notes: c.notes
                ? `${c.frequency ? `Frequency: ${c.frequency}. ` : ''}${c.notes}`
                : c.frequency
                  ? `Frequency: ${c.frequency}`
                  : null,
              isCompleted: false,
            })
          } catch {
            errors.push('Counseling session')
          }
        }
      }

      // 4. Create drug test schedule
      if (sectionToggles.drugTesting && extractedData.drugTesting) {
        setApplyProgress('Creating drug testing schedule...')
        const d = extractedData.drugTesting
        if (d.frequency || d.testType || d.testingFacility) {
          try {
            await createItemByEndpoint('drug-tests', {
              caseId: activeCaseId,
              date: new Date().toISOString().split('T')[0],
              testType: d.testType,
              isRandom: d.isRandom,
              testingFacility: d.testingFacility,
              notes: d.notes
                ? `${d.frequency ? `Frequency: ${d.frequency}. ` : ''}${d.notes}`
                : d.frequency
                  ? `Frequency: ${d.frequency}`
                  : null,
              result: null,
              callMade: false,
              callResult: null,
              tested: false,
            })
          } catch {
            errors.push('Drug test')
          }
        }
      }

      // 5. Create NA meetings note
      if (sectionToggles.naMeetings && extractedData.naMeetings) {
        setApplyProgress('Creating NA meetings...')
        const n = extractedData.naMeetings
        if (n.frequency) {
          try {
            await createItemByEndpoint('na-meetings', {
              caseId: activeCaseId,
              date: new Date().toISOString().split('T')[0],
              notes: n.notes
                ? `Frequency: ${n.frequency}. ${n.notes}`
                : `Frequency: ${n.frequency}`,
              isVerified: false,
            })
          } catch {
            errors.push('NA meeting')
          }
        }
      }

      // 6. Create supervised visits
      if (sectionToggles.supervisedVisits && extractedData.supervisedVisits) {
        setApplyProgress('Creating supervised visits...')
        const sv = extractedData.supervisedVisits
        if (sv.frequency || sv.location || sv.supervisorName) {
          try {
            await createItemByEndpoint('supervised-visits', {
              caseId: activeCaseId,
              date: new Date().toISOString().split('T')[0],
              location: sv.location,
              supervisorName: sv.supervisorName,
              duration: sv.duration,
              visitType: sv.visitType,
              notes: sv.notes
                ? `${sv.frequency ? `Frequency: ${sv.frequency}. ` : ''}${sv.notes}`
                : sv.frequency
                  ? `Frequency: ${sv.frequency}`
                  : null,
              isCompleted: false,
            })
          } catch {
            errors.push('Supervised visit')
          }
        }
      }

      // 7. Create parenting classes
      if (sectionToggles.parentingClasses && extractedData.parentingClasses) {
        setApplyProgress('Creating parenting classes...')
        const pc = extractedData.parentingClasses
        if (pc.className || pc.provider || pc.frequency) {
          try {
            await createItemByEndpoint('parenting-classes', {
              caseId: activeCaseId,
              date: new Date().toISOString().split('T')[0],
              className: pc.className,
              provider: pc.provider,
              notes: pc.notes
                ? `${pc.frequency ? `Frequency: ${pc.frequency}. ` : ''}${pc.notes}`
                : pc.frequency
                  ? `Frequency: ${pc.frequency}`
                  : null,
              isCompleted: false,
              hasCertificate: false,
            })
          } catch {
            errors.push('Parenting class')
          }
        }
      }

      // 8. Create court dates
      if (sectionToggles.courtDates && extractedData.courtDates.length > 0) {
        setApplyProgress('Creating court dates...')
        for (const cd of extractedData.courtDates) {
          if (cd.date) {
            try {
              await createItemByEndpoint('court-dates', {
                caseId: activeCaseId,
                date: cd.date,
                hearingType: cd.hearingType,
                notes: cd.notes,
                isCompleted: false,
              })
            } catch {
              errors.push(`Court date: ${cd.date}`)
            }
          }
        }
      }

      // 9. Create milestones
      if (sectionToggles.milestones && extractedData.milestones.length > 0) {
        setApplyProgress('Creating milestones...')
        for (const m of extractedData.milestones) {
          try {
            await createItemByEndpoint('milestones', {
              caseId: activeCaseId,
              title: m.title || 'Untitled milestone',
              description: m.description,
              category: m.category || 'other',
              targetDate: m.targetDate,
              isCompleted: false,
            })
          } catch {
            errors.push(`Milestone: ${m.title}`)
          }
        }
      }

      // Invalidate all queries
      invalidateQueries()

      if (errors.length > 0) {
        toast.warning(`Applied with ${errors.length} errors. Some items could not be created.`, {
          description: errors.slice(0, 3).join(', ') + (errors.length > 3 ? '...' : ''),
        })
      } else {
        toast.success('Case plan imported successfully!', {
          description: 'All data has been applied to your case.',
        })
      }

      onComplete?.()
      handleClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply case plan data'
      setApplyError(message)
      toast.error('Failed to apply some data. Please try again.')
    }
  }, [extractedData, activeCaseId, sectionToggles, onComplete])

  // ============================================================
  // Reset & close
  // ============================================================

  const handleClose = useCallback(() => {
    setPhase('capture')
    setPages([])
    setExtractedData(null)
    setAnalyzeProgress('')
    setApplyProgress('')
    setApplyError(null)
    setSectionToggles({
      caseInfo: true,
      requirements: true,
      counseling: true,
      drugTesting: true,
      naMeetings: true,
      supervisedVisits: true,
      parentingClasses: true,
      courtDates: true,
      milestones: true,
    })
    setExpandedSections({
      caseInfo: true,
      requirements: true,
      counseling: true,
      drugTesting: true,
      naMeetings: true,
      supervisedVisits: true,
      parentingClasses: true,
      courtDates: true,
      milestones: true,
    })
    onClose()
  }, [onClose])

  // ============================================================
  // Summary count for review phase
  // ============================================================

  const getSummaryCount = useCallback(() => {
    if (!extractedData) return {}
    return {
      caseInfo: sectionToggles.caseInfo ? 1 : 0,
      requirements: sectionToggles.requirements ? extractedData.requirements.length : 0,
      counseling: sectionToggles.counseling && (extractedData.counseling.frequency || extractedData.counseling.sessionType || extractedData.counseling.counselorName) ? 1 : 0,
      drugTesting: sectionToggles.drugTesting && (extractedData.drugTesting.frequency || extractedData.drugTesting.testType || extractedData.drugTesting.testingFacility) ? 1 : 0,
      naMeetings: sectionToggles.naMeetings && !!extractedData.naMeetings.frequency ? 1 : 0,
      supervisedVisits: sectionToggles.supervisedVisits && (extractedData.supervisedVisits.frequency || extractedData.supervisedVisits.location || extractedData.supervisedVisits.supervisorName) ? 1 : 0,
      parentingClasses: sectionToggles.parentingClasses && (extractedData.parentingClasses.className || extractedData.parentingClasses.provider || extractedData.parentingClasses.frequency) ? 1 : 0,
      courtDates: sectionToggles.courtDates ? extractedData.courtDates.filter((cd) => cd.date).length : 0,
      milestones: sectionToggles.milestones ? extractedData.milestones.length : 0,
    }
  }, [extractedData, sectionToggles])

  // ============================================================
  // Render: Phase 1 - Capture
  // ============================================================

  const renderCapture = () => (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files, true)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files, false)}
      />

      {/* Instructions */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 mb-2">
          <ScanLine className="size-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Photograph Your Case Plan</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Take a clear photo of each page of your printed CPS case plan. The AI will read and extract all the information for you.
        </p>
      </div>

      {/* Camera & Gallery buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleCameraClick}
          className="h-auto py-6 flex-col gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={pages.length >= 5}
        >
          <Camera className="size-8" />
          <span className="text-sm font-medium">Take Photo</span>
          <span className="text-xs opacity-80">Opens camera</span>
        </Button>
        <Button
          onClick={handleGalleryClick}
          variant="outline"
          className="h-auto py-6 flex-col gap-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
          disabled={pages.length >= 5}
        >
          <Upload className="size-8" />
          <span className="text-sm font-medium">From Gallery</span>
          <span className="text-xs opacity-80">Upload existing</span>
        </Button>
      </div>

      {/* Drag-and-drop fallback zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
            : 'border-muted-foreground/25 hover:border-muted-foreground/40'
        }`}
      >
        <ImageIcon className="size-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          Or drag &amp; drop photos here
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          JPG, PNG, WebP, HEIC — up to 5 pages
        </p>
      </div>

      {/* Page thumbnails */}
      {pages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Captured Pages ({pages.length}/5)
            </Label>
            {pages.length < 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCameraClick}
                className="text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="size-4 mr-1" />
                Add Page
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {pages.map((page, idx) => (
              <div
                key={page.id}
                className="relative group rounded-lg border border-border overflow-hidden bg-muted"
              >
                <div className="aspect-[3/4] relative">
                  <img
                    src={page.thumbnail}
                    alt={`Page ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-black/60 text-white border-0">
                      {idx + 1}
                    </Badge>
                  </div>
                  <button
                    onClick={() => removePage(page.id)}
                    className="absolute top-1 right-1 size-6 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    aria-label={`Remove page ${idx + 1}`}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add more placeholder */}
            {pages.length < 5 && (
              <button
                onClick={handleCameraClick}
                className="aspect-[3/4] rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700 flex flex-col items-center justify-center gap-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
              >
                <Plus className="size-6" />
                <span className="text-[10px]">Add</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Analyze button */}
      {pages.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <Button
            onClick={handleAnalyze}
            className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 text-white"
            size="lg"
          >
            <ScanLine className="size-5 mr-2" />
            Analyze Case Plan ({pages.length} {pages.length === 1 ? 'page' : 'pages'})
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            This may take 10-30 seconds. Keep this screen open.
          </p>
        </div>
      )}
    </div>
  )

  // ============================================================
  // Render: Phase 2 - Analyzing (loading)
  // ============================================================

  const renderAnalyzing = () => (
    <div className="py-12 flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <div className="size-20 rounded-full border-4 border-emerald-200 dark:border-emerald-800" />
        <div className="absolute inset-0 size-20 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
        <ScanLine className="absolute inset-0 m-auto size-8 text-emerald-600" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Analyzing Your Case Plan</h3>
        <p className="text-sm text-muted-foreground">{analyzeProgress}</p>
        <p className="text-xs text-muted-foreground">Reading text and extracting structured data...</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="size-2 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )

  // ============================================================
  // Render: Phase 3 - Review/Edit
  // ============================================================

  const renderSectionHeader = (sectionKey: string, count: number) => {
    const config = SECTION_CONFIG[sectionKey]
    if (!config) return null
    const isExpanded = expandedSections[sectionKey]
    const isEnabled = sectionToggles[sectionKey as keyof SectionToggle]

    return (
      <div className="flex items-center gap-3">
        <Switch
          checked={isEnabled}
          onCheckedChange={() => toggleSection(sectionKey)}
          className="data-[state=checked]:bg-emerald-600"
        />
        <button
          onClick={() => toggleExpanded(sectionKey)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <span className="text-base">{config.icon}</span>
          <span className="font-medium text-sm flex-1">{config.label}</span>
          {count > 0 && (
            <Badge variant="secondary" className="text-[10px] bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-0">
              {count}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>
      </div>
    )
  }

  const renderCaseInfoSection = () => {
    if (!extractedData) return null
    const ci = extractedData.caseInfo
    const isExpanded = expandedSections.caseInfo

    return (
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardHeader className="pb-3 pt-4 px-4">
          {renderSectionHeader('caseInfo', 1)}
        </CardHeader>
        {isExpanded && sectionToggles.caseInfo && (
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Case Number</Label>
                <Input
                  value={ci.caseNumber || ''}
                  onChange={(e) => updateCaseInfoField('caseNumber', e.target.value || null)}
                  placeholder="e.g., CPS-2024-0847"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Court Name</Label>
                <Input
                  value={ci.courtName || ''}
                  onChange={(e) => updateCaseInfoField('courtName', e.target.value || null)}
                  placeholder="Court name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Judge Name</Label>
                <Input
                  value={ci.judgeName || ''}
                  onChange={(e) => updateCaseInfoField('judgeName', e.target.value || null)}
                  placeholder="Judge name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Caseworker Name</Label>
                <Input
                  value={ci.caseworkerName || ''}
                  onChange={(e) => updateCaseInfoField('caseworkerName', e.target.value || null)}
                  placeholder="Caseworker name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Caseworker Phone</Label>
                <Input
                  value={ci.caseworkerPhone || ''}
                  onChange={(e) => updateCaseInfoField('caseworkerPhone', e.target.value || null)}
                  placeholder="(555) 123-4567"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Attorney Name</Label>
                <Input
                  value={ci.attorneyName || ''}
                  onChange={(e) => updateCaseInfoField('attorneyName', e.target.value || null)}
                  placeholder="Attorney name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Attorney Phone</Label>
                <Input
                  value={ci.attorneyPhone || ''}
                  onChange={(e) => updateCaseInfoField('attorneyPhone', e.target.value || null)}
                  placeholder="(555) 123-4567"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Removal Date</Label>
                <Input
                  type="date"
                  value={ci.removalDate || ''}
                  onChange={(e) => updateCaseInfoField('removalDate', e.target.value || null)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Target Reunification Date</Label>
                <Input
                  type="date"
                  value={ci.targetReunificationDate || ''}
                  onChange={(e) => updateCaseInfoField('targetReunificationDate', e.target.value || null)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  const renderRequirementsSection = () => {
    if (!extractedData) return null
    const reqs = extractedData.requirements
    const isExpanded = expandedSections.requirements

    return (
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardHeader className="pb-3 pt-4 px-4">
          {renderSectionHeader('requirements', reqs.length)}
        </CardHeader>
        {isExpanded && sectionToggles.requirements && (
          <CardContent className="px-4 pb-4 space-y-3">
            {reqs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requirements found</p>
            ) : (
              reqs.map((req, idx) => (
                <div key={idx} className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={req.title}
                            onChange={(e) => updateRequirement(idx, 'title', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Category</Label>
                          <Input
                            value={req.category}
                            onChange={(e) => updateRequirement(idx, 'category', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Frequency</Label>
                          <Input
                            value={req.frequency || ''}
                            onChange={(e) => updateRequirement(idx, 'frequency', e.target.value || null)}
                            placeholder="e.g., weekly"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Due Date</Label>
                          <Input
                            type="date"
                            value={req.dueDate || ''}
                            onChange={(e) => updateRequirement(idx, 'dueDate', e.target.value || null)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      {req.description && (
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={req.description}
                            onChange={(e) => updateRequirement(idx, 'description', e.target.value || null)}
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRequirement(idx)}
                      className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  const renderCounselingSection = () => {
    if (!extractedData) return null
    const c = extractedData.counseling
    const isExpanded = expandedSections.counseling
    const hasData = c.frequency || c.sessionType || c.counselorName

    return (
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardHeader className="pb-3 pt-4 px-4">
          {renderSectionHeader('counseling', hasData ? 1 : 0)}
        </CardHeader>
        {isExpanded && sectionToggles.counseling && hasData && (
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Session Type</Label>
                <Input
                  value={c.sessionType || ''}
                  onChange={(e) => updateCounselingField('sessionType', e.target.value || null)}
                  placeholder="e.g., individual, group"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Frequency</Label>
                <Input
                  value={c.frequency || ''}
                  onChange={(e) => updateCounselingField('frequency', e.target.value || null)}
                  placeholder="e.g., weekly"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Counselor Name</Label>
                <Input
                  value={c.counselorName || ''}
                  onChange={(e) => updateCounselingField('counselorName', e.target.value || null)}
                  placeholder="Counselor name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration (minutes)</Label>
                <Input
                  type="number"
                  value={c.duration || ''}
                  onChange={(e) => updateCounselingField('duration', e.target.value ? Number(e.target.value) : null)}
                  placeholder="60"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            {c.notes && (
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={c.notes}
                  onChange={(e) => updateCounselingField('notes', e.target.value || null)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  const renderDrugTestingSection = () => {
    if (!extractedData) return null
    const d = extractedData.drugTesting
    const isExpanded = expandedSections.drugTesting
    const hasData = d.frequency || d.testType || d.testingFacility

    return (
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-3 pt-4 px-4">
          {renderSectionHeader('drugTesting', hasData ? 1 : 0)}
        </CardHeader>
        {isExpanded && sectionToggles.drugTesting && hasData && (
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Test Type</Label>
                <Input
                  value={d.testType || ''}
                  onChange={(e) => updateDrugTestingField('testType', e.target.value || null)}
                  placeholder="e.g., urine, hair"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Frequency</Label>
                <Input
                  value={d.frequency || ''}
                  onChange={(e) => updateDrugTestingField('frequency', e.target.value || null)}
                  placeholder="e.g., weekly, random"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Testing Facility</Label>
                <Input
                  value={d.testingFacility || ''}
                  onChange={(e) => updateDrugTestingField('testingFacility', e.target.value || null)}
                  placeholder="Facility name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1 flex items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={d.isRandom}
                    onCheckedChange={(checked) => updateDrugTestingField('isRandom', checked)}
                    className="data-[state=checked]:bg-amber-600"
                  />
                  <Label className="text-xs">Random testing</Label>
                </div>
              </div>
            </div>
            {d.notes && (
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={d.notes}
                  onChange={(e) => updateDrugTestingField('notes', e.target.value || null)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  const renderNAMeetingsSection = () => {
    if (!extractedData) return null
    const n = extractedData.naMeetings
    const isExpanded = expandedSections.naMeetings

    return (
      <Card className="border-violet-200 dark:border-violet-800">
        <CardHeader className="pb-3 pt-4 px-4">
          {renderSectionHeader('naMeetings', n.frequency ? 1 : 0)}
        </CardHeader>
        {isExpanded && sectionToggles.naMeetings && n.frequency && (
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Frequency</Label>
                <Input
                  value={n.frequency || ''}
                  onChange={(e) => updateNAMeetingsField('frequency', e.target.value || null)}
                  placeholder="e.g., 3 per week"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            {n.notes && (
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={n.notes}
                  onChange={(e) => updateNAMeetingsField('notes', e.target.value || null)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  const renderSupervisedVisitsSection = () => {
    if (!extractedData) return null
    const sv = extractedData.supervisedVisits
    const isExpanded = expandedSections.supervisedVisits
    const hasData = sv.frequency || sv.location || sv.supervisorName

    return (
      <Card className="border-sky-200 dark:border-sky-800">
        <CardHeader className="pb-3 pt-4 px-4">
          {renderSectionHeader('supervisedVisits', hasData ? 1 : 0)}
        </CardHeader>
        {isExpanded && sectionToggles.supervisedVisits && hasData && (
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Frequency</Label>
                <Input
                  value={sv.frequency || ''}
                  onChange={(e) => updateSupervisedVisitsField('frequency', e.target.value || null)}
                  placeholder="e.g., weekly"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location</Label>
                <Input
                  value={sv.location || ''}
                  onChange={(e) => updateSupervisedVisitsField('location', e.target.value || null)}
                  placeholder="Visit location"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Supervisor Name</Label>
                <Input
                  value={sv.supervisorName || ''}
                  onChange={(e) => updateSupervisedVisitsField('supervisorName', e.target.value || null)}
                  placeholder="Supervisor name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration (minutes)</Label>
                <Input
                  type="number"
                  value={sv.duration || ''}
                  onChange={(e) => updateSupervisedVisitsField('duration', e.target.value ? Number(e.target.value) : null)}
                  placeholder="60"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Visit Type</Label>
                <Input
                  value={sv.visitType || ''}
                  onChange={(e) => updateSupervisedVisitsField('visitType', e.target.value || null)}
                  placeholder="e.g., supervised, semi-supervised"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            {sv.notes && (
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={sv.notes}
                  onChange={(e) => updateSupervisedVisitsField('notes', e.target.value || null)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  const renderParentingClassesSection = () => {
    if (!extractedData) return null
    const pc = extractedData.parentingClasses
    const isExpanded = expandedSections.parentingClasses
    const hasData = pc.className || pc.provider || pc.frequency

    return (
      <Card className="border-rose-200 dark:border-rose-800">
        <CardHeader className="pb-3 pt-4 px-4">
          {renderSectionHeader('parentingClasses', hasData ? 1 : 0)}
        </CardHeader>
        {isExpanded && sectionToggles.parentingClasses && hasData && (
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Class Name</Label>
                <Input
                  value={pc.className || ''}
                  onChange={(e) => updateParentingClassesField('className', e.target.value || null)}
                  placeholder="Class name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Provider</Label>
                <Input
                  value={pc.provider || ''}
                  onChange={(e) => updateParentingClassesField('provider', e.target.value || null)}
                  placeholder="Provider name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Frequency</Label>
                <Input
                  value={pc.frequency || ''}
                  onChange={(e) => updateParentingClassesField('frequency', e.target.value || null)}
                  placeholder="e.g., weekly"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            {pc.notes && (
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={pc.notes}
                  onChange={(e) => updateParentingClassesField('notes', e.target.value || null)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  const renderCourtDatesSection = () => {
    if (!extractedData) return null
    const cds = extractedData.courtDates
    const isExpanded = expandedSections.courtDates

    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 pt-4 px-4">
          {renderSectionHeader('courtDates', cds.length)}
        </CardHeader>
        {isExpanded && sectionToggles.courtDates && (
          <CardContent className="px-4 pb-4 space-y-3">
            {cds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No court dates found</p>
            ) : (
              cds.map((cd, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Date</Label>
                      <Input
                        type="date"
                        value={cd.date || ''}
                        onChange={(e) => updateCourtDate(idx, 'date', e.target.value || null)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hearing Type</Label>
                      <Input
                        value={cd.hearingType || ''}
                        onChange={(e) => updateCourtDate(idx, 'hearingType', e.target.value || null)}
                        placeholder="e.g., review, permanency"
                        className="h-8 text-sm"
                      />
                    </div>
                    {cd.notes && (
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Notes</Label>
                        <Input
                          value={cd.notes}
                          onChange={(e) => updateCourtDate(idx, 'notes', e.target.value || null)}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCourtDate(idx)}
                    className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  const renderMilestonesSection = () => {
    if (!extractedData) return null
    const ms = extractedData.milestones
    const isExpanded = expandedSections.milestones

    return (
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardHeader className="pb-3 pt-4 px-4">
          {renderSectionHeader('milestones', ms.length)}
        </CardHeader>
        {isExpanded && sectionToggles.milestones && (
          <CardContent className="px-4 pb-4 space-y-3">
            {ms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones found</p>
            ) : (
              ms.map((m, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={m.title}
                        onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Category</Label>
                      <Input
                        value={m.category}
                        onChange={(e) => updateMilestone(idx, 'category', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Target Date</Label>
                      <Input
                        type="date"
                        value={m.targetDate || ''}
                        onChange={(e) => updateMilestone(idx, 'targetDate', e.target.value || null)}
                        className="h-8 text-sm"
                      />
                    </div>
                    {m.description && (
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={m.description}
                          onChange={(e) => updateMilestone(idx, 'description', e.target.value || null)}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMilestone(idx)}
                    className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  const renderReview = () => {
    const summary = getSummaryCount()
    const totalItems = Object.values(summary).reduce((a, b) => a + b, 0)

    return (
      <div className="space-y-4">
        {/* Summary bar */}
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 mb-2">
            <Check className="size-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">Review Extracted Data</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Verify the extracted information below. Edit any field, or toggle sections off to exclude them.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-600 text-white border-0">
              {totalItems} item{totalItems !== 1 ? 's' : ''} to import
            </Badge>
            {Object.entries(summary).filter(([, count]) => count > 0).map(([key, count]) => (
              <Badge key={key} variant="outline" className="text-xs border-emerald-300 dark:border-emerald-700">
                {SECTION_CONFIG[key]?.label}: {count}
              </Badge>
            ))}
          </div>
        </div>

        {/* Additional notes */}
        {extractedData?.additionalNotes && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <Label className="text-xs font-medium text-amber-700 dark:text-amber-400">Additional Notes Found</Label>
            <p className="text-sm mt-1">{extractedData.additionalNotes}</p>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {renderCaseInfoSection()}
          {renderRequirementsSection()}
          {renderCounselingSection()}
          {renderDrugTestingSection()}
          {renderNAMeetingsSection()}
          {renderSupervisedVisitsSection()}
          {renderParentingClassesSection()}
          {renderCourtDatesSection()}
          {renderMilestonesSection()}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setPhase('capture')
              setExtractedData(null)
            }}
            className="flex-1"
            disabled={phase === 'applying'}
          >
            <Camera className="size-4 mr-2" />
            Re-scan
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={totalItems === 0 || phase === 'applying'}
          >
            <Check className="size-4 mr-2" />
            Apply to My Case
          </Button>
        </div>
      </div>
    )
  }

  // ============================================================
  // Render: Phase 4 - Applying
  // ============================================================

  const renderApplying = () => (
    <div className="py-8 flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <Loader2 className="size-16 text-emerald-600 animate-spin" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Applying to Your Case</h3>
        <p className="text-sm text-muted-foreground">{applyProgress}</p>
      </div>
      {applyError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 max-w-sm">
          {applyError}
        </div>
      )}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="size-2 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )

  // ============================================================
  // Main render
  // ============================================================

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="size-5 text-emerald-600" />
            Scan Case Plan
          </DialogTitle>
          <DialogDescription>
            {phase === 'capture' && 'Photograph your printed CPS case plan to auto-fill your case details.'}
            {phase === 'analyzing' && 'AI is reading your case plan document...'}
            {phase === 'review' && 'Review and edit the extracted information before applying.'}
            {phase === 'applying' && 'Saving extracted data to your case...'}
          </DialogDescription>
        </DialogHeader>

        {phase === 'capture' && renderCapture()}
        {phase === 'analyzing' && renderAnalyzing()}
        {phase === 'review' && renderReview()}
        {phase === 'applying' && renderApplying()}
      </DialogContent>
    </Dialog>
  )
}
