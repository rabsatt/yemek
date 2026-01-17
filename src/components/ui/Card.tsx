import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive'
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-4',
        variant === 'interactive' && 'hover:border-primary-300 hover:shadow-sm cursor-pointer transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
