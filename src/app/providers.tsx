'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { BottomNav } from '@/components/layout/BottomNav'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <div className="min-h-screen pb-20">
          {children}
        </div>
        <BottomNav />
      </AuthGuard>
    </AuthProvider>
  )
}
