import { describe, expect, it } from 'vitest'
import { fitCanvas, stepCanvasZoom, updateCanvasPan } from './canvas-viewport'
import { DEFAULT_CANVAS_WORKSPACE } from './workspace-preferences'

describe('M05.5 modelo de viewport', () => {
  it('recorre niveles de zoom acotados y restaura fit', () => {
    expect(stepCanvasZoom(90, 1)).toBe(100)
    expect(stepCanvasZoom(90, -1)).toBe(75)
    expect(stepCanvasZoom(200, 1)).toBe(200)
    expect(fitCanvas({ ...DEFAULT_CANVAS_WORKSPACE, panX: 80, panY: -40, zoom: 150 })).toMatchObject({ panX: 0, panY: 0, zoom: 90 })
  })

  it('limita pan dentro de la región bidimensional', () => {
    expect(updateCanvasPan(DEFAULT_CANVAS_WORKSPACE, 5000, -5000)).toMatchObject({ panX: 2000, panY: -2000 })
  })
})
