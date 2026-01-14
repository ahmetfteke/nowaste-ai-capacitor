import { Camera, Image, PenLine } from 'lucide-react'
import type { CaptureMethodProps } from '../types'

interface MethodCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick?: () => void
  accent?: boolean
}

function MethodCard({ icon, title, description, onClick, accent }: MethodCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-5 rounded-xl text-left
        transition-all duration-150 ease-out
        bg-white dark:bg-slate-800/60
        border border-stone-200 dark:border-slate-700
        hover:border-stone-300 dark:hover:border-slate-600
        hover:shadow-sm
        ${accent ? 'ring-1 ring-emerald-600/20 dark:ring-emerald-400/20' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0
          ${accent
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300'
          }
        `}>
          {icon}
        </div>
        <div className="pt-0.5">
          <h3 className="text-base font-medium text-stone-900 dark:text-white mb-0.5">
            {title}
          </h3>
          <p className="text-sm text-stone-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </button>
  )
}

export function CaptureMethod({
  onCapturePhoto,
  onSelectFromGallery,
  onManualEntry,
}: CaptureMethodProps) {
  return (
    <div className="min-h-full bg-stone-50 dark:bg-slate-900">
      {/* Header Section */}
      <div className="px-5 pt-6 pb-5">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold text-stone-800 dark:text-white mb-1">
            Add Items
          </h1>
          <p className="text-sm text-stone-500 dark:text-slate-400">
            Snap a photo of your groceries or receipt, and we'll do the rest.
          </p>
        </div>
      </div>

      {/* Method Cards */}
      <div className="px-5 pb-6">
        <div className="max-w-md mx-auto space-y-3">
          <MethodCard
            icon={<Camera className="w-5 h-5" />}
            title="Take Photo"
            description="Photograph groceries or a receipt"
            onClick={onCapturePhoto}
            accent
          />

          <MethodCard
            icon={<Image className="w-5 h-5" />}
            title="Choose from Gallery"
            description="Select an existing photo"
            onClick={onSelectFromGallery}
          />

          <MethodCard
            icon={<PenLine className="w-5 h-5" />}
            title="Add Manually"
            description="Type in items yourself"
            onClick={onManualEntry}
          />
        </div>
      </div>

      {/* Helpful Tip */}
      <div className="px-5 pb-6">
        <div className="max-w-md mx-auto">
          <div className="bg-stone-100/80 dark:bg-slate-800/40 rounded-lg px-4 py-3">
            <p className="text-xs text-stone-500 dark:text-slate-400">
              <span className="font-medium text-stone-600 dark:text-slate-300">Tip:</span>{' '}
              Receipts work great for adding multiple items at once.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
