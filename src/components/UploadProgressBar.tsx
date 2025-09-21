'use client'

interface UploadProgressBarProps {
  progress: number
  isVisible: boolean
  label?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
}

export default function UploadProgressBar({ 
  progress, 
  isVisible, 
  label = 'Uploading...', 
  variant = 'default' 
}: UploadProgressBarProps) {
  if (!isVisible) return null

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-500'
      case 'error':
        return 'bg-red-500'
      case 'warning':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-gray-600 dark:text-gray-300 font-medium">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ease-out ${getVariantClasses()}`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  )
}