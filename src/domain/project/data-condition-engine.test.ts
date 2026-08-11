import { describe, expect, it } from 'vitest'
import { DEFAULT_BREAKPOINTS } from './default-breakpoints'
import { resolveNodeDataState, setNodeDataSettings } from './data-condition-engine'
import { parseDocumentId, parseNodeId } from './identity'
import { ProjectStructureSchema } from './structure-schema'

const DOCUMENT_ID = parseDocumentId('dddddddd-dddd-4ddd-8ddd-dddddddddddd')
const SOURCE_ID = parseNodeId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const TARGET_ID = parseNodeId('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')

function structure() {
  return ProjectStructureSchema.parse({
    breakpoints: DEFAULT_BREAKPOINTS,
    documents: {
      [DOCUMENT_ID]: {
        id: DOCUMENT_ID, kind: 'page', name: 'Inicio', rootNodeIds: [SOURCE_ID, TARGET_ID],
        nodes: {
          [SOURCE_ID]: { bindings: {}, conditions: [], hidden: false, id: SOURCE_ID, kind: 'widget', locked: false, name: 'Fuente', properties: { text: 'Origen', value: 12 }, responsive: {}, slots: {}, styles: {}, widgetType: 'content.text' },
          [TARGET_ID]: { bindings: {}, conditions: [], hidden: false, id: TARGET_ID, kind: 'widget', locked: false, name: 'Destino', properties: { text: 'Base' }, responsive: {}, slots: {}, styles: {}, widgetType: 'content.text' },
        },
      },
    },
    globalComponents: {},
  })
}

describe('M07.5 motor de datos, condiciones y accesibilidad', () => {
  it('resuelve bindings literales, rutas de proyecto y propiedades de nodo', () => {
    const source = structure()
    const target = source.documents[DOCUMENT_ID]?.nodes[TARGET_ID]
    if (!target) throw new Error('Falta nodo destino.')
    target.bindings = {
      label: { kind: 'project-path', path: ['documents', DOCUMENT_ID, 'name'] },
      text: { kind: 'node-property', nodeId: SOURCE_ID, path: ['properties', 'text'] },
      tone: { kind: 'literal', value: 'accent' },
    }
    const resolved = resolveNodeDataState(source, target, target.properties)
    expect(resolved.properties).toMatchObject({ label: 'Inicio', text: 'Origen', tone: 'accent' })
    expect(resolved.diagnostics).toEqual([])
  })

  it('evalúa grupos all/any/negate y falla visible cuando existe un diagnóstico', () => {
    const source = structure()
    const target = source.documents[DOCUMENT_ID]?.nodes[TARGET_ID]
    if (!target) throw new Error('Falta nodo destino.')
    target.conditions = [{
      negate: false, operator: 'all', predicates: [{ operator: 'greater-than', source: { kind: 'node-property', nodeId: SOURCE_ID, path: ['properties', 'value'] }, value: 20 }],
    }]
    expect(resolveNodeDataState(source, target, target.properties).visible).toBe(false)
    target.conditions = [{ negate: false, operator: 'all', predicates: [{ operator: 'contains', source: { kind: 'literal', value: 5 }, value: 'x' }] }]
    const invalid = resolveNodeDataState(source, target, target.properties)
    expect(invalid.visible).toBe(true)
    expect(invalid.diagnostics[0]?.code).toBe('invalid-comparison')
  })

  it('valida, aplica y restablece una configuración estructurada sin mutar el input', () => {
    const source = structure()
    const updated = setNodeDataSettings(source, { documentId: DOCUMENT_ID, kind: 'document' }, TARGET_ID, {
      accessibility: { label: 'Resumen', role: 'region', tabIndex: 0 },
      bindings: { text: { kind: 'literal', value: 'Vinculado' } },
      conditions: [],
    })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.documents[DOCUMENT_ID]?.nodes[TARGET_ID]).toMatchObject({ accessibility: { label: 'Resumen', role: 'region', tabIndex: 0 } })
    expect(source.documents[DOCUMENT_ID]?.nodes[TARGET_ID]?.accessibility).toBeUndefined()

    const unsafe = setNodeDataSettings(source, { documentId: DOCUMENT_ID, kind: 'document' }, TARGET_ID, {
      accessibility: { role: 'button' }, bindings: {}, conditions: [],
    })
    expect(unsafe.ok).toBe(false)
  })
})
