import { describe, expect, it } from 'vitest'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import { createBreakpoint, reorderBreakpoint, resetNodeBreakpointOverride, updateBreakpoint } from './breakpoint-engine'
import { parseBreakpointId, parseDocumentId, parseNodeId } from './identity'
import { ProjectStructureSchema } from './structure-schema'

const DOCUMENT_ID = parseDocumentId('dddddddd-dddd-4ddd-8ddd-dddddddddddd')
const NODE_ID = parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const CUSTOM_ID = parseBreakpointId('77777777-7777-4777-8777-777777777777')

function structure() {
  const mobileId = DEFAULT_BREAKPOINTS[4]?.id
  if (!mobileId) throw new Error('Falta breakpoint móvil.')
  return ProjectStructureSchema.parse({
    breakpoints: DEFAULT_BREAKPOINTS,
    documents: {
      [DOCUMENT_ID]: {
        id: DOCUMENT_ID,
        kind: 'page',
        name: 'Inicio',
        nodes: {
          [NODE_ID]: {
            bindings: {}, conditions: [], hidden: false, id: NODE_ID, kind: 'widget', locked: false,
            name: 'Contenedor', properties: {}, responsive: { [mobileId]: { properties: {}, styles: { gap: 8 } } },
            slots: {}, styles: {}, widgetType: 'layout.container',
          },
        },
        rootNodeIds: [NODE_ID],
      },
    },
    globalComponents: {},
  })
}

describe('M07.4 motor canónico de breakpoints', () => {
  it('crea, edita y ordena breakpoints sin mutar la estructura de entrada', () => {
    const source = structure()
    const created = createBreakpoint(source, CUSTOM_ID, {
      inheritsFrom: DEFAULT_BREAKPOINTS[3]?.id ?? null,
      name: 'Móvil intermedio', orientation: 'portrait', width: 600,
    }, 4)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(source.breakpoints).toHaveLength(6)
    expect(created.value.breakpoints[4]?.id).toBe(CUSTOM_ID)

    const updated = updateBreakpoint(created.value, CUSTOM_ID, { name: 'Móvil personalizado', width: 640 })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.breakpoints.find((item) => item.id === CUSTOM_ID)).toMatchObject({ name: 'Móvil personalizado', width: 640 })

    const reordered = reorderBreakpoint(updated.value, CUSTOM_ID, 1)
    expect(reordered.ok).toBe(true)
    if (!reordered.ok) return
    expect(reordered.value.breakpoints[1]?.id).toBe(CUSTOM_ID)
  })

  it('rechaza padres inexistentes, autoreferencia y ciclos', () => {
    const source = structure()
    expect(createBreakpoint(source, CUSTOM_ID, { inheritsFrom: CUSTOM_ID, name: 'Inválido', orientation: 'any', width: 900 }).ok).toBe(false)
    const first = DEFAULT_BREAKPOINTS[0]
    const last = DEFAULT_BREAKPOINTS.at(-1)
    if (!first || !last) throw new Error('Faltan breakpoints base.')
    expect(updateBreakpoint(source, first.id, { inheritsFrom: last.id }).ok).toBe(false)
  })

  it('restablece solo el override solicitado y respeta nodos bloqueados', () => {
    const source = structure()
    const mobileId = DEFAULT_BREAKPOINTS[4]?.id
    if (!mobileId) throw new Error('Falta breakpoint móvil.')
    const reset = resetNodeBreakpointOverride(source, { documentId: DOCUMENT_ID, kind: 'document' }, NODE_ID, mobileId)
    expect(reset.ok).toBe(true)
    if (!reset.ok) return
    expect(reset.value.documents[DOCUMENT_ID]?.nodes[NODE_ID]?.responsive).toEqual({})
    expect(source.documents[DOCUMENT_ID]?.nodes[NODE_ID]?.responsive[mobileId]).toBeDefined()

    const locked = structuredClone(source)
    const node = locked.documents[DOCUMENT_ID]?.nodes[NODE_ID]
    if (node) node.locked = true
    expect(resetNodeBreakpointOverride(locked, { documentId: DOCUMENT_ID, kind: 'document' }, NODE_ID, mobileId)).toMatchObject({ ok: false })
  })
})
