import type { FieldDefinition, JsonValue } from '../../domain'
import { Button, ChoiceField, HelpTip, Icon, TextField } from '../primitives'

type ConditionGroups = FieldDefinition['conditions']
type ConditionGroup = ConditionGroups[number]
type Condition = ConditionGroup['conditions'][number]
type ConditionOperator = Condition['operator']

interface FieldConditionEditorProps {
  readonly fields: readonly FieldDefinition[]
  readonly label?: string
  readonly onChange: (conditions: ConditionGroups) => void
  readonly value: ConditionGroups
}

const operatorOptions: readonly { readonly label: string; readonly value: ConditionOperator }[] = [
  { label: 'Es igual a', value: 'equals' },
  { label: 'No es igual a', value: 'not-equals' },
  { label: 'Contiene', value: 'contains' },
  { label: 'Es mayor que', value: 'greater-than' },
  { label: 'Es menor que', value: 'less-than' },
  { label: 'Tiene un valor', value: 'exists' },
]

function defaultValue(field: FieldDefinition | undefined): JsonValue {
  if (!field) return ''
  if (field.type === 'number' || field.type === 'currency') return 0
  if (field.type === 'switch') return true
  if ((field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && field.options[0]) return field.options[0].value
  return ''
}

function valueAsText(value: JsonValue): string {
  if (value === null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return JSON.stringify(value)
}

function textValue(field: FieldDefinition | undefined, value: string): JsonValue {
  if (!field) return value
  if (field.type === 'number' || field.type === 'currency') {
    const number = Number(value)
    return Number.isFinite(number) ? number : value
  }
  if (field.type === 'switch') return value === 'true'
  return value
}

function conditionWithField(condition: Condition, field: FieldDefinition): Condition {
  return { ...condition, fieldId: field.id, value: defaultValue(field) }
}

export function FieldConditionEditor({ fields, label = 'Cuándo mostrarlo', onChange, value }: FieldConditionEditorProps) {
  const sortedFields = [...fields].sort((left, right) => left.order - right.order || left.label.localeCompare(right.label, 'es'))
  const fieldOptions = sortedFields.map((field) => ({ label: field.label, value: field.id }))

  function updateGroup(groupIndex: number, group: ConditionGroup): void {
    onChange(value.map((current, index) => index === groupIndex ? group : current))
  }

  function updateCondition(groupIndex: number, conditionIndex: number, condition: Condition): void {
    const group = value[groupIndex]
    if (!group) return
    updateGroup(groupIndex, {
      ...group,
      conditions: group.conditions.map((current, index) => index === conditionIndex ? condition : current),
    })
  }

  function addGroup(): void {
    const field = sortedFields[0]
    if (!field) return
    onChange([...value, {
      conditions: [{ fieldId: field.id, operator: 'equals', value: defaultValue(field) }],
      operator: 'all',
    }])
  }

  function addCondition(groupIndex: number): void {
    const group = value[groupIndex]
    const field = sortedFields[0]
    if (!group || !field) return
    updateGroup(groupIndex, {
      ...group,
      conditions: [...group.conditions, { fieldId: field.id, operator: 'equals', value: defaultValue(field) }],
    })
  }

  function removeCondition(groupIndex: number, conditionIndex: number): void {
    const group = value[groupIndex]
    if (!group) return
    const conditions = group.conditions.filter((_, index) => index !== conditionIndex)
    if (conditions.length === 0) {
      onChange(value.filter((_, index) => index !== groupIndex))
      return
    }
    updateGroup(groupIndex, { ...group, conditions })
  }

  return (
    <section aria-label={label} className="grid gap-2 rounded-md border border-border bg-muted/15 p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <strong className="text-xs text-foreground">{label}</strong>
            <HelpTip
              description="Crea reglas visuales basadas en otros campos. Dentro de un grupo puedes exigir todas las reglas o aceptar cualquiera; varios grupos funcionan como alternativas."
              example="Mostrar Empresa cuando Tipo de cliente sea Empresa."
              label="Lógica condicional"
              reference="ACF — Conditional Logic · JetEngine — Conditional Logic"
            />
          </div>
          <p className="text-[0.625rem] leading-4 text-muted-foreground">Sin reglas, el campo se muestra siempre.</p>
        </div>
        <Button disabled={sortedFields.length === 0} onClick={addGroup} size="small" variant="secondary"><Icon name="plus" size={12} />Grupo</Button>
      </div>

      {sortedFields.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-surface p-2 text-xs text-muted-foreground">No hay otros campos disponibles para crear una condición.</p>
      ) : null}

      {value.map((group, groupIndex) => (
        <fieldset className="grid gap-2 rounded-md border border-border bg-surface p-2" key={`condition-group-${groupIndex}`}>
          <legend className="px-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">Grupo {groupIndex + 1}</legend>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,12rem)_1fr_auto] sm:items-end">
            <ChoiceField
              label="Cumplir"
              onChange={(next) => updateGroup(groupIndex, { ...group, operator: next === 'any' ? 'any' : 'all' })}
              options={[
                { label: 'Todas las reglas', value: 'all' },
                { label: 'Cualquiera de las reglas', value: 'any' },
              ]}
              value={group.operator}
            />
            <p className="min-h-11 rounded-md border border-border bg-muted/20 px-2 py-2 text-[0.625rem] leading-4 text-muted-foreground lg:min-h-8 lg:py-1.5">{group.operator === 'all' ? 'Este grupo se cumple cuando todas sus reglas coinciden.' : 'Este grupo se cumple cuando al menos una regla coincide.'}</p>
            <Button aria-label={`Eliminar grupo ${groupIndex + 1}`} onClick={() => onChange(value.filter((_, index) => index !== groupIndex))} size="icon" variant="ghost"><Icon name="close" size={13} /></Button>
          </div>

          <div className="grid gap-1.5">
            {group.conditions.map((condition, conditionIndex) => {
              const field = sortedFields.find((candidate) => candidate.id === condition.fieldId)
              const usesOptions = field && (field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && field.options.length > 0
              return (
                <div className="grid gap-1.5 rounded-md border border-border/80 bg-muted/10 p-1.5 md:grid-cols-[minmax(9rem,1fr)_minmax(9rem,0.8fr)_minmax(9rem,1fr)_auto] md:items-end" key={`${condition.fieldId}-${conditionIndex}`}>
                  <ChoiceField
                    label="Campo"
                    onChange={(fieldId) => {
                      const nextField = sortedFields.find((candidate) => candidate.id === fieldId)
                      if (nextField) updateCondition(groupIndex, conditionIndex, conditionWithField(condition, nextField))
                    }}
                    options={fieldOptions}
                    value={condition.fieldId}
                  />
                  <ChoiceField
                    label="Condición"
                    onChange={(operator) => updateCondition(groupIndex, conditionIndex, { ...condition, operator: operator as ConditionOperator, value: operator === 'exists' ? null : condition.value })}
                    options={operatorOptions}
                    value={condition.operator}
                  />
                  {condition.operator === 'exists' ? (
                    <div className="grid min-h-11 place-items-center rounded-md border border-dashed border-border px-2 text-xs text-muted-foreground lg:min-h-8">No necesita valor</div>
                  ) : usesOptions && field ? (
                    <ChoiceField
                      label="Valor"
                      onChange={(next) => {
                        const option = field.options.find((candidate) => valueAsText(candidate.value) === next)
                        updateCondition(groupIndex, conditionIndex, { ...condition, value: option?.value ?? next })
                      }}
                      options={field.options.map((option) => ({ label: option.label, value: valueAsText(option.value) }))}
                      value={valueAsText(condition.value)}
                    />
                  ) : field?.type === 'switch' ? (
                    <ChoiceField
                      label="Valor"
                      onChange={(next) => updateCondition(groupIndex, conditionIndex, { ...condition, value: next === 'true' })}
                      options={[{ label: 'Activado', value: 'true' }, { label: 'Desactivado', value: 'false' }]}
                      value={valueAsText(condition.value)}
                    />
                  ) : (
                    <TextField
                      inputMode={field?.type === 'number' || field?.type === 'currency' ? 'decimal' : 'text'}
                      label="Valor"
                      onChange={(event) => updateCondition(groupIndex, conditionIndex, { ...condition, value: textValue(field, event.target.value) })}
                      type={field?.type === 'number' || field?.type === 'currency' ? 'number' : 'text'}
                      value={valueAsText(condition.value)}
                    />
                  )}
                  <Button aria-label={`Eliminar regla ${conditionIndex + 1} del grupo ${groupIndex + 1}`} onClick={() => removeCondition(groupIndex, conditionIndex)} size="icon" variant="ghost"><Icon name="close" size={13} /></Button>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end"><Button onClick={() => addCondition(groupIndex)} size="small" variant="ghost"><Icon name="plus" size={12} />Añadir regla</Button></div>
        </fieldset>
      ))}
    </section>
  )
}
