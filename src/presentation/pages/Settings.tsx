import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getContainer } from '@/infrastructure/container/DIContainer'
import { Button } from '@/presentation/design-system/components/Button'
import { cn } from '@/shared/utils/cn'
import { APP_VERSION } from '@/shared/version'

function SettingRow({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-[var(--color-border)] last:border-0">
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
        {description && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function APIKeyInput({ label, storageKey }: { label: string; storageKey: string }) {
  const [value, setValue] = useState(() => localStorage.getItem(storageKey) ?? '')
  const [visible, setVisible] = useState(false)
  const [saved, setSaved] = useState(false)

  function save() {
    localStorage.setItem(storageKey, value)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-[var(--color-text-secondary)]">{label}</label>
      <div className="flex gap-2">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="sk-..."
          className="flex-1 bg-[var(--color-surface-03)] rounded-[var(--radius-md)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none transition-colors font-mono"
        />
        <button
          onClick={() => setVisible(v => !v)}
          className="px-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label={visible ? 'Ocultar' : 'Mostrar'}
        >
          {visible ? '🙈' : '👁️'}
        </button>
        <Button variant={saved ? 'secondary' : 'primary'} size="sm" onClick={save}>
          {saved ? '✓' : 'Guardar'}
        </Button>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const container = getContainer()
  const queryClient = useQueryClient()

  const { data: athlete } = useQuery({
    queryKey: ['athlete'],
    queryFn: () => container.athleteRepo.getDefault(),
  })

  const [name, setName] = useState(athlete?.name ?? '')
  const [unit, setUnit] = useState<'kg' | 'lb'>(athlete?.weightUnit ?? 'kg')

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!athlete) return
      athlete.updateSettings({ name: name || athlete.name, weightUnit: unit })
      await container.athleteRepo.save(athlete)
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['athlete'] }),
  })

  const exportData = async () => {
    if (!athlete) return
    const sessions = await container.workoutRepo.findByAthleteId(athlete.id, 1000)
    const routines = await container.routineRepo.findAll()
    const data = {
      athlete: athlete.toJSON(),
      sessions: sessions.map(s => s.toJSON()),
      routines: routines.map(r => r.toJSON()),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kova-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="pt-2">
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">Ajustes</h1>
      </div>

      {/* Profile */}
      <section className="space-y-1">
        <h2 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">Perfil</h2>
        <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-lg)] px-4">
          <SettingRow label="Nombre" description="Tu nombre de atleta">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-32 bg-[var(--color-surface-03)] rounded-[var(--radius-sm)] px-3 py-2 text-sm text-right text-[var(--color-text-primary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none"
            />
          </SettingRow>
          <SettingRow label="Unidad de peso" description="kg o libras">
            <div className="flex rounded-[var(--radius-sm)] overflow-hidden border border-[var(--color-border)]">
              {(['kg', 'lb'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={cn(
                    'px-4 py-1.5 text-sm font-semibold transition-colors',
                    unit === u ? 'bg-[var(--color-accent)] text-black' : 'bg-[var(--color-surface-03)] text-[var(--color-text-secondary)]'
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </SettingRow>
          <div className="py-4">
            <Button variant="primary" size="md" className="w-full" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </section>

      {/* AI Coach */}
      <section className="space-y-1">
        <h2 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">IA Coach</h2>
        <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-lg)] p-4 space-y-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Las claves de API se guardan localmente en tu navegador y nunca se envían a nuestros servidores.
            Obtén tu clave gratuita en{' '}
            <span className="text-[var(--color-accent)]">Google AI Studio</span>.
          </p>
          <APIKeyInput label="Gemini API Key (gratuita)" storageKey="kova_gemini_key" />
          <APIKeyInput label="Claude API Key (alternativa)" storageKey="kova_claude_key" />
        </div>
      </section>

      {/* Data */}
      <section className="space-y-1">
        <h2 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">Datos</h2>
        <div className="bg-[var(--color-surface-02)] rounded-[var(--radius-lg)] px-4">
          <SettingRow label="Exportar datos" description="Descarga tu historial completo en JSON">
            <Button variant="secondary" size="sm" onClick={() => void exportData()}>
              Exportar
            </Button>
          </SettingRow>
          <SettingRow label="Versión de app" description="Kova PWA">
            <span className="font-mono text-sm text-[var(--color-text-secondary)]">{APP_VERSION}</span>
          </SettingRow>
        </div>
      </section>

      {/* About */}
      <section className="text-center py-4 space-y-1">
        <p className="font-display text-2xl font-bold text-[var(--color-accent)]">Kova</p>
        <p className="text-xs text-[var(--color-text-muted)]">Entrena con intensidad</p>
        <p className="text-xs text-[var(--color-text-muted)]">100% offline · Datos locales · Sin suscripción</p>
      </section>

      <div className="h-4" />
    </div>
  )
}
