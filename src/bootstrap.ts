import { getDatabase } from './infrastructure/persistence/dexie/GymOSDatabase'
import { getContainer } from './infrastructure/container/DIContainer'
import { getSeedExercises } from './infrastructure/persistence/seed/exercises.seed'
import { getSeedRoutineTemplates } from './infrastructure/persistence/seed/routineTemplates.seed'
import { Athlete } from './domain/entities/Athlete'
import { Achievement, ALL_ACHIEVEMENTS } from './domain/entities/Achievement'

let initialized = false

export async function initializeApp(): Promise<void> {
  if (initialized) return
  initialized = true

  const container = getContainer()

  // Create default athlete if none exists
  const existingAthlete = await container.athleteRepo.getDefault()
  if (!existingAthlete) {
    const athlete = Athlete.create({ name: 'Atleta' })
    await container.athleteRepo.save(athlete)

    // Initialize all achievements as locked
    for (const achievementDef of ALL_ACHIEVEMENTS) {
      await container.athleteRepo.saveAchievement(athlete.id, Achievement.define(achievementDef))
    }
  }

  // Seed exercises if empty
  const exerciseCount = await container.exerciseRepo.count()
  if (exerciseCount === 0) {
    const exercises = getSeedExercises()
    await container.exerciseRepo.bulkSave(exercises)
    console.log(`Seeded ${exercises.length} exercises`)
  }

  // Seed routine templates if empty
  const templates = await container.routineRepo.findTemplates()
  if (templates.length === 0) {
    const routineTemplates = getSeedRoutineTemplates()
    for (const template of routineTemplates) {
      // Mark as template by saving with isTemplate=true
      const data = template.toJSON() as Record<string, unknown>
      data['isTemplate'] = true
      await getDatabase().routines.put({
        id: template.id,
        name: template.name,
        description: template.description,
        days: JSON.stringify(data),
        isTemplate: 1,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      })
    }
    console.log(`Seeded ${routineTemplates.length} routine templates`)
  }
}
