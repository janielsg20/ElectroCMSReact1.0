import { describe, expect, it } from 'vitest'
import {
  compileCanonicalStyles,
  editableVisualStyles,
  mergeEditableVisualStyles,
  validateCanonicalStyles,
} from './style-engine'

describe('M07.3 motor de estilos canónico', () => {
  it('resuelve tokens heredados, fallback y propiedades CSS heredables', () => {
    const compiled = compileCanonicalStyles({
      color: { $token: 'color.accent' },
      paddingTop: { $token: 'spacing.compact' },
    }, {
      inheritedStyles: { color: '#111827', fontFamily: 'Inter, sans-serif', paddingLeft: 80 },
      tokens: {
        'color.accent': '#2563eb',
        'spacing.compact': { $token: 'spacing.sm' },
      },
    })

    expect(compiled.declarations).toMatchObject({
      boxSizing: 'border-box',
      color: '#2563eb',
      fontFamily: 'Inter, sans-serif',
      paddingTop: 8,
    })
    expect(compiled.declarations).not.toHaveProperty('paddingLeft')
    expect(compiled.diagnostics).toEqual([])
  })

  it('ordena clases, declaraciones y estados para una salida determinista', () => {
    const left = compileCanonicalStyles({
      $classes: ['card', 'featured', 'card'],
      $states: { hover: { color: '#ffffff', backgroundColor: '#2563eb' }, focusVisible: { outlineWidth: 2 } },
      color: '#111827',
      backgroundColor: '#ffffff',
    }, { scopeId: 'node-1' })
    const right = compileCanonicalStyles({
      backgroundColor: '#ffffff',
      color: '#111827',
      $states: { focusVisible: { outlineWidth: 2 }, hover: { backgroundColor: '#2563eb', color: '#ffffff' } },
      $classes: ['featured', 'card'],
    }, { scopeId: 'node-1' })

    expect(left.className).toBe('card featured')
    expect(left.cssText).toBe(right.cssText)
    expect(left.cssText).toContain('[data-style-scope="node-1"]:focus-visible{outline-width:2px}')
    expect(left.cssText).toContain('[data-style-scope="node-1"]:hover{background-color:#2563eb;color:#ffffff}')
  })

  it('descarta CSS peligroso, extensiones y estados no permitidos con diagnóstico', () => {
    const compiled = compileCanonicalStyles({
      $css: 'body{display:none}',
      $states: { visited: { color: 'red' } },
      backgroundColor: 'url(javascript:alert(1))',
      behavior: 'url(x.htc)',
    })

    expect(compiled.declarations).toEqual({ boxSizing: 'border-box' })
    expect(compiled.diagnostics.map((item) => item.code)).toEqual(expect.arrayContaining(['invalid-property', 'invalid-state', 'invalid-value']))
    expect(validateCanonicalStyles({ color: 'red;position:fixed' }).ok).toBe(false)
  })

  it('detecta ciclos de token y usa fallback sin ejecutar CSS inseguro', () => {
    const compiled = compileCanonicalStyles({ color: { $token: 'color.a', fallback: '#111827' } }, {
      tokens: {
        'color.a': { $token: 'color.b' },
        'color.b': { $token: 'color.a' },
      },
    })
    expect(compiled.declarations.color).toBe('#111827')
    expect(compiled.diagnostics).toContainEqual(expect.objectContaining({ code: 'token-cycle' }))
    expect(validateCanonicalStyles({ color: { $token: 'color.future', fallback: '#111827' } }).ok).toBe(true)
    expect(validateCanonicalStyles({ color: { $token: 'color.future' } }).ok).toBe(false)
    expect(validateCanonicalStyles({ color: 8 }).ok).toBe(false)
  })

  it('separa estilos visuales de la geometría administrada por el canvas', () => {
    const current = { color: '#111827', height: 120, paddingTop: 16, width: 320 }
    expect(editableVisualStyles(current)).toEqual({ color: '#111827' })
    expect(mergeEditableVisualStyles(current, { color: '#2563eb', opacity: 0.8 })).toEqual({
      color: '#2563eb',
      height: 120,
      opacity: 0.8,
      paddingTop: 16,
      width: 320,
    })
  })
})
