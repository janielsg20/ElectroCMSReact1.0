export interface Renderer<TModel, TContext, TOutput> {
  render(model: TModel, context: TContext): TOutput
}
