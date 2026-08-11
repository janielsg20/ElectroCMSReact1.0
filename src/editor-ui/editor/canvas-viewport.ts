import type { CanvasWorkspaceState } from './workspace-preferences'

export const CANVAS_ZOOM_STEPS = [25, 50, 75, 90, 100, 125, 150, 200] as const
export const CANVAS_PAN_LIMIT = 2000

export function clampCanvasZoom(zoom: number): number {
  return Math.min(200, Math.max(25, Math.round(zoom)))
}

export function stepCanvasZoom(current: number, direction: -1 | 1): number {
  const ordered = direction > 0 ? CANVAS_ZOOM_STEPS : [...CANVAS_ZOOM_STEPS].reverse()
  return ordered.find((step) => direction > 0 ? step > current : step < current) ?? current
}

export function updateCanvasPan(state: CanvasWorkspaceState, deltaX: number, deltaY: number): CanvasWorkspaceState {
  return {
    ...state,
    panX: Math.min(CANVAS_PAN_LIMIT, Math.max(-CANVAS_PAN_LIMIT, Math.round(state.panX + deltaX))),
    panY: Math.min(CANVAS_PAN_LIMIT, Math.max(-CANVAS_PAN_LIMIT, Math.round(state.panY + deltaY))),
  }
}

export function fitCanvas(state: CanvasWorkspaceState): CanvasWorkspaceState {
  return { ...state, panX: 0, panY: 0, zoom: 90 }
}
