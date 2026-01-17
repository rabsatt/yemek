import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  className?: string
  children?: React.ReactNode
}

export function Header({ title, subtitle, className, children }: HeaderProps) {
  return (
    <header className={cn('bg-white border-b border-gray-200 px-4 py-4', className)}>
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    </header>
  )
}
