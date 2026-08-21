import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/api/queryClient'
import { setupInterceptors } from '@/api/interceptors'
import { router } from '@/routes/router'
import { Toaster } from '@/components/ui/Toaster'
import { SessionBootstrap } from '@/features/auth/components/SessionBootstrap'

setupInterceptors()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrap />
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  )
}
