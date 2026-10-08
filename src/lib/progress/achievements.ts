export interface ProgressCounts {
  dreamsTotal: number;
  dreamsRealized: number;
  objectivesDefined: number;
  actionsCompleted: number;
  longestHabitStreak: number;
  activeDays: number;
  boardItems: number;
  capsulesSealed: number;
  affirmationDays: number;
  gratitudeDays: number;
  projectsStarted: number;
  projectsCompleted: number;
  spiritDays: number;
  lessonsDone: number;
  financeItems: number;
}

export interface AchievementDefinition {
  id: string;
  target: number;
  value: (counts: ProgressCounts) => number;
}

export interface Achievement {
  id: string;
  current: number;
  target: number;
  unlocked: boolean;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "firstDream", target: 1, value: (c) => c.dreamsTotal },
  { id: "dreamRealized", target: 1, value: (c) => c.dreamsRealized },
  { id: "fourHorizons", target: 4, value: (c) => c.objectivesDefined },
  { id: "firstStep", target: 1, value: (c) => c.actionsCompleted },
  { id: "tenSteps", target: 10, value: (c) => c.actionsCompleted },
  { id: "fiftySteps", target: 50, value: (c) => c.actionsCompleted },
  { id: "habitWeek", target: 7, value: (c) => c.longestHabitStreak },
  { id: "habitMonth", target: 30, value: (c) => c.longestHabitStreak },
  { id: "tenActiveDays", target: 10, value: (c) => c.activeDays },
  { id: "thirtyActiveDays", target: 30, value: (c) => c.activeDays },
  { id: "firstBoardItem", target: 1, value: (c) => c.boardItems },
  { id: "tenBoardItems", target: 10, value: (c) => c.boardItems },
  { id: "firstCapsule", target: 1, value: (c) => c.capsulesSealed },
  { id: "weekOfAffirmations", target: 7, value: (c) => c.affirmationDays },
  { id: "weekOfGratitude", target: 7, value: (c) => c.gratitudeDays },
  { id: "firstProject", target: 1, value: (c) => c.projectsStarted },
  { id: "projectCompleted", target: 1, value: (c) => c.projectsCompleted },
  { id: "weekOfReflection", target: 7, value: (c) => c.spiritDays },
  { id: "firstLesson", target: 1, value: (c) => c.lessonsDone },
  { id: "tenLessons", target: 10, value: (c) => c.lessonsDone },
  { id: "firstFinancePlan", target: 1, value: (c) => c.financeItems },
];

/**
 * Conquistas são derivadas do histórico e nunca "se perdem": só existe
 * progresso para frente (current é sempre limitado ao alvo).
 */
export function evaluateAchievements(counts: ProgressCounts): Achievement[] {
  return ACHIEVEMENTS.map(({ id, target, value }) => {
    const raw = Math.max(0, value(counts));
    return { id, target, current: Math.min(raw, target), unlocked: raw >= target };
  });
}

/** Próximas conquistas: já iniciadas, da mais próxima de completar para a mais distante. */
export function nextAchievements(achievements: Achievement[], limit = 3): Achievement[] {
  return achievements
    .filter((a) => !a.unlocked && a.current > 0)
    .sort((a, b) => b.current / b.target - a.current / a.target)
    .slice(0, limit);
}

export interface ActivityDay {
  date: string;
  active: boolean;
}

/**
 * Últimas `weeks` semanas, terminando hoje, em ordem cronológica. Dias sem
 * atividade são apenas "vazios" — o mapa nunca marca falhas.
 */
export function buildActivityMap(
  activeDates: Iterable<string>,
  today: string,
  weeks = 12,
): ActivityDay[] {
  const active = new Set(activeDates);
  const end = Date.parse(`${today}T00:00:00.000Z`);
  const total = weeks * 7;

  return Array.from({ length: total }, (_, index) => {
    const date = new Date(end - (total - 1 - index) * 86_400_000)
      .toISOString()
      .slice(0, 10);
    return { date, active: active.has(date) };
  });
}
