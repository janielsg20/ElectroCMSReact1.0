import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { createBrowserEditorProjectSession } from './editor-project-session'
import { DEFAULT_BREAKPOINTS, parseDocumentId, parseMediaAssetId, parseRoleId, parseUserId, type Document } from './domain'
import { STARTER_SELECTED_NODE_ID } from './editor-ui/editor/starter-project-structure'

describe('M06.5 sesión canónica de inserción', () => {
  it('persiste recursos multimedia y los revierte mediante el Command Bus', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-media-test-${crypto.randomUUID()}`)
    const assetId = parseMediaAssetId('b2000000-0000-4000-8000-000000000001')
    const created = await session.createMediaAsset?.({ altText: '', byteSize: 1200, contentHash: 'b'.repeat(64), description: '', fileName: 'foto.jpg', folderId: null, height: 400, id: assetId, kind: 'image', mimeType: 'image/jpeg', name: 'Foto', starred: false, tagIds: [], width: 600 })
    expect(created?.ok).toBe(true)
    expect(session.store.structure.media?.assets[assetId]?.name).toBe('Foto')
    expect((await session.undo()).ok).toBe(true)
    expect(session.store.structure.media?.assets[assetId]).toBeUndefined()
  })

  it('guarda y recupera el binario multimedia localmente', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-media-blob-test-${crypto.randomUUID()}`)
    const assetId = parseMediaAssetId('b3000000-0000-4000-8000-000000000001')
    const imported = await session.importMediaAsset?.({ altText: '', byteSize: 12, contentHash: 'd'.repeat(64), description: '', fileName: 'archivo.txt', folderId: null, height: null, id: assetId, kind: 'document', mimeType: 'text/plain', name: 'Archivo', starred: false, tagIds: [], width: null }, 'data:text/plain;base64,SG9sYQ==')
    expect(imported?.ok).toBe(true)
    const data = await session.readMediaAssetData?.(assetId)
    expect(data).toEqual({ ok: true, value: 'data:text/plain;base64,SG9sYQ==' })
  })

  it('mantiene una miniatura local separada del binario original', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-media-thumbnail-test-${crypto.randomUUID()}`)
    const assetId = parseMediaAssetId('b3000000-0000-4000-8000-000000000002')
    const imported = await session.importMediaAsset?.({ altText: '', byteSize: 12, contentHash: 'f'.repeat(64), description: '', fileName: 'foto.png', folderId: null, height: 80, id: assetId, kind: 'image', mimeType: 'image/png', name: 'Foto', starred: false, tagIds: [], variants: { thumbnail: { byteSize: 4, height: 40, mimeType: 'image/png', width: 40 } }, width: 80 }, 'data:image/png;base64,T1JJR0lOQUw=', { thumbnail: 'data:image/png;base64,VEhVTUI=' })
    expect(imported?.ok).toBe(true)
    expect(await session.readMediaAssetData?.(assetId)).toEqual({ ok: true, value: 'data:image/png;base64,T1JJR0lOQUw=' })
    expect(await session.readMediaAssetData?.(assetId, 'thumbnail')).toEqual({ ok: true, value: 'data:image/png;base64,VEhVTUI=' })
  })

  it('registra actor, acción y rutas de cambio para exportar la auditoría', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-audit-test-${crypto.randomUUID()}`)
    session.setAuditActor?.({ kind: 'person', label: 'Ana', userId: parseUserId('a4000000-0000-4000-8000-000000000001') })
    expect((await session.updateWidgetProperty(STARTER_SELECTED_NODE_ID, 'maxWidth', 960)).ok).toBe(true)
    const entries = await session.listAuditEntries?.()
    expect(entries?.ok).toBe(true)
    if (!entries?.ok) return
    expect(entries.value[0]).toMatchObject({ action: 'execute', actor: { kind: 'person', label: 'Ana' }, commandIds: ['inspector.update-property'] })
    expect(entries.value[0]?.changes.some((change) => change.path.includes('maxWidth'))).toBe(true)
    const exported = await session.exportAuditEntries?.()
    expect(exported?.ok).toBe(true)
    if (!exported?.ok) return
    expect(exported.value).toContain('electrocms.audit-log')
  })

  it('persiste una plantilla y sus condiciones por el Command Bus', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-template-engine-test-${crypto.randomUUID()}`)
    const document: Document = {
      conditions: [{ priority: 0, target: 'single' }],
      id: parseDocumentId('aaaaaaaa-1111-4111-8111-111111111111'),
      kind: 'single',
      name: 'Entrada predeterminada',
      nodes: {},
      rootNodeIds: [],
    }
    const created = await session.createDocument?.(document)
    expect(created?.ok).toBe(true)
    const updated = await session.updateDocumentConditions?.(document.id, [{ pathPrefix: '/blog', priority: 5, target: 'single' }])
    expect(updated?.ok).toBe(true)
    if (!updated?.ok) return
    expect(updated.value.documents[document.id]?.conditions[0]).toMatchObject({ pathPrefix: '/blog', priority: 5 })

    const undone = await session.undo()
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.value.documents[document.id]?.conditions[0]).toMatchObject({ priority: 0, target: 'single' })
  })

  it('selecciona un documento creado para abrirlo en el editor existente', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-document-selection-test-${crypto.randomUUID()}`)
    const document: Document = {
      conditions: [],
      id: parseDocumentId('bbbbbbbb-2222-4222-8222-222222222222'),
      kind: 'page',
      name: 'Acerca de nosotros',
      nodes: {},
      rootNodeIds: [],
      routePath: '/acerca',
    }
    const created = await session.createDocument?.(document)
    expect(created?.ok).toBe(true)

    let notified = 0
    const unsubscribe = session.subscribeDocumentSelection?.(() => { notified += 1 })
    session.selectDocument?.(document.id)

    expect(session.documentId).toBe(document.id)
    expect(notified).toBe(1)
    unsubscribe?.()
  })

  it('inserta dentro del contenedor seleccionado y deshace por el mismo Command Bus', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-widget-library-test-${crypto.randomUUID()}`)
    const before = session.store.structure.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.slots.content ?? []
    const inserted = await session.insertWidget('content.heading', STARTER_SELECTED_NODE_ID)
    if (!inserted.ok) throw new Error(inserted.error)
    const after = inserted.value.structure.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.slots.content ?? []
    expect(after).toHaveLength(before.length + 1)
    expect(after.at(-1)).toBe(inserted.value.nodeId)
    expect(inserted.value.structure.documents[session.documentId]?.nodes[inserted.value.nodeId]).toMatchObject({ name: 'Título H1–H6', widgetType: 'content.heading' })

    const undone = await session.undo()
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.value.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.slots.content).toEqual(before)
    expect(undone.value.documents[session.documentId]?.nodes[inserted.value.nodeId]).toBeUndefined()
  })

  it('rechaza IDs fuera del registro antes de escribir historial', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-widget-library-invalid-${crypto.randomUUID()}`)
    const inserted = await session.insertWidget('demo.inexistente', STARTER_SELECTED_NODE_ID)
    expect(inserted).toEqual({ ok: false, error: 'El widget demo.inexistente no está registrado.' })
  })

  it('valida, persiste, restablece y deshace propiedades del inspector', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-inspector-test-${crypto.randomUUID()}`)
    const invalid = await session.updateWidgetProperty(STARTER_SELECTED_NODE_ID, 'maxWidth', -1)
    expect(invalid.ok).toBe(false)
    expect(session.store.structure.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.properties.maxWidth).toBe(1200)

    const updated = await session.updateWidgetProperty(STARTER_SELECTED_NODE_ID, 'maxWidth', 960)
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.properties.maxWidth).toBe(960)

    const reset = await session.resetWidgetProperty(STARTER_SELECTED_NODE_ID, 'maxWidth')
    expect(reset.ok).toBe(true)
    if (!reset.ok) return
    expect(reset.value.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.properties).not.toHaveProperty('maxWidth')

    const undone = await session.undo()
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.value.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.properties.maxWidth).toBe(960)
  })

  it('valida estilos seguros, conserva geometría y revierte reset mediante historial', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-style-engine-test-${crypto.randomUUID()}`)
    const resized = await session.resizeNode(STARTER_SELECTED_NODE_ID, { height: 184, width: 456 })
    expect(resized.ok).toBe(true)

    const invalid = await session.updateNodeVisualStyles(STARTER_SELECTED_NODE_ID, { backgroundColor: 'url(javascript:alert(1))' })
    expect(invalid.ok).toBe(false)
    expect(session.store.structure.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.styles).toMatchObject({ height: 184, width: 456 })

    const updated = await session.updateNodeVisualStyles(STARTER_SELECTED_NODE_ID, {
      $classes: ['featured-card'],
      $states: { hover: { backgroundColor: '#2563eb', color: '#ffffff' } },
      borderRadius: { $token: 'radius.md' },
      opacity: 0.9,
    })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.styles).toMatchObject({
      $classes: ['featured-card'],
      height: 184,
      opacity: 0.9,
      width: 456,
    })

    const reset = await session.resetNodeVisualStyles(STARTER_SELECTED_NODE_ID)
    expect(reset.ok).toBe(true)
    if (!reset.ok) return
    expect(reset.value.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.styles).toEqual({ height: 184, width: 456 })

    const undone = await session.undo()
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.value.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.styles).toMatchObject({
      $classes: ['featured-card'],
      opacity: 0.9,
    })
  })

  it('persiste edición responsive, restablece overrides y deshace por el Command Bus', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-breakpoint-engine-test-${crypto.randomUUID()}`)
    const parentId = DEFAULT_BREAKPOINTS[3]?.id
    const mobileId = DEFAULT_BREAKPOINTS[4]?.id
    if (!parentId || !mobileId) throw new Error('Faltan breakpoints base.')

    const created = await session.createBreakpoint({ inheritsFrom: parentId, name: 'Custom 600', orientation: 'portrait', width: 600 }, 4)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const customId = created.value.breakpointId
    expect(created.value.structure.breakpoints[4]?.id).toBe(customId)

    const updated = await session.updateBreakpoint(customId, { name: 'Custom 640', width: 640 })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.breakpoints.find((item) => item.id === customId)).toMatchObject({ name: 'Custom 640', width: 640 })

    const reordered = await session.reorderBreakpoint(customId, 1)
    expect(reordered.ok).toBe(true)
    if (!reordered.ok) return
    expect(reordered.value.breakpoints[1]?.id).toBe(customId)

    const resized = await session.resizeNode(STARTER_SELECTED_NODE_ID, { height: 200, width: 360 }, mobileId)
    expect(resized.ok).toBe(true)
    const reset = await session.resetNodeBreakpointOverride(STARTER_SELECTED_NODE_ID, mobileId)
    expect(reset.ok).toBe(true)
    if (!reset.ok) return
    expect(reset.value.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.responsive[mobileId]).toBeUndefined()

    const undone = await session.undo()
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.value.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.responsive[mobileId]?.styles).toMatchObject({ height: 200, width: 360 })
  })

  it('valida, persiste y deshace datos, condiciones y accesibilidad', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-data-condition-test-${crypto.randomUUID()}`)
    const invalid = await session.updateNodeDataSettings(STARTER_SELECTED_NODE_ID, {
      accessibility: {}, bindings: { inexistente: { kind: 'literal', value: true } }, conditions: [],
    })
    expect(invalid).toMatchObject({ ok: false })

    const updated = await session.updateNodeDataSettings(STARTER_SELECTED_NODE_ID, {
      accessibility: { label: 'Región principal', role: 'region' },
      bindings: { maxWidth: { kind: 'literal', value: 960 } },
      conditions: [{ negate: false, operator: 'all', predicates: [{ operator: 'equals', source: { kind: 'literal', value: true }, value: true }] }],
    })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]).toMatchObject({ accessibility: { label: 'Región principal', role: 'region' } })
    expect(session.store.getNodeSnapshot(STARTER_SELECTED_NODE_ID, DEFAULT_BREAKPOINTS[0].id)?.responsive.properties.maxWidth).toBe(960)

    const reset = await session.resetNodeDataSettings(STARTER_SELECTED_NODE_ID)
    if (!reset.ok) throw new Error(reset.error)
    const undone = await session.undo()
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.value.documents[session.documentId]?.nodes[STARTER_SELECTED_NODE_ID]?.bindings.maxWidth).toMatchObject({ kind: 'literal', value: 960 })
  })

  it('persiste temas frontend/backend por separado y deshace por el Command Bus', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-theme-scope-test-${crypto.randomUUID()}`)
    const backendBefore = structuredClone(session.store.structure.themes.backend)
    const frontend = structuredClone(session.store.structure.themes.frontend)
    frontend.name = 'Frontend violeta'
    frontend.tokens.color.primary = '#7c3aed'

    const updated = await session.updateProjectTheme('frontend', frontend)
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    expect(updated.value.themes.frontend).toMatchObject({ name: 'Frontend violeta', tokens: { color: { primary: '#7c3aed' } } })
    expect(updated.value.themes.backend).toEqual(backendBefore)

    const reset = await session.resetProjectTheme('frontend')
    expect(reset.ok).toBe(true)
    const undone = await session.undo()
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.value.themes.frontend.tokens.color.primary).toBe('#7c3aed')
    expect(undone.value.themes.backend).toEqual(backendBefore)
  })

  it('persiste roles y permite deshacer su actualización por el Command Bus', async () => {
    const session = createBrowserEditorProjectSession(`electrocms-role-session-test-${crypto.randomUUID()}`)
    if (!session.createRole || !session.updateRole) throw new Error('La sesiÃ³n debe exponer la gestiÃ³n de roles.')
    const roleId = parseRoleId('c0000000-0000-4000-8000-000000000001')
    const created = await session.createRole({
      capabilities: ['content.manage'], contentTypes: {}, dashboardIds: [], fields: {}, id: roleId,
      name: 'Editor', routes: ['/admin/content'], slug: 'editor',
    })
    expect(created.ok).toBe(true)
    const updated = await session.updateRole(roleId, { name: 'Editor principal' })
    expect(updated).toMatchObject({ ok: true, value: { cms: { roles: { [roleId]: { name: 'Editor principal' } } } } })
    const undone = await session.undo()
    expect(undone).toMatchObject({ ok: true, value: { cms: { roles: { [roleId]: { name: 'Editor' } } } } })
  })
})
