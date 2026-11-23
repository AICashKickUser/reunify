'use client'

import { useState, useMemo, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import {
  useDocuments,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
} from '@/lib/data-hooks'
import type { CaseDocument } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  FolderArchive,
  Scale,
  Award,
  TestTube2,
  FileText,
  ClipboardList,
  Stethoscope,
  File,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Camera,
  Upload,
  Eye,
  Download,
  X,
} from 'lucide-react'
import { getLocalDateString } from '@/lib/utils'
import { DateInputField } from '@/components/date-input-field'

const DOC_TYPES = [
  'court-order', 'certificate', 'drug-test-result', 'service-referral',
  'case-plan', 'evaluation', 'discharge-summary', 'other',
] as const

const DOC_TYPE_LABELS: Record<string, string> = {
  'court-order': 'Court Order',
  'certificate': 'Certificate',
  'drug-test-result': 'Drug Test Result',
  'service-referral': 'Service Referral',
  'case-plan': 'Case Plan',
  'evaluation': 'Evaluation',
  'discharge-summary': 'Discharge Summary',
  'other': 'Other',
}

const DOC_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'court-order': Scale,
  'certificate': Award,
  'drug-test-result': TestTube2,
  'service-referral': FileText,
  'case-plan': ClipboardList,
  'evaluation': Stethoscope,
  'discharge-summary': FileText,
  'other': File,
}

const DOC_TYPE_COLORS: Record<string, string> = {
  'court-order': 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  'certificate': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'drug-test-result': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'service-referral': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  'case-plan': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  'evaluation': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'discharge-summary': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  'other': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
}

interface DocFormData {
  title: string
  documentType: string
  date: string
  issuer: string
  notes: string
  fileData: string
  fileName: string
  fileType: string
  fileSize: number
}

const emptyForm: DocFormData = {
  title: '',
  documentType: 'court-order',
  date: getLocalDateString(),
  issuer: '',
  notes: '',
  fileData: '',
  fileName: '',
  fileType: '',
  fileSize: 0,
}

/** Load an image File into an HTMLImageElement */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Compress an image File to a JPEG data URL, max width 1200px, quality 0.8 */
async function compressImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const maxWidth = 1200
    let { width, height } = img
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width)
      width = maxWidth
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', 0.8)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/** Read a file as a base64 data URL */
function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function isImage(fileType: string): boolean {
  return fileType.startsWith('image/')
}

function isPdf(fileType: string): boolean {
  return fileType === 'application/pdf'
}

export function DocumentVaultView() {
  const { activeCaseId, addDialogTrigger } = useAppStore()
  const { data: docs, isLoading } = useDocuments(activeCaseId)
  const createMutation = useCreateItem('documents')
  const updateMutation = useUpdateItem('documents')
  const deleteMutation = useDeleteItem('documents')

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<CaseDocument | null>(null)
  const [form, setForm] = useState<DocFormData>(emptyForm)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewDoc, setViewDoc] = useState<CaseDocument | null>(null)
  const [processingFile, setProcessingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevTriggerRef = useRef(addDialogTrigger)

  if (addDialogTrigger !== prevTriggerRef.current && addDialogTrigger > 0) {
    prevTriggerRef.current = addDialogTrigger
    setForm(emptyForm)
    setAddOpen(true)
  }

  // Stats
  const stats = useMemo(() => {
    if (!docs) return { total: 0, byType: {} as Record<string, number> }
    const byType: Record<string, number> = {}
    for (const d of docs) {
      const t = d.documentType || 'other'
      byType[t] = (byType[t] || 0) + 1
    }
    return { total: docs.length, byType }
  }, [docs])

  // Filtered docs
  const filteredDocs = useMemo(() => {
    if (!docs) return []
    let filtered = [...docs]
    if (typeFilter !== 'all') {
      filtered = filtered.filter((d) => d.documentType === typeFilter)
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [docs, typeFilter])

  const handleAdd = () => {
    setForm(emptyForm)
    setAddOpen(true)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProcessingFile(true)
    try {
      let dataUrl: string
      if (isImage(file.type)) {
        dataUrl = await compressImage(file)
      } else {
        dataUrl = await readAsDataURL(file)
      }
      // Estimate size of the base64 data
      const base64Size = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)
      setForm((f) => ({
        ...f,
        fileData: dataUrl,
        fileName: file.name,
        fileType: file.type || (isImage(dataUrl) ? 'image/jpeg' : 'application/octet-stream'),
        fileSize: base64Size,
        title: f.title || file.name.replace(/\.[^.]+$/, ''),
      }))
    } catch (err) {
      console.error('File processing error:', err)
    } finally {
      setProcessingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleEdit = (doc: CaseDocument) => {
    setEditingDoc(doc)
    setForm({
      title: doc.title,
      documentType: doc.documentType || 'other',
      date: doc.date ? doc.date.slice(0, 10) : getLocalDateString(),
      issuer: doc.issuer || '',
      notes: doc.notes || '',
      fileData: '', // Don't allow file replacement in edit (keep original)
      fileName: doc.fileName || '',
      fileType: doc.fileType || '',
      fileSize: doc.fileSize || 0,
    })
    setEditOpen(true)
  }

  const submitAdd = () => {
    if (!activeCaseId || !form.fileData) return
    createMutation.mutate(
      {
        caseId: activeCaseId,
        title: form.title,
        documentType: form.documentType,
        date: form.date || null,
        issuer: form.issuer || null,
        notes: form.notes || null,
        fileData: form.fileData,
        fileName: form.fileName || null,
        fileType: form.fileType || null,
        fileSize: form.fileSize || null,
      },
      {
        onSuccess: () => {
          setAddOpen(false)
          setForm(emptyForm)
        },
      }
    )
  }

  const submitEdit = () => {
    if (!editingDoc) return
    updateMutation.mutate(
      {
        id: editingDoc.id,
        data: {
          title: form.title,
          documentType: form.documentType,
          date: form.date || null,
          issuer: form.issuer || null,
          notes: form.notes || null,
        },
      },
      {
        onSuccess: () => {
          setEditOpen(false)
          setEditingDoc(null)
        },
      }
    )
  }

  const handleDownload = (doc: CaseDocument) => {
    if (!doc.fileData) return
    const link = document.createElement('a')
    link.href = doc.fileData
    link.download = doc.fileName || doc.title || 'document'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const confirmDelete = () => {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FolderArchive className="size-5 text-emerald-600" />
            Document Vault
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Securely store court orders, certificates, drug test results, and more &mdash; right on your phone.
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-4" />
          Add Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FolderArchive className="size-8 text-emerald-600/30" />
            </div>
          </CardContent>
        </Card>
        {(['court-order', 'certificate', 'drug-test-result'] as const).map((t) => {
          const Icon = DOC_TYPE_ICONS[t]
          return (
            <Card key={t}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[t]}</p>
                    <p className="text-2xl font-bold">{stats.byType[t] || 0}</p>
                  </div>
                  <Icon className="size-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {DOC_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {DOC_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderArchive className="mx-auto size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Documents Saved Yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Snap a photo of a court order, upload your completion certificate, or save a drug test result. Everything stays private on your phone.
            </p>
            <Button onClick={handleAdd} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="size-4" />
              Add First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => {
            const TypeIcon = DOC_TYPE_ICONS[doc.documentType || 'other'] || File
            const img = isImage(doc.fileType || '')
            return (
              <Card key={doc.id} className="overflow-hidden transition-shadow hover:shadow-md">
                {/* Thumbnail / Preview */}
                <div
                  className="relative aspect-[4/3] bg-muted cursor-pointer group"
                  onClick={() => setViewDoc(doc)}
                >
                  {img && doc.fileData ? (
                     
                    <img
                      src={doc.fileData}
                      alt={doc.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <File className="size-10 text-muted-foreground/40" />
                      <span className="text-xs text-muted-foreground">PDF Document</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Eye className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge className={DOC_TYPE_COLORS[doc.documentType || 'other']}>
                          <TypeIcon className="size-3" />
                          {DOC_TYPE_LABELS[doc.documentType || 'other']}
                        </Badge>
                      </div>
                      {doc.date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(doc.date).toLocaleDateString()}
                        </p>
                      )}
                      {doc.issuer && (
                        <p className="text-xs text-muted-foreground truncate">{doc.issuer}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewDoc(doc)}
                      className="h-7 text-xs"
                    >
                      <Eye className="size-3.5" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="h-7 text-xs"
                    >
                      <Download className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(doc)}
                      className="h-7 text-xs"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(doc.id)}
                      className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
            <DialogDescription>
              Upload a photo or PDF. Images are automatically compressed to save space.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* File picker */}
            <div className="space-y-2">
              <Label>File</Label>
              {form.fileData ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                  {isImage(form.fileType) ? (
                     
                    <img src={form.fileData} alt="preview" className="size-16 object-cover rounded" />
                  ) : (
                    <div className="size-16 flex items-center justify-center bg-muted rounded">
                      <File className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{form.fileName || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground">
                      {form.fileType} {form.fileSize > 0 && `\u00b7 ${formatFileSize(form.fileSize)}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setForm((f) => ({ ...f, fileData: '', fileName: '', fileType: '', fileSize: 0 }))}
                    className="size-8"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processingFile}
                    className="flex-1"
                  >
                    {processingFile ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                    Take Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processingFile}
                    className="flex-1"
                  >
                    <Upload className="size-4" />
                    Choose File
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-title">Title</Label>
              <Input
                id="add-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Court Order - Visitation Modification"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={form.documentType}
                  onValueChange={(v) => setForm((f) => ({ ...f, documentType: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {DOC_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DateInputField
                id="add-doc-date"
                label="Document Date"
                value={form.date}
                onChange={(v) => setForm((f) => ({ ...f, date: v }))}
                helperText=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-issuer">Issuer / Source</Label>
              <Input
                id="add-issuer"
                value={form.issuer}
                onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))}
                placeholder="e.g. Santa Clara Superior Court, ABC Treatment Center"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-doc-notes">Notes</Label>
              <Textarea
                id="add-doc-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any notes about this document..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitAdd}
              disabled={createMutation.isPending || !form.fileData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Save Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>Update the document details. The file itself cannot be changed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editingDoc?.fileData && (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                {isImage(editingDoc.fileType || '') ? (
                   
                  <img src={editingDoc.fileData} alt="preview" className="size-16 object-cover rounded" />
                ) : (
                  <div className="size-16 flex items-center justify-center bg-muted rounded">
                    <File className="size-8 text-muted-foreground" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground truncate">{editingDoc.fileName || 'Document'}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={form.documentType}
                  onValueChange={(v) => setForm((f) => ({ ...f, documentType: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {DOC_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DateInputField
                id="edit-doc-date"
                label="Document Date"
                value={form.date}
                onChange={(v) => setForm((f) => ({ ...f, date: v }))}
                helperText=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-issuer">Issuer / Source</Label>
              <Input
                id="edit-issuer"
                value={form.issuer}
                onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-doc-notes">Notes</Label>
              <Textarea
                id="edit-doc-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitEdit}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate">{viewDoc?.title}</DialogTitle>
            <DialogDescription>
              {viewDoc?.documentType && DOC_TYPE_LABELS[viewDoc.documentType]}
              {viewDoc?.date && ` \u00b7 ${new Date(viewDoc.date).toLocaleDateString()}`}
              {viewDoc?.issuer && ` \u00b7 ${viewDoc.issuer}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {viewDoc?.fileData && isImage(viewDoc.fileType || '') ? (
               
              <img src={viewDoc.fileData} alt={viewDoc.title} className="w-full h-auto" />
            ) : viewDoc?.fileData && isPdf(viewDoc.fileType || '') ? (
              <iframe src={viewDoc.fileData} className="w-full h-[60vh] border-0" title={viewDoc.title} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <File className="size-12 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Preview not available</p>
              </div>
            )}
            {viewDoc?.notes && (
              <div className="p-4 border-t bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{viewDoc.notes}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => viewDoc && handleDownload(viewDoc)}>
              <Download className="size-4" />
              Download
            </Button>
            <Button onClick={() => setViewDoc(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the document and its file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DocumentVaultView
