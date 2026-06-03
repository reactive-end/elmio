import { normalizePhoneToR4 } from './phone'

describe('normalizePhoneToR4', () => {
  it('quita +58 y antepone 0 (+58XXXXXXXXXX -> 0XXXXXXXXXX)', () => {
    expect(normalizePhoneToR4('+584247413675')).toBe('04247413675')
  })

  it('quita 58 sin el simbolo + (58XXXXXXXXXX -> 0XXXXXXXXXX)', () => {
    expect(normalizePhoneToR4('584247413675')).toBe('04247413675')
  })

  it('conserva 11 digitos con cero inicial', () => {
    expect(normalizePhoneToR4('04141234567')).toBe('04141234567')
  })

  it('antepone 0 cuando recibe 10 digitos', () => {
    expect(normalizePhoneToR4('4141234567')).toBe('04141234567')
  })

  it('tolera separadores en el formato con prefijo', () => {
    expect(normalizePhoneToR4('+58 424-741-3675')).toBe('04247413675')
  })

  it('funciona con otros prefijos de pais (+549 -> 13 digitos -> ultimos 10 + 0)', () => {
    expect(normalizePhoneToR4('+5491145551234')).toBe('01145551234')
  })

  it('devuelve string vacio para null/undefined/vacio', () => {
    expect(normalizePhoneToR4(null)).toBe('')
    expect(normalizePhoneToR4(undefined)).toBe('')
    expect(normalizePhoneToR4('')).toBe('')
  })

  it('devuelve string vacio cuando no hay digitos', () => {
    expect(normalizePhoneToR4('abc-()')).toBe('')
  })
})
