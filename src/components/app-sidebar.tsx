'use client'

import { useState, useCallback, useSyncExternalStore } from 'react'

// Stable references for useSyncExternalStore (must be outside component to avoid infinite loops)
const emptySubscribe = () => () => {}
const returnTrue = () => true
const returnFalse = () => false

import {
  LayoutDashboard,
  Clock,
  ClipboardList,
  Scale,
  Heart,
  TestTube2,
  Footprints,
  Users,
  Baby,
  GraduationCap,
  BarChart3,
  FolderHeart,
  CalendarCheck,
  Trash2,
  Crown,
  HardDriveDownload,
  Lock,
  Unlock,
  ScanLine,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore, type ViewType } from '@/lib/store'
import { useCases, useDeleteCase } from '@/lib/data-hooks'

import { StreakBadge } from '@/components/streak-display'
import { ProBadge } from '@/components/pro-badge'
import { useSubscriptionStore, isProActive } from '@/lib/subscription'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { isAppLockEnabled, isPinSet, enableAppLock, disableAppLock, clearAppLock, setAppLockPin, verifyPin } from '@/lib/app-lock'
import { LastSynced } from '@/components/last-synced'

interface NavItem {
  view: ViewType
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { view: 'timeline', label: 'Timeline', icon: Clock },
      { view: 'daily-checkins', label: 'Daily Check-in', icon: CalendarCheck },
    ],
  },
  {
    label: 'Case Plan',
    items: [
      { view: 'case-plan', label: 'Case Plan', icon: ClipboardList },
      { view: 'scan-case-plan', label: 'Scan Plan', icon: ScanLine },
      { view: 'court-dates', label: 'Court Dates', icon: Scale },
    ],
  },
  {
    label: 'Recovery',
    items: [
      { view: 'counseling', label: 'Counseling', icon: Heart },
      { view: 'drug-testing', label: 'Drug Testing', icon: TestTube2 },
      { view: 'na-steps', label: '12 Steps', icon: Footprints },
      { view: 'na-meetings', label: 'NA Meetings', icon: Users },
    ],
  },
  {
    label: 'Family',
    items: [
      { view: 'supervised-visits', label: 'Visits', icon: Baby },
      { view: 'parenting-classes', label: 'Parenting Classes', icon: GraduationCap },
    ],
  },
  {
    label: 'Reports',
    items: [
      { view: 'progress', label: 'Progress Report', icon: BarChart3 },
      { view: 'backup', label: 'Backup & Restore', icon: HardDriveDownload },
    ],
  },
  {
    label: 'Pro',
    items: [
      { view: 'go-pro', label: 'Go Pro', icon: Crown },
    ],
  },
]

export function AppSidebar() {
  const { activeView, setActiveView, activeCaseId, setActiveCaseId } = useAppStore()
  const { data: cases } = useCases()
  const deleteMutation = useDeleteCase()
  const { isMobile, setOpenMobile, toggleSidebar, state: sidebarState } = useSidebar()
  const subscription = useSubscriptionStore()
  const isProUser = isProActive(subscription)
  // Use useSyncExternalStore for SSR-safe lock state reading
  const isClient = useSyncExternalStore(emptySubscribe, returnTrue, returnFalse)
  const [lockVersion, setLockVersion] = useState(0)
  // lockVersion forces re-read of localStorage on changes
  const lockEnabled = isClient ? isAppLockEnabled() : false
  void lockVersion // used to force re-render when lock state changes
  const [lockBusy, setLockBusy] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [disablePin, setDisablePin] = useState('')
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [setupPin, setSetupPin] = useState('')
  const [setupConfirm, setSetupConfirm] = useState('')
  const [setupStep, setSetupStep] = useState<'enter' | 'confirm'>('enter')
  const [setupError, setSetupError] = useState('')

  const handleLockToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      // Turning on — show setup dialog
      setSetupPin('')
      setSetupConfirm('')
      setSetupStep('enter')
      setSetupError('')
      setShowSetupDialog(true)
    } else {
      // Turning off — require PIN verification
      if (isPinSet()) {
        setDisablePin('')
        setShowDisableDialog(true)
      } else {
        disableAppLock()
        setLockVersion(v => v + 1)
        toast.success('App lock disabled')
      }
    }
  }, [])

  const handleSetupSubmit = useCallback(async () => {
    if (setupStep === 'enter') {
      if (setupPin.length !== 4) {
        setSetupError('PIN must be 4 digits')
        return
      }
      setSetupStep('confirm')
      setSetupError('')
    } else {
      if (setupPin !== setupConfirm) {
        setSetupError('PINs do not match')
        return
      }
      setLockBusy(true)
      await setAppLockPin(setupPin)
      setLockVersion(v => v + 1)
      setShowSetupDialog(false)
      setLockBusy(false)
      // Notify other components (like useAppLock in page.tsx) that lock state changed
      window.dispatchEvent(new Event('reunify-lock-change'))
      toast.success('App lock enabled! Your data is protected.')
    }
  }, [setupPin, setupConfirm, setupStep])

  const handleDisableSubmit = useCallback(async () => {
    if (disablePin.length !== 4) return
    setLockBusy(true)
    const valid = await verifyPin(disablePin)
    if (valid) {
      disableAppLock()
      clearAppLock()
      setLockVersion(v => v + 1)
      setShowDisableDialog(false)
      // Notify other components that lock state changed
      window.dispatchEvent(new Event('reunify-lock-change'))
      toast.success('App lock disabled')
    } else {
      toast.error('Incorrect PIN')
    }
    setLockBusy(false)
  }, [disablePin])

  const handleNavClick = (view: ViewType) => {
    setActiveView(view)
    // Auto-hide sidebar on navigation:
    // - On mobile (sheet overlay): close the sheet
    // - On tablet/small desktop (icon-collapsible): collapse to icon mode if expanded
    // This gives more content space on smaller screens
    if (isMobile) {
      setOpenMobile(false)
    } else if (window.innerWidth < 1280 && sidebarState === 'expanded') {
      // On tablet and small desktop, collapse the sidebar to icon mode
      // xl breakpoint is 1280px — below that, auto-collapse for more space
      toggleSidebar()
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r-sidebar-border">
      <SidebarHeader className="p-3">
        {/* App Brand */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-sidebar-accent"
              tooltip="Reunify"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <FolderHeart className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-emerald-700 dark:text-emerald-400">
                  Reunify
                </span>
                <span className="truncate text-xs text-muted-foreground">Progress Tracker</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Case Selector */}
        <div className="group-data-[collapsible=icon]:hidden">
          <Select
            value={activeCaseId ?? ''}
            onValueChange={(value) => setActiveCaseId(value)}
          >
            <SelectTrigger className="w-full h-8 text-xs" size="sm">
              <SelectValue placeholder="Select a case..." />
            </SelectTrigger>
            <SelectContent>
              {cases?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.caseNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Streak Badge */}
        <div className="group-data-[collapsible=icon]:hidden mt-1">
          <StreakBadge />
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="sidebar-scroll">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-emerald-700/60 dark:text-emerald-400/60">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.view}>
                    <SidebarMenuButton
                      isActive={activeView === item.view}
                      onClick={() => handleNavClick(item.view)}
                      tooltip={item.label}
                      className={
                        activeView === item.view
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : ''
                      }
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarSeparator />

        {/* App Lock Toggle */}
        <div className="group-data-[collapsible=icon]:hidden mt-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-sm">
            {lockEnabled ? (
              <Lock className="size-4 text-emerald-600" />
            ) : (
              <Unlock className="size-4 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">App Lock</span>
          </div>
          <Switch
            checked={lockEnabled}
            onCheckedChange={handleLockToggle}
            aria-label="Toggle app lock"
          />
        </div>

        {/* App Lock Disable Dialog */}
        <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enter PIN to Disable Lock</AlertDialogTitle>
              <AlertDialogDescription>
                Enter your current PIN to disable app lock protection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-center gap-3 py-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`size-4 rounded-full transition-all ${
                    i < disablePin.length
                      ? 'bg-emerald-500 scale-110'
                      : 'bg-muted border-2 border-muted-foreground/30'
                  }`}
                ></div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
                if (key === '') return <div key="empty" />
                if (key === 'del') return (
                  <button
                    key="del"
                    onClick={() => setDisablePin(disablePin.slice(0, -1))}
                    className="flex items-center justify-center h-12 rounded-lg bg-muted hover:bg-muted/80 text-sm"
                  >
                    ←
                  </button>
                )
                return (
                  <button
                    key={key}
                    onClick={() => disablePin.length < 4 && setDisablePin(disablePin + key)}
                    className="flex items-center justify-center h-12 rounded-lg bg-muted hover:bg-muted/80 text-lg font-medium"
                  >
                    {key}
                  </button>
                )
              })}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisableSubmit}
                disabled={disablePin.length !== 4 || lockBusy}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Disable Lock
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* App Lock Setup Dialog */}
        <AlertDialog open={showSetupDialog} onOpenChange={(open) => {
          if (!open) setShowSetupDialog(false)
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {setupStep === 'enter' ? 'Create a 4-Digit PIN' : 'Confirm Your PIN'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {setupStep === 'enter'
                  ? 'This PIN will protect your sensitive CPS case data every time you open the app.'
                  : 'Re-enter your PIN to confirm it.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {setupError && (
              <p className="text-sm text-destructive text-center">{setupError}</p>
            )}
            <div className="flex justify-center gap-3 py-4">
              {[0, 1, 2, 3].map((i) => {
                const currentPin = setupStep === 'enter' ? setupPin : setupConfirm
                return (
                  <div
                    key={i}
                    className={`size-4 rounded-full transition-all ${
                      i < currentPin.length
                        ? 'bg-emerald-500 scale-110'
                        : 'bg-muted border-2 border-muted-foreground/30'
                    }`}
                  ></div>
                )
              })}
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
                const currentPin = setupStep === 'enter' ? setupPin : setupConfirm
                const setCurrentPin = setupStep === 'enter' ? setSetupPin : setSetupConfirm
                if (key === '') return <div key="empty" />
                if (key === 'del') return (
                  <button
                    key="del"
                    onClick={() => setCurrentPin(currentPin.slice(0, -1))}
                    className="flex items-center justify-center h-12 rounded-lg bg-muted hover:bg-muted/80 text-sm"
                  >
                    ←
                  </button>
                )
                return (
                  <button
                    key={key}
                    onClick={() => currentPin.length < 4 && setCurrentPin(currentPin + key)}
                    className="flex items-center justify-center h-12 rounded-lg bg-muted hover:bg-muted/80 text-lg font-medium"
                  >
                    {key}
                  </button>
                )
              })}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSetupSubmit}
                disabled={(setupStep === 'enter' ? setupPin.length !== 4 : setupConfirm.length !== 4) || lockBusy}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {setupStep === 'enter' ? 'Next' : 'Enable Lock'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {activeCaseId && (
          <div className="group-data-[collapsible=icon]:hidden mt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  size="sm"
                >
                  <Trash2 className="size-4" />
                  Start Fresh
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your current case and all associated
                    data (sessions, tests, visits, milestones, etc.). This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => {
                      deleteMutation.mutate(activeCaseId, {
                        onSuccess: () => {
                          setActiveCaseId(null)
                          toast.success('Case deleted. You can start fresh!')
                        },
                        onError: () => {
                          toast.error('Failed to delete case. Please try again.')
                        },
                      })
                    }}
                  >
                    Delete & Start Fresh
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        {/* Upgrade to Pro / Pro Badge */}
        <div className="group-data-[collapsible=icon]:hidden mt-2">
          {isProUser ? (
            <div className="flex items-center justify-center gap-1.5">
              <ProBadge size="sm" showIcon />
              <span className="text-xs text-muted-foreground">Reunify Pro</span>
            </div>
          ) : (
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('reunify-show-upgrade', { detail: { feature: 'Reunify Pro' } }))
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
            >
              <Crown className="size-3.5" />
              Upgrade to Pro
            </button>
          )}
        </div>

        {/* Collapsed icon mode: just show Crown icon */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center mt-2">
          {isProUser ? (
            <ProBadge size="sm" showIcon />
          ) : (
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('reunify-show-upgrade', { detail: { feature: 'Reunify Pro' } }))
                }
              }}
              className="flex items-center justify-center size-8 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
              title="Upgrade to Pro"
            >
              <Crown className="size-4" />
            </button>
          )}
        </div>

        {/* Last Synced Indicator */}
        <div className="group-data-[collapsible=icon]:hidden mt-2">
          <LastSynced caseId={activeCaseId} compact />
        </div>
        <div className="group-data-[collapsible=icon]:hidden mt-2">
          <p className="text-[10px] text-muted-foreground text-center leading-tight">
            v1.11.0 · Every step brings you closer
            <br />
            to your kids
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
