import type { Device, DeviceType, Status } from './types'

const SITES = ['Bengaluru', 'Hyderabad', 'Chennai', 'Pune']
const TYPES: DeviceType[] = ['router', 'switch', 'firewall', 'access point']
const PREFIX: Record<DeviceType, string> = { router: 'rt', switch: 'sw', firewall: 'fw', 'access point': 'ap' }

// Deterministic generator so the demo and the tests always see the same fleet.
export function makeDevices(count = 24): Device[] {
  let seed = 42
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296
  return Array.from({ length: count }, (_, i) => {
    const type = TYPES[i % 4]
    const status: Status = i % 11 === 3 ? 'down' : i % 5 === 2 ? 'degraded' : 'up'
    const base = status === 'up' ? 12 + rnd() * 18 : status === 'degraded' ? 60 + rnd() * 50 : 180 + rnd() * 60
    return {
      id: `dev-${i + 1}`,
      name: `${PREFIX[type]}-${SITES[i % 4].slice(0, 3).toLowerCase()}-${String(i + 1).padStart(2, '0')}`,
      type, site: SITES[i % 4], ip: `10.${i % 4}.${i}.${10 + i}`, status,
      cpu: Math.round(20 + rnd() * 70),
      latency: Array.from({ length: 12 }, () => Math.round(base + (rnd() - 0.5) * base * 0.4)),
    }
  })
}
