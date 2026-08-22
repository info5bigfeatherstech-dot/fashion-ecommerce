import { Suspense } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/api/queryClient'
import { setupInterceptors } from '@/api/interceptors'
import { router } from '@/routes/router'
import { Toaster } from '@/components/ui/Toaster'
import { PageLoader } from '@/components/ui/PageLoader'
import { SessionBootstrap } from '@/features/auth/components/SessionBootstrap'
import { AdminSessionBootstrap } from '@/features/admin/components/AdminSessionBootstrap'
import { SmoothScroll } from '@/components/motion/SmoothScroll'

setupInterceptors()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SmoothScroll />
      <SessionBootstrap />
      <AdminSessionBootstrap />
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
      <Toaster />
    </QueryClientProvider>
  )
}
