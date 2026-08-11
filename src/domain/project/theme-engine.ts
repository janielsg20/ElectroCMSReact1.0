import { failure, success, type Result } from '../common/result'
import type { JsonValue } from './project-envelope'
import { ProjectStructureSchema, type ProjectStructure } from './structure-schema'
import {
  DEFAULT_BACKEND_THEME,
  DEFAULT_FRONTEND_THEME,
  ProjectThemeSchema,
  type ProjectTheme,
  type ProjectThemeScope,
  type SemanticThemeTokens,
  type ThemeScope,
} from './theme-schema'

export interface ThemeDiagnostic {
  readonly code: 'editor-scope-is-local' | 'invalid-project-theme'
  readonly message: string
  readonly path: readonly string[]
}

export type ThemePersistence = 'local-editor-preference' | 'canonical-project'

export function themePersistence(scope: ThemeScope): ThemePersistence {
  return scope === 'editor' ? 'local-editor-preference' : 'canonical-project'
}

export function defaultProjectTheme(scope: ProjectThemeScope): ProjectTheme {
  return structuredClone(scope === 'frontend' ? DEFAULT_FRONTEND_THEME : DEFAULT_BACKEND_THEME)
}

export function setProjectTheme(
  structure: ProjectStructure,
  scope: ProjectThemeScope,
  input: unknown,
): Result<ProjectStructure, readonly ThemeDiagnostic[]> {
  const parsed = ProjectThemeSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((issue) => ({
      code: 'invalid-project-theme' as const,
      message: issue.message,
      path: ['themes', scope, ...issue.path.map(String)],
    })))
  }
  const next = ProjectStructureSchema.safeParse({
    ...structure,
    themes: {
      ...structure.themes,
      [scope]: parsed.data,
    },
  })
  if (!next.success) {
    return failure(next.error.issues.map((issue) => ({
      code: 'invalid-project-theme' as const,
      message: issue.message,
      path: issue.path.map(String),
    })))
  }
  return success(next.data)
}

export function resetProjectTheme(
  structure: ProjectStructure,
  scope: ProjectThemeScope,
): Result<ProjectStructure, readonly ThemeDiagnostic[]> {
  return setProjectTheme(structure, scope, defaultProjectTheme(scope))
}

export function compileThemeStyleTokens(tokens: SemanticThemeTokens): Readonly<Record<string, JsonValue>> {
  return Object.freeze({
    'color.background': tokens.color.background,
    'color.border': tokens.color.border,
    'color.danger': tokens.color.danger,
    'color.focus': tokens.color.focus,
    'color.muted': tokens.color.muted,
    'color.on-primary': tokens.color.onPrimary,
    'color.primary': tokens.color.primary,
    'color.surface': tokens.color.surface,
    'color.text': tokens.color.text,
    'control.height': tokens.spacing.controlHeight,
    'density.scale': tokens.density.scale,
    'duration.fast': `${tokens.motion.fast}ms`,
    'duration.normal': `${tokens.motion.normal}ms`,
    'duration.slow': `${tokens.motion.slow}ms`,
    'font.body': tokens.typography.bodyFamily,
    'font.heading': tokens.typography.headingFamily,
    'font.line-height': tokens.typography.lineHeight,
    'font.scale': tokens.typography.scaleRatio,
    'font.size.base': tokens.typography.baseSize,
    'motion.easing': tokens.motion.easing,
    'radius.full': tokens.radius.full,
    'radius.lg': tokens.radius.large,
    'radius.md': tokens.radius.medium,
    'radius.sm': tokens.radius.small,
    'shadow.lg': tokens.shadow.large,
    'shadow.md': tokens.shadow.medium,
    'shadow.sm': tokens.shadow.small,
    'spacing.gap': tokens.spacing.gap,
    'spacing.section': tokens.spacing.section,
    'spacing.unit': tokens.spacing.unit,
  })
}
