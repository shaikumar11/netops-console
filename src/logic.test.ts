import { describe, expect, it } from 'vitest'
import { makeDevices } from './data'
import { avg, filterDevices, p95, sortDevices, summarize } from './logic'

const d = makeDevices()
const all = { q: '', status: 'all' as const, type: 'all' }

describe('logic', () => {
  it('generates the same fleet every time', () => {
    expect(makeDevices()).toEqual(d)
    expect(d).toHaveLength(24)
  })
  it('summarises status counts and health percentage', () => {
    const s = summarize(d)
    expect(s.up + s.degraded + s.down).toBe(24)
    expect(s.healthPct).toBe(Math.round((100 * s.up) / 24))
    expect(summarize([]).healthPct).toBe(0)
  })
  it('filters by status, type and search text', () => {
    expect(filterDevices(d, { ...all, status: 'down' }).every((x) => x.status === 'down')).toBe(true)
    expect(filterDevices(d, { ...all, type: 'router' })).toHaveLength(6)
    expect(filterDevices(d, { ...all, q: 'HYD' }).every((x) => x.site === 'Hyderabad')).toBe(true)
    expect(filterDevices(d, { ...all, q: 'zzz' })).toHaveLength(0)
  })
  it('sorts by severity, name and latency in both directions', () => {
    expect(sortDevices(d, 'status', 'desc')[0].status).toBe('down')
    expect(sortDevices(d, 'name', 'asc')[0].name <= sortDevices(d, 'name', 'asc')[1].name).toBe(true)
    const lat = sortDevices(d, 'latency', 'desc')
    expect(avg(lat[0].latency)).toBeGreaterThanOrEqual(avg(lat[23].latency))
  })
  it('computes average and p95', () => {
    expect(avg([10, 20, 30])).toBe(20)
    expect(avg([])).toBe(0)
    expect(p95([1, 2, 3, 4, 5, 6, 7, 8, 9, 100])).toBe(100)
    expect(p95([])).toBe(0)
  })
})
