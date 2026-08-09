import { BreakpointSchema, type Breakpoint } from './structure-schema'

const definitions = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Desktop',
    width: 1440,
    orientation: 'landscape',
    inheritsFrom: null,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Laptop',
    width: 1280,
    orientation: 'landscape',
    inheritsFrom: '11111111-1111-4111-8111-111111111111',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Tablet horizontal',
    width: 1024,
    orientation: 'landscape',
    inheritsFrom: '22222222-2222-4222-8222-222222222222',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Tablet vertical',
    width: 768,
    orientation: 'portrait',
    inheritsFrom: '33333333-3333-4333-8333-333333333333',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'Móvil grande',
    width: 480,
    orientation: 'portrait',
    inheritsFrom: '44444444-4444-4444-8444-444444444444',
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    name: 'Móvil pequeño',
    width: 320,
    orientation: 'portrait',
    inheritsFrom: '55555555-5555-4555-8555-555555555555',
  },
] as const

export const DEFAULT_BREAKPOINTS: readonly Breakpoint[] = Object.freeze(
  definitions.map((definition) => Object.freeze(BreakpointSchema.parse(definition))),
)
