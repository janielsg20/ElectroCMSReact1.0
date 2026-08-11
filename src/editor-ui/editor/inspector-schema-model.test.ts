import { describe, expect, it } from 'vitest'
import { createCompleteWidgetRegistry } from '../../domain'
import { STARTER_DOCUMENT_ID, STARTER_PROJECT_STRUCTURE, STARTER_SELECTED_NODE_ID } from './starter-project-structure'
import { generateInspectorSections, INSPECTOR_SECTION_ORDER } from './inspector-schema-model'

const registry = createCompleteWidgetRegistry()

describe('M07.1 modelo de inspector generado', () => {
  it('genera siempre las nueve secciones normativas en orden estable', () => {
    const node = STARTER_PROJECT_STRUCTURE.documents[STARTER_DOCUMENT_ID]?.nodes[STARTER_SELECTED_NODE_ID]
    const definition = registry.get('layout.container')
    if (!node || !definition) throw new Error('Falta el contenedor registrado.')
    const sections = generateInspectorSections(definition, node)
    expect(sections.map((section) => section.id)).toEqual(INSPECTOR_SECTION_ORDER)
    expect(sections.find((section) => section.id === 'layout')?.fields).toEqual([
      expect.objectContaining({ control: 'number', key: 'maxWidth', label: 'Ancho máximo', source: 'node', value: 1200 }),
    ])
  })

  it('distingue valores del nodo y defaults sin duplicar el schema', () => {
    const document = STARTER_PROJECT_STRUCTURE.documents[STARTER_DOCUMENT_ID]
    const source = document && Object.values(document.nodes).find((node) => node.kind === 'widget' && node.widgetType === 'content.heading')
    const definition = registry.get('content.heading')
    if (!source || !definition) throw new Error('Falta el título registrado.')
    const node = structuredClone(source)
    Reflect.deleteProperty(node.properties, 'level')
    const sections = generateInspectorSections(definition, node)
    const content = sections.find((section) => section.id === 'content')
    const accessibility = sections.find((section) => section.id === 'accessibility')
    expect(content?.fields[0]).toMatchObject({ key: 'text', source: 'node', value: 'Proyecto local' })
    expect(accessibility?.fields[0]).toMatchObject({ key: 'level', source: 'default', value: 2 })
  })
})
