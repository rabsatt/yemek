import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500':
              variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500':
              variant === 'secondary',
            'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500':
              variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500':
              variant === 'danger',
          },
          {
            'text-sm px-3 py-1.5 min-h-[36px]': size === 'sm',
            'text-sm px-4 py-2 min-h-[44px]': size === 'md',
            'text-base px-6 py-3 min-h-[52px]': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
