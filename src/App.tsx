import { lazy, Suspense, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, Route, Routes } from 'react-router-dom'
import { TripsPage } from './pages/TripsPage'
import { UpdatePrompt } from './components/UpdatePrompt'
import { bootstrapCloudData } from './data/cloud'
import { getSupabase, hasSupabaseConfig } from './data/supabase'

const PlanPage = lazy(() => import('./pages/PlanPage').then((module) => ({ default: module.PlanPage })))
const SharedTripPage = lazy(() => import('./pages/SharedTripPage').then((module) => ({ default: module.SharedTripPage })))
const BudgetPage = lazy(() => import('./pages/BudgetPage'))
const BookingsPage = lazy(() => import('./pages/BookingsPage').then((module) => ({ default: module.BookingsPage })))
const MorePage = lazy(() => import('./pages/MorePage').then((module) => ({ default: module.MorePage })))

export function App() {
  return <><CloudBootstrap /><a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>Skip to main content</a><div id="main-content" tabIndex={-1}><Routes>
      <Route path="/" element={<TripsPage />} />
      <Route path="/trip/:tripId" element={<Suspense fallback={<PageSkeleton />}><PlanPage /></Suspense>} />
      <Route path="/trip/:tripId/day/:date" element={<Suspense fallback={<PageSkeleton />}><PlanPage /></Suspense>} />
      <Route path="/trip/:tripId/bookings" element={<Suspense fallback={<PageSkeleton />}><BookingsPage /></Suspense>} />
      <Route path="/trip/:tripId/budget" element={<Suspense fallback={<PageSkeleton />}><BudgetPage /></Suspense>} />
      <Route path="/trip/:tripId/more" element={<Suspense fallback={<PageSkeleton />}><MorePage /></Suspense>} />
      <Route path="/share/:shareToken" element={<Suspense fallback={<PageSkeleton />}><SharedTripPage /></Suspense>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></div><UpdatePrompt /></>
}

function CloudBootstrap() {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!hasSupabaseConfig()) return
    let active = true
    const run = async () => {
      try {
        await bootstrapCloudData()
        if (active) await queryClient.invalidateQueries()
      } catch (error) {
        console.error('Cloud bootstrap failed', error)
      }
    }
    void run()
    let unsubscribe: (() => void) | undefined
    void getSupabase().then((supabase) => {
      if (!supabase || !active) return
      const { data } = supabase.auth.onAuthStateChange(() => window.setTimeout(() => { void run() }, 0))
      unsubscribe = () => data.subscription.unsubscribe()
    })
    addEventListener('online', run)
    return () => { active = false; unsubscribe?.(); removeEventListener('online', run) }
  }, [queryClient])
  return null
}

function PageSkeleton() {
  return <main className="page-skeleton" aria-busy="true" aria-label="Loading trip"><div /><div /><div /></main>
}

function AuthCallback() {
  const returnHash = sessionStorage.getItem('roam-auth-return-hash')
  sessionStorage.removeItem('roam-auth-return-hash')
  const destination = returnHash?.startsWith('#/') ? returnHash.slice(1) : '/'
  return <Navigate to={destination} replace />
}
