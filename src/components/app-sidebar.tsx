'use client'

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
  Sparkles,
  HardDriveDownload,
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
import { useSubscriptionStore } from '@/lib/subscription'
import { ProBadge } from '@/components/pro-badge'
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
import { toast } from 'sonner'

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
      { view: 'go-pro', label: 'Upgrade to Pro', icon: Sparkles },
    ],
  },
]

export function AppSidebar() {
  const { activeView, setActiveView, activeCaseId, setActiveCaseId } = useAppStore()
  const { data: cases } = useCases()
  const deleteMutation = useDeleteCase()
  const { tier, setUpgradeDialogOpen } = useSubscriptionStore()
  const isPro = tier === 'pro'

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
                <span className="truncate font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  {isPro ? 'Reunify Pro' : 'Reunify'}
                  {isPro && <ProBadge />}
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
                {group.items
                  .filter((item) => item.view !== 'go-pro' || !isPro)
                  .map((item) => (
                  <SidebarMenuItem key={item.view}>
                    <SidebarMenuButton
                      isActive={activeView === item.view}
                      onClick={() => setActiveView(item.view)}
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
        {!isPro && (
          <div className="group-data-[collapsible=icon]:hidden mt-2">
            <Button
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0 h-9"
              size="sm"
              onClick={() => setUpgradeDialogOpen(true)}
            >
              <Sparkles className="size-4" />
              Upgrade to Pro
            </Button>
          </div>
        )}
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
        <div className="group-data-[collapsible=icon]:hidden mt-2">
          <p className="text-[10px] text-muted-foreground text-center leading-tight">
            Every step brings you closer
            <br />
            to your kids
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
