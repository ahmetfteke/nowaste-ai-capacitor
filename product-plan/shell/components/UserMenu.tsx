import { useState } from 'react'
import { LogOut, Settings, ChevronDown } from 'lucide-react'

interface UserMenuProps {
  name: string
  avatarUrl?: string
  onLogout?: () => void
}

export function UserMenu({ name, avatarUrl, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors duration-150"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-slate-700 flex items-center justify-center">
            <span className="text-xs font-medium text-stone-600 dark:text-slate-300">
              {initials}
            </span>
          </div>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-stone-200 dark:border-slate-700 py-1 z-20">
            <div className="px-3 py-2 border-b border-stone-100 dark:border-slate-700">
              <p className="text-sm font-medium text-stone-800 dark:text-white">
                {name}
              </p>
            </div>
            <button
              onClick={() => {
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={() => {
                setIsOpen(false)
                onLogout?.()
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
