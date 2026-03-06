import { Outlet } from '@tanstack/react-router'
import { BottomNav } from './BottomNav'

export function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-base)]">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
