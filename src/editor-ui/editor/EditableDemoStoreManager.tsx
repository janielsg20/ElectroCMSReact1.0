import { useState } from 'react'
import { editableDemoStore } from '../../domain'
import { Button, ChoiceField, HelpTip, Icon, TextField } from '../primitives'
import { useEditorProject, useEditorProjectStructure } from './editor-project-context'

export function EditableDemoStoreManager() {
  const session = useEditorProject()
  const structure = useEditorProjectStructure()
  const store = editableDemoStore(structure)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('Estos datos se comparten entre el editor, la vista previa y la administración.')
  const [metricOrder, setMetricOrder] = useState(store.dashboard.metricOrder.join(','))
  const [visibleMetrics, setVisibleMetrics] = useState(store.dashboard.visibleMetrics)

  function text(values: FormData, name: string): string {
    const value = values.get(name)
    return typeof value === 'string' ? value : ''
  }

  async function save(form: HTMLFormElement): Promise<void> {
    if (!session.updateEditableDemoStore || pending) return
    const values = new FormData(form)
    setPending(true)
    const result = await session.updateEditableDemoStore({
      colors: { primary: text(values, 'primary'), surface: text(values, 'surface') },
      dashboard: {
        metricOrder: metricOrder.split(',') as typeof store.dashboard.metricOrder,
        visibleMetrics,
      },
      featuredProduct: { callToAction: text(values, 'cta'), mediaUrl: text(values, 'mediaUrl'), name: text(values, 'productName'), price: text(values, 'price'), stock: Number(text(values, 'stock')) },
      identity: { claim: text(values, 'claim'), contact: text(values, 'contact'), logoUrl: text(values, 'logoUrl'), name: text(values, 'name') },
    })
    setPending(false)
    setMessage(result.ok ? 'Tienda demo actualizada. El mismo estado ya está disponible en todos los espacios de trabajo.' : result.error)
  }

  return <section aria-labelledby="editable-demo-store-title" className="grid gap-3 p-3 lg:p-4">
    <div className="flex items-start gap-2"><span className="grid size-11 shrink-0 place-items-center rounded-md bg-primary-soft text-primary lg:size-9"><Icon name="content" size={16} /></span><div className="min-w-0 flex-1"><h2 className="text-sm font-bold text-foreground" id="editable-demo-store-title">Tienda demo</h2><p className="mt-0.5 text-xs leading-5 text-muted-foreground">Edita una única tienda de ejemplo. Sus datos no se duplican al cambiar de espacio de trabajo.</p></div><HelpTip description="La identidad, el producto destacado y los indicadores del panel se guardan en el proyecto, no en una pantalla concreta." example="Cambia el nombre y el producto destacado; los mismos valores se usarán en la vista pública y en administración." label="Tienda demo compartida" reference="ElectroCMS — proyecto demo editable" /></div>
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); void save(event.currentTarget) }}>
      <fieldset className="grid gap-2 rounded-lg border border-border bg-muted/10 p-3"><legend className="px-1 text-xs font-bold">Identidad</legend><div className="grid gap-2 sm:grid-cols-2">{[['name', 'Nombre', store.identity.name], ['claim', 'Claim', store.identity.claim], ['contact', 'Contacto', store.identity.contact], ['logoUrl', 'Logo (URL o recurso)', store.identity.logoUrl]].map(([id, label, value]) => <TextField defaultValue={value} key={id} label={label} maxLength={4096} name={id} />)}</div></fieldset>
      <fieldset className="grid gap-2 rounded-lg border border-border bg-muted/10 p-3"><legend className="px-1 text-xs font-bold">Colores y producto destacado</legend><div className="grid gap-2 sm:grid-cols-2">{[['primary', 'Color principal', store.colors.primary], ['surface', 'Color de superficie', store.colors.surface], ['productName', 'Producto', store.featuredProduct.name], ['price', 'Precio', store.featuredProduct.price], ['mediaUrl', 'Imagen o recurso', store.featuredProduct.mediaUrl], ['cta', 'Texto del botón', store.featuredProduct.callToAction]].map(([id, label, value]) => <TextField defaultValue={value} key={id} label={label} maxLength={4096} name={id} />)}<TextField defaultValue={store.featuredProduct.stock} label="Unidades disponibles" min="0" name="stock" type="number" /></div></fieldset>
      <fieldset className="grid gap-2 rounded-lg border border-border bg-muted/10 p-3"><legend className="px-1 text-xs font-bold">Panel de administración</legend><ChoiceField label="Orden de indicadores" onChange={setMetricOrder} options={[{ label: 'Ventas, pedidos, inventario', value: 'sales,orders,stock' }, { label: 'Pedidos, ventas, inventario', value: 'orders,sales,stock' }, { label: 'Inventario, pedidos, ventas', value: 'stock,orders,sales' }]} value={metricOrder} /><div className="flex flex-wrap gap-2">{([['sales', 'Ventas'], ['orders', 'Pedidos'], ['stock', 'Inventario']] as const).map(([id, label]) => <button aria-pressed={visibleMetrics.includes(id)} className={`min-h-11 rounded-md border px-3 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-focus ${visibleMetrics.includes(id) ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border bg-surface'}`} key={id} onClick={() => setVisibleMetrics((current) => current.includes(id) ? current.filter((metric) => metric !== id) : [...current, id])} type="button">{label}</button>)}</div></fieldset>
      <div className="flex flex-wrap items-center justify-between gap-2"><p aria-live="polite" className="text-xs text-muted-foreground">{message}</p><Button disabled={pending} type="submit">{pending ? 'Guardando…' : 'Guardar tienda demo'}</Button></div>
    </form>
  </section>
}
