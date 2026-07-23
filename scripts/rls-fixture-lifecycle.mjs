export function fixtureSnapshotDifferences(baseline, current) {
  const differences = []
  const categories = new Set([
    ...Object.keys(baseline?.counts ?? {}),
    ...Object.keys(current?.counts ?? {}),
  ])

  for (const category of [...categories].sort()) {
    const before = Number(baseline?.counts?.[category] ?? 0)
    const after = Number(current?.counts?.[category] ?? 0)
    if (before !== after) differences.push({ category, before, after })
  }

  for (const [category, identifiers] of Object.entries(current?.owned ?? {})) {
    if (Array.isArray(identifiers) && identifiers.length > 0) {
      differences.push({ category: `owned.${category}`, identifiers })
    }
  }
  return differences
}

export async function runWithFixtureLifecycle({ prepare, run, cleanup }) {
  let baseline
  let runError = null
  let result

  try {
    baseline = await prepare()
    result = await run(baseline)
  } catch (error) {
    runError = error
  }

  try {
    await cleanup(baseline)
  } catch (cleanupError) {
    if (runError) {
      throw new AggregateError([runError, cleanupError], 'Validation failed and fixture cleanup did not restore the baseline')
    }
    throw cleanupError
  }

  if (runError) throw runError
  return result
}
