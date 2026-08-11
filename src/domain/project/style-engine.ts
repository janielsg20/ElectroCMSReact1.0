import { failure, success, type Result } from '../common/result'
import type { JsonValue } from './project-envelope'

export const STYLE_CLASSES_KEY = '$classes'
export const STYLE_STATES_KEY = '$states'

export const CANONICAL_GEOMETRY_STYLE_KEYS = [
  'height',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'width',
] as const

export const CANONICAL_STYLE_STATES = ['hover', 'focus', 'focusVisible', 'active', 'disabled'] as const

export type CanonicalStyleState = typeof CANONICAL_STYLE_STATES[number]
export type CanonicalStyleMap = Readonly<Record<string, JsonValue>>
export type StyleTokenMap = Readonly<Record<string, JsonValue>>

export interface StyleEngineDiagnostic {
  readonly code:
    | 'invalid-class'
    | 'invalid-property'
    | 'invalid-scope'
    | 'invalid-state'
    | 'invalid-token'
    | 'invalid-value'
    | 'token-cycle'
    | 'token-not-found'
  readonly message: string
  readonly path: readonly string[]
  readonly severity: 'error' | 'warning'
}

export interface CompiledCanonicalStyles {
  readonly className: string
  readonly classes: readonly string[]
  readonly cssText: string
  readonly declarations: Readonly<Record<string, number | string>>
  readonly diagnostics: readonly StyleEngineDiagnostic[]
  readonly scopeId: string
  readonly stateCssText: string
  readonly states: Readonly<Partial<Record<CanonicalStyleState, Readonly<Record<string, number | string>>>>>
}

export interface CompileCanonicalStylesOptions {
  readonly inheritedStyles?: CanonicalStyleMap
  readonly scopeId?: string
  readonly tokens?: StyleTokenMap
}

interface TokenReference {
  readonly $token: string
  readonly fallback?: number | string
}

const TOKEN_ID_PATTERN = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/
const CLASS_NAME_PATTERN = /^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/
const SCOPE_ID_PATTERN = /^[A-Za-z0-9_-]{1,160}$/
const DANGEROUS_CSS_VALUE = /(?:url\s*\(|expression\s*\(|javascript\s*:|data\s*:|-moz-binding|behavior\s*:|[;{}@])/i

const STYLE_PROPERTIES = new Set([
  'alignContent', 'alignItems', 'alignSelf', 'aspectRatio',
  'backgroundColor',
  'borderBottomColor', 'borderBottomLeftRadius', 'borderBottomRightRadius', 'borderBottomStyle', 'borderBottomWidth',
  'borderColor', 'borderLeftColor', 'borderLeftStyle', 'borderLeftWidth', 'borderRadius', 'borderRightColor',
  'borderRightStyle', 'borderRightWidth', 'borderStyle', 'borderTopColor', 'borderTopLeftRadius',
  'borderTopRightRadius', 'borderTopStyle', 'borderTopWidth', 'borderWidth', 'bottom', 'boxShadow', 'boxSizing',
  'color', 'columnGap', 'cursor', 'display', 'flex', 'flexBasis', 'flexDirection', 'flexGrow', 'flexShrink',
  'flexWrap', 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'gap', 'gridAutoColumns', 'gridAutoFlow',
  'gridAutoRows', 'gridColumn', 'gridRow', 'gridTemplateColumns', 'gridTemplateRows', 'height', 'inset',
  'justifyContent', 'justifyItems', 'justifySelf', 'left', 'letterSpacing', 'lineHeight', 'margin', 'marginBottom',
  'marginLeft', 'marginRight', 'marginTop', 'maxHeight', 'maxWidth', 'minHeight', 'minWidth', 'objectFit',
  'opacity', 'order', 'outlineColor', 'outlineOffset', 'outlineStyle', 'outlineWidth', 'overflow', 'overflowX',
  'overflowY', 'padding', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingTop', 'placeContent',
  'placeItems', 'placeSelf', 'position', 'right', 'rowGap', 'textAlign', 'textDecoration', 'textOverflow',
  'textTransform', 'top', 'transform', 'transformOrigin', 'transitionDuration', 'transitionProperty',
  'verticalAlign', 'visibility', 'whiteSpace', 'width', 'wordBreak', 'zIndex',
])

const INHERITED_STYLE_PROPERTIES = new Set([
  'color', 'cursor', 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'letterSpacing', 'lineHeight',
  'textAlign', 'textDecoration', 'textTransform', 'visibility', 'whiteSpace', 'wordBreak',
])

const UNITLESS_PROPERTIES = new Set([
  'flexGrow', 'flexShrink', 'fontWeight', 'lineHeight', 'opacity', 'order', 'zIndex',
])

const NUMERIC_STYLE_PROPERTIES = new Set([
  'aspectRatio', 'borderBottomLeftRadius', 'borderBottomRightRadius', 'borderBottomWidth', 'borderLeftWidth',
  'borderRadius', 'borderRightWidth', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderTopWidth', 'borderWidth',
  'bottom', 'columnGap', 'flex', 'flexBasis', 'flexGrow', 'flexShrink', 'fontSize', 'fontWeight', 'gap', 'gridColumn',
  'gridRow', 'height', 'inset', 'left', 'letterSpacing', 'lineHeight', 'margin', 'marginBottom', 'marginLeft',
  'marginRight', 'marginTop', 'maxHeight', 'maxWidth', 'minHeight', 'minWidth', 'opacity', 'order', 'outlineOffset',
  'outlineWidth', 'padding', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingTop', 'right', 'rowGap', 'top',
  'width', 'zIndex',
])

const STATE_SELECTORS: Record<CanonicalStyleState, readonly string[]> = {
  active: [':active'],
  disabled: [':disabled', '[aria-disabled="true"]'],
  focus: [':focus'],
  focusVisible: [':focus-visible'],
  hover: [':hover'],
}

export const CORE_STYLE_TOKENS: StyleTokenMap = Object.freeze({
  'duration.fast': '150ms',
  'duration.normal': '250ms',
  'radius.full': 9999,
  'radius.lg': 12,
  'radius.md': 8,
  'radius.none': 0,
  'radius.sm': 4,
  'spacing.lg': 24,
  'spacing.md': 16,
  'spacing.none': 0,
  'spacing.sm': 8,
  'spacing.xl': 32,
  'spacing.xs': 4,
})

function diagnostic(
  diagnostics: StyleEngineDiagnostic[],
  code: StyleEngineDiagnostic['code'],
  message: string,
  path: readonly string[],
  severity: StyleEngineDiagnostic['severity'] = 'error',
): void {
  diagnostics.push({ code, message, path, severity })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTokenReference(value: unknown): value is TokenReference {
  if (!isRecord(value)) return false
  const keys = Object.keys(value)
  return keys.every((key) => key === '$token' || key === 'fallback')
    && typeof value.$token === 'string'
    && (value.fallback === undefined || typeof value.fallback === 'string' || typeof value.fallback === 'number')
}

function safePrimitive(
  value: unknown,
  property: string,
  diagnostics: StyleEngineDiagnostic[],
  path: readonly string[],
): number | string | null {
  if (typeof value === 'number') {
    if (Number.isFinite(value) && Math.abs(value) <= 1_000_000) return value
    diagnostic(diagnostics, 'invalid-value', `El valor numérico de ${property} no es finito o excede el límite seguro.`, path)
    return null
  }
  if (typeof value !== 'string') {
    diagnostic(diagnostics, 'invalid-value', `${property} solo admite texto, número o referencia de token.`, path)
    return null
  }
  const trimmed = value.trim()
  const hasControlCharacter = [...trimmed].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
  if (trimmed.length === 0 || trimmed.length > 512 || DANGEROUS_CSS_VALUE.test(trimmed) || hasControlCharacter) {
    diagnostic(diagnostics, 'invalid-value', `El valor CSS de ${property} no es seguro.`, path)
    return null
  }
  return trimmed
}

function resolveToken(
  tokenId: string,
  fallback: number | string | undefined,
  tokens: StyleTokenMap,
  diagnostics: StyleEngineDiagnostic[],
  path: readonly string[],
  stack: readonly string[] = [],
): number | string | null {
  if (!TOKEN_ID_PATTERN.test(tokenId)) {
    diagnostic(diagnostics, 'invalid-token', `El token ${tokenId} no usa un ID válido.`, path)
    return fallback === undefined ? null : safePrimitive(fallback, tokenId, diagnostics, path)
  }
  if (stack.includes(tokenId)) {
    diagnostic(diagnostics, 'token-cycle', `La herencia de tokens contiene un ciclo en ${tokenId}.`, path, fallback === undefined ? 'error' : 'warning')
    return fallback === undefined ? null : safePrimitive(fallback, tokenId, diagnostics, path)
  }
  const token = tokens[tokenId]
  if (token === undefined) {
    diagnostic(diagnostics, 'token-not-found', `El token ${tokenId} no existe.`, path, fallback === undefined ? 'error' : 'warning')
    return fallback === undefined ? null : safePrimitive(fallback, tokenId, diagnostics, path)
  }
  if (isTokenReference(token)) {
    return resolveToken(token.$token, token.fallback ?? fallback, tokens, diagnostics, path, [...stack, tokenId])
  }
  return safePrimitive(token, tokenId, diagnostics, path)
}

function resolveStyleValue(
  value: unknown,
  property: string,
  tokens: StyleTokenMap,
  diagnostics: StyleEngineDiagnostic[],
  path: readonly string[],
): number | string | null {
  const resolved = isTokenReference(value)
    ? resolveToken(value.$token, value.fallback, tokens, diagnostics, path)
    : safePrimitive(value, property, diagnostics, path)
  if (typeof resolved === 'number' && !NUMERIC_STYLE_PROPERTIES.has(property)) {
    diagnostic(diagnostics, 'invalid-value', `${property} no admite un valor numérico.`, path)
    return null
  }
  return resolved
}

function declarationsFrom(
  input: unknown,
  tokens: StyleTokenMap,
  diagnostics: StyleEngineDiagnostic[],
  path: readonly string[],
): Record<string, number | string> {
  if (!isRecord(input)) {
    diagnostic(diagnostics, 'invalid-value', 'Las declaraciones deben ser un objeto JSON.', path)
    return {}
  }
  const declarations: Record<string, number | string> = {}
  for (const property of Object.keys(input).sort()) {
    if (!STYLE_PROPERTIES.has(property)) {
      diagnostic(diagnostics, 'invalid-property', `La propiedad CSS ${property} no está permitida.`, [...path, property])
      continue
    }
    const resolved = resolveStyleValue(input[property], property, tokens, diagnostics, [...path, property])
    if (resolved !== null) declarations[property] = resolved
  }
  return declarations
}

function classesFrom(input: unknown, diagnostics: StyleEngineDiagnostic[]): string[] {
  if (input === undefined) return []
  if (!Array.isArray(input)) {
    diagnostic(diagnostics, 'invalid-class', `${STYLE_CLASSES_KEY} debe ser una lista de clases.`, [STYLE_CLASSES_KEY])
    return []
  }
  const classes = new Set<string>()
  for (const [index, candidate] of input.entries()) {
    if (typeof candidate !== 'string' || !CLASS_NAME_PATTERN.test(candidate) || candidate.length > 80) {
      diagnostic(diagnostics, 'invalid-class', 'La clase contiene caracteres no permitidos.', [STYLE_CLASSES_KEY, String(index)])
      continue
    }
    classes.add(candidate)
  }
  return [...classes].sort()
}

function statesFrom(
  input: unknown,
  tokens: StyleTokenMap,
  diagnostics: StyleEngineDiagnostic[],
): Partial<Record<CanonicalStyleState, Record<string, number | string>>> {
  if (input === undefined) return {}
  if (!isRecord(input)) {
    diagnostic(diagnostics, 'invalid-state', `${STYLE_STATES_KEY} debe ser un objeto de estados.`, [STYLE_STATES_KEY])
    return {}
  }
  const states: Partial<Record<CanonicalStyleState, Record<string, number | string>>> = {}
  for (const state of Object.keys(input).sort()) {
    if (!CANONICAL_STYLE_STATES.includes(state as CanonicalStyleState)) {
      diagnostic(diagnostics, 'invalid-state', `El estado ${state} no está permitido.`, [STYLE_STATES_KEY, state])
      continue
    }
    states[state as CanonicalStyleState] = declarationsFrom(input[state], tokens, diagnostics, [STYLE_STATES_KEY, state])
  }
  return states
}

function cssProperty(property: string): string {
  return property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

function cssValue(property: string, value: number | string): string {
  if (typeof value === 'string') return value
  return value === 0 || UNITLESS_PROPERTIES.has(property) ? String(value) : `${value}px`
}

function serializeDeclarations(declarations: Readonly<Record<string, number | string>>): string {
  return Object.keys(declarations).sort().map((property) => `${cssProperty(property)}:${cssValue(property, declarations[property])}`).join(';')
}

function safeScopeId(input: string | undefined, diagnostics: StyleEngineDiagnostic[]): string {
  if (!input) return 'node'
  if (SCOPE_ID_PATTERN.test(input)) return input
  diagnostic(diagnostics, 'invalid-scope', 'El identificador de alcance CSS fue normalizado.', ['scopeId'], 'warning')
  const normalized = input.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 160)
  return normalized || 'node'
}

function baseStyleInput(styles: CanonicalStyleMap): Record<string, JsonValue> {
  return Object.fromEntries(Object.entries(styles).filter(([key]) => !key.startsWith('$')))
}

export function compileCanonicalStyles(
  styles: CanonicalStyleMap,
  options: CompileCanonicalStylesOptions = {},
): CompiledCanonicalStyles {
  const diagnostics: StyleEngineDiagnostic[] = []
  const tokens = { ...CORE_STYLE_TOKENS, ...(options.tokens ?? {}) }
  const inherited = options.inheritedStyles
    ? declarationsFrom(baseStyleInput(options.inheritedStyles), tokens, diagnostics, ['inherited'])
    : {}
  const inheritedDeclarations = Object.fromEntries(Object.entries(inherited).filter(([property]) => INHERITED_STYLE_PROPERTIES.has(property)))
  const localDeclarations = declarationsFrom(baseStyleInput(styles), tokens, diagnostics, ['styles'])
  const declarations: Record<string, number | string> = { ...inheritedDeclarations, ...localDeclarations, boxSizing: 'border-box' }
  if (typeof declarations.width === 'number') declarations.maxWidth = '100%'

  for (const key of Object.keys(styles).filter((key) => key.startsWith('$') && key !== STYLE_CLASSES_KEY && key !== STYLE_STATES_KEY)) {
    diagnostic(diagnostics, 'invalid-property', `La extensión de estilo ${key} no está permitida.`, [key])
  }

  const classes = classesFrom(styles[STYLE_CLASSES_KEY], diagnostics)
  const states = statesFrom(styles[STYLE_STATES_KEY], tokens, diagnostics)
  const scopeId = safeScopeId(options.scopeId, diagnostics)
  const selector = `[data-style-scope="${scopeId}"]`
  const baseRule = `${selector}{${serializeDeclarations(declarations)}}`
  const stateRules = CANONICAL_STYLE_STATES.flatMap((state) => {
    const stateDeclarations = states[state]
    if (!stateDeclarations || Object.keys(stateDeclarations).length === 0) return []
    const serialized = serializeDeclarations(stateDeclarations)
    return STATE_SELECTORS[state].map((suffix) => `${selector}${suffix}{${serialized}}`)
  })
  return {
    className: classes.join(' '),
    classes,
    cssText: [baseRule, ...stateRules].join(''),
    declarations,
    diagnostics,
    scopeId,
    stateCssText: stateRules.join(''),
    states,
  }
}

export function validateCanonicalStyles(
  styles: CanonicalStyleMap,
  options: Omit<CompileCanonicalStylesOptions, 'scopeId'> = {},
): Result<CanonicalStyleMap, readonly StyleEngineDiagnostic[]> {
  const compiled = compileCanonicalStyles(styles, options)
  const errors = compiled.diagnostics.filter((item) => item.severity === 'error')
  return errors.length > 0 ? failure(errors) : success(structuredClone(styles))
}

export function editableVisualStyles(styles: CanonicalStyleMap): CanonicalStyleMap {
  const protectedKeys = new Set<string>(CANONICAL_GEOMETRY_STYLE_KEYS)
  return Object.fromEntries(Object.entries(styles).filter(([key]) => !protectedKeys.has(key)))
}

export function mergeEditableVisualStyles(
  current: CanonicalStyleMap,
  editable: CanonicalStyleMap,
): CanonicalStyleMap {
  const protectedKeys = new Set<string>(CANONICAL_GEOMETRY_STYLE_KEYS)
  return {
    ...Object.fromEntries(Object.entries(current).filter(([key]) => protectedKeys.has(key))),
    ...structuredClone(editable),
  }
}
