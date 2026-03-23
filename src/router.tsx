import { createRouter, createRoute, createRootRoute, redirect } from '@tanstack/react-router'
import { RootLayout } from './presentation/layout/RootLayout'
import { lazy, Suspense } from 'react'

const DashboardPage = lazy(() => import('./presentation/pages/Dashboard').then(m => ({ default: m.Dashboard })))
const ActiveWorkoutPage = lazy(() => import('./presentation/pages/ActiveWorkout').then(m => ({ default: m.ActiveWorkoutPage })))
const ExercisesPage = lazy(() => import('./presentation/pages/Exercises').then(m => ({ default: m.ExercisesPage })))
const RoutinesPage = lazy(() => import('./presentation/pages/Routines').then(m => ({ default: m.RoutinesPage })))
const ProgressPage = lazy(() => import('./presentation/pages/Progress').then(m => ({ default: m.ProgressPage })))
const AchievementsPage = lazy(() => import('./presentation/pages/Achievements').then(m => ({ default: m.AchievementsPage })))
const SettingsPage = lazy(() => import('./presentation/pages/Settings').then(m => ({ default: m.SettingsPage })))
const MesocycleGeneratorPage = lazy(() => import('./presentation/pages/MesocycleGenerator').then(m => ({ default: m.MesocycleGeneratorPage })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function withSuspense(Component: React.ComponentType) {
  return () => (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: withSuspense(DashboardPage),
})

const workoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workout',
  component: withSuspense(ActiveWorkoutPage),
})

const exercisesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/exercises',
  component: withSuspense(ExercisesPage),
})

const routinesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/routines',
  component: withSuspense(RoutinesPage),
})

const progressRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/progress',
  component: withSuspense(ProgressPage),
})

const achievementsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/achievements',
  component: withSuspense(AchievementsPage),
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: withSuspense(SettingsPage),
})

const mesocycleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plan',
  component: withSuspense(MesocycleGeneratorPage),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  workoutRoute,
  exercisesRoute,
  routinesRoute,
  progressRoute,
  achievementsRoute,
  settingsRoute,
  mesocycleRoute,
])

export const router = createRouter({
  routeTree,
  basepath: '/test-claude',
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
