import type { Device, Status } from './types'

export type SortKey = 'name' | 'latency' | 'status'
export interface Filters { q: string; status: Status | 'all'; type: string }
const SEVERITY: Record<Status, number> = { down: 3, degraded: 2, up: 1 }

export const avg = (v: number[]) => (v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0)

export function p95(v: number[]) {
  if (!v.length) return 0
  const s = [...v].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]
}

export function summarize(d: Device[]) {
  const count = (s: Status) => d.filter((x) => x.status === s).length
  return { total: d.length, up: count('up'), degraded: count('degraded'), down: count('down'),
    healthPct: d.length ? Math.round((100 * count('up')) / d.length) : 0 }
}

export function filterDevices(d: Device[], f: Filters) {
  const q = f.q.trim().toLowerCase()
  return d.filter((x) => (f.status === 'all' || x.status === f.status) && (f.type === 'all' || x.type === f.type) &&
    (!q || [x.name, x.site, x.ip].some((t) => t.toLowerCase().includes(q))))
}

export function sortDevices(d: Device[], key: SortKey, dir: 'asc' | 'desc') {
  const val = (x: Device) => (key === 'name' ? x.name : key === 'latency' ? avg(x.latency) : SEVERITY[x.status])
  const out = [...d].sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0))
  return dir === 'asc' ? out : out.reverse()
}
