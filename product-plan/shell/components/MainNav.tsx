import { Camera, Package, Bell, Circle } from 'lucide-react'
import type { NavigationItem } from './AppShell'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  camera: Camera,
  package: Package,
  bell: Bell,
}

interface MainNavProps {
  items: NavigationItem[]
  onNavigate?: (href: string) => void
}

export function MainNav({ items, onNavigate }: MainNavProps) {
  return (
    <nav className="flex items-center justify-around bg-white dark:bg-slate-800/80 border-t border-stone-200 dark:border-slate-700/50 px-2 py-2">
      {items.map((item) => {
        const Icon = iconMap[item.icon] || Circle
        return (
          <button
            key={item.href}
            onClick={() => onNavigate?.(item.href)}
            className={`
              flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg
              transition-colors duration-150
              ${
                item.isActive
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-stone-400 hover:text-stone-600 dark:text-slate-500 dark:hover:text-slate-300'
              }
            `}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
