import { MainNav } from './MainNav'
import { UserMenu } from './UserMenu'

export interface NavigationItem {
  label: string
  href: string
  icon: 'camera' | 'package' | 'bell'
  isActive?: boolean
}

export interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavigationItem[]
  user?: { name: string; avatarUrl?: string }
  appName?: string
  onNavigate?: (href: string) => void
  onLogout?: () => void
}

export function AppShell({
  children,
  navigationItems,
  user,
  appName = 'No Waste AI',
  onNavigate,
  onLogout,
}: AppShellProps) {
  return (
    <div className="flex flex-col h-screen bg-stone-50 dark:bg-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-700/50">
        <h1 className="text-base font-medium text-stone-800 dark:text-white">
          {appName}
        </h1>
        {user && (
          <UserMenu
            name={user.name}
            avatarUrl={user.avatarUrl}
            onLogout={onLogout}
          />
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <MainNav
        items={navigationItems}
        onNavigate={onNavigate}
      />
    </div>
  )
}
