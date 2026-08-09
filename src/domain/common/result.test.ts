import { failure, mapResult, success } from './result'

describe('Result', () => {
  it('transforma únicamente los resultados correctos', () => {
    expect(mapResult(success(2), (value) => value * 3)).toEqual({ ok: true, value: 6 })
    expect(mapResult(failure('invalid'), (value: number) => value * 3)).toEqual({
      ok: false,
      error: 'invalid',
    })
  })
})
