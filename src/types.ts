export type Status = 'up' | 'degraded' | 'down'
export type DeviceType = 'router' | 'switch' | 'firewall' | 'access point'
export interface Device {
  id: string
  name: string
  type: DeviceType
  site: string
  ip: string
  status: Status
  cpu: number
  latency: number[]
}
