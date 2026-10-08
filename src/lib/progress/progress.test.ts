import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildActivityMap,
  evaluateAchievements,
  nextAchievements,
  type ProgressCounts,
} from "./achievements.ts";
import { longestStreak } from "../utils/streak.ts";

const empty: ProgressCounts = {
  dreamsTotal: 0,
  dreamsRealized: 0,
  objectivesDefined: 0,
  actionsCompleted: 0,
  longestHabitStreak: 0,
  activeDays: 0,
  boardItems: 0,
  capsulesSealed: 0,
  affirmationDays: 0,
  gratitudeDays: 0,
  projectsStarted: 0,
  projectsCompleted: 0,
  spiritDays: 0,
  lessonsDone: 0,
  financeItems: 0,
};

test("longestStreak: vazio, único, quebras e duplicatas", () => {
  assert.equal(longestStreak([]), 0);
  assert.equal(longestStreak(["2026-03-01"]), 1);
  assert.equal(longestStreak(["2026-03-01", "2026-03-02", "2026-03-04", "2026-03-05", "2026-03-06"]), 3);
  assert.equal(longestStreak(["2026-03-03", "2026-03-01", "2026-03-02", "2026-03-02"]), 3);
});

test("longestStreak: atravessa virada de mês e de ano", () => {
  assert.equal(longestStreak(["2026-02-27", "2026-02-28", "2026-03-01"]), 3);
  assert.equal(longestStreak(["2025-12-31", "2026-01-01"]), 2);
  assert.equal(longestStreak(["2028-02-28", "2028-02-29", "2028-03-01"]), 3);
});

test("conquistas: nada desbloqueado sem atividade", () => {
  const all = evaluateAchievements(empty);
  assert.ok(all.every((a) => !a.unlocked && a.current === 0));
});

test("conquistas: limites exatos desbloqueiam e o progresso é limitado ao alvo", () => {
  const byId = (c: ProgressCounts) => Object.fromEntries(evaluateAchievements(c).map((a) => [a.id, a]));

  let a = byId({ ...empty, actionsCompleted: 9 });
  assert.equal(a.tenSteps.unlocked, false);
  assert.equal(a.tenSteps.current, 9);
  assert.equal(a.firstStep.unlocked, true);

  a = byId({ ...empty, actionsCompleted: 10 });
  assert.equal(a.tenSteps.unlocked, true);

  a = byId({ ...empty, actionsCompleted: 500 });
  assert.equal(a.fiftySteps.current, 50);
  assert.equal(a.fiftySteps.unlocked, true);

  a = byId({ ...empty, longestHabitStreak: 6 });
  assert.equal(a.habitWeek.unlocked, false);
  a = byId({ ...empty, longestHabitStreak: 7 });
  assert.equal(a.habitWeek.unlocked, true);
  assert.equal(a.habitMonth.unlocked, false);

  a = byId({ ...empty, objectivesDefined: 3 });
  assert.equal(a.fourHorizons.unlocked, false);
  a = byId({ ...empty, objectivesDefined: 4 });
  assert.equal(a.fourHorizons.unlocked, true);
});

test("conquistas: valores negativos não geram progresso", () => {
  const a = evaluateAchievements({ ...empty, actionsCompleted: -3 });
  assert.ok(a.every((x) => x.current === 0));
});

test("próximas conquistas: só iniciadas, mais próximas primeiro, respeita o limite", () => {
  const next = nextAchievements(
    evaluateAchievements({ ...empty, actionsCompleted: 9, longestHabitStreak: 3, activeDays: 1, boardItems: 5 }),
    2,
  );
  assert.equal(next.length, 2);
  assert.equal(next[0].id, "tenSteps");
  assert.ok(next.every((x) => !x.unlocked && x.current > 0));
  assert.deepEqual(nextAchievements(evaluateAchievements(empty)), []);
});

test("mapa de atividade: 84 dias terminando hoje, em ordem, sem marcar falhas", () => {
  const map = buildActivityMap(["2026-10-01", "2026-09-30", "2026-01-01"], "2026-10-01");
  assert.equal(map.length, 84);
  assert.equal(map.at(-1)?.date, "2026-10-01");
  assert.equal(map[0].date, "2026-07-10");
  assert.deepEqual(map.filter((d) => d.active).map((d) => d.date), ["2026-09-30", "2026-10-01"]);
  assert.deepEqual(map.map((d) => d.date), [...map.map((d) => d.date)].sort());
});

test("conquistas de projeto: começar e concluir são independentes", () => {
  const byId = (c: ProgressCounts) => Object.fromEntries(evaluateAchievements(c).map((a) => [a.id, a]));

  let a = byId({ ...empty, projectsStarted: 1 });
  assert.equal(a.firstProject.unlocked, true);
  assert.equal(a.projectCompleted.unlocked, false);

  a = byId({ ...empty, projectsStarted: 2, projectsCompleted: 1 });
  assert.equal(a.projectCompleted.unlocked, true);
});

test("conquistas de aulas, espaço e finanças", () => {
  const a = Object.fromEntries(
    evaluateAchievements({ ...empty, lessonsDone: 10, spiritDays: 3, financeItems: 1 }).map((x) => [x.id, x]),
  );
  assert.equal(a.firstLesson.unlocked, true);
  assert.equal(a.tenLessons.unlocked, true);
  assert.equal(a.weekOfReflection.unlocked, false);
  assert.equal(a.weekOfReflection.current, 3);
  assert.equal(a.firstFinancePlan.unlocked, true);
});
