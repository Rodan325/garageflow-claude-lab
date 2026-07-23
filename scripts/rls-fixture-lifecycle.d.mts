export interface FixtureSnapshot {
  counts: Record<string, number>
  owned: Record<string, string[]>
}

export type FixtureDifference =
  | { category: string; before: number; after: number }
  | { category: string; identifiers: string[] }

export function fixtureSnapshotDifferences(
  baseline: FixtureSnapshot,
  current: FixtureSnapshot,
): FixtureDifference[]

export function runWithFixtureLifecycle<Result>(options: {
  prepare: () => Promise<FixtureSnapshot>
  run: (baseline: FixtureSnapshot) => Promise<Result>
  cleanup: (baseline: FixtureSnapshot) => Promise<void>
}): Promise<Result>
