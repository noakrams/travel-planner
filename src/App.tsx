import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { TripsPage } from './pages/TripsPage'
import { UpdatePrompt } from './components/UpdatePrompt'
import { getNeon } from './data/neon'
import { CloudDataGate } from './components/CloudDataGate'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToastProvider } from '@/components/ui/toast'

const PlanPage = lazy(() => import('./pages/PlanPage').then((module) => ({ default: module.PlanPage })))
const SharedTripPage = lazy(() => import('./pages/SharedTripPage').then((module) => ({ default: module.SharedTripPage })))
const BudgetPage = lazy(() => import('./pages/BudgetPage'))
const BookingsPage = lazy(() => import('./pages/BookingsPage').then((module) => ({ default: module.BookingsPage })))
const MorePage = lazy(() => import('./pages/MorePage').then((module) => ({ default: module.MorePage })))
const MapPage = lazy(() => import('./pages/MapPage').then((module) => ({ default: module.MapPage })))

export function App() {
  return <TooltipProvider delayDuration={350}><ToastProvider><OAuthReturn /><a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>Skip to main content</a><div id="main-content" tabIndex={-1}><Routes>
      <Route path="/share/:shareToken" element={<Suspense fallback={<PageSkeleton />}><SharedTripPage /></Suspense>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<CloudDataGate><PrivateRoutes /></CloudDataGate>} />
    </Routes></div><UpdatePrompt /></ToastProvider></TooltipProvider>
}

function PrivateRoutes() {
  return <Routes>
      <Route path="/" element={<TripsPage />} />
      <Route path="/trip/:tripId" element={<Suspense fallback={<PageSkeleton />}><PlanPage /></Suspense>} />
      <Route path="/trip/:tripId/day/:date" element={<Suspense fallback={<PageSkeleton />}><PlanPage /></Suspense>} />
      <Route path="/trip/:tripId/bookings" element={<Suspense fallback={<PageSkeleton />}><BookingsPage /></Suspense>} />
      <Route path="/trip/:tripId/map" element={<Suspense fallback={<PageSkeleton />}><MapPage /></Suspense>} />
      <Route path="/trip/:tripId/budget" element={<Suspense fallback={<PageSkeleton />}><BudgetPage /></Suspense>} />
      <Route path="/trip/:tripId/more" element={<Suspense fallback={<PageSkeleton />}><MorePage /></Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
}

function OAuthReturn() {
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    if (params.get('auth') !== 'callback' || !code) return
    let active = true
    void getNeon().then(async (neon) => {
      if (!neon) return
      const { error } = await neon.auth.exchangeCodeForSession(code)
      if (!active) return
      if (error) console.error('Google sign-in callback failed', error)
      const returnHash = sessionStorage.getItem('roam-auth-return-hash')
      sessionStorage.removeItem('roam-auth-return-hash')
      history.replaceState({}, '', location.pathname)
      location.hash = returnHash?.startsWith('#/') ? returnHash : '#/'
    })
    return () => { active = false }
  }, [])
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
