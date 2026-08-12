import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const reportPath = resolve('browser-audit/report.json')
const report = JSON.parse(readFileSync(reportPath, 'utf8'))
const touchFailures = (report.states ?? []).flatMap((state) => {
  if (!state?.viewport?.touch) return []
  return (state.mobileTargetsUnder44 ?? []).map((target) => ({
    height: target.effectiveHeight ?? target.height,
    label: state.label,
    name: target.name,
    width: target.effectiveWidth ?? target.width,
  }))
})

if (touchFailures.length > 0) {
  console.error('Browser audit: hay targets táctiles menores de 44×44 CSS px.')
  for (const target of touchFailures) {
    console.error(`- ${target.label}: ${target.name} (${target.width}×${target.height})`)
  }
  process.exitCode = 1
} else {
  console.log('Browser audit touch gate: 0 targets menores de 44×44 CSS px.')
}
